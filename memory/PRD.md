# RideVE - Product Requirements Document

## Overview
**RideVE** is a native ride-hailing mobile app built specifically for the Venezuelan market. Three roles, in-app wallet recharged via Pago Móvil (manual admin verification), real-time map with Google Maps, JWT auth, and a distinctive neon dark theme that avoids palettes used by local competitors (Ridery, Yummy, inDrive, DiDi).

## Tech Stack
- **Mobile**: Expo SDK 54, Expo Router (file-based), react-native-maps + Google Maps, react-native-keyboard-controller, lucide-react-native, expo-location, expo-font, expo-clipboard
- **Backend**: FastAPI + Motor (MongoDB) + JWT (PyJWT) + passlib/bcrypt
- **Storage**: MongoDB (users, rides, recharges, wallet_txns, messages, ratings, config)

## Roles & Flows
### Passenger
- Sign up / log in (email + password + phone + role)
- Map view with current location + nearby online drivers (within 8 km of Caracas)
- Pick a destination from quick list (5 Caracas landmarks) or search
- View estimated price (USD) + distance (km) + duration (min)
- Wallet balance check before allowing ride request (402 if insufficient)
- Tabs: Inicio (map) · Viajes (history) · Wallet · Perfil
- Wallet: see balance in USD + Bs equivalent, recharge via Pago Móvil (sends reference, awaits admin approval)
- Chat with assigned driver in-ride
- Rate driver 1-5 stars after completion

### Driver
- Sign up as driver
- Toggle "En línea" (sets is_online + location)
- See list of nearby ride requests with price/distance
- Accept ride → Start ride → Complete ride (auto-debits passenger, credits 85% to driver)
- Tabs: Conducir · Ganancias · Historial · Perfil
- Chat with passenger
- 5 simulated drivers seeded near Plaza Altamira for realism

### Admin
- Login: `admin@rideve.com / Admin1234!`
- Stats: total users, drivers online, completed rides, pending recharges
- Recharges queue: approve (credits user wallet + creates transaction) or reject
- Users list (role badges + balance + online status)
- Bank config (editable): banco, cédula, teléfono, titular, tasa BCV

## Key Backend Endpoints (all prefixed `/api`)
- `POST /auth/{register,login}` · `GET /auth/me`
- `POST /rides/{estimate,request}` · `GET /rides/{mine,active,available}` · `POST /rides/{id}/{accept,start,complete,cancel}` · `POST /rides/rate`
- `GET /drivers/nearby?lat&lng` · `POST /drivers/{location,online}`
- `GET /wallet/{history,bank-config,my-recharges}` · `POST /wallet/recharge`
- `GET/POST /messages/{ride_id}`
- `GET /admin/{recharges,users,rides,stats}` · `POST /admin/recharges/{id}/{approve,reject}` · `PUT /admin/bank-config`

## Design System
- **Background**: deep void `#0B0C10` / surface `#14151F` / elevated `#1F2133`
- **Primary**: magenta `#FF007F` (passenger CTAs)
- **Secondary**: cyan `#00E5FF` (driver/wallet)
- **Fonts**: Outfit + DM Sans (loaded via expo-font URL)
- **Components**: NeonButton, FieldInput, RideMap (platform-split), Toast host

## Seed Data
- Admin: `admin@rideve.com / Admin1234!`
- Demo passenger ($25 USD wallet): `pasajero@rideve.com / Demo1234!`
- Demo driver (online, Plaza Altamira): `conductor@rideve.com / Demo1234!`
- 5 simulated drivers (Carlos M, Andrea P, José R, María L, Pedro Z) online near Caracas
- Bank config defaults: Banco de Venezuela, V-12345678, 0414-1234567, tasa 38.5 Bs/USD

## Tested (Iteration 1)
- 25/25 backend pytest tests PASS (auth, RBAC, wallet, rides, chat, ratings, admin)
- Frontend login + passenger map + wallet + driver online + admin recharges all render & respond on web preview
