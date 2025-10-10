'use client';

import { useState } from 'react';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    sistema: {
      versao: '2.0.0',
      ambiente: 'producao',
      debug: false,
      manutencao: false
    },
    firebase: {
      masterProjectId: 'elo-school-master',
      masterDatabaseURL: 'https://elo-school-master-default-rtdb.firebaseio.com/',
      masterStorageBucket: 'elo-school-master.firebasestorage.app',
      apiKey: '••••••••••••••••••••••••••••••••••••••••'
    },
    email: {
      servidor: 'smtp.gmail.com',
      porta: 587,
      usuario: 'noreply@eloschool.com',
      senha: '••••••••••••••••'
    },
    backup: {
      automatico: true,
      frequencia: 'diario',
      horario: '02:00',
      retencao: 30
    },
    seguranca: {
      sessaoExpira: 24,
      tentativasLogin: 5,
      bloqueioTempo: 15,
      senhaComplexidade: true
    }
  });

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('sistema');

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      // Simular backup
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('Backup realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao realizar backup:', error);
      alert('Erro ao realizar backup');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'sistema', name: 'Sistema', icon: '⚙️' },
    { id: 'firebase', name: 'Firebase', icon: '🔥' },
    { id: 'email', name: 'Email', icon: '📧' },
    { id: 'backup', name: 'Backup', icon: '💾' },
    { id: 'seguranca', name: 'Segurança', icon: '🔒' }
  ];

  const renderSistemaSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Configurações do Sistema</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Versão do Sistema</label>
          <input
            type="text"
            value={settings.sistema.versao}
            readOnly
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ambiente</label>
          <select
            value={settings.sistema.ambiente}
            onChange={(e) => handleSettingChange('sistema', 'ambiente', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="desenvolvimento">Desenvolvimento</option>
            <option value="homologacao">Homologação</option>
            <option value="producao">Produção</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.sistema.debug}
            onChange={(e) => handleSettingChange('sistema', 'debug', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">
            Modo Debug Ativo
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.sistema.manutencao}
            onChange={(e) => handleSettingChange('sistema', 'manutencao', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">
            Modo Manutenção
          </label>
        </div>
      </div>

      {settings.sistema.manutencao && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Modo Manutenção Ativo</h4>
              <p className="text-sm text-yellow-700 mt-1">
                O sistema estará indisponível para todos os usuários, exceto super-admins.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFirebaseSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Configurações Firebase</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Project ID Master</label>
          <input
            type="text"
            value={settings.firebase.masterProjectId}
            onChange={(e) => handleSettingChange('firebase', 'masterProjectId', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Database URL Master</label>
          <input
            type="url"
            value={settings.firebase.masterDatabaseURL}
            onChange={(e) => handleSettingChange('firebase', 'masterDatabaseURL', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Storage Bucket Master</label>
          <input
            type="text"
            value={settings.firebase.masterStorageBucket}
            onChange={(e) => handleSettingChange('firebase', 'masterStorageBucket', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">API Key</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="password"
              value={settings.firebase.apiKey}
              onChange={(e) => handleSettingChange('firebase', 'apiKey', e.target.value)}
              className="flex-1 border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="button"
              className="relative -ml-px inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100"
            >
              Regenerar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Configuração Crítica</h4>
            <p className="text-sm text-blue-700 mt-1">
              Estas configurações são fundamentais para o funcionamento do sistema. Alterações incorretas podem causar instabilidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Configurações de Email</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Servidor SMTP</label>
          <input
            type="text"
            value={settings.email.servidor}
            onChange={(e) => handleSettingChange('email', 'servidor', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Porta</label>
          <input
            type="number"
            value={settings.email.porta}
            onChange={(e) => handleSettingChange('email', 'porta', parseInt(e.target.value))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Usuário</label>
          <input
            type="email"
            value={settings.email.usuario}
            onChange={(e) => handleSettingChange('email', 'usuario', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Senha</label>
          <input
            type="password"
            value={settings.email.senha}
            onChange={(e) => handleSettingChange('email', 'senha', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Testar Conexão
        </button>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Enviar Email de Teste
        </button>
      </div>
    </div>
  );

  const renderBackupSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Configurações de Backup</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.backup.automatico}
            onChange={(e) => handleSettingChange('backup', 'automatico', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">
            Backup Automático
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Frequência</label>
          <select
            value={settings.backup.frequencia}
            onChange={(e) => handleSettingChange('backup', 'frequencia', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="diario">Diário</option>
            <option value="semanal">Semanal</option>
            <option value="mensal">Mensal</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Horário</label>
          <input
            type="time"
            value={settings.backup.horario}
            onChange={(e) => handleSettingChange('backup', 'horario', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Retenção (dias)</label>
          <input
            type="number"
            value={settings.backup.retencao}
            onChange={(e) => handleSettingChange('backup', 'retencao', parseInt(e.target.value))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={handleBackup}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Realizando Backup...' : 'Backup Manual'}
        </button>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Ver Histórico
        </button>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-800 mb-2">Último Backup</h4>
        <p className="text-sm text-green-700">
          Realizado em: 10/10/2024 às 02:00:15
        </p>
        <p className="text-sm text-green-700">
          Status: Sucesso • Tamanho: 247 MB
        </p>
      </div>
    </div>
  );

  const renderSegurancaSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Configurações de Segurança</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Expiração da Sessão (horas)</label>
          <input
            type="number"
            value={settings.seguranca.sessaoExpira}
            onChange={(e) => handleSettingChange('seguranca', 'sessaoExpira', parseInt(e.target.value))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tentativas de Login</label>
          <input
            type="number"
            value={settings.seguranca.tentativasLogin}
            onChange={(e) => handleSettingChange('seguranca', 'tentativasLogin', parseInt(e.target.value))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tempo de Bloqueio (minutos)</label>
          <input
            type="number"
            value={settings.seguranca.bloqueioTempo}
            onChange={(e) => handleSettingChange('seguranca', 'bloqueioTempo', parseInt(e.target.value))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={settings.seguranca.senhaComplexidade}
            onChange={(e) => handleSettingChange('seguranca', 'senhaComplexidade', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">
            Exigir Senha Complexa
          </label>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">Política de Senhas</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Mínimo 8 caracteres</li>
          <li>• Pelo menos 1 letra maiúscula</li>
          <li>• Pelo menos 1 número</li>
          <li>• Pelo menos 1 caractere especial</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure as opções globais do sistema multi-tenant
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
        {/* Sidebar */}
        <div className="lg:w-1/4">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === section.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3">{section.icon}</span>
                {section.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:w-3/4">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            {activeSection === 'sistema' && renderSistemaSection()}
            {activeSection === 'firebase' && renderFirebaseSection()}
            {activeSection === 'email' && renderEmailSection()}
            {activeSection === 'backup' && renderBackupSection()}
            {activeSection === 'seguranca' && renderSegurancaSection()}
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
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
        </div>
      </div>
    </div>
  );
}