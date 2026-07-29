# Contratos de APIs y Cloud Functions — Ruedalo API

Este documento especifica las firmas de entrada y salida (contratos de datos) de la capa lógica serverless en Cloud Functions.

---

## 🧠 1. Funciones de Cómputo del Negocio

### 🚗 A. `estimateRide()`
Calcula de manera exacta la distancia, tiempo, precios originales y con descuento aplicable para un viaje o envío.
*   **Método:** `HTTPS Callable / Cloud Function`
*   **Entrada (JSON):**
    ```json
    {
      "origin": { "lat": 10.4998, "lng": -66.8517 },
      "destination": { "lat": 10.5200, "lng": -66.8200 },
      "service_type": "string (moto | economico | confort | xl | delivery)"
    }
    ```
*   **Salida (JSON):**
    ```json
    {
      "distance_km": 5.42,
      "duration_min": 14.5,
      "exchange_rate": 38.5,
      "price_usd": 5.05,
      "price_bs": 194.45,
      "original_price_usd": 5.20,
      "discount_applied_usd": 0.15,
      "saving_usd": 0.15
    }
    ```

### 💳 B. `calculateWallet()`
Suma dinámicamente todas las transacciones inmutables del Ledger del usuario y devuelve el saldo neto consolidado en USD y Bs.
*   **Entrada (JSON):** `{}` (Obtiene UID del token de Auth)
*   **Salida (JSON):**
    ```json
    {
      "balance_usd": 25.50,
      "balance_bs": 981.75,
      "exchange_rate": 38.5,
      "transactions_count": 14
    }
    ```

### 📒 C. `completeRide()`
Finaliza una carrera, debita la wallet del pasajero, acredita el saldo del conductor aplicando la comisión oficial de la empresa, y actualiza el contador de viajes del usuario en Firestore.
*   **Entrada (JSON):**
    ```json
    {
      "ride_id": "string (ID del viaje)"
    }
    ```
*   **Salida (JSON):**
    ```json
    {
      "status": "completed",
      "price_usd": 5.80,
      "passenger_balance_after": 19.70,
      "driver_earning_usd": 4.93
    }
    ```
