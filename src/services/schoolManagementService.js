import { 
  managementDb, 
  ref, 
  set, 
  get, 
  push, 
  update, 
  remove 
} from './managementFirebase';

export class SchoolManagementService {
  
  // Criar nova escola
  static async createSchool(schoolData) {
    try {
      const schoolsRef = ref(managementDb, 'schools');
      const newSchoolRef = push(schoolsRef);
      const schoolId = newSchoolRef.key;
      
      const schoolWithId = {
        ...schoolData,
        id: schoolId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newSchoolRef, schoolWithId);
      return { success: true, schoolId, data: schoolWithId };
    } catch (error) {
      console.error('Erro ao criar escola:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Listar todas as escolas
  static async getAllSchools() {
    try {
      const schoolsRef = ref(managementDb, 'schools');
      const snapshot = await get(schoolsRef);
      
      if (snapshot.exists()) {
        const schools = [];
        snapshot.forEach((childSnapshot) => {
          schools.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return { success: true, data: schools };
      } else {
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('Erro ao buscar escolas:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Buscar escola por ID
  static async getSchoolById(schoolId) {
    try {
      const schoolRef = ref(managementDb, `schools/${schoolId}`);
      const snapshot = await get(schoolRef);
      
      if (snapshot.exists()) {
        return { 
          success: true, 
          data: { 
            id: schoolId, 
            ...snapshot.val() 
          } 
        };
      } else {
        return { success: false, error: 'Escola não encontrada' };
      }
    } catch (error) {
      console.error('Erro ao buscar escola:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Atualizar escola
  static async updateSchool(schoolId, updateData) {
    try {
      const schoolRef = ref(managementDb, `schools/${schoolId}`);
      const updatedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await update(schoolRef, updatedData);
      return { success: true, data: updatedData };
    } catch (error) {
      console.error('Erro ao atualizar escola:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Deletar escola
  static async deleteSchool(schoolId) {
    try {
      const schoolRef = ref(managementDb, `schools/${schoolId}`);
      await remove(schoolRef);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar escola:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Buscar escolas por status
  static async getSchoolsByStatus(status) {
    try {
      const result = await this.getAllSchools();
      if (result.success) {
        const filteredSchools = result.data.filter(school => school.status === status);
        return { success: true, data: filteredSchools };
      }
      return result;
    } catch (error) {
      console.error('Erro ao buscar escolas por status:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Buscar escolas por plano
  static async getSchoolsByPlan(plano) {
    try {
      const result = await this.getAllSchools();
      if (result.success) {
        const filteredSchools = result.data.filter(school => school.plano === plano);
        return { success: true, data: filteredSchools };
      }
      return result;
    } catch (error) {
      console.error('Erro ao buscar escolas por plano:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Obter estatísticas das escolas
  static async getSchoolStats() {
    try {
      const result = await this.getAllSchools();
      if (result.success) {
        const schools = result.data;
        const stats = {
          total: schools.length,
          ativas: schools.filter(s => s.status === 'ativo').length,
          inativas: schools.filter(s => s.status === 'inativo').length,
          pendentes: schools.filter(s => s.status === 'pendente').length,
          planos: {
            basico: schools.filter(s => s.plano === 'basico').length,
            premium: schools.filter(s => s.plano === 'premium').length,
            empresarial: schools.filter(s => s.plano === 'empresarial').length
          }
        };
        return { success: true, data: stats };
      }
      return result;
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return { success: false, error: error.message };
    }
  }
}