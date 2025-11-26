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
  Search as SearchIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon,
  Support as SupportIcon,
  MenuBook as MenuBookIcon,
  QuestionAnswer as QuestionAnswerIcon
} from '@mui/icons-material';
import SidebarMenu from '../../components/SidebarMenu';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
import { useManagementDatabase } from '../../hooks/useManagementDatabase';
import { isSuperAdmin } from '../../config/constants';

const SuportePage = () => {
  const router = useRouter();
  const { user, userRole } = useAuthUser();
  
  // Hook para tickets (banco da escola)
  const { getData, setData, pushData, updateData, isReady, storage } = useSchoolDatabase();
  
  // Hook para base de conhecimento GLOBAL (banco de gerenciamento)
  const managementDB = useManagementDatabase();
  const { 
    getData: getDataGlobal, 
    setData: setDataGlobal, 
    isReady: managementReady,
    storage: managementStorage 
  } = managementDB;

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

  // 🎬 Estados para modal de detalhes de funcionalidade
  const [funcionalidadeModalOpen, setFuncionalidadeModalOpen] = useState(false);
  const [funcionalidadeSelecionada, setFuncionalidadeSelecionada] = useState(null);
  const [telaSelecionada, setTelaSelecionada] = useState(null);
  const [uploadMidiaOpen, setUploadMidiaOpen] = useState(false);
  const [uploadingMidia, setUploadingMidia] = useState(false);

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

  // 📚 Base de Conhecimento - Documentação completa do sistema com tutoriais detalhados
  const baseConhecimentoData = [
    // 🏠 GESTÃO ESCOLAR
    {
      categoria: 'Gestão Escolar',
      telas: [
        {
          id: 'dashboard',
          titulo: '🏠 Dashboard (Início)',
          descricao: 'Visão geral do sistema com estatísticas e acesso rápido às principais funcionalidades.',
          funcionalidades: [
            {
              nome: 'Visualizar resumo de alunos, turmas e professores',
              tutorial: [
                'Acesse o Dashboard após fazer login',
                'Os cards principais mostram quantidade de alunos, turmas e professores',
                'Clique em cada card para ir direto à tela correspondente',
                'Os números são atualizados automaticamente'
              ],
              dicas: [
                'Use o Dashboard como página inicial para ter visão geral',
                'Identifique rapidamente problemas pelos indicadores em vermelho'
              ],
              midiaUrl: null, // URL do GIF ou vídeo
              midiaTipo: null // 'gif' ou 'video'
            },
            {
              nome: 'Acessar atalhos para funcionalidades frequentes',
              tutorial: [
                'Na parte inferior do Dashboard há atalhos rápidos',
                'Clique diretamente no atalho desejado',
                'Economiza tempo navegando pelo menu lateral'
              ],
              dicas: ['Os atalhos são personalizados conforme seu perfil de usuário'],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Ver notificações importantes',
              tutorial: [
                'Notificações aparecem no topo do Dashboard',
                'Ícone de sino mostra quantidade de notificações não lidas',
                'Clique para ver detalhes e marcar como lida'
              ],
              dicas: ['Configure notificações em Configurações para receber alertas importantes'],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Acompanhar indicadores da escola',
              tutorial: [
                'Gráficos mostram evolução de matrículas',
                'Indicadores financeiros aparecem para coordenadora',
                'Use os filtros para ver dados por período'
              ],
              dicas: ['Exporte relatórios clicando no ícone de download'],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: ['Ponto de partida para todas as outras telas'],
          requisitosPrevios: ['Nenhum - tela inicial após login'],
          rolesComAcesso: ['coordenadora', 'professora', 'pai']
        },
        {
          id: 'escola',
          titulo: '🏫 Escola',
          descricao: 'Gerenciamento completo da estrutura escolar: períodos letivos, turmas, disciplinas e grade horária.',
          funcionalidades: [
            {
              nome: 'Criar e gerenciar períodos letivos (ano/semestre)',
              tutorial: [
                'Acesse a tela Escola no menu lateral',
                'Clique em "Novo Período Letivo"',
                'Preencha: nome (ex: 2025.1), data início e fim',
                'Marque como "Ativo" se for o período atual',
                'Salve o período',
                'IMPORTANTE: Só pode haver 1 período ativo por vez'
              ],
              dicas: [
                'Crie o período letivo ANTES de cadastrar turmas',
                'Use nomenclatura padrão: ANO.SEMESTRE (ex: 2025.1)',
                'Desative período anterior antes de ativar novo'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Cadastrar turmas vinculadas a períodos',
              tutorial: [
                'Na aba "Turmas", clique em "Nova Turma"',
                'Selecione o Período Letivo (deve estar criado)',
                'Defina nome da turma (ex: 1º Ano A)',
                'Escolha turno (Matutino/Vespertino/Integral)',
                'Defina capacidade máxima de alunos',
                'Salve a turma'
              ],
              dicas: [
                'Organize turmas por série e turno',
                'Defina capacidade realista considerando espaço físico'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Definir disciplinas da grade curricular',
              tutorial: [
                'Vá para aba "Disciplinas"',
                'Clique em "Nova Disciplina"',
                'Digite nome da disciplina (ex: Matemática)',
                'Defina carga horária semanal',
                'Salve a disciplina',
                'Repita para todas as disciplinas do currículo'
              ],
              dicas: [
                'Crie todas as disciplinas antes de montar grade horária',
                'Use nomes padronizados para facilitar identificação'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Montar grade horária das turmas',
              tutorial: [
                'Acesse aba "Grade Horária"',
                'Selecione a turma',
                'Para cada horário, clique e escolha disciplina e professor',
                'Verifique conflitos de horário (sistema alerta)',
                'Salve a grade completa'
              ],
              dicas: [
                'Monte grade respeitando carga horária de cada disciplina',
                'Evite sobrecarregar um professor em mesmo horário'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Configurar informações básicas da escola',
              tutorial: [
                'Na aba "Informações", clique em "Editar"',
                'Preencha: nome da escola, endereço, telefone, email',
                'Faça upload do logo (aparecerá em documentos)',
                'Salve as informações'
              ],
              dicas: ['Logo deve ser PNG ou JPG, tamanho máximo 2MB'],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'CRIA Período Letivo → usado por Turmas',
            'CRIA Turmas → usadas por Alunos e Notas',
            'CRIA Disciplinas → usadas por Grade e Notas',
            'CONFIGURA Grade Horária → usada por Sala Professor'
          ],
          requisitosPrevios: ['Primeiro passo: criar período letivo', 'Depois criar turmas e disciplinas'],
          rolesComAcesso: ['coordenadora']
        },
        {
          id: 'colaboradores',
          titulo: '👥 Colaboradores',
          descricao: 'Cadastro e gerenciamento de professores e funcionários da escola.',
          funcionalidades: [
            {
              nome: 'Cadastrar professores',
              tutorial: [
                'Acesse Colaboradores no menu',
                'Clique em "Novo Professor"',
                'Preencha dados pessoais: nome, CPF, email, telefone',
                'Adicione endereço e documentação',
                'Defina data de admissão',
                'Salve o cadastro'
              ],
              dicas: ['CPF e email são únicos no sistema', 'Email será usado para login do professor'],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Atribuir disciplinas aos professores',
              tutorial: [
                'Edite o professor cadastrado',
                'Na seção "Disciplinas", clique em "Adicionar"',
                'Selecione as disciplinas que o professor leciona',
                'Salve as atribuições'
              ],
              dicas: ['Professor pode lecionar múltiplas disciplinas'],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Definir turmas que cada professor leciona',
              tutorial: [
                'No cadastro do professor, seção "Turmas"',
                'Clique em "Vincular Turma"',
                'Selecione turma e disciplina que leciona nela',
                'Salve o vínculo',
                'Repita para todas as turmas do professor'
              ],
              dicas: ['Verifique grade horária para evitar conflitos'],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Gerenciar dados de contato e documentação',
              tutorial: [
                'Edite o professor',
                'Atualize telefone, email ou endereço conforme necessário',
                'Na aba "Documentos", faça upload de RG, CPF, diploma',
                'Salve alterações'
              ],
              dicas: ['Mantenha documentação atualizada para relatórios oficiais'],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'VINCULA professores com Disciplinas',
            'VINCULA professores com Turmas',
            'Dados usados em Sala Professor e Notas'
          ],
          requisitosPrevios: ['Ter disciplinas e turmas criadas na tela Escola'],
          rolesComAcesso: ['coordenadora']
        },
        {
          id: 'configuracoes',
          titulo: '⚙️ Configurações',
          descricao: 'Configurações gerais do sistema, gerenciamento de usuários e permissões.',
          funcionalidades: [
            {
              nome: 'Gerenciar usuários do sistema',
              tutorial: [
                'Acesse Configurações',
                'Veja lista de todos os usuários cadastrados',
                'Use busca para encontrar usuário específico',
                'Clique em "Editar" para modificar dados',
                'Clique em "Excluir" para remover (cuidado!)'
              ],
              dicas: ['Só coordenadora tem acesso a esta tela', 'Exclusão é permanente'],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Definir roles (coordenadora, professora, pai)',
              tutorial: [
                'Edite o usuário',
                'No campo "Perfil", selecione: Coordenadora, Professora ou Pai',
                'Coordenadora: acesso total',
                'Professora: acesso acadêmico',
                'Pai: acesso limitado a dados do filho',
                'Salve a alteração'
              ],
              dicas: ['Role define quais telas o usuário vê no menu'],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Aprovar novos usuários pendentes',
              tutorial: [
                'Badge vermelho em Configurações indica pendências',
                'Clique para ver usuários aguardando aprovação',
                'Revise dados do usuário',
                'Defina o role apropriado',
                'Clique em "Aprovar"',
                'Usuário receberá email de confirmação'
              ],
              dicas: ['Verifique identidade antes de aprovar', 'Usuários pendentes não acessam o sistema'],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Configurar permissões de suporte',
              tutorial: [
                'Edite o usuário',
                'Marque checkbox "Membro da equipe de suporte"',
                'Usuário poderá ver e responder todos os tickets',
                'Salve a alteração'
              ],
              dicas: ['Super admin já tem acesso automático'],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Ajustar preferências do sistema',
              tutorial: [
                'Na aba "Preferências"',
                'Configure notificações por email',
                'Defina tema (claro/escuro)',
                'Ajuste idioma se disponível',
                'Salve preferências'
              ],
              dicas: ['Preferências são salvas por usuário'],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: ['Controla acesso a todas as outras telas', 'Define quem pode ver cada funcionalidade'],
          requisitosPrevios: ['Nenhum - mas importante configurar no início'],
          rolesComAcesso: ['coordenadora']
        }
      ]
    },
    // 📚 ACADÊMICO
    {
      categoria: 'Acadêmico',
      telas: [
        {
          id: 'alunos',
          titulo: '🎓 Alunos',
          descricao: 'Cadastro completo de alunos com dados pessoais, documentação, matrícula e contratos.',
          funcionalidades: [
            {
              nome: 'Cadastrar novos alunos',
              tutorial: [
                'Acesse o menu "Alunos"',
                'Clique no botão "Novo Aluno"',
                'Preencha dados pessoais: nome completo, data de nascimento, CPF',
                'Adicione foto do aluno (opcional)',
                'Preencha dados dos responsáveis: nome, CPF, telefone, email',
                'Defina grau de parentesco (pai, mãe, avô, etc)',
                'Clique em "Salvar"'
              ],
              dicas: [
                'CPF é único - não pode cadastrar aluno duplicado',
                'Email do responsável será usado para acesso ao sistema',
                'Foto ajuda na identificação rápida'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Gerenciar dados pessoais e responsáveis',
              tutorial: [
                'Na lista de alunos, clique no aluno desejado',
                'Clique no ícone de edição (lápis)',
                'Atualize os dados necessários',
                'Para adicionar novo responsável, clique em "Adicionar Responsável"',
                'Para remover responsável, clique no ícone de lixeira',
                'Salve as alterações'
              ],
              dicas: [
                'Mantenha telefones atualizados para contato emergencial',
                'Aluno pode ter múltiplos responsáveis'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Vincular aluno a turma',
              tutorial: [
                'Edite o aluno',
                'Na seção "Matrícula", clique em "Vincular a Turma"',
                'Selecione o período letivo ativo',
                'Escolha a turma desejada',
                'Defina data de matrícula',
                'Confirme o vínculo',
                'Status da matrícula mudará para "Ativo"'
              ],
              dicas: [
                'Aluno só pode estar em 1 turma por período letivo',
                'Para mudar de turma, desvincule da atual primeiro',
                'Histórico de turmas fica registrado'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Gerar ficha de matrícula e contrato',
              tutorial: [
                'Selecione o aluno',
                'Clique em "Documentos"',
                'Escolha "Gerar Ficha de Matrícula"',
                'Revise os dados preenchidos automaticamente',
                'Clique em "Gerar PDF"',
                'Para contrato: escolha "Gerar Contrato"',
                'Personalize cláusulas se necessário',
                'Imprima ou envie por email'
              ],
              dicas: [
                'Ficha inclui dados do aluno e responsáveis',
                'Contrato pode ser personalizado por escola',
                'PDFs são salvos automaticamente'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Upload de documentos',
              tutorial: [
                'Na tela do aluno, vá para aba "Documentos"',
                'Clique em "Adicionar Documento"',
                'Selecione o tipo: RG, CPF, Certidão, Histórico, etc',
                'Escolha o arquivo (PDF, JPG ou PNG)',
                'Adicione observações se necessário',
                'Clique em "Upload"',
                'Documento ficará disponível para download'
              ],
              dicas: [
                'Tamanho máximo: 5MB por arquivo',
                'Formatos aceitos: PDF, JPG, PNG',
                'Organize por tipo para fácil localização'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Controlar status de matrícula',
              tutorial: [
                'Na lista de alunos, veja os status em chips coloridos',
                'Verde = Ativo, Amarelo = Pendente, Vermelho = Inativo',
                'Para mudar status, edite o aluno',
                'Vá em "Status da Matrícula"',
                'Escolha: Ativo, Pendente, Inativo, Transferido, Concluído',
                'Adicione motivo da mudança (obrigatório para inativo)',
                'Salve alteração'
              ],
              dicas: [
                'Alunos inativos não aparecem em listas padrão',
                'Use filtros para ver todos os status',
                'Histórico de mudanças fica registrado'
              ],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'REQUER Turmas (criadas em Escola)',
            'Alimenta dados para Notas & Frequência',
            'Dados usados em Financeiro',
            'Informações aparecem em Secretaria Digital'
          ],
          requisitosPrevios: ['Ter turmas criadas', 'Ter período letivo ativo'],
          rolesComAcesso: ['coordenadora', 'professora']
        },
        {
          id: 'sala-professor',
          titulo: '👩‍🏫 Sala do Professor',
          descricao: 'Área exclusiva do professor com ferramentas pedagógicas: planejamento, diário de classe, relatórios e biblioteca.',
          funcionalidades: [
            {
              nome: 'Planejar aulas e sequências didáticas',
              tutorial: [
                'Acesse "Sala do Professor"',
                'Clique na aba "Planos de Aula"',
                'Clique em "Novo Plano"',
                'Selecione turma e disciplina',
                'Defina data e duração da aula',
                'Escolha habilidades BNCC (busque por código ou descrição)',
                'Descreva objetivos, conteúdo e metodologia',
                'Adicione recursos necessários',
                'Defina avaliação',
                'Salve o plano'
              ],
              dicas: [
                'Use BNCC para alinhar com currículo nacional',
                'Vincule planos às aulas do calendário',
                'Duplique planos para economizar tempo'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Registrar diário de classe',
              tutorial: [
                'Na aba "Diário de Classe"',
                'Selecione turma e data',
                'Marque presença/falta dos alunos',
                'Adicione observações sobre a aula',
                'Registre conteúdo ministrado',
                'Anote ocorrências comportamentais',
                'Salve o diário',
                'Sistema calcula % de frequência automaticamente'
              ],
              dicas: [
                'Registre diariamente para precisão',
                'Observações ajudam em relatórios futuros',
                'Faltas justificadas devem ser anotadas'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Criar relatórios pedagógicos',
              tutorial: [
                'Vá para aba "Relatórios"',
                'Clique em "Novo Relatório"',
                'Escolha tipo: individual, turma, ou período',
                'Selecione aluno(s) e período',
                'Sistema preenche dados automaticamente',
                'Adicione observações qualitativas',
                'Inclua progressos e dificuldades',
                'Sugira intervenções se necessário',
                'Revise e finalize',
                'Relatório pode ser enviado aos pais'
              ],
              dicas: [
                'Use linguagem clara e objetiva',
                'Baseie-se em dados concretos',
                'Seja construtivo nas críticas'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Gerenciar cronograma acadêmico',
              tutorial: [
                'Acesse aba "Cronograma"',
                'Visualize calendário de aulas',
                'Clique em data para adicionar evento',
                'Defina: prova, trabalho, atividade, etc',
                'Adicione descrição e peso',
                'Vincule a habilidades BNCC',
                'Notifique alunos automaticamente',
                'Acompanhe entregas e prazos'
              ],
              dicas: [
                'Planeje avaliações com antecedência',
                'Evite acumular provas em mesma semana',
                'Sincroniza com agenda da escola'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Acessar biblioteca de materiais',
              tutorial: [
                'Entre na aba "Biblioteca"',
                'Navegue por categorias ou busque',
                'Clique em material para visualizar',
                'Faça download de recursos',
                'Upload de seus próprios materiais',
                'Compartilhe com outros professores',
                'Organize em pastas personalizadas',
                'Vincule materiais aos planos de aula'
              ],
              dicas: [
                'Contribua com materiais de qualidade',
                'Respeite direitos autorais',
                'Organize por disciplina e série'
              ],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'USA Grade Horária (da Escola)',
            'USA Turmas e Disciplinas',
            'Conectado com Notas & Frequência',
            'Relatórios enviados aos pais'
          ],
          requisitosPrevios: ['Professor vinculado a turmas e disciplinas', 'Grade horária configurada'],
          rolesComAcesso: ['coordenadora', 'professora']
        },
        {
          id: 'notas-frequencia',
          titulo: '📝 Notas & Frequência',
          descricao: 'Lançamento e gestão de notas e frequência dos alunos por disciplina.',
          funcionalidades: [
            {
              nome: 'Lançar notas por bimestre/trimestre',
              tutorial: [
                'Acesse "Notas & Frequência"',
                'Selecione turma e disciplina',
                'Escolha bimestre/trimestre',
                'Sistema mostra lista de alunos',
                'Digite nota de cada aluno (0 a 10)',
                'Adicione peso se houver',
                'Sistema calcula média automaticamente',
                'Salve as notas',
                'Notas ficam disponíveis para consulta'
              ],
              dicas: [
                'Revise antes de salvar - alterações ficam registradas',
                'Use conceitos (A, B, C) se configurado',
                'Notas aparecem no boletim imediatamente'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Registrar frequência diária',
              tutorial: [
                'Na aba "Frequência"',
                'Selecione turma e data',
                'Marque P (presente) ou F (falta)',
                'Use J para falta justificada',
                'Adicione observação na falta justificada',
                'Sistema calcula % automaticamente',
                'Salve registro',
                'Alertas aparecem se frequência < 75%'
              ],
              dicas: [
                'Registre todo dia para precisão',
                'Faltas justificadas não contam para reprovação',
                'Pais podem ver frequência em tempo real'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Calcular médias automaticamente',
              tutorial: [
                'Sistema calcula automaticamente ao salvar notas',
                'Média = soma das notas / quantidade de avaliações',
                'Se houver pesos: (nota1*peso1 + nota2*peso2) / soma pesos',
                'Média final = média dos bimestres',
                'Veja cálculos em "Detalhes do Aluno"',
                'Configurações de cálculo em "Escola"'
              ],
              dicas: [
                'Verifique configuração de médias da escola',
                'Média mínima para aprovação geralmente é 6.0',
                'Sistema indica aprovado/recuperação/reprovado'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Visualizar boletim do aluno',
              tutorial: [
                'Clique no aluno desejado',
                'Vá para "Boletim"',
                'Veja todas as disciplinas',
                'Notas por bimestre e média final',
                'Frequência por disciplina',
                'Observações dos professores',
                'Gere PDF do boletim',
                'Envie por email ou imprima'
              ],
              dicas: [
                'Boletim é atualizado em tempo real',
                'Pais têm acesso ao boletim online',
                'Pode ser personalizado por escola'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Gerar relatórios de desempenho',
              tutorial: [
                'Acesse "Relatórios"',
                'Escolha tipo: individual, turma ou geral',
                'Selecione período',
                'Filtre por disciplina se desejar',
                'Sistema gera gráficos e estatísticas',
                'Veja médias, aproveitamento, comparativos',
                'Identifique alunos em dificuldade',
                'Exporte em PDF ou Excel'
              ],
              dicas: [
                'Use para reuniões pedagógicas',
                'Identifique padrões e tendências',
                'Planeje intervenções baseadas em dados'
              ],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'REQUER Alunos cadastrados',
            'REQUER Turmas e Disciplinas',
            'Dados aparecem em Secretaria Digital',
            'Usado para gerar histórico escolar'
          ],
          requisitosPrevios: ['Alunos matriculados', 'Disciplinas e turmas criadas', 'Professor vinculado'],
          rolesComAcesso: ['professora']
        },
        {
          id: 'pendencias',
          titulo: '⚠️ Pendências',
          descricao: 'Sistema de controle de pendências acadêmicas e administrativas dos alunos.',
          funcionalidades: [
            {
              nome: 'Criar pendências por aluno',
              tutorial: [
                'Acesse "Pendências"',
                'Clique em "Nova Pendência"',
                'Selecione o aluno',
                'Escolha categoria: Documentação, Financeiro, Pedagógico, Comportamental',
                'Defina título e descrição detalhada',
                'Adicione observações importantes',
                'Salve a pendência'
              ],
              dicas: [
                'Seja específico na descrição',
                'Anexe documentos se necessário',
                'Pendência fica visível para coordenação'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Categorizar pendências (documentação, financeiro, pedagógico)',
              tutorial: [
                'Ao criar/editar pendência',
                'Selecione categoria apropriada',
                'Documentação: RG, CPF, histórico faltando',
                'Financeiro: mensalidade atrasada, material não pago',
                'Pedagógico: atividades pendentes, notas a recuperar',
                'Comportamental: ocorrências a resolver',
                'Sistema filtra por categoria'
              ],
              dicas: [
                'Categorização ajuda na organização',
                'Filtre por categoria para ver agrupado',
                'Cada categoria pode ter ações específicas'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Definir prioridade e prazo',
              tutorial: [
                'Na criação da pendência',
                'Escolha prioridade: Baixa (verde), Média (amarela), Alta (vermelha)',
                'Defina data limite para resolução',
                'Sistema enviará alertas próximo ao prazo',
                'Prioridade alta aparece em destaque',
                'Salve configurações'
              ],
              dicas: [
                'Alta prioridade para questões urgentes',
                'Prazo realista para resolução',
                'Sistema alerta 3 dias antes do vencimento'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Acompanhar resolução',
              tutorial: [
                'Na lista de pendências, veja status',
                'Aberta (vermelho), Em Andamento (amarelo), Resolvida (verde)',
                'Clique na pendência para ver histórico',
                'Adicione atualizações e comentários',
                'Mude status conforme progresso',
                'Quando resolver, marque como "Resolvida"',
                'Adicione resolução detalhada'
              ],
              dicas: [
                'Mantenha histórico atualizado',
                'Documente ações tomadas',
                'Pendências resolvidas podem ser arquivadas'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Notificar responsáveis',
              tutorial: [
                'Ao criar pendência, marque "Notificar Responsável"',
                'Sistema envia email automático',
                'Responsável vê pendência no sistema',
                'Pode enviar mensagem sobre a pendência',
                'Notifica novamente se não resolver no prazo',
                'Histórico de notificações fica registrado'
              ],
              dicas: [
                'Use linguagem clara e respeitosa',
                'Explique claramente o que precisa',
                'Ofereça canais para dúvidas'
              ],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'Vinculado a Alunos específicos',
            'Pode gerar notificações',
            'Bloqueia ações se crítico'
          ],
          requisitosPrevios: ['Ter alunos cadastrados'],
          rolesComAcesso: ['coordenadora']
        },
        {
          id: 'secretaria-digital',
          titulo: '📋 Secretaria Digital',
          descricao: 'Emissão de documentos oficiais: declarações, históricos, boletins e certificados.',
          funcionalidades: [
            {
              nome: 'Gerar declarações de matrícula',
              tutorial: [
                'Acesse "Secretaria Digital"',
                'Escolha "Declarações"',
                'Selecione o aluno',
                'Escolha tipo: matrícula, frequência, conclusão',
                'Sistema preenche dados automaticamente',
                'Revise informações',
                'Personalize texto se necessário',
                'Gere PDF com logo da escola',
                'Imprima ou envie por email'
              ],
              dicas: [
                'Declaração tem validade oficial',
                'Inclui assinatura digital',
                'Pode autenticar com QR Code'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Emitir histórico escolar',
              tutorial: [
                'Vá em "Histórico Escolar"',
                'Selecione o aluno',
                'Escolha período (anos de estudo)',
                'Sistema busca notas de todos os períodos',
                'Calcula médias e resultado final',
                'Adiciona frequência',
                'Gera documento oficial',
                'Assina digitalmente',
                'Exporta em PDF'
              ],
              dicas: [
                'Certifique-se que todas as notas estão lançadas',
                'Histórico é documento oficial',
                'Necessário para transferências'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Imprimir boletins',
              tutorial: [
                'Selecione "Boletins"',
                'Escolha turma ou aluno individual',
                'Selecione período (bimestre/ano)',
                'Sistema gera boletim com notas e frequência',
                'Revise dados',
                'Imprima individual ou em lote',
                'Envie por email aos responsáveis',
                'Salve PDF para histórico'
              ],
              dicas: [
                'Boletim pode ser personalizado',
                'Inclui gráficos de desempenho',
                'Pais podem acessar online também'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Criar certificados de conclusão',
              tutorial: [
                'Acesse "Certificados"',
                'Selecione alunos formandos',
                'Escolha modelo de certificado',
                'Sistema preenche: nome, curso, datas',
                'Adicione notas/conceitos se necessário',
                'Personalize texto e layout',
                'Gere certificados em lote',
                'Imprima em papel especial'
              ],
              dicas: [
                'Use papel certificado para oficialidade',
                'Verifique dados antes de imprimir',
                'Guarde cópia digital'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Gerenciar documentação oficial',
              tutorial: [
                'Vá em "Arquivo"',
                'Veja todos os documentos emitidos',
                'Filtre por tipo, aluno, período',
                'Reemita documentos se necessário',
                'Faça download de PDFs',
                'Organize em pastas',
                'Busque por protocolo',
                'Audite emissões'
              ],
              dicas: [
                'Mantenha backup dos documentos',
                'Protocolo único para rastreamento',
                'Histórico não pode ser apagado'
              ],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'USA dados de Alunos',
            'USA dados de Notas & Frequência',
            'USA informações da Escola',
            'Documentos baseados em Turmas'
          ],
          requisitosPrevios: ['Aluno com matrícula completa', 'Notas lançadas (para histórico)'],
          rolesComAcesso: ['coordenadora', 'pai']
        },
        {
          id: 'impressoes',
          titulo: '🖨️ Impressões',
          descricao: 'Central de geração de relatórios e documentos para impressão.',
          funcionalidades: [
            {
              nome: 'Gerar listas de alunos por turma',
              tutorial: [
                'Acesse "Impressões"',
                'Escolha "Listas"',
                'Selecione uma ou várias turmas',
                'Escolha dados a incluir: foto, responsável, telefone, etc',
                'Defina ordem: alfabética, matrícula, data nascimento',
                'Visualize pré-impressão',
                'Gere PDF',
                'Imprima ou salve'
              ],
              dicas: [
                'Liste apenas campos necessários',
                'Use para chamada, eventos, comunicados',
                'Pode exportar para Excel'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Imprimir fichas de matrícula',
              tutorial: [
                'Vá em "Fichas"',
                'Selecione alunos',
                'Sistema gera ficha completa',
                'Inclui dados pessoais, responsáveis, endereço',
                'Adiciona campos para assinaturas',
                'Personaliza cabeçalho com logo',
                'Imprime em lote',
                'Pode salvar modelos'
              ],
              dicas: [
                'Útil para arquivo físico',
                'Imprima em início de ano',
                'Guarde assinada'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Criar relatórios gerenciais',
              tutorial: [
                'Escolha "Relatórios"',
                'Selecione tipo: financeiro, acadêmico, administrativo',
                'Defina período e filtros',
                'Sistema gera estatísticas',
                'Veja gráficos e tabelas',
                'Analise dados consolidados',
                'Exporte em PDF ou Excel',
                'Use em reuniões'
              ],
              dicas: [
                'Relatórios ajudam na gestão',
                'Compare períodos',
                'Identifique tendências'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Exportar dados em PDF/Excel',
              tutorial: [
                'Em qualquer relatório/lista',
                'Clique em "Exportar"',
                'Escolha formato: PDF ou Excel',
                'PDF: mantém formatação visual',
                'Excel: permite edição e análise',
                'Defina nome do arquivo',
                'Faça download',
                'Arquivo salvo automaticamente'
              ],
              dicas: [
                'PDF para impressão',
                'Excel para análise de dados',
                'Nomeie arquivos claramente'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Personalizar layouts de impressão',
              tutorial: [
                'Acesse "Configurar Impressões"',
                'Escolha documento a personalizar',
                'Ajuste margens e espaçamento',
                'Defina cabeçalho e rodapé',
                'Adicione logo e assinaturas',
                'Escolha fonte e tamanho',
                'Salve como modelo',
                'Use modelo nas próximas impressões'
              ],
              dicas: [
                'Crie modelos por tipo de documento',
                'Mantenha identidade visual',
                'Teste antes de imprimir em lote'
              ],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'Acessa dados de todas as telas',
            'Complemento da Secretaria Digital',
            'Consolida informações para relatórios'
          ],
          requisitosPrevios: ['Dados cadastrados nas respectivas telas'],
          rolesComAcesso: ['coordenadora']
        },
        {
          id: 'turma-filho',
          titulo: '👨‍👩‍👧 Turma do Filho',
          descricao: 'Área exclusiva para pais acompanharem informações acadêmicas dos filhos.',
          funcionalidades: [
            {
              nome: 'Ver informações da turma do filho',
              tutorial: [
                'Faça login como responsável',
                'Acesse "Turma do Filho" no menu',
                'Sistema identifica automaticamente seu filho',
                'Veja nome da turma, professor, período',
                'Lista de disciplinas e professores',
                'Quantidade de alunos na turma',
                'Horários e informações gerais'
              ],
              dicas: [
                'Se tiver mais de um filho, selecione qual visualizar',
                'Informações são atualizadas em tempo real'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Acompanhar grade horária',
              tutorial: [
                'Na tela "Turma do Filho"',
                'Clique em "Grade Horária"',
                'Veja grade semanal completa',
                'Horários de cada disciplina',
                'Professor responsável por cada aula',
                'Salve grade em PDF',
                'Use para organizar rotina do filho'
              ],
              dicas: [
                'Grade pode mudar durante o ano',
                'Verifique periodicamente',
                'Sincronize com agenda pessoal'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Visualizar calendário de aulas',
              tutorial: [
                'Acesse "Calendário"',
                'Veja dias letivos do mês',
                'Identifique feriados e recessos',
                'Veja eventos da turma',
                'Provas e trabalhos agendados',
                'Reuniões de pais',
                'Adicione lembretes pessoais'
              ],
              dicas: [
                'Calendário sincronizado com escola',
                'Receba notificações de eventos',
                'Planeje férias considerando calendário'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Ver avisos da turma',
              tutorial: [
                'Avisos aparecem na página inicial',
                'Clique em "Avisos" para ver todos',
                'Filtre por data ou categoria',
                'Leia avisos gerais e específicos da turma',
                'Marque como lido',
                'Responda se necessário',
                'Receba notificação de avisos novos'
              ],
              dicas: [
                'Verifique avisos diariamente',
                'Configure notificações por email',
                'Avisos importantes ficam em destaque'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Acessar notas e frequência (quando compartilhado)',
              tutorial: [
                'Se escola permitir, veja "Notas"',
                'Selecione disciplina',
                'Veja notas por período',
                'Acompanhe frequência do filho',
                'Veja médias e desempenho',
                'Identifique dificuldades',
                'Entre em contato com professor se necessário'
              ],
              dicas: [
                'Nem todas escolas compartilham online',
                'Acompanhe regularmente',
                'Converse com filho sobre desempenho'
              ],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'Mostra dados da Turma',
            'Conectado com Grade Horária',
            'Recebe Avisos direcionados',
            'Pode ver dados de Notas (se permitido)'
          ],
          requisitosPrevios: ['Filho(a) matriculado', 'Pai cadastrado no sistema'],
          rolesComAcesso: ['pai']
        }
      ]
    },
    // 💰 FINANCEIRO
    {
      categoria: 'Financeiro',
      telas: [
        {
          id: 'financeiro',
          titulo: '💰 Caixa (Financeiro)',
          descricao: 'Gestão financeira completa: mensalidades, pagamentos, inadimplência e relatórios.',
          funcionalidades: [
            {
              nome: 'Lançar mensalidades dos alunos',
              tutorial: [
                'Acesse "Financeiro"',
                'Clique em "Lançar Mensalidades"',
                'Selecione mês de referência',
                'Escolha turma ou todos os alunos',
                'Sistema gera mensalidades automaticamente',
                'Defina valor e data de vencimento',
                'Adicione juros/multa se configurado',
                'Confirme lançamento em lote'
              ],
              dicas: [
                'Lance mensalidades no início do mês',
                'Valores podem ser individualizados',
                'Sistema envia cobrança automaticamente'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Registrar pagamentos recebidos',
              tutorial: [
                'Vá em "Recebimentos"',
                'Busque aluno ou mensalidade',
                'Clique em "Registrar Pagamento"',
                'Selecione forma: dinheiro, PIX, cartão, boleto',
                'Digite valor pago e data',
                'Adicione observações se necessário',
                'Sistema atualiza status automaticamente',
                'Emita recibo'
              ],
              dicas: [
                'Registre no dia do pagamento',
                'Confira valores antes de salvar',
                'Recibo tem validade legal'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Controlar inadimplência',
              tutorial: [
                'Acesse "Inadimplentes"',
                'Sistema lista mensalidades vencidas',
                'Veja alunos com atraso',
                'Filtros por quantidade de meses',
                'Envie lembretes por email/WhatsApp',
                'Registre tentativas de contato',
                'Defina ações: bloqueio, negociação',
                'Acompanhe histórico de pagamentos'
              ],
              dicas: [
                'Entre em contato antes de bloquear',
                'Ofereça negociação quando possível',
                'Documente todas as comunicações'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Gerar recibos',
              tutorial: [
                'Após registrar pagamento',
                'Clique em "Gerar Recibo"',
                'Sistema preenche dados automaticamente',
                'Revise informações',
                'Adicione observações se necessário',
                'Gere PDF com logo da escola',
                'Imprima ou envie por email',
                'Recibo fica arquivado no sistema'
              ],
              dicas: [
                'Recibo oficial com CNPJ',
                'Numeração sequencial',
                'Pode ser autenticado digitalmente'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Emitir relatórios financeiros',
              tutorial: [
                'Vá em "Relatórios Financeiros"',
                'Escolha tipo: recebimentos, inadimplência, fluxo de caixa',
                'Defina período',
                'Sistema gera gráficos e tabelas',
                'Veja totais, médias, comparativos',
                'Analise evolução mês a mês',
                'Exporte em PDF ou Excel',
                'Use para planejamento financeiro'
              ],
              dicas: [
                'Gere relatórios mensalmente',
                'Compare com meses anteriores',
                'Identifique sazonalidades'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Acompanhar fluxo de caixa',
              tutorial: [
                'Acesse "Fluxo de Caixa"',
                'Veja entradas (mensalidades, taxas)',
                'Veja saídas (despesas)',
                'Acompanhe saldo diário',
                'Projeções futuras',
                'Identifique períodos críticos',
                'Planeje com antecedência',
                'Exporte dados para análise'
              ],
              dicas: [
                'Registre todas as movimentações',
                'Categorize despesas corretamente',
                'Use para decisões estratégicas'
              ],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'REQUER Alunos cadastrados',
            'Pode gerar Pendências financeiras',
            'Dados aparecem em relatórios',
            'Vinculado a contratos (Alunos)'
          ],
          requisitosPrevios: ['Alunos matriculados com contrato'],
          rolesComAcesso: ['coordenadora', 'pai']
        },
        {
          id: 'loja',
          titulo: '🛒 Loja',
          descricao: 'Módulo de venda de produtos escolares (uniformes, materiais, etc).',
          funcionalidades: [
            {
              nome: 'Cadastrar produtos',
              tutorial: [
                'Acesse "Loja"',
                'Clique em "Novo Produto"',
                'Digite nome do produto',
                'Adicione descrição',
                'Upload de foto',
                'Defina preço',
                'Escolha categoria: uniforme, material, livro, etc',
                'Defina estoque inicial',
                'Salve produto'
              ],
              dicas: [
                'Use fotos de boa qualidade',
                'Descrição clara do produto',
                'Mantenha preços atualizados'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Gerenciar estoque',
              tutorial: [
                'Vá em "Estoque"',
                'Veja lista de produtos e quantidades',
                'Receba alertas quando acabar',
                'Registre entrada de novos produtos',
                'Registre saídas (vendas)',
                'Faça inventário periódico',
                'Ajuste estoque se necessário',
                'Veja histórico de movimentações'
              ],
              dicas: [
                'Defina estoque mínimo',
                'Faça pedidos com antecedência',
                'Inventário mensal recomendado'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Registrar vendas',
              tutorial: [
                'Clique em "Nova Venda"',
                'Selecione cliente (aluno/responsável)',
                'Adicione produtos ao carrinho',
                'Defina quantidade de cada item',
                'Sistema calcula total automaticamente',
                'Escolha forma de pagamento',
                'Registre se à vista ou parcelado',
                'Finalize venda',
                'Estoque atualiza automaticamente'
              ],
              dicas: [
                'Verifique disponibilidade em estoque',
                'Ofereça desconto para pagamento à vista',
                'Registre vendas imediatamente'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Emitir comprovantes',
              tutorial: [
                'Após finalizar venda',
                'Clique em "Emitir Comprovante"',
                'Sistema gera documento com dados da compra',
                'Lista produtos, quantidades e valores',
                'Forma de pagamento',
                'Gere PDF',
                'Imprima ou envie por email',
                'Comprovante fica arquivado'
              ],
              dicas: [
                'Comprovante serve como garantia',
                'Numeração sequencial',
                'Cliente pode reimprimir'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Controlar inadimplência de compras',
              tutorial: [
                'Acesse "Compras a Prazo"',
                'Veja vendas parceladas',
                'Identifique parcelas vencidas',
                'Envie lembretes de cobrança',
                'Registre pagamentos de parcelas',
                'Acompanhe histórico',
                'Tome ações em caso de inadimplência',
                'Gere relatório de recebíveis'
              ],
              dicas: [
                'Defina limite de crédito por cliente',
                'Cobre com antecedência',
                'Ofereça facilidades para regularização'
              ],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'Integrado com Financeiro',
            'Vendas vinculadas a alunos/responsáveis',
            'Gera movimentações no caixa'
          ],
          requisitosPrevios: ['Cadastro de produtos', 'Sistema financeiro configurado'],
          rolesComAcesso: ['coordenadora', 'pai']
        }
      ]
    },
    // 📢 COMUNICAÇÃO
    {
      categoria: 'Comunicação',
      telas: [
        {
          id: 'agenda',
          titulo: '📅 Agenda',
          descricao: 'Calendário escolar com eventos, reuniões, feriados e atividades.',
          funcionalidades: [
            {
              nome: 'Criar eventos escolares',
              tutorial: [
                'Acesse "Agenda"',
                'Clique em uma data no calendário',
                'Escolha "Novo Evento"',
                'Digite título do evento',
                'Defina hora de início e fim',
                'Adicione descrição detalhada',
                'Escolha tipo: pedagógico, administrativo, festivo',
                'Defina se é visível para pais/alunos',
                'Salve evento'
              ],
              dicas: [
                'Use cores para categorizar eventos',
                'Eventos importantes em destaque',
                'Notifique participantes automaticamente'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Agendar reuniões',
              tutorial: [
                'No calendário, clique em data/hora',
                'Selecione "Nova Reunião"',
                'Defina assunto e pauta',
                'Convide participantes',
                'Escolha local (sala, online)',
                'Se online, adicione link',
                'Defina lembretes',
                'Envie convites',
                'Participantes confirmam presença'
              ],
              dicas: [
                'Envie convite com 1 semana de antecedência',
                'Inclua pauta na descrição',
                'Configure lembretes para 1 dia antes'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Marcar feriados e recessos',
              tutorial: [
                'Clique no dia do feriado',
                'Escolha "Feriado/Recesso"',
                'Digite nome do feriado',
                'Defina se é nacional, estadual ou municipal',
                'Marque se suspende aulas',
                'Sistema marca em vermelho no calendário',
                'Salve e notifique comunidade escolar'
              ],
              dicas: [
                'Marque início de ano todos os feriados',
                'Recessos aparecem em período',
                'Pais veem automaticamente'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Notificar participantes',
              tutorial: [
                'Ao criar evento/reunião',
                'Marque "Notificar participantes"',
                'Escolha quem notificar: todos, turmas específicas, roles',
                'Sistema envia email automaticamente',
                'Notificação aparece no sistema',
                'Lembretes enviados conforme configurado',
                'Veja confirmações de leitura'
              ],
              dicas: [
                'Configure lembretes importantes',
                'Use notificação push se disponível',
                'Verifique confirmações'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Visualizar calendário mensal/anual',
              tutorial: [
                'Na agenda, alterne entre visões',
                'Mensal: vê todos eventos do mês',
                'Semanal: detalha semana',
                'Anual: visão geral do ano',
                'Filtre por tipo de evento',
                'Filtre por turma',
                'Exporte calendário em PDF',
                'Sincronize com Google Calendar'
              ],
              dicas: [
                'Visão anual para planejamento',
                'Exporte para impressão',
                'Sincronize com agenda pessoal'
              ],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'Eventos visíveis para todas as roles',
            'Integrado com notificações',
            'Usado por Sala Professor para cronogramas'
          ],
          requisitosPrevios: ['Nenhum - pode usar desde o início'],
          rolesComAcesso: ['coordenadora', 'professora', 'pai']
        },
        {
          id: 'avisos',
          titulo: '📢 Avisos',
          descricao: 'Sistema de comunicados e avisos direcionados por turma ou geral.',
          funcionalidades: [
            {
              nome: 'Criar avisos gerais ou por turma',
              tutorial: [
                'Acesse "Avisos"',
                'Clique em "Novo Aviso"',
                'Digite título chamativo',
                'Escreva mensagem clara e objetiva',
                'Escolha destinatários: todos, turmas específicas, roles',
                'Defina prioridade: normal, importante, urgente',
                'Marque categoria: informativo, evento, cobrança',
                'Salve e publique'
              ],
              dicas: [
                'Título claro atrai atenção',
                'Mensagens curtas são mais lidas',
                'Use prioridade com critério'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Enviar notificações',
              tutorial: [
                'Ao criar aviso, marque "Notificar"',
                'Sistema envia para todos os destinatários',
                'Email com resumo do aviso',
                'Notificação no app',
                'Opção de enviar SMS (se configurado)',
                'Veja estatísticas de entrega',
                'Acompanhe visualizações'
              ],
              dicas: [
                'Avisos urgentes = notificação imediata',
                'Verifique taxa de visualização',
                'Reenvie se necessário'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Anexar arquivos aos avisos',
              tutorial: [
                'Na criação do aviso',
                'Clique em "Anexar Arquivo"',
                'Escolha arquivo (PDF, imagem, documento)',
                'Máximo 10MB por arquivo',
                'Adicione múltiplos arquivos se necessário',
                'Arquivos ficam disponíveis para download',
                'Podem ser removidos depois'
              ],
              dicas: [
                'PDFs para documentos oficiais',
                'Imagens para divulgação',
                'Comprima arquivos grandes'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Controlar visualização',
              tutorial: [
                'Após publicar aviso',
                'Veja estatísticas de visualização',
                'Quem visualizou e quando',
                'Quem ainda não viu',
                'Envie lembrete para não visualizados',
                'Exporte lista de visualizações',
                'Use para confirmar comunicação'
              ],
              dicas: [
                'Avisos importantes: acompanhe visualização',
                'Entre em contato com quem não viu',
                'Guarde comprovante de envio'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Arquivar avisos antigos',
              tutorial: [
                'Avisos expirados vão para arquivo automaticamente',
                'Ou clique em "Arquivar" manualmente',
                'Avisos arquivados saem da lista principal',
                'Mas continuam acessíveis em "Arquivo"',
                'Busque avisos antigos quando necessário',
                'Restaure se precisar reenviar',
                'Exclua definitivamente se desejar'
              ],
              dicas: [
                'Mantenha lista principal limpa',
                'Arquivo serve como histórico',
                'Não exclua avisos importantes'
              ],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'Pode ser direcionado a Turmas específicas',
            'Notifica usuários por role',
            'Pais veem avisos da turma do filho'
          ],
          requisitosPrevios: ['Ter turmas criadas (para avisos específicos)'],
          rolesComAcesso: ['coordenadora', 'professora', 'pai']
        },
        {
          id: 'galeria',
          titulo: '📸 Galeria de Fotos',
          descricao: 'Álbum de fotos dos eventos e atividades escolares.',
          funcionalidades: [
            {
              nome: 'Upload de fotos de eventos',
              tutorial: [
                'Acesse "Galeria"',
                'Clique em "Nova Foto" ou "Upload em Lote"',
                'Selecione fotos do computador',
                'Múltiplas fotos de uma vez',
                'Aguarde upload',
                'Fotos processadas automaticamente',
                'Thumbnails geradas',
                'Ficam disponíveis imediatamente'
              ],
              dicas: [
                'Fotos em alta resolução',
                'JPG ou PNG',
                'Renomeie arquivos antes de subir'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Organizar em álbuns',
              tutorial: [
                'Clique em "Novo Álbum"',
                'Digite nome do álbum (ex: Festa Junina 2025)',
                'Adicione descrição',
                'Defina data do evento',
                'Escolha foto de capa',
                'Adicione fotos ao álbum',
                'Organize ordem das fotos',
                'Publique álbum'
              ],
              dicas: [
                'Um álbum por evento',
                'Nome descritivo com data',
                'Melhor foto como capa'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Compartilhar com pais',
              tutorial: [
                'No álbum, clique em "Compartilhar"',
                'Escolha com quem: turma específica ou todos',
                'Envie link do álbum',
                'Pais podem baixar fotos',
                'Podem comentar se permitido',
                'Controle privacidade',
                'Desative compartilhamento se necessário'
              ],
              dicas: [
                'Peça autorização de imagem dos pais',
                'Não exponha crianças indevidamente',
                'Modere comentários'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Criar descrições das fotos',
              tutorial: [
                'Clique em foto',
                'Adicione legenda',
                'Descreva momento/atividade',
                'Marque alunos presentes (se permitido)',
                'Adicione hashtags para organização',
                'Salve descrição',
                'Facilita busca futura'
              ],
              dicas: [
                'Legendas tornam álbum mais rico',
                'Use hashtags para categorizar',
                'Não marque alunos sem autorização'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Controlar privacidade',
              tutorial: [
                'Em configurações do álbum',
                'Defina visibilidade: público, turma, privado',
                'Público: todos veem',
                'Turma: só pais da turma',
                'Privado: só coordenação',
                'Pode mudar depois',
                'Respeite autorização de imagem'
              ],
              dicas: [
                'Padrão: privado ou turma',
                'Público apenas eventos gerais',
                'Sempre tenha autorização dos pais'
              ],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'Conectado com Agenda (fotos de eventos)',
            'Visível para pais da turma',
            'Complementa comunicação escolar'
          ],
          requisitosPrevios: ['Nenhum - pode usar a qualquer momento'],
          rolesComAcesso: ['coordenadora', 'professora', 'pai']
        },
        {
          id: 'suporte',
          titulo: '🎧 Suporte',
          descricao: 'Central de atendimento com sistema de tickets, chat e base de conhecimento.',
          funcionalidades: [
            {
              nome: 'Abrir tickets de suporte',
              tutorial: [
                'Acesse "Suporte"',
                'Clique em "Novo Ticket"',
                'Escolha categoria: Dúvida, Bug, Melhoria, Outro',
                'Defina prioridade: Baixa, Média, Alta',
                'Digite assunto claro',
                'Descreva problema/dúvida detalhadamente',
                'Anexe prints se ajudar',
                'Envie ticket'
              ],
              dicas: [
                'Seja específico na descrição',
                'Anexe evidências (prints, vídeos)',
                'Um problema por ticket'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Conversar via chat',
              tutorial: [
                'Abra seu ticket',
                'Use campo de mensagem no rodapé',
                'Digite mensagem e envie',
                'Equipe de suporte responde',
                'Conversação em tempo real',
                'Histórico completo salvo',
                'Notificações de novas respostas'
              ],
              dicas: [
                'Responda rapidamente',
                'Forneça informações solicitadas',
                'Seja cordial'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Anexar arquivos (imagens/vídeos)',
              tutorial: [
                'No ticket, clique em ícone de anexo',
                'Escolha arquivo',
                'Imagens até 10MB',
                'Vídeos até 50MB',
                'Aguarde upload',
                'Arquivo aparece na conversa',
                'Suporte pode baixar'
              ],
              dicas: [
                'Prints ajudam muito',
                'Vídeos curtos explicando problema',
                'Comprima vídeos grandes'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Acompanhar status do ticket',
              tutorial: [
                'Status do ticket muda conforme atendimento',
                'Aberto: aguardando primeira resposta',
                'Em Andamento: sendo resolvido',
                'Resolvido: solução aplicada',
                'Fechado: finalizado',
                'Receba notificações de mudança',
                'Pode reabrir se não resolver'
              ],
              dicas: [
                'Acompanhe pela aba "Meus Tickets"',
                'Confirme resolução',
                'Avalie atendimento'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Acessar base de conhecimento',
              tutorial: [
                'Vá para aba "Base de Conhecimento"',
                'Navegue por categorias',
                'Use busca para encontrar',
                'Clique em funcionalidade',
                'Veja tutorial passo a passo',
                'Assista vídeos/GIFs demonstrativos',
                'Aprenda sozinho antes de abrir ticket'
              ],
              dicas: [
                'Consulte antes de abrir ticket',
                'Tutoriais sempre atualizados',
                'Economize tempo com autoatendimento'
              ],
              midiaUrl: null,
              midiaTipo: null
            },
            {
              nome: 'Equipe de suporte gerenciar atendimentos',
              tutorial: [
                'Membros da equipe veem aba "Gerenciar Tickets"',
                'Lista todos os tickets de todas escolas',
                'Priorize por urgência',
                'Atribua tickets para membros',
                'Responda na conversa',
                'Mude status conforme progresso',
                'Feche quando resolver',
                'Estatísticas de atendimento'
              ],
              dicas: [
                'Responda em até 24h',
                'Seja claro e educado',
                'Documente soluções na base'
              ],
              midiaUrl: null,
              midiaTipo: null
            }
          ],
          relacoes: [
            'Independente - não depende de outras telas',
            'Equipe de suporte definida em Configurações',
            'Base de conhecimento documenta todas as telas'
          ],
          requisitosPrevios: ['Nenhum - disponível para todos'],
          rolesComAcesso: ['coordenadora', 'professora', 'pai']
        }
      ]
    }
  ];

  // 🔍 Estado para busca na base de conhecimento
  const [buscaConhecimento, setBuscaConhecimento] = useState('');

  // 🎯 Filtrar telas por role do usuário
  const filtrarTelasPorRole = (telas) => {
    return telas.filter(tela => tela.rolesComAcesso.includes(userRole));
  };

  // 🔍 Filtrar telas por busca
  const filtrarTelasPorBusca = (telas) => {
    if (!buscaConhecimento.trim()) return telas;
    
    const termo = buscaConhecimento.toLowerCase();
    return telas.filter(tela => {
      const funcNomes = tela.funcionalidades.map(f => 
        typeof f === 'string' ? f : f.nome
      );
      return tela.titulo.toLowerCase().includes(termo) ||
        tela.descricao.toLowerCase().includes(termo) ||
        funcNomes.some(nome => nome.toLowerCase().includes(termo));
    });
  };

  // 🎬 Abrir modal de funcionalidade e carregar mídia do banco GLOBAL
  const handleAbrirFuncionalidade = async (tela, funcionalidade, funcIndex) => {
    setTelaSelecionada(tela);
    
    // Carregar mídia do banco de gerenciamento (global)
    try {
      const funcRef = `base-conhecimento-midias/${tela.id}/funcionalidades/${funcIndex}`;
      const midiaData = await getDataGlobal(funcRef);
      
      if (midiaData && midiaData.midiaUrl) {
        // Funcionalidade com mídia do banco global
        setFuncionalidadeSelecionada({ 
          ...funcionalidade, 
          index: funcIndex,
          midiaUrl: midiaData.midiaUrl,
          midiaTipo: midiaData.midiaTipo
        });
      } else {
        // Funcionalidade sem mídia
        setFuncionalidadeSelecionada({ ...funcionalidade, index: funcIndex });
      }
    } catch (error) {
      console.error('Erro ao carregar mídia:', error);
      setFuncionalidadeSelecionada({ ...funcionalidade, index: funcIndex });
    }
    
    setFuncionalidadeModalOpen(true);
  };

  // 📤 Upload de mídia para funcionalidade (GLOBAL - banco de gerenciamento)
  const handleUploadMidia = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    const tiposPermitidos = ['image/gif', 'image/png', 'image/jpeg', 'video/mp4', 'video/webm'];
    if (!tiposPermitidos.includes(file.type)) {
      alert('Tipo de arquivo não permitido. Use GIF, PNG, JPG, MP4 ou WEBM.');
      return;
    }

    // Validar tamanho (máx 50MB para vídeos)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`Arquivo muito grande. Máximo ${file.type.startsWith('video/') ? '50MB' : '10MB'}.`);
      return;
    }

    try {
      setUploadingMidia(true);

      // Upload para Firebase Storage do GERENCIAMENTO (global)
      const midiaTipo = file.type.startsWith('video/') ? 'video' : 'gif';
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `base-conhecimento/${telaSelecionada.id}/${funcionalidadeSelecionada.index}/${fileName}`;
      
      const url = await managementStorage.uploadFile(file, filePath);

      // Salvar URL no banco de dados de GERENCIAMENTO (global)
      const funcIndex = funcionalidadeSelecionada.index;
      const funcRef = `base-conhecimento-midias/${telaSelecionada.id}/funcionalidades/${funcIndex}`;
      await setDataGlobal(funcRef, {
        midiaUrl: url,
        midiaTipo: midiaTipo,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: user.email
      });

      // Atualizar estado local
      setFuncionalidadeSelecionada(prev => ({
        ...prev,
        midiaUrl: url,
        midiaTipo: midiaTipo
      }));

      alert('Mídia enviada com sucesso! Todas as escolas verão esta atualização.');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao enviar mídia. Tente novamente.');
    } finally {
      setUploadingMidia(false);
      setUploadMidiaOpen(false);
    }
  };

  // 🗑️ Remover mídia da funcionalidade (GLOBAL)
  const handleRemoverMidia = async () => {
    if (!confirm('Deseja realmente remover esta mídia? Esta ação afetará TODAS as escolas.')) return;

    try {
      setUploadingMidia(true);

      const funcIndex = funcionalidadeSelecionada.index;
      const funcRef = `base-conhecimento-midias/${telaSelecionada.id}/funcionalidades/${funcIndex}`;
      
      await setDataGlobal(funcRef, {
        midiaUrl: null,
        midiaTipo: null,
        atualizadoEm: new Date().toISOString(),
        removidoPor: user.email
      });

      setFuncionalidadeSelecionada(prev => ({
        ...prev,
        midiaUrl: null,
        midiaTipo: null
      }));

      alert('Mídia removida com sucesso em todas as escolas!');
    } catch (error) {
      console.error('Erro ao remover:', error);
      alert('Erro ao remover mídia.');
    } finally {
      setUploadingMidia(false);
    }
  };

  // 📥 Carregar mídias das funcionalidades do banco GLOBAL (gerenciamento)
  useEffect(() => {
    const carregarMidiasGlobal = async () => {
      if (!managementReady) return;

      try {
        const midiasData = await getDataGlobal('base-conhecimento-midias');
        if (midiasData) {
          console.log('✅ Mídias globais carregadas:', midiasData);
          // Mídias são carregadas sob demanda quando modal é aberto
        }
      } catch (error) {
        console.error('❌ Erro ao carregar mídias globais:', error);
      }
    };

    carregarMidiasGlobal();
  }, [managementReady]);

  const renderBaseConhecimento = () => {
    // Processar dados: filtrar por role e busca
    const categoriasFiltradas = baseConhecimentoData
      .map(categoria => ({
        ...categoria,
        telas: filtrarTelasPorBusca(filtrarTelasPorRole(categoria.telas))
      }))
      .filter(categoria => categoria.telas.length > 0);

    return (
      <Box>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">📚 Base de Conhecimento do Sistema</Typography>
          <Chip 
            label={`Mostrando telas para: ${userRole === 'coordenadora' ? 'Coordenador(a)' : userRole === 'professora' ? 'Professor(a)' : 'Responsável'}`}
            color="primary"
            size="small"
          />
        </Box>

        {/* Campo de busca */}
        <TextField
          fullWidth
          placeholder="Buscar tela ou funcionalidade..."
          value={buscaConhecimento}
          onChange={(e) => setBuscaConhecimento(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />

        {categoriasFiltradas.length === 0 ? (
          <Alert severity="info">
            Nenhuma tela encontrada com o termo "{buscaConhecimento}"
          </Alert>
        ) : (
          categoriasFiltradas.map((categoria, catIndex) => (
            <Box key={catIndex} sx={{ mb: 4 }}>
              {/* Título da categoria */}
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  color: '#667eea',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {categoria.categoria === 'Gestão Escolar' && '🏫'}
                {categoria.categoria === 'Acadêmico' && '📚'}
                {categoria.categoria === 'Financeiro' && '💰'}
                {categoria.categoria === 'Comunicação' && '📢'}
                {categoria.categoria}
              </Typography>

              <Grid container spacing={2}>
                {categoria.telas.map((tela, telaIndex) => (
                  <Grid item xs={12} md={6} lg={4} key={telaIndex}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                        }
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem', fontWeight: 600 }}>
                          {tela.titulo}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {tela.descricao}
                        </Typography>

                        {/* Accordion com detalhes */}
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ✨ Funcionalidades
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense>
                              {tela.funcionalidades.map((func, i) => {
                                const funcNome = typeof func === 'string' ? func : func.nome;
                                const temDetalhes = typeof func === 'object' && func.tutorial;
                                
                                return (
                                  <ListItemButton 
                                    key={i} 
                                    sx={{ 
                                      py: 0.5,
                                      borderRadius: 1,
                                      '&:hover': {
                                        bgcolor: 'action.hover'
                                      }
                                    }}
                                    onClick={() => handleAbrirFuncionalidade(tela, func, i)}
                                  >
                                    <ListItemText 
                                      primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Typography variant="body2">
                                            • {funcNome}
                                          </Typography>
                                          {temDetalhes && (
                                            <Chip 
                                              label="Ver tutorial" 
                                              size="small" 
                                              color="primary"
                                              variant="outlined"
                                              sx={{ height: 20, fontSize: '0.7rem' }}
                                            />
                                          )}
                                        </Box>
                                      }
                                    />
                                  </ListItemButton>
                                );
                              })}
                            </List>
                          </AccordionDetails>
                        </Accordion>

                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              🔗 Relações com outras telas
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense>
                              {tela.relacoes.map((rel, i) => (
                                <ListItem key={i} sx={{ py: 0.5 }}>
                                  <ListItemText 
                                    primary={`• ${rel}`}
                                    primaryTypographyProps={{ variant: 'body2', color: 'primary' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>

                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ⚡ Requisitos prévios
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense>
                              {tela.requisitosPrevios.map((req, i) => (
                                <ListItem key={i} sx={{ py: 0.5 }}>
                                  <ListItemText 
                                    primary={`• ${req}`}
                                    primaryTypographyProps={{ variant: 'body2', color: 'warning.main' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>

                        {/* Badge de acesso */}
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {tela.rolesComAcesso.map((role, i) => (
                            <Chip
                              key={i}
                              label={role === 'coordenadora' ? 'Coord.' : role === 'professora' ? 'Prof.' : 'Resp.'}
                              size="small"
                              color={role === userRole ? 'primary' : 'default'}
                              variant={role === userRole ? 'filled' : 'outlined'}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))
        )}
      </Box>
    );
  };

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

        {/* 🎬 Modal de Detalhes da Funcionalidade */}
        <Dialog
          open={funcionalidadeModalOpen}
          onClose={() => setFuncionalidadeModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {funcionalidadeSelecionada && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      {telaSelecionada?.titulo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {typeof funcionalidadeSelecionada === 'string' ? funcionalidadeSelecionada : funcionalidadeSelecionada.nome}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => setFuncionalidadeModalOpen(false)} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>

              <DialogContent dividers>
                {/* Área de Mídia */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    🎥 Vídeo Tutorial / GIF Demonstrativo
                  </Typography>
                  
                  {funcionalidadeSelecionada.midiaUrl ? (
                    <Box>
                      {funcionalidadeSelecionada.midiaTipo === 'video' ? (
                        <video
                          controls
                          style={{
                            width: '100%',
                            maxHeight: '400px',
                            borderRadius: '8px',
                            backgroundColor: '#000'
                          }}
                        >
                          <source src={funcionalidadeSelecionada.midiaUrl} type="video/mp4" />
                          Seu navegador não suporta vídeo.
                        </video>
                      ) : (
                        <Box
                          component="img"
                          src={funcionalidadeSelecionada.midiaUrl}
                          alt="GIF Tutorial"
                          sx={{
                            width: '100%',
                            maxHeight: '400px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        />
                      )}

                      {/* Botão remover (só coordenadora) */}
                      {userRole === 'coordenadora' && (
                        <Button
                          startIcon={<CloseIcon />}
                          size="small"
                          color="error"
                          onClick={handleRemoverMidia}
                          disabled={uploadingMidia}
                          sx={{ mt: 1 }}
                        >
                          Remover Mídia
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <Paper
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        bgcolor: '#f5f5f5',
                        border: '2px dashed',
                        borderColor: 'divider'
                      }}
                    >
                      <VideoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Nenhum vídeo ou GIF adicionado ainda
                      </Typography>

                      {/* Botão upload (só coordenadora) */}
                      {userRole === 'coordenadora' && (
                        <>
                          <input
                            accept="image/gif,image/png,image/jpeg,video/mp4,video/webm"
                            style={{ display: 'none' }}
                            id={`upload-midia-${funcionalidadeSelecionada.index}`}
                            type="file"
                            onChange={handleUploadMidia}
                          />
                          <label htmlFor={`upload-midia-${funcionalidadeSelecionada.index}`}>
                            <Button
                              variant="contained"
                              component="span"
                              startIcon={uploadingMidia ? <CircularProgress size={20} /> : <AttachFileIcon />}
                              disabled={uploadingMidia}
                            >
                              {uploadingMidia ? 'Enviando...' : 'Adicionar Vídeo/GIF'}
                            </Button>
                          </label>
                          <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                            Formatos: GIF, PNG, JPG, MP4, WEBM (max 50MB para vídeos)
                          </Typography>
                        </>
                      )}
                    </Paper>
                  )}
                </Box>

                {/* Tutorial Passo a Passo */}
                {funcionalidadeSelecionada.tutorial && funcionalidadeSelecionada.tutorial.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                      📋 Passo a Passo
                    </Typography>
                    <List>
                      {funcionalidadeSelecionada.tutorial.map((passo, index) => (
                        <ListItem key={index} sx={{ alignItems: 'flex-start', py: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#667eea', width: 32, height: 32, fontSize: '0.875rem' }}>
                              {index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={passo}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Dicas Importantes */}
                {funcionalidadeSelecionada.dicas && funcionalidadeSelecionada.dicas.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      💡 Dicas Importantes
                    </Typography>
                    {funcionalidadeSelecionada.dicas.map((dica, index) => (
                      <Alert key={index} severity="info" sx={{ mb: 1 }}>
                        {dica}
                      </Alert>
                    ))}
                  </Box>
                )}

                {/* Funcionalidade sem detalhes expandidos (apenas string) */}
                {typeof funcionalidadeSelecionada === 'string' && (
                  <Alert severity="info">
                    Tutorial detalhado em desenvolvimento. Entre em contato com o suporte para mais informações.
                  </Alert>
                )}
              </DialogContent>

              <DialogActions>
                <Button onClick={() => setFuncionalidadeModalOpen(false)}>
                  Fechar
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Box>
  );
};

export default SuportePage;
