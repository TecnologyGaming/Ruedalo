# Guía de Instalación y Despliegue (Production Ready) — Ruedalo DEPLOYMENT

Esta guía documenta los pasos para subir el código a GitHub, configurar el proyecto en la consola de Firebase, y compilar la app con Expo EAS.

---

## 🛠️ 1. Configuración de Firebase y App Check
1.  Ingresa a [Firebase Console](https://console.firebase.google.com/).
2.  Crea un nuevo proyecto llamado `Ruedalo App` (`ruedaloapp-8db21`).
3.  Habilita **Authentication** > **Phone Sign-in** (añade tus números de teléfono para pruebas si los necesitas).
4.  Habilita **Firestore Database** en la región de tu preferencia.
5.  Habilita **Firebase Storage** para el almacenamiento de archivos e imágenes.
6.  Habilita **App Check** desde la sección de seguridad de Firebase Console para proteger tu Firestore y Storage de accesos fraudulentos o fuera de la app móvil.

---

## 🚀 2. Compilación del APK con Expo EAS CLI
Expo Application Services (EAS) permite generar las compilaciones nativas de producción de forma ultra-rápida.

### A. Instalar EAS CLI de manera global
```bash
npm install -g eas-cli
```

### B. Iniciar sesión en tu cuenta de Expo
```bash
eas login
```

### C. Configurar el proyecto para EAS
```bash
eas project:init --id TU_EXPO_PROJECT_ID
```

### D. Generar el APK de producción (Android)
```bash
eas build --platform android --profile production
```
Esto generará un enlace oficial de descarga del archivo APK / AAB listo para ser instalado en dispositivos físicos en Venezuela o subirse a Google Play Store.
