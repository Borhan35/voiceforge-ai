
import os
from dotenv import load_dotenv
from typecast_service import TypecastService

load_dotenv()
API_KEY = os.getenv("TYPECAST_API_KEY")

def test_native_auto_emotion():
    print("Testing Native Auto Emotion via Service...")
    service = TypecastService()
    
    # 1. Get a voice
    try:
        voices = service.get_voices(API_KEY)
        if not voices:
            print("No voices found.")
            return
        voice = voices[0]
        voice_id = voice['voice_id']
        print(f"Using Voice: {voice.get('name')} ({voice_id})")
    except Exception as e:
        print(f"Failed to get voices: {e}")
        return

    text = "I am so incredibly angry right now!"
    


    text = "I am absolutely furious! This is completely unacceptable and I hate it!"

    # Test 0: Control (normal)
    size_normal = 0
    try:
        print("\n--- Test 0: emotion_preset='normal' ---")
        audio, duration = service.generate_speech(
            api_key=API_KEY,
            text=text,
            voice_id=voice_id,
            emotion_preset="normal"
        )
        size_normal = len(audio)
        print(f"Success! Size: {size_normal}, Duration: {duration}")
    except Exception as e:
        print(f"Failed with 'normal': {e}")

    # Test 2: emotion_preset=None AND model="ssfm-v21"
    size_none = 0
    try:
        print("\n--- Test 2: emotion_preset=None, model='ssfm-v21' ---")
        audio, duration = service.generate_speech(
            api_key=API_KEY,
            text=text,
            voice_id=voice_id,
            emotion_preset=None,
            model="ssfm-v21"
        )
        size_none = len(audio)
        print(f"Success! Size: {size_none}, Duration: {duration}")
    except Exception as e:
        print(f"Failed with None+ssfm-v21: {e}")



    if size_normal > 0 and size_none > 0:
        diff = abs(size_normal - size_none)
        print(f"\nDifference in size: {diff} bytes")
        if diff == 0:
            print("Conclusion: 'None' works exactly like 'normal'.")
        else:
            print("Conclusion: 'None' produces DIFFERENT output than 'normal'. Potentially Smart Emotion?")



if __name__ == "__main__":
    test_native_auto_emotion()
