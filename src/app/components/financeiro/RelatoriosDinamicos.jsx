import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip,
  FormControl, InputLabel, Select, MenuItem, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, IconButton, Paper, Divider, Alert, List,
  ListItem, ListItemText, ListItemIcon, Checkbox,
  ToggleButton, ToggleButtonGroup, Tooltip
} from '@mui/material';
import {
  Add, Delete, GetApp, Print, Save, Refresh,
  DragIndicator, BarChart, PieChart, ShowChart,
  TableChart, Assessment, DateRange, AttachMoney,
  Category, Business, TrendingUp, FilterList,
  Close, Check
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FeedbackSnackbar from '../../../components/FeedbackSnackbar';

const RelatoriosDinamicos = ({
  contasPagar = [],
  contasReceber = [],
  onExportar
}) => {
  const [modalConstrutor, setModalConstrutor] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Configuração do relatório
  const [config, setConfig] = useState({
    nome: '',
    periodo: {
      tipo: 'mes_atual', // mes_atual, mes_anterior, ano_atual, personalizado
      dataInicio: '',
      dataFim: ''
    },
    fonte: 'ambos', // contas_pagar, contas_receber, ambos
    camposSelecionados: [],
    agruparPor: '',
    ordenarPor: '',
    tipoVisualizacao: 'tabela', // tabela, grafico_barras, grafico_pizza, grafico_linha
    filtros: []
  });

  // Campos disponíveis para seleção
  const camposDisponiveis = [
    { id: 'descricao', label: 'Descrição', icon: <DragIndicator />, tipo: 'texto' },
    { id: 'categoria', label: 'Categoria', icon: <Category />, tipo: 'texto' },
    { id: 'fornecedor', label: 'Fornecedor/Origem', icon: <Business />, tipo: 'texto' },
    { id: 'valor', label: 'Valor', icon: <AttachMoney />, tipo: 'numero' },
    { id: 'vencimento', label: 'Data de Vencimento', icon: <DateRange />, tipo: 'data' },
    { id: 'dataPagamento', label: 'Data de Pagamento', icon: <DateRange />, tipo: 'data' },
    { id: 'status', label: 'Status', icon: <Assessment />, tipo: 'texto' },
    { id: 'formaPagamento', label: 'Forma de Pagamento', icon: <Assessment />, tipo: 'texto' },
    { id: 'numeroNotaFiscal', label: 'Nº Nota Fiscal', icon: <Assessment />, tipo: 'texto' }
  ];

  // Templates de relatórios pré-configurados
  const templates = [
    {
      nome: '📊 Análise por Categoria',
      descricao: 'Agrupa receitas e despesas por categoria',
      config: {
        camposSelecionados: ['categoria', 'valor'],
        agruparPor: 'categoria',
        tipoVisualizacao: 'grafico_barras',
        fonte: 'ambos'
      }
    },
    {
      nome: '📈 Fluxo de Caixa Mensal',
      descricao: 'Compara entradas e saídas mês a mês',
      config: {
        camposSelecionados: ['vencimento', 'valor', 'status'],
        agruparPor: 'mes',
        tipoVisualizacao: 'grafico_linha',
        fonte: 'ambos'
      }
    },
    {
      nome: '💰 DRE Simplificado',
      descricao: 'Demonstração de Resultado do Exercício',
      config: {
        camposSelecionados: ['categoria', 'valor', 'status'],
        agruparPor: 'categoria',
        tipoVisualizacao: 'tabela',
        fonte: 'ambos'
      }
    },
    {
      nome: '🏢 Análise por Fornecedor',
      descricao: 'Despesas agrupadas por fornecedor',
      config: {
        camposSelecionados: ['fornecedor', 'valor', 'categoria'],
        agruparPor: 'fornecedor',
        tipoVisualizacao: 'tabela',
        fonte: 'contas_pagar'
      }
    },
    {
      nome: '⏰ Contas Vencendo',
      descricao: 'Lista de contas a vencer nos próximos 7 dias',
      config: {
        camposSelecionados: ['descricao', 'valor', 'vencimento', 'categoria'],
        ordenarPor: 'vencimento',
        tipoVisualizacao: 'tabela',
        fonte: 'ambos'
      }
    }
  ];

  // Aplicar período
  const getPeriodo = () => {
    const hoje = new Date();
    let dataInicio, dataFim;

    switch (config.periodo.tipo) {
      case 'mes_atual':
        dataInicio = startOfMonth(hoje);
        dataFim = endOfMonth(hoje);
        break;
      case 'mes_anterior':
        const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        dataInicio = startOfMonth(mesAnterior);
        dataFim = endOfMonth(mesAnterior);
        break;
      case 'ano_atual':
        dataInicio = startOfYear(hoje);
        dataFim = endOfYear(hoje);
        break;
      case 'personalizado':
        dataInicio = config.periodo.dataInicio ? new Date(config.periodo.dataInicio) : null;
        dataFim = config.periodo.dataFim ? new Date(config.periodo.dataFim) : null;
        break;
      default:
        dataInicio = null;
        dataFim = null;
    }

    return { dataInicio, dataFim };
  };

  // Filtrar dados
  const dadosFiltrados = useMemo(() => {
    let dados = [];

    // Selecionar fonte
    if (config.fonte === 'contas_pagar' || config.fonte === 'ambos') {
      dados = [...dados, ...contasPagar.map(c => ({ ...c, tipo: 'despesa' }))];
    }
    if (config.fonte === 'contas_receber' || config.fonte === 'ambos') {
      dados = [...dados, ...contasReceber.map(c => ({ ...c, tipo: 'receita' }))];
    }

    // Filtrar por período
    const { dataInicio, dataFim } = getPeriodo();
    if (dataInicio && dataFim) {
      dados = dados.filter(item => {
        const data = new Date(item.vencimento);
        return data >= dataInicio && data <= dataFim;
      });
    }

    return dados;
  }, [config, contasPagar, contasReceber]);

  // Gerar dados agrupados
  const dadosAgrupados = useMemo(() => {
    if (!config.agruparPor) return dadosFiltrados;

    const grupos = {};

    dadosFiltrados.forEach(item => {
      let chave;
      
      if (config.agruparPor === 'mes') {
        chave = format(new Date(item.vencimento), 'MM/yyyy', { locale: ptBR });
      } else {
        chave = item[config.agruparPor] || 'Não especificado';
      }

      if (!grupos[chave]) {
        grupos[chave] = {
          grupo: chave,
          items: [],
          totalReceitas: 0,
          totalDespesas: 0,
          quantidade: 0
        };
      }

      grupos[chave].items.push(item);
      grupos[chave].quantidade++;

      if (item.tipo === 'receita') {
        grupos[chave].totalReceitas += item.valor || 0;
      } else {
        grupos[chave].totalDespesas += item.valor || 0;
      }
    });

    return Object.values(grupos);
  }, [dadosFiltrados, config.agruparPor]);

  // Calcular totais
  const totais = useMemo(() => {
    const receitas = dadosFiltrados.filter(d => d.tipo === 'receita');
    const despesas = dadosFiltrados.filter(d => d.tipo === 'despesa');
    
    const totalReceitas = receitas.reduce((sum, r) => sum + (r.valor || 0), 0);
    const totalDespesas = despesas.reduce((sum, d) => sum + (d.valor || 0), 0);
    const saldoLiquido = totalReceitas - totalDespesas;

    const receitasPagas = receitas.filter(r => r.status === 'pago').reduce((sum, r) => sum + (r.valor || 0), 0);
    const despesasPagas = despesas.filter(d => d.status === 'pago').reduce((sum, d) => sum + (d.valor || 0), 0);

    return {
      totalReceitas,
      totalDespesas,
      saldoLiquido,
      receitasPagas,
      despesasPagas,
      receitasPendentes: totalReceitas - receitasPagas,
      despesasPendentes: totalDespesas - despesasPagas
    };
  }, [dadosFiltrados]);

  // Formatar moeda
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  // Aplicar template
  const aplicarTemplate = (template) => {
    setConfig({
      ...config,
      ...template.config,
      nome: template.nome
    });
    mostrarSnackbar(`Template "${template.nome}" aplicado!`, 'success');
  };

  // Toggle campo selecionado
  const toggleCampo = (campoId) => {
    const jaExiste = config.camposSelecionados.includes(campoId);
    
    if (jaExiste) {
      setConfig({
        ...config,
        camposSelecionados: config.camposSelecionados.filter(c => c !== campoId)
      });
    } else {
      setConfig({
        ...config,
        camposSelecionados: [...config.camposSelecionados, campoId]
      });
    }
  };

  // Mostrar snackbar
  const mostrarSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Fechar snackbar
  const fecharSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Gerar relatório
  const gerarRelatorio = () => {
    if (config.camposSelecionados.length === 0) {
      mostrarSnackbar('Selecione pelo menos um campo para o relatório', 'error');
      return;
    }

    mostrarSnackbar('Relatório gerado com sucesso!', 'success');
    setModalConstrutor(false);
  };

  // Exportar relatório
  const exportarRelatorio = (formato) => {
    if (onExportar) {
      onExportar(dadosFiltrados, formato, config);
    }
    mostrarSnackbar(`Relatório exportado em formato ${formato.toUpperCase()}`, 'success');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          📊 Relatórios Dinâmicos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setModalConstrutor(true)}
        >
          Novo Relatório
        </Button>
      </Stack>

      {/* Templates */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚡ Templates Rápidos
          </Typography>
          <Grid container spacing={2}>
            {templates.map((template, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: '2px solid transparent',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => aplicarTemplate(template)}
                >
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {template.nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {template.descricao}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                💰 Total Receitas
              </Typography>
              <Typography variant="h4">
                {formatarMoeda(totais.totalReceitas)}
              </Typography>
              <Typography variant="caption">
                Pagas: {formatarMoeda(totais.receitasPagas)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                💸 Total Despesas
              </Typography>
              <Typography variant="h4">
                {formatarMoeda(totais.totalDespesas)}
              </Typography>
              <Typography variant="caption">
                Pagas: {formatarMoeda(totais.despesasPagas)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: totais.saldoLiquido >= 0 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                📊 Saldo Líquido
              </Typography>
              <Typography variant="h4">
                {formatarMoeda(totais.saldoLiquido)}
              </Typography>
              <Typography variant="caption">
                {totais.saldoLiquido >= 0 ? '✅ Positivo' : '⚠️ Negativo'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dados Agrupados */}
      {config.agruparPor && dadosAgrupados.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Análise por {config.agruparPor === 'mes' ? 'Mês' : camposDisponiveis.find(c => c.id === config.agruparPor)?.label}
            </Typography>
            <List>
              {dadosAgrupados.map((grupo, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body1" fontWeight="medium">
                          {grupo.grupo}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          {grupo.totalReceitas > 0 && (
                            <Chip
                              label={`↗️ ${formatarMoeda(grupo.totalReceitas)}`}
                              color="success"
                              size="small"
                            />
                          )}
                          {grupo.totalDespesas > 0 && (
                            <Chip
                              label={`↘️ ${formatarMoeda(grupo.totalDespesas)}`}
                              color="error"
                              size="small"
                            />
                          )}
                        </Stack>
                      </Stack>
                    }
                    secondary={`${grupo.quantidade} transação(ões)`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Modal Construtor de Relatórios */}
      <Dialog
        open={modalConstrutor}
        onClose={() => setModalConstrutor(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">🔧 Construtor de Relatórios</Typography>
            <IconButton onClick={() => setModalConstrutor(false)} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Relatório"
                value={config.nome}
                onChange={(e) => setConfig({ ...config, nome: e.target.value })}
                placeholder="Ex: Despesas de Janeiro 2025"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Período</InputLabel>
                <Select
                  value={config.periodo.tipo}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    periodo: { ...config.periodo, tipo: e.target.value } 
                  })}
                  label="Período"
                >
                  <MenuItem value="mes_atual">Mês Atual</MenuItem>
                  <MenuItem value="mes_anterior">Mês Anterior</MenuItem>
                  <MenuItem value="ano_atual">Ano Atual</MenuItem>
                  <MenuItem value="personalizado">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Fonte de Dados</InputLabel>
                <Select
                  value={config.fonte}
                  onChange={(e) => setConfig({ ...config, fonte: e.target.value })}
                  label="Fonte de Dados"
                >
                  <MenuItem value="ambos">Receitas e Despesas</MenuItem>
                  <MenuItem value="contas_receber">Apenas Receitas</MenuItem>
                  <MenuItem value="contas_pagar">Apenas Despesas</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {config.periodo.tipo === 'personalizado' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Data Início"
                    value={config.periodo.dataInicio}
                    onChange={(e) => setConfig({
                      ...config,
                      periodo: { ...config.periodo, dataInicio: e.target.value }
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Data Fim"
                    value={config.periodo.dataFim}
                    onChange={(e) => setConfig({
                      ...config,
                      periodo: { ...config.periodo, dataFim: e.target.value }
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Campos do Relatório" />
              </Divider>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Selecione os campos que deseja incluir no relatório
              </Typography>
              <List>
                {camposDisponiveis.map((campo) => (
                  <ListItem
                    key={campo.id}
                    button
                    onClick={() => toggleCampo(campo.id)}
                    sx={{
                      border: '1px solid',
                      borderColor: config.camposSelecionados.includes(campo.id) ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: config.camposSelecionados.includes(campo.id) ? 'primary.light' : 'transparent'
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={config.camposSelecionados.includes(campo.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemIcon>{campo.icon}</ListItemIcon>
                    <ListItemText primary={campo.label} />
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Agrupar Por</InputLabel>
                <Select
                  value={config.agruparPor}
                  onChange={(e) => setConfig({ ...config, agruparPor: e.target.value })}
                  label="Agrupar Por"
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  <MenuItem value="categoria">Categoria</MenuItem>
                  <MenuItem value="fornecedor">Fornecedor</MenuItem>
                  <MenuItem value="mes">Mês</MenuItem>
                  <MenuItem value="status">Status</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Ordenar Por</InputLabel>
                <Select
                  value={config.ordenarPor}
                  onChange={(e) => setConfig({ ...config, ordenarPor: e.target.value })}
                  label="Ordenar Por"
                >
                  <MenuItem value="">Padrão</MenuItem>
                  <MenuItem value="valor_crescente">Valor (Menor → Maior)</MenuItem>
                  <MenuItem value="valor_decrescente">Valor (Maior → Menor)</MenuItem>
                  <MenuItem value="data_crescente">Data (Antiga → Recente)</MenuItem>
                  <MenuItem value="data_decrescente">Data (Recente → Antiga)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Tipo de Visualização
              </Typography>
              <ToggleButtonGroup
                value={config.tipoVisualizacao}
                exclusive
                onChange={(e, valor) => valor && setConfig({ ...config, tipoVisualizacao: valor })}
                fullWidth
              >
                <ToggleButton value="tabela">
                  <Tooltip title="Tabela">
                    <TableChart />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="grafico_barras">
                  <Tooltip title="Gráfico de Barras">
                    <BarChart />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="grafico_pizza">
                  <Tooltip title="Gráfico de Pizza">
                    <PieChart />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="grafico_linha">
                  <Tooltip title="Gráfico de Linha">
                    <ShowChart />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  ℹ️ {dadosFiltrados.length} transação(ões) serão incluídas neste relatório.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalConstrutor(false)}>Cancelar</Button>
          <Button startIcon={<Save />} onClick={gerarRelatorio}>
            Salvar Configuração
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Assessment />}
            onClick={gerarRelatorio}
          >
            Gerar Relatório
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <FeedbackSnackbar
        open={snackbar.open}
        onClose={fecharSnackbar}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default RelatoriosDinamicos;
