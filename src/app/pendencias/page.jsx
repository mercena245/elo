"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import SidebarMenu from '../../components/SidebarMenu';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';

const PendenciasPage = () => {
  const router = useRouter();
  const { userRole } = useAuthUser();
  const { getData, isReady } = useSchoolDatabase();
  
  const [loading, setLoading] = useState(true);
  const [planosPendentes, setPlanosPendentes] = useState([]);
  const [turmas, setTurmas] = useState({});
  const [disciplinas, setDisciplinas] = useState({});
  const [totalPendencias, setTotalPendencias] = useState(0);

  useEffect(() => {
    // Aguardar até que userRole esteja definido
    if (!userRole) return;

    if (userRole !== 'coordenadora' && userRole !== 'coordenador') {
      router.push('/dashboard');
      return;
    }

    if (isReady) {
      carregarPendencias();
    }
  }, [isReady, userRole, router]);

  const carregarPendencias = async () => {
    try {
      setLoading(true);

      const [planosData, turmasData, disciplinasData] = await Promise.all([
        getData('planos-aula'),
        getData('turmas'),
        getData('disciplinas')
      ]);

      setTurmas(turmasData || {});
      setDisciplinas(disciplinasData || {});

      // Filtrar planos pendentes e rejeitados
      if (planosData) {
        const planosList = Object.entries(planosData).map(([id, plano]) => ({
          id,
          ...plano
        }));

        const pendentes = planosList.filter(p => 
          !p.statusAprovacao || 
          p.statusAprovacao === 'pendente' || 
          p.statusAprovacao === 'rejeitado'
        );

        // Agrupar por turma
        const agrupadosPorTurma = pendentes.reduce((grupos, plano) => {
          const turmaId = plano.turmaId;
          if (!grupos[turmaId]) {
            grupos[turmaId] = [];
          }
          grupos[turmaId].push(plano);
          return grupos;
        }, {});

        const planosAgrupados = Object.entries(agrupadosPorTurma).map(([turmaId, planos]) => ({
          turmaId,
          turma: turmasData[turmaId],
          planos: planos.sort((a, b) => new Date(a.data) - new Date(b.data))
        }));

        setPlanosPendentes(planosAgrupados);
        setTotalPendencias(pendentes.length);
      }

    } catch (error) {
      console.error('Erro ao carregar pendências:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente':
        return 'warning';
      case 'rejeitado':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'rejeitado':
        return 'Rejeitado';
      default:
        return 'Aguardando';
    }
  };

  const formatarData = (data) => {
    if (!data) return 'Data não informada';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const irParaPlano = (planoId) => {
    router.push(`/sala-professor?plano=${planoId}`);
  };

  // Aguardar validação de role antes de renderizar
  if (!userRole) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Redirecionar se não for coordenador
  if (userRole !== 'coordenadora' && userRole !== 'coordenador') {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <SidebarMenu />
        <Box sx={{ flexGrow: 1, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F5F7FA' }}>
      <SidebarMenu />
      
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Cabeçalho */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/dashboard')}
            sx={{ mb: 2 }}
          >
            Voltar ao Dashboard
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <WarningIcon sx={{ fontSize: 48, color: '#EF4444' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
                Central de Pendências
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Acompanhe e gerencie todas as pendências da coordenação
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Resumo de Pendências */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              bgcolor: '#FEF3C7', 
              borderLeft: '4px solid #F59E0B',
              boxShadow: 2
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AssignmentIcon sx={{ fontSize: 40, color: '#F59E0B' }} />
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#92400E' }}>
                      {totalPendencias}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Planos de Aula Pendentes
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ 
              bgcolor: '#DBEAFE', 
              borderLeft: '4px solid #3B82F6',
              boxShadow: 2
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SchoolIcon sx={{ fontSize: 40, color: '#3B82F6' }} />
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1E40AF' }}>
                      {planosPendentes.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Turmas com Pendências
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ 
              bgcolor: '#D1FAE5', 
              borderLeft: '4px solid #10B981',
              boxShadow: 2
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#10B981' }} />
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#065F46' }}>
                      0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Outras Pendências
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Lista de Pendências */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon color="primary" />
              Planos de Aula Aguardando Aprovação
            </Typography>

            {totalPendencias === 0 ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="h6">🎉 Parabéns!</Typography>
                <Typography>Não há pendências no momento. Todos os planos de aula foram aprovados.</Typography>
              </Alert>
            ) : (
              planosPendentes.map((grupo) => (
                <Accordion key={grupo.turmaId} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <SchoolIcon color="primary" />
                        <Typography variant="h6">
                          {grupo.turma?.nome || `Turma ${grupo.turmaId}`}
                        </Typography>
                      </Box>
                      <Badge badgeContent={grupo.planos.length} color="error">
                        <Chip 
                          label={`${grupo.planos.length} pendente(s)`} 
                          color="warning" 
                          size="small"
                        />
                      </Badge>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <List>
                      {grupo.planos.map((plano, index) => (
                        <React.Fragment key={plano.id}>
                          {index > 0 && <Divider />}
                          <ListItem
                            sx={{ 
                              py: 2,
                              '&:hover': { 
                                bgcolor: '#f9fafb',
                                cursor: 'pointer'
                              },
                              transition: 'background-color 0.2s'
                            }}
                            onClick={() => irParaPlano(plano.id)}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: plano.statusAprovacao === 'rejeitado' ? '#FEE2E2' : '#FEF3C7',
                                color: plano.statusAprovacao === 'rejeitado' ? '#DC2626' : '#F59E0B'
                              }}>
                                <AssignmentIcon />
                              </Avatar>
                            </ListItemAvatar>
                            
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    {plano.titulo || 'Sem título'}
                                  </Typography>
                                  <Chip 
                                    label={getStatusLabel(plano.statusAprovacao)} 
                                    color={getStatusColor(plano.statusAprovacao)}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    📚 <strong>Disciplina:</strong> {disciplinas[plano.disciplinaId]?.nome || 'Não informada'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    📅 <strong>Data:</strong> {formatarData(plano.data)}
                                    {plano.horaInicio && plano.horaFim && ` • ⏰ ${plano.horaInicio} - ${plano.horaFim}`}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    👤 <strong>Professor(a):</strong> {plano.professorNome || 'Não informado'}
                                  </Typography>
                                  {plano.statusAprovacao === 'rejeitado' && plano.observacoesAprovacao && (
                                    <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                                      <Typography variant="caption">
                                        <strong>Motivo da rejeição:</strong> {plano.observacoesAprovacao}
                                      </Typography>
                                    </Alert>
                                  )}
                                </Box>
                              }
                            />
                            
                            <IconButton edge="end" color="primary">
                              <ChevronRightIcon />
                            </IconButton>
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default PendenciasPage;
