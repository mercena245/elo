'use client';

import { useState, useEffect } from 'react';
import UserForm from './UserForm';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
    loadSchools();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // TODO: Implementar carregamento real do Firebase
      
      // Dados simulados
      const mockUsers = [
        {
          uid: 'user-001',
          nome: 'Maria Silva',
          email: 'maria@escolaabc.com',
          telefone: '(11) 99999-9999',
          dataRegistro: '2024-01-15',
          status: 'ativo',
          escolas: {
            'escola-001': {
              role: 'coordenador',
              ativo: true,
              dataVinculo: '2024-01-15',
              permissoes: ['*']
            }
          }
        },
        {
          uid: 'user-002',
          nome: 'João Santos',
          email: 'joao@colegioxyz.com',
          telefone: '(11) 88888-8888',
          dataRegistro: '2024-03-01',
          status: 'ativo',
          escolas: {
            'escola-002': {
              role: 'coordenador',
              ativo: true,
              dataVinculo: '2024-03-01',
              permissoes: ['*']
            }
          }
        },
        {
          uid: 'user-003',
          nome: 'Ana Costa',
          email: 'ana@escolaabc.com',
          telefone: '(11) 77777-7777',
          dataRegistro: '2024-02-10',
          status: 'ativo',
          escolas: {
            'escola-001': {
              role: 'secretaria',
              ativo: true,
              dataVinculo: '2024-02-10',
              permissoes: ['financeiro', 'alunos', 'secretaria-digital']
            }
          }
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchools = async () => {
    // Dados simulados das escolas
    const mockSchools = [
      { id: 'escola-001', nome: 'Escola ABC' },
      { id: 'escola-002', nome: 'Colégio XYZ' }
    ];
    setSchools(mockSchools);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || 
      Object.values(user.escolas || {}).some(escola => escola.role === filterRole);
    
    const matchesSchool = filterSchool === 'all' || 
      Object.keys(user.escolas || {}).includes(filterSchool);
    
    return matchesSearch && matchesRole && matchesSchool;
  });

  const handleCreateUser = (userData) => {
    const newUser = {
      ...userData,
      uid: `user-${Date.now()}`,
      dataRegistro: new Date().toISOString().split('T')[0],
      status: 'ativo'
    };
    setUsers([...users, newUser]);
    setShowUserForm(false);
  };

  const handleUpdateUser = (userData) => {
    setUsers(users.map(user => 
      user.uid === editingUser.uid 
        ? { ...user, ...userData }
        : user
    ));
    setEditingUser(null);
    setShowUserForm(false);
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
        <button
          onClick={() => {
            setEditingUser(null);
            setShowUserForm(true);
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <svg className="mr-2 -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuário
        </button>
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
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => Object.values(u.escolas || {}).some(e => e.role === 'coordenador')).length}
          </div>
          <div className="text-sm text-gray-500">Coordenadores</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => Object.values(u.escolas || {}).some(e => e.role === 'professor')).length}
          </div>
          <div className="text-sm text-gray-500">Professores</div>
        </div>
      </div>

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
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todos os Roles</option>
              <option value="coordenador">Coordenadores</option>
              <option value="secretaria">Secretárias</option>
              <option value="professor">Professores</option>
              <option value="responsavel">Responsáveis</option>
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
                        {userSchools.map((school) => (
                          <div key={school.id} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900">{school.nome}</span>
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(school.role)}`}>
                              {school.role}
                            </span>
                          </div>
                        ))}
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
    </div>
  );
}