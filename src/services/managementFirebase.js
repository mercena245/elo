// Configuração Firebase para o sistema de gerenciamento multi-tenant
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, child, update, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase para gerenciamento
const managementFirebaseConfig = {
  apiKey: "AIzaSyBmZL8l1HoZy7QlXvN0uTxI9VgTJfKY-8M",
  authDomain: "gerenciamento-elo-school.firebaseapp.com",
  databaseURL: "https://gerenciamento-elo-school.firebaseio.com/",
  projectId: "gerenciamento-elo-school",
  storageBucket: "gerenciamento-elo-school.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012"
};

// Inicializar app de gerenciamento
const managementApp = initializeApp(managementFirebaseConfig, 'management');
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