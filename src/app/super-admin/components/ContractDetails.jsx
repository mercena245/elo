'use client';

import { useState } from 'react';

export default function ContractDetails({ contratos, onContractUpdate }) {
  const [editingContract, setEditingContract] = useState(null);
  const [showReajusteForm, setShowReajusteForm] = useState(null);
  const [reajusteData, setReajusteData] = useState({
    novoValor: '',
    motivo: '',
    dataVigencia: new Date().toISOString().split('T')[0]
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
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'suspenso':
        return 'bg-red-100 text-red-800';
      case 'cancelado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiasAtrasoColor = (dias) => {
    if (dias === 0) return 'text-green-600';
    if (dias <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSuspendContract = (contratoId) => {
    if (confirm('Tem certeza que deseja suspender este contrato?')) {
      onContractUpdate(contratoId, { status: 'suspenso' });
    }
  };

  const handleReactivateContract = (contratoId) => {
    if (confirm('Tem certeza que deseja reativar este contrato?')) {
      onContractUpdate(contratoId, { status: 'ativo' });
    }
  };

  const handleReajuste = (contratoId) => {
    if (!reajusteData.novoValor || !reajusteData.motivo) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const contrato = contratos.find(c => c.id === contratoId);
    const novoHistorico = [
      ...contrato.historicoReajustes,
      {
        data: reajusteData.dataVigencia,
        valor: parseFloat(reajusteData.novoValor),
        motivo: reajusteData.motivo
      }
    ];

    onContractUpdate(contratoId, {
      valor: parseFloat(reajusteData.novoValor),
      historicoReajustes: novoHistorico
    });

    setShowReajusteForm(null);
    setReajusteData({
      novoValor: '',
      motivo: '',
      dataVigencia: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Contratos Ativos</h3>
          <p className="text-sm text-gray-500">
            Gerencie os contratos das escolas cadastradas
          </p>
        </div>
        <div className="text-sm text-gray-600">
          {contratos.length} contratos encontrados
        </div>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {contratos.map((contrato) => (
          <div key={contrato.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Contract Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {contrato.escolaNome}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Contrato: {contrato.id} • Início: {formatDate(contrato.dataInicio)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contrato.status)}`}>
                    {contrato.status}
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {contrato.plano}
                  </span>
                </div>
              </div>
            </div>

            {/* Contract Details */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Financial Info */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">Valor Mensal</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(contrato.valor)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Vence dia {contrato.dataVencimento}
                  </div>
                </div>

                {/* Next Payment */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">Próximo Vencimento</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(contrato.proximoVencimento)}
                  </div>
                  <div className={`text-sm font-medium ${getDiasAtrasoColor(contrato.diasAtraso)}`}>
                    {contrato.diasAtraso === 0 
                      ? 'Em dia'
                      : `${contrato.diasAtraso} dias de atraso`
                    }
                  </div>
                </div>

                {/* Contract Duration */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">Duração</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.floor((new Date() - new Date(contrato.dataInicio)) / (1000 * 60 * 60 * 24 * 30))} meses
                  </div>
                  <div className="text-sm text-gray-600">
                    Desde {formatDate(contrato.dataInicio)}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">Ações</div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => setShowReajusteForm(contrato.id)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      💰 Reajustar Valor
                    </button>
                    
                    {contrato.status === 'ativo' ? (
                      <button
                        onClick={() => handleSuspendContract(contrato.id)}
                        className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        ⏸️ Suspender
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivateContract(contrato.id)}
                        className="inline-flex items-center px-3 py-1 border border-green-300 text-xs font-medium rounded text-green-700 bg-green-50 hover:bg-green-100"
                      >
                        ▶️ Reativar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Reajuste Form */}
              {showReajusteForm === contrato.id && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h5 className="text-sm font-medium text-gray-900 mb-4">Reajuste de Contrato</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Novo Valor *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={reajusteData.novoValor}
                        onChange={(e) => setReajusteData({...reajusteData, novoValor: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Data de Vigência *</label>
                      <input
                        type="date"
                        value={reajusteData.dataVigencia}
                        onChange={(e) => setReajusteData({...reajusteData, dataVigencia: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Motivo *</label>
                      <select
                        value={reajusteData.motivo}
                        onChange={(e) => setReajusteData({...reajusteData, motivo: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Selecionar motivo</option>
                        <option value="Reajuste anual">Reajuste anual</option>
                        <option value="Aumento de recursos">Aumento de recursos</option>
                        <option value="Mudança de plano">Mudança de plano</option>
                        <option value="Correção inflacionária">Correção inflacionária</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-3">
                    <button
                      onClick={() => handleReajuste(contrato.id)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Aplicar Reajuste
                    </button>
                    <button
                      onClick={() => setShowReajusteForm(null)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Histórico de Reajustes */}
              {contrato.historicoReajustes.length > 1 && (
                <div className="mt-6">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Histórico de Reajustes</h5>
                  <div className="space-y-2">
                    {contrato.historicoReajustes.reverse().map((reajuste, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(reajuste.valor)}
                          </div>
                          <div className="text-xs text-gray-500">{reajuste.motivo}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(reajuste.data)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {contratos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
          <p className="text-gray-500">
            Os contratos das escolas aparecerão aqui quando forem criados.
          </p>
        </div>
      )}
    </div>
  );
}