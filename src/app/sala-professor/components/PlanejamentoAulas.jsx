"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Divider,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ChevronLeft,
  ChevronRight,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  Class as ClassIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { auditService } from '../../../services/auditService';

// Imports diretos dos componentes com caminhos absolutos
import EditorPlanoAula from './shared/EditorPlanoAula';
import EditorPlanoDiario from './shared/EditorPlanoDiario';
import VisualizacaoDocumentoPlano from './shared/VisualizacaoDocumentoPlano';
import CalendarioGrade from '../../../app/sala-professor/components/shared/CalendarioGrade';
import SeletorTurmaAluno from './SeletorTurmaAluno';
import SeletorPeriodoLetivo from '../../components/shared/SeletorPeriodoLetivo';
import RelatorioPlanoAula from './shared/RelatorioPlanoAula';
import RecursosPreview from './shared/RecursosPreview';
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';

/**
 * Função helper para formatar data corretamente do formato YYYY-MM-DD
 * Evita problemas de timezone ao criar Date object
 */
const formatarDataLocal = (dataString) => {
  if (!dataString) return '';
  
  // Se a data já está no formato DD/MM/YYYY, retornar diretamente
  if (dataString.includes('/')) return dataString;
  
  // Se está no formato YYYY-MM-DD, converter para DD/MM/YYYY sem criar Date object
  const partes = dataString.split('-');
  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }
  
  // Fallback: tentar usar toLocaleDateString
  try {
    // Adiciona 'T00:00:00' para forçar timezone local
    return new Date(dataString + 'T00:00:00').toLocaleDateString('pt-BR');
  } catch {
    return dataString;
  }
};

const PlanejamentoAulas = () => {
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  const [novoPlanoData, setNovoPlanoData] = useState(null);
  const { user, userRole } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [planos, setPlanos] = useState({});
  const [gradeHoraria, setGradeHoraria] = useState({});
  const [turmas, setTurmas] = useState({});
  const [disciplinas, setDisciplinas] = useState({});
  const [alunos, setAlunos] = useState({});
  const [periodoLetivoSelecionado, setPeriodoLetivoSelecionado] = useState(''); // Novo estado
  
  // Estados de filtro
  const [selectedTurmas, setSelectedTurmas] = useState([]);
  const [selectedAlunos, setSelectedAlunos] = useState([]);
  const [minhasTurmas, setMinhasTurmas] = useState([]);
  const [minhasDisciplinas, setMinhasDisciplinas] = useState([]); // Nova state para disciplinas do professor
  
  // Estados para modal de visualização
  // Estados para modal de confirmação/feedback
  const [modalConfirmacao, setModalConfirmacao] = useState({ open: false, acao: null, mensagem: '', onConfirm: null });
  const [modalFeedback, setModalFeedback] = useState({ open: false, mensagem: '' });
  const [modalVisualizacao, setModalVisualizacao] = useState(false);
  const [planoVisualizacao, setPlanoVisualizacao] = useState(null);
  const [planosGrupoVisualizacao, setPlanosGrupoVisualizacao] = useState([]);
  const [indiceAtualVisualizacao, setIndiceAtualVisualizacao] = useState(0);
  
  // Estados do editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [planoEditando, setPlanoEditando] = useState(null);
  
  // Estados do editor de plano diário
  const [editorDiarioOpen, setEditorDiarioOpen] = useState(false);
  const [planoDiarioEditando, setPlanoDiarioEditando] = useState(null);
  
  // Estados de visualização
  const [planosPendentes, setPlanosPendentes] = useState([]);
  const [planosAprovados, setPlanosAprovados] = useState([]);
  
  // Novos estados para abas e filtros
  const [abaAtual, setAbaAtual] = useState(0); // 0: Planejamento, 1: Planos Aprovados
  const [filtroTurmaAprovados, setFiltroTurmaAprovados] = useState('');
  const [filtroTituloAprovados, setFiltroTituloAprovados] = useState('');
  const [filtroCompetenciaAprovados, setFiltroCompetenciaAprovados] = useState('');
  const [filtroDataAprovados, setFiltroDataAprovados] = useState('');
  const [planoImpressao, setPlanoImpressao] = useState(null);
  const [dialogImpressao, setDialogImpressao] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    if (user?.uid && isReady && userRole) {
      console.log('🎯 [PlanejamentoAulas] Disparando carregarDados - userRole:', userRole);
      carregarDados();
    }
  }, [user, isReady, userRole]);

  useEffect(() => {
    if (user?.uid && periodoLetivoSelecionado && isReady && userRole) {
      console.log('🎯 [PlanejamentoAulas] Disparando carregarDados (período mudou) - userRole:', userRole);
      carregarDados();
    }
  }, [periodoLetivoSelecionado, isReady, userRole]);

  // Monitor para minhasTurmas
  useEffect(() => {
    console.log('🔍 [PlanejamentoAulas] minhasTurmas mudou:', minhasTurmas);
  }, [minhasTurmas]);

  useEffect(() => {
    organizarPlanosPorStatus();
  }, [planos, selectedTurmas, selectedAlunos]);

  // Novo useEffect para carregar grade horária das turmas selecionadas
  useEffect(() => {
    if (selectedTurmas.length > 0 && Object.keys(turmas).length > 0) {
      carregarGradeHorariaDasTurmas();
    } else {
      setGradeHoraria({});
    }
  }, [selectedTurmas, turmas]);

  // Nova função para carregar grade horária baseada nas turmas selecionadas
  const carregarGradeHorariaDasTurmas = async () => {
    if (!isReady) return;
    
    try {
      console.log('📚 PlanejamentoAulas - Carregando grade horária das turmas selecionadas:', selectedTurmas);
      
      if (selectedTurmas.length === 0) {
        setGradeHoraria({});
        return;
      }

      const gradeCompleta = {};
      
      // Para cada turma selecionada, buscar sua grade horária no seu período letivo
      for (const turmaId of selectedTurmas) {
        const turma = turmas[turmaId];
        if (!turma || !turma.periodoId) {
          console.log(`❌ Turma ${turmaId} não encontrada ou sem período letivo`);
          console.log(`🔍 Turma disponível:`, turma);
          console.log(`🔍 Todas as turmas:`, Object.keys(turmas));
          continue;
        }

        console.log(`📚 Carregando grade da turma ${turmaId} no período ${turma.periodoId}`);
        console.log(`🔍 [DEBUG] Detalhes da turma:`, turma);
        console.log(`🔍 [DEBUG] Período selecionado globalmente:`, periodoLetivoSelecionado?.id);
        console.log(`🔍 [DEBUG] Período da turma:`, turma.periodoId);
        
        // ESTRATÉGIA: Tentar primeiro o período da turma, depois o selecionado
        let gradeData = null;
        const periodosParaTentar = [
          turma.periodoId,
          periodoLetivoSelecionado?.id
        ].filter(Boolean).filter((period, index, arr) => arr.indexOf(period) === index); // Remove duplicatas
        
        console.log(`🎯 [DEBUG] Tentando períodos:`, periodosParaTentar);
        
        for (const periodo of periodosParaTentar) {
          console.log(`🔍 [DEBUG] Tentando buscar em: GradeHoraria/${periodo}/${turmaId}`);
          const tentativa = await getData(`GradeHoraria/${periodo}/${turmaId}`);
          if (tentativa && Object.keys(tentativa).length > 0) {
            console.log(`✅ [DEBUG] Dados encontrados no período: ${periodo}`);
            gradeData = tentativa;
            break;
          } else {
            console.log(`❌ [DEBUG] Nenhum dado no período: ${periodo}`);
          }
        }
        
        if (gradeData) {
          // A estrutura pode ter horarios aninhados (horario_XXXXX)
          console.log(`🔍 Dados brutos da turma ${turmaId}:`, gradeData);
          
          // Processar os dados - cada horario_XXXXX é uma aula direta
          const processarHorarios = (dados) => {
            const aulasProcessadas = {};
            
            Object.entries(dados).forEach(([key, value]) => {
              if (value && typeof value === 'object') {
                // Verificar se é uma aula (tem diaSemana, disciplinaId, etc.)
                if (value.diaSemana !== undefined || value.disciplinaId || value.periodoAula) {
                  console.log(`📝 Aula encontrada: ${key}`, value);
                  aulasProcessadas[key] = value;
                } else if (key.startsWith('horario_')) {
                  // É um contêiner de horário, processar recursivamente
                  console.log(`� Processando contêiner de horário: ${key}`);
                  const subAulas = processarHorarios(value);
                  Object.assign(aulasProcessadas, subAulas);
                }
              }
            });
            
            return aulasProcessadas;
          };
          
          const aulasProcessadas = processarHorarios(gradeData);
          
          // Adicionar cada aula à grade completa
          Object.entries(aulasProcessadas).forEach(([aulaId, aula]) => {
            gradeCompleta[aulaId] = {
              ...aula,
              turmaId: turmaId // Garantir que tenha o turmaId
            };
          });
          
          console.log(`✅ Grade da turma ${turmaId} carregada:`, Object.keys(aulasProcessadas).length, 'aulas');
        } else {
          console.log(`❌ Nenhuma grade encontrada para turma ${turmaId} no período ${turma.periodoId}`);
        }
      }
      
      console.log('📚 PlanejamentoAulas - Grade horária total carregada:', Object.keys(gradeCompleta).length, 'aulas');
      setGradeHoraria(gradeCompleta);
      
      // Extrair disciplinas baseado no role
      if (userRole === 'coordenador' || userRole === 'coordenadora') {
        // Coordenador vê todas as disciplinas da grade
        const todasDisciplinas = new Set();
        Object.values(gradeCompleta).forEach(aula => {
          if (aula.disciplinaId) {
            todasDisciplinas.add(aula.disciplinaId);
          }
        });
        setMinhasDisciplinas(Array.from(todasDisciplinas));
        console.log('✅ Coordenador - todas as disciplinas:', Array.from(todasDisciplinas));
      } else if (userRole === 'professor' || userRole === 'professora') {
        // Professor vê apenas suas disciplinas
        const disciplinasProf = new Set();
        Object.values(gradeCompleta).forEach(aula => {
          if (aula.professorUid === user?.uid && aula.disciplinaId) {
            disciplinasProf.add(aula.disciplinaId);
          }
        });
        setMinhasDisciplinas(Array.from(disciplinasProf));
        console.log('✅ Professor - disciplinas vinculadas:', Array.from(disciplinasProf));
      }
      
    } catch (error) {
      console.error('Erro ao carregar grade horária das turmas:', error);
      setGradeHoraria({});
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      console.log('🎯 PlanejamentoAulas - Carregando dados...');
      console.log('🎯 PlanejamentoAulas - Período letivo selecionado:', periodoLetivoSelecionado);
      
      // Buscar turmas, disciplinas e alunos sempre (independente do período)
      const [turmasData, disciplinasData, alunosData] = await Promise.all([
        getData('turmas'),
        getData('disciplinas'),
        getData('alunos')
      ]);
      
      // Processar turmas
      setTurmas(turmasData || {});
      console.log('✅ [PlanejamentoAulas] Turmas carregadas:', Object.keys(turmasData || {}).length);
      
      // Definir turmas disponíveis baseado na role
      if (userRole === 'coordenador' || userRole === 'coordenadora') {
        // Coordenador vê todas as turmas
        const todasTurmas = Object.keys(turmasData || {});
        setMinhasTurmas(todasTurmas);
        console.log('✅ [PlanejamentoAulas] Coordenador - todas as turmas:', todasTurmas);
      } else if (userRole === 'professor' || userRole === 'professora') {
        // Professor vê apenas suas turmas vinculadas
        const userData = await getData(`usuarios/${user?.uid}`);
        if (userData) {
          const turmasUsuario = userData.turmas || [];
          setMinhasTurmas(turmasUsuario);
          console.log('✅ [PlanejamentoAulas] Professor - turmas vinculadas:', turmasUsuario);
        }
      }
      
      // Processar disciplinas e alunos
      setDisciplinas(disciplinasData || {});
      setAlunos(alunosData || {});
      
      // Se não há período letivo selecionado, não carregar grade e planos
      if (!periodoLetivoSelecionado) {
        console.log('⚠️ [PlanejamentoAulas] Nenhum período letivo selecionado');
        setGradeHoraria({});
        setPlanos({});
        setLoading(false);
        return;
      }
      
      console.log('📡 [PlanejamentoAulas] Carregando planos e grade para período:', periodoLetivoSelecionado);
      console.log('📡 [PlanejamentoAulas] Caminho da grade:', `GradeHoraria/${periodoLetivoSelecionado.id}`);
      
      // Buscar planos e grade do período selecionado
      const [planosData, gradeDataPorTurma] = await Promise.all([
        getData('planos-aula'),
        getData(`GradeHoraria/${periodoLetivoSelecionado.id}`)
      ]);
      
      console.log('🔍 [DEBUG] Dados recebidos da grade:', {
        gradeDataPorTurma,
        isNull: gradeDataPorTurma === null,
        isUndefined: gradeDataPorTurma === undefined,
        isEmpty: gradeDataPorTurma && Object.keys(gradeDataPorTurma).length === 0,
        type: typeof gradeDataPorTurma,
        keys: gradeDataPorTurma ? Object.keys(gradeDataPorTurma) : 'N/A'
      });
      
      // Processar planos
      setPlanos(planosData || {});
      
      // Processar grade horária
      const gradeDataPorTurmaBruto = gradeDataPorTurma || {};
      console.log('📚 PlanejamentoAulas - Dados brutos da grade horária:', gradeDataPorTurmaBruto);
      
      // Converter estrutura hierárquica para estrutura plana (compatibilidade)
      const gradeData = {};
      Object.keys(gradeDataPorTurmaBruto).forEach(turmaId => {
        const horariosData = gradeDataPorTurmaBruto[turmaId] || {};
        console.log(`📚 PlanejamentoAulas - Processando turma ${turmaId}:`, horariosData);
        Object.keys(horariosData).forEach(horarioId => {
          gradeData[horarioId] = horariosData[horarioId];
        });
      });
      
      console.log('📚 PlanejamentoAulas - Grade horária convertida para estrutura plana:', gradeData);
      console.log('📚 PlanejamentoAulas - Total de aulas na grade:', Object.keys(gradeData).length);
      setGradeHoraria(gradeData);
      
      // Extrair disciplinas baseado no role
      if (userRole === 'coordenador' || userRole === 'coordenadora') {
        // Coordenador vê todas as disciplinas da grade
        const todasDisciplinas = new Set();
        Object.values(gradeData).forEach(aula => {
          if (aula.disciplinaId) {
            todasDisciplinas.add(aula.disciplinaId);
          }
        });
        setMinhasDisciplinas(Array.from(todasDisciplinas));
        console.log('✅ [PlanejamentoAulas] Coordenador - todas as disciplinas:', Array.from(todasDisciplinas));
      } else if (userRole === 'professor' || userRole === 'professora') {
        // Professor vê apenas suas disciplinas
        const disciplinasProf = new Set();
        Object.values(gradeData).forEach(aula => {
          if (aula.professorUid === user?.uid && aula.disciplinaId) {
            disciplinasProf.add(aula.disciplinaId);
          }
        });
        setMinhasDisciplinas(Array.from(disciplinasProf));
        console.log('✅ [PlanejamentoAulas] Professor - disciplinas vinculadas:', Array.from(disciplinasProf));
      }
      
    } catch (error) {
      console.error('❌ [PlanejamentoAulas] Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Organiza planos em dois grupos: pendentes e aprovados, agrupados por turma
  const organizarPlanosPorStatus = () => {
    const planosArray = Object.entries(planos).map(([id, plano]) => ({ id, ...plano }));
    // Filtro comum
    let planosFiltrados = planosArray;
    if (userRole !== 'coordenador' && userRole !== 'coordenadora') {
      planosFiltrados = planosArray.filter(plano => plano.professorUid === user?.uid);
    }
    if (selectedTurmas.length > 0) {
      planosFiltrados = planosFiltrados.filter(plano => selectedTurmas.includes(plano.turmaId));
    }
    // Separar por status
    const pendentes = planosFiltrados.filter(p => !p.statusAprovacao || p.statusAprovacao === 'pendente' || p.statusAprovacao === 'rejeitado' || p.statusAprovacao === 'em_revisao');
    const aprovados = planosFiltrados.filter(p => p.statusAprovacao === 'aprovado');
    // Agrupar por turma
    function agruparPorTurma(planos) {
      const planosAgrupados = planos.reduce((grupos, plano) => {
        const turmaId = plano.turmaId;
        if (!grupos[turmaId]) grupos[turmaId] = [];
        grupos[turmaId].push(plano);
        return grupos;
      }, {});
      return Object.entries(planosAgrupados).map(([turmaId, planos]) => ({
        turmaId,
        turma: turmas[turmaId],
        planos: planos.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
      }));
    }
    setPlanosPendentes(agruparPorTurma(pendentes));
    setPlanosAprovados(agruparPorTurma(aprovados));
    
    // Debug: verificar recursos nos planos
    console.log('📊 Planos carregados:', {
      totalPendentes: pendentes.length,
      totalAprovados: aprovados.length,
      primeiroAprovado: aprovados[0] ? {
        id: aprovados[0].id,
        titulo: aprovados[0].titulo,
        recursos: aprovados[0].recursos,
        hasRecursos: Array.isArray(aprovados[0].recursos),
        numRecursos: aprovados[0].recursos?.length || 0
      } : null
    });
  };

  const abrirEditor = (plano = null, dadosIniciais = null) => {
    console.log('📝 [abrirEditor] Abrindo editor com dados:', {
      plano: plano ? {
        id: plano.id,
        titulo: plano.titulo,
        tipo_plano: plano.tipo_plano,
        statusAprovacao: plano.statusAprovacao,
        observacoesAprovacao: plano.observacoesAprovacao,
        historicoRevisoes: plano.historicoRevisoes?.length || 0
      } : null,
      dadosIniciais
    });
    
    // Verifica se é plano diário e abre o editor correto
    if (plano && plano.tipo_plano === 'diario') {
      setPlanoDiarioEditando(plano);
      setEditorDiarioOpen(true);
    } else {
      setPlanoEditando(plano);
      setNovoPlanoData(dadosIniciais);
      setEditorOpen(true);
    }
  };

  // Corrigido: sempre faz update se dadosPlano.id existir (inclusive aprovação/rejeição)
  const salvarPlano = async (dadosPlano, idPlano = null) => {
    try {
      console.log('🔥 [salvarPlano] Iniciando salvamento...', {
        idPlano,
        dadosPlano_id: dadosPlano.id,
        statusAprovacao: dadosPlano.statusAprovacao,
        observacoesAprovacao: dadosPlano.observacoesAprovacao
      });
      
      const planoId = idPlano || dadosPlano.id;
      const planoData = {
        ...dadosPlano,
        professorUid: user.uid,
        professorNome: user.displayName || user.email,
        atualizadoEm: new Date().toISOString(),
      };
      
      console.log('📝 [salvarPlano] Dados que serão salvos no Firebase:', {
        planoId,
        statusAprovacao: planoData.statusAprovacao,
        observacoesAprovacao: planoData.observacoesAprovacao,
        historicoRevisoes: planoData.historicoRevisoes?.length || 0
      });
      
      if (planoId) {
        // Atualiza plano existente
        await updateData(`planos-aula/${planoId}`, planoData);
        console.log('✅ [salvarPlano] Plano atualizado no Firebase com sucesso!');
        await auditService.logAction(
          'plano_aula_update',
          user.uid,
          {
            description: `Atualizou plano de aula: ${dadosPlano.titulo}`,
            planoId: planoId,
            turmaId: dadosPlano.turmaId,
            disciplinaId: dadosPlano.disciplinaId
          }
        );
      } else {
        // Cria novo plano
        await pushData('planos-aula', planoData);
        console.log('✅ [salvarPlano] Novo plano criado no Firebase com sucesso!');
        await auditService.logAction(
          'plano_aula_create',
          user.uid,
          {
            description: `Criou plano de aula: ${dadosPlano.titulo}`,
            turmaId: dadosPlano.turmaId,
            disciplinaId: dadosPlano.disciplinaId
          }
        );
      }
      
      // Recarrega os dados para atualizar a lista
      console.log('🔄 [salvarPlano] Recarregando dados...');
      
      // Fecha o editor ANTES de recarregar para evitar dados desatualizados
      setEditorOpen(false);
      setPlanoEditando(null);
      
      await carregarDados();
      
      console.log('✅ [salvarPlano] Dados recarregados com sucesso!');
      setModalFeedback({ open: true, mensagem: 'Plano de aula salvo com sucesso!' });
    } catch (error) {
      console.error('❌ [salvarPlano] Erro ao salvar plano:', error);
      setModalFeedback({ open: true, mensagem: 'Erro ao salvar plano de aula.' });
    }
  };

  const excluirPlano = (planoId, titulo) => {
    const handleConfirm = async () => {
      try {
        await removeData(`planos-aula/${planoId}`);
        await auditService.logAction(
          'plano_aula_delete',
          user.uid,
          {
            description: `Excluiu plano de aula: ${titulo}`,
            planoId
          }
        );
        
        // Recarrega os dados para atualizar a lista
        await carregarDados();
        
        setModalFeedback({ open: true, mensagem: 'Plano de aula excluído com sucesso!' });
      } catch (error) {
        console.error('Erro ao excluir plano:', error);
        setModalFeedback({ open: true, mensagem: 'Erro ao excluir plano de aula.' });
      }
      setModalConfirmacao((prev) => ({ ...prev, open: false }));
    };
    setModalConfirmacao({
      open: true,
      acao: 'excluir',
      mensagem: `Deseja excluir o plano de aula "${titulo}"?`,
      onConfirm: handleConfirm
    });
  };
  // Modais de confirmação e feedback devem estar dentro do return principal

  // Função para abrir modal de visualização
  const abrirVisualizacao = (plano, planosDoGrupo = []) => {
    setPlanoVisualizacao(plano);
    setModalVisualizacao(true);
  };

  const fecharVisualizacao = () => {
    setModalVisualizacao(false);
    setPlanoVisualizacao(null);
  };

  // Funções para planos aprovados
  const filtrarPlanosAprovados = () => {
    let planosFiltrados = [...planosAprovados];

    // Filtro por turma
    if (filtroTurmaAprovados) {
      planosFiltrados = planosFiltrados.filter(grupo => grupo.turmaId === filtroTurmaAprovados);
    }

    // Filtro por título
    if (filtroTituloAprovados) {
      planosFiltrados = planosFiltrados.map(grupo => ({
        ...grupo,
        planos: grupo.planos.filter(plano => 
          plano.titulo?.toLowerCase().includes(filtroTituloAprovados.toLowerCase())
        )
      })).filter(grupo => grupo.planos.length > 0);
    }

    // Filtro por competência BNCC
    if (filtroCompetenciaAprovados) {
      planosFiltrados = planosFiltrados.map(grupo => ({
        ...grupo,
        planos: grupo.planos.filter(plano => 
          plano.bncc?.some(comp => 
            comp.codigo?.toLowerCase().includes(filtroCompetenciaAprovados.toLowerCase()) ||
            comp.descricao?.toLowerCase().includes(filtroCompetenciaAprovados.toLowerCase())
          )
        )
      })).filter(grupo => grupo.planos.length > 0);
    }

    // Filtro por data
    if (filtroDataAprovados) {
      planosFiltrados = planosFiltrados.map(grupo => ({
        ...grupo,
        planos: grupo.planos.filter(plano => plano.data === filtroDataAprovados)
      })).filter(grupo => grupo.planos.length > 0);
    }

    return planosFiltrados;
  };

  const abrirImpressao = (plano) => {
    // Usar visualização em documento para todos os planos (suporta ambas estruturas)
    setPlanoVisualizacao(plano);
    setModalVisualizacao(true);
  };

  const fecharImpressao = () => {
    setDialogImpressao(false);
    setPlanoImpressao(null);
  };

  const imprimirPlano = () => {
    window.print();
  };

  const limparFiltros = () => {
    setFiltroTurmaAprovados('');
    setFiltroTituloAprovados('');
    setFiltroCompetenciaAprovados('');
    setFiltroDataAprovados('');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Dialog open={modalConfirmacao.open} onClose={() => setModalConfirmacao({ ...modalConfirmacao, open: false })}>
        <DialogTitle>Confirmação</DialogTitle>
        <DialogContent>
          <Typography>{modalConfirmacao.mensagem}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalConfirmacao({ ...modalConfirmacao, open: false })} color="inherit">Cancelar</Button>
          <Button onClick={modalConfirmacao.onConfirm} color="error" variant="contained">Confirmar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={modalFeedback.open} onClose={() => setModalFeedback({ open: false, mensagem: '' })}>
        <DialogTitle>Informação</DialogTitle>
        <DialogContent>
          <Typography>{modalFeedback.mensagem}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalFeedback({ open: false, mensagem: '' })} autoFocus>OK</Button>
        </DialogActions>
      </Dialog>
      <Box sx={{ 
        p: 3,
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon color="primary" />
          Planejamento de Aulas
        </Typography>
        
        {/* Botão de Ação */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<CalendarIcon />}
          onClick={() => {
            setPlanoDiarioEditando(null);
            setEditorDiarioOpen(true);
          }}
          sx={{ 
            fontWeight: 'bold',
            boxShadow: 3,
            '&:hover': { boxShadow: 6 }
          }}
        >
          Novo Plano Diário
        </Button>
      </Box>

      {/* Seletor de Período Letivo */}
      <Box sx={{ mb: 3 }}>
        <SeletorPeriodoLetivo
          value={periodoLetivoSelecionado}
          onChange={setPeriodoLetivoSelecionado}
          required
          label="Período Letivo"
        />
      </Box>

      {/* Abas de navegação */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={abaAtual} onChange={(e, newValue) => setAbaAtual(newValue)}>
          <Tab 
            label="Planejamento de Aulas" 
            icon={<AssignmentIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Planos Aprovados" 
            icon={<CheckCircleIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Aba 0: Planejamento de Aulas */}
      {abaAtual === 0 && (
      <Grid container spacing={4}>
        {/* Filtros */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ClassIcon color="primary" />
                Filtros
              </Typography>
              
              <SeletorTurmaAluno 
                showAlunosSelector={false}
                title="🎯 Selecionar Turma para Planejamento"
                onTurmaChange={(turmaId) => setSelectedTurmas([turmaId])}
                filtrarTurmasPorProfessor={userRole === 'professora'}
                professorUid={user?.uid}
                userRole={userRole}
              />
            </CardContent>
          </Card>

          {/* Calendário da Grade */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon color="primary" />
                Grade de Horários
              </Typography>
              <CalendarioGrade
                gradeHoraria={gradeHoraria}
                turmas={turmas}
                disciplinas={disciplinas}
                selectedTurmas={selectedTurmas}
                onCriarPlano={(dadosIniciais) => abrirEditor(null, dadosIniciais)}
                professorUid={user?.uid}
                userRole={userRole}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Quadro de Planos Pendentes */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon color="warning" />
                Planos de Aulas Pendentes
              </Typography>
              {planosPendentes.length === 0 ? (
                <Box sx={{ mt: 2, textAlign: 'center', color: 'text.secondary', fontStyle: 'italic' }}>
                  <Typography variant="body1" gutterBottom>
                    📝 <strong>Nenhum plano de aula pendente</strong>
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <Box sx={{ maxWidth: '1200px', width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {planosPendentes.map((grupo) => (
                      <Card key={grupo.turmaId} sx={{ '&:hover': { boxShadow: 6 }, transition: 'box-shadow 0.3s', boxShadow: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, pb: 2, borderBottom: '2px solid #e0e0e0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
                              <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                  {grupo.turma?.nome || `Turma ${grupo.turmaId}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {grupo.planos.length} plano(s) de aula
                                </Typography>
                              </Box>
                            </Box>
                            <Chip label={grupo.planos.length} color="warning" variant="filled" sx={{ fontSize: '1rem', height: 32, minWidth: 60 }} />
                          </Box>
                          <Grid container spacing={2}>
                            {grupo.planos.map((plano, index) => (
                              <Grid item xs={12} key={plano.id}>
                                <Box sx={{ p: 3, border: '2px solid #e0e0e0', borderRadius: 3, bgcolor: index % 2 === 0 ? '#fafafa' : '#ffffff', '&:hover': { bgcolor: '#f0f7ff', borderColor: 'primary.main', boxShadow: 2, transform: 'translateY(-2px)' }, transition: 'all 0.3s ease', boxShadow: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                        {plano.tipo_plano === 'diario' 
                                          ? `Plano Diário - ${formatarDataLocal(plano.data)}`
                                          : (plano.titulo || 'Plano sem título')
                                        }
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                        {/* Exibir disciplinas (uma ou múltiplas) */}
                                        {Array.isArray(plano.disciplinaId) ? (
                                          plano.disciplinaId.map(discId => (
                                            <Chip 
                                              key={discId}
                                              label={disciplinas[discId]?.nome || 'Disciplina'} 
                                              size="small" 
                                              color="secondary" 
                                              variant="outlined" 
                                            />
                                          ))
                                        ) : (
                                          <Chip 
                                            label={disciplinas[plano.disciplinaId]?.nome || 'Disciplina'} 
                                            size="small" 
                                            color="secondary" 
                                            variant="outlined" 
                                          />
                                        )}
                                        
                                        {plano.tipo_plano === 'diario' && (
                                          <Chip 
                                            label="📅 Plano Diário" 
                                            size="small" 
                                            color="secondary" 
                                            variant="filled"
                                            sx={{ fontWeight: 'bold' }}
                                          />
                                        )}
                                        {plano.statusAprovacao && (
                                          <Chip 
                                            label={
                                              plano.statusAprovacao === 'rejeitado' ? 'Rejeitado' : 
                                              plano.statusAprovacao === 'em_revisao' ? 'Aguardando Revisão' : 
                                              'Pendente'
                                            } 
                                            size="small" 
                                            color={
                                              plano.statusAprovacao === 'rejeitado' ? 'error' : 
                                              plano.statusAprovacao === 'em_revisao' ? 'warning' : 
                                              'info'
                                            } 
                                            variant="filled" 
                                          />
                                        )}
                                      </Box>
                                      <Typography variant="body2" color="text.secondary">
                                        📅 {plano.data ? formatarDataLocal(plano.data) : 'Sem data'}
                                        {plano.horaInicio && plano.horaFim && ` • ⏰ ${plano.horaInicio} às ${plano.horaFim}`}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: 'italic' }}>
                                        {plano.tipo_plano === 'diario' 
                                          ? (plano.objetivosAprendizagem ? `📝 ${plano.objetivosAprendizagem}` : '📝 Sem objetivos definidos')
                                          : (Array.isArray(plano.objetivos) && plano.objetivos.length > 0 ? `📝 ${plano.objetivos[0]}${plano.objetivos.length > 1 ? ' (+' + (plano.objetivos.length - 1) + ' mais)' : ''}` : '📝 Sem objetivos definidos')
                                        }
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                      <Tooltip title="Visualizar Plano">
                                        <IconButton color="primary" onClick={() => abrirVisualizacao(plano, grupo.planos)} sx={{ '&:hover': { backgroundColor: 'primary.light', color: 'white' } }}>
                                          <VisibilityIcon />
                                        </IconButton>
                                      </Tooltip>
                                      {plano.statusAprovacao !== 'aprovado' ? (
                                        <>
                                          <Tooltip title="Editar Plano">
                                            <IconButton color="secondary" onClick={() => abrirEditor(plano)} sx={{ '&:hover': { backgroundColor: 'secondary.light', color: 'white' } }}>
                                              <EditIcon />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Excluir Plano">
                                            <IconButton color="error" onClick={() => excluirPlano(plano.id, plano.titulo)} sx={{ '&:hover': { backgroundColor: 'error.light', color: 'white' } }}>
                                              <DeleteIcon />
                                            </IconButton>
                                          </Tooltip>
                                        </>
                                      ) : (
                                        role === 'professora' && (
                                          <>
                                            <Tooltip title="Editar Plano (inativo)">
                                              <span>
                                                <IconButton color="secondary" disabled>
                                                  <EditIcon />
                                                </IconButton>
                                              </span>
                                            </Tooltip>
                                            <Tooltip title="Excluir Plano (inativo)">
                                              <span>
                                                <IconButton color="error" disabled>
                                                  <DeleteIcon />
                                                </IconButton>
                                              </span>
                                            </Tooltip>
                                          </>
                                        )
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      {/* Aba 1: Planos Aprovados */}
      {abaAtual === 1 && (
        <Box>
          {/* Filtros de busca */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon color="primary" />
                Filtros de Busca
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth sx={{ minWidth: '250px' }}>
                    <InputLabel>Turma</InputLabel>
                    <Select
                      value={filtroTurmaAprovados}
                      onChange={(e) => setFiltroTurmaAprovados(e.target.value)}
                      label="Turma"
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {Object.entries(turmas).map(([id, turma]) => (
                        <MenuItem key={id} value={id}>{turma.nome}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Título da Aula"
                    value={filtroTituloAprovados}
                    onChange={(e) => setFiltroTituloAprovados(e.target.value)}
                    placeholder="Digite o título..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Competência BNCC"
                    value={filtroCompetenciaAprovados}
                    onChange={(e) => setFiltroCompetenciaAprovados(e.target.value)}
                    placeholder="Ex: EF01LP01"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Data"
                    value={filtroDataAprovados}
                    onChange={(e) => setFiltroDataAprovados(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={12} md={1}>
                  <Button 
                    fullWidth
                    variant="outlined" 
                    onClick={limparFiltros}
                    sx={{ height: '100%' }}
                  >
                    Limpar
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Lista de planos aprovados agrupados */}
          {filtrarPlanosAprovados().length === 0 ? (
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Nenhum plano aprovado encontrado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(filtroTurmaAprovados || filtroTituloAprovados || filtroCompetenciaAprovados || filtroDataAprovados) 
                      ? 'Tente ajustar os filtros de busca' 
                      : 'Quando os planos forem aprovados, eles aparecerão aqui'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            filtrarPlanosAprovados().map((grupo) => (
              <Accordion key={grupo.turmaId} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <SchoolIcon color="primary" />
                      <Typography variant="h6">
                        {grupo.turma?.nome || `Turma ${grupo.turmaId}`}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${grupo.planos.length} plano(s)`} 
                      color="success" 
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {grupo.planos
                    .sort((a, b) => new Date(b.data) - new Date(a.data))
                    .map((plano) => (
                      <Card key={plano.id} sx={{ mb: 2, '&:hover': { boxShadow: 4 } }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ mb: 1 }}>
                                {plano.tipo_plano === 'diario' 
                                  ? `Plano Diário - ${formatarDataLocal(plano.data)}`
                                  : (plano.titulo || 'Sem título')
                                }
                              </Typography>
                              
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {/* Exibir disciplinas (uma ou múltiplas) */}
                                {Array.isArray(plano.disciplinaId) ? (
                                  plano.disciplinaId.map(discId => (
                                    <Chip 
                                      key={discId}
                                      label={disciplinas[discId]?.nome || 'Disciplina'} 
                                      size="small" 
                                      color="secondary" 
                                      variant="outlined"
                                    />
                                  ))
                                ) : (
                                  <Chip 
                                    label={disciplinas[plano.disciplinaId]?.nome || 'Disciplina'} 
                                    size="small" 
                                    color="secondary" 
                                    variant="outlined"
                                  />
                                )}
                                
                                {plano.tipo_plano === 'diario' && (
                                  <Chip 
                                    label="📅 Plano Diário" 
                                    size="small" 
                                    color="secondary" 
                                    variant="filled"
                                    sx={{ fontWeight: 'bold' }}
                                  />
                                )}
                                <Chip 
                                  label={formatarDataLocal(plano.data)} 
                                  size="small" 
                                  icon={<CalendarIcon />}
                                />
                                {plano.horaInicio && plano.horaFim && (
                                  <Chip 
                                    label={`${plano.horaInicio} - ${plano.horaFim}`} 
                                    size="small"
                                  />
                                )}
                                <Chip 
                                  label="APROVADO" 
                                  size="small" 
                                  color="success"
                                />
                              </Box>

                              {plano.bncc && plano.bncc.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                    Competências BNCC:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                    {plano.bncc.slice(0, 3).map((comp, idx) => (
                                      <Chip 
                                        key={idx}
                                        label={comp.codigo} 
                                        size="small" 
                                        variant="outlined"
                                      />
                                    ))}
                                    {plano.bncc.length > 3 && (
                                      <Chip 
                                        label={`+${plano.bncc.length - 3}`} 
                                        size="small" 
                                        variant="outlined"
                                      />
                                    )}
                                  </Box>
                                </Box>
                              )}

                              {/* Objetivos */}
                              {plano.tipo_plano === 'diario' ? (
                                plano.objetivosAprendizagem && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                                    📝 {plano.objetivosAprendizagem.substring(0, 100)}{plano.objetivosAprendizagem.length > 100 ? '...' : ''}
                                  </Typography>
                                )
                              ) : (
                                Array.isArray(plano.objetivos) && plano.objetivos.length > 0 && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                                    📝 {plano.objetivos[0]}{plano.objetivos.length > 1 ? ` (+${plano.objetivos.length - 1} mais)` : ''}
                                  </Typography>
                                )
                              )}

                              {/* Recursos - Miniaturas */}
                              {plano.recursos && Array.isArray(plano.recursos) && plano.recursos.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                                    📎 Recursos ({plano.recursos.length}):
                                  </Typography>
                                  <RecursosPreview recursos={plano.recursos} variant="thumbnails" maxItems={5} />
                                </Box>
                              )}

                              <Typography variant="body2" color="text.secondary">
                                Professor(a): {plano.professorNome}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                              <Tooltip title="Visualizar e Imprimir Plano">
                                <Button
                                  variant="contained"
                                  startIcon={<PrintIcon />}
                                  onClick={() => abrirImpressao(plano)}
                                  size="small"
                                >
                                  Visualizar/Imprimir
                                </Button>
                              </Tooltip>
                              
                              {(userRole === 'coordenador' || userRole === 'coordenadora') && (
                                <>
                                  <Button
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={() => abrirEditor(plano)}
                                    size="small"
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => excluirPlano(plano.id, plano.titulo)}
                                    size="small"
                                  >
                                    Excluir
                                  </Button>
                                </>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Box>
      )}

      {/* Modal de Impressão */}
      <Dialog
        open={dialogImpressao}
        onClose={fecharImpressao}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            '@media print': {
              boxShadow: 'none',
              maxWidth: '100%',
              margin: 0
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          '@media print': { display: 'none' }
        }}>
          <Typography variant="h6">Visualização para Impressão</Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={imprimirPlano}
              sx={{ mr: 1 }}
            >
              Imprimir
            </Button>
            <IconButton onClick={fecharImpressao}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, '@media print': { p: 0 } }}>
          {planoImpressao && (
            <RelatorioPlanoAula
              plano={planoImpressao}
              turma={turmas[planoImpressao.turmaId]}
              disciplina={disciplinas[planoImpressao.disciplinaId]}
              escola={currentSchool}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Componente de Visualização em Formato de Documento */}
      <VisualizacaoDocumentoPlano
        open={modalVisualizacao}
        onClose={fecharVisualizacao}
        plano={planoVisualizacao}
        turmas={turmas}
        disciplinas={disciplinas}
      />

      {/* Editor de Plano de Aula */}
      <EditorPlanoAula
        key={planoEditando?.id || 'novo'} // Força remontagem quando o plano muda
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setPlanoEditando(null);
        }}
        onSave={salvarPlano}
        plano={planoEditando}
        dadosIniciais={novoPlanoData}
        turmas={turmas}
        disciplinas={disciplinas}
        userRole={userRole}
        minhasTurmas={minhasTurmas}
        minhasDisciplinas={minhasDisciplinas}
        isEditing={!!planoEditando}
      />

      {/* Editor de Plano Diário */}
      <EditorPlanoDiario
        key={planoDiarioEditando?.id || 'novo-diario'} // Força remontagem quando o plano muda
        open={editorDiarioOpen}
        onClose={() => {
          setEditorDiarioOpen(false);
          setPlanoDiarioEditando(null);
        }}
        onSave={salvarPlano}
        onStatusChange={carregarDados} // Recarrega dados quando status mudar
        plano={planoDiarioEditando}
        turmas={turmas}
        disciplinas={disciplinas}
        userRole={userRole}
        minhasTurmas={minhasTurmas}
        minhasDisciplinas={minhasDisciplinas}
        isEditing={!!planoDiarioEditando}
        gradeHoraria={gradeHoraria}
        periodoLetivoSelecionado={periodoLetivoSelecionado} // Adicionada prop que estava faltando
      />
    </Box>
    </>
  );
};

export default PlanejamentoAulas;