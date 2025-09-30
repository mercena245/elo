"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SidebarMenu from '../../components/SidebarMenu';
import ProtectedRoute from '../../components/ProtectedRoute';
import SimpleCarousel from '../../components/SimpleCarousel';
// Importações do Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import { 
  Card, 
  CardContent, 
  CardActionArea,
  Typography, 
  Grid, 
  Box, 
  Avatar, 
  Divider, 
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Fade,
  Zoom,
  Button
} from '@mui/material';
import { db, ref, get, auth } from '../../firebase';
import { 
  People,
  School,
  CalendarToday,
  TrendingUp,
  Notifications,
  PhotoLibrary,
  Star,
  EmojiEvents,
  Lightbulb,
  ChevronRight,
  Dashboard as DashboardIcon,
  Grade,
  EventBusy,
  Assessment
} from '@mui/icons-material';
import '../../styles/Dashboard.css';
import '../../styles/AvisosCarousel.css';

const Dashboard = () => {
  const [qtdAlunos, setQtdAlunos] = useState(null);
  const [qtdColaboradores, setQtdColaboradores] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [turmasUsuario, setTurmasUsuario] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalProfessores: 0,
    totalTurmas: 0,
    notasLancadas: 0,
    frequenciaMedia: 0,
    mediaGeral: 0
  });
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser ? auth.currentUser.uid : null;
  const router = useRouter();

  // Função para truncar texto
  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Função para obter saudação baseada na hora
  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Função para obter ações rápidas baseadas na role
  const getQuickActions = () => {
    const roleActions = {
      coordenadora: [
        { titulo: 'Gerenciar Alunos', icon: People, rota: '/alunos', cor: '#3B82F6' },
        { titulo: 'Notas & Frequência', icon: Assessment, rota: '/notas-frequencia', cor: '#10B981' },
        { titulo: 'Galeria de Fotos', icon: PhotoLibrary, rota: '/galeriafotos', cor: '#F59E0B' },
        { titulo: 'Colaboradores', icon: School, rota: '/colaboradores', cor: '#8B5CF6' }
      ],
      professora: [
        { titulo: 'Lançar Notas', icon: Grade, rota: '/notas-frequencia', cor: '#10B981' },
        { titulo: 'Registrar Frequência', icon: EventBusy, rota: '/notas-frequencia', cor: '#3B82F6' },
        { titulo: 'Meus Alunos', icon: People, rota: '/alunos', cor: '#F59E0B' },
        { titulo: 'Boletins', icon: Assessment, rota: '/notas-frequencia', cor: '#8B5CF6' }
      ],
      pai: [
        { titulo: 'Boletim do Filho', icon: Assessment, rota: '/notas-frequencia', cor: '#10B981' },
        { titulo: 'Galeria de Fotos', icon: PhotoLibrary, rota: '/galeriafotos', cor: '#F59E0B' },
        { titulo: 'Avisos', icon: Notifications, rota: '/dashboard', cor: '#3B82F6' }
      ],
      aluno: [
        { titulo: 'Minhas Notas', icon: Grade, rota: '/notas-frequencia', cor: '#10B981' },
        { titulo: 'Galeria de Fotos', icon: PhotoLibrary, rota: '/galeriafotos', cor: '#F59E0B' },
        { titulo: 'Avisos', icon: Notifications, rota: '/dashboard', cor: '#3B82F6' }
      ]
    };
    return roleActions[userRole] || [];
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Buscar dados básicos
        const [snapAlunos, snapColab, snapAvisos, snapFotos, snapTurmas, snapUsuarios, snapNotas, snapFrequencia] = await Promise.all([
          get(ref(db, 'alunos')),
          get(ref(db, 'colaboradores')),
          get(ref(db, 'avisos')),
          get(ref(db, 'fotos')),
          get(ref(db, 'turmas')),
          get(ref(db, 'usuarios')),
          get(ref(db, 'notas')),
          get(ref(db, 'frequencia'))
        ]);

        // Processar alunos
        const totalAlunos = snapAlunos.exists() ? Object.keys(snapAlunos.val()).length : 0;
        setQtdAlunos(totalAlunos);

        // Processar colaboradores
        const totalColaboradores = snapColab.exists() ? Object.keys(snapColab.val()).length : 0;
        setQtdColaboradores(totalColaboradores);

        // Processar turmas
        const totalTurmas = snapTurmas.exists() ? Object.keys(snapTurmas.val()).length : 0;

        // Processar professores
        let totalProfessores = 0;
        if (snapUsuarios.exists()) {
          const usuarios = Object.values(snapUsuarios.val());
          totalProfessores = usuarios.filter(u => u.role === 'professora').length;
        }

        // Processar notas
        let notasLancadas = 0;
        let mediaGeral = 0;
        if (snapNotas.exists()) {
          const notas = Object.values(snapNotas.val());
          notasLancadas = notas.length;
          const notasValidas = notas.filter(n => n.nota && !isNaN(parseFloat(n.nota)));
          if (notasValidas.length > 0) {
            const somaNotas = notasValidas.reduce((acc, n) => acc + parseFloat(n.nota), 0);
            mediaGeral = somaNotas / notasValidas.length;
          }
        }

        // Processar frequência
        let frequenciaMedia = 0;
        if (snapFrequencia.exists()) {
          const frequencias = Object.values(snapFrequencia.val());
          const presencas = frequencias.filter(f => f.presente).length;
          frequenciaMedia = frequencias.length > 0 ? (presencas / frequencias.length) * 100 : 0;
        }

        setStats({
          totalAlunos,
          totalProfessores,
          totalTurmas,
          notasLancadas,
          frequenciaMedia,
          mediaGeral
        });

        // Processar avisos
        if (snapAvisos.exists()) {
          const avisosData = snapAvisos.val();
          const avisosArr = Object.entries(avisosData).map(([id, aviso]) => ({
            id,
            titulo: aviso.titulo || 'Aviso',
            conteudo: aviso.conteudo || aviso.texto || '',
            dataCreacao: aviso.dataCreacao
          })).filter(aviso => aviso.ativo !== false); // Filtrar ativos apenas
          
          // Ordenar por data de criação (mais recentes primeiro)
          avisosArr.sort((a, b) => {
            const dataA = new Date(a.dataCreacao || 0);
            const dataB = new Date(b.dataCreacao || 0);
            return dataB - dataA;
          });
          
          setAvisos(avisosArr);
        } else {
          setAvisos([]);
        }

        // Processar fotos
        if (snapFotos.exists()) {
          const all = snapFotos.val();
          const lista = Object.entries(all).map(([id, f]) => ({ id, ...f }));
          setFotos(lista);
        } else {
          setFotos([]);
        }

        // Buscar dados do usuário
        if (userId) {
          const userRef = ref(db, `usuarios/${userId}`);
          const userSnap = await get(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.val();
            setUserRole((userData.role || '').trim().toLowerCase());
            let arr = [];
            if (Array.isArray(userData.turmas)) arr = userData.turmas;
            else if (typeof userData.turmas === 'object' && userData.turmas !== null) arr = Object.values(userData.turmas);
            else if (typeof userData.turmas === 'string') arr = [userData.turmas];
            setTurmasUsuario(arr);
          }
        } else {
          setTurmasUsuario(['todos']);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        setQtdAlunos(0);
        setQtdColaboradores(0);
        setAvisos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
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

  const roleLabels = {
    coordenadora: 'Coordenação',
    professora: 'Professor(a)',
    pai: 'Responsável',
    aluno: 'Estudante'
  };

  const userName = auth.currentUser?.displayName || auth.currentUser?.email || 'Usuário';

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="dashboard-container">
          <SidebarMenu />
          <main className="dashboard-main">
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <DashboardIcon sx={{ fontSize: 40, color: 'primary.main', animation: 'pulse 2s infinite' }} />
            </Box>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="dashboard-container">
        <SidebarMenu />
        <main className="dashboard-main">
          <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header de Boas-vindas */}
            <Fade in timeout={800}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: { xs: 1, sm: 1.5, md: 2 }, 
                  mb: { xs: 1, sm: 1.5 }, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: { xs: 2, md: 3 }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between', 
                  alignItems: { xs: 'center', sm: 'center' },
                  textAlign: { xs: 'center', sm: 'left' }
                }}>
                  <Box sx={{ mb: { xs: 2, sm: 0 } }}>
                    <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                      {getSaudacao()}, {userName}! 👋
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
                      Sistema Educacional ELO - {roleLabels[userRole] || 'Usuário'}
                    </Typography>
                    <Chip 
                      icon={<Lightbulb />}
                      label="Dashboard Inteligente" 
                      size="medium"
                      sx={{ 
                        mt: 2, 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: 'white',
                        '& .MuiChip-icon': { color: 'white' },
                        '& .MuiChip-label': { 
                          fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                        }
                      }}
                    />
                  </Box>
                  <Avatar 
                    sx={{ 
                      width: { xs: 60, sm: 70, md: 80 }, 
                      height: { xs: 60, sm: 70, md: 80 }, 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      fontSize: { xs: '1.5rem', md: '2rem' }
                    }}
                  >
                    <DashboardIcon sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }} />
                  </Avatar>
                </Box>
              </Paper>
            </Fade>

            {/* Ações Rápidas - Logo abaixo do header */}
            <Fade in timeout={1000}>
              <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2, color: '#374151', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    ⚡ Ações Rápidas
                  </Typography>
                  
                  {/* Carrossel de Ações Rápidas */}
                  <Box sx={{ position: 'relative', px: { xs: 0, sm: 1 } }}>
                    <Swiper
                      modules={[Navigation, Pagination]}
                      spaceBetween={20}
                      navigation={{
                        enabled: getQuickActions().length > 4,
                        nextEl: '.swiper-button-next-actions',
                        prevEl: '.swiper-button-prev-actions'
                      }}
                      pagination={{
                        clickable: true,
                        dynamicBullets: true,
                        enabled: getQuickActions().length > 4
                      }}
                      breakpoints={{
                        320: {
                          slidesPerView: 1.8,
                          spaceBetween: 12
                        },
                        480: {
                          slidesPerView: 2.5,
                          spaceBetween: 16
                        },
                        768: {
                          slidesPerView: 3,
                          spaceBetween: 20
                        },
                        1024: {
                          slidesPerView: Math.min(4, getQuickActions().length),
                          spaceBetween: 24
                        },
                        1280: {
                          slidesPerView: Math.min(getQuickActions().length, 6),
                          spaceBetween: 24
                        }
                      }}
                      style={{
                        paddingLeft: '8px',
                        paddingRight: '8px',
                        paddingBottom: getQuickActions().length > 4 ? '40px' : '10px'
                      }}
                    >
                      {getQuickActions().map((acao, idx) => (
                        <SwiperSlide key={idx} style={{ width: 'auto' }}>
                          <Zoom in timeout={1200 + (idx * 150)}>
                            <Card 
                              sx={{ 
                                cursor: 'pointer',
                                background: `linear-gradient(135deg, ${acao.cor}15, ${acao.cor}08)`,
                                border: `2px solid ${acao.cor}25`,
                                borderRadius: 3,
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                width: { xs: 160, sm: 180, md: 200 },
                                height: { xs: 120, sm: 140, md: 160 },
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                  transform: 'translateY(-8px) scale(1.02)',
                                  boxShadow: `0 20px 40px ${acao.cor}30`,
                                  '& .action-icon': {
                                    transform: 'scale(1.2) rotate(5deg)'
                                  },
                                  '& .action-bg': {
                                    transform: 'scale(1.1)',
                                    opacity: 0.3
                                  }
                                }
                              }}
                              onClick={() => router.push(acao.rota)}
                            >
                              {/* Background decorativo */}
                              <Box 
                                className="action-bg"
                                sx={{
                                  position: 'absolute',
                                  top: -20,
                                  right: -20,
                                  width: 80,
                                  height: 80,
                                  borderRadius: '50%',
                                  background: `linear-gradient(135deg, ${acao.cor}20, ${acao.cor}10)`,
                                  transition: 'all 0.4s ease',
                                  opacity: 0.2
                                }}
                              />
                              
                              <CardActionArea sx={{ height: '100%' }}>
                                <CardContent sx={{ 
                                  textAlign: 'center', 
                                  p: { xs: 2, sm: 2.5, md: 3 },
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  position: 'relative'
                                }}>
                                  <Box 
                                    className="action-icon"
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: { xs: 48, sm: 56, md: 64 },
                                      height: { xs: 48, sm: 56, md: 64 },
                                      borderRadius: '16px',
                                      background: `linear-gradient(135deg, ${acao.cor}, ${acao.cor}dd)`,
                                      mb: { xs: 1.5, sm: 2 },
                                      boxShadow: `0 8px 20px ${acao.cor}40`,
                                      transition: 'all 0.4s ease'
                                    }}
                                  >
                                    <acao.icon sx={{ 
                                      fontSize: { xs: 24, sm: 28, md: 32 }, 
                                      color: 'white'
                                    }} />
                                  </Box>
                                  
                                  <Typography 
                                    variant="subtitle1" 
                                    fontWeight={600} 
                                    sx={{ 
                                      fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' },
                                      lineHeight: 1.2,
                                      textAlign: 'center',
                                      color: '#374151',
                                      letterSpacing: '0.5px'
                                    }}
                                  >
                                    {acao.titulo}
                                  </Typography>
                                </CardContent>
                              </CardActionArea>
                            </Card>
                          </Zoom>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                    
                    {/* Botões de navegação customizados */}
                    <Box
                      className="swiper-button-prev-actions"
                      sx={{
                        position: 'absolute',
                        left: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'white',
                          transform: 'translateY(-50%) scale(1.1)',
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)'
                        },
                        '&::after': {
                          content: '""',
                          display: 'none'
                        }
                      }}
                    >
                      <ChevronRight sx={{ 
                        fontSize: 20, 
                        color: '#6B7280',
                        transform: 'rotate(180deg)'
                      }} />
                    </Box>
                    
                    <Box
                      className="swiper-button-next-actions"
                      sx={{
                        position: 'absolute',
                        right: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'white',
                          transform: 'translateY(-50%) scale(1.1)',
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)'
                        },
                        '&::after': {
                          content: '""',
                          display: 'none'
                        }
                      }}
                    >
                      <ChevronRight sx={{ 
                        fontSize: 20, 
                        color: '#6B7280'
                      }} />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Fade>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {/* Quadro de Avisos - Primeiro lugar com largura completa */}
              <Grid item xs={12}>
                <Card sx={{ position: 'relative', overflow: 'hidden', mb: 2 }}>
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      right: 0, 
                      width: { xs: 40, md: 60 }, 
                      height: { xs: 40, md: 60 }, 
                      background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)', 
                      borderRadius: '0 0 0 100%' 
                    }} 
                  />
                  <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Notifications sx={{ color: '#FF6B6B', mr: 1, fontSize: { xs: 20, md: 24 } }} />
                      <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                        📢 Quadro de Avisos
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    
                    {avisos.length > 0 ? (
                      <Box className="avisos-carousel">
                        <Swiper
                          modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
                          spaceBetween={20}
                          slidesPerView={1}
                          navigation={{
                            enabled: avisos.length > 1
                          }}
                          pagination={{
                            clickable: true,
                            enabled: avisos.length > 1
                          }}
                          autoplay={avisos.length > 1 ? {
                            delay: 6000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true,
                          } : false}
                          loop={avisos.length > 2}
                          effect="slide"
                          breakpoints={{
                            640: {
                              slidesPerView: avisos.length >= 2 ? 2 : 1,
                              spaceBetween: 20,
                            },
                            1024: {
                              slidesPerView: avisos.length >= 3 ? 3 : avisos.length,
                              spaceBetween: 30,
                            },
                            1280: {
                              slidesPerView: avisos.length >= 4 ? 4 : avisos.length,
                              spaceBetween: 30,
                            },
                          }}
                        >
                          {avisos.map((aviso, idx) => (
                            <SwiperSlide key={aviso.id || idx}>
                              <Card 
                                className="aviso-card"
                                onClick={() => router.push('/avisos')}
                                sx={{ 
                                  height: { xs: 170, sm: 200, md: 220 },
                                  width: '95%',
                                  mx: 'auto',
                                  my: '2.5%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  bgcolor: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 3,
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    borderColor: '#3B82F6',
                                    boxShadow: '0 10px 25px -3px rgba(59, 130, 246, 0.1)',
                                    transform: 'translateY(-2px)'
                                  }
                                }}
                              >
                                <CardContent sx={{ 
                                  p: { xs: 2, sm: 2.5 }, 
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column'
                                }}>
                                  {/* Título do Aviso */}
                                  <Typography 
                                    variant="h6" 
                                    fontWeight={600} 
                                    color="primary"
                                    sx={{ 
                                      fontSize: { xs: '1rem', sm: '1.1rem', md: '1.15rem' },
                                      mb: 1.5,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      minHeight: { xs: '2.8rem', sm: '3rem', md: '3.2rem' },
                                      lineHeight: 1.3
                                    }}
                                  >
                                    {aviso.titulo}
                                  </Typography>
                                  
                                  {/* Conteúdo do Aviso */}
                                  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary"
                                      sx={{ 
                                        fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.95rem' },
                                        lineHeight: 1.5,
                                        flexGrow: 1,
                                        display: '-webkit-box',
                                        WebkitLineClamp: { xs: 4, sm: 5, md: 5 },
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        mb: 1.5
                                      }}
                                    >
                                      {truncateText(aviso.conteudo, 180)}
                                    </Typography>
                                  </Box>
                                  
                                  {/* Footer do card - com mais espaço */}
                                  <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mt: 'auto',
                                    pt: 1.5,
                                    borderTop: '1px solid #f1f5f9',
                                    minHeight: { xs: '2rem', sm: '2.2rem' }
                                  }}>
                                    {/* Data de criação */}
                                    {aviso.dataCreacao && (
                                      <Typography 
                                        variant="caption" 
                                        color="text.disabled"
                                        sx={{ 
                                          fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                          fontStyle: 'italic'
                                        }}
                                      >
                                        {new Date(aviso.dataCreacao).toLocaleDateString('pt-BR')}
                                      </Typography>
                                    )}
                                    
                                    {/* Indicador de conteúdo adicional - melhor posicionamento */}
                                    {aviso.conteudo.length > 180 && (
                                      <Chip 
                                        size="small" 
                                        label="Ver mais"
                                        sx={{ 
                                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                          height: { xs: 24, sm: 26 },
                                          bgcolor: '#3B82F6',
                                          color: 'white',
                                          '& .MuiChip-label': { px: 1.5 },
                                          '&:hover': {
                                            bgcolor: '#2563EB'
                                          }
                                        }}
                                      />
                                    )}
                                  </Box>
                                </CardContent>
                              </Card>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        textAlign: 'center', 
                        py: 6,
                        bgcolor: '#f8fafc',
                        borderRadius: 3,
                        border: '2px dashed #e2e8f0'
                      }}>
                        <Notifications sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                        <Typography color="text.secondary" variant="h6" sx={{ mb: 1 }}>
                          Nenhum aviso cadastrado
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          Vá para a área de escola para criar avisos
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Estatísticas Principais */}
              {userRole === 'coordenadora' && (
                <Grid item xs={12}>
                  <Fade in timeout={1000}>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2, color: '#374151', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                      📊 Visão Geral da Escola
                    </Typography>
                  </Fade>
                  <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
                    {[
                      { titulo: 'Total de Alunos', valor: stats.totalAlunos, icon: People, cor: '#3B82F6', rota: '/alunos' },
                      { titulo: 'Professores', valor: stats.totalProfessores, icon: School, cor: '#10B981', rota: '/colaboradores' },
                      { titulo: 'Turmas Ativas', valor: stats.totalTurmas, icon: CalendarToday, cor: '#F59E0B', rota: '/turmas' },
                      { titulo: 'Notas Lançadas', valor: stats.notasLancadas, icon: Grade, cor: '#8B5CF6', rota: '/notas-frequencia' }
                    ].map((item, idx) => (
                      <Grid item xs={6} sm={6} md={3} key={idx}>
                        <Zoom in timeout={1000 + (idx * 200)}>
                          <Card 
                            sx={{ 
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              height: { xs: 120, sm: 140, md: 160 },
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                              }
                            }}
                            onClick={() => router.push(item.rota)}
                          >
                            <CardContent sx={{ 
                              textAlign: 'center', 
                              py: { xs: 1.5, sm: 2, md: 3 },
                              px: { xs: 1, sm: 2 },
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}>
                              <Avatar 
                                sx={{ 
                                  bgcolor: item.cor, 
                                  width: { xs: 40, sm: 50, md: 60 }, 
                                  height: { xs: 40, sm: 50, md: 60 }, 
                                  mx: 'auto', 
                                  mb: { xs: 1, md: 2 }
                                }}
                              >
                                <item.icon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />
                              </Avatar>
                              <Typography variant="h4" fontWeight={700} color="primary" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                                {item.valor}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {item.titulo}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Zoom>
                      </Grid>
                    ))}
                  </Grid>
                  
                  {/* Métricas de Performance */}
                  <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                      <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
                        <Typography variant="h6" gutterBottom color="primary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                          📈 Média Geral das Notas
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                          <Box sx={{ width: '100%', mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 } }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(stats.mediaGeral / 10) * 100} 
                              sx={{ height: { xs: 8, sm: 10 }, borderRadius: 5 }}
                              color={stats.mediaGeral >= 7 ? 'success' : stats.mediaGeral >= 5 ? 'warning' : 'error'}
                            />
                          </Box>
                          <Typography variant="h6" color="primary" fontWeight={600} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                            {stats.mediaGeral.toFixed(1)}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
                        <Typography variant="h6" gutterBottom color="primary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                          📅 Frequência Média
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                          <Box sx={{ width: '100%', mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 } }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={stats.frequenciaMedia} 
                              sx={{ height: { xs: 8, sm: 10 }, borderRadius: 5 }}
                              color={stats.frequenciaMedia >= 75 ? 'success' : 'warning'}
                            />
                          </Box>
                          <Typography variant="h6" color="primary" fontWeight={600} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                            {stats.frequenciaMedia.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {/* Ações Rápidas movidas para cima */}

              {/* Seção de Informações */}
              <Grid item xs={12} md={8} order={{ xs: 2, md: 1 }}>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {/* Destaques */}
                  <Grid item xs={12}>
                    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0, 
                          width: { xs: 40, md: 60 }, 
                          height: { xs: 40, md: 60 }, 
                          background: 'linear-gradient(135deg, #4ECDC4, #44A08D)', 
                          borderRadius: '0 0 0 100%' 
                        }} 
                      />
                      <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <EmojiEvents sx={{ color: '#4ECDC4', mr: 1, fontSize: { xs: 20, md: 24 } }} />
                          <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                            🏆 Destaques
                          </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                          {[
                            'Alunos do 5º ano premiados em olimpíada de matemática.',
                            'Projeto "Verde na Escola" ganha destaque regional.',
                            'Sistema ELO implementado com sucesso!'
                          ].map((destaque, idx) => (
                            <Grid item xs={12} md={4} key={idx}>
                              <Box sx={{ 
                                p: { xs: 1.5, sm: 2 }, 
                                bgcolor: '#f0fdf4', 
                                borderRadius: 2, 
                                borderLeft: '4px solid #10B981',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center'
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                  <Star sx={{ color: '#F59E0B', fontSize: { xs: 14, md: 16 }, mr: 1, flexShrink: 0 }} />
                                  <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                    {destaque}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {/* Galeria de Fotos */}
              <Grid item xs={12} md={4} order={{ xs: 1, md: 2 }}>
                <Card sx={{ 
                  height: '100%', 
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease-in-out',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.1)',
                  background: 'linear-gradient(145deg, #ffffff 0%, #fafbff 100%)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
                    borderColor: '#8B5CF6'
                  }
                }} onClick={() => router.push('/galeriafotos')}>
                  {/* Elemento decorativo */}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      right: 0, 
                      width: { xs: 50, md: 70 }, 
                      height: { xs: 50, md: 70 }, 
                      background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', 
                      borderRadius: '0 0 0 100%',
                      opacity: 0.9
                    }} 
                  />
                  
                  <CardContent sx={{ 
                    p: { xs: 2.5, sm: 3, md: 3.5 }, 
                    position: 'relative', 
                    zIndex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(139, 92, 246, 0.1)', 
                        color: '#8B5CF6',
                        mr: 1.5,
                        width: { xs: 32, md: 40 },
                        height: { xs: 32, md: 40 }
                      }}>
                        <PhotoLibrary sx={{ fontSize: { xs: 18, md: 22 } }} />
                      </Avatar>
                      <Typography variant="h6" fontWeight={700} sx={{ 
                        fontSize: { xs: '1.1rem', md: '1.3rem' },
                        background: 'linear-gradient(45deg, #8B5CF6, #7C3AED)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '0.5px'
                      }}>
                        📸 Galeria de Fotos
                      </Typography>
                    </Box>
                    
                    {/* Container do carrossel centralizado */}
                    <Box sx={{ 
                      position: 'relative', 
                      borderRadius: 3, 
                      overflow: 'hidden', 
                      height: { xs: 180, sm: 220, md: 250 },
                      mb: 3,
                      mx: 'auto',
                      width: '100%',
                      maxWidth: '100%',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                      border: '2px solid rgba(139, 92, 246, 0.1)',
                      background: '#ffffff'
                    }}>
                      {fotosVisiveis.length > 0 ? (
                        <SimpleCarousel images={fotosVisiveis.map(f => f.url)} />
                      ) : (
                        <Box 
                          sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            bgcolor: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            flexDirection: 'column',
                            border: '2px dashed rgba(139, 92, 246, 0.3)',
                            borderRadius: 2
                          }}
                        >
                          <PhotoLibrary sx={{ 
                            fontSize: { xs: 48, md: 56 }, 
                            color: '#8B5CF6', 
                            mb: 2, 
                            opacity: 0.7 
                          }} />
                          <Typography variant="h6" color="text.primary" sx={{ 
                            mb: 1, 
                            fontSize: { xs: '1rem', md: '1.1rem' },
                            fontWeight: 600 
                          }}>
                            Galeria Vazia
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            fontSize: { xs: '0.85rem', sm: '0.9rem' },
                            textAlign: 'center',
                            px: 2
                          }}>
                            As fotos da escola aparecerão aqui
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    {/* Informações adicionais */}
                    {fotosVisiveis.length > 0 && (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center',
                        alignItems: 'center',
                        mb: 2,
                        p: 1.5,
                        bgcolor: 'rgba(139, 92, 246, 0.05)',
                        borderRadius: 2,
                        border: '1px solid rgba(139, 92, 246, 0.1)'
                      }}>
                        <Avatar sx={{ 
                          bgcolor: '#10B981', 
                          width: 24, 
                          height: 24, 
                          mr: 1 
                        }}>
                          <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem' }}>
                            {fotosVisiveis.length}
                          </Typography>
                        </Avatar>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          {fotosVisiveis.length === 1 ? 'foto disponível' : 'fotos disponíveis'}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Botão melhorado */}
                    <Button 
                      fullWidth 
                      variant="contained" 
                      size="large"
                      sx={{ 
                        mt: 'auto',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        py: { xs: 1.2, sm: 1.5 },
                        background: 'linear-gradient(45deg, #8B5CF6, #7C3AED)',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                        borderRadius: 2.5,
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textTransform: 'none',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #7C3AED, #6D28D9)',
                          boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                      endIcon={<ChevronRight sx={{ fontSize: { xs: 20, md: 24 } }} />}
                    >
                      {fotosVisiveis.length > 0 ? 'Explorar Galeria' : 'Ver Galeria'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

            </Grid>
          </Box>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
