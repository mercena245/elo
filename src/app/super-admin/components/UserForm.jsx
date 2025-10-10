'use client';

import { useState, useEffect } from 'react';

const rolesDisponiveis = [
  { 
    id: 'coordenador', 
    nome: 'Coordenador', 
    descricao: 'Acesso total à escola',
    permissoes: ['*']
  },
  { 
    id: 'secretaria', 
    nome: 'Secretária', 
    descricao: 'Financeiro, alunos e secretaria digital',
    permissoes: ['financeiro', 'alunos', 'secretaria-digital']
  },
  { 
    id: 'professor', 
    nome: 'Professor', 
    descricao: 'Notas, frequência e consulta de alunos',
    permissoes: ['notas', 'frequencia', 'alunos-consulta']
  },
  { 
    id: 'responsavel', 
    nome: 'Responsável', 
    descricao: 'Consulta financeiro e notas',
    permissoes: ['financeiro-consulta', 'notas-consulta']
  }
];

export default function UserForm({ user, schools, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    escolas: {}
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSchoolRoleChange = (schoolId, role) => {
    const roleData = rolesDisponiveis.find(r => r.id === role);
    
    setFormData(prev => ({
      ...prev,
      escolas: {
        ...prev.escolas,
        [schoolId]: {
          role,
          ativo: true,
          dataVinculo: new Date().toISOString().split('T')[0],
          permissoes: roleData ? roleData.permissoes : []
        }
      }
    }));
  };

  const handleRemoveSchool = (schoolId) => {
    setFormData(prev => {
      const newEscolas = { ...prev.escolas };
      delete newEscolas[schoolId];
      return {
        ...prev,
        escolas: newEscolas
      };
    });
  };

  const handleToggleSchoolStatus = (schoolId) => {
    setFormData(prev => ({
      ...prev,
      escolas: {
        ...prev.escolas,
        [schoolId]: {
          ...prev.escolas[schoolId],
          ativo: !prev.escolas[schoolId].ativo
        }
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';
    
    // Validar formato do email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Pelo menos uma escola deve estar vinculada
    if (Object.keys(formData.escolas).length === 0) {
      newErrors.escolas = 'Pelo menos uma escola deve estar vinculada';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSchools = () => {
    return schools.filter(school => !formData.escolas[school.id]);
  };

  const getUserSchools = () => {
    return Object.keys(formData.escolas).map(schoolId => {
      const school = schools.find(s => s.id === schoolId);
      return {
        id: schoolId,
        nome: school?.nome || schoolId,
        data: formData.escolas[schoolId]
      };
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'coordenador':
        return 'bg-purple-100 text-purple-800';
      case 'secretaria':
        return 'bg-blue-100 text-blue-800';
      case 'professor':
        return 'bg-green-100 text-green-800';
      case 'responsavel':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {user ? 'Editar Usuário' : 'Novo Usuário'}
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

        <form onSubmit={handleSubmit} className="py-6 space-y-6">
          {/* Dados Pessoais */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors.nome ? 'border-red-300' : ''}`}
                  placeholder="Nome completo do usuário"
                />
                {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors.email ? 'border-red-300' : ''}`}
                  placeholder="email@exemplo.com"
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

          {/* Vínculos com Escolas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Vínculos com Escolas</h3>
              {getAvailableSchools().length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSchoolRoleChange(e.target.value, 'professor');
                      e.target.value = '';
                    }
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">+ Adicionar Escola</option>
                  {getAvailableSchools().map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {errors.escolas && <p className="mb-4 text-sm text-red-600">{errors.escolas}</p>}

            <div className="space-y-4">
              {getUserSchools().map((userSchool) => (
                <div
                  key={userSchool.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{userSchool.nome}</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        userSchool.data.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {userSchool.data.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSchoolStatus(userSchool.id)}
                        className={`text-sm ${
                          userSchool.data.ativo 
                            ? 'text-red-600 hover:text-red-800' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {userSchool.data.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSchool(userSchool.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Papel na Escola
                      </label>
                      <select
                        value={userSchool.data.role}
                        onChange={(e) => handleSchoolRoleChange(userSchool.id, e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {rolesDisponiveis.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data do Vínculo
                      </label>
                      <input
                        type="date"
                        value={userSchool.data.dataVinculo}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          escolas: {
                            ...prev.escolas,
                            [userSchool.id]: {
                              ...prev.escolas[userSchool.id],
                              dataVinculo: e.target.value
                            }
                          }
                        }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Permissões */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissões
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {userSchool.data.permissoes.map((permissao) => (
                        <span
                          key={permissao}
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(userSchool.data.role)}`}
                        >
                          {permissao === '*' ? 'Todas as permissões' : permissao}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Descrição do Papel */}
                  <div className="mt-3 text-sm text-gray-600">
                    {rolesDisponiveis.find(r => r.id === userSchool.data.role)?.descricao}
                  </div>
                </div>
              ))}
            </div>

            {getUserSchools().length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-gray-400 text-4xl mb-2">🏫</div>
                <p className="text-gray-500">
                  Nenhuma escola vinculada. Use o botão "Adicionar Escola" para criar vínculos.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
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
                <>
                  <svg className="mr-2 -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {user ? 'Atualizar' : 'Criar'} Usuário
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}