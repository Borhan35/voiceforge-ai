from typecast.client import Typecast
import inspect

print("--- Typecast.text_to_speech Source ---")
try:
    print(inspect.getsource(Typecast.__init__))
    print(inspect.getsource(Typecast.text_to_speech))
except Exception as e:
    print(f"Error getting source: {e}")
