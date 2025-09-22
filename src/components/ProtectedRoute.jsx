
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
        router.push('/login');
      } else if (allowedRoles && !allowedRoles.includes(role)) {
        router.push('/'); // Ou uma página de acesso negado
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
