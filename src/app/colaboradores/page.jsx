"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '../../components/SidebarMenu';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Card, CardContent, Typography, Box, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress } from '@mui/material';
import { FaUsers } from 'react-icons/fa';
import { db, ref, get, set, auth } from '../../firebase';

const Colaboradores = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openColabModal, setOpenColabModal] = useState(false);
  const [editColab, setEditColab] = useState(null);
  const [editColabForm, setEditColabForm] = useState({ nome: '', cargo: '', email: '' });
  const [savingColab, setSavingColab] = useState(false);
  const [isNewColab, setIsNewColab] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [roleChecked, setRoleChecked] = useState(false);
  const userId = auth.currentUser ? auth.currentUser.uid : null;

  const fetchData = async () => {
    setLoading(true);
    try {
      const colabSnap = await get(ref(db, 'colaboradores'));
      let colabArr = [];
      if (colabSnap.exists()) {
        const colabData = colabSnap.val();
        colabArr = Object.entries(colabData).map(([id, colab]) => ({ ...colab, id }));
      }
      setColaboradores(colabArr);
    } catch {
      setColaboradores([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
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
              <Typography variant="h5" color="primary" gutterBottom>Lista de Colaboradores</Typography>
              <Button variant="contained" color="primary" onClick={handleAddColab}>Adicionar Colaborador</Button>
            </Box>
            <Card>
              <CardContent>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <Typography>Carregando...</Typography>
                  </Box>
                ) : colaboradores.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center">
                    Nenhum colaborador encontrado.
                  </Typography>
                ) : (
                  colaboradores.map(colab => (
                    <Box key={colab.id} sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: '#f5f5f5', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleEditColab(colab)}>
                      <Avatar sx={{ bgcolor: '#388e3c', mx: 'auto', mb: 1 }}><FaUsers /></Avatar>
                      <Typography variant="subtitle1" fontWeight={600}>{colab.nome}</Typography>
                      <Typography variant="body2">Cargo: {colab.cargo || '-'}</Typography>
                      <Typography variant="body2">Email: {colab.email || '-'}</Typography>
                    </Box>
                  ))
                )}
                <Dialog open={openColabModal} onClose={() => setOpenColabModal(false)} maxWidth="sm" fullWidth>
                  <DialogTitle>{isNewColab ? 'Incluir Colaborador' : 'Editar Colaborador'}</DialogTitle>
                  <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField label="Nome" name="nome" value={editColabForm.nome || ''} onChange={handleColabFormChange} fullWidth />
                      <TextField label="Cargo" name="cargo" value={editColabForm.cargo || ''} onChange={handleColabFormChange} fullWidth />
                      <TextField label="Email" name="email" value={editColabForm.email || ''} onChange={handleColabFormChange} fullWidth />
                    </Box>
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
