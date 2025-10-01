'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  Typography,
  Button
} from '@mui/material';
import { Lock, ArrowBack } from '@mui/icons-material';
import SidebarMenu from '../../components/SidebarMenu';
import Impressoes from '../components/impressoes/Impressoes';
import '../../styles/Dashboard.css';

export default function ImpressoesPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
        return;
      }

      // Verificar se o usuário é coordenadora
      if (role !== 'coordenadora') {
        setAccessDenied(true);
        return;
      }

      setAccessDenied(false);
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Verificando permissões...
        </Typography>
      </Box>
    );
  }

  if (accessDenied) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 10 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Lock sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
            
            <Typography variant="h4" color="error" fontWeight={600} gutterBottom>
              Acesso Negado
            </Typography>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              🚫 Área Restrita - Coordenação
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
              <strong>Esta área é exclusiva para coordenadoras.</strong><br/>
              Você precisa ter perfil de coordenadora para acessar a Central de Impressões e Relatórios.
            </Alert>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Seu perfil atual: <strong>{role || 'Não identificado'}</strong>
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<ArrowBack />}
                onClick={() => router.push('/dashboard')}
                size="large"
              >
                Voltar ao Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <div className="dashboard-container">
      <SidebarMenu />
      <main className="dashboard-main">
        <Impressoes />
      </main>
    </div>
  );
}