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
    database,
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
    if (!database || !isReady) return null;
    return createAuditService(database);
  }, [database, isReady]);

  const financeiroService = useMemo(() => {
    if (!database || !isReady) return null;
    return createFinanceiroService(database, storage);
  }, [database, storage, isReady]);

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
    database,
    storage,
    isReady,
    error,
    currentSchool
  };
};

export default useSchoolServices;
