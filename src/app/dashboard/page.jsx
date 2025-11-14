"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SidebarMenu from '../../components/SidebarMenu';
import ProtectedRoute from '../../components/ProtectedRoute';
import SimpleCarousel from '../../components/SimpleCarousel';
import SchoolSelector from '../../components/SchoolSelector';


import SchoolHeader from '../../components/SchoolHeader';
import HeaderSettingsDialog from '../../components/HeaderSettingsDialog';
import { useAuth } from '../../context/AuthContext';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
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
  Badge,
  Fade,
  Zoom,
  Button
} from '@mui/material';
import { auth, onAuthStateChanged } from '../../firebase';
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
  Assessment,
  MedicalServices,
  MenuBook,
  Announcement,
  AccountCircle,
  Settings,
  Schedule,
  Assignment,
  Group,
  PersonAdd,
  History,
  LocalHospital,
  Chat,
  Store,
  AttachMoney,
  Mail
} from '@mui/icons-material';
import '../../styles/Dashboard.css';
import '../../styles/AvisosCarousel.css';

const Dashboard = () => {
  // Hooks para banco de dados da escola
  const { user: authUser, currentSchool } = useAuth();
  const { isReady, isLoading, error, getData, currentSchool: schoolData } = useSchoolDatabase();
  const currentSchoolId = typeof currentSchool === 'string' ? currentSchool : currentSchool?.id;
  const mensagensPath = currentSchoolId ? `escolas/${currentSchoolId}/mensagens` : 'mensagens';

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
  const [userId, setUserId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [headerConfig, setHeaderConfig] = useState(null);
  const [totalPendencias, setTotalPendencias] = useState(0);
  const [totalMensagensNaoLidas, setTotalMensagensNaoLidas] = useState(0);
  const router = useRouter();

  // Verificar autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        // Evitar redirecionamento se já estamos na página de login
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          router.push('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

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

  // Monitorar mensagens não lidas
  useEffect(() => {
    const fetchMensagensNaoLidas = async () => {
      if (!isReady || !getData || !userId || !currentSchoolId) return;

      try {
        const mensagensData = await getData(mensagensPath);
        if (mensagensData) {
          const mensagens = Object.values(mensagensData);
          const naoLidas = mensagens.filter(msg => 
            msg.destinatario?.id === userId &&
            !msg.lida &&
            msg.statusAprovacao !== 'pendente'
          ).length;
          setTotalMensagensNaoLidas(naoLidas);
        }
      } catch (error) {
        console.error('Erro ao buscar mensagens não lidas:', error);
      }
    };

    fetchMensagensNaoLidas();
  }, [isReady, getData, userId, currentSchoolId, mensagensPath]);

  // Função para obter ações rápidas baseadas na role
  const getQuickActions = () => {
    const roleActions = {
      coordenadora: [
        { titulo: 'Pendências', icon: Notifications, rota: '/pendencias', cor: '#EF4444', badgeCount: totalPendencias },
        { titulo: 'Mensagens', icon: Mail, rota: '/agenda', cor: '#3B82F6', badgeCount: totalMensagensNaoLidas },
        { titulo: 'Gerenciar Alunos', icon: PersonAdd, rota: '/alunos', cor: '#3B82F6' },
        { titulo: 'Colaboradores', icon: Group, rota: '/colaboradores', cor: '#8B5CF6' },
        { titulo: 'Relatórios & Notas', icon: Assessment, rota: '/notas-frequencia', cor: '#10B981' },
        { titulo: 'Financeiro', icon: Assessment, rota: '/financeiro', cor: '#059669' },
        { titulo: 'Loja ELO', icon: Store, rota: '/loja', cor: '#DC2626' },
        { titulo: 'Configurações', icon: Settings, rota: '/configuracoes', cor: '#EF4444' },
        { titulo: 'Grade Horária', icon: Schedule, rota: '/grade-horaria', cor: '#F59E0B' },
        { titulo: 'Galeria de Fotos', icon: PhotoLibrary, rota: '/galeriafotos', cor: '#06B6D4' }
      ],
      professora: [
        { titulo: 'Mensagens', icon: Mail, rota: '/agenda', cor: '#3B82F6', badgeCount: totalMensagensNaoLidas },
        { titulo: 'Agenda da Turma', icon: CalendarToday, rota: '/agenda', cor: '#3B82F6' },
        { titulo: 'Lançar Notas', icon: Grade, rota: '/notas-frequencia', cor: '#10B981' },
        { titulo: 'Controle Médico', icon: LocalHospital, rota: '/agenda', cor: '#EF4444' },
        { titulo: 'Frequência', icon: EventBusy, rota: '/notas-frequencia', cor: '#F59E0B' },
        { titulo: 'Meus Alunos', icon: People, rota: '/alunos', cor: '#8B5CF6' },
        { titulo: 'Criar Aviso', icon: Announcement, rota: '/avisos', cor: '#06B6D4' }
      ],
      pai: [
        { titulo: 'Mensagens', icon: Mail, rota: '/agenda', cor: '#3B82F6', badgeCount: totalMensagensNaoLidas },
        { titulo: 'Agenda Médica', icon: MedicalServices, rota: '/agenda', cor: '#EF4444' },
        { titulo: 'Boletim do Filho', icon: Assessment, rota: '/notas-frequencia', cor: '#10B981' },
        { titulo: 'Financeiro', icon: AttachMoney, rota: '/financeiro', cor: '#059669' },
        { titulo: 'Loja ELO', icon: Store, rota: '/loja', cor: '#DC2626' },
        { titulo: 'Galeria de Fotos', icon: PhotoLibrary, rota: '/galeriafotos', cor: '#F59E0B' },
        { titulo: 'Avisos da Escola', icon: Notifications, rota: '/avisos', cor: '#3B82F6' },
        { titulo: 'Cardápio', icon: MenuBook, rota: '/escola', cor: '#8B5CF6' },
        { titulo: 'Contato Escola', icon: Chat, rota: '/escola', cor: '#06B6D4' }
      ],
      aluno: [
        { titulo: 'Mensagens', icon: Mail, rota: '/agenda', cor: '#3B82F6', badgeCount: totalMensagensNaoLidas },
        { titulo: 'Minhas Notas', icon: Grade, rota: '/notas-frequencia', cor: '#10B981' },
        { titulo: 'Minha Agenda', icon: CalendarToday, rota: '/agenda', cor: '#3B82F6' },
        { titulo: 'Galeria de Fotos', icon: PhotoLibrary, rota: '/galeriafotos', cor: '#F59E0B' },
        { titulo: 'Avisos', icon: Notifications, rota: '/avisos', cor: '#8B5CF6' },
        { titulo: 'Meu Perfil', icon: AccountCircle, rota: '/profile', cor: '#06B6D4' }
      ]
    };
    return roleActions[userRole] || [];
  };

  useEffect(() => {
    const fetchAllData = async () => {
      // Aguardar banco de dados estar pronto
      if (!isReady || isLoading) {
        console.log('⏳ Aguardando conexão com banco da escola...');
        return;
      }

      if (error) {
        console.error('❌ Erro na conexão com banco da escola:', error);
        setLoading(false);
        return;
      }

      if (!schoolData) {
        console.log('⚠️ Nenhuma escola selecionada');
        setLoading(false);
        return;
      }

      console.log('🔄 Carregando dados do dashboard da escola:', schoolData.nome);
      console.log('📊 Conectado ao banco:', schoolData.databaseURL);

      setLoading(true);
      try {
        // Buscar dados básicos usando o hook useSchoolDatabase
        const [
          alunosData,
          colaboradoresData,
          avisosData,
          fotosData,
          turmasData,
          usuariosData,
          notasData,
          frequenciaData,
          planosData,
          relatoriosData,
          titulosData,
          mensagensData
        ] = await Promise.all([
          getData('alunos'),
          getData('colaboradores'),
          getData('avisos'),
          getData('fotos'),
          getData('turmas'),
          getData('usuarios'),
          getData('notas'),
          getData('frequencia'),
          getData('planos-aula'),
          getData('relatorios-pedagogicos'),
          getData('titulos_financeiros'),
          getData(mensagensPath)
        ]);

        // Processar alunos
        const totalAlunos = alunosData ? Object.keys(alunosData).length : 0;
        setQtdAlunos(totalAlunos);

        // Processar colaboradores
        const totalColaboradores = colaboradoresData ? Object.keys(colaboradoresData).length : 0;
        setQtdColaboradores(totalColaboradores);

        // Processar turmas
        const totalTurmas = turmasData ? Object.keys(turmasData).length : 0;

        // Processar professores
        let totalProfessores = 0;
        if (usuariosData) {
          const usuarios = Object.values(usuariosData);
          totalProfessores = usuarios.filter(u => u.role === 'professora').length;
        }

        // Processar notas
        let notasLancadas = 0;
        let mediaGeral = 0;
        if (notasData) {
          const notas = Object.values(notasData);
          notasLancadas = notas.length;
          const notasValidas = notas.filter(n => n.nota && !isNaN(parseFloat(n.nota)));
          if (notasValidas.length > 0) {
            const somaNotas = notasValidas.reduce((acc, n) => acc + parseFloat(n.nota), 0);
            mediaGeral = somaNotas / notasValidas.length;
          }
        }

        // Processar frequência
        let frequenciaMedia = 0;
        if (frequenciaData) {
          const frequencias = Object.values(frequenciaData);
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

        // Processar pendências (apenas para coordenadores)
        let totalPendenciasCount = 0;
        
        // Contar planos de aula pendentes
        if (planosData) {
          const planosList = Object.values(planosData);
          const pendentes = planosList.filter(p => 
            !p.statusAprovacao || 
            p.statusAprovacao === 'pendente' || 
            p.statusAprovacao === 'rejeitado' ||
            p.statusAprovacao === 'em_revisao'
          );
          totalPendenciasCount += pendentes.length;
        }
        
        // Contar relatórios pedagógicos pendentes
        if (relatoriosData) {
          const relatoriosList = Object.values(relatoriosData);
          const pendentes = relatoriosList.filter(r => r.statusAprovacao === 'pendente');
          totalPendenciasCount += pendentes.length;
        }
        
        // Contar títulos em análise
        if (titulosData) {
          const titulosList = Object.values(titulosData);
          const emAnalise = titulosList.filter(t => t.status === 'em_analise');
          totalPendenciasCount += emAnalise.length;
        }
        
        if (mensagensData) {
          const mensagensPendentes = Object.values(mensagensData).filter(
            msg => msg.requerAprovacao && msg.statusAprovacao === 'pendente'
          );
          totalPendenciasCount += mensagensPendentes.length;
        }

        setTotalPendencias(totalPendenciasCount);

        // Processar avisos
        if (avisosData) {
          const avisosArr = Object.entries(avisosData).map(([id, aviso]) => ({
            id,
            titulo: aviso.titulo || 'Aviso',
            conteudo: aviso.conteudo || aviso.texto || '',
            dataCreacao: aviso.dataCreacao,
            anexo: aviso.anexo || null
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
        if (fotosData) {
          const lista = Object.entries(fotosData).map(([id, f]) => ({ id, ...f }));
          setFotos(lista);
        } else {
          setFotos([]);
        }

        // Buscar dados do usuário
        if (userId) {
          const userData = await getData(`usuarios/${userId}`);
          if (userData) {
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

        console.log('✅ Dados do dashboard carregados com sucesso');
      } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard:', error);
        setQtdAlunos(0);
        setQtdColaboradores(0);
        setAvisos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [isReady, isLoading, error, schoolData, userId, getData]);

  // Carregar configurações do header
  useEffect(() => {
    const loadHeaderConfig = async () => {
      if (!isReady || !getData) {
        console.log('⏳ [Dashboard] Aguardando banco para carregar config do header...');
        return;
      }

      try {
        console.log('📋 [Dashboard] Carregando configurações do header...');
        
        // Carregar configurações do header
        const headerData = await getData('configuracoes/header');
        
        // Carregar informações da escola
        const schoolInfo = await getData('configuracoes/escola');
        
        console.log('📋 [Dashboard] Header data:', headerData);
        console.log('📋 [Dashboard] School info:', schoolInfo);

        // Montar configuração completa
        const fullConfig = {
          primaryColor: headerData?.primaryColor || '#667eea',
          secondaryColor: headerData?.secondaryColor || '#764ba2',
          backgroundImage: headerData?.backgroundImage || null,
          backgroundOverlay: headerData?.backgroundOverlay ?? 0.3,
          logoUrl: headerData?.logoUrl || null,
          schoolName: schoolInfo?.nome || currentSchool?.nome || '',
          motto: schoolInfo?.motto || '',
          showLogo: headerData?.showLogo ?? true,
          showSchoolName: headerData?.showSchoolName ?? true,
          showMotto: headerData?.showMotto ?? true,
          textColor: headerData?.textColor || '#ffffff',
          style: headerData?.style || 'gradient'
        };

        console.log('✅ [Dashboard] Config completa montada:', fullConfig);
        setHeaderConfig(fullConfig);
      } catch (error) {
        console.error('❌ [Dashboard] Erro ao carregar config do header:', error);
        // Configuração padrão em caso de erro
        setHeaderConfig({
          primaryColor: '#667eea',
          secondaryColor: '#764ba2',
          backgroundImage: null,
          backgroundOverlay: 0.3,
          logoUrl: null,
          schoolName: currentSchool?.nome || '',
          motto: '',
          showLogo: true,
          showSchoolName: true,
          showMotto: true,
          textColor: '#ffffff',
          style: 'gradient'
        });
      }
    };

    loadHeaderConfig();
  }, [isReady, getData, currentSchool]);

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

  // Se não há escola selecionada
  if (!currentSchool) {
    return (
      <ProtectedRoute>
        <div className="dashboard-container">
          <SidebarMenu />
          <main className="dashboard-main">
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', p: 3 }}>
              <School sx={{ fontSize: 80, color: 'warning.main', mb: 3 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Nenhuma escola selecionada
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                Por favor, selecione uma escola para acessar o dashboard
              </Typography>
            </Box>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Se há erro na conexão
  if (error) {
    return (
      <ProtectedRoute>
        <div className="dashboard-container">
          <SidebarMenu />
          <main className="dashboard-main">
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', p: 3 }}>
              <Assessment sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
              <Typography variant="h5" color="error" gutterBottom>
                Erro na conexão com o banco de dados
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                {error}
              </Typography>
            </Box>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Carregando dados
  if (loading || isLoading || !isReady) {
    return (
      <ProtectedRoute>
        <div className="dashboard-container">
          <SidebarMenu />
          <main className="dashboard-main">
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <DashboardIcon sx={{ fontSize: 40, color: 'primary.main', animation: 'pulse 2s infinite', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Conectando ao banco da escola...
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {schoolData?.nome || 'Carregando'}
              </Typography>
            </Box>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Debug do userRole
  console.log('🎯 [Dashboard] userRole:', userRole);
  console.log('🎯 [Dashboard] userName:', userName);
  console.log('🎯 [Dashboard] currentSchool:', currentSchool?.nome);

  return (
    <ProtectedRoute>
      <div className="dashboard-container">
        <SidebarMenu />
        <main className="dashboard-main">
          <Box sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            bgcolor: '#f8fafc', 
            minHeight: '100vh',
            maxWidth: '1600px',
            mx: 'auto'
          }}>
            {/* Header Personalizável da Escola */}
            {currentSchool && userName && userRole ? (
              <>
                <Box sx={{ mb: { xs: 3, md: 4 } }}>
                  <SchoolHeader 
                    userName={userName}
                    userRole={userRole}
                    onOpenSettings={() => {
                      console.log('🔧 [Dashboard] Abrindo settings modal...');
                      console.log('🔧 [Dashboard] userRole no momento:', userRole);
                      setSettingsOpen(true);
                    }}
                  />
                </Box>
                
                {/* Modal de Configurações do Header */}
                <HeaderSettingsDialog 
                  open={settingsOpen}
                  onClose={() => setSettingsOpen(false)}
                  currentConfig={headerConfig}
                />
              </>
            ) : (
              <Paper elevation={0} sx={{ p: 3, mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
                <Typography variant="h5">Carregando header...</Typography>
                <Typography variant="body2">userName: {userName || 'aguardando...'}</Typography>
                <Typography variant="body2">userRole: {userRole || 'aguardando...'}</Typography>
                <Typography variant="body2">school: {currentSchool?.nome || 'aguardando...'}</Typography>
              </Paper>
            )}

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
                      spaceBetween={16}
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
                          slidesPerView: 2.2,
                          spaceBetween: 12
                        },
                        480: {
                          slidesPerView: 3,
                          spaceBetween: 14
                        },
                        768: {
                          slidesPerView: 4,
                          spaceBetween: 16
                        },
                        1024: {
                          slidesPerView: Math.min(5, getQuickActions().length),
                          spaceBetween: 18
                        },
                        1280: {
                          slidesPerView: Math.min(getQuickActions().length, 7),
                          spaceBetween: 20
                        }
                      }}
                      style={{
                        paddingLeft: '6px',
                        paddingRight: '6px',
                        paddingBottom: getQuickActions().length > 4 ? '35px' : '8px'
                      }}
                    >
                      {getQuickActions().map((acao, idx) => (
                        <SwiperSlide key={idx} style={{ width: 'auto' }}>
                          <Zoom in timeout={1200 + (idx * 150)}>
                            <Badge 
                              badgeContent={acao.badgeCount || 0}
                              color="error"
                              overlap="circular"
                              sx={{
                                '& .MuiBadge-badge': {
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  height: 22,
                                  minWidth: 22,
                                  borderRadius: '50%'
                                }
                              }}
                            >
                              <Card 
                                sx={{ 
                                  cursor: 'pointer',
                                  background: `linear-gradient(135deg, ${acao.cor}15, ${acao.cor}08)`,
                                  border: `2px solid ${acao.cor}25`,
                                  borderRadius: 3,
                                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                  width: { xs: 130, sm: 140, md: 150 },
                                  height: { xs: 90, sm: 100, md: 110 },
                                  position: 'relative',
                                  overflow: 'hidden',
                                  '&:hover': {
                                    transform: 'translateY(-6px) scale(1.02)',
                                    boxShadow: `0 15px 30px ${acao.cor}30`,
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
                                  top: -15,
                                  right: -15,
                                  width: 60,
                                  height: 60,
                                  borderRadius: '50%',
                                  background: `linear-gradient(135deg, ${acao.cor}20, ${acao.cor}10)`,
                                  transition: 'all 0.4s ease',
                                  opacity: 0.2
                                }}
                              />
                              
                              <CardActionArea sx={{ height: '100%' }}>
                                <CardContent sx={{ 
                                  textAlign: 'center', 
                                  p: { xs: 1, sm: 1.5, md: 2 },
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
                                      width: { xs: 32, sm: 38, md: 44 },
                                      height: { xs: 32, sm: 38, md: 44 },
                                      borderRadius: '16px',
                                      background: `linear-gradient(135deg, ${acao.cor}, ${acao.cor}dd)`,
                                      mb: { xs: 1, sm: 1.5 },
                                      boxShadow: `0 8px 20px ${acao.cor}40`,
                                      transition: 'all 0.4s ease'
                                    }}
                                  >
                                    <acao.icon sx={{ 
                                      fontSize: { xs: 16, sm: 20, md: 24 }, 
                                      color: 'white'
                                    }} />
                                  </Box>
                                  
                                  <Typography 
                                    variant="subtitle1" 
                                    fontWeight={600} 
                                    sx={{ 
                                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                                      lineHeight: 1.1,
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
                            </Badge>
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
                                  
                                  {/* Layout com conteúdo e miniatura lado a lado se houver imagem */}
                                  {(() => {
                                    const temAnexo = aviso.anexo && aviso.anexo.trim() !== '';
                                    const anexoLower = temAnexo ? aviso.anexo.toLowerCase() : '';
                                    const ehImagem = temAnexo && (
                                      anexoLower.includes('.jpg') || 
                                      anexoLower.includes('.jpeg') || 
                                      anexoLower.includes('.png') || 
                                      anexoLower.includes('.gif') ||
                                      anexoLower.includes('.webp') ||
                                      anexoLower.includes('image%2f') || // URL encoded do Firebase Storage
                                      anexoLower.includes('image/')
                                    );
                                    
                                    if (ehImagem) {
                                      // Layout com imagem
                                      return (
                                        <Box sx={{ 
                                          display: 'flex', 
                                          gap: 1.5,
                                          flexGrow: 1,
                                          minHeight: 0
                                        }}>
                                          {/* Conteúdo do texto */}
                                          <Box sx={{ 
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            minWidth: 0
                                          }}>
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
                                          
                                          {/* Miniatura da imagem em um quadro menor */}
                                          <Box 
                                            sx={{
                                              width: { xs: 80, sm: 100, md: 110 },
                                              height: { xs: 80, sm: 100, md: 110 },
                                              flexShrink: 0,
                                              borderRadius: 2,
                                              overflow: 'hidden',
                                              border: '2px solid #e2e8f0',
                                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                          >
                                            <Box 
                                              component="img"
                                              src={aviso.anexo}
                                              alt="Miniatura do aviso"
                                              onError={(e) => {
                                                console.error('❌ Erro ao carregar imagem:', aviso.anexo);
                                                e.target.parentElement.style.display = 'none';
                                              }}
                                              sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                              }}
                                            />
                                          </Box>
                                        </Box>
                                      );
                                    } else {
                                      // Layout sem imagem (apenas texto)
                                      return (
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
                                      );
                                    }
                                  })()}
                                  
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
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3, color: '#374151', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                      📊 Visão Geral da Escola
                    </Typography>
                  </Fade>
                  
                  {/* Container Centralizado para Grid de Estatísticas */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Card 
                      sx={{ 
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        borderRadius: 4,
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                        p: { xs: 2, sm: 3 },
                        width: '100%',
                        maxWidth: { xs: '100%', sm: 600, md: 700 },
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 500, md: 600 } }}>
                        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ justifyContent: 'center' }}>
                        {[
                          { titulo: 'Total de Alunos', valor: stats.totalAlunos, icon: People, cor: '#3B82F6', rota: '/alunos' },
                          { titulo: 'Professores', valor: stats.totalProfessores, icon: School, cor: '#10B981', rota: '/colaboradores' },
                          { titulo: 'Turmas Ativas', valor: stats.totalTurmas, icon: CalendarToday, cor: '#F59E0B', rota: '/turmas' },
                          { titulo: 'Notas Lançadas', valor: stats.notasLancadas, icon: Grade, cor: '#8B5CF6', rota: '/notas-frequencia' }
                        ].map((item, idx) => (
                          <Grid item xs={6} key={idx}>
                            <Zoom in timeout={1000 + (idx * 200)}>
                              <Card 
                                sx={{ 
                                  cursor: 'pointer',
                                  background: `linear-gradient(135deg, ${item.cor}15, ${item.cor}08)`,
                                  border: `2px solid ${item.cor}25`,
                                  borderRadius: 3,
                                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                  height: { xs: 140, sm: 150, md: 160 },
                                  width: '100%',
                                  minHeight: { xs: 140, sm: 150, md: 160 },
                                  maxHeight: { xs: 140, sm: 150, md: 160 },
                                  position: 'relative',
                                  overflow: 'hidden',
                                  aspectRatio: '1',
                                  '&:hover': {
                                    transform: 'translateY(-6px) scale(1.02)',
                                    boxShadow: `0 15px 30px ${item.cor}30`,
                                    '& .stat-icon': {
                                      transform: 'scale(1.15) rotate(5deg)'
                                    },
                                    '& .stat-bg': {
                                      transform: 'scale(1.1)',
                                      opacity: 0.3
                                    }
                                  }
                                }}
                                onClick={() => router.push(item.rota)}
                              >
                                {/* Background decorativo */}
                                <Box 
                                  className="stat-bg"
                                  sx={{
                                    position: 'absolute',
                                    top: -15,
                                    right: -15,
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${item.cor}20, ${item.cor}10)`,
                                    transition: 'all 0.4s ease',
                                    opacity: 0.2
                                  }}
                                />
                                
                                <CardActionArea sx={{ height: '100%' }}>
                                  <CardContent sx={{ 
                                    textAlign: 'center', 
                                    p: { xs: 1.5, sm: 2, md: 2.5 },
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'relative'
                                  }}>
                                    <Box 
                                      className="stat-icon"
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: { xs: 36, sm: 42, md: 48 },
                                        height: { xs: 36, sm: 42, md: 48 },
                                        borderRadius: '16px',
                                        background: `linear-gradient(135deg, ${item.cor}, ${item.cor}dd)`,
                                        mb: { xs: 1, sm: 1.5 },
                                        boxShadow: `0 8px 20px ${item.cor}40`,
                                        transition: 'all 0.4s ease'
                                      }}
                                    >
                                      <item.icon sx={{ 
                                        fontSize: { xs: 18, sm: 22, md: 26 }, 
                                        color: 'white'
                                      }} />
                                    </Box>
                                    
                                    <Typography 
                                      variant="h5" 
                                      fontWeight={700} 
                                      sx={{ 
                                        fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                                        lineHeight: 1,
                                        color: item.cor,
                                        mb: { xs: 0.5, sm: 1 }
                                      }}
                                    >
                                      {item.valor}
                                    </Typography>
                                    
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                                        lineHeight: 1.2,
                                        textAlign: 'center',
                                        color: '#6B7280',
                                        letterSpacing: '0.3px',
                                        fontWeight: 500
                                      }}
                                    >
                                      {item.titulo}
                                    </Typography>
                                  </CardContent>
                                </CardActionArea>
                              </Card>
                            </Zoom>
                          </Grid>
                        ))}
                      </Grid>
                      </Box>
                    </Card>
                  </Box>
                  
                  {/* Métricas de Performance */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                    <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 550, md: 650 } }}>
                      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ justifyContent: 'center' }}>
                        <Grid item xs={12} sm={6}>
                          <Card 
                            sx={{ 
                              p: { xs: 2.5, sm: 3.5 }, 
                              height: '100%',
                              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                              border: '1px solid rgba(148, 163, 184, 0.15)',
                              borderRadius: 3,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                              }
                            }}
                          >
                            <Typography variant="h6" gutterBottom color="primary" sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, fontWeight: 600 }}>
                              📈 Média Geral das Notas
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                              <Box sx={{ width: '100%', mr: { xs: 0, sm: 2 }, mb: { xs: 2, sm: 0 } }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={(stats.mediaGeral / 10) * 100} 
                                  sx={{ height: 10, borderRadius: 8 }}
                                  color={stats.mediaGeral >= 7 ? 'success' : stats.mediaGeral >= 5 ? 'warning' : 'error'}
                                />
                              </Box>
                              <Typography variant="h5" color="primary" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
                                {stats.mediaGeral.toFixed(1)}
                              </Typography>
                            </Box>
                          </Card>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Card 
                            sx={{ 
                              p: { xs: 2.5, sm: 3.5 }, 
                              height: '100%',
                              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                              border: '1px solid rgba(148, 163, 184, 0.15)',
                              borderRadius: 3,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                              }
                            }}
                          >
                            <Typography variant="h6" gutterBottom color="primary" sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, fontWeight: 600 }}>
                              📅 Frequência Média
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                              <Box sx={{ width: '100%', mr: { xs: 0, sm: 2 }, mb: { xs: 2, sm: 0 } }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={stats.frequenciaMedia} 
                                  sx={{ height: 10, borderRadius: 8 }}
                                  color={stats.frequenciaMedia >= 75 ? 'success' : 'warning'}
                                />
                              </Box>
                              <Typography variant="h5" color="primary" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
                                {stats.frequenciaMedia.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </Grid>
              )}

              {/* Ações Rápidas movidas para cima */}

              {/* Seção da Galeria de Fotos */}
              <Grid item xs={12} md={8} order={{ xs: 2, md: 1 }}>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {/* Carrossel da Galeria de Fotos */}
                  <Grid item xs={12}>
                    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0, 
                          width: { xs: 40, md: 60 }, 
                          height: { xs: 40, md: 60 }, 
                          background: 'linear-gradient(135deg, #F59E0B, #F97316)', 
                          borderRadius: '0 0 0 100%' 
                        }} 
                      />
                      <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <PhotoLibrary sx={{ color: '#F59E0B', mr: 1, fontSize: { xs: 20, md: 24 } }} />
                          <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                            📸 Galeria de Fotos
                          </Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />
                        
                        {fotosVisiveis.length > 0 ? (
                          <Box sx={{ position: 'relative', px: { xs: 0, sm: 1 } }}>
                            <Swiper
                              modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
                              spaceBetween={20}
                              slidesPerView={1}
                              navigation={{
                                enabled: fotosVisiveis.length > 1,
                                nextEl: '.swiper-button-next-gallery',
                                prevEl: '.swiper-button-prev-gallery'
                              }}
                              pagination={{
                                clickable: true,
                                enabled: fotosVisiveis.length > 1
                              }}
                              autoplay={fotosVisiveis.length > 1 ? {
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true,
                              } : false}
                              loop={fotosVisiveis.length > 2}
                              effect="slide"
                              breakpoints={{
                                640: {
                                  slidesPerView: fotosVisiveis.length >= 2 ? 2 : 1,
                                  spaceBetween: 15,
                                },
                                1024: {
                                  slidesPerView: fotosVisiveis.length >= 3 ? 3 : fotosVisiveis.length,
                                  spaceBetween: 20,
                                },
                                1280: {
                                  slidesPerView: fotosVisiveis.length >= 4 ? 4 : fotosVisiveis.length,
                                  spaceBetween: 25,
                                },
                              }}
                              style={{
                                paddingLeft: '6px',
                                paddingRight: '6px',
                                paddingBottom: fotosVisiveis.length > 1 ? '40px' : '10px'
                              }}
                            >
                              {fotosVisiveis.slice(0, 8).map((foto, idx) => (
                                <SwiperSlide key={foto.id || idx}>
                                  <Card 
                                    sx={{ 
                                      cursor: 'pointer',
                                      borderRadius: 3,
                                      transition: 'all 0.4s ease',
                                      height: { xs: 200, sm: 220, md: 240 },
                                      overflow: 'hidden',
                                      position: 'relative',
                                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                      '&:hover': {
                                        transform: 'translateY(-6px) scale(1.02)',
                                        boxShadow: '0 15px 30px rgba(245, 158, 11, 0.3)',
                                        '& .foto-overlay': {
                                          opacity: 1
                                        },
                                        '& .foto-image': {
                                          transform: 'scale(1.1)'
                                        }
                                      }
                                    }}
                                    onClick={() => router.push('/galeriafotos')}
                                  >
                                    <Box
                                      sx={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      <img 
                                        className="foto-image"
                                        src={foto.url} 
                                        alt={foto.nome || `Foto ${idx + 1}`}
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                          transition: 'transform 0.4s ease'
                                        }}
                                      />
                                      
                                      {/* Overlay com informações */}
                                      <Box 
                                        className="foto-overlay"
                                        sx={{
                                          position: 'absolute',
                                          bottom: 0,
                                          left: 0,
                                          right: 0,
                                          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                          color: 'white',
                                          p: { xs: 1.5, sm: 2 },
                                          opacity: 0,
                                          transition: 'opacity 0.3s ease'
                                        }}
                                      >
                                        <Typography 
                                          variant="subtitle2" 
                                          fontWeight={600}
                                          sx={{ 
                                            fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                            mb: 0.5,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 1,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                          }}
                                        >
                                          {foto.nome || 'Foto da Escola'}
                                        </Typography>
                                        {foto.descricao && (
                                          <Typography 
                                            variant="caption"
                                            sx={{ 
                                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                              opacity: 0.9,
                                              display: '-webkit-box',
                                              WebkitLineClamp: 2,
                                              WebkitBoxOrient: 'vertical',
                                              overflow: 'hidden'
                                            }}
                                          >
                                            {foto.descricao}
                                          </Typography>
                                        )}
                                      </Box>
                                      
                                      {/* Ícone de visualização */}
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          top: 12,
                                          right: 12,
                                          background: 'rgba(255, 255, 255, 0.9)',
                                          borderRadius: '50%',
                                          width: 32,
                                          height: 32,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                        }}
                                      >
                                        <PhotoLibrary sx={{ fontSize: 16, color: '#F59E0B' }} />
                                      </Box>
                                    </Box>
                                  </Card>
                                </SwiperSlide>
                              ))}
                            </Swiper>
                            
                            {/* Botões de navegação customizados */}
                            {fotosVisiveis.length > 1 && (
                              <>
                                <Box
                                  className="swiper-button-prev-gallery"
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
                                    color: '#F59E0B',
                                    transform: 'rotate(180deg)'
                                  }} />
                                </Box>
                                
                                <Box
                                  className="swiper-button-next-gallery"
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
                                    color: '#F59E0B'
                                  }} />
                                </Box>
                              </>
                            )}
                            
                            {/* Botão para ver toda a galeria */}
                            <Box sx={{ textAlign: 'center', mt: 3 }}>
                              <Button
                                variant="outlined"
                                startIcon={<PhotoLibrary />}
                                onClick={() => router.push('/galeriafotos')}
                                sx={{
                                  borderColor: '#F59E0B',
                                  color: '#F59E0B',
                                  borderRadius: 3,
                                  px: 3,
                                  py: 1,
                                  fontWeight: 600,
                                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                  textTransform: 'none',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    borderColor: '#F97316',
                                    backgroundColor: '#F59E0B',
                                    color: 'white',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
                                  }
                                }}
                              >
                                Ver toda a galeria
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ 
                            textAlign: 'center', 
                            py: 6,
                            bgcolor: '#fef3c7',
                            borderRadius: 3,
                            border: '2px dashed #F59E0B'
                          }}>
                            <PhotoLibrary sx={{ fontSize: 48, color: '#D97706', mb: 2 }} />
                            <Typography color="text.secondary" variant="h6" sx={{ mb: 1 }}>
                              Nenhuma foto disponível
                            </Typography>
                            <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                              Aguarde novas fotos da turma serem adicionadas
                            </Typography>
                            <Button
                              variant="contained"
                              startIcon={<PhotoLibrary />}
                              onClick={() => router.push('/galeriafotos')}
                              sx={{
                                backgroundColor: '#F59E0B',
                                color: 'white',
                                borderRadius: 3,
                                px: 3,
                                py: 1,
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                textTransform: 'none',
                                '&:hover': {
                                  backgroundColor: '#D97706',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
                                }
                              }}
                            >
                              Ir para galeria
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>



            </Grid>
          </Box>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
