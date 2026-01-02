
import requests
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("TYPECAST_API_KEY")
BASE_URL = "http://localhost:8000"

def debug_request():
    print(f"Testing against {BASE_URL}")
    
    headers = {"x-api-key": API_KEY}
    
    # 1. Get a voice
    try:
        resp = requests.get(f"{BASE_URL}/voices", headers=headers)
        if resp.status_code != 200:
            print(f"Failed to get voices: {resp.text}")
            return
        voices = resp.json()
        voice_id = voices[0]['voice_id']
        print(f"Using voice: {voice_id}")
    except Exception as e:
        print(f"Connection error: {e}")
        return

    # 2. Simulate Smart Emotion Request
    payload = {
        "text": "I am so happy and excited!",
        "voice_id": voice_id,
        "auto_emotion": True,
        "emotion_preset": "normal",
        "emotion_intensity": 1.0,
        "speed": 1.0,
        "pitch": 0,
        "model": "ssfm-v21"
    }
    
    print("\nSending Payload:", payload)
    
    resp = requests.post(f"{BASE_URL}/generate", json=payload, headers=headers)
    
    print(f"\nStatus Code: {resp.status_code}")
    print(f"Response Body: {resp.text}")

if __name__ == "__main__":
    debug_request()
