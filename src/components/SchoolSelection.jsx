/**
 * Componente de Seleção de Escola
 * 
 * Exibido quando um usuário novo (sem escola definida) precisa escolher uma escola.
 * Implementa o fluxo de validação de coordenador:
 * - Se escola tem coordenador: auto-aprova e adiciona usuário sem role
 * - Se escola NÃO tem coordenador: envia para aprovação do super admin
 * 
 * @module SchoolSelection
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { userManagementService, APPROVAL_STATUS } from '../services/userManagementService';
import Modal from './Modal';

export default function SchoolSelection() {
  const router = useRouter();
  const { user, selectedSchool, loadSchoolData } = useAuth();
  
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [error, setError] = useState(null);
  
  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    onConfirm: null
  });

  // Carregar lista de escolas disponíveis
  useEffect(() => {
    loadAvailableSchools();
  }, []);

  const loadAvailableSchools = async () => {
    try {
      setLoading(true);
      const schoolsList = await userManagementService.getAvailableSchools();
      setSchools(schoolsList);
    } catch (error) {
      console.error('Erro ao carregar escolas:', error);
      setError('Não foi possível carregar a lista de escolas.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolSelection = async (schoolId) => {
    if (!user || !schoolId) return;

    try {
      setProcessing(true);
      setError(null);

      console.log('🎯 Iniciando seleção de escola:', schoolId);

      // Solicitar acesso à escola (valida coordenador automaticamente)
      const result = await userManagementService.requestSchoolAccess(
        user.uid,
        schoolId,
        {
          email: user.email,
          nome: user.displayName || user.email.split('@')[0]
        }
      );

      if (result.success) {
        console.log('✅ Solicitação processada:', result);

        if (result.status === APPROVAL_STATUS.AUTO_APPROVED) {
          // Escola tem coordenador - carregar dados da escola
          await loadSchoolData(schoolId);
          
          // Mostrar modal de sucesso
          setModalConfig({
            type: 'success',
            title: 'Acesso Concedido!',
            message: result.message,
            onConfirm: () => {
              router.push('/dashboard');
            }
          });
          setModalOpen(true);
          
        } else if (result.status === APPROVAL_STATUS.PENDING) {
          // Escola sem coordenador - mostrar modal de aguardo
          setModalConfig({
            type: 'warning',
            title: 'Aguardando Aprovação',
            message: result.message,
            onConfirm: () => {
              router.push('/aguardando-aprovacao');
            }
          });
          setModalOpen(true);
        }
      } else {
        setError(result.message || 'Erro ao processar solicitação');
      }

    } catch (error) {
      console.error('❌ Erro ao selecionar escola:', error);
      setError('Erro ao processar sua solicitação. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  // Filtrar escolas por termo de busca
  const filteredSchools = schools.filter(school =>
    school.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.cidade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando escolas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selecione sua Escola
          </h1>
          <p className="text-gray-600">
            Escolha a escola que você está vinculado para continuar
          </p>
        </div>

        {/* Barra de busca */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar escola por nome ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Lista de escolas */}
        {filteredSchools.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm
                ? 'Nenhuma escola encontrada com esse termo'
                : 'Nenhuma escola disponível no momento'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSchools.map((school) => (
              <button
                key={school.id}
                onClick={() => handleSchoolSelection(school.id)}
                disabled={processing}
                className={`
                  relative p-6 bg-white rounded-lg border-2 transition-all
                  hover:shadow-lg hover:border-blue-500 text-left
                  ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${selectedSchoolId === school.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                `}
              >
                {/* Logo e Nome */}
                <div className="flex items-start space-x-3 mb-3">
                  <span className="text-4xl">{school.logo}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg truncate">
                      {school.nome}
                    </h3>
                    {school.cidade && (
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {school.cidade}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ícone de seleção */}
                {processing && selectedSchoolId === school.id && (
                  <div className="absolute top-4 right-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Informação adicional */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
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
              <p className="font-medium mb-1">Como funciona a aprovação?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>
                  Se a escola já tem um coordenador, você será adicionado automaticamente
                  e o coordenador definirá sua função.
                </li>
                <li>
                  Se a escola ainda não tem coordenador, sua solicitação será enviada
                  para análise do administrador do sistema.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de feedback */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText="Continuar"
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
}
