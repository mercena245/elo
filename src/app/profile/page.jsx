"use client";
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Avatar, 
  Button, 
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Badge,
  Divider,
  Paper,
  LinearProgress
} from '@mui/material';
import { 
  Settings,
  Edit,
  School,
  Group,
  Assignment,
  Notifications,
  Security,
  Dashboard,
  Person,
  Class,
  SupervisorAccount,
  AdminPanelSettings,
  Psychology,
  CalendarMonth,
  TrendingUp,
  Message,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import SidebarMenu from '../../components/SidebarMenu';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuthUser } from '../../hooks/useAuthUser';
import { auth, db, ref, get, set } from '../../firebase';

const ProfilePage = () => {
  const user = useAuthUser();
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Buscar role do usuário
      const roleRef = ref(db, `usuarios/${user.uid}/role`);
      const roleSnap = await get(roleRef);
      const role = roleSnap.val() || 'responsavel';
      setUserRole(role);

      // Buscar dados do perfil
      const profileRef = ref(db, `usuarios/${user.uid}`);
      const profileSnap = await get(profileRef);
      const profileData = profileSnap.val() || {};
      
      setUserProfile({
        displayName: user.displayName || profileData.displayName || '',
        email: user.email || '',
        phone: profileData.phone || '',
        role: role,
        school: profileData.school || 'Escola ELO',
        department: profileData.department || '',
        subjects: profileData.subjects || [],
        classes: profileData.classes || [],
        photoURL: user.photoURL || profileData.photoURL || ''
      });

      // Carregar estatísticas baseadas no role
      await loadRoleStats(role);

    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoleStats = async (role) => {
    try {
      let statsData = {};
      
      switch (role) {
        case 'admin':
          // Admin vê estatísticas gerais
          const [alunosSnap, profSnap, turmasSnap] = await Promise.all([
            get(ref(db, 'alunos')),
            get(ref(db, 'colaboradores')),
            get(ref(db, 'turmas'))
          ]);
          
          statsData = {
            totalAlunos: alunosSnap.exists() ? Object.keys(alunosSnap.val()).length : 0,
            totalProfessores: profSnap.exists() ? Object.keys(profSnap.val()).length : 0,
            totalTurmas: turmasSnap.exists() ? Object.keys(turmasSnap.val()).length : 0,
            pendencias: 12
          };
          break;
          
        case 'professor':
          // Professor vê suas turmas e alunos
          statsData = {
            minhasTurmas: userProfile.classes?.length || 3,
            meusAlunos: 87,
            notasLancadas: 156,
            avaliacoesPendentes: 8
          };
          break;
          
        case 'coordenador':
          // Coordenador vê supervisionamento
          statsData = {
            professoresSupervisionados: 15,
            turmasSupervisionadas: 8,
            relatoriosPendentes: 5,
            reunioesAgendadas: 3
          };
          break;
          
        case 'responsavel':
        default:
          // Responsável vê dados dos filhos
          statsData = {
            filhosMatriculados: 2,
            comunicadosNaoLidos: 4,
            eventosProximos: 2,
            boletos: 1
          };
          break;
      }
      
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleEditProfile = () => {
    setEditForm(userProfile);
    setEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      const profileRef = ref(db, `usuarios/${user.uid}`);
      await set(profileRef, {
        ...editForm,
        updatedAt: new Date().toISOString()
      });
      
      setUserProfile(editForm);
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  };

  const getRoleInfo = (role) => {
    const roles = {
      admin: {
        label: 'Administrador',
        color: '#e91e63',
        icon: <AdminPanelSettings />,
        description: 'Acesso completo ao sistema'
      },
      professor: {
        label: 'Professor',
        color: '#2196f3',
        icon: <School />,
        description: 'Gestão de turmas e avaliações'
      },
      coordenador: {
        label: 'Coordenador',
        color: '#ff9800',
        icon: <SupervisorAccount />,
        description: 'Supervisão pedagógica'
      },
      responsavel: {
        label: 'Responsável',
        color: '#4caf50',
        icon: <Person />,
        description: 'Acompanhamento escolar'
      }
    };
    return roles[role] || roles.responsavel;
  };

  const renderRoleSpecificCards = () => {
    switch (userRole) {
      case 'admin':
        return (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                height: '100%'
              }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.totalAlunos || 0}
                      </Typography>
                      <Typography variant="body2">Total de Alunos</Typography>
                    </Box>
                    <Group sx={{ fontSize: 40, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                height: '100%'
              }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.totalProfessores || 0}
                      </Typography>
                      <Typography variant="body2">Professores</Typography>
                    </Box>
                    <School sx={{ fontSize: 40, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                height: '100%'
              }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.totalTurmas || 0}
                      </Typography>
                      <Typography variant="body2">Turmas Ativas</Typography>
                    </Box>
                    <Class sx={{ fontSize: 40, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                height: '100%'
              }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.pendencias || 0}
                      </Typography>
                      <Typography variant="body2">Pendências</Typography>
                    </Box>
                    <Assignment sx={{ fontSize: 40, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        );
        
      case 'professor':
        return (
          <>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%', border: '1px solid #e3f2fd' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Class sx={{ color: '#2196f3', mr: 1 }} />
                    <Typography variant="h6">Minhas Turmas</Typography>
                  </Box>
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    {stats.minhasTurmas || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Turmas sob sua responsabilidade
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%', border: '1px solid #e8f5e8' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <TrendingUp sx={{ color: '#4caf50', mr: 1 }} />
                    <Typography variant="h6">Notas Lançadas</Typography>
                  </Box>
                  <Typography variant="h3" color="success.main" fontWeight="bold">
                    {stats.notasLancadas || 0}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={75} 
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </>
        );
        
      case 'coordenador':
        return (
          <>
            <Grid item xs={12} sm={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.professoresSupervisionados || 0}
                  </Typography>
                  <Typography variant="body2">Professores</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.relatoriosPendentes || 0}
                  </Typography>
                  <Typography variant="body2">Relatórios</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #00bcd4 0%, #009688 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.reunioesAgendadas || 0}
                  </Typography>
                  <Typography variant="body2">Reuniões</Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        );
        
      case 'responsavel':
      default:
        return (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.filhosMatriculados || 0}
                  </Typography>
                  <Typography variant="body2">Filhos Matriculados</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #ff5722 0%, #ff9800 100%)', color: 'white' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.comunicadosNaoLidos || 0}
                      </Typography>
                      <Typography variant="body2">Não Lidos</Typography>
                    </Box>
                    <Badge badgeContent={stats.comunicadosNaoLidos} color="error">
                      <Message sx={{ fontSize: 30 }} />
                    </Badge>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.eventosProximos || 0}
                  </Typography>
                  <Typography variant="body2">Próximos Eventos</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.boletos || 0}
                  </Typography>
                  <Typography variant="body2">Boletos Pendentes</Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        );
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Box display="flex">
          <SidebarMenu />
          <Box flexGrow={1} display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
            <Typography>Carregando perfil...</Typography>
          </Box>
        </Box>
      </ProtectedRoute>
    );
  }

  const roleInfo = getRoleInfo(userRole);

  return (
    <ProtectedRoute>
      <Box display="flex" minHeight="100vh" bgcolor="#f5f5f5">
        <SidebarMenu />
        
        <Box flexGrow={1} sx={{ p: { xs: 2, md: 4 } }}>
          {/* Header do Perfil */}
          <Paper sx={{ 
            p: 4, 
            mb: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 4
          }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={3}>
                <Avatar 
                  src={userProfile.photoURL} 
                  sx={{ width: 100, height: 100, border: '4px solid white' }}
                />
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {userProfile.displayName || 'Usuário'}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {roleInfo.icon}
                    <Chip 
                      label={roleInfo.label}
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    {roleInfo.description}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {userProfile.school}
                  </Typography>
                </Box>
              </Box>
              
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={handleEditProfile}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                Editar Perfil
              </Button>
            </Box>
          </Paper>

          {/* Estatísticas por Role */}
          <Grid container spacing={3} mb={4}>
            {renderRoleSpecificCards()}
          </Grid>

          {/* Ações Rápidas */}
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
              🚀 Ações Rápidas
            </Typography>
            <Grid container spacing={2}>
              {userRole === 'admin' && (
                <>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Dashboard />}
                      sx={{ py: 2 }}
                    >
                      Painel Administrativo
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Group />}
                      sx={{ py: 2 }}
                    >
                      Gerenciar Usuários
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Assignment />}
                      sx={{ py: 2 }}
                    >
                      Relatórios Gerais
                    </Button>
                  </Grid>
                </>
              )}
              
              {userRole === 'professor' && (
                <>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Class />}
                      sx={{ py: 2 }}
                    >
                      Minhas Turmas
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Assignment />}
                      sx={{ py: 2 }}
                    >
                      Lançar Notas
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CalendarMonth />}
                      sx={{ py: 2 }}
                    >
                      Grade de Horários
                    </Button>
                  </Grid>
                </>
              )}
              
              {userRole === 'responsavel' && (
                <>
                  <Grid item xs={12} sm={6} md={4}>
                    <Badge badgeContent={stats.comunicadosNaoLidos} color="error">
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Message />}
                        sx={{ py: 2 }}
                      >
                        Comunicados
                      </Button>
                    </Badge>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<TrendingUp />}
                      sx={{ py: 2 }}
                    >
                      Boletim dos Filhos
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CalendarMonth />}
                      sx={{ py: 2 }}
                    >
                      Calendário Escolar
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>

          {/* Dialog de Edição */}
          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nome Completo"
                    value={editForm.displayName || ''}
                    onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefone"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={editForm.email || ''}
                    disabled
                    helperText="O email não pode ser alterado"
                  />
                </Grid>
                {userRole !== 'responsavel' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Departamento"
                      value={editForm.department || ''}
                      onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                    />
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button variant="contained" onClick={handleSaveProfile}>Salvar</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </ProtectedRoute>
  );
};

export default ProfilePage;