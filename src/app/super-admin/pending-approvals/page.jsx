/**
 * Página de Aprovações Pendentes - Super Admin
 * 
 * Interface para o super admin aprovar usuários de escolas sem coordenador.
 * Permite definir a role inicial do usuário e adicioná-lo ao sistema.
 * 
 * @module PendingApprovalsPage
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { userManagementService, USER_ROLES } from '../../../services/userManagementService';
import Modal from '../../../components/Modal';

export default function PendingApprovalsPage() {
  const { user, role } = useAuth();
  
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [schools, setSchools] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [selectedRoles, setSelectedRoles] = useState({});
  
  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: ''
  });

  useEffect(() => {
    // Verificar se usuário é super admin
    if (role !== USER_ROLES.SUPER_ADMIN) {
      window.location.href = '/dashboard';
      return;
    }

    loadPendingApprovals();
  }, [role]);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const approvals = await userManagementService.getPendingApprovals();
      setPendingApprovals(approvals);

      // Carregar dados das escolas
      const schoolsList = await userManagementService.getAvailableSchools();
      const schoolsMap = {};
      schoolsList.forEach(school => {
        schoolsMap[school.id] = school;
      });
      setSchools(schoolsMap);

    } catch (error) {
      console.error('Erro ao carregar aprovações pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, schoolId) => {
    const roleKey = `${userId}-${schoolId}`;
    const selectedRole = selectedRoles[roleKey];

    if (!selectedRole) {
      setModalConfig({
        type: 'warning',
        title: '⚠️ Atenção',
        message: 'Por favor, selecione uma função para o usuário antes de aprovar.'
      });
      setModalOpen(true);
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [roleKey]: true }));

      const result = await userManagementService.approveUserBySuperAdmin(
        userId,
        schoolId,
        selectedRole,
        user.uid
      );

      if (result.success) {
        setModalConfig({
          type: 'success',
          title: '✅ Aprovado com Sucesso!',
          message: result.message
        });
        setModalOpen(true);
        
        // Remover da lista
        setPendingApprovals(prev =>
          prev.filter(a => !(a.userId === userId && a.schoolId === schoolId))
        );
        
        // Limpar role selecionada
        setSelectedRoles(prev => {
          const newState = { ...prev };
          delete newState[roleKey];
          return newState;
        });
      } else {
        setModalConfig({
          type: 'error',
          title: '❌ Erro na Aprovação',
          message: result.message
        });
        setModalOpen(true);
      }

    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      setModalConfig({
        type: 'error',
        title: '❌ Erro Inesperado',
        message: 'Erro ao aprovar usuário. Tente novamente.'
      });
      setModalOpen(true);
    } finally {
      setProcessing(prev => ({ ...prev, [roleKey]: false }));
    }
  };

  const handleRoleChange = (userId, schoolId, role) => {
    const roleKey = `${userId}-${schoolId}`;
    setSelectedRoles(prev => ({
      ...prev,
      [roleKey]: role
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando aprovações pendentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            👑 Aprovações Pendentes
          </h1>
          <p className="text-gray-600">
            Usuários aguardando aprovação em escolas sem coordenador
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{pendingApprovals.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Escolas Afetadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(pendingApprovals.map(a => a.schoolId)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ação Requerida</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingApprovals.filter(a => !selectedRoles[`${a.userId}-${a.schoolId}`]).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de aprovações */}
        {pendingApprovals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma aprovação pendente
            </h3>
            <p className="text-gray-500">
              Todas as solicitações foram processadas!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map((approval) => {
              const roleKey = `${approval.userId}-${approval.schoolId}`;
              const school = schools[approval.schoolId];
              const isProcessing = processing[roleKey];

              return (
                <div
                  key={roleKey}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Info do usuário */}
                    <div className="md:col-span-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-lg">
                              {approval.nome?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {approval.nome}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {approval.email}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Solicitado em {formatDate(approval.requestedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Info da escola */}
                    <div className="md:col-span-3">
                      {school && (
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{school.logo}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {school.nome}
                            </p>
                            <p className="text-xs text-gray-500">
                              {school.cidade}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Seletor de role */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Função
                      </label>
                      <select
                        value={selectedRoles[roleKey] || ''}
                        onChange={(e) => handleRoleChange(approval.userId, approval.schoolId, e.target.value)}
                        disabled={isProcessing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50"
                      >
                        <option value="">Selecione a função...</option>
                        <option value="coordenadora">Coordenadora</option>
                        <option value="professora">Professora</option>
                        <option value="pai">Pai</option>
                      </select>
                    </div>

                    {/* Botão de aprovação */}
                    <div className="md:col-span-2">
                      <button
                        onClick={() => handleApprove(approval.userId, approval.schoolId)}
                        disabled={!selectedRoles[roleKey] || isProcessing}
                        className={`
                          w-full px-4 py-2 rounded-md text-sm font-medium
                          transition-colors flex items-center justify-center
                          ${selectedRoles[roleKey] && !isProcessing
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processando...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Aprovar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de feedback */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText="OK"
      />
    </div>
  );
}
