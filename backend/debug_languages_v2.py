import requests
import json

API_URL = "http://localhost:8000/voices"
API_KEY = "__pltCafyBrAaJ4793wBA2MTCzw9C6fvTSZbn7SYbDaMg"

def check_languages():
    try:
        response = requests.get(API_URL, headers={"x-api-key": API_KEY})
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            return

        voices = response.json()
        print(f"Received {len(voices)} voices.")
        
        all_langs = set()
        for v in voices:
            if not isinstance(v, dict):
                continue

            if 'languages' in v and v['languages']:
                for l in v['languages']:
                    all_langs.add(l)
            
            if 'native_language' in v:
                all_langs.add(v['native_language'])

        print(f"Unique Languages Found ({len(all_langs)}):")
        print(sorted(list(all_langs)))

    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    check_languages()
