import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDkXNCt7wCgpjew66EjbJ6jWR3SkpoE68g",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "ruedaloapp-8db21.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "ruedaloapp-8db21",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "ruedaloapp-8db21.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "240937295240",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:240937295240:web:7ed992d104198aee89ee3d"
};

// Inicializar Firebase App de forma única
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializar Firestore
const db = getFirestore(app);

// Inicializar Storage
const storage = getStorage(app);

// Stub de autenticación web para evitar el dual-package hazard de Metro en la vista previa del navegador
const auth = {
  settings: {},
  signOut: async () => {},
  onAuthStateChanged: (cb: any) => {
    return () => {};
  }
};

export { app, auth, db, storage };
