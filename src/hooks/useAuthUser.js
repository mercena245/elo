import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { useSchoolDatabase } from './useSchoolDatabase';
import { SUPER_ADMIN_UID, ROLES, isSuperAdmin } from '../config/constants';

export function useAuthUser() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getData, isReady } = useSchoolDatabase();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        setUserRole(null);
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchUserRole() {
      if (user && isReady) {
        try {
          console.log('🔐 [useAuthUser] Buscando role do usuário:', user.uid);
          
          // Se for Super Admin, tratá-lo como COORDENADOR dentro das escolas
          if (isSuperAdmin(user.uid)) {
            console.log('👑 [useAuthUser] Super Admin detectado - tratando como COORDENADORA');
            setUserRole(ROLES.COORDENADORA); // ← Usar 'coordenadora' que é o padrão do sistema
            setLoading(false);
            return;
          }
          
          // Para usuários normais, buscar do banco da escola
          const userData = await getData(`usuarios/${user.uid}`);
          
          if (userData && userData.role) {
            setUserRole(userData.role);
            console.log('✅ [useAuthUser] Role encontrada:', userData.role);
          } else {
            setUserRole(null);
            console.log('⚠️ [useAuthUser] Nenhuma role encontrada');
          }
        } catch (error) {
          console.error('❌ [useAuthUser] Erro ao buscar dados do usuário:', error);
          setUserRole(null);
        } finally {
          setLoading(false);
        }
      }
    }
    
    fetchUserRole();
  }, [user, isReady, getData]);

  return { user, userRole, loading };
}
