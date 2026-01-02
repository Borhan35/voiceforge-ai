import os
import json
from dotenv import load_dotenv
import sys

# Add current directory to sys.path to ensure we can import typecast_service
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from typecast_service import TypecastService

load_dotenv()
api_key = os.getenv("TYPECAST_API_KEY")

if not api_key:
    # Try reading from .env manually if load_dotenv fails or file not found by default
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
    print("Fetching voices...")
    # direct call to service
    voices = service.get_voices(api_key)
    
    print(f"Total voices: {len(voices)}")
    if len(voices) > 0:
        print("First voice keys:", voices[0].keys())
        print("First voice raw:", json.dumps(voices[0], indent=2))
        
        # Check for language fields in a few voices
        print("\nChecking language fields in first 5 voices:")
        for v in voices[:5]:
            print(f"Name: {v.get('name', v.get('voice_name'))}")
            print(f"  Language: {v.get('language')}")
            print(f"  Lang: {v.get('lang')}")
            print(f"  Locale: {v.get('locale')}")
            print(f"  Country: {v.get('country')}")
            print("-" * 20)
            
        # Collect all unique values for potential language fields
        langs = set()
        locales = set()
        others = set()
        for v in voices:
            if v.get('language'): langs.add(v.get('language'))
            if v.get('locale'): locales.add(v.get('locale'))
            
        print("\nUnique 'language' values:", langs)
        print("Unique 'locale' values:", locales)
        
except Exception as e:
    print(f"Error: {e}")
