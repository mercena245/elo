"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  SpeedDialAction
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
  CancelOutlined
} from '@mui/icons-material';
import { db, ref, get, set, push, auth, storage, storageRef, uploadBytes, getDownloadURL, onAuthStateChanged } from '../../firebase';
import { auditService } from '../../services/auditService';
import GeradorMensalidadesDialog from '../../components/GeradorMensalidadesDialog';
import DashboardFinanceiro from '../../components/DashboardFinanceiro';
import BaixaTituloDialog from '../../components/BaixaTituloDialog';

const FinanceiroPage = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
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
  
  // Estados dos formulários
  const [novoTitulo, setNovoTitulo] = useState({
    alunoId: '',
    tipo: 'mensalidade',
    descricao: '',
    valor: '',
    vencimento: '',
    observacoes: ''
  });

  // Estados dos filtros
  const [filtros, setFiltros] = useState({
    aluno: '',
    turma: '',
    tipo: '',
    status: '',
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
      
      try {
        const userRef = ref(db, `usuarios/${userId}`);
        const snap = await get(userRef);
        if (snap.exists()) {
          const userData = snap.val();
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
  }, [userId]);

  // Carregar dados conforme a role
  useEffect(() => {
    if (roleChecked && userRole) {
      fetchData();
      // Definir tab inicial baseada no perfil
      if (isPai()) {
        setTabValue(1); // Tab de títulos para pais
      } else {
        setTabValue(0); // Tab de dashboard para coordenadores/professores
      }
    }
  }, [roleChecked, userRole, userId]);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isCoordenador()) {
        // Coordenador(a) vê tudo
        await fetchAlunos();
        await fetchTitulos();
        await fetchTurmas();
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
    try {
      const alunosRef = ref(db, 'alunos');
      const snapshot = await get(alunosRef);
      if (snapshot.exists()) {
        const alunosData = Object.entries(snapshot.val()).map(([id, aluno]) => ({
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
    try {
      const alunosRef = ref(db, 'alunos');
      const snapshot = await get(alunosRef);
      if (snapshot.exists()) {
        const alunosData = Object.entries(snapshot.val()).map(([id, aluno]) => ({
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
    try {
      const titulosRef = ref(db, 'titulos_financeiros');
      const snapshot = await get(titulosRef);
      if (snapshot.exists()) {
        const titulosData = Object.entries(snapshot.val()).map(([id, titulo]) => ({
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
    try {
      const turmasRef = ref(db, 'turmas');
      const snapshot = await get(turmasRef);
      if (snapshot.exists()) {
        setTurmas(snapshot.val());
        console.log('🏫 Turmas carregadas:', Object.keys(snapshot.val()).length);
      } else {
        setTurmas({});
        console.log('🏫 Nenhuma turma encontrada');
      }
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
    }
  };

  const fetchTitulosPai = async () => {
    try {
      // Buscar filhos do pai logado
      const usuarioRef = ref(db, `usuarios/${userId}`);
      const usuarioSnap = await get(usuarioRef);
      
      if (usuarioSnap.exists()) {
        const userData = usuarioSnap.val();
        const alunosIds = userData.alunosVinculados || [];
        
        if (alunosIds.length > 0) {
          // Buscar dados dos alunos vinculados
          const alunosRef = ref(db, 'alunos');
          const alunosSnapshot = await get(alunosRef);
          
          if (alunosSnapshot.exists()) {
            const todosAlunos = Object.entries(alunosSnapshot.val())
              .map(([id, aluno]) => ({ id, ...aluno }));
            
            // Filtrar apenas os alunos vinculados ao pai
            const alunosVinculados = todosAlunos.filter(aluno => alunosIds.includes(aluno.id));
            setAlunos(alunosVinculados);
          }
          
          // Buscar títulos dos alunos vinculados
          const titulosRef = ref(db, 'titulos_financeiros');
          const snapshot = await get(titulosRef);
          
          if (snapshot.exists()) {
            const titulosData = Object.entries(snapshot.val())
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

      const titulosRef = ref(db, 'titulos_financeiros');
      const novoTituloRef = await push(titulosRef, tituloData);

      // Log da ação
      await auditService.logAction('titulo_create', userId, {
        entityId: novoTituloRef.key,
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
    setPagamentoDialog(true);
  };

  const handleComprovanteChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!tiposPermitidos.includes(file.type)) {
        alert('Tipo de arquivo não permitido. Use apenas JPG, PNG ou PDF.');
        event.target.value = '';
        return;
      }

      // Validar tamanho (máximo 5MB)
      const tamanhoMaximo = 5 * 1024 * 1024; // 5MB
      if (file.size > tamanhoMaximo) {
        alert('Arquivo muito grande. O tamanho máximo é 5MB.');
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
      alert('Por favor, anexe um comprovante de pagamento.');
      return;
    }

    setPagamento({ ...pagamento, carregando: true });

    try {
      // Upload real do comprovante para Firebase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}_${pagamento.comprovante.name}`;
      const comprovanteRef = storageRef(storage, `comprovantes_pagamento/${fileName}`);
      
      // Fazer upload do arquivo
      console.log('📤 Iniciando upload do comprovante...');
      await uploadBytes(comprovanteRef, pagamento.comprovante);
      
      // Obter URL de download
      const comprovanteUrl = await getDownloadURL(comprovanteRef);
      console.log('✅ Upload concluído. URL:', comprovanteUrl);

      // Atualizar título para "em análise"
      const tituloRef = ref(db, `titulos_financeiros/${tituloSelecionado.id}`);
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

      await set(tituloRef, atualizacao);

      // Log da ação
      await auditService.logAction('pagamento_enviado', userId, {
        entityId: tituloSelecionado.id,
        description: `Comprovante enviado para o título: ${tituloSelecionado.descricao}`,
        changes: { status: 'em_analise', comprovanteUrl }
      });

      setPagamentoDialog(false);
      fetchTitulos();
      alert('Comprovante enviado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao enviar pagamento:', error);
      alert('Erro ao enviar pagamento. Tente novamente.');
    } finally {
      setPagamento({ ...pagamento, carregando: false });
    }
  };

  const aprovarPagamento = async (titulo) => {
    try {
      const tituloRef = ref(db, `titulos_financeiros/${titulo.id}`);
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

      await set(tituloRef, atualizacao);

      // Log da ação
      await auditService.logAction('pagamento_aprovado', userId, {
        entityId: titulo.id,
        description: `Pagamento aprovado para o título: ${titulo.descricao}`,
        changes: { status: 'pago', dataPagamento: atualizacao.dataPagamento }
      });

      fetchTitulos();
      
    } catch (error) {
      console.error('Erro ao aprovar pagamento:', error);
      alert('Erro ao aprovar pagamento. Tente novamente.');
    }
  };

  const rejeitarPagamento = async (titulo) => {
    try {
      const tituloRef = ref(db, `titulos_financeiros/${titulo.id}`);
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

      await set(tituloRef, atualizacao);

      // Log da ação
      await auditService.logAction('pagamento_rejeitado', userId, {
        entityId: titulo.id,
        description: `Pagamento rejeitado para o título: ${titulo.descricao}`,
        changes: { status: 'pendente' }
      });

      fetchTitulos();
      
    } catch (error) {
      console.error('Erro ao rejeitar pagamento:', error);
      alert('Erro ao rejeitar pagamento. Tente novamente.');
    }
  };

  // Função para filtrar títulos
  const filtrarTitulos = () => {
    return titulos.filter(titulo => {
      const aluno = alunos.find(a => a.id === titulo.alunoId);
      const alunoNome = aluno?.nome?.toLowerCase() || '';
      const alunoTurma = aluno?.turmaId || '';
      
      // Filtro por aluno
      if (filtros.aluno && !alunoNome.includes(filtros.aluno.toLowerCase())) {
        return false;
      }
      
      // Filtro por turma
      if (filtros.turma && filtros.turma !== 'todos' && alunoTurma !== filtros.turma) {
        return false;
      }
      
      // Filtro por tipo
      if (filtros.tipo && filtros.tipo !== 'todos' && titulo.tipo !== filtros.tipo) {
        return false;
      }
      
      // Filtro por status
      if (filtros.status && filtros.status !== 'todos' && titulo.status !== filtros.status) {
        return false;
      }
      
      // Filtro por data de vencimento
      if (filtros.dataInicio || filtros.dataFim) {
        const vencimento = new Date(titulo.vencimento);
        
        if (filtros.dataInicio) {
          const dataInicio = new Date(filtros.dataInicio);
          if (vencimento < dataInicio) return false;
        }
        
        if (filtros.dataFim) {
          const dataFim = new Date(filtros.dataFim);
          if (vencimento > dataFim) return false;
        }
      }
      
      return true;
    });
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

  // Verificações de acesso
  if (!roleChecked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!userRole || !['coordenadora', 'coordenador', 'professora', 'professor', 'pai', 'mae'].includes(userRole)) {
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

  return (
    <ProtectedRoute>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f6fa' }}>
        <SidebarMenu />
        
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {/* Header */}
          <Box sx={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            borderRadius: 3,
            p: 3,
            mb: 3,
            color: 'white',
            textAlign: 'center'
          }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              💰 Sistema Financeiro
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              {isCoordenador() && 'Gestão completa do financeiro escolar'}
              {isProfessor() && 'Consulta de status financeiro dos alunos'}
              {isPai() && 'Seus títulos e pagamentos'}
              <br />
              <Typography component="span" variant="caption" sx={{ opacity: 0.6, fontSize: '0.7rem' }}>
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
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ background: 'linear-gradient(135deg, #3B82F6, #1E40AF)' }}>
                        <CardContent sx={{ color: 'white' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="h4" fontWeight="bold">
                                {formatCurrency(metricas.receitaMensal)}
                              </Typography>
                              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Receita Mensal
                              </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <AttachMoney />
                            </Avatar>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                        <CardContent sx={{ color: 'white' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="h4" fontWeight="bold">
                                {formatCurrency(metricas.receitaAnual)}
                              </Typography>
                              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Receita Anual
                              </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <AccountBalance />
                            </Avatar>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
                        <CardContent sx={{ color: 'white' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="h4" fontWeight="bold">
                                {metricas.taxaInadimplencia.toFixed(1)}%
                              </Typography>
                              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Taxa Inadimplência
                              </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                              <Warning />
                            </Avatar>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </>
                )}

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                    <CardContent sx={{ color: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" fontWeight="bold">
                            {metricas.alunosAtivos}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Alunos Ativos
                          </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                          <CheckCircle />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                    <CardContent sx={{ color: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" fontWeight="bold">
                            {metricas.alunosInadimplentes}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Inadimplentes
                          </Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                          <TrendingDown />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Tabs de Navegação */}
              <Paper sx={{ mb: 3 }}>
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
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      minWidth: { xs: 120, md: 160 }
                    }
                  }}
                >
                  <Tab 
                    label="📊 Dashboard" 
                    disabled={userRole === 'pai'}
                  />
                  <Tab 
                    label="📋 Títulos" 
                    disabled={userRole === 'professora'}
                  />
                  {userRole === 'coordenadora' && (
                    <Tab label="📈 Relatórios" />
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6">
                        📋 Gestão de Títulos
                      </Typography>
                      {isCoordenador() && (
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => setNovoTituloDialog(true)}
                        >
                          Novo Título
                        </Button>
                      )}
                    </Box>

                    {/* Filtros */}
                    <Card sx={{ mb: 3, maxWidth: 'none' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary">
                          🔍 Filtros de Busca
                        </Typography>
                        
                        <Grid container spacing={3} sx={{ width: '100%' }}>
                          <Grid item xs={12} md={6} lg={4} sx={{ minWidth: '300px' }}>
                            <FormControl fullWidth sx={{ minWidth: '250px' }}>
                              <InputLabel>Turma</InputLabel>
                              <Select
                                value={filtros.turma}
                                label="Turma"
                                onChange={(e) => setFiltros({...filtros, turma: e.target.value})}
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
                          
                          <Grid item xs={12} md={6} lg={4} sx={{ minWidth: '300px' }}>
                            <TextField
                              label="Nome do Aluno"
                              fullWidth
                              value={filtros.aluno}
                              onChange={(e) => setFiltros({...filtros, aluno: e.target.value})}
                              placeholder="Digite o nome do aluno"
                              sx={{ minWidth: '250px' }}
                            />
                          </Grid>
                          
                          <Grid item xs={12} md={6} lg={4} sx={{ minWidth: '300px' }}>
                            <FormControl fullWidth sx={{ minWidth: '250px' }}>
                              <InputLabel>Tipo de Título</InputLabel>
                              <Select
                                value={filtros.tipo}
                                label="Tipo de Título"
                                onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                              >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="mensalidade">Mensalidade</MenuItem>
                                <MenuItem value="material">Material</MenuItem>
                                <MenuItem value="uniforme">Uniforme</MenuItem>
                                <MenuItem value="taxa">Taxa</MenuItem>
                                <MenuItem value="loja">Loja</MenuItem>
                                <MenuItem value="outros">Outros</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12} md={6} lg={4} sx={{ minWidth: '300px' }}>
                            <FormControl fullWidth sx={{ minWidth: '250px' }}>
                              <InputLabel>Status</InputLabel>
                              <Select
                                value={filtros.status}
                                label="Status"
                                onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                              >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="pendente">Pendente</MenuItem>
                                <MenuItem value="em_analise">Em Análise</MenuItem>
                                <MenuItem value="pago">Pago</MenuItem>
                                <MenuItem value="vencido">Vencido</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12} md={6} lg={4} sx={{ minWidth: '300px' }}>
                            <TextField
                              label="Data Início"
                              type="date"
                              fullWidth
                              value={filtros.dataInicio}
                              onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                              InputLabelProps={{ shrink: true }}
                              sx={{ minWidth: '250px' }}
                            />
                          </Grid>
                          
                          <Grid item xs={12} md={6} lg={4} sx={{ minWidth: '300px' }}>
                            <TextField
                              label="Data Fim"
                              type="date"
                              fullWidth
                              value={filtros.dataFim}
                              onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                              InputLabelProps={{ shrink: true }}
                              sx={{ minWidth: '250px' }}
                            />
                          </Grid>
                          
                          <Grid item xs={12} md={6} lg={4} sx={{ minWidth: '300px' }}>
                            <Button
                              variant="outlined"
                              fullWidth
                              onClick={() => setFiltros({
                                aluno: '',
                                turma: '',
                                tipo: '',
                                status: '',
                                dataInicio: '',
                                dataFim: ''
                              })}
                              sx={{ height: '56px', minWidth: '250px' }}
                            >
                              🗑️ Limpar Filtros
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Aluno</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Valor</TableCell>
                            <TableCell>Vencimento</TableCell>
                            <TableCell>Status</TableCell>
                            {(isCoordenador() || isPai()) && <TableCell>Ações</TableCell>}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filtrarTitulos().slice(0, 20).map((titulo) => (
                            <TableRow key={titulo.id}>
                              <TableCell>
                                {alunos.find(a => a.id === titulo.alunoId)?.nome || 'Aluno não encontrado'}
                              </TableCell>
                              <TableCell>{titulo.tipo}</TableCell>
                              <TableCell>{titulo.descricao}</TableCell>
                              <TableCell>{formatCurrency(titulo.valor)}</TableCell>
                              <TableCell>{formatDate(titulo.vencimento)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={getStatusLabel(titulo.status)}
                                  color={getStatusColor(titulo.status)}
                                  size="small"
                                />
                              </TableCell>
                              {(isCoordenador() || isPai()) && (
                                <TableCell>
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
                                    </>
                                  )}
                                  {isPai() && titulo.status === 'pendente' && (
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
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

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

              {/* Tab Relatórios */}
              {tabValue === 2 && isCoordenador() && (
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
        <Dialog open={novoTituloDialog} onClose={() => setNovoTituloDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>💰 Gerar Novo Título</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Autocomplete
                options={alunos}
                getOptionLabel={(aluno) => `${aluno.nome} - ${aluno.matricula}`}
                value={alunos.find(a => a.id === novoTitulo.alunoId) || null}
                onChange={(e, value) => setNovoTitulo(prev => ({ ...prev, alunoId: value?.id || '' }))}
                renderInput={(params) => <TextField {...params} label="Aluno" required />}
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
                  <MenuItem value="material">Material Escolar</MenuItem>
                  <MenuItem value="uniforme">Uniforme</MenuItem>
                  <MenuItem value="extra">Taxa Extra</MenuItem>
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
          <DialogActions>
            <Button onClick={() => setNovoTituloDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleGerarTitulo} 
              variant="contained"
              disabled={!novoTitulo.alunoId || !novoTitulo.descricao || !novoTitulo.valor || !novoTitulo.vencimento}
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
        >
          <DialogTitle>
            Enviar Comprovante de Pagamento
          </DialogTitle>
          <DialogContent>
            {tituloSelecionado && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Título: {tituloSelecionado.descricao}
                </Typography>
                <Typography variant="h6" color="primary">
                  Valor: {formatCurrency(tituloSelecionado.valor)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vencimento: {formatDate(tituloSelecionado.vencimento)}
                </Typography>
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
                sx={{ py: 2 }}
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
          <DialogActions>
            <Button 
              onClick={() => setPagamentoDialog(false)}
              disabled={pagamento.carregando}
            >
              Cancelar
            </Button>
            <Button 
              onClick={enviarPagamento}
              variant="contained"
              disabled={!pagamento.comprovante || pagamento.carregando}
              startIcon={pagamento.carregando ? <CircularProgress size={20} /> : <Payment />}
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
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
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
                            <Typography variant="body2" color="text.secondary">Valor:</Typography>
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {formatCurrency(detalheTitulo.titulo.valor)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Status:</Typography>
                            <Chip 
                              label={detalheTitulo.titulo.status} 
                              size="small"
                              color={detalheTitulo.titulo.status === 'pago' ? 'success' : 
                                     detalheTitulo.titulo.status === 'pendente' ? 'warning' : 'error'}
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
                              {detalheTitulo.titulo.dataCriacao ? formatDate(detalheTitulo.titulo.dataCriacao) : 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Data de Vencimento:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {detalheTitulo.titulo.dataVencimento ? formatDate(detalheTitulo.titulo.dataVencimento) : 'N/A'}
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
                            {detalheTitulo.titulo.observacoes}
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
      </Box>
    </ProtectedRoute>
  );
};

export default FinanceiroPage;