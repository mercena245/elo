'use client';

import { useState, useEffect } from 'react';
import PaymentHistory from './PaymentHistory';
import ContractDetails from './ContractDetails';
import BillingSettings from './BillingSettings';

export default function FinancialManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [financialData, setFinancialData] = useState({
    overview: {
      totalReceita: 0,
      receitaMensal: 0,
      pendencias: 0,
      inadimplencia: 0
    },
    contratos: [],
    pagamentos: [],
    configuracoes: {
      taxaMulta: 2.0,
      taxaJuros: 1.0,
      diasVencimento: 5
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      // TODO: Implementar carregamento real do Firebase
      
      // Dados simulados
      const mockData = {
        overview: {
          totalReceita: 47250.00,
          receitaMensal: 31500.00,
          pendencias: 8750.00,
          inadimplencia: 3250.00
        },
        contratos: [
          {
            id: 'contrato-001',
            escolaId: 'escola-001',
            escolaNome: 'Escola ABC',
            plano: 'premium',
            valor: 2500.00,
            dataInicio: '2024-01-15',
            dataVencimento: 15,
            status: 'ativo',
            proximoVencimento: '2024-10-15',
            diasAtraso: 0,
            historicoReajustes: [
              { data: '2024-01-15', valor: 2500.00, motivo: 'Contrato inicial' }
            ]
          },
          {
            id: 'contrato-002',
            escolaId: 'escola-002',
            escolaNome: 'Colégio XYZ',
            plano: 'basico',
            valor: 1200.00,
            dataInicio: '2024-03-01',
            dataVencimento: 5,
            status: 'ativo',
            proximoVencimento: '2024-10-05',
            diasAtraso: 5,
            historicoReajustes: [
              { data: '2024-03-01', valor: 1200.00, motivo: 'Contrato inicial' }
            ]
          }
        ],
        pagamentos: [
          {
            id: 'pag-001',
            contratoId: 'contrato-001',
            escolaNome: 'Escola ABC',
            valor: 2500.00,
            dataVencimento: '2024-09-15',
            dataPagamento: '2024-09-14',
            status: 'pago',
            formaPagamento: 'pix',
            observacoes: 'Pagamento em dia'
          },
          {
            id: 'pag-002',
            contratoId: 'contrato-002',
            escolaNome: 'Colégio XYZ',
            valor: 1200.00,
            dataVencimento: '2024-09-05',
            dataPagamento: null,
            status: 'vencido',
            formaPagamento: null,
            observacoes: 'Aguardando pagamento'
          }
        ]
      };

      setFinancialData(mockData);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContractUpdate = (contratoId, updates) => {
    setFinancialData(prev => ({
      ...prev,
      contratos: prev.contratos.map(contrato =>
        contrato.id === contratoId ? { ...contrato, ...updates } : contrato
      )
    }));
  };

  const handlePaymentUpdate = (pagamentoId, updates) => {
    setFinancialData(prev => ({
      ...prev,
      pagamentos: prev.pagamentos.map(pagamento =>
        pagamento.id === pagamentoId ? { ...pagamento, ...updates } : pagamento
      )
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencido':
        return 'bg-red-100 text-red-800';
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'suspenso':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: '📊' },
    { id: 'contracts', name: 'Contratos', icon: '📋' },
    { id: 'payments', name: 'Pagamentos', icon: '💳' },
    { id: 'settings', name: 'Configurações', icon: '⚙️' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Carregando dados financeiros...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gerenciamento Financeiro</h2>
        <p className="mt-1 text-sm text-gray-500">
          Controle de contratos, pagamentos e faturamento das escolas
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      💰
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Receita Total</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(financialData.overview.totalReceita)}
                    </div>
                    <div className="text-sm text-green-600">Acumulado</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      📈
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Receita Mensal</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(financialData.overview.receitaMensal)}
                    </div>
                    <div className="text-sm text-blue-600">Este mês</div>
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
                    <div className="text-sm font-medium text-gray-500">Pendências</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(financialData.overview.pendencias)}
                    </div>
                    <div className="text-sm text-yellow-600">A receber</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      🚨
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Inadimplência</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(financialData.overview.inadimplencia)}
                    </div>
                    <div className="text-sm text-red-600">Em atraso</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Transações Recentes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Escola
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {financialData.pagamentos.slice(0, 5).map((pagamento) => (
                    <tr key={pagamento.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pagamento.escolaNome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(pagamento.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(pagamento.dataVencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pagamento.status)}`}>
                          {pagamento.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {pagamento.status === 'vencido' && (
                          <button className="text-indigo-600 hover:text-indigo-900">
                            Registrar Pagamento
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <ContractDetails
          contratos={financialData.contratos}
          onContractUpdate={handleContractUpdate}
        />
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <PaymentHistory
          pagamentos={financialData.pagamentos}
          onPaymentUpdate={handlePaymentUpdate}
        />
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <BillingSettings
          configuracoes={financialData.configuracoes}
          onSettingsUpdate={(newSettings) =>
            setFinancialData(prev => ({ ...prev, configuracoes: newSettings }))
          }
        />
      )}
    </div>
  );
}