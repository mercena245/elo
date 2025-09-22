"use client";

import React, { useState, useEffect } from 'react';
import SidebarMenu from '../../components/SidebarMenu';
import { Box, Typography, Card, CardContent, Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { FaTrash, FaUpload, FaHeart } from 'react-icons/fa';
import { db, ref, get, set, push, remove } from '../../firebase';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from '../../firebase'; // Certifique-se de importar o módulo auth

const storage = getStorage();

export default function GaleriaFotos() {
  const [open, setOpen] = useState(false);
  const [fotoSelecionada, setFotoSelecionada] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [novaFoto, setNovaFoto] = useState({ nome: '', url: '', file: null });
  const [turmas, setTurmas] = useState([]);
  const [turmasSelecionadas, setTurmasSelecionadas] = useState([]);
  const [turmaUsuario, setTurmaUsuario] = useState('todos');
  const [turmasUsuario, setTurmasUsuario] = useState([]);
  const userId = typeof window !== 'undefined' && localStorage.getItem('userId')
    ? localStorage.getItem('userId')
    : (auth.currentUser ? auth.currentUser.uid : 'anon');
  // Exemplo: turma do usuário logado
  // const turmaUsuario = typeof window !== 'undefined' ? localStorage.getItem('turmaUsuario') || 'todos' : 'todos';

  // Buscar fotos do Firebase
  const fetchFotos = async () => {
    const fotosRef = ref(db, 'fotos');
    const snap = await get(fotosRef);
    if (snap.exists()) {
      const all = snap.val();
      // all é um objeto { id: { nome, url, likes, likesCount } }
      const lista = Object.entries(all).map(([id, f]) => ({ id, ...f }));
      setFotos(lista);
    } else {
      setFotos([]);
    }
  };

  useEffect(() => {
    console.log('userId:', userId);
    if (userId && userId !== 'anon') {
      const userRef = ref(db, `usuarios/${userId}`);
      get(userRef).then(snap => {
        if (snap.exists()) {
          const userData = snap.val();
          console.log('Dados brutos do usuário (useEffect):', userData);
        }
      });
    }

    fetchFotos();
    // Buscar turmas do banco
    const fetchTurmas = async () => {
      const turmasRef = ref(db, 'turmas');
      const snap = await get(turmasRef);
      if (snap.exists()) {
        const all = snap.val();
        const listaTurmas = Object.entries(all).map(([id, t]) => t.nome || t);
        setTurmas(listaTurmas);
      } else {
        setTurmas([]);
      }
    };
    fetchTurmas();

    // Buscar turmas do usuário logado
    const fetchTurmasUsuario = async () => {
      if (!userId || userId === 'anon') return;
      const userRef = ref(db, `usuarios/${userId}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const userData = snap.val();
        console.log('Dados brutos do usuário:', userData);
        let arr = [];
        if (Array.isArray(userData.turmas)) arr = userData.turmas;
        else if (typeof userData.turmas === 'object' && userData.turmas !== null) arr = Object.values(userData.turmas);
        else if (typeof userData.turmas === 'string') arr = [userData.turmas];
        setTurmasUsuario(arr);
        console.log('Turmas do usuário (fetch):', arr);
      } else {
        setTurmasUsuario(['todos']);
        console.log('Turmas do usuário (fetch):', ['todos']);
      }
    };
    fetchTurmasUsuario();
  }, [userId]);

  const handleOpenFoto = (foto) => {
    setFotoSelecionada(foto);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFotoSelecionada(null);
  };

  const handleDeleteFoto = async (id) => {
    const fotoRef = ref(db, `fotos/${id}`);
    await remove(fotoRef);
    fetchFotos();
    setOpen(false);
  };

  const handleOpenUpload = () => {
    setUploadDialogOpen(true);
    setNovaFoto({ nome: '', url: '', file: null });
  };

  const handleUploadFoto = async () => {
    if (novaFoto.nome && novaFoto.file) {
      const file = novaFoto.file;
      const filePath = `fotos/${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, filePath);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      const fotosRef = ref(db, 'fotos');
      await push(fotosRef, {
        nome: novaFoto.nome,
        url,
        turmas: turmasSelecionadas.length > 0 ? turmasSelecionadas : ['todos'],
        likes: [],
        likesCount: 0
      });
      setUploadDialogOpen(false);
      setTurmasSelecionadas([]);
      fetchFotos();
    }
  };

  const handleLike = async (fotoId) => {
    const fotoRef = ref(db, `fotos/${fotoId}`);
    const snap = await get(fotoRef);
    if (snap.exists()) {
      const fotoData = snap.val();
      let likesArr = fotoData.likes || [];
      likesArr = Array.isArray(likesArr) ? likesArr : Object.values(likesArr);
      if (!likesArr.includes(userId)) {
        // Curtir
        likesArr = [...likesArr, userId];
      } else {
        // Descurtir
        likesArr = likesArr.filter(id => id !== userId);
      }
      await set(fotoRef, { ...fotoData, likes: likesArr, likesCount: likesArr.length });
      fetchFotos();
    }
  };

  console.log('Fotos:', fotos);
  console.log('Turmas do usuário:', turmasUsuario);

  return (
    <div className="dashboard-container">
      <SidebarMenu />
      <main className="dashboard-main">
        <Box sx={{ maxWidth: 900, mx: 'auto', mt: 6 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h4" color="primary" gutterBottom align="center">
                Galeria de Fotos
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button variant="contained" startIcon={<FaUpload />} onClick={handleOpenUpload}>
                  Upload Foto
                </Button>
              </Box>
            </CardContent>
          </Card>
          <Grid container spacing={2} justifyContent="center">
            {fotos
              .filter(foto => {
                if (!foto.turmas) return true;
                let turmasFoto = [];
                if (Array.isArray(foto.turmas)) turmasFoto = foto.turmas;
                else if (typeof foto.turmas === 'object' && foto.turmas !== null) turmasFoto = Object.values(foto.turmas);
                else if (typeof foto.turmas === 'string') turmasFoto = [foto.turmas];
                // Exibe se for para todos ou se alguma turma do usuário está na lista da foto
                return turmasFoto.includes('todos') || turmasUsuario.some(t => turmasFoto.includes(t));
              })
              .map(foto => (
                <Grid item xs={12} sm={6} md={4} key={foto.id}>
                  <Card sx={{ position: 'relative' }}>
                    <img src={foto.url} alt={foto.nome} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                    <CardContent>
                      <Typography align="center">{foto.nome}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1 }}>
                        <FaHeart color={foto.likes?.includes(userId) ? '#e53935' : '#aaa'} style={{ marginRight: 4 }} />
                        <span>{foto.likesCount || 0}</span>
                      </Box>
                    </CardContent>
                    <IconButton
                      aria-label={foto.likes?.includes(userId) ? 'Descurtir' : 'Curtir'}
                      onClick={e => {
                        e.stopPropagation();
                        if (!foto.likes?.includes(userId)) {
                          handleLike(foto.id);
                        } else {
                          handleLike(foto.id); // descurtir
                        }
                      }}
                      sx={{ position: 'absolute', top: 8, left: 8, background: 'rgba(255,255,255,0.7)' }}
                    >
                      <FaHeart color={foto.likes?.includes(userId) ? '#e53935' : '#aaa'} />
                    </IconButton>
                    <IconButton
                      aria-label="Excluir"
                      onClick={() => handleDeleteFoto(foto.id)}
                      sx={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.7)' }}
                    >
                      <FaTrash color="#d32f2f" />
                    </IconButton>
                  </Card>
                </Grid>
              ))}
          </Grid>
          <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>{fotoSelecionada?.nome}</DialogTitle>
            <DialogContent>
              {fotoSelecionada && (
                <img src={fotoSelecionada.url} alt={fotoSelecionada.nome} style={{ width: '100%', maxHeight: 500, objectFit: 'contain' }} />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary">Fechar</Button>
            </DialogActions>
          </Dialog>
          <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Upload de Foto</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <input
                  type="text"
                  placeholder="Nome da foto"
                  value={novaFoto.nome}
                  onChange={e => setNovaFoto({ ...novaFoto, nome: e.target.value })}
                  style={{ padding: 8, fontSize: 16 }}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setNovaFoto({ ...novaFoto, file: e.target.files[0] })}
                  style={{ padding: 8, fontSize: 16 }}
                />
                <Box>
                  <label style={{ fontWeight: 500, marginBottom: 4 }}>Turmas que podem ver:</label>
                  <select
                    multiple
                    value={turmasSelecionadas}
                    onChange={e => {
                      const values = Array.from(e.target.selectedOptions, opt => opt.value);
                      setTurmasSelecionadas(values);
                    }}
                    style={{ width: '100%', minHeight: 40, padding: 8 }}
                  >
                    <option value="todos">Todos</option>
                    {turmas.map((turma, idx) => (
                      <option key={idx} value={turma}>{turma}</option>
                    ))}
                  </select>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setUploadDialogOpen(false)} color="secondary">Cancelar</Button>
              <Button onClick={handleUploadFoto} color="primary" disabled={!novaFoto.nome || !novaFoto.file}>Enviar</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </main>
    </div>
  );
}
