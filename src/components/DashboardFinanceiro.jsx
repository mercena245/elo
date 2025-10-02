"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  TrendingDown,
  Warning,
  AttachMoney,
  Schedule,
  Group,
  Assessment,
  MonetizationOn,
  AccountBalance,
  Receipt,
  CreditCard,
  School,
  CalendarToday
} from '@mui/icons-material';
import { financeiroService } from '../services/financeiroService';

const DashboardFinanceiro = ({ userRole }) => {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mensal'); // mensal, anual
  const [dados, setDados] = useState({
    metricas: {},
    receitaPorMes: [],
    inadimplenciaPorTurma: [],
    proximosVencimentos: [],
    titulosVencidos: [],
    fluxoCaixa: {},
    comparativoMensal: []
  });

  useEffect(() => {
    carregarDadosDashboard();
  }, [periodo]);

  const carregarDadosDashboard = async () => {
    setLoading(true);
    try {
      // Carregar métricas gerais
      const metricas = await financeiroService.calcularMetricas();
      
      // Carregar títulos próximos ao vencimento
      const proximosVencimentos = await financeiroService.buscarTitulosProximosVencimento(7);
      
      // Carregar títulos vencidos
      const titulosVencidos = await financeiroService.buscarTitulosVencidos();
      
      // Carregar relatório de inadimplência
      const relatorioInadimplencia = await financeiroService.relatorioInadimplencia();

      setDados({
        metricas: metricas.success ? metricas.metricas : {},
        proximosVencimentos: proximosVencimentos.success ? proximosVencimentos.titulos : [],
        titulosVencidos: titulosVencidos.success ? titulosVencidos.titulos : [],
        inadimplenciaPorTurma: relatorioInadimplencia.success ? relatorioInadimplencia.relatorio : []
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pago': return 'success';
      case 'vencido': return 'error';
      case 'pendente': return 'warning';
      default: return 'default';
    }
  };

  const diasParaVencimento = (vencimento) => {
    const hoje = new Date();
    const dataVenc = new Date(vencimento);
    const diff = Math.ceil((dataVenc - hoje) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Carregando dashboard...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Controles */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          📊 Dashboard Financeiro Detalhado
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={periodo}
            label="Período"
            onChange={(e) => setPeriodo(e.target.value)}
          >
            <MenuItem value="mensal">Mensal</MenuItem>
            <MenuItem value="anual">Anual</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Métricas Principais */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {dados.metricas.titulosVencidos || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Títulos Vencidos
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <Warning />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {dados.metricas.titulosPendentes || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Títulos Pendentes
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <Schedule />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Resumo Rápido */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📈 Resumo Rápido
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Taxa de Adimplência</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(100 - (dados.metricas.taxaInadimplencia || 0)).toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={100 - (dados.metricas.taxaInadimplencia || 0)}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              {userRole === 'coordenadora' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Valor Total Pendente
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {formatCurrency(dados.metricas.valorTotalPendente)}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Alunos Ativos
                </Typography>
                <Typography variant="h6" color="success.main">
                  {dados.metricas.alunosAtivos || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Próximos Vencimentos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="warning.main">
                ⏰ Próximos Vencimentos (7 dias)
              </Typography>
              
              {dados.proximosVencimentos.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  Nenhum título vencendo nos próximos 7 dias
                </Typography>
              ) : (
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Aluno</TableCell>
                        <TableCell>Valor</TableCell>
                        <TableCell>Vencimento</TableCell>
                        <TableCell>Dias</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dados.proximosVencimentos.slice(0, 5).map((titulo) => (
                        <TableRow key={titulo.id}>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {titulo.alunoNome || 'Aluno não encontrado'}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatCurrency(titulo.valor)}</TableCell>
                          <TableCell>{formatDate(titulo.vencimento)}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${diasParaVencimento(titulo.vencimento)}d`}
                              color="warning"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {dados.proximosVencimentos.length > 5 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  +{dados.proximosVencimentos.length - 5} títulos adicionais
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Títulos Vencidos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error.main">
                🚨 Títulos Vencidos
              </Typography>
              
              {dados.titulosVencidos.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  Nenhum título vencido! 🎉
                </Typography>
              ) : (
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Aluno</TableCell>
                        <TableCell>Valor</TableCell>
                        <TableCell>Vencimento</TableCell>
                        <TableCell>Atraso</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dados.titulosVencidos.slice(0, 5).map((titulo) => (
                        <TableRow key={titulo.id}>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {titulo.alunoNome || 'Aluno não encontrado'}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatCurrency(titulo.valor)}</TableCell>
                          <TableCell>{formatDate(titulo.vencimento)}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${Math.abs(diasParaVencimento(titulo.vencimento))}d`}
                              color="error"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {dados.titulosVencidos.length > 5 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  +{dados.titulosVencidos.length - 5} títulos adicionais
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Relatório de Inadimplência */}
        {userRole === 'coordenadora' && dados.inadimplenciaPorTurma.length > 0 && (
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">
                  📊 Relatório de Inadimplência ({dados.inadimplenciaPorTurma.length} alunos)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Aluno</TableCell>
                        <TableCell align="center">Títulos Vencidos</TableCell>
                        <TableCell align="right">Valor Total</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dados.inadimplenciaPorTurma.slice(0, 10).map((item) => (
                        <TableRow key={item.alunoId}>
                          <TableCell>
                            <Typography variant="body2">
                              Aluno ID: {item.alunoId}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={item.quantidadeTitulos}
                              color="warning"
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="error.main">
                              {formatCurrency(item.valorTotal)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label="Inadimplente"
                              color="error"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {dados.inadimplenciaPorTurma.length > 10 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                    Mostrando 10 de {dados.inadimplenciaPorTurma.length} alunos inadimplentes
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}

        {/* Ações Rápidas */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Ações Recomendadas
              </Typography>
              
              <List dense>
                {dados.titulosVencidos.length > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${dados.titulosVencidos.length} títulos vencidos precisam de atenção`}
                      secondary="Considere entrar em contato com os responsáveis"
                    />
                  </ListItem>
                )}
                
                {dados.proximosVencimentos.length > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <Schedule color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${dados.proximosVencimentos.length} títulos vencem nos próximos 7 dias`}
                      secondary="Envie lembretes preventivos"
                    />
                  </ListItem>
                )}
                
                {dados.metricas.taxaInadimplencia > 10 && (
                  <ListItem>
                    <ListItemIcon>
                      <TrendingDown color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Taxa de inadimplência alta: ${dados.metricas.taxaInadimplencia.toFixed(1)}%`}
                      secondary="Revise políticas de cobrança e prazos"
                    />
                  </ListItem>
                )}
                
                {(dados.titulosVencidos.length === 0 && dados.metricas.taxaInadimplencia < 5) && (
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Situação financeira excelente!"
                      secondary="Continue com as práticas atuais de gestão"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardFinanceiro;