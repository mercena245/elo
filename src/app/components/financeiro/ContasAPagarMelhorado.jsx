import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip, Alert, LinearProgress, Divider,
  InputAdornment, TablePagination, Checkbox, FormControlLabel,
  Collapse, Badge, Stack, ToggleButton, ToggleButtonGroup,
  Slider, FormHelperText
} from '@mui/material';
import {
  Add, FilterList, Search, AttachMoney, CalendarToday,
  Payment, Edit, Delete, Visibility, GetApp, Print,
  AttachFile, TrendingUp, Warning, CheckCircle, Schedule,
  Receipt, CloudUpload, ExpandMore, ExpandLess, Refresh,
  Undo, Close, CloudDone
} from '@mui/icons-material';
import { format, parseISO, isToday, differenceInDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FeedbackSnackbar from '../../../components/FeedbackSnackbar';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const ContasAPagarMelhorado = ({
  contas = [],
  loading = false,
  onAdicionar,
  onEditar,
  onExcluir,
  onPagar,
  onEstornar,
  onExportar,
  saldoDisponivel = 0,
  storage // Firebase Storage instance
}) => {
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    descricao: '',
    categoria: '',
    fornecedor: '',
    status: 'pendentes',
    dataInicio: '',
    dataFim: '',
    valorMinimo: '',
    valorMaximo: ''
  });
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(true);
  const [filtroRapido, setFiltroRapido] = useState('todos');

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
  const [modalEstorno, setModalEstorno] = useState({ aberto: false, conta: null });

  // Estados do formulário de nova conta
  const [novaConta, setNovaConta] = useState({
    descricao: '',
    categoria: '',
    fornecedor: '',
    numeroNotaFiscal: '',
    valor: '',
    vencimento: '',
    observacoes: '',
    recorrente: false,
    tipoRecorrencia: 'mensal',
    quantidadeParcelas: 3,
    anexos: []
  });

  // Estados de pagamento
  const [dadosPagamento, setDadosPagamento] = useState({
    dataPagamento: format(new Date(), 'yyyy-MM-dd'),
    formaPagamento: '',
    observacoes: '',
    comprovante: null
  });

  // Estados de estorno
  const [motivoEstorno, setMotivoEstorno] = useState('');

  // Estados de feedback e validação
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [errosValidacao, setErrosValidacao] = useState({});
  const [uploadandoAnexo, setUploadandoAnexo] = useState(false);
  const [buscaDebounce, setBuscaDebounce] = useState('');

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounce(filtros.descricao);
    }, 500);
    return () => clearTimeout(timer);
  }, [filtros.descricao]);

  // Categorias com CORES e ÍCONES
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

  // Função para aplicar filtro rápido
  const aplicarFiltroRapido = useCallback((tipo) => {
    const hoje = new Date();
    let novosFiltros = { ...filtros };

    switch(tipo) {
      case 'hoje':
        novosFiltros.dataInicio = format(hoje, 'yyyy-MM-dd');
        novosFiltros.dataFim = format(hoje, 'yyyy-MM-dd');
        novosFiltros.status = 'todas';
        break;
      case 'semana':
        novosFiltros.dataInicio = format(startOfWeek(hoje, { locale: ptBR }), 'yyyy-MM-dd');
        novosFiltros.dataFim = format(endOfWeek(hoje, { locale: ptBR }), 'yyyy-MM-dd');
        novosFiltros.status = 'todas';
        break;
      case 'mes':
        novosFiltros.dataInicio = format(startOfMonth(hoje), 'yyyy-MM-dd');
        novosFiltros.dataFim = format(endOfMonth(hoje), 'yyyy-MM-dd');
        novosFiltros.status = 'todas';
        break;
      case 'vencidas':
        novosFiltros.status = 'vencidas';
        novosFiltros.dataInicio = '';
        novosFiltros.dataFim = '';
        break;
      case 'proximas':
        novosFiltros.dataInicio = format(hoje, 'yyyy-MM-dd');
        novosFiltros.dataFim = format(addDays(hoje, 7), 'yyyy-MM-dd');
        novosFiltros.status = 'pendentes';
        break;
      default: // 'todos'
        novosFiltros = {
          ...filtros,
          dataInicio: '',
          dataFim: '',
          status: 'pendentes'
        };
    }

    setFiltros(novosFiltros);
    setFiltroRapido(tipo);
  }, [filtros]);

  // Função para filtrar contas com MEMOIZAÇÃO
  const contasFiltradas = useMemo(() => {
    let resultado = [...contas];

    // Filtro por busca (debounced)
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

    // Filtro por status
    if (filtros.status !== 'todas') {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      resultado = resultado.filter(c => {
        const vencimento = new Date(c.vencimento);
        vencimento.setHours(0, 0, 0, 0);
        
        if (filtros.status === 'vencidas') {
          return c.status !== 'pago' && vencimento < hoje;
        } else if (filtros.status === 'pendentes') {
          return c.status !== 'pago' && vencimento >= hoje;
        } else if (filtros.status === 'pagas') {
          return c.status === 'pago';
        }
        return true;
      });
    }

    // Filtro por período
    if (filtros.dataInicio) {
      const dataInicio = new Date(filtros.dataInicio);
      resultado = resultado.filter(c => new Date(c.vencimento) >= dataInicio);
    }

    if (filtros.dataFim) {
      const dataFim = new Date(filtros.dataFim);
      resultado = resultado.filter(c => new Date(c.vencimento) <= dataFim);
    }

    // Filtro por valor
    if (filtros.valorMinimo) {
      resultado = resultado.filter(c => c.valor >= parseFloat(filtros.valorMinimo));
    }

    if (filtros.valorMaximo) {
      resultado = resultado.filter(c => c.valor <= parseFloat(filtros.valorMaximo));
    }

    return resultado;
  }, [contas, buscaDebounce, filtros]);

  // Função para ordenar contas
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
  }, [contasFiltradas, ordenacao]);

  // Função para paginar contas
  const contasPaginadas = useMemo(() => {
    const inicio = paginaAtual * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return contasOrdenadas.slice(inicio, fim);
  }, [contasOrdenadas, paginaAtual, itensPorPagina]);

  // Função para mudar ordenação
  const handleOrdenacao = (campo) => {
    const novaDirecao = ordenacao.campo === campo && ordenacao.direcao === 'asc' ? 'desc' : 'asc';
    setOrdenacao({ campo, direcao: novaDirecao });
  };

  // Calcular KPIs
  const kpis = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const contasNaoPagas = contas.filter(c => c.status !== 'pago');
    
    const totalAPagar = contasNaoPagas.reduce((sum, c) => sum + (c.valor || 0), 0);
    
    const vencidas = contasNaoPagas.filter(c => {
      const venc = new Date(c.vencimento);
      venc.setHours(0, 0, 0, 0);
      return venc < hoje;
    });
    
    const valorVencido = vencidas.reduce((sum, c) => sum + (c.valor || 0), 0);
    
    const vencem Hoje = contasNaoPagas.filter(c => {
      const venc = new Date(c.vencimento);
      return isToday(venc);
    });
    
    const vencemEm3Dias = contasNaoPagas.filter(c => {
      const venc = new Date(c.vencimento);
      const dias = differenceInDays(venc, hoje);
      return dias >= 0 && dias <= 3;
    });
    
    const proximoVencimento = contasNaoPagas
      .filter(c => new Date(c.vencimento) >= hoje)
      .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento))[0];
    
    const pagas = contas.filter(c => c.status === 'pago');
    const valorPago = pagas.reduce((sum, c) => sum + (c.valor || 0), 0);

    return {
      totalAPagar,
      quantidadeVencidas: vencidas.length,
      valorVencido,
      vencemHoje: vencemHoje.length,
      vencemEm3Dias: vencemEm3Dias.length,
      proximoVencimento,
      quantidadePagas: pagas.length,
      valorPago,
      saldoAposContas: saldoDisponivel - totalAPagar
    };
  }, [contas, saldoDisponivel]);

  // Função para obter indicador de vencimento
  const getIndicadorVencimento = (conta) => {
    if (conta.status === 'pago') return null;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(conta.vencimento);
    vencimento.setHours(0, 0, 0, 0);
    
    if (isToday(vencimento)) {
      return { label: '⚠️ VENCE HOJE', color: 'error', variant: 'filled' };
    }
    
    const dias = differenceInDays(vencimento, hoje);
    
    if (dias < 0) {
      const diasAtraso = Math.abs(dias);
      return { 
        label: `🔴 VENCIDA HÁ ${diasAtraso} DIA${diasAtraso > 1 ? 'S' : ''}`, 
        color: 'error', 
        variant: 'filled' 
      };
    }
    
    if (dias <= 3) {
      return { label: `⏰ VENCE EM ${dias} DIA${dias > 1 ? 'S' : ''}`, color: 'warning', variant: 'filled' };
    }
    
    if (dias <= 7) {
      return { label: `📅 Vence em ${dias} dias`, color: 'info', variant: 'outlined' };
    }
    
    return null;
  };

  // Função para obter cor da categoria
  const getCategoriaColor = (categoriaValue) => {
    const cat = categorias.find(c => c.value === categoriaValue);
    return cat?.color || '#64748b';
  };

  // Função para obter ícone da categoria
  const getCategoriaIcon = (categoriaValue) => {
    const cat = categorias.find(c => c.value === categoriaValue);
    return cat?.icon || '📌';
  };

  // Função para formatar moeda
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
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

  // Validação do formulário
  const validarFormulario = () => {
    const erros = {};

    if (!novaConta.descricao || novaConta.descricao.trim().length < 3) {
      erros.descricao = 'Descrição deve ter pelo menos 3 caracteres';
    }

    if (!novaConta.categoria) {
      erros.categoria = 'Selecione uma categoria';
    }

    if (!novaConta.valor || parseFloat(novaConta.valor) <= 0) {
      erros.valor = 'Valor deve ser maior que zero';
    }

    if (!novaConta.vencimento) {
      erros.vencimento = 'Data de vencimento é obrigatória';
    }

    setErrosValidacao(erros);
    return Object.keys(erros).length === 0;
  };

  // Upload de anexo
  const handleUploadAnexo = async (file) => {
    if (!storage) {
      mostrarSnackbar('Storage não configurado', 'error');
      return null;
    }

    try {
      setUploadandoAnexo(true);
      const timestamp = Date.now();
      const fileName = `contas-pagar/${timestamp}_${file.name}`;
      const fileRef = storageRef(storage, fileName);
      
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      mostrarSnackbar('Anexo enviado com sucesso!', 'success');
      return { nome: file.name, url, uploadEm: new Date().toISOString() };
    } catch (error) {
      console.error('Erro no upload:', error);
      mostrarSnackbar('Erro ao enviar anexo', 'error');
      return null;
    } finally {
      setUploadandoAnexo(false);
    }
  };

  // Função para mostrar snackbar
  const mostrarSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Função para fechar snackbar
  const fecharSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      descricao: '',
      categoria: '',
      fornecedor: '',
      status: 'pendentes',
      dataInicio: '',
      dataFim: '',
      valorMinimo: '',
      valorMaximo: ''
    });
    setFiltroRapido('todos');
    setPaginaAtual(0);
  };

  // Função para adicionar conta
  const handleAdicionarConta = async () => {
    if (!validarFormulario()) {
      mostrarSnackbar('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    try {
      await onAdicionar(novaConta);
      mostrarSnackbar('Conta adicionada com sucesso!', 'success');
      setModalNovaConta(false);
      setNovaConta({
        descricao: '',
        categoria: '',
        fornecedor: '',
        numeroNotaFiscal: '',
        valor: '',
        vencimento: '',
        observacoes: '',
        recorrente: false,
        tipoRecorrencia: 'mensal',
        quantidadeParcelas: 3,
        anexos: []
      });
      setErrosValidacao({});
    } catch (error) {
      mostrarSnackbar('Erro ao adicionar conta', 'error');
    }
  };

  // Função para pagar conta
  const handlePagarConta = async () => {
    if (!dadosPagamento.formaPagamento) {
      mostrarSnackbar('Selecione a forma de pagamento', 'error');
      return;
    }

    try {
      await onPagar(modalPagamento.conta, dadosPagamento);
      mostrarSnackbar('Pagamento registrado com sucesso!', 'success');
      setModalPagamento({ aberto: false, conta: null });
      setDadosPagamento({
        dataPagamento: format(new Date(), 'yyyy-MM-dd'),
        formaPagamento: '',
        observacoes: '',
        comprovante: null
      });
    } catch (error) {
      mostrarSnackbar('Erro ao registrar pagamento', 'error');
    }
  };

  // Função para estornar pagamento
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
          Carregando contas...
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
                💰 Total a Pagar
              </Typography>
              <Typography variant="h4">
                {formatarMoeda(kpis.totalAPagar)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                🔴 Vencidas
              </Typography>
              <Typography variant="h4">
                {kpis.quantidadeVencidas}
              </Typography>
              <Typography variant="caption">
                {formatarMoeda(kpis.valorVencido)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                ⚠️ Vence Hoje / 3 Dias
              </Typography>
              <Typography variant="h4">
                {kpis.vencemHoje} / {kpis.vencemEm3Dias}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: kpis.saldoAposContas >= 0 
              ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' 
              : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                💵 Saldo Após Contas
              </Typography>
              <Typography variant="h4">
                {formatarMoeda(kpis.saldoAposContas)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros Rápidos */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ alignSelf: 'center', mr: 1 }}>
              🔍 Filtro Rápido:
            </Typography>
            <ToggleButtonGroup
              value={filtroRapido}
              exclusive
              onChange={(e, newValue) => newValue && aplicarFiltroRapido(newValue)}
              size="small"
            >
              <ToggleButton value="todos">Todos</ToggleButton>
              <ToggleButton value="hoje">Hoje</ToggleButton>
              <ToggleButton value="semana">Esta Semana</ToggleButton>
              <ToggleButton value="mes">Este Mês</ToggleButton>
              <ToggleButton value="vencidas">Vencidas</ToggleButton>
              <ToggleButton value="proximas">Próximos 7 dias</ToggleButton>
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="🔎 Buscar"
                    placeholder="Descrição, fornecedor ou nº NF"
                    value={filtros.descricao}
                    onChange={(e) => setFiltros({ ...filtros, descricao: e.target.value })}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
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

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filtros.status}
                      onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                      label="Status"
                    >
                      <MenuItem value="todas">Todas</MenuItem>
                      <MenuItem value="pendentes">Pendentes</MenuItem>
                      <MenuItem value="vencidas">Vencidas</MenuItem>
                      <MenuItem value="pagas">Pagas</MenuItem>
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
                  {contasFiltradas.length} conta(s) encontrada(s)
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Botão Adicionar */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setModalNovaConta(true)}
          sx={{ borderRadius: 2 }}
        >
          Nova Conta
        </Button>

        <Button
          variant="outlined"
          startIcon={<GetApp />}
          onClick={() => onExportar && onExportar(contasFiltradas)}
        >
          Exportar
        </Button>
      </Box>

      {/* Tabela */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell padding="checkbox">
                <Checkbox sx={{ color: 'white' }} />
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={ordenacao.campo === 'vencimento'}
                  direction={ordenacao.direcao}
                  onClick={() => handleOrdenacao('vencimento')}
                  sx={{ color: 'white !important', '&.Mui-active': { color: 'white !important' } }}
                >
                  Vencimento
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
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contasPaginadas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    Nenhuma conta encontrada com os filtros aplicados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              contasPaginadas.map((conta) => {
                const indicador = getIndicadorVencimento(conta);
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
                    <TableCell padding="checkbox">
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight="medium">
                          {formatarData(conta.vencimento)}
                        </Typography>
                        {indicador && (
                          <Chip 
                            label={indicador.label} 
                            color={indicador.color}
                            variant={indicador.variant}
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
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
                      <Typography variant="body1" fontWeight="bold" color="primary">
                        {formatarMoeda(conta.valor)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {conta.status === 'pago' ? (
                        <Chip
                          icon={<CheckCircle />}
                          label="Pago"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<Schedule />}
                          label="Pendente"
                          color="warning"
                          size="small"
                        />
                      )}
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

                        {conta.status !== 'pago' ? (
                          <>
                            <Tooltip title="Pagar">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => setModalPagamento({ aberto: true, conta })}
                              >
                                <Payment fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => onEditar && onEditar(conta)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setModalExcluir({ aberto: true, conta })}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Tooltip title="Estornar Pagamento">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => setModalEstorno({ aberto: true, conta })}
                            >
                              <Undo fontSize="small" />
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

      {/* Modal Nova Conta */}
      <Dialog
        open={modalNovaConta}
        onClose={() => setModalNovaConta(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">➕ Nova Conta a Pagar</Typography>
            <IconButton onClick={() => setModalNovaConta(false)} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição *"
                value={novaConta.descricao}
                onChange={(e) => setNovaConta({ ...novaConta, descricao: e.target.value })}
                error={!!errosValidacao.descricao}
                helperText={errosValidacao.descricao}
                placeholder="Ex: Pagamento de fornecedor, conta de luz..."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errosValidacao.categoria}>
                <InputLabel>Categoria *</InputLabel>
                <Select
                  value={novaConta.categoria}
                  onChange={(e) => setNovaConta({ ...novaConta, categoria: e.target.value })}
                  label="Categoria *"
                >
                  {categorias.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>{cat.icon}</span>
                        <Typography>{cat.label}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                {errosValidacao.categoria && (
                  <FormHelperText>{errosValidacao.categoria}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fornecedor / Beneficiário"
                value={novaConta.fornecedor}
                onChange={(e) => setNovaConta({ ...novaConta, fornecedor: e.target.value })}
                placeholder="Nome do fornecedor ou beneficiário"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número da Nota Fiscal"
                value={novaConta.numeroNotaFiscal}
                onChange={(e) => setNovaConta({ ...novaConta, numeroNotaFiscal: e.target.value })}
                placeholder="Ex: 12345"
                InputProps={{
                  startAdornment: <Receipt sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Valor *"
                value={novaConta.valor}
                onChange={(e) => setNovaConta({ ...novaConta, valor: e.target.value })}
                error={!!errosValidacao.valor}
                helperText={errosValidacao.valor}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Data de Vencimento *"
                value={novaConta.vencimento}
                onChange={(e) => setNovaConta({ ...novaConta, vencimento: e.target.value })}
                error={!!errosValidacao.vencimento}
                helperText={errosValidacao.vencimento}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={novaConta.recorrente}
                    onChange={(e) => setNovaConta({ ...novaConta, recorrente: e.target.checked })}
                  />
                }
                label="Conta Recorrente 🔄"
              />
            </Grid>

            {novaConta.recorrente && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Recorrência</InputLabel>
                    <Select
                      value={novaConta.tipoRecorrencia}
                      onChange={(e) => setNovaConta({ ...novaConta, tipoRecorrencia: e.target.value })}
                      label="Tipo de Recorrência"
                    >
                      <MenuItem value="mensal">📅 Mensal</MenuItem>
                      <MenuItem value="trimestral">📅 Trimestral</MenuItem>
                      <MenuItem value="semestral">📅 Semestral</MenuItem>
                      <MenuItem value="anual">📅 Anual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <Typography variant="caption" gutterBottom>
                      Quantidade de Parcelas: {novaConta.quantidadeParcelas}
                    </Typography>
                    <Slider
                      value={novaConta.quantidadeParcelas}
                      onChange={(e, value) => setNovaConta({ ...novaConta, quantidadeParcelas: value })}
                      min={1}
                      max={36}
                      marks={[
                        { value: 1, label: '1' },
                        { value: 12, label: '12' },
                        { value: 24, label: '24' },
                        { value: 36, label: '36' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </FormControl>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observações"
                value={novaConta.observacoes}
                onChange={(e) => setNovaConta({ ...novaConta, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre a conta..."
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Anexos" size="small" />
              </Divider>
              
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={uploadandoAnexo ? <CloudDone /> : <CloudUpload />}
                disabled={uploadandoAnexo}
                sx={{ mt: 1 }}
              >
                {uploadandoAnexo ? 'Enviando...' : 'Adicionar Anexo (NF, Comprovante, etc.)'}
                <input
                  type="file"
                  hidden
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const anexo = await handleUploadAnexo(file);
                      if (anexo) {
                        setNovaConta({
                          ...novaConta,
                          anexos: [...novaConta.anexos, anexo]
                        });
                      }
                    }
                  }}
                />
              </Button>

              {novaConta.anexos.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Anexos adicionados:
                  </Typography>
                  {novaConta.anexos.map((anexo, index) => (
                    <Chip
                      key={index}
                      label={anexo.nome}
                      icon={<AttachFile />}
                      onDelete={() => {
                        setNovaConta({
                          ...novaConta,
                          anexos: novaConta.anexos.filter((_, i) => i !== index)
                        });
                      }}
                      sx={{ mt: 1, mr: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              💡 <strong>Dica:</strong> Para contas recorrentes, o sistema criará automaticamente 
              as parcelas futuras com base na periodicidade escolhida.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalNovaConta(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleAdicionarConta}
            disabled={uploadandoAnexo}
          >
            Adicionar Conta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Pagamento */}
      <Dialog
        open={modalPagamento.aberto}
        onClose={() => setModalPagamento({ aberto: false, conta: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">💳 Registrar Pagamento</Typography>
            <IconButton onClick={() => setModalPagamento({ aberto: false, conta: null })} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {modalPagamento.conta && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Conta:</strong> {modalPagamento.conta.descricao}
                </Typography>
                <Typography variant="body2">
                  <strong>Valor:</strong> {formatarMoeda(modalPagamento.conta.valor)}
                </Typography>
                <Typography variant="body2">
                  <strong>Vencimento:</strong> {formatarData(modalPagamento.conta.vencimento)}
                </Typography>
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Data do Pagamento *"
                    value={dadosPagamento.dataPagamento}
                    onChange={(e) => setDadosPagamento({ ...dadosPagamento, dataPagamento: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Forma de Pagamento *</InputLabel>
                    <Select
                      value={dadosPagamento.formaPagamento}
                      onChange={(e) => setDadosPagamento({ ...dadosPagamento, formaPagamento: e.target.value })}
                      label="Forma de Pagamento *"
                    >
                      {formasPagamento.map(forma => (
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
                    rows={2}
                    label="Observações"
                    value={dadosPagamento.observacoes}
                    onChange={(e) => setDadosPagamento({ ...dadosPagamento, observacoes: e.target.value })}
                    placeholder="Ex: Pago com desconto, parcela antecipada..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={uploadandoAnexo ? <CloudDone /> : <CloudUpload />}
                    disabled={uploadandoAnexo}
                  >
                    {uploadandoAnexo ? 'Enviando...' : 'Anexar Comprovante de Pagamento'}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const comprovante = await handleUploadAnexo(file);
                          if (comprovante) {
                            setDadosPagamento({ ...dadosPagamento, comprovante });
                          }
                        }
                      }}
                    />
                  </Button>

                  {dadosPagamento.comprovante && (
                    <Chip
                      label={dadosPagamento.comprovante.nome}
                      icon={<CheckCircle />}
                      color="success"
                      onDelete={() => setDadosPagamento({ ...dadosPagamento, comprovante: null })}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>
              </Grid>

              {modalPagamento.conta.valor > saldoDisponivel && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    ⚠️ Atenção: O saldo disponível ({formatarMoeda(saldoDisponivel)}) é menor que o valor da conta.
                  </Typography>
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalPagamento({ aberto: false, conta: null })}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={handlePagarConta}
            disabled={uploadandoAnexo}
          >
            Confirmar Pagamento
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

      {/* Modal Detalhes */}
      <Dialog
        open={modalDetalhes.aberto}
        onClose={() => setModalDetalhes({ aberto: false, conta: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">👁️ Detalhes da Conta</Typography>
            <IconButton onClick={() => setModalDetalhes({ aberto: false, conta: null })} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {modalDetalhes.conta && (
            <Grid container spacing={2}>
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
                  💰 Valor
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {formatarMoeda(modalDetalhes.conta.valor)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">
                  📅 Vencimento
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatarData(modalDetalhes.conta.vencimento)}
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

              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">
                  🏷️ Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {modalDetalhes.conta.status === 'pago' ? (
                    <Chip
                      icon={<CheckCircle />}
                      label="Pago"
                      color="success"
                    />
                  ) : (
                    <Chip
                      icon={<Schedule />}
                      label="Pendente"
                      color="warning"
                    />
                  )}
                </Box>
              </Grid>

              {modalDetalhes.conta.dataPagamento && (
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    💳 Pago em
                  </Typography>
                  <Typography variant="body1">
                    {formatarData(modalDetalhes.conta.dataPagamento)}
                  </Typography>
                  {modalDetalhes.conta.formaPagamento && (
                    <Typography variant="caption" color="text.secondary">
                      {formasPagamento.find(f => f.value === modalDetalhes.conta.formaPagamento)?.label || modalDetalhes.conta.formaPagamento}
                    </Typography>
                  )}
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

              {modalDetalhes.conta.recorrente && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      🔄 Esta é uma conta recorrente ({modalDetalhes.conta.tipoRecorrencia})
                    </Typography>
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

      {/* Modal Excluir */}
      <Dialog
        open={modalExcluir.aberto}
        onClose={() => setModalExcluir({ aberto: false, conta: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <Warning color="error" />
            <Typography variant="h6">Excluir Conta</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {modalExcluir.conta && (
            <>
              <Typography variant="body1" gutterBottom>
                Tem certeza que deseja excluir esta conta?
              </Typography>
              <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2">
                  <strong>Descrição:</strong> {modalExcluir.conta.descricao}
                </Typography>
                <Typography variant="body2">
                  <strong>Valor:</strong> {formatarMoeda(modalExcluir.conta.valor)}
                </Typography>
                <Typography variant="body2">
                  <strong>Vencimento:</strong> {formatarData(modalExcluir.conta.vencimento)}
                </Typography>
              </Paper>
              <Alert severity="error" sx={{ mt: 2 }}>
                Esta ação não pode ser desfeita!
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalExcluir({ aberto: false, conta: null })}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="error"
            startIcon={<Delete />}
            onClick={() => {
              onExcluir && onExcluir(modalExcluir.conta);
              setModalExcluir({ aberto: false, conta: null });
              mostrarSnackbar('Conta excluída com sucesso', 'success');
            }}
          >
            Excluir
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

export default ContasAPagarMelhorado;
