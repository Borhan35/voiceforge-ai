
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("TYPECAST_API_KEY")

def inspect_voice_structure():
    if not API_KEY:
        print("API Key not found")
        return

    url = "https://typecast.ai/api/v1/voices"
    try:
        # Try both direct URL and the one used in code if different
        res = requests.get(url, headers={"Authorization": f"Bearer {API_KEY}"})
        if res.status_code != 200:
             # Try the other auth header format or endpoint seen in service
             res = requests.get(url, headers={"x-api-key": API_KEY})
        
        if res.status_code == 200:
            voices = res.json()
            if voices:
                print("Found", len(voices), "voices.")
                print("--- First Voice Full Structure ---")
                print(json.dumps(voices[0], indent=2))
                
                # Check for unique keys across a sample
                keys = set()
                for v in voices[:50]:
                    keys.update(v.keys())
                print("\n--- All unique keys found in first 50 voices ---")
                print(sorted(list(keys)))
            else:
                print("No voices returned")
        else:
            print(f"Error: {res.status_code} {res.text}")

    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    inspect_voice_structure()
