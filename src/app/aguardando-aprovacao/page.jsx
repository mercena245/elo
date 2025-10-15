/**
 * Página de Aguardando Aprovação
 * 
 * Exibida para usuários que solicitaram acesso a uma escola sem coordenadora
 * e estão aguardando aprovação manual do super admin.
 * 
 * @module AwaitingApprovalPage
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { userManagementService } from '../../services/userManagementService';

export default function AwaitingApprovalPage() {
  const router = useRouter();
  const { user, role, logout } = useAuth();
  const [userSchools, setUserSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verificar se usuário já tem role e redirecionar
  useEffect(() => {
    if (user && role) {
      console.log('✅ [Aguardando Aprovação] Usuário tem role:', role);
      console.log('🚀 [Aguardando Aprovação] Redirecionando para dashboard...');
      router.push('/dashboard');
    }
  }, [user, role, router]);

  useEffect(() => {
    if (user) {
      checkUserStatus();
    }
  }, [user]);

  const checkUserStatus = async () => {
    try {
      setLoading(true);
      
      // Verificar se usuário já tem escola aprovada
      const schools = await userManagementService.getUserSchools(user.uid);
      
      console.log('🔍 [Aguardando Aprovação] Escolas encontradas:', schools.length);
      
      if (schools.length > 0) {
        console.log('✅ [Aguardando Aprovação] Tem escola aprovada, redirecionando...');
        // Tem escola aprovada - redirecionar para dashboard
        router.push('/dashboard');
        return;
      }
      
      setUserSchools(schools);
    } catch (error) {
      console.error('❌ [Aguardando Aprovação] Erro ao verificar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleRefresh = () => {
    checkUserStatus();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Ícone de relógio animado */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-25 animate-ping"></div>
              <div className="relative bg-yellow-100 rounded-full p-6">
                <svg
                  className="w-16 h-16 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Aguardando Aprovação
          </h1>

          {/* Mensagem principal */}
          <p className="text-center text-gray-600 mb-8 text-lg">
            Sua solicitação foi enviada com sucesso!
          </p>

          {/* Informações */}
          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">O que acontece agora?</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>
                      A escola selecionada ainda não possui um coordenador cadastrado
                    </li>
                    <li>
                      O administrador do sistema foi notificado e irá analisar sua solicitação
                    </li>
                    <li>
                      Você receberá um e-mail assim que sua conta for aprovada
                    </li>
                    <li>
                      Após a aprovação, você poderá acessar o sistema normalmente
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Informações do usuário */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Seus dados:
              </p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Nome:</span>{' '}
                  {user?.displayName || 'Não informado'}
                </p>
                <p>
                  <span className="font-medium">E-mail:</span> {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Verificar Status Novamente</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Sair
            </button>
          </div>

          {/* Informação de contato */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Precisa de ajuda?{' '}
              <a
                href="mailto:suporte@eloschool.com.br"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Entre em contato com o suporte
              </a>
            </p>
          </div>
        </div>

        {/* Timeline de processo */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Processo de Aprovação
          </h3>
          <div className="space-y-4">
            {/* Passo 1 - Completo */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Solicitação Enviada</p>
                <p className="text-sm text-gray-500">
                  Você selecionou uma escola e enviou sua solicitação
                </p>
              </div>
            </div>

            {/* Passo 2 - Em andamento */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Análise do Administrador</p>
                <p className="text-sm text-gray-500">
                  Aguardando revisão e definição da sua função no sistema
                </p>
              </div>
            </div>

            {/* Passo 3 - Pendente */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-400">Acesso Liberado</p>
                <p className="text-sm text-gray-400">
                  Você poderá acessar o sistema após a aprovação
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
