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
      <div className="dashboard-container">
        <SidebarMenu />
        <main className="dashboard-main">
          <Box sx={{ maxWidth: 1400, mx: 'auto', mt: 2, p: 3 }}>
            
            {/* Header da Sala do Professor */}
            <Box sx={{ 
              mb: 4, 
              p: 4, 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', 
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decoração de fundo */}
              <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                opacity: 0.1,
                fontSize: '120px'
              }}>
                👩‍🏫
              </Box>
              
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  👩‍🏫 Sala do Professor
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                  Bem-vinda, {user?.displayName || user?.email || 'Professor'}!
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  Aqui você pode gerenciar seus planejamentos de aula, relatórios pedagógicos e 
                  acompanhar o desenvolvimento dos seus alunos.
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Chip 
                    label={role === 'professor' ? '👩‍🏫 Professor' : '👑 Coordenador'} 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 'bold'
                    }} 
                  />
                </Box>
              </Box>
            </Box>

            {/* Navegação por Abas */}
            <Paper sx={{ mb: 3, borderRadius: 2 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="Funcionalidades da Sala do Professor"
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                    py: 2
                  }
                }}
              >
                <Tab 
                  icon="📚" 
                  label="Planejamento de Aulas" 
                  sx={{ flexDirection: 'row', gap: 1 }}
                />
                <Tab 
                  icon="📊" 
                  label="Relatórios Pedagógicos" 
                  sx={{ flexDirection: 'row', gap: 1 }}
                />
                <Tab 
                  icon="📅" 
                  label="Cronograma Acadêmico" 
                  sx={{ flexDirection: 'row', gap: 1 }}
                />
                <Tab 
                  icon="📖" 
                  label="Biblioteca de Materiais" 
                  sx={{ flexDirection: 'row', gap: 1 }}
                />
              </Tabs>
            </Paper>

            {/* Conteúdo da Aba Selecionada */}
            <Box sx={{ mt: 3 }}>
              {renderTabContent()}
            </Box>

          </Box>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default SalaProfessor;