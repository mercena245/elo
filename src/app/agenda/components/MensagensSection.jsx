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
  Alert
} from '@mui/material';
import {
  Email,
  Reply,
  Forward,
  Attach,
  Send,
  Drafts,
  Schedule,
  Person,
  School,
  Circle
} from '@mui/icons-material';
import { db, ref, get, push, set } from '../../../firebase';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const MensagensSection = ({ userRole, userData }) => {
  const [conversas, setConversas] = useState([]);
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [dialogNovaMensagem, setDialogNovaMensagem] = useState(false);
  const [loading, setLoading] = useState(true);
  const [novaMensagem, setNovaMensagem] = useState({
    destinatario: '',
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
      const mensagemData = {
        remetente: {
          id: userData?.id || userData?.uid,
          nome: userData?.nome || userData?.displayName,
          role: userData?.role
        },
        destinatario: novaMensagem.destinatario,
        assunto: novaMensagem.assunto,
        conteudo: novaMensagem.conteudo,
        dataEnvio: new Date().toISOString(),
        lida: false,
        anexos: novaMensagem.anexos,
        participantes: [userData?.id || userData?.uid, novaMensagem.destinatario.id]
      };

      const mensagensRef = ref(db, 'mensagens');
      await push(mensagensRef, mensagemData);
      
      setDialogNovaMensagem(false);
      setNovaMensagem({ destinatario: '', assunto: '', conteudo: '', anexos: [] });
      fetchConversas();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
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
        <Button 
          variant="contained" 
          startIcon={<Email />}
          onClick={() => setDialogNovaMensagem(true)}
          sx={{ 
            background: 'linear-gradient(45deg, #3B82F6, #1D4ED8)',
            textTransform: 'none'
          }}
        >
          Nova Mensagem
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Lista de Conversas */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Typography variant="h6" sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                Conversas
              </Typography>
              
              {conversas.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Email sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                  <Typography color="text.secondary">
                    Nenhuma conversa encontrada
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {conversas.map((conversa) => (
                    <ListItem 
                      key={conversa.id}
                      button
                      selected={conversaSelecionada?.id === conversa.id}
                      onClick={() => setConversaSelecionada(conversa)}
                      sx={{ 
                        borderBottom: '1px solid #f3f4f6',
                        '&:hover': { bgcolor: '#f8fafc' }
                      }}
                    >
                      <ListItemAvatar>
                        <Badge 
                          color="error" 
                          variant="dot" 
                          invisible={conversa.lida}
                        >
                          <Avatar sx={{ bgcolor: getRoleColor(conversa.remetente?.role) }}>
                            {getRoleIcon(conversa.remetente?.role)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {conversa.remetente?.nome}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatarData(conversa.dataEnvio).split(' às ')[0]}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" fontWeight={500} color="primary">
                              {conversa.assunto}
                            </Typography>
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
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Visualizador de Conversa */}
        <Grid item xs={12} md={8}>
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
                        Anexos:
                      </Typography>
                      {conversaSelecionada.anexos.map((anexo, index) => (
                        <Chip 
                          key={index}
                          label={anexo.nome}
                          icon={<Attach />}
                          onClick={() => window.open(anexo.url, '_blank')}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
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
      </Grid>

      {/* Dialog Nova Mensagem */}
      <Dialog 
        open={dialogNovaMensagem} 
        onClose={() => setDialogNovaMensagem(false)}
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
              startIcon={<Attach />}
              component="label"
              sx={{ mb: 2 }}
            >
              Anexar Arquivo
              <input
                type="file"
                hidden
                multiple
                onChange={(e) => {
                  // Implementar upload de arquivos
                  console.log('Arquivos selecionados:', e.target.files);
                }}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogNovaMensagem(false)}>
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
    </Box>
  );
};

export default MensagensSection;