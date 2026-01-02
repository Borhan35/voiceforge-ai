
import inspect
import typecast.client

print("=== typecast.client.Typecast source ===")
try:
    print(inspect.getsource(typecast.client.Typecast))
except Exception as e:
    print(e)
