"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SidebarMenu from '../../components/SidebarMenu';
import ProtectedRoute from '../../components/ProtectedRoute';
import { 
  Typography, 
  Box, 
  Grid,
  Alert,
  Chip,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { PlanejamentoAulas, RelatoriosPedagogicos, CronogramaAcademico, BibliotecaMateriais } from './components';
import DiarioClasse from './components/DiarioClasse';

const SalaProfessor = () => {
  const { user, role } = useAuth();
  const searchParams = useSearchParams();

  // Função para obter aba inicial baseada no parâmetro da URL
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    switch(tabParam) {
      case 'diario': return 1;
      case 'relatorios': return 2;
      case 'cronograma': return 3;
      case 'biblioteca': return 4;
      default: return 0; // planos ou sem parâmetro
    }
  };

  const [tabValue, setTabValue] = useState(getInitialTab);

  // Atualizar aba quando os parâmetros da URL mudarem
  useEffect(() => {
    const newTab = getInitialTab();
    setTabValue(newTab);
  }, [searchParams]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderTabContent = () => {
    switch (tabValue) {
      case 0:
        return <PlanejamentoAulas />;
      case 1:
        return <DiarioClasse />;
      case 2:
        return <RelatoriosPedagogicos />;
      case 3:
        return <CronogramaAcademico />;
      case 4:
        return <BibliotecaMateriais />;
      default:
        return <PlanejamentoAulas />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['professor', 'professora', 'coordenador', 'coordenadora', 'admin']}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f6fa' }}>
        <SidebarMenu />
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 1, sm: 2, md: 3 },
            width: 0, // Força o flex item a não exceder o container
            maxWidth: 1400, 
            mx: 'auto'
          }}
        >
          <Box sx={{ mt: { xs: 1, sm: 2 } }}>
            
            {/* Header Centralizado da Sala do Professor */}
            <Box sx={{ 
              mb: { xs: 2, md: 3 }, 
              p: { xs: 2, sm: 2.5, md: 3 }, 
              borderRadius: { xs: 2, md: 3 }, 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', 
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decoração de fundo */}
              <Box sx={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: '250px',
                height: '250px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
                display: { xs: 'none', md: 'block' }
              }} />
              
              <Box sx={{ 
                position: 'relative', 
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 1.5
              }}>
                {/* Ícone */}
                <Avatar sx={{ 
                  width: { xs: 60, sm: 70, md: 80 }, 
                  height: { xs: 60, sm: 70, md: 80 }, 
                  bgcolor: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(10px)',
                  border: '3px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                }}>
                  👩‍🏫
                </Avatar>
                
                {/* Textos */}
                <Box>
                  <Typography 
                    variant="h4" 
                    fontWeight={700}
                    sx={{
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Sala do Professor
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      opacity: 0.92,
                      fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem' },
                      textShadow: '0 1px 5px rgba(0,0,0,0.2)',
                      mt: 0.5
                    }}
                  >
                    Bem-vinda, {user?.displayName || user?.email || 'Professor'}! 👋
                  </Typography>
                </Box>
                
                {/* Role Badge */}
                <Chip 
                  label={role === 'professor' ? '👩‍🏫 Professor' : '👑 Coordenador'} 
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }} 
                />
              </Box>
            </Box>

            {/* Navegação por Abas */}
            <Paper sx={{ 
              mb: { xs: 2, md: 3 }, 
              borderRadius: { xs: 1, md: 2 },
              overflow: 'hidden'
            }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="Funcionalidades da Sala do Professor"
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                    fontWeight: 500,
                    py: { xs: 1.5, md: 2 },
                    minWidth: { xs: 120, md: 160 }
                  },
                  '& .MuiTabs-scrollButtons': {
                    display: { xs: 'flex', md: 'none' }
                  }
                }}
              >
                <Tab 
                  label="📚 Planejamento de Aulas" 
                  sx={{ 
                    minHeight: { xs: 64, md: 72 }
                  }}
                />
                <Tab 
                  label="🎓 Diário de Classe" 
                  sx={{ 
                    minHeight: { xs: 64, md: 72 }
                  }}
                />
                <Tab 
                  label="📊 Relatórios Pedagógicos" 
                  sx={{ 
                    minHeight: { xs: 64, md: 72 }
                  }}
                />
                <Tab 
                  label="📅 Cronograma Acadêmico" 
                  sx={{ 
                    minHeight: { xs: 64, md: 72 }
                  }}
                />
                <Tab 
                  label="📖 Biblioteca de Materiais" 
                  sx={{ 
                    minHeight: { xs: 64, md: 72 }
                  }}
                />
              </Tabs>
            </Paper>

            {/* Conteúdo da Aba Selecionada */}
            <Box sx={{ 
              mt: { xs: 2, md: 3 },
              px: { xs: 0, sm: 1 },
              '& > *': {
                // Aplicar responsividade aos componentes filhos
                maxWidth: '100%',
                overflowX: 'auto'
              }
            }}>
              {renderTabContent()}
            </Box>

          </Box>
        </Box>
      </Box>
    </ProtectedRoute>
  );
};

// Wrapper com Suspense para useSearchParams
export default function SalaProfessorWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>}>
      <SalaProfessor />
    </Suspense>
  );
}