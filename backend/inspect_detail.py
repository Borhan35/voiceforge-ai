import os
import json
from dotenv import load_dotenv
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from typecast_service import TypecastService

load_dotenv()
api_key = os.getenv("TYPECAST_API_KEY")

if not api_key:
    # Try reading from .env manually
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("TYPECAST_API_KEY="):
                    api_key = line.strip().split("=")[1]
                    break
    except:
        pass

service = TypecastService()
try:
    print("Fetching voices list first...")
    voices = service.get_voices(api_key)
    
    if len(voices) > 0:
        first_voice_id = voices[0]['voice_id']
        print(f"Fetching details for voice ID: {first_voice_id}")
        
        detail = service.get_voice_detail(api_key, first_voice_id)
        
        if isinstance(detail, list):
             print(f"Detail is a LIST of {len(detail)} items.")
             if len(detail) > 0:
                 print("First item keys:", detail[0].keys())
                 print("First item raw:", json.dumps(detail[0], indent=2))
                 print(f"\nLanguage: {detail[0].get('language')}")
        else:
            print("Voice Detail keys:", detail.keys())
            print("Voice Detail raw:", json.dumps(detail, indent=2))
        
except Exception as e:
    print(f"Error: {e}")
