"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Chip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemButton
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
  School as SchoolIcon
} from '@mui/icons-material';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { auditService } from '../../../services/auditService';
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';
import { isCoordinator } from '../../../config/constants';

// Configuração do localizador para pt-BR
const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

const CronogramaAcademico = () => {
  const { getData, pushData, updateData, removeData, isReady } = useSchoolDatabase();
  const { user, userRole } = useAuthUser();
  const searchParams = useSearchParams();
  const isCoordenador = isCoordinator(userRole);
  
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState({});
  const [turmas, setTurmas] = useState({});
  const [eventosCalendario, setEventosCalendario] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVisualizarOpen, setModalVisualizarOpen] = useState(false);
  const [modalAprovarOpen, setModalAprovarOpen] = useState(false);
  const [modalListaPendentesOpen, setModalListaPendentesOpen] = useState(false);
  const [acaoAprovacao, setAcaoAprovacao] = useState('aprovar'); // 'aprovar' ou 'rejeitar'
  const [eventoEditando, setEventoEditando] = useState(null);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({ title: '', message: '', type: 'error' });
  const [observacaoAprovacao, setObservacaoAprovacao] = useState('');
  
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

  // Converter eventos do Firebase para formato do react-big-calendar
  useEffect(() => {
    console.log('🔄 [CronogramaAcademico] Filtrando eventos...');
    console.log('👤 User:', user?.uid);
    console.log('👔 UserRole:', userRole);
    console.log('⭐ isCoordenador:', isCoordenador);
    console.log('📅 Total de eventos:', Object.keys(eventos).length);
    
    if (eventos) {
      const eventosFormatados = Object.entries(eventos)
        .filter(([id, evento]) => {
          console.log(`📋 Evento: ${evento.titulo} - Status: ${evento.status} - CriadoPor: ${evento.criadoPor}`);
          // Coordenadores veem todos os eventos
          if (isCoordenador) {
            console.log('✅ Coordenador vê todos');
            return true;
          }
          // Professores só veem eventos aprovados ou criados por eles
          const deveExibir = evento.status === 'aprovado' || evento.criadoPor === user?.uid;
          console.log(`${deveExibir ? '✅' : '❌'} Professor vê: ${deveExibir}`);
          return deveExibir;
        })
        .map(([id, evento]) => {
          const start = evento.dataInicio?.includes('T') 
            ? new Date(evento.dataInicio) 
            : new Date(evento.dataInicio + 'T00:00:00');
          
          const end = evento.dataFim && evento.dataFim !== evento.dataInicio
            ? (evento.dataFim?.includes('T') 
                ? new Date(evento.dataFim) 
                : new Date(evento.dataFim + 'T23:59:59'))
            : new Date(start.getTime() + (23 * 60 * 60 * 1000 + 59 * 60 * 1000));
          
          return {
            id,
            title: evento.titulo + (evento.status === 'pendente' ? ' 🕐' : ''),
            start,
            end,
            allDay: true,
            resource: evento
          };
        });
      console.log('📊 Eventos após filtragem:', eventosFormatados.length);
      setEventosCalendario(eventosFormatados);
    }
  }, [eventos, isCoordenador, user, userRole]);

  // Verificar se há parâmetro de evento na URL para abrir modal de aprovação
  useEffect(() => {
    const eventoId = searchParams.get('evento');
    
    if (eventoId && eventos[eventoId] && isCoordenador) {
      console.log('🔔 [CronogramaAcademico] Parâmetro de evento detectado:', eventoId);
      const evento = eventos[eventoId];
      console.log('📋 [CronogramaAcademico] Evento:', evento);
      console.log('⚠️ [CronogramaAcademico] Status do evento:', evento.status);
      
      // Se o evento está pendente, abrir modal de visualização
      if (evento.status === 'pendente') {
        console.log('✅ [CronogramaAcademico] Abrindo modal de visualização');
        setEventoSelecionado({
          id: eventoId,
          ...evento
        });
        setModalVisualizarOpen(true);
      }
    }
  }, [searchParams, eventos, isCoordenador]);

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

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleSelectSlot = ({ start }) => {
    abrirModalNovoEvento(start);
  };

  const handleSelectEvent = (event) => {
    const eventoCompleto = { id: event.id, ...event.resource };
    setEventoSelecionado(eventoCompleto);
    visualizarEvento(eventoCompleto);
  };

  const abrirModalNovoEvento = (data = null) => {
    setEventoEditando(null);
    const dataFormatada = data ? format(data, 'yyyy-MM-dd') : '';
    setFormData({
      titulo: '',
      descricao: '',
      dataInicio: dataFormatada,
      dataFim: '',
      tipo: 'aula',
      prioridade: 'media',
      turmaId: ''
    });
    setModalOpen(true);
  };

  const editarEvento = (evento) => {
    // Validação de permissão
    const podeEditar = isCoordenador || 
                      (evento.status === 'pendente' && evento.criadoPor === user?.uid);
    
    if (!podeEditar) {
      setDialogMessage({
        title: 'Sem permissão',
        message: 'Você não tem permissão para editar este evento. Apenas eventos pendentes criados por você podem ser editados.',
        type: 'error'
      });
      setDialogOpen(true);
      return;
    }
    
    // Coordenadores não podem editar eventos rejeitados
    if (evento.status === 'rejeitado' && !isCoordenador) {
      setDialogMessage({
        title: 'Evento rejeitado',
        message: 'Eventos rejeitados não podem ser editados. Entre em contato com a coordenação.',
        type: 'error'
      });
      setDialogOpen(true);
      return;
    }
    
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
    setModalVisualizarOpen(false);
  };

  const visualizarEvento = (evento) => {
    console.log('📋 Visualizando evento:', evento);
    console.log('👤 User:', user?.uid);
    console.log('👔 UserRole:', userRole);
    console.log('⭐ isCoordenador:', isCoordenador);
    console.log('📊 Status do evento:', evento.status);
    setEventoSelecionado(evento);
    setModalVisualizarOpen(true);
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
        criadoPorNome: user?.displayName || user?.email,
        criadoEm: new Date().toISOString(),
        status: isCoordenador ? 'aprovado' : 'pendente',
        aprovadoPor: isCoordenador ? user?.uid : null,
        aprovadoEm: isCoordenador ? new Date().toISOString() : null
      };
      
      if (eventoEditando) {
        await updateData(`cronograma-academico/${eventoEditando.id}`, {
          ...eventoData,
          status: eventoEditando.status,
          aprovadoPor: eventoEditando.aprovadoPor,
          aprovadoEm: eventoEditando.aprovadoEm
        });
      } else {
        await pushData('cronograma-academico', eventoData);
      }
      
      try {
        if (eventoEditando) {
          await auditService.log({ acao: 'editar_evento_cronograma', detalhes: `Evento editado: ${formData.titulo}`, usuarioEmail: user?.email });
        } else {
          await auditService.log({ acao: 'criar_evento_cronograma', detalhes: `Novo evento: ${formData.titulo} (${eventoData.status})`, usuarioEmail: user?.email });
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
      
      const mensagemSucesso = isCoordenador 
        ? (eventoEditando ? 'Evento atualizado com sucesso!' : 'Evento criado e aprovado com sucesso!')
        : (eventoEditando ? 'Evento atualizado com sucesso!' : 'Evento criado! Aguardando aprovação da coordenação.');
      
      setDialogMessage({
        title: 'Sucesso!',
        message: mensagemSucesso,
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
    
    // Validação de permissão
    const podeExcluir = isCoordenador || 
                       (eventoSelecionado.status === 'pendente' && eventoSelecionado.criadoPor === user?.uid);
    
    if (!podeExcluir) {
      setDialogMessage({
        title: 'Sem permissão',
        message: 'Você não tem permissão para excluir este evento. Apenas eventos pendentes criados por você podem ser excluídos.',
        type: 'error'
      });
      setDialogOpen(true);
      return;
    }
    
    const confirmacao = window.confirm(`Deseja excluir "${eventoSelecionado.titulo}"?`);
    if (!confirmacao) return;
    
    try {
      await removeData(`cronograma-academico/${eventoSelecionado.id}`);
      
      try {
        await auditService.log({ 
          acao: 'excluir_evento_cronograma', 
          detalhes: `Evento excluído: ${eventoSelecionado.titulo} (Status: ${eventoSelecionado.status})`, 
          usuarioEmail: user?.email 
        });
      } catch (auditError) {
        console.warn('Erro ao registrar auditoria:', auditError);
      }
      
      setEventoSelecionado(null);
      setModalVisualizarOpen(false);
      
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

  const aprovarEvento = async () => {
    if (!eventoSelecionado) return;
    
    try {
      await updateData(`cronograma-academico/${eventoSelecionado.id}`, {
        status: 'aprovado',
        aprovadoPor: user?.uid,
        aprovadoPorNome: user?.displayName || user?.email,
        aprovadoEm: new Date().toISOString(),
        observacaoAprovacao: observacaoAprovacao || null
      });
      
      try {
        await auditService.log({ 
          acao: 'aprovar_evento_cronograma', 
          detalhes: `Evento aprovado: ${eventoSelecionado.titulo}`, 
          usuarioEmail: user?.email 
        });
      } catch (auditError) {
        console.warn('Erro ao registrar auditoria:', auditError);
      }
      
      setModalAprovarOpen(false);
      setModalVisualizarOpen(false);
      setEventoSelecionado(null);
      setObservacaoAprovacao('');
      
      carregarDados();
      
      setDialogMessage({
        title: 'Sucesso!',
        message: 'Evento aprovado com sucesso!',
        type: 'success'
      });
      setDialogOpen(true);
      
    } catch (error) {
      console.error('Erro ao aprovar evento:', error);
      setDialogMessage({
        title: 'Erro',
        message: 'Ocorreu um erro ao aprovar o evento. Tente novamente.',
        type: 'error'
      });
      setDialogOpen(true);
    }
  };

  const rejeitarEvento = async () => {
    if (!eventoSelecionado) return;
    
    if (!observacaoAprovacao.trim()) {
      setDialogMessage({
        title: 'Observação obrigatória',
        message: 'Por favor, informe o motivo da rejeição.',
        type: 'error'
      });
      setDialogOpen(true);
      return;
    }
    
    try {
      await updateData(`cronograma-academico/${eventoSelecionado.id}`, {
        status: 'rejeitado',
        rejeitadoPor: user?.uid,
        rejeitadoPorNome: user?.displayName || user?.email,
        rejeitadoEm: new Date().toISOString(),
        motivoRejeicao: observacaoAprovacao
      });
      
      try {
        await auditService.log({ 
          acao: 'rejeitar_evento_cronograma', 
          detalhes: `Evento rejeitado: ${eventoSelecionado.titulo}. Motivo: ${observacaoAprovacao}`, 
          usuarioEmail: user?.email 
        });
      } catch (auditError) {
        console.warn('Erro ao registrar auditoria:', auditError);
      }
      
      setModalAprovarOpen(false);
      setModalVisualizarOpen(false);
      setEventoSelecionado(null);
      setObservacaoAprovacao('');
      
      carregarDados();
      
      setDialogMessage({
        title: 'Evento rejeitado',
        message: 'O evento foi rejeitado. O professor será notificado.',
        type: 'success'
      });
      setDialogOpen(true);
      
    } catch (error) {
      console.error('Erro ao rejeitar evento:', error);
      setDialogMessage({
        title: 'Erro',
        message: 'Ocorreu um erro ao rejeitar o evento. Tente novamente.',
        type: 'error'
      });
      setDialogOpen(true);
    }
  };

  // Customização do estilo dos eventos
  const eventStyleGetter = (event) => {
    const tipo = event.resource?.tipo || 'aula';
    const status = event.resource?.status || 'aprovado';
    let cor = tiposEventos[tipo]?.cor || '#039BE5';
    
    // Eventos pendentes ficam com opacidade reduzida
    const opacity = status === 'pendente' ? 0.6 : 0.9;
    
    // Eventos rejeitados ficam em cinza com texto tachado
    if (status === 'rejeitado') {
      cor = '#9e9e9e';
    }
    
    return {
      style: {
        backgroundColor: cor,
        borderRadius: '4px',
        opacity: opacity,
        color: 'white',
        border: status === 'pendente' ? '2px dashed rgba(255,255,255,0.5)' : '0px',
        display: 'block',
        fontWeight: 500,
        fontSize: '0.85rem',
        textDecoration: status === 'rejeitado' ? 'line-through' : 'none'
      }
    };
  };

  // Mensagens customizadas em português
  const messages = {
    allDay: 'Dia inteiro',
    previous: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Não há eventos neste período.',
    showMore: (total) => `+ (${total}) eventos`
  };

  const isHoje = (data) => {
    const hoje = new Date();
    return data.getDate() === hoje.getDate() && data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 500 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Toolbar customizada */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<TodayIcon />} 
              onClick={() => setCurrentDate(new Date())} 
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
            >
              Hoje
            </Button>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft />
              </IconButton>
              <IconButton onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight />
              </IconButton>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 500, minWidth: 220, textTransform: 'capitalize' }}>
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {isCoordenador && Object.values(eventos).filter(e => e.status === 'pendente').length > 0 && (
              <Button 
                variant="outlined"
                color="warning"
                startIcon={<Badge badgeContent={Object.values(eventos).filter(e => e.status === 'pendente').length} color="error">⏳</Badge>}
                onClick={() => setModalListaPendentesOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 3 }}
              >
                Eventos Pendentes
              </Button>
            )}
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => abrirModalNovoEvento()} 
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 3 }}
            >
              Criar evento
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Legenda de tipos de eventos */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mr: 1 }}>
            Tipos de eventos:
          </Typography>
          {Object.entries(tiposEventos).map(([key, tipo]) => (
            <Chip
              key={key}
              label={tipo.nome}
              size="small"
              sx={{
                backgroundColor: tipo.cor,
                color: 'white',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Alerta de eventos pendentes para coordenadores */}
      {isCoordenador && Object.values(eventos).filter(e => e.status === 'pendente').length > 0 && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            borderRadius: 2, 
            border: '2px solid', 
            borderColor: '#F59E0B',
            backgroundColor: '#FFF3E0'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              backgroundColor: '#F59E0B', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              ⏳
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#E65100' }}>
                {Object.values(eventos).filter(e => e.status === 'pendente').length} evento(s) aguardando aprovação
              </Typography>
              <Typography variant="body2" sx={{ color: '#F57C00' }}>
                Clique nos eventos com ícone 🕐 para aprovar ou rejeitar
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Alerta informativo para professoras */}
      {!isCoordenador && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            borderRadius: 2, 
            border: '1px solid', 
            borderColor: '#3B82F6',
            backgroundColor: '#EFF6FF'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              backgroundColor: '#3B82F6', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: 'white'
            }}>
              ℹ️
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#1E40AF' }}>
                Eventos criados por você precisam ser aprovados pela coordenação antes de aparecerem no calendário público.
                Eventos com 🕐 estão aguardando aprovação.
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Calendário */}
      <Card sx={{ flex: 1, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: 2, height: 700 }}>
          <Calendar
            localizer={localizer}
            events={eventosCalendario}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            popup
            messages={messages}
            culture="pt-BR"
            eventPropGetter={eventStyleGetter}
            date={currentDate}
            onNavigate={handleNavigate}
            views={['month']}
            defaultView="month"
            components={{
              toolbar: () => null
            }}
          />
        </Box>
      </Card>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <EventIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{eventoEditando ? 'Editar evento' : 'Novo evento'}</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField fullWidth label="Adicionar título" placeholder="Ex: Reunião de Pais..." value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} required autoFocus />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField fullWidth label="Data de início" type="date" value={formData.dataInicio} onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })} InputLabelProps={{ shrink: true }} required />
              <TextField 
                fullWidth 
                label="Data de término" 
                type="date" 
                value={formData.dataFim} 
                onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })} 
                InputLabelProps={{ shrink: true }} 
                helperText="Opcional (deixe em branco se for apenas 1 dia)"
                inputProps={{
                  min: formData.dataInicio // Define a data mínima como a data de início
                }}
              />
            </Box>
            <TextField fullWidth label="Adicionar descrição" placeholder="Detalhes..." multiline rows={3} value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
            <Divider />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} label="Tipo">
                  {Object.entries(tiposEventos).map(([key, tipo]) => (
                    <MenuItem key={key} value={key}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: tipo.cor }} />{tipo.nome}</Box></MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select value={formData.prioridade} onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })} label="Prioridade">
                  {Object.entries(prioridades).map(([key, prioridade]) => (
                    <MenuItem key={key} value={key}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: prioridade.cor }} />{prioridade.nome}</Box></MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <FormControl fullWidth>
              <InputLabel>Turma</InputLabel>
              <Select value={formData.turmaId} onChange={(e) => setFormData({ ...formData, turmaId: e.target.value })} label="Turma">
                <MenuItem value=""><em>Todas as turmas</em></MenuItem>
                {Object.entries(turmas).map(([id, turma]) => (<MenuItem key={id} value={id}>{turma.nome}</MenuItem>))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider', gap: 1.5 }}>
          <Button onClick={() => setModalOpen(false)} variant="text" sx={{ textTransform: 'none', fontWeight: 500 }}>Cancelar</Button>
          <Button onClick={salvarEvento} variant="contained" sx={{ textTransform: 'none', fontWeight: 500, px: 3 }}>{eventoEditando ? 'Salvar alterações' : 'Criar evento'}</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Visualização - Elegante */}
      <Dialog 
        open={modalVisualizarOpen}
        onClose={() => setModalVisualizarOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, overflow: 'hidden' }
        }}
      >
        {eventoSelecionado && (
          <>
            {/* Header com cor do tipo de evento */}
            <Box 
              sx={{ 
                height: 8,
                backgroundColor: tiposEventos[eventoSelecionado.tipo]?.cor || '#039BE5'
              }} 
            />
            
            <DialogTitle sx={{ 
              pb: 2,
              pt: 3,
              px: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    backgroundColor: tiposEventos[eventoSelecionado.tipo]?.cor || '#039BE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <EventIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {eventoSelecionado.titulo}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Box 
                      sx={{ 
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: tiposEventos[eventoSelecionado.tipo]?.cor || '#039BE5',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      {tiposEventos[eventoSelecionado.tipo]?.nome || 'Evento'}
                    </Box>
                    <Box 
                      sx={{ 
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: prioridades[eventoSelecionado.prioridade]?.cor || '#F09300',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      {prioridades[eventoSelecionado.prioridade]?.nome || 'Prioridade'}
                    </Box>
                    {eventoSelecionado.status === 'pendente' && (
                      <Chip
                        label="⏳ Aguardando Aprovação"
                        size="small"
                        sx={{
                          backgroundColor: '#FFF3E0',
                          color: '#E65100',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    )}
                    {eventoSelecionado.status === 'rejeitado' && (
                      <Chip
                        label="❌ Rejeitado"
                        size="small"
                        sx={{
                          backgroundColor: '#FFEBEE',
                          color: '#C62828',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    )}
                    {eventoSelecionado.status === 'aprovado' && (
                      <Chip
                        label="✓ Aprovado"
                        size="small"
                        sx={{
                          backgroundColor: '#E8F5E9',
                          color: '#2E7D32',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ px: 3, pb: 3 }}>
              <Stack spacing={3}>
                {/* Data */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <CalendarMonthIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Data
                    </Typography>
                  </Box>
                  <Box sx={{ pl: 4.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {(() => {
                        const dataInicio = eventoSelecionado.dataInicio?.includes('T') 
                          ? new Date(eventoSelecionado.dataInicio) 
                          : new Date(eventoSelecionado.dataInicio + 'T00:00:00');
                        return format(dataInicio, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                      })()}
                      {eventoSelecionado.dataFim && eventoSelecionado.dataFim !== eventoSelecionado.dataInicio && (
                        <>
                          {' até '}
                          {(() => {
                            const dataFim = eventoSelecionado.dataFim?.includes('T') 
                              ? new Date(eventoSelecionado.dataFim) 
                              : new Date(eventoSelecionado.dataFim + 'T00:00:00');
                            return format(dataFim, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                          })()}
                        </>
                      )}
                    </Typography>
                  </Box>
                </Box>

                {/* Descrição */}
                {eventoSelecionado.descricao && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <AccessTimeIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        Descrição
                      </Typography>
                    </Box>
                    <Box sx={{ pl: 4.5 }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {eventoSelecionado.descricao}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Turma */}
                {eventoSelecionado.turmaId && turmas[eventoSelecionado.turmaId] && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <SchoolIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        Turma
                      </Typography>
                    </Box>
                    <Box sx={{ pl: 4.5 }}>
                      <Box 
                        sx={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          backgroundColor: 'primary.50',
                          border: '1px solid',
                          borderColor: 'primary.200'
                        }}
                      >
                        <SchoolIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                          {turmas[eventoSelecionado.turmaId].nome}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Informações de aprovação/rejeição */}
                {eventoSelecionado.status === 'aprovado' && eventoSelecionado.aprovadoPorNome && (
                  <Box sx={{ backgroundColor: '#E8F5E9', p: 2, borderRadius: 2, border: '1px solid #81C784' }}>
                    <Typography variant="caption" sx={{ color: '#2E7D32', display: 'block', mb: 0.5, fontWeight: 600 }}>
                      ✓ Aprovado por
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1B5E20' }}>
                      {eventoSelecionado.aprovadoPorNome}
                    </Typography>
                    {eventoSelecionado.aprovadoEm && (
                      <Typography variant="caption" sx={{ color: '#2E7D32', display: 'block', mt: 0.5 }}>
                        {format(new Date(eventoSelecionado.aprovadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </Typography>
                    )}
                    {eventoSelecionado.observacaoAprovacao && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#1B5E20' }}>
                        "{eventoSelecionado.observacaoAprovacao}"
                      </Typography>
                    )}
                  </Box>
                )}

                {eventoSelecionado.status === 'rejeitado' && eventoSelecionado.rejeitadoPorNome && (
                  <Box sx={{ backgroundColor: '#FFEBEE', p: 2, borderRadius: 2, border: '1px solid #E57373' }}>
                    <Typography variant="caption" sx={{ color: '#C62828', display: 'block', mb: 0.5, fontWeight: 600 }}>
                      ❌ Rejeitado por
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#B71C1C' }}>
                      {eventoSelecionado.rejeitadoPorNome}
                    </Typography>
                    {eventoSelecionado.rejeitadoEm && (
                      <Typography variant="caption" sx={{ color: '#C62828', display: 'block', mt: 0.5 }}>
                        {format(new Date(eventoSelecionado.rejeitadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </Typography>
                    )}
                    {eventoSelecionado.motivoRejeicao && (
                      <>
                        <Typography variant="caption" sx={{ color: '#C62828', display: 'block', mt: 1, fontWeight: 600 }}>
                          Motivo:
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#B71C1C' }}>
                          "{eventoSelecionado.motivoRejeicao}"
                        </Typography>
                      </>
                    )}
                  </Box>
                )}

                {/* Alerta informativo para professores sobre eventos aprovados/rejeitados */}
                {!isCoordenador && eventoSelecionado.status === 'aprovado' && (
                  <Box sx={{ backgroundColor: '#E3F2FD', p: 2, borderRadius: 2, border: '1px solid #90CAF9' }}>
                    <Typography variant="body2" sx={{ color: '#1565C0', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>ℹ️</span>
                      <span><strong>Evento aprovado:</strong> Não pode ser editado ou excluído por professores. Entre em contato com a coordenação se necessário.</span>
                    </Typography>
                  </Box>
                )}

                {!isCoordenador && eventoSelecionado.status === 'rejeitado' && (
                  <Box sx={{ backgroundColor: '#FFF3E0', p: 2, borderRadius: 2, border: '1px solid #FFB74D' }}>
                    <Typography variant="body2" sx={{ color: '#E65100', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>⚠️</span>
                      <span><strong>Evento rejeitado:</strong> Não pode ser editado ou excluído. Verifique o motivo da rejeição acima e crie um novo evento se necessário.</span>
                    </Typography>
                  </Box>
                )}

                <Divider />

                {/* Informações adicionais */}
                <Box sx={{ backgroundColor: 'grey.50', p: 2, borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Criado em
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {eventoSelecionado.criadoEm ? 
                      format(new Date(eventoSelecionado.criadoEm), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
                      : 'Data não disponível'}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            
            <DialogActions sx={{ 
              px: 3,
              py: 2.5,
              backgroundColor: 'grey.50',
              gap: 1.5,
              flexWrap: 'wrap'
            }}>
              {/* Botão Excluir - Regras:
                  - Coordenador: pode excluir qualquer evento
                  - Professor: pode excluir APENAS eventos pendentes que criou
              */}
              {(isCoordenador || 
                (eventoSelecionado.status === 'pendente' && eventoSelecionado.criadoPor === user?.uid)
              ) && (
                <Button 
                  onClick={excluirEvento}
                  variant="text"
                  color="error"
                  startIcon={<DeleteIcon />}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 500,
                    mr: 'auto'
                  }}
                >
                  Excluir
                </Button>
              )}

              {/* Botões de aprovação para coordenadores */}
              {isCoordenador && eventoSelecionado.status === 'pendente' && (
                <>
                  <Button 
                    onClick={() => {
                      setAcaoAprovacao('aprovar');
                      setModalVisualizarOpen(false);
                      setModalAprovarOpen(true);
                    }}
                    variant="contained"
                    color="success"
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    ✓ Aprovar
                  </Button>
                  <Button 
                    onClick={() => {
                      setAcaoAprovacao('rejeitar');
                      setModalVisualizarOpen(false);
                      setModalAprovarOpen(true);
                    }}
                    variant="outlined"
                    color="error"
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    ✕ Rejeitar
                  </Button>
                </>
              )}

              <Button 
                onClick={() => setModalVisualizarOpen(false)}
                variant="text"
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 500,
                  color: 'text.secondary'
                }}
              >
                Fechar
              </Button>

              {/* Botão Editar - Regras:
                  - Coordenador: pode editar qualquer evento (exceto rejeitados)
                  - Professor: pode editar APENAS eventos pendentes que criou
              */}
              {eventoSelecionado.status !== 'rejeitado' && 
               (isCoordenador || 
                (eventoSelecionado.status === 'pendente' && eventoSelecionado.criadoPor === user?.uid)
               ) && (
                <Button 
                  onClick={() => {
                    setModalVisualizarOpen(false);
                    editarEvento(eventoSelecionado);
                  }}
                  variant="outlined"
                  startIcon={<EditIcon />}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Editar evento
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal de Lista de Eventos Pendentes */}
      <Dialog
        open={modalListaPendentesOpen}
        onClose={() => setModalListaPendentesOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: '#FFF3E0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%', 
              backgroundColor: '#F59E0B', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              ⏳
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#E65100' }}>
                Eventos Aguardando Aprovação
              </Typography>
              <Typography variant="body2" sx={{ color: '#F57C00' }}>
                {Object.values(eventos).filter(e => e.status === 'pendente').length} evento(s) pendente(s)
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <List sx={{ py: 0 }}>
            {Object.entries(eventos)
              .filter(([id, evento]) => evento.status === 'pendente')
              .map(([id, evento], index, array) => (
                <React.Fragment key={id}>
                  <ListItem
                    sx={{
                      py: 2,
                      px: 3,
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      }
                    }}
                  >
                    <ListItemButton
                      onClick={() => {
                        setEventoSelecionado({ id, ...evento });
                        setModalListaPendentesOpen(false);
                        visualizarEvento({ id, ...evento });
                      }}
                      sx={{ 
                        borderRadius: 2,
                        display: 'flex',
                        gap: 2,
                        alignItems: 'flex-start'
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          backgroundColor: tiposEventos[evento.tipo]?.cor || '#039BE5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <EventIcon sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {evento.titulo}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={tiposEventos[evento.tipo]?.nome}
                            size="small"
                            sx={{
                              backgroundColor: tiposEventos[evento.tipo]?.cor || '#039BE5',
                              color: 'white',
                              fontWeight: 500,
                              fontSize: '0.7rem'
                            }}
                          />
                          <Chip
                            label={format(new Date(evento.dataInicio + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          {evento.turmaId && turmas[evento.turmaId] && (
                            <Chip
                              label={turmas[evento.turmaId].nome}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                        
                        {evento.descricao && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'text.secondary',
                              mb: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {evento.descricao}
                          </Typography>
                        )}
                        
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Criado por: <strong>{evento.criadoPorNome}</strong> em {format(new Date(evento.criadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventoSelecionado({ id, ...evento });
                            setAcaoAprovacao('aprovar');
                            setModalListaPendentesOpen(false);
                            setModalAprovarOpen(true);
                          }}
                          sx={{ 
                            textTransform: 'none',
                            minWidth: 90
                          }}
                        >
                          ✓ Aprovar
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventoSelecionado({ id, ...evento });
                            setAcaoAprovacao('rejeitar');
                            setModalListaPendentesOpen(false);
                            setModalAprovarOpen(true);
                          }}
                          sx={{ 
                            textTransform: 'none',
                            minWidth: 90
                          }}
                        >
                          ✕ Rejeitar
                        </Button>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                  {index < array.length - 1 && <Divider />}
                </React.Fragment>
              ))}
          </List>
          
          {Object.values(eventos).filter(e => e.status === 'pendente').length === 0 && (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                🎉 Nenhum evento pendente
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Todos os eventos foram aprovados ou rejeitados
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          px: 3,
          py: 2.5,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            onClick={() => setModalListaPendentesOpen(false)}
            variant="contained"
            sx={{ 
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Aprovação/Rejeição */}
      <Dialog
        open={modalAprovarOpen}
        onClose={() => {
          setModalAprovarOpen(false);
          setObservacaoAprovacao('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: acaoAprovacao === 'aprovar' ? '#E8F5E9' : '#FFEBEE'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: acaoAprovacao === 'aprovar' ? '#2E7D32' : '#C62828' }}>
            {acaoAprovacao === 'aprovar' ? '✓ Aprovar Evento' : '✕ Rejeitar Evento'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {eventoSelecionado?.titulo}
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label={acaoAprovacao === 'rejeitar' ? 'Motivo da Rejeição (obrigatório)' : 'Observação (opcional)'}
              placeholder={acaoAprovacao === 'rejeitar' ? 'Informe o motivo da rejeição...' : 'Adicione comentários sobre este evento...'}
              value={observacaoAprovacao}
              onChange={(e) => setObservacaoAprovacao(e.target.value)}
              required={acaoAprovacao === 'rejeitar'}
              error={acaoAprovacao === 'rejeitar' && !observacaoAprovacao.trim()}
              helperText={acaoAprovacao === 'rejeitar' && !observacaoAprovacao.trim() ? 'O motivo da rejeição é obrigatório' : ''}
            />
            
            {eventoSelecionado && (
              <Box sx={{ backgroundColor: 'grey.50', p: 2, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Detalhes do Evento
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Tipo:</strong> {tiposEventos[eventoSelecionado.tipo]?.nome}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Data:</strong> {format(new Date(eventoSelecionado.dataInicio + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                </Typography>
                <Typography variant="body2">
                  <strong>Criado por:</strong> {eventoSelecionado.criadoPorNome}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ 
          px: 3,
          py: 2.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          gap: 1.5
        }}>
          <Button 
            onClick={() => {
              setModalAprovarOpen(false);
              setObservacaoAprovacao('');
              setModalVisualizarOpen(true);
            }}
            variant="text"
            sx={{ 
              textTransform: 'none',
              fontWeight: 500,
              color: 'text.secondary',
              mr: 'auto'
            }}
          >
            Voltar
          </Button>
          
          {acaoAprovacao === 'rejeitar' ? (
            <Button 
              onClick={rejeitarEvento}
              variant="contained"
              color="error"
              sx={{ 
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              ✕ Confirmar Rejeição
            </Button>
          ) : (
            <Button 
              onClick={aprovarEvento}
              variant="contained"
              color="success"
              sx={{ 
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              ✓ Confirmar Aprovação
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de Mensagens */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box 
            sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: dialogMessage.type === 'success' ? 'success.light' : 'error.light',
              color: dialogMessage.type === 'success' ? 'success.dark' : 'error.dark'
            }}
          >
            {dialogMessage.type === 'success' ? '✓' : '!'}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {dialogMessage.title}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1">
            {dialogMessage.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            variant="contained"
            fullWidth
            sx={{ 
              textTransform: 'none',
              fontWeight: 500,
              py: 1.2
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSS customizado para melhorar a aparência do calendário */}
      <style jsx global>{`
        .rbc-calendar {
          font-family: 'Roboto', sans-serif;
        }
        
        .rbc-header {
          padding: 12px 4px;
          font-weight: 600;
          font-size: 0.875rem;
          color: #666;
          text-transform: uppercase;
          border-bottom: 2px solid #e0e0e0 !important;
        }
        
        .rbc-month-view {
          border: none;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .rbc-month-row {
          border: none;
          min-height: 100px;
        }
        
        .rbc-day-bg {
          border: 1px solid #f0f0f0 !important;
        }
        
        .rbc-today {
          background-color: #f0f4ff !important;
        }
        
        .rbc-off-range-bg {
          background-color: #fafafa;
        }
        
        .rbc-date-cell {
          padding: 8px;
          text-align: right;
        }
        
        .rbc-now {
          font-weight: 700;
          color: #667eea;
        }
        
        .rbc-event {
          padding: 3px 6px;
          border-radius: 4px;
          border: none !important;
          cursor: pointer;
          margin: 1px 2px;
        }
        
        .rbc-event:hover {
          opacity: 1 !important;
        }
        
        .rbc-show-more {
          background-color: transparent;
          color: #667eea;
          font-weight: 500;
          font-size: 0.75rem;
          padding: 2px 4px;
          margin: 2px;
        }
        
        .rbc-overlay {
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          border: 1px solid #e0e0e0;
        }
        
        .rbc-overlay-header {
          padding: 12px;
          border-bottom: 2px solid #e0e0e0;
          font-weight: 600;
          background-color: #f5f5f5;
        }
      `}</style>
    </Box>
  );
};

export default CronogramaAcademico;
