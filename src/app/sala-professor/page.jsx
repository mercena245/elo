"use client";

import React, { useState } from 'react';
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

const SalaProfessor = () => {
  const { user, role } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderTabContent = () => {
    switch (tabValue) {
      case 0:
        return <PlanejamentoAulas />;
      case 1:
        return <RelatoriosPedagogicos />;
      case 2:
        return <CronogramaAcademico />;
      case 3:
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
            
            {/* Header da Sala do Professor */}
            <Box sx={{ 
              mb: { xs: 2, md: 4 }, 
              p: { xs: 2, sm: 3, md: 4 }, 
              borderRadius: { xs: 2, md: 3 }, 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', 
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decoração de fundo */}
              <Box sx={{
                position: 'absolute',
                top: { xs: -10, md: -20 },
                right: { xs: -10, md: -20 },
                opacity: 0.1,
                fontSize: { xs: '60px', sm: '80px', md: '120px' }
              }}>
                👩‍🏫
              </Box>
              
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                  }}
                >
                  👩‍🏫 Sala do Professor
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    opacity: 0.9, 
                    mb: { xs: 1, md: 2 },
                    fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                  }}
                >
                  Bem-vinda, {user?.displayName || user?.email || 'Professor'}!
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    opacity: 0.8,
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  Aqui você pode gerenciar seus planejamentos de aula, relatórios pedagógicos e 
                  acompanhar o desenvolvimento dos seus alunos.
                </Typography>
                
                <Box sx={{ 
                  mt: { xs: 1, md: 2 }, 
                  display: 'flex', 
                  gap: 1,
                  flexWrap: 'wrap'
                }}>
                  <Chip 
                    label={role === 'professor' ? '👩‍🏫 Professor' : '👑 Coordenador'} 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: { xs: '0.75rem', md: '0.875rem' }
                    }} 
                  />
                </Box>
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
                    minWidth: { xs: 120, md: 160 },
                    '& .MuiTab-iconWrapper': {
                      fontSize: { xs: '1rem', md: '1.25rem' }
                    }
                  },
                  '& .MuiTabs-scrollButtons': {
                    display: { xs: 'flex', md: 'none' }
                  }
                }}
              >
                <Tab 
                  icon="📚" 
                  label="Planejamento de Aulas" 
                  sx={{ 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    gap: { xs: 0.5, sm: 1 },
                    minHeight: { xs: 64, md: 72 }
                  }}
                />
                <Tab 
                  icon="📊" 
                  label="Relatórios Pedagógicos" 
                  sx={{ 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    gap: { xs: 0.5, sm: 1 },
                    minHeight: { xs: 64, md: 72 }
                  }}
                />
                <Tab 
                  icon="📅" 
                  label="Cronograma Acadêmico" 
                  sx={{ 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    gap: { xs: 0.5, sm: 1 },
                    minHeight: { xs: 64, md: 72 }
                  }}
                />
                <Tab 
                  icon="📖" 
                  label="Biblioteca de Materiais" 
                  sx={{ 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    gap: { xs: 0.5, sm: 1 },
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

export default SalaProfessor;