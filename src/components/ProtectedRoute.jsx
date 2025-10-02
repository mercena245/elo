
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import CircularProgress from '@mui/material/CircularProgress';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        // Evitar redirecionamento se já estamos na página de login ou se é a primeira carga
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          router.push('/login');
        }
      } else if (allowedRoles && !allowedRoles.includes(role)) {
        // Redirecionamento para dashboard ao invés de home para evitar loops
        if (typeof window !== 'undefined' && window.location.pathname !== '/dashboard') {
          router.push('/dashboard');
        }
      }
    }
  }, [user, role, loading, allowedRoles, router]);

  if (loading || !user || (allowedRoles && !allowedRoles.includes(role))) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </div>
    );
  }

  return children;
}
