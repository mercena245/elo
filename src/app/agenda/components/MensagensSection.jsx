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
  const { getData, setData, pushData, updateData, isReady, storage: schoolStorage, listen } = useSchoolDatabase();

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
    console.log('🔄 [MensagensSection] useEffect disparado');
    console.log('📊 [MensagensSection] Estado atual:', {
      isReady,
      userDataId: userData?.id,
      userName: userData?.nome,
      userRole: userData?.role
    });

    if (!isReady || !userData?.id) {
      console.log('⏸️ [MensagensSection] Aguardando isReady ou userData');
      return;
    }

    console.log('✅ [MensagensSection] Configurando listener para path:', mensagensPath);
    console.log('✅ [MensagensSection] Função listen disponível:', typeof listen);

    try {
      const unsubscribe = listen(mensagensPath, (dados) => {
        console.log('🔥 [MensagensSection] Callback do listener chamado!');
        console.log('📦 [MensagensSection] Tipo de dados recebido:', typeof dados);

        if (!dados || typeof dados !== 'object') {
          console.log('⚠️ [MensagensSection] Dados inválidos - limpando conversas');
          setConversas([]);
          setLoading(false);
          return;
        }

        console.log('✅ [MensagensSection] Dados válidos - processando...');

        // ✅ FILTRAR APENAS MENSAGENS VÁLIDAS
        const list = Object.entries(dados)
          .map(([id, m]) => ({ id, ...m }))
          .filter(m => {
            const temAssunto = m.assunto && m.assunto.trim();
            const temRemetente = m.remetente?.id;
            const temDestinatario = m.destinatario?.id;
            
            if (!temAssunto || !temRemetente || !temDestinatario) {
              console.warn('⚠️ [MensagensSection] Mensagem inválida ignorada:', {
                id: m.id,
                temAssunto,
                temRemetente,
                temDestinatario
              });
              return false;
            }
            
            return true;
          })
          .sort((a, b) => new Date(b?.dataEnvio || 0) - new Date(a?.dataEnvio || 0));
        
        console.log('✅ [MensagensSection] Lista processada:', {
          total: list.length,
          primeiros3IDs: list.slice(0, 3).map(m => m.id),
          primeiros3Assuntos: list.slice(0, 3).map(m => m.assunto)
        });

        setConversas(list);
        console.log('🔥 [MensagensSection] setConversas() chamado com', list.length, 'mensagens');
        setLoading(false);
      });

      console.log('✅ [MensagensSection] Listener configurado com sucesso');
      
      return () => {
        console.log('🛑 [MensagensSection] Limpando listener');
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error('❌ [MensagensSection] Erro ao configurar listener:', error);
      setLoading(false);
    }
  }, [isReady, userData?.id, listen]);

  useEffect(() => {
    if (isReady && userData?.id) {
      fetchUsuarios();
    }
  }, [isReady, userData?.id]);

  const fetchUsuarios = async () => {
    if (!isReady) return;
    
    try {
      const dados = await getData('usuarios');
      
      if (dados) {
        const usuariosList = Object.entries(dados).map(([id, usuario]) => ({
          id,
          ...usuario
        }));
        
        let usuariosFiltrados = usuariosList;
        
        if (userRole === 'pai') {
          usuariosFiltrados = usuariosList.filter(u => 
            u.role === 'professora' || u.role === 'coordenadora'
          );
        } else if (userRole === 'professora') {
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
      if (!userData || !userData.id) {
        exibirDialogo('Erro: Dados do usuário não carregados. Tente novamente.', {
          titulo: 'Erro ao enviar',
          severidade: 'error'
        });
        return;
      }

      if (!novaMensagem.destinatario) {
        exibirDialogo('Por favor, selecione um destinatário.', {
          titulo: 'Aviso',
          severidade: 'warning'
        });
        return;
      }

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

      if (!isReady || !pushData) {
        exibirDialogo('Erro: Banco de dados não está pronto. Tente novamente.', {
          titulo: 'Erro ao enviar',
          severidade: 'error'
        });
        return;
      }

      const remetenteId = userData.id;
      const destinatarioId = novaMensagem.destinatario;
      const remetenteRole = userData.role;
      
      const destinatarioData = usuarios.find(u => u.id === destinatarioId);
      
      if (!destinatarioData) {
        exibirDialogo('Erro ao encontrar destinatário. Tente novamente.', {
          titulo: 'Erro ao enviar',
          severidade: 'error'
        });
        return;
      }

      const precisaAprovacao = 
        (remetenteRole === 'pai' && destinatarioData.role === 'professora') ||
        (remetenteRole === 'professora' && destinatarioData.role === 'pai');

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

      let mensagemId;
      try {
        mensagemId = await pushData(mensagensPath, mensagemData);
      } catch (pushError) {
        exibirDialogo(`Erro ao salvar mensagem: ${pushError.message}`, {
          titulo: 'Erro ao enviar',
          severidade: 'error'
        });
        return;
      }

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
      // ✅ Não precisa mais chamar fetchConversas() - listener atualiza automaticamente!
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
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
    if (!files || files.length === 0) return;

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
      const anexosUpload = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const timestamp = new Date().getTime();
        const fileName = `mensagens/${userData.id}/${timestamp}_${file.name}`;
        
        const fileRef = storageRef(schoolStorage._storage, fileName);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        anexosUpload.push({
          nome: file.name,
          url: downloadURL,
          tipo: file.type,
          tamanho: file.size
        });
      }

      setNovaMensagem(prev => ({
        ...prev,
        anexos: [...(prev.anexos || []), ...anexosUpload]
      }));

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
    } catch (error) {
      console.error('Erro detalhado ao fazer upload dos anexos:', error);
      exibirDialogo(`Erro ao anexar arquivo(s): ${error.message}`, {
        titulo: 'Erro ao enviar',
        severidade: 'error'
      });
      
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
    setNovaMensagem({
      destinatario: mensagem.remetente?.id || '',
      assunto: `Re: ${mensagem.assunto}`,
      conteudo: '',
      anexos: []
    });
    setDialogNovaMensagem(true);
    
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
      
      setConversas(prev => prev.map(conv => 
        conv.id === mensagemId ? { ...conv, lida: true } : conv
      ));
      
      if (conversaSelecionada?.id === mensagemId) {
        setConversaSelecionada(prev => ({ ...prev, lida: true }));
      }
      
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
    console.log('🔍 [getConversasFiltradas] Iniciando filtro');
    console.log('📊 [getConversasFiltradas] Total de conversas:', conversas.length);
    console.log('👤 [getConversasFiltradas] myId:', myId);
    console.log('🎯 [getConversasFiltradas] Aba selecionada:', abaConversas);
    console.log('👨 [getConversasFiltradas] userRole:', userData?.role);
    
    const userId = myId;
    const euSouCoordenador = userData?.role === 'coordenadora';
    
    const resultado = conversas.filter(conversa => {
      const foiEnviadaPorMim = conversa.remetente?.id === userId;
      const foiEnviadaParaMim = conversa.destinatario?.id === userId;
      const estaPendente = conversa.statusAprovacao === 'pendente';
      
      console.log('🔎 [filtro] Mensagem:', {
        id: conversa.id,
        assunto: conversa.assunto?.substring(0, 30),
        remetenteId: conversa.remetente?.id,
        destinatarioId: conversa.destinatario?.id,
        foiEnviadaPorMim,
        foiEnviadaParaMim,
        estaPendente,
        lida: conversa.lida
      });
      
      if (euSouCoordenador) {
        if (abaConversas === 0) {
          const passou = foiEnviadaParaMim && !conversa.lida && !estaPendente;
          console.log('✅ [filtro] Coordenadora/NãoLidas:', passou);
          return passou;
        } else if (abaConversas === 1) {
          const passou = foiEnviadaParaMim && conversa.lida && !estaPendente;
          console.log('✅ [filtro] Coordenadora/Lidas:', passou);
          return passou;
        } else {
          const passou = foiEnviadaPorMim;
          console.log('✅ [filtro] Coordenadora/Enviadas:', passou);
          return passou;
        }
      }

      if (abaConversas === 2) {
        const passou = foiEnviadaPorMim;
        console.log('✅ [filtro] User/Enviadas:', passou);
        return passou;
      }

      if (estaPendente) {
        console.log('❌ [filtro] Pendente - ignorando');
        return false;
      }

      if (abaConversas === 0) {
        const passou = foiEnviadaParaMim && !conversa.lida;
        console.log('✅ [filtro] User/NãoLidas:', passou);
        return passou;
      } else if (abaConversas === 1) {
        const passou = foiEnviadaParaMim && conversa.lida;
        console.log('✅ [filtro] User/Lidas:', passou);
        return passou;
      }

      console.log('❌ [filtro] Não passou em nenhum filtro');
      return false;
    });
    
    console.log('✅ [getConversasFiltradas] Resultado final:', resultado.length, 'mensagens');
    console.log('📋 [getConversasFiltradas] IDs das mensagens filtradas:', resultado.slice(0, 5).map(m => m.id));
    return resultado;
  };

  const getContadorMensagens = () => {
    const userId = myId;
    const role = userData?.role;

    const naoLidas = conversas.filter(conversa =>
      conversa.destinatario?.id === userId &&
      !conversa.lida &&
      (conversa.statusAprovacao !== 'pendente' || role === 'coordenadora')
    ).length;

    const lidas = conversas.filter(conversa =>
      conversa.destinatario?.id === userId &&
      conversa.lida &&
      (conversa.statusAprovacao !== 'pendente' || role === 'coordenadora')
    ).length;

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
              <Box sx={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%'
              }}>
                <Box sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
                    Conversas
                  </Typography>
                  <Tabs 
                    value={abaConversas} 
                    onChange={(e, newValue) => {
                      const abaAnterior = abaConversas;
                      setAbaConversas(newValue);
                      
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
                  maxHeight: 'calc(600px - 140px)'
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
                          if (isNaoLida && !isEnviada) {
                            marcarComoLida(conversa.id);
                          }
                          
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
                onChange={(e) => handleUploadAnexo(e.target.files)}
              />
            </Button>

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

      {/* Dialog de feedback */}
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