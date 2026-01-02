import os
import json
from dotenv import load_dotenv
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from typecast_service import TypecastService

load_dotenv()
api_key = os.getenv("TYPECAST_API_KEY")

if not api_key:
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("TYPECAST_API_KEY="):
                    api_key = line.strip().split("=")[1]
                    break
    except:
        pass

if not api_key:
    print("API Key not found")
    exit(1)

service = TypecastService()
try:
    # Get first voice detail
    voices = service.get_voices(api_key)
    if len(voices) > 0:
        first_id = voices[0]['voice_id']
        print(f"Fetching detail for voice: {first_id}")
        detail = service.get_voice_detail(api_key, first_id)
        print("Voice Detail Keys:", detail.keys() if isinstance(detail, dict) else "Not a dict")
        print(json.dumps(detail, indent=2))
except Exception as e:
    print(f"Error: {e}")
