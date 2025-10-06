"use client";

import React, { useState, useEffect } from 'react';
import SidebarMenu from '../../components/SidebarMenu';
import ProtectedRoute from '../../components/ProtectedRoute';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  CircularProgress,
  Backdrop,
  Alert,
  Fade,
  Zoom,
  TextField
} from '@mui/material';
import { 
  CloudUpload, 
  Delete, 
  Favorite, 
  FavoriteBorder, 
  Image, 
  Close,
  Photo,
  FilterList,
  Visibility,
  ArrowBackIos,
  ArrowForwardIos
} from '@mui/icons-material';
import { db, ref, get, set, push, remove } from '../../firebase';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth } from '../../firebase';

const storage = getStorage();

export default function GaleriaFotos() {
  const [open, setOpen] = useState(false);
  const [fotoSelecionada, setFotoSelecionada] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [novaFoto, setNovaFoto] = useState({ nome: '', descricao: '', url: '', files: [] });
  const [turmas, setTurmas] = useState([]);
  const [turmasSelecionadas, setTurmasSelecionadas] = useState([]);
  const [turmaUsuario, setTurmaUsuario] = useState('todos');
  const [turmasUsuario, setTurmasUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [likingPhoto, setLikingPhoto] = useState(null);
  const [filtroTurma, setFiltroTurma] = useState('');
  const [userRole, setUserRole] = useState('');
  const [roleChecked, setRoleChecked] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fotoParaExcluir, setFotoParaExcluir] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [carouselIndices, setCarouselIndices] = useState({}); // Para controlar índice de cada carrossel
  const [modalCarouselIndex, setModalCarouselIndex] = useState(0); // Para controlar carrossel no modal
  
  // Estados para o novo modal de carrossel
  const [carouselModalOpen, setCarouselModalOpen] = useState(false);
  const [selectedCarouselPost, setSelectedCarouselPost] = useState(null);
  const [carouselImageIndex, setCarouselImageIndex] = useState(0);
  
  const userId = typeof window !== 'undefined' && localStorage.getItem('userId')
    ? localStorage.getItem('userId')
    : (auth.currentUser ? auth.currentUser.uid : 'anon');

  // Definir permissões baseadas nas roles
  const canUpload = userRole && (userRole === 'coordenadora' || userRole === 'professora');
  const canDelete = userRole && userRole === 'coordenadora';

  // Hook para detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    if (typeof window !== 'undefined') {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Buscar fotos do Firebase
  const fetchFotos = async () => {
    try {
      setLoading(true);
      const fotosRef = ref(db, 'fotos');
      const snap = await get(fotosRef);
      if (snap.exists()) {
        const all = snap.val();
        const lista = Object.entries(all).map(([id, f]) => ({ id, ...f }));
        setFotos(lista);
      } else {
        setFotos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('userId:', userId);
    
    // Buscar role do usuário
    const fetchUserRole = async () => {
      if (!userId || userId === 'anon') {
        setRoleChecked(true);
        return;
      }
      try {
        const userRef = ref(db, `usuarios/${userId}`);
        const snap = await get(userRef);
        if (snap.exists()) {
          const userData = snap.val();
          console.log('Dados brutos do usuário (useEffect):', userData);
          setUserRole((userData.role || '').trim().toLowerCase());
        }
      } catch (error) {
        console.error('Erro ao buscar role:', error);
      } finally {
        setRoleChecked(true);
      }
    };

    fetchUserRole();
    fetchFotos();

    if (userId && userId !== 'anon') {
      const userRef = ref(db, `usuarios/${userId}`);
      get(userRef).then(snap => {
        if (snap.exists()) {
          const userData = snap.val();
          console.log('Dados brutos do usuário (useEffect):', userData);
        }
      });
    }
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

  // Buscar informações do criador da foto
  const fetchCreatorInfo = async (creatorId) => {
    if (!creatorId || creatorId === 'anon') {
      setCreatorInfo({ name: 'Usuário Anônimo', role: 'desconhecido' });
      return;
    }
    
    try {
      setLoadingCreator(true);
      const userRef = ref(db, `usuarios/${creatorId}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const userData = snap.val();
        setCreatorInfo({
          name: userData.name || userData.displayName || 'Usuário',
          role: userData.role || 'Usuário',
          email: userData.email || '',
          turmas: userData.turmas || []
        });
      } else {
        setCreatorInfo({ name: 'Usuário não encontrado', role: 'desconhecido' });
      }
    } catch (error) {
      console.error('Erro ao buscar criador:', error);
      setCreatorInfo({ name: 'Erro ao carregar', role: 'erro' });
    } finally {
      setLoadingCreator(false);
    }
  };

  const handleOpenFoto = (foto) => {
    // Se o post tem múltiplas imagens, abrir o modal de carrossel
    if (foto.isCarousel && foto.urls && foto.urls.length > 1) {
      handleOpenCarouselModal(foto);
      return;
    }
    
    // Para imagens únicas, usar o modal original
    const index = fotosFiltradas.findIndex(f => f.id === foto.id);
    setCurrentPhotoIndex(index);
    setFotoSelecionada(foto);
    setModalCarouselIndex(0); // Resetar carrossel do modal
    setOpen(true);
    setIsTransitioning(false); // Reset transition state
    // Buscar informações do criador
    if (foto.createdBy) {
      fetchCreatorInfo(foto.createdBy);
    } else {
      setCreatorInfo({ name: 'Informação não disponível', role: 'desconhecido' });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFotoSelecionada(null);
    setCreatorInfo(null);
    setCurrentPhotoIndex(0);
    setModalCarouselIndex(0); // Reset do carrossel do modal
    setIsTransitioning(false); // Reset transition state
  };

  // Funções de navegação entre fotos
  const navigateToPhoto = (index) => {
    if (index >= 0 && index < fotosFiltradas.length) {
      setIsTransitioning(true);
      
      // Delay para permitir a animação de fade out
      setTimeout(() => {
        const foto = fotosFiltradas[index];
        setCurrentPhotoIndex(index);
        setFotoSelecionada(foto);
        // Buscar informações do criador
        if (foto.createdBy) {
          fetchCreatorInfo(foto.createdBy);
        } else {
          setCreatorInfo({ name: 'Informação não disponível', role: 'desconhecido' });
        }
        
        // Delay adicional para permitir o fade in
        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }, 150);
    }
  };

  const nextPhoto = () => {
    navigateToPhoto(currentPhotoIndex + 1);
  };

  const prevPhoto = () => {
    navigateToPhoto(currentPhotoIndex - 1);
  };

  // Suporte ao teclado
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (open) {
        if (e.key === 'ArrowRight') {
          nextPhoto();
        } else if (e.key === 'ArrowLeft') {
          prevPhoto();
        } else if (e.key === 'Escape') {
          handleClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open]);

  // Formatar data de criação
  const formatarData = (dataISO) => {
    if (!dataISO) return 'Data não disponível';
    try {
      const data = new Date(dataISO);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Função para obter role em português
  const getRoleLabel = (role) => {
    const roles = {
      'pai': 'Pai/Mãe',
      'professora': 'Professora',
      'coordenadora': 'Coordenadora',
      'admin': 'Administrador',
      'professor': 'Professor'
    };
    return roles[role?.toLowerCase()] || role || 'Usuário';
  };

  const handleDeleteFoto = async (id) => {
    try {
      // Buscar dados da foto para obter a URL
      const fotoRef = ref(db, `fotos/${id}`);
      const snap = await get(fotoRef);
      
      if (snap.exists()) {
        const fotoData = snap.val();
        
        // Excluir do Storage se houver URL
        if (fotoData.url) {
          try {
            const imageRef = storageRef(storage, fotoData.url);
            await deleteObject(imageRef);
            console.log('Foto excluída do Storage');
          } catch (storageError) {
            console.error('Erro ao excluir do Storage:', storageError);
            // Continua com a exclusão do banco mesmo se falhar no storage
          }
        }
        
        // Excluir do Realtime Database
        await remove(fotoRef);
        
        // Atualizar estado local
        setFotos(prevFotos => prevFotos.filter(foto => foto.id !== id));
        
        console.log('Foto excluída com sucesso');
      }
    } catch (error) {
      console.error('Erro ao excluir foto:', error);
      alert('Erro ao excluir foto. Tente novamente.');
    }
  };
  
  const handleOpenDeleteDialog = (foto) => {
    setFotoParaExcluir(foto);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (fotoParaExcluir) {
      await handleDeleteFoto(fotoParaExcluir.id);
      setDeleteDialogOpen(false);
      setFotoParaExcluir(null);
      setOpen(false); // Fechar modal de visualização se estiver aberto
    }
  };

  const handleOpenUpload = () => {
    // Verificação adicional de segurança
    if (!canUpload) {
      console.warn('Usuário sem permissão tentou abrir dialog de upload');
      return;
    }
    setUploadDialogOpen(true);
    setNovaFoto({ nome: '', descricao: '', url: '', files: [] });
  };

  const handleUploadFoto = async () => {
    if (novaFoto.nome && novaFoto.files.length > 0) {
      try {
        setUploading(true);
        
        // Validar permissões de turma para professoras
        if (userRole === 'professora') {
          const turmasInvalidas = turmasSelecionadas.filter(turma => 
            turma !== 'todos' && !turmasUsuario.includes(turma)
          );
          if (turmasInvalidas.length > 0) {
            alert('Professoras só podem adicionar fotos nas suas próprias turmas ou como públicas.');
            setUploading(false);
            return;
          }
        }
        
        // Upload de múltiplas imagens
        const uploadPromises = novaFoto.files.map(async (file, index) => {
          const filePath = `fotos/${Date.now()}_${index}_${file.name}`;
          const fileRef = storageRef(storage, filePath);
          await uploadBytes(fileRef, file);
          return await getDownloadURL(fileRef);
        });
        
        const urls = await Promise.all(uploadPromises);
        
        const fotosRef = ref(db, 'fotos');
        await push(fotosRef, {
          nome: novaFoto.nome,
          descricao: novaFoto.descricao || '',
          urls: urls, // Array de URLs para múltiplas imagens
          url: urls[0], // Manter compatibilidade com código existente
          isCarousel: urls.length > 1, // Flag para identificar carrosseis
          imageCount: urls.length,
          turmas: turmasSelecionadas.length > 0 ? turmasSelecionadas : ['todos'],
          likes: [],
          likesCount: 0,
          createdAt: new Date().toISOString(),
          createdBy: userId
        });
        setUploadDialogOpen(false);
        setTurmasSelecionadas([]);
        setNovaFoto({ nome: '', descricao: '', url: '', files: [] });
        await fetchFotos();
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  // Funções para navegação do carrossel
  const handleCarouselNext = (fotoId, totalImages) => {
    setCarouselIndices(prev => ({
      ...prev,
      [fotoId]: ((prev[fotoId] || 0) + 1) % totalImages
    }));
  };

  const handleCarouselPrev = (fotoId, totalImages) => {
    setCarouselIndices(prev => ({
      ...prev,
      [fotoId]: ((prev[fotoId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const handleCarouselDot = (fotoId, index) => {
    setCarouselIndices(prev => ({
      ...prev,
      [fotoId]: index
    }));
  };

  // Funções para navegação do carrossel no modal
  const handleModalCarouselNext = () => {
    if (fotoSelecionada?.urls && fotoSelecionada.urls.length > 1) {
      setModalCarouselIndex(prev => (prev + 1) % fotoSelecionada.urls.length);
    }
  };

  const handleModalCarouselPrev = () => {
    if (fotoSelecionada?.urls && fotoSelecionada.urls.length > 1) {
      setModalCarouselIndex(prev => (prev - 1 + fotoSelecionada.urls.length) % fotoSelecionada.urls.length);
    }
  };

  const handleModalCarouselDot = (index) => {
    setModalCarouselIndex(index);
  };

  // Funções para o novo modal de carrossel
  const handleOpenCarouselModal = (foto) => {
    setSelectedCarouselPost(foto);
    setCarouselImageIndex(0);
    setCarouselModalOpen(true);
  };

  const handleCloseCarouselModal = () => {
    setCarouselModalOpen(false);
    setSelectedCarouselPost(null);
    setCarouselImageIndex(0);
  };

  const handleCarouselModalNext = () => {
    if (selectedCarouselPost?.urls) {
      setCarouselImageIndex(prev => 
        (prev + 1) % selectedCarouselPost.urls.length
      );
    }
  };

  const handleCarouselModalPrev = () => {
    if (selectedCarouselPost?.urls) {
      setCarouselImageIndex(prev => 
        (prev - 1 + selectedCarouselPost.urls.length) % selectedCarouselPost.urls.length
      );
    }
  };

  const handleCarouselModalDotClick = (index) => {
    setCarouselImageIndex(index);
  };

  // Navegação por teclado para o modal de carrossel
  useEffect(() => {
    const handleCarouselKeyPress = (e) => {
      if (!carouselModalOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handleCarouselModalPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleCarouselModalNext();
          break;
        case 'Escape':
          e.preventDefault();
          handleCloseCarouselModal();
          break;
      }
    };

    if (carouselModalOpen) {
      window.addEventListener('keydown', handleCarouselKeyPress);
    }

    return () => {
      window.removeEventListener('keydown', handleCarouselKeyPress);
    };
  }, [carouselModalOpen]);

  const handleLike = async (fotoId) => {
    try {
      setLikingPhoto(fotoId);
      const fotoRef = ref(db, `fotos/${fotoId}`);
      const snap = await get(fotoRef);
      if (snap.exists()) {
        const fotoData = snap.val();
        let likesArr = fotoData.likes || [];
        likesArr = Array.isArray(likesArr) ? likesArr : Object.values(likesArr);
        
        const isLiked = likesArr.includes(userId);
        if (!isLiked) {
          likesArr = [...likesArr, userId];
        } else {
          likesArr = likesArr.filter(id => id !== userId);
        }
        
        const newLikesCount = likesArr.length;
        await set(fotoRef, { ...fotoData, likes: likesArr, likesCount: newLikesCount });
        
        // Atualizar estado local sem refetch completo
        setFotos(prevFotos => 
          prevFotos.map(foto => 
            foto.id === fotoId 
              ? { ...foto, likes: likesArr, likesCount: newLikesCount }
              : foto
          )
        );
        
        // Atualizar foto selecionada se estiver aberta no modal
        if (fotoSelecionada && fotoSelecionada.id === fotoId) {
          setFotoSelecionada(prev => ({
            ...prev,
            likes: likesArr,
            likesCount: newLikesCount
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao curtir foto:', error);
    } finally {
      setLikingPhoto(null);
    }
  };

  // Filtrar fotos baseado no filtro selecionado
  const fotosFiltradas = fotos.filter(foto => {
    // Filtro por turma
    if (!foto.turmas) return true;
    let turmasFoto = [];
    if (Array.isArray(foto.turmas)) turmasFoto = foto.turmas;
    else if (typeof foto.turmas === 'object' && foto.turmas !== null) turmasFoto = Object.values(foto.turmas);
    else if (typeof foto.turmas === 'string') turmasFoto = [foto.turmas];
    
    // Para PAI: só pode ver fotos das suas turmas vinculadas ou públicas
    let temAcessoTurma;
    if (userRole === 'coordenadora') {
      // COORDENADORA vê todas as fotos
      temAcessoTurma = true;
    } else if (userRole === 'professora') {
      // PROFESSORA vê fotos públicas ou das suas turmas
      temAcessoTurma = turmasFoto.includes('todos') || 
                      turmasUsuario.some(t => turmasFoto.includes(t));
    } else if (userRole === 'pai') {
      // PAI vê fotos públicas ou das suas turmas
      temAcessoTurma = turmasFoto.includes('todos') || 
                      turmasUsuario.some(t => turmasFoto.includes(t));
    } else {
      // Outros roles ou casos especiais
      temAcessoTurma = turmasFoto.includes('todos') || 
                      turmasUsuario.some(t => turmasFoto.includes(t)) || 
                      turmasUsuario.length === 0;
    }
    
    const matchFiltro = !filtroTurma || turmasFoto.includes(filtroTurma) || filtroTurma === 'todos';
    
    return temAcessoTurma && matchFiltro;
  });

  console.log('Fotos:', fotos);
  console.log('Turmas do usuário:', turmasUsuario);
  console.log('Role do usuário:', userRole);
  console.log('Fotos filtradas:', fotosFiltradas.length);

  return (
    <ProtectedRoute>
      <Box display="flex" minHeight="100vh" bgcolor="#f5f5f5">
        <SidebarMenu />
        
        <Box flexGrow={1} sx={{ p: { xs: 1, sm: 2, md: 4 } }}>
          {/* Header Moderno */}
          <Paper sx={{ 
            p: { xs: 3, md: 4 }, 
            mb: { xs: 3, md: 4 }, 
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            color: 'white',
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
              <Box>
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Photo sx={{ fontSize: { xs: 32, md: 40 } }} />
                  <Typography 
                    variant="h4" 
                    fontWeight="bold"
                    sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
                  >
                    Galeria de Fotos
                  </Typography>
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    opacity: 0.9,
                    fontSize: { xs: '1.1rem', md: '1.25rem' }
                  }}
                >
                  {loading ? 'Carregando...' : `${fotosFiltradas.length} ${fotosFiltradas.length === 1 ? 'foto' : 'fotos'} encontradas`}
                </Typography>
                {userRole === 'pai' && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.8, 
                      mt: 1,
                      fontSize: { xs: '0.8rem', md: '0.875rem' }
                    }}
                  >
                    👀 Modo visualização - Acesso a {turmasUsuario.filter(t => t !== 'todos').length} turma(s) + fotos públicas
                  </Typography>
                )}
                {userRole === 'professora' && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.8, 
                      mt: 1,
                      fontSize: { xs: '0.8rem', md: '0.875rem' }
                    }}
                  >
                    📚 Modo professora - Pode adicionar fotos nas suas turmas
                  </Typography>
                )}
                {userRole === 'coordenadora' && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.8, 
                      mt: 1,
                      fontSize: { xs: '0.8rem', md: '0.875rem' }
                    }}
                  >
                    🔑 Modo coordenadora - Acesso total: ver, adicionar e excluir fotos
                  </Typography>
                )}
              </Box>
              {canUpload && (
                <Button
                  variant="contained"
                  startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                  onClick={handleOpenUpload}
                  disabled={uploading}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                    '&:disabled': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                  size="large"
                >
                  {uploading ? 'Enviando...' : 'Nova Foto'}
                </Button>
              )}
            </Box>
          </Paper>

          {/* Filtros Modernos */}
          <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 4 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <FilterList color="primary" />
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                color="primary"
                sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
              >
                Filtros
              </Typography>
            </Box>
            <Box 
              display="flex" 
              gap={{ xs: 1, md: 2 }} 
              flexWrap="wrap" 
              alignItems="center"
              flexDirection={{ xs: 'column', sm: 'row' }}
            >
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: { xs: '100%', sm: 200 },
                  maxWidth: { xs: '100%', sm: 'none' }
                }}
              >
                <InputLabel>Filtrar por turma</InputLabel>
                <Select
                  value={filtroTurma}
                  label="Filtrar por turma"
                  onChange={(e) => setFiltroTurma(e.target.value)}
                >
                  <MenuItem value="">Todas as turmas</MenuItem>
                  <MenuItem value="todos">Públicas (Todos)</MenuItem>
                  {/* Filtrar turmas baseado na role */}
                  {userRole === 'coordenadora' 
                    ? turmas.map((turma, idx) => (
                        <MenuItem key={idx} value={turma}>{turma}</MenuItem>
                      ))
                    : (userRole === 'professora' || userRole === 'pai')
                    ? turmasUsuario.filter(turma => turma !== 'todos').map((turma, idx) => (
                        <MenuItem key={idx} value={turma}>{turma}</MenuItem>
                      ))
                    : turmas.map((turma, idx) => (
                        <MenuItem key={idx} value={turma}>{turma}</MenuItem>
                      ))
                  }
                </Select>
              </FormControl>
              {filtroTurma && (
                <Chip 
                  label={`Filtro: ${filtroTurma === 'todos' ? 'Públicas' : filtroTurma}`}
                  onDelete={() => setFiltroTurma('')}
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    alignSelf: { xs: 'flex-start', sm: 'center' },
                    fontSize: { xs: '0.8rem', md: '0.875rem' }
                  }}
                />
              )}
            </Box>
          </Paper>

          {/* Galeria de Fotos */}
          {loading ? (
            <Grid container spacing={3}>
              {[...Array(8)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card sx={{ borderRadius: 4 }}>
                    <Skeleton variant="rectangular" width="100%" height={200} />
                    <CardContent>
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width="40%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : fotosFiltradas.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
              <Image sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Nenhuma foto encontrada
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                {filtroTurma ? 'Tente ajustar os filtros' : 
                 userRole === 'pai' ? 'Aguarde novas fotos serem adicionadas' :
                 userRole === 'professora' ? 'Comece adicionando fotos da sua turma' :
                 'Comece'} 
                {(userRole === 'coordenadora' || userRole === 'professora') && !filtroTurma && ' adicionando uma nova foto à galeria'}
              </Typography>
              {canUpload && (
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={handleOpenUpload}
                  size="large"
                >
                  Adicionar Primeira Foto
                </Button>
              )}
            </Paper>
          ) : (
            <Box sx={{ 
              maxWidth: { xs: '100%', sm: 600, md: 700 }, 
              mx: 'auto',
              px: { xs: 1, md: 0 }
            }}>
              {fotosFiltradas.map((foto) => (
                <Card 
                  key={foto.id}
                  sx={{ 
                    mb: { xs: 2, md: 3 },
                    borderRadius: { xs: 2, md: 3 },
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {/* Header do Post */}
                  <Box sx={{ 
                    p: { xs: 1.5, md: 2 }, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 1.5, md: 2 },
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <Box
                      sx={{
                        width: { xs: 36, md: 40 },
                        height: { xs: 36, md: 40 },
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: { xs: '0.8rem', md: '0.9rem' }
                      }}
                    >
                      📸
                    </Box>
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                        {foto.nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.8125rem' } }}>
                        {formatarData(foto.createdAt)}
                      </Typography>
                    </Box>
                    
                    {/* Ações do header */}
                    <Box display="flex" gap={1}>
                      {canDelete && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteDialog(foto);
                          }}
                          sx={{ 
                            color: 'text.secondary',
                            '&:hover': { color: 'error.main' }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  {/* Imagem do Post ou Carrossel */}
                  <Box 
                    sx={{ 
                      position: 'relative',
                      aspectRatio: '1',
                      backgroundColor: '#f5f5f5',
                      cursor: 'pointer',
                      overflow: 'hidden'
                    }}
                    onClick={() => handleOpenFoto(foto)}
                  >
                    {foto.isCarousel && foto.urls && foto.urls.length > 1 ? (
                      // Carrossel estilo Instagram
                      <>
                        {/* Container das imagens */}
                        <Box
                          sx={{
                            display: 'flex',
                            width: `${foto.urls.length * 100}%`,
                            height: '100%',
                            transform: `translateX(-${(carouselIndices[foto.id] || 0) * (100 / foto.urls.length)}%)`,
                            transition: 'transform 0.3s ease-in-out'
                          }}
                        >
                          {foto.urls.map((url, index) => (
                            <Box
                              key={index}
                              sx={{
                                width: `${100 / foto.urls.length}%`,
                                height: '100%',
                                flexShrink: 0
                              }}
                            >
                              <img 
                                src={url} 
                                alt={`${foto.nome} - ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </Box>
                          ))}
                        </Box>

                        {/* Indicador de múltiplas fotos */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            borderRadius: '12px',
                            px: 1,
                            py: 0.5,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          <Photo sx={{ fontSize: 12 }} />
                          {(carouselIndices[foto.id] || 0) + 1}/{foto.urls.length}
                        </Box>

                        {/* Botões de navegação */}
                        {foto.urls.length > 1 && (
                          <>
                            <IconButton
                              sx={{
                                position: 'absolute',
                                left: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                color: '#333',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                  backgroundColor: 'white'
                                },
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCarouselPrev(foto.id, foto.urls.length);
                              }}
                              size="small"
                            >
                              <ArrowBackIos sx={{ fontSize: 14, ml: 0.5 }} />
                            </IconButton>

                            <IconButton
                              sx={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                color: '#333',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                  backgroundColor: 'white'
                                },
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCarouselNext(foto.id, foto.urls.length);
                              }}
                              size="small"
                            >
                              <ArrowForwardIos sx={{ fontSize: 14 }} />
                            </IconButton>
                          </>
                        )}

                        {/* Indicadores de posição (dots) */}
                        {foto.urls.length > 1 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 12,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              display: 'flex',
                              gap: 0.5,
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                              borderRadius: '12px',
                              px: 1,
                              py: 0.5
                            }}
                          >
                            {foto.urls.map((_, index) => (
                              <Box
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCarouselDot(foto.id, index);
                                }}
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: (carouselIndices[foto.id] || 0) === index ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </>
                    ) : (
                      // Imagem única (comportamento original)
                      <img 
                        src={foto.url || (foto.urls && foto.urls[0])} 
                        alt={foto.nome}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      />
                    )}
                  </Box>

                  {/* Footer do Post */}
                  <Box sx={{ p: { xs: 1.5, md: 2 } }}>
                    {/* Ações principais */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 }, mb: 1 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(foto.id);
                        }}
                        disabled={likingPhoto === foto.id}
                        sx={{ 
                          color: foto.likes?.includes(userId) ? '#e53935' : 'text.secondary',
                          '&:hover': { color: '#e53935' },
                          p: { xs: 0.5, md: 1 }
                        }}
                      >
                        {likingPhoto === foto.id ? (
                          <CircularProgress size={16} />
                        ) : foto.likes?.includes(userId) ? (
                          <Favorite sx={{ fontSize: { xs: 18, md: 20 } }} />
                        ) : (
                          <FavoriteBorder sx={{ fontSize: { xs: 18, md: 20 } }} />
                        )}
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        onClick={() => handleOpenFoto(foto)}
                        sx={{ 
                          color: 'text.secondary',
                          p: { xs: 0.5, md: 1 }
                        }}
                      >
                        <Visibility sx={{ fontSize: { xs: 18, md: 20 } }} />
                      </IconButton>
                    </Box>

                    {/* Contador de curtidas */}
                    {foto.likesCount > 0 && (
                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        sx={{ 
                          mb: 1,
                          fontSize: { xs: '0.8rem', md: '0.875rem' }
                        }}
                      >
                        {foto.likesCount} curtida{foto.likesCount !== 1 ? 's' : ''}
                      </Typography>
                    )}

                    {/* Descrição estilo Instagram */}
                    {foto.descricao && (
                      <Box sx={{ mb: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: { xs: '0.875rem', md: '0.9rem' },
                            lineHeight: 1.4,
                            color: 'text.primary'
                          }}
                        >
                          <span style={{ fontWeight: 'bold', marginRight: '8px' }}>
                            {foto.nome}
                          </span>
                          {foto.descricao}
                        </Typography>
                      </Box>
                    )}

                    {/* Turmas (discreto) */}
                    {foto.turmas && foto.turmas.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.3, md: 0.5 } }}>
                        {foto.turmas.map((turma, idx) => (
                          <Chip 
                            key={idx}
                            label={turma === 'todos' ? 'Público' : turma}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontSize: { xs: '0.7rem', md: '0.75rem' },
                              height: { xs: 18, md: 20 },
                              color: 'text.secondary',
                              borderColor: 'divider'
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Card>
              ))}
            </Box>
          )}

          {/* Dialog de Visualização - Minimalista */}
          <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="md" 
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
              sx: {
                borderRadius: { xs: 0, md: 3 },
                bgcolor: { xs: '#000', md: 'rgba(0, 0, 0, 0.95)' },
                backdropFilter: 'blur(10px)',
                maxHeight: '95vh',
                m: { xs: 0, md: 2 }
              }
            }}
          >
            {/* Header minimalista */}
            <Box sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              p: { xs: 1.5, md: 2 },
              background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
              zIndex: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, md: 2 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 'bold',
                    fontSize: { xs: '1rem', md: '1.25rem' }
                  }}
                >
                  {fotoSelecionada?.nome}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Contador de fotos */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    fontSize: { xs: '0.75rem', md: '0.8rem' }
                  }}
                >
                  {currentPhotoIndex + 1} / {fotosFiltradas.length}
                </Typography>
                
                <IconButton 
                  onClick={handleClose} 
                  sx={{ 
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                    p: { xs: 1, md: 1.5 }
                  }}
                >
                  <Close sx={{ fontSize: { xs: 20, md: 24 } }} />
                </IconButton>
              </Box>
            </Box>
            
            <DialogContent 
              sx={{ 
                p: 0, 
                position: 'relative', 
                backgroundColor: '#000',
                overflow: 'hidden',
                userSelect: 'none'
              }}
            >
              {fotoSelecionada && (
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: { xs: '100vh', md: '70vh' },
                    position: 'relative',
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                    transition: 'all 0.3s ease-in-out',
                    opacity: isTransitioning ? 0.8 : 1
                  }}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    e.currentTarget.touchStartX = touch.clientX;
                  }}
                  onTouchEnd={(e) => {
                    const touch = e.changedTouches[0];
                    const startX = e.currentTarget.touchStartX;
                    const endX = touch.clientX;
                    const diff = startX - endX;
                    
                    if (Math.abs(diff) > 50) { // Mínimo de 50px para considerar swipe
                      if (diff > 0) {
                        nextPhoto(); // Swipe para esquerda = próxima foto
                      } else {
                        prevPhoto(); // Swipe para direita = foto anterior
                      }
                    }
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.mouseStartX = e.clientX;
                  }}
                  onMouseUp={(e) => {
                    const startX = e.currentTarget.mouseStartX;
                    const endX = e.clientX;
                    const diff = startX - endX;
                    
                    if (Math.abs(diff) > 50) {
                      if (diff > 0) {
                        nextPhoto();
                      } else {
                        prevPhoto();
                      }
                    }
                  }}
                >
                  {/* Seta Esquerda */}
                  {currentPhotoIndex > 0 && (
                    <IconButton
                      onClick={prevPhoto}
                      sx={{
                        position: 'absolute',
                        left: { xs: 8, md: 16 },
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': { 
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          transform: 'translateY(-50%) scale(1.1)'
                        },
                        transition: 'all 0.2s ease',
                        p: { xs: 1, md: 1.5 }
                      }}
                    >
                      <ArrowBackIos sx={{ fontSize: { xs: 18, md: 24 } }} />
                    </IconButton>
                  )}
                  
                  {/* Seta Direita */}
                  {currentPhotoIndex < fotosFiltradas.length - 1 && (
                    <IconButton
                      onClick={nextPhoto}
                      sx={{
                        position: 'absolute',
                        right: { xs: 8, md: 16 },
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': { 
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          transform: 'translateY(-50%) scale(1.1)'
                        },
                        transition: 'all 0.2s ease',
                        p: { xs: 1, md: 1.5 }
                      }}
                    >
                      <ArrowForwardIos sx={{ fontSize: { xs: 18, md: 24 } }} />
                    </IconButton>
                  )}
                  
                  <img 
                    src={fotoSelecionada.url} 
                    alt={fotoSelecionada.nome} 
                    style={{ 
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      opacity: isTransitioning ? 0 : 1,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isTransitioning ? 'scale(0.96) translateY(10px)' : 'scale(1) translateY(0)',
                      filter: isTransitioning ? 'blur(3px)' : 'blur(0px)'
                    }} 
                  />
                </Box>
              )}
            </DialogContent>

            {/* Footer discreto com informações essenciais */}
            <Box sx={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: { xs: 2, md: 3 },
              background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
              color: 'white'
            }}>
              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', md: 'center' }}
                flexDirection={{ xs: 'column', md: 'row' }}
                gap={{ xs: 2, md: 0 }}
              >
                {/* Informações básicas */}
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.7, 
                      mb: 0.5,
                      fontSize: { xs: '0.8rem', md: '0.875rem' }
                    }}
                  >
                    {formatarData(fotoSelecionada?.createdAt)}
                  </Typography>
                  
                  {/* Descrição no modal */}
                  {fotoSelecionada?.descricao && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'white',
                        mb: 1,
                        fontSize: { xs: '0.85rem', md: '0.9rem' },
                        lineHeight: 1.4,
                        opacity: 0.9
                      }}
                    >
                      {fotoSelecionada.descricao}
                    </Typography>
                  )}
                  
                  {fotoSelecionada?.turmas && (
                    <Box display="flex" gap={{ xs: 0.5, md: 1 }} flexWrap="wrap">
                      {fotoSelecionada.turmas.map((turma, idx) => (
                        <Chip 
                          key={idx}
                          label={turma === 'todos' ? 'Público' : turma}
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: { xs: '0.7rem', md: '0.75rem' },
                            height: { xs: 20, md: 24 }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Ações principais */}
                <Box display="flex" alignItems="center" gap={{ xs: 1.5, md: 2 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        if (fotoSelecionada?.id) {
                          handleLike(fotoSelecionada.id);
                        }
                      }}
                      disabled={!fotoSelecionada?.id || likingPhoto === fotoSelecionada?.id}
                      sx={{ 
                        color: fotoSelecionada?.likes?.includes(userId) ? '#e53935' : 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                        p: { xs: 1, md: 1.5 }
                      }}
                    >
                      {likingPhoto === fotoSelecionada?.id ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : fotoSelecionada?.likes?.includes(userId) ? (
                        <Favorite sx={{ fontSize: { xs: 18, md: 20 } }} />
                      ) : (
                        <FavoriteBorder sx={{ fontSize: { xs: 18, md: 20 } }} />
                      )}
                    </IconButton>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        minWidth: 40,
                        fontSize: { xs: '0.8rem', md: '0.875rem' }
                      }}
                    >
                      {fotoSelecionada?.likesCount || 0}
                    </Typography>
                  </Box>

                  {canDelete && fotoSelecionada?.id && (
                    <IconButton
                      onClick={() => {
                        if (fotoSelecionada?.id) {
                          handleOpenDeleteDialog(fotoSelecionada);
                        }
                      }}
                      sx={{ 
                        color: 'white',
                        backgroundColor: 'rgba(244, 67, 54, 0.3)',
                        '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.5)' },
                        p: { xs: 1, md: 1.5 }
                      }}
                    >
                      <Delete sx={{ fontSize: { xs: 18, md: 20 } }} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>
          </Dialog>

          {/* Dialog de Upload - Apenas para usuários autorizados */}
          {canUpload && (
            <Dialog 
              open={uploadDialogOpen} 
              onClose={() => setUploadDialogOpen(false)} 
              maxWidth="sm" 
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 4,
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)'
                }
              }}
            >
            <DialogTitle sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              borderBottom: '1px solid #e0e0e0'
            }}>
              <CloudUpload color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Nova Foto
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                <TextField
                  fullWidth
                  label="Nome da foto"
                  value={novaFoto.nome}
                  onChange={e => setNovaFoto({ ...novaFoto, nome: e.target.value })}
                  variant="outlined"
                  required
                />
                
                <TextField
                  fullWidth
                  label="Descrição da foto (opcional)"
                  value={novaFoto.descricao}
                  onChange={e => setNovaFoto({ ...novaFoto, descricao: e.target.value })}
                  variant="outlined"
                  multiline
                  rows={3}
                  placeholder="Adicione uma descrição para sua foto..."
                  helperText="Conte sobre sua foto, mencione pessoas, lugares ou momentos especiais!"
                />
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                    Selecionar Arquivos
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => setNovaFoto({ ...novaFoto, files: Array.from(e.target.files) })}
                    style={{ 
                      width: '100%',
                      padding: '12px',
                      border: '2px dashed #6366f1',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      fontSize: '16px'
                    }}
                  />
                  {novaFoto.files.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="primary">
                        {novaFoto.files.length} arquivo(s) selecionado(s)
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {novaFoto.files.map((file, index) => (
                          <Chip 
                            key={index}
                            label={file.name}
                            size="small"
                            color="primary"
                            variant="outlined"
                            onDelete={() => {
                              const newFiles = novaFoto.files.filter((_, i) => i !== index);
                              setNovaFoto({ ...novaFoto, files: newFiles });
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Turmas que podem visualizar</InputLabel>
                  <Select
                    multiple
                    value={turmasSelecionadas}
                    label="Turmas que podem visualizar"
                    onChange={e => setTurmasSelecionadas(e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip 
                            key={value} 
                            label={value === 'todos' ? 'Todos' : value}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="todos">Todos (Público)</MenuItem>
                    {/* Mostrar turmas baseado na role */}
                    {userRole === 'coordenadora' 
                      ? turmas.map((turma, idx) => (
                          <MenuItem key={idx} value={turma}>{turma}</MenuItem>
                        ))
                      : userRole === 'professora'
                      ? turmasUsuario.filter(turma => turma !== 'todos').map((turma, idx) => (
                          <MenuItem key={idx} value={turma}>{turma}</MenuItem>
                        ))
                      : turmas.map((turma, idx) => (
                          <MenuItem key={idx} value={turma}>{turma}</MenuItem>
                        ))
                    }
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0', gap: 2 }}>
              <Button 
                onClick={() => setUploadDialogOpen(false)}
                variant="outlined"
                sx={{ borderRadius: 3 }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUploadFoto}
                variant="contained"
                disabled={!novaFoto.nome || novaFoto.files.length === 0 || uploading}
                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                sx={{ borderRadius: 3, minWidth: 120 }}
              >
                {uploading ? 'Enviando...' : 'Enviar'}
              </Button>
            </DialogActions>
          </Dialog>
          )}

          {/* Backdrop para uploads */}
          <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={uploading}
          >
            <Box textAlign="center">
              <CircularProgress color="inherit" size={60} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Enviando foto...
              </Typography>
            </Box>
          </Backdrop>

          {/* Modal de Confirmação para Exclusão */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 4,
                p: 2
              }
            }}
          >
            <DialogTitle sx={{ 
              textAlign: 'center',
              pb: 1,
              color: 'error.main',
              fontWeight: 'bold'
            }}>
              ⚠️ Confirmar Exclusão
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Tem certeza que deseja excluir esta foto?
              </Typography>
              {fotoParaExcluir && (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 2
                }}>
                  <img 
                    src={fotoParaExcluir.url} 
                    alt={fotoParaExcluir.nome}
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                  <Typography variant="subtitle2" fontWeight="bold">
                    {fotoParaExcluir.nome}
                  </Typography>
                </Box>
              )}
              <Typography variant="body2" color="error.main" sx={{ mt: 2, fontWeight: 500 }}>
                Esta ação não pode ser desfeita!
              </Typography>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                variant="outlined"
                size="large"
                sx={{ minWidth: 120 }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmDelete}
                variant="contained"
                color="error"
                size="large"
                sx={{ minWidth: 120 }}
              >
                Excluir
              </Button>
            </DialogActions>
          </Dialog>

          {/* Novo Modal de Carrossel para múltiplas imagens */}
          <Dialog
            open={carouselModalOpen}
            onClose={handleCloseCarouselModal}
            maxWidth={false}
            fullScreen
            PaperProps={{
              sx: {
                backgroundColor: '#000',
                margin: 0,
                maxHeight: '100vh',
                height: '100vh'
              }
            }}
          >
            {/* Header do Modal de Carrossel */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 30,
              p: 2,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  {selectedCarouselPost?.nome || 'Galeria de Fotos'}
                </Typography>
                <Chip
                  icon={<Photo sx={{ fontSize: 16 }} />}
                  label={`${carouselImageIndex + 1}/${selectedCarouselPost?.urls?.length || 0}`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                {/* Botão de Like */}
                <IconButton
                  onClick={() => selectedCarouselPost?.id && handleLike(selectedCarouselPost.id)}
                  disabled={likingPhoto === selectedCarouselPost?.id}
                  sx={{ color: selectedCarouselPost?.likes?.includes(userId) ? '#e53935' : 'white' }}
                >
                  {likingPhoto === selectedCarouselPost?.id ? (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  ) : selectedCarouselPost?.likes?.includes(userId) ? (
                    <Favorite />
                  ) : (
                    <FavoriteBorder />
                  )}
                </IconButton>
                
                {/* Botão de Fechar */}
                <IconButton
                  onClick={handleCloseCarouselModal}
                  sx={{ color: 'white' }}
                >
                  <Close />
                </IconButton>
              </Box>
            </Box>

            {/* Conteúdo Principal */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              position: 'relative',
              overflow: 'hidden'
            }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              e.currentTarget.touchStartX = touch.clientX;
            }}
            onTouchEnd={(e) => {
              const touch = e.changedTouches[0];
              const startX = e.currentTarget.touchStartX;
              const endX = touch.clientX;
              const diff = startX - endX;
              
              if (Math.abs(diff) > 50) {
                if (diff > 0) {
                  handleCarouselModalNext(); // Swipe esquerda = próxima
                } else {
                  handleCarouselModalPrev(); // Swipe direita = anterior
                }
              }
            }}
            >
              {selectedCarouselPost?.urls && (
                <>
                  {/* Imagem Atual */}
                  <img
                    src={selectedCarouselPost.urls[carouselImageIndex]}
                    alt={`${selectedCarouselPost.nome} - ${carouselImageIndex + 1}`}
                    style={{
                      maxWidth: '90%',
                      maxHeight: '80%',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                  />

                  {/* Botões de Navegação */}
                  {selectedCarouselPost.urls.length > 1 && (
                    <>
                      <IconButton
                        onClick={handleCarouselModalPrev}
                        sx={{
                          position: 'absolute',
                          left: { xs: 8, md: 16 },
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': { 
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            transform: 'translateY(-50%) scale(1.1)'
                          },
                          transition: 'all 0.2s ease',
                          p: { xs: 1, md: 1.5 }
                        }}
                      >
                        <ArrowBackIos sx={{ fontSize: { xs: 18, md: 24 }, ml: 0.5 }} />
                      </IconButton>

                      <IconButton
                        onClick={handleCarouselModalNext}
                        sx={{
                          position: 'absolute',
                          right: { xs: 8, md: 16 },
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': { 
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            transform: 'translateY(-50%) scale(1.1)'
                          },
                          transition: 'all 0.2s ease',
                          p: { xs: 1, md: 1.5 }
                        }}
                      >
                        <ArrowForwardIos sx={{ fontSize: { xs: 18, md: 24 } }} />
                      </IconButton>
                    </>
                  )}
                </>
              )}
            </Box>

            {/* Footer com informações e navegação */}
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 30,
              p: 3,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)',
              color: 'white'
            }}>
              {/* Indicadores de posição */}
              {selectedCarouselPost?.urls && selectedCarouselPost.urls.length > 1 && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 2
                }}>
                  {selectedCarouselPost.urls.map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => handleCarouselModalDotClick(index)}
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: carouselImageIndex === index ? 'white' : 'rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: carouselImageIndex === index ? 'white' : 'rgba(255, 255, 255, 0.7)',
                          transform: 'scale(1.2)'
                        }
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Informações do post */}
              <Box sx={{ textAlign: 'center' }}>
                {selectedCarouselPost?.descricao && (
                  <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                    {selectedCarouselPost.descricao}
                  </Typography>
                )}
                
                <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
                  {/* Contador de curtidas */}
                  {selectedCarouselPost?.likesCount > 0 && (
                    <Typography variant="body2" fontWeight="bold">
                      {selectedCarouselPost.likesCount} curtida{selectedCarouselPost.likesCount !== 1 ? 's' : ''}
                    </Typography>
                  )}
                  
                  {/* Data */}
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    {formatarData(selectedCarouselPost?.createdAt)}
                  </Typography>
                  
                  {/* Turmas */}
                  {selectedCarouselPost?.turmas && (
                    <Box display="flex" gap={1}>
                      {selectedCarouselPost.turmas.map((turma, idx) => (
                        <Chip 
                          key={idx}
                          label={turma === 'todos' ? 'Público' : turma}
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Dialog>
        </Box>
      </Box>
    </ProtectedRoute>
  );
}
