import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert,
  LinearProgress,
  Divider,
  InputAdornment,
  TablePagination,
  Collapse
} from '@mui/material';
import {
  FilterList,
  Search,
  AttachMoney,
  Visibility,
  GetApp,
  Print,
  Receipt,
  TrendingUp,
  CheckCircle,
  CalendarToday,
  ExpandMore,
  ExpandLess,
  Refresh,
  PictureAsPdf,
  TableChart
} from '@mui/icons-material';
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ContasPagas = ({
  contas = [],
  loading = false,
  onExportar
}) => {
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    descricao: '',
    categoria: '',
    fornecedor: '',
    formaPagamento: '',
    dataInicio: '',
    dataFim: '',
    valorMinimo: '',
    valorMaximo: ''
  });
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(true);

  // Estados de ordenação e paginação
  const [ordenacao, setOrdenacao] = useState({ campo: 'dataPagamento', direcao: 'desc' });
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Estados de modais
  const [modalDetalhes, setModalDetalhes] = useState({ aberto: false, conta: null });

  // Categorias disponíveis (mesmo do componente de Contas a Pagar)
  const categorias = [
    { value: 'fornecedores', label: '🏭 Fornecedores', color: '#3b82f6' },
    { value: 'impostos', label: '📋 Impostos', color: '#ef4444' },
    { value: 'folha', label: '👥 Folha de Pagamento', color: '#8b5cf6' },
    { value: 'infraestrutura', label: '🏢 Infraestrutura', color: '#f59e0b' },
    { value: 'material', label: '📦 Material Escolar', color: '#10b981' },
    { value: 'servicos', label: '🔧 Serviços', color: '#06b6d4' },
    { value: 'aluguel', label: '🏠 Aluguel', color: '#ec4899' },
    { value: 'energia', label: '⚡ Energia Elétrica', color: '#fbbf24' },
    { value: 'agua', label: '💧 Água', color: '#3b82f6' },
    { value: 'internet', label: '🌐 Internet', color: '#6366f1' },
    { value: 'manutencao', label: '🔨 Manutenção', color: '#f97316' },
    { value: 'outros', label: '📌 Outros', color: '#64748b' }
  ];

  // Formas de pagamento
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

  // Função para filtrar contas
  const contasFiltradas = () => {
    let resultado = [...contas];

    // Filtro por descrição
    if (filtros.descricao) {
      resultado = resultado.filter(c =>
        c.descricao.toLowerCase().includes(filtros.descricao.toLowerCase()) ||
        (c.fornecedor && c.fornecedor.toLowerCase().includes(filtros.descricao.toLowerCase()))
      );
    }

    // Filtro por categoria
    if (filtros.categoria && filtros.categoria !== '') {
      resultado = resultado.filter(c => c.categoria === filtros.categoria);
    }

    // Filtro por fornecedor
    if (filtros.fornecedor) {
      resultado = resultado.filter(c =>
        c.fornecedor && c.fornecedor.toLowerCase().includes(filtros.fornecedor.toLowerCase())
      );
    }

    // Filtro por forma de pagamento
    if (filtros.formaPagamento && filtros.formaPagamento !== '') {
      resultado = resultado.filter(c => c.formaPagamento === filtros.formaPagamento);
    }

    // Filtro por data início
    if (filtros.dataInicio) {
      const dataInicio = new Date(filtros.dataInicio);
      resultado = resultado.filter(c => new Date(c.dataPagamento) >= dataInicio);
    }

    // Filtro por data fim
    if (filtros.dataFim) {
      const dataFim = new Date(filtros.dataFim);
      resultado = resultado.filter(c => new Date(c.dataPagamento) <= dataFim);
    }

    // Filtro por valor mínimo
    if (filtros.valorMinimo) {
      resultado = resultado.filter(c => c.valor >= parseFloat(filtros.valorMinimo));
    }

    // Filtro por valor máximo
    if (filtros.valorMaximo) {
      resultado = resultado.filter(c => c.valor <= parseFloat(filtros.valorMaximo));
    }

    return resultado;
  };

  // Função para ordenar contas
  const contasOrdenadas = () => {
    const resultado = [...contasFiltradas()];
    
    resultado.sort((a, b) => {
      let valorA, valorB;

      switch (ordenacao.campo) {
        case 'descricao':
          valorA = a.descricao.toLowerCase();
          valorB = b.descricao.toLowerCase();
          break;
        case 'valor':
          valorA = a.valor;
          valorB = b.valor;
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
        case 'formaPagamento':
          valorA = a.formaPagamento || '';
          valorB = b.formaPagamento || '';
          break;
        default:
          return 0;
      }

      if (valorA < valorB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valorA > valorB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });

    return resultado;
  };

  // Função para paginar contas
  const contasPaginadas = () => {
    const ordenadas = contasOrdenadas();
    const inicio = paginaAtual * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return ordenadas.slice(inicio, fim);
  };

  // Função para mudar ordenação
  const handleOrdenacao = (campo) => {
    const novaDirecao = ordenacao.campo === campo && ordenacao.direcao === 'asc' ? 'desc' : 'asc';
    setOrdenacao({ campo, direcao: novaDirecao });
  };

  // Calcular KPIs
  const calcularKPIs = () => {
    const totalPago = contas.reduce((sum, c) => sum + c.valor, 0);
    const quantidadeContas = contas.length;
    
    // Agrupar por categoria
    const porCategoria = {};
    contas.forEach(c => {
      if (!porCategoria[c.categoria]) {
        porCategoria[c.categoria] = { quantidade: 0, valor: 0 };
      }
      porCategoria[c.categoria].quantidade++;
      porCategoria[c.categoria].valor += c.valor;
    });

    // Agrupar por forma de pagamento
    const porFormaPagamento = {};
    contas.forEach(c => {
      if (!porFormaPagamento[c.formaPagamento]) {
        porFormaPagamento[c.formaPagamento] = { quantidade: 0, valor: 0 };
      }
      porFormaPagamento[c.formaPagamento].quantidade++;
      porFormaPagamento[c.formaPagamento].valor += c.valor;
    });

    // Categoria com maior gasto
    let categoriaMaiorGasto = null;
    let maiorGasto = 0;
    Object.entries(porCategoria).forEach(([cat, dados]) => {
      if (dados.valor > maiorGasto) {
        maiorGasto = dados.valor;
        categoriaMaiorGasto = cat;
      }
    });

    // Média de gastos
    const mediaGastos = quantidadeContas > 0 ? totalPago / quantidadeContas : 0;

    return {
      totalPago,
      quantidadeContas,
      porCategoria,
      porFormaPagamento,
      categoriaMaiorGasto,
      maiorGasto,
      mediaGastos
    };
  };

  const kpis = calcularKPIs();

  // Função para formatar moeda
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Função para formatar data
  const formatarData = (data) => {
    if (!data) return '-';
    try {
      return format(parseISO(data), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
    }
  };

  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltros({
      descricao: '',
      categoria: '',
      fornecedor: '',
      formaPagamento: '',
      dataInicio: '',
      dataFim: '',
      valorMinimo: '',
      valorMaximo: ''
    });
    setPaginaAtual(0);
  };

  // Função para aplicar filtros rápidos
  const aplicarFiltroRapido = (tipo) => {
    const hoje = new Date();
    let dataInicio, dataFim;

    switch (tipo) {
      case 'mes-atual':
        dataInicio = format(startOfMonth(hoje), 'yyyy-MM-dd');
        dataFim = format(endOfMonth(hoje), 'yyyy-MM-dd');
        break;
      case 'mes-anterior':
        const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        dataInicio = format(startOfMonth(mesAnterior), 'yyyy-MM-dd');
        dataFim = format(endOfMonth(mesAnterior), 'yyyy-MM-dd');
        break;
      case 'ano-atual':
        dataInicio = format(startOfYear(hoje), 'yyyy-MM-dd');
        dataFim = format(endOfYear(hoje), 'yyyy-MM-dd');
        break;
      default:
        return;
    }

    setFiltros(prev => ({ ...prev, dataInicio, dataFim }));
  };

  // Resetar página ao mudar filtros
  useEffect(() => {
    setPaginaAtual(0);
  }, [filtros]);

  return (
    <Box>
      {/* KPIs Dashboard */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ecfdf5', border: '2px solid #a7f3d0', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ fontSize: 32, color: '#059669', mr: 1 }} />
                <Typography variant="h6" color="#059669" fontWeight={700}>
                  Total Pago
                </Typography>
              </Box>
              <Typography variant="h4" color="#047857" fontWeight="bold">
                {formatarMoeda(kpis.totalPago)}
              </Typography>
              <Typography variant="caption" color="#065f46">
                {kpis.quantidadeContas} pagamento{kpis.quantidadeContas !== 1 ? 's' : ''} realizado{kpis.quantidadeContas !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#eff6ff', border: '2px solid #bfdbfe', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Receipt sx={{ fontSize: 32, color: '#2563eb', mr: 1 }} />
                <Typography variant="h6" color="#2563eb" fontWeight={700}>
                  Ticket Médio
                </Typography>
              </Box>
              <Typography variant="h4" color="#1d4ed8" fontWeight="bold">
                {formatarMoeda(kpis.mediaGastos)}
              </Typography>
              <Typography variant="caption" color="#1e40af">
                Média por pagamento
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fef3c7', border: '2px solid #fde68a', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ fontSize: 32, color: '#d97706', mr: 1 }} />
                <Typography variant="h6" color="#d97706" fontWeight={700}>
                  Maior Categoria
                </Typography>
              </Box>
              <Typography variant="h6" color="#b45309" fontWeight="bold" noWrap>
                {kpis.categoriaMaiorGasto ? 
                  categorias.find(c => c.value === kpis.categoriaMaiorGasto)?.label.split(' ').slice(1).join(' ') || kpis.categoriaMaiorGasto
                  : '-'
                }
              </Typography>
              <Typography variant="caption" color="#92400e">
                {formatarMoeda(kpis.maiorGasto)} gastos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f5f3ff', border: '2px solid #ddd6fe', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarToday sx={{ fontSize: 32, color: '#7c3aed', mr: 1 }} />
                <Typography variant="h6" color="#7c3aed" fontWeight={700}>
                  Período
                </Typography>
              </Box>
              <Typography variant="body1" color="#6d28d9" fontWeight="bold">
                {filtros.dataInicio && filtros.dataFim ? (
                  `${formatarData(filtros.dataInicio)} - ${formatarData(filtros.dataFim)}`
                ) : (
                  'Todos os períodos'
                )}
              </Typography>
              <Typography variant="caption" color="#5b21b6">
                {contasFiltradas().length} registros
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Card Principal */}
      <Card>
        <CardContent>
          {/* Cabeçalho com ações */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
                ✅ Contas Pagas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Histórico completo de pagamentos realizados
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => window.location.reload()}
              >
                Atualizar
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdf />}
                onClick={() => onExportar && onExportar('pdf')}
              >
                PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<TableChart />}
                onClick={() => onExportar && onExportar('excel')}
              >
                Excel
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Filtros Rápidos */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="Mês Atual"
              onClick={() => aplicarFiltroRapido('mes-atual')}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label="Mês Anterior"
              onClick={() => aplicarFiltroRapido('mes-anterior')}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label="Ano Atual"
              onClick={() => aplicarFiltroRapido('ano-atual')}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {/* Seção de Filtros */}
          <Box sx={{ mb: 3 }}>
            <Button
              startIcon={filtrosVisiveis ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
              sx={{ mb: 2 }}
            >
              {filtrosVisiveis ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>

            <Collapse in={filtrosVisiveis}>
              <Paper sx={{ p: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                  🔍 Filtros Avançados
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {/* Busca por descrição/fornecedor */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Buscar"
                      placeholder="Descrição ou fornecedor..."
                      value={filtros.descricao}
                      onChange={(e) => setFiltros(prev => ({ ...prev, descricao: e.target.value }))}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  {/* Categoria */}
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Categoria</InputLabel>
                      <Select
                        value={filtros.categoria}
                        label="Categoria"
                        onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {categorias.map((cat) => (
                          <MenuItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Forma de Pagamento */}
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Forma de Pagamento</InputLabel>
                      <Select
                        value={filtros.formaPagamento}
                        label="Forma de Pagamento"
                        onChange={(e) => setFiltros(prev => ({ ...prev, formaPagamento: e.target.value }))}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {formasPagamento.map((forma) => (
                          <MenuItem key={forma.value} value={forma.value}>
                            {forma.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Data Início */}
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Data Início"
                      value={filtros.dataInicio}
                      onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  {/* Data Fim */}
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Data Fim"
                      value={filtros.dataFim}
                      onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  {/* Valor Mínimo */}
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Valor Mínimo"
                      value={filtros.valorMinimo}
                      onChange={(e) => setFiltros(prev => ({ ...prev, valorMinimo: e.target.value }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>
                      }}
                    />
                  </Grid>

                  {/* Valor Máximo */}
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Valor Máximo"
                      value={filtros.valorMaximo}
                      onChange={(e) => setFiltros(prev => ({ ...prev, valorMaximo: e.target.value }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>
                      }}
                    />
                  </Grid>

                  {/* Botão Limpar Filtros */}
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={limparFiltros}
                      startIcon={<FilterList />}
                    >
                      Limpar Filtros
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Collapse>
          </Box>

          {/* Tabela de Contas */}
          {loading ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Carregando histórico de pagamentos...
              </Typography>
            </Box>
          ) : contasFiltradas().length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Receipt sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Nenhum pagamento encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {contas.length === 0 
                  ? 'Ainda não há pagamentos registrados'
                  : 'Ajuste os filtros para ver mais resultados'
                }
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell>
                        <TableSortLabel
                          active={ordenacao.campo === 'dataPagamento'}
                          direction={ordenacao.campo === 'dataPagamento' ? ordenacao.direcao : 'asc'}
                          onClick={() => handleOrdenacao('dataPagamento')}
                        >
                          <strong>Data Pagamento</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={ordenacao.campo === 'descricao'}
                          direction={ordenacao.campo === 'descricao' ? ordenacao.direcao : 'asc'}
                          onClick={() => handleOrdenacao('descricao')}
                        >
                          <strong>Descrição</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={ordenacao.campo === 'categoria'}
                          direction={ordenacao.campo === 'categoria' ? ordenacao.direcao : 'asc'}
                          onClick={() => handleOrdenacao('categoria')}
                        >
                          <strong>Categoria</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={ordenacao.campo === 'fornecedor'}
                          direction={ordenacao.campo === 'fornecedor' ? ordenacao.direcao : 'asc'}
                          onClick={() => handleOrdenacao('fornecedor')}
                        >
                          <strong>Fornecedor</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={ordenacao.campo === 'valor'}
                          direction={ordenacao.campo === 'valor' ? ordenacao.direcao : 'asc'}
                          onClick={() => handleOrdenacao('valor')}
                        >
                          <strong>Valor</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={ordenacao.campo === 'formaPagamento'}
                          direction={ordenacao.campo === 'formaPagamento' ? ordenacao.direcao : 'asc'}
                          onClick={() => handleOrdenacao('formaPagamento')}
                        >
                          <strong>Forma de Pagamento</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center"><strong>Ações</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contasPaginadas().map((conta) => (
                      <TableRow key={conta.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {formatarData(conta.dataPagamento)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {conta.descricao}
                          </Typography>
                          {conta.recorrente && (
                            <Chip
                              label="Recorrente"
                              size="small"
                              color="info"
                              sx={{ mt: 0.5, height: 20 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={categorias.find(c => c.value === conta.categoria)?.label || conta.categoria}
                            size="small"
                            sx={{
                              bgcolor: categorias.find(c => c.value === conta.categoria)?.color + '20',
                              color: categorias.find(c => c.value === conta.categoria)?.color,
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell>{conta.fornecedor || '-'}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="success.main">
                            {formatarMoeda(conta.valor)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formasPagamento.find(f => f.value === conta.formaPagamento)?.label || conta.formaPagamento}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver Detalhes">
                            <IconButton
                              size="small"
                              onClick={() => setModalDetalhes({ aberto: true, conta })}
                              sx={{ color: '#3b82f6' }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totalizador */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: '#ecfdf5', border: '2px solid #a7f3d0' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Total de Pagamentos
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="#047857">
                      {contasFiltradas().length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Valor Total Pago
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="#047857">
                      {formatarMoeda(contasFiltradas().reduce((sum, c) => sum + c.valor, 0))}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Ticket Médio
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="#047857">
                      {formatarMoeda(contasFiltradas().length > 0 ? contasFiltradas().reduce((sum, c) => sum + c.valor, 0) / contasFiltradas().length : 0)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Paginação */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Mostrando {paginaAtual * itensPorPagina + 1} a {Math.min((paginaAtual + 1) * itensPorPagina, contasFiltradas().length)} de {contasFiltradas().length} pagamentos
                </Typography>
                <TablePagination
                  component="div"
                  count={contasFiltradas().length}
                  page={paginaAtual}
                  onPageChange={(e, newPage) => setPaginaAtual(newPage)}
                  rowsPerPage={itensPorPagina}
                  onRowsPerPageChange={(e) => {
                    setItensPorPagina(parseInt(e.target.value, 10));
                    setPaginaAtual(0);
                  }}
                  labelRowsPerPage="Pagamentos por página:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog
        open={modalDetalhes.aberto}
        onClose={() => setModalDetalhes({ aberto: false, conta: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          ✅ Detalhes do Pagamento
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {modalDetalhes.conta && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {modalDetalhes.conta.descricao}
                </Typography>
                <Chip
                  label="✅ Pago"
                  color="success"
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Categoria
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {categorias.find(c => c.value === modalDetalhes.conta.categoria)?.label || modalDetalhes.conta.categoria}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Fornecedor
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {modalDetalhes.conta.fornecedor || '-'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Valor
                </Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {formatarMoeda(modalDetalhes.conta.valor)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Data de Pagamento
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatarData(modalDetalhes.conta.dataPagamento)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Vencimento Original
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatarData(modalDetalhes.conta.vencimento)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Forma de Pagamento
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formasPagamento.find(f => f.value === modalDetalhes.conta.formaPagamento)?.label || modalDetalhes.conta.formaPagamento}
                </Typography>
              </Grid>

              {modalDetalhes.conta.observacoes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Observações
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: '#f8fafc', mt: 1 }}>
                    <Typography variant="body2">
                      {modalDetalhes.conta.observacoes}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {modalDetalhes.conta.recorrente && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Esta era uma conta recorrente ({modalDetalhes.conta.tipoRecorrencia})
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalDetalhes({ aberto: false, conta: null })}>
            Fechar
          </Button>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContasPagas;
