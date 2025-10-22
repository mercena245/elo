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
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon,
  AttachMoney as AttachMoneyIcon,
  Person as PersonIcon
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
  const [relatoriosPendentes, setRelatoriosPendentes] = useState([]);
  const [titulosEmAnalise, setTitulosEmAnalise] = useState([]);
  const [turmas, setTurmas] = useState({});
  const [disciplinas, setDisciplinas] = useState({});
  const [alunos, setAlunos] = useState({});
  const [totalPendencias, setTotalPendencias] = useState(0);
  const [totalRelatorios, setTotalRelatorios] = useState(0);
  const [totalTitulos, setTotalTitulos] = useState(0);

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

      const [planosData, relatoriosData, titulosData, turmasData, disciplinasData, alunosData] = await Promise.all([
        getData('planos-aula'),
        getData('relatorios-pedagogicos'),
        getData('titulos_financeiros'),
        getData('turmas'),
        getData('disciplinas'),
        getData('alunos')
      ]);

      setTurmas(turmasData || {});
      setDisciplinas(disciplinasData || {});
      setAlunos(alunosData || {});

      // Filtrar planos pendentes e rejeitados
      if (planosData) {
        const planosList = Object.entries(planosData).map(([id, plano]) => ({
          id,
          ...plano
        }));

        const pendentes = planosList.filter(p => 
          !p.statusAprovacao || 
          p.statusAprovacao === 'pendente' || 
          p.statusAprovacao === 'rejeitado' ||
          p.statusAprovacao === 'em_revisao'
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

      // Processar relatórios pedagógicos pendentes
      if (relatoriosData) {
        const relatoriosList = Object.entries(relatoriosData).map(([id, relatorio]) => ({
          id,
          ...relatorio
        }));

        const relatoriosPendentes = relatoriosList.filter(r => 
          r.statusAprovacao === 'pendente'
        );

        // Agrupar por turma
        const relatóriosAgrupados = relatoriosPendentes.reduce((grupos, relatorio) => {
          const turmaId = relatorio.turmaId;
          if (!grupos[turmaId]) {
            grupos[turmaId] = [];
          }
          grupos[turmaId].push(relatorio);
          return grupos;
        }, {});

        const relatoriosAgrupados = Object.entries(relatóriosAgrupados).map(([turmaId, relatorios]) => ({
          turmaId,
          turma: turmasData[turmaId],
          relatorios: relatorios.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
        }));

        setRelatoriosPendentes(relatoriosAgrupados);
        setTotalRelatorios(relatoriosPendentes.length);
      }

      // Processar títulos em análise
      if (titulosData) {
        console.log('🔍 [Pendências] Dados de títulos:', titulosData);
        const titulosList = Object.entries(titulosData).map(([id, titulo]) => ({
          id,
          ...titulo
        }));
        console.log('📋 [Pendências] Lista de títulos:', titulosList);
        console.log('🔎 [Pendências] Status dos títulos:', titulosList.map(t => ({ id: t.id, status: t.status, alunoId: t.alunoId })));

        const titulosAnalise = titulosList.filter(t => 
          t.status === 'em_analise'
        );
        console.log('⚠️ [Pendências] Títulos em análise encontrados:', titulosAnalise.length);
        console.log('📊 [Pendências] Títulos filtrados:', titulosAnalise);

        // Agrupar por aluno
        const titulosAgrupados = titulosAnalise.reduce((grupos, titulo) => {
          const alunoId = titulo.alunoId;
          if (!grupos[alunoId]) {
            grupos[alunoId] = [];
          }
          grupos[alunoId].push(titulo);
          return grupos;
        }, {});

        const titulosAgrupadosList = Object.entries(titulosAgrupados).map(([alunoId, titulos]) => ({
          alunoId,
          aluno: alunosData[alunoId],
          titulos: titulos.sort((a, b) => new Date(b.dataPagamento) - new Date(a.dataPagamento))
        }));

        setTitulosEmAnalise(titulosAgrupadosList);
        setTotalTitulos(titulosAnalise.length);
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
          <Grid item xs={12} md={3}>
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
                      Planos de Aula
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ 
              bgcolor: '#E0E7FF', 
              borderLeft: '4px solid #6366F1',
              boxShadow: 2
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DescriptionIcon sx={{ fontSize: 40, color: '#6366F1' }} />
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#312E81' }}>
                      {totalRelatorios}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Relatórios Pedagógicos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ 
              bgcolor: '#DBEAFE', 
              borderLeft: '4px solid #3B82F6',
              boxShadow: 2
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AttachMoneyIcon sx={{ fontSize: 40, color: '#3B82F6' }} />
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1E40AF' }}>
                      {totalTitulos}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pagamentos em Análise
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
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
                      {totalPendencias + totalRelatorios + totalTitulos}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total de Pendências
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

        {/* Relatórios Pedagógicos Pendentes */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon sx={{ color: '#6366F1' }} />
              Relatórios Pedagógicos Aguardando Aprovação
            </Typography>

            {totalRelatorios === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="h6">✅ Tudo certo!</Typography>
                <Typography>Não há relatórios pedagógicos pendentes no momento.</Typography>
              </Alert>
            ) : (
              relatoriosPendentes.map((grupo) => (
                <Accordion key={grupo.turmaId} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <SchoolIcon sx={{ color: '#6366F1' }} />
                        <Typography variant="h6">
                          {grupo.turma?.nome || `Turma ${grupo.turmaId}`}
                        </Typography>
                      </Box>
                      <Badge badgeContent={grupo.relatorios.length} color="error">
                        <Chip 
                          label={`${grupo.relatorios.length} relatório(s)`} 
                          sx={{ bgcolor: '#E0E7FF', color: '#312E81' }}
                          size="small"
                        />
                      </Badge>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <List>
                      {grupo.relatorios.map((relatorio, index) => (
                        <React.Fragment key={relatorio.id}>
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
                            onClick={() => router.push(`/sala-professor?tab=relatorios&relatorio=${relatorio.id}`)}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: '#E0E7FF',
                                color: '#6366F1'
                              }}>
                                <DescriptionIcon />
                              </Avatar>
                            </ListItemAvatar>
                            
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    Relatório Pedagógico
                                  </Typography>
                                  <Chip 
                                    label="Pendente" 
                                    color="warning"
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    👤 <strong>Aluno:</strong> {alunos[relatorio.alunoId]?.nomeCompleto || alunos[relatorio.alunoId]?.nome || 'Não informado'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    🏫 <strong>Turma:</strong> {turmas[relatorio.turmaId]?.nome || 'Não informada'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    📝 <strong>Template:</strong> {relatorio.template || 'Padrão'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    📅 <strong>Criado em:</strong> {formatarData(relatorio.criadoEm)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    👨‍🏫 <strong>Professor(a):</strong> {relatorio.professorNome || 'Não informado'}
                                  </Typography>
                                </Box>
                              }
                            />
                            
                            <IconButton edge="end" sx={{ color: '#6366F1' }}>
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

        {/* Títulos em Análise */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoneyIcon sx={{ color: '#3B82F6' }} />
              Pagamentos Aguardando Confirmação
            </Typography>

            {totalTitulos === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="h6">✅ Tudo certo!</Typography>
                <Typography>Não há pagamentos aguardando confirmação no momento.</Typography>
              </Alert>
            ) : (
              titulosEmAnalise.map((grupo) => (
                <Accordion key={grupo.alunoId} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <PersonIcon sx={{ color: '#3B82F6' }} />
                        <Typography variant="h6">
                          {grupo.aluno?.nomeCompleto || grupo.aluno?.nome || `Aluno ${grupo.alunoId}`}
                        </Typography>
                      </Box>
                      <Badge badgeContent={grupo.titulos.length} color="error">
                        <Chip 
                          label={`${grupo.titulos.length} pagamento(s)`} 
                          sx={{ bgcolor: '#DBEAFE', color: '#1E40AF' }}
                          size="small"
                        />
                      </Badge>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <List>
                      {grupo.titulos.map((titulo, index) => (
                        <React.Fragment key={titulo.id}>
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
                            onClick={() => router.push(`/financeiro?tab=titulos&titulo=${titulo.id}`)}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: '#DBEAFE',
                                color: '#3B82F6'
                              }}>
                                <AttachMoneyIcon />
                              </Avatar>
                            </ListItemAvatar>
                            
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    {titulo.descricao || 'Mensalidade'}
                                  </Typography>
                                  <Chip 
                                    label="Em Análise" 
                                    color="info"
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    💰 <strong>Valor:</strong> R$ {titulo.valor?.toFixed(2) || '0,00'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    📅 <strong>Vencimento:</strong> {formatarData(titulo.dataVencimento)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    💳 <strong>Data do Pagamento:</strong> {formatarData(titulo.dataPagamento)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    📝 <strong>Forma de Pagamento:</strong> {titulo.formaPagamento || 'Não informada'}
                                  </Typography>
                                  {titulo.comprovanteUrl && (
                                    <Typography variant="body2" color="text.secondary">
                                      📎 <strong>Comprovante:</strong> <a href={titulo.comprovanteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6' }}>Visualizar</a>
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            
                            <IconButton edge="end" sx={{ color: '#3B82F6' }}>
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
