"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../firebase';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Verificar se estamos na rota raiz antes de redirecionar
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          // Se usuário está logado, redireciona para dashboard
          router.push('/dashboard');
        } else {
          // Se não está logado, redireciona para login
          router.push('/login');
        }
      });

      return () => unsubscribe();
    }
  }, [router]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column'
      }}
    >
      <CircularProgress />
      <Typography variant="body2" sx={{ mt: 2 }}>
        Carregando sistema ELO...
      </Typography>
    </Box>
  );
}