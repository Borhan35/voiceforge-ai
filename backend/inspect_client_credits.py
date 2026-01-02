import os
from dotenv import load_dotenv
from typecast.client import Typecast

load_dotenv()
api_key = os.getenv("TYPECAST_API_KEY")

if not api_key:
    print("No API key found")
    exit(1)

client = Typecast(api_key=api_key)

print("Client attributes/methods:")
for attr in dir(client):
    if not attr.startswith("_"):
        print(attr)

# Check if there is a 'get_user' or 'get_balance' or similar
try:
    # Try common endpoints if methods aren't obvious
    response = client.session.get(f"{client.host}/v1/users/me") 
    print(f"\n/v1/users/me response status: {response.status_code}")
    if response.status_code == 200:
        print(response.json())
except Exception as e:
    print(f"Error checking /me: {e}")

try:
    response = client.session.get(f"{client.host}/v1/usage")
    print(f"\n/v1/usage response status: {response.status_code}")
    if response.status_code == 200:
        print(response.json())
except Exception as e:
    print(f"Error checking /usage: {e}")
