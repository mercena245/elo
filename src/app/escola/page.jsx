"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '../../components/SidebarMenu';
import { Card, CardContent, Typography, Grid, Box, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemText, IconButton, CircularProgress } from '@mui/material';
import { FaTrash } from 'react-icons/fa';
import { FaUsers, FaChalkboardTeacher } from 'react-icons/fa';
import { db, ref, get, set, auth } from '../../firebase';

const Escola = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avisos, setAvisos] = useState([]);
  const [novoAviso, setNovoAviso] = useState('');
  const [salvandoAviso, setSalvandoAviso] = useState(false);
  const [openTurmaModal, setOpenTurmaModal] = useState(false);
  const [filtroTurno, setFiltroTurno] = useState('');
  const [filtroNomeTurma, setFiltroNomeTurma] = useState('');
  const [editTurma, setEditTurma] = useState(null);
  const [editTurmaForm, setEditTurmaForm] = useState({ nome: '', status: '', turnoId: '' });
  const [savingTurma, setSavingTurma] = useState(false);
  const [isNewTurma, setIsNewTurma] = useState(false);
  const [openColabModal, setOpenColabModal] = useState(false);
  const [editColab, setEditColab] = useState(null);
  const [editColabForm, setEditColabForm] = useState({ nome: '', cargo: '', email: '' });
  const [savingColab, setSavingColab] = useState(false);
  const [isNewColab, setIsNewColab] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [roleChecked, setRoleChecked] = useState(false);
  const userId = auth.currentUser ? auth.currentUser.uid : null;

  const handleAddColab = () => {
    setEditColab(null);
    setEditColabForm({ nome: '', cargo: '', email: '' });
    setIsNewColab(true);
    setOpenColabModal(true);
  };

  const handleEditColab = colab => {
    setEditColab(colab);
    setEditColabForm({ nome: colab.nome || '', cargo: colab.cargo || '', email: colab.email || '' });
    setIsNewColab(false);
    setOpenColabModal(true);
  };

  const handleColabFormChange = e => {
    const { name, value } = e.target;
    setEditColabForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveColab = async () => {
    setSavingColab(true);
    try {
      if (isNewColab) {
        const novoId = `id_colab_${editColabForm.nome.replace(/\s/g, '').toLowerCase()}`;
        await set(ref(db, `colaboradores/${novoId}`), editColabForm);
      } else if (editColab && editColab.id) {
        await set(ref(db, `colaboradores/${editColab.id}`), editColabForm);
      }
      setOpenColabModal(false);
      await fetchData();
    } catch (err) {
    }
    setSavingColab(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const colabSnap = await get(ref(db, 'colaboradores'));
      const turmasSnap = await get(ref(db, 'turmas'));
      const avisosSnap = await get(ref(db, 'avisos'));
      let colabArr = [];
      let turmasArr = [];
      let avisosArr = [];
      if (colabSnap.exists()) {
        const colabData = colabSnap.val();
        colabArr = Object.entries(colabData).map(([id, colab]) => ({ ...colab, id }));
      }
      if (turmasSnap.exists()) {
        const turmasData = turmasSnap.val();
        turmasArr = Object.entries(turmasData).map(([id, turma]) => ({ ...turma, id }));
      }
      if (avisosSnap.exists()) {
        const avisosData = avisosSnap.val();
        avisosArr = Object.entries(avisosData).map(([id, aviso]) => ({ id, ...aviso }));
      }
      setColaboradores(colabArr);
      setTurmas(turmasArr);
      setAvisos(avisosArr);
    } catch {
      setColaboradores([]);
      setTurmas([]);
      setAvisos([]);
    }
    setLoading(false);
  };

  // Adicionar novo aviso
  const handleAddAviso = async () => {
    if (!novoAviso.trim()) return;
    setSalvandoAviso(true);
    const avisoId = `aviso_${Date.now()}`;
    await set(ref(db, `avisos/${avisoId}`), { texto: novoAviso });
    setNovoAviso('');
    await fetchData();
    setSalvandoAviso(false);
  };

  // Remover aviso
  const handleRemoveAviso = async (id) => {
    await set(ref(db, `avisos/${id}`), null);
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTurma = () => {
    setEditTurma(null);
    setEditTurmaForm({ nome: '', status: '', turnoId: '' });
    setIsNewTurma(true);
    setOpenTurmaModal(true);
  };

  const handleEditTurma = turma => {
    setEditTurma(turma);
    setEditTurmaForm({ nome: turma.nome || '', status: turma.status || '', turnoId: turma.turnoId || '' });
    setIsNewTurma(false);
    setOpenTurmaModal(true);
  };

  const handleTurmaFormChange = e => {
    const { name, value } = e.target;
    setEditTurmaForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveTurma = async () => {
    setSavingTurma(true);
    try {
      if (isNewTurma) {
        const novoId = `id_turma_${editTurmaForm.nome.replace(/\s/g, '').toLowerCase()}`;
        await set(ref(db, `turmas/${novoId}`), editTurmaForm);
      } else if (editTurma && editTurma.id) {
        await set(ref(db, `turmas/${editTurma.id}`), editTurmaForm);
      }
      setOpenTurmaModal(false);
      await fetchData();
    } catch (err) {
    }
    setSavingTurma(false);
  };

  useEffect(() => {
    async function fetchRole() {
      if (!userId) {
        setUserRole(null);
        setRoleChecked(true);
        return;
      }
      const userRef = ref(db, `usuarios/${userId}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const userData = snap.val();
        setUserRole((userData.role || '').trim().toLowerCase());
      } else {
        setUserRole(null);
      }
      setRoleChecked(true);
    }
    fetchRole();
  }, [userId]);

  if (!roleChecked) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (userRole !== 'coordenadora') {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Acesso negado
        </Typography>
        <Typography variant="body1">
          Esta página é restrita para coordenadoras.
        </Typography>
      </Box>
    );
  }

  return (
    <div className="dashboard-container">
      <SidebarMenu />
      <main className="dashboard-main">
        <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
          <Typography variant="h4" color="primary" fontWeight={700} gutterBottom align="center">Informações da Escola</Typography>
          {/* Gerenciador de avisos */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>Quadro de Avisos</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Novo aviso"
                  value={novoAviso}
                  onChange={e => setNovoAviso(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button variant="contained" color="primary" onClick={handleAddAviso} disabled={salvandoAviso || !novoAviso.trim()}>
                  Adicionar
                </Button>
              </Box>
              {avisos.length === 0 ? (
                <Typography color="text.secondary" align="center">Nenhum aviso cadastrado.</Typography>
              ) : (
                <List>
                  {avisos.map(aviso => (
                    <ListItem key={aviso.id} secondaryAction={
                      <IconButton edge="end" color="error" onClick={() => handleRemoveAviso(aviso.id)}>
                        <FaTrash />
                      </IconButton>
                    }>
                      <ListItemText primary={aviso.texto} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Card sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                <CardContent sx={{ height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, justifyContent: 'center' }}>
                    <Avatar sx={{ bgcolor: '#1976d2' }}><FaChalkboardTeacher /></Avatar>
                    <Typography variant="h6">Turmas</Typography>
                    <Button variant="contained" color="primary" size="small" sx={{ ml: 2 }} onClick={handleAddTurma}>
                      Incluir Turma
                    </Button>
                  </Box>
                  {/* Filtro por turno */}
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <FormControl sx={{ minWidth: 120 }} size="small">
                      <InputLabel id="filtro-turno-label">Filtrar por turno</InputLabel>
                      <Select
                        labelId="filtro-turno-label"
                        value={filtroTurno || ''}
                        label="Filtrar por turno"
                        onChange={e => setFiltroTurno(e.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="Manhã">Manhã</MenuItem>
                        <MenuItem value="Tarde">Tarde</MenuItem>
                        <MenuItem value="Noite">Noite</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Filtrar por nome"
                      variant="outlined"
                      size="small"
                      value={filtroNomeTurma}
                      onChange={e => setFiltroNomeTurma(e.target.value)}
                      sx={{ minWidth: 180 }}
                    />
                  </Box>
                  {loading ? (
                    <Typography variant="body2" color="text.secondary">Carregando...</Typography>
                  ) : turmas.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Nenhuma turma encontrada.</Typography>
                  ) : (
                    turmas
                      .filter(turma => (!filtroTurno || turma.turnoId === filtroTurno) && (!filtroNomeTurma || turma.nome.toLowerCase().includes(filtroNomeTurma.toLowerCase())))
                      .map(turma => (
                        <Box key={turma.id} sx={{ mb: 2, p: 1, borderRadius: 2, bgcolor: '#f5f5f5', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleEditTurma(turma)}>
                          <Typography variant="subtitle1" fontWeight={600}>{turma.nome}</Typography>
                          <Typography variant="body2">Status: {turma.status || '-'}</Typography>
                          <Typography variant="body2">Turno: {turma.turnoId || '-'}</Typography>
                        </Box>
                      ))
                  )}
                  <Dialog open={openTurmaModal} onClose={() => setOpenTurmaModal(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>{isNewTurma ? 'Incluir Turma' : 'Editar Turma'}</DialogTitle>
                    <DialogContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Nome" name="nome" value={editTurmaForm.nome || ''} onChange={handleTurmaFormChange} fullWidth />
                        <TextField label="Status" name="status" value={editTurmaForm.status || ''} onChange={handleTurmaFormChange} fullWidth />
                        <FormControl fullWidth>
                          <InputLabel id="turno-select-label">Turno</InputLabel>
                          <Select
                            labelId="turno-select-label"
                            name="turnoId"
                            value={editTurmaForm.turnoId || ''}
                            label="Turno"
                            onChange={handleTurmaFormChange}
                          >
                            <MenuItem value="Manhã">Manhã</MenuItem>
                            <MenuItem value="Tarde">Tarde</MenuItem>
                            <MenuItem value="Noite">Noite</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setOpenTurmaModal(false)} color="secondary">Cancelar</Button>
                      <Button onClick={handleSaveTurma} color="primary" disabled={savingTurma}>Salvar</Button>
                    </DialogActions>
                  </Dialog>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </main>
    </div>
  );
}

export default Escola;
