/**
 * School Database Service
 * 
 * Gerencia conexões dinâmicas aos bancos de dados específicos de cada escola.
 * Cada escola tem seu próprio Firebase Database e Storage, isolando completamente os dados.
 * 
 * IMPORTANTE: Para ambientes multi-tenant com múltiplos projetos Firebase,
 * cada projeto de escola deve ter as regras de segurança configuradas adequadamente.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, set, push, update, remove, onValue } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

// Cache de instâncias do Firebase por escola
const schoolApps = new Map();
const schoolDatabases = new Map();
const schoolStorages = new Map();
const schoolAuths = new Map();

// Configuração mínima do Firebase (apenas para client-side)
const getFirebaseConfig = (schoolData) => {
  // Se a escola tem credenciais próprias completas, usar elas
  if (schoolData.firebaseConfig?.apiKey) {
    console.log('🔑 [getFirebaseConfig] Usando credenciais específicas da escola');
    return {
      apiKey: schoolData.firebaseConfig.apiKey,
      authDomain: schoolData.firebaseConfig.authDomain || `${schoolData.projectId}.firebaseapp.com`,
      databaseURL: schoolData.databaseURL,
      projectId: schoolData.projectId,
      storageBucket: schoolData.storageBucket,
      messagingSenderId: schoolData.firebaseConfig.messagingSenderId,
      appId: schoolData.firebaseConfig.appId
    };
  }
  
  // Caso contrário, usar credenciais do projeto principal (multi-tenant no mesmo projeto)
  // Isso funciona quando todas as escolas estão no MESMO projeto Firebase
  // mas com diferentes Realtime Databases e Storage Buckets
  console.log('🔑 [getFirebaseConfig] Usando credenciais do projeto principal (multi-tenant)');
  
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBoY8kGVTZjRnneyxPRfyLaq_ePjgFNNrY',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gerenciamento-elo-school.firebaseapp.com',
    databaseURL: schoolData.databaseURL, // ← URL específica da escola
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gerenciamento-elo-school',
    storageBucket: schoolData.storageBucket, // ← Bucket específico da escola
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '403961922767',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:403961922767:web:89ffe1a7ebe6be3e9a23ba'
  };
  
  console.log('🔧 [getFirebaseConfig] Configuração gerada:', {
    databaseURL: config.databaseURL,
    storageBucket: config.storageBucket,
    projectId: config.projectId,
    usingSchoolSpecificResources: true
  });
  
  return config;
};

/**
 * Inicializa ou recupera a instância do Firebase App para uma escola específica
 * @param {Object} schoolData - Dados da escola contendo databaseURL, storageBucket, projectId, id
 * @returns {Object} Firebase App instance
 */
export const getSchoolApp = (schoolData) => {
  if (!schoolData || !schoolData.id) {
    throw new Error('Dados da escola inválidos ou ID não fornecido');
  }

  // Usar o ID da escola como identificador único (não o projectId que pode ser compartilhado)
  const appName = `school-${schoolData.id}`;

  // Retorna do cache se já existe
  if (schoolApps.has(appName)) {
    console.log(`♻️ [getSchoolApp] Usando cache para: ${schoolData.nome || schoolData.id}`);
    return schoolApps.get(appName);
  }

  // Verifica se já existe uma app com esse nome
  const existingApp = getApps().find(app => app.name === appName);
  if (existingApp) {
    console.log(`♻️ [getSchoolApp] App já existe: ${schoolData.nome || schoolData.id}`);
    schoolApps.set(appName, existingApp);
    return existingApp;
  }

  // Cria nova instância
  const config = getFirebaseConfig(schoolData);
  
  console.log(`🔧 [getSchoolApp] Criando nova app para: ${schoolData.nome || schoolData.id}`);
  console.log(`🔧 [getSchoolApp] App name: ${appName}`);
  console.log(`🔧 [getSchoolApp] Database URL: ${config.databaseURL}`);
  console.log(`🔧 [getSchoolApp] Storage Bucket: ${config.storageBucket}`);
  
  const app = initializeApp(config, appName);
  
  schoolApps.set(appName, app);
  console.log(`✅ Firebase App inicializado para escola: ${schoolData.nome || schoolData.id} (${appName})`);
  
  return app;
};

/**
 * Obtém a instância do Database para uma escola específica
 * @param {Object} schoolData - Dados da escola
 * @returns {Object} Firebase Database instance
 */
export const getSchoolDatabase = (schoolData) => {
  if (!schoolData || !schoolData.id) {
    throw new Error('Dados da escola inválidos ou ID não fornecido');
  }

  const { id, databaseURL } = schoolData;
  const cacheKey = `db-${id}`;

  // Retorna do cache se já existe
  if (schoolDatabases.has(cacheKey)) {
    console.log(`♻️ [getSchoolDatabase] Usando cache para: ${schoolData.nome || id}`);
    return schoolDatabases.get(cacheKey);
  }

  try {
    console.log(`🔌 [getSchoolDatabase] Conectando ao banco da escola: ${schoolData.nome || id}`);
    console.log(`🔌 [getSchoolDatabase] Database URL: ${databaseURL}`);
    
    // Inicializa app e database
    const app = getSchoolApp(schoolData);
    
    // Usa a URL específica do banco da escola
    const database = getDatabase(app, databaseURL);
    
    schoolDatabases.set(cacheKey, database);
    console.log(`✅ [getSchoolDatabase] Database conectado: ${schoolData.nome || id}`);
    
    return database;
  } catch (error) {
    console.error(`❌ [getSchoolDatabase] Erro ao conectar database:`, error);
    throw error;
  }
};

/**
 * Obtém a instância do Storage para uma escola específica
 * @param {Object} schoolData - Dados da escola
 * @returns {Object} Firebase Storage instance
 */
export const getSchoolStorage = (schoolData) => {
  if (!schoolData || !schoolData.id) {
    throw new Error('Dados da escola inválidos ou ID não fornecido');
  }

  const { id } = schoolData;
  const cacheKey = `storage-${id}`;

  // Retorna do cache se já existe
  if (schoolStorages.has(cacheKey)) {
    console.log(`♻️ [getSchoolStorage] Usando cache para: ${schoolData.nome || id}`);
    return schoolStorages.get(cacheKey);
  }

  // Inicializa app e storage
  const app = getSchoolApp(schoolData);
  const storage = getStorage(app);
  
  schoolStorages.set(cacheKey, storage);
  console.log(`✅ [getSchoolStorage] Storage conectado: ${schoolData.nome || id}`);
  
  return storage;
};

/**
 * Wrapper para operações de database com a escola específica
 */
export const schoolDatabaseOperations = (schoolData) => {
  const db = getSchoolDatabase(schoolData);

  return {
    // 🔥 Expor o database real para services que precisam dele
    _database: db,
    
    /**
     * Cria uma referência para um caminho no database
     */
    ref: (path) => {
      console.log(`🔗 [schoolDatabaseOperations.ref] Path: ${path}`);
      return ref(db, path);
    },

    /**
     * Busca dados de um caminho
     */
    get: async (path) => {
      try {
        console.log(`📖 [schoolDatabaseOperations.get] Iniciando leitura: ${path}`);
        console.log(`📍 [schoolDatabaseOperations.get] Database URL: ${schoolData.databaseURL}`);
        
        const dbRef = ref(db, path);
        const snapshot = await get(dbRef);
        
        const exists = snapshot.exists();
        const dataSize = exists ? JSON.stringify(snapshot.val()).length : 0;
        
        console.log(`✅ [schoolDatabaseOperations.get] Leitura concluída`);
        console.log(`   - Path: ${path}`);
        console.log(`   - Existe: ${exists}`);
        console.log(`   - Tamanho: ${dataSize} bytes`);
        
        return exists ? snapshot.val() : null;
      } catch (error) {
        console.error(`❌ [schoolDatabaseOperations.get] Erro ao ler dados:`, error);
        console.error(`❌ [schoolDatabaseOperations.get] Detalhes:`, {
          path,
          errorCode: error?.code,
          errorMessage: error?.message,
          errorStack: error?.stack,
          databaseURL: schoolData.databaseURL,
          projectId: schoolData.projectId
        });
        
        // Fornecer mensagem mais clara sobre erro de permissão
        if (error.code === 'PERMISSION_DENIED') {
          throw new Error(
            `Permissão negada ao acessar "${path}". ` +
            `Verifique se:\n` +
            `1. As regras de segurança do banco estão configuradas\n` +
            `2. O usuário está autenticado no projeto correto\n` +
            `3. O banco de dados "${schoolData.databaseURL}" está acessível`
          );
        }
        
        throw error;
      }
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
    // 🔥 Expor o storage real para services que precisam dele
    _storage: storage,
    
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
 * @param {string} schoolId - ID da escola (não o projectId)
 */
export const clearSchoolCache = (schoolId) => {
  if (schoolId) {
    const appName = `school-${schoolId}`;
    const dbKey = `db-${schoolId}`;
    const storageKey = `storage-${schoolId}`;
    
    schoolApps.delete(appName);
    schoolDatabases.delete(dbKey);
    schoolStorages.delete(storageKey);
    
    console.log(`🗑️ [clearSchoolCache] Cache limpo para escola: ${schoolId}`);
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
