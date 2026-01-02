import requests
import json
import os

API_URL = "http://localhost:8000/voices"
API_KEY = "test_key" # The backend might accept this or fall back to env 

def check_languages():
    try:
        response = requests.get(API_URL, headers={"x-api-key": API_KEY})
        voices = response.json()
        
        all_langs = set()
        for v in voices:
            if 'languages' in v and v['languages']:
                for l in v['languages']:
                    all_langs.add(l)
            
            # Also check native_language
            if 'native_language' in v:
                all_langs.add(v['native_language'])

        print(f"Unique Languages Found ({len(all_langs)}):")
        print(sorted(list(all_langs)))
        
        # Check specific suspect voices
        print("\nChecking generic 'Japanese' or 'ja' occurrences:")
        for v in voices:
            langs = v.get('languages', [])
            if 'Japanese' in langs or 'japanese' in langs:
                 print(f"Voice {v.get('name')} has 'Japanese' in languages: {langs}")
            if 'ja' in langs:
                 # Just print one example to confirm 'ja' exists
                 pass

    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    import os
    # Ensure usage of the key found previously or rely on backend env
    os.environ["TYPECAST_API_KEY"] = "__pltCafyBrAaJ4793wBA2MTCzw9C6fvTSZbn7SYbDaMg" 
    check_languages()
