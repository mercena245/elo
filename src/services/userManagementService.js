/**
 * Serviço de Gerenciamento de Usuários Multi-Tenant
 * 
 * Gerencia o fluxo completo de aprovação e associação de usuários às escolas:
 * 1. Validação de coordenadora existente
 * 2. Aprovação automática ou manual
 * 3. Sincronização entre bancos (management e escola)
 * 
 * @module userManagementService
 */

import { ref, get, set, update } from 'firebase/database';
import { managementDB } from '../firebase';
import { getSchoolDatabase } from './schoolDatabaseService';

/**
 * Status de aprovação de usuário
 */
export const APPROVAL_STATUS = {
  PENDING: 'pending',           // Aguardando aprovação
  AUTO_APPROVED: 'auto_approved', // Aprovado automaticamente (escola com coordenadora)
  MANUAL_APPROVED: 'manual_approved', // Aprovado manualmente pelo super admin
  REJECTED: 'rejected'          // Rejeitado
};

/**
 * Roles disponíveis no sistema
 */
export const USER_ROLES = {
  SUPER_ADMIN: 'superAdmin',
  COORDENADORA: 'coordenadora',
  PROFESSORA: 'professora',
  PAI: 'pai',
  SECRETARIA: 'secretaria',
  PENDING: 'pending' // Role temporária para usuários não aprovados
};

/**
 * Serviço de Gerenciamento de Usuários
 */
class UserManagementService {
  
  /**
   * Verifica se uma escola possui pelo menos um coordenador ativo
   * @param {string} schoolId - ID da escola
   * @returns {Promise<{hasCoordinator: boolean, coordinatorCount: number}>}
   */
  async checkSchoolHasCoordinator(schoolId) {
    try {
      console.log(`🔍 [UserManagement] Verificando coordenadora na escola: ${schoolId}`);
      
      // Buscar dados da escola no management
      const schoolRef = ref(managementDB, `escolas/${schoolId}`);
      const schoolSnapshot = await get(schoolRef);
      
      if (!schoolSnapshot.exists()) {
        console.error('❌ [UserManagement] Escola não encontrada:', schoolId);
        return { hasCoordinator: false, coordinatorCount: 0 };
      }
      
      const schoolData = schoolSnapshot.val();
      
      // Conectar ao banco da escola para verificar usuários
      const schoolDB = getSchoolDatabase({
        id: schoolId,
        ...schoolData
      });
      
      if (!schoolDB) {
        console.error('❌ [UserManagement] Não foi possível conectar ao banco da escola');
        return { hasCoordinator: false, coordinatorCount: 0 };
      }
      
      // Buscar todos os usuários da escola
      const usersRef = ref(schoolDB, 'usuarios');
      const usersSnapshot = await get(usersRef);
      
      if (!usersSnapshot.exists()) {
        console.log('ℹ️ [UserManagement] Escola sem usuários cadastrados');
        return { hasCoordinator: false, coordinatorCount: 0 };
      }
      
      const users = usersSnapshot.val();
      let coordinatorCount = 0;
      
      // Contar coordenadoras ativas
      Object.values(users).forEach(user => {
        if (user.role === USER_ROLES.COORDENADORA && user.ativo !== false) {
          coordinatorCount++;
        }
      });
      
      console.log(`✅ [UserManagement] Coordenadoras encontradas: ${coordinatorCount}`);
      
      return {
        hasCoordinator: coordinatorCount > 0,
        coordinatorCount
      };
      
    } catch (error) {
      console.error('❌ [UserManagement] Erro ao verificar coordenadora:', error);
      return { hasCoordinator: false, coordinatorCount: 0 };
    }
  }

  /**
   * Solicita acesso do usuário a uma escola
   * @param {string} userId - UID do usuário
   * @param {string} schoolId - ID da escola
   * @param {Object} userData - Dados do usuário (nome, email)
   * @returns {Promise<{success: boolean, status: string, message: string}>}
   */
  async requestSchoolAccess(userId, schoolId, userData) {
    try {
      console.log(`📝 [UserManagement] Solicitação de acesso`);
      console.log(`  - Usuário: ${userId}`);
      console.log(`  - Escola: ${schoolId}`);
      console.log(`  - Dados:`, userData);
      
      // 1. Verificar se escola tem coordenadora
      const { hasCoordinator } = await this.checkSchoolHasCoordinator(schoolId);
      
      // 2. Determinar status inicial
      const status = hasCoordinator 
        ? APPROVAL_STATUS.AUTO_APPROVED 
        : APPROVAL_STATUS.PENDING;
      
      const now = new Date().toISOString();
      
      // 3. Salvar no banco de gerenciamento
      const managementUserData = {
        uid: userId,
        email: userData.email,
        nome: userData.nome || userData.email.split('@')[0],
        createdAt: now,
        updatedAt: now
      };
      
      // Salvar dados básicos do usuário
      const userRef = ref(managementDB, `usuarios/${userId}`);
      await set(userRef, managementUserData);
      
      // 4. Salvar associação escola-usuário
      const schoolAccessData = {
        escolaId: schoolId,
        status: status,
        role: status === APPROVAL_STATUS.AUTO_APPROVED ? USER_ROLES.PENDING : null,
        ativo: status === APPROVAL_STATUS.AUTO_APPROVED,
        requestedAt: now,
        approvedAt: status === APPROVAL_STATUS.AUTO_APPROVED ? now : null,
        approvedBy: status === APPROVAL_STATUS.AUTO_APPROVED ? 'auto' : null
      };
      
      const userSchoolRef = ref(managementDB, `usuarios/${userId}/escolas/${schoolId}`);
      await set(userSchoolRef, schoolAccessData);
      
      // Também criar mapeamento reverso para facilitar consultas
      const userSchoolMapRef = ref(managementDB, `userSchools/${userId}`);
      await set(userSchoolMapRef, schoolId);
      
      // 5. Se foi auto-aprovado, adicionar ao banco da escola
      if (status === APPROVAL_STATUS.AUTO_APPROVED) {
        await this.addUserToSchoolDatabase(userId, schoolId, {
          email: userData.email,
          nome: managementUserData.nome,
          role: null, // Sem role - coordenadora definirá
          ativo: false, // Inativo até coordenadora aprovar
          createdAt: now
        });
        
        console.log('✅ [UserManagement] Usuário adicionado ao banco da escola (aguardando aprovação da coordenadora)');
      }
      
      // 6. Se precisa aprovação manual, adicionar à fila do super admin
      if (status === APPROVAL_STATUS.PENDING) {
        const pendingApprovalRef = ref(managementDB, `pendingApprovals/${schoolId}/${userId}`);
        await set(pendingApprovalRef, {
          userId,
          schoolId,
          email: userData.email,
          nome: managementUserData.nome,
          requestedAt: now,
          status: APPROVAL_STATUS.PENDING
        });
        
        console.log('⏳ [UserManagement] Usuário adicionado à fila de aprovação do super admin');
      }
      
      const resultMessage = hasCoordinator
        ? 'Acesso concedido! Aguardando aprovação da coordenadora para definir sua função.'
        : 'Solicitação enviada! Aguardando aprovação do administrador do sistema.';
      
      console.log(`✅ [UserManagement] ${resultMessage}`);
      
      return {
        success: true,
        status: status,
        hasCoordinator: hasCoordinator,
        message: resultMessage
      };
      
    } catch (error) {
      console.error('❌ [UserManagement] Erro ao solicitar acesso:', error);
      return {
        success: false,
        status: 'error',
        message: 'Erro ao processar solicitação. Tente novamente.'
      };
    }
  }

  /**
   * Adiciona usuário ao banco de dados da escola
   * @param {string} userId - UID do usuário
   * @param {string} schoolId - ID da escola
   * @param {Object} userData - Dados do usuário para salvar na escola
   * @returns {Promise<boolean>}
   */
  async addUserToSchoolDatabase(userId, schoolId, userData) {
    try {
      console.log(`📝 [addUserToSchoolDatabase] Iniciando...`);
      console.log(`  - userId: ${userId}`);
      console.log(`  - schoolId: ${schoolId}`);
      console.log(`  - userData:`, userData);
      
      // Buscar dados da escola
      const schoolRef = ref(managementDB, `escolas/${schoolId}`);
      const schoolSnapshot = await get(schoolRef);
      
      if (!schoolSnapshot.exists()) {
        console.error(`❌ [addUserToSchoolDatabase] Escola ${schoolId} não encontrada no managementDB`);
        throw new Error('Escola não encontrada');
      }
      
      const schoolData = schoolSnapshot.val();
      console.log(`🏫 [addUserToSchoolDatabase] Dados da escola:`, {
        id: schoolId,
        nome: schoolData.nome,
        databaseURL: schoolData.databaseURL,
        projectId: schoolData.projectId
      });
      
      const schoolDB = getSchoolDatabase({
        id: schoolId,
        ...schoolData
      });
      
      if (!schoolDB) {
        console.error(`❌ [addUserToSchoolDatabase] Não foi possível conectar ao banco da escola ${schoolId}`);
        throw new Error('Não foi possível conectar ao banco da escola');
      }
      
      console.log(`✅ [addUserToSchoolDatabase] Conectado ao banco da escola ${schoolData.nome}`);
      
      // Salvar usuário no banco da escola
      const userSchoolRef = ref(schoolDB, `usuarios/${userId}`);
      const userDataToSave = {
        email: userData.email,
        nome: userData.nome,
        role: userData.role || null,
        ativo: userData.ativo !== undefined ? userData.ativo : false,
        turmas: userData.turmas || [],
        createdAt: userData.createdAt || new Date().toISOString()
      };
      
      console.log(`💾 [addUserToSchoolDatabase] Salvando no caminho: usuarios/${userId}`);
      console.log(`💾 [addUserToSchoolDatabase] Dados a salvar:`, userDataToSave);
      
      await set(userSchoolRef, userDataToSave);
      
      console.log(`✅ [addUserToSchoolDatabase] Usuário ${userId} adicionado ao banco da escola ${schoolId} com role: ${userData.role}`);
      
      // Verificar se foi salvo
      const verifySnapshot = await get(userSchoolRef);
      if (verifySnapshot.exists()) {
        console.log(`✅ [addUserToSchoolDatabase] VERIFICADO: Usuário existe no banco da escola!`);
        console.log(`✅ [addUserToSchoolDatabase] Dados salvos:`, verifySnapshot.val());
      } else {
        console.error(`❌ [addUserToSchoolDatabase] ERRO: Usuário NÃO foi encontrado após salvar!`);
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ [UserManagement] Erro ao adicionar usuário ao banco da escola:', error);
      console.error('❌ [UserManagement] Stack:', error.stack);
      return false;
    }
  }

  /**
   * Super Admin aprova usuário e define role inicial
   * @param {string} userId - UID do usuário
   * @param {string} schoolId - ID da escola
   * @param {string} role - Role a ser atribuída
   * @param {string} adminId - UID do super admin que aprovou
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async approveUserBySuperAdmin(userId, schoolId, role, adminId) {
    try {
      console.log(`👑 [UserManagement] Super admin aprovando usuário`);
      console.log(`  - Usuário: ${userId}`);
      console.log(`  - Escola: ${schoolId}`);
      console.log(`  - Role: ${role}`);
      console.log(`  - Admin: ${adminId}`);
      
      const now = new Date().toISOString();
      
      // 1. Atualizar status no management
      const updates = {};
      updates[`usuarios/${userId}/escolas/${schoolId}/status`] = APPROVAL_STATUS.MANUAL_APPROVED;
      updates[`usuarios/${userId}/escolas/${schoolId}/role`] = role;
      updates[`usuarios/${userId}/escolas/${schoolId}/ativo`] = true;
      updates[`usuarios/${userId}/escolas/${schoolId}/approvedAt`] = now;
      updates[`usuarios/${userId}/escolas/${schoolId}/approvedBy`] = adminId;
      
      // 2. Remover da fila de aprovações pendentes
      updates[`pendingApprovals/${schoolId}/${userId}`] = null;
      
      await update(ref(managementDB), updates);
      
      // 3. Buscar dados do usuário
      const userRef = ref(managementDB, `usuarios/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        throw new Error('Usuário não encontrado');
      }
      
      const userData = userSnapshot.val();
      
      // 4. Adicionar ao banco da escola com role definida
      await this.addUserToSchoolDatabase(userId, schoolId, {
        email: userData.email,
        nome: userData.nome,
        role: role,
        ativo: true,
        turmas: role === USER_ROLES.COORDENADORA ? [] : [],
        createdAt: now
      });
      
      console.log('✅ [UserManagement] Usuário aprovado e adicionado à escola');
      
      return {
        success: true,
        message: `Usuário aprovado como ${role} com sucesso!`
      };
      
    } catch (error) {
      console.error('❌ [UserManagement] Erro ao aprovar usuário:', error);
      return {
        success: false,
        message: 'Erro ao aprovar usuário. Tente novamente.'
      };
    }
  }

  /**
   * Busca todas as aprovações pendentes para o super admin
   * @returns {Promise<Array>}
   */
  async getPendingApprovals() {
    try {
      const pendingRef = ref(managementDB, 'pendingApprovals');
      const snapshot = await get(pendingRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const data = snapshot.val();
      const approvals = [];
      
      // Transformar estrutura aninhada em array
      Object.entries(data).forEach(([schoolId, users]) => {
        Object.entries(users).forEach(([userId, approval]) => {
          approvals.push({
            ...approval,
            userId,
            schoolId
          });
        });
      });
      
      // Ordenar por data de solicitação (mais recente primeiro)
      approvals.sort((a, b) => 
        new Date(b.requestedAt) - new Date(a.requestedAt)
      );
      
      return approvals;
      
    } catch (error) {
      console.error('❌ [UserManagement] Erro ao buscar aprovações pendentes:', error);
      return [];
    }
  }

  /**
   * Busca escolas disponíveis para um usuário
   * @param {string} userId - UID do usuário (opcional - se não informado, lista todas)
   * @returns {Promise<Array>}
   */
  async getAvailableSchools(userId = null) {
    try {
      const escolasRef = ref(managementDB, 'escolas');
      const snapshot = await get(escolasRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const schools = [];
      const data = snapshot.val();
      
      for (const [id, school] of Object.entries(data)) {
        schools.push({
          id,
          nome: school.nome,
          logo: school.logo || '🏫',
          cidade: school.cidade,
          databaseURL: school.databaseURL,
          projectId: school.projectId
        });
      }
      
      return schools;
      
    } catch (error) {
      console.error('❌ [UserManagement] Erro ao buscar escolas:', error);
      return [];
    }
  }

  /**
   * Busca escolas do usuário (já associadas)
   * @param {string} userId - UID do usuário
   * @returns {Promise<Array>}
   */
  async getUserSchools(userId) {
    try {
      const userSchoolsRef = ref(managementDB, `usuarios/${userId}/escolas`);
      const snapshot = await get(userSchoolsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const userSchoolsData = snapshot.val();
      const schools = [];
      
      // Buscar dados completos de cada escola
      for (const [schoolId, accessData] of Object.entries(userSchoolsData)) {
        // Só incluir escolas aprovadas e ativas
        if (accessData.status === APPROVAL_STATUS.AUTO_APPROVED || 
            accessData.status === APPROVAL_STATUS.MANUAL_APPROVED) {
          
          const schoolRef = ref(managementDB, `escolas/${schoolId}`);
          const schoolSnapshot = await get(schoolRef);
          
          if (schoolSnapshot.exists()) {
            const schoolData = schoolSnapshot.val();
            schools.push({
              id: schoolId,
              nome: schoolData.nome,
              logo: schoolData.logo || '🏫',
              cidade: schoolData.cidade,
              role: accessData.role,
              ativo: accessData.ativo,
              status: accessData.status,
              databaseURL: schoolData.databaseURL,
              projectId: schoolData.projectId,
              storageBucket: schoolData.storageBucket
            });
          }
        }
      }
      
      return schools;
      
    } catch (error) {
      console.error('❌ [UserManagement] Erro ao buscar escolas do usuário:', error);
      return [];
    }
  }
}

// Exportar instância singleton
export const userManagementService = new UserManagementService();

// Exportar classe para testes
export default UserManagementService;