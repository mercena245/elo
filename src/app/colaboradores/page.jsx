"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '../../components/SidebarMenu';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Card, CardContent, Typography, Box, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { fetchDisciplinas } from './disciplinasHelpers';
import { FaUsers } from 'react-icons/fa';
import { db, ref, get, set, auth } from '../../firebase';

const Colaboradores = () => {
  const [disciplinas, setDisciplinas] = useState([]);
  const [editColabDisciplinas, setEditColabDisciplinas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openColabModal, setOpenColabModal] = useState(false);
  const [editColab, setEditColab] = useState(null);
  const [editColabTurmas, setEditColabTurmas] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [savingColab, setSavingColab] = useState(false);
  const [isNewColab, setIsNewColab] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [roleChecked, setRoleChecked] = useState(false);
  const userId = auth.currentUser ? auth.currentUser.uid : null;

  const fetchData = async () => {
    setLoading(true);
    try {
      const usuariosSnap = await get(ref(db, 'usuarios'));
      let profArr = [];
      if (usuariosSnap.exists()) {
        const usuariosData = usuariosSnap.val();
        profArr = Object.entries(usuariosData)
          .filter(([_, u]) => u.role === 'professora')
          .map(([id, prof]) => ({ ...prof, id }));
      }
      setColaboradores(profArr);
    } catch {
      setColaboradores([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Buscar disciplinas do banco
    const fetchAllDisciplinas = async () => {
      const lista = await fetchDisciplinas();
      setDisciplinas(lista);
    };
    fetchAllDisciplinas();
    fetchData();
    // Buscar turmas do banco
    const fetchTurmas = async () => {
      const turmasRef = ref(db, 'turmas');
      const snap = await get(turmasRef);
      if (snap.exists()) {
        const all = snap.val();
        // Se turmas for objeto, transforma em array de nomes
        const listaTurmas = Object.entries(all).map(([id, t]) => ({ id, nome: t.nome || t }));
        setTurmas(listaTurmas);
      } else {
        setTurmas([]);
      }
    };
    fetchTurmas();
  }, []);

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

  const handleAddColab = () => {
    setEditColab(null);
    setEditColabForm({ nome: '', cargo: '', email: '' });
    setIsNewColab(true);
    setOpenColabModal(true);
  };

  const handleEditColab = colab => {
    setEditColab(colab);
    setEditColabTurmas(colab.turmas || []);
  setEditColabDisciplinas(colab.disciplinas || []);
    setOpenColabModal(true);
  };

  const handleColabFormChange = e => {
    const { name, value } = e.target;
    setEditColabForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveColab = async () => {
    setSavingColab(true);
    try {
      if (editColab && editColab.id) {
        // Atualiza apenas as turmas da professora
        await set(ref(db, `usuarios/${editColab.id}`), {
          ...editColab,
          turmas: editColabTurmas,
          disciplinas: editColabDisciplinas
        });
      }
      setOpenColabModal(false);
      await fetchData();
    } catch (err) {}
    setSavingColab(false);
  };

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
    <ProtectedRoute>
      <div className="dashboard-container">
        <SidebarMenu />
        <main className="dashboard-main">
          <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" color="primary" gutterBottom>Professores(as) do Sistema</Typography>
            </Box>
            <Card>
              <CardContent>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <Typography>Carregando...</Typography>
                  </Box>
                ) : colaboradores.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center">
                    Nenhuma professora cadastrada.
                  </Typography>
                ) : (
                  colaboradores.map(prof => (
                    <Box key={prof.id} sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: '#f5f5f5', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleEditColab(prof)}>
                      <Avatar sx={{ bgcolor: '#388e3c', mx: 'auto', mb: 1 }}><FaUsers /></Avatar>
                      <Typography variant="subtitle1" fontWeight={600}>{prof.nome || prof.email}</Typography>
                      <Typography variant="body2">Email: {prof.email || '-'}</Typography>
                      <Typography variant="body2">Função: Professora</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Disciplinas: {prof.disciplinas && prof.disciplinas.length > 0
                          ? prof.disciplinas.map(id => (disciplinas.find(d => d.id === id)?.nome || id)).join(', ')
                          : 'Nenhuma'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Turmas: {prof.turmas && prof.turmas.length > 0
                          ? prof.turmas.map(id => (turmas.find(t => t.id === id)?.nome || id)).join(', ')
                          : 'Nenhuma'}
                      </Typography>
                    </Box>
                  ))
                )}
                <Dialog open={openColabModal} onClose={() => setOpenColabModal(false)} maxWidth="xs" fullWidth>
                  <DialogTitle>Atribuir turmas e disciplinas à professora</DialogTitle>
                  <DialogContent>
                    <Typography variant="subtitle1" gutterBottom>{editColab?.nome || editColab?.email}</Typography>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel id="turmas-label">Turmas</InputLabel>
                      <Select
                        labelId="turmas-label"
                        multiple
                        value={editColabTurmas}
                        onChange={e => setEditColabTurmas(e.target.value)}
                        renderValue={selected => selected.map(id => turmas.find(t => t.id === id)?.nome || id).join(', ')}
                      >
                        {turmas.map(turma => (
                          <MenuItem key={turma.id} value={turma.id}>{turma.nome}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel id="disciplinas-label">Disciplinas</InputLabel>
                      <Select
                        labelId="disciplinas-label"
                        multiple
                        value={editColabDisciplinas}
                        onChange={e => setEditColabDisciplinas(e.target.value)}
                        renderValue={selected => selected.map(id => disciplinas.find(d => d.id === id)?.nome || id).join(', ')}
                      >
                        {disciplinas.map(disc => (
                          <MenuItem key={disc.id} value={disc.id}>{disc.nome}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setOpenColabModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleSaveColab} color="primary" disabled={savingColab}>Salvar</Button>
                  </DialogActions>
                </Dialog>
              </CardContent>
            </Card>
          </Box>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Colaboradores;
