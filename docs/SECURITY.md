# Reglas de Seguridad y Roles (Firebase Security Rules) — Ruedalo

Este documento describe la especificación técnica de seguridad de la plataforma Ruedalo.app.

---

## 🔐 1. Reglas de Firestore (`firestore.rules`)

Las reglas oficiales de seguridad protegen las transacciones de Wallet y evitan la manipulación no autorizada del modelo de datos:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función auxiliar: Usuario Autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Función auxiliar: Es dueño del recurso
    isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // 👥 Usuarios: Lectura y escritura exclusiva del dueño
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    // 📊 Estadísticas: Lectura por el usuario, escritura prohibida (exclusiva de Cloud Functions)
    match /users/{userId}/stats/{statId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if false;
    }
    
    // 🚗 Carreras y Envíos: Lectura por pasajero/conductor asociado, escritura por Cloud Functions
    match /rides/{rideId} {
      allow read: if isAuthenticated() && (resource.data.passenger_id == request.auth.uid || resource.data.driver_id == request.auth.uid);
      allow write: if false; // Sólo Cloud Functions escribe
    }
    match /deliveries/{deliveryId} {
      allow read: if isAuthenticated() && (resource.data.sender_id == request.auth.uid || resource.data.driver_id == request.auth.uid);
      allow write: if false;
    }
    
    // 📒 Wallet Transactions (Ledger): Lectura por el dueño, escrituras bloqueadas para el cliente
    match /wallet_transactions/{txnId} {
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      allow write: if false; // Estricto: Sólo Cloud Functions escribe
    }
    
    // 🏷️ Servicios y Tarifas: Lectura pública autenticada, escritura bloqueada para clientes
    match /service_types/{serviceId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    match /pricing/{serviceId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    
    // ⚙️ Configuraciones: Lectura pública autenticada, escritura bloqueada
    match /configs/{configId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
  }
}
```

---

## 🪪 2. Definición de Roles del Ecosistema

Soportamos los siguientes roles para asegurar la granularidad del control de accesos:

*   `passenger`: El rol predeterminado. Puede solicitar carreras, envíos y recargar su billetera.
*   `driver`: El rol de conductor aprobado. Puede aceptar viajes y ganar comisiones.
*   `support`: Personal de soporte técnico para verificar cédulas y resolver incidencias de Wallet.
*   `admin`: Administradores operativos para ajustar tarifas, comisiones y revisar reportes financieros.
*   `super_admin`: Acceso maestro para configuraciones avanzadas del sistema y Feature Flags globales.
