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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Badge,
  IconButton,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Announcement,
  Add,
  Person,
  Group,
  PriorityHigh,
  Schedule,
  ExpandMore,
  NotificationImportant,
  Visibility,
  VisibilityOff,
  CheckCircle,
  AccessTime,
  School,
  Edit,
  Delete,
  Send
} from '@mui/icons-material';
import { db, ref, get, push, set, remove } from '../../../firebase';

const AvisosEspecificosSection = ({ userRole, userData }) => {
  const [avisos, setAvisos] = useState([]);
  const [dialogNovoAviso, setDialogNovoAviso] = useState(false);
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [avisoSelecionado, setAvisoSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [novoAviso, setNovoAviso] = useState({
    titulo: '',
    conteudo: '',
    tipo: 'informativo',
    prioridade: 'normal',
    destinatarios: [],
    tipoDestinatario: 'aluno', // aluno, turma, todos
    dataVencimento: '',
    requerConfirmacao: false,
    ativo: true
  });

  const tiposAviso = {
    informativo: { label: 'Informativo', color: '#3B82F6', icon: '📢' },
    importante: { label: 'Importante', color: '#F59E0B', icon: '⚠️' },
    urgente: { label: 'Urgente', color: '#EF4444', icon: '🚨' },
    evento: { label: 'Evento', color: '#10B981', icon: '📅' },
    medicacao: { label: 'Medicação', color: '#8B5CF6', icon: '💊' },
    autorizacao: { label: 'Autorização', color: '#EC4899', icon: '📝' }
  };

  const prioridades = {
    baixa: { label: 'Baixa', color: '#6B7280' },
    normal: { label: 'Normal', color: '#3B82F6' },
    alta: { label: 'Alta', color: '#F59E0B' },
    critica: { label: 'Crítica', color: '#EF4444' }
  };

  useEffect(() => {
    fetchAvisos();
    fetchAlunos();
    fetchTurmas();
  }, [userData]);

  const fetchAvisos = async () => {
    try {
      const avisosRef = ref(db, 'avisosEspecificos');
      const snap = await get(avisosRef);
      
      if (snap.exists()) {
        const dados = snap.val();
        const avisosList = Object.entries(dados).map(([id, aviso]) => ({
          id,
          ...aviso
        }));
        
        // Filtrar baseado na role
        let avisosFiltrados = avisosList;
        if (userRole === 'pai') {
          const alunosVinculados = userData?.filhosVinculados || userData?.alunosVinculados || (userData?.alunoVinculado ? [userData.alunoVinculado] : []);
          
          avisosFiltrados = avisosList.filter(aviso => {
            if (aviso.tipoDestinatario === 'todos') return true;
            if (aviso.tipoDestinatario === 'aluno') {
              return alunosVinculados.some(filho => 
                aviso.destinatarios.includes(filho)
              );
            }
            if (aviso.tipoDestinatario === 'turma') {
              return alunosVinculados.some(filho => {
                const aluno = alunos.find(a => a.id === filho);
                return aluno && aviso.destinatarios.includes(aluno.turmaId);
              });
            }
            return false;
          });
        } else if (userRole === 'professora') {
          avisosFiltrados = avisosList.filter(aviso => {
            if (aviso.tipoDestinatario === 'todos') return true;
            if (aviso.tipoDestinatario === 'turma') {
              return userData?.turmas?.some(turma => 
                aviso.destinatarios.includes(turma)
              );
            }
            if (aviso.tipoDestinatario === 'aluno') {
              return aviso.destinatarios.some(alunoId => {
                const aluno = alunos.find(a => a.id === alunoId);
                return aluno && userData?.turmas?.includes(aluno.turmaId);
              });
            }
            return false;
          });
        }
        
        setAvisos(avisosFiltrados.sort((a, b) => 
          new Date(b.dataEnvio) - new Date(a.dataEnvio)
        ));
      }
    } catch (error) {
      console.error('Erro ao buscar avisos:', error);
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
        
        // Filtrar alunos baseado na role
        let alunosFiltrados = alunosList;
        if (userRole === 'pai') {
          const alunosVinculados = userData?.filhosVinculados || userData?.alunosVinculados || (userData?.alunoVinculado ? [userData.alunoVinculado] : []);
          alunosFiltrados = alunosList.filter(aluno => 
            alunosVinculados.includes(aluno.id)
          );
        } else if (userRole === 'professora') {
          // Professoras veem alunos das suas turmas
          alunosFiltrados = alunosList.filter(aluno => 
            userData?.turmas?.includes(aluno.turmaId)
          );
        }
        
        setAlunos(alunosFiltrados);
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    }
  };

  const fetchTurmas = async () => {
    try {
      const turmasRef = ref(db, 'turmas');
      const snap = await get(turmasRef);
      
      if (snap.exists()) {
        const dados = snap.val();
        const turmasList = Object.entries(dados).map(([id, turma]) => ({
          id,
          ...turma
        }));
        
        // Filtrar turmas baseado na role
        let turmasFiltradas = turmasList;
        if (userRole === 'professora') {
          // Professoras veem apenas suas turmas
          turmasFiltradas = turmasList.filter(turma => 
            userData?.turmas?.includes(turma.id)
          );
        }
        // Pais não precisam ver turmas para criar avisos
        // Coordenadoras veem todas as turmas
        
        setTurmas(turmasFiltradas);
      }
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
    }
  };

  const enviarAviso = async () => {
    try {
      const avisoData = {
        ...novoAviso,
        enviadoPor: userData?.id || userData?.uid,
        dataEnvio: new Date().toISOString(),
        leituras: {},
        confirmacoes: {}
      };

      const avisosRef = ref(db, 'avisosEspecificos');
      await push(avisosRef, avisoData);
      
      setDialogNovoAviso(false);
      setNovoAviso({
        titulo: '', conteudo: '', tipo: 'informativo', prioridade: 'normal',
        destinatarios: [], tipoDestinatario: 'aluno', dataVencimento: '',
        requerConfirmacao: false, ativo: true
      });
      
      fetchAvisos();
    } catch (error) {
      console.error('Erro ao enviar aviso:', error);
    }
  };

  const marcarComoLido = async (avisoId) => {
    try {
      const leituraRef = ref(db, `avisosEspecificos/${avisoId}/leituras/${userData?.id || userData?.uid}`);
      await set(leituraRef, new Date().toISOString());
      
      fetchAvisos();
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  const confirmarRecebimento = async (avisoId) => {
    try {
      const confirmacaoRef = ref(db, `avisosEspecificos/${avisoId}/confirmacoes/${userData?.id || userData?.uid}`);
      await set(confirmacaoRef, new Date().toISOString());
      
      fetchAvisos();
    } catch (error) {
      console.error('Erro ao confirmar recebimento:', error);
    }
  };

  const formatarData = (dataISO) => {
    return new Date(dataISO).toLocaleString('pt-BR');
  };

  const isVencido = (dataVencimento) => {
    if (!dataVencimento) return false;
    return new Date(dataVencimento) < new Date();
  };

  const jaLeu = (aviso) => {
    const userId = userData?.id || userData?.uid;
    return aviso.leituras && aviso.leituras[userId];
  };

  const jaConfirmou = (aviso) => {
    const userId = userData?.id || userData?.uid;
    return aviso.confirmacoes && aviso.confirmacoes[userId];
  };

  const contarLeituras = (aviso) => {
    return aviso.leituras ? Object.keys(aviso.leituras).length : 0;
  };

  const contarConfirmacoes = (aviso) => {
    return aviso.confirmacoes ? Object.keys(aviso.confirmacoes).length : 0;
  };

  const getDestinatariosTexto = (aviso) => {
    if (aviso.tipoDestinatario === 'todos') return 'Todos';
    if (aviso.tipoDestinatario === 'turma') {
      const nomeTurmas = aviso.destinatarios.map(turmaId => 
        turmas.find(t => t.id === turmaId)?.nome || turmaId
      ).join(', ');
      return `Turmas: ${nomeTurmas}`;
    }
    if (aviso.tipoDestinatario === 'aluno') {
      const nomeAlunos = aviso.destinatarios.map(alunoId => 
        alunos.find(a => a.id === alunoId)?.nome || alunoId
      ).join(', ');
      return `Alunos: ${nomeAlunos}`;
    }
    return '';
  };

  if (loading) {
    return <Typography>Carregando avisos...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          📢 Avisos Específicos
        </Typography>
        {(userRole === 'professora' || userRole === 'coordenadora') && (
          <Fab 
            size="medium"
            color="primary"
            onClick={() => setDialogNovoAviso(true)}
            sx={{ 
              background: 'linear-gradient(45deg, #F59E0B, #D97706)',
              '&:hover': {
                background: 'linear-gradient(45deg, #D97706, #B45309)'
              }
            }}
          >
            <Add />
          </Fab>
        )}
      </Box>

      {/* Estatísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#EFF6FF', borderLeft: '4px solid #3B82F6' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="#3B82F6">
                    {avisos.filter(a => a.ativo).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avisos Ativos
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#3B82F6' }}>
                  <Announcement />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#FEF3E2', borderLeft: '4px solid #F59E0B' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="#F59E0B">
                    {avisos.filter(a => a.prioridade === 'alta' || a.prioridade === 'critica').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Prioridade Alta
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#F59E0B' }}>
                  <PriorityHigh />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#FEF2F2', borderLeft: '4px solid #EF4444' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="#EF4444">
                    {avisos.filter(a => a.dataVencimento && isVencido(a.dataVencimento)).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vencidos
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#EF4444' }}>
                  <AccessTime />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Avisos */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {avisos.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Announcement sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                <Typography color="text.secondary">
                  Nenhum aviso específico encontrado
                </Typography>
              </CardContent>
            </Card>
          ) : (
            avisos.map((aviso) => (
              <Card 
                key={aviso.id} 
                sx={{ 
                  mb: 2, 
                  border: `2px solid ${tiposAviso[aviso.tipo]?.color}20`,
                  borderLeft: `4px solid ${tiposAviso[aviso.tipo]?.color}`,
                  opacity: jaLeu(aviso) ? 0.8 : 1,
                  bgcolor: jaLeu(aviso) ? '#f8fafc' : 'white'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {tiposAviso[aviso.tipo]?.icon} {aviso.titulo}
                        </Typography>
                        {!jaLeu(aviso) && (
                          <Badge color="error" variant="dot" />
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip 
                          size="small" 
                          label={tiposAviso[aviso.tipo]?.label}
                          sx={{ 
                            bgcolor: tiposAviso[aviso.tipo]?.color,
                            color: 'white'
                          }}
                        />
                        <Chip 
                          size="small" 
                          label={prioridades[aviso.prioridade]?.label}
                          sx={{ 
                            bgcolor: prioridades[aviso.prioridade]?.color,
                            color: 'white'
                          }}
                        />
                        {aviso.dataVencimento && (
                          <Chip 
                            size="small" 
                            label={`Até: ${formatarData(aviso.dataVencimento)}`}
                            color={isVencido(aviso.dataVencimento) ? 'error' : 'default'}
                            icon={<Schedule />}
                          />
                        )}
                        {aviso.requerConfirmacao && (
                          <Chip 
                            size="small" 
                            label="Requer Confirmação"
                            color={jaConfirmou(aviso) ? 'success' : 'warning'}
                            icon={<CheckCircle />}
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {aviso.conteudo}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary">
                        {getDestinatariosTexto(aviso)} • Enviado em {formatarData(aviso.dataEnvio)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                      {!jaLeu(aviso) && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => marcarComoLido(aviso.id)}
                        >
                          Marcar Lido
                        </Button>
                      )}
                      
                      {aviso.requerConfirmacao && !jaConfirmou(aviso) && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => confirmarRecebimento(aviso.id)}
                        >
                          Confirmar
                        </Button>
                      )}
                      
                      <IconButton
                        size="small"
                        onClick={() => {
                          setAvisoSelecionado(aviso);
                          setDialogDetalhes(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {(userRole === 'professora' || userRole === 'coordenadora') && (
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle2">
                          📊 Estatísticas de Leitura
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Leituras:</strong> {contarLeituras(aviso)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Confirmações:</strong> {contarConfirmacoes(aviso)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </Grid>
      </Grid>

      {/* Dialog Novo Aviso */}
      <Dialog 
        open={dialogNovoAviso} 
        onClose={() => setDialogNovoAviso(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>📢 Novo Aviso Específico</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título do Aviso"
                  value={novoAviso.titulo}
                  onChange={(e) => setNovoAviso({ ...novoAviso, titulo: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2, minWidth: '250px' }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={novoAviso.tipo}
                    label="Tipo"
                    onChange={(e) => setNovoAviso({ ...novoAviso, tipo: e.target.value })}
                  >
                    {Object.entries(tiposAviso).map(([key, tipo]) => (
                      <MenuItem key={key} value={key}>
                        {tipo.icon} {tipo.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2, minWidth: '250px' }}>
                  <InputLabel>Prioridade</InputLabel>
                  <Select
                    value={novoAviso.prioridade}
                    label="Prioridade"
                    onChange={(e) => setNovoAviso({ ...novoAviso, prioridade: e.target.value })}
                  >
                    {Object.entries(prioridades).map(([key, prioridade]) => (
                      <MenuItem key={key} value={key}>
                        {prioridade.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2, minWidth: '250px' }}>
                  <InputLabel>Destinatários</InputLabel>
                  <Select
                    value={novoAviso.tipoDestinatario}
                    label="Destinatários"
                    onChange={(e) => setNovoAviso({ 
                      ...novoAviso, 
                      tipoDestinatario: e.target.value,
                      destinatarios: []
                    })}
                  >
                    <MenuItem value="aluno">Alunos Específicos</MenuItem>
                    <MenuItem value="turma">Turmas</MenuItem>
                    {userRole === 'coordenadora' && (
                      <MenuItem value="todos">Todos</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              
              {novoAviso.tipoDestinatario !== 'todos' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={{ mb: 2, minWidth: '250px' }}>
                    <InputLabel>
                      {novoAviso.tipoDestinatario === 'aluno' ? 'Selecionar Alunos' : 'Selecionar Turmas'}
                    </InputLabel>
                    <Select
                      multiple
                      value={novoAviso.destinatarios}
                      label={novoAviso.tipoDestinatario === 'aluno' ? 'Selecionar Alunos' : 'Selecionar Turmas'}
                      onChange={(e) => setNovoAviso({ ...novoAviso, destinatarios: e.target.value })}
                    >
                      {novoAviso.tipoDestinatario === 'aluno' 
                        ? alunos.map((aluno) => (
                            <MenuItem key={aluno.id} value={aluno.id}>
                              {aluno.nome}
                            </MenuItem>
                          ))
                        : turmas.map((turma) => (
                            <MenuItem key={turma.id} value={turma.id}>
                              {turma.nome}
                            </MenuItem>
                          ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Conteúdo do Aviso"
                  multiline
                  rows={4}
                  value={novoAviso.conteudo}
                  onChange={(e) => setNovoAviso({ ...novoAviso, conteudo: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Data de Vencimento (Opcional)"
                  value={novoAviso.dataVencimento}
                  onChange={(e) => setNovoAviso({ ...novoAviso, dataVencimento: e.target.value })}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={novoAviso.requerConfirmacao}
                      onChange={(e) => setNovoAviso({ ...novoAviso, requerConfirmacao: e.target.checked })}
                    />
                  }
                  label="Requer confirmação de recebimento"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogNovoAviso(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={enviarAviso}
            disabled={!novoAviso.titulo || !novoAviso.conteudo}
            startIcon={<Send />}
          >
            Enviar Aviso
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
        <DialogTitle>📋 Detalhes do Aviso</DialogTitle>
        <DialogContent>
          {avisoSelecionado && (
            <Box sx={{ pt: 1 }}>
              <Paper sx={{ p: 2, mb: 2, bgcolor: `${tiposAviso[avisoSelecionado.tipo]?.color}10` }}>
                <Typography variant="h6" gutterBottom>
                  {tiposAviso[avisoSelecionado.tipo]?.icon} {avisoSelecionado.titulo}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={tiposAviso[avisoSelecionado.tipo]?.label}
                    sx={{ bgcolor: tiposAviso[avisoSelecionado.tipo]?.color, color: 'white' }}
                  />
                  <Chip 
                    label={prioridades[avisoSelecionado.prioridade]?.label}
                    sx={{ bgcolor: prioridades[avisoSelecionado.prioridade]?.color, color: 'white' }}
                  />
                </Box>
                <Typography variant="body1" gutterBottom>
                  {avisoSelecionado.conteudo}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  <strong>Destinatários:</strong> {getDestinatariosTexto(avisoSelecionado)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Enviado em:</strong> {formatarData(avisoSelecionado.dataEnvio)}
                </Typography>
                {avisoSelecionado.dataVencimento && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Vencimento:</strong> {formatarData(avisoSelecionado.dataVencimento)}
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

export default AvisosEspecificosSection;