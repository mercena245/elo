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
import { auth, onAuthStateChanged } from '../../firebase';
import { useRouter } from 'next/navigation';
import ConfigPeriodosAula from '../components/grade-horaria/ConfigPeriodosAula';
import GradeVisualizador from '../components/grade-horaria/GradeVisualizador';
import RelatoriosGrade from '../components/grade-horaria/RelatoriosGrade';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';

const GradeHoraria = () => {

  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [roleChecked, setRoleChecked] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const router = useRouter();

  // Listener de autenticação - DEVE rodar imediatamente
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ [Grade] Usuário autenticado:', user.uid);
        setUserId(user.uid);
      } else {
        console.log('❌ [Grade] Nenhum usuário autenticado');
        setUserId(null);
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Verificar role do usuário
  useEffect(() => {
    async function fetchRole() {
      console.log('🔍 [Grade] Verificando role - userId:', userId, 'isReady:', isReady);
      
      if (!userId) {
        console.log('⚠️ [Grade] Sem userId - marcando roleChecked como true');
        setUserRole(null);
        setRoleChecked(true);
        return;
      }

      if (!isReady) {
        console.log('⏳ [Grade] Aguardando conexão com banco da escola...');
        return;
      }

      try {
        console.log('📡 [Grade] Buscando dados do usuário:', `usuarios/${userId}`);
        const userData = await getData(`usuarios/${userId}`);
        console.log('📦 [Grade] Dados recebidos:', userData);
        
        if (userData) {
          // ✅ Não converter para lowercase - manter o valor original
          setUserRole(userData.role || '');
          console.log('✅ [Grade] Role carregada:', userData.role);
        } else {
          console.log('⚠️ [Grade] Nenhum dado encontrado para o usuário');
          setUserRole(null);
        }
      } catch (error) {
        console.error('❌ [Grade] Erro ao buscar dados do usuário:', error);
        setUserRole(null);
      } finally {
        setRoleChecked(true);
        console.log('✔️ [Grade] roleChecked marcado como true');
      }
    }
    fetchRole();
  }, [userId, isReady, getData]);

  if (!roleChecked) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Verificar se é coordenadora ou coordenador
  if (!userRole || (userRole !== 'coordenadora' && userRole !== 'coordenador')) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Acesso negado
        </Typography>
        <Typography variant="body1">
          Esta página é restrita para coordenadoras/coordenadores.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Role detectada: "{userRole || 'não definida'}"
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