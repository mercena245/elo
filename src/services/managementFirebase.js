// Configuração Firebase para o sistema de gerenciamento multi-tenant
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, child, update, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase para gerenciamento
const managementFirebaseConfig = {
  apiKey: "AIzaSyBoY8kGVTZjRnneyxPRfyLaq_ePjgFNNrY",
  authDomain: "elo-school.firebaseapp.com",
  databaseURL: "https://gerenciamento-elo-school.firebaseio.com/",
  projectId: "elo-school",
  storageBucket: "elo-school.firebasestorage.app",
  messagingSenderId: "403961922767",
  appId: "1:403961922767:web:89ffe1a7ebe6be3e9a23ba",
  measurementId: "G-KK8W77MLYT"
};

// Inicializar app de gerenciamento (verificar se já existe)
let managementApp;
try {
  // Tenta pegar o app existente
  managementApp = getApp('management');
} catch {
  // Se não existe, inicializa
  managementApp = initializeApp(managementFirebaseConfig, 'management');
}

const managementDb = getDatabase(managementApp);
const managementAuth = getAuth(managementApp);
const managementStorage = getStorage(managementApp);

export {
  managementApp,
  managementDb,
  managementAuth,
  managementStorage,
  ref,
  set,
  get,
  push,
  child,
  update,
  remove
};