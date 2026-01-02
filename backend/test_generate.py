import requests
import json
import os
import base64
from dotenv import load_dotenv

load_dotenv()

API_URL = "http://localhost:8000/generate"
API_KEY = os.environ.get("TYPECAST_API_KEY")

def test_generation():
    if not API_KEY:
        print("Error: TYPECAST_API_KEY not found in environment.")
        return

    # 1. First get a valid voice ID (using a known one or fetching list)
    # We will use a known one if possible, or fetch. Let's fetch to be safe.
    voices_url = "http://localhost:8000/voices"
    try:
        print("Fetching voices to get a valid ID...")
        v_resp = requests.get(voices_url, headers={"x-api-key": API_KEY})
        if v_resp.status_code != 200:
             print(f"Error fetching voices: {v_resp.text}")
             return
        
        voices = v_resp.json()
        if not voices:
            print("No voices found.")
            return
            
        test_voice_id = voices[0]['voice_id']
        print(f"Using Voice ID: {test_voice_id}")

        # 2. Generate Audio
        payload = {
            "text": "Hello, this is a test of the Voice Forge generation system.",
            "voice_id": test_voice_id,
            "emotion_preset": "normal",
            "speed": 1.0
        }
        
        print(f"Sending generation request for: '{payload['text']}'")
        response = requests.post(API_URL, json=payload, headers={"x-api-key": API_KEY})
        
        if response.status_code != 200:
            print(f"Generation Error: {response.status_code} - {response.text}")
            return

        result = response.json()
        audio_b64 = result.get("audio_base64")
        duration = result.get("duration")
        
        if not audio_b64:
            print("Error: No audio data received.")
            return

        # 3. Save to file
        audio_bytes = base64.b64decode(audio_b64)
        output_file = "d:/VoiceForge AI/backend/test_output.wav"
        with open(output_file, "wb") as f:
            f.write(audio_bytes)
            
        print(f"Success! Audio generated ({duration}s) and saved to {output_file}")
        print(f"File size: {len(audio_bytes)} bytes")

    except Exception as e:
        print(f"Test failed with exception: {e}")

if __name__ == "__main__":
    test_generation()
