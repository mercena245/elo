import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  Paper,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Badge,
  IconButton,
  Fab,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Assignment,
  Add,
  Person,
  CheckCircle,
  Pending,
  Cancel,
  Schedule,
  Description,
  Send,
  Visibility,
  Edit,
  Download,
  Upload,
  Warning,
  School,
  DirectionsWalk,
  LocalHospital,
  Event,
  Restaurant
} from '@mui/icons-material';
import { db, ref, get, push, set, update } from '../../../firebase';

const AutorizacoesSection = ({ userRole, userData }) => {
  const [autorizacoes, setAutorizacoes] = useState([]);
  const [dialogNovaAutorizacao, setDialogNovaAutorizacao] = useState(false);
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [autorizacaoSelecionada, setAutorizacaoSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState([]);
  const [novaAutorizacao, setNovaAutorizacao] = useState({
    titulo: '',
    descricao: '',
    tipo: '',
    aluno: '',
    dataEvento: '',
    horaEvento: '',
    local: '',
    observacoes: '',
    responsavelRetirada: '',
    telefoneContato: '',
    documentoNecessario: false,
    documentoTipo: '',
    prazoResposta: '',
    urgente: false
  });

  const tiposAutorizacao = {
    saida: {
      label: 'Saída Antecipada',
      color: '#F59E0B',
      icon: <DirectionsWalk />,
      campos: ['dataEvento', 'horaEvento', 'responsavelRetirada', 'telefoneContato']
    },
    passeio: {
      label: 'Passeio/Excursão',
      color: '#10B981',
      icon: <Event />,
      campos: ['dataEvento', 'local', 'documentoNecessario', 'documentoTipo']
    },
    medicacao: {
      label: 'Administração de Medicamento',
      color: '#8B5CF6',
      icon: <LocalHospital />,
      campos: ['descricao', 'observacoes', 'documentoNecessario']
    },
    alimentacao: {
      label: 'Restrição Alimentar',
      color: '#EC4899',
      icon: <Restaurant />,
      campos: ['descricao', 'observacoes', 'documentoNecessario']
    },
    atividade: {
      label: 'Participação em Atividade',
      color: '#3B82F6',
      icon: <School />,
      campos: ['dataEvento', 'horaEvento', 'local', 'observacoes']
    },
    outros: {
      label: 'Outros',
      color: '#6B7280',
      icon: <Assignment />,
      campos: ['descricao', 'observacoes']
    }
  };

  const statusAutorizacao = {
    pendente: { label: 'Pendente', color: '#F59E0B', icon: <Pending /> },
    aprovada: { label: 'Aprovada', color: '#10B981', icon: <CheckCircle /> },
    negada: { label: 'Negada', color: '#EF4444', icon: <Cancel /> },
    vencida: { label: 'Vencida', color: '#6B7280', icon: <Schedule /> }
  };

  useEffect(() => {
    fetchAutorizacoes();
    fetchAlunos();
  }, [userData]);

  const fetchAutorizacoes = async () => {
    try {
      const autorizacoesRef = ref(db, 'autorizacoes');
      const snap = await get(autorizacoesRef);
      
      if (snap.exists()) {
        const dados = snap.val();
        const autorizacoesList = Object.entries(dados).map(([id, auth]) => ({
          id,
          ...auth
        }));
        
        // Filtrar baseado na role
        let autorizacoesFiltradas = autorizacoesList;
        if (userRole === 'pai') {
          autorizacoesFiltradas = autorizacoesList.filter(auth => 
            userData?.filhos?.includes(auth.aluno)
          );
        } else if (userRole === 'professora') {
          autorizacoesFiltradas = autorizacoesList.filter(auth => {
            const aluno = alunos.find(a => a.id === auth.aluno);
            return aluno && userData?.turmas?.includes(aluno.turma);
          });
        }
        
        setAutorizacoes(autorizacoesFiltradas.sort((a, b) => 
          new Date(b.dataEnvio) - new Date(a.dataEnvio)
        ));
      }
    } catch (error) {
      console.error('Erro ao buscar autorizações:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlunos = async () => {
    try {
      const alunosRef = ref(db, 'alunos');
      const snap = await get(alunosRef);
      
      if (snap.exists()) {
        const dados = snap.val();
        const alunosList = Object.entries(dados).map(([id, aluno]) => ({
          id,
          ...aluno
        }));
        
        setAlunos(alunosList);
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    }
  };

  const enviarAutorizacao = async () => {
    try {
      const autorizacaoData = {
        ...novaAutorizacao,
        enviadoPor: userData?.id || userData?.uid,
        dataEnvio: new Date().toISOString(),
        status: 'pendente',
        respostas: {}
      };

      const autorizacoesRef = ref(db, 'autorizacoes');
      await push(autorizacoesRef, autorizacaoData);
      
      setDialogNovaAutorizacao(false);
      setNovaAutorizacao({
        titulo: '', descricao: '', tipo: '', aluno: '', dataEvento: '',
        horaEvento: '', local: '', observacoes: '', responsavelRetirada: '',
        telefoneContato: '', documentoNecessario: false, documentoTipo: '',
        prazoResposta: '', urgente: false
      });
      
      fetchAutorizacoes();
    } catch (error) {
      console.error('Erro ao enviar autorização:', error);
    }
  };

  const responderAutorizacao = async (autorizacaoId, resposta, observacoes = '') => {
    try {
      const respostaData = {
        resposta,
        observacoes,
        respondidoPor: userData?.id || userData?.uid,
        dataResposta: new Date().toISOString()
      };

      const autorizacaoRef = ref(db, `autorizacoes/${autorizacaoId}`);
      await update(autorizacaoRef, {
        status: resposta,
        [`respostas.${userData?.id || userData?.uid}`]: respostaData
      });
      
      fetchAutorizacoes();
    } catch (error) {
      console.error('Erro ao responder autorização:', error);
    }
  };

  const formatarData = (dataISO) => {
    return new Date(dataISO).toLocaleString('pt-BR');
  };

  const formatarDataEvento = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const isVencida = (autorizacao) => {
    if (!autorizacao.prazoResposta) return false;
    return new Date(autorizacao.prazoResposta) < new Date();
  };

  const podeResponder = (autorizacao) => {
    if (userRole !== 'pai' && userRole !== 'coordenadora') return false;
    if (autorizacao.status !== 'pendente') return false;
    if (isVencida(autorizacao)) return false;
    
    const userId = userData?.id || userData?.uid;
    return !autorizacao.respostas || !autorizacao.respostas[userId];
  };

  const getStatusDisplay = (autorizacao) => {
    if (isVencida(autorizacao) && autorizacao.status === 'pendente') {
      return statusAutorizacao.vencida;
    }
    return statusAutorizacao[autorizacao.status] || statusAutorizacao.pendente;
  };

  const contarRespostas = (autorizacao) => {
    return autorizacao.respostas ? Object.keys(autorizacao.respostas).length : 0;
  };

  const getCamposObrigatorios = (tipo) => {
    return tiposAutorizacao[tipo]?.campos || [];
  };

  if (loading) {
    return <Typography>Carregando autorizações...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          📝 Autorizações
        </Typography>
        {(userRole === 'pai' || userRole === 'coordenadora') && (
          <Fab 
            size="medium"
            color="primary"
            onClick={() => setDialogNovaAutorizacao(true)}
            sx={{ 
              background: 'linear-gradient(45deg, #10B981, #059669)',
              '&:hover': {
                background: 'linear-gradient(45deg, #059669, #047857)'
              }
            }}
          >
            <Add />
          </Fab>
        )}
      </Box>

      {/* Estatísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ bgcolor: '#FEF3E2', borderLeft: '4px solid #F59E0B' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="#F59E0B">
                    {autorizacoes.filter(a => a.status === 'pendente' && !isVencida(a)).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendentes
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#F59E0B' }}>
                  <Pending />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Card sx={{ bgcolor: '#F0FDF4', borderLeft: '4px solid #10B981' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="#10B981">
                    {autorizacoes.filter(a => a.status === 'aprovada').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aprovadas
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#10B981' }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Card sx={{ bgcolor: '#FEF2F2', borderLeft: '4px solid #EF4444' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="#EF4444">
                    {autorizacoes.filter(a => a.status === 'negada').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Negadas
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#EF4444' }}>
                  <Cancel />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Card sx={{ bgcolor: '#F8FAFC', borderLeft: '4px solid #6B7280' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="#6B7280">
                    {autorizacoes.filter(a => isVencida(a) && a.status === 'pendente').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vencidas
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#6B7280' }}>
                  <Schedule />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Autorizações */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {autorizacoes.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Assignment sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                <Typography color="text.secondary">
                  Nenhuma autorização encontrada
                </Typography>
              </CardContent>
            </Card>
          ) : (
            autorizacoes.map((autorizacao) => {
              const status = getStatusDisplay(autorizacao);
              const aluno = alunos.find(a => a.id === autorizacao.aluno);
              
              return (
                <Card 
                  key={autorizacao.id} 
                  sx={{ 
                    mb: 2, 
                    border: `2px solid ${status.color}20`,
                    borderLeft: `4px solid ${status.color}`,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            {tiposAutorizacao[autorizacao.tipo]?.icon} {autorizacao.titulo}
                          </Typography>
                          {autorizacao.urgente && (
                            <Chip 
                              size="small" 
                              label="URGENTE" 
                              color="error"
                              icon={<Warning />}
                            />
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip 
                            size="small" 
                            label={tiposAutorizacao[autorizacao.tipo]?.label}
                            sx={{ 
                              bgcolor: tiposAutorizacao[autorizacao.tipo]?.color,
                              color: 'white'
                            }}
                          />
                          <Chip 
                            size="small" 
                            label={status.label}
                            sx={{ 
                              bgcolor: status.color,
                              color: 'white'
                            }}
                            icon={status.icon}
                          />
                          {autorizacao.dataEvento && (
                            <Chip 
                              size="small" 
                              label={`Evento: ${formatarDataEvento(autorizacao.dataEvento)}`}
                              variant="outlined"
                            />
                          )}
                        </Box>
                        
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>Aluno:</strong> {aluno?.nome || 'Aluno não encontrado'}
                        </Typography>
                        
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {autorizacao.descricao}
                        </Typography>
                        
                        {autorizacao.local && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Local:</strong> {autorizacao.local}
                          </Typography>
                        )}
                        
                        {autorizacao.responsavelRetirada && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Responsável pela retirada:</strong> {autorizacao.responsavelRetirada}
                          </Typography>
                        )}
                        
                        {autorizacao.prazoResposta && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Prazo para resposta:</strong> {formatarData(autorizacao.prazoResposta)}
                          </Typography>
                        )}
                        
                        <Typography variant="caption" color="text.secondary">
                          Enviado em {formatarData(autorizacao.dataEnvio)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                        {podeResponder(autorizacao) && userRole === 'pai' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => responderAutorizacao(autorizacao.id, 'aprovada')}
                            >
                              Autorizar
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => responderAutorizacao(autorizacao.id, 'negada')}
                            >
                              Negar
                            </Button>
                          </>
                        )}
                        
                        <IconButton
                          size="small"
                          onClick={() => {
                            setAutorizacaoSelecionada(autorizacao);
                            setDialogDetalhes(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {(userRole === 'professora' || userRole === 'coordenadora') && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e5e7eb' }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Respostas:</strong> {contarRespostas(autorizacao)}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </Grid>
      </Grid>

      {/* Dialog Nova Autorização */}
      <Dialog 
        open={dialogNovaAutorizacao} 
        onClose={() => setDialogNovaAutorizacao(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>📝 Nova Autorização</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título da Autorização"
                  value={novaAutorizacao.titulo}
                  onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, titulo: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Tipo de Autorização</InputLabel>
                  <Select
                    value={novaAutorizacao.tipo}
                    onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, tipo: e.target.value })}
                  >
                    {Object.entries(tiposAutorizacao).map(([key, tipo]) => (
                      <MenuItem key={key} value={key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {tipo.icon}
                          {tipo.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Aluno</InputLabel>
                  <Select
                    value={novaAutorizacao.aluno}
                    onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, aluno: e.target.value })}
                  >
                    {alunos.map((aluno) => (
                      <MenuItem key={aluno.id} value={aluno.id}>
                        {aluno.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  multiline
                  rows={3}
                  value={novaAutorizacao.descricao}
                  onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, descricao: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              {/* Campos condicionais baseados no tipo */}
              {novaAutorizacao.tipo && getCamposObrigatorios(novaAutorizacao.tipo).includes('dataEvento') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Data do Evento"
                    value={novaAutorizacao.dataEvento}
                    onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, dataEvento: e.target.value })}
                    sx={{ mb: 2 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
              
              {novaAutorizacao.tipo && getCamposObrigatorios(novaAutorizacao.tipo).includes('horaEvento') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Horário"
                    value={novaAutorizacao.horaEvento}
                    onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, horaEvento: e.target.value })}
                    sx={{ mb: 2 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
              
              {novaAutorizacao.tipo && getCamposObrigatorios(novaAutorizacao.tipo).includes('local') && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Local"
                    value={novaAutorizacao.local}
                    onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, local: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              )}
              
              {novaAutorizacao.tipo && getCamposObrigatorios(novaAutorizacao.tipo).includes('responsavelRetirada') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Responsável pela Retirada"
                    value={novaAutorizacao.responsavelRetirada}
                    onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, responsavelRetirada: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              )}
              
              {novaAutorizacao.tipo && getCamposObrigatorios(novaAutorizacao.tipo).includes('telefoneContato') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefone de Contato"
                    value={novaAutorizacao.telefoneContato}
                    onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, telefoneContato: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              )}
              
              {novaAutorizacao.tipo && getCamposObrigatorios(novaAutorizacao.tipo).includes('observacoes') && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observações"
                    multiline
                    rows={2}
                    value={novaAutorizacao.observacoes}
                    onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, observacoes: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Prazo para Resposta"
                  value={novaAutorizacao.prazoResposta}
                  onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, prazoResposta: e.target.value })}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={novaAutorizacao.urgente}
                      onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, urgente: e.target.checked })}
                    />
                  }
                  label="Marcar como urgente"
                />
              </Grid>
              
              {novaAutorizacao.tipo && getCamposObrigatorios(novaAutorizacao.tipo).includes('documentoNecessario') && (
                <>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={novaAutorizacao.documentoNecessario}
                          onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, documentoNecessario: e.target.checked })}
                        />
                      }
                      label="Documento necessário"
                    />
                  </Grid>
                  
                  {novaAutorizacao.documentoNecessario && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Tipo de Documento"
                        value={novaAutorizacao.documentoTipo}
                        onChange={(e) => setNovaAutorizacao({ ...novaAutorizacao, documentoTipo: e.target.value })}
                        placeholder="Ex: Receita médica, atestado, etc."
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogNovaAutorizacao(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={enviarAutorizacao}
            disabled={!novaAutorizacao.titulo || !novaAutorizacao.tipo || !novaAutorizacao.aluno}
            startIcon={<Send />}
          >
            Enviar Autorização
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog 
        open={dialogDetalhes} 
        onClose={() => setDialogDetalhes(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>📋 Detalhes da Autorização</DialogTitle>
        <DialogContent>
          {autorizacaoSelecionada && (
            <Box sx={{ pt: 1 }}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {tiposAutorizacao[autorizacaoSelecionada.tipo]?.icon} {autorizacaoSelecionada.titulo}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={tiposAutorizacao[autorizacaoSelecionada.tipo]?.label}
                    sx={{ bgcolor: tiposAutorizacao[autorizacaoSelecionada.tipo]?.color, color: 'white' }}
                  />
                  <Chip 
                    label={getStatusDisplay(autorizacaoSelecionada).label}
                    sx={{ bgcolor: getStatusDisplay(autorizacaoSelecionada).color, color: 'white' }}
                  />
                </Box>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Aluno:</strong> {alunos.find(a => a.id === autorizacaoSelecionada.aluno)?.nome}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Descrição:</strong> {autorizacaoSelecionada.descricao}
                </Typography>
                
                {autorizacaoSelecionada.dataEvento && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Data do Evento:</strong> {formatarDataEvento(autorizacaoSelecionada.dataEvento)}
                  </Typography>
                )}
                
                {autorizacaoSelecionada.local && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Local:</strong> {autorizacaoSelecionada.local}
                  </Typography>
                )}
                
                {autorizacaoSelecionada.observacoes && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Observações:</strong> {autorizacaoSelecionada.observacoes}
                  </Typography>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" color="text.secondary">
                  <strong>Enviado em:</strong> {formatarData(autorizacaoSelecionada.dataEnvio)}
                </Typography>
                
                {autorizacaoSelecionada.prazoResposta && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Prazo:</strong> {formatarData(autorizacaoSelecionada.prazoResposta)}
                  </Typography>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDetalhes(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AutorizacoesSection;