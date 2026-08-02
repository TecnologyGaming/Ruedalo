"""Quick test to verify rides routes are responding correctly"""
import requests
import os

BASE = "https://ruedalo-login.preview.emergentagent.com"
API = f"{BASE}/api"

# Test credentials from test_credentials.md
PASSENGER = ("pasajero@rideve.com", "Demo1234!")

def login(email, pwd):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": pwd}, timeout=20)
    if r.status_code != 200:
        print(f"❌ Login failed: {r.status_code} {r.text}")
        return None
    return r.json()["access_token"]

def test_rides_routes():
    print("Testing Rides Routes...")
    print("=" * 60)
    
    # 1. Test health endpoint
    print("\n1. Testing health endpoint...")
    r = requests.get(f"{API}/", timeout=10)
    if r.status_code == 200:
        print(f"✅ Health check: {r.json()}")
    else:
        print(f"❌ Health check failed: {r.status_code}")
        return
    
    # 2. Login as passenger
    print("\n2. Logging in as passenger...")
    token = login(*PASSENGER)
    if not token:
        return
    print("✅ Login successful")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Test rides estimate endpoint
    print("\n3. Testing rides estimate endpoint...")
    r = requests.post(f"{API}/rides/estimate", headers=headers, json={
        "origin_lat": 10.4998, "origin_lng": -66.8517,
        "dest_lat": 10.5200, "dest_lng": -66.8200,
    }, timeout=10)
    if r.status_code == 200:
        data = r.json()
        print(f"✅ Estimate endpoint working")
        print(f"   - Distance: {data.get('distance_km')} km")
        print(f"   - Duration: {data.get('duration_min')} min")
        print(f"   - Price: ${data.get('price_usd')}")
        print(f"   - Tiers available: {list(data.get('rates', {}).keys())}")
    else:
        print(f"❌ Estimate failed: {r.status_code} {r.text}")
        return
    
    # 4. Test my rides endpoint
    print("\n4. Testing my rides endpoint...")
    r = requests.get(f"{API}/rides/mine", headers=headers, timeout=10)
    if r.status_code == 200:
        rides = r.json()
        print(f"✅ My rides endpoint working (found {len(rides)} rides)")
    else:
        print(f"❌ My rides failed: {r.status_code} {r.text}")
        return
    
    # 5. Test active ride endpoint
    print("\n5. Testing active ride endpoint...")
    r = requests.get(f"{API}/rides/active", headers=headers, timeout=10)
    if r.status_code == 200:
        active = r.json()
        if active:
            print(f"✅ Active ride endpoint working (active ride: {active.get('id')})")
        else:
            print(f"✅ Active ride endpoint working (no active ride)")
    else:
        print(f"❌ Active ride failed: {r.status_code} {r.text}")
        return
    
    # 6. Test get ride with non-existent ID (should return 404)
    print("\n6. Testing get ride with non-existent ID...")
    r = requests.get(f"{API}/rides/demo-ride-123", headers=headers, timeout=10)
    if r.status_code == 404:
        print(f"✅ Get ride endpoint working correctly (404 for non-existent ride)")
    else:
        print(f"⚠️  Unexpected response: {r.status_code} {r.text}")
    
    print("\n" + "=" * 60)
    print("✅ All rides routes are responding correctly!")

if __name__ == "__main__":
    test_rides_routes()
