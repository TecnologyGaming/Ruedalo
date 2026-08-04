import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// Inicializar Autenticación de forma multiplataforma
const auth = Platform.OS === "web"
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

// Inicializar Firestore
const db = getFirestore(app);

// Inicializar Storage
const storage = getStorage(app);

export { app, auth, db, storage };
