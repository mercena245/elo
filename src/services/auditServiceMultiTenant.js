/**
 * Serviço de Auditoria e Logs - Multi-Tenant
 * Versão refatorada para suportar múltiplos bancos de dados (um por escola)
 * Responsável por registrar todas as ações importantes do sistema
 */

import { ref, push, get, query, orderByChild, equalTo, limitToLast } from 'firebase/database';

// Tipos de ação para categorização
export const LOG_ACTIONS = {
  // Ações de usuários
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_APPROVE: 'user_approve',
  USER_REJECT: 'user_reject',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_ROLE_CHANGE: 'user_role_change',
  USER_STUDENT_LINK: 'user_student_link',
  USER_STUDENT_UNLINK: 'user_student_unlink',
  USER_ACTIVATE: 'user_activate',
  USER_DEACTIVATE: 'user_deactivate',

  // Ações de alunos
  STUDENT_CREATE: 'student_create',
  STUDENT_UPDATE: 'student_update',
  STUDENT_DELETE: 'student_delete',
  STUDENT_ACTIVATE: 'student_activate',
  STUDENT_DEACTIVATE: 'student_deactivate',
  STUDENT_FILE_UPLOAD: 'student_file_upload',
  STUDENT_FILE_DELETE: 'student_file_delete',
  STUDENT_VIEWED: 'student_viewed',

  // Ações de turmas
  CLASS_CREATE: 'class_create',
  CLASS_UPDATE: 'class_update',
  CLASS_DELETE: 'class_delete',
  CLASS_ASSIGN_STUDENT: 'class_assign_student',
  CLASS_REMOVE_STUDENT: 'class_remove_student',

  // Ações de período escolar
  PERIOD_CREATE: 'period_create',
  PERIOD_UPDATE: 'period_update',
  PERIOD_DELETE: 'period_delete',
  PERIOD_ACTIVATE: 'period_activate',

  // Ações de disciplinas
  SUBJECT_CREATE: 'subject_create',
  SUBJECT_UPDATE: 'subject_update',
  SUBJECT_DELETE: 'subject_delete',

  // Ações de avisos
  NOTICE_CREATE: 'notice_create',
  NOTICE_UPDATE: 'notice_update',
  NOTICE_DELETE: 'notice_delete',

  // Ações de grade horária
  SCHEDULE_CREATE: 'schedule_create',
  SCHEDULE_UPDATE: 'schedule_update',
  SCHEDULE_DELETE: 'schedule_delete',

  // Ações de notas
  GRADE_CREATE: 'grade_create',
  GRADE_UPDATE: 'grade_update',
  GRADE_DELETE: 'grade_delete',

  // Ações de frequência
  ATTENDANCE_CREATE: 'attendance_create',
  ATTENDANCE_UPDATE: 'attendance_update',
  ATTENDANCE_DELETE: 'attendance_delete',

  // Ações de mensagens
  MESSAGE_SENT: 'message_sent',
  MESSAGE_READ: 'message_read',
  MESSAGE_VIEWED: 'message_viewed',
  MESSAGE_SEND_ERROR: 'message_send_error',
  MESSAGE_COMPOSE_STARTED: 'message_compose_started',
  MESSAGE_COMPOSE_CANCELLED: 'message_compose_cancelled',
  MESSAGE_FILTER_CHANGED: 'message_filter_changed',

  // Ações de diário
  DIARY_ENTRY_CREATED: 'diary_entry_created',
  DIARY_ENTRY_VIEWED: 'diary_entry_viewed',
  DIARY_ENTRY_ERROR: 'diary_entry_error',
  DIARY_FILTER_CHANGED: 'diary_filter_changed',
  DIARY_COMPOSE_STARTED: 'diary_compose_started',
  DIARY_COMPOSE_CANCELLED: 'diary_compose_cancelled',

  // Ações de anexos
  ATTACHMENT_UPLOADED: 'attachment_uploaded',
  ATTACHMENT_DOWNLOADED: 'attachment_downloaded',
  ATTACHMENT_VIEWED: 'attachment_viewed',
  ATTACHMENT_REMOVED: 'attachment_removed',
  ATTACHMENT_UPLOAD_ERROR: 'attachment_upload_error',

  // Ações de sistema
  SYSTEM_BACKUP: 'system_backup',
  SYSTEM_EXPORT: 'system_export',
  SYSTEM_IMPORT: 'system_import',

  // Ações da Secretaria Digital
  DIGITAL_SECRETARY_HISTORIC_GENERATED: 'digital_secretary_historic_generated',
  DIGITAL_SECRETARY_DECLARATION_GENERATED: 'digital_secretary_declaration_generated',
  DIGITAL_SECRETARY_CERTIFICATE_GENERATED: 'digital_secretary_certificate_generated',
  DIGITAL_SECRETARY_TRANSFER_GENERATED: 'digital_secretary_transfer_generated',
  DIGITAL_SECRETARY_DOCUMENT_VALIDATED: 'digital_secretary_document_validated',
  DIGITAL_SECRETARY_VALIDATION_FAILED: 'digital_secretary_validation_failed',
  DIGITAL_SECRETARY_VALIDATION_ERROR: 'digital_secretary_validation_error',
  DIGITAL_SECRETARY_INSTITUTION_CONFIGURED: 'digital_secretary_institution_configured',
  DIGITAL_SECRETARY_DOCUMENT_DOWNLOADED: 'digital_secretary_document_downloaded',
  DIGITAL_SECRETARY_DOCUMENT_VIEWED: 'digital_secretary_document_viewed',
  DIGITAL_SECRETARY_DOCUMENT_DELETED: 'digital_secretary_document_deleted'
};

// Níveis de severidade
export const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Cria uma instância do serviço de auditoria para um banco específico
 * @param {Database} database - Instância do Firebase Database da escola
 */
export const createAuditService = (database) => {
  if (!database) {
    console.error('Database não fornecido para auditService');
    return null;
  }

  /**
   * Registra uma ação no sistema de auditoria
   * @param {string|Object} actionOrData - Tipo da ação ou objeto com dados completos (compatibilidade)
   * @param {string} userId - ID do usuário que executou a ação
   * @param {Object} details - Detalhes da ação
   * @param {string} level - Nível de severidade (opcional, padrão: INFO)
   */
  const logAction = async (actionOrData, userId, details = {}, level = LOG_LEVELS.INFO) => {
    try {
      let action, entityId, description, changes;
      let userData = null; // Declarar userData aqui para evitar sobrescrever
      
      // Compatibilidade: se o primeiro parâmetro é um objeto (formato antigo)
      if (typeof actionOrData === 'object' && actionOrData !== null) {
        const logData = actionOrData;
        action = logData.action;
        entityId = logData.entityId;
        description = logData.details;
        changes = logData.changes;
        level = logData.level || LOG_LEVELS.INFO;
        
        // Tentar obter userData do objeto ou do localStorage
        userData = logData.userData;
        if (!userData && typeof window !== 'undefined') {
          try {
            const storedData = localStorage.getItem('userData');
            if (storedData) {
              userData = JSON.parse(storedData);
            }
          } catch (error) {
            console.error('[AuditService] Erro ao obter userData do localStorage:', error);
          }
        }
        
        // Se ainda não tiver userData, tentar obter do Firebase Auth atual
        if (!userData || !userData.id) {
          try {
            const currentUser = auth?.currentUser;
            if (currentUser) {
              console.log('🔍 [AuditService] Buscando dados do usuário autenticado:', currentUser.uid);
              // Buscar dados completos do banco
              const userRef = ref(database, `usuarios/${currentUser.uid}`);
              const userSnapshot = await get(userRef);
              
              if (userSnapshot.exists()) {
                const userFromDB = userSnapshot.val();
                userData = {
                  id: currentUser.uid,
                  uid: currentUser.uid,
                  email: currentUser.email || userFromDB.email,
                  nome: userFromDB.nome,
                  role: userFromDB.role
                };
                console.log('✅ [AuditService] Dados do usuário obtidos:', {
                  nome: userData.nome,
                  email: userData.email,
                  role: userData.role
                });
              }
            }
          } catch (error) {
            console.error('❌ [AuditService] Erro ao buscar usuário autenticado:', error);
          }
        }
        
        userId = userData?.id || userData?.uid || 'unknown';
      } else {
        // Formato novo
        action = actionOrData;
        entityId = details.entityId;
        description = details.description;
        changes = details.changes;
        
        // Se userId não foi passado ou é inválido, buscar do Firebase Auth
        if (!userId || userId === 'unknown' || typeof userId !== 'string') {
          try {
            const currentUser = auth?.currentUser;
            if (currentUser) {
              console.log('🔍 [AuditService] Buscando dados do usuário autenticado (formato novo):', currentUser.uid);
              userId = String(currentUser.uid);
              
              // Buscar dados completos do banco
              // Garantir que userId seja uma string válida
              const userIdString = String(userId).replace(/[\.\#\$\[\]]/g, '');
              const userRef = ref(database, `usuarios/${userIdString}`);
              const userSnapshot = await get(userRef);
              
              if (userSnapshot.exists()) {
                const userFromDB = userSnapshot.val();
                userData = {
                  id: userId,
                  uid: userId,
                  email: currentUser.email || userFromDB.email,
                  nome: userFromDB.nome,
                  role: userFromDB.role
                };
                console.log('✅ [AuditService] Dados do usuário obtidos (formato novo):', {
                  nome: userData.nome,
                  email: userData.email,
                  role: userData.role
                });
              }
            }
          } catch (error) {
            console.error('❌ [AuditService] Erro ao buscar usuário autenticado (formato novo):', error);
          }
        }
      }

      // Validação básica
      if (!action || !userId) {
        console.error('Dados obrigatórios faltando para o log:', { action, userId });
        return;
      }

      // Tentar obter dados do usuário do localStorage se ainda não tem
      if (!userData && typeof window !== 'undefined') {
        try {
          const storedData = localStorage.getItem('userData');
          if (storedData) {
            userData = JSON.parse(storedData);
            console.log('📋 [AuditService] Dados do usuário do localStorage:', {
              nome: userData?.nome,
              email: userData?.email,
              role: userData?.role
            });
          }
        } catch (error) {
          console.error('[AuditService] Erro ao obter dados do usuário do localStorage:', error);
        }
      }

      // Se não tiver userData ou não tiver nome, buscar do banco
      if (!userData || !userData.nome) {
        console.log('⚠️ [AuditService] userData incompleto, buscando do banco...');
        try {
          const userRef = ref(database, `usuarios/${userId}`);
          const userSnapshot = await get(userRef);
          
          if (userSnapshot.exists()) {
            const userFromDB = userSnapshot.val();
            console.log('✅ [AuditService] Dados do usuário do banco:', {
              nome: userFromDB?.nome,
              email: userFromDB?.email,
              role: userFromDB?.role
            });
            
            // Mesclar com userData existente ou criar novo
            userData = {
              ...(userData || {}),
              nome: userFromDB.nome || userData?.nome,
              email: userFromDB.email || userData?.email,
              role: userFromDB.role || userData?.role,
              id: userId,
              uid: userId
            };
          } else {
            console.log('⚠️ [AuditService] Usuário não encontrado no banco:', userId);
          }
        } catch (error) {
          console.error('❌ [AuditService] Erro ao buscar usuário do banco:', error);
        }
      }

      // Determinar entidade baseada na ação
      let entity = 'system';
      if (action.startsWith('user_')) entity = 'user';
      else if (action.startsWith('student_')) entity = 'student';
      else if (action.startsWith('class_')) entity = 'class';
      else if (action.startsWith('period_')) entity = 'period';
      else if (action.startsWith('subject_')) entity = 'subject';
      else if (action.startsWith('notice_')) entity = 'notice';
      else if (action.startsWith('schedule_')) entity = 'schedule';
      else if (action.startsWith('grade_')) entity = 'grade';
      else if (action.startsWith('attendance_')) entity = 'attendance';
      else if (action.startsWith('message_')) entity = 'message';
      else if (action.startsWith('diary_')) entity = 'diary';
      else if (action.startsWith('attachment_')) entity = 'attachment';

      // Log de debug para verificar dados antes de salvar
      console.log('📋 [AuditService] Preparando log:', {
        action,
        userId,
        userName: userData?.nome || userData?.name || userData?.displayName || null,
        userEmail: userData?.email || null,
        hasUserData: !!userData
      });

      // Se userId é "unknown", logar erro detalhado
      if (userId === 'unknown') {
        console.error('⚠️ [AuditService] userId é "unknown"! Verificar:', {
          actionOrData: typeof actionOrData === 'object' ? actionOrData : actionOrData,
          userData: userData,
          localStorage: typeof window !== 'undefined' ? localStorage.getItem('userData') : 'N/A'
        });
      }

      // Estrutura do log
      const logEntry = {
        // Identificação da ação
        action,
        entity,
        entityId: entityId || null,
        level,
        
        // Dados do usuário
        userId: userId,
        userEmail: userData?.email || null,
        userRole: userData?.role || null,
        userName: userData?.nome || userData?.name || userData?.displayName || null,
        
        // Detalhes da ação
        details: description || JSON.stringify(details),
        
        // Dados da alteração (se houver)
        changes: changes ? JSON.stringify(changes) : null,
        
        // Metadados
        metadata: JSON.stringify(details),
        
        // Informações de contexto
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
        ip: details.ip || 'unknown',
        
        // Para facilitar consultas
        date: new Date().toISOString().split('T')[0],
        month: new Date().toISOString().substring(0, 7),
        year: new Date().getFullYear()
      };

      // Salvar no Firebase (usando database específica da escola)
      const logsRef = ref(database, 'audit_logs');
      const newLogRef = await push(logsRef, logEntry);
      
      // Log no console para desenvolvimento
      console.log('📋 Ação registrada com sucesso:', {
        action,
        entity,
        user: userData?.email || userId,
        timestamp: logEntry.timestamp,
        firebaseKey: newLogRef.key
      });

    } catch (error) {
      console.error('❌ Erro ao registrar log de auditoria:', error);
      console.error('❌ Dados que causaram erro:', { action: actionOrData, userId, details, level });
      // Não queremos que erros de log quebrem o fluxo principal
    }
  };

  /**
   * Busca logs por filtros
   * @param {Object} filters - Filtros para busca
   */
  const getLogs = async (filters = {}) => {
    try {
      const {
        action,
        entity,
        userId,
        date,
        limit = 100
      } = filters;

      let logsQuery = ref(database, 'audit_logs');

      // Aplicar filtros
      if (action) {
        logsQuery = query(logsQuery, orderByChild('action'), equalTo(action));
      } else if (entity) {
        logsQuery = query(logsQuery, orderByChild('entity'), equalTo(entity));
      } else if (userId) {
        logsQuery = query(logsQuery, orderByChild('userId'), equalTo(userId));
      } else if (date) {
        logsQuery = query(logsQuery, orderByChild('date'), equalTo(date));
      } else {
        logsQuery = query(logsQuery, orderByChild('timestamp'), limitToLast(limit));
      }

      const snapshot = await get(logsQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const logs = Object.entries(snapshot.val()).map(([id, log]) => ({
        id,
        ...log,
        changes: log.changes ? JSON.parse(log.changes) : null,
        metadata: log.metadata ? JSON.parse(log.metadata) : {}
      }));

      return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      return [];
    }
  };

  /**
   * Busca logs de uma entidade específica
   */
  const getEntityLogs = async (entity, entityId, limit = 50) => {
    try {
      const logsRef = ref(database, 'audit_logs');
      const logsQuery = query(
        logsRef,
        orderByChild('entityId'),
        equalTo(entityId),
        limitToLast(limit)
      );

      const snapshot = await get(logsQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const logs = Object.entries(snapshot.val())
        .map(([id, log]) => ({
          id,
          ...log,
          changes: log.changes ? JSON.parse(log.changes) : null,
          metadata: log.metadata ? JSON.parse(log.metadata) : {}
        }))
        .filter(log => log.entity === entity)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return logs;

    } catch (error) {
      console.error('Erro ao buscar logs da entidade:', error);
      return [];
    }
  };

  /**
   * Busca estatísticas de logs
   */
  const getLogStats = async (period = 'month') => {
    try {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'today':
          startDate = now.toISOString().split('T')[0];
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString().split('T')[0];
          break;
        case 'month':
          startDate = now.toISOString().substring(0, 7);
          break;
        case 'year':
          startDate = now.getFullYear().toString();
          break;
        default:
          startDate = now.toISOString().substring(0, 7);
      }

      const logsRef = ref(database, 'audit_logs');
      const logsQuery = query(logsRef, orderByChild(period === 'year' ? 'year' : 'date'));
      
      const snapshot = await get(logsQuery);
      
      if (!snapshot.exists()) {
        return { total: 0, byAction: {}, byUser: {}, byEntity: {} };
      }

      const logs = Object.values(snapshot.val());
      
      const filteredLogs = logs.filter(log => {
        if (period === 'today') {
          return log.date === startDate;
        } else if (period === 'week') {
          return log.date >= startDate;
        } else if (period === 'month') {
          return log.month === startDate;
        } else if (period === 'year') {
          return log.year.toString() === startDate;
        }
        return true;
      });

      const stats = {
        total: filteredLogs.length,
        byAction: {},
        byUser: {},
        byEntity: {}
      };

      filteredLogs.forEach(log => {
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
        const userKey = log.userEmail || log.userId;
        stats.byUser[userKey] = (stats.byUser[userKey] || 0) + 1;
        stats.byEntity[log.entity] = (stats.byEntity[log.entity] || 0) + 1;
      });

      return stats;

    } catch (error) {
      console.error('Erro ao buscar estatísticas de logs:', error);
      return { total: 0, byAction: {}, byUser: {}, byEntity: {} };
    }
  };

  return {
    logAction,
    getLogs,
    getEntityLogs,
    getLogStats
  };
};

// Helper para criar descrições legíveis das ações
export const getActionDescription = (action, entity, changes) => {
  const actionMap = {
    [LOG_ACTIONS.USER_CREATE]: 'criou usuário',
    [LOG_ACTIONS.USER_UPDATE]: 'atualizou usuário',
    [LOG_ACTIONS.USER_DELETE]: 'excluiu usuário',
    [LOG_ACTIONS.USER_APPROVE]: 'aprovou usuário',
    [LOG_ACTIONS.USER_LOGIN]: 'fez login',
    [LOG_ACTIONS.USER_LOGOUT]: 'fez logout',
    
    [LOG_ACTIONS.STUDENT_CREATE]: 'cadastrou aluno',
    [LOG_ACTIONS.STUDENT_UPDATE]: 'atualizou dados do aluno',
    [LOG_ACTIONS.STUDENT_DELETE]: 'excluiu aluno',
    
    [LOG_ACTIONS.CLASS_CREATE]: 'criou turma',
    [LOG_ACTIONS.CLASS_UPDATE]: 'atualizou turma',
    [LOG_ACTIONS.CLASS_DELETE]: 'excluiu turma',
    
    [LOG_ACTIONS.DIGITAL_SECRETARY_HISTORIC_GENERATED]: 'gerou histórico escolar digital',
    [LOG_ACTIONS.DIGITAL_SECRETARY_DECLARATION_GENERATED]: 'gerou declaração digital',
    [LOG_ACTIONS.DIGITAL_SECRETARY_CERTIFICATE_GENERATED]: 'gerou certificado digital'
  };

  return actionMap[action] || `executou ação ${action}`;
};

// Helper para obter dados do usuário atual
export const getCurrentUserData = () => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Erro ao obter dados do usuário:', error);
      }
    }
  }
  return null;
};

export default createAuditService;
