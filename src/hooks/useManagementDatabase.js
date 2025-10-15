/**
 * useManagementDatabase Hook
 * 
 * Hook React que fornece acesso ao banco de gerenciamento (Management DB).
 * Usado pelo Super Admin para acessar dados de TODAS as escolas.
 */

import { useCallback } from 'react';
import { managementDB, ref, get, set, push, remove, update } from '../firebase';

export const useManagementDatabase = () => {
  /**
   * Buscar dados de um caminho
   */
  const getData = useCallback(async (path) => {
    try {
      console.log('🔍 [ManagementDB.getData] Buscando:', path);
      const dbRef = ref(managementDB, path);
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('✅ [ManagementDB.getData] Dados encontrados:', path);
        return data;
      } else {
        console.log('⚠️ [ManagementDB.getData] Nenhum dado encontrado:', path);
        return null;
      }
    } catch (error) {
      console.error('❌ [ManagementDB.getData] Erro:', error);
      throw error;
    }
  }, []);

  /**
   * Salvar dados em um caminho
   */
  const setData = useCallback(async (path, data) => {
    try {
      console.log('💾 [ManagementDB.setData] Salvando em:', path);
      const dbRef = ref(managementDB, path);
      await set(dbRef, data);
      console.log('✅ [ManagementDB.setData] Dados salvos com sucesso');
    } catch (error) {
      console.error('❌ [ManagementDB.setData] Erro:', error);
      throw error;
    }
  }, []);

  /**
   * Adicionar novo item (push)
   */
  const pushData = useCallback(async (path, data) => {
    try {
      console.log('➕ [ManagementDB.pushData] Adicionando em:', path);
      const dbRef = ref(managementDB, path);
      const newRef = await push(dbRef, data);
      console.log('✅ [ManagementDB.pushData] Item adicionado:', newRef.key);
      return newRef.key;
    } catch (error) {
      console.error('❌ [ManagementDB.pushData] Erro:', error);
      throw error;
    }
  }, []);

  /**
   * Atualizar dados
   */
  const updateData = useCallback(async (path, updates) => {
    try {
      console.log('🔄 [ManagementDB.updateData] Atualizando:', path);
      const dbRef = ref(managementDB, path);
      await update(dbRef, updates);
      console.log('✅ [ManagementDB.updateData] Dados atualizados');
    } catch (error) {
      console.error('❌ [ManagementDB.updateData] Erro:', error);
      throw error;
    }
  }, []);

  /**
   * Remover dados
   */
  const removeData = useCallback(async (path) => {
    try {
      console.log('🗑️ [ManagementDB.removeData] Removendo:', path);
      const dbRef = ref(managementDB, path);
      await remove(dbRef);
      console.log('✅ [ManagementDB.removeData] Dados removidos');
    } catch (error) {
      console.error('❌ [ManagementDB.removeData] Erro:', error);
      throw error;
    }
  }, []);

  /**
   * Buscar todas as escolas
   */
  const getAllSchools = useCallback(async () => {
    try {
      console.log('🏫 [ManagementDB] Buscando todas as escolas...');
      const snapshot = await getData('escolas');
      
      if (!snapshot) {
        console.log('⚠️ [ManagementDB] Nenhuma escola encontrada');
        return [];
      }

      const schools = Object.entries(snapshot).map(([id, data]) => ({
        id,
        ...data
      }));

      console.log(`✅ [ManagementDB] ${schools.length} escolas encontradas`);
      return schools;
    } catch (error) {
      console.error('❌ [ManagementDB] Erro ao buscar escolas:', error);
      return [];
    }
  }, [getData]);

  /**
   * Buscar todos os usuários
   */
  const getAllUsers = useCallback(async () => {
    try {
      console.log('👥 [ManagementDB] Buscando todos os usuários...');
      const snapshot = await getData('usuarios');
      
      if (!snapshot) {
        console.log('⚠️ [ManagementDB] Nenhum usuário encontrado');
        return [];
      }

      const users = Object.entries(snapshot).map(([uid, data]) => ({
        uid,
        ...data
      }));

      console.log(`✅ [ManagementDB] ${users.length} usuários encontrados`);
      return users;
    } catch (error) {
      console.error('❌ [ManagementDB] Erro ao buscar usuários:', error);
      return [];
    }
  }, [getData]);

  /**
   * Buscar aprovações pendentes
   */
  const getPendingApprovals = useCallback(async () => {
    try {
      console.log('⏳ [ManagementDB] Buscando aprovações pendentes...');
      const snapshot = await getData('pendingApprovals');
      
      if (!snapshot) {
        console.log('⚠️ [ManagementDB] Nenhuma aprovação pendente');
        return [];
      }

      const approvals = [];
      Object.entries(snapshot).forEach(([schoolId, users]) => {
        Object.entries(users).forEach(([userId, approval]) => {
          approvals.push({
            ...approval,
            userId,
            schoolId
          });
        });
      });

      console.log(`✅ [ManagementDB] ${approvals.length} aprovações pendentes`);
      return approvals;
    } catch (error) {
      console.error('❌ [ManagementDB] Erro ao buscar aprovações:', error);
      return [];
    }
  }, [getData]);

  return {
    getData,
    setData,
    pushData,
    updateData,
    removeData,
    getAllSchools,
    getAllUsers,
    getPendingApprovals,
    isReady: true, // Management DB está sempre pronto
    db: managementDB
  };
};
