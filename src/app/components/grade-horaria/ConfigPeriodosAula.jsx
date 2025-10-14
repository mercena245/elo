import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
;
import SeletorPeriodoLetivo from '../shared/SeletorPeriodoLetivo';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';

const ConfigPeriodosAula = () => {
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  const [periodosAula, setPeriodosAula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPeriodo, setEditPeriodo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filtroTurno, setFiltroTurno] = useState(''); // Filtro por turno
  const [periodoLetivoSelecionado, setPeriodoLetivoSelecionado] = useState(''); // Novo filtro por período letivo
  const [form, setForm] = useState({
    nome: '',
    inicio: '',
    fim: '',
    ordem: 1,
    tipo: 'aula', // 'aula' ou 'intervalo'
    turno: 'Manhã', // 'Manhã', 'Tarde', 'Contra-turno Manhã', 'Contra-turno Tarde'
    periodoLetivoId: '' // Novo campo para vincular ao período letivo
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (periodoLetivoSelecionado) {
      carregarPeriodos();
    }
  }, [periodoLetivoSelecionado]);

  const carregarPeriodos = async () => {
    setLoading(true);
    
    if (!periodoLetivoSelecionado) {
      setPeriodosAula([]);
      setLoading(false);
      return;
    }

    try {
      const snap = await get(ref(db, `Escola/PeriodosAula/${periodoLetivoSelecionado.id}`));
      if (snap.exists()) {
        const data = snap.val();
        const lista = Object.entries(data)
          .map(([id, periodo]) => ({ 
            id, 
            ...periodo,
            turno: periodo.turno || 'Manhã' // Default para compatibilidade com dados existentes
          }))
          .sort((a, b) => a.ordem - b.ordem);
        setPeriodosAula(lista);
      } else {
        setPeriodosAula([]);
      }
    } catch (err) {
      console.error('Erro ao carregar períodos:', err);
      setPeriodosAula([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSalvar = async () => {
    if (!form.nome.trim() || !form.inicio || !form.fim) {
      setMsg('Preencha todos os campos obrigatórios');
      return;
    }

    if (!periodoLetivoSelecionado || !periodoLetivoSelecionado.id) {
      setMsg('Selecione um período letivo válido');
      return;
    }

    setSaving(true);
    setMsg('');
    
    try {
      const periodoId = editPeriodo ? editPeriodo.id : `periodo_${Date.now()}`;
      
      await setData('Escola/PeriodosAula/${periodoLetivoSelecionado.id}/${periodoId}', {
        nome: form.nome,
        inicio: form.inicio,
        fim: form.fim,
        ordem: parseInt(form.ordem),
        tipo: form.tipo,
        turno: form.turno,
        periodoLetivoId: periodoLetivoSelecionado.id
      });
      
      setModalOpen(false);
      setEditPeriodo(null);
      setForm({ nome: '', inicio: '', fim: '', ordem: 1, tipo: 'aula', turno: 'Manhã', periodoLetivoId: '' });
      await carregarPeriodos();
      setMsg('Período salvo com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar período:', err);
      setMsg('Erro ao salvar período');
    }
    setSaving(false);
  };

  const handleEditar = (periodo) => {
    setEditPeriodo(periodo);
    setForm({
      nome: periodo.nome,
      inicio: periodo.inicio,
      fim: periodo.fim,
      ordem: periodo.ordem,
      tipo: periodo.tipo || 'aula',
      turno: periodo.turno || 'Manhã',
      periodoLetivoId: periodo.periodoLetivoId || periodoLetivoSelecionado?.id || ''
    });
    setModalOpen(true);
  };

  const handleExcluir = async (periodo) => {
    if (!window.confirm(`Confirma a exclusão do período "${periodo.nome}"?`)) return;
    
    if (!periodoLetivoSelecionado) {
      setMsg('Período letivo não selecionado');
      return;
    }
    
    try {
      await removeData('Escola/PeriodosAula/${periodoLetivoSelecionado.id}/${periodo.id}');
      await carregarPeriodos();
      setMsg('Período excluído com sucesso!');
    } catch (err) {
      setMsg('Erro ao excluir período');
    }
  };

  const handleNovo = () => {
    setEditPeriodo(null);
    setForm({ 
      nome: '', 
      inicio: '', 
      fim: '', 
      ordem: periodosAula.length + 1, 
      tipo: 'aula',
      turno: 'Manhã',
      periodoLetivoId: periodoLetivoSelecionado?.id || ''
    });
    setModalOpen(true);
  };

  const handleFecharModal = () => {
    setModalOpen(false);
    setEditPeriodo(null);
    setMsg('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="primary">
          Configuração dos Períodos de Aula
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleNovo}
          size="small"
          disabled={!periodoLetivoSelecionado}
        >
          Novo Período
        </Button>
      </Box>

      {/* Seletor de Período Letivo */}
      <Box sx={{ mb: 2 }}>
        <SeletorPeriodoLetivo
          value={periodoLetivoSelecionado}
          onChange={setPeriodoLetivoSelecionado}
          required
          label="Período Letivo"
        />
      </Box>

      {/* Filtro por turno */}
      <Box sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por turno</InputLabel>
          <Select
            value={filtroTurno}
            label="Filtrar por turno"
            onChange={(e) => setFiltroTurno(e.target.value)}
            size="small"
          >
            <MenuItem value="">Todos os turnos</MenuItem>
            <MenuItem value="Manhã">🌅 Manhã</MenuItem>
            <MenuItem value="Tarde">🌞 Tarde</MenuItem>
            <MenuItem value="Contra-turno Manhã">🌅➕ Contra-turno Manhã</MenuItem>
            <MenuItem value="Contra-turno Tarde">🌞➕ Contra-turno Tarde</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {msg && (
        <Alert severity={msg.includes('sucesso') ? 'success' : 'error'} sx={{ mb: 2 }}>
          {msg}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CircularProgress size={32} />
        </Box>
      ) : periodosAula.length === 0 ? (
        <Typography color="text.secondary" align="center">
          {periodoLetivoSelecionado 
            ? 'Nenhum período de aula configurado para este período letivo. Clique em "Novo Período" para adicionar.'
            : 'Selecione um período letivo para visualizar e configurar os períodos de aula.'
          }
        </Typography>
      ) : (
        <List>
          {periodosAula
            .filter(periodo => !filtroTurno || periodo.turno === filtroTurno)
            .map((periodo) => (
            <ListItem
              key={periodo.id}
              sx={{
                mb: 1,
                bgcolor: periodo.tipo === 'intervalo' ? '#fff3e0' : '#f5f5f5',
                borderRadius: 2,
                border: periodo.tipo === 'intervalo' ? '1px solid #ffb74d' : '1px solid #e0e0e0'
              }}
              secondaryAction={
                <Box>
                  <IconButton
                    edge="end"
                    color="primary"
                    sx={{ mr: 1 }}
                    onClick={() => handleEditar(periodo)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => handleExcluir(periodo)}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontWeight={600}>
                      {periodo.ordem}º - {periodo.nome}
                    </Typography>
                    {periodo.tipo === 'intervalo' && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          bgcolor: '#ff9800', 
                          color: 'white', 
                          px: 1, 
                          py: 0.2, 
                          borderRadius: 1 
                        }}
                      >
                        INTERVALO
                      </Typography>
                    )}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        bgcolor: periodo.turno === 'Manhã' ? '#4caf50' : 
                               periodo.turno === 'Tarde' ? '#ff9800' :
                               periodo.turno === 'Contra-turno Manhã' ? '#2196f3' : '#9c27b0',
                        color: 'white', 
                        px: 1, 
                        py: 0.2, 
                        borderRadius: 1,
                        ml: 1
                      }}
                    >
                      {periodo.turno === 'Manhã' ? '🌅' : 
                       periodo.turno === 'Tarde' ? '🌞' :
                       periodo.turno === 'Contra-turno Manhã' ? '🌅➕' : '🌞➕'} {periodo.turno || 'Manhã'}
                    </Typography>
                  </Box>
                }
                secondary={`${periodo.inicio} às ${periodo.fim}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Modal de Edição/Criação */}
      <Dialog open={modalOpen} onClose={handleFecharModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editPeriodo ? 'Editar Período' : 'Novo Período'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nome do Período"
              name="nome"
              value={form.nome}
              onChange={handleFormChange}
              fullWidth
              required
              placeholder="Ex: 1º Horário, Recreio, Almoço..."
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Horário de Início"
                name="inicio"
                type="time"
                value={form.inicio}
                onChange={handleFormChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Horário de Fim"
                name="fim"
                type="time"
                value={form.fim}
                onChange={handleFormChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Ordem"
                name="ordem"
                type="number"
                value={form.ordem}
                onChange={handleFormChange}
                inputProps={{ min: 1 }}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  name="tipo"
                  value={form.tipo}
                  label="Tipo"
                  onChange={handleFormChange}
                >
                  <MenuItem value="aula">Aula</MenuItem>
                  <MenuItem value="intervalo">Intervalo</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <FormControl fullWidth required>
              <InputLabel>Turno</InputLabel>
              <Select
                name="turno"
                value={form.turno}
                label="Turno"
                onChange={handleFormChange}
              >
                <MenuItem value="Manhã">🌅 Manhã</MenuItem>
                <MenuItem value="Tarde">🌞 Tarde</MenuItem>
                <MenuItem value="Contra-turno Manhã">🌅➕ Contra-turno Manhã</MenuItem>
                <MenuItem value="Contra-turno Tarde">🌞➕ Contra-turno Tarde</MenuItem>
              </Select>
            </FormControl>
            {msg && (
              <Alert severity="error">{msg}</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFecharModal}>Cancelar</Button>
          <Button
            onClick={handleSalvar}
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfigPeriodosAula;