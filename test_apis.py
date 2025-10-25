import requests
import time
import json

# Wait a moment for the server to be ready
time.sleep(2)

# Test the new API endpoints
base_url = 'http://127.0.0.1:5000'

endpoints = [
    '/api/agmarknet',
    '/api/commodityonline',
    '/api/ncdex',
    '/api/datagovin',
    '/api/all_sources'
]

print("Testing Real-Time Data API Endpoints")
print("=" * 50)

for endpoint in endpoints:
    try:
        print(f"\nTesting {endpoint}:")
        response = requests.get(f'{base_url}{endpoint}', timeout=10)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, dict):
                    if 'error' in data:
                        print(f"Error Response: {data['error']}")
                    else:
                        print(f"Success! Response contains {len(data)} keys")
                        # Show sample data
                        for key, value in list(data.items())[:3]:
                            if isinstance(value, dict) and 'prices' in value:
                                prices_count = len(value.get('prices', {}))
                                print(f"  {key}: {prices_count} price entries")
                            else:
                                print(f"  {key}: {type(value).__name__}")
                else:
                    print(f"Response: {data}")
            except json.JSONDecodeError:
                print(f"Non-JSON response: {response.text[:200]}...")
        else:
            print(f"Failed: {response.text[:100]}")

    except requests.exceptions.RequestException as e:
        print(f"Connection Error: {e}")
    except Exception as e:
        print(f"Unexpected Error: {e}")

print("\n" + "=" * 50)
print("API endpoint testing completed!")