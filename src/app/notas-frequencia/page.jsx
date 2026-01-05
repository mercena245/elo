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
  Tab,
  Alert,
  Paper,
  Avatar
} from '@mui/material';
import { auth, onAuthStateChanged } from '../../firebase';
import { useRouter } from 'next/navigation';
import LancamentoNotas from '../components/notas-frequencia/LancamentoNotas';
import RegistroFaltas from '../components/notas-frequencia/RegistroFaltas';
import ConsultaBoletim from '../components/notas-frequencia/ConsultaBoletim';
import BoletimAluno from '../components/notas-frequencia/BoletimAluno';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';

const NotasFrequencia = () => {

  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const router = useRouter();

  // Listener de autenticação - DEVE rodar imediatamente
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ [Notas] Usuário autenticado:', user.uid);
        setUserId(user.uid);
      } else {
        console.log('❌ [Notas] Nenhum usuário autenticado');
        setUserId(null);
        setUserRole(null);
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Verificar role do usuário
  useEffect(() => {
    async function fetchRole() {
      console.log('🔍 [Notas] Verificando role - userId:', userId, 'isReady:', isReady);
      
      if (!userId) {
        console.log('⚠️ [Notas] Sem userId - marcando roleChecked como true');
        setUserRole(null);
        setRoleChecked(true);
        setLoading(false);
        return;
      }

      if (!isReady) {
        console.log('⏳ [Notas] Aguardando conexão com banco da escola...');
        return;
      }
      
      try {
        console.log('📡 [Notas] Buscando dados do usuário:', `usuarios/${userId}`);
        const userData = await getData(`usuarios/${userId}`);
        console.log('📦 [Notas] Dados recebidos:', userData);
        
        if (userData) {
          // ✅ Não converter para lowercase - manter o valor original
          setUserRole(userData.role || '');
          console.log('✅ [Notas] Role carregada:', userData.role);
        } else {
          console.log('⚠️ [Notas] Nenhum dado encontrado para o usuário');
          setUserRole(null);
        }
      } catch (error) {
        console.error('❌ [Notas] Erro ao buscar dados do usuário:', error);
        setUserRole(null);
      } finally {
        setRoleChecked(true);
        setLoading(false);
        console.log('✔️ [Notas] roleChecked marcado como true');
      }
    }
    fetchRole();
  }, [userId, isReady, getData]);

  // Definir abas baseadas no papel do usuário
  const getTabsForRole = () => {
    switch(userRole) {
      case 'coordenadora':
        return [
          { label: '📝 Lançamento de Notas', component: <LancamentoNotas /> },
          { label: '📅 Registro de Faltas', component: <RegistroFaltas /> },
          { label: '📊 Consulta de Boletins', component: <ConsultaBoletim /> },
          { label: '📈 Relatórios', disabled: true }
        ];
      case 'professora':
        return [
          { label: '📝 Lançar Notas', component: <LancamentoNotas professorId={userId} /> },
          { label: '📅 Registrar Faltas', component: <RegistroFaltas professorId={userId} /> },
          { label: '📊 Consultar Boletins', component: <ConsultaBoletim professorId={userId} /> }
        ];
      case 'pai':
        return [
          { label: '📊 Boletim do(a) Filho(a)', component: <BoletimAluno responsavelId={userId} /> },
          { label: '📈 Frequência', disabled: true }
        ];
      case 'aluno':
        return [
          { label: '📊 Meu Boletim', component: <BoletimAluno alunoId={userId} /> },
          { label: '📈 Minha Frequência', disabled: true }
        ];
      default:
        return [];
    }
  };

  if (!roleChecked || loading) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Carregando sistema acadêmico...
        </Typography>
      </Box>
    );
  }

  if (!['coordenadora', 'professora', 'pai', 'aluno'].includes(userRole)) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Acesso negado
        </Typography>
        <Typography variant="body1">
          Esta página é restrita para coordenadoras, professoras, pais e alunos.
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

  const tabs = getTabsForRole();

  return (
    <div className="dashboard-container">
      <SidebarMenu />
      <main className="dashboard-main">
        <Box sx={{ maxWidth: 1400, mx: 'auto', mt: 4 }}>
          {/* Cabeçalho Centralizado */}
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 2, sm: 2.5, md: 3 },
              mb: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Padrão decorativo */}
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
              <Avatar sx={{ 
                width: { xs: 60, sm: 70, md: 80 }, 
                height: { xs: 60, sm: 70, md: 80 }, 
                bgcolor: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(10px)',
                border: '3px solid rgba(255,255,255,0.3)',
                boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}>
                📊
              </Avatar>
              
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
                  Notas & Frequência
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
                  Sistema acadêmico integrado - {userRole === 'pai' ? 'Responsável' : userRole === 'professora' ? 'Professora' : userRole}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Alert informativo baseado no papel */}
          {userRole === 'coordenadora' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>Coordenação:</strong> Você tem acesso completo ao sistema acadêmico - 
              lançamento de notas, controle de frequência e consulta de boletins.
            </Alert>
          )}
          {userRole === 'professora' && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <strong>Professora:</strong> Você pode lançar notas e registrar faltas para suas disciplinas e turmas.
            </Alert>
          )}
          {['pai', 'aluno'].includes(userRole) && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>Consulta:</strong> Você pode visualizar notas, frequência e boletins acadêmicos.
            </Alert>
          )}

          {/* Navegação por Abas */}
          <Box sx={{ mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
              variant="scrollable"
              scrollButtons="auto"
            >
              {tabs.map((tab, index) => (
                <Tab 
                  key={index}
                  label={tab.label} 
                  disabled={tab.disabled}
                />
              ))}
            </Tabs>
          </Box>

          {/* Conteúdo das Abas */}
          <Card>
            <CardContent>
              {tabs[tabValue] && !tabs[tabValue].disabled ? (
                tabs[tabValue].component
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    🚧 Em desenvolvimento
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Esta funcionalidade será implementada em breve.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Cards de Estatísticas (apenas para coordenadora) */}
          {userRole === 'coordenadora' && (
            <Grid container spacing={3} sx={{ mt: 3 }}>
              <Grid item xs={12} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold">--</Typography>
                    <Typography variant="body2">Notas Lançadas</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold">--</Typography>
                    <Typography variant="body2">Faltas Registradas</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold">--</Typography>
                    <Typography variant="body2">Boletins Gerados</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold">--%</Typography>
                    <Typography variant="body2">Frequência Média</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </main>
    </div>
  );
};

export default NotasFrequencia;