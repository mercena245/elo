"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SidebarMenu from '../../components/SidebarMenu';
import ProtectedRoute from '../../components/ProtectedRoute';
import Feed from '../../components/Feed';
import SimpleCarousel from '../../components/SimpleCarousel';
import { Card, CardContent, Typography, Grid, Box, Avatar, Divider } from '@mui/material';
import { db, ref, get, auth } from '../../firebase';
import { FaUserFriends, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import '../../styles/Dashboard.css';

const Dashboard = () => {
  const [qtdAlunos, setQtdAlunos] = useState(null);
  const [qtdColaboradores, setQtdColaboradores] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [turmasUsuario, setTurmasUsuario] = useState([]);
  const [userRole, setUserRole] = useState('');
  const userId = auth.currentUser ? auth.currentUser.uid : null;
  const router = useRouter();

  useEffect(() => {
    const fetchQtdAlunosColaboradoresEAvisos = async () => {
      try {
        const snapAlunos = await get(ref(db, 'alunos'));
        setQtdAlunos(snapAlunos.exists() ? Object.keys(snapAlunos.val()).length : 0);

        const snapColab = await get(ref(db, 'colaboradores'));
        setQtdColaboradores(snapColab.exists() ? Object.keys(snapColab.val()).length : 0);

        const snapAvisos = await get(ref(db, 'avisos'));
        if (snapAvisos.exists()) {
          const avisosData = snapAvisos.val();
          const avisosArr = Object.values(avisosData).map(a => a.texto);
          setAvisos(avisosArr);
        } else {
          setAvisos([]);
        }
      } catch {
        setQtdAlunos(0);
        setQtdColaboradores(0);
        setAvisos([]);
      }
    };
    fetchQtdAlunosColaboradoresEAvisos();

    // Buscar fotos do Firebase
    const fetchFotos = async () => {
      const fotosRef = ref(db, 'fotos');
      const snap = await get(fotosRef);
      if (snap.exists()) {
        const all = snap.val();
        const lista = Object.entries(all).map(([id, f]) => ({ id, ...f }));
        setFotos(lista);
      } else {
        setFotos([]);
      }
    };
    fetchFotos();

    // Buscar turmas do usuário logado
    const fetchTurmasUsuario = async () => {
      if (!userId) return setTurmasUsuario(['todos']);
      const userRef = ref(db, `usuarios/${userId}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const userData = snap.val();
        setUserRole((userData.role || '').trim().toLowerCase());
        let arr = [];
        if (Array.isArray(userData.turmas)) arr = userData.turmas;
        else if (typeof userData.turmas === 'object' && userData.turmas !== null) arr = Object.values(userData.turmas);
        else if (typeof userData.turmas === 'string') arr = [userData.turmas];
        setTurmasUsuario(arr);
      } else {
        setTurmasUsuario(['todos']);
      }
    };
    fetchTurmasUsuario();
  }, [userId]);

  // Filtra as fotos conforme role/turmas
  const fotosVisiveis = fotos.filter(foto => {
    if (userRole === 'coordenadora') return true;
    if (!foto.turmas) return false;
    if (Array.isArray(foto.turmas)) {
      return foto.turmas.some(t => turmasUsuario.includes(t) || t === 'todos');
    } else if (typeof foto.turmas === 'object' && foto.turmas !== null) {
      return Object.values(foto.turmas).some(t => turmasUsuario.includes(t) || t === 'todos');
    } else if (typeof foto.turmas === 'string') {
      return turmasUsuario.includes(foto.turmas) || foto.turmas === 'todos';
    }
    return false;
  });

  const estatisticas = [
    { icon: <FaUserFriends size={28} color="#1976d2" />, label: 'Alunos', value: qtdAlunos === null ? '...' : qtdAlunos, route: '/alunos' },
    { icon: <FaUsers size={28} color="#388e3c" />, label: 'Colaboradores', value: qtdColaboradores === null ? '...' : qtdColaboradores, route: '/colaboradores' },
    { icon: <FaCalendarAlt size={28} color="#fbc02d" />, label: 'Eventos', value: 7 },
  ];

  // avisos agora vêm do Firebase

  const destaques = [
    'Alunos do 5º ano premiados em olimpíada de matemática.',
    'Projeto "Verde na Escola" ganha destaque regional.',
  ];

  return (
    <ProtectedRoute>
      <div className="dashboard-container">
        <SidebarMenu />
        <main className="dashboard-main">
          <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
                Bem-vindo(a) à Escola do Reino!
              </Typography>
             
            </Box>
            <Grid container spacing={3} sx={{ mb: 4 }} justifyContent="center">
              {estatisticas.map((item, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx} display="flex" justifyContent="center">
                  <Card
                    sx={{ width: '100%', maxWidth: 300, mx: 'auto', cursor: item.route ? 'pointer' : 'default' }}
                    onClick={item.route ? () => router.push(item.route) : undefined}
                  >
                    <CardContent style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
                      <Avatar sx={{ bgcolor: 'white', boxShadow: 1 }}>{item.icon}</Avatar>
                      <Box>
                        <Typography variant="h6" align="center">{item.value}</Typography>
                        <Typography variant="body2" color="text.secondary" align="center">{item.label}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Grid container spacing={3} sx={{ mb: 4 }} justifyContent="center">
              <Grid item xs={12} md={6} display="flex" justifyContent="center">
                <Card sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom align="center">Quadro de Avisos</Typography>
                    <Divider sx={{ mb: 1 }} />
                    {avisos.map((aviso, idx) => (
                      <Typography key={idx} variant="body2" sx={{ mb: 1 }} align="center">{aviso}</Typography>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6} display="flex" justifyContent="center">
                <Card sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
                  <CardContent>
                    <Typography variant="h6" color="secondary" gutterBottom align="center">Destaques</Typography>
                    <Divider sx={{ mb: 1 }} />
                    {destaques.map((destaque, idx) => (
                      <Typography key={idx} variant="body2" sx={{ mb: 1 }} align="center">{destaque}</Typography>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" color="primary" gutterBottom align="center">Galeria de Fotos</Typography>
              <Card sx={{ width: '100%', maxWidth: 600, mx: 'auto', cursor: 'pointer', mb: 2 }} onClick={() => router.push('/galeriafotos')}>
                <CardContent>
                  <SimpleCarousel images={fotosVisiveis.map(f => f.url)} />
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ mt: 4 }}>
              <Feed />
            </Box>
          </Box>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
