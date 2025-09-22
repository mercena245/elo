// Substitua os valores abaixo pelas credenciais do seu projeto Firebase
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getDatabase, ref, get, set, push, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBoY8kGVTZjRnneyxPRfyLaq_ePjgFNNrY",
  authDomain: "elo-school.firebaseapp.com",
  projectId: "elo-school",
  storageBucket: "elo-school.firebasestorage.app",
  messagingSenderId: "403961922767",
  appId: "1:403961922767:web:89ffe1a7ebe6be3e9a23ba",
  measurementId: "G-KK8W77MLYT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

export { auth, provider, signInWithPopup, db, ref, get, set, push, remove };
