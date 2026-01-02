import requests
import os
from dotenv import load_dotenv
import json

load_dotenv()

api_key = os.getenv("TYPECAST_API_KEY")
if not api_key:
    # Try to find it in the file if env var not loaded
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("TYPECAST_API_KEY="):
                    api_key = line.strip().split("=")[1]
                    break
    except:
        pass

if not api_key or "YOUR_API_KEY" in api_key:
    print("Please set TYPECAST_API_KEY in .env or provide it manually")
    exit(1)

try:
    headers = {"x-api-key": api_key}
    print(f"Fetching voices from http://localhost:8000/voices with key ending in ...{api_key[-4:]}")
    response = requests.get("http://localhost:8000/voices", headers=headers)
    
    if response.status_code != 200:
        print(f"Error: {response.status_code} - {response.text}")
        exit(1)
        
    voices = response.json()
    print(f"Fetched {len(voices)} voices.")
    
    if voices:
        print("--- First Voice Object ---")
        print(json.dumps(voices[0], indent=2))
        print("------------------------")
    
    languages_found = set()
    sample_voices = []
    
    for v in voices:
        langs = v.get("languages", [])
        for l in langs:
            languages_found.add(l)
        
        # Capture first voice of each language for inspection
        if langs and langs[0] not in [s['lang'] for s in sample_voices]:
             sample_voices.append({"name": v['name'], "lang": langs[0], "id": v['voice_id']})

    print("\nUnique languages found:", languages_found)
    print("\nSample mapping:")
    for s in sample_voices:
        print(f"Name: {s['name']} -> Lang: {s['lang']}")
        
    # Check specifically for a known Korean voice if it exists in the raw dump we can't see, 
    # but we can check if 'Minsang' is in the list
    minsang = next((v for v in voices if "Minsang" in v['name']), None)
    if minsang:
        print(f"\nSpecific Check (Minsang): {minsang['name']} -> {minsang.get('languages')}")
    else:
        print("\n'Minsang' not found in voice list.")

except Exception as e:
    print(f"Failed to run debug: {e}")
