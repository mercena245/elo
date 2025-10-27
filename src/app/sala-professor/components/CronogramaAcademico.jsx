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
    if (user?.uid && isReady) {
      carregarDados();
    }
  }, [user, isReady]);

  useEffect(() => {
    organizarEventos();
  }, [eventos, mesAtual]);

  const carregarDados = async () => {
    if (!isReady) {
      console.log('⏳ [CronogramaAcademico] Aguardando conexão com banco da escola...');
      return;
    }

    try {
      setLoading(true);
      
      // Buscar dados usando getData
      const [eventosData, turmasData, disciplinasData] = await Promise.all([
        getData('cronograma-academico'),
        getData('turmas'),
        getData('disciplinas')
      ]);

      setEventos(eventosData || {});
      setTurmas(turmasData || {});
      setDisciplinas(disciplinasData || {});
      
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
        await updateData(`cronograma-academico/${eventoEditando.id}`, eventoData);
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
      await removeData(`cronograma-academico/${eventoId}`);
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
    
    // Debug: verificar ano bissexto e data de hoje
    const hoje = new Date();
    const isAnoBissexto = (ano % 4 === 0 && ano % 100 !== 0) || (ano % 400 === 0);
    
    console.log('📅 Debug Calendário:', {
      ano,
      mes: mes + 1, // Mostrar mês human-readable (1-12)
      isAnoBissexto,
      primeiroDia: primeiroDia.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
      primeiroDiaGetDay: primeiroDia.getDay(),
      hoje: hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
      hojeGetDay: hoje.getDay(),
      diasNoMes: ultimoDia.getDate()
    });
    
    const dias = [];

    // Adicionar dias vazios do início (domingo = 0)
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
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
                mb: 2,
                width: '100%',
                aspectRatio: { xs: 'auto', md: '16/9' }
              }}>
                {/* Cabeçalho dos dias da semana */}
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                  <Box 
                    key={dia} 
                    sx={{ 
                      textAlign: 'center', 
                      py: 1,
                      backgroundColor: '#e3f2fd',
                      borderRadius: 1,
                      fontWeight: 'bold'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: 'primary.main'
                      }}
                    >
                      {dia}
                    </Typography>
                  </Box>
                ))}

                {/* Dias do mês */}
                {getDiasDoMes().map((dia, index) => {
                  if (!dia) {
                    return (
                      <Box 
                        key={`empty-${index}`} 
                        sx={{ 
                          aspectRatio: '1/1',
                          minHeight: 100
                        }} 
                      />
                    );
                  }

                  const dateKey = dia.toISOString().split('T')[0];
                  const eventosNoDia = eventosPorDia[dateKey] || [];
                  const hoje = new Date();
                  const isHoje = dia.getDate() === hoje.getDate() && 
                                 dia.getMonth() === hoje.getMonth() && 
                                 dia.getFullYear() === hoje.getFullYear();

                  return (
                    <Paper
                      key={dateKey}
                      elevation={isHoje ? 3 : 0}
                      variant="outlined"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          dataInicio: dateKey,
                          dataFim: ''
                        });
                        setModalOpen(true);
                      }}
                      sx={{
                        aspectRatio: '1/1',
                        minHeight: 100,
                        p: 1,
                        backgroundColor: isHoje ? '#e3f2fd' : 'white',
                        border: isHoje ? '2px solid #2196f3' : '1px solid #e0e0e0',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 3,
                          transform: 'scale(1.02)',
                          zIndex: 1,
                          backgroundColor: isHoje ? '#e3f2fd' : '#f5f5f5'
                        }
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: isHoje ? 'bold' : '500',
                          color: isHoje ? 'primary.main' : 'text.primary',
                          mb: 0.5,
                          fontSize: '1rem'
                        }}
                      >
                        {dia.getDate()}
                      </Typography>
                      
                      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                        {eventosNoDia.slice(0, 3).map((evento, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              backgroundColor: tiposEventos[evento.tipo]?.cor || '#ccc',
                              color: 'white',
                              fontSize: '0.7rem',
                              px: 0.5,
                              py: 0.2,
                              borderRadius: 0.5,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              transition: 'opacity 0.2s',
                              '&:hover': {
                                opacity: 0.85
                              }
                            }}
                            title={evento.titulo}
                          >
                            {evento.titulo}
                          </Box>
                        ))}
                        
                        {eventosNoDia.length > 3 && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'primary.main',
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              mt: 0.3
                            }}
                          >
                            +{eventosNoDia.length - 3} evento{eventosNoDia.length - 3 > 1 ? 's' : ''}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
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
      <Dialog 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: '500px'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <EventIcon color="primary" />
          <Typography variant="h6" component="span">
            {eventoEditando ? 'Editar Evento' : 'Novo Evento'}
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            {/* Título */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título do Evento"
                placeholder="Ex: Reunião de Pais, Prova de Matemática..."
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                variant="outlined"
                InputLabelProps={{
                  sx: { fontSize: '1rem' }
                }}
              />
            </Grid>

            {/* Descrição */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                placeholder="Descreva os detalhes do evento..."
                multiline
                rows={4}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                variant="outlined"
                InputLabelProps={{
                  sx: { fontSize: '1rem' }
                }}
              />
            </Grid>

            {/* Datas */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
                📅 Período do Evento
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Data de Início"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { fontSize: '1rem' }
                    }}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Data de Término (opcional)"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { fontSize: '1rem' }
                    }}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Classificação */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
                🏷️ Classificação
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel sx={{ fontSize: '1rem' }}>Tipo</InputLabel>
                    <Select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      label="Tipo"
                      sx={{ minHeight: '56px' }}
                    >
                      {Object.entries(tiposEventos).map(([key, tipo]) => (
                        <MenuItem key={key} value={key}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: tipo.cor
                              }}
                            />
                            {tipo.nome}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel sx={{ fontSize: '1rem' }}>Prioridade</InputLabel>
                    <Select
                      value={formData.prioridade}
                      onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                      label="Prioridade"
                      sx={{ minHeight: '56px' }}
                    >
                      {Object.entries(prioridades).map(([key, prioridade]) => (
                        <MenuItem key={key} value={key}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: prioridade.cor
                              }}
                            />
                            {prioridade.nome}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel sx={{ fontSize: '1rem' }}>Turma (opcional)</InputLabel>
                    <Select
                      value={formData.turmaId}
                      onChange={(e) => setFormData({ ...formData, turmaId: e.target.value })}
                      label="Turma (opcional)"
                      sx={{ minHeight: '56px' }}
                    >
                      <MenuItem value="">
                        <em>Todas as turmas</em>
                      </MenuItem>
                      {Object.entries(turmas).map(([id, turma]) => (
                        <MenuItem key={id} value={id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SchoolIcon fontSize="small" color="primary" />
                            {turma.nome}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ 
          px: 3, 
          py: 2, 
          borderTop: '1px solid',
          borderColor: 'divider',
          gap: 1
        }}>
          <Button 
            onClick={() => setModalOpen(false)}
            variant="outlined"
            size="large"
          >
            Cancelar
          </Button>
          <Button 
            onClick={salvarEvento} 
            variant="contained"
            size="large"
            startIcon={eventoEditando ? <EditIcon /> : <AddIcon />}
          >
            {eventoEditando ? 'Atualizar Evento' : 'Criar Evento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CronogramaAcademico;