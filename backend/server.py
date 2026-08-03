"""
RideVE - Backend (FastAPI + MongoDB)
Ride-hailing app for Venezuela with JWT auth, wallet, Pago Movil recharges.
"""

import os
import uuid
import math
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional, Literal, List

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from dotenv import load_dotenv
import jwt
from jwt import InvalidTokenError

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@rideve.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin1234!")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rideve")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

users_col = db["users"]
rides_col = db["rides"]
recharges_col = db["recharges"]
wallet_txns_col = db["wallet_txns"]
messages_col = db["messages"]
config_col = db["config"]
ratings_col = db["ratings"]
promocodes_col = db["promocodes"]
notifications_col = db["notifications"]

app = FastAPI(title="RideVE API")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

Role = Literal["passenger", "driver", "admin"]
RideStatus = Literal["requested", "accepted", "in_progress", "completed", "cancelled"]

# ============================================================
# Models
# ============================================================

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    role: Literal["passenger", "driver"] = "passenger"
    cedula: Optional[str] = None
    cedula_photo: Optional[str] = None
    referred_by_code: Optional[str] = None

class LoginIn(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    phone: str
    role: Role
    wallet_balance: float
    is_online: bool = False
    lat: Optional[float] = None
    lng: Optional[float] = None
    rating_avg: float = 5.0
    cedula: Optional[str] = None
    cedula_photo: Optional[str] = None
    is_verified: bool = False
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    plate: Optional[str] = None
    driver_status: Optional[str] = "none"
    profile_pic: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    referral_code: Optional[str] = None
    referred_by: Optional[str] = None
    completed_rides_count: int = 0
    is_active: bool = True

class ProfileUpdateIn(BaseModel):
    cedula: Optional[str] = None
    cedula_photo: Optional[str] = None
    profile_pic: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class DriverRegisterIn(BaseModel):
    vehicle_model: str
    vehicle_year: str
    plate: str
    license_photo: Optional[str] = None

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class LocationIn(BaseModel):
    lat: float
    lng: float

class OnlineIn(BaseModel):
    is_online: bool
    lat: Optional[float] = None
    lng: Optional[float] = None

class EstimateIn(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    service_type: Literal["ride", "delivery"] = "ride"

class RideRequestIn(BaseModel):
    origin_lat: float
    origin_lng: float
    origin_address: str
    dest_lat: float
    dest_lng: float
    dest_address: str
    price_usd: float
    distance_km: float
    duration_min: float

class RideOut(BaseModel):
    id: str
    passenger_id: str
    passenger_name: str
    passenger_phone: str
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    driver_lat: Optional[float] = None
    driver_lng: Optional[float] = None
    origin_lat: float
    origin_lng: float
    origin_address: str
    dest_lat: float
    dest_lng: float
    dest_address: str
    price_usd: float
    distance_km: float
    duration_min: float
    status: RideStatus
    created_at: str
    accepted_at: Optional[str] = None
    completed_at: Optional[str] = None
    rated: bool = False
    rating: Optional[int] = None

class RechargeIn(BaseModel):
    amount_usd: float
    reference: str
    sender_phone: str
    sender_bank: str

class RechargeOut(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_name: str
    amount_usd: float
    reference: str
    sender_phone: str
    sender_bank: str
    status: Literal["pending", "approved", "rejected"]
    created_at: str
    decided_at: Optional[str] = None

class MessageIn(BaseModel):
    text: str

class MessageOut(BaseModel):
    id: str
    ride_id: str
    sender_id: str
    sender_role: Role
    text: str
    created_at: str

class BankConfig(BaseModel):
    bank_name: str
    cedula: str
    phone: str
    holder_name: str
    usd_to_bs_rate: float

class RatingIn(BaseModel):
    ride_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class PromoCodeIn(BaseModel):
    code: str
    discount_usd: float = 0.0
    recharge_amount_usd: float = 0.0

class PromoCodeOut(BaseModel):
    code: str
    discount_usd: float
    recharge_amount_usd: float
    active: bool = True

class ApplyPromoIn(BaseModel):
    code: str

class WalletAdjustmentIn(BaseModel):
    amount: float
    description: Optional[str] = None

class PushNotificationIn(BaseModel):
    title: str
    body: str
    target: Literal["all", "drivers", "passengers", "individual"] = "all"
    user_id: Optional[str] = None

# ============================================================
# Helpers
# ============================================================

def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def hash_password(pw: str) -> str:
    return pwd_context.hash(pw)

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(pw, hashed)
    except Exception:
        return False

def create_token(user_id: str, role: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "role": role, "exp": exp}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def user_to_out(u: dict) -> UserOut:
    return UserOut(
        id=u["id"],
        email=u["email"],
        name=u.get("name", ""),
        phone=u.get("phone", ""),
        role=u["role"],
        wallet_balance=float(u.get("wallet_balance", 0)),
        is_online=bool(u.get("is_online", False)),
        lat=u.get("lat"),
        lng=u.get("lng"),
        rating_avg=float(u.get("rating_avg", 5.0)),
        cedula=u.get("cedula"),
        cedula_photo=u.get("cedula_photo"),
        is_verified=bool(u.get("is_verified", False)),
        vehicle_model=u.get("vehicle_model"),
        vehicle_year=u.get("vehicle_year"),
        plate=u.get("plate"),
        driver_status=u.get("driver_status", "none"),
        profile_pic=u.get("profile_pic"),
        emergency_contact_name=u.get("emergency_contact_name"),
        emergency_contact_phone=u.get("emergency_contact_phone"),
        referral_code=u.get("referral_code"),
        referred_by=u.get("referred_by"),
        completed_rides_count=int(u.get("completed_rides_count", 0)),
        is_active=bool(u.get("is_active", True)),
    )

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await users_col.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Tu cuenta ha sido desactivada por el administrador")
    return user

def require_roles(*allowed: str):
    async def guard(user=Depends(get_current_user)):
        if user["role"] not in allowed:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return guard

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))

def compute_advanced_fare(distance_km: float) -> dict:
    duration = round((distance_km / 25.0) * 60.0 + 3, 1)
    
    # 1. Moto: Tarifa base $1.80 + $0.40/km. Descuento $0.15
    moto_original = round(1.80 + distance_km * 0.40, 2)
    moto_discounted = max(1.00, round(moto_original - 0.15, 2))
    
    # 2. Económico (Carro): Tarifa base $4.50 + $0.80/km. Descuento $0.15
    eco_original = round(4.50 + distance_km * 0.80, 2)
    eco_discounted = max(3.00, round(eco_original - 0.15, 2))
    
    # 3. Confort VIP (Carro Premium): Tarifa base $6.00 + $1.20/km. Descuento $0.15
    confort_original = round(6.00 + distance_km * 1.20, 2)
    confort_discounted = max(4.50, round(confort_original - 0.15, 2))
    
    # 4. Delivery Express (Envío): Tarifa base $1.50 + $0.35/km. Descuento $0.30
    delivery_original = round(1.50 + distance_km * 0.35, 2)
    delivery_discounted = max(1.00, round(delivery_original - 0.30, 2))
    
    return {
        "distance_km": round(distance_km, 2),
        "duration_min": duration,
        "moto": {"original": moto_original, "discounted": moto_discounted, "saving": 0.15},
        "economico": {"original": eco_original, "discounted": eco_discounted, "saving": 0.15},
        "confort": {"original": confort_original, "discounted": confort_discounted, "saving": 0.15},
        "delivery": {"original": delivery_original, "discounted": delivery_discounted, "saving": 0.30},
    }

def compute_fare(distance_km: float) -> tuple[float, float]:
    """Fallback traditional compute_fare for legacy tests."""
    original = round(4.50 + distance_km * 0.80, 2)
    discounted = max(3.00, round(original - 0.15, 2))
    duration = round((distance_km / 25.0) * 60.0 + 3, 1)
    return discounted, duration

# ============================================================
# Seed
# ============================================================

CARACAS_CENTER = (10.4998, -66.8517)  # Plaza Altamira
SEED_DRIVERS = [
    {"name": "Carlos M.", "email": "carlos.driver@rideve.com", "phone": "0414-2233445", "lat": 10.5012, "lng": -66.8533},
    {"name": "Andrea P.", "email": "andrea.driver@rideve.com", "phone": "0414-3344556", "lat": 10.4985, "lng": -66.8540},
    {"name": "José R.", "email": "jose.driver@rideve.com", "phone": "0424-1122334", "lat": 10.5025, "lng": -66.8495},
    {"name": "María L.", "email": "maria.driver@rideve.com", "phone": "0412-9988776", "lat": 10.4970, "lng": -66.8505},
    {"name": "Pedro Z.", "email": "pedro.driver@rideve.com", "phone": "0416-5544332", "lat": 10.5040, "lng": -66.8550},
]

async def seed_initial_data():
    await users_col.create_index("id", unique=True)
    await users_col.create_index("email", unique=True)
    await rides_col.create_index("id", unique=True)
    await recharges_col.create_index("id", unique=True)
    await messages_col.create_index([("ride_id", 1), ("created_at", 1)])
    await promocodes_col.create_index("code", unique=True)
    await notifications_col.create_index("id", unique=True)

    # Admin
    if not await users_col.find_one({"email": ADMIN_EMAIL}):
        await users_col.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "name": "Administrador",
            "phone": "0000-0000000",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "wallet_balance": 0.0,
            "is_online": False,
            "rating_avg": 5.0,
            "created_at": utcnow_iso(),
        })
        logger.info("Seeded admin")

    # Seed DONATEX owner account - using an idempotent upsert on "id"
    await users_col.update_one(
        {"id": "donatex-admin-id"},
        {"$set": {
            "email": "donatex@ruedalo.app",
            "name": "DONATEX",
            "phone": "0414-9999999",
            "password_hash": hash_password("Venezuela257#"),
            "role": "admin",
            "wallet_balance": 0.0,
            "is_online": False,
            "rating_avg": 5.0,
        }, "$setOnInsert": {
            "created_at": utcnow_iso()
        }},
        upsert=True
    )
    logger.info("Seeded DONATEX owner admin account")

    # Demo passenger
    if not await users_col.find_one({"email": "pasajero@rideve.com"}):
        await users_col.insert_one({
            "id": str(uuid.uuid4()),
            "email": "pasajero@rideve.com",
            "name": "Luis Pasajero",
            "phone": "0414-1111111",
            "password_hash": hash_password("Demo1234!"),
            "role": "passenger",
            "wallet_balance": 25.0,
            "is_online": False,
            "rating_avg": 5.0,
            "created_at": utcnow_iso(),
        })
        logger.info("Seeded demo passenger")

    # Demo driver (main one for manual testing)
    if not await users_col.find_one({"email": "conductor@rideve.com"}):
        await users_col.insert_one({
            "id": str(uuid.uuid4()),
            "email": "conductor@rideve.com",
            "name": "Ana Conductora",
            "phone": "0414-2222222",
            "password_hash": hash_password("Demo1234!"),
            "role": "driver",
            "wallet_balance": 0.0,
            "is_online": False,
            "lat": CARACAS_CENTER[0],
            "lng": CARACAS_CENTER[1],
            "rating_avg": 4.9,
            "created_at": utcnow_iso(),
        })
        logger.info("Seeded demo driver")

    # Simulated drivers (online near Caracas)
    for d in SEED_DRIVERS:
        if not await users_col.find_one({"email": d["email"]}):
            await users_col.insert_one({
                "id": str(uuid.uuid4()),
                "email": d["email"],
                "name": d["name"],
                "phone": d["phone"],
                "password_hash": hash_password("Demo1234!"),
                "role": "driver",
                "wallet_balance": 0.0,
                "is_online": False,
                "lat": d["lat"],
                "lng": d["lng"],
                "rating_avg": round(4.5 + (hash(d["email"]) % 50) / 100.0, 2),
                "created_at": utcnow_iso(),
            })

    # Seeding simulated bots config
    bots_config = await config_col.find_one({"_id": "bots"})
    if not bots_config:
        bots_config = {"_id": "bots", "enabled": True}
        await config_col.insert_one(bots_config)
    
    bots_enabled = bots_config.get("enabled", True)
    # Set simulated driver online states
    await users_col.update_many(
        {"email": {"$in": [d["email"] for d in SEED_DRIVERS] + ["conductor@rideve.com"]}},
        {"$set": {"is_online": bots_enabled}}
    )

    # Bank config
    if not await config_col.find_one({"_id": "bank"}):
        await config_col.insert_one({
            "_id": "bank",
            "bank_name": "Banco de Venezuela",
            "cedula": "V-12345678",
            "phone": "0414-1234567",
            "holder_name": "RideVE C.A.",
            "usd_to_bs_rate": 38.5,
        })
        logger.info("Seeded bank config")

@app.on_event("startup")
async def on_startup():
    await seed_initial_data()

@app.on_event("shutdown")
async def on_shutdown():
    client.close()

# ============================================================
# Auth
# ============================================================

@api.post("/auth/register", response_model=TokenOut)
async def register(body: RegisterIn):
    if await users_col.find_one({"email": body.email}):
        raise HTTPException(status_code=409, detail="Correo ya registrado")
    user_id = str(uuid.uuid4())
    
    # Generate unique referral code
    first_word = body.name.split()[0].replace("-","").replace(".","").upper() if body.name else "USER"
    rand_suffix = str(uuid.uuid4().hex[:4]).upper()
    ref_code = f"{first_word}{rand_suffix}"
    
    # Check if registered with a referral code
    ref_by_id = None
    if body.referred_by_code:
        ref_user = await users_col.find_one({"referral_code": body.referred_by_code.strip().upper()})
        if ref_user:
            ref_by_id = ref_user["id"]
            logger.info(f"User {user_id} was referred by {ref_by_id}")
            
    # Welcome Bonus promo: $1.50 USD credited to wallet!
    welcome_balance = 1.50
    
    doc = {
        "id": user_id,
        "email": body.email,
        "name": body.name,
        "phone": body.phone,
        "password_hash": hash_password(body.password),
        "role": body.role,
        "wallet_balance": welcome_balance,
        "is_online": False,
        "rating_avg": 5.0,
        "cedula": body.cedula,
        "cedula_photo": body.cedula_photo,
        "is_verified": bool(body.cedula is not None),
        "vehicle_model": None,
        "vehicle_year": None,
        "plate": None,
        "driver_status": "none",
        "profile_pic": None,
        "emergency_contact_name": None,
        "emergency_contact_phone": None,
        "referral_code": ref_code,
        "referred_by": ref_by_id,
        "completed_rides_count": 0,
        "created_at": utcnow_iso(),
    }
    await users_col.insert_one(doc)
    
    # Insert Welcome Bonus transaction
    await wallet_txns_col.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "amount": welcome_balance,
        "type": "bonus",
        "ride_id": None,
        "description": "Bono de Bienvenida",
        "created_at": utcnow_iso(),
    })
    
    user = await users_col.find_one({"id": user_id}, {"_id": 0})
    token = create_token(user_id, body.role)
    return TokenOut(access_token=token, user=user_to_out(user))

@api.post("/auth/login", response_model=TokenOut)
async def login(body: LoginIn):
    email_or_username = body.email.strip().lower()
    if email_or_username == "donatex":
        email_or_username = "donatex@ruedalo.app"
    user = await users_col.find_one({"email": email_or_username}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    token = create_token(user["id"], user["role"])
    return TokenOut(access_token=token, user=user_to_out(user))

@api.get("/auth/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return user_to_out(user)

@api.post("/users/update_profile", response_model=UserOut)
async def update_profile(body: ProfileUpdateIn, user=Depends(get_current_user)):
    upd = {}
    if body.cedula is not None:
        upd["cedula"] = body.cedula
        upd["is_verified"] = True
    if body.cedula_photo is not None:
        upd["cedula_photo"] = body.cedula_photo
    if body.profile_pic is not None:
        upd["profile_pic"] = body.profile_pic
    if body.emergency_contact_name is not None:
        upd["emergency_contact_name"] = body.emergency_contact_name
    if body.emergency_contact_phone is not None:
        upd["emergency_contact_phone"] = body.emergency_contact_phone
    
    if upd:
        await users_col.update_one({"id": user["id"]}, {"$set": upd})
    
    updated_user = await users_col.find_one({"id": user["id"]}, {"_id": 0})
    return user_to_out(updated_user)

@api.post("/users/register_driver", response_model=UserOut)
async def register_driver(body: DriverRegisterIn, user=Depends(get_current_user)):
    upd = {
        "vehicle_model": body.vehicle_model,
        "vehicle_year": body.vehicle_year,
        "plate": body.plate,
        "driver_status": "pending",  # awaiting admin approval
    }
    await users_col.update_one({"id": user["id"]}, {"$set": upd})
    updated_user = await users_col.find_one({"id": user["id"]}, {"_id": 0})
    return user_to_out(updated_user)

@api.post("/users/switch_role", response_model=UserOut)
async def switch_role(user=Depends(get_current_user)):
    if user["role"] == "driver":
        await users_col.update_one({"id": user["id"]}, {"$set": {"role": "passenger"}})
    elif user["role"] == "passenger":
        if user.get("driver_status") == "approved":
            await users_col.update_one({"id": user["id"]}, {"$set": {"role": "driver"}})
        else:
            raise HTTPException(status_code=400, detail="Tu solicitud de conductor aún no ha sido aprobada.")
    
    updated_user = await users_col.find_one({"id": user["id"]}, {"_id": 0})
    return user_to_out(updated_user)

# ============================================================
# Wallet
# ============================================================

@api.get("/wallet/history")
async def wallet_history(user=Depends(get_current_user)):
    txns = await wallet_txns_col.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return txns

@api.get("/wallet/bank-config", response_model=BankConfig)
async def get_bank_config(_=Depends(get_current_user)):
    cfg = await config_col.find_one({"_id": "bank"})
    if not cfg:
        raise HTTPException(status_code=404, detail="Sin configuración")
    return BankConfig(
        bank_name=cfg["bank_name"],
        cedula=cfg["cedula"],
        phone=cfg["phone"],
        holder_name=cfg["holder_name"],
        usd_to_bs_rate=cfg["usd_to_bs_rate"],
    )

@api.post("/wallet/recharge", response_model=RechargeOut)
async def request_recharge(body: RechargeIn, user=Depends(require_roles("passenger", "driver"))):
    if body.amount_usd <= 0:
        raise HTTPException(status_code=400, detail="Monto inválido")
    rec_id = str(uuid.uuid4())
    doc = {
        "id": rec_id,
        "user_id": user["id"],
        "user_email": user["email"],
        "user_name": user["name"],
        "amount_usd": float(body.amount_usd),
        "reference": body.reference,
        "sender_phone": body.sender_phone,
        "sender_bank": body.sender_bank,
        "status": "pending",
        "created_at": utcnow_iso(),
        "decided_at": None,
    }
    await recharges_col.insert_one(doc)
    return RechargeOut(**{k: v for k, v in doc.items() if k != "_id"})

@api.get("/wallet/my-recharges")
async def my_recharges(user=Depends(get_current_user)):
    items = await recharges_col.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

# ============================================================
# Drivers (passenger -> nearby)
# ============================================================

@api.get("/drivers/nearby")
async def drivers_nearby(lat: float, lng: float, _=Depends(get_current_user)):
    drivers = await users_col.find(
        {"role": "driver", "is_online": True, "lat": {"$ne": None}},
        {"_id": 0, "password_hash": 0}
    ).to_list(50)
    # within ~5km
    nearby = []
    for d in drivers:
        if d.get("lat") is None or d.get("lng") is None:
            continue
        dist = haversine_km(lat, lng, d["lat"], d["lng"])
        if dist <= 8.0:
            nearby.append({
                "id": d["id"],
                "name": d["name"],
                "lat": d["lat"],
                "lng": d["lng"],
                "rating_avg": d.get("rating_avg", 5.0),
                "distance_km": round(dist, 2),
            })
    nearby.sort(key=lambda x: x["distance_km"])
    return nearby

@api.post("/drivers/location")
async def update_my_location(body: LocationIn, user=Depends(require_roles("driver"))):
    await users_col.update_one(
        {"id": user["id"]},
        {"$set": {"lat": body.lat, "lng": body.lng}},
    )
    return {"ok": True}

@api.post("/drivers/online")
async def set_online(body: OnlineIn, user=Depends(require_roles("driver"))):
    upd = {"is_online": body.is_online}
    if body.lat is not None and body.lng is not None:
        upd["lat"] = body.lat
        upd["lng"] = body.lng
    await users_col.update_one({"id": user["id"]}, {"$set": upd})
    return {"ok": True}

# ============================================================
# Rides
# ============================================================

@api.post("/rides/estimate")
async def estimate(body: EstimateIn, _=Depends(get_current_user)):
    dist = haversine_km(body.origin_lat, body.origin_lng, body.dest_lat, body.dest_lng)
    matrix = compute_advanced_fare(dist)
    legacy_price = matrix["economico"]["discounted"] if body.service_type == "ride" else matrix["delivery"]["discounted"]
    return {
        "distance_km": round(dist, 2),
        "duration_min": matrix["duration_min"],
        "price_usd": legacy_price,
        "rates": matrix
    }

def ride_to_out(r: dict) -> dict:
    return {k: v for k, v in r.items() if k != "_id"}

@api.post("/rides/request")
async def request_ride(body: RideRequestIn, user=Depends(require_roles("passenger"))):
    # check active ride
    existing = await rides_col.find_one({
        "passenger_id": user["id"],
        "status": {"$in": ["requested", "accepted", "in_progress"]},
    })
    if existing:
        raise HTTPException(status_code=409, detail="Ya tienes un viaje activo")
    # wallet check
    if float(user.get("wallet_balance", 0)) < body.price_usd:
        raise HTTPException(status_code=402, detail="Saldo insuficiente. Recarga tu wallet.")
    ride_id = str(uuid.uuid4())
    doc = {
        "id": ride_id,
        "passenger_id": user["id"],
        "passenger_name": user["name"],
        "passenger_phone": user["phone"],
        "driver_id": None,
        "driver_name": None,
        "driver_phone": None,
        "driver_lat": None,
        "driver_lng": None,
        "origin_lat": body.origin_lat,
        "origin_lng": body.origin_lng,
        "origin_address": body.origin_address,
        "dest_lat": body.dest_lat,
        "dest_lng": body.dest_lng,
        "dest_address": body.dest_address,
        "price_usd": float(body.price_usd),
        "distance_km": float(body.distance_km),
        "duration_min": float(body.duration_min),
        "status": "requested",
        "created_at": utcnow_iso(),
        "accepted_at": None,
        "completed_at": None,
        "rated": False,
        "rating": None,
    }
    await rides_col.insert_one(doc)
    return ride_to_out(doc)

@api.get("/rides/mine")
async def my_rides(user=Depends(get_current_user)):
    if user["role"] == "passenger":
        q = {"passenger_id": user["id"]}
    elif user["role"] == "driver":
        q = {"driver_id": user["id"]}
    else:
        q = {}
    rides = await rides_col.find(q, {"_id": 0}).sort("created_at", -1).to_list(100)
    return rides

@api.get("/rides/active")
async def active_ride(user=Depends(get_current_user)):
    if user["role"] == "passenger":
        q = {"passenger_id": user["id"], "status": {"$in": ["requested", "accepted", "in_progress"]}}
    elif user["role"] == "driver":
        q = {"driver_id": user["id"], "status": {"$in": ["accepted", "in_progress"]}}
    else:
        return None
    ride = await rides_col.find_one(q, {"_id": 0})
    return ride

@api.get("/rides/available")
async def available_rides(user=Depends(require_roles("driver"))):
    rides = await rides_col.find({"status": "requested"}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return rides

@api.get("/rides/{ride_id}")
async def get_ride(ride_id: str, user=Depends(get_current_user)):
    ride = await rides_col.find_one({"id": ride_id}, {"_id": 0})
    if not ride:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    if user["role"] not in ("admin",) and ride["passenger_id"] != user["id"] and ride.get("driver_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Sin acceso")
    return ride

@api.post("/rides/{ride_id}/accept")
async def accept_ride(ride_id: str, user=Depends(require_roles("driver"))):
    ride = await rides_col.find_one({"id": ride_id})
    if not ride:
        raise HTTPException(status_code=404, detail="No encontrado")
    if ride["status"] != "requested":
        raise HTTPException(status_code=409, detail="Viaje ya tomado")
    # ensure driver has no active ride
    active = await rides_col.find_one({"driver_id": user["id"], "status": {"$in": ["accepted", "in_progress"]}})
    if active:
        raise HTTPException(status_code=409, detail="Ya tienes un viaje activo")
    await rides_col.update_one(
        {"id": ride_id, "status": "requested"},
        {"$set": {
            "status": "accepted",
            "driver_id": user["id"],
            "driver_name": user["name"],
            "driver_phone": user["phone"],
            "driver_lat": user.get("lat"),
            "driver_lng": user.get("lng"),
            "accepted_at": utcnow_iso(),
        }},
    )
    return await rides_col.find_one({"id": ride_id}, {"_id": 0})

@api.post("/rides/{ride_id}/start")
async def start_ride(ride_id: str, user=Depends(require_roles("driver"))):
    ride = await rides_col.find_one({"id": ride_id})
    if not ride or ride.get("driver_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Sin acceso")
    if ride["status"] != "accepted":
        raise HTTPException(status_code=409, detail="Estado inválido")
    await rides_col.update_one({"id": ride_id}, {"$set": {"status": "in_progress"}})
    return await rides_col.find_one({"id": ride_id}, {"_id": 0})

@api.post("/rides/{ride_id}/complete")
async def complete_ride(ride_id: str, user=Depends(require_roles("driver"))):
    ride = await rides_col.find_one({"id": ride_id})
    if not ride or ride.get("driver_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Sin acceso")
    if ride["status"] not in ("accepted", "in_progress"):
        raise HTTPException(status_code=409, detail="Estado inválido")
    price = float(ride["price_usd"])
    
    # debit passenger, credit driver
    await users_col.update_one({"id": ride["passenger_id"]}, {"$inc": {"wallet_balance": -price}})
    await users_col.update_one({"id": user["id"]}, {"$inc": {"wallet_balance": price * 0.85}})
    
    await wallet_txns_col.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": ride["passenger_id"],
        "amount": -price,
        "type": "ride_payment",
        "ride_id": ride_id,
        "description": f"Viaje a {ride['dest_address']}",
        "created_at": utcnow_iso(),
    })
    await wallet_txns_col.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "amount": price * 0.85,
        "type": "ride_earning",
        "ride_id": ride_id,
        "description": f"Ganancia viaje {ride['passenger_name']}",
        "created_at": utcnow_iso(),
    })
    
    # Core Referral and Streak Promotion Engines
    passenger = await users_col.find_one({"id": ride["passenger_id"]})
    if passenger:
        current_count = int(passenger.get("completed_rides_count", 0))
        new_count = current_count + 1
        await users_col.update_one({"id": ride["passenger_id"]}, {"$set": {"completed_rides_count": new_count}})
        
        # 1. Referral Reward Rule: First ride completed! Owner of referral code receives $2.50
        if current_count == 0 and passenger.get("referred_by"):
            referrer_id = passenger["referred_by"]
            await users_col.update_one({"id": referrer_id}, {"$inc": {"wallet_balance": 2.50}})
            await wallet_txns_col.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": referrer_id,
                "amount": 2.50,
                "type": "referral_bonus",
                "ride_id": ride_id,
                "description": f"Bono por referir a {passenger['name']}",
                "created_at": utcnow_iso(),
            })
            logger.info(f"Referrer {referrer_id} credited $2.50 for referral {passenger['id']}")
            
        # 2. Promo Racha (Streak Promo): Completed 5 services! Passenger receives $2.00
        if new_count == 5:
            await users_col.update_one({"id": ride["passenger_id"]}, {"$inc": {"wallet_balance": 2.00}})
            await wallet_txns_col.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": ride["passenger_id"],
                "amount": 2.00,
                "type": "streak_bonus",
                "ride_id": ride_id,
                "description": "Bono Promo Racha (5 servicios)",
                "created_at": utcnow_iso(),
            })
            logger.info(f"Passenger {ride['passenger_id']} credited $2.00 for completing 5 services")

    await rides_col.update_one(
        {"id": ride_id},
        {"$set": {"status": "completed", "completed_at": utcnow_iso()}},
    )
    return await rides_col.find_one({"id": ride_id}, {"_id": 0})

@api.post("/rides/{ride_id}/cancel")
async def cancel_ride(ride_id: str, user=Depends(get_current_user)):
    ride = await rides_col.find_one({"id": ride_id})
    if not ride:
        raise HTTPException(status_code=404, detail="No encontrado")
    if user["role"] != "admin" and ride["passenger_id"] != user["id"] and ride.get("driver_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Sin acceso")
    if ride["status"] in ("completed", "cancelled"):
        raise HTTPException(status_code=409, detail="Estado inválido")
    await rides_col.update_one({"id": ride_id}, {"$set": {"status": "cancelled", "completed_at": utcnow_iso()}})
    return await rides_col.find_one({"id": ride_id}, {"_id": 0})

@api.post("/rides/rate")
async def rate_ride(body: RatingIn, user=Depends(require_roles("passenger"))):
    ride = await rides_col.find_one({"id": body.ride_id})
    if not ride or ride["passenger_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Sin acceso")
    if ride["status"] != "completed":
        raise HTTPException(status_code=409, detail="Solo viajes completados pueden ser calificados")
    if ride.get("rated"):
        raise HTTPException(status_code=409, detail="Ya calificado")
    await ratings_col.insert_one({
        "id": str(uuid.uuid4()),
        "ride_id": body.ride_id,
        "driver_id": ride["driver_id"],
        "passenger_id": user["id"],
        "rating": body.rating,
        "comment": body.comment or "",
        "created_at": utcnow_iso(),
    })
    await rides_col.update_one({"id": body.ride_id}, {"$set": {"rated": True, "rating": body.rating}})
    # update driver rating avg
    cur = ratings_col.find({"driver_id": ride["driver_id"]}, {"_id": 0, "rating": 1})
    ratings = await cur.to_list(1000)
    if ratings:
        avg = sum(r["rating"] for r in ratings) / len(ratings)
        await users_col.update_one({"id": ride["driver_id"]}, {"$set": {"rating_avg": round(avg, 2)}})
    return {"ok": True}

# ============================================================
# Messages (chat)
# ============================================================

@api.get("/messages/{ride_id}")
async def get_messages(ride_id: str, user=Depends(get_current_user)):
    ride = await rides_col.find_one({"id": ride_id})
    if not ride:
        raise HTTPException(status_code=404, detail="No encontrado")
    if user["role"] != "admin" and ride["passenger_id"] != user["id"] and ride.get("driver_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Sin acceso")
    msgs = await messages_col.find({"ride_id": ride_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return msgs

@api.post("/messages/{ride_id}", response_model=MessageOut)
async def post_message(ride_id: str, body: MessageIn, user=Depends(get_current_user)):
    ride = await rides_col.find_one({"id": ride_id})
    if not ride:
        raise HTTPException(status_code=404, detail="No encontrado")
    if ride["passenger_id"] != user["id"] and ride.get("driver_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Sin acceso")
    msg = {
        "id": str(uuid.uuid4()),
        "ride_id": ride_id,
        "sender_id": user["id"],
        "sender_role": user["role"],
        "text": body.text,
        "created_at": utcnow_iso(),
    }
    await messages_col.insert_one(msg)
    return MessageOut(**msg)

# ============================================================
# Admin
# ============================================================

@api.get("/admin/recharges")
async def admin_recharges(status_filter: Optional[str] = None, _=Depends(require_roles("admin"))):
    q = {}
    if status_filter:
        q["status"] = status_filter
    items = await recharges_col.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items

@api.post("/admin/recharges/{rec_id}/approve")
async def approve_recharge(rec_id: str, _=Depends(require_roles("admin"))):
    rec = await recharges_col.find_one({"id": rec_id})
    if not rec:
        raise HTTPException(status_code=404, detail="No encontrado")
    if rec["status"] != "pending":
        raise HTTPException(status_code=409, detail="Ya procesada")
    await users_col.update_one({"id": rec["user_id"]}, {"$inc": {"wallet_balance": float(rec["amount_usd"])}})
    await wallet_txns_col.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": rec["user_id"],
        "amount": float(rec["amount_usd"]),
        "type": "recharge",
        "ride_id": None,
        "description": f"Recarga Pago Móvil ref {rec['reference']}",
        "created_at": utcnow_iso(),
    })
    await recharges_col.update_one({"id": rec_id}, {"$set": {"status": "approved", "decided_at": utcnow_iso()}})
    return {"ok": True}

@api.post("/admin/recharges/{rec_id}/reject")
async def reject_recharge(rec_id: str, _=Depends(require_roles("admin"))):
    rec = await recharges_col.find_one({"id": rec_id})
    if not rec:
        raise HTTPException(status_code=404, detail="No encontrado")
    if rec["status"] != "pending":
        raise HTTPException(status_code=409, detail="Ya procesada")
    await recharges_col.update_one({"id": rec_id}, {"$set": {"status": "rejected", "decided_at": utcnow_iso()}})
    return {"ok": True}

@api.get("/admin/users")
async def admin_users(_=Depends(require_roles("admin"))):
    items = await users_col.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return items

@api.get("/admin/rides")
async def admin_rides(_=Depends(require_roles("admin"))):
    items = await rides_col.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items

@api.put("/admin/bank-config", response_model=BankConfig)
async def update_bank_config(body: BankConfig, _=Depends(require_roles("admin"))):
    await config_col.update_one(
        {"_id": "bank"},
        {"$set": body.dict()},
        upsert=True,
    )
    return body

@api.get("/admin/stats")
async def admin_stats(_=Depends(require_roles("admin"))):
    total_users = await users_col.count_documents({})
    total_drivers = await users_col.count_documents({"role": "driver"})
    total_passengers = await users_col.count_documents({"role": "passenger"})
    online_drivers = await users_col.count_documents({"role": "driver", "is_online": True})
    total_rides = await rides_col.count_documents({})
    completed_rides = await rides_col.count_documents({"status": "completed"})
    pending_recharges = await recharges_col.count_documents({"status": "pending"})
    return {
        "total_users": total_users,
        "total_drivers": total_drivers,
        "total_passengers": total_passengers,
        "online_drivers": online_drivers,
        "total_rides": total_rides,
        "completed_rides": completed_rides,
        "pending_recharges": pending_recharges,
    }

@api.get("/admin/drivers/pending")
async def admin_pending_drivers(_=Depends(require_roles("admin"))):
    items = await users_col.find({"driver_status": "pending"}, {"_id": 0, "password_hash": 0}).to_list(100)
    return items

@api.post("/admin/drivers/{driver_id}/approve")
async def admin_approve_driver(driver_id: str, _=Depends(require_roles("admin"))):
    user = await users_col.find_one({"id": driver_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    await users_col.update_one(
        {"id": driver_id},
        {"$set": {"driver_status": "approved", "role": "driver", "is_verified": True}}
    )
    return {"ok": True}

@api.post("/admin/drivers/{driver_id}/reject")
async def admin_reject_driver(driver_id: str, _=Depends(require_roles("admin"))):
    user = await users_col.find_one({"id": driver_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    await users_col.update_one(
        {"id": driver_id},
        {"$set": {"driver_status": "none"}}
    )
    return {"ok": True}

@api.delete("/rides/{ride_id}")
async def delete_ride(ride_id: str, _=Depends(require_roles("admin"))):
    res = await rides_col.delete_one({"id": ride_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    return {"success": True, "message": "Viaje eliminado correctamente"}

@api.post("/admin/users/{user_id}/wallet")
async def adjust_user_wallet(user_id: str, body: WalletAdjustmentIn, _=Depends(require_roles("admin"))):
    target = await users_col.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    adj = float(body.amount)
    if adj == 0:
        raise HTTPException(status_code=400, detail="El monto no puede ser cero")
        
    new_bal = max(0.0, float(target.get("wallet_balance", 0)) + adj)
    await users_col.update_one({"id": user_id}, {"$set": {"wallet_balance": new_bal}})
    
    desc = body.description or ("Ajuste administrativo" if adj < 0 else "Recarga administrativa")
    
    await wallet_txns_col.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "adjustment" if adj < 0 else "recharge",
        "amount": adj,
        "description": desc,
        "created_at": utcnow_iso()
    })
    
    return {
        "success": True,
        "new_balance": new_bal,
        "message": f"Billetera ajustada con éxito en {adj:+.2f}$"
    }

@api.post("/admin/promocodes", response_model=PromoCodeOut)
async def create_promocode(body: PromoCodeIn, _=Depends(require_roles("admin"))):
    code_upper = body.code.strip().upper()
    if not code_upper:
        raise HTTPException(status_code=400, detail="Código inválido")
    exists = await promocodes_col.find_one({"code": code_upper})
    if exists:
        raise HTTPException(status_code=409, detail="El código de promoción ya existe")
    doc = {
        "code": code_upper,
        "discount_usd": float(body.discount_usd),
        "recharge_amount_usd": float(body.recharge_amount_usd),
        "active": True,
        "created_at": utcnow_iso()
    }
    await promocodes_col.insert_one(doc)
    return doc

@api.get("/admin/promocodes", response_model=List[PromoCodeOut])
async def list_promocodes(_=Depends(require_roles("admin"))):
    cursor = promocodes_col.find({}, {"_id": 0})
    return await cursor.to_list(length=100)

@api.delete("/admin/promocodes/{code}")
async def delete_promocode(code: str, _=Depends(require_roles("admin"))):
    code_upper = code.strip().upper()
    res = await promocodes_col.delete_one({"code": code_upper})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Código no encontrado")
    return {"success": True}

@api.post("/promocodes/apply")
async def apply_promocode(body: ApplyPromoIn, user=Depends(get_current_user)):
    code_upper = body.code.strip().upper()
    promo = await promocodes_col.find_one({"code": code_upper, "active": True})
    if not promo:
        raise HTTPException(status_code=404, detail="Código inválido o inactivo")
    
    used_key = f"used_promo_{code_upper}"
    if user.get(used_key):
        raise HTTPException(status_code=400, detail="Ya has canjeado este código promocional")
    
    await users_col.update_one({"id": user["id"]}, {"$set": {used_key: True}})
    
    added_bal = float(promo.get("recharge_amount_usd", 0))
    if added_bal > 0:
        new_bal = float(user.get("wallet_balance", 0)) + added_bal
        await users_col.update_one({"id": user["id"]}, {"$set": {"wallet_balance": new_bal}})
        
        await wallet_txns_col.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "type": "bonus",
            "amount": added_bal,
            "description": f"Código Promocional {code_upper}",
            "created_at": utcnow_iso()
        })
        
    return {
        "success": True,
        "message": f"Código {code_upper} canjeado correctamente",
        "added_balance": added_bal,
        "discount_usd": float(promo.get("discount_usd", 0))
    }

@api.get("/admin/drivers/locations")
async def admin_drivers_locations(_=Depends(require_roles("admin"))):
    drivers = await users_col.find(
        {"role": "driver", "is_online": True, "lat": {"$ne": None}},
        {"id": 1, "name": 1, "lat": 1, "lng": 1, "phone": 1, "_id": 0}
    ).to_list(100)
    return drivers

@api.post("/admin/users/{user_id}/toggle-active")
async def admin_toggle_user_active(user_id: str, _=Depends(require_roles("admin"))):
    target = await users_col.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    current_state = bool(target.get("is_active", True))
    new_state = not current_state
    
    await users_col.update_one({"id": user_id}, {"$set": {"is_active": new_state}})
    return {"success": True, "is_active": new_state}

@api.post("/admin/push")
async def admin_send_push_notification(body: PushNotificationIn, _=Depends(require_roles("admin"))):
    doc = {
        "id": str(uuid.uuid4()),
        "title": body.title.strip(),
        "body": body.body.strip(),
        "target": body.target,
        "user_id": body.user_id,
        "created_at": utcnow_iso()
    }
    await notifications_col.insert_one(doc)
    return {"success": True, "message": "Notificación enviada con éxito"}

@api.get("/notifications")
async def get_user_notifications(user=Depends(get_current_user)):
    # Fetch notifications that match:
    # 1. Target is "all"
    # 2. Target is "passengers" and user is a passenger
    # 3. Target is "drivers" and user is a driver
    # 4. Target is "individual" and user_id is this user's ID
    role_target = "passengers" if user["role"] == "passenger" else "drivers"
    query = {
        "$or": [
            {"target": "all"},
            {"target": role_target},
            {"target": "individual", "user_id": user["id"]}
        ]
    }
    cursor = notifications_col.find(query, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(length=100)
    return items

@api.get("/admin/bots-status")
async def admin_bots_status(_=Depends(require_roles("admin"))):
    config = await config_col.find_one({"_id": "bots"})
    enabled = config.get("enabled", True) if config else True
    return {"bots_enabled": enabled}

@api.post("/admin/toggle-bots")
async def admin_toggle_bots(_=Depends(require_roles("admin"))):
    config = await config_col.find_one({"_id": "bots"})
    current = config.get("enabled", True) if config else True
    new_state = not current
    await config_col.update_one({"_id": "bots"}, {"$set": {"enabled": new_state}}, upsert=True)
    
    # Update simulated driver online states
    await users_col.update_many(
        {"email": {"$in": [d["email"] for d in SEED_DRIVERS] + ["conductor@rideve.com"]}},
        {"$set": {"is_online": new_state}}
    )
    return {"success": True, "bots_enabled": new_state}

# ============================================================
# Health
# ============================================================

@api.get("/")
async def root():
    return {"app": "RideVE", "status": "ok"}

from fastapi.staticfiles import StaticFiles

# Mount static files at /donatex
static_dir = ROOT_DIR / "static-admin"
static_dir.mkdir(exist_ok=True)
app.mount("/donatex", StaticFiles(directory=static_dir, html=True), name="static-admin")

app.include_router(api)
