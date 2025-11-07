"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Paper,
  Divider,
  Stack,
  CircularProgress,
  Tooltip,
  Menu,
  useTheme,
  useMediaQuery,
  Chip,
  Fab,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Visibility as VisibilityIcon,
  CalendarMonth as CalendarMonthIcon,
  AccessTime as AccessTimeIcon,
  School as SchoolIcon,
  PriorityHigh as PriorityHighIcon,
  ExpandLess,
  ExpandMore,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { auditService } from '../../../services/auditService';
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';

const CalendarioAcademicoSection = ({ userRole, userData }) => {
  const { getData, pushData, updateData, removeData, isReady } = useSchoolDatabase();
  const { user } = useAuthUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState({});
  const [turmas, setTurmas] = useState({});
  const [mesAtual, setMesAtual] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVisualizarOpen, setModalVisualizarOpen] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({ title: '', message: '', type: 'error' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [eventosExpandidos, setEventosExpandidos] = useState({});
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    dataInicio: '',
    dataFim: '',
    tipo: 'aula',
    prioridade: 'media',
    turmaId: ''
  });

  const tiposEventos = {
    aula: { nome: 'Aula', cor: '#039BE5' },
    prova: { nome: 'Prova/Avaliação', cor: '#D50000' },
    reuniao: { nome: 'Reunião', cor: '#F4511E' },
    evento: { nome: 'Evento Especial', cor: '#0B8043' },
    feriado: { nome: 'Feriado', cor: '#616161' },
    planejamento: { nome: 'Planejamento', cor: '#7986CB' },
    outro: { nome: 'Outro', cor: '#8E24AA' }
  };

  const prioridades = {
    baixa: { nome: 'Baixa', cor: '#616161' },
    media: { nome: 'Média', cor: '#F09300' },
    alta: { nome: 'Alta', cor: '#D50000' }
  };

  useEffect(() => {
    if (user?.uid && isReady) {
      carregarDados();
    }
  }, [user, isReady]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [eventosData, turmasData] = await Promise.all([
        getData('cronograma-academico'),
        getData('turmas')
      ]);
      setEventos(eventosData || {});
      setTurmas(turmasData || {});
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const navegarMes = (direcao) => {
    const novoMes = new Date(mesAtual);
    novoMes.setMonth(mesAtual.getMonth() + direcao);
    setMesAtual(novoMes);
  };

  const irParaHoje = () => setMesAtual(new Date());

  const getDiasDoMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const dias = [];
    const diasVaziosInicio = primeiroDia.getDay();
    for (let i = 0; i < diasVaziosInicio; i++) dias.push(null);
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(ano, mes, dia));
    }
    return dias;
  };

  const getEventosNoDia = (data) => {
    const dateKey = data.toISOString().split('T')[0];
    return Object.entries(eventos)
      .map(([id, evento]) => ({ id, ...evento }))
      .filter(evento => {
        const eventoInicio = evento.dataInicio?.split('T')[0];
        const eventoFim = evento.dataFim?.split('T')[0] || eventoInicio;
        return dateKey >= eventoInicio && dateKey <= eventoFim;
      });
  };

  const getEventosDoMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    
    return Object.entries(eventos)
      .map(([id, evento]) => ({ id, ...evento }))
      .filter(evento => {
        const eventoData = new Date(evento.dataInicio);
        return eventoData.getFullYear() === ano && eventoData.getMonth() === mes;
      })
      .sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));
  };

  const abrirModalNovoEvento = (data = null) => {
    setEventoEditando(null);
    setFormData({
      titulo: '',
      descricao: '',
      dataInicio: data ? data.toISOString().split('T')[0] : '',
      dataFim: '',
      tipo: 'aula',
      prioridade: 'media',
      turmaId: ''
    });
    setModalOpen(true);
  };

  const editarEvento = (evento) => {
    setEventoEditando(evento);
    setFormData({
      titulo: evento.titulo,
      descricao: evento.descricao || '',
      dataInicio: evento.dataInicio?.split('T')[0] || '',
      dataFim: evento.dataFim?.split('T')[0] || '',
      tipo: evento.tipo,
      prioridade: evento.prioridade,
      turmaId: evento.turmaId || ''
    });
    setModalOpen(true);
    setAnchorEl(null);
  };

  const visualizarEvento = (evento) => {
    setEventoSelecionado(evento);
    setModalVisualizarOpen(true);
    setAnchorEl(null);
  };

  const salvarEvento = async () => {
    if (!formData.titulo || !formData.dataInicio) {
      setDialogMessage({
        title: 'Campos obrigatórios',
        message: 'Por favor, preencha o título e a data de início do evento.',
        type: 'error'
      });
      setDialogOpen(true);
      return;
    }
    
    try {
      const eventoData = { 
        ...formData, 
        dataFim: formData.dataFim && formData.dataFim !== formData.dataInicio ? formData.dataFim : null,
        criadoPor: user?.uid, 
        criadoEm: new Date().toISOString() 
      };
      
      if (eventoEditando) {
        await updateData(`cronograma-academico/${eventoEditando.id}`, eventoData);
      } else {
        await pushData('cronograma-academico', eventoData);
      }
      
      try {
        if (eventoEditando) {
          await auditService.log({ acao: 'editar_evento_cronograma', detalhes: `Evento editado: ${formData.titulo}`, usuarioEmail: user?.email });
        } else {
          await auditService.log({ acao: 'criar_evento_cronograma', detalhes: `Novo evento: ${formData.titulo}`, usuarioEmail: user?.email });
        }
      } catch (auditError) {
        console.warn('Erro ao registrar auditoria:', auditError);
      }
      
      setModalOpen(false);
      setEventoEditando(null);
      setFormData({
        titulo: '',
        descricao: '',
        dataInicio: '',
        dataFim: '',
        tipo: 'aula',
        prioridade: 'media',
        turmaId: ''
      });
      
      carregarDados();
      
      setDialogMessage({
        title: 'Sucesso!',
        message: eventoEditando ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!',
        type: 'success'
      });
      setDialogOpen(true);
      
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      setDialogMessage({
        title: 'Erro',
        message: 'Ocorreu um erro ao salvar o evento. Tente novamente.',
        type: 'error'
      });
      setDialogOpen(true);
    }
  };

  const excluirEvento = async () => {
    if (!eventoSelecionado) return;
    
    const confirmacao = window.confirm(`Deseja excluir "${eventoSelecionado.titulo}"?`);
    if (!confirmacao) return;
    
    try {
      await removeData(`cronograma-academico/${eventoSelecionado.id}`);
      
      try {
        await auditService.log({ acao: 'excluir_evento_cronograma', detalhes: `Evento excluído: ${eventoSelecionado.titulo}`, usuarioEmail: user?.email });
      } catch (auditError) {
        console.warn('Erro ao registrar auditoria:', auditError);
      }
      
      setAnchorEl(null);
      setEventoSelecionado(null);
      
      carregarDados();
      
      setDialogMessage({
        title: 'Sucesso!',
        message: 'Evento excluído com sucesso!',
        type: 'success'
      });
      setDialogOpen(true);
      
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      setDialogMessage({
        title: 'Erro',
        message: 'Ocorreu um erro ao excluir o evento. Tente novamente.',
        type: 'error'
      });
      setDialogOpen(true);
    }
  };

  const isHoje = (data) => {
    const hoje = new Date();
    return data.getDate() === hoje.getDate() && data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
  };

  const toggleEventoExpandido = (eventoId) => {
    setEventosExpandidos(prev => ({
      ...prev,
      [eventoId]: !prev[eventoId]
    }));
  };

  const renderCalendario = () => {
    // Definir nomes dos dias baseado no tamanho da tela
    const getNomesDias = () => {
      if (isSmallMobile) return ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      if (isMobile) return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      return ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    };

    return (
      <Card sx={{ 
        borderRadius: 2, 
        boxShadow: 1, 
        overflow: 'hidden',
        border: '1px solid', 
        borderColor: 'divider' 
      }}>
        {/* Header dos dias da semana */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          backgroundColor: 'grey.100',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          {getNomesDias().map((dia, index) => (
            <Box key={`${dia}-${index}`} sx={{ 
              p: { xs: 1, sm: 1.5 }, 
              textAlign: 'center',
              borderRight: index < 6 ? '1px solid' : 'none',
              borderColor: 'divider'
            }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'text.secondary', 
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }
                }}
              >
                {dia}
              </Typography>
            </Box>
          ))}
        </Box>
        
        {/* Grid de dias */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)',
          backgroundColor: 'background.paper'
        }}>
          {getDiasDoMes().map((dia, index) => {
            if (!dia) return (
              <Box key={`empty-${index}`} sx={{ 
                minHeight: { xs: 50, sm: 80, md: 120 },
                borderRight: index % 7 < 6 ? '1px solid' : 'none',
                borderBottom: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'grey.50'
              }} />
            );
            
            const eventosNoDia = getEventosNoDia(dia);
            const ehHoje = isHoje(dia);
            const ehDomingo = dia.getDay() === 0;
            
            return (
              <Box 
                key={dia.toISOString()} 
                onClick={() => abrirModalNovoEvento(dia)} 
                sx={{ 
                  minHeight: { xs: 50, sm: 80, md: 120 },
                  p: { xs: 0.5, sm: 1 },
                  cursor: 'pointer', 
                  borderRight: index % 7 < 6 ? '1px solid' : 'none',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: ehHoje ? 'primary.50' : 'background.paper',
                  '&:hover': { 
                    backgroundColor: ehHoje ? 'primary.100' : 'action.hover' 
                  },
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Número do dia */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: ehHoje ? 700 : 500,
                    color: ehHoje ? 'primary.main' : (ehDomingo ? 'error.main' : 'text.primary'),
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    mb: { xs: 0.5, sm: 1 },
                    textAlign: 'center'
                  }}
                >
                  {dia.getDate()}
                </Typography>
                
                {/* Eventos */}
                <Box sx={{ 
                  flex: 1, 
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: { xs: 0.25, sm: 0.5 }
                }}>
                  {eventosNoDia.slice(0, isMobile ? 1 : 3).map(evento => (
                    <Box 
                      key={evento.id}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEventoSelecionado(evento); 
                        setAnchorEl(e.currentTarget); 
                      }} 
                      sx={{ 
                        backgroundColor: tiposEventos[evento.tipo]?.cor || '#039BE5', 
                        color: 'white', 
                        px: { xs: 0.5, sm: 1 }, 
                        py: { xs: 0.25, sm: 0.5 }, 
                        borderRadius: 1, 
                        fontSize: { xs: '0.6rem', sm: '0.7rem' }, 
                        fontWeight: 500, 
                        textOverflow: 'ellipsis', 
                        overflow: 'hidden', 
                        whiteSpace: 'nowrap', 
                        cursor: 'pointer', 
                        '&:hover': { opacity: 0.9 }
                      }}
                      title={evento.titulo}
                    >
                      {isMobile && evento.titulo.length > 8 
                        ? evento.titulo.substring(0, 8) + '...' 
                        : evento.titulo}
                    </Box>
                  ))}
                  {eventosNoDia.length > (isMobile ? 1 : 3) && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.secondary', 
                        fontSize: { xs: '0.55rem', sm: '0.65rem' },
                        textAlign: 'center'
                      }}
                    >
                      +{eventosNoDia.length - (isMobile ? 1 : 3)}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Card>
    );
  };



  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header responsivo */}
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, width: { xs: '100%', sm: 'auto' } }}>
            <Button 
              variant="outlined" 
              startIcon={!isSmallMobile && <TodayIcon />}
              onClick={irParaHoje} 
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 500,
                minWidth: { xs: 40, sm: 'initial' },
                px: { xs: 1, sm: 2 }
              }}
              size={isSmallMobile ? "small" : "medium"}
            >
              {isSmallMobile ? <TodayIcon /> : 'Hoje'}
            </Button>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton onClick={() => navegarMes(-1)} size={isSmallMobile ? "small" : "medium"}>
                <ChevronLeft />
              </IconButton>
              <Typography 
                variant={isSmallMobile ? "subtitle1" : "h5"} 
                sx={{ 
                  fontWeight: 500, 
                  minWidth: { xs: 140, sm: 220 }, 
                  textAlign: 'center',
                  textTransform: 'capitalize',
                  fontSize: { xs: '0.9rem', sm: '1.5rem' }
                }}
              >
                {isSmallMobile 
                  ? mesAtual.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')
                  : mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                }
              </Typography>
              <IconButton onClick={() => navegarMes(1)} size={isSmallMobile ? "small" : "medium"}>
                <ChevronRight />
              </IconButton>
            </Box>
          </Box>
          
          {(userRole === 'professora' || userRole === 'coordenadora') && (
            isMobile ? (
              <Fab 
                color="primary" 
                onClick={() => abrirModalNovoEvento()}
                size={isSmallMobile ? "medium" : "large"}
                sx={{ 
                  position: { xs: 'fixed', sm: 'relative' },
                  bottom: { xs: 16, sm: 'auto' },
                  right: { xs: 16, sm: 'auto' },
                  zIndex: { xs: 1000, sm: 'auto' }
                }}
              >
                <AddIcon />
              </Fab>
            ) : (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => abrirModalNovoEvento()} 
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 3 }}
              >
                Criar evento
              </Button>
            )
          )}
        </Box>
      </Paper>

      {/* Calendário adaptativo */}
      {renderCalendario()}

      {/* Menu de contexto */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => visualizarEvento(eventoSelecionado)}>
          <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
          Ver detalhes
        </MenuItem>
        {(userRole === 'professora' || userRole === 'coordenadora') && (
          <>
            <MenuItem onClick={() => editarEvento(eventoSelecionado)}>
              <EditIcon sx={{ mr: 1 }} fontSize="small" />
              Editar
            </MenuItem>
            <Divider />
            <MenuItem onClick={excluirEvento} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
              Excluir
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Drawer para eventos do dia (mobile) */}
      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '70vh'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {eventoSelecionado?.dia && `Eventos - ${eventoSelecionado.dia.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`}
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          {eventoSelecionado?.eventos?.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                Nenhum evento neste dia
              </Typography>
              {(userRole === 'professora' || userRole === 'coordenadora') && (
                <Button 
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setDrawerOpen(false);
                    abrirModalNovoEvento(eventoSelecionado.dia);
                  }}
                  sx={{ mt: 2 }}
                >
                  Criar evento
                </Button>
              )}
            </Box>
          ) : (
            <List>
              {eventoSelecionado?.eventos?.map((evento) => (
                <ListItem key={evento.id} sx={{ px: 0, py: 1 }}>
                  <ListItemIcon>
                    <Box 
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: tiposEventos[evento.tipo]?.cor || '#039BE5'
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={evento.titulo}
                    secondary={evento.descricao}
                    onClick={() => {
                      setDrawerOpen(false);
                      visualizarEvento(evento);
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </SwipeableDrawer>

      {/* Modais existentes (mantidos iguais) */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EventIcon color="primary" />
            {eventoEditando ? 'Editar evento' : 'Novo evento'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField 
              fullWidth 
              label="Título" 
              value={formData.titulo} 
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} 
              required 
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField 
                fullWidth 
                label="Data de início" 
                type="date" 
                value={formData.dataInicio} 
                onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })} 
                InputLabelProps={{ shrink: true }} 
                required 
              />
              <TextField 
                fullWidth 
                label="Data de término" 
                type="date" 
                value={formData.dataFim} 
                onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })} 
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: formData.dataInicio }}
              />
            </Box>
            <TextField 
              fullWidth 
              label="Descrição" 
              multiline 
              rows={3} 
              value={formData.descricao} 
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} 
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} label="Tipo">
                  {Object.entries(tiposEventos).map(([key, tipo]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: tipo.cor }} />
                        {tipo.nome}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select value={formData.prioridade} onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })} label="Prioridade">
                  {Object.entries(prioridades).map(([key, prioridade]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: prioridade.cor }} />
                        {prioridade.nome}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={salvarEvento} variant="contained">
            {eventoEditando ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de visualização (simplificado para mobile) */}
      <Dialog 
        open={modalVisualizarOpen}
        onClose={() => setModalVisualizarOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmallMobile}
      >
        {eventoSelecionado && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    backgroundColor: tiposEventos[eventoSelecionado.tipo]?.cor || '#039BE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <EventIcon sx={{ color: 'white' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {eventoSelecionado.titulo}
                  </Typography>
                  <Chip 
                    label={tiposEventos[eventoSelecionado.tipo]?.nome || 'Evento'}
                    size="small"
                    sx={{ 
                      backgroundColor: tiposEventos[eventoSelecionado.tipo]?.cor || '#039BE5',
                      color: 'white'
                    }}
                  />
                </Box>
                {isSmallMobile && (
                  <IconButton onClick={() => setModalVisualizarOpen(false)}>
                    <CloseIcon />
                  </IconButton>
                )}
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Data
                  </Typography>
                  <Typography variant="body1">
                    {new Date(eventoSelecionado.dataInicio).toLocaleDateString('pt-BR', { 
                      day: '2-digit', month: 'long', year: 'numeric' 
                    })}
                    {eventoSelecionado.dataFim && eventoSelecionado.dataFim !== eventoSelecionado.dataInicio && 
                      ` até ${new Date(eventoSelecionado.dataFim).toLocaleDateString('pt-BR', { 
                        day: '2-digit', month: 'long', year: 'numeric' 
                      })}`
                    }
                  </Typography>
                </Box>
                
                {eventoSelecionado.descricao && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Descrição
                    </Typography>
                    <Typography variant="body1">
                      {eventoSelecionado.descricao}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            
            {!isSmallMobile && (
              <DialogActions>
                <Button onClick={() => setModalVisualizarOpen(false)}>
                  Fechar
                </Button>
                {(userRole === 'professora' || userRole === 'coordenadora') && (
                  <Button 
                    onClick={() => {
                      setModalVisualizarOpen(false);
                      editarEvento(eventoSelecionado);
                    }}
                    variant="outlined"
                  >
                    Editar
                  </Button>
                )}
              </DialogActions>
            )}
          </>
        )}
      </Dialog>

      {/* Dialog de mensagens */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {dialogMessage.title}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogMessage.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarioAcademicoSection;