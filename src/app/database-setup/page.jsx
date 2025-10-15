'use client';

import { useState } from 'react';
import { populateDatabase } from '../../utils/populateDatabase';
import { SchoolManagementService } from '../../services/schoolManagementService';
import { userManagementService } from '../../services/userManagementService';
import { FinancialManagementService } from '../../services/financialManagementService';

export default function DatabaseSetupPage() {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev, { message, type, timestamp }]);
  };

  const handlePopulateDatabase = async () => {
    setLoading(true);
    setLog([]);
    
    addLog('🚀 Iniciando população do banco de dados...', 'info');
    
    try {
      const result = await populateDatabase();
      
      if (result.success) {
        addLog('✅ Banco populado com sucesso!', 'success');
        await loadStats();
      } else {
        addLog(`❌ Erro: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`💥 Erro crítico: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      addLog('📊 Carregando estatísticas...', 'info');
      
      const [schoolStats, userStats, financialStats] = await Promise.all([
        SchoolManagementService.getSchoolStats(),
        userManagementService.getUserStats(),
        FinancialManagementService.getFinancialStats()
      ]);

      if (schoolStats.success && userStats.success && financialStats.success) {
        setStats({
          schools: schoolStats.data,
          users: userStats.data,
          financial: financialStats.data
        });
        addLog('✅ Estatísticas carregadas!', 'success');
      } else {
        addLog('⚠️ Erro ao carregar algumas estatísticas', 'warning');
      }
    } catch (error) {
      addLog(`❌ Erro ao carregar stats: ${error.message}`, 'error');
    }
  };

  const testServices = async () => {
    setLoading(true);
    setLog([]);
    
    addLog('🧪 Testando serviços do Firebase...', 'info');
    
    try {
      // Testar SchoolManagementService
      addLog('Testando SchoolManagementService...', 'info');
      const schoolsResult = await SchoolManagementService.getAllSchools();
      addLog(`Escolas encontradas: ${schoolsResult.success ? schoolsResult.data.length : 'Erro'}`, 
             schoolsResult.success ? 'success' : 'error');

      // Testar userManagementService  
      addLog('Testando userManagementService...', 'info');
      const usersResult = await userManagementService.getAllUsers();
      addLog(`Usuários encontrados: ${usersResult.success ? usersResult.data.length : 'Erro'}`, 
             usersResult.success ? 'success' : 'error');

      // Testar FinancialManagementService
      addLog('Testando FinancialManagementService...', 'info');
      const paymentsResult = await FinancialManagementService.getAllPayments();
      addLog(`Pagamentos encontrados: ${paymentsResult.success ? paymentsResult.data.length : 'Erro'}`, 
             paymentsResult.success ? 'success' : 'error');

      addLog('✅ Teste de serviços concluído!', 'success');
      await loadStats();
    } catch (error) {
      addLog(`💥 Erro nos testes: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🔧 Configuração do Banco de Gerenciamento
          </h1>
          <p className="text-gray-600">
            Utilitário para popular e testar o banco Firebase do sistema de gerenciamento multi-tenant
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Banco:</strong> https://gerenciamento-elo-school.firebaseio.com/
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handlePopulateDatabase}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? '⏳ Populando...' : '🌱 Popular Banco'}
            </button>
            
            <button
              onClick={testServices}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? '⏳ Testando...' : '🧪 Testar Serviços'}
            </button>

            <button
              onClick={loadStats}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              📊 Carregar Stats
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas do Banco</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">🏫 Escolas</h3>
                <p>Total: {stats.schools.total}</p>
                <p>Ativas: {stats.schools.ativas}</p>
                <p>Inativas: {stats.schools.inativas}</p>
                <p>Pendentes: {stats.schools.pendentes}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">👥 Usuários</h3>
                <p>Total: {stats.users.total}</p>
                <p>Ativos: {stats.users.ativos}</p>
                <p>Coordenadores: {stats.users.roles.coordenador}</p>
                <p>Secretários: {stats.users.roles.secretaria}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">💰 Financeiro</h3>
                <p>Receita Total: R$ {stats.financial.totalRevenue.toFixed(2)}</p>
                <p>Receita Mensal: R$ {stats.financial.monthlyRevenue.toFixed(2)}</p>
                <p>Pendências: R$ {stats.financial.pendingPayments.toFixed(2)}</p>
                <p>Contratos Ativos: {stats.financial.activeContracts}</p>
              </div>
            </div>
          </div>
        )}

        {/* Log */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Log de Execução</h2>
          <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto">
            {log.length === 0 ? (
              <p className="text-gray-400">Aguardando execução...</p>
            ) : (
              <div className="space-y-1">
                {log.map((entry, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-gray-400">[{entry.timestamp}]</span>
                    <span className={`ml-2 ${getLogColor(entry.type)}`}>
                      {entry.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">📋 Instruções</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>Clique em "Popular Banco" para inserir dados fictícios</li>
            <li>Use "Testar Serviços" para verificar se os serviços estão funcionando</li>
            <li>Após popular, acesse /super-admin para ver os dados reais</li>
            <li>O sistema agora usará dados reais em vez de mocks</li>
          </ol>
        </div>
      </div>
    </div>
  );
}