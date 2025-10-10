'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccessTypeSelector({ user, onSchoolSelect, onManagementSelect }) {
  const [availableSchools, setAvailableSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUserAccess();
  }, [user]);

  const checkUserAccess = async () => {
    try {
      // Verificar se é super admin
      const superAdminId = 'qD6UucWtcgPC9GHA41OB8rSaghZ2';
      const isSuper = user?.uid === superAdminId;
      setIsSuperAdmin(isSuper);

      // Se for super admin, buscar todas as escolas
      if (isSuper) {
        const schools = await loadAllSchools();
        setAvailableSchools(schools);
      } else {
        // Buscar escolas onde o usuário tem acesso
        const userSchools = await loadUserSchools(user?.uid);
        setAvailableSchools(userSchools);
      }
    } catch (error) {
      console.error('Erro ao verificar acesso do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllSchools = async () => {
    // Mock data - Implementar busca real do Firebase
    return [
      {
        id: 'escola1',
        nome: 'Escola Municipal São João',
        status: 'ativo',
        plano: 'basico',
        cidade: 'São Paulo',
        logo: '🏫'
      },
      {
        id: 'escola2', 
        nome: 'Colégio Esperança',
        status: 'ativo',
        plano: 'premium',
        cidade: 'Rio de Janeiro',
        logo: '🎓'
      },
      {
        id: 'escola3',
        nome: 'Instituto Educacional Brasil',
        status: 'ativo',
        plano: 'empresarial',
        cidade: 'Belo Horizonte',
        logo: '📚'
      }
    ];
  };

  const loadUserSchools = async (userId) => {
    // Mock data - Implementar busca real baseada no usuário
    return [
      {
        id: 'escola1',
        nome: 'Escola Municipal São João',
        status: 'ativo',
        plano: 'basico',
        cidade: 'São Paulo',
        logo: '🏫',
        role: 'coordenador'
      }
    ];
  };

  const handleSchoolAccess = (school) => {
    // Salvar escola selecionada no contexto/localStorage
    localStorage.setItem('selectedSchool', JSON.stringify(school));
    onSchoolSelect(school);
    router.push('/dashboard');
  };

  const handleManagementAccess = () => {
    // Limpar escola selecionada
    localStorage.removeItem('selectedSchool');
    onManagementSelect();
    router.push('/super-admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando opções de acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Escolha o tipo de acesso
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Selecione como deseja acessar o sistema
          </p>
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Logado como: {user?.email}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Management Access - Only for Super Admin */}
          {isSuperAdmin && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100 text-2xl">
                  🏢
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Painel de Gerenciamento
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Acesse o painel administrativo para gerenciar todas as escolas, usuários e configurações do sistema
                </p>
                <button
                  onClick={handleManagementAccess}
                  className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Acessar Gerenciamento
                </button>
              </div>
            </div>
          )}

          {/* School Access */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="text-center mb-6">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 text-2xl">
                🏫
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Acessar Escola
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {availableSchools.length > 1 
                  ? 'Selecione uma escola para acessar' 
                  : 'Acesse sua escola'
                }
              </p>
            </div>

            {availableSchools.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma escola disponível para acesso</p>
                <p className="text-sm text-gray-400 mt-2">
                  Entre em contato com o administrador se isso não estiver correto
                </p>
              </div>
            ) : availableSchools.length === 1 ? (
              <div className="space-y-3">
                <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 text-2xl mr-3">
                    {availableSchools[0].logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {availableSchools[0].nome}
                    </p>
                    <p className="text-sm text-gray-500">
                      {availableSchools[0].cidade}
                      {availableSchools[0].role && ` • ${availableSchools[0].role}`}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      availableSchools[0].status === 'ativo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {availableSchools[0].status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleSchoolAccess(availableSchools[0])}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Acessar Escola
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {availableSchools.map((school) => (
                    <button
                      key={school.id}
                      onClick={() => handleSchoolAccess(school)}
                      className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 text-2xl mr-3">
                        {school.logo}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {school.nome}
                        </p>
                        <p className="text-sm text-gray-500">
                          {school.cidade}
                          {school.role && ` • ${school.role}`}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          school.status === 'ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {school.status}
                        </span>
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="text-center">
            <button
              onClick={() => {
                // Implementar logout
                localStorage.clear();
                sessionStorage.clear();
                router.push('/login');
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sair do sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}