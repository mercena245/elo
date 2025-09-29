"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarMenu from '../../components/SidebarMenu';
import ProtectedRoute from '../../components/ProtectedRoute';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Tab, 
  Tabs, 
  Badge,
  Avatar,
  Chip,
  IconButton,
  Fab,
  Divider,
  Paper,
  Alert
} from '@mui/material';
import { 
  Email,
  LocalPharmacy,
  Psychology,
  Notifications,
  DirectionsBus,
  MenuBook,
  Add,
  Message,
  Warning,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import { db, ref, get, auth } from '../../firebase';

// Componentes das seções
import MensagensSection from './components/MensagensSection';
import AgendaMedicaSection from './components/AgendaMedicaSection';
import ComportamentosSection from './components/ComportamentosSection';
import AvisosEspecificosSection from './components/AvisosEspecificosSection';
import AutorizacoesSection from './components/AutorizacoesSection';
import DiarioSection from './components/DiarioSection';

const Agenda = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [userData, setUserData] = useState(null);
  const [resumoNotificacoes, setResumoNotificacoes] = useState({
    mensagensNaoLidas: 0,
    medicacoesPendentes: 0,
    comportamentosNovos: 0,
    avisosNaoLidos: 0,
    autorizacoesPendentes: 0,
    diariosPendentes: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const userId = auth.currentUser ? auth.currentUser.uid : null;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      try {
        const userRef = ref(db, `usuarios/${userId}`);
        const userSnap = await get(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.val();
          setUserData(data);
          setUserRole(data.role?.toLowerCase() || '');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const tabsConfig = [
    {
      label: 'Mensagens',
      icon: <Email />,
      badge: resumoNotificacoes.mensagensNaoLidas,
      color: '#3B82F6',
      roles: ['coordenadora', 'professora', 'pai']
    },
    {
      label: 'Medicação',
      icon: <LocalPharmacy />,
      badge: resumoNotificacoes.medicacoesPendentes,
      color: '#10B981',
      roles: ['coordenadora', 'professora', 'pai']
    },
    {
      label: 'Comportamentos',
      icon: <Psychology />,
      badge: resumoNotificacoes.comportamentosNovos,
      color: '#8B5CF6',
      roles: ['coordenadora', 'professora', 'pai']
    },
    {
      label: 'Avisos',
      icon: <Notifications />,
      badge: resumoNotificacoes.avisosNaoLidos,
      color: '#F59E0B',
      roles: ['coordenadora', 'professora', 'pai']
    },
    {
      label: 'Autorizações',
      icon: <DirectionsBus />,
      badge: resumoNotificacoes.autorizacoesPendentes,
      color: '#EF4444',
      roles: ['coordenadora', 'professora', 'pai']
    },
    {
      label: 'Diário',
      icon: <MenuBook />,
      badge: resumoNotificacoes.diariosPendentes,
      color: '#06B6D4',
      roles: ['coordenadora', 'professora', 'pai']
    }
  ];

  const filteredTabs = tabsConfig.filter(tab => 
    tab.roles.includes(userRole)
  );

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ paddingTop: '1rem' }}>
      {value === index && children}
    </div>
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="dashboard-container">
          <SidebarMenu />
          <main className="dashboard-main">
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <Typography>Carregando agenda...</Typography>
            </Box>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="dashboard-container">
        <SidebarMenu />
        <main className="dashboard-main">
          <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                mb: 3, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    📅 Agenda Escolar
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Centro de comunicação escola-família
                  </Typography>
                </Box>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <Schedule sx={{ fontSize: 32 }} />
                </Avatar>
              </Box>
            </Paper>

            {/* Resumo de Notificações */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {filteredTabs.map((tab, index) => (
                <Grid item xs={6} sm={4} md={2} key={index}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      borderLeft: `4px solid ${tab.color}`,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3
                      }
                    }}
                    onClick={() => setActiveTab(index)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Badge badgeContent={tab.badge} color="error" max={99}>
                        <Avatar sx={{ bgcolor: tab.color, mx: 'auto', mb: 1 }}>
                          {tab.icon}
                        </Avatar>
                      </Badge>
                      <Typography variant="body2" fontWeight={600}>
                        {tab.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Abas de Navegação */}
            <Paper sx={{ mb: 3 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    minHeight: 64,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600
                  }
                }}
              >
                {filteredTabs.map((tab, index) => (
                  <Tab 
                    key={index}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Badge badgeContent={tab.badge} color="error" max={9}>
                          {tab.icon}
                        </Badge>
                        {tab.label}
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            </Paper>

            {/* Conteúdo das Abas */}
            <TabPanel value={activeTab} index={0}>
              <MensagensSection userRole={userRole} userData={userData} />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <AgendaMedicaSection userRole={userRole} userData={userData} />
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              <ComportamentosSection userRole={userRole} userData={userData} />
            </TabPanel>
            <TabPanel value={activeTab} index={3}>
              <AvisosEspecificosSection userRole={userRole} userData={userData} />
            </TabPanel>
            <TabPanel value={activeTab} index={4}>
              <AutorizacoesSection userRole={userRole} userData={userData} />
            </TabPanel>
            <TabPanel value={activeTab} index={5}>
              <DiarioSection userRole={userRole} userData={userData} />
            </TabPanel>

            {/* FAB para nova ação */}
            <Fab 
              color="primary" 
              sx={{ 
                position: 'fixed', 
                bottom: 24, 
                right: 24,
                background: 'linear-gradient(45deg, #667eea, #764ba2)'
              }}
              onClick={() => {
                // Ação baseada na aba ativa
                console.log('Nova ação para aba:', filteredTabs[activeTab]?.label);
              }}
            >
              <Add />
            </Fab>
          </Box>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Agenda;