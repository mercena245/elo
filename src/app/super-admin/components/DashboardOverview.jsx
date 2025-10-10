'use client';

import { useState, useEffect } from 'react';
import { SchoolManagementService } from '../../../services/schoolManagementService';
import { UserManagementService } from '../../../services/userManagementService';
import { FinancialManagementService } from '../../../services/financialManagementService';

export default function DashboardOverview({ stats }) {
  const [realStats, setRealStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    activeContracts: 0
  });
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
    loadAlerts();
    loadRecentActivity();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Por enquanto usar dados mockados até popular o banco
      setRealStats({
        totalSchools: 4,
        activeSchools: 3,
        totalUsers: 12,
        monthlyRevenue: 2799.70,
        pendingPayments: 1299.90,
        totalRevenue: 5499.40,
        activeContracts: 3
      });
      
      // Quando o banco estiver populado, usar isso:
      /*
      const [schoolStatsResult, userStatsResult, financialStatsResult] = await Promise.all([
        SchoolManagementService.getSchoolStats(),
        UserManagementService.getUserStats(),
        FinancialManagementService.getFinancialStats()
      ]);

      if (schoolStatsResult.success && userStatsResult.success && financialStatsResult.success) {
        const schoolStats = schoolStatsResult.data;
        const userStats = userStatsResult.data;
        const financialStats = financialStatsResult.data;

        setRealStats({
          totalSchools: schoolStats.total,
          activeSchools: schoolStats.ativas,
          totalUsers: userStats.total,
          monthlyRevenue: financialStats.monthlyRevenue,
          pendingPayments: financialStats.pendingPayments,
          totalRevenue: financialStats.totalRevenue,
          activeContracts: financialStats.activeContracts
        });
      }
      */
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = () => {
    setAlerts([
      {
        id: 1,
        type: 'warning',
        title: 'Pagamentos em Atraso',
        message: '1 pagamento em atraso - Instituto Brasil',
        timestamp: new Date()
      },
      {
        id: 2,
        type: 'info',
        title: 'Escolas Pendentes',
        message: '1 escola aguardando aprovação',
        timestamp: new Date()
      }
    ]);
  };

  const loadRecentActivity = () => {
    setRecentActivity([
      {
        id: 1,
        type: 'school',
        title: 'Nova escola cadastrada',
        description: 'Instituto Educacional Brasil',
        timestamp: '2024-10-10T10:30:00Z',
        icon: '🏫'
      },
      {
        id: 2,
        type: 'payment',
        title: 'Pagamento confirmado',
        description: 'Colégio Esperança - R$ 599,90',
        timestamp: '2024-10-10T09:15:00Z',
        icon: '💰'
      },
      {
        id: 3,
        type: 'user',
        title: 'Novo usuário',
        description: 'Ana Costa - coordenador',
        timestamp: '2024-10-10T08:45:00Z',
        icon: '👤'
      }
    ]);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <span className="text-blue-600 font-semibold">🏫</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total de Escolas</p>
              <p className="text-2xl font-semibold text-gray-900">{realStats.totalSchools}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-green-600">↗</span>
              <span className="text-green-600 ml-1">{realStats.activeSchools} ativas</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <span className="text-green-600 font-semibold">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Usuários Ativos</p>
              <p className="text-2xl font-semibold text-gray-900">{realStats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
                <span className="text-indigo-600 font-semibold">💰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Receita Mensal</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(realStats.monthlyRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">⏰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pendências</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(realStats.pendingPayments)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Atividades Recentes</h3>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhuma atividade recente</p>
            )}
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Alertas do Sistema</h3>
          </div>
          <div className="p-6">
            {alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
                  >
                    <div className="flex items-start">
                      <span className="text-lg mr-3">{getAlertIcon(alert.type)}</span>
                      <div className="flex-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm mt-1">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="text-4xl">✅</span>
                <p className="text-gray-500 mt-2">Nenhum alerta no momento</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo Financeiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{formatCurrency(realStats.totalRevenue)}</p>
            <p className="text-sm text-gray-500 mt-1">Receita Total</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{realStats.activeContracts}</p>
            <p className="text-sm text-gray-500 mt-1">Contratos Ativos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600">
              {realStats.totalUsers > 0 ? (realStats.totalRevenue / realStats.totalUsers).toFixed(0) : '0'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Receita por Usuário</p>
          </div>
        </div>
      </div>
    </div>
  );
}