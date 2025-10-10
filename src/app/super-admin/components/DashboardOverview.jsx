'use client';

import { useState, useEffect } from 'react';

export default function DashboardOverview({ stats }) {
  const [alerts, setAlerts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadAlerts();
    loadRecentActivity();
  }, []);

  const loadAlerts = () => {
    // Simular alertas do sistema
    setAlerts([
      {
        id: 1,
        type: 'warning',
        title: 'Pagamento em Atraso',
        message: 'Escola ABC tem 3 mensalidades em atraso',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 2,
        type: 'info',
        title: 'Nova Escola Cadastrada',
        message: 'Escola XYZ foi adicionada ao sistema',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        id: 3,
        type: 'success',
        title: 'Backup Completo',
        message: 'Backup diário executado com sucesso',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ]);
  };

  const loadRecentActivity = () => {
    // Simular atividade recente
    setRecentActivity([
      {
        id: 1,
        user: 'admin@escolaabc.com',
        action: 'Login realizado',
        school: 'Escola ABC',
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: 2,
        user: 'coord@escolaxyz.com',
        action: 'Aluno cadastrado',
        school: 'Escola XYZ',
        timestamp: new Date(Date.now() - 45 * 60 * 1000)
      },
      {
        id: 3,
        user: 'prof@escola123.com',
        action: 'Notas lançadas',
        school: 'Escola 123',
        timestamp: new Date(Date.now() - 60 * 60 * 1000)
      }
    ]);
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'error':
        return '🚨';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}min atrás`;
    return 'Agora';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  🏫
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total de Escolas</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalSchools}</div>
                <div className="text-sm text-green-600">
                  {stats.activeSchools} ativas
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  👥
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total de Usuários</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                <div className="text-sm text-blue-600">
                  Ativos no sistema
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  💰
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Receita Mensal</div>
                <div className="text-2xl font-bold text-gray-900">
                  R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-green-600">
                  +8.2% vs mês anterior
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  ⏰
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Pagamentos Pendentes</div>
                <div className="text-2xl font-bold text-gray-900">
                  R$ {stats.pendingPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-yellow-600">
                  Requer atenção
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Alertas do Sistema</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
                >
                  <div className="flex items-start">
                    <span className="mr-3 text-lg">{getAlertIcon(alert.type)}</span>
                    <div className="flex-1">
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm mt-1">{alert.message}</p>
                      <p className="text-xs mt-2 opacity-75">
                        {formatTime(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Atividade Recente</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </div>
                    <div className="text-sm text-gray-500">
                      {activity.user} • {activity.school}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatTime(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left">
              <div className="text-2xl mb-2">🏫</div>
              <div className="font-medium text-gray-900">Nova Escola</div>
              <div className="text-sm text-gray-500">Cadastrar nova escola</div>
            </button>
            
            <button className="p-4 border border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium text-gray-900">Relatório</div>
              <div className="text-sm text-gray-500">Gerar relatório geral</div>
            </button>
            
            <button className="p-4 border border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left">
              <div className="text-2xl mb-2">💾</div>
              <div className="font-medium text-gray-900">Backup</div>
              <div className="text-sm text-gray-500">Backup manual</div>
            </button>
            
            <button className="p-4 border border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left">
              <div className="text-2xl mb-2">⚙️</div>
              <div className="font-medium text-gray-900">Configurar</div>
              <div className="text-sm text-gray-500">Configurações globais</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}