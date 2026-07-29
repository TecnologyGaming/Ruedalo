# Arquitectura del Sistema — Plataforma Ruedalo

Este documento define la arquitectura oficial de software de **Ruedalo.app**, un ecosistema de movilidad y logística serverless, escalable, inmutable y diseñado para operar a gran escala.

---

## 🏗️ 1. Arquitectura 100% Serverless con Firebase

La plataforma elimina por completo los backends monolíticos tradicionales. Toda la computación y la lógica se distribuyen en componentes desacoplados y autoadministrados:

```
[ Cliente Móvil Pasajero ]      [ Cliente Móvil Conductor ]
          │                                  │
          ▼                                  ▼
 ────────────────────────────────────────────────────────
                      Firebase SDK
 ────────────────────────────────────────────────────────
          │                  │                   │
          ▼                  ▼                   ▼
 [ Firebase Auth ]   [ Cloud Firestore ]   [ Cloud Storage ]
          │                  │                   │
          ▼                  ▼                   │
 ────────────────────────────────────────────────│───────
                 Cloud Functions                 │
 ────────────────────────────────────────────────│───────
          │                                      │
          ▼                                      ▼
 [ Ledger Financiero, ]                  [ Fotos de Cédula ]
 [ Tarifas y Negocio  ]
```

---

## 📦 2. Capas de Responsabilidad

1.  **Frontend (React Native + Expo):** Cliente visual puro. No contiene lógica de negocio (tarifas, promociones, cálculo de comisiones, ni referidos). Solo renderiza el Design System oficial e interactúa con Firebase.
2.  **Firebase Authentication:** Motor de registro e inicio de sesión seguro mediante número de teléfono (Phone Auth) y validación por SMS.
3.  **Cloud Firestore:** Base de datos NoSQL documental en tiempo real. Configurada de forma no redundante para ser el motor dinámico de la plataforma.
4.  **Cloud Storage:** Repositorio binario seguro para imágenes (cédulas de identidad, licencias, fotos de perfil).
5.  **Cloud Functions:** Única capa donde reside la lógica de negocio. Toda acción sensible (solicitudes, Wallet Ledger, asignaciones, promociones y estadísticas) se realiza exclusivamente por funciones de servidor inmutables.

---

## 🛠️ 3. Características de Ingeniería Clave

*   **Libro Mayor (Ledger-based Wallet):** Ningún usuario tiene un campo de saldo estático modificable. El saldo se calcula sumando dinámicamente sus registros contables en `wallet_transactions`.
*   **Separación de Servicios y Tarifas:** `service_types` almacena únicamente las características del servicio (íconos, descripción), mientras que `pricing` administra las tarifas (precio base, precio/km, tarifas dinámicas).
*   **Feature Flags y Configuración Centralizada:** Toda regla operativa puede cambiarse en caliente modificando los documentos correspondientes en Firestore, sin publicar nuevas versiones a las tiendas móviles.
*   **Arquitectura Multiaplicación:** Diseñada desde el día uno para que el mismo backend de Firebase, Firestore, Storage y Cloud Functions sea compartido tanto por la app de Pasajeros como por la futura app de Conductores (`Ruedalo Driver`), diferenciándolas únicamente mediante roles y permisos de seguridad.
