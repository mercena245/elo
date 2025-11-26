"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Close as CloseIcon,
  HelpOutline as HelpIcon,
  BugReport as BugIcon,
  Lightbulb as IdeaIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Support as SupportIcon,
  MenuBook as MenuBookIcon,
  QuestionAnswer as QuestionAnswerIcon
} from '@mui/icons-material';
import SidebarMenu from '../../components/SidebarMenu';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
import { isSuperAdmin } from '../../config/constants';

const SuportePage = () => {
  const router = useRouter();
  const { user, userRole } = useAuthUser();
  const { getData, setData, pushData, updateData, isReady, storage } = useSchoolDatabase();

  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [meusTickets, setMeusTickets] = useState([]);
  const [todosTickets, setTodosTickets] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ticketDetalhesOpen, setTicketDetalhesOpen] = useState(false);
  const [ticketSelecionado, setTicketSelecionado] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [isSuporte, setIsSuporte] = useState(false);

  // Estados do formulário de novo ticket
  const [novoTicket, setNovoTicket] = useState({
    categoria: 'duvida',
    prioridade: 'media',
    assunto: '',
    descricao: '',
    anexos: []
  });

  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Verificar se usuário é suporte ou super admin
  useEffect(() => {
    const checkSuporteRole = async () => {
      if (!user || !isReady) return;
      
      // Super admin tem acesso total
      if (isSuperAdmin(user.uid)) {
        setIsSuporte(true);
        return;
      }

      // Verificar se usuário tem role de suporte
      const userData = await getData(`usuarios/${user.uid}`);
      if (userData && userData.isSuporte) {
        setIsSuporte(true);
      }
    };

    checkSuporteRole();
  }, [user, isReady]);

  // Carregar tickets
  useEffect(() => {
    if (!user || !isReady) return;
    carregarTickets();
  }, [user, isReady, isSuporte]);

  const carregarTickets = async () => {
    try {
      setLoading(true);
      const ticketsData = await getData('tickets-suporte');
      
      if (ticketsData) {
        const ticketsList = Object.entries(ticketsData).map(([id, ticket]) => ({
          id,
          ...ticket
        })).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

        // Meus tickets (criados por mim)
        const meus = ticketsList.filter(t => t.usuarioId === user.uid);
        setMeusTickets(meus);

        // Se for suporte, ver todos os tickets
        if (isSuporte) {
          setTodosTickets(ticketsList);
        }
      } else {
        setMeusTickets([]);
        setTodosTickets([]);
      }
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    const anexos = [];

    try {
      for (const file of files) {
        // Validar tipo de arquivo
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (!isImage && !isVideo) {
          alert('Apenas imagens e vídeos são permitidos');
          continue;
        }

        // Validar tamanho (máx 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert('Arquivo muito grande. Máximo 10MB');
          continue;
        }

        // Upload para Firebase Storage
        const timestamp = Date.now();
        const fileName = `tickets/${user.uid}/${timestamp}_${file.name}`;
        const uploadResult = await storage.uploadFile(fileName, file);

        anexos.push({
          nome: file.name,
          url: uploadResult.url,
          tipo: isImage ? 'imagem' : 'video',
          tamanho: file.size
        });
      }

      setNovoTicket(prev => ({
        ...prev,
        anexos: [...prev.anexos, ...anexos]
      }));
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload dos arquivos');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleCriarTicket = async () => {
    if (!novoTicket.assunto.trim() || !novoTicket.descricao.trim()) {
      alert('Preencha o assunto e a descrição');
      return;
    }

    try {
      const ticketData = {
        ...novoTicket,
        usuarioId: user.uid,
        usuarioNome: user.displayName || user.email,
        usuarioEmail: user.email,
        status: 'aberto',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        mensagens: [{
          usuarioId: user.uid,
          usuarioNome: user.displayName || user.email,
          texto: novoTicket.descricao,
          anexos: novoTicket.anexos,
          dataHora: new Date().toISOString()
        }]
      };

      await pushData('tickets-suporte', ticketData);
      
      setDialogOpen(false);
      setNovoTicket({
        categoria: 'duvida',
        prioridade: 'media',
        assunto: '',
        descricao: '',
        anexos: []
      });
      
      carregarTickets();
      alert('Ticket criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      alert('Erro ao criar ticket');
    }
  };

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim() || !ticketSelecionado) return;

    try {
      const mensagem = {
        usuarioId: user.uid,
        usuarioNome: user.displayName || user.email,
        texto: novaMensagem,
        anexos: [],
        dataHora: new Date().toISOString()
      };

      const mensagensAtualizadas = [
        ...(ticketSelecionado.mensagens || []),
        mensagem
      ];

      await updateData(`tickets-suporte/${ticketSelecionado.id}`, {
        mensagens: mensagensAtualizadas,
        atualizadoEm: new Date().toISOString()
      });

      setNovaMensagem('');
      carregarTickets();
      
      // Atualizar ticket selecionado
      setTicketSelecionado({
        ...ticketSelecionado,
        mensagens: mensagensAtualizadas
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleMudarStatus = async (ticketId, novoStatus) => {
    try {
      await updateData(`tickets-suporte/${ticketId}`, {
        status: novoStatus,
        atualizadoEm: new Date().toISOString()
      });
      
      carregarTickets();
      
      if (ticketSelecionado && ticketSelecionado.id === ticketId) {
        setTicketSelecionado({
          ...ticketSelecionado,
          status: novoStatus
        });
      }
    } catch (error) {
      console.error('Erro ao mudar status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aberto': return 'warning';
      case 'em_andamento': return 'info';
      case 'resolvido': return 'success';
      case 'fechado': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'aberto': return <ScheduleIcon />;
      case 'em_andamento': return <SettingsIcon />;
      case 'resolvido': return <CheckCircleIcon />;
      case 'fechado': return <CancelIcon />;
      default: return null;
    }
  };

  const getCategoriaIcon = (categoria) => {
    switch (categoria) {
      case 'duvida': return <HelpIcon />;
      case 'bug': return <BugIcon />;
      case 'melhoria': return <IdeaIcon />;
      default: return <SupportIcon />;
    }
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'baixa': return 'success';
      case 'media': return 'warning';
      case 'alta': return 'error';
      default: return 'default';
    }
  };

  const renderMeusTickets = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Meus Tickets</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ 
            bgcolor: '#667eea',
            '&:hover': { bgcolor: '#5568d3' }
          }}
        >
          Novo Ticket
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : meusTickets.length === 0 ? (
        <Alert severity="info">
          Você ainda não tem tickets de suporte. Clique em "Novo Ticket" para criar um.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {meusTickets.map((ticket) => (
            <Grid item xs={12} key={ticket.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => {
                  setTicketSelecionado(ticket);
                  setTicketDetalhesOpen(true);
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getCategoriaIcon(ticket.categoria)}
                      <Typography variant="h6">{ticket.assunto}</Typography>
                    </Box>
                    <Chip 
                      icon={getStatusIcon(ticket.status)}
                      label={ticket.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(ticket.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={ticket.categoria}
                      size="small"
                      variant="outlined"
                    />
                    <Chip 
                      label={`Prioridade: ${ticket.prioridade}`}
                      size="small"
                      color={getPrioridadeColor(ticket.prioridade)}
                    />
                    <Chip 
                      label={new Date(ticket.criadoEm).toLocaleDateString('pt-BR')}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {ticket.descricao}
                  </Typography>

                  {ticket.mensagens && ticket.mensagens.length > 1 && (
                    <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                      {ticket.mensagens.length} mensagens
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderGestaoTickets = () => {
    if (!isSuporte) return null;

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 3 }}>Gerenciar Tickets - Visão da Equipe</Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : todosTickets.length === 0 ? (
          <Alert severity="info">Nenhum ticket de suporte no momento.</Alert>
        ) : (
          <Grid container spacing={2}>
            {todosTickets.map((ticket) => (
              <Grid item xs={12} md={6} key={ticket.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => {
                    setTicketSelecionado(ticket);
                    setTicketDetalhesOpen(true);
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getCategoriaIcon(ticket.categoria)}
                        <Typography variant="subtitle1" fontWeight="bold">{ticket.assunto}</Typography>
                      </Box>
                      <Chip 
                        icon={getStatusIcon(ticket.status)}
                        label={ticket.status.replace('_', ' ')}
                        color={getStatusColor(ticket.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      👤 {ticket.usuarioNome}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      📧 {ticket.usuarioEmail}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={ticket.categoria}
                        size="small"
                        variant="outlined"
                      />
                      <Chip 
                        label={ticket.prioridade}
                        size="small"
                        color={getPrioridadeColor(ticket.prioridade)}
                      />
                      <Chip 
                        label={new Date(ticket.criadoEm).toLocaleDateString('pt-BR')}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  const renderBaseConhecimento = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Base de Conhecimento</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#667eea' }}>
                  <MenuBookIcon />
                </Avatar>
                <Typography variant="h6">Primeiros Passos</Typography>
              </Box>
              <List>
                <ListItemButton>
                  <ListItemText 
                    primary="Como criar minha conta"
                    secondary="Aprenda a se cadastrar no sistema"
                  />
                </ListItemButton>
                <ListItemButton>
                  <ListItemText 
                    primary="Navegando pelo dashboard"
                    secondary="Conheça a tela principal"
                  />
                </ListItemButton>
                <ListItemButton>
                  <ListItemText 
                    primary="Configurações iniciais"
                    secondary="Configure seu perfil"
                  />
                </ListItemButton>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#10B981' }}>
                  <QuestionAnswerIcon />
                </Avatar>
                <Typography variant="h6">Perguntas Frequentes</Typography>
              </Box>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Como alterar minha senha?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Vá em Configurações {'>'} Perfil {'>'} Alterar Senha. Digite sua senha atual e a nova senha duas vezes.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Como adicionar um novo aluno?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Acesse o menu Alunos, clique em "Novo Aluno" e preencha o formulário com os dados do aluno.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Como gerar relatórios?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Vá em Impressões, selecione o tipo de relatório desejado, escolha os filtros e clique em Gerar.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  if (!user) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F5F7FA' }}>
      <SidebarMenu />
      
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Cabeçalho */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/dashboard')}
            sx={{ mb: 2 }}
          >
            Voltar ao Dashboard
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#10B981', width: 56, height: 56 }}>
              <SupportIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
                Central de Suporte
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isSuporte ? 'Gerenciar tickets e ajudar usuários' : 'Tire suas dúvidas e reporte problemas'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Meus Tickets" />
            {isSuporte && <Tab label="Gerenciar Tickets" />}
            <Tab label="Base de Conhecimento" />
          </Tabs>
        </Card>

        {/* Conteúdo das abas */}
        <Box>
          {tabValue === 0 && renderMeusTickets()}
          {tabValue === 1 && isSuporte && renderGestaoTickets()}
          {tabValue === (isSuporte ? 2 : 1) && renderBaseConhecimento()}
        </Box>

        {/* Dialog: Novo Ticket */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Novo Ticket de Suporte
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={novoTicket.categoria}
                  label="Categoria"
                  onChange={(e) => setNovoTicket({...novoTicket, categoria: e.target.value})}
                >
                  <MenuItem value="duvida">❓ Dúvida</MenuItem>
                  <MenuItem value="bug">🐛 Bug / Erro</MenuItem>
                  <MenuItem value="melhoria">💡 Sugestão de Melhoria</MenuItem>
                  <MenuItem value="outro">📝 Outro</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  value={novoTicket.prioridade}
                  label="Prioridade"
                  onChange={(e) => setNovoTicket({...novoTicket, prioridade: e.target.value})}
                >
                  <MenuItem value="baixa">🟢 Baixa</MenuItem>
                  <MenuItem value="media">🟡 Média</MenuItem>
                  <MenuItem value="alta">🔴 Alta</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Assunto"
                fullWidth
                value={novoTicket.assunto}
                onChange={(e) => setNovoTicket({...novoTicket, assunto: e.target.value})}
                placeholder="Ex: Não consigo acessar a tela de alunos"
              />

              <TextField
                label="Descrição"
                fullWidth
                multiline
                rows={4}
                value={novoTicket.descricao}
                onChange={(e) => setNovoTicket({...novoTicket, descricao: e.target.value})}
                placeholder="Descreva detalhadamente seu problema ou dúvida..."
              />

              <Box>
                <input
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  id="file-upload"
                  multiple
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={uploadingFiles ? <CircularProgress size={20} /> : <AttachFileIcon />}
                    disabled={uploadingFiles}
                  >
                    {uploadingFiles ? 'Enviando...' : 'Anexar Imagem ou Vídeo'}
                  </Button>
                </label>

                {novoTicket.anexos.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {novoTicket.anexos.map((anexo, index) => (
                      <Chip
                        key={index}
                        label={anexo.nome}
                        onDelete={() => {
                          setNovoTicket({
                            ...novoTicket,
                            anexos: novoTicket.anexos.filter((_, i) => i !== index)
                          });
                        }}
                        icon={anexo.tipo === 'imagem' ? <ImageIcon /> : <VideoIcon />}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button 
              variant="contained" 
              onClick={handleCriarTicket}
              disabled={!novoTicket.assunto || !novoTicket.descricao}
            >
              Criar Ticket
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog: Detalhes do Ticket */}
        <Dialog
          open={ticketDetalhesOpen}
          onClose={() => setTicketDetalhesOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {ticketSelecionado && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{ticketSelecionado.assunto}</Typography>
                  <IconButton onClick={() => setTicketDetalhesOpen(false)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip 
                    label={ticketSelecionado.status.replace('_', ' ')}
                    color={getStatusColor(ticketSelecionado.status)}
                    size="small"
                  />
                  <Chip 
                    label={ticketSelecionado.categoria}
                    size="small"
                    variant="outlined"
                  />
                  <Chip 
                    label={ticketSelecionado.prioridade}
                    size="small"
                    color={getPrioridadeColor(ticketSelecionado.prioridade)}
                  />
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                {/* Ações de status (apenas para suporte) */}
                {isSuporte && (
                  <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant={ticketSelecionado.status === 'aberto' ? 'contained' : 'outlined'}
                      onClick={() => handleMudarStatus(ticketSelecionado.id, 'aberto')}
                    >
                      Aberto
                    </Button>
                    <Button
                      size="small"
                      variant={ticketSelecionado.status === 'em_andamento' ? 'contained' : 'outlined'}
                      onClick={() => handleMudarStatus(ticketSelecionado.id, 'em_andamento')}
                    >
                      Em Andamento
                    </Button>
                    <Button
                      size="small"
                      variant={ticketSelecionado.status === 'resolvido' ? 'contained' : 'outlined'}
                      onClick={() => handleMudarStatus(ticketSelecionado.id, 'resolvido')}
                    >
                      Resolvido
                    </Button>
                    <Button
                      size="small"
                      variant={ticketSelecionado.status === 'fechado' ? 'contained' : 'outlined'}
                      onClick={() => handleMudarStatus(ticketSelecionado.id, 'fechado')}
                    >
                      Fechado
                    </Button>
                  </Box>
                )}

                {/* Mensagens */}
                <List>
                  {ticketSelecionado.mensagens?.map((mensagem, index) => (
                    <Box key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>{mensagem.usuarioNome[0]?.toUpperCase()}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="subtitle2">{mensagem.usuarioNome}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(mensagem.dataHora).toLocaleString('pt-BR')}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {mensagem.texto}
                              </Typography>
                              {mensagem.anexos?.length > 0 && (
                                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {mensagem.anexos.map((anexo, i) => (
                                    <Chip
                                      key={i}
                                      label={anexo.nome}
                                      size="small"
                                      onClick={() => window.open(anexo.url, '_blank')}
                                      icon={anexo.tipo === 'imagem' ? <ImageIcon /> : <VideoIcon />}
                                    />
                                  ))}
                                </Box>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                      {index < ticketSelecionado.mensagens.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>

                {/* Campo de nova mensagem */}
                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Digite sua mensagem..."
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleEnviarMensagem();
                      }
                    }}
                  />
                  <IconButton 
                    color="primary" 
                    onClick={handleEnviarMensagem}
                    disabled={!novaMensagem.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </DialogContent>
            </>
          )}
        </Dialog>
      </Box>
    </Box>
  );
};

export default SuportePage;
