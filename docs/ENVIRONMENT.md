# Variables de Entorno — Ruedalo ENVIRONMENT

Este documento describe todas las variables de entorno necesarias para correr el proyecto Ruedalo.app tanto en desarrollo local como en producción.

---

## 🔑 Variables de Entorno Obligatorias (Frontend .env)

Crea un archivo `.env` en la carpeta `frontend/` con las siguientes propiedades:

| Nombre Variable | Descripción | ¿Es Obligatoria? | Valor de Ejemplo |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_BACKEND_URL` | URL del servidor local de desarrollo o del VPS de producción. | Sí | `https://ride-hail-firebase.preview.emergentagent.com` |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Clave API de la consola de Firebase. | Sí | `AIzaSyBzsybeLDdXmxiF4...` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación de tu proyecto de Firebase. | Sí | `ruedaloapp-8db21.firebaseapp.com` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | ID único del proyecto de Firebase. | Sí | `ruedaloapp-8db21` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Cubeta de almacenamiento de Firebase Storage. | Sí | `ruedaloapp-8db21.appspot.com` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Identificador del remitente de mensajería (FCM). | Sí | `109884111046` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Identificador de aplicación de Firebase. | Sí | `1:109884111046:web:b5a4...` |

---

## 🛡️ Notas de Seguridad Críticas

1.  **Exclusión del Repositorio:** El archivo `.env` **NUNCA** debe ser subido al repositorio de GitHub. Para ello, ya está configurado en el `.gitignore`.
2.  **Credenciales Administrativas:** Los archivos JSON de claves privadas de cuentas de servicio de Firebase (`serviceAccount.json`) nunca deben subirse al repositorio ni guardarse en el frontend. La comunicación segura se maneja mediante Cloud Functions autenticadas del lado del servidor.
