import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAEEjZaddufzwTxmlnW0TOx4sEUP3Md8YM",
  authDomain: "rawaaz-2002f.firebaseapp.com",
  projectId: "rawaaz-2002f",
  storageBucket: "rawaaz-2002f.firebasestorage.app",
  messagingSenderId: "204820379209",
  appId: "1:204820379209:web:fc9b99bae8d437c82cf198",
  measurementId: "G-7NT96MCV3N"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
