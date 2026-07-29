# Inicialización de Consola Firebase — Ruedalo FIREBASE SETUP

Este documento provee la guía de pasos rápidos para configurar tu proyecto `ruedaloapp-8db21` en la Consola Oficial de Firebase.

---

## 🚀 Pasos de Configuración en la Consola

1.  **Habilitar Firestore Database:**
    *   Ve a **Build > Firestore Database** en el menú de Firebase.
    *   Haz clic en **Crear base de datos**, selecciona **Región (ej: us-central1)**, y elige **Iniciar en modo producción**.
    *   Sube el archivo `firestore.rules` del proyecto usando Firebase CLI o pegándolo directamente en la pestaña de Reglas.

2.  **Habilitar Firebase Storage:**
    *   Ve a **Build > Storage**.
    *   Haz clic en **Comenzar**, define la misma región de tu Firestore, y haz clic en **Listo**.
    *   Sube las reglas de `storage.rules` para proteger la carga de documentos de identidad.

3.  **Habilitar Firebase Auth (Phone Sign-In):**
    *   Ve a **Build > Authentication > Sign-in method**.
    *   Haz clic en **Agregar nuevo proveedor > Teléfono**, habilítalo y guarda los cambios.

4.  **Generar Credenciales del SDK para Cloud Functions:**
    *   Ve a **Configuración del Proyecto (Engranaje) > Cuentas de Servicio**.
    *   Haz clic en **Generar nueva clave privada** para descargar tu archivo de credenciales seguras de administración.
