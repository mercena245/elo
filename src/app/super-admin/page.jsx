'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '../../hooks/useAuthUser';
import SuperAdminAuth from './components/SuperAdminAuth';
import SuperAdminDashboard from './components/SuperAdminDashboard';

const SUPER_ADMIN_UID = 'qD6UucWtcgPC9GHA41OB8rSaghZ2';

export default function SuperAdminPage() {
  const { user, loading } = useAuthUser();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Verificar se é o usuário autorizado
    if (user.uid === SUPER_ADMIN_UID) {
      setIsAuthorized(true);
    } else {
      // Usuário não autorizado - redirecionar
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Acesso Negado</h3>
            <p className="mt-2 text-sm text-gray-500">
              Você não tem permissão para acessar esta área.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 w-full inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <SuperAdminAuth 
        onAuthenticated={() => setIsAuthenticated(true)}
        user={user}
      />
    );
  }

  return <SuperAdminDashboard user={user} />;
}