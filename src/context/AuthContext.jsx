"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, ref, get } from '../firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [accessType, setAccessType] = useState(null); // 'school' ou 'management'
  const [showAccessSelector, setShowAccessSelector] = useState(false);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const savedAccessType = localStorage.getItem('accessType');
    const savedSchool = localStorage.getItem('selectedSchool');
    
    if (savedAccessType) {
      setAccessType(savedAccessType);
    }
    
    if (savedSchool) {
      try {
        setSelectedSchool(JSON.parse(savedSchool));
      } catch (error) {
        console.error('Erro ao carregar escola do localStorage:', error);
        localStorage.removeItem('selectedSchool');
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Busca o role do usuário no banco
        const userRef = ref(db, `usuarios/${firebaseUser.uid}`);
        const snap = await get(userRef);
        if (snap.exists()) {
          const userData = snap.val();
          setRole(userData.role);
        } else {
          setRole(null);
        }

        // Verificar se precisa mostrar seletor de acesso
        checkAccessSelector(firebaseUser);
      } else {
        setRole(null);
        setSelectedSchool(null);
        setAccessType(null);
        setShowAccessSelector(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const checkAccessSelector = (firebaseUser) => {
    const superAdminId = 'qD6UucWtcgPC9GHA41OB8rSaghZ2';
    const isSuperAdmin = firebaseUser?.uid === superAdminId;
    
    // Verificar se há escola já selecionada
    const savedSchool = localStorage.getItem('selectedSchool');
    const savedAccessType = localStorage.getItem('accessType');
    
    if (savedSchool && savedAccessType) {
      // Dados já carregados no useEffect inicial, apenas controlar exibição
      setShowAccessSelector(false);
    } else if (isSuperAdmin) {
      // Super admin sempre deve escolher tipo de acesso se não houver dados salvos
      setShowAccessSelector(true);
    } else {
      // Usuário normal, verificar se tem múltiplas escolas
      // Por enquanto, assumir que tem apenas uma escola
      setShowAccessSelector(false);
      if (!savedAccessType) {
        setAccessType('school');
        localStorage.setItem('accessType', 'school');
      }
    }
  };

  const handleSchoolSelect = (school) => {
    setSelectedSchool(school);
    setAccessType('school');
    localStorage.setItem('selectedSchool', JSON.stringify(school));
    localStorage.setItem('accessType', 'school');
    setShowAccessSelector(false);
  };

  const handleManagementSelect = () => {
    setSelectedSchool(null);
    setAccessType('management');
    localStorage.removeItem('selectedSchool');
    localStorage.setItem('accessType', 'management');
    setShowAccessSelector(false);
  };

  const resetAccessType = () => {
    setSelectedSchool(null);
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
      accessType,
      showAccessSelector,
      handleSchoolSelect,
      handleManagementSelect,
      resetAccessType
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
