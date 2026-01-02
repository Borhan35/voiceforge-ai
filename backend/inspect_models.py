from typecast.models import Prompt, TTSRequest, Output
import inspect

print("--- Prompt Fields ---")
print(inspect.signature(Prompt))
try:
    print(Prompt.__annotations__)
except:
    pass

print("\n--- TTSRequest Fields ---")
print(inspect.signature(TTSRequest))
try:
    print(TTSRequest.__annotations__)
except:
    pass

print("\n--- Output Fields ---")
print(inspect.signature(Output))
try:
    print(Output.__annotations__)
except:
    pass
