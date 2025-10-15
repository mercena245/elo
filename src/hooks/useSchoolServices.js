/**
 * Hook customizado para usar services multi-tenant
 * Fornece instâncias dos services já configuradas com o database da escola atual
 */

import { useMemo } from 'react';
import { useSchoolDatabase } from './useSchoolDatabase';
import { createAuditService, LOG_ACTIONS, LOG_LEVELS, getActionDescription, getCurrentUserData } from '../services/auditServiceMultiTenant';
import { createFinanceiroService } from '../services/financeiroServiceMultiTenant';

/**
 * Hook que fornece services configurados para a escola atual
 * @returns {Object} - Objeto contendo os services e informações da escola
 */
export const useSchoolServices = () => {
  // Obter database e storage da escola
  const { 
    db,              // ✅ Corrigido: era 'database'
    storage,
    isReady, 
    error, 
    currentSchool,
    getData,
    setData,
    pushData,
    removeData,
    updateData
  } = useSchoolDatabase();

  // Criar instâncias dos services usando useMemo para evitar recriação
  const auditService = useMemo(() => {
    if (!db || !isReady) {
      console.log('⏳ [useSchoolServices] Aguardando db para criar auditService...', { hasDb: !!db, isReady });
      return null;
    }
    console.log('✅ [useSchoolServices] Criando auditService');
    // Passar o database real do Firebase (não o wrapper)
    return createAuditService(db._database || db);
  }, [db, isReady]);

  const financeiroService = useMemo(() => {
    if (!db || !isReady) {
      console.log('⏳ [useSchoolServices] Aguardando db para criar financeiroService...', { hasDb: !!db, isReady });
      return null;
    }
    console.log('✅ [useSchoolServices] Criando financeiroService');
    console.log('🔍 [useSchoolServices] Passando wrapper completo do db');
    
    // Passar o wrapper completo que tem os métodos get, set, etc
    const realStorage = storage?._storage || storage;
    return createFinanceiroService(db, realStorage);
  }, [db, storage, isReady]);

  return {
    // Services
    auditService,
    financeiroService,
    
    // Constantes úteis de auditoria
    LOG_ACTIONS,
    LOG_LEVELS,
    getActionDescription,
    getCurrentUserData,
    
    // Database operations (do hook original)
    getData,
    setData,
    pushData,
    removeData,
    updateData,
    
    // Informações da escola
    database: db,  // ✅ Exportar como 'database' para compatibilidade
    storage,
    isReady,
    error,
    currentSchool
  };
};

export default useSchoolServices;
