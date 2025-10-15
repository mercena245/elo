'use client';

import { useState, useEffect } from 'react';
import ConfirmDialog from './ConfirmDialog';

export default function UserForm({ user, schools, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    uid: '',
    nome: '',
    email: '',
    telefone: '',
    status: 'ativo',
    escolas: {}
  });

  const [selectedSchools, setSelectedSchools] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        uid: user.uid,
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        status: user.status || 'ativo',
        escolas: user.escolas || {}
      });

      const escolasVinculadas = Object.keys(user.escolas || {}).map(escolaId => {
        const escolaData = user.escolas[escolaId];
        return {
          escolaId,
          role: escolaData.role || 'coordenadora',
          ativo: escolaData.ativo !== false
        };
      });
      setSelectedSchools(escolasVinculadas);
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAddSchool = () => {
    if (schools.length === 0) {
      setErrorMessage('Nenhuma escola disponível para vincular.');
      setShowErrorModal(true);
      return;
    }

    const availableSchool = schools.find(
      s => !selectedSchools.some(sel => sel.escolaId === s.id)
    );

    if (!availableSchool) {
      setErrorMessage('Todas as escolas já foram vinculadas.');
      setShowErrorModal(true);
      return;
    }

    setSelectedSchools([...selectedSchools, {
      escolaId: availableSchool.id,
      role: 'coordenadora',
      ativo: true
    }]);
  };

  const handleRemoveSchool = (index) => {
    setSelectedSchools(selectedSchools.filter((_, i) => i !== index));
  };

  const handleSchoolChange = (index, field, value) => {
    const newSelectedSchools = [...selectedSchools];
    newSelectedSchools[index] = {
      ...newSelectedSchools[index],
      [field]: value
    };
    setSelectedSchools(newSelectedSchools);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (selectedSchools.length === 0) {
      newErrors.escolas = 'Vincule pelo menos uma escola';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const escolasObj = {};
      selectedSchools.forEach(escola => {
        escolasObj[escola.escolaId] = {
          role: escola.role,
          ativo: escola.ativo,
          dataVinculo: new Date().toISOString(),
          permissoes: ['*']
        };
      });

      const userData = {
        ...formData,
        escolas: escolasObj
      };

      await onSubmit(userData);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setErrorMessage(error.message || 'Erro ao salvar usuário');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const getAvailableSchools = (currentIndex) => {
    const selectedIds = selectedSchools
      .map((s, i) => i !== currentIndex ? s.escolaId : null)
      .filter(Boolean);
    return schools.filter(school => !selectedIds.includes(school.id));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              {user ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.nome ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Maria Silva"
                  />
                  {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="maria@exemplo.com"
                    disabled={!!user}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  {user && (
                    <p className="mt-1 text-xs text-gray-500">Email não pode ser alterado</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="suspenso">Suspenso</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">Vínculos com Escolas</h4>
                <button
                  type="button"
                  onClick={handleAddSchool}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  disabled={selectedSchools.length >= schools.length}
                >
                  <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar Escola
                </button>
              </div>

              {errors.escolas && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.escolas}</p>
                </div>
              )}

              <div className="space-y-3">
                {selectedSchools.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-gray-400 text-4xl mb-2">🏫</div>
                    <p className="text-sm text-gray-500">Nenhuma escola vinculada</p>
                    <p className="text-xs text-gray-400 mt-1">Clique em "Adicionar Escola" para vincular</p>
                  </div>
                ) : (
                  selectedSchools.map((escola, index) => {
                    const availableSchools = getAvailableSchools(index);
                    const currentSchool = schools.find(s => s.id === escola.escolaId);
                    
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Escola</label>
                            <select
                              value={escola.escolaId}
                              onChange={(e) => handleSchoolChange(index, 'escolaId', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              {currentSchool && (
                                <option value={currentSchool.id}>
                                  {currentSchool.nome}
                                </option>
                              )}
                              {availableSchools
                                .filter(s => s.id !== escola.escolaId)
                                .map(school => (
                                  <option key={school.id} value={school.id}>
                                    {school.nome}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Função</label>
                            <select
                              value={escola.role}
                              onChange={(e) => handleSchoolChange(index, 'role', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="coordenadora">Coordenadora</option>
                              <option value="secretaria">Secretária</option>
                              <option value="professora">Professora</option>
                              <option value="pai">Pai</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                            <div className="flex items-center h-[34px]">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={escola.ativo}
                                  onChange={(e) => handleSchoolChange(index, 'ativo', e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {escola.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSchool(index)}
                          className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Remover escola"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </span>
                ) : (
                  user ? 'Atualizar Usuário' : 'Criar Usuário'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showSuccessModal}
        title="Sucesso"
        message={user ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!'}
        type="success"
        confirmText="OK"
        onConfirm={handleSuccessClose}
      />

      <ConfirmDialog
        isOpen={showErrorModal}
        title="Erro"
        message={errorMessage}
        type="error"
        confirmText="OK"
        onConfirm={() => setShowErrorModal(false)}
      />
    </>
  );
}
