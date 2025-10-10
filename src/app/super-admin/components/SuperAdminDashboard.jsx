'use client';

import { useState, useEffect } from 'react';
import SchoolManagement from './SchoolManagement';
import UserManagement from './UserManagement';
import FinancialManagement from './FinancialManagement';
import SystemSettings from './SystemSettings';
import DashboardOverview from './DashboardOverview';

export default function SuperAdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    // TODO: Implementar carregamento real das estatísticas
    setStats({
      totalSchools: 15,
      activeSchools: 13,
      totalUsers: 247,
      monthlyRevenue: 45780.50,
      pendingPayments: 3450.00
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('superAdminAuth');
    window.location.reload();
  };

  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: '📊' },
    { id: 'schools', name: 'Escolas', icon: '🏫' },
    { id: 'users', name: 'Usuários', icon: '👥' },
    { id: 'financial', name: 'Financeiro', icon: '💰' },
    { id: 'settings', name: 'Configurações', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  🏢 ELO Super Admin
                </h1>
              </div>
              <div className="ml-6 flex items-center text-sm text-gray-500">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Sistema Multi-Tenant
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Stats Quick View */}
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{stats.totalSchools}</div>
                  <div>Escolas</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{stats.totalUsers}</div>
                  <div>Usuários</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">
                    R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div>Receita/Mês</div>
                </div>
              </div>

              {/* User Menu */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-right">
                    <div className="font-medium text-gray-900">Super Admin</div>
                    <div className="text-gray-500">{user?.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
                    title="Sair"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'overview' && <DashboardOverview stats={stats} />}
        {activeTab === 'schools' && <SchoolManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'financial' && <FinancialManagement />}
        {activeTab === 'settings' && <SystemSettings />}
      </main>
    </div>
  );
}