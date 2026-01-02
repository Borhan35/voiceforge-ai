import requests
import json
import os
import base64
from dotenv import load_dotenv

load_dotenv()

API_URL = "http://localhost:8000/generate"
API_KEY = os.environ.get("TYPECAST_API_KEY")

def generate_and_save(filename, text, auto_emotion=False):
    if not API_KEY:
        print("Error: TYPECAST_API_KEY not found.")
        return

    # Use a default voice (Male, English compatible if possible, or just the first available)
    # Re-using logic to get a voice ID efficiently
    try:
        v_resp = requests.get("http://localhost:8000/voices", headers={"x-api-key": API_KEY})
        voices = v_resp.json()
        if not voices:
             print("No voices found.")
             return
        voice_id = voices[0]['voice_id'] # Use the first available voice
    except Exception as e:
        print(f"Error fetching voices: {e}")
        return

    payload = {
        "text": text,
        "voice_id": voice_id,
        "emotion_preset": "normal",
        "speed": 1.0,
        "auto_emotion": auto_emotion
    }
    
    print(f"\n--- Generating: {filename} ---")
    print(f"Text: '{text}'")
    print(f"Auto Emotion: {auto_emotion}")

    try:
        response = requests.post(API_URL, json=payload, headers={"x-api-key": API_KEY})
        
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            return

        result = response.json()
        
        if "detected_emotion" in result:
            print(f"Detected Emotion: {result['detected_emotion']['detected_emotion']} (Confidence: {result['detected_emotion']['confidence']})")
        
        audio_b64 = result.get("audio_base64")
        if audio_b64:
            audio_bytes = base64.b64decode(audio_b64)
            save_path = os.path.join("d:/VoiceForge AI/backend", filename)
            with open(save_path, "wb") as f:
                f.write(audio_bytes)
            print(f"Saved to {save_path} (Size: {len(audio_bytes)} bytes)")
        else:
            print("No audio data received.")

    except Exception as e:
        print(f"Request failed: {e}")

def run_tests():
    # 1. Test Pause Handling
    # Use standard SSML break notation or text notation that users might try
    # The user issue was "reading out the pause markers".
    # If they type "(1.0s)", we want to see if it reads it.
    generate_and_save("test_pause.wav", "Hello, this is a pause test. (1.0s) Did it pause?")

    # 2. Test Happy Emotion
    generate_and_save("test_happy.wav", "I am so happy today! This is wonderful! I love this!", auto_emotion=True)

    # 3. Test Sad Emotion
    generate_and_save("test_sad.wav", "I am very sad and depressed. Nothing is going right.", auto_emotion=True)

if __name__ == "__main__":
    run_tests()
