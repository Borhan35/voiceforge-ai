import requests
import json
import os

from dotenv import load_dotenv

load_dotenv()

API_URL = "http://localhost:8000/voices"
# Try to get API key from env or use a placeholder if testing auth
API_KEY = os.environ.get("TYPECAST_API_KEY", "test_key") 

def check_voices():
    try:
        response = requests.get(API_URL, headers={"x-api-key": API_KEY})
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            return

        voices = response.json()
        print(f"Received {len(voices)} voices.")
        
        if not voices:
            return

        # Check first voice structure
        v = voices[0]
        print("Sample Voice Structure:")
        print(json.dumps(v, indent=2))
        
        # Check language fields
        missing_native = [v['voice_id'] for v in voices if 'native_language' not in v]
        missing_langs = [v['voice_id'] for v in voices if 'languages' not in v or not v['languages']]
        
        print(f"Voices missing native_language: {len(missing_native)}")
        print(f"Voices missing languages list: {len(missing_langs)}")
        
        # Check standard languages
        if 'languages' in v:
            print(f"Languages in sample: {v['languages']}")

    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    check_voices()
