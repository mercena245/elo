import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip, Alert, LinearProgress, Divider,
  InputAdornment, TablePagination, Stack, ToggleButton,
  ToggleButtonGroup, Badge, Collapse
} from '@mui/material';
import {
  Search, GetApp, Print, Visibility, Undo, AttachFile,
  FilterList, CalendarToday, AttachMoney, Category,
  TrendingUp, TrendingDown, Close, ExpandMore, ExpandLess,
  CheckCircle, Receipt, CloudDownload, Assessment
} from '@mui/icons-material';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FeedbackSnackbar from '../../../components/FeedbackSnackbar';

const ContasPagasMelhorado = ({
  contasPagas = [],
  loading = false,
  onEstornar,
  onExportar,
  onVisualizarComprovante
}) => {
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    descricao: '',
    categoria: '',
    fornecedor: '',
    dataInicio: '',
    dataFim: '',
    formaPagamento: '',
    valorMinimo: '',
    valorMaximo: ''
  });
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [filtroRapido, setFiltroRapido] = useState('mes_atual');

  // Estados de ordenação e paginação
  const [ordenacao, setOrdenacao] = useState({ campo: 'dataPagamento', direcao: 'desc' });
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Estados de modais
  const [modalDetalhes, setModalDetalhes] = useState({ aberto: false, conta: null });
  const [modalEstorno, setModalEstorno] = useState({ aberto: false, conta: null });

  // Estados de feedback
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [motivoEstorno, setMotivoEstorno] = useState('');
  const [buscaDebounce, setBuscaDebounce] = useState('');

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounce(filtros.descricao);
    }, 500);
    return () => clearTimeout(timer);
  }, [filtros.descricao]);

  // Categorias
  const categorias = [
    { value: 'fornecedores', label: 'Fornecedores', icon: '🏭', color: '#3b82f6' },
    { value: 'impostos', label: 'Impostos', icon: '📋', color: '#ef4444' },
    { value: 'folha', label: 'Folha de Pagamento', icon: '👥', color: '#8b5cf6' },
    { value: 'infraestrutura', label: 'Infraestrutura', icon: '🏢', color: '#f59e0b' },
    { value: 'material', label: 'Material Escolar', icon: '📦', color: '#10b981' },
    { value: 'servicos', label: 'Serviços', icon: '🔧', color: '#06b6d4' },
    { value: 'aluguel', label: 'Aluguel', icon: '🏠', color: '#ec4899' },
    { value: 'energia', label: 'Energia Elétrica', icon: '⚡', color: '#fbbf24' },
    { value: 'agua', label: 'Água', icon: '💧', color: '#3b82f6' },
    { value: 'internet', label: 'Internet', icon: '🌐', color: '#6366f1' },
    { value: 'manutencao', label: 'Manutenção', icon: '🔨', color: '#f97316' },
    { value: 'outros', label: 'Outros', icon: '📌', color: '#64748b' }
  ];

  const formasPagamento = [
    { value: 'dinheiro', label: '💵 Dinheiro' },
    { value: 'pix', label: '📱 PIX' },
    { value: 'transferencia', label: '🏦 Transferência' },
    { value: 'cartao_credito', label: '💳 Cartão de Crédito' },
    { value: 'cartao_debito', label: '💳 Cartão de Débito' },
    { value: 'boleto', label: '📄 Boleto' },
    { value: 'debito_automatico', label: '🔄 Débito Automático' },
    { value: 'cheque', label: '📝 Cheque' }
  ];

  // Aplicar filtro rápido
  const aplicarFiltroRapido = (tipo) => {
    const hoje = new Date();
    let novosFiltros = { ...filtros };

    switch(tipo) {
      case 'hoje':
        novosFiltros.dataInicio = format(hoje, 'yyyy-MM-dd');
        novosFiltros.dataFim = format(hoje, 'yyyy-MM-dd');
        break;
      case 'semana_atual':
        novosFiltros.dataInicio = format(startOfWeek(hoje, { locale: ptBR }), 'yyyy-MM-dd');
        novosFiltros.dataFim = format(endOfWeek(hoje, { locale: ptBR }), 'yyyy-MM-dd');
        break;
      case 'mes_atual':
        novosFiltros.dataInicio = format(startOfMonth(hoje), 'yyyy-MM-dd');
        novosFiltros.dataFim = format(endOfMonth(hoje), 'yyyy-MM-dd');
        break;
      case 'mes_anterior':
        const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        novosFiltros.dataInicio = format(startOfMonth(mesAnterior), 'yyyy-MM-dd');
        novosFiltros.dataFim = format(endOfMonth(mesAnterior), 'yyyy-MM-dd');
        break;
      default: // 'todos'
        novosFiltros.dataInicio = '';
        novosFiltros.dataFim = '';
    }

    setFiltros(novosFiltros);
    setFiltroRapido(tipo);
  };

  // Filtrar contas
  const contasFiltradas = useMemo(() => {
    let resultado = [...contasPagas];

    // Filtro por busca
    if (buscaDebounce) {
      resultado = resultado.filter(c =>
        c.descricao?.toLowerCase().includes(buscaDebounce.toLowerCase()) ||
        c.fornecedor?.toLowerCase().includes(buscaDebounce.toLowerCase()) ||
        c.numeroNotaFiscal?.toLowerCase().includes(buscaDebounce.toLowerCase())
      );
    }

    // Filtro por categoria
    if (filtros.categoria) {
      resultado = resultado.filter(c => c.categoria === filtros.categoria);
    }

    // Filtro por fornecedor
    if (filtros.fornecedor) {
      resultado = resultado.filter(c => 
        c.fornecedor?.toLowerCase().includes(filtros.fornecedor.toLowerCase())
      );
    }

    // Filtro por forma de pagamento
    if (filtros.formaPagamento) {
      resultado = resultado.filter(c => c.formaPagamento === filtros.formaPagamento);
    }

    // Filtro por período
    if (filtros.dataInicio) {
      const dataInicio = new Date(filtros.dataInicio);
      resultado = resultado.filter(c => new Date(c.dataPagamento) >= dataInicio);
    }

    if (filtros.dataFim) {
      const dataFim = new Date(filtros.dataFim);
      resultado = resultado.filter(c => new Date(c.dataPagamento) <= dataFim);
    }

    // Filtro por valor
    if (filtros.valorMinimo) {
      resultado = resultado.filter(c => c.valor >= parseFloat(filtros.valorMinimo));
    }

    if (filtros.valorMaximo) {
      resultado = resultado.filter(c => c.valor <= parseFloat(filtros.valorMaximo));
    }

    return resultado;
  }, [contasPagas, buscaDebounce, filtros]);

  // Ordenar contas
  const contasOrdenadas = useMemo(() => {
    const resultado = [...contasFiltradas];
    
    resultado.sort((a, b) => {
      let valorA, valorB;

      switch (ordenacao.campo) {
        case 'descricao':
          valorA = a.descricao?.toLowerCase() || '';
          valorB = b.descricao?.toLowerCase() || '';
          break;
        case 'valor':
          valorA = a.valor || 0;
          valorB = b.valor || 0;
          break;
        case 'dataPagamento':
          valorA = new Date(a.dataPagamento).getTime();
          valorB = new Date(b.dataPagamento).getTime();
          break;
        case 'categoria':
          valorA = a.categoria || '';
          valorB = b.categoria || '';
          break;
        case 'fornecedor':
          valorA = a.fornecedor || '';
          valorB = b.fornecedor || '';
          break;
        default:
          return 0;
      }

      if (valorA < valorB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valorA > valorB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });

    return resultado;
  }, [contasFiltradas, ordenacao]);

  // Paginar contas
  const contasPaginadas = useMemo(() => {
    const inicio = paginaAtual * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return contasOrdenadas.slice(inicio, fim);
  }, [contasOrdenadas, paginaAtual, itensPorPagina]);

  // Mudar ordenação
  const handleOrdenacao = (campo) => {
    const novaDirecao = ordenacao.campo === campo && ordenacao.direcao === 'asc' ? 'desc' : 'asc';
    setOrdenacao({ campo, direcao: novaDirecao });
  };

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const totalPago = contasFiltradas.reduce((sum, c) => sum + (c.valor || 0), 0);
    const porCategoria = {};
    const porFormaPagamento = {};

    contasFiltradas.forEach(conta => {
      // Por categoria
      if (!porCategoria[conta.categoria]) {
        porCategoria[conta.categoria] = { quantidade: 0, total: 0 };
      }
      porCategoria[conta.categoria].quantidade++;
      porCategoria[conta.categoria].total += conta.valor || 0;

      // Por forma de pagamento
      if (conta.formaPagamento) {
        if (!porFormaPagamento[conta.formaPagamento]) {
          porFormaPagamento[conta.formaPagamento] = { quantidade: 0, total: 0 };
        }
        porFormaPagamento[conta.formaPagamento].quantidade++;
        porFormaPagamento[conta.formaPagamento].total += conta.valor || 0;
      }
    });

    // Top 3 categorias
    const top3Categorias = Object.entries(porCategoria)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3)
      .map(([categoria, dados]) => ({
        categoria,
        ...dados,
        label: categorias.find(c => c.value === categoria)?.label || categoria
      }));

    // Top 3 formas de pagamento
    const top3Formas = Object.entries(porFormaPagamento)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3)
      .map(([forma, dados]) => ({
        forma,
        ...dados,
        label: formasPagamento.find(f => f.value === forma)?.label || forma
      }));

    return {
      totalPago,
      quantidade: contasFiltradas.length,
      ticketMedio: contasFiltradas.length > 0 ? totalPago / contasFiltradas.length : 0,
      porCategoria,
      porFormaPagamento,
      top3Categorias,
      top3Formas
    };
  }, [contasFiltradas]);

  // Formatar moeda
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  // Formatar data
  const formatarData = (data) => {
    if (!data) return '-';
    try {
      return format(parseISO(data), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
    }
  };

  // Obter cor da categoria
  const getCategoriaColor = (categoriaValue) => {
    const cat = categorias.find(c => c.value === categoriaValue);
    return cat?.color || '#64748b';
  };

  // Obter ícone da categoria
  const getCategoriaIcon = (categoriaValue) => {
    const cat = categorias.find(c => c.value === categoriaValue);
    return cat?.icon || '📌';
  };

  // Mostrar snackbar
  const mostrarSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Fechar snackbar
  const fecharSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      descricao: '',
      categoria: '',
      fornecedor: '',
      dataInicio: '',
      dataFim: '',
      formaPagamento: '',
      valorMinimo: '',
      valorMaximo: ''
    });
    setFiltroRapido('mes_atual');
    aplicarFiltroRapido('mes_atual');
    setPaginaAtual(0);
  };

  // Estornar pagamento
  const handleEstornarPagamento = async () => {
    if (!motivoEstorno || motivoEstorno.trim().length < 10) {
      mostrarSnackbar('Motivo do estorno deve ter pelo menos 10 caracteres', 'error');
      return;
    }

    try {
      await onEstornar(modalEstorno.conta, motivoEstorno);
      mostrarSnackbar('Pagamento estornado com sucesso!', 'success');
      setModalEstorno({ aberto: false, conta: null });
      setMotivoEstorno('');
    } catch (error) {
      mostrarSnackbar('Erro ao estornar pagamento', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          Carregando histórico...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                💰 Total Pago
              </Typography>
              <Typography variant="h4">
                {formatarMoeda(estatisticas.totalPago)}
              </Typography>
              <Typography variant="caption">
                {estatisticas.quantidade} pagamento(s)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                📊 Ticket Médio
              </Typography>
              <Typography variant="h4">
                {formatarMoeda(estatisticas.ticketMedio)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                🏆 Maior Categoria
              </Typography>
              <Typography variant="h6">
                {estatisticas.top3Categorias[0]?.label || '-'}
              </Typography>
              <Typography variant="caption">
                {estatisticas.top3Categorias[0] ? formatarMoeda(estatisticas.top3Categorias[0].total) : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                💳 Forma + Usada
              </Typography>
              <Typography variant="h6">
                {estatisticas.top3Formas[0]?.label?.replace(/[^\w\s]/gi, '') || '-'}
              </Typography>
              <Typography variant="caption">
                {estatisticas.top3Formas[0] ? `${estatisticas.top3Formas[0].quantidade}x` : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top 3 Categorias */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Top 3 Categorias
          </Typography>
          <Grid container spacing={2}>
            {estatisticas.top3Categorias.map((cat, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper sx={{ p: 2, borderLeft: `4px solid ${getCategoriaColor(cat.categoria)}` }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {index + 1}º {getCategoriaIcon(cat.categoria)} {cat.label}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatarMoeda(cat.total)}
                      </Typography>
                      <Typography variant="caption">
                        {cat.quantidade} pagamento(s)
                      </Typography>
                    </Box>
                    <TrendingDown sx={{ fontSize: 40, color: getCategoriaColor(cat.categoria), opacity: 0.3 }} />
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Filtros Rápidos */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ alignSelf: 'center', mr: 1 }}>
              🔍 Período:
            </Typography>
            <ToggleButtonGroup
              value={filtroRapido}
              exclusive
              onChange={(e, newValue) => newValue && aplicarFiltroRapido(newValue)}
              size="small"
            >
              <ToggleButton value="todos">Todos</ToggleButton>
              <ToggleButton value="hoje">Hoje</ToggleButton>
              <ToggleButton value="semana_atual">Esta Semana</ToggleButton>
              <ToggleButton value="mes_atual">Este Mês</ToggleButton>
              <ToggleButton value="mes_anterior">Mês Anterior</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Button
            startIcon={filtrosVisiveis ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
            size="small"
          >
            Filtros Avançados
          </Button>

          <Collapse in={filtrosVisiveis}>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="🔎 Buscar"
                    placeholder="Descrição, fornecedor ou NF"
                    value={filtros.descricao}
                    onChange={(e) => setFiltros({ ...filtros, descricao: e.target.value })}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      value={filtros.categoria}
                      onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                      label="Categoria"
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {categorias.map(cat => (
                        <MenuItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Forma de Pagamento</InputLabel>
                    <Select
                      value={filtros.formaPagamento}
                      onChange={(e) => setFiltros({ ...filtros, formaPagamento: e.target.value })}
                      label="Forma de Pagamento"
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {formasPagamento.map(forma => (
                        <MenuItem key={forma.value} value={forma.value}>
                          {forma.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Data Início"
                    value={filtros.dataInicio}
                    onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Data Fim"
                    value={filtros.dataFim}
                    onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Valor Mínimo"
                    value={filtros.valorMinimo}
                    onChange={(e) => setFiltros({ ...filtros, valorMinimo: e.target.value })}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Valor Máximo"
                    value={filtros.valorMaximo}
                    onChange={(e) => setFiltros({ ...filtros, valorMaximo: e.target.value })}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                    }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Close />}
                  onClick={limparFiltros}
                >
                  Limpar Filtros
                </Button>
                <Typography variant="caption" sx={{ alignSelf: 'center', ml: 2 }}>
                  {contasFiltradas.length} pagamento(s) encontrado(s)
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<GetApp />}
          onClick={() => onExportar && onExportar(contasFiltradas, 'excel')}
        >
          Exportar Excel
        </Button>
        <Button
          variant="outlined"
          startIcon={<Print />}
          onClick={() => onExportar && onExportar(contasFiltradas, 'pdf')}
        >
          Exportar PDF
        </Button>
      </Box>

      {/* Tabela */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'success.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={ordenacao.campo === 'dataPagamento'}
                  direction={ordenacao.direcao}
                  onClick={() => handleOrdenacao('dataPagamento')}
                  sx={{ color: 'white !important', '&.Mui-active': { color: 'white !important' } }}
                >
                  Data Pagamento
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={ordenacao.campo === 'descricao'}
                  direction={ordenacao.direcao}
                  onClick={() => handleOrdenacao('descricao')}
                  sx={{ color: 'white !important', '&.Mui-active': { color: 'white !important' } }}
                >
                  Descrição
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Categoria</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fornecedor</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Forma</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={ordenacao.campo === 'valor'}
                  direction={ordenacao.direcao}
                  onClick={() => handleOrdenacao('valor')}
                  sx={{ color: 'white !important', '&.Mui-active': { color: 'white !important' } }}
                >
                  Valor
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contasPaginadas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    Nenhum pagamento encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              contasPaginadas.map((conta) => {
                const corCategoria = getCategoriaColor(conta.categoria);
                const iconeCategoria = getCategoriaIcon(conta.categoria);

                return (
                  <TableRow 
                    key={conta.id}
                    hover
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      borderLeft: `4px solid ${corCategoria}`
                    }}
                  >
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight="medium">
                          {formatarData(conta.dataPagamento)}
                        </Typography>
                        <Chip
                          icon={<CheckCircle />}
                          label="Pago"
                          color="success"
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {conta.descricao}
                      </Typography>
                      {conta.numeroNotaFiscal && (
                        <Typography variant="caption" color="text.secondary">
                          NF: {conta.numeroNotaFiscal}
                        </Typography>
                      )}
                      {conta.anexos && conta.anexos.length > 0 && (
                        <Chip
                          icon={<AttachFile />}
                          label={`${conta.anexos.length} anexo(s)`}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${iconeCategoria} ${categorias.find(c => c.value === conta.categoria)?.label || conta.categoria}`}
                        size="small"
                        sx={{
                          bgcolor: corCategoria,
                          color: 'white',
                          fontWeight: 'medium'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {conta.fornecedor || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formasPagamento.find(f => f.value === conta.formaPagamento)?.label || conta.formaPagamento || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        {formatarMoeda(conta.valor)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Visualizar">
                          <IconButton
                            size="small"
                            onClick={() => setModalDetalhes({ aberto: true, conta })}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Estornar">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => setModalEstorno({ aberto: true, conta })}
                          >
                            <Undo fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {conta.comprovante && (
                          <Tooltip title="Ver Comprovante">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => onVisualizarComprovante && onVisualizarComprovante(conta.comprovante)}
                            >
                              <CloudDownload fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      <TablePagination
        component="div"
        count={contasOrdenadas.length}
        page={paginaAtual}
        onPageChange={(e, newPage) => setPaginaAtual(newPage)}
        rowsPerPage={itensPorPagina}
        onRowsPerPageChange={(e) => {
          setItensPorPagina(parseInt(e.target.value, 10));
          setPaginaAtual(0);
        }}
        labelRowsPerPage="Itens por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />

      {/* Modal Detalhes */}
      <Dialog
        open={modalDetalhes.aberto}
        onClose={() => setModalDetalhes({ aberto: false, conta: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">✅ Detalhes do Pagamento</Typography>
            <IconButton onClick={() => setModalDetalhes({ aberto: false, conta: null })} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {modalDetalhes.conta && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="success">
                  Pagamento realizado com sucesso
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {modalDetalhes.conta.descricao}
                </Typography>
                <Chip
                  label={`${getCategoriaIcon(modalDetalhes.conta.categoria)} ${categorias.find(c => c.value === modalDetalhes.conta.categoria)?.label || modalDetalhes.conta.categoria}`}
                  sx={{
                    bgcolor: getCategoriaColor(modalDetalhes.conta.categoria),
                    color: 'white',
                    fontWeight: 'medium'
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">
                  💰 Valor Pago
                </Typography>
                <Typography variant="h5" color="success.main" fontWeight="bold">
                  {formatarMoeda(modalDetalhes.conta.valor)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">
                  📅 Data do Pagamento
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatarData(modalDetalhes.conta.dataPagamento)}
                </Typography>
              </Grid>

              {modalDetalhes.conta.fornecedor && (
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    🏭 Fornecedor
                  </Typography>
                  <Typography variant="body1">
                    {modalDetalhes.conta.fornecedor}
                  </Typography>
                </Grid>
              )}

              {modalDetalhes.conta.numeroNotaFiscal && (
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    📋 Número da NF
                  </Typography>
                  <Typography variant="body1">
                    {modalDetalhes.conta.numeroNotaFiscal}
                  </Typography>
                </Grid>
              )}

              {modalDetalhes.conta.formaPagamento && (
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    💳 Forma de Pagamento
                  </Typography>
                  <Typography variant="body1">
                    {formasPagamento.find(f => f.value === modalDetalhes.conta.formaPagamento)?.label || modalDetalhes.conta.formaPagamento}
                  </Typography>
                </Grid>
              )}

              {modalDetalhes.conta.vencimento && (
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    📆 Data de Vencimento Original
                  </Typography>
                  <Typography variant="body1">
                    {formatarData(modalDetalhes.conta.vencimento)}
                  </Typography>
                </Grid>
              )}

              {modalDetalhes.conta.observacoes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    📝 Observações
                  </Typography>
                  <Paper sx={{ p: 2, mt: 0.5, bgcolor: 'background.default' }}>
                    <Typography variant="body2">
                      {modalDetalhes.conta.observacoes}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {modalDetalhes.conta.anexos && modalDetalhes.conta.anexos.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    📎 Anexos ({modalDetalhes.conta.anexos.length})
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {modalDetalhes.conta.anexos.map((anexo, index) => (
                      <Paper key={index} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AttachFile fontSize="small" />
                          <Typography variant="body2">{anexo.nome}</Typography>
                        </Stack>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => window.open(anexo.url, '_blank')}
                        >
                          Ver
                        </Button>
                      </Paper>
                    ))}
                  </Stack>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalDetalhes({ aberto: false, conta: null })}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Estorno */}
      <Dialog
        open={modalEstorno.aberto}
        onClose={() => setModalEstorno({ aberto: false, conta: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">↩️ Estornar Pagamento</Typography>
            <IconButton onClick={() => setModalEstorno({ aberto: false, conta: null })} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {modalEstorno.conta && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>⚠️ Atenção:</strong> Esta ação irá:
                </Typography>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  <li>Reverter o pagamento de <strong>{formatarMoeda(modalEstorno.conta.valor)}</strong></li>
                  <li>Devolver o valor ao saldo disponível</li>
                  <li>Marcar a conta como pendente novamente</li>
                  <li>Registrar o estorno no histórico de auditoria</li>
                </ul>
              </Alert>

              <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Conta:</strong> {modalEstorno.conta.descricao}
                </Typography>
                <Typography variant="body2">
                  <strong>Valor:</strong> {formatarMoeda(modalEstorno.conta.valor)}
                </Typography>
                <Typography variant="body2">
                  <strong>Pago em:</strong> {formatarData(modalEstorno.conta.dataPagamento)}
                </Typography>
                {modalEstorno.conta.formaPagamento && (
                  <Typography variant="body2">
                    <strong>Forma:</strong> {formasPagamento.find(f => f.value === modalEstorno.conta.formaPagamento)?.label || modalEstorno.conta.formaPagamento}
                  </Typography>
                )}
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Motivo do Estorno *"
                value={motivoEstorno}
                onChange={(e) => setMotivoEstorno(e.target.value)}
                placeholder="Explique detalhadamente o motivo do estorno (mínimo 10 caracteres)"
                required
                helperText={`${motivoEstorno.length}/10 caracteres mínimos`}
                error={motivoEstorno.length > 0 && motivoEstorno.length < 10}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalEstorno({ aberto: false, conta: null })}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="warning"
            onClick={handleEstornarPagamento}
            disabled={motivoEstorno.length < 10}
          >
            Confirmar Estorno
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

export default ContasPagasMelhorado;
