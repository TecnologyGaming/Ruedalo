# Guía Completa de Despliegue: GitHub, Hostinger VPS y Firebase (Base de Datos y Auth)

Esta guía te proporcionará los pasos exactos y detallados para subir el proyecto a **GitHub**, desplegar el backend en tu **VPS de Hostinger** y conectar la aplicación móvil y el backend con **Firebase** (para autenticación por teléfono y base de datos Firestore).

---

## 📁 PARTE 1: Guardar el Proyecto en GitHub

Sigue estos pasos en tu terminal local para inicializar el repositorio y subir la aplicación de forma segura.

### 1. Inicializar el Repositorio de Git
Abre la terminal en la carpeta raíz del proyecto (`/app`) y ejecuta:
```bash
# Inicializar repositorio git
git init

# Crear archivo .gitignore para evitar subir archivos sensibles o temporales
cat <<EOF > .gitignore
# Node
node_modules/
.expo/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.pytest_cache/
venv/
.env

# Mobile
android/
ios/
*.apk
*.aab
*.ipa
EOF
```

### 2. Guardar los Cambios
```bash
git add .
git commit -m "feat: rediseño visual tipo Yango/Ridery, simulación Firebase Phone Auth, registro de Cédula y Switch Pasajero/Conductor"
```

### 3. Crear el Repositorio en GitHub y Subir el Código
1. Ve a [GitHub](https://github.com) y crea un nuevo repositorio llamado `rideve-app` (público o privado).
2. Vincula el repositorio local con GitHub y súbelo:
```bash
# Cambiar la rama principal a 'main'
git branch -M main

# Añadir la URL de tu repositorio remoto de GitHub
git remote add origin https://github.com/TU_USUARIO_DE_GITHUB/rideve-app.git

# Subir el código por primera vez
git push -u origin main
```

---

## 🛡️ PARTE 2: Configuración de Firebase (Auth y Firestore)

A diferencia de MongoDB, Firebase ofrece Autenticación por Teléfono nativa (Firebase Phone Auth) y base de datos en tiempo real NoSQL (Firestore).

### 1. Crear el Proyecto en Firebase
1. Ingresa a la [Consola de Firebase](https://console.firebase.google.com/).
2. Haz clic en **Agregar proyecto** y nómbralo `RideVE`.
3. Haz clic en **Crear proyecto** (puedes desactivar Google Analytics para simplificar).

### 2. Configurar Firebase Phone Auth (Autenticación Telefónica)
1. En el menú izquierdo de Firebase, ve a **Build (Construcción)** > **Authentication**.
2. Haz clic en **Comenzar (Get Started)**.
3. En la pestaña **Método de inicio de sesión**, selecciona **Teléfono**.
4. Habilita la opción y guarda los cambios.
5. *(Opcional)* Para pruebas locales, despliega la sección **Números de teléfono para pruebas** y añade tus números simulados:
   - Número: `+584141111111` con código de verificación: `123456` (Pasajero)
   - Número: `+584142222222` con código de verificación: `123456` (Conductor)
   - Número: `+584140000000` con código de verificación: `123456` (Admin)

### 3. Configurar Firebase Firestore (Base de Datos)
1. En el menú izquierdo, ve a **Build (Construcción)** > **Firestore Database**.
2. Haz clic en **Crear base de datos**.
3. Selecciona la ubicación de la base de datos (se recomienda `us-central1` o la más cercana a Venezuela).
4. Elige **Iniciar en modo de prueba** (esto habilita permisos rápidos para comenzar) y haz clic en **Habilitar**.

### 4. Obtener las Claves de API de Firebase
1. En la parte superior de la consola de Firebase, haz clic en el ícono de engranaje (Configuración del proyecto) > **Configuración del proyecto**.
2. En la pestaña **General**, desplázate hacia abajo hasta **Tus apps** y haz clic en el ícono de **Web** (`</>`) o **Android** / **iOS** para registrar la app.
3. Registra tu app con el nombre `RideVE App`.
4. Firebase te mostrará un objeto de configuración similar a este:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "rideve-xxxxx.firebaseapp.com",
     projectId: "rideve-xxxxx",
     storageBucket: "rideve-xxxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456:web:abcd"
   };
   ```
5. Guarda estos datos, los usaremos en el archivo `.env` de Expo Frontend.

---

## 🖥️ PARTE 3: Despliegue del Backend en el VPS de Hostinger

Para desplegar tu backend en FastAPI en un VPS de Hostinger con Ubuntu, sigue estos pasos guiados de nivel profesional.

### 1. Conectarte a tu VPS por SSH
```bash
ssh root@IP_DE_TU_VPS
```

### 2. Instalar Dependencias del Sistema
```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python, pip, Nginx, Supervisor y Git
sudo apt install python3-pip python3-venv nginx supervisor git -y
```

### 3. Clonar el Código del Proyecto
```bash
cd /var/www
git clone https://github.com/TU_USUARIO_DE_GITHUB/rideve-app.git
cd rideve-app/backend
```

### 4. Configurar el Entorno Virtual y Dependencias de Python
```bash
# Crear entorno virtual de Python
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Instalar las librerías del backend
pip install -r requirements.txt
```

### 5. Adaptar el Backend para Conectar Directamente a Firestore
Si decides usar Firestore en lugar de MongoDB, puedes utilizar la librería oficial de Python `firebase-admin` para migrar las colecciones. A continuación se muestra cómo inicializar el cliente de Firestore en `server.py`:

1. Instala `firebase-admin` en el VPS:
   ```bash
   pip install firebase-admin
   ```
2. Obtén un archivo JSON de credenciales de Firebase:
   - En Firebase Console > Configuración del proyecto > **Cuentas de servicio**.
   - Haz clic en **Generar nueva clave privada**.
   - Guarda el archivo JSON descargado en `/var/www/rideve-app/backend/firebase-key.json`.

3. Modifica la inicialización de la base de datos en `backend/server.py` para usar Firestore:
   ```python
   import firebase_admin
   from firebase_admin import credentials, firestore

   # Inicializar Firebase Admin
   cred = credentials.Certificate("firebase-key.json")
   firebase_admin.initialize_app(cred)

   # Cliente de Base de Datos Firestore
   db = firestore.client()

   # Mapear las colecciones tradicionales a documentos de Firestore
   users_col = db.collection("users")
   rides_col = db.collection("rides")
   recharges_col = db.collection("recharges")
   ```

### 6. Configurar las Variables de Entorno (.env)
Crea el archivo `/var/www/rideve-app/backend/.env` en tu VPS:
```ini
JWT_SECRET=UnSecretoSuperSeguroParaProduccion123!
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
ADMIN_EMAIL=admin@rideve.com
ADMIN_PASSWORD=AdminProduccion123!
# Si usas MongoDB de respaldo
MONGO_URL=mongodb://localhost:27017
DB_NAME=rideve
```

### 7. Configurar Supervisor para Mantener Vivo el Backend
Crea el archivo `/etc/supervisor/conf.d/rideve-backend.conf`:
```ini
[program:backend]
directory=/var/www/rideve-app/backend
command=/var/www/rideve-app/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
autostart=true
autorestart=true
stderr_logfile=/var/log/rideve_backend.err.log
stdout_logfile=/var/log/rideve_backend.out.log
user=root
```
Recarga Supervisor para iniciar el backend:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status
```

### 8. Configurar Nginx como Proxy Inverso con HTTPS
Crea el archivo `/etc/nginx/sites-available/rideve`:
```nginx
server {
    listen 80;
    server_name tu-dominio-vps.com;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Activa el sitio en Nginx y añade el certificado SSL gratis de Let's Encrypt:
```bash
sudo ln -s /etc/nginx/sites-available/rideve /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# Instalar Certbot para SSL HTTPS automático
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio-vps.com
```

---

## 📱 PARTE 4: Conectar la App Móvil (Expo Frontend) con Firebase

### 1. Configurar las variables de entorno de Expo
Crea o edita `/app/frontend/.env` en tu entorno local:
```ini
# Conexión al backend de tu VPS Hostinger
EXPO_PUBLIC_BACKEND_URL=https://tu-dominio-vps.com

# Credenciales de Firebase de la Consola
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=rideve-xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=rideve-xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=rideve-xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456:web:abcd
```

### 2. Instalar el SDK de Firebase en la App Móvil
Para dar soporte nativo a Firebase en tu aplicación móvil de Expo, ejecuta lo siguiente en la terminal local de tu carpeta `frontend/`:
```bash
yarn expo install firebase
```

### 3. Inicializar Firebase en el Frontend de la App Móvil
Crea un archivo de configuración en `frontend/src/lib/firebase.ts`:
```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configurar persistencia de autenticación móvil para mantener la sesión abierta
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { app, auth };
```

¡Listo! Con esto, tu arquitectura completa estará perfectamente integrada, ordenada, documentada y lista para producción en Venezuela con la mejor visual del mercado.
