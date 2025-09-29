import React, { useState, useEffect } from 'react';
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
import { db, ref, get, push, set, storage, storageRef, uploadBytes, getDownloadURL, auth } from '../../../firebase';

const MensagensSection = ({ userRole, userData }) => {
  const [conversas, setConversas] = useState([]);
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [dialogNovaMensagem, setDialogNovaMensagem] = useState(false);
  const [loading, setLoading] = useState(true);
  const [abaConversas, setAbaConversas] = useState(0); // 0: Não Lidas, 1: Lidas, 2: Enviados
  const [novaMensagem, setNovaMensagem] = useState({
    destinatario: null,
    assunto: '',
    conteudo: '',
    anexos: []
  });
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    fetchConversas();
    fetchUsuarios();
  }, [userData]);

  const fetchConversas = async () => {
    try {
      const mensagensRef = ref(db, 'mensagens');
      const snap = await get(mensagensRef);
      
      if (snap.exists()) {
        const dados = snap.val();
        const conversasList = Object.entries(dados).map(([id, conversa]) => ({
          id,
          ...conversa
        }));
        
        // Filtrar conversas baseado na role
        const conversasFiltradas = conversasList.filter(conversa => {
          if (userRole === 'coordenadora') return true;
          return conversa.participantes?.includes(userData?.id || userData?.uid);
        });
        
        setConversas(conversasFiltradas);
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const usuariosRef = ref(db, 'usuarios');
      const snap = await get(usuariosRef);
      
      if (snap.exists()) {
        const dados = snap.val();
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

  const enviarMensagem = async () => {
    try {
      // Validar se userData existe e tem ID
      if (!userData) {
        console.error('Dados do usuário não encontrados');
        alert('Erro: Dados do usuário não carregados. Tente novamente.');
        return;
      }

      if (!userData.id) {
        console.error('ID do usuário não encontrado:', userData);
        alert('Erro: ID do usuário não encontrado. Faça login novamente.');
        return;
      }

      // Validar se destinatário foi selecionado
      if (!novaMensagem.destinatario || !novaMensagem.destinatario.id) {
        console.error('Destinatário não selecionado');
        alert('Por favor, selecione um destinatário.');
        return;
      }

      // Validar se assunto e conteúdo foram preenchidos
      if (!novaMensagem.assunto?.trim()) {
        alert('Por favor, digite um assunto para a mensagem.');
        return;
      }

      if (!novaMensagem.conteudo?.trim()) {
        alert('Por favor, digite o conteúdo da mensagem.');
        return;
      }

      const remetenteId = userData.id;
      const destinatarioId = novaMensagem.destinatario.id;

      const mensagemData = {
        remetente: {
          id: remetenteId,
          nome: userData.nome || userData.displayName || 'Usuário',
          role: userData.role || 'usuario'
        },
        destinatario: {
          id: destinatarioId,
          nome: novaMensagem.destinatario.nome,
          role: novaMensagem.destinatario.role
        },
        assunto: novaMensagem.assunto,
        conteudo: novaMensagem.conteudo,
        dataEnvio: new Date().toISOString(),
        lida: false,
        anexos: novaMensagem.anexos || [],
        participantes: [remetenteId, destinatarioId]
      };

      const mensagensRef = ref(db, 'mensagens');
      await push(mensagensRef, mensagemData);
      
      fecharDialogNovaMensagem();
      fetchConversas();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const fecharDialogNovaMensagem = () => {
    setDialogNovaMensagem(false);
    setNovaMensagem({ destinatario: null, assunto: '', conteudo: '', anexos: [] });
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
      alert('Erro: Dados do usuário não encontrados. Faça login novamente.');
      return;
    }

    if (!auth.currentUser) {
      alert('Erro: Usuário não está autenticado. Faça login novamente.');
      return;
    }

    try {
      console.log('Storage inicializado:', storage);
      
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
        
        const fileRef = storageRef(storage, fileName);
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

      console.log('Anexos adicionados ao estado:', anexosUpload);
    } catch (error) {
      console.error('Erro detalhado ao fazer upload dos anexos:', error);
      alert(`Erro ao anexar arquivo(s): ${error.message}`);
    }
  };

  const removerAnexo = (index) => {
    setNovaMensagem(prev => ({
      ...prev,
      anexos: prev.anexos.filter((_, i) => i !== index)
    }));
  };

  const marcarComoLida = async (mensagemId) => {
    try {
      const mensagemRef = ref(db, `mensagens/${mensagemId}`);
      await set(mensagemRef, { ...conversaSelecionada, lida: true });
      
      // Atualizar o estado local
      setConversas(prev => prev.map(conv => 
        conv.id === mensagemId ? { ...conv, lida: true } : conv
      ));
      
      if (conversaSelecionada?.id === mensagemId) {
        setConversaSelecionada(prev => ({ ...prev, lida: true }));
      }
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
    }
  };

  const getConversasFiltradas = () => {
    const userId = userData?.id;
    
    return conversas.filter(conversa => {
      const foiEnviadaPorMim = conversa.remetente?.id === userId;
      const foiEnviadaParaMim = conversa.destinatario?.id === userId;
      
      if (abaConversas === 0) { // Não Lidas
        return foiEnviadaParaMim && !conversa.lida;
      } else if (abaConversas === 1) { // Lidas (recebidas e já lidas)
        return foiEnviadaParaMim && conversa.lida;
      } else { // Enviados (abaConversas === 2)
        return foiEnviadaPorMim;
      }
    });
  };

  const getContadorMensagens = () => {
    const userId = userData?.id;
    
    const naoLidas = conversas.filter(conversa => 
      conversa.destinatario?.id === userId && !conversa.lida
    ).length;
    
    const lidas = conversas.filter(conversa => 
      conversa.destinatario?.id === userId && conversa.lida
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

  if (loading) {
    return <Typography>Carregando mensagens...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          📧 Mensagens
        </Typography>
        <Fab 
          size="medium"
          color="primary"
          onClick={() => setDialogNovaMensagem(true)}
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
        <Grid item xs={12} md={conversaSelecionada ? 4 : 12} lg={conversaSelecionada ? 4 : 12}>
          <Card sx={{ 
            height: '600px', 
            display: 'flex', 
            flexDirection: 'column',
            width: '100%',
            maxWidth: conversaSelecionada ? 'none' : '800px',
            mx: conversaSelecionada ? 0 : 'auto'
          }}>
            <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header com Abas */}
              <Box sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
                  Conversas
                </Typography>
                <Tabs 
                  value={abaConversas} 
                  onChange={(e, newValue) => setAbaConversas(newValue)}
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
                        button
                        selected={conversaSelecionada?.id === conversa.id}
                        onClick={() => {
                          setConversaSelecionada(conversa);
                          // Marcar como lida automaticamente quando clicar (somente mensagens recebidas)
                          if (isNaoLida && !isEnviada) {
                            marcarComoLida(conversa.id);
                          }
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
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {isEnviada 
                                ? `Para: ${conversa.destinatario?.nome}` 
                                : `De: ${conversa.remetente?.nome}`
                              }
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatarData(conversa.dataEnvio).split(' às ')[0]}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={500} color="primary">
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
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {conversa.conteudo}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Visualizador de Conversa */}
        {conversaSelecionada && (
          <Grid item xs={12} md={8} lg={4}>
          <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            {conversaSelecionada ? (
              <>
                {/* Header da Conversa */}
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: getRoleColor(conversaSelecionada.remetente?.role) }}>
                        {getRoleIcon(conversaSelecionada.remetente?.role)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {conversaSelecionada.assunto}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            De: {conversaSelecionada.remetente?.nome}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={conversaSelecionada.remetente?.role}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small">
                        <Reply />
                      </IconButton>
                      <IconButton size="small">
                        <Forward />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                {/* Conteúdo da Mensagem */}
                <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
                  <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
                    {conversaSelecionada.conteudo}
                  </Typography>
                  
                  {conversaSelecionada.anexos && conversaSelecionada.anexos.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
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
                                window.open(anexo.url, '_blank');
                              } else {
                                alert('URL do anexo não encontrada');
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

                {/* Footer com Data */}
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
                  <Typography variant="body2" color="text.secondary">
                    📅 {formatarData(conversaSelecionada.dataEnvio)}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
                color: 'text.secondary'
              }}>
                <Drafts sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6">
                  Selecione uma conversa para visualizar
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
        )}
      </Grid>

      {/* Dialog Nova Mensagem */}
      <Dialog 
        open={dialogNovaMensagem} 
        onClose={fecharDialogNovaMensagem}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>✉️ Nova Mensagem</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Destinatário</InputLabel>
              <Select
                value={novaMensagem.destinatario}
                onChange={(e) => setNovaMensagem({ ...novaMensagem, destinatario: e.target.value })}
              >
                {usuarios.map((usuario) => (
                  <MenuItem key={usuario.id} value={usuario}>
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
            disabled={!novaMensagem.destinatario || !novaMensagem.destinatario.id || !novaMensagem.assunto || !novaMensagem.conteudo}
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MensagensSection;