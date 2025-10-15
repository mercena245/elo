/**
 * Exemplo de Integração do Sistema de Gerenciamento de Acesso no AuthContext
 * 
 * Este arquivo mostra como integrar a validação de escola e o fluxo de aprovação
 * no AuthContext existente.
 * 
 * IMPORTANTE: Este é um arquivo de exemplo. NÃO substituir o AuthContext atual
 * sem revisar todas as funcionalidades existentes.
 */

'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { userManagementService } from '../services/userManagementService';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [currentSchool, setCurrentSchool] = useState(null);
  const [accessType, setAccessType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsSchoolSelection, setNeedsSchoolSelection] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // Função existente de carregar dados da escola
  const loadSchoolData = async (schoolId) => {
    try {
      // ... código existente de loadSchoolData ...
      console.log('Carregando dados da escola:', schoolId);
      
      // Aqui você já tem a implementação de carregar a escola
      // do management DB e conectar ao banco específico da escola
      
    } catch (error) {
      console.error('Erro ao carregar escola:', error);
    }
  };

  // NOVA FUNÇÃO: Verificar se usuário tem escola associada
  const checkUserSchoolStatus = async (userId) => {
    try {
      console.log('🔍 Verificando status da escola do usuário:', userId);

      // 1. Buscar escolas do usuário
      const userSchools = await userManagementService.getUserSchools(userId);

      if (userSchools.length === 0) {
        console.log('⚠️ Usuário sem escola - precisa selecionar');
        setNeedsSchoolSelection(true);
        setIsPendingApproval(false);
        return { needsSelection: true, hasPending: false };
      }

      // 2. Verificar se tem alguma escola aprovada
      const approvedSchools = userSchools.filter(
        school => school.ativo === true && school.role !== null
      );

      if (approvedSchools.length > 0) {
        console.log('✅ Usuário tem escola aprovada');
        
        // Carregar primeira escola aprovada
        await loadSchoolData(approvedSchools[0].id);
        setSelectedSchool(approvedSchools[0]);
        setNeedsSchoolSelection(false);
        setIsPendingApproval(false);
        
        return { needsSelection: false, hasPending: false };
      }

      // 3. Verificar se tem escola pendente de aprovação
      const pendingSchools = userSchools.filter(
        school => school.ativo === false || school.role === null
      );

      if (pendingSchools.length > 0) {
        console.log('⏳ Usuário com aprovação pendente');
        setIsPendingApproval(true);
        setNeedsSchoolSelection(false);
        return { needsSelection: false, hasPending: true };
      }

      // 4. Caso não se encaixe em nenhum cenário acima
      console.log('⚠️ Status indefinido - solicitar nova seleção');
      setNeedsSchoolSelection(true);
      return { needsSelection: true, hasPending: false };

    } catch (error) {
      console.error('❌ Erro ao verificar status da escola:', error);
      return { needsSelection: true, hasPending: false };
    }
  };

  // MODIFICAR: useEffect de autenticação para incluir verificação de escola
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);

        if (firebaseUser) {
          console.log('👤 Usuário autenticado:', firebaseUser.email);
          
          setUser(firebaseUser);

          // Buscar role do usuário (código existente)
          // ... seu código de buscar role ...

          // NOVA LÓGICA: Verificar status da escola
          const schoolStatus = await checkUserSchoolStatus(firebaseUser.uid);

          // Definir estados baseado no resultado
          if (schoolStatus.needsSelection) {
            console.log('➡️ Redirecionar para seleção de escola');
            // Não define loading como false ainda - deixa o componente
            // de roteamento decidir para onde ir
          } else if (schoolStatus.hasPending) {
            console.log('➡️ Redirecionar para aguardando aprovação');
          } else {
            console.log('✅ Usuário pronto para usar o sistema');
          }

        } else {
          console.log('❌ Usuário não autenticado');
          setUser(null);
          setRole(null);
          setSelectedSchool(null);
          setCurrentSchool(null);
          setNeedsSchoolSelection(false);
          setIsPendingApproval(false);
        }

      } catch (error) {
        console.error('Erro no fluxo de autenticação:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // NOVA FUNÇÃO: Solicitar acesso a uma escola
  const requestSchoolAccess = async (schoolId) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('📝 Solicitando acesso à escola:', schoolId);

      const result = await userManagementService.requestSchoolAccess(
        user.uid,
        schoolId,
        {
          email: user.email,
          nome: user.displayName || user.email.split('@')[0]
        }
      );

      if (result.success) {
        // Atualizar estados baseado no resultado
        if (result.hasCoordinator) {
          // Auto-aprovado - carregar escola
          await checkUserSchoolStatus(user.uid);
          setNeedsSchoolSelection(false);
          setIsPendingApproval(false);
        } else {
          // Precisa aprovação - mostrar tela de aguardo
          setNeedsSchoolSelection(false);
          setIsPendingApproval(true);
        }
      }

      return result;

    } catch (error) {
      console.error('❌ Erro ao solicitar acesso:', error);
      return {
        success: false,
        message: 'Erro ao processar solicitação'
      };
    }
  };

  // NOVA FUNÇÃO: Atualizar status após aprovação
  const refreshSchoolStatus = async () => {
    if (!user) return;

    console.log('🔄 Atualizando status da escola...');
    const status = await checkUserSchoolStatus(user.uid);

    if (!status.hasPending && !status.needsSelection) {
      // Usuário foi aprovado - recarregar página
      window.location.reload();
    }

    return status;
  };

  // Funções existentes do seu AuthContext
  // ... login, logout, resetAccessType, etc ...

  // Context value
  const value = {
    // Estados existentes
    user,
    role,
    selectedSchool,
    currentSchool,
    accessType,
    loading,

    // NOVOS estados
    needsSchoolSelection,
    isPendingApproval,

    // Funções existentes
    loadSchoolData,
    // ... outras funções existentes ...

    // NOVAS funções
    checkUserSchoolStatus,
    requestSchoolAccess,
    refreshSchoolStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/**
 * EXEMPLO DE USO EM COMPONENTES
 * 
 * 1. Na página principal ou layout:
 */

/*
function MainLayout({ children }) {
  const { 
    loading, 
    needsSchoolSelection, 
    isPendingApproval,
    user 
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (needsSchoolSelection) {
    return <SchoolSelection />;
  }

  if (isPendingApproval) {
    return <Navigate to="/aguardando-aprovacao" />;
  }

  return children;
}
*/

/**
 * 2. No componente SchoolSelection:
 */

/*
function SchoolSelection() {
  const { requestSchoolAccess } = useAuth();
  
  const handleSelectSchool = async (schoolId) => {
    const result = await requestSchoolAccess(schoolId);
    
    if (result.success) {
      // Redirecionamento será feito automaticamente
      // baseado no status retornado
    }
  };
  
  return (
    // ... UI de seleção ...
  );
}
*/

/**
 * 3. Na página de aguardando aprovação:
 */

/*
function AwaitingApproval() {
  const { refreshSchoolStatus } = useAuth();
  
  const handleCheckStatus = async () => {
    const status = await refreshSchoolStatus();
    
    if (!status.hasPending) {
      // Aprovado! Será redirecionado automaticamente
    } else {
      alert('Ainda aguardando aprovação');
    }
  };
  
  return (
    // ... UI de aguardo ...
  );
}
*/

/**
 * CHECKLIST DE INTEGRAÇÃO
 * 
 * [ ] 1. Adicionar imports necessários
 * [ ] 2. Adicionar novos estados (needsSchoolSelection, isPendingApproval)
 * [ ] 3. Adicionar função checkUserSchoolStatus
 * [ ] 4. Modificar useEffect de autenticação para chamar checkUserSchoolStatus
 * [ ] 5. Adicionar função requestSchoolAccess
 * [ ] 6. Adicionar função refreshSchoolStatus
 * [ ] 7. Exportar novos estados e funções no value
 * [ ] 8. Criar componente de roteamento condicional no layout principal
 * [ ] 9. Testar fluxo completo
 * [ ] 10. Ajustar regras de segurança do Firebase
 */

/**
 * IMPORTANTE: PRESERVAR FUNCIONALIDADES EXISTENTES
 * 
 * - 2FA (TwoFactorAuthService)
 * - loadSchoolData
 * - resetAccessType
 * - localStorage persistence
 * - Todas as outras funções do AuthContext atual
 * 
 * Esta integração apenas ADICIONA novas funcionalidades,
 * não deve remover ou quebrar as existentes.
 */
