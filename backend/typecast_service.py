import os
import asyncio
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
        try:
            client = self._get_client(api_key)
            
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
            
            
            response = client.text_to_speech(TTSRequest(
                text=text,
                model=model,
                voice_id=voice_id,
                prompt=prompt,
                output=output_config
            ))
            
            return response.audio_data, response.duration
            
        except TypecastError as e:
            print(f"Error generating speech: {e}")
            raise
