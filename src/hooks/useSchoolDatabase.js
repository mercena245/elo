/**
 * useSchoolDatabase Hook
 * 
 * Hook React que fornece acesso ao banco de dados da escola atualmente selecionada.
 * Automaticamente se conecta ao Firebase Database correto baseado na escola do usuário.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  schoolDatabaseOperations, 
  schoolStorageOperations,
  clearSchoolCache 
} from '../services/schoolDatabaseService';
import { SUPER_ADMIN_UID, ROLES, isSuperAdmin } from '../config/constants';
import { auth } from '../firebase';

export const useSchoolDatabase = () => {
  const { user, currentSchool, isLoadingSchool } = useAuth();
  const [db, setDb] = useState(null);
  const [storage, setStorage] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeDatabase = () => {
      try {
        console.log('🔄 [useSchoolDatabase] initializeDatabase chamado');
        console.log('🔄 [useSchoolDatabase] currentSchool:', currentSchool);
        console.log('🔄 [useSchoolDatabase] isLoadingSchool:', isLoadingSchool);
        
        // Verifica se temos escola selecionada
        if (!currentSchool) {
          console.log('⚠️ [useSchoolDatabase] Nenhuma escola no contexto');
          setDb(null);
          setStorage(null);
          setIsReady(false);
          return;
        }

        console.log('📋 [useSchoolDatabase] Escola encontrada:', currentSchool.nome);
        console.log('📋 [useSchoolDatabase] Database URL:', currentSchool.databaseURL);
        console.log('📋 [useSchoolDatabase] Storage Bucket:', currentSchool.storageBucket);
        console.log('📋 [useSchoolDatabase] Project ID:', currentSchool.projectId);

        // Valida dados da escola
        if (!currentSchool.databaseURL || !currentSchool.storageBucket || !currentSchool.projectId) {
          const missing = [];
          if (!currentSchool.databaseURL) missing.push('databaseURL');
          if (!currentSchool.storageBucket) missing.push('storageBucket');
          if (!currentSchool.projectId) missing.push('projectId');
          
          throw new Error(`Configurações de banco de dados da escola incompletas. Faltando: ${missing.join(', ')}`);
        }

        console.log('🔌 [useSchoolDatabase] Conectando ao banco da escola:', currentSchool.nome);

        // Inicializa operações de database e storage
        const databaseOps = schoolDatabaseOperations(currentSchool);
        const storageOps = schoolStorageOperations(currentSchool);

        setDb(databaseOps);
        setStorage(storageOps);
        setIsReady(true);
        setError(null);

        console.log('✅ [useSchoolDatabase] Conectado ao banco da escola:', currentSchool.nome);
        console.log('✅ [useSchoolDatabase] isReady:', true);
      } catch (err) {
        console.error('❌ [useSchoolDatabase] Erro ao conectar ao banco da escola:', err);
        console.error('❌ [useSchoolDatabase] Erro detalhado:', err.message);
        setError(err.message);
        setDb(null);
        setStorage(null);
        setIsReady(false);
      }
    };

    console.log('🔄 [useSchoolDatabase] useEffect triggered');
    console.log('🔄 [useSchoolDatabase] isLoadingSchool:', isLoadingSchool);
    
    // Só inicializa se não estiver carregando
    if (!isLoadingSchool) {
      initializeDatabase();
    }

    // Cleanup ao desmontar ou trocar de escola
    return () => {
      if (currentSchool?.id) {
        clearSchoolCache(currentSchool.id);
      }
    };
  }, [currentSchool, isLoadingSchool]);

  /**
   * Buscar dados de um caminho
   */
  const getData = useCallback(async (path) => {
    // 👑 Se for Super Admin buscando seus próprios dados, retornar mock
    const currentUser = auth.currentUser;
    if (currentUser && isSuperAdmin(currentUser.uid) && path === `usuarios/${currentUser.uid}`) {
      console.log('👑 [useSchoolDatabase.getData] Super Admin buscando seus dados - retornando mock');
      return {
        uid: currentUser.uid,
        nome: 'Super Admin',
        displayName: 'Super Admin',
        email: currentUser.email,
        role: ROLES.COORDENADORA, // ← Usar 'coordenadora' que é o padrão do sistema
        turmas: ['todas'],
        permissoes: {
          verTudo: true,
          editarTudo: true
        }
      };
    }
    
    if (!db) {
      console.warn('⚠️ [useSchoolDatabase.getData] Database não inicializado - provavelmente sem escola selecionada');
      throw new Error('Database não inicializado. Selecione uma escola primeiro.');
    }
    if (!isReady) {
      console.warn('⚠️ [useSchoolDatabase.getData] Database não está pronto');
      throw new Error('Database não está pronto. Aguarde a inicialização.');
    }
    return await db.get(path);
  }, [db, isReady]);

  /**
   * Salvar dados em um caminho
   */
  const setData = useCallback(async (path, data) => {
    if (!db) {
      console.warn('⚠️ [useSchoolDatabase.setData] Database não inicializado');
      throw new Error('Database não inicializado. Selecione uma escola primeiro.');
    }
    if (!isReady) {
      console.warn('⚠️ [useSchoolDatabase.setData] Database não está pronto');
      throw new Error('Database não está pronto. Aguarde a inicialização.');
    }
    await db.set(path, data);
  }, [db, isReady]);

  /**
   * Adicionar novo item (push)
   */
  const pushData = useCallback(async (path, data) => {
    if (!db) {
      console.warn('⚠️ [useSchoolDatabase.pushData] Database não inicializado');
      throw new Error('Database não inicializado. Selecione uma escola primeiro.');
    }
    if (!isReady) {
      console.warn('⚠️ [useSchoolDatabase.pushData] Database não está pronto');
      throw new Error('Database não está pronto. Aguarde a inicialização.');
    }
    return await db.push(path, data);
  }, [db, isReady]);

  /**
   * Atualizar dados
   */
  const updateData = useCallback(async (path, updates) => {
    if (!db) {
      console.warn('⚠️ [useSchoolDatabase.updateData] Database não inicializado');
      throw new Error('Database não inicializado. Selecione uma escola primeiro.');
    }
    if (!isReady) {
      console.warn('⚠️ [useSchoolDatabase.updateData] Database não está pronto');
      throw new Error('Database não está pronto. Aguarde a inicialização.');
    }
    await db.update(path, updates);
  }, [db, isReady]);

  /**
   * Remover dados
   */
  const removeData = useCallback(async (path) => {
    if (!db) {
      console.warn('⚠️ [useSchoolDatabase.removeData] Database não inicializado');
      throw new Error('Database não inicializado. Selecione uma escola primeiro.');
    }
    if (!isReady) {
      console.warn('⚠️ [useSchoolDatabase.removeData] Database não está pronto');
      throw new Error('Database não está pronto. Aguarde a inicialização.');
    }
    await db.remove(path);
  }, [db, isReady]);

  /**
   * Listener em tempo real
   */
  const listen = useCallback((path, callback) => {
    if (!db) throw new Error('Database não inicializado');
    return db.onValue(path, callback);
  }, [db]);

  /**
   * Upload de arquivo
   */
  const uploadFile = useCallback(async (path, file, metadata = {}) => {
    if (!storage) throw new Error('Storage não inicializado');
    return await storage.upload(path, file, metadata);
  }, [storage]);

  /**
   * Obter URL de arquivo
   */
  const getFileURL = useCallback(async (path) => {
    if (!storage) throw new Error('Storage não inicializado');
    return await storage.getDownloadURL(path);
  }, [storage]);

  /**
   * Deletar arquivo
   */
  const deleteFile = useCallback(async (path) => {
    if (!storage) throw new Error('Storage não inicializado');
    await storage.delete(path);
  }, [storage]);

  return {
    // Estado
    isReady,
    isLoading: isLoadingSchool,
    error,
    currentSchool,
    
    // Operações de Database
    db,
    getData,
    setData,
    pushData,
    updateData,
    removeData,
    listen,
    
    // Operações de Storage
    storage,
    uploadFile,
    getFileURL,
    deleteFile,
    
    // Objetos brutos (para casos avançados)
    databaseOperations: db,
    storageOperations: storage
  };
};

export default useSchoolDatabase;
