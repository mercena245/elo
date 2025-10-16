'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { managementDB, ref, get } from '../firebase';
import { SUPER_ADMIN_UID, isSuperAdmin } from '../config/constants';

export default function AccessControl({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkUserAccess = async () => {
      if (loading) return;

      // Rotas públicas que não precisam de verificação
      const publicRoutes = ['/login', '/register', '/pending-approval'];
      if (publicRoutes.includes(pathname)) {
        setHasAccess(true);
        setChecking(false);
        return;
      }

      // Se não está logado, redirecionar para login
      if (!user) {
        router.push('/login');
        return;
      }

      // SuperAdmin sempre tem acesso (mas tratado como coordenador nas escolas)
      if (isSuperAdmin(user.uid)) {
        setHasAccess(true);
        setChecking(false);
        return;
      }

      // Verificar se usuário tem escolas vinculadas
      try {
        const userRef = ref(managementDB, `usuarios/${user.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const userData = snapshot.val();
          const escolas = userData.escolas || {};
          const hasSchools = Object.keys(escolas).length > 0;

          if (hasSchools) {
            // Usuário tem escolas, pode acessar
            setHasAccess(true);
          } else {
            // Usuário sem escolas, redirecionar para pending
            if (pathname !== '/pending-approval') {
              router.push('/pending-approval');
            }
            setHasAccess(false);
          }
        } else {
          // Usuário não existe no banco, redirecionar para pending
          if (pathname !== '/pending-approval') {
            router.push('/pending-approval');
          }
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Erro ao verificar acesso do usuário:', error);
        setHasAccess(false);
      }

      setChecking(false);
    };

    checkUserAccess();
  }, [user, loading, pathname, router]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return hasAccess ? children : null;
}
