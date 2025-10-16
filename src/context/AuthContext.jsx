"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, ref, get, managementDB } from '../firebase';
import { TwoFactorAuthService } from '../services/twoFactorAuthService';
import { SUPER_ADMIN_UID, ROLES, isSuperAdmin } from '../config/constants';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [currentSchool, setCurrentSchool] = useState(null); // Dados completos da escola (com databaseURL, etc)
  const [isLoadingSchool, setIsLoadingSchool] = useState(false);
  const [accessType, setAccessType] = useState(null); // 'school' ou 'management'
  const [showAccessSelector, setShowAccessSelector] = useState(false);
  
  // ⚠️ 2FA TEMPORARIAMENTE DESABILITADO
  // const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  // const [showTwoFactorVerification, setShowTwoFactorVerification] = useState(false);
  // const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  // const [twoFactorAuthenticated, setTwoFactorAuthenticated] = useState(false);

  // Definir loadSchoolData ANTES dos useEffects
  const loadSchoolData = async (schoolId) => {
    try {
      setIsLoadingSchool(true);
      console.log('🔍 [loadSchoolData] Iniciando carregamento...');
      console.log('🔍 [loadSchoolData] School ID:', schoolId);
      console.log('🔍 [loadSchoolData] Caminho:', `escolas/${schoolId}`);
      
      const escolaRef = ref(managementDB, `escolas/${schoolId}`);
      const snapshot = await get(escolaRef);
      
      console.log('📊 [loadSchoolData] Snapshot exists:', snapshot.exists());
      
      if (snapshot.exists()) {
        const schoolData = snapshot.val();
        console.log('📄 [loadSchoolData] Dados brutos:', schoolData);
        
        const fullSchoolData = {
          id: schoolId,
          ...schoolData
        };
        
        console.log('📦 [loadSchoolData] Dados completos preparados:');
        console.log('  - ID:', fullSchoolData.id);
        console.log('  - Nome:', fullSchoolData.nome);
        console.log('  - Database URL:', fullSchoolData.databaseURL);
        console.log('  - Storage Bucket:', fullSchoolData.storageBucket);
        console.log('  - Project ID:', fullSchoolData.projectId);
        
        setCurrentSchool(fullSchoolData);
        console.log('✅ [loadSchoolData] Escola carregada e setada no contexto');
      } else {
        console.error('❌ [loadSchoolData] Escola não encontrada no managementDB');
        console.error('❌ [loadSchoolData] Caminho tentado:', `escolas/${schoolId}`);
        setCurrentSchool(null);
      }
    } catch (error) {
      console.error('❌ [loadSchoolData] Erro ao carregar dados da escola:', error);
      setCurrentSchool(null);
    } finally {
      setIsLoadingSchool(false);
      console.log('🏁 [loadSchoolData] Finalizado. isLoadingSchool:', false);
    }
  };

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const savedAccessType = localStorage.getItem('accessType');
    const savedSchool = localStorage.getItem('selectedSchool');
    
    console.log('🔄 [AuthContext Init] Inicializando AuthContext...');
    console.log('💾 [AuthContext Init] Tipo de acesso salvo:', savedAccessType);
    console.log('💾 [AuthContext Init] Escola salva:', savedSchool ? 'Sim' : 'Não');
    
    if (savedAccessType) {
      console.log('✅ [AuthContext Init] AccessType setado:', savedAccessType);
      setAccessType(savedAccessType);
    }
    
    if (savedSchool) {
      try {
        const schoolData = JSON.parse(savedSchool);
        console.log('📋 [AuthContext Init] Escola do localStorage:', schoolData);
        console.log('📋 [AuthContext Init] Nome:', schoolData.nome);
        console.log('🔑 [AuthContext Init] ID da escola:', schoolData.id);
        
        setSelectedSchool(schoolData);
        
        // IMPORTANTE: Buscar dados completos do managementDB
        // Não confiar apenas no localStorage
        if (schoolData.id) {
          console.log('🔍 [AuthContext Init] Chamando loadSchoolData...');
          loadSchoolData(schoolData.id);
        } else {
          console.error('❌ [AuthContext Init] Escola sem ID!');
        }
      } catch (error) {
        console.error('❌ [AuthContext Init] Erro ao carregar escola do localStorage:', error);
        localStorage.removeItem('selectedSchool');
      }
    } else {
      console.log('⚠️ [AuthContext Init] Nenhuma escola salva no localStorage');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let userData = null;
        
        // Primeiro, verificar se há escola selecionada no localStorage
        let savedSchool = localStorage.getItem('selectedSchool');
        let schoolToCheck = null;
        
        if (savedSchool) {
          try {
            schoolToCheck = JSON.parse(savedSchool);
          } catch (error) {
            console.error('❌ [AuthContext] Erro ao parsear escola do localStorage:', error);
          }
        }
        
        // Se não houver escola no localStorage, buscar do managementDB
        if (!schoolToCheck) {
          console.log('🔍 [AuthContext] Sem escola no localStorage, buscando do managementDB...');
          
          try {
            const userRef = ref(managementDB, `usuarios/${firebaseUser.uid}`);
            const userSnap = await get(userRef);
            
            if (userSnap.exists()) {
              const userMgmtData = userSnap.val();
              
              // Verificar se usuário tem escolas vinculadas
              if (userMgmtData.escolas && Object.keys(userMgmtData.escolas).length > 0) {
                // Pegar a primeira escola vinculada
                const primeiraEscolaId = Object.keys(userMgmtData.escolas)[0];
                console.log('✅ [AuthContext] Primeira escola encontrada:', primeiraEscolaId);
                
                // Buscar dados completos da escola
                const escolaRef = ref(managementDB, `escolas/${primeiraEscolaId}`);
                const escolaSnap = await get(escolaRef);
                
                if (escolaSnap.exists()) {
                  schoolToCheck = {
                    id: primeiraEscolaId,
                    ...escolaSnap.val()
                  };
                  
                  // Salvar no localStorage para próximas vezes
                  localStorage.setItem('selectedSchool', JSON.stringify(schoolToCheck));
                  localStorage.setItem('accessType', 'school');
                  setSelectedSchool(schoolToCheck);
                  setAccessType('school');
                  
                  console.log('💾 [AuthContext] Escola salva no localStorage:', schoolToCheck.nome);
                }
              }
            }
          } catch (error) {
            console.error('❌ [AuthContext] Erro ao buscar escolas do usuário:', error);
          }
        }
        
        // Agora buscar role do banco da escola (se houver escola)
        if (schoolToCheck && schoolToCheck.id) {
          try {
            console.log('🔍 [AuthContext] Buscando role do usuário na escola:', schoolToCheck.id);
            
            // ⭐ SE FOR SUPER ADMIN, TRATAR COMO COORDENADOR
            if (isSuperAdmin(firebaseUser.uid)) {
              console.log('👑 [AuthContext] Super Admin detectado - setando como COORDENADORA');
              setRole(ROLES.COORDENADORA); // ← Usar 'coordenadora' que é o padrão do sistema
            } else {
              // Para usuários normais, buscar do banco da escola
              
              // Buscar dados completos da escola se necessário
              if (!schoolToCheck.databaseURL) {
                const escolaRef = ref(managementDB, `escolas/${schoolToCheck.id}`);
                const escolaSnap = await get(escolaRef);
                
                if (escolaSnap.exists()) {
                  schoolToCheck = {
                    id: schoolToCheck.id,
                    ...escolaSnap.val()
                  };
                }
              }
              
              // Importar schoolDatabaseService e conectar ao banco da escola
              const { getSchoolDatabase } = await import('../services/schoolDatabaseService');
              const schoolDB = getSchoolDatabase(schoolToCheck);
              
              // Buscar usuário no banco DA ESCOLA
              const userRef = ref(schoolDB, `usuarios/${firebaseUser.uid}`);
              const snap = await get(userRef);
              
              if (snap.exists()) {
                userData = snap.val();
                console.log('✅ [AuthContext] Role encontrada no banco da escola:', userData.role);
                setRole(userData.role);
              } else {
                console.log('⚠️ [AuthContext] Usuário não encontrado no banco da escola');
                setRole(null);
              }
            }
          } catch (error) {
            console.error('❌ [AuthContext] Erro ao buscar role do banco da escola:', error);
            setRole(null);
          }
        } else {
          // Sem escola vinculada, buscar do managementDB (pode ser usuário novo)
          console.log('🔍 [AuthContext] Sem escola vinculada, buscando do managementDB');
          const userRef = ref(managementDB, `usuarios/${firebaseUser.uid}`);
          const snap = await get(userRef);
          
          if (snap.exists()) {
            userData = snap.val();
            setRole(userData.role);
          } else {
            setRole(null);
          }
        }

        // Verificar se precisa mostrar seletor de acesso (apenas se tiver role)
        checkAccessSelector(firebaseUser, userData);
        
        // ⚠️ 2FA TEMPORARIAMENTE DESABILITADO
        // checkTwoFactorRequired(firebaseUser);
      } else {
        setRole(null);
        setSelectedSchool(null);
        setAccessType(null);
        setShowAccessSelector(false);
        
        // ⚠️ 2FA TEMPORARIAMENTE DESABILITADO
        // setShowTwoFactorSetup(false);
        // setShowTwoFactorVerification(false);
        // setTwoFactorRequired(false);
        // setTwoFactorAuthenticated(false);
        // Limpar sessão 2FA
        // const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith('2fa_authenticated_'));
        // sessionKeys.forEach(key => sessionStorage.removeItem(key));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ⚠️ 2FA TEMPORARIAMENTE DESABILITADO
  /*
  const checkTwoFactorRequired = (firebaseUser) => {
    const isSuperAdminUser = isSuperAdmin(firebaseUser?.uid);
    
    if (isSuperAdminUser) {
      setTwoFactorRequired(true);
      
      // Verificar se 2FA está configurado
      const twoFactorEnabled = TwoFactorAuthService.isUserTwoFactorEnabled(firebaseUser.uid);
      
      if (!twoFactorEnabled) {
        // 2FA não configurado, mostrar setup
        setShowTwoFactorSetup(true);
        setShowTwoFactorVerification(false);
      } else {
        // 2FA configurado, verificar se já foi autenticado nesta sessão
        const sessionAuth = sessionStorage.getItem(`2fa_authenticated_${firebaseUser.uid}`);
        
        if (sessionAuth) {
          setTwoFactorAuthenticated(true);
          setShowTwoFactorVerification(false);
        } else {
          // Precisa verificar 2FA
          setShowTwoFactorVerification(true);
          setTwoFactorAuthenticated(false);
        }
      }
    } else {
      setTwoFactorRequired(false);
      setTwoFactorAuthenticated(true); // Usuários normais não precisam de 2FA
    }
  };

  const handleTwoFactorSetupComplete = () => {
    setShowTwoFactorSetup(false);
    setShowTwoFactorVerification(true);
  };

  const handleTwoFactorVerificationSuccess = () => {
    setTwoFactorAuthenticated(true);
    setShowTwoFactorVerification(false);
    
    // Salvar autenticação da sessão
    if (user) {
      sessionStorage.setItem(`2fa_authenticated_${user.uid}`, 'true');
    }
  };

  const handleTwoFactorCancel = () => {
    // Fazer logout se cancelar 2FA
    auth.signOut();
  };
  */

  const checkAccessSelector = (firebaseUser, userData) => {
    const isSuperAdminUser = isSuperAdmin(firebaseUser?.uid);
    
    console.log('🔍 [checkAccessSelector] Verificando acesso...');
    console.log('👤 [checkAccessSelector] É super admin?', isSuperAdminUser);
    console.log('👤 [checkAccessSelector] User Data:', userData);
    console.log('👤 [checkAccessSelector] Tem role?', userData?.role ? 'Sim: ' + userData.role : 'Não');
    
    // Se usuário não tem role, não mostra AccessTypeSelector
    // LoginForm vai redirecionar para /school-selection
    if (!userData?.role && !isSuperAdminUser) {
      console.log('⚠️ [checkAccessSelector] Usuário SEM role - não mostra seletor');
      setShowAccessSelector(false);
      return;
    }
    
    // Verificar se há escola já selecionada
    const savedSchool = localStorage.getItem('selectedSchool');
    const savedAccessType = localStorage.getItem('accessType');
    
    console.log('💾 [checkAccessSelector] Escola salva?', savedSchool ? 'Sim' : 'Não');
    console.log('💾 [checkAccessSelector] AccessType salvo?', savedAccessType);
    
    if (savedSchool && savedAccessType) {
      // Dados já carregados no useEffect inicial, apenas controlar exibição
      console.log('✅ [checkAccessSelector] Escola JÁ selecionada - Ocultando seletor');
      setShowAccessSelector(false);
    } else if (isSuperAdminUser) {
      // Super admin sempre deve escolher tipo de acesso se não houver dados salvos
      console.log('🔐 [checkAccessSelector] Super Admin SEM escola - Mostrando seletor');
      setShowAccessSelector(true);
    } else {
      // Usuário normal COM role mas SEM escola selecionada - DEVE MOSTRAR SELETOR
      console.log('👤 [checkAccessSelector] Usuário normal COM role SEM escola - Mostrando seletor');
      setShowAccessSelector(true);
      
      // Se não houver accessType salvo, definir como 'school' por padrão
      if (!savedAccessType) {
        console.log('📝 [checkAccessSelector] Setando accessType = school');
        setAccessType('school');
        localStorage.setItem('accessType', 'school');
      }
    }
  };

  const handleSchoolSelect = async (school) => {
    setSelectedSchool(school);
    setAccessType('school');
    localStorage.setItem('selectedSchool', JSON.stringify(school));
    localStorage.setItem('accessType', 'school');
    setShowAccessSelector(false);
    
    // Buscar dados completos da escola do banco de gerenciamento
    await loadSchoolData(school.id);
  };

  const handleManagementSelect = () => {
    setSelectedSchool(null);
    setCurrentSchool(null);
    setAccessType('management');
    localStorage.removeItem('selectedSchool');
    localStorage.setItem('accessType', 'management');
    setShowAccessSelector(false);
  };

  const resetAccessType = () => {
    setSelectedSchool(null);
    setCurrentSchool(null);
    setAccessType(null);
    localStorage.removeItem('selectedSchool');
    localStorage.removeItem('accessType');
    setShowAccessSelector(true);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      loading,
      selectedSchool,
      currentSchool,
      isLoadingSchool,
      accessType,
      showAccessSelector,
      // ⚠️ 2FA TEMPORARIAMENTE DESABILITADO
      // showTwoFactorSetup,
      // showTwoFactorVerification,
      // twoFactorRequired,
      // twoFactorAuthenticated,
      handleSchoolSelect,
      handleManagementSelect,
      // handleTwoFactorSetupComplete,
      // handleTwoFactorVerificationSuccess,
      // handleTwoFactorCancel,
      resetAccessType,
      loadSchoolData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
