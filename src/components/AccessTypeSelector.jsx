'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { managementDB, ref, get, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { isSuperAdmin as checkIsSuperAdmin } from '../config/constants';

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
      console.log('🔍 Verificando acesso do usuário:', user?.email);
      
      // Verificar se é super admin usando a função centralizada
      const isSuper = checkIsSuperAdmin(user?.uid);
      console.log('👑 [checkUserAccess] É Super Admin?', isSuper, 'UID:', user?.uid);
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
      console.error('❌ Erro ao verificar acesso do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllSchools = async () => {
    try {
      console.log('📚 [loadAllSchools] Carregando todas as escolas (Super Admin)...');
      console.log('📍 [loadAllSchools] Caminho: gerenciamento-elo-school/escolas');
      
      const escolasRef = ref(managementDB, 'escolas');
      const snapshot = await get(escolasRef);
      
      if (!snapshot.exists()) {
        console.log('⚠️ [loadAllSchools] Nenhuma escola encontrada');
        return [];
      }

      const escolasData = snapshot.val();
      const escolas = Object.entries(escolasData).map(([id, data]) => ({
        id,
        nome: data.nome,
        status: data.status || 'ativa',
        plano: data.plano || 'basico',
        cidade: data.endereco?.cidade || 'N/A',
        estado: data.endereco?.estado || '',
        logo: '🏫',
        databaseURL: data.databaseURL,
        storageBucket: data.storageBucket,
        projectId: data.projectId
      }));

      console.log(`✅ [loadAllSchools] ${escolas.length} escolas carregadas`);
      escolas.forEach(escola => {
        console.log(`  - ${escola.nome} (${escola.id})`);
      });
      
      return escolas;
    } catch (error) {
      console.error('❌ [loadAllSchools] Erro ao carregar escolas:', error);
      console.error('❌ [loadAllSchools] Detalhes:', error.message);
      return [];
    }
  };

  const loadUserSchools = async (userId) => {
    try {
      console.log('🔍 [loadUserSchools] Iniciando busca...');
      console.log('🔍 [loadUserSchools] User ID:', userId);
      
      // MÉTODO 1: Buscar em usuarios/{userId}/escolas (estrutura antiga)
      console.log('📚 [loadUserSchools] MÉTODO 1: Tentando usuarios/{userId}/escolas');
      const userRef = ref(managementDB, `usuarios/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        console.log('✅ [loadUserSchools] Usuário encontrado em usuarios/');
        
        if (userData.escolas) {
          const escolasIds = Object.keys(userData.escolas);
          console.log('📋 [loadUserSchools] Escolas vinculadas:', escolasIds);
          
          // Buscar dados completos de cada escola
          const escolasPromises = escolasIds.map(async (escolaId) => {
            const escolaRef = ref(managementDB, `escolas/${escolaId}`);
            const escolaSnapshot = await get(escolaRef);
            
            if (escolaSnapshot.exists()) {
              const escolaData = escolaSnapshot.val();
              const userRole = userData.escolas[escolaId]?.role || 
                              userData.escolas[escolaId]?.permissoes?.role || 
                              'usuário';
              
              console.log('✅ [loadUserSchools] Escola carregada:', escolaData.nome);
              
              return {
                id: escolaId,
                nome: escolaData.nome,
                status: escolaData.status || 'ativa',
                plano: escolaData.plano || 'basico',
                cidade: escolaData.endereco?.cidade || 'N/A',
                estado: escolaData.endereco?.estado || '',
                logo: '🏫',
                role: userRole,
                databaseURL: escolaData.databaseURL,
                storageBucket: escolaData.storageBucket,
                projectId: escolaData.projectId
              };
            }
            return null;
          });
          
          const escolas = (await Promise.all(escolasPromises)).filter(e => e !== null);
          
          if (escolas.length > 0) {
            console.log(`✅ [loadUserSchools] MÉTODO 1 bem-sucedido: ${escolas.length} escola(s) encontrada(s)`);
            escolas.forEach(escola => {
              console.log(`  - ${escola.nome} (${escola.role})`);
            });
            return escolas;
          }
        }
      }
      
      // MÉTODO 2: Buscar em escolas/{escolaId}/usuarios (estrutura nova)
      console.log('📚 [loadUserSchools] MÉTODO 2: Tentando escolas/{escolaId}/usuarios');
      
      const escolasRef = ref(managementDB, 'escolas');
      const escolasSnapshot = await get(escolasRef);
      
      if (!escolasSnapshot.exists()) {
        console.log('⚠️ [loadUserSchools] Nenhuma escola encontrada no managementDB');
        return [];
      }

      const todasEscolas = escolasSnapshot.val();
      const escolasDoUsuario = [];
      
      console.log('📊 [loadUserSchools] Total de escolas no sistema:', Object.keys(todasEscolas).length);

      // Percorrer TODAS as escolas e verificar se o usuário está nela
      for (const [escolaId, escolaData] of Object.entries(todasEscolas)) {
        console.log(`🔎 [loadUserSchools] Verificando escola: ${escolaData.nome} (${escolaId})`);
        
        // Verificar se a escola tem o array de usuários
        if (escolaData.usuarios && escolaData.usuarios[userId]) {
          console.log(`✅ [loadUserSchools] Usuário ENCONTRADO na escola: ${escolaData.nome}`);
          
          const userRole = escolaData.usuarios[userId].role || 'usuário';
          
          escolasDoUsuario.push({
            id: escolaId,
            nome: escolaData.nome,
            status: escolaData.status || 'ativa',
            plano: escolaData.plano || 'basico',
            cidade: escolaData.endereco?.cidade || 'N/A',
            estado: escolaData.endereco?.estado || '',
            logo: '🏫',
            role: userRole,
            databaseURL: escolaData.databaseURL,
            storageBucket: escolaData.storageBucket,
            projectId: escolaData.projectId
          });
          
          console.log('📦 [loadUserSchools] Dados da escola salvos:', {
            id: escolaId,
            nome: escolaData.nome,
            databaseURL: escolaData.databaseURL,
            storageBucket: escolaData.storageBucket,
            projectId: escolaData.projectId
          });
        } else {
          console.log(`⏭️ [loadUserSchools] Usuário NÃO está na escola: ${escolaData.nome}`);
        }
      }

      if (escolasDoUsuario.length === 0) {
        console.log('⚠️ [loadUserSchools] Usuário não está vinculado a nenhuma escola');
        console.log('💡 [loadUserSchools] Estruturas verificadas:');
        console.log('   1. usuarios/{userId}/escolas');
        console.log('   2. escolas/{escolaId}/usuarios');
      } else {
        console.log(`✅ [loadUserSchools] MÉTODO 2 bem-sucedido: ${escolasDoUsuario.length} escola(s) encontrada(s)`);
        escolasDoUsuario.forEach(escola => {
          console.log(`  - ${escola.nome} (${escola.role})`);
        });
      }
      
      return escolasDoUsuario;
    } catch (error) {
      console.error('❌ [loadUserSchools] Erro ao carregar escolas:', error);
      console.error('❌ [loadUserSchools] Detalhes:', error.message);
      return [];
    }
  };

  const handleSchoolAccess = (school) => {
    console.log('🎯 [AccessTypeSelector] handleSchoolAccess chamado');
    console.log('📋 [AccessTypeSelector] Escola selecionada:', school);
    console.log('🔑 [AccessTypeSelector] ID da escola:', school.id);
    console.log('📊 [AccessTypeSelector] Database URL:', school.databaseURL);
    
    // Salvar escola selecionada no contexto/localStorage
    localStorage.setItem('selectedSchool', JSON.stringify(school));
    console.log('💾 [AccessTypeSelector] Escola salva no localStorage');
    
    // Verificar se salvou corretamente
    const saved = localStorage.getItem('selectedSchool');
    console.log('✅ [AccessTypeSelector] Verificação - Salvo:', saved ? 'Sim' : 'Não');
    
    onSchoolSelect(school);
    console.log('📞 [AccessTypeSelector] onSchoolSelect chamado');
    
    router.push('/dashboard');
    console.log('🔄 [AccessTypeSelector] Redirecionando para dashboard');
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
              onClick={async () => {
                try {
                  console.log('🚪 [Logout] Iniciando logout...');
                  
                  // 1. Limpar armazenamento local
                  localStorage.clear();
                  sessionStorage.clear();
                  console.log('✅ [Logout] Cache limpo');
                  
                  // 2. Fazer logout do Firebase Auth
                  await signOut(auth);
                  console.log('✅ [Logout] Firebase Auth deslogado');
                  
                  // 3. Redirecionar para login
                  console.log('🔄 [Logout] Redirecionando para login...');
                  router.push('/login');
                } catch (error) {
                  console.error('❌ [Logout] Erro ao fazer logout:', error);
                  // Mesmo com erro, redirecionar
                  router.push('/login');
                }
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sair do sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}