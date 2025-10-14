"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tab,
  Tabs,
  CardActions,
  CardHeader,
  Avatar,
  Menu
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  LibraryBooks as LibraryBooksIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  VideoLibrary as VideoIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { ref, onValue, push, update, remove } from 'firebase/database';
;
import { useAuthUser } from '../../../hooks/useAuthUser';
import { auditService } from '../../../services/auditService';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';

const BibliotecaMateriais = () => {
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  const { user, userRole } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [materiais, setMateriais] = useState({});
  const [turmas, setTurmas] = useState({});
  const [disciplinas, setDisciplinas] = useState({});
  
  // Estados de navegação
  const [tabAtual, setTabAtual] = useState(0);
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  
  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [materialEditando, setMaterialEditando] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoria: 'documento',
    disciplinaId: '',
    turmaId: '',
    tags: '',
    tipoAcesso: 'privado',
    link: '',
    observacoes: ''
  });

  // Estados de visualização
  const [materiaisOrganizados, setMateriaisOrganizados] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [materialSelecionado, setMaterialSelecionado] = useState(null);

  // Categorias de materiais
  const categorias = {
    documento: { nome: 'Documento', icon: <DocIcon />, cor: '#2196F3' },
    planilha: { nome: 'Planilha', icon: <AssignmentIcon />, cor: '#4CAF50' },
    apresentacao: { nome: 'Apresentação', icon: <LibraryBooksIcon />, cor: '#FF9800' },
    video: { nome: 'Vídeo', icon: <VideoIcon />, cor: '#F44336' },
    imagem: { nome: 'Imagem', icon: <ImageIcon />, cor: '#9C27B0' },
    pdf: { nome: 'PDF', icon: <PdfIcon />, cor: '#795548' },
    atividade: { nome: 'Atividade', icon: <AssignmentIcon />, cor: '#00BCD4' },
    avaliacao: { nome: 'Avaliação', icon: <SchoolIcon />, cor: '#E91E63' },
    outro: { nome: 'Outro', icon: <ArchiveIcon />, cor: '#607D8B' }
  };

  const statusAprovacao = {
    pendente: { nome: 'Pendente', icon: <PendingIcon />, cor: '#FF9800' },
    aprovado: { nome: 'Aprovado', icon: <CheckCircleIcon />, cor: '#4CAF50' },
    rejeitado: { nome: 'Rejeitado', icon: <CancelIcon />, cor: '#F44336' }
  };

  const tiposAcesso = {
    privado: { nome: 'Privado', descricao: 'Apenas você pode ver' },
    turma: { nome: 'Turma', descricao: 'Compartilhado com a turma' },
    disciplina: { nome: 'Disciplina', descricao: 'Todos da disciplina' },
    publico: { nome: 'Público', descricao: 'Todos os professores' }
  };

  useEffect(() => {
    if (user?.uid) {
      carregarDados();
    }
  }, [user]);

  useEffect(() => {
    organizarMateriais();
  }, [materiais, categoriaFiltro, statusFiltro, tabAtual]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const refs = {
        materiais: ref(db, 'biblioteca-materiais'),
        turmas: ref(db, 'turmas'),
        disciplinas: ref(db, 'disciplinas')
      };

      // Listeners
      const unsubscribes = [];

      unsubscribes.push(
        onValue(refs.materiais, (snapshot) => {
          setMateriais(snapshot.val() || {});
        })
      );

      unsubscribes.push(
        onValue(refs.turmas, (snapshot) => {
          setTurmas(snapshot.val() || {});
        })
      );

      unsubscribes.push(
        onValue(refs.disciplinas, (snapshot) => {
          setDisciplinas(snapshot.val() || {});
        })
      );

      return () => unsubscribes.forEach(unsub => unsub());
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizarMateriais = () => {
    const materiaisArray = Object.entries(materiais).map(([id, material]) => ({
      id,
      ...material
    }));

    // Filtrar baseado na aba atual
    let materiaisFiltrados = materiaisArray;
    
    if (tabAtual === 0) { // Meus Materiais
      materiaisFiltrados = materiaisArray.filter(material => 
        material.criadoPor === user?.uid
      );
    } else if (tabAtual === 1) { // Compartilhados
      materiaisFiltrados = materiaisArray.filter(material => 
        material.criadoPor !== user?.uid && 
        (material.tipoAcesso === 'publico' || 
         (material.tipoAcesso === 'disciplina' && material.disciplinaId) ||
         (material.tipoAcesso === 'turma' && material.turmaId))
      );
    } else if (tabAtual === 2) { // Aprovações (só coordenadores)
      materiaisFiltrados = materiaisArray.filter(material => 
        material.statusAprovacao === 'pendente'
      );
    }

    // Filtrar por categoria
    if (categoriaFiltro !== 'todas') {
      materiaisFiltrados = materiaisFiltrados.filter(material => 
        material.categoria === categoriaFiltro
      );
    }

    // Filtrar por status
    if (statusFiltro !== 'todos') {
      materiaisFiltrados = materiaisFiltrados.filter(material => 
        material.statusAprovacao === statusFiltro
      );
    }

    // Ordenar por data (mais recentes primeiro)
    materiaisFiltrados.sort((a, b) => {
      const dataA = new Date(a.criadoEm || 0);
      const dataB = new Date(b.criadoEm || 0);
      return dataB - dataA;
    });

    setMateriaisOrganizados(materiaisFiltrados);
  };

  const abrirModal = (material = null) => {
    if (material) {
      setMaterialEditando(material);
      setFormData({
        titulo: material.titulo || '',
        descricao: material.descricao || '',
        categoria: material.categoria || 'documento',
        disciplinaId: material.disciplinaId || '',
        turmaId: material.turmaId || '',
        tags: material.tags?.join(', ') || '',
        tipoAcesso: material.tipoAcesso || 'privado',
        link: material.link || '',
        observacoes: material.observacoes || ''
      });
    } else {
      setMaterialEditando(null);
      setFormData({
        titulo: '',
        descricao: '',
        categoria: 'documento',
        disciplinaId: '',
        turmaId: '',
        tags: '',
        tipoAcesso: 'privado',
        link: '',
        observacoes: ''
      });
    }
    setModalOpen(true);
  };

  const salvarMaterial = async () => {
    if (!formData.titulo || !formData.descricao) {
      alert('Título e descrição são obrigatórios.');
      return;
    }

    try {
      const materialData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        statusAprovacao: (userRole === 'coordenador' || userRole === 'coordenadora') ? 'aprovado' : 'pendente',
        criadoPor: user.uid,
        criadoPorNome: user.displayName || user.email,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };

      if (materialEditando) {
        await updateData('biblioteca-materiais/${materialEditando.id}', materialData);
        await auditService.logAction(
          'material_update',
          user.uid,
          {
            description: `Atualizou material: ${formData.titulo}`,
            materialId: materialEditando.id
          }
        );
      } else {
        await pushData('biblioteca-materiais', materialData);
        await auditService.logAction(
          'material_create',
          user.uid,
          {
            description: `Criou material: ${formData.titulo}`,
            categoria: formData.categoria
          }
        );
      }

      setModalOpen(false);
      alert('Material salvo com sucesso!');

    } catch (error) {
      console.error('Erro ao salvar material:', error);
      alert('Erro ao salvar material.');
    }
  };

  const aprovarMaterial = async (materialId, aprovar = true) => {
    try {
      const novoStatus = aprovar ? 'aprovado' : 'rejeitado';
      await updateData('biblioteca-materiais/${materialId}', {
        statusAprovacao: novoStatus,
        revisadoPor: user.uid,
        revisadoPorNome: user.displayName || user.email,
        revisadoEm: new Date().toISOString()
      });

      await auditService.logAction(
        'material_approval',
        user.uid,
        {
          description: `${aprovar ? 'Aprovou' : 'Rejeitou'} material`,
          materialId,
          status: novoStatus
        }
      );

      alert(`Material ${aprovar ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao aprovar material:', error);
      alert('Erro ao processar aprovação.');
    }
  };

  const excluirMaterial = async (materialId, titulo) => {
    if (!confirm(`Deseja excluir o material "${titulo}"?`)) return;

    try {
      await removeData('biblioteca-materiais/${materialId}');
      await auditService.logAction(
        'material_delete',
        user.uid,
        {
          description: `Excluiu material: ${titulo}`,
          materialId
        }
      );
      alert('Material excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir material:', error);
      alert('Erro ao excluir material.');
    }
  };

  const abrirMenu = (event, material) => {
    setMenuAnchor(event.currentTarget);
    setMaterialSelecionado(material);
  };

  const fecharMenu = () => {
    setMenuAnchor(null);
    setMaterialSelecionado(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LibraryBooksIcon color="primary" />
          Biblioteca de Materiais
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => abrirModal()}
          sx={{ borderRadius: 2, background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)' }}
        >
          Novo Material
        </Button>
      </Box>

      {/* Navegação por Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabAtual}
          onChange={(e, newValue) => setTabAtual(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Meus Materiais" icon={<FolderIcon />} />
          <Tab label="Compartilhados" icon={<ShareIcon />} />
          {(userRole === 'coordenador' || userRole === 'coordenadora') && (
            <Tab label="Aprovações" icon={<PendingIcon />} />
          )}
        </Tabs>
      </Paper>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryIcon color="primary" />
            Filtros
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  label="Categoria"
                >
                  <MenuItem value="todas">Todas as Categorias</MenuItem>
                  {Object.entries(categorias).map(([key, categoria]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {categoria.icon}
                        {categoria.nome}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="todos">Todos os Status</MenuItem>
                  {Object.entries(statusAprovacao).map(([key, status]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {status.icon}
                        {status.nome}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Materiais */}
      {materiaisOrganizados.length === 0 ? (
        <Alert severity="info">
          <Typography variant="body1" gutterBottom>
            📚 <strong>Nenhum material encontrado</strong>
          </Typography>
          <Typography variant="body2">
            {tabAtual === 0 ? 
              'Crie materiais para compartilhar recursos pedagógicos.' :
              tabAtual === 1 ?
              'Nenhum material foi compartilhado ainda.' :
              'Não há materiais pendentes de aprovação.'
            }
          </Typography>
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {materiaisOrganizados.map((material) => (
            <Grid item xs={12} md={6} lg={4} key={material.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: categorias[material.categoria]?.cor }}>
                      {categorias[material.categoria]?.icon}
                    </Avatar>
                  }
                  action={
                    <IconButton onClick={(e) => abrirMenu(e, material)}>
                      <MoreVertIcon />
                    </IconButton>
                  }
                  title={
                    <Typography variant="h6" noWrap>
                      {material.titulo}
                    </Typography>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                      <Chip
                        label={categorias[material.categoria]?.nome}
                        size="small"
                        sx={{ 
                          backgroundColor: categorias[material.categoria]?.cor,
                          color: 'white'
                        }}
                      />
                      <Chip
                        label={statusAprovacao[material.statusAprovacao]?.nome}
                        size="small"
                        icon={statusAprovacao[material.statusAprovacao]?.icon}
                        sx={{ 
                          backgroundColor: statusAprovacao[material.statusAprovacao]?.cor,
                          color: 'white'
                        }}
                      />
                    </Box>
                  }
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {material.descricao}
                  </Typography>
                  
                  {material.tags && material.tags.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      {material.tags.map((tag, idx) => (
                        <Chip key={idx} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    Por: {material.criadoPorNome} • {new Date(material.criadoEm).toLocaleDateString('pt-BR')}
                  </Typography>
                </CardContent>
                
                {/* Ações para Coordenadores */}
                {(userRole === 'coordenador' || userRole === 'coordenadora') && 
                 material.statusAprovacao === 'pendente' && (
                  <CardActions>
                    <Button 
                      size="small" 
                      color="success" 
                      startIcon={<CheckCircleIcon />}
                      onClick={() => aprovarMaterial(material.id, true)}
                    >
                      Aprovar
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      startIcon={<CancelIcon />}
                      onClick={() => aprovarMaterial(material.id, false)}
                    >
                      Rejeitar
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Menu de Ações */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={fecharMenu}
      >
        <MenuItem onClick={() => { window.open(materialSelecionado?.link); fecharMenu(); }}>
          <VisibilityIcon sx={{ mr: 1 }} />
          Visualizar
        </MenuItem>
        <MenuItem onClick={() => { navigator.clipboard.writeText(materialSelecionado?.link); fecharMenu(); alert('Link copiado!'); }}>
          <ShareIcon sx={{ mr: 1 }} />
          Compartilhar
        </MenuItem>
        {materialSelecionado?.criadoPor === user?.uid && (
          <>
            <MenuItem onClick={() => { abrirModal(materialSelecionado); fecharMenu(); }}>
              <EditIcon sx={{ mr: 1 }} />
              Editar
            </MenuItem>
            <MenuItem onClick={() => { excluirMaterial(materialSelecionado?.id, materialSelecionado?.titulo); fecharMenu(); }}>
              <DeleteIcon sx={{ mr: 1 }} />
              Excluir
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Modal de Criação/Edição */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {materialEditando ? 'Editar Material' : 'Novo Material'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={3}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  label="Categoria"
                >
                  {Object.entries(categorias).map(([key, categoria]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {categoria.icon}
                        {categoria.nome}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Acesso</InputLabel>
                <Select
                  value={formData.tipoAcesso}
                  onChange={(e) => setFormData({ ...formData, tipoAcesso: e.target.value })}
                  label="Tipo de Acesso"
                >
                  {Object.entries(tiposAcesso).map(([key, tipo]) => (
                    <MenuItem key={key} value={key}>
                      <Box>
                        <Typography variant="subtitle2">{tipo.nome}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tipo.descricao}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Disciplina (opcional)</InputLabel>
                <Select
                  value={formData.disciplinaId}
                  onChange={(e) => setFormData({ ...formData, disciplinaId: e.target.value })}
                  label="Disciplina (opcional)"
                >
                  <MenuItem value="">Nenhuma</MenuItem>
                  {Object.entries(disciplinas).map(([id, disciplina]) => (
                    <MenuItem key={id} value={id}>
                      {disciplina.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Turma (opcional)</InputLabel>
                <Select
                  value={formData.turmaId}
                  onChange={(e) => setFormData({ ...formData, turmaId: e.target.value })}
                  label="Turma (opcional)"
                >
                  <MenuItem value="">Nenhuma</MenuItem>
                  {Object.entries(turmas).map(([id, turma]) => (
                    <MenuItem key={id} value={id}>
                      {turma.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Link do Material"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (separadas por vírgula)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="matemática, atividade, 5º ano"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={2}
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={salvarMaterial} variant="contained">
            {materialEditando ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BibliotecaMateriais;