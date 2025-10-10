'use client';

import { useState, useEffect } from 'react';

const planos = [
  { 
    id: 'basico', 
    nome: 'Básico', 
    preco: 1200,
    features: ['Até 200 alunos', 'Até 15 professores', 'Módulos básicos', 'Suporte por email'],
    modulos: ['financeiro', 'notas', 'alunos']
  },
  { 
    id: 'intermediario', 
    nome: 'Intermediário', 
    preco: 2000,
    features: ['Até 350 alunos', 'Até 25 professores', 'Todos os módulos', 'Suporte prioritário'],
    modulos: ['financeiro', 'notas', 'alunos', 'secretaria', 'agenda']
  },
  { 
    id: 'premium', 
    nome: 'Premium', 
    preco: 2500,
    features: ['Até 500 alunos', 'Até 30 professores', 'Módulos + extras', 'Suporte 24/7'],
    modulos: ['financeiro', 'notas', 'alunos', 'secretaria', 'agenda', 'relatorios', 'analytics']
  }
];

const modulosDisponiveis = [
  { id: 'financeiro', nome: 'Financeiro', icone: '💰' },
  { id: 'notas', nome: 'Notas e Frequência', icone: '📊' },
  { id: 'alunos', nome: 'Gestão de Alunos', icone: '👨‍🎓' },
  { id: 'secretaria', nome: 'Secretaria Digital', icone: '📋' },
  { id: 'agenda', nome: 'Agenda Médica', icone: '🏥' },
  { id: 'relatorios', nome: 'Relatórios Avançados', icone: '📈' },
  { id: 'analytics', nome: 'Analytics', icone: '📊' }
];

export default function SchoolForm({ school, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    responsavel: '',
    email: '',
    telefone: '',
    endereco: {
      rua: '',
      cidade: '',
      cep: '',
      estado: ''
    },
    plano: 'basico',
    mensalidade: 1200,
    dataVencimento: 15,
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    configuracoes: {
      modulosAtivos: ['financeiro', 'notas', 'alunos'],
      limiteAlunos: 200,
      limiteProfessores: 15
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (school) {
      setFormData(school);
    }
  }, [school]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handlePlanoChange = (novoPlano) => {
    const planoInfo = planos.find(p => p.id === novoPlano);
    if (planoInfo) {
      setFormData(prev => ({
        ...prev,
        plano: novoPlano,
        mensalidade: planoInfo.preco,
        configuracoes: {
          ...prev.configuracoes,
          modulosAtivos: planoInfo.modulos,
          limiteAlunos: planoInfo.id === 'basico' ? 200 : planoInfo.id === 'intermediario' ? 350 : 500,
          limiteProfessores: planoInfo.id === 'basico' ? 15 : planoInfo.id === 'intermediario' ? 25 : 30
        }
      }));
      
      // Auto-gerar URLs do Firebase baseado no nome
      if (formData.nome && !school) {
        const projectName = formData.nome.toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/--+/g, '-')
          .replace(/^-|-$/g, '');
        
        setFormData(prev => ({
          ...prev,
          projectId: projectName,
          databaseURL: `https://${projectName}-default-rtdb.firebaseio.com/`,
          storageBucket: `${projectName}.firebasestorage.app`
        }));
      }
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
        if (!formData.cnpj.trim()) newErrors.cnpj = 'CNPJ é obrigatório';
        if (!formData.responsavel.trim()) newErrors.responsavel = 'Responsável é obrigatório';
        if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
        if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';
        break;
      case 2:
        if (!formData.endereco.rua.trim()) newErrors['endereco.rua'] = 'Endereço é obrigatório';
        if (!formData.endereco.cidade.trim()) newErrors['endereco.cidade'] = 'Cidade é obrigatória';
        if (!formData.endereco.cep.trim()) newErrors['endereco.cep'] = 'CEP é obrigatório';
        if (!formData.endereco.estado.trim()) newErrors['endereco.estado'] = 'Estado é obrigatório';
        break;
      case 3:
        if (!formData.plano) newErrors.plano = 'Plano é obrigatório';
        if (!formData.mensalidade || formData.mensalidade <= 0) newErrors.mensalidade = 'Mensalidade inválida';
        break;
      case 4:
        if (!formData.projectId.trim()) newErrors.projectId = 'Project ID é obrigatório';
        if (!formData.databaseURL.trim()) newErrors.databaseURL = 'Database URL é obrigatória';
        if (!formData.storageBucket.trim()) newErrors.storageBucket = 'Storage Bucket é obrigatório';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao salvar escola:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome da Escola *</label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors.nome ? 'border-red-300' : ''}`}
            placeholder="Ex: Escola ABC"
          />
          {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">CNPJ *</label>
          <input
            type="text"
            value={formData.cnpj}
            onChange={(e) => handleInputChange('cnpj', e.target.value)}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors.cnpj ? 'border-red-300' : ''}`}
            placeholder="00.000.000/0000-00"
          />
          {errors.cnpj && <p className="mt-1 text-sm text-red-600">{errors.cnpj}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Responsável *</label>
          <input
            type="text"
            value={formData.responsavel}
            onChange={(e) => handleInputChange('responsavel', e.target.value)}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors.responsavel ? 'border-red-300' : ''}`}
            placeholder="Nome do responsável"
          />
          {errors.responsavel && <p className="mt-1 text-sm text-red-600">{errors.responsavel}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors.email ? 'border-red-300' : ''}`}
            placeholder="contato@escola.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Telefone *</label>
          <input
            type="tel"
            value={formData.telefone}
            onChange={(e) => handleInputChange('telefone', e.target.value)}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors.telefone ? 'border-red-300' : ''}`}
            placeholder="(11) 99999-9999"
          />
          {errors.telefone && <p className="mt-1 text-sm text-red-600">{errors.telefone}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Endereço</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Endereço Completo *</label>
          <input
            type="text"
            value={formData.endereco.rua}
            onChange={(e) => handleInputChange('endereco.rua', e.target.value)}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors['endereco.rua'] ? 'border-red-300' : ''}`}
            placeholder="Rua, número, complemento"
          />
          {errors['endereco.rua'] && <p className="mt-1 text-sm text-red-600">{errors['endereco.rua']}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cidade *</label>
          <input
            type="text"
            value={formData.endereco.cidade}
            onChange={(e) => handleInputChange('endereco.cidade', e.target.value)}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors['endereco.cidade'] ? 'border-red-300' : ''}`}
            placeholder="Nome da cidade"
          />
          {errors['endereco.cidade'] && <p className="mt-1 text-sm text-red-600">{errors['endereco.cidade']}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Estado *</label>
          <select
            value={formData.endereco.estado}
            onChange={(e) => handleInputChange('endereco.estado', e.target.value)}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors['endereco.estado'] ? 'border-red-300' : ''}`}
          >
            <option value="">Selecionar estado</option>
            <option value="SP">São Paulo</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="MG">Minas Gerais</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="PR">Paraná</option>
            <option value="SC">Santa Catarina</option>
            {/* Adicionar outros estados conforme necessário */}
          </select>
          {errors['endereco.estado'] && <p className="mt-1 text-sm text-red-600">{errors['endereco.estado']}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">CEP *</label>
          <input
            type="text"
            value={formData.endereco.cep}
            onChange={(e) => handleInputChange('endereco.cep', e.target.value)}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors['endereco.cep'] ? 'border-red-300' : ''}`}
            placeholder="00000-000"
          />
          {errors['endereco.cep'] && <p className="mt-1 text-sm text-red-600">{errors['endereco.cep']}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Plano e Configurações</h3>
      
      {/* Seleção de Plano */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Selecionar Plano *</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planos.map((plano) => (
            <div
              key={plano.id}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                formData.plano === plano.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handlePlanoChange(plano.id)}
            >
              <div className="text-center">
                <h4 className="font-semibold text-gray-900">{plano.nome}</h4>
                <div className="text-2xl font-bold text-indigo-600 my-2">
                  {formatCurrency(plano.preco)}
                </div>
                <div className="text-sm text-gray-500 mb-3">por mês</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {plano.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
              {formData.plano === plano.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Configurações Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor Mensalidade *</label>
          <input
            type="number"
            step="0.01"
            value={formData.mensalidade}
            onChange={(e) => handleInputChange('mensalidade', parseFloat(e.target.value))}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors.mensalidade ? 'border-red-300' : ''}`}
          />
          {errors.mensalidade && <p className="mt-1 text-sm text-red-600">{errors.mensalidade}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dia do Vencimento</label>
          <select
            value={formData.dataVencimento}
            onChange={(e) => handleInputChange('dataVencimento', parseInt(e.target.value))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
              <option key={day} value={day}>Dia {day}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Módulos Ativos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Módulos Inclusos</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {modulosDisponiveis.map((modulo) => (
            <div
              key={modulo.id}
              className={`p-3 border rounded-lg ${
                formData.configuracoes.modulosAtivos.includes(modulo.id)
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
            >
              <div className="text-lg mb-1">{modulo.icone}</div>
              <div className="text-sm font-medium">{modulo.nome}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Limites */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Limite de Alunos</label>
          <input
            type="number"
            value={formData.configuracoes.limiteAlunos}
            onChange={(e) => handleInputChange('configuracoes.limiteAlunos', parseInt(e.target.value))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Limite de Professores</label>
          <input
            type="number"
            value={formData.configuracoes.limiteProfessores}
            onChange={(e) => handleInputChange('configuracoes.limiteProfessores', parseInt(e.target.value))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Configuração Firebase</h3>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Configuração Técnica</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Configure os detalhes do projeto Firebase para esta escola. Essas informações são necessárias para o isolamento de dados.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Project ID *</label>
          <input
            type="text"
            value={formData.projectId}
            onChange={(e) => handleInputChange('projectId', e.target.value)}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors.projectId ? 'border-red-300' : ''}`}
            placeholder="projeto-escola-abc"
          />
          {errors.projectId && <p className="mt-1 text-sm text-red-600">{errors.projectId}</p>}
          <p className="mt-1 text-sm text-gray-500">Identificador único do projeto Firebase</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Database URL *</label>
          <input
            type="url"
            value={formData.databaseURL}
            onChange={(e) => handleInputChange('databaseURL', e.target.value)}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors.databaseURL ? 'border-red-300' : ''}`}
            placeholder="https://projeto-escola-abc-default-rtdb.firebaseio.com/"
          />
          {errors.databaseURL && <p className="mt-1 text-sm text-red-600">{errors.databaseURL}</p>}
          <p className="mt-1 text-sm text-gray-500">URL do banco de dados Realtime Database</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Storage Bucket *</label>
          <input
            type="text"
            value={formData.storageBucket}
            onChange={(e) => handleInputChange('storageBucket', e.target.value)}
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors.storageBucket ? 'border-red-300' : ''}`}
            placeholder="projeto-escola-abc.firebasestorage.app"
          />
          {errors.storageBucket && <p className="mt-1 text-sm text-red-600">{errors.storageBucket}</p>}
          <p className="mt-1 text-sm text-gray-500">Bucket do Firebase Storage para arquivos</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {school ? 'Editar Escola' : 'Nova Escola'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="py-4">
          <div className="flex items-center justify-center">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step
                    ? 'border-indigo-500 bg-indigo-500 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-indigo-500' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-600">
              Etapa {currentStep} de 4
            </span>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="py-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  Anterior
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Próximo
                  <svg className="ml-2 -mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
                    <>
                      <svg className="mr-2 -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {school ? 'Atualizar' : 'Criar'} Escola
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}