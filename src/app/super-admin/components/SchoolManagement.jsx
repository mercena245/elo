'use client';

import { useState, useEffect } from 'react';
import SchoolForm from './SchoolForm';
import SchoolCard from './SchoolCard';

export default function SchoolManagement() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      // TODO: Implementar carregamento real do Firebase
      // Dados simulados
      const mockSchools = [
        {
          id: 'escola-001',
          nome: 'Escola ABC',
          cnpj: '12.345.678/0001-90',
          responsavel: 'Maria Silva',
          email: 'maria@escolaabc.com',
          telefone: '(11) 99999-9999',
          plano: 'premium',
          status: 'ativa',
          dataContrato: '2024-01-15',
          mensalidade: 2500.00,
          dataVencimento: 15,
          databaseURL: 'https://escola-abc-default-rtdb.firebaseio.com/',
          projectId: 'escola-abc',
          storageBucket: 'escola-abc.firebasestorage.app',
          endereco: {
            rua: 'Rua das Flores, 123',
            cidade: 'São Paulo',
            cep: '01234-567',
            estado: 'SP'
          },
          configuracoes: {
            modulosAtivos: ['financeiro', 'notas', 'alunos', 'secretaria'],
            limiteAlunos: 500,
            limiteProfessores: 30
          }
        },
        {
          id: 'escola-002',
          nome: 'Colégio XYZ',
          cnpj: '98.765.432/0001-10',
          responsavel: 'João Santos',
          email: 'joao@colegioxyz.com',
          telefone: '(11) 88888-8888',
          plano: 'basico',
          status: 'ativa',
          dataContrato: '2024-03-01',
          mensalidade: 1200.00,
          dataVencimento: 5,
          databaseURL: 'https://colegio-xyz-default-rtdb.firebaseio.com/',
          projectId: 'colegio-xyz',
          storageBucket: 'colegio-xyz.firebasestorage.app',
          endereco: {
            rua: 'Av. Central, 456',
            cidade: 'Rio de Janeiro',
            cep: '20000-000',
            estado: 'RJ'
          },
          configuracoes: {
            modulosAtivos: ['financeiro', 'notas', 'alunos'],
            limiteAlunos: 200,
            limiteProfessores: 15
          }
        }
      ];
      setSchools(mockSchools);
    } catch (error) {
      console.error('Erro ao carregar escolas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = (schoolData) => {
    const newSchool = {
      ...schoolData,
      id: `escola-${Date.now()}`,
      status: 'ativa',
      dataContrato: new Date().toISOString().split('T')[0]
    };
    setSchools([...schools, newSchool]);
    setShowForm(false);
  };

  const handleUpdateSchool = (schoolData) => {
    setSchools(schools.map(school => 
      school.id === editingSchool.id 
        ? { ...school, ...schoolData }
        : school
    ));
    setEditingSchool(null);
    setShowForm(false);
  };

  const handleDeleteSchool = (schoolId) => {
    if (confirm('Tem certeza que deseja excluir esta escola? Esta ação não pode ser desfeita.')) {
      setSchools(schools.filter(school => school.id !== schoolId));
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
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
    </div>
  );
}