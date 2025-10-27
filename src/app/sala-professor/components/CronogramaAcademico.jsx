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
  Menu
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { auditService } from '../../../services/auditService';
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';

const CronogramaAcademico = () => {
  const { getData, pushData, updateData, removeData, isReady } = useSchoolDatabase();
  const { user } = useAuthUser();
  
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState({});
  const [turmas, setTurmas] = useState({});
  const [mesAtual, setMesAtual] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  
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

  const salvarEvento = async () => {
    if (!formData.titulo || !formData.dataInicio) {
      alert('Preencha o título e a data de início');
      return;
    }
    try {
      const eventoData = { ...formData, criadoPor: user?.uid, criadoEm: new Date().toISOString() };
      if (eventoEditando) {
        await updateData(`cronograma-academico/${eventoEditando.id}`, eventoData);
        await auditService.log({ acao: 'editar_evento_cronograma', detalhes: `Evento editado: ${formData.titulo}`, usuarioEmail: user?.email });
      } else {
        await pushData('cronograma-academico', eventoData);
        await auditService.log({ acao: 'criar_evento_cronograma', detalhes: `Novo evento: ${formData.titulo}`, usuarioEmail: user?.email });
      }
      setModalOpen(false);
      carregarDados();
    } catch (error) {
      alert('Erro ao salvar evento');
    }
  };

  const excluirEvento = async () => {
    if (!eventoSelecionado || !confirm(`Deseja excluir "${eventoSelecionado.titulo}"?`)) return;
    try {
      await removeData(`cronograma-academico/${eventoSelecionado.id}`);
      await auditService.log({ acao: 'excluir_evento_cronograma', detalhes: `Evento excluído: ${eventoSelecionado.titulo}`, usuarioEmail: user?.email });
      setAnchorEl(null);
      setEventoSelecionado(null);
      carregarDados();
    } catch (error) {
      alert('Erro ao excluir evento');
    }
  };

  const isHoje = (data) => {
    const hoje = new Date();
    return data.getDate() === hoje.getDate() && data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 500 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="outlined" startIcon={<TodayIcon />} onClick={irParaHoje} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}>Hoje</Button>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton onClick={() => navegarMes(-1)}><ChevronLeft /></IconButton>
              <IconButton onClick={() => navegarMes(1)}><ChevronRight /></IconButton>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 500, minWidth: 220, textTransform: 'capitalize' }}>
              {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrirModalNovoEvento()} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, px: 3 }}>Criar evento</Button>
        </Box>
      </Paper>

      <Card sx={{ flex: 1, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1, pb: 1.5, borderBottom: '2px solid', borderColor: 'divider' }}>
            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(dia => (
              <Typography key={dia} variant="overline" sx={{ textAlign: 'center', fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>{dia}</Typography>
            ))}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: 1, flex: 1, minHeight: 0 }}>
            {getDiasDoMes().map((dia, index) => {
              if (!dia) return <Box key={`empty-${index}`} sx={{ minHeight: 100 }} />;
              const eventosNoDia = getEventosNoDia(dia);
              const ehHoje = isHoje(dia);
              return (
                <Paper key={dia.toISOString()} onClick={() => abrirModalNovoEvento(dia)} elevation={0} sx={{ minHeight: 100, p: 1, cursor: 'pointer', border: '1px solid', borderColor: ehHoje ? 'primary.main' : 'divider', borderWidth: ehHoje ? 2 : 1, borderRadius: 1, transition: 'all 0.2s', '&:hover': { backgroundColor: 'grey.50', boxShadow: 1 } }}>
                  <Box sx={{ mb: 0.5 }}>
                    <Box sx={{ width: ehHoje ? 32 : 'auto', height: ehHoje ? 32 : 'auto', borderRadius: '50%', backgroundColor: ehHoje ? 'primary.main' : 'transparent', color: ehHoje ? 'white' : 'text.primary', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: ehHoje ? 600 : 500, fontSize: '0.875rem', px: ehHoje ? 0 : 0.5 }}>{dia.getDate()}</Box>
                  </Box>
                  <Stack spacing={0.4}>
                    {eventosNoDia.slice(0, 3).map(evento => (
                      <Tooltip key={evento.id} title={<Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{evento.titulo}</Typography>{evento.descricao && <Typography variant="caption">{evento.descricao}</Typography>}</Box>} arrow>
                        <Box onClick={(e) => { e.stopPropagation(); setEventoSelecionado(evento); setAnchorEl(e.currentTarget); }} sx={{ backgroundColor: tiposEventos[evento.tipo]?.cor || '#039BE5', color: 'white', px: 0.8, py: 0.3, borderRadius: 1, fontSize: '0.7rem', fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer', '&:hover': { opacity: 0.9 } }}>{evento.titulo}</Box>
                      </Tooltip>
                    ))}
                    {eventosNoDia.length > 3 && <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.7rem', pl: 0.5 }}>+{eventosNoDia.length - 3} mais</Typography>}
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        </Box>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { borderRadius: 2, minWidth: 160 } }}>
        <MenuItem onClick={() => editarEvento(eventoSelecionado)} sx={{ gap: 1.5, py: 1.5 }}><EditIcon fontSize="small" /><Typography variant="body2">Editar</Typography></MenuItem>
        <MenuItem onClick={excluirEvento} sx={{ gap: 1.5, py: 1.5, color: 'error.main' }}><DeleteIcon fontSize="small" /><Typography variant="body2">Excluir</Typography></MenuItem>
      </Menu>

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
              <TextField fullWidth label="Data de término" type="date" value={formData.dataFim} onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })} InputLabelProps={{ shrink: true }} helperText="Opcional" />
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
    </Box>
  );
};

export default CronogramaAcademico;
