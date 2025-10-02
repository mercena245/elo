/**
 * Hook para controle de acesso na Secretaria Digital
 * Gerencia permissões baseadas em roles e vínculos pai-aluno
 */

import { useState, useEffect } from 'react';
import { auth, db, ref, get } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const useSecretariaAccess = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [alunosVinculados, setAlunosVinculados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await carregarDadosUsuario(authUser.uid);
      } else {
        setUser(null);
        setUserRole(null);
        setAlunosVinculados([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const carregarDadosUsuario = async (userId) => {
    try {
      const userRef = ref(db, `usuarios/${userId}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUserRole(userData.role?.toLowerCase());
        
        // Se for pai, carregar alunos vinculados
        if (userData.role === 'pai') {
          const alunosIds = userData.alunosVinculados || [];
          if (alunosIds.length > 0) {
            const alunosData = await carregarDadosAlunos(alunosIds);
            setAlunosVinculados(alunosData);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosAlunos = async (alunosIds) => {
    try {
      const alunosRef = ref(db, 'alunos');
      const snapshot = await get(alunosRef);
      
      if (snapshot.exists()) {
        const todosAlunos = Object.entries(snapshot.val())
          .map(([id, aluno]) => ({ id, ...aluno }));
        
        return todosAlunos.filter(aluno => alunosIds.includes(aluno.id));
      }
      return [];
    } catch (error) {
      console.error('Erro ao carregar dados dos alunos:', error);
      return [];
    }
  };

  // Verificar se pode acessar a secretaria digital
  const podeAcessarSecretaria = () => {
    return userRole === 'coordenadora';
  };

  // Verificar se pode visualizar documento de um aluno específico
  const podeVisualizarDocumento = (alunoId) => {
    if (userRole === 'coordenadora') {
      return true; // Coordenadora vê tudo
    }
    
    if (userRole === 'pai') {
      return alunosVinculados.some(aluno => aluno.id === alunoId);
    }
    
    return false;
  };

  // Filtrar documentos baseado nas permissões
  const filtrarDocumentosPermitidos = (documentos) => {
    if (userRole === 'coordenadora') {
      return documentos; // Coordenadora vê todos
    }
    
    if (userRole === 'pai') {
      const alunosIds = alunosVinculados.map(aluno => aluno.id);
      return documentos.filter(doc => 
        doc.dadosAluno && alunosIds.includes(doc.dadosAluno.id)
      );
    }
    
    return [];
  };

  // Filtrar alunos baseado nas permissões
  const filtrarAlunosPermitidos = (alunos) => {
    if (userRole === 'coordenadora') {
      return alunos; // Coordenadora vê todos
    }
    
    if (userRole === 'pai') {
      const alunosIds = alunosVinculados.map(aluno => aluno.id);
      return alunos.filter(aluno => alunosIds.includes(aluno.id));
    }
    
    return [];
  };

  return {
    user,
    userRole,
    alunosVinculados,
    loading,
    podeAcessarSecretaria,
    podeVisualizarDocumento,
    filtrarDocumentosPermitidos,
    filtrarAlunosPermitidos
  };
};