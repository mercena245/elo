'use client';

import { useState } from 'react';

export default function BillingSettings({ configuracoes, onSettingsUpdate }) {
  const [settings, setSettings] = useState(configuracoes);
  const [loading, setLoading] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setShowSaveButton(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSettingsUpdate(settings);
      setShowSaveButton(false);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(configuracoes);
    setShowSaveButton(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Configurações de Cobrança</h3>
        <p className="text-sm text-gray-500">
          Configure as regras globais de cobrança e inadimplência
        </p>
      </div>

      {/* Settings Form */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-base font-medium text-gray-900">Configurações Gerais</h4>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Taxa de Multa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Taxa de Multa por Atraso (%)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={settings.taxaMulta}
                  onChange={(e) => handleSettingChange('taxaMulta', parseFloat(e.target.value))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Multa aplicada sobre o valor total em caso de atraso
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Taxa de Juros Diária (%)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={settings.taxaJuros}
                  onChange={(e) => handleSettingChange('taxaJuros', parseFloat(e.target.value))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">% ao dia</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Juros aplicados diariamente após o vencimento
              </p>
            </div>
          </div>

          {/* Prazo de Vencimento */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prazo para Suspensão (dias)
            </label>
            <div className="mt-1">
              <input
                type="number"
                min="1"
                max="30"
                value={settings.diasVencimento}
                onChange={(e) => handleSettingChange('diasVencimento', parseInt(e.target.value))}
                className="block w-32 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Dias após vencimento para suspensão automática da escola
            </p>
          </div>

          {/* Notificações */}
          <div className="space-y-4">
            <h5 className="text-sm font-medium text-gray-900">Notificações Automáticas</h5>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Lembrete antes do vencimento</div>
                  <div className="text-sm text-gray-500">Enviar 3 dias antes do vencimento</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notificarAntes || false}
                    onChange={(e) => handleSettingChange('notificarAntes', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Notificação de vencimento</div>
                  <div className="text-sm text-gray-500">Enviar no dia do vencimento</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notificarVencimento || false}
                    onChange={(e) => handleSettingChange('notificarVencimento', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Cobrança de inadimplência</div>
                  <div className="text-sm text-gray-500">Enviar diariamente após vencimento</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notificarAtraso || false}
                    onChange={(e) => handleSettingChange('notificarAtraso', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Método de Pagamento Preferencial */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Método de Pagamento Preferencial
            </label>
            <div className="mt-1">
              <select
                value={settings.metodoPagamentoPadrao || 'pix'}
                onChange={(e) => handleSettingChange('metodoPagamentoPadrao', e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="pix">PIX</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="transferencia">Transferência Bancária</option>
                <option value="cartao">Cartão de Crédito</option>
              </select>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Método sugerido para novas escolas
            </p>
          </div>

          {/* Informações Bancárias */}
          <div className="border-t border-gray-200 pt-6">
            <h5 className="text-sm font-medium text-gray-900 mb-4">Dados Bancários para Recebimento</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Banco</label>
                <input
                  type="text"
                  value={settings.banco || ''}
                  onChange={(e) => handleSettingChange('banco', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Banco do Brasil"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Agência</label>
                <input
                  type="text"
                  value={settings.agencia || ''}
                  onChange={(e) => handleSettingChange('agencia', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0000-0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Conta</label>
                <input
                  type="text"
                  value={settings.conta || ''}
                  onChange={(e) => handleSettingChange('conta', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="00000-0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Chave PIX</label>
                <input
                  type="text"
                  value={settings.chavePix || ''}
                  onChange={(e) => handleSettingChange('chavePix', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="email@empresa.com ou CNPJ"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulador de Cobrança */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-base font-medium text-gray-900">Simulador de Cobrança</h4>
        </div>
        
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">Valor Original</div>
                <div className="text-lg font-bold text-gray-900">R$ 1.000,00</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Após 10 dias de atraso</div>
                <div className="text-lg font-bold text-yellow-600">
                  R$ {(1000 + (1000 * settings.taxaMulta / 100) + (1000 * settings.taxaJuros / 100 * 10)).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  Multa: R$ {(1000 * settings.taxaMulta / 100).toFixed(2)} + 
                  Juros: R$ {(1000 * settings.taxaJuros / 100 * 10).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Após 30 dias de atraso</div>
                <div className="text-lg font-bold text-red-600">
                  R$ {(1000 + (1000 * settings.taxaMulta / 100) + (1000 * settings.taxaJuros / 100 * 30)).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  Multa: R$ {(1000 * settings.taxaMulta / 100).toFixed(2)} + 
                  Juros: R$ {(1000 * settings.taxaJuros / 100 * 30).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {showSaveButton && (
        <div className="flex items-center justify-end space-x-3 bg-white border border-gray-200 rounded-lg p-4">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </button>
        </div>
      )}
    </div>
  );
}