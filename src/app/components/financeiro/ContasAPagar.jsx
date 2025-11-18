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
  Menu,
  ListItemIcon,
  ListItemText,
  Avatar,
  TablePagination,
  Checkbox,
  FormControlLabel,
  Collapse
} from '@mui/material';
import {
  Add,
  FilterList,
  Search,
  AttachMoney,
  CalendarToday,
  AccountBalance,
  Payment,
  Edit,
  Delete,
  Visibility,
  GetApp,
  Print,
  MoreVert,
  AttachFile,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  Receipt,
  CloudUpload,
  ExpandMore,
  ExpandLess,
  Refresh
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ContasAPagar = ({
  contas = [],
  loading = false,
  onAdicionar,
  onEditar,
  onExcluir,
  onPagar,
  onExportar,
  saldoDisponivel = 0
}) => {
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    descricao: '',
    categoria: '',
    fornecedor: '',
    status: 'todas',
    dataInicio: '',
    dataFim: '',
    valorMinimo: '',
    valorMaximo: ''
  });
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(true);

  // Estados de ordenação e paginação
  const [ordenacao, setOrdenacao] = useState({ campo: 'vencimento', direcao: 'asc' });
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Estados de seleção múltipla
  const [contasSelecionadas, setContasSelecionadas] = useState([]);

  // Estados de modais
  const [modalDetalhes, setModalDetalhes] = useState({ aberto: false, conta: null });
  const [modalPagamento, setModalPagamento] = useState({ aberto: false, conta: null });
  const [modalNovaConta, setModalNovaConta] = useState(false);
  const [modalExcluir, setModalExcluir] = useState({ aberto: false, conta: null });

  // Estados do formulário de nova conta
  const [novaConta, setNovaConta] = useState({
    descricao: '',
    categoria: '',
    fornecedor: '',
    valor: '',
    vencimento: '',
    observacoes: '',
    recorrente: false,
    tipoRecorrencia: 'mensal',
    anexos: []
  });

  // Estados de pagamento
  const [dadosPagamento, setDadosPagamento] = useState({
    dataPagamento: format(new Date(), 'yyyy-MM-dd'),
    formaPagamento: '',
    observacoes: '',
    comprovante: null
  });

  // Categorias disponíveis
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

    // Filtro por status
    if (filtros.status !== 'todas') {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      resultado = resultado.filter(c => {
        const vencimento = new Date(c.vencimento);
        vencimento.setHours(0, 0, 0, 0);
        
        if (filtros.status === 'vencidas') {
          return c.status !== 'paga' && vencimento < hoje;
        } else if (filtros.status === 'pendentes') {
          return c.status !== 'paga' && vencimento >= hoje;
        } else if (filtros.status === 'pagas') {
          return c.status === 'paga';
        }
        return true;
      });
    }

    // Filtro por data início
    if (filtros.dataInicio) {
      const dataInicio = new Date(filtros.dataInicio);
      resultado = resultado.filter(c => new Date(c.vencimento) >= dataInicio);
    }

    // Filtro por data fim
    if (filtros.dataFim) {
      const dataFim = new Date(filtros.dataFim);
      resultado = resultado.filter(c => new Date(c.vencimento) <= dataFim);
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
        case 'vencimento':
          valorA = new Date(a.vencimento).getTime();
          valorB = new Date(b.vencimento).getTime();
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
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const contasNaoPagas = contas.filter(c => c.status !== 'paga');
    
    const totalAPagar = contasNaoPagas.reduce((sum, c) => sum + c.valor, 0);
    const vencidas = contasNaoPagas.filter(c => {
      const venc = new Date(c.vencimento);
      venc.setHours(0, 0, 0, 0);
      return venc < hoje;
    });
    const valorVencido = vencidas.reduce((sum, c) => sum + c.valor, 0);
    
    const proximoVencimento = contasNaoPagas
      .filter(c => new Date(c.vencimento) >= hoje)
      .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento))[0];
    
    const pagas = contas.filter(c => c.status === 'paga');
    const valorPago = pagas.reduce((sum, c) => sum + c.valor, 0);

    return {
      totalAPagar,
      quantidadeVencidas: vencidas.length,
      valorVencido,
      proximoVencimento,
      quantidadePagas: pagas.length,
      valorPago,
      saldoAposContas: saldoDisponivel - totalAPagar
    };
  };

  const kpis = calcularKPIs();

  // Função para obter cor do status
  const getStatusColor = (conta) => {
    if (conta.status === 'paga') return 'success';
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(conta.vencimento);
    vencimento.setHours(0, 0, 0, 0);
    
    if (vencimento < hoje) return 'error';
    
    // Vence nos próximos 7 dias
    const seteDias = new Date();
    seteDias.setDate(seteDias.getDate() + 7);
    if (vencimento <= seteDias) return 'warning';
    
    return 'default';
  };

  // Função para obter label do status
  const getStatusLabel = (conta) => {
    if (conta.status === 'paga') return '✅ Paga';
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(conta.vencimento);
    vencimento.setHours(0, 0, 0, 0);
    
    if (vencimento < hoje) return '🔴 Vencida';
    
    const seteDias = new Date();
    seteDias.setDate(seteDias.getDate() + 7);
    if (vencimento <= seteDias) return '⚠️ Vence em breve';
    
    return '⏰ Pendente';
  };

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
      status: 'todas',
      dataInicio: '',
      dataFim: '',
      valorMinimo: '',
      valorMaximo: ''
    });
    setPaginaAtual(0);
  };

  // Função para selecionar/desselecionar todas
  const handleSelecionarTodas = (event) => {
    if (event.target.checked) {
      setContasSelecionadas(contasPaginadas().map(c => c.id));
    } else {
      setContasSelecionadas([]);
    }
  };

  // Função para selecionar conta individual
  const handleSelecionarConta = (id) => {
    if (contasSelecionadas.includes(id)) {
      setContasSelecionadas(contasSelecionadas.filter(cId => cId !== id));
    } else {
      setContasSelecionadas([...contasSelecionadas, id]);
    }
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
          <Card sx={{ bgcolor: '#fef2f2', border: '2px solid #fecaca', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney sx={{ fontSize: 32, color: '#dc2626', mr: 1 }} />
                <Typography variant="h6" color="#dc2626" fontWeight={700}>
                  Total a Pagar
                </Typography>
              </Box>
              <Typography variant="h4" color="#b91c1c" fontWeight="bold">
                {formatarMoeda(kpis.totalAPagar)}
              </Typography>
              <Typography variant="caption" color="#991b1b">
                {contas.filter(c => c.status !== 'paga').length} contas pendentes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fefce8', border: '2px solid #fef08a', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning sx={{ fontSize: 32, color: '#ea580c', mr: 1 }} />
                <Typography variant="h6" color="#ea580c" fontWeight={700}>
                  Vencidas
                </Typography>
              </Box>
              <Typography variant="h4" color="#c2410c" fontWeight="bold">
                {formatarMoeda(kpis.valorVencido)}
              </Typography>
              <Typography variant="caption" color="#9a3412">
                {kpis.quantidadeVencidas} conta{kpis.quantidadeVencidas !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ecfdf5', border: '2px solid #a7f3d0', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ fontSize: 32, color: '#059669', mr: 1 }} />
                <Typography variant="h6" color="#059669" fontWeight={700}>
                  Pagas no Mês
                </Typography>
              </Box>
              <Typography variant="h4" color="#047857" fontWeight="bold">
                {formatarMoeda(kpis.valorPago)}
              </Typography>
              <Typography variant="caption" color="#065f46">
                {kpis.quantidadePagas} pagamento{kpis.quantidadePagas !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: kpis.saldoAposContas >= 0 ? '#eff6ff' : '#fef2f2', 
            border: `2px solid ${kpis.saldoAposContas >= 0 ? '#bfdbfe' : '#fecaca'}`,
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalance sx={{ 
                  fontSize: 32, 
                  color: kpis.saldoAposContas >= 0 ? '#2563eb' : '#dc2626', 
                  mr: 1 
                }} />
                <Typography variant="h6" color={kpis.saldoAposContas >= 0 ? '#2563eb' : '#dc2626'} fontWeight={700}>
                  Saldo Projetado
                </Typography>
              </Box>
              <Typography variant="h4" color={kpis.saldoAposContas >= 0 ? '#1d4ed8' : '#b91c1c'} fontWeight="bold">
                {formatarMoeda(kpis.saldoAposContas)}
              </Typography>
              <Typography variant="caption" color={kpis.saldoAposContas >= 0 ? '#1e40af' : '#991b1b'}>
                Saldo atual: {formatarMoeda(saldoDisponivel)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas */}
      {kpis.quantidadeVencidas > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>Atenção!</strong> Você tem {kpis.quantidadeVencidas} conta{kpis.quantidadeVencidas !== 1 ? 's' : ''} vencida{kpis.quantidadeVencidas !== 1 ? 's' : ''} totalizando {formatarMoeda(kpis.valorVencido)}.
        </Alert>
      )}

      {kpis.saldoAposContas < 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Saldo Insuficiente!</strong> O saldo após pagar todas as contas pendentes será negativo em {formatarMoeda(Math.abs(kpis.saldoAposContas))}.
        </Alert>
      )}

      {/* Card Principal */}
      <Card>
        <CardContent>
          {/* Cabeçalho com ações */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
                💰 Contas a Pagar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestão completa de contas e despesas
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
                startIcon={<GetApp />}
                onClick={onExportar}
              >
                Exportar
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setModalNovaConta(true)}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                  }
                }}
              >
                Nova Conta
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

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

                  {/* Status */}
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filtros.status}
                        label="Status"
                        onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <MenuItem value="todas">Todas</MenuItem>
                        <MenuItem value="pendentes">Pendentes</MenuItem>
                        <MenuItem value="vencidas">Vencidas</MenuItem>
                        <MenuItem value="pagas">Pagas</MenuItem>
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
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Carregando contas...
              </Typography>
            </Box>
          ) : contasFiltradas().length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Receipt sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Nenhuma conta encontrada
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {contas.length === 0 
                  ? 'Clique em "Nova Conta" para adicionar a primeira'
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
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={contasSelecionadas.length === contasPaginadas().length && contasPaginadas().length > 0}
                          indeterminate={contasSelecionadas.length > 0 && contasSelecionadas.length < contasPaginadas().length}
                          onChange={handleSelecionarTodas}
                        />
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
                          active={ordenacao.campo === 'vencimento'}
                          direction={ordenacao.campo === 'vencimento' ? ordenacao.direcao : 'asc'}
                          onClick={() => handleOrdenacao('vencimento')}
                        >
                          <strong>Vencimento</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell align="center"><strong>Ações</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contasPaginadas().map((conta) => (
                      <TableRow
                        key={conta.id}
                        hover
                        selected={contasSelecionadas.includes(conta.id)}
                        sx={{
                          bgcolor: conta.status === 'paga' ? '#f0fdf4' : 'inherit',
                          opacity: conta.status === 'paga' ? 0.7 : 1
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={contasSelecionadas.includes(conta.id)}
                            onChange={() => handleSelecionarConta(conta.id)}
                          />
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
                          <Typography variant="body2" fontWeight={700}>
                            {formatarMoeda(conta.valor)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatarData(conta.vencimento)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(conta)}
                            color={getStatusColor(conta)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Ver Detalhes">
                              <IconButton
                                size="small"
                                onClick={() => setModalDetalhes({ aberto: true, conta })}
                                sx={{ color: '#3b82f6' }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {conta.status !== 'paga' && (
                              <>
                                <Tooltip title="Editar">
                                  <IconButton
                                    size="small"
                                    onClick={() => onEditar && onEditar(conta)}
                                    sx={{ color: '#f59e0b' }}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Pagar">
                                  <IconButton
                                    size="small"
                                    onClick={() => setModalPagamento({ aberto: true, conta })}
                                    sx={{ color: '#10b981' }}
                                  >
                                    <Payment fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Excluir">
                                  <IconButton
                                    size="small"
                                    onClick={() => setModalExcluir({ aberto: true, conta })}
                                    sx={{ color: '#ef4444' }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Paginação */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Mostrando {paginaAtual * itensPorPagina + 1} a {Math.min((paginaAtual + 1) * itensPorPagina, contasFiltradas().length)} de {contasFiltradas().length} contas
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
                  labelRowsPerPage="Contas por página:"
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          📋 Detalhes da Conta
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {modalDetalhes.conta && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {modalDetalhes.conta.descricao}
                </Typography>
                <Chip
                  label={getStatusLabel(modalDetalhes.conta)}
                  color={getStatusColor(modalDetalhes.conta)}
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
                <Typography variant="h5" fontWeight={700} color="primary">
                  {formatarMoeda(modalDetalhes.conta.valor)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Vencimento
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatarData(modalDetalhes.conta.vencimento)}
                </Typography>
              </Grid>

              {modalDetalhes.conta.dataPagamento && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Data de Pagamento
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatarData(modalDetalhes.conta.dataPagamento)}
                  </Typography>
                </Grid>
              )}

              {modalDetalhes.conta.formaPagamento && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Forma de Pagamento
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formasPagamento.find(f => f.value === modalDetalhes.conta.formaPagamento)?.label || modalDetalhes.conta.formaPagamento}
                  </Typography>
                </Grid>
              )}

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
                    Esta é uma conta recorrente ({modalDetalhes.conta.tipoRecorrencia})
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
        </DialogActions>
      </Dialog>

      {/* Modal de Pagamento */}
      <Dialog
        open={modalPagamento.aberto}
        onClose={() => setModalPagamento({ aberto: false, conta: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          💳 Registrar Pagamento
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {modalPagamento.conta && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Conta: <strong>{modalPagamento.conta.descricao}</strong><br />
                  Valor: <strong>{formatarMoeda(modalPagamento.conta.valor)}</strong>
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data do Pagamento"
                  value={dadosPagamento.dataPagamento}
                  onChange={(e) => setDadosPagamento(prev => ({ ...prev, dataPagamento: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Forma de Pagamento</InputLabel>
                  <Select
                    value={dadosPagamento.formaPagamento}
                    label="Forma de Pagamento"
                    onChange={(e) => setDadosPagamento(prev => ({ ...prev, formaPagamento: e.target.value }))}
                  >
                    {formasPagamento.map((forma) => (
                      <MenuItem key={forma.value} value={forma.value}>
                        {forma.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observações (opcional)"
                  value={dadosPagamento.observacoes}
                  onChange={(e) => setDadosPagamento(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </Grid>

              {saldoDisponivel < modalPagamento.conta.valor && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <strong>Saldo Insuficiente!</strong><br />
                    Saldo disponível: {formatarMoeda(saldoDisponivel)}<br />
                    Valor da conta: {formatarMoeda(modalPagamento.conta.valor)}<br />
                    Diferença: {formatarMoeda(modalPagamento.conta.valor - saldoDisponivel)}
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalPagamento({ aberto: false, conta: null })}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              if (onPagar) {
                onPagar(modalPagamento.conta, dadosPagamento);
              }
              setModalPagamento({ aberto: false, conta: null });
              setDadosPagamento({
                dataPagamento: format(new Date(), 'yyyy-MM-dd'),
                formaPagamento: '',
                observacoes: '',
                comprovante: null
              });
            }}
            disabled={!dadosPagamento.dataPagamento || !dadosPagamento.formaPagamento}
          >
            Confirmar Pagamento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog
        open={modalExcluir.aberto}
        onClose={() => setModalExcluir({ aberto: false, conta: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          ⚠️ Confirmar Exclusão
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="error">
            Tem certeza que deseja excluir esta conta?
          </Alert>
          {modalExcluir.conta && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                <strong>Descrição:</strong> {modalExcluir.conta.descricao}
              </Typography>
              <Typography variant="body1">
                <strong>Valor:</strong> {formatarMoeda(modalExcluir.conta.valor)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Esta ação não pode ser desfeita.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalExcluir({ aberto: false, conta: null })}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (onExcluir) {
                onExcluir(modalExcluir.conta);
              }
              setModalExcluir({ aberto: false, conta: null });
            }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContasAPagar;
