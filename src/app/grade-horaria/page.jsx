"use client";
import React, { useState, useEffect } from 'react';
import SidebarMenu from '../../components/SidebarMenu';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import { db, ref, get, auth } from '../../firebase';
import { useRouter } from 'next/navigation';
import ConfigPeriodosAula from '../components/grade-horaria/ConfigPeriodosAula';
import GradeVisualizador from '../components/grade-horaria/GradeVisualizador';
import RelatoriosGrade from '../components/grade-horaria/RelatoriosGrade';

const GradeHoraria = () => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [roleChecked, setRoleChecked] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const router = useRouter();
  const userId = auth.currentUser ? auth.currentUser.uid : null;

  useEffect(() => {
    async function fetchRole() {
      if (!userId) {
        setUserRole(null);
        setRoleChecked(true);
        return;
      }
      const userRef = ref(db, `usuarios/${userId}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const userData = snap.val();
        setUserRole((userData.role || '').trim().toLowerCase());
      } else {
        setUserRole(null);
      }
      setRoleChecked(true);
    }
    fetchRole();
  }, [userId]);

  if (!roleChecked) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (userRole !== 'coordenadora') {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Acesso negado
        </Typography>
        <Typography variant="body1">
          Esta página é restrita para coordenadoras.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/escola')}
          sx={{ mt: 2 }}
        >
          Voltar
        </Button>
      </Box>
    );
  }

  return (
    <div className="dashboard-container">
      <SidebarMenu />
      <main className="dashboard-main">
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography
              variant="h4"
              color="primary"
              fontWeight={700}
              gutterBottom
            >
              Grade Horária
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => router.push('/escola')}
            >
              ← Voltar para Escola
            </Button>
          </Box>
          
          
          <Box sx={{ mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="⚙️ Configurações" />
              <Tab label="🗓️ Grade Horária" />
              <Tab label="📊 Relatórios" />
            </Tabs>
          </Box>

          {tabValue === 0 && (
            <>
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <ConfigPeriodosAula />
                </CardContent>
              </Card>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        📋 Próximos Passos
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        1. Configure os períodos de aula acima ✅<br />
                        2. Interface de montagem da grade 🚧<br />
                        3. Sistema de validações 🚧<br />
                        4. Relatórios e impressão 🚧
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        🔗 Dados Vinculados
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        A grade utilizará:<br />
                        • Turmas existentes<br />
                        • Disciplinas cadastradas<br />
                        • Professores do sistema<br />
                        • Períodos letivos
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}

          {tabValue === 1 && (
            <Card>
              <CardContent>
                <GradeVisualizador />
              </CardContent>
            </Card>
          )}

          {tabValue === 2 && (
            <Card>
              <CardContent>
                <RelatoriosGrade />
              </CardContent>
            </Card>
          )}
        </Box>
      </main>
    </div>
  );
};

export default GradeHoraria;