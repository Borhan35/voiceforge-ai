import os
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("TYPECAST_API_KEY")

def list_models():
    if not API_KEY:
        print("API Key not found")
        return

    resp = requests.get("https://api.typecast.ai/v1/voices", headers={"X-API-KEY": API_KEY})
    if resp.status_code != 200:
        print(f"Error: {resp.status_code} {resp.text}")
        return

    voices = resp.json()
    models = set()
    for v in voices:
        # Check where model info is stored. It might be in 'model' or 'spec' or similar.
        # Let's verify the structure of one voice first
        if 'model' in v:
             models.add(v['model'])
        
    print("Available Models:", models)
    print("Total voices:", len(voices))
    if voices:
        print("Sample voice structure:", voices[0].keys())
        print("Sample voice emotions:", voices[0]['emotions'])

if __name__ == "__main__":
    list_models()
