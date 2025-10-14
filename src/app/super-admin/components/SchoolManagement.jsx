'use client';

import { useState, useEffect } from 'react';
import SchoolForm from './SchoolForm';
import { app, managementDB, ref, get, push, auth, remove, update } from '../../../firebase';
import SchoolCard from './SchoolCard';
import ConfirmDialog from './ConfirmDialog';

export default function SchoolManagement() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [authReady, setAuthReady] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [linkedUsers, setLinkedUsers] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Esperar o usuário estar autenticado antes de carregar
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthReady(true);
        loadSchools();
      } else {
        setAuthReady(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      
      // Verificar se usuário está autenticado
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('Usuário não autenticado');
        setErrorMessage('Você precisa estar autenticado para acessar esta área.');
        setShowErrorModal(true);
        return;
      }

      console.log('Carregando escolas para usuário:', currentUser.email);
      
      // Buscar escolas do banco de gerenciamento
      const escolasRef = ref(managementDB, 'escolas');
      const snapshot = await get(escolasRef);
      
      if (snapshot.exists()) {
        const escolasData = snapshot.val();
        const escolasArray = Object.keys(escolasData).map(key => ({
          id: key,
          ...escolasData[key]
        }));
        console.log('Escolas carregadas:', escolasArray.length);
        setSchools(escolasArray);
      } else {
        console.log('Nenhuma escola encontrada');
        setSchools([]);
      }
    } catch (error) {
      console.error('Erro ao carregar escolas:', error);
      setErrorMessage('Erro ao carregar escolas: ' + error.message + '\n\nVerifique se as regras do banco de dados permitem leitura.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async (schoolData) => {
    setLoading(true);
    try {
      // Pega usuário autenticado
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Preparar dados da escola
      const escolaData = {
        nome: schoolData.nome,
        cnpj: schoolData.cnpj,
        responsavel: schoolData.responsavel,
        email: schoolData.email,
        telefone: schoolData.telefone || '',
        plano: schoolData.plano || 'basico',
        mensalidade: schoolData.mensalidade || 1200,
        dataVencimento: schoolData.dataVencimento || 15,
        endereco: schoolData.endereco || {},
        configuracoes: schoolData.configuracoes || {
          modulosAtivos: ['financeiro', 'notas', 'alunos'],
          limiteAlunos: 200,
          limiteProfessores: 15
        },
        status: 'pendente', // Status inicial como pendente até configuração manual
        dataContrato: new Date().toISOString().split('T')[0],
        criadoEm: new Date().toISOString(),
        // Campos técnicos do Step 4
        projectId: schoolData.projectId || '',
        databaseURL: schoolData.databaseURL || '',
        storageBucket: schoolData.storageBucket || '',
        usuarios: {
          [user.uid]: {
            email: user.email,
            role: 'coordenadora',
            ativo: true,
            criadoEm: new Date().toISOString()
          }
        }
      };

      console.log('📤 Salvando escola no banco de gerenciamento:', escolaData.nome);
      console.log('🔧 Configurações técnicas:');
      console.log('  - projectId:', escolaData.projectId);
      console.log('  - databaseURL:', escolaData.databaseURL);
      console.log('  - storageBucket:', escolaData.storageBucket);

      // Salvar escola em escolas/{id}
      const escolasRef = ref(managementDB, 'escolas');
      const novaEscolaRef = await push(escolasRef, escolaData);
      const novaEscolaId = novaEscolaRef.key;

      console.log('✅ Escola criada em escolas/{id}:', novaEscolaId);
      
      // TAMBÉM vincular em usuarios/{uid}/escolas/{id}
      const userEscolaRef = ref(managementDB, `usuarios/${user.uid}/escolas/${novaEscolaId}`);
      await update(userEscolaRef, {
        role: 'coordenadora',
        ativo: true,
        dataVinculo: new Date().toISOString(),
        permissoes: ['*']
      });
      
      console.log('✅ Escola vinculada em usuarios/{uid}/escolas/{id}');
      console.log('✅ Estrutura DUPLA criada com sucesso!');

      // Recarregar lista de escolas
      await loadSchools();
      setShowForm(false);
      
      // Sucesso é tratado pelo modal no SchoolForm
    } catch (error) {
      console.error('❌ Erro ao criar escola:', error);
      console.error('Mensagem:', error.message);
      // Propagar erro para o SchoolForm tratar
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchool = async (schoolData) => {
    try {
      if (!editingSchool || !editingSchool.id) {
        throw new Error('ID da escola não encontrado');
      }
      
      setLoading(true);
      console.log('📝 Atualizando escola:', editingSchool.id);
      
      // Atualizar escola em escolas/{id}
      const escolaRef = ref(managementDB, `escolas/${editingSchool.id}`);
      await update(escolaRef, {
        nome: schoolData.nome,
        cnpj: schoolData.cnpj,
        responsavel: schoolData.responsavel,
        email: schoolData.email,
        telefone: schoolData.telefone || '',
        plano: schoolData.plano || 'basico',
        mensalidade: schoolData.mensalidade || 1200,
        dataVencimento: schoolData.dataVencimento || 15,
        endereco: schoolData.endereco || {},
        configuracoes: schoolData.configuracoes || {},
        projectId: schoolData.projectId || '',
        databaseURL: schoolData.databaseURL || '',
        storageBucket: schoolData.storageBucket || ''
      });
      
      console.log('✅ Escola atualizada em escolas/{id}');
      
      // Atualizar lista local
      setSchools(schools.map(school => 
        school.id === editingSchool.id 
          ? { ...school, ...schoolData, id: editingSchool.id }
          : school
      ));
      
      setEditingSchool(null);
      setShowForm(false);
      setLoading(false);
      
      setSuccessMessage('Escola atualizada com sucesso!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ Erro ao atualizar escola:', error);
      setErrorMessage('Erro ao atualizar escola: ' + error.message);
      setShowErrorModal(true);
      setLoading(false);
    }
  };

  const handleDeleteSchool = async (schoolId) => {
    try {
      console.log('🔍 Verificando usuários vinculados à escola:', schoolId);
      
      // Buscar todos os usuários
      const usuariosRef = ref(managementDB, 'usuarios');
      const snapshot = await get(usuariosRef);
      
      if (snapshot.exists()) {
        const usuariosData = snapshot.val();
        const usersWithSchool = [];
        
        // Verificar quais usuários têm essa escola vinculada
        Object.keys(usuariosData).forEach(uid => {
          const user = usuariosData[uid];
          if (user.escolas && user.escolas[schoolId]) {
            usersWithSchool.push({
              uid,
              nome: user.nome,
              email: user.email
            });
          }
        });
        
        console.log('👥 Usuários vinculados encontrados:', usersWithSchool.length);
        setLinkedUsers(usersWithSchool);
      } else {
        setLinkedUsers([]);
      }
      
      // Mostrar modal de confirmação
      setSchoolToDelete(schoolId);
      setShowDeleteConfirm(true);
      
    } catch (error) {
      console.error('❌ Erro ao verificar usuários vinculados:', error);
      setErrorMessage('Erro ao verificar usuários vinculados: ' + error.message);
      setShowErrorModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!schoolToDelete) return;
    
    try {
      setLoading(true);
      console.log('🗑️ Iniciando exclusão da escola:', schoolToDelete);
      
      // 1. Remover escola dos usuários vinculados
      if (linkedUsers.length > 0) {
        console.log('👥 Removendo escola de', linkedUsers.length, 'usuários...');
        
        for (const user of linkedUsers) {
          // AMBAS estruturas: usuarios/{userId}/escolas E escolas/{escolaId}/usuarios
          const userEscolasRef = ref(managementDB, `usuarios/${user.uid}/escolas/${schoolToDelete}`);
          await remove(userEscolasRef);
          console.log('✅ Escola removida do usuário (usuarios/{uid}/escolas):', user.email);
          
          // Estrutura já é removida ao deletar a escola inteira em escolas/{escolaId}
        }
      }
      
      // 2. Excluir a escola do banco (remove TUDO, incluindo usuarios)
      console.log('🗑️ Excluindo escola do banco...');
      const escolaRef = ref(managementDB, `escolas/${schoolToDelete}`);
      await remove(escolaRef);
      
      // 3. Atualizar lista local
      setSchools(schools.filter(school => school.id !== schoolToDelete));
      
      console.log('✅ Escola excluída com sucesso!');
      
      // Mostrar mensagem de sucesso
      setSuccessMessage(
        linkedUsers.length > 0
          ? `Escola excluída com sucesso! ${linkedUsers.length} usuário(s) foram desvinculados.`
          : 'Escola excluída com sucesso!'
      );
      setShowSuccessModal(true);
      
      // Limpar estados
      setShowDeleteConfirm(false);
      setSchoolToDelete(null);
      setLinkedUsers([]);
      
    } catch (error) {
      console.error('❌ Erro ao excluir escola:', error);
      setErrorMessage('Erro ao excluir escola: ' + error.message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSchoolToDelete(null);
    setLinkedUsers([]);
  };

  const handleEditSchool = (school) => {
    setEditingSchool(school);
    setShowForm(true);
  };

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || school.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusCount = (status) => {
    return schools.filter(school => school.status === status).length;
  };

  if (!authReady) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Verificando autenticação...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Carregando escolas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Escolas</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todas as escolas cadastradas no sistema
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSchool(null);
            setShowForm(true);
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="mr-2 -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Escola
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{schools.length}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{getStatusCount('ativa')}</div>
          <div className="text-sm text-gray-500">Ativas</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{getStatusCount('suspensa')}</div>
          <div className="text-sm text-gray-500">Suspensas</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{getStatusCount('inativa')}</div>
          <div className="text-sm text-gray-500">Inativas</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar escolas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todos os Status</option>
              <option value="ativa">Ativas</option>
              <option value="suspensa">Suspensas</option>
              <option value="inativa">Inativas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schools Grid */}
      {filteredSchools.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma escola encontrada</h3>
          <p className="text-gray-500">
            {searchTerm || filterStatus !== 'all' 
              ? 'Tente ajustar os filtros de busca' 
              : 'Cadastre a primeira escola para começar'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSchools.map((school) => (
            <SchoolCard
              key={school.id}
              school={school}
              onEdit={handleEditSchool}
              onDelete={handleDeleteSchool}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <SchoolForm
          school={editingSchool}
          onSubmit={editingSchool ? handleUpdateSchool : handleCreateSchool}
          onClose={() => {
            setShowForm(false);
            setEditingSchool(null);
          }}
        />
      )}

      {/* Modal de Erro */}
      <ConfirmDialog
        isOpen={showErrorModal}
        title="Erro"
        message={errorMessage}
        type="error"
        confirmText="OK"
        onConfirm={() => setShowErrorModal(false)}
      />

      {/* Modal de Sucesso */}
      <ConfirmDialog
        isOpen={showSuccessModal}
        title="Sucesso"
        message={successMessage}
        type="success"
        confirmText="OK"
        onConfirm={() => setShowSuccessModal(false)}
      />

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Ícone de Aviso */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Título */}
              <h3 className="text-lg leading-6 font-medium text-gray-900 text-center mt-4">
                Confirmar Exclusão de Escola
              </h3>

              {/* Mensagem */}
              <div className="mt-4 px-4">
                <p className="text-sm text-gray-500 mb-4">
                  Tem certeza que deseja excluir esta escola? Esta ação não pode ser desfeita.
                </p>

                {/* Lista de Usuários Vinculados */}
                {linkedUsers.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800">
                          Usuários Vinculados ({linkedUsers.length})
                        </h4>
                        <p className="text-xs text-yellow-700 mt-1">
                          Os seguintes usuários estão vinculados a esta escola e serão desvinculados:
                        </p>
                        <ul className="mt-2 text-xs text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                          {linkedUsers.map((user) => (
                            <li key={user.uid} className="flex items-center">
                              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              {user.nome} ({user.email})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {linkedUsers.length === 0 && (
                  <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-400 rounded">
                    <p className="text-sm text-green-700">
                      ✓ Nenhum usuário vinculado a esta escola.
                    </p>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end space-x-3 px-4 py-4 mt-4 border-t">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Excluindo...' : 'Excluir Escola'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}