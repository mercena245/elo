'use client';

import { useState, useEffect } from 'react';
import UserForm from './UserForm';
import { managementDB, ref, get, update, auth } from '../../../firebase';
import ConfirmDialog from './ConfirmDialog';
import { userManagementService } from '../../../services/userManagementService';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingUsers, setPendingUsers] = useState([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      loadUsers();
      loadSchools();
    }
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      console.log('📥 Carregando usuários do banco de gerenciamento...');
      
      // Buscar usuários do banco de gerenciamento
      const usuariosRef = ref(managementDB, 'usuarios');
      const snapshot = await get(usuariosRef);
      
      if (snapshot.exists()) {
        const usuariosData = snapshot.val();
        const usuariosArray = Object.keys(usuariosData).map(uid => ({
          uid,
          nome: usuariosData[uid].nome || '',
          email: usuariosData[uid].email || '',
          telefone: usuariosData[uid].telefone || '',
          dataRegistro: usuariosData[uid].dataRegistro || new Date().toISOString().split('T')[0],
          status: usuariosData[uid].status || 'ativo',
          escolas: usuariosData[uid].escolas || {}
        }));
        
        console.log('✅ Usuários carregados:', usuariosArray.length);
        setUsers(usuariosArray);
        
        // Separar usuários pendentes (sem escolas vinculadas)
        const pending = usuariosArray.filter(u => {
          const escolas = u.escolas || {};
          return Object.keys(escolas).length === 0;
        });
        setPendingUsers(pending);
        console.log('⏳ Usuários pendentes de aprovação:', pending.length);
      } else {
        console.log('ℹ️ Nenhum usuário encontrado no banco');
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      setErrorMessage('Erro ao carregar usuários: ' + error.message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadSchools = async () => {
    try {
      console.log('📥 Carregando escolas do banco de gerenciamento...');
      
      // Buscar escolas do banco de gerenciamento
      const escolasRef = ref(managementDB, 'escolas');
      const snapshot = await get(escolasRef);
      
      if (snapshot.exists()) {
        const escolasData = snapshot.val();
        const escolasArray = Object.keys(escolasData).map(id => ({
          id,
          nome: escolasData[id].nome,
          status: escolasData[id].status,
          databaseUrl: escolasData[id].databaseUrl
        }));
        
        console.log('✅ Escolas carregadas:', escolasArray.length);
        setSchools(escolasArray);
        
        // NOVO: Sincronizar usuários aprovados das escolas
        await sincronizarUsuariosAprovados(escolasArray);
      } else {
        console.log('ℹ️ Nenhuma escola encontrada no banco');
        setSchools([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar escolas:', error);
    }
  };

  // NOVA FUNÇÃO: Sincronizar usuários aprovados pelas coordenadoras
  const sincronizarUsuariosAprovados = async (escolasArray) => {
    try {
      console.log('🔄 [Sincronização] Iniciando sincronização de usuários aprovados...');
      
      const { initializeApp } = await import('firebase/app');
      const { getDatabase, ref: dbRef, get: dbGet } = await import('firebase/database');
      
      for (const escola of escolasArray) {
        if (!escola.databaseUrl) continue;
        
        try {
          console.log(`🔍 [Sincronização] Verificando escola: ${escola.nome}`);
          
          // Conectar ao banco da escola
          const appName = `escola-${escola.id}-sync`;
          const escolaApp = initializeApp({
            databaseURL: escola.databaseUrl
          }, appName);
          const escolaDB = getDatabase(escolaApp);
          
          // Buscar usuários ativos da escola
          const usuariosRef = dbRef(escolaDB, 'usuarios');
          const snapshot = await dbGet(usuariosRef);
          
          if (snapshot.exists()) {
            const usuariosEscola = snapshot.val();
            
            for (const [uid, userData] of Object.entries(usuariosEscola)) {
              // Verificar se usuário está ativo e tem role definida
              if (userData.ativo === true && userData.role && userData.role !== 'pendente') {
                console.log(`✅ [Sincronização] Usuário ativo encontrado: ${userData.nome || userData.email} (${userData.role})`);
                
                // Atualizar no banco de gerenciamento
                const userRefManagement = ref(managementDB, `usuarios/${uid}`);
                const userSnapshot = await get(userRefManagement);
                
                const dadosAtualizados = {
                  nome: userData.nome || '',
                  email: userData.email || '',
                  telefone: userData.telefone || '',
                  status: 'ativo',
                  escolas: {
                    ...(userSnapshot.exists() ? userSnapshot.val().escolas : {}),
                    [escola.id]: {
                      role: userData.role,
                      dataAprovacao: userData.aprovadoEm || new Date().toISOString(),
                      aprovadoPor: userData.aprovadoPor || 'coordenadora',
                      turmas: userData.turmas || [],
                      disciplinas: userData.disciplinas || []
                    }
                  }
                };
                
                await update(userRefManagement, dadosAtualizados);
                console.log(`📝 [Sincronização] Usuário ${uid} atualizado no banco de gerenciamento`);
              }
            }
          }
          
          // Limpar app temporário
          await escolaApp.delete();
          
        } catch (error) {
          console.error(`❌ [Sincronização] Erro ao processar escola ${escola.nome}:`, error);
        }
      }
      
      console.log('✅ [Sincronização] Sincronização concluída!');
      
      // Recarregar lista de usuários após sincronização
      await loadUsers();
      
    } catch (error) {
      console.error('❌ [Sincronização] Erro geral:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Verificar se usuário está pendente (sem escolas)
    const isPending = Object.keys(user.escolas || {}).length === 0;
    
    const matchesRole = filterRole === 'all' || 
      Object.values(user.escolas || {}).some(escola => escola.role === filterRole);
    
    const matchesSchool = filterSchool === 'all' || 
      Object.keys(user.escolas || {}).includes(filterSchool);
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'pending' && isPending) ||
      (filterStatus !== 'pending' && user.status === filterStatus);
    
    return matchesSearch && matchesRole && matchesSchool && matchesStatus;
  });

  const handleCreateUser = async (userData) => {
    try {
      const newUser = {
        ...userData,
        dataRegistro: new Date().toISOString().split('T')[0],
        status: 'ativo'
      };
      
      // Salvar no banco (usuário novo seria criado pelo Firebase Auth primeiro)
      // Por enquanto, vamos apenas atualizar a lista local
      setUsers([...users, newUser]);
      setShowUserForm(false);
      setSuccessMessage('Usuário criado com sucesso!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      setErrorMessage('Erro ao criar usuário: ' + error.message);
      setShowErrorModal(true);
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      console.log('📝 Atualizando usuário:', userData.uid);
      
      // Atualizar no banco de gerenciamento (usuarios/{uid})
      const usuarioRef = ref(managementDB, `usuarios/${userData.uid}`);
      await update(usuarioRef, {
        nome: userData.nome,
        email: userData.email,
        telefone: userData.telefone || '',
        escolas: userData.escolas || {},
        status: userData.status || 'ativo'
      });
      
      console.log('✅ Usuário atualizado em usuarios/{uid}');
      
      // TAMBÉM atualizar em escolas/{escolaId}/usuarios/{uid} no management
      // E no banco específico de cada escola
      if (userData.escolas && Object.keys(userData.escolas).length > 0) {
        console.log('🔄 Sincronizando usuário nas escolas vinculadas...');
        
        for (const [escolaId, escolaData] of Object.entries(userData.escolas)) {
          // 1. Atualizar no management DB
          const escolaUsuarioRef = ref(managementDB, `escolas/${escolaId}/usuarios/${userData.uid}`);
          await update(escolaUsuarioRef, {
            email: userData.email,
            role: escolaData.role || 'coordenadora',
            ativo: escolaData.ativo !== false,
            dataVinculo: escolaData.dataVinculo || new Date().toISOString(),
            permissoes: escolaData.permissoes || ['*']
          });
          console.log(`✅ Usuário sincronizado no managementDB escola: ${escolaId}`);
          
          // 2. Salvar no banco específico da escola
          console.log(`📝 Salvando no banco da escola: ${escolaId}`);
          const saved = await userManagementService.addUserToSchoolDatabase(
            userData.uid,
            escolaId,
            {
              email: userData.email,
              nome: userData.nome,
              role: escolaData.role || 'coordenadora',
              ativo: escolaData.ativo !== false,
              turmas: [],
              createdAt: escolaData.dataVinculo || new Date().toISOString()
            }
          );
          
          if (saved) {
            console.log(`✅ Usuário salvo no banco da escola: ${escolaId}`);
          } else {
            console.error(`❌ Erro ao salvar no banco da escola: ${escolaId}`);
          }
        }
      }
      
      console.log('✅ Usuário atualizado com sucesso em ambas estruturas!');
      
      // Atualizar lista local
      setUsers(users.map(user => 
        user.uid === userData.uid 
          ? { ...user, ...userData }
          : user
      ));
      
      setEditingUser(null);
      setShowUserForm(false);
      setSuccessMessage('Usuário atualizado com sucesso!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      setErrorMessage('Erro ao atualizar usuário: ' + error.message);
      setShowErrorModal(true);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleToggleUserStatus = (uid) => {
    setUsers(users.map(user => 
      user.uid === uid 
        ? { ...user, status: user.status === 'ativo' ? 'inativo' : 'ativo' }
        : user
    ));
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'inativo':
        return 'bg-red-100 text-red-800';
      case 'suspenso':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserSchools = (user) => {
    return Object.keys(user.escolas || {}).map(schoolId => {
      const school = schools.find(s => s.id === schoolId);
      const schoolData = user.escolas[schoolId];
      return {
        id: schoolId,
        nome: school?.nome || schoolId,
        role: schoolData.role,
        ativo: schoolData.ativo
      };
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Carregando usuários...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todos os usuários do sistema e seus vínculos com escolas
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button
            onClick={async () => {
              setLoading(true);
              await sincronizarUsuariosAprovados(schools);
              setLoading(false);
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            title="Sincronizar usuários aprovados pelas coordenadoras"
          >
            <svg className="mr-2 -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sincronizar
          </button>
          <button
            onClick={() => {
              setEditingUser(null);
              setShowUserForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <svg className="mr-2 -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          <div className="text-sm text-gray-500">Total de Usuários</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.status === 'ativo').length}
          </div>
          <div className="text-sm text-gray-500">Ativos</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {pendingUsers.length}
          </div>
          <div className="text-sm text-gray-500">Aguardando Aprovação</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => Object.values(u.escolas || {}).some(e => e.role === 'coordenadora')).length}
          </div>
          <div className="text-sm text-gray-500">Coordenadores</div>
        </div>
      </div>

      {/* Usuários Pendentes - Destaque */}
      {pendingUsers.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-orange-100 rounded-full p-3 mr-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Usuários Aguardando Aprovação</h3>
                <p className="text-sm text-gray-600">
                  {pendingUsers.length} {pendingUsers.length === 1 ? 'usuário precisa' : 'usuários precisam'} ser vinculado(s) a uma escola
                </p>
              </div>
            </div>
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {pendingUsers.length}
            </span>
          </div>

          <div className="space-y-2">
            {pendingUsers.slice(0, 3).map((user) => (
              <div key={user.uid} className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-orange-800">
                      {user.nome?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.nome || 'Sem nome'}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleEditUser(user)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
                >
                  Aprovar e Vincular
                </button>
              </div>
            ))}
          </div>

          {pendingUsers.length > 3 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setFilterStatus('pending')}
                className="text-sm text-orange-600 hover:text-orange-800 font-medium"
              >
                Ver todos os {pendingUsers.length} usuários pendentes →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">⏳ Aguardando Aprovação</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
              <option value="suspenso">Suspensos</option>
            </select>
          </div>

          <div>
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todas as Escolas</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600 flex items-center">
            {filteredUsers.length} usuários encontrados
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Escolas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const userSchools = getUserSchools(user);
                return (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-800">
                            {user.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.nome}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.telefone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {userSchools.length === 0 ? (
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            ⏳ Aguardando aprovação
                          </span>
                        ) : (
                          userSchools.map((school) => (
                            <div key={school.id} className="flex items-center space-x-2">
                              <span className="text-sm text-gray-900">{school.nome}</span>
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(school.role)}`}>
                                {school.role}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.dataRegistro)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(user.uid)}
                        className={user.status === 'ativo' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                      >
                        {user.status === 'ativo' ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
          <p className="text-gray-500">
            {searchTerm || filterRole !== 'all' || filterSchool !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Cadastre o primeiro usuário para começar'
            }
          </p>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          schools={schools}
          onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
          onClose={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* Modal de Sucesso */}
      <ConfirmDialog
        isOpen={showSuccessModal}
        title="Sucesso"
        message={successMessage}
        type="success"
        confirmText="OK"
        onConfirm={() => setShowSuccessModal(false)}
      />

      {/* Modal de Erro */}
      <ConfirmDialog
        isOpen={showErrorModal}
        title="Erro"
        message={errorMessage}
        type="error"
        confirmText="OK"
        onConfirm={() => setShowErrorModal(false)}
      />
    </div>
  );
}