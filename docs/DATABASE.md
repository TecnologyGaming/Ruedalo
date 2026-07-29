# Diseño de Base de Datos (Cloud Firestore) — Ruedalo

Este documento describe la especificación formal No-Redundante del modelo de base de datos de Ruedalo en **Cloud Firestore**.

---

## 📁 1. Colecciones y Documentos

### 👥 A. `/users/{userId}`
Almacena el perfil principal del usuario pasadero o conductor.
```json
{
  "id": "string (Firebase UID)",
  "name": "string",
  "email": "string",
  "phone": "string (con formato internacional +58...)",
  "referral_code": "string (código de invitación único)",
  "referred_by": "string (UID del invitador o null)",
  "identity_status": "string (pending | approved | rejected | future_review)",
  "role": "string (passenger | driver | support | admin | super_admin)",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 🛵 B. `/users/{userId}/stats/general`
Documento independiente para almacenar las estadísticas de uso procesadas por el servidor.
```json
{
  "completed_rides": 0,
  "cancelled_rides": 0,
  "referral_count": 0,
  "streak_days": 0,
  "reward_points": 0,
  "total_spent_usd": 0.0,
  "total_earned_usd": 0.0,
  "updated_at": "timestamp"
}
```

### 🚗 C. `/rides/{rideId}`
Almacena las solicitudes de carreras de movilidad y logística de pasajeros.
```json
{
  "id": "string",
  "passenger_id": "string (UID)",
  "passenger_name": "string",
  "passenger_phone": "string",
  "driver_id": "string (UID o null)",
  "driver_name": "string o null",
  "driver_phone": "string o null",
  "origin": { "lat": 10.4998, "lng": -66.8517, "address": "string" },
  "destination": { "lat": 10.5200, "lng": -66.8200, "address": "string" },
  "service_type": "string (moto | economico | confort | xl)",
  "price_usd": 5.80,
  "amount_bs": 223.30,
  "exchange_rate_used": 38.5,
  "exchange_rate_provider": "bcv",
  "status": "string (requested | accepted | in_progress | completed | cancelled)",
  "order_for_others": false,
  "other_passenger_name": "string o null",
  "other_passenger_phone": "string o null",
  "instructions": "string o null",
  "created_at": "timestamp",
  "accepted_at": "timestamp o null",
  "completed_at": "timestamp o null"
}
```

### 📦 D. `/deliveries/{deliveryId}`
Almacena las solicitudes de entregas de mercancía o mensajería express.
```json
{
  "id": "string",
  "sender_id": "string (UID)",
  "origin": { "lat": "number", "lng": "number", "address": "string" },
  "destination": { "lat": "number", "lng": "number", "address": "string" },
  "service_type": "string (delivery | paquete)",
  "price_usd": 3.50,
  "amount_bs": 134.75,
  "exchange_rate_used": 38.5,
  "exchange_rate_provider": "bcv",
  "status": "string (requested | accepted | in_progress | completed | cancelled)",
  "instructions": "string o null",
  "package_details": {
    "size": "string (pequeño | mediano | grande)",
    "weight_kg": 2.5
  },
  "created_at": "timestamp"
}
```

### 📒 E. `/wallet_transactions/{transactionId}`
Libro Mayor (Ledger) contable inmutable multidivisa.
```json
{
  "id": "string",
  "user_id": "string (UID)",
  "amount": 2.50,
  "currency": "string (USD | VES)",
  "exchange_rate_used": 38.5,
  "type": "string (welcome_bonus | referral_bonus | ride_payment | manual_recharge)",
  "description": "string (Bono de Bienvenida)",
  "balance_after": 4.00,
  "created_at": "timestamp"
}
```

### 🏷️ F. `/service_types/{serviceId}`
Define únicamente las propiedades funcionales y estéticas de cada tipo de servicio.
```json
{
  "id": "moto",
  "name": "Moto123",
  "description": "¡Casco obligatorio limpio incluido!",
  "icon": "bike",
  "category": "ride",
  "enabled": true
}
```

### 💰 G. `/pricing/{serviceId}`
Almacena los esquemas de tarifas dinámicas de forma desacoplada de los servicios.
```json
{
  "service_id": "moto",
  "base_price": 1.80,
  "minimum_price": 2.00,
  "included_distance_km": 1.0,
  "included_time_min": 5.0,
  "price_per_km": 0.40,
  "price_per_min": 0.05,
  "surge_multiplier": 1.0,
  "city": "caracas",
  "rules_schedule": "none"
}
```

---

## 🔍 2. Índices de Rendimiento Requeridos
Se deben definir los siguientes índices compuestos en `firestore.indexes.json` para producción:
1.  Colección `rides`: `passenger_id` (Asc) + `status` (Asc) + `created_at` (Desc).
2.  Colección `wallet_transactions`: `user_id` (Asc) + `created_at` (Desc).
