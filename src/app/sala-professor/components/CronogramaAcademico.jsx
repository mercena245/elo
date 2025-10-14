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
  Calendar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Badge
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Event as EventIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Today as TodayIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import { ref, onValue, push, update, remove } from 'firebase/database';
;
import { useAuthUser } from '../../../hooks/useAuthUser';
import { auditService } from '../../../services/auditService';
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';

const CronogramaAcademico = () => {
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  const { user, userRole } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState({});
  const [turmas, setTurmas] = useState({});
  const [disciplinas, setDisciplinas] = useState({});
  
  // Estados de visualização
  const [mesAtual, setMesAtual] = useState(new Date());
  const [eventosPorDia, setEventosPorDia] = useState({});
  const [eventosProximos, setEventosProximos] = useState([]);
  
  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    dataInicio: '',
    dataFim: '',
    tipo: 'pedagogico',
    turmaId: '',
    disciplinaId: '',
    prioridade: 'media',
    status: 'ativo'
  });

  // Tipos de eventos acadêmicos
  const tiposEventos = {
    pedagogico: { nome: 'Pedagógico', cor: '#2196F3', icon: <SchoolIcon /> },
    avaliacao: { nome: 'Avaliação', cor: '#FF9800', icon: <AssignmentIcon /> },
    reuniao: { nome: 'Reunião', cor: '#9C27B0', icon: <EventIcon /> },
    feriado: { nome: 'Feriado', cor: '#F44336', icon: <TodayIcon /> },
    evento: { nome: 'Evento Escolar', cor: '#4CAF50', icon: <EventIcon /> },
    planejamento: { nome: 'Planejamento', cor: '#00BCD4', icon: <ScheduleIcon /> }
  };

  const prioridades = {
    baixa: { nome: 'Baixa', cor: '#4CAF50' },
    media: { nome: 'Média', cor: '#FF9800' },
    alta: { nome: 'Alta', cor: '#F44336' }
  };

  useEffect(() => {
    if (user?.uid) {
      carregarDados();
    }
  }, [user]);

  useEffect(() => {
    organizarEventos();
  }, [eventos, mesAtual]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const refs = {
        eventos: ref(db, 'cronograma-academico'),
        turmas: ref(db, 'turmas'),
        disciplinas: ref(db, 'disciplinas')
      };

      // Listeners
      const unsubscribes = [];

      unsubscribes.push(
        onValue(refs.eventos, (snapshot) => {
          setEventos(snapshot.val() || {});
        })
      );

      unsubscribes.push(
        onValue(refs.turmas, (snapshot) => {
          setTurmas(snapshot.val() || {});
        })
      );

      unsubscribes.push(
        onValue(refs.disciplinas, (snapshot) => {
          setDisciplinas(snapshot.val() || {});
        })
      );

      return () => unsubscribes.forEach(unsub => unsub());
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizarEventos = () => {
    const eventosArray = Object.entries(eventos).map(([id, evento]) => ({
      id,
      ...evento
    }));

    // Filtrar eventos do professor (se não for coordenador)
    let eventosFiltrados = eventosArray;
    if (userRole !== 'coordenador' && userRole !== 'coordenadora') {
      eventosFiltrados = eventosArray.filter(evento => 
        evento.criadoPor === user?.uid || !evento.criadoPor || evento.tipo === 'feriado'
      );
    }

    // Organizar eventos por dia
    const eventosPorDiaTemp = {};
    eventosFiltrados.forEach(evento => {
      const dataInicio = new Date(evento.dataInicio);
      const dataFim = evento.dataFim ? new Date(evento.dataFim) : dataInicio;
      
      // Adicionar evento para cada dia do período
      const currentDate = new Date(dataInicio);
      while (currentDate <= dataFim) {
        const dateKey = currentDate.toISOString().split('T')[0];
        if (!eventosPorDiaTemp[dateKey]) {
          eventosPorDiaTemp[dateKey] = [];
        }
        eventosPorDiaTemp[dateKey].push(evento);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    setEventosPorDia(eventosPorDiaTemp);

    // Eventos próximos (próximos 7 dias)
    const hoje = new Date();
    const proximosSeteDias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const eventosProximosTemp = eventosFiltrados.filter(evento => {
      const dataEvento = new Date(evento.dataInicio);
      return dataEvento >= hoje && dataEvento <= proximosSeteDias;
    }).sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));

    setEventosProximos(eventosProximosTemp);
  };

  const abrirModal = (evento = null) => {
    if (evento) {
      setEventoEditando(evento);
      setFormData({
        titulo: evento.titulo || '',
        descricao: evento.descricao || '',
        dataInicio: evento.dataInicio ? evento.dataInicio.split('T')[0] : '',
        dataFim: evento.dataFim ? evento.dataFim.split('T')[0] : '',
        tipo: evento.tipo || 'pedagogico',
        turmaId: evento.turmaId || '',
        disciplinaId: evento.disciplinaId || '',
        prioridade: evento.prioridade || 'media',
        status: evento.status || 'ativo'
      });
    } else {
      setEventoEditando(null);
      setFormData({
        titulo: '',
        descricao: '',
        dataInicio: '',
        dataFim: '',
        tipo: 'pedagogico',
        turmaId: '',
        disciplinaId: '',
        prioridade: 'media',
        status: 'ativo'
      });
    }
    setModalOpen(true);
  };

  const salvarEvento = async () => {
    if (!formData.titulo || !formData.dataInicio) {
      alert('Título e data de início são obrigatórios.');
      return;
    }

    try {
      const eventoData = {
        ...formData,
        dataInicio: new Date(formData.dataInicio + 'T00:00:00').toISOString(),
        dataFim: formData.dataFim ? new Date(formData.dataFim + 'T23:59:59').toISOString() : null,
        criadoPor: user.uid,
        criadoPorNome: user.displayName || user.email,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };

      if (eventoEditando) {
        await updateData('cronograma-academico/${eventoEditando.id}', eventoData);
        await auditService.logAction(
          'cronograma_evento_update',
          user.uid,
          {
            description: `Atualizou evento: ${formData.titulo}`,
            eventoId: eventoEditando.id
          }
        );
      } else {
        await pushData('cronograma-academico', eventoData);
        await auditService.logAction(
          'cronograma_evento_create',
          user.uid,
          {
            description: `Criou evento: ${formData.titulo}`,
            tipo: formData.tipo
          }
        );
      }

      setModalOpen(false);
      alert('Evento salvo com sucesso!');

    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar evento.');
    }
  };

  const excluirEvento = async (eventoId, titulo) => {
    if (!confirm(`Deseja excluir o evento "${titulo}"?`)) return;

    try {
      await removeData('cronograma-academico/${eventoId}');
      await auditService.logAction(
        'cronograma_evento_delete',
        user.uid,
        {
          description: `Excluiu evento: ${titulo}`,
          eventoId
        }
      );
      alert('Evento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      alert('Erro ao excluir evento.');
    }
  };

  const getDiasDoMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const dias = [];

    // Adicionar dias vazios do início
    const diasVaziosInicio = primeiroDia.getDay();
    for (let i = 0; i < diasVaziosInicio; i++) {
      dias.push(null);
    }

    // Adicionar todos os dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(ano, mes, dia));
    }

    return dias;
  };

  const navegarMes = (direcao) => {
    const novoMes = new Date(mesAtual);
    novoMes.setMonth(mesAtual.getMonth() + direcao);
    setMesAtual(novoMes);
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
          <CalendarMonthIcon color="primary" />
          Cronograma Acadêmico
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => abrirModal()}
          sx={{ borderRadius: 2 }}
        >
          Novo Evento
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Eventos Próximos */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                Próximos Eventos
              </Typography>
              
              {eventosProximos.length === 0 ? (
                <Alert severity="info">
                  Nenhum evento nos próximos 7 dias.
                </Alert>
              ) : (
                <List dense>
                  {eventosProximos.slice(0, 5).map((evento) => (
                    <ListItem key={evento.id} sx={{ px: 0 }}>
                      <ListItemText
                        primary={evento.titulo}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
                            <Typography variant="caption">
                              {new Date(evento.dataInicio).toLocaleDateString('pt-BR')}
                            </Typography>
                            <Chip
                              label={tiposEventos[evento.tipo]?.nome || evento.tipo}
                              size="small"
                              sx={{ 
                                fontSize: '0.7rem',
                                height: 20,
                                backgroundColor: tiposEventos[evento.tipo]?.cor,
                                color: 'white'
                              }}
                            />
                            <Chip
                              label={prioridades[evento.prioridade]?.nome || evento.prioridade}
                              size="small"
                              sx={{ 
                                fontSize: '0.7rem',
                                height: 20,
                                backgroundColor: prioridades[evento.prioridade]?.cor,
                                color: 'white'
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Calendário */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {/* Cabeçalho do Calendário */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Button onClick={() => navegarMes(-1)}>‹ Anterior</Button>
                <Typography variant="h6">
                  {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </Typography>
                <Button onClick={() => navegarMes(1)}>Próximo ›</Button>
              </Box>

              {/* Grade do Calendário */}
              <Grid container spacing={1}>
                {/* Cabeçalho dos dias da semana */}
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                  <Grid item xs key={dia} sx={{ width: '14.28%' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center', display: 'block' }}>
                      {dia}
                    </Typography>
                  </Grid>
                ))}

                {/* Dias do mês */}
                {getDiasDoMes().map((dia, index) => {
                  if (!dia) {
                    return <Grid item xs key={index} sx={{ width: '14.28%', height: 80 }} />;
                  }

                  const dateKey = dia.toISOString().split('T')[0];
                  const eventosNoDia = eventosPorDia[dateKey] || [];
                  const isHoje = dia.toDateString() === new Date().toDateString();

                  return (
                    <Grid item xs key={dia.getDate()} sx={{ width: '14.28%' }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          height: 80,
                          p: 0.5,
                          backgroundColor: isHoje ? '#e3f2fd' : 'transparent',
                          border: isHoje ? '2px solid #2196f3' : undefined,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: isHoje ? 'bold' : 'normal' }}>
                          {dia.getDate()}
                        </Typography>
                        
                        {eventosNoDia.slice(0, 2).map((evento, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              backgroundColor: tiposEventos[evento.tipo]?.cor || '#ccc',
                              color: 'white',
                              fontSize: '0.6rem',
                              p: 0.2,
                              borderRadius: 0.5,
                              mb: 0.2,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {evento.titulo}
                          </Box>
                        ))}
                        
                        {eventosNoDia.length > 2 && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            +{eventosNoDia.length - 2} mais
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Todos os Eventos */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon color="primary" />
            Todos os Eventos
          </Typography>
          
          {Object.entries(eventos).length === 0 ? (
            <Alert severity="info">
              <Typography variant="body1" gutterBottom>
                📅 <strong>Nenhum evento cadastrado</strong>
              </Typography>
              <Typography variant="body2">
                Crie eventos acadêmicos para organizar seu cronograma de aulas e atividades.
              </Typography>
            </Alert>
          ) : (
            Object.entries(eventos).map(([id, evento]) => (
              <Accordion key={id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tiposEventos[evento.tipo]?.icon}
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {evento.titulo}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                      <Chip
                        label={tiposEventos[evento.tipo]?.nome || evento.tipo}
                        size="small"
                        sx={{ 
                          backgroundColor: tiposEventos[evento.tipo]?.cor,
                          color: 'white'
                        }}
                      />
                      <Chip
                        label={prioridades[evento.prioridade]?.nome || evento.prioridade}
                        size="small"
                        sx={{ 
                          backgroundColor: prioridades[evento.prioridade]?.cor,
                          color: 'white'
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(evento.dataInicio).toLocaleDateString('pt-BR')}
                        {evento.dataFim && ` - ${new Date(evento.dataFim).toLocaleDateString('pt-BR')}`}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {evento.descricao}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => abrirModal(evento)}>
                      Editar
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      startIcon={<DeleteIcon />}
                      onClick={() => excluirEvento(id, evento.titulo)}
                    >
                      Excluir
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {eventoEditando ? 'Editar Evento' : 'Novo Evento'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={3}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data de Início"
                type="date"
                value={formData.dataInicio}
                onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data de Fim (opcional)"
                type="date"
                value={formData.dataFim}
                onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  label="Tipo"
                >
                  {Object.entries(tiposEventos).map(([key, tipo]) => (
                    <MenuItem key={key} value={key}>
                      {tipo.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  value={formData.prioridade}
                  onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                  label="Prioridade"
                >
                  {Object.entries(prioridades).map(([key, prioridade]) => (
                    <MenuItem key={key} value={key}>
                      {prioridade.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Turma (opcional)</InputLabel>
                <Select
                  value={formData.turmaId}
                  onChange={(e) => setFormData({ ...formData, turmaId: e.target.value })}
                  label="Turma (opcional)"
                >
                  <MenuItem value="">Nenhuma</MenuItem>
                  {Object.entries(turmas).map(([id, turma]) => (
                    <MenuItem key={id} value={id}>
                      {turma.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={salvarEvento} variant="contained">
            {eventoEditando ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CronogramaAcademico;