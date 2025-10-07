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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  Class as ClassIcon
} from '@mui/icons-material';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { db } from '../../../firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { auditService } from '../../../services/auditService';

// Imports diretos dos componentes com caminhos absolutos
import EditorPlanoAula from '../../../app/sala-professor/components/shared/EditorPlanoAula';
import CalendarioGrade from '../../../app/sala-professor/components/shared/CalendarioGrade';
import SeletorTurmaAluno from './SeletorTurmaAluno';

const PlanejamentoAulas = () => {
  const { user, userRole } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [planos, setPlanos] = useState({});
  const [gradeHoraria, setGradeHoraria] = useState({});
  const [turmas, setTurmas] = useState({});
  const [disciplinas, setDisciplinas] = useState({});
  const [alunos, setAlunos] = useState({});
  
  // Estados de filtro
  const [selectedTurmas, setSelectedTurmas] = useState([]);
  const [selectedAlunos, setSelectedAlunos] = useState([]);
  const [minhasTurmas, setMinhasTurmas] = useState([]);
  
  // Estados do editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [planoEditando, setPlanoEditando] = useState(null);
  const [novoPlanoData, setNovoPlanoData] = useState(null);
  
  // Estados de visualização
  const [planosOrganizados, setPlanosOrganizados] = useState([]);

  useEffect(() => {
    if (user?.uid) {
      carregarDados();
    }
  }, [user]);

  useEffect(() => {
    organizarPlanos();
  }, [planos, selectedTurmas, selectedAlunos]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const refs = {
        planos: ref(db, 'planos-aula'),
        gradeHoraria: ref(db, 'GradeHoraria'),
        turmas: ref(db, 'turmas'),
        disciplinas: ref(db, 'disciplinas'),
        alunos: ref(db, 'alunos')
      };

      // Listeners
      const unsubscribes = [];

      unsubscribes.push(
        onValue(refs.planos, (snapshot) => {
          setPlanos(snapshot.val() || {});
        })
      );

      unsubscribes.push(
        onValue(refs.gradeHoraria, (snapshot) => {
          setGradeHoraria(snapshot.val() || {});
        })
      );

      unsubscribes.push(
        onValue(refs.turmas, (snapshot) => {
          const turmasData = snapshot.val() || {};
          setTurmas(turmasData);
          
          // Se é professor, filtrar só suas turmas
          if (userRole === 'professor' || userRole === 'professora') {
            const minhasTurmasIds = Object.keys(turmasData).filter(turmaId => {
              // Aqui você pode implementar a lógica para verificar se o professor leciona nesta turma
              // Por enquanto, retorna todas (pode ser refinado conforme a estrutura de dados)
              return true;
            });
            setMinhasTurmas(minhasTurmasIds);
          }
        })
      );

      unsubscribes.push(
        onValue(refs.disciplinas, (snapshot) => {
          setDisciplinas(snapshot.val() || {});
        })
      );

      unsubscribes.push(
        onValue(refs.alunos, (snapshot) => {
          setAlunos(snapshot.val() || {});
        })
      );

      return () => unsubscribes.forEach(unsub => unsub());
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizarPlanos = () => {
    const planosArray = Object.entries(planos).map(([id, plano]) => ({
      id,
      ...plano
    }));

    // Filtrar por professor (se não for coordenador)
    let planosFiltrados = planosArray;
    if (userRole !== 'coordenador' && userRole !== 'coordenadora') {
      planosFiltrados = planosArray.filter(plano => 
        plano.professorUid === user?.uid
      );
    }

    // Filtrar por turmas selecionadas
    if (selectedTurmas.length > 0) {
      planosFiltrados = planosFiltrados.filter(plano => 
        selectedTurmas.includes(plano.turmaId)
      );
    }

    // Filtrar por alunos selecionados (se for específico)
    if (selectedAlunos.length > 0 && selectedAlunos[0] !== 'todos') {
      // Para planos de aula, isso pode não ser aplicável diretamente
      // mas mantemos a estrutura para futuras funcionalidades
    }

    // Ordenar por data e horário
    planosFiltrados.sort((a, b) => {
      const dataA = new Date(a.data || 0);
      const dataB = new Date(b.data || 0);
      if (dataA.getTime() !== dataB.getTime()) {
        return dataB - dataA; // Mais recentes primeiro
      }
      return (a.horario || '').localeCompare(b.horario || '');
    });

    setPlanosOrganizados(planosFiltrados);
  };

  const abrirEditor = (plano = null, dadosIniciais = null) => {
    setPlanoEditando(plano);
    setNovoPlanoData(dadosIniciais);
    setEditorOpen(true);
  };

  const salvarPlano = async (dadosPlano) => {
    try {
      const planoData = {
        ...dadosPlano,
        professorUid: user.uid,
        professorNome: user.displayName || user.email,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };

      if (planoEditando) {
        await update(ref(db, `planos-aula/${planoEditando.id}`), planoData);
        await auditService.logAction(
          'plano_aula_update',
          user.uid,
          {
            description: `Atualizou plano de aula: ${dadosPlano.titulo}`,
            planoId: planoEditando.id,
            turmaId: dadosPlano.turmaId,
            disciplinaId: dadosPlano.disciplinaId
          }
        );
      } else {
        await push(ref(db, 'planos-aula'), planoData);
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
      alert('Plano de aula salvo com sucesso!');

    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      alert('Erro ao salvar plano de aula.');
    }
  };

  const excluirPlano = async (planoId, titulo) => {
    if (!confirm(`Deseja excluir o plano de aula "${titulo}"?`)) return;

    try {
      await remove(ref(db, `planos-aula/${planoId}`));
      await auditService.logAction(
        'plano_aula_delete',
        user.uid,
        {
          description: `Excluiu plano de aula: ${titulo}`,
          planoId
        }
      );
      alert('Plano de aula excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      alert('Erro ao excluir plano de aula.');
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon color="primary" />
          Planejamento de Aulas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => abrirEditor()}
          sx={{ borderRadius: 2 }}
        >
          Novo Plano
        </Button>
      </Box>

      <Grid container spacing={3}>
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

        {/* Lista de Planos */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon color="primary" />
                Planos de Aula ({planosOrganizados.length})
              </Typography>

              {planosOrganizados.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    📝 <strong>Nenhum plano de aula encontrado</strong>
                  </Typography>
                  <Typography variant="body2">
                    Use o calendário ao lado para criar planos baseados na sua grade de horários, 
                    ou clique em "Novo Plano" para criar um plano personalizado.
                  </Typography>
                </Alert>
              ) : (
                <Box sx={{ mt: 2 }}>
                  {planosOrganizados.map((plano) => (
                    <Accordion key={plano.id} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>
                            {plano.titulo || 'Plano sem título'}
                          </Typography>
                          <Chip
                            label={turmas[plano.turmaId]?.nome || 'Turma'}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={disciplinas[plano.disciplinaId]?.nome || 'Disciplina'}
                            size="small"
                            color="secondary"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {plano.data ? new Date(plano.data).toLocaleDateString('pt-BR') : 'Sem data'}
                            {plano.horario && ` - ${plano.horario}`}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              <strong>Objetivos:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {plano.objetivos || 'Não informado'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              <strong>Conteúdo:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {plano.conteudo || 'Não informado'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              <strong>Metodologia:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {plano.metodologia || 'Não informado'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              <strong>Recursos:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {plano.recursos || 'Não informado'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                              <strong>Avaliação:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {plano.avaliacao || 'Não informado'}
                            </Typography>
                          </Grid>
                          {plano.observacoes && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" gutterBottom>
                                <strong>Observações:</strong>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 2 }}>
                                {plano.observacoes}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button size="small" startIcon={<EditIcon />} onClick={() => abrirEditor(plano)}>
                            Editar
                          </Button>
                          <Button 
                            size="small" 
                            color="error" 
                            startIcon={<DeleteIcon />}
                            onClick={() => excluirPlano(plano.id, plano.titulo)}
                          >
                            Excluir
                          </Button>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
      />
    </Box>
  );
};

export default PlanejamentoAulas;