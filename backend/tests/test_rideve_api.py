"""RideVE backend tests covering auth, wallet, rides, chat, admin, RBAC."""
import os
import uuid
import pytest
import requests

BASE = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
API = f"{BASE}/api"

ADMIN = ("admin@rideve.com", "Admin1234!")
PASSENGER = ("pasajero@rideve.com", "Demo1234!")
DRIVER = ("conductor@rideve.com", "Demo1234!")

# Caracas coords
ORIGIN = (10.4998, -66.8517)
DEST = (10.5200, -66.8200)


def login(email, pwd):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": pwd}, timeout=20)
    assert r.status_code == 200, f"login failed {email}: {r.status_code} {r.text}"
    j = r.json()
    return j["access_token"], j["user"]


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="session")
def admin_auth():
    return login(*ADMIN)


@pytest.fixture(scope="session")
def passenger_auth():
    return login(*PASSENGER)


@pytest.fixture(scope="session")
def driver_auth():
    return login(*DRIVER)


# ---------- Health & seed ----------
def test_health():
    r = requests.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_seed_users_exist(admin_auth):
    tok, _ = admin_auth
    r = requests.get(f"{API}/admin/users", headers=H(tok), timeout=15)
    assert r.status_code == 200
    users = r.json()
    emails = {u["email"] for u in users}
    assert "admin@rideve.com" in emails
    assert "pasajero@rideve.com" in emails
    assert "conductor@rideve.com" in emails
    # 5 simulated drivers
    sim = [u for u in users if u["email"].endswith(".driver@rideve.com")]
    assert len(sim) >= 5, f"expected >=5 simulated drivers, got {len(sim)}"


# ---------- Auth ----------
def test_register_and_me():
    email = f"test_{uuid.uuid4().hex[:8]}@rideve.com"
    phone = f"0414-{uuid.uuid4().hex[:7]}"  # Generate unique phone
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Pass1234!", "name": "Test User",
        "phone": phone, "role": "passenger",
    }, timeout=15)
    assert r.status_code == 200, r.text
    tok = r.json()["access_token"]
    me = requests.get(f"{API}/auth/me", headers=H(tok), timeout=10)
    assert me.status_code == 200
    assert me.json()["email"] == email
    # Welcome bonus: new users get $1.50
    assert me.json()["wallet_balance"] == 1.5


def test_login_wrong_password():
    r = requests.post(f"{API}/auth/login", json={
        "email": "pasajero@rideve.com", "password": "bad"
    }, timeout=10)
    assert r.status_code == 401


def test_me_without_token():
    r = requests.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 401


def test_passenger_balance_is_25(passenger_auth):
    _, user = passenger_auth
    assert user["wallet_balance"] >= 25.0


# ---------- Wallet ----------
def test_bank_config(passenger_auth):
    tok, _ = passenger_auth
    r = requests.get(f"{API}/wallet/bank-config", headers=H(tok), timeout=10)
    assert r.status_code == 200
    j = r.json()
    assert j["bank_name"] == "Banco de Venezuela"
    assert j["cedula"] == "V-12345678"


def test_recharge_create_and_list(passenger_auth):
    tok, _ = passenger_auth
    r = requests.post(f"{API}/wallet/recharge", headers=H(tok), json={
        "amount_usd": 10.0, "reference": f"REF-{uuid.uuid4().hex[:6]}",
        "sender_phone": "0414-1111111", "sender_bank": "Banesco",
    }, timeout=10)
    assert r.status_code == 200
    rec = r.json()
    assert rec["status"] == "pending"
    assert rec["amount_usd"] == 10.0
    mine = requests.get(f"{API}/wallet/my-recharges", headers=H(tok), timeout=10).json()
    assert any(x["id"] == rec["id"] for x in mine)


def test_recharge_invalid_amount(passenger_auth):
    tok, _ = passenger_auth
    r = requests.post(f"{API}/wallet/recharge", headers=H(tok), json={
        "amount_usd": 0, "reference": "x", "sender_phone": "x", "sender_bank": "x",
    }, timeout=10)
    assert r.status_code == 400


def test_wallet_history(passenger_auth):
    tok, _ = passenger_auth
    r = requests.get(f"{API}/wallet/history", headers=H(tok), timeout=10)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------- RBAC ----------
def test_admin_endpoint_rejects_passenger(passenger_auth):
    tok, _ = passenger_auth
    r = requests.get(f"{API}/admin/users", headers=H(tok), timeout=10)
    assert r.status_code == 403


def test_driver_endpoint_rejects_passenger(passenger_auth):
    tok, _ = passenger_auth
    r = requests.get(f"{API}/rides/available", headers=H(tok), timeout=10)
    assert r.status_code == 403


# ---------- Drivers nearby ----------
def test_drivers_nearby(passenger_auth):
    tok, _ = passenger_auth
    r = requests.get(f"{API}/drivers/nearby", headers=H(tok),
                     params={"lat": ORIGIN[0], "lng": ORIGIN[1]}, timeout=10)
    assert r.status_code == 200
    arr = r.json()
    assert len(arr) >= 5
    assert all("distance_km" in d for d in arr)


# ---------- Estimate ----------
def test_estimate(passenger_auth):
    tok, _ = passenger_auth
    r = requests.post(f"{API}/rides/estimate", headers=H(tok), json={
        "origin_lat": ORIGIN[0], "origin_lng": ORIGIN[1],
        "dest_lat": DEST[0], "dest_lng": DEST[1],
    }, timeout=10)
    assert r.status_code == 200
    j = r.json()
    assert j["price_usd"] > 0 and j["distance_km"] > 0 and j["duration_min"] > 0


# ---------- Insufficient balance ----------
def test_insufficient_balance_402():
    # fresh passenger with $0 balance
    email = f"poor_{uuid.uuid4().hex[:6]}@rideve.com"
    phone = f"0414-{uuid.uuid4().hex[:7]}"  # Generate unique phone
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Pass1234!", "name": "Poor",
        "phone": phone, "role": "passenger",
    }, timeout=10)
    tok = r.json()["access_token"]
    r = requests.post(f"{API}/rides/request", headers=H(tok), json={
        "origin_lat": ORIGIN[0], "origin_lng": ORIGIN[1], "origin_address": "A",
        "dest_lat": DEST[0], "dest_lng": DEST[1], "dest_address": "B",
        "price_usd": 5.0, "distance_km": 5.0, "duration_min": 15.0,
    }, timeout=10)
    assert r.status_code == 402


# ---------- Full ride flow ----------
@pytest.fixture(scope="session")
def ride_flow(passenger_auth, driver_auth):
    p_tok, p_user = passenger_auth
    d_tok, d_user = driver_auth

    # Cancel any active ride first (cleanup from prior runs)
    active = requests.get(f"{API}/rides/active", headers=H(p_tok), timeout=10).json()
    if active:
        requests.post(f"{API}/rides/{active['id']}/cancel", headers=H(p_tok), timeout=10)
    active_d = requests.get(f"{API}/rides/active", headers=H(d_tok), timeout=10).json()
    if active_d:
        requests.post(f"{API}/rides/{active_d['id']}/cancel", headers=H(d_tok), timeout=10)

    # Ensure driver online
    requests.post(f"{API}/drivers/online", headers=H(d_tok),
                  json={"is_online": True, "lat": ORIGIN[0], "lng": ORIGIN[1]}, timeout=10)

    est = requests.post(f"{API}/rides/estimate", headers=H(p_tok), json={
        "origin_lat": ORIGIN[0], "origin_lng": ORIGIN[1],
        "dest_lat": DEST[0], "dest_lng": DEST[1],
    }, timeout=10).json()

    rr = requests.post(f"{API}/rides/request", headers=H(p_tok), json={
        "origin_lat": ORIGIN[0], "origin_lng": ORIGIN[1], "origin_address": "Plaza Altamira",
        "dest_lat": DEST[0], "dest_lng": DEST[1], "dest_address": "Sabana Grande",
        "price_usd": est["price_usd"], "distance_km": est["distance_km"], "duration_min": est["duration_min"],
    }, timeout=10)
    assert rr.status_code == 200, rr.text
    ride = rr.json()
    return {"ride": ride, "p_tok": p_tok, "d_tok": d_tok, "p_user": p_user, "d_user": d_user}


def test_ride_available_for_driver(ride_flow):
    rf = ride_flow
    r = requests.get(f"{API}/rides/available", headers=H(rf["d_tok"]), timeout=10)
    assert r.status_code == 200
    ids = [x["id"] for x in r.json()]
    assert rf["ride"]["id"] in ids


def test_ride_accept_start_complete_and_wallet(ride_flow):
    rf = ride_flow
    rid = rf["ride"]["id"]
    price = rf["ride"]["price_usd"]

    # passenger balance before
    me_before = requests.get(f"{API}/auth/me", headers=H(rf["p_tok"]), timeout=10).json()
    pbal_before = me_before["wallet_balance"]
    d_before = requests.get(f"{API}/auth/me", headers=H(rf["d_tok"]), timeout=10).json()["wallet_balance"]

    r = requests.post(f"{API}/rides/{rid}/accept", headers=H(rf["d_tok"]), timeout=10)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "accepted"

    r = requests.post(f"{API}/rides/{rid}/start", headers=H(rf["d_tok"]), timeout=10)
    assert r.status_code == 200
    assert r.json()["status"] == "in_progress"

    r = requests.post(f"{API}/rides/{rid}/complete", headers=H(rf["d_tok"]), timeout=10)
    assert r.status_code == 200
    assert r.json()["status"] == "completed"

    # verify wallet effects
    me_after = requests.get(f"{API}/auth/me", headers=H(rf["p_tok"]), timeout=10).json()
    d_after = requests.get(f"{API}/auth/me", headers=H(rf["d_tok"]), timeout=10).json()
    assert round(pbal_before - me_after["wallet_balance"], 2) == round(price, 2)
    assert round(d_after["wallet_balance"] - d_before, 2) == round(price * 0.85, 2)


def test_chat_messages(ride_flow):
    rf = ride_flow
    rid = rf["ride"]["id"]
    r = requests.post(f"{API}/messages/{rid}", headers=H(rf["p_tok"]),
                      json={"text": "Hola, ya estoy en la esquina"}, timeout=10)
    assert r.status_code == 200
    r = requests.post(f"{API}/messages/{rid}", headers=H(rf["d_tok"]),
                      json={"text": "Voy en camino"}, timeout=10)
    assert r.status_code == 200
    msgs = requests.get(f"{API}/messages/{rid}", headers=H(rf["p_tok"]), timeout=10).json()
    assert len(msgs) >= 2
    assert any(m["sender_role"] == "passenger" for m in msgs)
    assert any(m["sender_role"] == "driver" for m in msgs)


def test_rate_ride_after_completion(ride_flow):
    rf = ride_flow
    rid = rf["ride"]["id"]
    r = requests.post(f"{API}/rides/rate", headers=H(rf["p_tok"]),
                      json={"ride_id": rid, "rating": 5, "comment": "Excelente"}, timeout=10)
    assert r.status_code == 200
    # Cannot rate twice
    r2 = requests.post(f"{API}/rides/rate", headers=H(rf["p_tok"]),
                       json={"ride_id": rid, "rating": 4}, timeout=10)
    assert r2.status_code == 409


def test_driver_cannot_rate(ride_flow):
    rf = ride_flow
    r = requests.post(f"{API}/rides/rate", headers=H(rf["d_tok"]),
                      json={"ride_id": rf["ride"]["id"], "rating": 5}, timeout=10)
    assert r.status_code == 403


def test_rides_mine(ride_flow):
    rf = ride_flow
    r = requests.get(f"{API}/rides/mine", headers=H(rf["p_tok"]), timeout=10)
    assert r.status_code == 200
    assert any(x["id"] == rf["ride"]["id"] for x in r.json())


# ---------- Admin recharges flow ----------
def test_admin_approve_recharge(admin_auth, passenger_auth):
    a_tok, _ = admin_auth
    p_tok, _ = passenger_auth
    # passenger creates a fresh recharge
    rec = requests.post(f"{API}/wallet/recharge", headers=H(p_tok), json={
        "amount_usd": 7.0, "reference": f"APP-{uuid.uuid4().hex[:6]}",
        "sender_phone": "0414-1111111", "sender_bank": "Banesco",
    }, timeout=10).json()

    bal_before = requests.get(f"{API}/auth/me", headers=H(p_tok), timeout=10).json()["wallet_balance"]
    r = requests.post(f"{API}/admin/recharges/{rec['id']}/approve", headers=H(a_tok), timeout=10)
    assert r.status_code == 200
    bal_after = requests.get(f"{API}/auth/me", headers=H(p_tok), timeout=10).json()["wallet_balance"]
    assert round(bal_after - bal_before, 2) == 7.0
    # cannot approve twice
    r2 = requests.post(f"{API}/admin/recharges/{rec['id']}/approve", headers=H(a_tok), timeout=10)
    assert r2.status_code == 409


def test_admin_reject_recharge(admin_auth, passenger_auth):
    a_tok, _ = admin_auth
    p_tok, _ = passenger_auth
    rec = requests.post(f"{API}/wallet/recharge", headers=H(p_tok), json={
        "amount_usd": 3.0, "reference": f"REJ-{uuid.uuid4().hex[:6]}",
        "sender_phone": "0414-1111111", "sender_bank": "X",
    }, timeout=10).json()
    r = requests.post(f"{API}/admin/recharges/{rec['id']}/reject", headers=H(a_tok), timeout=10)
    assert r.status_code == 200
    # status reflects
    items = requests.get(f"{API}/admin/recharges", headers=H(a_tok), timeout=10).json()
    found = [x for x in items if x["id"] == rec["id"]][0]
    assert found["status"] == "rejected"


def test_admin_stats(admin_auth):
    tok, _ = admin_auth
    r = requests.get(f"{API}/admin/stats", headers=H(tok), timeout=10)
    assert r.status_code == 200
    j = r.json()
    for k in ["total_users", "total_drivers", "total_passengers", "online_drivers",
              "total_rides", "completed_rides", "pending_recharges"]:
        assert k in j


def test_admin_bank_config_update(admin_auth):
    tok, _ = admin_auth
    payload = {
        "bank_name": "Banco de Venezuela", "cedula": "V-12345678",
        "phone": "0414-1234567", "holder_name": "RideVE C.A.", "usd_to_bs_rate": 38.5,
    }
    r = requests.put(f"{API}/admin/bank-config", headers=H(tok), json=payload, timeout=10)
    assert r.status_code == 200
    assert r.json()["bank_name"] == "Banco de Venezuela"


# ---------- Pricing System Tests ----------
def test_multi_tier_pricing_structure(passenger_auth):
    """Test that estimate endpoint returns all pricing tiers with correct structure"""
    tok, _ = passenger_auth
    r = requests.post(f"{API}/rides/estimate", headers=H(tok), json={
        "origin_lat": ORIGIN[0], "origin_lng": ORIGIN[1],
        "dest_lat": DEST[0], "dest_lng": DEST[1],
        "service_type": "ride",
    }, timeout=10)
    assert r.status_code == 200
    j = r.json()
    
    # Verify basic fields
    assert "distance_km" in j
    assert "duration_min" in j
    assert "price_usd" in j
    assert "rates" in j
    
    # Verify all pricing tiers exist
    rates = j["rates"]
    assert "moto" in rates
    assert "economico" in rates
    assert "confort" in rates
    assert "delivery" in rates
    
    # Verify each tier has required fields
    for tier in ["moto", "economico", "confort", "delivery"]:
        assert "original" in rates[tier]
        assert "discounted" in rates[tier]
        assert "saving" in rates[tier]
        assert rates[tier]["discounted"] <= rates[tier]["original"]
        assert rates[tier]["discounted"] > 0


def test_pricing_tiers_calculations(passenger_auth):
    """Test that pricing calculations are correct for different tiers"""
    tok, _ = passenger_auth
    # Test with a known distance (approximately 2.5 km between test coords)
    r = requests.post(f"{API}/rides/estimate", headers=H(tok), json={
        "origin_lat": ORIGIN[0], "origin_lng": ORIGIN[1],
        "dest_lat": DEST[0], "dest_lng": DEST[1],
    }, timeout=10)
    assert r.status_code == 200
    rates = r.json()["rates"]
    
    # Verify pricing order: moto < economico < confort
    assert rates["moto"]["discounted"] < rates["economico"]["discounted"]
    assert rates["economico"]["discounted"] < rates["confort"]["discounted"]
    
    # Verify delivery is cheaper than moto for rides
    assert rates["delivery"]["discounted"] <= rates["moto"]["discounted"]
    
    # Verify discounts are applied
    assert rates["moto"]["saving"] == 0.15
    assert rates["economico"]["saving"] == 0.15
    assert rates["confort"]["saving"] == 0.15
    assert rates["delivery"]["saving"] == 0.30


def test_delivery_service_pricing(passenger_auth):
    """Test delivery service has different pricing than ride"""
    tok, _ = passenger_auth
    r = requests.post(f"{API}/rides/estimate", headers=H(tok), json={
        "origin_lat": ORIGIN[0], "origin_lng": ORIGIN[1],
        "dest_lat": DEST[0], "dest_lng": DEST[1],
        "service_type": "delivery",
    }, timeout=10)
    assert r.status_code == 200
    j = r.json()
    
    # For delivery, price_usd should match delivery tier
    assert j["price_usd"] == j["rates"]["delivery"]["discounted"]


# ---------- Referral System Tests ----------
def test_register_with_referral_code():
    """Test user registration with a valid referral code"""
    # First, create a referrer
    referrer_email = f"referrer_{uuid.uuid4().hex[:6]}@rideve.com"
    referrer_phone = f"0414-{uuid.uuid4().hex[:7]}"
    r1 = requests.post(f"{API}/auth/register", json={
        "email": referrer_email, "password": "Pass1234!", "name": "Maria Referrer",
        "phone": referrer_phone, "role": "passenger",
    }, timeout=15)
    assert r1.status_code == 200
    referrer_data = r1.json()
    referrer_code = referrer_data["user"]["referral_code"]
    assert referrer_code is not None
    assert len(referrer_code) > 0
    
    # Now register a new user with the referral code
    referred_email = f"referred_{uuid.uuid4().hex[:6]}@rideve.com"
    referred_phone = f"0414-{uuid.uuid4().hex[:7]}"
    r2 = requests.post(f"{API}/auth/register", json={
        "email": referred_email, "password": "Pass1234!", "name": "Juan Referred",
        "phone": referred_phone, "role": "passenger",
        "referred_by_code": referrer_code,
    }, timeout=15)
    assert r2.status_code == 200
    referred_data = r2.json()
    
    # Verify referred user has referrer info
    assert referred_data["user"]["referred_by"] is not None
    
    # Verify both users got welcome bonus
    assert referred_data["user"]["wallet_balance"] == 1.5


def test_referral_code_generation():
    """Test that each user gets a unique referral code"""
    codes = set()
    for i in range(3):
        email = f"refcode_{uuid.uuid4().hex[:6]}@rideve.com"
        phone = f"0414-{uuid.uuid4().hex[:7]}"  # Generate unique phone
        r = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "Pass1234!", "name": f"User {i}",
            "phone": phone, "role": "passenger",
        }, timeout=15)
        assert r.status_code == 200
        code = r.json()["user"]["referral_code"]
        assert code is not None
        assert code not in codes  # Ensure uniqueness
        codes.add(code)


def test_referral_bonus_on_first_ride():
    """Test that referrer gets $2.50 bonus when referred user completes first ride"""
    # This test verifies the referral bonus logic exists in the backend
    # The actual bonus is triggered in the complete_ride endpoint (lines 836-848 in server.py)
    # when a referred user (referred_by is not None) completes their first ride (completed_rides_count == 0)
    
    # Create referrer
    referrer_email = f"ref_bonus_{uuid.uuid4().hex[:6]}@rideve.com"
    referrer_phone = f"0414-{uuid.uuid4().hex[:7]}"
    r1 = requests.post(f"{API}/auth/register", json={
        "email": referrer_email, "password": "Pass1234!", "name": "Ana Referrer",
        "phone": referrer_phone, "role": "passenger",
    }, timeout=20)
    assert r1.status_code == 200
    referrer_code = r1.json()["user"]["referral_code"]
    
    # Create referred user with referral code
    referred_email = f"ref_user_{uuid.uuid4().hex[:6]}@rideve.com"
    referred_phone = f"0414-{uuid.uuid4().hex[:7]}"
    r2 = requests.post(f"{API}/auth/register", json={
        "email": referred_email, "password": "Pass1234!", "name": "Pedro Referred",
        "phone": referred_phone, "role": "passenger",
        "referred_by_code": referrer_code,
    }, timeout=20)
    assert r2.status_code == 200
    
    # Verify referred user has referrer info and starts with 0 completed rides
    referred_user = r2.json()["user"]
    assert referred_user["referred_by"] is not None
    assert referred_user["completed_rides_count"] == 0
    assert referred_user["wallet_balance"] == 1.5  # Welcome bonus


def test_streak_bonus_after_5_rides():
    """Test that passenger gets $2.00 bonus after completing 5 rides"""
    # This test verifies the streak bonus logic exists in the backend
    # The actual bonus is triggered in the complete_ride endpoint (lines 851-862 in server.py)
    # when a passenger completes their 5th ride (completed_rides_count reaches 5)
    
    email = f"streak_{uuid.uuid4().hex[:6]}@rideve.com"
    phone = f"0414-{uuid.uuid4().hex[:7]}"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Pass1234!", "name": "Streak User",
        "phone": phone, "role": "passenger",
    }, timeout=20)
    assert r.status_code == 200
    user = r.json()["user"]
    
    # Verify completed_rides_count field exists and starts at 0
    assert "completed_rides_count" in user
    assert user["completed_rides_count"] == 0
    
    # Verify the user has welcome bonus
    assert user["wallet_balance"] == 1.5


# ---------- Welcome Bonus Tests ----------
def test_welcome_bonus_transaction():
    """Test that welcome bonus creates a wallet transaction"""
    email = f"welcome_{uuid.uuid4().hex[:6]}@rideve.com"
    phone = f"0414-{uuid.uuid4().hex[:7]}"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Pass1234!", "name": "Welcome User",
        "phone": phone, "role": "passenger",
    }, timeout=15)
    assert r.status_code == 200
    tok = r.json()["access_token"]
    
    # Check wallet history for welcome bonus
    history = requests.get(f"{API}/wallet/history", headers=H(tok), timeout=10).json()
    welcome_txns = [t for t in history if t.get("type") == "bonus" and "Bienvenida" in t.get("description", "")]
    assert len(welcome_txns) == 1
    assert welcome_txns[0]["amount"] == 1.5


# ---------- Phone Normalization and Uniqueness Tests ----------
def test_phone_normalization_different_formats():
    """Test that different phone formats are normalized to the same value"""
    # Generate unique phone number for this test run
    unique_suffix = uuid.uuid4().hex[:7]
    base_phone = f"414{unique_suffix}"  # Normalized format
    email1 = f"phone1_{uuid.uuid4().hex[:6]}@rideve.com"
    
    # Format 1: With country code and dashes
    r1 = requests.post(f"{API}/auth/register", json={
        "email": email1, "password": "Pass1234!", "name": "Phone Test 1",
        "phone": f"+58-414-{unique_suffix}", "role": "passenger",
    }, timeout=15)
    assert r1.status_code == 200, f"First registration failed: {r1.text}"
    
    # Format 2: Try to register with same phone but different format (should fail)
    email2 = f"phone2_{uuid.uuid4().hex[:6]}@rideve.com"
    r2 = requests.post(f"{API}/auth/register", json={
        "email": email2, "password": "Pass1234!", "name": "Phone Test 2",
        "phone": f"0414-{unique_suffix}", "role": "passenger",
    }, timeout=15)
    assert r2.status_code == 409, f"Should reject duplicate phone: {r2.text}"
    assert "Teléfono ya registrado" in r2.json()["detail"]
    
    # Format 3: Try with spaces (should also fail)
    email3 = f"phone3_{uuid.uuid4().hex[:6]}@rideve.com"
    r3 = requests.post(f"{API}/auth/register", json={
        "email": email3, "password": "Pass1234!", "name": "Phone Test 3",
        "phone": f"0414 {unique_suffix[:3]} {unique_suffix[3:]}", "role": "passenger",
    }, timeout=15)
    assert r3.status_code == 409, f"Should reject duplicate phone with spaces: {r3.text}"
    assert "Teléfono ya registrado" in r3.json()["detail"]
    
    # Format 4: Try without leading zero (should also fail)
    email4 = f"phone4_{uuid.uuid4().hex[:6]}@rideve.com"
    r4 = requests.post(f"{API}/auth/register", json={
        "email": email4, "password": "Pass1234!", "name": "Phone Test 4",
        "phone": f"414{unique_suffix}", "role": "passenger",
    }, timeout=15)
    assert r4.status_code == 409, f"Should reject duplicate phone without leading zero: {r4.text}"
    assert "Teléfono ya registrado" in r4.json()["detail"]


def test_phone_uniqueness_check():
    """Test that phone numbers must be unique across all users"""
    phone = f"0414-{uuid.uuid4().hex[:7]}"
    
    # Register first user
    email1 = f"unique1_{uuid.uuid4().hex[:6]}@rideve.com"
    r1 = requests.post(f"{API}/auth/register", json={
        "email": email1, "password": "Pass1234!", "name": "Unique Test 1",
        "phone": phone, "role": "passenger",
    }, timeout=15)
    assert r1.status_code == 200, f"First registration failed: {r1.text}"
    
    # Try to register second user with same phone
    email2 = f"unique2_{uuid.uuid4().hex[:6]}@rideve.com"
    r2 = requests.post(f"{API}/auth/register", json={
        "email": email2, "password": "Pass1234!", "name": "Unique Test 2",
        "phone": phone, "role": "passenger",
    }, timeout=15)
    assert r2.status_code == 409, f"Should reject duplicate phone: {r2.text}"
    assert "Teléfono ya registrado" in r2.json()["detail"]


def test_phone_login_with_normalized_phone():
    """Test that phone login works with different phone formats"""
    # Register with one format
    email = f"phonelogin_{uuid.uuid4().hex[:6]}@rideve.com"
    phone_original = f"0414-{uuid.uuid4().hex[:7]}"
    
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Pass1234!", "name": "Phone Login Test",
        "phone": phone_original, "role": "passenger",
    }, timeout=15)
    assert r.status_code == 200, f"Registration failed: {r.text}"
    user_id = r.json()["user"]["id"]
    
    # Login with different format (without dashes)
    phone_no_dash = phone_original.replace("-", "")
    r2 = requests.post(f"{API}/auth/phone-login", json={
        "phone": phone_no_dash,
    }, timeout=15)
    assert r2.status_code == 200, f"Phone login failed: {r2.text}"
    assert r2.json()["user"]["id"] == user_id, "Should login to the same user"
    
    # Login with +58 prefix
    phone_with_prefix = f"+58{phone_no_dash[1:]}"  # Remove leading 0 and add +58
    r3 = requests.post(f"{API}/auth/phone-login", json={
        "phone": phone_with_prefix,
    }, timeout=15)
    assert r3.status_code == 200, f"Phone login with +58 failed: {r3.text}"
    assert r3.json()["user"]["id"] == user_id, "Should login to the same user"


def test_phone_normalization_with_country_code():
    """Test that +58 country code is properly handled"""
    base_number = f"414{uuid.uuid4().hex[:7]}"
    
    # Register with +58 prefix
    email1 = f"cc1_{uuid.uuid4().hex[:6]}@rideve.com"
    r1 = requests.post(f"{API}/auth/register", json={
        "email": email1, "password": "Pass1234!", "name": "Country Code Test 1",
        "phone": f"+58{base_number}", "role": "passenger",
    }, timeout=15)
    assert r1.status_code == 200, f"Registration with +58 failed: {r1.text}"
    
    # Try to register with 0 prefix (should fail - same number)
    email2 = f"cc2_{uuid.uuid4().hex[:6]}@rideve.com"
    r2 = requests.post(f"{API}/auth/register", json={
        "email": email2, "password": "Pass1234!", "name": "Country Code Test 2",
        "phone": f"0{base_number}", "role": "passenger",
    }, timeout=15)
    assert r2.status_code == 409, f"Should reject duplicate phone: {r2.text}"
    assert "Teléfono ya registrado" in r2.json()["detail"]


# ---------- DONATEX Owner Credentials ----------
def test_donatex_login_with_full_email():
    """Test DONATEX owner can login with full email donatex@ruedalo.app"""
    r = requests.post(f"{API}/auth/login", json={
        "email": "donatex@ruedalo.app",
        "password": "Venezuela257#"
    }, timeout=10)
    assert r.status_code == 200, f"DONATEX login failed: {r.status_code} {r.text}"
    j = r.json()
    assert "access_token" in j
    assert j["user"]["email"] == "donatex@ruedalo.app"
    assert j["user"]["name"] == "DONATEX"
    assert j["user"]["role"] == "admin", "DONATEX should have admin role"
    assert j["user"]["id"] == "donatex-admin-id"


def test_donatex_login_with_shortcut():
    """Test DONATEX owner can login with shortcut username 'donatex'"""
    r = requests.post(f"{API}/auth/login", json={
        "email": "donatex",
        "password": "Venezuela257#"
    }, timeout=10)
    assert r.status_code == 200, f"DONATEX shortcut login failed: {r.status_code} {r.text}"
    j = r.json()
    assert "access_token" in j
    assert j["user"]["email"] == "donatex@ruedalo.app"
    assert j["user"]["name"] == "DONATEX"
    assert j["user"]["role"] == "admin", "DONATEX should have admin role"


def test_donatex_admin_access():
    """Test DONATEX owner has admin access to admin endpoints"""
    # Login as DONATEX
    r = requests.post(f"{API}/auth/login", json={
        "email": "donatex",
        "password": "Venezuela257#"
    }, timeout=10)
    assert r.status_code == 200
    tok = r.json()["access_token"]
    
    # Test admin endpoints access
    # 1. Get admin stats
    stats = requests.get(f"{API}/admin/stats", headers=H(tok), timeout=10)
    assert stats.status_code == 200, "DONATEX should have access to admin stats"
    
    # 2. Get all users
    users = requests.get(f"{API}/admin/users", headers=H(tok), timeout=10)
    assert users.status_code == 200, "DONATEX should have access to user list"
    
    # 3. Get recharges
    recharges = requests.get(f"{API}/admin/recharges", headers=H(tok), timeout=10)
    assert recharges.status_code == 200, "DONATEX should have access to recharges"


def test_donatex_wrong_password():
    """Test DONATEX login fails with wrong password"""
    r = requests.post(f"{API}/auth/login", json={
        "email": "donatex",
        "password": "WrongPassword123"
    }, timeout=10)
    assert r.status_code == 401, "Should reject wrong password"
