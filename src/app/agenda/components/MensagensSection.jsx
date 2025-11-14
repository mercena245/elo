import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Paper,
  Divider,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Fab
} from '@mui/material';
import {
  Email,
  Reply,
  Forward,
  AttachFile,
  Send,
  Drafts,
  Schedule,
  Person,
  School,
  Circle
} from '@mui/icons-material';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from '../../../firebase';
import { auditService, LOG_ACTIONS } from '../../../services/auditService';
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';
import MensagensPendentes from './MensagensPendentes/MensagensPendentes';

const MensagensSection = ({ userRole, userData }) => {
  const { getData, setData, pushData, updateData, isReady, storage: schoolStorage } = useSchoolDatabase();

  // Salva e lê direto do nó raiz
  const mensagensPath = 'mensagens';
  const myId = userData?.id || userData?.uid;

  const [conversas, setConversas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [dialogNovaMensagem, setDialogNovaMensagem] = useState(false);
  const [abaConversas, setAbaConversas] = useState(0);
  const [novaMensagem, setNovaMensagem] = useState({ destinatario: '', assunto: '', conteudo: '', anexos: [] });
  const [usuarios, setUsuarios] = useState([]);
  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, titulo: '', mensagem: '', severidade: 'info' });
  const mounted = useRef(true);

  useEffect(() => {
    fetchConversas();
    fetchUsuarios();
  }, [userData, isReady]);

  // ÚNICO fetchConversas (sem filtro; apenas carrega e ordena)
  const fetchConversas = async () => {
    if (!isReady) return;
    try {
      const dados = await getData(mensagensPath);
      if (!dados || typeof dados !== 'object') {
        if (!conversas.length) setConversas([]);
        return;
      }
      const list = Object.entries(dados)
        .map(([id, m]) => ({ id, ...m }))
        .sort((a, b) => new Date(b?.dataEnvio || 0) - new Date(a?.dataEnvio || 0));
      setConversas(list);
    } catch (e) {
      console.error('Erro ao carregar conversas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversas();
  }, [isReady]); // não limpar por mudanças rápidas em props

  const fetchUsuarios = async () => {
    if (!isReady) return;
    
    try {
      const dados = await getData('usuarios');
      
      if (dados) {
        const usuariosList = Object.entries(dados).map(([id, usuario]) => ({
          id,
          ...usuario
        }));
        
        // Filtrar usuários baseado na role
        let usuariosFiltrados = usuariosList;
        
        if (userRole === 'pai') {
          // Pais só podem mandar mensagem para professoras e coordenação
          usuariosFiltrados = usuariosList.filter(u => 
            u.role === 'professora' || u.role === 'coordenadora'
          );
        } else if (userRole === 'professora') {
          // Professoras podem mandar para pais dos seus alunos e coordenação
          usuariosFiltrados = usuariosList.filter(u => 
            u.role === 'pai' || u.role === 'coordenadora' || 
            (u.role === 'professora' && u.id !== userData?.id)
          );
        }
        
        setUsuarios(usuariosFiltrados);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const exibirDialogo = (mensagem, { titulo = 'Aviso', severidade = 'info' } = {}) => {
    setFeedbackDialog({ open: true, titulo, mensagem, severidade });
  };

  const fecharDialogoFeedback = () => {
    setFeedbackDialog(prev => ({ ...prev, open: false }));
  };

  const enviarMensagem = async () => {
    try {
      // Validar se userData existe e tem ID
      if (!userData) {
        console.error('Dados do usuário não encontrados');
        exibirDialogo('Erro: Dados do usuário não carregados. Tente novamente.', {
          titulo: 'Erro ao enviar',
          severidade: 'error'
        });
        return;
      }

      if (!userData.id) {
        console.error('ID do usuário não encontrado:', userData);
        exibirDialogo('Erro: ID do usuário não encontrado. Faça login novamente.', {
          titulo: 'Erro ao enviar',
          severidade: 'error'
        });
        return;
      }

      // Validar se destinatário foi selecionado
      if (!novaMensagem.destinatario) {
        console.error('Destinatário não selecionado');
        exibirDialogo('Por favor, selecione um destinatário.', {
          titulo: 'Aviso',
          severidade: 'warning'
        });
        return;
      }

      // Validar se assunto e conteúdo foram preenchidos
      if (!novaMensagem.assunto?.trim()) {
        exibirDialogo('Por favor, digite um assunto para a mensagem.', {
          titulo: 'Aviso',
          severidade: 'warning'
        });
        return;
      }

      if (!novaMensagem.conteudo?.trim()) {
        exibirDialogo('Por favor, digite o conteúdo da mensagem.', {
          titulo: 'Aviso',
          severidade: 'warning'
        });
        return;
      }

      // Validar banco de dados pronto
      if (!isReady || !pushData) {
        console.error('Banco de dados não está pronto', { isReady, pushData });
        exibirDialogo('Erro: Banco de dados não está pronto. Tente novamente.', {
          titulo: 'Erro ao enviar',
          severidade: 'error'
        });
        return;
      }

      const remetenteId = userData.id;
      const destinatarioId = novaMensagem.destinatario;
      const remetenteRole = userData.role;
      
      // Buscar dados do destinatário
      const destinatarioData = usuarios.find(u => u.id === destinatarioId);
      
      if (!destinatarioData) {
        console.error('Dados do destinatário não encontrados');
        exibirDialogo('Erro ao encontrar destinatário. Tente novamente.', {
          titulo: 'Erro ao enviar',
          severidade: 'error'
        });
        return;
      }

      // ✅ NOVA LÓGICA: Verificar se a mensagem precisa de aprovação
      // Regra: pai ↔ professor precisa de aprovação
      const precisaAprovacao = 
        (remetenteRole === 'pai' && destinatarioData.role === 'professora') ||
        (remetenteRole === 'professora' && destinatarioData.role === 'pai');

      // ✅ Buscar IDs dos coordenadores
      const coordenadoresIds = usuarios
        .filter(u => u.role === 'coordenadora')
        .map(u => u.id);

      const mensagemData = {
        remetente: {
          id: remetenteId,
          nome: userData.nome || userData.displayName || 'Usuário',
          role: userData.role || 'usuario'
        },
        destinatario: {
          id: destinatarioId,
          nome: destinatarioData.nome,
          role: destinatarioData.role
        },
        assunto: novaMensagem.assunto.trim(),
        conteudo: novaMensagem.conteudo.trim(),
        dataEnvio: new Date().toISOString(),
        lida: false,
        anexos: novaMensagem.anexos || [],
        participantes: [remetenteId, destinatarioId],
        requerAprovacao: precisaAprovacao,
        statusAprovacao: precisaAprovacao ? 'pendente' : 'aprovada',
        aprovadoPor: precisaAprovacao ? null : remetenteId,
        dataAprovacao: precisaAprovacao ? null : new Date().toISOString(),
        coordenadoresParaAprovar: precisaAprovacao ? coordenadoresIds : [],
        motivoRejeicao: null
      };

      console.log('📤 Preparando para enviar mensagem:', mensagemData);
      console.log('📍 Path de salvamento:', mensagensPath);

      let mensagemId;
      try {
        mensagemId = await pushData(mensagensPath, mensagemData);
        console.log('✅ Mensagem salva com ID:', mensagemId);
        console.log('✅ Path completo:', `${mensagensPath}/${mensagemId}`);
      } catch (pushError) {
        console.error('❌ Erro ao salvar mensagem:', pushError);
        exibirDialogo(`Erro ao salvar mensagem: ${pushError.message}`, {
          titulo: 'Erro ao enviar',
          severidade: 'error'
        });
        return;
      }

      // Log do envio de mensagem
      await auditService.logAction(
        LOG_ACTIONS.MESSAGE_SENT,
        userData?.id,
        {
          mensagemId: mensagemId,
          destinatario: {
            id: destinatarioData.id,
            nome: destinatarioData.nome,
            role: destinatarioData.role
          },
          assunto: novaMensagem.assunto,
          temAnexos: (novaMensagem.anexos || []).length > 0,
          quantidadeAnexos: (novaMensagem.anexos || []).length,
          requerAprovacao: precisaAprovacao,
          statusAprovacao: precisaAprovacao ? 'pendente' : 'aprovada'
        }
      );
      
      if (precisaAprovacao) {
        exibirDialogo('Mensagem aguardando aprovação da coordenação para ser entregue.', {
          titulo: 'Mensagem pendente',
          severidade: 'warning'
        });
      } else {
        exibirDialogo('Mensagem enviada com sucesso!', {
          titulo: 'Mensagem enviada',
          severidade: 'success'
        });
      }
      
      fecharDialogNovaMensagem();
      
      // Aguardar um pouco antes de recarregar para garantir persistência
      setTimeout(() => {
        fetchConversas();
      }, 500);
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Log do erro
      await auditService.logAction(
        LOG_ACTIONS.MESSAGE_SEND_ERROR,
        userData?.id,
        {
          erro: error.message,
          destinatario: typeof novaMensagem.destinatario === 'string' ? novaMensagem.destinatario : novaMensagem.destinatario?.nome,
          assunto: novaMensagem.assunto
        }
      );
    }
  };

  const fecharDialogNovaMensagem = () => {
    // Log do cancelamento se havia conteúdo
    if (novaMensagem.destinatario || novaMensagem.assunto || novaMensagem.conteudo || (novaMensagem.anexos && novaMensagem.anexos.length > 0)) {
      auditService.logAction(
        LOG_ACTIONS.MESSAGE_COMPOSE_CANCELLED,
        userData?.id,
        {
          tinhaDestinatario: !!novaMensagem.destinatario,
          tinhaAssunto: !!novaMensagem.assunto,
          tinhaConteudo: !!novaMensagem.conteudo,
          tinhaAnexos: !!(novaMensagem.anexos && novaMensagem.anexos.length > 0)
        }
      );
    }
    
    setDialogNovaMensagem(false);
    setNovaMensagem({ destinatario: '', assunto: '', conteudo: '', anexos: [] });
  };

  const handleUploadAnexo = async (files) => {
    if (!files || files.length === 0) {
      console.log('Nenhum arquivo selecionado');
      return;
    }

    console.log('Iniciando upload de', files.length, 'arquivo(s)');
    console.log('UserData:', userData);
    console.log('Auth currentUser:', auth.currentUser);

    if (!userData || !userData.id) {
      exibirDialogo('Erro: Dados do usuário não encontrados. Faça login novamente.', {
        titulo: 'Erro ao enviar',
        severidade: 'error'
      });
      return;
    }

    if (!auth.currentUser) {
      exibirDialogo('Erro: Usuário não está autenticado. Faça login novamente.', {
        titulo: 'Erro ao enviar',
        severidade: 'error'
      });
      return;
    }

    try {
      console.log('Storage inicializado:', schoolStorage);
      
      const anexosUpload = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const timestamp = new Date().getTime();
        const fileName = `mensagens/${userData.id}/${timestamp}_${file.name}`;
        
        console.log('Preparando upload do arquivo:', {
          nome: file.name,
          tamanho: file.size,
          tipo: file.type,
          caminho: fileName
        });
        
        // Usar _storage (instância real do Firebase Storage)
        const fileRef = storageRef(schoolStorage._storage, fileName);
        console.log('Referência do Storage criada:', fileRef);

        // Upload do arquivo
        console.log('Iniciando upload...');
        const snapshot = await uploadBytes(fileRef, file);
        console.log('Upload concluído:', snapshot);
        
        console.log('Obtendo URL de download...');
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('URL obtida:', downloadURL);

        anexosUpload.push({
          nome: file.name,
          url: downloadURL,
          tipo: file.type,
          tamanho: file.size
        });
      }

      // Atualizar estado com os novos anexos
      setNovaMensagem(prev => ({
        ...prev,
        anexos: [...(prev.anexos || []), ...anexosUpload]
      }));

      // Log do upload de anexos
      await auditService.logAction(
        LOG_ACTIONS.ATTACHMENT_UPLOADED,
        userData?.id,
        {
          context: 'mensagem',
          arquivos: anexosUpload.map(anexo => ({
            nome: anexo.nome,
            tipo: anexo.tipo,
            tamanho: anexo.tamanho
          })),
          quantidade: anexosUpload.length
        }
      );

      console.log('Anexos adicionados ao estado:', anexosUpload);
    } catch (error) {
      console.error('Erro detalhado ao fazer upload dos anexos:', error);
      exibirDialogo(`Erro ao anexar arquivo(s): ${error.message}`, {
        titulo: 'Erro ao enviar',
        severidade: 'error'
      });
      
      // Log do erro no upload
      await auditService.logAction(
        LOG_ACTIONS.ATTACHMENT_UPLOAD_ERROR,
        userData?.id,
        {
          context: 'mensagem',
          erro: error.message,
          arquivos: Array.from(files).map(file => ({
            nome: file.name,
            tipo: file.type,
            tamanho: file.size
          }))
        }
      );
    }
  };

  const removerAnexo = (index) => {
    const anexoRemovido = novaMensagem.anexos[index];
    
    setNovaMensagem(prev => ({
      ...prev,
      anexos: prev.anexos.filter((_, i) => i !== index)
    }));
    
    // Log da remoção do anexo
    auditService.logAction(
      LOG_ACTIONS.ATTACHMENT_REMOVED,
      userData?.id,
      {
        context: 'mensagem',
        arquivo: anexoRemovido ? {
          nome: anexoRemovido.nome,
          tipo: anexoRemovido.tipo,
          tamanho: anexoRemovido.tamanho
        } : null
      }
    );
  };

  const responderMensagem = (mensagem) => {
    // Preencher o modal de nova mensagem com dados da resposta
    setNovaMensagem({
      destinatario: mensagem.remetente?.id || '',
      assunto: `Re: ${mensagem.assunto}`,
      conteudo: '',
      anexos: []
    });
    setDialogNovaMensagem(true);
    
    // Log da abertura de resposta
    auditService.logAction(
      LOG_ACTIONS.MESSAGE_REPLY_STARTED,
      userData?.id,
      {
        mensagemOriginalId: mensagem.id,
        remetente: {
          id: mensagem.remetente?.id,
          nome: mensagem.remetente?.nome
        },
        assuntoOriginal: mensagem.assunto
      }
    );
  };

  const marcarComoLida = async (mensagemId) => {
    if (!isReady || !setData) return;
    
    try {
      await setData(`${mensagensPath}/${mensagemId}`, { ...conversaSelecionada, lida: true });
      
      // Atualizar o estado local
      setConversas(prev => prev.map(conv => 
        conv.id === mensagemId ? { ...conv, lida: true } : conv
      ));
      
      if (conversaSelecionada?.id === mensagemId) {
        setConversaSelecionada(prev => ({ ...prev, lida: true }));
      }
      
      // Log da leitura da mensagem
      await auditService.logAction(
        LOG_ACTIONS.MESSAGE_READ,
        userData?.id,
        {
          mensagemId,
          remetente: {
            id: conversaSelecionada?.remetente?.id,
            nome: conversaSelecionada?.remetente?.nome
          },
          assunto: conversaSelecionada?.assunto
        }
      );
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
    }
  };

  const getConversasFiltradas = () => {
    const userId = myId;
    const euSouCoordenador = userData?.role === 'coordenadora';
    
    return conversas.filter(conversa => {
      const foiEnviadaPorMim = conversa.remetente?.id === userId;
      const foiEnviadaParaMim = conversa.destinatario?.id === userId;
      const estaNoProcessoAprovacao = conversa.coordenadoresParaAprovar?.includes(userId);
      const estaPendente = conversa.statusAprovacao === 'pendente';
      
      // Coordenadora: não duplicar pendentes aqui (ela tem componente próprio)
      if (euSouCoordenador) {
        if (abaConversas === 0) { // Não Lidas (painel normal)
          return foiEnviadaParaMim && !conversa.lida && !estaPendente;
        } else if (abaConversas === 1) { // Lidas
          return foiEnviadaParaMim && conversa.lida && !estaPendente;
        } else { // Enviados
          return foiEnviadaPorMim;
        }
      }

      // Para usuários normais:
      // - Remetente deve ver todas as suas mensagens na aba "Enviados", inclusive pendentes
      if (abaConversas === 2) {
        return foiEnviadaPorMim;
      }

      // - Destinatário NÃO vê mensagens pendentes até aprovação
      if (estaPendente) {
        return false;
      }

      if (abaConversas === 0) { // Não Lidas
        return foiEnviadaParaMim && !conversa.lida;
      } else if (abaConversas === 1) { // Lidas
        return foiEnviadaParaMim && conversa.lida;
      }

      return false;
    });
  };

  const getContadorMensagens = () => {
    const userId = myId;
    const role = userData?.role;

    // Não contar mensagens pendentes como "não lidas" para destinatários comuns.
    const naoLidas = conversas.filter(conversa =>
      conversa.destinatario?.id === userId &&
      !conversa.lida &&
      // Permitir contar pendentes apenas para coordenadora
      (conversa.statusAprovacao !== 'pendente' || role === 'coordenadora')
    ).length;

    const lidas = conversas.filter(conversa =>
      conversa.destinatario?.id === userId &&
      conversa.lida &&
      (conversa.statusAprovacao !== 'pendente' || role === 'coordenadora')
    ).length;

    // Enviados devem mostrar todas as mensagens que o usuário enviou (incl. pendentes)
    const enviados = conversas.filter(conversa =>
      conversa.remetente?.id === userId
    ).length;

    return { naoLidas, lidas, enviados };
  };

  const formatarData = (dataISO) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'coordenadora': return <School sx={{ fontSize: 16 }} />;
      case 'professora': return <Person sx={{ fontSize: 16 }} />;
      case 'pai': return <Person sx={{ fontSize: 16 }} />;
      default: return <Circle sx={{ fontSize: 16 }} />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'coordenadora': return '#8B5CF6';
      case 'professora': return '#10B981';
      case 'pai': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const aprovarMensagem = async (mensagemId, mensagemAtual) => {
    if (!isReady || !setData) return;

    try {
      await setData(`${mensagensPath}/${mensagemId}`, {
        ...mensagemAtual,
        statusAprovacao: 'aprovada',
        aprovadoPor: userData.id,
        dataAprovacao: new Date().toISOString()
      });

      await fetchConversas();
      exibirDialogo('Mensagem aprovada com sucesso!', {
        titulo: 'Sucesso',
        severidade: 'success'
      });
    } catch (error) {
      console.error('Erro ao aprovar mensagem:', error);
      exibirDialogo('Erro ao aprovar mensagem.', {
        titulo: 'Erro',
        severidade: 'error'
      });
    }
  };

  const rejeitarMensagem = async (mensagemId, mensagemAtual, motivo = '') => {
    if (!isReady || !setData) return;

    try {
      await setData(`${mensagensPath}/${mensagemId}`, {
        ...mensagemAtual,
        statusAprovacao: 'rejeitada',
        aprovadoPor: userData.id,
        dataAprovacao: new Date().toISOString(),
        motivoRejeicao: motivo
      });

      await fetchConversas();
      exibirDialogo('Mensagem rejeitada com sucesso!', {
        titulo: 'Sucesso',
        severidade: 'success'
      });
    } catch (error) {
      console.error('Erro ao rejeitar mensagem:', error);
      exibirDialogo('Erro ao rejeitar mensagem.', {
        titulo: 'Erro',
        severidade: 'error'
      });
    }
  };

  if (loading) {
    return <Typography>Carregando mensagens...</Typography>;
  }

  return (
    <Box>
      {userData?.role === 'coordenadora' && (
        <Box sx={{ mb: 3 }}>
          <MensagensPendentes
            userData={userData}
            conversas={conversas}
            onAprovar={aprovarMensagem}
            onRejeitar={rejeitarMensagem}
            isReady={isReady}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          📧 Mensagens
        </Typography>
        <Fab 
          size="medium"
          color="primary"
          onClick={() => {
            setDialogNovaMensagem(true);
            // Log da abertura do dialog de nova mensagem
            auditService.logAction(
              LOG_ACTIONS.MESSAGE_COMPOSE_STARTED,
              userData?.id,
              {}
            );
          }}
          sx={{ 
            background: 'linear-gradient(45deg, #3B82F6, #1D4ED8)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1D4ED8, #1E3A8A)'
            }
          }}
        >
          <Email />
        </Fab>
      </Box>

      <Grid container spacing={3} sx={{ minHeight: '600px' }}>
        {/* Lista de Conversas */}
        <Grid item xs={12}>
          <Card sx={{ 
            height: '600px', 
            display: 'flex', 
            flexDirection: 'column',
            width: '100%',
            maxWidth: '800px',
            mx: 'auto'
          }}>
            <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Painel de Conversas */}
              <Box sx={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%'
              }}>
                {/* Header com Abas */}
                <Box sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
                    Conversas
                  </Typography>
                  <Tabs 
                    value={abaConversas} 
                    onChange={(e, newValue) => {
                      const abaAnterior = abaConversas;
                      setAbaConversas(newValue);
                      
                      // Log da mudança de aba
                      const abas = ['Não Lidas', 'Lidas', 'Enviados'];
                      auditService.logAction(
                        LOG_ACTIONS.MESSAGE_FILTER_CHANGED,
                        userData?.id,
                        {
                          filtroAnterior: abas[abaAnterior],
                          novoFiltro: abas[newValue]
                        }
                      );
                    }}
                    variant="fullWidth"
                    sx={{ 
                      minHeight: 40,
                      '& .MuiTab-root': { 
                        minHeight: 40,
                        textTransform: 'none',
                        fontSize: '0.875rem'
                      }
                    }}
                  >
                    <Tab 
                      icon={<Badge badgeContent={getContadorMensagens().naoLidas} color="error">
                        <Drafts />
                      </Badge>}
                      label="Não Lidas" 
                      iconPosition="start"
                    />
                    <Tab 
                      icon={<Badge badgeContent={getContadorMensagens().lidas} color="primary">
                        <Email />
                      </Badge>}
                      label="Lidas" 
                      iconPosition="start"
                    />
                    <Tab 
                      icon={<Badge badgeContent={getContadorMensagens().enviados} color="success">
                        <Send />
                      </Badge>}
                      label="Enviados" 
                      iconPosition="start"
                    />
                  </Tabs>
                </Box>
              
              {getConversasFiltradas().length === 0 ? (
                <Box sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '300px'
                }}>
                  <Email sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                  <Typography color="text.secondary">
                    {abaConversas === 0 
                      ? 'Nenhuma mensagem não lida' 
                      : abaConversas === 1 
                      ? 'Nenhuma mensagem lida' 
                      : 'Nenhuma mensagem enviada'
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {abaConversas === 0 
                      ? 'Todas as suas mensagens estão em dia!' 
                      : abaConversas === 1 
                      ? 'Navegue para "Não Lidas" para ver novas mensagens' 
                      : 'Clique em "Nova Mensagem" para enviar sua primeira mensagem'
                    }
                  </Typography>
                </Box>
              ) : (
                <List sx={{ 
                  p: 0, 
                  flex: 1, 
                  overflow: 'auto',
                  maxHeight: 'calc(600px - 140px)' // Altura total menos header e abas
                }}>
                  {getConversasFiltradas().map((conversa) => {
                    const isNaoLida = conversa.destinatario?.id === userData?.id && !conversa.lida;
                    const isEnviada = conversa.remetente?.id === userData?.id;
                    
                    return (
                      <ListItem 
                        key={conversa.id}
                        component="div"
                        selected={conversaSelecionada?.id === conversa.id}
                        onClick={() => {
                          setConversaSelecionada(conversa);
                          // Marcar como lida automaticamente quando clicar (somente mensagens recebidas)
                          if (isNaoLida && !isEnviada) {
                            marcarComoLida(conversa.id);
                          }
                          
                          // Log da visualização da mensagem
                          auditService.logAction(
                            LOG_ACTIONS.MESSAGE_VIEWED,
                            userData?.id,
                            {
                              mensagemId: conversa.id,
                              remetente: {
                                id: conversa.remetente?.id,
                                nome: conversa.remetente?.nome
                              },
                              destinatario: {
                                id: conversa.destinatario?.id,
                                nome: conversa.destinatario?.nome
                              },
                              assunto: conversa.assunto,
                              jaLida: conversa.lida
                            }
                          );
                        }}
                        sx={{ 
                          borderBottom: '1px solid #f3f4f6',
                          backgroundColor: isNaoLida 
                            ? '#fef3c7' 
                            : isEnviada 
                            ? '#f0f9ff' 
                            : 'transparent',
                          fontWeight: isNaoLida ? 600 : 400,
                          borderLeft: isEnviada ? '3px solid #3B82F6' : 'none',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: isNaoLida 
                              ? '#fde68a' 
                              : isEnviada 
                              ? '#e0f2fe' 
                              : '#f9fafb'
                          },
                          '&.Mui-selected': {
                            backgroundColor: '#dbeafe',
                            '&:hover': {
                              backgroundColor: '#bfdbfe'
                            }
                          }
                        }}
                    >
                      <ListItemAvatar>
                        <Badge 
                          color="error" 
                          variant="dot" 
                          invisible={conversa.lida || isEnviada}
                        >
                          <Avatar sx={{ bgcolor: getRoleColor(isEnviada ? conversa.destinatario?.role : conversa.remetente?.role) }}>
                            {getRoleIcon(isEnviada ? conversa.destinatario?.role : conversa.remetente?.role)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <Box sx={{ flex: 1, minWidth: 0, ml: 2 }}>
                        {/* Header da conversa */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={600} component="div">
                            {isEnviada 
                              ? `Para: ${conversa.destinatario?.nome}` 
                              : `De: ${conversa.remetente?.nome}`
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary" component="span">
                            {formatarData(conversa.dataEnvio).split(' às ')[0]}
                          </Typography>
                        </Box>
                        
                        {/* Assunto e anexos */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={500} color="primary" component="div">
                            {conversa.assunto}
                          </Typography>
                          {conversa.anexos && conversa.anexos.length > 0 && (
                            <Chip 
                              size="small" 
                              icon={<AttachFile />} 
                              label={conversa.anexos.length}
                              sx={{ height: 18, fontSize: '0.6rem' }}
                            />
                          )}
                        </Box>
                        
                        {/* Conteúdo */}
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          component="div"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {conversa.conteudo}
                        </Typography>
                      </Box>
                    </ListItem>
                    );
                  })}
                </List>
              )}
              </Box>
            </CardContent>
          </Card>
        </Grid>


      </Grid>

      {/* Dialog Nova Mensagem */}
      <Dialog 
        open={dialogNovaMensagem} 
        onClose={fecharDialogNovaMensagem}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {novaMensagem.assunto && novaMensagem.assunto.startsWith('Re: ') ? '↩️ Responder Mensagem' : '✉️ Nova Mensagem'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {novaMensagem.assunto && novaMensagem.assunto.startsWith('Re: ') && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Você está respondendo à mensagem: <strong>{novaMensagem.assunto.replace('Re: ', '')}</strong>
                </Typography>
              </Alert>
            )}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Destinatário</InputLabel>
              <Select
                value={novaMensagem.destinatario}
                onChange={(e) => setNovaMensagem({ ...novaMensagem, destinatario: e.target.value })}
              >
                {usuarios.map((usuario) => (
                  <MenuItem key={usuario.id} value={usuario.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: getRoleColor(usuario.role) }}>
                        {getRoleIcon(usuario.role)}
                      </Avatar>
                      {usuario.nome} 
                      <Chip size="small" label={usuario.role} />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Assunto"
              value={novaMensagem.assunto}
              onChange={(e) => setNovaMensagem({ ...novaMensagem, assunto: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Mensagem"
              multiline
              rows={6}
              value={novaMensagem.conteudo}
              onChange={(e) => setNovaMensagem({ ...novaMensagem, conteudo: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Button
              variant="outlined"
              startIcon={<AttachFile />}
              component="label"
              sx={{ mb: 2 }}
            >
              Anexar Arquivo
              <input
                type="file"
                hidden
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                onChange={(e) => {
                  console.log('Arquivos selecionados:', e.target.files);
                  handleUploadAnexo(e.target.files);
                }}
              />
            </Button>

            {/* Lista de anexos selecionados */}
            {novaMensagem.anexos && novaMensagem.anexos.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Anexos selecionados:
                </Typography>
                {novaMensagem.anexos.map((anexo, index) => (
                  <Chip
                    key={index}
                    label={anexo.nome}
                    icon={<AttachFile />}
                    onDelete={() => removerAnexo(index)}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharDialogNovaMensagem}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Send />}
            onClick={enviarMensagem}
            disabled={!novaMensagem.destinatario || !novaMensagem.assunto || !novaMensagem.conteudo}
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Visualizar Mensagem */}
      <Dialog 
        open={Boolean(conversaSelecionada)} 
        onClose={() => setConversaSelecionada(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '80vh',
            height: '600px'
          }
        }}
      >
        {conversaSelecionada && (
          <>
            <DialogTitle sx={{ 
              p: 0, 
              background: 'linear-gradient(45deg, #3B82F6, #1D4ED8)',
              color: 'white'
            }}>
              <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)' }}>
                    {getRoleIcon(conversaSelecionada.remetente?.role)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="white">
                      {conversaSelecionada.assunto}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        De: {conversaSelecionada.remetente?.nome}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={conversaSelecionada.remetente?.role}
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    size="small"
                    onClick={() => {
                      responderMensagem(conversaSelecionada);
                      setConversaSelecionada(null);
                    }}
                    title="Responder mensagem"
                    sx={{ color: 'white' }}
                  >
                    <Reply />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Conteúdo da Mensagem */}
              <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2, fontSize: '1rem' }}>
                  {conversaSelecionada.conteudo}
                </Typography>
                
                {conversaSelecionada.anexos && conversaSelecionada.anexos.length > 0 && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachFile fontSize="small" />
                      Anexos ({conversaSelecionada.anexos.length}):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {conversaSelecionada.anexos.map((anexo, index) => (
                        <Chip 
                          key={index}
                          label={`${anexo.nome} ${anexo.tamanho ? `(${Math.round(anexo.tamanho / 1024)}KB)` : ''}`}
                          icon={<AttachFile />}
                          onClick={() => {
                            if (anexo.url) {
                              // Log do download/visualização do anexo
                              auditService.logAction(
                                LOG_ACTIONS.ATTACHMENT_DOWNLOADED,
                                userData?.id,
                                {
                                  context: 'mensagem',
                                  mensagemId: conversaSelecionada.id,
                                  arquivo: {
                                    nome: anexo.nome,
                                    tipo: anexo.tipo,
                                    tamanho: anexo.tamanho
                                  },
                                  remetente: conversaSelecionada.remetente?.nome
                                }
                              );
                              window.open(anexo.url, '_blank');
                            } else {
                              exibirDialogo('URL do anexo não encontrada', {
                                titulo: 'Erro',
                                severidade: 'error'
                              });
                            }
                          }}
                          sx={{ 
                            mr: 1, 
                            mb: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: '#e3f2fd'
                            }
                          }}
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ 
              p: 3, 
              bgcolor: '#f8fafc', 
              borderTop: '1px solid #e5e7eb',
              justifyContent: 'space-between'
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule fontSize="small" />
                {formatarData(conversaSelecionada.dataEnvio)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => setConversaSelecionada(null)}>
                  Fechar
                </Button>
                {conversaSelecionada.remetente?.id !== userData?.id && (
                  <Button
                    variant="contained"
                    startIcon={<Reply />}
                    onClick={() => {
                      responderMensagem(conversaSelecionada);
                      setConversaSelecionada(null);
                    }}
                    sx={{
                      background: 'linear-gradient(45deg, #3B82F6, #1D4ED8)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1D4ED8, #1E3A8A)'
                      }
                    }}
                  >
                    Responder
                  </Button>
                )}
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog de feedback (substitui alert) */}
      <Dialog open={feedbackDialog.open} onClose={fecharDialogoFeedback} maxWidth="xs" fullWidth>
        <DialogTitle>{feedbackDialog.titulo}</DialogTitle>
        <DialogContent>
          <Alert severity={feedbackDialog.severidade}>
            {feedbackDialog.mensagem}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharDialogoFeedback}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MensagensSection;