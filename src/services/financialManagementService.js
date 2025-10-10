import { 
  managementDb, 
  ref, 
  set, 
  get, 
  push, 
  update, 
  remove 
} from './managementFirebase';

export class FinancialManagementService {
  
  // ===== CONTRATOS =====
  
  // Criar novo contrato
  static async createContract(contractData) {
    try {
      const contractsRef = ref(managementDb, 'contracts');
      const newContractRef = push(contractsRef);
      const contractId = newContractRef.key;
      
      const contractWithId = {
        ...contractData,
        id: contractId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newContractRef, contractWithId);
      return { success: true, contractId, data: contractWithId };
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Listar todos os contratos
  static async getAllContracts() {
    try {
      const contractsRef = ref(managementDb, 'contracts');
      const snapshot = await get(contractsRef);
      
      if (snapshot.exists()) {
        const contracts = [];
        snapshot.forEach((childSnapshot) => {
          contracts.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return { success: true, data: contracts };
      } else {
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Buscar contratos por escola
  static async getContractsBySchool(schoolId) {
    try {
      const result = await this.getAllContracts();
      if (result.success) {
        const filtered = result.data.filter(contract => contract.schoolId === schoolId);
        return { success: true, data: filtered };
      }
      return result;
    } catch (error) {
      console.error('Erro ao buscar contratos por escola:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Atualizar contrato
  static async updateContract(contractId, updateData) {
    try {
      const contractRef = ref(managementDb, `contracts/${contractId}`);
      const updatedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await update(contractRef, updatedData);
      return { success: true, data: updatedData };
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ===== PAGAMENTOS =====
  
  // Registrar pagamento
  static async createPayment(paymentData) {
    try {
      const paymentsRef = ref(managementDb, 'payments');
      const newPaymentRef = push(paymentsRef);
      const paymentId = newPaymentRef.key;
      
      const paymentWithId = {
        ...paymentData,
        id: paymentId,
        createdAt: new Date().toISOString()
      };
      
      await set(newPaymentRef, paymentWithId);
      return { success: true, paymentId, data: paymentWithId };
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Listar todos os pagamentos
  static async getAllPayments() {
    try {
      const paymentsRef = ref(managementDb, 'payments');
      const snapshot = await get(paymentsRef);
      
      if (snapshot.exists()) {
        const payments = [];
        snapshot.forEach((childSnapshot) => {
          payments.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return { success: true, data: payments };
      } else {
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Buscar pagamentos por escola
  static async getPaymentsBySchool(schoolId) {
    try {
      const result = await this.getAllPayments();
      if (result.success) {
        const filtered = result.data.filter(payment => payment.schoolId === schoolId);
        return { success: true, data: filtered };
      }
      return result;
    } catch (error) {
      console.error('Erro ao buscar pagamentos por escola:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Buscar pagamentos por período
  static async getPaymentsByPeriod(startDate, endDate) {
    try {
      const result = await this.getAllPayments();
      if (result.success) {
        const filtered = result.data.filter(payment => {
          const paymentDate = new Date(payment.dataPagamento);
          return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
        });
        return { success: true, data: filtered };
      }
      return result;
    } catch (error) {
      console.error('Erro ao buscar pagamentos por período:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ===== CONFIGURAÇÕES DE COBRANÇA =====
  
  // Salvar configurações de cobrança
  static async saveBillingSettings(settings) {
    try {
      const settingsRef = ref(managementDb, 'billingSettings');
      const settingsWithTimestamp = {
        ...settings,
        updatedAt: new Date().toISOString()
      };
      
      await set(settingsRef, settingsWithTimestamp);
      return { success: true, data: settingsWithTimestamp };
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Buscar configurações de cobrança
  static async getBillingSettings() {
    try {
      const settingsRef = ref(managementDb, 'billingSettings');
      const snapshot = await get(settingsRef);
      
      if (snapshot.exists()) {
        return { success: true, data: snapshot.val() };
      } else {
        // Retornar configurações padrão
        const defaultSettings = {
          vencimento: 10,
          juros: 2,
          multa: 10,
          desconto: 5,
          diasDesconto: 5,
          emailLembrete: true,
          diasLembrete: 3
        };
        return { success: true, data: defaultSettings };
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ===== ESTATÍSTICAS FINANCEIRAS =====
  
  // Obter estatísticas financeiras
  static async getFinancialStats() {
    try {
      const [contractsResult, paymentsResult] = await Promise.all([
        this.getAllContracts(),
        this.getAllPayments()
      ]);
      
      if (!contractsResult.success || !paymentsResult.success) {
        return { success: false, error: 'Erro ao buscar dados financeiros' };
      }
      
      const contracts = contractsResult.data;
      const payments = paymentsResult.data;
      
      // Calcular receita total
      const totalRevenue = payments
        .filter(p => p.status === 'confirmado')
        .reduce((sum, p) => sum + (p.valor || 0), 0);
      
      // Calcular receita mensal atual
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = payments
        .filter(p => {
          const paymentDate = new Date(p.dataPagamento);
          return p.status === 'confirmado' && 
                 paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + (p.valor || 0), 0);
      
      // Calcular pendências
      const pendingPayments = payments
        .filter(p => p.status === 'pendente')
        .reduce((sum, p) => sum + (p.valor || 0), 0);
      
      // Contratos ativos
      const activeContracts = contracts.filter(c => c.status === 'ativo').length;
      
      const stats = {
        totalRevenue,
        monthlyRevenue,
        pendingPayments,
        activeContracts,
        totalContracts: contracts.length,
        totalPayments: payments.length,
        averageContractValue: contracts.length > 0 
          ? contracts.reduce((sum, c) => sum + (c.valor || 0), 0) / contracts.length 
          : 0
      };
      
      return { success: true, data: stats };
    } catch (error) {
      console.error('Erro ao calcular estatísticas financeiras:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Calcular receita por período
  static async getRevenueByPeriod(period = 'month') {
    try {
      const result = await this.getAllPayments();
      if (!result.success) return result;
      
      const payments = result.data.filter(p => p.status === 'confirmado');
      const now = new Date();
      
      let startDate;
      switch (period) {
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      const revenue = payments
        .filter(p => new Date(p.dataPagamento) >= startDate)
        .reduce((sum, p) => sum + (p.valor || 0), 0);
      
      return { success: true, data: { period, revenue, startDate: startDate.toISOString() } };
    } catch (error) {
      console.error('Erro ao calcular receita por período:', error);
      return { success: false, error: error.message };
    }
  }
}