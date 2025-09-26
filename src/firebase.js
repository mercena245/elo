
// Importa os módulos principais do Firebase para uso no projeto
import { initializeApp } from "firebase/app"; // Inicialização do app
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"; // Autenticação
import { getDatabase, ref, get, set, push, remove } from "firebase/database"; // Realtime Database
import { getFunctions, httpsCallable } from "firebase/functions"; // Cloud Functions


// Configuração do Firebase do projeto (NUNCA expor em repositórios públicos)
const firebaseConfig = {
  apiKey: "AIzaSyBoY8kGVTZjRnneyxPRfyLaq_ePjgFNNrY", // Chave de API do projeto
  authDomain: "elo-school.firebaseapp.com", // Domínio de autenticação
  projectId: "elo-school", // ID do projeto
  storageBucket: "elo-school.firebasestorage.app", // Bucket de storage
  messagingSenderId: "403961922767", // ID do serviço de mensagens
  appId: "1:403961922767:web:89ffe1a7ebe6be3e9a23ba", // ID do app
  measurementId: "G-KK8W77MLYT" // ID de analytics
};


// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o módulo de autenticação e provedor Google
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Inicializa o Realtime Database
const db = getDatabase(app);

// Inicializa as Cloud Functions e define função callable para exclusão de usuário
const functions = getFunctions(app);
const deleteUserFunction = httpsCallable(functions, "deleteUser");


// Exporta os módulos principais para uso em todo o projeto
export { app, auth, provider, signInWithPopup, db, ref, get, set, push, remove, deleteUserFunction };
