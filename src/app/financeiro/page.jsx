"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SidebarMenu from '../../components/SidebarMenu';
import ProtectedRoute from '../../components/ProtectedRoute';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Tab,
  Tabs,
  CircularProgress,
  Avatar,
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Fab,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Pagination,
  Stack,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Backdrop,
  Divider
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  Receipt,
  Add,
  Edit,
  Payment,
  Print,
  FileDownload,
  Search,
  FilterList,
  Visibility,
  AutoAwesome,
  AccountBalance,
  MonetizationOn,
  Assessment,
  School,
  PhotoCamera,
  CheckCircleOutlined,
  CancelOutlined,
  AttachFile,
  CloudUpload,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { auth, onAuthStateChanged } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';


import GeradorMensalidadesDialog from '../../components/GeradorMensalidadesDialog';
import DashboardFinanceiro from '../../components/DashboardFinanceiro';
import BaixaTituloDialog from '../../components/BaixaTituloDialog';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
import { useSchoolServices } from '../../hooks/useSchoolServices';

const FinanceiroPage = () => {
  // Services multi-tenant
  const { auditService, financeiroService, LOG_ACTIONS, isReady: servicesReady, currentSchool: serviceSchool } = useSchoolServices();

  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  console.log('🏦 [FinanceiroPage] Componente carregado');

  // 🔍 Debug inicial
  useEffect(() => {
    console.log('🔍 [FinanceiroPage] Estado Inicial:', {
      servicesReady,
      isReady,
      hasFinanceiroService: !!financeiroService,
      hasAuditService: !!auditService,
      currentSchool: currentSchool?.nome,
      serviceSchool: serviceSchool?.nome,
      dbError
    });
  }, [servicesReady, isReady, financeiroService, auditService, currentSchool, serviceSchool, dbError]);

  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [userRole, setUserRole] = useState(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Função para obter aba inicial baseada no parâmetro da URL
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    // Para coordenadora: 0=Dashboard, 1=Títulos, 2=Créditos, 3=C.Pagar, 4=C.Pagas, 5=Relatórios
    // Para pai: 0=Dashboard(disabled), 1=Títulos, 2=Créditos
    switch(tabParam) {
      case 'titulos': return 1;
      case 'creditos': return 2;
      case 'contas-pagar': return 3;
      case 'contas-pagas': return 4;
      case 'relatorios': return 5;
      default: return 0;
    }
  };
  
  const [tabValue, setTabValue] = useState(getInitialTab);
  
  // Atualizar aba quando os parâmetros da URL mudarem
  useEffect(() => {
    const newTab = getInitialTab();
    setTabValue(newTab);
  }, [searchParams]);
  
  const [userId, setUserId] = useState(null);
  
  // Estados dos dados
  const [alunos, setAlunos] = useState([]);
  const [titulos, setTitulos] = useState([]);
  const [turmas, setTurmas] = useState({});
  const [metricas, setMetricas] = useState({
    receitaMensal: 0,
    receitaAnual: 0,
    inadimplentes: 0,
    valorInadimplencia: 0,
    taxaInadimplencia: 0,
    proximosVencimentos: 0,
    totalAlunos: 0,
    alunosAtivos: 0,
    alunosInadimplentes: 0
  });

  // Estados dos dialogs
  const [novoTituloDialog, setNovoTituloDialog] = useState(false);
  const [baixaDialog, setBaixaDialog] = useState(false);
  const [geradorMensalidadesDialog, setGeradorMensalidadesDialog] = useState(false);
  const [pagamentoDialog, setPagamentoDialog] = useState(false);
  const [comprovanteDialog, setComprovanteDialog] = useState(false);
  const [tituloSelecionado, setTituloSelecionado] = useState(null);
  const [calculoJurosMultaPai, setCalculoJurosMultaPai] = useState(null);
  
  // Estados para anexo de boleto/PIX
  const [anexoBoletoDialog, setAnexoBoletoDialog] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [uploadandoAnexo, setUploadandoAnexo] = useState(false);
  const [tituloParaAnexo, setTituloParaAnexo] = useState(null);
  
  // Estados dos formulários
  const [novoTitulo, setNovoTitulo] = useState({
    alunoId: '',
    tipo: 'mensalidade',
    descricao: '',
    valor: '',
    vencimento: '',
    observacoes: ''
  });

  // Estados dos filtros - separados por aba
  const [filtrosTitulos, setFiltrosTitulos] = useState({
    aluno: '',
    turma: '',
    tipo: '',
    status: '',
    dataInicio: '',
    dataFim: ''
  });

  const [filtrosContasPagar, setFiltrosContasPagar] = useState({
    categoria: '',
    fornecedor: '',
    status: ''
  });

  const [filtrosContasPagas, setFiltrosContasPagas] = useState({
    dataInicio: '',
    dataFim: ''
  });

  // Estados dos relatórios
  const [relatorios, setRelatorios] = useState({
    dialogOpen: false,
    tipoRelatorio: '',
    dadosRelatorio: null,
    periodoRelatorio: {
      dataInicio: '',
      dataFim: '',
      periodo: 'atual'
    },
    filtroAlunos: [] // Array de IDs dos alunos selecionados
  });

  // Estado para detalhes do título
  const [detalheTitulo, setDetalheTitulo] = useState({
    dialogOpen: false,
    titulo: null
  });

  // Estado para pagamento
  const [pagamento, setPagamento] = useState({
    observacoes: '',
    comprovante: null,
    carregando: false
  });

  // Estados da paginação
  const [paginacao, setPaginacao] = useState({
    paginaAtual: 1,
    itensPorPagina: 20,
    totalPaginas: 1
  });

  // Estados das contas a pagar/pagas
  const [contasPagar, setContasPagar] = useState([]);
  const [contasPagas, setContasPagas] = useState([]);
  const [saldoEscola, setSaldoEscola] = useState(0);
  const [novaContaDialog, setNovaContaDialog] = useState(false);
  const [pagamentoContaDialog, setPagamentoContaDialog] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(null);
  const [dialogPagamentoConta, setDialogPagamentoConta] = useState({ open: false, conta: null });
  const [pagamentoConta, setPagamentoConta] = useState({
    dataPagamento: '',
    formaPagamento: '',
    observacoes: ''
  });

  // Estados para feedback modal e loading
  const [feedbackModal, setFeedbackModal] = useState({ open: false, type: '', title: '', message: '' });
  const [processingOperation, setProcessingOperation] = useState(false);

  // Estado para permitir saldo negativo
  const [permitirSaldoNegativo, setPermitirSaldoNegativo] = useState(false);

  // Estados para controle de período
  const [periodoSelecionado, setPeriodoSelecionado] = useState(new Date());
  const [exibirPorPeriodo, setExibirPorPeriodo] = useState(false);
  const [novaConta, setNovaConta] = useState({
    descricao: '',
    categoria: '',
    valor: '',
    vencimento: '',
    fornecedor: '',
    observacoes: '',
    recorrente: false,
    tipoRecorrencia: 'mensal',
    jaFoiPaga: false,
    dataPagamento: '',
    formaPagamento: '',
    anexos: []
  });

  // Estados para controle mensal
  const [mesAtual, setMesAtual] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    fechado: false
  });
  const [dialogFecharMes, setDialogFecharMes] = useState(false);

  // Função para mostrar feedback modal
  const showFeedback = (type, title, message) => {
    setFeedbackModal({ open: true, type, title, message });
  };

  // Função para fechar feedback modal
  const closeFeedback = () => {
    setFeedbackModal({ open: false, type: '', title: '', message: '' });
  };

  // Função para obter períodos disponíveis
  const obterPeriodosDisponiveis = () => {
    const periodos = [];
    const hoje = new Date();
    
    // 6 meses para trás
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      periodos.push(data);
    }
    
    // 6 meses para frente
    for (let i = 1; i <= 6; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      periodos.push(data);
    }
    
    return periodos;
  };

  // Função para filtrar contas por período selecionado
  const filtrarContasPorPeriodo = (contas) => {
    if (!exibirPorPeriodo) return contas;
    
    const anoSelecionado = periodoSelecionado.getFullYear();
    const mesSelecionado = periodoSelecionado.getMonth();
    
    return contas.filter(conta => {
      const dataVencimento = new Date(conta.vencimento);
      return dataVencimento.getFullYear() === anoSelecionado && 
             dataVencimento.getMonth() === mesSelecionado;
    });
  };

  // Função para obter apenas contas realmente pendentes (não pagas)
  const obterContasPendentes = () => {
    return contasPagar.filter(conta => conta.status !== 'paga');
  };

  // Função para calcular estatísticas das contas pendentes
  const calcularEstatisticasPendentes = () => {
    const contasPendentesReais = obterContasPendentes();
    const totalPendentes = contasPendentesReais.length;
    const valorTotalPendente = contasPendentesReais.reduce((sum, conta) => sum + conta.valor, 0);
    
    return {
      quantidade: totalPendentes,
      valorTotal: valorTotalPendente
    };
  };

  // Listener de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setUserRole(null);
        setRoleChecked(true);
        // Evitar redirecionamento se já estamos na página de login ou se é a primeira carga
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          router.push('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Helper function para verificar se é coordenador(a)
  const isCoordenador = () => {
    return userRole === 'coordenadora' || userRole === 'coordenador';
  };

  const isProfessor = () => {
    return userRole === 'professora' || userRole === 'professor';
  };

  const isPai = () => {
    return userRole === 'pai' || userRole === 'mae';
  };

  // Verificar role do usuário
  useEffect(() => {
    async function fetchRole() {
      if (!userId) {
        setUserRole(null);
        setRoleChecked(true);
        return;
      }
      
      if (!isReady) {
        console.log('⏳ Aguardando conexão com banco da escola...');
        return;
      }
      
      try {
        const userData = await getData(`usuarios/${userId}`);
        if (userData) {
          setUserRole((userData.role || '').trim().toLowerCase());
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        setUserRole(null);
      }
      setRoleChecked(true);
    }
    fetchRole();
  }, [userId, isReady, getData]);

  // Carregar dados conforme a role
  useEffect(() => {
    // 🔒 Verificar se tudo está pronto antes de buscar dados
    if (roleChecked && userRole && isReady && servicesReady) {
      console.log('✅ Sistema pronto, carregando dados financeiros...');
      fetchData();
      // Definir tab inicial baseada no perfil APENAS se não houver parâmetro de tab na URL
      const tabParam = searchParams.get('tab');
      if (!tabParam) {
        if (isPai()) {
          setTabValue(1); // Tab de títulos para pais
        } else {
          setTabValue(0); // Tab de dashboard para coordenadores/professores
        }
      }
    } else {
      console.log('⏳ Aguardando sistema estar pronto:', {
        roleChecked,
        userRole,
        isReady,
        servicesReady
      });
    }
  }, [roleChecked, userRole, userId, isReady, servicesReady]);

  // Recalcular métricas quando os dados mudarem
  useEffect(() => {
    if (isCoordenador() && titulos.length > 0 && alunos.length > 0) {
      console.log('🔄 Dados carregados, recalculando métricas...', {
        titulos: titulos.length,
        alunos: alunos.length
      });
      calcularMetricas();
    }
  }, [titulos, alunos, userRole]);

  // useEffect para carregar dados do mês atual
  useEffect(() => {
    if (userId && financeiroService) {
      carregarDadosMesAtual();
      // Configurar filtro padrão para contas pagas do mês atual
      const inicio = `${mesAtual.ano}-${mesAtual.mes.toString().padStart(2, '0')}-01`;
      const fim = new Date(mesAtual.ano, mesAtual.mes, 0).toISOString().split('T')[0];
      setFiltrosContasPagas(prev => ({ ...prev, dataInicio: inicio, dataFim: fim }));
    }
  }, [userId, mesAtual.mes, mesAtual.ano, financeiroService]);

  // useEffect para recarregar contas quando período selecionado mudar
  useEffect(() => {
    if (userId && exibirPorPeriodo && isReady) {
      fetchContasPagar();
    }
  }, [exibirPorPeriodo, periodoSelecionado, userId, isReady]);

  // Aplicar filtros da URL aos filtros de títulos
  useEffect(() => {
    // Só aplicar se os dados estiverem carregados e houver parâmetros na URL
    if (alunos.length === 0) return;
    
    const alunoParam = searchParams.get('aluno');
    const statusParam = searchParams.get('status');
    const vencidosParam = searchParams.get('vencidos');
    const tipoParam = searchParams.get('tipo');
    
    // Aplicar filtros apenas se houver parâmetros na URL
    if (alunoParam || statusParam || vencidosParam || tipoParam) {
      console.log('🔍 [Financeiro] Aplicando filtros da URL:', {
        aluno: alunoParam,
        status: statusParam,
        vencidos: vencidosParam,
        tipo: tipoParam
      });
      
      // Determinar se alunoParam é um ID ou nome
      let alunoFiltro = alunoParam;
      if (alunoParam && alunos.length > 0) {
        // Verificar se é um ID válido
        const alunoEncontrado = alunos.find(a => a.id === alunoParam);
        if (alunoEncontrado) {
          // É um ID válido, usar o ID para o filtro
          alunoFiltro = alunoParam;
        } else {
          // Não é um ID, usar como nome
          alunoFiltro = alunoParam;
        }
      }
      
      setFiltrosTitulos(prev => ({
        ...prev,
        aluno: alunoFiltro || prev.aluno,
        status: statusParam || prev.status,
        tipo: tipoParam || prev.tipo,
        // Se vencidos=true, definir data fim como hoje para mostrar apenas vencidos
        ...(vencidosParam === 'true' && {
          dataFim: new Date().toISOString().split('T')[0]
        })
      }));
    }
  }, [searchParams, alunos]);

  // Função para carregar dados do mês atual
  const carregarDadosMesAtual = async () => {
    // 🔒 Verificar se serviço está disponível
    if (!financeiroService) {
      console.log('⏳ [carregarDadosMesAtual] Aguardando financeiroService...');
      return;
    }

    try {
      const result = await financeiroService.verificarMesFechado(mesAtual.mes, mesAtual.ano);
      if (result.success) {
        setMesAtual(prev => ({ ...prev, fechado: result.fechado }));
        console.log('✅ Status do mês carregado:', result.fechado);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status do mês:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isCoordenador()) {
        // Coordenador(a) vê tudo
        await fetchAlunos();
        await fetchTitulos();
        await fetchTurmas();
        await fetchContasPagar();
        await fetchContasPagas();
        await fetchSaldoEscola();
        // calcularMetricas será chamado pelo useEffect quando os dados estiverem prontos
      } else if (isProfessor()) {
        // Professor(a) vê dados básicos
        await Promise.all([
          fetchAlunosBasico(),
          calcularMetricasBasicas()
        ]);
      } else if (isPai()) {
        // Pai/Mãe vê apenas seus títulos
        await Promise.all([
          fetchTitulosPai(),
          fetchTurmas() // Necessário para exibir nomes das turmas
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlunos = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    try {
      const alunosDataRaw = await getData('alunos');
      if (alunosDataRaw) {
        const alunosData = Object.entries(alunosDataRaw).map(([id, aluno]) => ({
          id,
          ...aluno
        }));
        setAlunos(alunosData);
        console.log('👥 Alunos carregados:', alunosData.length);
      } else {
        setAlunos([]);
        console.log('👥 Nenhum aluno encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    }
  };

  const fetchAlunosBasico = async () => {
    // Para professora, apenas dados não sensíveis
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    try {
      const alunosDataRaw = await getData('alunos');
      if (alunosDataRaw) {
        const alunosData = Object.entries(alunosDataRaw).map(([id, aluno]) => ({
          id,
          nome: aluno.nome,
          matricula: aluno.matricula,
          turmaId: aluno.turmaId,
          status: aluno.status,
          financeiro: {
            status: aluno.financeiro?.status || 'ativo'
          }
        }));
        setAlunos(alunosData);
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    }
  };

  const fetchTitulos = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    try {
      const titulosDataRaw = await getData('titulos_financeiros');
      if (titulosDataRaw) {
        const titulosData = Object.entries(titulosDataRaw).map(([id, titulo]) => ({
          id,
          ...titulo
        }));
        setTitulos(titulosData);
        console.log('📋 Títulos carregados:', titulosData.length);
      } else {
        setTitulos([]);
        console.log('📋 Nenhum título encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar títulos:', error);
    }
  };

  const fetchTurmas = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    try {
      const turmasDataRaw = await getData('turmas');
      if (turmasDataRaw) {
        setTurmas(turmasDataRaw);
        console.log('🏫 Turmas carregadas:', Object.keys(turmasDataRaw).length);
      } else {
        setTurmas({});
        console.log('🏫 Nenhuma turma encontrada');
      }
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
    }
  };

  const fetchTitulosPai = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    try {
      // Buscar filhos do pai logado
      const userData = await getData(`usuarios/${userId}`);
      
      if (userData) {
        const alunosIds = userData.alunosVinculados || [];
        
        if (alunosIds.length > 0) {
          // Buscar dados dos alunos vinculados
          const todosAlunosRaw = await getData('alunos');
          
          if (todosAlunosRaw) {
            const todosAlunos = Object.entries(todosAlunosRaw)
              .map(([id, aluno]) => ({ id, ...aluno }));
            
            // Filtrar apenas os alunos vinculados ao pai
            const alunosVinculados = todosAlunos.filter(aluno => alunosIds.includes(aluno.id));
            setAlunos(alunosVinculados);
          }
          
          // Buscar títulos dos alunos vinculados
          const titulosDataRaw = await getData('titulos_financeiros');
          
          if (titulosDataRaw) {
            const titulosData = Object.entries(titulosDataRaw)
              .filter(([id, titulo]) => alunosIds.includes(titulo.alunoId))
              .map(([id, titulo]) => ({
                id,
                ...titulo
              }));
            setTitulos(titulosData);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar títulos do pai:', error);
    }
  };

  const calcularMetricas = () => {
    console.log('🔍 Iniciando calcularMetricas...', { 
      titulosLength: titulos.length, 
      alunosLength: alunos.length 
    });
    
    // Verificar se os dados estão carregados
    if (!titulos || titulos.length === 0) {
      console.log('⚠️ Títulos não carregados ainda, pulando cálculo');
      return;
    }
    
    if (!alunos || alunos.length === 0) {
      console.log('⚠️ Alunos não carregados ainda, pulando cálculo');
      return;
    }

    const hoje = new Date();
    const mesAtual = hoje.getMonth(); // 0-11
    const anoAtual = hoje.getFullYear();
    
    console.log('� Debug - Cálculo de métricas');
    console.log('📅 Data atual:', { hoje: hoje.toISOString(), mesAtual, anoAtual });
    console.log('📊 Total de títulos:', titulos.length);
    console.log('👥 Total de alunos:', alunos.length);
    
    // Filtrar títulos pagos para análise
    const titulosPagos = titulos.filter(t => t.status === 'pago');
    console.log('💰 Títulos pagos encontrados:', titulosPagos.length);
    
    // Log de todos os títulos pagos
    titulosPagos.forEach((titulo, index) => {
      // Validar e criar datas com fallback para data atual
      const vencimento = titulo.vencimento ? new Date(titulo.vencimento) : new Date();
      const dataPagamento = titulo.dataPagamento ? new Date(titulo.dataPagamento) : null;
      
      // Verificar se as datas são válidas
      const vencimentoValido = vencimento instanceof Date && !isNaN(vencimento);
      const dataPagamentoValida = dataPagamento instanceof Date && !isNaN(dataPagamento);
      
      // Usar data válida ou fallback para data atual
      const dataReferencia = (dataPagamentoValida && dataPagamento) || 
                            (vencimentoValido && vencimento) || 
                            new Date();
      
      console.log(`Título pago ${index + 1}:`, {
        descricao: titulo.descricao,
        valor: titulo.valor,
        valorTipo: typeof titulo.valor,
        valorNumerico: parseFloat(titulo.valor),
        vencimento: titulo.vencimento,
        dataPagamento: titulo.dataPagamento,
        vencimentoValido,
        dataPagamentoValida,
        dataReferencia: dataReferencia.toISOString(),
        mesReferencia: dataReferencia.getMonth(),
        anoReferencia: dataReferencia.getFullYear(),
        ehDoMesAtual: dataReferencia.getMonth() === mesAtual && dataReferencia.getFullYear() === anoAtual,
        ehDoAnoAtual: dataReferencia.getFullYear() === anoAtual
      });
    });
    
    // Função auxiliar para converter valores para números
    const converterParaNumero = (valor) => {
      if (typeof valor === 'number') return valor;
      if (typeof valor === 'string') {
        // Remove caracteres não numéricos exceto ponto e vírgula
        const valorLimpo = valor.replace(/[^\d.,]/g, '').replace(',', '.');
        return parseFloat(valorLimpo) || 0;
      }
      return 0;
    };

    // Inicializar variáveis como números explícitos
    let receitaMensal = Number(0);
    let receitaAnual = Number(0);
    let proximosVencimentos = Number(0);
    let inadimplentesCount = 0;
    let valorInadimplencia = Number(0);

    // Analisar títulos
    console.log(`🔍 Iniciando análise de ${titulos.length} títulos:`);
    titulos.forEach((titulo, index) => {
      console.log(`📋 Título ${index + 1}:`, {
        descricao: titulo.descricao,
        valor: titulo.valor,
        valorTipo: typeof titulo.valor,
        status: titulo.status,
        vencimento: titulo.vencimento
      });
      
      const vencimento = titulo.vencimento ? new Date(titulo.vencimento) : new Date();
      const valorTitulo = converterParaNumero(titulo.valor);
      const dataPagamento = titulo.dataPagamento ? new Date(titulo.dataPagamento) : null;
      
      // Validar se as datas são válidas
      const vencimentoValido = vencimento instanceof Date && !isNaN(vencimento);
      const dataPagamentoValida = dataPagamento instanceof Date && !isNaN(dataPagamento);
      
      console.log(`🔄 Valor convertido: "${titulo.valor}" -> ${valorTitulo} (tipo: ${typeof valorTitulo})`);
      
      // Receita mensal: títulos pagos no mês atual (usar data de pagamento se disponível, senão vencimento)
      if (titulo.status === 'pago') {
        const dataReferencia = (dataPagamentoValida && dataPagamento) || 
                              (vencimentoValido && vencimento) || 
                              new Date();
        
        if (dataReferencia.getMonth() === mesAtual && dataReferencia.getFullYear() === anoAtual) {
          const anteriorMensal = Number(receitaMensal);
          const valorNumerico = Number(valorTitulo);
          receitaMensal = Number(anteriorMensal + valorNumerico);
          console.log(`💰 Receita mensal: ${anteriorMensal} + ${valorNumerico} = ${receitaMensal} | ${titulo.descricao} | Valor original: "${titulo.valor}" | Tipos: ${typeof anteriorMensal}, ${typeof valorNumerico}, ${typeof receitaMensal}`);
        }
        if (dataReferencia.getFullYear() === anoAtual) {
          const valorNumerico = Number(valorTitulo);
          receitaAnual = Number(receitaAnual + valorNumerico);
        }
      }
      
      // Títulos pendentes
      if (titulo.status === 'pendente') {
        const diasParaVencimento = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
        
        // Próximos vencimentos (próximos 7 dias)
        if (diasParaVencimento <= 7 && diasParaVencimento >= 0) {
          const valorNumerico = Number(valorTitulo);
          proximosVencimentos = Number(proximosVencimentos + valorNumerico);
        }
        
        // Inadimplentes (vencidos)
        if (diasParaVencimento < 0) {
          inadimplentesCount++;
          const valorNumerico = Number(valorTitulo);
          valorInadimplencia = Number(valorInadimplencia + valorNumerico);
        }
      }
    });

    // Analisar alunos
    console.log('👥 Analisando alunos...');
    const alunosAtivos = alunos.filter(a => a.status === 'ativo' || a.status === 'pre_matricula').length;
    const alunosInadimplentes = alunos.filter(a => a.financeiro?.status === 'inadimplente').length;
    const taxaInadimplencia = alunosAtivos > 0 ? (alunosInadimplentes / alunosAtivos) * 100 : 0;

    console.log('📈 Resultados finais:', {
      receitaMensal: {
        valor: receitaMensal,
        tipo: typeof receitaMensal,
        valido: Number.isFinite(receitaMensal),
        formatada: `R$ ${receitaMensal.toFixed(2)}`
      },
      receitaAnual: {
        valor: receitaAnual,
        tipo: typeof receitaAnual,
        valido: Number.isFinite(receitaAnual),
        formatada: `R$ ${receitaAnual.toFixed(2)}`
      },
      proximosVencimentos: `R$ ${proximosVencimentos.toFixed(2)}`,
      inadimplentesCount,
      valorInadimplencia: `R$ ${valorInadimplencia.toFixed(2)}`,
      alunosAtivos,
      alunosInadimplentes,
      taxaInadimplencia: `${taxaInadimplencia.toFixed(1)}%`
    });

    console.log('🔧 Valores antes de setMetricas:', {
      receitaMensal: { valor: receitaMensal, tipo: typeof receitaMensal },
      receitaAnual: { valor: receitaAnual, tipo: typeof receitaAnual },
      convertidos: {
        receitaMensal: Number.isFinite(Number(receitaMensal)) ? Number(receitaMensal) : 0,
        receitaAnual: Number.isFinite(Number(receitaAnual)) ? Number(receitaAnual) : 0
      }
    });

    const metricasData = {
      receitaMensal: Number.isFinite(Number(receitaMensal)) ? Number(receitaMensal) : 0,
      receitaAnual: Number.isFinite(Number(receitaAnual)) ? Number(receitaAnual) : 0,
      inadimplentes: inadimplentesCount,
      valorInadimplencia: Number.isFinite(Number(valorInadimplencia)) ? Number(valorInadimplencia) : 0,
      taxaInadimplencia,
      proximosVencimentos: Number.isFinite(Number(proximosVencimentos)) ? Number(proximosVencimentos) : 0,
      totalAlunos: alunos.length,
      alunosAtivos,
      alunosInadimplentes
    };

    console.log('📊 Métricas finais sendo definidas:', metricasData);
    setMetricas(metricasData);
  };

  const calcularMetricasBasicas = () => {
    const alunosAtivos = alunos.filter(a => a.status === 'ativo' || a.status === 'pre_matricula').length;
    const alunosInadimplentes = alunos.filter(a => a.financeiro?.status === 'inadimplente').length;
    const taxaInadimplencia = alunosAtivos > 0 ? (alunosInadimplentes / alunosAtivos) * 100 : 0;



    setMetricas({
      totalAlunos: alunos.length,
      alunosAtivos,
      alunosInadimplentes,
      taxaInadimplencia,
      receitaMensal: 0, // Não mostrar para professora
      receitaAnual: 0,
      inadimplentes: alunosInadimplentes,
      proximosVencimentos: 0,
      valorInadimplencia: 0
    });
  };

  const handleGerarTitulo = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    try {
      const tituloData = {
        ...novoTitulo,
        valor: parseFloat(novoTitulo.valor),
        status: 'pendente',
        dataGeracao: new Date().toISOString(),
        geradoPor: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const novoTituloId = await pushData('titulos_financeiros', tituloData);

      // Log da ação
      await auditService.auditService?.logAction('titulo_create', userId, {
        entityId: novoTituloId,
        description: `Título gerado: ${novoTitulo.tipo} - ${novoTitulo.descricao}`,
        changes: { valor: novoTitulo.valor, vencimento: novoTitulo.vencimento }
      });

      setNovoTituloDialog(false);
      setNovoTitulo({
        alunoId: '',
        tipo: 'mensalidade',
        descricao: '',
        valor: '',
        vencimento: '',
        observacoes: ''
      });

      fetchTitulos();
    } catch (error) {
      console.error('Erro ao gerar título:', error);
    }
  };

  // Funções de pagamento
  const abrirDialogPagamento = (titulo) => {
    setTituloSelecionado(titulo);
    setPagamento({
      observacoes: '',
      comprovante: null,
      carregando: false
    });
    
    // Calcular juros e multa se houver atraso
    if (financeiroService && financeiroService.calcularJurosMulta) {
      const calculo = financeiroService.calcularJurosMulta(titulo);
      setCalculoJurosMultaPai(calculo);
    } else {
      setCalculoJurosMultaPai(null);
    }
    
    setPagamentoDialog(true);
  };

  const handleComprovanteChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!tiposPermitidos.includes(file.type)) {
        showFeedback('error', 'Arquivo Inválido', 'Tipo de arquivo não permitido. Use apenas JPG, PNG ou PDF.');
        event.target.value = '';
        return;
      }

      // Validar tamanho (máximo 5MB)
      const tamanhoMaximo = 5 * 1024 * 1024; // 5MB
      if (file.size > tamanhoMaximo) {
        showFeedback('error', 'Arquivo Muito Grande', 'Arquivo muito grande. O tamanho máximo é 5MB.');
        event.target.value = '';
        return;
      }

      setPagamento({
        ...pagamento,
        comprovante: file
      });
    }
  };

  const enviarPagamento = async () => {
    if (!pagamento.comprovante) {
      showFeedback('error', 'Comprovante Necessário', 'Por favor, anexe um comprovante de pagamento.');
      return;
    }

    setPagamento({ ...pagamento, carregando: true });

    try {
      // Upload real do comprovante para Firebase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}_${pagamento.comprovante.name}`;
      const comprovanteRef = storageRef(schoolStorage._storage, `comprovantes_pagamento/${fileName}`);
      
      // Fazer upload do arquivo
      console.log('📤 Iniciando upload do comprovante...');
      await uploadBytes(comprovanteRef, pagamento.comprovante);
      
      // Obter URL de download
      const comprovanteUrl = await getDownloadURL(comprovanteRef);
      console.log('✅ Upload concluído. URL:', comprovanteUrl);

      // Atualizar título para "em análise"
      const atualizacao = {
        ...tituloSelecionado,
        status: 'em_analise',
        pagamento: {
          dataEnvio: new Date().toISOString(),
          observacoes: pagamento.observacoes,
          comprovanteUrl: comprovanteUrl,
          comprovanteNome: pagamento.comprovante.name,
          comprovanteTipo: pagamento.comprovante.type,
          comprovanteTamanho: pagamento.comprovante.size,
          enviadoPor: userId
        },
        updatedAt: new Date().toISOString()
      };

      await setData(`titulos_financeiros/${tituloSelecionado.id}`, atualizacao);

      // Log da ação
      await auditService.auditService?.logAction('pagamento_enviado', userId, {
        entityId: tituloSelecionado.id,
        description: `Comprovante enviado para o título: ${tituloSelecionado.descricao}`,
        changes: { status: 'em_analise', comprovanteUrl }
      });

      setPagamentoDialog(false);
      fetchTitulos();
      showFeedback('success', 'Comprovante Enviado', 'Comprovante enviado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao enviar pagamento:', error);
      showFeedback('error', 'Erro no Envio', 'Erro ao enviar pagamento. Tente novamente.');
    } finally {
      setPagamento({ ...pagamento, carregando: false });
    }
  };

  const aprovarPagamento = async (titulo) => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    try {
      const atualizacao = {
        ...titulo,
        status: 'pago',
        dataPagamento: new Date().toISOString(), // Adicionar data de pagamento
        pagamento: {
          ...titulo.pagamento,
          dataAprovacao: new Date().toISOString(),
          aprovadoPor: userId
        },
        updatedAt: new Date().toISOString()
      };

      await setData(`titulos_financeiros/${titulo.id}`, atualizacao);

      // Log da ação
      await auditService.auditService?.logAction('pagamento_aprovado', userId, {
        entityId: titulo.id,
        description: `Pagamento aprovado para o título: ${titulo.descricao}`,
        changes: { status: 'pago', dataPagamento: atualizacao.dataPagamento }
      });

      fetchTitulos();
      
    } catch (error) {
      console.error('Erro ao aprovar pagamento:', error);
      showFeedback('error', 'Erro na Aprovação', 'Erro ao aprovar pagamento. Tente novamente.');
    }
  };

  // Funções para anexo de boleto/PIX
  const handleAbrirAnexoBoleto = (titulo) => {
    setTituloParaAnexo(titulo);
    setArquivoSelecionado(null);
    setAnexoBoletoDialog(true);
  };

  const handleArquivoSelecionado = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!tiposPermitidos.includes(file.type)) {
        showFeedback('error', 'Arquivo Inválido', 'Tipo de arquivo não permitido. Use apenas JPG, PNG ou PDF.');
        event.target.value = '';
        return;
      }

      // Validar tamanho (máximo 5MB)
      const tamanhoMaximo = 5 * 1024 * 1024; // 5MB
      if (file.size > tamanhoMaximo) {
        showFeedback('error', 'Arquivo Muito Grande', 'Arquivo muito grande. O tamanho máximo é 5MB.');
        event.target.value = '';
        return;
      }

      setArquivoSelecionado(file);
    }
  };

  const handleUploadAnexoBoleto = async () => {
    if (!arquivoSelecionado || !tituloParaAnexo) {
      showFeedback('error', 'Arquivo Necessário', 'Por favor, selecione um arquivo.');
      return;
    }

    setUploadandoAnexo(true);

    try {
      // Upload do arquivo para Firebase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}_${arquivoSelecionado.name}`;
      const boletoRef = storageRef(schoolStorage._storage, `boletos_pix/${tituloParaAnexo.id}/${fileName}`);
      
      console.log('📤 Iniciando upload do boleto/PIX...');
      await uploadBytes(boletoRef, arquivoSelecionado);
      
      // Obter URL de download
      const boletoUrl = await getDownloadURL(boletoRef);
      console.log('✅ Boleto/PIX enviado com sucesso:', boletoUrl);

      // Atualizar título com o anexo
      const tituloAtualizado = {
        ...tituloParaAnexo,
        anexoBoleto: {
          url: boletoUrl,
          nome: arquivoSelecionado.name,
          dataUpload: new Date().toISOString(),
          uploadPor: userId
        },
        updatedAt: new Date().toISOString()
      };

      await setData(`titulos_financeiros/${tituloParaAnexo.id}`, tituloAtualizado);

      // Log da ação
      await auditService.auditService?.logAction('boleto_anexado', userId, {
        entityId: tituloParaAnexo.id,
        description: `Boleto/PIX anexado ao título: ${tituloParaAnexo.descricao}`,
        changes: { anexoBoleto: true }
      });

      setAnexoBoletoDialog(false);
      setArquivoSelecionado(null);
      setTituloParaAnexo(null);
      fetchTitulos();
      showFeedback('success', 'Boleto/PIX Anexado', 'Boleto/PIX anexado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao anexar boleto/PIX:', error);
      showFeedback('error', 'Erro no Upload', 'Erro ao anexar boleto/PIX. Tente novamente.');
    } finally {
      setUploadandoAnexo(false);
    }
  };

  const handleRemoverAnexoBoleto = async (titulo) => {
    if (!confirm('Deseja realmente remover este boleto/PIX?')) {
      return;
    }

    try {
      // Remover arquivo do Storage
      if (titulo.anexoBoleto?.url) {
        const fileRef = storageRef(schoolStorage._storage, titulo.anexoBoleto.url);
        await deleteObject(fileRef).catch(err => console.log('Arquivo já removido:', err));
      }

      // Atualizar título removendo o anexo
      const tituloAtualizado = {
        ...titulo,
        anexoBoleto: null,
        updatedAt: new Date().toISOString()
      };

      await setData(`titulos_financeiros/${titulo.id}`, tituloAtualizado);

      // Log da ação
      await auditService.auditService?.logAction('boleto_removido', userId, {
        entityId: titulo.id,
        description: `Boleto/PIX removido do título: ${titulo.descricao}`,
        changes: { anexoBoleto: null }
      });

      fetchTitulos();
      showFeedback('success', 'Boleto/PIX Removido', 'Boleto/PIX removido com sucesso!');
      
    } catch (error) {
      console.error('Erro ao remover boleto/PIX:', error);
      showFeedback('error', 'Erro na Remoção', 'Erro ao remover boleto/PIX. Tente novamente.');
    }
  };

  const rejeitarPagamento = async (titulo) => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    try {
      const atualizacao = {
        ...titulo,
        status: 'pendente',
        pagamento: {
          ...titulo.pagamento,
          dataRejeicao: new Date().toISOString(),
          rejeitadoPor: userId
        },
        updatedAt: new Date().toISOString()
      };

      await setData(`titulos_financeiros/${titulo.id}`, atualizacao);

      // Log da ação
      await auditService.auditService?.logAction('pagamento_rejeitado', userId, {
        entityId: titulo.id,
        description: `Pagamento rejeitado para o título: ${titulo.descricao}`,
        changes: { status: 'pendente' }
      });

      fetchTitulos();
      
    } catch (error) {
      console.error('Erro ao rejeitar pagamento:', error);
      showFeedback('error', 'Erro na Rejeição', 'Erro ao rejeitar pagamento. Tente novamente.');
    }
  };

  // Função para filtrar títulos
  const filtrarTitulos = () => {
    console.log('🔍 [filtrarTitulos] Filtros ativos:', filtrosTitulos);
    console.log('📋 [filtrarTitulos] Total de títulos:', titulos.length);
    
    const resultado = titulos.filter(titulo => {
      const aluno = alunos.find(a => a.id === titulo.alunoId);
      const alunoNome = aluno?.nome?.toLowerCase() || '';
      const alunoTurma = aluno?.turmaId || '';
      
      // Filtro por aluno (por nome ou ID)
      if (filtrosTitulos.aluno) {
        const filtroAluno = filtrosTitulos.aluno.toLowerCase();
        const matchNome = alunoNome.includes(filtroAluno);
        const matchId = titulo.alunoId === filtrosTitulos.aluno;
        
        console.log(`📊 [filtrarTitulos] Título: ${titulo.descricao} - Aluno: ${alunoNome} - Match: ${matchNome || matchId}`);
        
        if (!matchNome && !matchId) {
          return false;
        }
      }
      
      // Filtro por turma
      if (filtrosTitulos.turma && filtrosTitulos.turma !== 'todos' && alunoTurma !== filtrosTitulos.turma) {
        return false;
      }
      
      // Filtro por tipo
      if (filtrosTitulos.tipo && filtrosTitulos.tipo !== 'todos' && titulo.tipo !== filtrosTitulos.tipo) {
        return false;
      }
      
      // Filtro por status (considera status visual incluindo vencimento)
      if (filtrosTitulos.status && filtrosTitulos.status !== 'todos') {
        const statusVisual = getStatusVisual(titulo);
        if (statusVisual !== filtrosTitulos.status) {
          return false;
        }
      }
      
      // Filtro por data de vencimento
      if (filtrosTitulos.dataInicio || filtrosTitulos.dataFim) {
        const vencimento = new Date(titulo.vencimento);
        
        if (filtrosTitulos.dataInicio) {
          const dataInicio = new Date(filtrosTitulos.dataInicio);
          if (vencimento < dataInicio) return false;
        }
        
        if (filtrosTitulos.dataFim) {
          const dataFim = new Date(filtrosTitulos.dataFim);
          if (vencimento > dataFim) return false;
        }
      }
      
      return true;
    });
    
    console.log('✅ [filtrarTitulos] Títulos após filtros:', resultado.length);
    return resultado;
  };

  // Funções de paginação
  const obterTitulosPaginados = () => {
    const titulosFiltrados = filtrarTitulos();
    const totalPaginas = Math.ceil(titulosFiltrados.length / paginacao.itensPorPagina);
    
    // Atualizar total de páginas se necessário
    if (totalPaginas !== paginacao.totalPaginas) {
      setPaginacao(prev => ({ ...prev, totalPaginas }));
    }
    
    const inicio = (paginacao.paginaAtual - 1) * paginacao.itensPorPagina;
    const fim = inicio + paginacao.itensPorPagina;
    
    return titulosFiltrados.slice(inicio, fim);
  };

  const irParaPagina = (pagina) => {
    if (pagina >= 1 && pagina <= paginacao.totalPaginas) {
      setPaginacao(prev => ({ ...prev, paginaAtual: pagina }));
    }
  };

  const proximaPagina = () => {
    if (paginacao.paginaAtual < paginacao.totalPaginas) {
      setPaginacao(prev => ({ ...prev, paginaAtual: prev.paginaAtual + 1 }));
    }
  };

  const paginaAnterior = () => {
    if (paginacao.paginaAtual > 1) {
      setPaginacao(prev => ({ ...prev, paginaAtual: prev.paginaAtual - 1 }));
    }
  };

  // Reset da paginação quando os filtros mudarem
  useEffect(() => {
    setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
  }, [filtrosTitulos, filtrosContasPagar, filtrosContasPagas]);

  // Funções para contas a pagar/pagas
  const fetchContasPagar = async () => {
    try {
      const todasContas = [];
      
      // Definir qual período buscar
      const mesParaBuscar = exibirPorPeriodo ? {
        mes: periodoSelecionado.getMonth() + 1,
        ano: periodoSelecionado.getFullYear()
      } : mesAtual;
      
      // Aguardar banco estar pronto
      if (!isReady) {
        console.log('⏳ [Financeiro] Aguardando banco estar pronto...');
        return;
      }
      
      // Buscar contas pendentes do banco da escola
      const contasPagarData = await getData('contas_pagar');
      if (contasPagarData) {
        Object.entries(contasPagarData).forEach(([id, conta]) => {
          const vencimento = new Date(conta.vencimento);
          if (vencimento.getMonth() + 1 === mesParaBuscar.mes && 
              vencimento.getFullYear() === mesParaBuscar.ano) {
            todasContas.push({ id, ...conta });
          }
        });
      }
      
      // Buscar contas pagas do mês do banco da escola
      const contasPagasData = await getData('contas_pagas');
      if (contasPagasData) {
        Object.entries(contasPagasData).forEach(([id, conta]) => {
          if (conta.dataPagamento) {
            const dataPagamento = new Date(conta.dataPagamento);
            if (dataPagamento.getMonth() + 1 === mesParaBuscar.mes && 
                dataPagamento.getFullYear() === mesParaBuscar.ano) {
              todasContas.push({ id, ...conta, status: 'paga' });
            }
          }
        });
      }
      
      setContasPagar(todasContas);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
    }
  };

  // Função para filtrar contas a pagar
  const filtrarContasPagar = () => {
    let contasFiltradas = [...contasPagar];
    
    // Não aplicar filtro por período aqui, pois já é aplicado no fetch
    
    if (filtrosContasPagar.categoria) {
      contasFiltradas = contasFiltradas.filter(conta => conta.categoria === filtrosContasPagar.categoria);
    }
    
    if (filtrosContasPagar.fornecedor) {
      contasFiltradas = contasFiltradas.filter(conta => 
        conta.fornecedor?.toLowerCase().includes(filtrosContasPagar.fornecedor.toLowerCase())
      );
    }
    
    if (filtrosContasPagar.status) {
      if (filtrosContasPagar.status === 'vencida') {
        contasFiltradas = contasFiltradas.filter(conta => 
          new Date(conta.vencimento) < new Date()
        );
      } else if (filtrosContasPagar.status === 'pendente') {
        contasFiltradas = contasFiltradas.filter(conta => 
          new Date(conta.vencimento) >= new Date()
        );
      }
    }
    
    return contasFiltradas;
  };

  // Função para imprimir demonstrativo
  const imprimirDemonstrativo = () => {
    const contasFiltradas = contasPagas.filter(conta => {
      if (filtrosContasPagas.dataInicio && new Date(conta.dataPagamento) < new Date(filtrosContasPagas.dataInicio)) return false;
      if (filtrosContasPagas.dataFim && new Date(conta.dataPagamento) > new Date(filtrosContasPagas.dataFim)) return false;
      return true;
    });

    const valorTotal = contasFiltradas.reduce((sum, conta) => sum + conta.valor, 0);
    const periodoStr = filtrosContasPagas.dataInicio && filtrosContasPagas.dataFim 
      ? `${formatDate(filtrosContasPagas.dataInicio)} a ${formatDate(filtrosContasPagas.dataFim)}`
      : 'Todos os períodos';

    const conteudoHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Demonstrativo de Contas Pagas - ELO</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1976d2; text-align: center; }
            .cabecalho { text-align: center; margin-bottom: 30px; }
            .periodo { font-size: 14px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .valor { text-align: right; }
            .total { font-weight: bold; background-color: #e8f5e8; }
            .rodape { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="cabecalho">
            <h1>ELO - Sistema Educacional</h1>
            <h2>Demonstrativo de Contas Pagas</h2>
            <div class="periodo">Período: ${periodoStr}</div>
            <div class="periodo">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Data Pagamento</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Fornecedor</th>
                <th class="valor">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${contasFiltradas.map(conta => `
                <tr>
                  <td>${formatDate(conta.dataPagamento)}</td>
                  <td>${conta.descricao}</td>
                  <td>${conta.categoria}</td>
                  <td>${conta.fornecedor || '-'}</td>
                  <td class="valor">${formatCurrency(conta.valor)}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="4"><strong>TOTAL GERAL</strong></td>
                <td class="valor"><strong>${formatCurrency(valorTotal)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="rodape">
            <p>Total de contas pagas: ${contasFiltradas.length}</p>
            <p>Sistema ELO - Gestão Escolar Integrada</p>
          </div>
        </body>
      </html>
    `;

    const novaJanela = window.open('', '_blank');
    novaJanela.document.write(conteudoHTML);
    novaJanela.document.close();
    novaJanela.print();
  };

  const fetchContasPagas = async () => {
    try {
      if (!isReady) {
        console.log('⏳ [Financeiro] Aguardando banco estar pronto...');
        return;
      }
      
      const contasPagas = [];
      
      // Buscar de contas_pagar com status 'paga' do banco da escola
      const contasPagarData = await getData('contas_pagar');
      if (contasPagarData) {
        Object.entries(contasPagarData).forEach(([id, conta]) => {
          if (conta.status === 'paga') {
            contasPagas.push({ id, ...conta });
          }
        });
      }
      
      // Buscar de contas_pagas do banco da escola
      const contasPagasData = await getData('contas_pagas');
      if (contasPagasData) {
        Object.entries(contasPagasData).forEach(([id, conta]) => {
          contasPagas.push({ id, ...conta });
        });
      }
      
      setContasPagas(contasPagas);
    } catch (error) {
      console.error('Erro ao buscar contas pagas:', error);
    }
  };

  const fetchSaldoEscola = async () => {
    // 🔒 Verificar se serviço está disponível
    if (!financeiroService) {
      console.log('⏳ [fetchSaldoEscola] Aguardando financeiroService...');
      return;
    }

    try {
      const result = await financeiroService.obterSaldoEscola();
      if (result.success) {
        setSaldoEscola(result.saldo);
        console.log('🏦 Saldo da escola atualizado:', result.saldo);
      } else {
        console.error('❌ Erro ao obter saldo:', result.error);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar saldo da escola:', error);
    }
  };

  const criarConta = async () => {
    // 🔒 Verificar se banco está pronto
    if (!isReady) {
      showFeedback('error', 'Erro', 'Sistema não está pronto. Aguarde um momento e tente novamente.');
      console.error('❌ Banco não está pronto para criar conta');
      return;
    }

    if (!pushData) {
      showFeedback('error', 'Erro', 'Serviço de banco de dados não disponível.');
      console.error('❌ pushData não está disponível');
      return;
    }

    setProcessingOperation(true);
    try {
      console.log('📝 Criando nova conta:', novaConta);
      
      const contaData = {
        ...novaConta,
        valor: parseFloat(novaConta.valor),
        status: novaConta.jaFoiPaga ? 'paga' : 'pendente',
        criadoEm: new Date().toISOString(),
        criadoPor: userId
      };

      let novaContaId;
      // Se a conta já foi paga, adicionar informações de pagamento
      if (novaConta.jaFoiPaga) {
        contaData.dataPagamento = novaConta.dataPagamento;
        contaData.formaPagamento = novaConta.formaPagamento;
        contaData.pagoPor = userId;
        contaData.pagoEm = new Date().toISOString();
        
        // Conta já paga vai apenas para contas_pagas no banco da escola
        console.log('💾 Salvando conta paga em contas_pagas...');
        novaContaId = await pushData('contas_pagas', contaData);
        console.log('✅ Conta paga salva com ID:', novaContaId);
      } else {
        // Conta pendente vai para contas_pagar no banco da escola
        console.log('💾 Salvando conta pendente em contas_pagar...');
        novaContaId = await pushData('contas_pagar', contaData);
        console.log('✅ Conta pendente salva com ID:', novaContaId);
        
        // Se for recorrente, criar próximas parcelas
        if (novaConta.recorrente) {
          console.log('🔄 Criando parcelas recorrentes...');
          await criarContasRecorrentes(novaContaId, contaData);
        }
      }

      // Log da ação
      try {
        await auditService?.logAction({
          action: LOG_ACTIONS.FINANCE_CREATE,
          entity: 'conta',
          entityId: novaContaId,
          description: `Conta criada: ${novaConta.descricao}`,
          changes: { valor: novaConta.valor, vencimento: novaConta.vencimento }
        });
      } catch (auditError) {
        console.warn('⚠️ Erro ao registrar auditoria:', auditError);
      }

      setNovaContaDialog(false);
      setNovaConta({
        descricao: '',
        categoria: '',
        valor: '',
        vencimento: '',
        fornecedor: '',
        observacoes: '',
        recorrente: false,
        tipoRecorrencia: 'mensal',
        jaFoiPaga: false,
        dataPagamento: '',
        formaPagamento: '',
        anexos: []
      });
      
      await fetchContasPagar();
      showFeedback('success', 'Conta Criada', 'Conta criada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao criar conta:', error);
      showFeedback('error', 'Erro na Criação', `Erro ao criar conta: ${error.message}`);
    } finally {
      setProcessingOperation(false);
    }
  };

  const criarContasRecorrentes = async (contaId, contaData) => {
    try {
      // 🔒 Verificar se banco está pronto
      if (!isReady) {
        console.log('⏳ Aguardando banco estar pronto para criar contas recorrentes...');
        return;
      }

      console.log('📋 Criando contas recorrentes no banco da escola:', currentSchool?.name);
      
      const proximoVencimento = new Date(contaData.vencimento);
      
      // Criar próximas 12 parcelas
      for (let i = 1; i <= 12; i++) {
        switch (contaData.tipoRecorrencia) {
          case 'mensal':
            proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
            break;
          case 'trimestral':
            proximoVencimento.setMonth(proximoVencimento.getMonth() + 3);
            break;
          case 'anual':
            proximoVencimento.setFullYear(proximoVencimento.getFullYear() + 1);
            break;
        }

        const contaRecorrente = {
          ...contaData,
          vencimento: proximoVencimento.toISOString().split('T')[0],
          contaPai: contaId,
          parcela: i + 1
        };

        // 🔒 Usar pushData para salvar no banco da escola
        await pushData('contas_pagar', contaRecorrente);
        console.log(`✅ Conta recorrente ${i}/12 criada no banco da escola`);
      }
    } catch (error) {
      console.error('❌ Erro ao criar contas recorrentes:', error);
    }
  };

  const pagarConta = async (conta) => {
    // 🔒 Verificar se serviço está disponível
    if (!financeiroService) {
      showFeedback('error', 'Erro', 'Serviço financeiro não está disponível. Tente novamente.');
      return;
    }

    setProcessingOperation(true);
    try {
      // Usar o serviço para pagar a conta
      const result = await financeiroService.pagarConta(conta, pagamentoConta, userId, permitirSaldoNegativo);
      
      if (result.success) {
        // Recarregar dados
        await fetchContasPagar();
        await fetchContasPagas();
        await fetchSaldoEscola();
        
        // Fechar dialog
        setDialogPagamentoConta({ open: false, conta: null });
        setPagamentoConta({
          dataPagamento: '',
          formaPagamento: '',
          observacoes: ''
        });
        setPermitirSaldoNegativo(false); // Reset da opção de saldo negativo
        
        // Verificar se o saldo ficou negativo após o pagamento
        const novoSaldo = await financeiroService.obterSaldoEscola();
        if (novoSaldo < 0) {
          showFeedback('success', 'Pagamento Realizado', `Conta paga com sucesso! ⚠️ Saldo atual: ${formatCurrency(novoSaldo)}`);
        } else {
          showFeedback('success', 'Pagamento Realizado', 'Conta paga com sucesso!');
        }
      } else {
        showFeedback('error', 'Erro no Pagamento', 'Erro ao pagar conta: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao pagar conta:', error);
      showFeedback('error', 'Erro no Pagamento', 'Erro ao pagar conta. Tente novamente.');
    } finally {
      setProcessingOperation(false);
    }
  };

  // Funções de relatórios
  const gerarRelatorioReceitas = () => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    const dadosReceitas = {
      receitaMensal: metricas.receitaMensal || 0,
      receitaAnual: metricas.receitaAnual || 0,
      titulosPagos: titulos.filter(t => t.status === 'pago'),
      totalTitulos: titulos.length,
      periodoAnalise: `${String(mesAtual + 1).padStart(2, '0')}/${anoAtual}`
    };
    
    setRelatorios(prev => ({
      ...prev,
      dialogOpen: true,
      tipoRelatorio: 'receitas',
      dadosRelatorio: dadosReceitas
    }));
  };

  const gerarRelatorioInadimplencia = () => {
    const titulosVencidos = titulos.filter(t => {
      if (t.status !== 'pendente') return false;
      const vencimento = new Date(t.vencimento);
      return vencimento < new Date();
    });
    
    const inadimplentes = titulosVencidos.reduce((acc, titulo) => {
      const aluno = alunos.find(a => a.id === titulo.alunoId);
      if (!aluno) return acc;
      
      if (!acc[titulo.alunoId]) {
        acc[titulo.alunoId] = {
          aluno: aluno.nome,
          turma: turmas[aluno.turmaId]?.nome || 'N/A',
          titulos: [],
          valorTotal: 0
        };
      }
      
      acc[titulo.alunoId].titulos.push(titulo);
      acc[titulo.alunoId].valorTotal += parseFloat(titulo.valor) || 0;
      
      return acc;
    }, {});
    
    const dadosInadimplencia = {
      totalInadimplentes: Object.keys(inadimplentes).length,
      valorTotalDevido: Object.values(inadimplentes).reduce((sum, item) => sum + item.valorTotal, 0),
      inadimplentes: Object.values(inadimplentes),
      titulosVencidos
    };
    
    setRelatorios(prev => ({
      ...prev,
      dialogOpen: true,
      tipoRelatorio: 'inadimplencia',
      dadosRelatorio: dadosInadimplencia
    }));
  };

  const gerarRelatorioFluxoCaixa = () => {
    const hoje = new Date();
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    
    const titulosProximos = titulos.filter(t => {
      if (t.status !== 'pendente') return false;
      const vencimento = new Date(t.vencimento);
      return vencimento >= hoje && vencimento < proximoMes;
    });
    
    const previsaoRecebimento = titulosProximos.reduce((sum, titulo) => sum + (parseFloat(titulo.valor) || 0), 0);
    
    const dadosFluxoCaixa = {
      receitaAtual: metricas.receitaMensal || 0,
      previsaoProximoMes: previsaoRecebimento,
      titulosProximos,
      totalTitulosPendentes: titulos.filter(t => t.status === 'pendente').length
    };
    
    setRelatorios(prev => ({
      ...prev,
      dialogOpen: true,
      tipoRelatorio: 'fluxocaixa',
      dadosRelatorio: dadosFluxoCaixa
    }));
  };

  const gerarDemonstrativoAluno = () => {
    // Só gerar dados se houver alunos selecionados
    if (relatorios.filtroAlunos.length === 0) {
      setRelatorios(prev => ({
        ...prev,
        dialogOpen: true,
        tipoRelatorio: 'demonstrativo',
        dadosRelatorio: { demonstrativos: [] } // Array vazio quando nenhum aluno selecionado
      }));
      return;
    }
    
    // Filtrar apenas os alunos selecionados
    const alunosFiltrados = alunos.filter(aluno => relatorios.filtroAlunos.includes(aluno.id));
    
    const demonstrativos = alunosFiltrados.map(aluno => {
      const titulosAluno = titulos.filter(t => t.alunoId === aluno.id);
      const valorTotal = titulosAluno.reduce((sum, titulo) => sum + (parseFloat(titulo.valor) || 0), 0);
      const valorPago = titulosAluno
        .filter(t => t.status === 'pago')
        .reduce((sum, titulo) => sum + (parseFloat(titulo.valor) || 0), 0);
      
      return {
        aluno: aluno.nome,
        matricula: aluno.matricula,
        turma: turmas[aluno.turmaId]?.nome || 'N/A',
        totalTitulos: titulosAluno.length,
        valorTotal,
        valorPago,
        valorPendente: valorTotal - valorPago,
        titulos: titulosAluno
      };
    });
    
    setRelatorios(prev => ({
      ...prev,
      dialogOpen: true,
      tipoRelatorio: 'demonstrativo',
      dadosRelatorio: { demonstrativos }
    }));
  };

  // Função para visualizar detalhes do título
  const visualizarDetalhes = (titulo) => {
    setDetalheTitulo({
      dialogOpen: true,
      titulo: titulo
    });
  };

  // Funções de exportação
  const exportarParaPDF = (tipoRelatorio, dados) => {
    // Criar conteúdo HTML para PDF
    const nomeRelatorio = {
      'receitas': 'Relatório de Receitas',
      'inadimplencia': 'Relatório de Inadimplência', 
      'fluxocaixa': 'Relatório de Fluxo de Caixa',
      'demonstrativo': 'Demonstrativo por Aluno'
    }[tipoRelatorio];

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    let conteudoHTML = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>${nomeRelatorio}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #10B981; text-align: center; }
            h2 { color: #374151; border-bottom: 2px solid #E5E7EB; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #D1D5DB; padding: 8px; text-align: left; }
            th { background-color: #F3F4F6; font-weight: bold; }
            .header { text-align: center; margin-bottom: 30px; }
            .footer { margin-top: 30px; text-align: center; color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💰 ${nomeRelatorio}</h1>
            <p>Gerado em: ${dataAtual}</p>
          </div>
    `;

    // Adicionar conteúdo específico do relatório
    if (tipoRelatorio === 'receitas') {
      conteudoHTML += `
        <h2>📊 Resumo Financeiro</h2>
        <p><strong>Receita Mensal:</strong> ${formatCurrency(dados.receitaMensal)}</p>
        <p><strong>Receita Anual:</strong> ${formatCurrency(dados.receitaAnual)}</p>
        <h2>💰 Títulos Pagos</h2>
        <table>
          <tr><th>Aluno</th><th>Tipo</th><th>Descrição</th><th>Valor</th><th>Data Pagamento</th></tr>
      `;
      dados.titulosPagos.forEach(titulo => {
        const aluno = alunos.find(a => a.id === titulo.alunoId);
        conteudoHTML += `
          <tr>
            <td>${aluno?.nome || 'N/A'}</td>
            <td>${titulo.tipo}</td>
            <td>${titulo.descricao}</td>
            <td>${formatCurrency(titulo.valor)}</td>
            <td>${titulo.dataPagamento ? formatDate(titulo.dataPagamento) : 'N/A'}</td>
          </tr>
        `;
      });
      conteudoHTML += '</table>';
    }

    conteudoHTML += `
          <div class="footer">
            <p>Relatório gerado pelo Sistema ELO - ${dataAtual}</p>
          </div>
        </body>
      </html>
    `;

    // Criar blob e download
    const blob = new Blob([conteudoHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nomeRelatorio.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportarParaExcel = (tipoRelatorio, dados) => {
    // Criar dados CSV
    let csvContent = "\uFEFF"; // BOM para UTF-8
    
    const nomeRelatorio = {
      'receitas': 'Relatório de Receitas',
      'inadimplencia': 'Relatório de Inadimplência',
      'fluxocaixa': 'Relatório de Fluxo de Caixa', 
      'demonstrativo': 'Demonstrativo por Aluno'
    }[tipoRelatorio];

    csvContent += `${nomeRelatorio}\n`;
    csvContent += `Gerado em: ${new Date().toLocaleDateString('pt-BR')}\n\n`;

    if (tipoRelatorio === 'receitas') {
      csvContent += `Resumo Financeiro\n`;
      csvContent += `Receita Mensal,${dados.receitaMensal}\n`;
      csvContent += `Receita Anual,${dados.receitaAnual}\n\n`;
      csvContent += `Títulos Pagos\n`;
      csvContent += `Aluno,Tipo,Descrição,Valor,Data Pagamento\n`;
      dados.titulosPagos.forEach(titulo => {
        const aluno = alunos.find(a => a.id === titulo.alunoId);
        csvContent += `"${aluno?.nome || 'N/A'}","${titulo.tipo}","${titulo.descricao}","${titulo.valor}","${titulo.dataPagamento ? formatDate(titulo.dataPagamento) : 'N/A'}"\n`;
      });
    } else if (tipoRelatorio === 'demonstrativo') {
      csvContent += `Aluno,Matrícula,Turma,Total Títulos,Valor Total,Valor Pago,Valor Pendente\n`;
      dados.demonstrativos.forEach(item => {
        csvContent += `"${item.aluno}","${item.matricula}","${item.turma}","${item.totalTitulos}","${item.valorTotal}","${item.valorPago}","${item.valorPendente}"\n`;
      });
    }

    // Criar blob e download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nomeRelatorio.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const imprimirRelatorio = (tipoRelatorio, dados) => {
    const nomeRelatorio = {
      'receitas': 'Relatório de Receitas',
      'inadimplencia': 'Relatório de Inadimplência',
      'fluxocaixa': 'Relatório de Fluxo de Caixa',
      'demonstrativo': 'Demonstrativo por Aluno'
    }[tipoRelatorio];

    // Criar janela de impressão
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${nomeRelatorio}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 1cm; }
            }
            body { font-family: Arial, sans-serif; }
            h1 { color: #10B981; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>${nomeRelatorio}</h1>
          <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
          ${document.querySelector('[role="tabpanel"] .MuiDialogContent-root')?.innerHTML || ''}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
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
      case 'em_analise': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pago': return 'Pago';
      case 'vencido': return 'Vencido';
      case 'pendente': return 'Pendente';
      case 'em_analise': return 'Em Análise';
      default: return status;
    }
  };

  // Verificar se título está vencido
  const verificarSeVencido = (titulo) => {
    if (titulo.status === 'pago' || titulo.status === 'cancelado') {
      return false;
    }
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const vencimento = new Date(titulo.vencimento + 'T00:00:00');
    vencimento.setHours(0, 0, 0, 0);
    
    return vencimento < hoje;
  };

  // Obter status visual do título (considerando vencimento)
  const getStatusVisual = (titulo) => {
    if (titulo.status === 'pago') return 'pago';
    if (titulo.status === 'em_analise') return 'em_analise';
    if (verificarSeVencido(titulo)) return 'vencido';
    return 'pendente';
  };

  // Verificações de acesso
  if (!roleChecked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!userRole || !['coordenadora', 'coordenador', 'pai', 'mae'].includes(userRole)) {
    return (
      <ProtectedRoute>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <SidebarMenu />
          <Box sx={{ flexGrow: 1, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Alert severity="error">
              <Typography variant="h6">Acesso Negado</Typography>
              <Typography>Você não tem permissão para acessar o sistema financeiro.</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Role detectada: "{userRole || 'não definida'}"
              </Typography>
            </Alert>
          </Box>
        </Box>
      </ProtectedRoute>
    );
  }

  // Componente para exibir informações de crédito do aluno
  const CreditoAlunoInfo = ({ alunoId, aluno, userRole, userId }) => {
    const [creditoInfo, setCreditoInfo] = useState({
      saldo: 0,
      historico: [],
      carregando: true
    });

    useEffect(() => {
      if (alunoId) {
        buscarDadosCredito();
      }
    }, [alunoId]);

    const buscarDadosCredito = async () => {
      // 🔒 Verificar se serviço está disponível
      if (!financeiroService) {
        console.log('⏳ [buscarDadosCredito] Aguardando financeiroService...');
        setCreditoInfo({
          saldo: 0,
          historico: [],
          carregando: false
        });
        return;
      }

      setCreditoInfo(prev => ({ ...prev, carregando: true }));
      
      try {
        // Buscar saldo
        const resultadoSaldo = await financeiroService.obterSaldoCredito(alunoId);
        
        // Buscar histórico
        const resultadoHistorico = await financeiroService.obterHistoricoCreditos(alunoId);
        
        setCreditoInfo({
          saldo: resultadoSaldo.success ? resultadoSaldo.saldo : 0,
          historico: resultadoHistorico.success ? resultadoHistorico.historico : [],
          carregando: false
        });
      } catch (error) {
        console.error('Erro ao buscar dados de crédito:', error);
        setCreditoInfo({
          saldo: 0,
          historico: [],
          carregando: false
        });
      }
    };

    if (creditoInfo.carregando) {
      return (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Carregando informações de crédito...
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Grid container spacing={3}>
        {/* Card de Saldo */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: creditoInfo.saldo > 0 ? '#f0f9ff' : '#f8fafc', border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MonetizationOn sx={{ color: creditoInfo.saldo > 0 ? '#0ea5e9' : '#64748b', mr: 1 }} />
                <Typography variant="h6" color={creditoInfo.saldo > 0 ? '#0ea5e9' : '#64748b'}>
                  Saldo de Créditos
                </Typography>
              </Box>
              
              <Typography variant="h4" fontWeight="bold" color={creditoInfo.saldo > 0 ? '#0ea5e9' : '#64748b'}>
                {formatCurrency(creditoInfo.saldo)}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Aluno: {aluno?.nome || 'Nome não encontrado'}
              </Typography>
              
              {creditoInfo.saldo > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  💡 Este crédito pode ser utilizado para abater valores de títulos em aberto
                </Alert>
              )}

            </CardContent>
          </Card>
        </Grid>

        {/* Card de Histórico */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Histórico de Movimentações
              </Typography>
              
              {creditoInfo.historico.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  Nenhuma movimentação de crédito encontrada
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {creditoInfo.historico.slice(0, 5).map((item, index) => (
                    <Box key={item.id || index} sx={{ 
                      borderBottom: index < Math.min(4, creditoInfo.historico.length - 1) ? '1px solid #e2e8f0' : 'none',
                      py: 2
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold" color={item.tipo === 'adicao' ? 'success.main' : 'error.main'}>
                            {item.tipo === 'adicao' ? '+ ' : '- '}{formatCurrency(item.valor)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(item.dataHora)} • {item.motivo}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Saldo: {formatCurrency(item.saldoNovo)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  
                  {creditoInfo.historico.length > 5 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                      E mais {creditoInfo.historico.length - 5} movimentações...
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <ProtectedRoute>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f6fa' }}>
        <SidebarMenu />
        
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 1, sm: 2, md: 3 },
            width: 0 // Força o flex item a não exceder o container
          }}
        >
          {/* Header */}
          <Box sx={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            borderRadius: { xs: 2, md: 3 },
            p: { xs: 2, md: 3 },
            mb: 3,
            color: 'white',
            textAlign: 'center'
          }}>
            <Typography 
              variant="h4" 
              gutterBottom 
              fontWeight="bold"
              sx={{
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
              }}
            >
              💰 Sistema Financeiro
            </Typography>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                opacity: 0.9,
                fontSize: { xs: '0.875rem', md: '1rem' },
                px: { xs: 1, md: 0 }
              }}
            >
              {isCoordenador() && 'Gestão completa do financeiro escolar'}
              {isProfessor() && 'Consulta de status financeiro dos alunos'}
              {isPai() && 'Seus títulos e pagamentos'}
              <br />
              <Typography 
                component="span" 
                variant="caption" 
                sx={{ 
                  opacity: 0.6, 
                  fontSize: { xs: '0.6rem', md: '0.7rem' },
                  display: { xs: 'none', md: 'inline' }
                }}
              >
                🐛 Debug: Role="{userRole}" | Coordenador={isCoordenador() ? 'Sim' : 'Não'}
              </Typography>
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : (
            <>
              {/* Métricas - Dashboard */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {isCoordenador() && (
                  <>
                    <Grid item xs={12} sm={6} lg={3}>
                      <Card sx={{ background: 'linear-gradient(135deg, #3B82F6, #1E40AF)' }}>
                        <CardContent sx={{ color: 'white', p: { xs: 2, md: 3 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography 
                                variant="h4" 
                                fontWeight="bold"
                                sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
                              >
                                {formatCurrency(metricas.receitaMensal)}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  opacity: 0.8,
                                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                Receita Mensal
                              </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', display: { xs: 'none', sm: 'flex' } }}>
                              <AttachMoney />
                            </Avatar>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} lg={3}>
                      <Card sx={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                        <CardContent sx={{ color: 'white', p: { xs: 2, md: 3 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography 
                                variant="h4" 
                                fontWeight="bold"
                                sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
                              >
                                {formatCurrency(metricas.receitaAnual)}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  opacity: 0.8,
                                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                Receita Anual
                              </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', display: { xs: 'none', sm: 'flex' } }}>
                              <AccountBalance />
                            </Avatar>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} lg={3}>
                      <Card sx={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
                        <CardContent sx={{ color: 'white', p: { xs: 2, md: 3 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography 
                                variant="h4" 
                                fontWeight="bold"
                                sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
                              >
                                {metricas.taxaInadimplencia.toFixed(1)}%
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  opacity: 0.8,
                                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                Taxa Inadimplência
                              </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', display: { xs: 'none', sm: 'flex' } }}>
                              <Warning />
                            </Avatar>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </>
                )}

                <Grid item xs={12} sm={6} lg={isCoordenador() ? 3 : 6}>
                  <Card sx={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                    <CardContent sx={{ color: 'white', p: { xs: 2, md: 3 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography 
                            variant="h4" 
                            fontWeight="bold"
                            sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
                          >
                            {metricas.alunosAtivos}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              opacity: 0.8,
                              fontSize: { xs: '0.75rem', md: '0.875rem' }
                            }}
                          >
                            Alunos Ativos
                          </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', display: { xs: 'none', sm: 'flex' } }}>
                          <CheckCircle />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} lg={isCoordenador() ? 3 : 6}>
                  <Card sx={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                    <CardContent sx={{ color: 'white', p: { xs: 2, md: 3 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography 
                            variant="h4" 
                            fontWeight="bold"
                            sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
                          >
                            {metricas.alunosInadimplentes}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              opacity: 0.8,
                              fontSize: { xs: '0.75rem', md: '0.875rem' }
                            }}
                          >
                            Inadimplentes
                          </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', display: { xs: 'none', sm: 'flex' } }}>
                          <TrendingDown />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Tabs de Navegação */}
              <Paper sx={{ mb: 3, overflow: 'hidden' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={(e, newValue) => setTabValue(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    '& .MuiTab-root': {
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                      minWidth: { xs: 100, sm: 120, md: 160 },
                      padding: { xs: '8px 12px', md: '12px 24px' },
                      minHeight: { xs: 40, md: 48 }
                    },
                    '& .MuiTabs-scrollButtons': {
                      width: { xs: 32, md: 40 }
                    }
                  }}
                >
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span>📊</span>
                        <span style={{ display: { xs: 'none', sm: 'inline' } }}>Dashboard</span>
                      </Box>
                    }
                    disabled={userRole === 'pai'}
                  />
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span>📋</span>
                        <span>Títulos</span>
                      </Box>
                    }
                    disabled={userRole === 'professora'}
                  />
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span>💳</span>
                        <span style={{ display: { xs: 'none', sm: 'inline' } }}>Créditos</span>
                      </Box>
                    }
                    disabled={userRole === 'professora'}
                  />
                  {userRole === 'coordenadora' && (
                    <Tab 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span>📅</span>
                          <span style={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }}>C. Pagar</span>
                        </Box>
                      }
                    />
                  )}
                  {userRole === 'coordenadora' && (
                    <Tab 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span>🟢</span>
                          <span style={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }}>C. Pagas</span>
                        </Box>
                      }
                    />
                  )}
                  {userRole === 'coordenadora' && (
                    <Tab 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span>📊</span>
                          <span style={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }}>Relatórios</span>
                        </Box>
                      }
                    />
                  )}
                </Tabs>
              </Paper>

              {/* Conteúdo das Tabs */}
              {tabValue === 0 && !isPai() && (
                <DashboardFinanceiro userRole={userRole} />
              )}

              {/* Tab Títulos */}
              {tabValue === 1 && !isProfessor() && (
                <Card>
                  <CardContent>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      mb: 3,
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 2, sm: 0 }
                    }}>
                      <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                        📋 Gestão de Títulos
                      </Typography>
                      {isCoordenador() && (
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => setNovoTituloDialog(true)}
                          sx={{
                            width: { xs: '100%', sm: 'auto' },
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            py: { xs: 1, md: 1.5 },
                            px: { xs: 2, md: 3 }
                          }}
                        >
                          Novo Título
                        </Button>
                      )}
                    </Box>

                    {/* Filtros */}
                    <Card sx={{ mb: 3, maxWidth: 'none' }}>
                      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight={600} 
                          gutterBottom 
                          color="primary"
                          sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}
                        >
                          🔍 Filtros de Busca
                        </Typography>
                        
                        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ width: '100%' }}>
                          <Grid item xs={12} sx={{ minWidth: '300px' }}>
                            <FormControl fullWidth sx={{ minWidth: '250px' }}>
                              <InputLabel>Turma</InputLabel>
                              <Select
                                value={filtrosTitulos.turma}
                                label="Turma"
                                onChange={(e) => setFiltrosTitulos({...filtrosTitulos, turma: e.target.value})}
                              >
                                <MenuItem value="">Todas</MenuItem>
                                {Object.entries(turmas).map(([id, turma]) => (
                                  <MenuItem key={id} value={id}>
                                    {turma.nome}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12} sx={{ minWidth: '300px' }}>
                            <TextField
                              label="Nome do Aluno"
                              fullWidth
                              value={filtrosTitulos.aluno}
                              onChange={(e) => setFiltrosTitulos({...filtrosTitulos, aluno: e.target.value})}
                              placeholder="Digite o nome do aluno"
                              sx={{ minWidth: '250px' }}
                            />
                          </Grid>
                          
                          <Grid item xs={12} sx={{ minWidth: '300px' }}>
                            <FormControl fullWidth sx={{ minWidth: '250px' }}>
                              <InputLabel>Tipo de Título</InputLabel>
                              <Select
                                value={filtrosTitulos.tipo}
                                label="Tipo de Título"
                                onChange={(e) => setFiltrosTitulos({...filtrosTitulos, tipo: e.target.value})}
                              >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="mensalidade">Mensalidade</MenuItem>
                                <MenuItem value="matricula">Matrícula</MenuItem>
                                <MenuItem value="materiais">Materiais</MenuItem>
                                <MenuItem value="uniforme">Uniforme</MenuItem>
                                <MenuItem value="taxa">Taxa</MenuItem>
                                <MenuItem value="loja">Loja</MenuItem>
                                <MenuItem value="credito">Crédito</MenuItem>
                                <MenuItem value="outros">Outros</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12} sx={{ minWidth: '300px' }}>
                            <FormControl fullWidth sx={{ minWidth: '250px' }}>
                              <InputLabel>Status</InputLabel>
                              <Select
                                value={filtrosTitulos.status}
                                label="Status"
                                onChange={(e) => setFiltrosTitulos({...filtrosTitulos, status: e.target.value})}
                              >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="pendente">Pendente</MenuItem>
                                <MenuItem value="em_analise">Em Análise</MenuItem>
                                <MenuItem value="pago">Pago</MenuItem>
                                <MenuItem value="vencido">Vencido</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12} sx={{ minWidth: '300px' }}>
                            <TextField
                              label="Data Início"
                              type="date"
                              fullWidth
                              value={filtrosTitulos.dataInicio}
                              onChange={(e) => setFiltrosTitulos({...filtrosTitulos, dataInicio: e.target.value})}
                              InputLabelProps={{ shrink: true }}
                              sx={{ minWidth: '250px' }}
                            />
                          </Grid>
                          
                          <Grid item xs={12} sx={{ minWidth: '300px' }}>
                            <TextField
                              label="Data Fim"
                              type="date"
                              fullWidth
                              value={filtrosTitulos.dataFim}
                              onChange={(e) => setFiltrosTitulos({...filtrosTitulos, dataFim: e.target.value})}
                              InputLabelProps={{ shrink: true }}
                              sx={{ minWidth: '250px' }}
                            />
                          </Grid>
                          
                          <Grid item xs={12} sx={{ minWidth: '300px' }}>
                            <Button
                              variant="outlined"
                              fullWidth
                              onClick={() => setFiltrosTitulos({
                                aluno: '',
                                turma: '',
                                tipo: '',
                                status: '',
                                dataInicio: '',
                                dataFim: ''
                              })}
                              sx={{ 
                                height: { xs: '40px', md: '56px' },
                                minWidth: '250px'
                              }}
                            >
                              🗑️ Limpar Filtros
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>

                    {/* Paginação - Topo */}
                    {filtrarTitulos().length > 0 && (
                      <Card sx={{ mb: 2 }}>
                        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                          <Stack 
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between" 
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            gap={2}
                          >
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                            >
                              Exibindo {Math.min((paginacao.paginaAtual - 1) * paginacao.itensPorPagina + 1, filtrarTitulos().length)} - {Math.min(paginacao.paginaAtual * paginacao.itensPorPagina, filtrarTitulos().length)} de {filtrarTitulos().length} títulos
                            </Typography>
                            <Pagination
                              count={paginacao.totalPaginas}
                              page={paginacao.paginaAtual}
                              onChange={(event, page) => irParaPagina(page)}
                              color="primary"
                              showFirstButton
                              showLastButton
                              size="small"
                              sx={{
                                '& .MuiPagination-ul': {
                                  justifyContent: { xs: 'center', sm: 'flex-end' }
                                }
                              }}
                            />
                          </Stack>
                        </CardContent>
                      </Card>
                    )}

                    <TableContainer sx={{ 
                      overflowX: 'auto',
                      '& .MuiTable-root': {
                        minWidth: { xs: 600, md: 'auto' }
                      }
                    }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Aluno</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Tipo</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Descrição</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Valor</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Vencimento</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Status</TableCell>
                            {(isCoordenador() || isPai()) && <TableCell sx={{ whiteSpace: 'nowrap' }}>Ações</TableCell>}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {obterTitulosPaginados().map((titulo) => (
                            <TableRow key={titulo.id}>
                              <TableCell sx={{ 
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '0.75rem', md: '0.875rem' }
                              }}>
                                {alunos.find(a => a.id === titulo.alunoId)?.nome || 'Aluno não encontrado'}
                              </TableCell>
                              <TableCell sx={{ 
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '0.75rem', md: '0.875rem' }
                              }}>
                                {titulo.tipo}
                              </TableCell>
                              <TableCell sx={{ 
                                maxWidth: { xs: 150, md: 'none' },
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {titulo.descricao}
                              </TableCell>
                              <TableCell sx={{ 
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                fontWeight: 'bold'
                              }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                  {(() => {
                                    if (verificarSeVencido(titulo) && financeiroService?.calcularJurosMulta) {
                                      const calculo = financeiroService.calcularJurosMulta(titulo);
                                      return (
                                        <>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography 
                                              variant="body2" 
                                              sx={{ 
                                                textDecoration: 'line-through',
                                                color: 'text.secondary',
                                                fontSize: '0.7rem'
                                              }}
                                            >
                                              {formatCurrency(titulo.valor)}
                                            </Typography>
                                            <Tooltip title={`Multa: ${formatCurrency(calculo.multa)} + Juros: ${formatCurrency(calculo.juros)} (${calculo.diasAtraso} dias)`}>
                                              <Chip 
                                                label="+ J/M" 
                                                size="small" 
                                                color="error" 
                                                sx={{ 
                                                  height: 16, 
                                                  fontSize: '0.55rem',
                                                  '& .MuiChip-label': { px: 0.5 }
                                                }} 
                                              />
                                            </Tooltip>
                                          </Box>
                                          <Typography 
                                            variant="body2" 
                                            sx={{ 
                                              color: 'error.main',
                                              fontWeight: 'bold',
                                              fontSize: '0.875rem'
                                            }}
                                          >
                                            {formatCurrency(calculo.total)}
                                          </Typography>
                                        </>
                                      );
                                    }
                                    return formatCurrency(titulo.valor);
                                  })()}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ 
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '0.75rem', md: '0.875rem' }
                              }}>
                                {formatDate(titulo.vencimento)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={getStatusLabel(getStatusVisual(titulo))}
                                  color={getStatusColor(getStatusVisual(titulo))}
                                  size="small"
                                  sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}
                                />
                              </TableCell>
                              {(isCoordenador() || isPai()) && (
                                <TableCell>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    gap: 0.5,
                                    flexWrap: 'wrap'
                                  }}>
                                    {isCoordenador() && (
                                      <>
                                        {titulo.status === 'pendente' && (
                                          <Tooltip title="Dar Baixa">
                                            <IconButton
                                              onClick={() => {
                                                setTituloSelecionado(titulo);
                                                setBaixaDialog(true);
                                              }}
                                              color="primary"
                                              size="small"
                                            >
                                              <Payment />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                        {titulo.status === 'em_analise' && (
                                          <>
                                            <Tooltip title="Aprovar Pagamento">
                                              <IconButton
                                                onClick={() => aprovarPagamento(titulo)}
                                                color="success"
                                                size="small"
                                              >
                                                <CheckCircleOutlined />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Rejeitar Pagamento">
                                              <IconButton
                                                onClick={() => rejeitarPagamento(titulo)}
                                                color="error"
                                                size="small"
                                              >
                                                <CancelOutlined />
                                              </IconButton>
                                            </Tooltip>
                                          </>
                                        )}
                                        <Tooltip title="Ver Detalhes">
                                          <IconButton 
                                            size="small"
                                            onClick={() => visualizarDetalhes(titulo)}
                                          >
                                            <Visibility />
                                          </IconButton>
                                        </Tooltip>
                                        
                                        {/* Botão para anexar boleto/PIX */}
                                        {!titulo.anexoBoleto ? (
                                          <Tooltip title="Anexar Boleto/PIX">
                                            <IconButton 
                                              size="small"
                                              onClick={() => handleAbrirAnexoBoleto(titulo)}
                                              color="secondary"
                                            >
                                              <CloudUpload />
                                            </IconButton>
                                          </Tooltip>
                                        ) : (
                                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Ver Boleto/PIX">
                                              <IconButton 
                                                size="small"
                                                onClick={() => window.open(titulo.anexoBoleto.url, '_blank')}
                                                color="success"
                                              >
                                                <AttachFile />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Remover Boleto/PIX">
                                              <IconButton 
                                                size="small"
                                                onClick={() => handleRemoverAnexoBoleto(titulo)}
                                                color="error"
                                              >
                                                <DeleteIcon />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        )}
                                      </>
                                    )}
                                    {isPai() && (
                                      <>
                                        {titulo.status === 'pendente' && (
                                          <Tooltip title="Pagar">
                                            <IconButton
                                              onClick={() => abrirDialogPagamento(titulo)}
                                              color="primary"
                                              size="small"
                                            >
                                              <Payment />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                        
                                        {/* Mostrar boleto/PIX para o pai se existir */}
                                        {titulo.anexoBoleto && (
                                          <Tooltip title="Ver Boleto/PIX">
                                            <IconButton 
                                              size="small"
                                              onClick={() => window.open(titulo.anexoBoleto.url, '_blank')}
                                              color="success"
                                            >
                                              <AttachFile />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                      </>
                                    )}
                                  </Box>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Paginação - Final */}
                    {filtrarTitulos().length > 0 && (
                      <Card sx={{ mt: 2 }}>
                        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                          <Stack 
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between" 
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            gap={2}
                          >
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                            >
                              Exibindo {Math.min((paginacao.paginaAtual - 1) * paginacao.itensPorPagina + 1, filtrarTitulos().length)} - {Math.min(paginacao.paginaAtual * paginacao.itensPorPagina, filtrarTitulos().length)} de {filtrarTitulos().length} títulos
                            </Typography>
                            <Pagination
                              count={paginacao.totalPaginas}
                              page={paginacao.paginaAtual}
                              onChange={(event, page) => irParaPagina(page)}
                              color="primary"
                              showFirstButton
                              showLastButton
                              size="small"
                              sx={{
                                '& .MuiPagination-ul': {
                                  justifyContent: { xs: 'center', sm: 'flex-end' }
                                }
                              }}
                            />
                          </Stack>
                        </CardContent>
                      </Card>
                    )}

                    {titulos.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          Nenhum título encontrado
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tab Créditos */}
              {tabValue === 2 && !isProfessor() && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      💳 Gestão de Créditos
                    </Typography>
                    
                    {/* Seletor de Aluno */}
                    <Card sx={{ mb: 3, bgcolor: '#f8fafc' }}>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom color="primary" fontWeight="bold">
                          👤 Selecionar Aluno
                        </Typography>
                        <Autocomplete
                          options={alunos}
                          getOptionLabel={(option) => option.nome || ''}
                          value={alunos.find(a => a.id === filtrosTitulos.aluno) || null}
                          onChange={(e, value) => setFiltrosTitulos(prev => ({ 
                            ...prev, 
                            aluno: value?.id || '' 
                          }))}
                          renderInput={(params) => (
                            <TextField {...params} label="Pesquisar aluno..." fullWidth />
                          )}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                        />
                      </CardContent>
                    </Card>

                    {/* Informações de Crédito do Aluno Selecionado */}
                    {filtrosTitulos.aluno && (
                      <CreditoAlunoInfo 
                        alunoId={filtrosTitulos.aluno} 
                        aluno={alunos.find(a => a.id === filtrosTitulos.aluno)}
                        userRole={userRole}
                        userId={userId}
                      />
                    )}

                    {/* Se nenhum aluno selecionado */}
                    {!filtrosTitulos.aluno && (
                      <Card sx={{ bgcolor: '#f0f9ff', border: '1px solid #0ea5e9' }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                          <MonetizationOn sx={{ fontSize: 48, color: '#0ea5e9', mb: 2 }} />
                          <Typography variant="h6" color="#0ea5e9" gutterBottom>
                            Sistema de Créditos
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            Selecione um aluno para visualizar seus créditos disponíveis
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            💡 Os créditos podem ser gerados através de títulos do tipo "Crédito" e utilizados para abater valores de outros títulos
                          </Typography>
                        </CardContent>
                      </Card>
                    )}

                  </CardContent>
                </Card>
              )}

              {/* Tab Contas a Pagar */}
              {tabValue === 3 && isCoordenador() && (
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box>
                        <Typography variant="h6" color="primary">
                          🔴 Contas a Pagar - {exibirPorPeriodo 
                            ? `${(periodoSelecionado.getMonth() + 1).toString().padStart(2, '0')}/${periodoSelecionado.getFullYear()}`
                            : `${mesAtual.mes.toString().padStart(2, '0')}/${mesAtual.ano}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Mês atual - {mesAtual.fechado ? 'Fechado' : 'Em andamento'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="warning"
                          onClick={() => {
                            const estatisticas = calcularEstatisticasPendentes();
                            if (estatisticas.quantidade === 0) {
                              showFeedback('success', 'Mês sem Pendências', 'Não há contas pendentes neste mês. O mês pode ser considerado como finalizado.');
                            } else {
                              setDialogFecharMes(true);
                            }
                          }}
                          disabled={mesAtual.fechado}
                        >
                          {calcularEstatisticasPendentes().quantidade === 0 ? 'Mês Finalizado' : 'Fechar Mês'}
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => setNovaContaDialog(true)}
                        >
                          Nova Conta
                        </Button>
                      </Box>
                    </Box>

                    {/* Filtros */}
                    <Card sx={{ mb: 3, bgcolor: '#f8fafc' }}>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom color="primary" fontWeight="bold">
                          🔍 Filtros de Contas a Pagar
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small" sx={{ minWidth: '200px' }}>
                              <InputLabel>Categoria</InputLabel>
                              <Select
                                value={filtrosContasPagar.categoria || ''}
                                label="Categoria"
                                onChange={(e) => setFiltrosContasPagar(prev => ({ ...prev, categoria: e.target.value }))}
                              >
                                <MenuItem value="">Todas</MenuItem>
                                <MenuItem value="aluguel">Aluguel</MenuItem>
                                <MenuItem value="energia">Energia Elétrica</MenuItem>
                                <MenuItem value="agua">Água</MenuItem>
                                <MenuItem value="internet">Internet</MenuItem>
                                <MenuItem value="telefone">Telefone</MenuItem>
                                <MenuItem value="material">Material Escolar</MenuItem>
                                <MenuItem value="manutencao">Manutenção</MenuItem>
                                <MenuItem value="limpeza">Limpeza</MenuItem>
                                <MenuItem value="salarios">Salários</MenuItem>
                                <MenuItem value="impostos">Impostos</MenuItem>
                                <MenuItem value="outros">Outros</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <TextField
                              label="Fornecedor"
                              size="small"
                              fullWidth
                              value={filtrosContasPagar.fornecedor || ''}
                              onChange={(e) => setFiltrosContasPagar(prev => ({ ...prev, fornecedor: e.target.value }))}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small" sx={{ minWidth: '150px' }}>
                              <InputLabel>Status</InputLabel>
                              <Select
                                value={filtrosContasPagar.status || ''}
                                label="Status"
                                onChange={(e) => setFiltrosContasPagar(prev => ({ ...prev, status: e.target.value }))}
                              >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="pendente">Pendente</MenuItem>
                                <MenuItem value="vencida">Vencida</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={exibirPorPeriodo}
                                    onChange={(e) => {
                                      setExibirPorPeriodo(e.target.checked);
                                      if (!e.target.checked) {
                                        // Quando desmarcar, volta para o mês atual
                                        fetchContasPagar();
                                      }
                                    }}
                                    color="primary"
                                  />
                                }
                                label="Filtrar por período"
                              />
                            </FormControl>
                          </Grid>
                          {exibirPorPeriodo && (
                            <Grid item xs={12} sm={6} md={3}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Período</InputLabel>
                                <Select
                                  value={periodoSelecionado.getTime()}
                                  label="Período"
                                  onChange={(e) => setPeriodoSelecionado(new Date(e.target.value))}
                                >
                                  {obterPeriodosDisponiveis().map((periodo) => (
                                    <MenuItem key={periodo.getTime()} value={periodo.getTime()}>
                                      {periodo.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                          )}
                          <Grid item xs={12} sm={6} md={3}>
                            <Button
                              variant="contained"
                              fullWidth
                              size="small"
                              onClick={() => {
                                setFiltrosContasPagar({ categoria: '', fornecedor: '', status: '' });
                              }}
                            >
                              Limpar Filtros
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>

                    {/* Resumo */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid item xs={12} md={4}>
                        <Card sx={{ bgcolor: '#fef2f2', border: '1px solid #fca5a5' }}>
                          <CardContent>
                            <Typography variant="h6" color="#dc2626">
                              Saldo Disponível
                            </Typography>
                            <Typography variant="h4" color="#dc2626" fontWeight="bold">
                              {formatCurrency(saldoEscola)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card sx={{ bgcolor: '#fff7ed', border: '1px solid #fb923c' }}>
                          <CardContent>
                            <Typography variant="h6" color="#ea580c">
                              Contas Pendentes
                            </Typography>
                            <Typography variant="h4" color="#ea580c" fontWeight="bold">
                              {calcularEstatisticasPendentes().quantidade}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card sx={{ bgcolor: '#fef2f2', border: '1px solid #f87171' }}>
                          <CardContent>
                            <Typography variant="h6" color="#dc2626">
                              Valor Total Pendente
                            </Typography>
                            <Typography variant="h4" color="#dc2626" fontWeight="bold">
                              {formatCurrency(calcularEstatisticasPendentes().valorTotal)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Lista de Contas */}
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Categoria</TableCell>
                            <TableCell>Fornecedor</TableCell>
                            <TableCell>Valor</TableCell>
                            <TableCell>Vencimento/Pagamento</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Ação/Forma Pgto</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filtrarContasPagar().map((conta) => (
                            <TableRow 
                              key={conta.id}
                              sx={{ 
                                bgcolor: conta.status === 'paga' ? '#f0fdf4' : 'inherit',
                                opacity: conta.status === 'paga' ? 0.8 : 1
                              }}
                            >
                              <TableCell>{conta.descricao}</TableCell>
                              <TableCell>{conta.categoria}</TableCell>
                              <TableCell>{conta.fornecedor}</TableCell>
                              <TableCell>{formatCurrency(conta.valor)}</TableCell>
                              <TableCell>
                                {conta.status === 'paga' 
                                  ? formatDate(conta.dataPagamento) 
                                  : formatDate(conta.vencimento)
                                }
                              </TableCell>
                              <TableCell>
                                {conta.status === 'paga' ? (
                                  <Chip
                                    label="✅ Paga"
                                    color="success"
                                    size="small"
                                  />
                                ) : (
                                  <Chip
                                    label={new Date(conta.vencimento) < new Date() ? 'Vencida' : 'Pendente'}
                                    color={new Date(conta.vencimento) < new Date() ? 'error' : 'warning'}
                                    size="small"
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {conta.status === 'paga' ? (
                                  <Chip
                                    label={`💳 ${conta.formaPagamento || 'N/A'}`}
                                    variant="outlined"
                                    size="small"
                                  />
                                ) : (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => {
                                      // Obter data local no formato YYYY-MM-DD
                                      const hoje = new Date();
                                      const ano = hoje.getFullYear();
                                      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                                      const dia = String(hoje.getDate()).padStart(2, '0');
                                      const dataLocal = `${ano}-${mes}-${dia}`;
                                      
                                      setDialogPagamentoConta({ open: true, conta });
                                      setPagamentoConta({
                                        dataPagamento: dataLocal,
                                        formaPagamento: '',
                                        observacoes: ''
                                      });
                                    }}
                                    disabled={false}
                                  >
                                    Pagar
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {filtrarContasPagar().length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          {contasPagar.length === 0 ? 'Nenhuma conta a pagar encontrada' : 'Nenhuma conta encontrada com os filtros aplicados'}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tab Contas Pagas */}
              {tabValue === 4 && isCoordenador() && (
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box>
                        <Typography variant="h6" color="primary">
                          🟢 Contas Pagas - {mesAtual.mes.toString().padStart(2, '0')}/{mesAtual.ano}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Visualizando contas pagas do mês atual
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            const inicio = `${mesAtual.ano}-${mesAtual.mes.toString().padStart(2, '0')}-01`;
                            const fim = new Date(mesAtual.ano, mesAtual.mes, 0).toISOString().split('T')[0];
                            setFiltrosContasPagas(prev => ({ ...prev, dataInicio: inicio, dataFim: fim }));
                          }}
                        >
                          Mês Atual
                        </Button>
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<Receipt />}
                          onClick={() => imprimirDemonstrativo()}
                        >
                          Imprimir Demonstrativo
                        </Button>
                      </Box>
                    </Box>

                    {/* Filtros por período */}
                    <Card sx={{ mb: 3, bgcolor: '#f8fafc' }}>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom color="primary" fontWeight="bold">
                          📅 Filtros de Período
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Data Início"
                              type="date"
                              value={filtrosContasPagas.dataInicio}
                              onChange={(e) => setFiltrosContasPagas(prev => ({ ...prev, dataInicio: e.target.value }))}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Data Fim"
                              type="date"
                              value={filtrosContasPagas.dataFim}
                              onChange={(e) => setFiltrosContasPagas(prev => ({ ...prev, dataFim: e.target.value }))}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Button
                              variant="contained"
                              fullWidth
                              onClick={() => {
                                // Filtrar contas pagas por período
                                const contasFiltradas = contasPagas.filter(conta => {
                                  const dataPagamento = new Date(conta.dataPagamento);
                                  const inicio = filtrosContasPagas.dataInicio ? new Date(filtrosContasPagas.dataInicio) : null;
                                  const fim = filtrosContasPagas.dataFim ? new Date(filtrosContasPagas.dataFim) : null;
                                  
                                  if (inicio && dataPagamento < inicio) return false;
                                  if (fim && dataPagamento > fim) return false;
                                  return true;
                                });
                                setContasPagas(contasFiltradas);
                              }}
                            >
                              Filtrar
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>

                    {/* Resumo das Contas Pagas */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ bgcolor: '#f0fdf4', border: '1px solid #22c55e' }}>
                          <CardContent>
                            <Typography variant="h6" color="#16a34a">
                              Total de Contas Pagas
                            </Typography>
                            <Typography variant="h4" color="#16a34a" fontWeight="bold">
                              {contasPagas.length}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ bgcolor: '#f0fdf4', border: '1px solid #22c55e' }}>
                          <CardContent>
                            <Typography variant="h6" color="#16a34a">
                              Valor Total Pago
                            </Typography>
                            <Typography variant="h4" color="#16a34a" fontWeight="bold">
                              {formatCurrency(contasPagas.reduce((sum, conta) => sum + conta.valor, 0))}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Lista de Contas Pagas */}
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Categoria</TableCell>
                            <TableCell>Valor</TableCell>
                            <TableCell>Data Pagamento</TableCell>
                            <TableCell>Pago Por</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {contasPagas.map((conta) => (
                            <TableRow key={conta.id}>
                              <TableCell>{conta.descricao}</TableCell>
                              <TableCell>{conta.categoria}</TableCell>
                              <TableCell>{formatCurrency(conta.valor)}</TableCell>
                              <TableCell>{formatDate(conta.dataPagamento)}</TableCell>
                              <TableCell>
                                {alunos.find(u => u.id === conta.pagoPor)?.nome || 'Sistema'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {contasPagas.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          Nenhuma conta paga encontrada no período
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tab Relatórios */}
              {tabValue === 5 && isCoordenador() && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      📈 Relatórios Financeiros
                    </Typography>
                    
                    {/* Filtros de Relatórios */}
                    <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8fafc' }}>
                      <Typography variant="subtitle2" gutterBottom color="primary" fontWeight="bold">
                        🔍 Filtros de Período
                      </Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <TextField
                            label="Data Início"
                            type="date"
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            label="Data Fim"
                            type="date"
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Período</InputLabel>
                            <Select defaultValue="atual">
                              <MenuItem value="atual">Mês Atual</MenuItem>
                              <MenuItem value="anterior">Mês Anterior</MenuItem>
                              <MenuItem value="trimestre">Trimestre</MenuItem>
                              <MenuItem value="semestre">Semestre</MenuItem>
                              <MenuItem value="ano">Ano Atual</MenuItem>
                              <MenuItem value="personalizado">Personalizado</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Button variant="contained" fullWidth sx={{ height: '40px' }}>
                            Atualizar
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Relatórios Pré-definidos */}
                    <Grid container spacing={3}>
                      {/* Receita Mensal/Anual */}
                      <Grid item xs={12} sm={6} lg={4}>
                        <Card sx={{ 
                          bgcolor: '#f0f9ff', 
                          border: '1px solid #0ea5e9',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <MonetizationOn sx={{ color: '#0ea5e9', mr: 1 }} />
                              <Typography variant="h6" color="#0ea5e9" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                Relatório de Receitas
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                              Análise detalhada das receitas por período, tipo de título e forma de pagamento.
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              gap: 1, 
                              flexDirection: { xs: 'column', sm: 'row' },
                              flexWrap: 'wrap'
                            }}>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={gerarRelatorioReceitas}
                                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                              >
                                📄 Visualizar
                              </Button>
                              <Button 
                                size="small" 
                                variant="contained"
                                onClick={() => {
                                  const dados = {
                                    receitaMensal: metricas.receitaMensal || 0,
                                    receitaAnual: metricas.receitaAnual || 0,
                                    titulosPagos: titulos.filter(t => t.status === 'pago')
                                  };
                                  exportarParaExcel('receitas', dados);
                                }}
                                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                              >
                                📊 Excel
                              </Button>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="error"
                                onClick={() => {
                                  const dados = {
                                    receitaMensal: metricas.receitaMensal || 0,
                                    receitaAnual: metricas.receitaAnual || 0,
                                    titulosPagos: titulos.filter(t => t.status === 'pago')
                                  };
                                  exportarParaPDF('receitas', dados);
                                }}
                                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                              >
                                📋 PDF
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Inadimplência */}
                      <Grid item xs={12} sm={6} lg={4}>
                        <Card sx={{ 
                          bgcolor: '#fef3f2', 
                          border: '1px solid #ef4444',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Warning sx={{ color: '#ef4444', mr: 1 }} />
                              <Typography variant="h6" color="#ef4444" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                Relatório de Inadimplência
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                              Títulos vencidos, ranking de inadimplentes e análise por turma.
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              gap: 1, 
                              flexDirection: { xs: 'column', sm: 'row' },
                              flexWrap: 'wrap'
                            }}>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={gerarRelatorioInadimplencia}
                                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                              >
                                📄 Visualizar
                              </Button>
                              <Button 
                                size="small" 
                                variant="contained"
                                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                              >
                                📊 Excel
                              </Button>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="error"
                                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                              >
                                📋 PDF
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Fluxo de Caixa */}
                      <Grid item xs={12} sm={6} lg={4}>
                        <Card sx={{ 
                          bgcolor: '#f0fdf4', 
                          border: '1px solid #10b981',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <TrendingUp sx={{ color: '#10b981', mr: 1 }} />
                              <Typography variant="h6" color="#10b981" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                Fluxo de Caixa
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                              Entradas, saídas previstas e projeções de recebimento.
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              gap: 1, 
                              flexDirection: { xs: 'column', sm: 'row' },
                              flexWrap: 'wrap'
                            }}>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={gerarRelatorioFluxoCaixa}
                                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                              >
                                📄 Visualizar
                              </Button>
                              <Button 
                                size="small" 
                                variant="contained"
                                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                              >
                                📊 Excel
                              </Button>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="error"
                                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                              >
                                📋 PDF
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Demonstrativo por Aluno */}
                      <Grid item xs={12} sm={6} lg={4}>
                        <Card sx={{ 
                          bgcolor: '#fefbf3', 
                          border: '1px solid #f59e0b',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <School sx={{ color: '#f59e0b', mr: 1 }} />
                              <Typography variant="h6" color="#f59e0b" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                Demonstrativo por Aluno
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                              Histórico completo de títulos e pagamentos por aluno. Selecione os alunos para gerar o relatório.
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              gap: 1, 
                              flexDirection: { xs: 'column', sm: 'row' },
                              flexWrap: 'wrap'
                            }}>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={gerarDemonstrativoAluno}
                                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                              >
                                📄 Visualizar
                              </Button>
                              <Button 
                                size="small" 
                                variant="contained"
                                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                              >
                                📊 Excel
                              </Button>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="error"
                                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                              >
                                📋 PDF
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Comparativo Mensal */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ bgcolor: '#f8fafc', border: '1px solid #64748b' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Assessment sx={{ color: '#64748b', mr: 1 }} />
                              <Typography variant="h6" color="#64748b">
                                Comparativo Mensal
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Evolução das receitas mês a mês e análise de crescimento.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button size="small" variant="outlined">
                                📄 Visualizar
                              </Button>
                              <Button size="small" variant="contained">
                                📊 Excel
                              </Button>
                              <Button size="small" variant="contained" color="error">
                                📋 PDF
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Recibos e Comprovantes */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ bgcolor: '#faf5ff', border: '1px solid #8b5cf6' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Receipt sx={{ color: '#8b5cf6', mr: 1 }} />
                              <Typography variant="h6" color="#8b5cf6">
                                Recibos e Comprovantes
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Geração em lote de recibos e comprovantes de pagamento.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button size="small" variant="outlined">
                                📄 Visualizar
                              </Button>
                              <Button size="small" variant="contained">
                                📊 Excel
                              </Button>
                              <Button size="small" variant="contained" color="error">
                                📋 PDF
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Métricas Rápidas */}
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" gutterBottom color="primary">
                        📊 Métricas do Período Selecionado
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f0f9ff' }}>
                            <Typography variant="h4" color="primary" fontWeight="bold">
                              {formatCurrency(metricas.receitaMensal)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Receita no Período
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fef3f2' }}>
                            <Typography variant="h4" color="error" fontWeight="bold">
                              {metricas.alunosInadimplentes}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Alunos Inadimplentes
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f0fdf4' }}>
                            <Typography variant="h4" color="success.main" fontWeight="bold">
                              {filtrarTitulos().filter(t => t.status === 'pago').length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Títulos Pagos
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fefbf3' }}>
                            <Typography variant="h4" color="warning.main" fontWeight="bold">
                              {filtrarTitulos().filter(t => t.status === 'pendente').length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Títulos Pendentes
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </Box>

        {/* Dialog - Novo Título */}
        <Dialog 
          open={novoTituloDialog} 
          onClose={() => setNovoTituloDialog(false)} 
          maxWidth="sm" 
          fullWidth
          fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 2 }
            }
          }}
        >
          <DialogTitle sx={{ 
            fontSize: { xs: '1.1rem', md: '1.25rem' },
            p: { xs: 2, md: 3 }
          }}>
            💰 Gerar Novo Título
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: { xs: 2, md: 2 }, 
              mt: 1 
            }}>
              <Autocomplete
                options={alunos}
                getOptionLabel={(aluno) => `${aluno.nome} - ${aluno.matricula}`}
                value={alunos.find(a => a.id === novoTitulo.alunoId) || null}
                onChange={(e, value) => setNovoTitulo(prev => ({ ...prev, alunoId: value?.id || '' }))}
                renderInput={(params) => 
                  <TextField 
                    {...params} 
                    label="Aluno" 
                    required 
                  />
                }
              />
              
              <FormControl fullWidth required>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={novoTitulo.tipo}
                  label="Tipo"
                  onChange={(e) => setNovoTitulo(prev => ({ ...prev, tipo: e.target.value }))}
                >
                  <MenuItem value="matricula">Matrícula</MenuItem>
                  <MenuItem value="mensalidade">Mensalidade</MenuItem>
                  <MenuItem value="materiais">Materiais</MenuItem>
                  <MenuItem value="uniforme">Uniforme</MenuItem>
                  <MenuItem value="extra">Taxa Extra</MenuItem>
                  <MenuItem value="credito">Crédito</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Descrição"
                value={novoTitulo.descricao}
                onChange={(e) => setNovoTitulo(prev => ({ ...prev, descricao: e.target.value }))}
                required
                fullWidth
              />

              <TextField
                label="Valor (R$)"
                type="number"
                value={novoTitulo.valor}
                onChange={(e) => setNovoTitulo(prev => ({ ...prev, valor: e.target.value }))}
                required
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
              />

              <TextField
                label="Data de Vencimento"
                type="date"
                value={novoTitulo.vencimento}
                onChange={(e) => setNovoTitulo(prev => ({ ...prev, vencimento: e.target.value }))}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Observações"
                value={novoTitulo.observacoes}
                onChange={(e) => setNovoTitulo(prev => ({ ...prev, observacoes: e.target.value }))}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: { xs: 2, md: 3 },
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Button 
              onClick={() => setNovoTituloDialog(false)}
              fullWidth={typeof window !== 'undefined' && window.innerWidth < 600}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleGerarTitulo} 
              variant="contained"
              disabled={!novoTitulo.alunoId || !novoTitulo.descricao || !novoTitulo.valor || !novoTitulo.vencimento}
              fullWidth={typeof window !== 'undefined' && window.innerWidth < 600}
            >
              Gerar Título
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog - Pagamento com Comprovante */}
        <Dialog 
          open={pagamentoDialog} 
          onClose={() => setPagamentoDialog(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 2 }
            }
          }}
        >
          <DialogTitle sx={{ 
            fontSize: { xs: '1.1rem', md: '1.25rem' },
            p: { xs: 2, md: 3 }
          }}>
            Enviar Comprovante de Pagamento
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
            {tituloSelecionado && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Título: {tituloSelecionado.descricao}
                </Typography>
                <Typography variant="h6" color="primary">
                  Valor Original: {formatCurrency(tituloSelecionado.valor)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vencimento: {formatDate(tituloSelecionado.vencimento)}
                </Typography>

                {/* Detalhamento de Juros e Multa */}
                {calculoJurosMultaPai && calculoJurosMultaPai.diasAtraso > 0 && (
                  <Alert severity="warning" icon={<Warning />} sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      ⚠️ Título em Atraso - {calculoJurosMultaPai.diasAtraso} dia(s)
                    </Typography>
                    <Box sx={{ mt: 1.5 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Valor Original:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(calculoJurosMultaPai.valorOriginal)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Multa ({calculoJurosMultaPai.percentualMulta}%):
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="error">
                            + {formatCurrency(calculoJurosMultaPai.multa)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Juros ({calculoJurosMultaPai.jurosDia}% × {calculoJurosMultaPai.diasAtraso} dias):
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="error">
                            + {formatCurrency(calculoJurosMultaPai.juros)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Total a Pagar:
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="error">
                            {formatCurrency(calculoJurosMultaPai.total)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Alert>
                )}
              </Box>
            )}
            
            <TextField
              label="Observações (opcional)"
              multiline
              rows={3}
              fullWidth
              value={pagamento.observacoes}
              onChange={(e) => setPagamento({...pagamento, observacoes: e.target.value})}
              sx={{ mb: 3 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Comprovante de Pagamento *
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                fullWidth
                sx={{ py: { xs: 1.5, md: 2 } }}
              >
                {pagamento.comprovante ? pagamento.comprovante.name : 'Selecionar Arquivo'}
                <input
                  type="file"
                  hidden
                  accept="image/*,.pdf"
                  onChange={handleComprovanteChange}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: { xs: 2, md: 3 },
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Button 
              onClick={() => setPagamentoDialog(false)}
              disabled={pagamento.carregando}
              fullWidth={typeof window !== 'undefined' && window.innerWidth < 600}
            >
              Cancelar
            </Button>
            <Button 
              onClick={enviarPagamento}
              variant="contained"
              disabled={!pagamento.comprovante || pagamento.carregando}
              startIcon={pagamento.carregando ? <CircularProgress size={20} /> : <Payment />}
              fullWidth={typeof window !== 'undefined' && window.innerWidth < 600}
            >
              {pagamento.carregando ? 'Enviando...' : 'Enviar Pagamento'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog - Baixa de Título */}
        <BaixaTituloDialog
          open={baixaDialog}
          onClose={() => {
            setBaixaDialog(false);
            setTituloSelecionado(null);
          }}
          titulo={tituloSelecionado}
          userId={userId}
          onSuccess={() => {
            setBaixaDialog(false);
            setTituloSelecionado(null);
            fetchData();
          }}
        />

        {/* Speed Dial - Ações Rápidas */}
        {userRole === 'coordenadora' && (
          <SpeedDial
            ariaLabel="Ações Rápidas"
            sx={{ 
              position: 'fixed', 
              bottom: { xs: 70, md: 16 }, 
              right: { xs: 16, md: 16 },
              '& .MuiFab-root': {
                width: { xs: 48, md: 56 },
                height: { xs: 48, md: 56 }
              }
            }}
            icon={<SpeedDialIcon />}
          >
            <SpeedDialAction
              icon={<Add />}
              tooltipTitle="Gerar Título"
              onClick={() => setNovoTituloDialog(true)}
            />
            <SpeedDialAction
              icon={<AutoAwesome />}
              tooltipTitle="Auto Mensalidades"
              onClick={() => setGeradorMensalidadesDialog(true)}
            />
            <SpeedDialAction
              icon={<Receipt />}
              tooltipTitle="Ver Títulos"
              onClick={() => setTabValue(1)}
            />
            <SpeedDialAction
              icon={<Print />}
              tooltipTitle="Relatórios"
              onClick={() => setTabValue(2)}
            />
          </SpeedDial>
        )}

        {/* Dialog - Gerador de Mensalidades */}
        <GeradorMensalidadesDialog
          open={geradorMensalidadesDialog}
          onClose={() => setGeradorMensalidadesDialog(false)}
          onSuccess={() => {
            fetchData();
            setGeradorMensalidadesDialog(false);
          }}
        />

        {/* Dialog - Visualização de Relatórios */}
        <Dialog 
          open={relatorios.dialogOpen} 
          onClose={() => setRelatorios(prev => ({
            ...prev, 
            dialogOpen: false,
            filtroAlunos: [] // Limpar filtro ao fechar
          }))}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            📊 {relatorios.tipoRelatorio === 'receitas' && 'Relatório de Receitas'}
            {relatorios.tipoRelatorio === 'inadimplencia' && 'Relatório de Inadimplência'}
            {relatorios.tipoRelatorio === 'fluxocaixa' && 'Relatório de Fluxo de Caixa'}
            {relatorios.tipoRelatorio === 'demonstrativo' && 'Demonstrativo por Aluno'}
          </DialogTitle>
          <DialogContent>
            {relatorios.dadosRelatorio && (
              <Box sx={{ mt: 2 }}>
                {/* Relatório de Receitas */}
                {relatorios.tipoRelatorio === 'receitas' && (
                  <Box>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f0f9ff' }}>
                          <Typography variant="h4" color="primary">
                            {formatCurrency(relatorios.dadosRelatorio.receitaMensal)}
                          </Typography>
                          <Typography variant="caption">Receita Mensal</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f0fdf4' }}>
                          <Typography variant="h4" color="success.main">
                            {formatCurrency(relatorios.dadosRelatorio.receitaAnual)}
                          </Typography>
                          <Typography variant="caption">Receita Anual</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    <Typography variant="h6" gutterBottom>Títulos Pagos</Typography>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Aluno</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Valor</TableCell>
                            <TableCell>Data Pagamento</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {relatorios.dadosRelatorio.titulosPagos.slice(0, 10).map((titulo, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {alunos.find(a => a.id === titulo.alunoId)?.nome || 'N/A'}
                              </TableCell>
                              <TableCell>{titulo.tipo}</TableCell>
                              <TableCell>{titulo.descricao}</TableCell>
                              <TableCell>{formatCurrency(titulo.valor)}</TableCell>
                              <TableCell>{titulo.dataPagamento ? formatDate(titulo.dataPagamento) : 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Relatório de Inadimplência */}
                {relatorios.tipoRelatorio === 'inadimplencia' && (
                  <Box>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fef3f2' }}>
                          <Typography variant="h4" color="error">
                            {relatorios.dadosRelatorio.totalInadimplentes}
                          </Typography>
                          <Typography variant="caption">Alunos Inadimplentes</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fef3f2' }}>
                          <Typography variant="h4" color="error">
                            {formatCurrency(relatorios.dadosRelatorio.valorTotalDevido)}
                          </Typography>
                          <Typography variant="caption">Valor Total Devido</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    <Typography variant="h6" gutterBottom>Ranking de Inadimplentes</Typography>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Aluno</TableCell>
                            <TableCell>Turma</TableCell>
                            <TableCell>Títulos Vencidos</TableCell>
                            <TableCell>Valor Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {relatorios.dadosRelatorio.inadimplentes.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.aluno}</TableCell>
                              <TableCell>{item.turma}</TableCell>
                              <TableCell>{item.titulos.length}</TableCell>
                              <TableCell>{formatCurrency(item.valorTotal)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Relatório de Fluxo de Caixa */}
                {relatorios.tipoRelatorio === 'fluxocaixa' && (
                  <Box>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f0fdf4' }}>
                          <Typography variant="h4" color="success.main">
                            {formatCurrency(relatorios.dadosRelatorio.receitaAtual)}
                          </Typography>
                          <Typography variant="caption">Receita Atual</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fefbf3' }}>
                          <Typography variant="h4" color="warning.main">
                            {formatCurrency(relatorios.dadosRelatorio.previsaoProximoMes)}
                          </Typography>
                          <Typography variant="caption">Previsão Próximo Mês</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    <Typography variant="h6" gutterBottom>Títulos com Vencimento Próximo</Typography>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Aluno</TableCell>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Valor</TableCell>
                            <TableCell>Vencimento</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {relatorios.dadosRelatorio.titulosProximos.slice(0, 10).map((titulo, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {alunos.find(a => a.id === titulo.alunoId)?.nome || 'N/A'}
                              </TableCell>
                              <TableCell>{titulo.descricao}</TableCell>
                              <TableCell>{formatCurrency(titulo.valor)}</TableCell>
                              <TableCell>{formatDate(titulo.vencimento)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Demonstrativo por Aluno */}
                {relatorios.tipoRelatorio === 'demonstrativo' && (
                  <Box>
                    {/* Filtro de Seleção de Alunos */}
                    <Card sx={{ mb: 3, bgcolor: '#f8fafc' }}>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom color="primary" fontWeight="bold">
                          🎯 Filtrar Alunos
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Autocomplete
                              multiple
                              options={alunos}
                              getOptionLabel={(aluno) => `${aluno.nome} - ${aluno.matricula} (${turmas[aluno.turmaId]?.nome || 'N/A'})`}
                              value={alunos.filter(aluno => relatorios.filtroAlunos.includes(aluno.id))}
                              onChange={(e, selectedAlunos) => {
                                const selectedIds = selectedAlunos.map(aluno => aluno.id);
                                setRelatorios(prev => ({
                                  ...prev,
                                  filtroAlunos: selectedIds
                                }));
                              }}
                              renderInput={(params) => (
                                <TextField 
                                  {...params} 
                                  label="Selecionar Alunos" 
                                  placeholder="Digite para buscar alunos (obrigatório para gerar relatório)"
                                  helperText={relatorios.filtroAlunos.length > 0 
                                    ? `${relatorios.filtroAlunos.length} aluno(s) selecionado(s)` 
                                    : 'Selecione pelo menos um aluno para gerar o relatório'
                                  }
                                />
                              )}
                              renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                  <Chip
                                    variant="outlined"
                                    label={option.nome}
                                    {...getTagProps({ index })}
                                    size="small"
                                    color="primary"
                                  />
                                ))
                              }
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', md: 'row' } }}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setRelatorios(prev => ({
                                  ...prev,
                                  filtroAlunos: []
                                }))}
                                disabled={relatorios.filtroAlunos.length === 0}
                              >
                                🗑️ Limpar
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={gerarDemonstrativoAluno}
                                disabled={relatorios.filtroAlunos.length === 0}
                              >
                                🔄 Atualizar
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                    
                    <Typography variant="h6" gutterBottom>
                      Resumo Financeiro por Aluno
                      {relatorios.filtroAlunos.length > 0 ? (
                        <Chip 
                          label={`${relatorios.filtroAlunos.length} aluno(s) selecionado(s)`}
                          size="small"
                          color="primary"
                          sx={{ ml: 2 }}
                        />
                      ) : (
                        <Chip 
                          label="⚠️ Selecione alunos para gerar relatório"
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ ml: 2 }}
                        />
                      )}
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Aluno</TableCell>
                            <TableCell>Matrícula</TableCell>
                            <TableCell>Turma</TableCell>
                            <TableCell>Total Títulos</TableCell>
                            <TableCell>Valor Total</TableCell>
                            <TableCell>Valor Pago</TableCell>
                            <TableCell>Valor Pendente</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {relatorios.dadosRelatorio.demonstrativos.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                  <School sx={{ fontSize: 48, color: 'text.disabled' }} />
                                  <Typography variant="h6" color="text.secondary">
                                    Nenhum aluno selecionado
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
                                    Use o filtro acima para selecionar um ou mais alunos e visualizar seus demonstrativos financeiros.
                                    Isso ajuda a manter o desempenho do sistema.
                                  </Typography>
                                  <Button 
                                    variant="outlined" 
                                    size="small"
                                    onClick={() => {
                                      // Focar no campo de seleção (scroll para cima)
                                      document.querySelector('[data-testid="CloseIcon"]')?.closest('.MuiDialog-container')?.scrollTo({
                                        top: 0,
                                        behavior: 'smooth'
                                      });
                                    }}
                                  >
                                    👆 Selecionar Alunos
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ) : (
                            relatorios.dadosRelatorio.demonstrativos.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.aluno}</TableCell>
                                <TableCell>{item.matricula}</TableCell>
                                <TableCell>{item.turma}</TableCell>
                                <TableCell>{item.totalTitulos}</TableCell>
                                <TableCell>{formatCurrency(item.valorTotal)}</TableCell>
                                <TableCell>{formatCurrency(item.valorPago)}</TableCell>
                                <TableCell>{formatCurrency(item.valorPendente)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRelatorios(prev => ({
              ...prev, 
              dialogOpen: false,
              filtroAlunos: [] // Limpar filtro ao fechar
            }))}>
              Fechar
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => exportarParaExcel(relatorios.tipoRelatorio, relatorios.dadosRelatorio)}
            >
              📊 Exportar Excel
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={() => exportarParaPDF(relatorios.tipoRelatorio, relatorios.dadosRelatorio)}
            >
              📋 Exportar PDF
            </Button>
            <Button 
              variant="outlined"
              onClick={() => imprimirRelatorio(relatorios.tipoRelatorio, relatorios.dadosRelatorio)}
            >
              🖨️ Imprimir
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Detalhes do Título */}
        <Dialog 
          open={detalheTitulo.dialogOpen} 
          onClose={() => setDetalheTitulo(prev => ({ ...prev, dialogOpen: false }))}
          maxWidth="md"
          fullWidth
          fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility color="primary" />
            <Typography variant="h6" component="span">
              Detalhes do Título
            </Typography>
          </DialogTitle>
          <DialogContent>
            {detalheTitulo.titulo && (
              <Box sx={{ pt: 1 }}>
                <Grid container spacing={3}>
                  {/* Informações Básicas */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          📋 Informações Básicas
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {detalheTitulo.titulo.tipo}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Descrição:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {detalheTitulo.titulo.descricao}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Valor Original:</Typography>
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {formatCurrency(detalheTitulo.titulo.valor)}
                            </Typography>
                          </Box>
                          
                          {/* Mostrar Juros e Multa se vencido */}
                          {verificarSeVencido(detalheTitulo.titulo) && financeiroService?.calcularJurosMulta && (() => {
                            const calculo = financeiroService.calcularJurosMulta(detalheTitulo.titulo);
                            if (calculo.diasAtraso > 0) {
                              return (
                                <>
                                  <Divider sx={{ my: 1 }} />
                                  <Alert severity="warning" sx={{ my: 1 }}>
                                    <Typography variant="caption" fontWeight="bold" gutterBottom>
                                      ⚠️ Título Vencido - {calculo.diasAtraso} dia(s) de atraso
                                    </Typography>
                                  </Alert>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      Multa ({calculo.percentualMulta}%):
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" color="error">
                                      + {formatCurrency(calculo.multa)}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      Juros ({calculo.jurosDia}% × {calculo.diasAtraso} dias):
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" color="error">
                                      + {formatCurrency(calculo.juros)}
                                    </Typography>
                                  </Box>
                                  <Divider sx={{ my: 1 }} />
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary" fontWeight="bold">
                                      Total a Pagar:
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" color="error">
                                      {formatCurrency(calculo.total)}
                                    </Typography>
                                  </Box>
                                </>
                              );
                            }
                            return null;
                          })()}
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Status:</Typography>
                            <Chip 
                              label={getStatusLabel(getStatusVisual(detalheTitulo.titulo))} 
                              size="small"
                              color={getStatusColor(getStatusVisual(detalheTitulo.titulo))}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Informações do Aluno */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          👤 Informações do Aluno
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Nome:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {alunos.find(a => a.id === detalheTitulo.titulo.alunoId)?.nome || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Matrícula:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {alunos.find(a => a.id === detalheTitulo.titulo.alunoId)?.matricula || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Turma:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {(() => {
                                const aluno = alunos.find(a => a.id === detalheTitulo.titulo.alunoId);
                                const turmaId = aluno?.turmaId;
                                return turmaId && turmas[turmaId] ? turmas[turmaId].nome : 'N/A';
                              })()}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Informações de Pagamento */}
                  {detalheTitulo.titulo.pagamento && (
                    <Grid item xs={12} md={6}>
                      <Card sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="primary">
                            💳 Informações de Pagamento
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Data de Envio:</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {detalheTitulo.titulo.pagamento.dataEnvio ? 
                                  formatDate(detalheTitulo.titulo.pagamento.dataEnvio) : 'N/A'}
                              </Typography>
                            </Box>
                            
                            {detalheTitulo.titulo.pagamento.observacoes && (
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  Observações do Pagamento:
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" sx={{ 
                                  whiteSpace: 'pre-wrap',
                                  backgroundColor: 'grey.50',
                                  p: 1,
                                  borderRadius: 1
                                }}>
                                  {detalheTitulo.titulo.pagamento.observacoes}
                                </Typography>
                              </Box>
                            )}

                            {detalheTitulo.titulo.pagamento.comprovanteUrl && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  Comprovante de Pagamento:
                                </Typography>
                                <Button
                                  variant="outlined"
                                  startIcon={<Visibility />}
                                  fullWidth
                                  onClick={() => {
                                    setComprovanteDialog(true);
                                  }}
                                  sx={{ mb: 1 }}
                                >
                                  Ver Comprovante
                                </Button>
                                <Typography variant="caption" color="text.secondary">
                                  Arquivo enviado pelo responsável
                                </Typography>
                              </Box>
                            )}

                            {detalheTitulo.titulo.pagamento.dataAprovacao && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">Data de Aprovação:</Typography>
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                  {formatDate(detalheTitulo.titulo.pagamento.dataAprovacao)}
                                </Typography>
                              </Box>
                            )}

                            {detalheTitulo.titulo.pagamento.dataRejeicao && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">Data de Rejeição:</Typography>
                                <Typography variant="body2" fontWeight="bold" color="error.main">
                                  {formatDate(detalheTitulo.titulo.pagamento.dataRejeicao)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* Informações de Cancelamento */}
                  {detalheTitulo.titulo.status === 'cancelado' && detalheTitulo.titulo.motivoCancelamento && (
                    <Grid item xs={12} md={6}>
                      <Card sx={{ mb: 2, borderColor: 'error.main', border: 1 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="error">
                            ❌ Informações de Cancelamento
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Data do Cancelamento:</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {detalheTitulo.titulo.dataCancelamento ? 
                                  formatDate(detalheTitulo.titulo.dataCancelamento) : 'N/A'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Cancelado por:</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {detalheTitulo.titulo.canceladoPor || 'Sistema'}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Motivo do Cancelamento:
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ 
                                whiteSpace: 'pre-wrap',
                                backgroundColor: 'error.50',
                                p: 1.5,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'error.light'
                              }}>
                                {detalheTitulo.titulo.motivoCancelamento}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* Datas e Vencimentos */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          📅 Datas e Vencimentos
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Data de Criação:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {detalheTitulo.titulo.dataGeracao ? 
                                formatDate(detalheTitulo.titulo.dataGeracao) : 
                                (detalheTitulo.titulo.createdAt ? 
                                  formatDate(detalheTitulo.titulo.createdAt) : 'N/A')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Data de Vencimento:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {detalheTitulo.titulo.vencimento ? 
                                formatDate(detalheTitulo.titulo.vencimento) : 'N/A'}
                            </Typography>
                          </Box>
                          {detalheTitulo.titulo.dataPagamento && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Data de Pagamento:</Typography>
                              <Typography variant="body2" fontWeight="bold" color="success.main">
                                {formatDate(detalheTitulo.titulo.dataPagamento)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Observações */}
                  {detalheTitulo.titulo.observacoes && (
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="primary">
                            📝 Observações
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {(() => {
                              // Substituir ID da turma pelo nome da turma nas observações
                              let obs = detalheTitulo.titulo.observacoes;
                              if (obs && obs.includes('Turma:')) {
                                const aluno = alunos.find(a => a.id === detalheTitulo.titulo.alunoId);
                                const turmaId = aluno?.turmaId;
                                if (turmaId && turmas[turmaId]) {
                                  // Substituir o ID da turma pelo nome
                                  obs = obs.replace(/Turma:\s*[^\s|]+/, `Turma: ${turmas[turmaId].nome}`);
                                }
                              }
                              return obs;
                            })()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDetalheTitulo(prev => ({ ...prev, dialogOpen: false }))}
            >
              Fechar
            </Button>
            
            {/* Botões para coordenadora - Títulos em análise */}
            {isCoordenador() && detalheTitulo.titulo && detalheTitulo.titulo.status === 'em_analise' && (
              <>
                <Button 
                  variant="outlined"
                  color="error"
                  startIcon={<CancelOutlined />}
                  onClick={() => {
                    rejeitarPagamento(detalheTitulo.titulo);
                    setDetalheTitulo(prev => ({ ...prev, dialogOpen: false }));
                  }}
                >
                  Rejeitar Pagamento
                </Button>
                <Button 
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleOutlined />}
                  onClick={() => {
                    aprovarPagamento(detalheTitulo.titulo);
                    setDetalheTitulo(prev => ({ ...prev, dialogOpen: false }));
                  }}
                >
                  Aprovar Pagamento
                </Button>
              </>
            )}

            {/* Botão para coordenadora - Títulos pendentes */}
            {isCoordenador() && detalheTitulo.titulo && detalheTitulo.titulo.status === 'pendente' && (
              <Button 
                variant="contained" 
                color="success"
                startIcon={<Payment />}
                onClick={() => {
                  setTituloSelecionado(detalheTitulo.titulo);
                  setBaixaDialog(true);
                  setDetalheTitulo(prev => ({ ...prev, dialogOpen: false }));
                }}
              >
                Dar Baixa Manual
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Dialog - Visualização de Comprovante */}
        <Dialog 
          open={comprovanteDialog} 
          onClose={() => setComprovanteDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCamera color="primary" />
            <Typography variant="h6" component="span">
              Comprovante de Pagamento
            </Typography>
          </DialogTitle>
          <DialogContent>
            {detalheTitulo.titulo?.pagamento?.comprovanteUrl ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Título:</strong> {detalheTitulo.titulo.descricao}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Valor:</strong> {formatCurrency(detalheTitulo.titulo.valor)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enviado em: {detalheTitulo.titulo.pagamento.dataEnvio ? 
                    formatDate(detalheTitulo.titulo.pagamento.dataEnvio) : 'N/A'}
                </Typography>
                
                {/* Informações do arquivo */}
                {detalheTitulo.titulo.pagamento.comprovanteNome && (
                  <Box sx={{ mb: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Arquivo:</strong> {detalheTitulo.titulo.pagamento.comprovanteNome}
                    </Typography>
                    {detalheTitulo.titulo.pagamento.comprovanteTamanho && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                        ({(detalheTitulo.titulo.pagamento.comprovanteTamanho / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Visualização do comprovante real */}
                <Paper 
                  sx={{ 
                    p: 2, 
                    backgroundColor: 'white',
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 2,
                    maxHeight: '400px',
                    overflow: 'auto'
                  }}
                >
                  {detalheTitulo.titulo.pagamento.comprovanteTipo?.startsWith('image/') ? (
                    // Exibir imagem
                    <Box sx={{ textAlign: 'center' }}>
                      <img 
                        src={detalheTitulo.titulo.pagamento.comprovanteUrl} 
                        alt="Comprovante de Pagamento"
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '350px',
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <Box sx={{ display: 'none', textAlign: 'center', py: 4 }}>
                        <PhotoCamera sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                        <Typography variant="body2" color="grey.500">
                          Erro ao carregar imagem
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          sx={{ mt: 1 }}
                          onClick={() => window.open(detalheTitulo.titulo.pagamento.comprovanteUrl, '_blank')}
                        >
                          Abrir em Nova Aba
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    // Para PDFs e outros tipos de arquivo
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <FileDownload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6" color="primary.main" sx={{ mb: 1 }}>
                        Documento Anexado
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {detalheTitulo.titulo.pagamento.comprovanteNome}
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<Visibility />}
                        onClick={() => window.open(detalheTitulo.titulo.pagamento.comprovanteUrl, '_blank')}
                      >
                        Visualizar Arquivo
                      </Button>
                    </Box>
                  )}
                </Paper>

                {detalheTitulo.titulo.pagamento.observacoes && (
                  <Box sx={{ mt: 3, textAlign: 'left' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Observações do Responsável:
                    </Typography>
                    <Paper sx={{ p: 2, backgroundColor: 'blue.50' }}>
                      <Typography variant="body2">
                        {detalheTitulo.titulo.pagamento.observacoes}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Nenhum comprovante encontrado para este título.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setComprovanteDialog(false)}>
              Fechar
            </Button>
            {isCoordenador() && detalheTitulo.titulo?.status === 'em_analise' && (
              <>
                <Button 
                  variant="outlined"
                  color="error"
                  startIcon={<CancelOutlined />}
                  onClick={() => {
                    rejeitarPagamento(detalheTitulo.titulo);
                    setComprovanteDialog(false);
                    setDetalheTitulo(prev => ({ ...prev, dialogOpen: false }));
                  }}
                >
                  Rejeitar
                </Button>
                <Button 
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleOutlined />}
                  onClick={() => {
                    aprovarPagamento(detalheTitulo.titulo);
                    setComprovanteDialog(false);
                    setDetalheTitulo(prev => ({ ...prev, dialogOpen: false }));
                  }}
                >
                  Aprovar
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Dialog Anexar Boleto/PIX */}
        <Dialog 
          open={anexoBoletoDialog} 
          onClose={() => {
            setAnexoBoletoDialog(false);
            setArquivoSelecionado(null);
            setTituloParaAnexo(null);
          }} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUpload color="primary" />
              <Typography variant="h6">Anexar Boleto/PIX</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Anexe o boleto ou QR Code PIX para este título. O arquivo ficará visível para o responsável financeiro do aluno.
              </Alert>

              {tituloParaAnexo && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Título:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {tituloParaAnexo.descricao}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aluno: {alunos.find(a => a.id === tituloParaAnexo.alunoId)?.nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Valor: {formatCurrency(tituloParaAnexo.valor)}
                  </Typography>
                </Box>
              )}

              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<AttachFile />}
                sx={{ mb: 2 }}
              >
                Selecionar Arquivo
                <input
                  type="file"
                  hidden
                  accept="image/*,.pdf"
                  onChange={handleArquivoSelecionado}
                />
              </Button>

              {arquivoSelecionado && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Arquivo selecionado:</strong> {arquivoSelecionado.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tamanho: {(arquivoSelecionado.size / 1024).toFixed(2)} KB
                  </Typography>
                </Alert>
              )}

              <Typography variant="caption" color="text.secondary">
                Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setAnexoBoletoDialog(false);
                setArquivoSelecionado(null);
                setTituloParaAnexo(null);
              }}
              disabled={uploadandoAnexo}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUploadAnexoBoleto}
              variant="contained"
              disabled={!arquivoSelecionado || uploadandoAnexo}
              startIcon={uploadandoAnexo ? <CircularProgress size={20} /> : <CloudUpload />}
            >
              {uploadandoAnexo ? 'Anexando...' : 'Anexar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Nova Conta a Pagar */}
        <Dialog open={novaContaDialog} onClose={() => setNovaContaDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>🔴 Nova Conta a Pagar</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Descrição"
                  value={novaConta.descricao}
                  onChange={(e) => setNovaConta(prev => ({ ...prev, descricao: e.target.value }))}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required sx={{ minWidth: '250px' }}>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={novaConta.categoria}
                    label="Categoria"
                    onChange={(e) => setNovaConta(prev => ({ ...prev, categoria: e.target.value }))}
                  >
                    <MenuItem value="aluguel">Aluguel</MenuItem>
                    <MenuItem value="energia">Energia Elétrica</MenuItem>
                    <MenuItem value="agua">Água</MenuItem>
                    <MenuItem value="internet">Internet</MenuItem>
                    <MenuItem value="telefone">Telefone</MenuItem>
                    <MenuItem value="material">Material Escolar</MenuItem>
                    <MenuItem value="manutencao">Manutenção</MenuItem>
                    <MenuItem value="limpeza">Limpeza</MenuItem>
                    <MenuItem value="salarios">Salários</MenuItem>
                    <MenuItem value="impostos">Impostos</MenuItem>
                    <MenuItem value="outros">Outros</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fornecedor"
                  value={novaConta.fornecedor}
                  onChange={(e) => setNovaConta(prev => ({ ...prev, fornecedor: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Valor (R$)"
                  type="number"
                  value={novaConta.valor}
                  onChange={(e) => setNovaConta(prev => ({ ...prev, valor: e.target.value }))}
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Data de Vencimento"
                  type="date"
                  value={novaConta.vencimento}
                  onChange={(e) => setNovaConta(prev => ({ ...prev, vencimento: e.target.value }))}
                  fullWidth
                  required={!novaConta.jaFoiPaga}
                  disabled={novaConta.jaFoiPaga}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={novaConta.recorrente}
                      onChange={(e) => setNovaConta(prev => ({ ...prev, recorrente: e.target.checked }))}
                    />
                  }
                  label="Conta Recorrente"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={novaConta.jaFoiPaga}
                      onChange={(e) => setNovaConta(prev => ({ 
                        ...prev, 
                        jaFoiPaga: e.target.checked,
                        vencimento: e.target.checked ? '' : prev.vencimento
                      }))}
                    />
                  }
                  label="Conta já foi paga"
                />
              </Grid>
              {novaConta.jaFoiPaga && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Data do Pagamento"
                      type="date"
                      value={novaConta.dataPagamento}
                      onChange={(e) => setNovaConta(prev => ({ ...prev, dataPagamento: e.target.value }))}
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required sx={{ minWidth: '250px' }}>
                      <InputLabel>Forma de Pagamento</InputLabel>
                      <Select
                        value={novaConta.formaPagamento}
                        label="Forma de Pagamento"
                        onChange={(e) => setNovaConta(prev => ({ ...prev, formaPagamento: e.target.value }))}
                      >
                        <MenuItem value="dinheiro">Dinheiro</MenuItem>
                        <MenuItem value="pix">PIX</MenuItem>
                        <MenuItem value="transferencia">Transferência</MenuItem>
                        <MenuItem value="cartao">Cartão</MenuItem>
                        <MenuItem value="boleto">Boleto</MenuItem>
                        <MenuItem value="debito">Débito Automático</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
              {novaConta.recorrente && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Recorrência</InputLabel>
                    <Select
                      value={novaConta.tipoRecorrencia}
                      label="Tipo de Recorrência"
                      onChange={(e) => setNovaConta(prev => ({ ...prev, tipoRecorrencia: e.target.value }))}
                    >
                      <MenuItem value="mensal">Mensal</MenuItem>
                      <MenuItem value="trimestral">Trimestral</MenuItem>
                      <MenuItem value="anual">Anual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  label="Observações"
                  value={novaConta.observacoes}
                  onChange={(e) => setNovaConta(prev => ({ ...prev, observacoes: e.target.value }))}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNovaContaDialog(false)}>Cancelar</Button>
            <Button 
              onClick={criarConta}
              variant="contained"
              disabled={
                !novaConta.descricao || 
                !novaConta.categoria || 
                !novaConta.valor || 
                (!novaConta.jaFoiPaga && !novaConta.vencimento) ||
                (novaConta.jaFoiPaga && (!novaConta.dataPagamento || !novaConta.formaPagamento))
              }
            >
              Criar Conta
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Pagamento de Conta */}
        <Dialog open={dialogPagamentoConta.open} onClose={() => {
          setDialogPagamentoConta({ open: false, conta: null });
          setPermitirSaldoNegativo(false);
        }} maxWidth="sm" fullWidth>
          <DialogTitle>💸 Pagar Conta</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {dialogPagamentoConta.conta && (
                <>
                  <Typography variant="h6">{dialogPagamentoConta.conta.descricao}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fornecedor: {dialogPagamentoConta.conta.fornecedor}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vencimento: {new Date(dialogPagamentoConta.conta.vencimento).toLocaleDateString('pt-BR')}
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    R$ {parseFloat(dialogPagamentoConta.conta.valor || 0).toFixed(2).replace('.', ',')}
                  </Typography>
                  
                  <TextField
                    label="Data do Pagamento"
                    type="date"
                    value={pagamentoConta.dataPagamento}
                    onChange={(e) => setPagamentoConta(prev => ({ ...prev, dataPagamento: e.target.value }))}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                  
                  <FormControl fullWidth required sx={{ minWidth: '250px' }}>
                    <InputLabel>Forma de Pagamento</InputLabel>
                    <Select
                      value={pagamentoConta.formaPagamento}
                      label="Forma de Pagamento"
                      onChange={(e) => setPagamentoConta(prev => ({ ...prev, formaPagamento: e.target.value }))}
                    >
                      <MenuItem value="dinheiro">Dinheiro</MenuItem>
                      <MenuItem value="pix">PIX</MenuItem>
                      <MenuItem value="transferencia">Transferência</MenuItem>
                      <MenuItem value="cartao">Cartão</MenuItem>
                      <MenuItem value="boleto">Boleto</MenuItem>
                      <MenuItem value="debito">Débito Automático</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Observações"
                    value={pagamentoConta.observacoes}
                    onChange={(e) => setPagamentoConta(prev => ({ ...prev, observacoes: e.target.value }))}
                    fullWidth
                    multiline
                    rows={3}
                  />
                  
                  {/* Verificação de saldo e opção de saldo negativo */}
                  {dialogPagamentoConta.conta && saldoEscola < dialogPagamentoConta.conta.valor && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Saldo insuficiente!</strong> 
                        <br />Saldo atual: {formatCurrency(saldoEscola)}
                        <br />Valor da conta: {formatCurrency(dialogPagamentoConta.conta.valor)}
                        <br />Saldo após pagamento: {formatCurrency(saldoEscola - dialogPagamentoConta.conta.valor)}
                      </Typography>
                      
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={permitirSaldoNegativo}
                            onChange={(e) => setPermitirSaldoNegativo(e.target.checked)}
                            color="warning"
                          />
                        }
                        label="Permitir saldo negativo e prosseguir com o pagamento"
                        sx={{ mt: 1 }}
                      />
                    </Alert>
                  )}
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setDialogPagamentoConta({ open: false, conta: null });
              setPermitirSaldoNegativo(false);
            }}>Cancelar</Button>
            <Button 
              onClick={() => pagarConta(dialogPagamentoConta.conta)}
              variant="contained"
              color="success"
              disabled={
                !pagamentoConta.dataPagamento || 
                !pagamentoConta.formaPagamento || 
                processingOperation ||
                (dialogPagamentoConta.conta && saldoEscola < dialogPagamentoConta.conta.valor && !permitirSaldoNegativo)
              }
              startIcon={processingOperation ? <CircularProgress size={20} /> : <Payment />}
            >
              {processingOperation ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Fechar Mês */}
        <Dialog open={dialogFecharMes} onClose={() => setDialogFecharMes(false)} maxWidth="sm" fullWidth>
          <DialogTitle>🔒 Fechar Mês Financeiro</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Alert severity={calcularEstatisticasPendentes().quantidade > 0 ? "warning" : "info"}>
                <Typography variant="body2">
                  {calcularEstatisticasPendentes().quantidade > 0 ? (
                    <>
                      <strong>Atenção!</strong> Ao fechar o mês, todas as contas pendentes serão migradas para o próximo mês.
                      Esta ação não pode ser desfeita.
                    </>
                  ) : (
                    <>
                      <strong>Mês sem pendências!</strong> Este mês não possui contas pendentes.
                      O fechamento será apenas para organização mensal.
                    </>
                  )}
                </Typography>
              </Alert>
              
              <Typography variant="body1">
                <strong>Mês a fechar:</strong> {mesAtual.mes.toString().padStart(2, '0')}/{mesAtual.ano}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Contas pendentes no mês atual: {calcularEstatisticasPendentes().quantidade}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Valor total das contas pendentes: {formatCurrency(calcularEstatisticasPendentes().valorTotal)}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogFecharMes(false)}>Cancelar</Button>
            <Button 
              onClick={async () => {
                // 🔒 Verificar se serviço está disponível
                if (!financeiroService) {
                  showFeedback('error', 'Erro', 'Serviço financeiro não está disponível.');
                  return;
                }

                const result = await financeiroService.fecharMes(mesAtual, userId);
                if (result.success) {
                  showFeedback('success', 'Mês Fechado', `Mês fechado com sucesso! ${result.contasMigradas} contas migradas para o próximo mês.`);
                  setMesAtual(prev => ({
                    mes: prev.mes === 12 ? 1 : prev.mes + 1,
                    ano: prev.mes === 12 ? prev.ano + 1 : prev.ano,
                    fechado: false
                  }));
                  await fetchContasPagar();
                  setDialogFecharMes(false);
                } else {
                  showFeedback('error', 'Erro no Fechamento', 'Erro ao fechar mês: ' + result.error);
                }
              }}
              variant="contained"
              color="warning"
            >
              Confirmar Fechamento
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Feedback */}
        <Dialog
          open={feedbackModal.open}
          onClose={closeFeedback}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: feedbackModal.type === 'success' ? 'success.main' : 'error.main'
          }}>
            {feedbackModal.type === 'success' ? <CheckCircle /> : <Warning />}
            {feedbackModal.title}
          </DialogTitle>
          <DialogContent>
            <Typography>{feedbackModal.message}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeFeedback} variant="contained">
              OK
            </Button>
          </DialogActions>
        </Dialog>

        {/* Backdrop de Loading */}
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={processingOperation}
        >
          <CircularProgress color="inherit" />
          <Typography sx={{ ml: 2 }}>Processando...</Typography>
        </Backdrop>
      </Box>
    </ProtectedRoute>
  );
};

// Wrapper com Suspense para useSearchParams
export default function FinanceiroPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>}>
      <FinanceiroPage />
    </Suspense>
  );
}