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
  Alert
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { db, ref, get, set, remove } from '../../../firebase';

const ConfigPeriodosAula = () => {
  const [periodosAula, setPeriodosAula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPeriodo, setEditPeriodo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    inicio: '',
    fim: '',
    ordem: 1,
    tipo: 'aula' // 'aula' ou 'intervalo'
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    carregarPeriodos();
  }, []);

  const carregarPeriodos = async () => {
    setLoading(true);
    try {
      const snap = await get(ref(db, 'Escola/PeriodosAula'));
      if (snap.exists()) {
        const data = snap.val();
        const lista = Object.entries(data)
          .map(([id, periodo]) => ({ id, ...periodo }))
          .sort((a, b) => a.ordem - b.ordem);
        setPeriodosAula(lista);
      } else {
        setPeriodosAula([]);
      }
    } catch (err) {
      console.error('Erro ao carregar períodos:', err);
      setPeriodosAula([]);
    }
    setLoading(false);
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

    setSaving(true);
    setMsg('');
    
    try {
      const periodoId = editPeriodo ? editPeriodo.id : `periodo_${Date.now()}`;
      await set(ref(db, `Escola/PeriodosAula/${periodoId}`), {
        nome: form.nome,
        inicio: form.inicio,
        fim: form.fim,
        ordem: parseInt(form.ordem),
        tipo: form.tipo
      });
      
      setModalOpen(false);
      setEditPeriodo(null);
      setForm({ nome: '', inicio: '', fim: '', ordem: 1, tipo: 'aula' });
      await carregarPeriodos();
      setMsg('Período salvo com sucesso!');
    } catch (err) {
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
      tipo: periodo.tipo || 'aula'
    });
    setModalOpen(true);
  };

  const handleExcluir = async (periodo) => {
    if (!window.confirm(`Confirma a exclusão do período "${periodo.nome}"?`)) return;
    
    try {
      await remove(ref(db, `Escola/PeriodosAula/${periodo.id}`));
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
      tipo: 'aula' 
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
        >
          Novo Período
        </Button>
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
          Nenhum período configurado. Clique em "Novo Período" para começar.
        </Typography>
      ) : (
        <List>
          {periodosAula.map((periodo) => (
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