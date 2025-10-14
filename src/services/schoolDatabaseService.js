/**
 * School Database Service
 * 
 * Gerencia conexões dinâmicas aos bancos de dados específicos de cada escola.
 * Cada escola tem seu próprio Firebase Database e Storage, isolando completamente os dados.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, set, push, update, remove, onValue } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Cache de instâncias do Firebase por escola
const schoolApps = new Map();
const schoolDatabases = new Map();
const schoolStorages = new Map();

// Configuração mínima do Firebase (apenas para client-side)
const getFirebaseConfig = (schoolData) => {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: `${schoolData.projectId}.firebaseapp.com`,
    databaseURL: schoolData.databaseURL,
    projectId: schoolData.projectId,
    storageBucket: schoolData.storageBucket,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };
};

/**
 * Inicializa ou recupera a instância do Firebase App para uma escola específica
 * @param {Object} schoolData - Dados da escola contendo databaseURL, storageBucket, projectId
 * @returns {Object} Firebase App instance
 */
export const getSchoolApp = (schoolData) => {
  if (!schoolData || !schoolData.projectId) {
    throw new Error('Dados da escola inválidos ou projectId não fornecido');
  }

  const { projectId } = schoolData;

  // Retorna do cache se já existe
  if (schoolApps.has(projectId)) {
    return schoolApps.get(projectId);
  }

  // Verifica se já existe uma app com esse nome
  const existingApp = getApps().find(app => app.name === projectId);
  if (existingApp) {
    schoolApps.set(projectId, existingApp);
    return existingApp;
  }

  // Cria nova instância
  const config = getFirebaseConfig(schoolData);
  const app = initializeApp(config, projectId);
  
  schoolApps.set(projectId, app);
  console.log(`✅ Firebase App inicializado para escola: ${schoolData.nome} (${projectId})`);
  
  return app;
};

/**
 * Obtém a instância do Database para uma escola específica
 * @param {Object} schoolData - Dados da escola
 * @returns {Object} Firebase Database instance
 */
export const getSchoolDatabase = (schoolData) => {
  if (!schoolData || !schoolData.projectId) {
    throw new Error('Dados da escola inválidos');
  }

  const { projectId } = schoolData;

  // Retorna do cache se já existe
  if (schoolDatabases.has(projectId)) {
    return schoolDatabases.get(projectId);
  }

  // Inicializa app e database
  const app = getSchoolApp(schoolData);
  const database = getDatabase(app);
  
  schoolDatabases.set(projectId, database);
  console.log(`✅ Database conectado para: ${schoolData.nome}`);
  
  return database;
};

/**
 * Obtém a instância do Storage para uma escola específica
 * @param {Object} schoolData - Dados da escola
 * @returns {Object} Firebase Storage instance
 */
export const getSchoolStorage = (schoolData) => {
  if (!schoolData || !schoolData.projectId) {
    throw new Error('Dados da escola inválidos');
  }

  const { projectId } = schoolData;

  // Retorna do cache se já existe
  if (schoolStorages.has(projectId)) {
    return schoolStorages.get(projectId);
  }

  // Inicializa app e storage
  const app = getSchoolApp(schoolData);
  const storage = getStorage(app);
  
  schoolStorages.set(projectId, storage);
  console.log(`✅ Storage conectado para: ${schoolData.nome}`);
  
  return storage;
};

/**
 * Wrapper para operações de database com a escola específica
 */
export const schoolDatabaseOperations = (schoolData) => {
  const db = getSchoolDatabase(schoolData);

  return {
    /**
     * Cria uma referência para um caminho no database
     */
    ref: (path) => ref(db, path),

    /**
     * Busca dados de um caminho
     */
    get: async (path) => {
      const dbRef = ref(db, path);
      const snapshot = await get(dbRef);
      return snapshot.exists() ? snapshot.val() : null;
    },

    /**
     * Define/atualiza dados em um caminho
     */
    set: async (path, data) => {
      const dbRef = ref(db, path);
      await set(dbRef, data);
    },

    /**
     * Adiciona novo item (push) em uma lista
     */
    push: async (path, data) => {
      const dbRef = ref(db, path);
      const newRef = push(dbRef);
      await set(newRef, data);
      return newRef.key;
    },

    /**
     * Atualiza campos específicos
     */
    update: async (path, updates) => {
      const dbRef = ref(db, path);
      await update(dbRef, updates);
    },

    /**
     * Remove dados de um caminho
     */
    remove: async (path) => {
      const dbRef = ref(db, path);
      await remove(dbRef);
    },

    /**
     * Listener em tempo real
     */
    onValue: (path, callback) => {
      const dbRef = ref(db, path);
      return onValue(dbRef, callback);
    }
  };
};

/**
 * Wrapper para operações de storage com a escola específica
 */
export const schoolStorageOperations = (schoolData) => {
  const storage = getSchoolStorage(schoolData);

  return {
    /**
     * Cria uma referência para um arquivo no storage
     */
    ref: (path) => storageRef(storage, path),

    /**
     * Faz upload de um arquivo
     */
    upload: async (path, file, metadata = {}) => {
      const fileRef = storageRef(storage, path);
      const snapshot = await uploadBytes(fileRef, file, metadata);
      const url = await getDownloadURL(snapshot.ref);
      return { snapshot, url };
    },

    /**
     * Obtém URL de download de um arquivo
     */
    getDownloadURL: async (path) => {
      const fileRef = storageRef(storage, path);
      return await getDownloadURL(fileRef);
    },

    /**
     * Remove um arquivo
     */
    delete: async (path) => {
      const fileRef = storageRef(storage, path);
      await deleteObject(fileRef);
    }
  };
};

/**
 * Limpa o cache de uma escola específica (útil para logout ou troca de escola)
 */
export const clearSchoolCache = (projectId) => {
  if (projectId) {
    schoolApps.delete(projectId);
    schoolDatabases.delete(projectId);
    schoolStorages.delete(projectId);
    console.log(`🗑️ Cache limpo para escola: ${projectId}`);
  }
};

/**
 * Limpa todo o cache de escolas
 */
export const clearAllSchoolCaches = () => {
  schoolApps.clear();
  schoolDatabases.clear();
  schoolStorages.clear();
  console.log('🗑️ Cache de todas as escolas limpo');
};

export default {
  getSchoolApp,
  getSchoolDatabase,
  getSchoolStorage,
  schoolDatabaseOperations,
  schoolStorageOperations,
  clearSchoolCache,
  clearAllSchoolCaches
};
