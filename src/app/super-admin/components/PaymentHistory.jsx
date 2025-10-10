'use client';

import { useState } from 'react';

export default function PaymentHistory({ pagamentos, onPaymentUpdate }) {
  const [filter, setFilter] = useState('all');
  const [showPaymentForm, setShowPaymentForm] = useState(null);
  const [paymentData, setPaymentData] = useState({
    dataPagamento: new Date().toISOString().split('T')[0],
    valorPago: '',
    formaPagamento: '',
    observacoes: ''
  });

  const filteredPayments = pagamentos.filter(pagamento => {
    if (filter === 'all') return true;
    return pagamento.status === filter;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencido':
        return 'bg-red-100 text-red-800';
      case 'parcial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pago':
        return '✅';
      case 'pendente':
        return '⏰';
      case 'vencido':
        return '🚨';
      case 'parcial':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const handleRegisterPayment = (pagamentoId) => {
    if (!paymentData.valorPago || !paymentData.formaPagamento) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    onPaymentUpdate(pagamentoId, {
      status: 'pago',
      dataPagamento: paymentData.dataPagamento,
      valorPago: parseFloat(paymentData.valorPago),
      formaPagamento: paymentData.formaPagamento,
      observacoes: paymentData.observacoes
    });

    setShowPaymentForm(null);
    setPaymentData({
      dataPagamento: new Date().toISOString().split('T')[0],
      valorPago: '',
      formaPagamento: '',
      observacoes: ''
    });
  };

  const openPaymentForm = (pagamento) => {
    setPaymentData({
      dataPagamento: new Date().toISOString().split('T')[0],
      valorPago: pagamento.valor.toString(),
      formaPagamento: '',
      observacoes: ''
    });
    setShowPaymentForm(pagamento.id);
  };

  const formasPagamento = [
    { value: 'pix', label: 'PIX' },
    { value: 'transferencia', label: 'Transferência Bancária' },
    { value: 'cartao', label: 'Cartão de Crédito' },
    { value: 'boleto', label: 'Boleto Bancário' },
    { value: 'dinheiro', label: 'Dinheiro' }
  ];

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Histórico de Pagamentos</h3>
          <p className="text-sm text-gray-500">
            Acompanhe todos os pagamentos das escolas
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Todos os Status</option>
            <option value="pago">Pagos</option>
            <option value="pendente">Pendentes</option>
            <option value="vencido">Vencidos</option>
            <option value="parcial">Parciais</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-800">Pagos</div>
          <div className="text-2xl font-bold text-green-900">
            {pagamentos.filter(p => p.status === 'pago').length}
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm font-medium text-yellow-800">Pendentes</div>
          <div className="text-2xl font-bold text-yellow-900">
            {pagamentos.filter(p => p.status === 'pendente').length}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-800">Vencidos</div>
          <div className="text-2xl font-bold text-red-900">
            {pagamentos.filter(p => p.status === 'vencido').length}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-800">Total</div>
          <div className="text-2xl font-bold text-blue-900">
            {formatCurrency(pagamentos.reduce((sum, p) => sum + (p.valorPago || p.valor), 0))}
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
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
                  Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((pagamento) => (
                <tr key={pagamento.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {pagamento.escolaNome}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {pagamento.contratoId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(pagamento.valor)}
                    </div>
                    {pagamento.valorPago && pagamento.valorPago !== pagamento.valor && (
                      <div className="text-sm text-orange-600">
                        Pago: {formatCurrency(pagamento.valorPago)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(pagamento.dataVencimento)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pagamento.dataPagamento ? formatDate(pagamento.dataPagamento) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pagamento.status)}`}>
                      <span className="mr-1">{getStatusIcon(pagamento.status)}</span>
                      {pagamento.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pagamento.formaPagamento || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {pagamento.status === 'vencido' || pagamento.status === 'pendente' ? (
                      <button
                        onClick={() => openPaymentForm(pagamento)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Registrar Pagamento
                      </button>
                    ) : pagamento.status === 'pago' ? (
                      <span className="text-green-600">✓ Pago</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Registrar Pagamento</h3>
              <button
                onClick={() => setShowPaymentForm(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Data do Pagamento *</label>
                <input
                  type="date"
                  value={paymentData.dataPagamento}
                  onChange={(e) => setPaymentData({...paymentData, dataPagamento: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Valor Pago *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.valorPago}
                  onChange={(e) => setPaymentData({...paymentData, valorPago: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Forma de Pagamento *</label>
                <select
                  value={paymentData.formaPagamento}
                  onChange={(e) => setPaymentData({...paymentData, formaPagamento: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecionar forma</option>
                  {formasPagamento.map((forma) => (
                    <option key={forma.value} value={forma.value}>
                      {forma.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea
                  value={paymentData.observacoes}
                  onChange={(e) => setPaymentData({...paymentData, observacoes: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Observações sobre o pagamento..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentForm(null)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRegisterPayment(showPaymentForm)}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Registrar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'Nenhum pagamento encontrado' : `Nenhum pagamento ${filter} encontrado`}
          </h3>
          <p className="text-gray-500">
            Os pagamentos das escolas aparecerão aqui conforme forem registrados.
          </p>
        </div>
      )}
    </div>
  );
}