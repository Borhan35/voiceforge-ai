import os
import asyncio
import io
import struct
import re
from typecast.client import Typecast
from typecast.models import TTSRequest, Output, LanguageCode, Prompt
from typecast.exceptions import TypecastError

class TypecastService:
    def _get_client(self, api_key: str):
        if not api_key:
            raise ValueError("API Key is required")
        return Typecast(api_key=api_key)

    def get_voices(self, api_key: str, model: str = None):
        """List available voices, optionally filtered by model."""
        try:
            client = self._get_client(api_key)
            endpoint = "/v1/voices"
            params = {}
            if model:
                params["model"] = model
            
            # Direct API access to bypass library model validation
            response = client.session.get(f"{client.host}{endpoint}", params=params)
            response.raise_for_status()
            return response.json()

        except Exception as e:
            print(f"Error fetching voices: {e}")
            raise

    def get_voice_detail(self, api_key: str, voice_id: str):
        """Fetch single voice details raw JSON."""
        client = self._get_client(api_key)
        endpoint = f"/v1/voices/{voice_id}"
        response = client.session.get(f"{client.host}{endpoint}")
        return response.json()

    def _split_text(self, text: str, max_chars: int = 1500) -> list[str]:
        """Split text into chunks ensuring no chunk exceeds max_chars."""
        if len(text) <= max_chars:
            return [text]
            
        chunks = []
        current_chunk = ""
        
        # Split by sentence endings (.!?) followed by space
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        for sentence in sentences:
            # Handle extremely long single sentences (fallback split)
            if len(sentence) > max_chars:
                # If current chunk is not empty, push it
                if current_chunk:
                    chunks.append(current_chunk)
                    current_chunk = ""
                
                # Split long sentence by comma or space
                parts = re.split(r'(?<=[,])\s+', sentence)
                for part in parts:
                    if len(current_chunk) + len(part) + 1 <= max_chars:
                        if current_chunk:
                            current_chunk += " " + part
                        else:
                            current_chunk = part
                    else:
                        if current_chunk:
                            chunks.append(current_chunk)
                        current_chunk = part
                        # If still too big, hard cut (unlikely but safe fallback)
                        while len(current_chunk) > max_chars:
                            chunks.append(current_chunk[:max_chars])
                            current_chunk = current_chunk[max_chars:]
                continue

            if len(current_chunk) + len(sentence) + 1 <= max_chars:
                if current_chunk:
                    current_chunk += " " + sentence
                else:
                    current_chunk = sentence
            else:
                chunks.append(current_chunk)
                current_chunk = sentence
                
        if current_chunk:
            chunks.append(current_chunk)
            
        return chunks

    def _combine_wav_audio(self, audio_segments: list[bytes]) -> bytes:
        """Combine multiple WAV byte segments into a single WAV."""
        if not audio_segments:
            return b""
        if len(audio_segments) == 1:
            return audio_segments[0]
            
        # Take the header from the first segment (44 bytes standard)
        try:
            header = bytearray(audio_segments[0][:44])
            combined_data = bytearray()
            
            for segment in audio_segments:
                # Assume 44 byte header for all, skip header
                if len(segment) > 44:
                    combined_data.extend(segment[44:])
            
            # Update ChunkSize (Total file size - 8) at offset 4
            total_size = 36 + len(combined_data)
            header[4:8] = struct.pack('<I', total_size)
            
            # Update Subchunk2Size (Data size) at offset 40
            header[40:44] = struct.pack('<I', len(combined_data))
            
            return bytes(header) + bytes(combined_data)
        except Exception as e:
            print(f"Error combining WAV segments: {e}")
            # Fallback: return first segment or empty
            return audio_segments[0] if audio_segments else b""

    def generate_speech(self, api_key: str, text: str, voice_id: str, emotion_preset: str = None, 
                        emotion_intensity: float = 1.0, speed: float = 1.0, 
                        pitch: int = 0, tempo: float = 1.0, model: str = "ssfm-v21",
                        volume: int = 100, audio_format: str = "wav", seed: int = None):
        """Generate speech from text with full parameter control.
        
        Args:
            volume: Audio volume (0-200, default 100)
            audio_format: Output format ("wav" or "mp3")
            seed: Random seed for reproducibility
        """
        import concurrent.futures

        try:
            # client = self._get_client(api_key) # Do not share client across threads
            
            chunks = self._split_text(text)
            print(f"Processing text in {len(chunks)} chunks (Total length: {len(text)})")
            
            # Prepare segments array to preserve order
            audio_segments = [None] * len(chunks)
            total_duration = 0.0
            
            prompt = Prompt(
                emotion_preset=emotion_preset,
                emotion_intensity=emotion_intensity
            )
            
            output_config = Output(
                audio_pitch=pitch,
                audio_tempo=speed,
                audio_format=audio_format,
                volume=volume
            )
            
            # Helper function for parallel execution
            def process_chunk(index, chunk):
                print(f"Generating chunk {index+1}/{len(chunks)} (len: {len(chunk)})")
                try:
                    # Instantiate a NEW client for each thread/request to ensure thread safety
                    # The Typecast client might not be thread-safe regarding requests session
                    local_client = self._get_client(api_key)
                    
                    res = local_client.text_to_speech(TTSRequest(
                        text=chunk,
                        model=model,
                        voice_id=voice_id,
                        prompt=prompt,
                        output=output_config
                    ))
                    return index, res.audio_data, float(res.duration)
                except Exception as e:
                    print(f"Error generating chunk {index+1}: {e}")
                    raise

            # Execute similarly to Promise.all in JS
            # Reduced max_workers to 3 to be safer against rate limits and server load
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                # Submit all tasks
                future_to_chunk = {executor.submit(process_chunk, i, chunk): i for i, chunk in enumerate(chunks)}
                
                for future in concurrent.futures.as_completed(future_to_chunk):
                    try:
                        idx, data, duration = future.result()
                        audio_segments[idx] = data
                        total_duration += duration
                    except Exception as e:
                         # If one chunk fails, likely all will fail or the result is invalid
                        raise e

            if len(audio_segments) == 1:
                return audio_segments[0], total_duration
            
            # Only support WAV combining for now
            if audio_format.lower() == "wav":
                combined_audio = self._combine_wav_audio(audio_segments)
                return combined_audio, total_duration
            else:
                # Handle MP3 simplistic concatenation (usually works)
                combined = b"".join(audio_segments)
                return combined, total_duration
            
        except TypecastError as e:
            print(f"Error generating speech: {e}")
            raise
