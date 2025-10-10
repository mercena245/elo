import { 
  managementDb, 
  ref, 
  set, 
  get, 
  push, 
  update, 
  remove 
} from './managementFirebase';

export class UserManagementService {
  
  // Criar novo usuário
  static async createUser(userData) {
    try {
      const usersRef = ref(managementDb, 'users');
      const newUserRef = push(usersRef);
      const userId = newUserRef.key;
      
      const userWithId = {
        ...userData,
        id: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newUserRef, userWithId);
      return { success: true, userId, data: userWithId };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Listar todos os usuários
  static async getAllUsers() {
    try {
      const usersRef = ref(managementDb, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const users = [];
        snapshot.forEach((childSnapshot) => {
          users.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return { success: true, data: users };
      } else {
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Buscar usuário por ID
  static async getUserById(userId) {
    try {
      const userRef = ref(managementDb, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        return { 
          success: true, 
          data: { 
            id: userId, 
            ...snapshot.val() 
          } 
        };
      } else {
        return { success: false, error: 'Usuário não encontrado' };
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Atualizar usuário
  static async updateUser(userId, updateData) {
    try {
      const userRef = ref(managementDb, `users/${userId}`);
      const updatedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await update(userRef, updatedData);
      return { success: true, data: updatedData };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Deletar usuário
  static async deleteUser(userId) {
    try {
      const userRef = ref(managementDb, `users/${userId}`);
      await remove(userRef);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Buscar usuários por escola
  static async getUsersBySchool(schoolId) {
    try {
      const result = await this.getAllUsers();
      if (result.success) {
        const filteredUsers = result.data.filter(user => 
          user.schools && user.schools.some(school => school.id === schoolId)
        );
        return { success: true, data: filteredUsers };
      }
      return result;
    } catch (error) {
      console.error('Erro ao buscar usuários por escola:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Buscar usuários por role
  static async getUsersByRole(role) {
    try {
      const result = await this.getAllUsers();
      if (result.success) {
        const filteredUsers = result.data.filter(user => user.role === role);
        return { success: true, data: filteredUsers };
      }
      return result;
    } catch (error) {
      console.error('Erro ao buscar usuários por role:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Obter estatísticas dos usuários
  static async getUserStats() {
    try {
      const result = await this.getAllUsers();
      if (result.success) {
        const users = result.data;
        const stats = {
          total: users.length,
          ativos: users.filter(u => u.status === 'ativo').length,
          inativos: users.filter(u => u.status === 'inativo').length,
          roles: {
            coordenador: users.filter(u => u.role === 'coordenador').length,
            secretaria: users.filter(u => u.role === 'secretaria').length,
            professor: users.filter(u => u.role === 'professor').length,
            responsavel: users.filter(u => u.role === 'responsavel').length
          }
        };
        return { success: true, data: stats };
      }
      return result;
    } catch (error) {
      console.error('Erro ao calcular estatísticas de usuários:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Vincular usuário a escola
  static async linkUserToSchool(userId, schoolData) {
    try {
      const userResult = await this.getUserById(userId);
      if (!userResult.success) {
        return userResult;
      }
      
      const user = userResult.data;
      const schools = user.schools || [];
      
      // Verificar se já está vinculado
      const existingSchool = schools.find(s => s.id === schoolData.id);
      if (existingSchool) {
        return { success: false, error: 'Usuário já vinculado a esta escola' };
      }
      
      schools.push(schoolData);
      
      return await this.updateUser(userId, { schools });
    } catch (error) {
      console.error('Erro ao vincular usuário à escola:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Desvincular usuário de escola
  static async unlinkUserFromSchool(userId, schoolId) {
    try {
      const userResult = await this.getUserById(userId);
      if (!userResult.success) {
        return userResult;
      }
      
      const user = userResult.data;
      const schools = user.schools || [];
      
      const updatedSchools = schools.filter(s => s.id !== schoolId);
      
      return await this.updateUser(userId, { schools: updatedSchools });
    } catch (error) {
      console.error('Erro ao desvincular usuário da escola:', error);
      return { success: false, error: error.message };
    }
  }
}