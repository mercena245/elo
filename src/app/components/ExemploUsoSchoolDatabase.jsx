/**
 * Exemplo de Componente usando useSchoolDatabase
 * 
 * Este arquivo demonstra como usar o hook useSchoolDatabase para
 * fazer operações no banco de dados da escola atualmente selecionada.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';

export default function ExemploAlunosComponent() {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoAluno, setNovoAluno] = useState({ nome: '', matricula: '' });

  // Hook que conecta automaticamente ao banco da escola selecionada
  const { 
    isReady, 
    isLoading, 
    error, 
    currentSchool,
    getData, 
    pushData, 
    updateData, 
    removeData,
    listen 
  } = useSchoolDatabase();

  // Carregar alunos quando o banco estiver pronto
  useEffect(() => {
    if (!isReady) return;

    const loadAlunos = async () => {
      try {
        setLoading(true);
        console.log('📚 Carregando alunos da escola:', currentSchool.nome);
        
        // Buscar dados do banco da escola
        const data = await getData('alunos');
        
        if (data) {
          const alunosArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setAlunos(alunosArray);
          console.log('✅ Alunos carregados:', alunosArray.length);
        } else {
          setAlunos([]);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar alunos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAlunos();

    // Opcional: Listener em tempo real
    const unsubscribe = listen('alunos', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const alunosArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setAlunos(alunosArray);
      }
    });

    return () => unsubscribe?.();
  }, [isReady, currentSchool]);

  // Adicionar novo aluno
  const handleAddAluno = async (e) => {
    e.preventDefault();
    
    if (!novoAluno.nome || !novoAluno.matricula) return;

    try {
      console.log('➕ Adicionando aluno ao banco da escola:', currentSchool.nome);
      
      // Push adiciona no banco da escola selecionada
      const novoId = await pushData('alunos', {
        nome: novoAluno.nome,
        matricula: novoAluno.matricula,
        dataCadastro: new Date().toISOString()
      });

      console.log('✅ Aluno adicionado com ID:', novoId);
      setNovoAluno({ nome: '', matricula: '' });
    } catch (error) {
      console.error('❌ Erro ao adicionar aluno:', error);
    }
  };

  // Atualizar aluno
  const handleUpdateAluno = async (alunoId, updates) => {
    try {
      console.log('✏️ Atualizando aluno:', alunoId);
      
      await updateData(`alunos/${alunoId}`, updates);
      
      console.log('✅ Aluno atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar aluno:', error);
    }
  };

  // Remover aluno
  const handleRemoveAluno = async (alunoId) => {
    try {
      console.log('🗑️ Removendo aluno:', alunoId);
      
      await removeData(`alunos/${alunoId}`);
      
      console.log('✅ Aluno removido');
    } catch (error) {
      console.error('❌ Erro ao remover aluno:', error);
    }
  };

  // Estados de carregamento
  if (isLoading || !isReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando ao banco da escola...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Erro ao conectar</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Informação da escola conectada */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          <strong>Conectado ao banco:</strong> {currentSchool?.nome}
        </p>
        <p className="text-blue-600 text-sm">
          Database: {currentSchool?.databaseURL}
        </p>
      </div>

      {/* Formulário de novo aluno */}
      <form onSubmit={handleAddAluno} className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Adicionar Novo Aluno</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome"
            value={novoAluno.nome}
            onChange={(e) => setNovoAluno({ ...novoAluno, nome: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Matrícula"
            value={novoAluno.matricula}
            onChange={(e) => setNovoAluno({ ...novoAluno, matricula: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Adicionar Aluno
        </button>
      </form>

      {/* Lista de alunos */}
      <div className="bg-white rounded-lg shadow">
        <h3 className="font-semibold p-4 border-b">
          Alunos ({alunos.length})
        </h3>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Carregando alunos...
          </div>
        ) : alunos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum aluno cadastrado
          </div>
        ) : (
          <div className="divide-y">
            {alunos.map((aluno) => (
              <div key={aluno.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium">{aluno.nome}</p>
                  <p className="text-sm text-gray-600">Matrícula: {aluno.matricula}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateAluno(aluno.id, { status: 'ativo' })}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleRemoveAluno(aluno.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * RESUMO DO USO:
 * 
 * 1. Import o hook: import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';
 * 
 * 2. Use no componente: const { getData, pushData, updateData, removeData, isReady } = useSchoolDatabase();
 * 
 * 3. Aguarde isReady === true antes de fazer operações
 * 
 * 4. Todas as operações vão automaticamente para o banco da escola selecionada!
 * 
 * MÉTODOS DISPONÍVEIS:
 * - getData(path): Buscar dados
 * - pushData(path, data): Adicionar novo item
 * - updateData(path, updates): Atualizar dados
 * - removeData(path): Remover dados
 * - listen(path, callback): Listener em tempo real
 * - uploadFile(path, file): Upload para Storage
 * - getFileURL(path): URL de arquivo
 * - deleteFile(path): Deletar arquivo
 */
