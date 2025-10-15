"use client";

import React, { useState, useEffect } from 'react';
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
  Divider
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
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { auditService } from '../../../services/auditService';

// Imports diretos dos componentes com caminhos absolutos
import EditorPlanoAula from './shared/EditorPlanoAula';
import CalendarioGrade from '../../../app/sala-professor/components/shared/CalendarioGrade';
import SeletorTurmaAluno from './SeletorTurmaAluno';
import SeletorPeriodoLetivo from '../../components/shared/SeletorPeriodoLetivo';
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';

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
  
  // Estados de visualização
  const [planosPendentes, setPlanosPendentes] = useState([]);
  const [planosAprovados, setPlanosAprovados] = useState([]);

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
          continue;
        }

        console.log(`📚 Carregando grade da turma ${turmaId} no período ${turma.periodoId}`);
        
        const gradeData = await getData(`GradeHoraria/${turma.periodoId}/${turmaId}`);
        
        if (gradeData) {
          // Adicionar cada horário à grade completa
          Object.entries(gradeData).forEach(([horarioId, horario]) => {
            gradeCompleta[horarioId] = {
              ...horario,
              turmaId: turmaId // Garantir que tenha o turmaId
            };
          });
          
          console.log(`✅ Grade da turma ${turmaId} carregada:`, Object.keys(gradeData).length, 'aulas');
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
    const pendentes = planosFiltrados.filter(p => !p.statusAprovacao || p.statusAprovacao === 'pendente' || p.statusAprovacao === 'rejeitado');
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
  };

  const abrirEditor = (plano = null, dadosIniciais = null) => {
    console.log('📝 PlanejamentoAulas - Abrindo editor com dados:', {
      plano,
      dadosIniciais
    });
    
    setPlanoEditando(plano);
    setNovoPlanoData(dadosIniciais);
    setEditorOpen(true);
  };

  // Corrigido: sempre faz update se dadosPlano.id existir (inclusive aprovação/rejeição)
  const salvarPlano = async (dadosPlano, idPlano = null) => {
    try {
      const planoId = idPlano || dadosPlano.id;
      const planoData = {
        ...dadosPlano,
        professorUid: user.uid,
        professorNome: user.displayName || user.email,
        atualizadoEm: new Date().toISOString(),
      };
      if (planoId) {
        // Atualiza plano existente
        await updateData('planos-aula/${planoId}', planoData);
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
      setEditorOpen(false);
  setModalFeedback({ open: true, mensagem: 'Plano de aula salvo com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
  setModalFeedback({ open: true, mensagem: 'Erro ao salvar plano de aula.' });
    }
  };

  const excluirPlano = (planoId, titulo) => {
    const handleConfirm = async () => {
      try {
        await removeData('planos-aula/${planoId}');
        await auditService.logAction(
          'plano_aula_delete',
          user.uid,
          {
            description: `Excluiu plano de aula: ${titulo}`,
            planoId
          }
        );
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
    const grupo = planosDoGrupo.length > 0 ? planosDoGrupo : [plano];
    const indice = grupo.findIndex(p => p.id === plano.id);
    setPlanosGrupoVisualizacao(grupo);
    setIndiceAtualVisualizacao(indice >= 0 ? indice : 0);
    setPlanoVisualizacao(grupo[indice >= 0 ? indice : 0]);
    setModalVisualizacao(true);
  };

  const fecharVisualizacao = () => {
    setModalVisualizacao(false);
    setPlanoVisualizacao(null);
    setPlanosGrupoVisualizacao([]);
    setIndiceAtualVisualizacao(0);
  };

  const navegarVisualizacao = (direcao) => {
    const novoIndice = indiceAtualVisualizacao + direcao;
    if (novoIndice >= 0 && novoIndice < planosGrupoVisualizacao.length) {
      setIndiceAtualVisualizacao(novoIndice);
      setPlanoVisualizacao(planosGrupoVisualizacao[novoIndice]);
    }
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
        justifyContent: 'flex-start', 
        alignItems: 'center', 
        mb: 4,
        textAlign: 'center'
      }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon color="primary" />
          Planejamento de Aulas
        </Typography>
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

      {/* Grade horária agora carrega automaticamente baseada nas turmas */}
      <Grid container spacing={4} sx={{ mt: 1 }}>
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
                                        {plano.titulo || 'Plano sem título'}
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Chip label={disciplinas[plano.disciplinaId]?.nome || 'Disciplina'} size="small" color="secondary" variant="outlined" />
                                        {plano.statusAprovacao && (
                                          <Chip label={plano.statusAprovacao === 'rejeitado' ? 'Rejeitado' : 'Pendente'} size="small" color={plano.statusAprovacao === 'rejeitado' ? 'error' : 'warning'} variant="filled" />
                                        )}
                                      </Box>
                                      <Typography variant="body2" color="text.secondary">
                                        📅 {plano.data ? new Date(plano.data).toLocaleDateString('pt-BR') : 'Sem data'}
                                        {plano.horaInicio && plano.horaFim && ` • ⏰ ${plano.horaInicio} às ${plano.horaFim}`}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: 'italic' }}>
                                        {Array.isArray(plano.objetivos) && plano.objetivos.length > 0 ? `📝 ${plano.objetivos[0]}${plano.objetivos.length > 1 ? ' (+' + (plano.objetivos.length - 1) + ' mais)' : ''}` : '📝 Sem objetivos definidos'}
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

        {/* Quadro de Planos Aprovados */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon color="success" />
                Planos de Aulas Aprovados
              </Typography>
              {planosAprovados.length === 0 ? (
                <Box sx={{ mt: 2, textAlign: 'center', color: 'text.secondary', fontStyle: 'italic' }}>
                  <Typography variant="body1" gutterBottom>
                    ✅ <strong>Nenhum plano de aula aprovado</strong>
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <Box sx={{ maxWidth: '1200px', width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {planosAprovados.map((grupo) => (
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
                            <Chip label={grupo.planos.length} color="success" variant="filled" sx={{ fontSize: '1rem', height: 32, minWidth: 60 }} />
                          </Box>
                          <Grid container spacing={2}>
                            {grupo.planos.map((plano, index) => (
                              <Grid item xs={12} key={plano.id}>
                                <Box sx={{ p: 3, border: '2px solid #e0e0e0', borderRadius: 3, bgcolor: index % 2 === 0 ? '#fafafa' : '#ffffff', '&:hover': { bgcolor: '#e8f5e9', borderColor: 'success.main', boxShadow: 2, transform: 'translateY(-2px)' }, transition: 'all 0.3s ease', boxShadow: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                        {plano.titulo || 'Plano sem título'}
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Chip label={disciplinas[plano.disciplinaId]?.nome || 'Disciplina'} size="small" color="secondary" variant="outlined" />
                                        <Chip label="Aprovado" size="small" color="success" variant="filled" />
                                      </Box>
                                      <Typography variant="body2" color="text.secondary">
                                        📅 {plano.data ? new Date(plano.data).toLocaleDateString('pt-BR') : 'Sem data'}
                                        {plano.horaInicio && plano.horaFim && ` • ⏰ ${plano.horaInicio} às ${plano.horaFim}`}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: 'italic' }}>
                                        {Array.isArray(plano.objetivos) && plano.objetivos.length > 0 ? `📝 ${plano.objetivos[0]}${plano.objetivos.length > 1 ? ' (+' + (plano.objetivos.length - 1) + ' mais)' : ''}` : '📝 Sem objetivos definidos'}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                      <Tooltip title="Visualizar Plano">
                                        <IconButton color="primary" onClick={() => abrirVisualizacao(plano, grupo.planos)} sx={{ '&:hover': { backgroundColor: 'primary.light', color: 'white' } }}>
                                          <VisibilityIcon />
                                        </IconButton>
                                      </Tooltip>
                                      {(userRole === 'professor' || userRole === 'professora') ? (
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
                                      ) : (
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

      {/* Modal de Visualização de Plano como Documento */}
      <Dialog 
        open={modalVisualizacao} 
        onClose={fecharVisualizacao} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ 
          sx: { 
            maxHeight: '95vh',
            bgcolor: '#fafafa',
            background: 'linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)'
          } 
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          bgcolor: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderBottom: '3px solid #1976d2',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <VisibilityIcon />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                Plano de Aula
              </Typography>
              {planosGrupoVisualizacao.length > 1 && (
                <Typography variant="body2" sx={{ color: '#495057' }}>
                  {indiceAtualVisualizacao + 1} de {planosGrupoVisualizacao.length} planos • {turmas[planoVisualizacao?.turmaId]?.nome}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Navegação entre planos */}
            {planosGrupoVisualizacao.length > 1 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                <IconButton 
                  onClick={() => navegarVisualizacao(-1)}
                  disabled={indiceAtualVisualizacao === 0}
                  sx={{ bgcolor: 'primary.light', color: 'white', '&:hover': { bgcolor: 'primary.main' } }}
                >
                  <ChevronLeft />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'center', fontWeight: 'bold', color: '#212529' }}>
                  {indiceAtualVisualizacao + 1} / {planosGrupoVisualizacao.length}
                </Typography>
                <IconButton 
                  onClick={() => navegarVisualizacao(1)}
                  disabled={indiceAtualVisualizacao === planosGrupoVisualizacao.length - 1}
                  sx={{ bgcolor: 'primary.light', color: 'white', '&:hover': { bgcolor: 'primary.main' } }}
                >
                  <ChevronRight />
                </IconButton>
              </Box>
            )}
            
            <IconButton onClick={fecharVisualizacao} sx={{ bgcolor: 'error.light', color: 'white', '&:hover': { bgcolor: 'error.main' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: '#ffffff' }}>
          {planoVisualizacao && (
            <Box sx={{
              minHeight: '70vh',
              bgcolor: 'white',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)',
              position: 'relative'
            }}>
              {/* Cabeçalho do Documento */}
              <Box sx={{
                p: 4,
                bgcolor: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                color: 'white',
                textAlign: 'center',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderTop: '10px solid #1565c0'
                }
              }}>
                {/* Container com fundo sólido para garantir visibilidade */}
                <Box sx={{
                  backgroundColor: '#1976d2',
                  color: '#ffffff',
                  padding: 2,
                  borderRadius: 1,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    mb: 1, 
                    color: '#ffffff !important',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                  }}>
                    {planoVisualizacao.titulo || 'Plano de Aula'}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: '#ffffff !important',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    {turmas[planoVisualizacao.turmaId]?.nome} • {disciplinas[planoVisualizacao.disciplinaId]?.nome}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    mt: 1, 
                    color: '#ffffff !important',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    📅 {planoVisualizacao.data ? new Date(planoVisualizacao.data).toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Data não definida'}
                    {planoVisualizacao.horaInicio && planoVisualizacao.horaFim && 
                      ` • ⏰ ${planoVisualizacao.horaInicio} às ${planoVisualizacao.horaFim}`
                    }
                  </Typography>
                </Box>
                
                {/* Status de Aprovação */}
                {planoVisualizacao.statusAprovacao && (
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={
                        planoVisualizacao.statusAprovacao === 'aprovado' ? '✅ Aprovado' :
                        planoVisualizacao.statusAprovacao === 'rejeitado' ? '❌ Rejeitado' :
                        '⏳ Pendente de Aprovação'
                      }
                      sx={{
                        bgcolor: planoVisualizacao.statusAprovacao === 'aprovado' ? 'success.main' :
                               planoVisualizacao.statusAprovacao === 'rejeitado' ? 'error.main' : 'warning.main',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}
                    />
                  </Box>
                )}
              </Box>

              {/* Conteúdo do Documento */}
              <Box sx={{ p: 4 }}>
                {/* Competências BNCC */}
                {planoVisualizacao.bncc && planoVisualizacao.bncc.length > 0 && (
                  <Box sx={{ mb: 4, p: 3, bgcolor: '#e3f2fd', borderRadius: 2, border: '2px solid #1976d2' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      📚 Competências BNCC
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {planoVisualizacao.bncc.map((comp, index) => (
                        <Chip
                          key={index}
                          label={`${comp.codigo} - ${comp.descricao}`}
                          variant="filled"
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Objetivos - Centralizado */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  width: '100%',
                  mb: 4
                }}>
                  <Box sx={{ maxWidth: '900px', width: '100%' }}>
                    <Box sx={{
                      p: 4,
                      bgcolor: '#f8f9fa',
                      border: '3px solid #e9ecef',
                      borderRadius: 3,
                      boxShadow: 2,
                      '&:hover': {
                        boxShadow: 4,
                        borderColor: 'primary.light'
                      },
                      transition: 'all 0.3s ease'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '2px solid #e0e0e0', pb: 2 }}>
                        🎯 Objetivos da Aula
                      </Typography>
                      {Array.isArray(planoVisualizacao.objetivos) && planoVisualizacao.objetivos.length > 0 ? (
                        <Box component="ol" sx={{ pl: 3, m: 0 }}>
                          {planoVisualizacao.objetivos.map((objetivo, index) => (
                            <Typography component="li" key={index} variant="body1" sx={{ mb: 2, lineHeight: 1.8, fontSize: '1.1rem' }}>
                              {objetivo}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', p: 3, bgcolor: '#ffffff', borderRadius: 2, textAlign: 'center' }}>
                          Nenhum objetivo definido para esta aula.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Grid de Conteúdos - Centralizado */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  width: '100%',
                  mb: 4
                }}>
                  <Box sx={{ maxWidth: '1000px', width: '100%' }}>
                    <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
                      {[
                        { campo: 'conteudo', titulo: '📖 Conteúdo Programático', icon: '📖' },
                        { campo: 'metodologia', titulo: '🎓 Metodologia de Ensino', icon: '🎓' },
                        { campo: 'recursos', titulo: '🛠️ Recursos Didáticos', icon: '🛠️' },
                        { campo: 'avaliacao', titulo: '📊 Avaliação', icon: '📊' }
                      ].map(({ campo, titulo, icon }) => (
                        <Grid item xs={12} sm={6} lg={6} key={campo}>
                          <Box sx={{ 
                            minHeight: 220,
                            height: '100%',
                            bgcolor: '#fafafa',
                            border: '3px solid #e0e0e0',
                            borderRadius: 3,
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            '&:hover': { 
                              boxShadow: 4, 
                              borderColor: 'primary.light',
                              transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease',
                            boxShadow: 2
                          }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2, borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                          {titulo}
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          lineHeight: 1.7,
                          whiteSpace: 'pre-wrap',
                          color: planoVisualizacao[campo] ? 'text.primary' : 'text.secondary',
                          fontStyle: planoVisualizacao[campo] ? 'normal' : 'italic'
                        }}>
                          {planoVisualizacao[campo] || 'Não informado para esta seção.'}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                    </Grid>
                  </Box>
                </Box>

                {/* Observações - Centralizada */}
                {planoVisualizacao.observacoes && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    width: '100%',
                    mt: 4
                  }}>
                    <Box sx={{ maxWidth: '800px', width: '100%' }}>
                      <Box sx={{ 
                        p: 4, 
                        bgcolor: '#fff3e0', 
                        border: '3px solid #ff9800', 
                        borderRadius: 3,
                        boxShadow: 2,
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.3s ease'
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'orange.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          📝 Observações Adicionais
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                          {planoVisualizacao.observacoes}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Rodapé do Documento */}
                <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid #e0e0e0', textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="caption">
                    Plano criado por: {planoVisualizacao.professorNome || 'Professor'} • 
                    {planoVisualizacao.criadoEm && ` Criado em: ${new Date(planoVisualizacao.criadoEm).toLocaleDateString('pt-BR')}`}
                    {planoVisualizacao.atualizadoEm && planoVisualizacao.atualizadoEm !== planoVisualizacao.criadoEm && 
                      ` • Atualizado em: ${new Date(planoVisualizacao.atualizadoEm).toLocaleDateString('pt-BR')}`
                    }
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              💡 Use as setas para navegar entre os planos da mesma turma
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={fecharVisualizacao} color="inherit" variant="outlined">
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  fecharVisualizacao();
                  abrirEditor(planoVisualizacao);
                }} 
                variant="contained" 
                startIcon={<EditIcon />}
              >
                Editar Plano
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Editor de Plano de Aula */}
              <EditorPlanoAula
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
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
    </Box>
    </>
  );
};

export default PlanejamentoAulas;