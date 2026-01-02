import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("TYPECAST_API_KEY")
API_URL = "http://localhost:8000/generate"

def test_smart_emotion():
    if not API_KEY:
        print("API Key not found")
        return

    # 1. Get a voice
    voices_url = "http://localhost:8000/voices?api_key=" + API_KEY
    # The service expects api_key header or query? 
    # Let's check typecast_service.py or main.py. 
    # Actually test_generate.py used header 'x-api-key'.
    
    # We will just hardcode the first voice we found known to work or just fetch
    # Requesting voices to get ID
    v_resp = requests.get("https://api.typecast.ai/v1/voices", headers={"X-API-KEY": API_KEY})
    if v_resp.status_code != 200:
        print("Error fetching voices")
        return
    voice_id = v_resp.json()[0]['voice_id']
    print(f"Using voice: {voice_id}")

    text = "Detailed explanation of the universe and its mysteries requires a tone of wonder and curiosity."

    # 2. Generate with 'normal'
    print("Generating with normal...")
    payload_normal = {
        "text": text,
        "voice_id": voice_id,
        "emotion_preset": "normal",
        "speed": 1.0
    }
    resp_normal = requests.post(API_URL, json=payload_normal, headers={"x-api-key": API_KEY})
    if resp_normal.status_code != 200:
        print(f"Normal failed: {resp_normal.text}")
        return
    data_normal = resp_normal.json().get("audio_base64")
    
    # 3. Generate with None (Smart Emotion?)
    # NOTE: The backend might default to 'normal' if we omit it or send None.
    # We need to check how backend handles it.
    # If backend signature is emotion_preset: str = "normal", sending None might fail validation or become None.
    # Let's try sending explicit null
    print("Generating with None (Smart Emotion?)...")
    payload_smart = {
        "text": text,
        "voice_id": voice_id,
        "emotion_preset": None,
        "speed": 1.0
    }
    resp_smart = requests.post(API_URL, json=payload_smart, headers={"x-api-key": API_KEY})
    
    if resp_smart.status_code != 200:
        print(f"Smart failed: {resp_smart.status_code} {resp_smart.text}")
        # Depending on backend Pydantic validation, None might be rejected for str field.
    else:
        data_smart = resp_smart.json().get("audio_base64")
        
        if data_normal and data_smart:
            print(f"Normal size: {len(data_normal)}")
            print(f"Smart size:  {len(data_smart)}")
            if len(data_normal) != len(data_smart):
                print("DIFFERENCE DETECTED! 'None' produces different audio.")
            else:
                print("No size difference detected.")

if __name__ == "__main__":
    test_smart_emotion()
