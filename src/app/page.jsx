"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../firebase';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;

    console.log('🔍 Iniciando verificação de autenticação...');

    // Timeout de segurança - se demorar mais de 3 segundos, redireciona para login
    timeoutId = setTimeout(() => {
      if (mounted && checking) {
        console.log('⚠️ Timeout ao verificar autenticação, redirecionando para login...');
        router.push('/login');
        setChecking(false);
      }
    }, 3000);

    // Verificar autenticação
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!mounted) return;

      console.log('🔍 Auth state changed:', user ? 'Usuário logado' : 'Sem usuário');
      
      clearTimeout(timeoutId);
      
      if (user) {
        // Se usuário está logado, redireciona para dashboard
        console.log('✅ Redirecionando para dashboard...');
        router.push('/dashboard');
      } else {
        // Se não está logado, redireciona para login
        console.log('✅ Redirecionando para login...');
        router.push('/login');
      }
      
      setChecking(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [router]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
      }}
    >
      <CircularProgress sx={{ color: 'white' }} />
      <Typography variant="body1" sx={{ mt: 2, color: 'white', fontWeight: 500 }}>
        Carregando sistema ELO...
      </Typography>
    </Box>
  );
}