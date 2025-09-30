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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Badge,
  Paper,
  Switch,
  FormControlLabel,
  Fab
} from '@mui/material';
import {
  LocalPharmacy,
  Add,
  Schedule,
  Description,
  Warning,
  CheckCircle,
  CloudUpload,
  Edit,
  Delete,
  Notifications,
  AccessTime,
  AttachFile,
  Medication,
  Person
} from '@mui/icons-material';
import { db, ref, get, push, set, remove } from '../../../firebase';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const AgendaMedicaSection = ({ userRole, userData }) => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [dialogNovoMedicamento, setDialogNovoMedicamento] = useState(false);
  const [dialogReceita, setDialogReceita] = useState(false);
  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [novoMedicamento, setNovoMedicamento] = useState({
    nome: '',
    dosagem: '',
    frequencia: '',
    horarios: [],
    observacoes: '',
    dataInicio: '',
    dataFim: '',
    ativo: true,
    aluno: '',
    receita: null
  });
  const [alunos, setAlunos] = useState([]);
  const [historicoMedicacao, setHistoricoMedicacao] = useState([]);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [medicamentoDetalhes, setMedicamentoDetalhes] = useState(null);

  useEffect(() => {
    fetchMedicamentos();
    fetchAlunos();
    fetchHistorico();
  }, [userData]);

  const fetchMedicamentos = async () => {
    try {
      const medicamentosRef = ref(db, 'medicamentos');
      const snap = await get(medicamentosRef);
      
      if (snap.exists()) {
        const dados = snap.val();
        const medicamentosList = Object.entries(dados).map(([id, med]) => ({
          id,
          ...med
        }));
        
        // Filtrar baseado na role
        let medicamentosFiltrados = medicamentosList;
        if (userRole === 'pai') {
          // Pais só veem medicamentos dos seus filhos vinculados
          const alunosVinculados = userData?.filhosVinculados || userData?.alunosVinculados || (userData?.alunoVinculado ? [userData.alunoVinculado] : []);
          medicamentosFiltrados = medicamentosList.filter(med => 
            alunosVinculados.includes(med.aluno)
          );
        } else if (userRole === 'professora') {
          // Professoras veem medicamentos dos alunos das suas turmas
          medicamentosFiltrados = medicamentosList.filter(med => {
            const aluno = alunos.find(a => a.id === med.aluno);
            return userData?.turmas?.includes(aluno?.turmaId);
          });
        }
        
        setMedicamentos(medicamentosFiltrados);
      }
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error);
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
          // Pais só veem seus filhos vinculados
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

  const fetchHistorico = async () => {
    try {
      const historicoRef = ref(db, 'historicoMedicacao');
      const snap = await get(historicoRef);
      
      if (snap.exists()) {
        const dados = snap.val();
        const historicoList = Object.entries(dados).map(([id, hist]) => ({
          id,
          ...hist
        }));
        
        // Filtrar histórico baseado na role
        let historicoFiltrado = historicoList;
        if (userRole === 'pai') {
          const alunosVinculados = userData?.filhosVinculados || userData?.alunosVinculados || (userData?.alunoVinculado ? [userData.alunoVinculado] : []);
          historicoFiltrado = historicoList.filter(hist => 
            alunosVinculados.includes(hist.alunoId)
          );
        } else if (userRole === 'professora') {
          // Professoras veem histórico dos alunos das suas turmas
          historicoFiltrado = historicoList.filter(hist => {
            const aluno = alunos.find(a => a.id === hist.alunoId);
            return userData?.turmas?.includes(aluno?.turmaId);
          });
        }
        
        setHistoricoMedicacao(historicoFiltrado.sort((a, b) => 
          new Date(b.dataHora) - new Date(a.dataHora)
        ));
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  };

  const salvarMedicamento = async () => {
    try {
      const medicamentoData = {
        ...novoMedicamento,
        criadoPor: userData?.id || userData?.uid,
        dataCriacao: new Date().toISOString(),
        proximaDose: calcularProximaDose(novoMedicamento.horarios)
      };

      const medicamentosRef = ref(db, 'medicamentos');
      await push(medicamentosRef, medicamentoData);
      
      setDialogNovoMedicamento(false);
      setNovoMedicamento({
        nome: '', dosagem: '', frequencia: '', horarios: [],
        observacoes: '', dataInicio: '', dataFim: '', ativo: true,
        aluno: '', receita: null
      });
      
      fetchMedicamentos();
    } catch (error) {
      console.error('Erro ao salvar medicamento:', error);
    }
  };

  const calcularProximaDose = (horarios) => {
    if (!horarios.length) return null;
    
    const agora = new Date();
    const hoje = agora.toDateString();
    
    // Encontrar o próximo horário hoje
    for (const horario of horarios.sort()) {
      const [hora, minuto] = horario.split(':');
      const proximaDose = new Date();
      proximaDose.setHours(parseInt(hora), parseInt(minuto), 0, 0);
      
      if (proximaDose > agora) {
        return proximaDose.toISOString();
      }
    }
    
    // Se não há mais horários hoje, usar o primeiro horário de amanhã
    const amanha = new Date(agora);
    amanha.setDate(amanha.getDate() + 1);
    const [hora, minuto] = horarios[0].split(':');
    amanha.setHours(parseInt(hora), parseInt(minuto), 0, 0);
    
    return amanha.toISOString();
  };

  const marcarDoseAdministrada = async (medicamentoId) => {
    try {
      const medicamento = medicamentos.find(m => m.id === medicamentoId);
      if (!medicamento) return;
      
      // Verificar se pode administrar
      if (!podeAdministrarDose(medicamento)) {
        const tempo = getTempoParaProximaDose(medicamento);
        alert(`Aguarde! Próxima dose liberada em ${tempo.horas}h ${tempo.minutos}min`);
        return;
      }
      
      const aluno = alunos.find(a => a.id === medicamento.aluno);
      const registroData = {
        medicamentoId,
        medicamentoNome: medicamento.nome,
        dosagem: medicamento.dosagem,
        alunoId: medicamento.aluno,
        alunoNome: aluno?.nome || 'N/A',
        dataHora: new Date().toISOString(),
        administradoPor: userData?.id || userData?.uid,
        administradorNome: userData?.nome || userData?.displayName || 'N/A',
        administradorRole: userRole,
        observacoes: ''
      };

      const historicoRef = ref(db, 'historicoMedicacao');
      await push(historicoRef, registroData);
      
      // Atualizar próxima dose e última dose
      const proximaDose = calcularProximaDose(medicamento.horarios);
      const medicamentoRef = ref(db, `medicamentos/${medicamentoId}`);
      await set(medicamentoRef, {
        ...medicamento,
        proximaDose,
        ultimaDose: new Date().toISOString()
      });
      
      fetchMedicamentos();
      fetchHistorico();
    } catch (error) {
      console.error('Erro ao marcar dose:', error);
    }
  };

  const uploadReceita = async (file, medicamentoId) => {
    try {
      const storage = getStorage();
      const receitaRef = storageRef(storage, `receitas/${medicamentoId}/${file.name}`);
      
      await uploadBytes(receitaRef, file);
      const downloadURL = await getDownloadURL(receitaRef);
      
      // Atualizar medicamento com URL da receita
      const medicamentoRef = ref(db, `medicamentos/${medicamentoId}`);
      const medicamento = medicamentos.find(m => m.id === medicamentoId);
      
      await set(medicamentoRef, {
        ...medicamento,
        receita: {
          url: downloadURL,
          nome: file.name,
          dataUpload: new Date().toISOString()
        }
      });
      
      fetchMedicamentos();
    } catch (error) {
      console.error('Erro ao fazer upload da receita:', error);
    }
  };

  const formatarHorario = (horarios) => {
    if (!horarios || !horarios.length) return 'Não definido';
    return horarios.join(', ');
  };

  const formatarDataHora = (dataISO) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const abrirDetalhes = (medicamento) => {
    setMedicamentoDetalhes(medicamento);
    setModalDetalhes(true);
  };

  const fecharDetalhes = () => {
    setModalDetalhes(false);
    setMedicamentoDetalhes(null);
  };

  const podeAdministrarDose = (medicamento) => {
    if (!medicamento.ultimaDose) return true;
    
    const ultimaDose = new Date(medicamento.ultimaDose);
    const agora = new Date();
    const diferencaHoras = (agora - ultimaDose) / (1000 * 60 * 60);
    
    // Considera que a frequência mínima é baseada nos horários (ex: se tem 3 horários por dia, mínimo 6h entre doses)
    const horariosCount = medicamento.horarios?.length || 1;
    const intervaloMinimo = 24 / horariosCount; // horas entre doses
    
    return diferencaHoras >= (intervaloMinimo - 0.5); // 30min de tolerância
  };

  const getTempoParaProximaDose = (medicamento) => {
    if (!medicamento.ultimaDose) return null;
    
    const ultimaDose = new Date(medicamento.ultimaDose);
    const agora = new Date();
    const horariosCount = medicamento.horarios?.length || 1;
    const intervaloMinimo = 24 / horariosCount;
    const proximaLiberacao = new Date(ultimaDose.getTime() + (intervaloMinimo * 60 * 60 * 1000));
    
    if (agora >= proximaLiberacao) return null;
    
    const diferenca = proximaLiberacao - agora;
    const horas = Math.floor(diferenca / (1000 * 60 * 60));
    const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
    
    return { horas, minutos, proximaLiberacao };
  };

  const getMedicamentosAtivos = () => {
    return medicamentos.filter(med => med.ativo).length;
  };

  const getMedicamentosPendentes = () => {
    const agora = new Date();
    return medicamentos.filter(med => {
      if (!med.proximaDose) return false;
      const proximaDose = new Date(med.proximaDose);
      return proximaDose <= agora && med.ativo;
    }).length;
  };

  if (loading) {
    return <Typography>Carregando medicamentos...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          💊 Agenda Médica
        </Typography>
        {(userRole === 'pai' || userRole === 'coordenadora') && alunos.length > 0 && (
          <IconButton 
            color="primary"
            onClick={() => setDialogNovoMedicamento(true)}
            sx={{ 
              bgcolor: '#10B981',
              color: 'white',
              '&:hover': {
                bgcolor: '#059669'
              }
            }}
          >
            <Add />
          </IconButton>
        )}
      </Box>

      {/* Cards de Resumo */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#EBF8FF', borderLeft: '3px solid #3B82F6' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" fontWeight={600} color="#3B82F6">
                    {getMedicamentosAtivos()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Med. Ativos
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#3B82F6', width: 36, height: 36 }}>
                  <Medication sx={{ fontSize: 20 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#FEF3E2', borderLeft: '3px solid #F59E0B' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" fontWeight={600} color="#F59E0B">
                    {getMedicamentosPendentes()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     Pendentes
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#F59E0B', width: 36, height: 36 }}>
                  <AccessTime sx={{ fontSize: 20 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#F0FDF4', borderLeft: '3px solid #10B981' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" fontWeight={600} color="#10B981">
                    {historicoMedicacao.filter(h => {
                      const hoje = new Date().toDateString();
                      return new Date(h.dataHora).toDateString() === hoje;
                    }).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Doses Hoje
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#10B981', width: 36, height: 36 }}>
                  <CheckCircle sx={{ fontSize: 20 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Lista de Medicamentos */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalPharmacy /> Medicamentos Ativos
              </Typography>
              
              {medicamentos.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <LocalPharmacy sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                  <Typography color="text.secondary">
                    Nenhum medicamento cadastrado
                  </Typography>
                </Box>
              ) : (
                <List>
                  {medicamentos.filter(med => med.ativo).map((medicamento) => (
                    <ListItem 
                      key={medicamento.id}
                      sx={{ 
                        border: '1px solid #f3f4f6',
                        borderRadius: 2,
                        mb: 2,
                        bgcolor: '#fafbfc',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#f0f9ff',
                          borderColor: '#3B82F6'
                        }
                      }}
                      onClick={() => abrirDetalhes(medicamento)}
                    >
                      <ListItemAvatar>
                        <Badge 
                          color="warning" 
                          variant="dot" 
                          invisible={!medicamento.proximaDose || new Date(medicamento.proximaDose) > new Date()}
                        >
                          <Avatar sx={{ bgcolor: '#10B981' }}>
                            <Medication />
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6" fontWeight={600}>
                              {medicamento.nome}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={medicamento.dosagem}
                              color="primary"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              📅 Horários: {formatarHorario(medicamento.horarios)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              👤 Aluno: {alunos.find(a => a.id === medicamento.aluno)?.nome || 'N/A'}
                            </Typography>
                            {medicamento.proximaDose && (
                              <Typography variant="body2" color="primary" fontWeight={600}>
                                ⏰ Próxima dose: {formatarDataHora(medicamento.proximaDose)}
                              </Typography>
                            )}
                            {medicamento.observacoes && (
                              <Typography variant="body2" color="text.secondary">
                                📝 {medicamento.observacoes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {(userRole === 'professora' || userRole === 'coordenadora') && (
                          (() => {
                            const podeAdministrar = podeAdministrarDose(medicamento);
                            const tempo = getTempoParaProximaDose(medicamento);
                            
                            return (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Button
                                  size="small"
                                  variant={podeAdministrar ? "contained" : "outlined"}
                                  color={podeAdministrar ? "success" : "warning"}
                                  onClick={() => marcarDoseAdministrada(medicamento.id)}
                                  startIcon={podeAdministrar ? <CheckCircle /> : <AccessTime />}
                                  disabled={!podeAdministrar}
                                >
                                  {podeAdministrar ? 'Marcar Dose' : 'Aguardar'}
                                </Button>
                                {!podeAdministrar && tempo && (
                                  <Typography variant="caption" color="warning.main" fontWeight={600} textAlign="center">
                                    ⏳ {tempo.horas}h {tempo.minutos}min
                                  </Typography>
                                )}
                              </Box>
                            );
                          })()
                        )}
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setMedicamentoSelecionado(medicamento);
                            setDialogReceita(true);
                          }}
                        >
                          <Description />
                        </IconButton>
                        {medicamento.receita && (
                          <IconButton 
                            size="small"
                            onClick={() => window.open(medicamento.receita.url, '_blank')}
                            color="primary"
                          >
                            <AttachFile />
                          </IconButton>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Histórico Recente */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule /> Histórico Recente
              </Typography>
              
              {historicoMedicacao.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  Nenhum registro encontrado
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {historicoMedicacao.slice(0, 5).map((registro, index) => (
                    <ListItem key={registro.id} sx={{ py: 1, px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start', gap: 1 }}>
                        <Avatar sx={{ bgcolor: '#4CAF50', width: 32, height: 32, mt: 0.5 }}>
                          <CheckCircle sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                            {registro.medicamentoNome || 'Medicamento'} - {registro.dosagem || 'Dose'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            👤 Paciente: {registro.alunoNome || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            👨‍⚕️ Aplicado por: {registro.administradorNome || 'N/A'} ({registro.administradorRole || 'N/A'})
                          </Typography>
                          <Typography variant="caption" color="primary" fontWeight={600}>
                            🕐 {formatarDataHora(registro.dataHora)}
                          </Typography>
                        </Box>
                      </Box>
                      {index < historicoMedicacao.slice(0, 5).length - 1 && (
                        <Divider sx={{ width: '100%', mt: 1 }} />
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog Novo Medicamento */}
      <Dialog 
        open={dialogNovoMedicamento} 
        onClose={() => setDialogNovoMedicamento(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>💊 Novo Medicamento</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome do Medicamento"
                value={novoMedicamento.nome}
                onChange={(e) => setNovoMedicamento({ ...novoMedicamento, nome: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dosagem"
                value={novoMedicamento.dosagem}
                onChange={(e) => setNovoMedicamento({ ...novoMedicamento, dosagem: e.target.value })}
                placeholder="Ex: 5ml, 1 comprimido"
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="select-aluno-label">Aluno</InputLabel >
                <Select
                  labelId="select-aluno-label"
                  value={novoMedicamento.aluno}
                  label="Aluno"
                  onChange={(e) => setNovoMedicamento({ ...novoMedicamento, aluno: e.target.value })}
                >
                  {alunos.map((aluno) => (
                    <MenuItem key={aluno.id} value={aluno.id}>
                      {aluno.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Frequência"
                value={novoMedicamento.frequencia}
                onChange={(e) => setNovoMedicamento({ ...novoMedicamento, frequencia: e.target.value })}
                placeholder="Ex: 3x ao dia, 8 em 8 horas"
                variant="outlined"
              />
            </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Horários (separados por vírgula)"
                  value={novoMedicamento.horarios.join(', ')}
                  onChange={(e) => setNovoMedicamento({ 
                    ...novoMedicamento, 
                    horarios: e.target.value.split(',').map(h => h.trim()).filter(h => h)
                  })}
                  sx={{ mb: 2 }}
                  placeholder="Ex: 08:00, 14:00, 20:00"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data de Início"
                  value={novoMedicamento.dataInicio}
                  onChange={(e) => setNovoMedicamento({ ...novoMedicamento, dataInicio: e.target.value })}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data de Fim (opcional)"
                  value={novoMedicamento.dataFim}
                  onChange={(e) => setNovoMedicamento({ ...novoMedicamento, dataFim: e.target.value })}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  multiline
                  rows={3}
                  value={novoMedicamento.observacoes}
                  onChange={(e) => setNovoMedicamento({ ...novoMedicamento, observacoes: e.target.value })}
                  sx={{ mb: 2 }}
                  placeholder="Instruções especiais, efeitos colaterais, etc."
                />
              </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogNovoMedicamento(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={salvarMedicamento}
            disabled={!novoMedicamento.nome || !novoMedicamento.dosagem || !novoMedicamento.aluno}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Receita */}
      <Dialog 
        open={dialogReceita} 
        onClose={() => setDialogReceita(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>📋 Receita Médica</DialogTitle>
        <DialogContent>
          {medicamentoSelecionado?.receita ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Description sx={{ fontSize: 48, color: '#3B82F6', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {medicamentoSelecionado.receita.nome}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Enviado em: {formatarDataHora(medicamentoSelecionado.receita.dataUpload)}
              </Typography>
              <Button
                variant="contained"
                onClick={() => window.open(medicamentoSelecionado.receita.url, '_blank')}
                sx={{ mt: 2 }}
              >
                Visualizar Receita
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CloudUpload sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
              <Typography color="text.secondary" gutterBottom>
                Nenhuma receita anexada
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUpload />}
                sx={{ mt: 2 }}
              >
                Enviar Receita
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files[0] && medicamentoSelecionado) {
                      uploadReceita(e.target.files[0], medicamentoSelecionado.id);
                      setDialogReceita(false);
                    }
                  }}
                />
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogReceita(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Detalhes do Medicamento */}
      <Dialog 
        open={modalDetalhes} 
        onClose={fecharDetalhes}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#10B981' }}>
              <Medication />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {medicamentoDetalhes?.nome}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detalhes do Medicamento
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {medicamentoDetalhes && (
            <Grid container spacing={3}>
              {/* Informações Básicas */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, bgcolor: '#f8fafc' }}>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Medication /> Informações Básicas
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Nome do Medicamento</Typography>
                      <Typography variant="body1" fontWeight={600}>{medicamentoDetalhes.nome}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Dosagem</Typography>
                      <Chip label={medicamentoDetalhes.dosagem} color="primary" size="small" />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Frequência</Typography>
                      <Typography variant="body1">{medicamentoDetalhes.frequencia}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip 
                        label={medicamentoDetalhes.ativo ? 'Ativo' : 'Inativo'} 
                        color={medicamentoDetalhes.ativo ? 'success' : 'default'} 
                        size="small" 
                      />
                    </Box>
                  </Box>
                </Card>
              </Grid>

              {/* Informações do Paciente e Horários */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, bgcolor: '#f8fafc' }}>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person /> Paciente e Horários
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Aluno</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {alunos.find(a => a.id === medicamentoDetalhes.aluno)?.nome || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Horários de Administração</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {medicamentoDetalhes.horarios?.map((horario, index) => (
                          <Chip 
                            key={index} 
                            label={horario} 
                            color="secondary" 
                            size="small"
                            sx={{ fontFamily: 'monospace' }}
                          />
                        ))}
                      </Box>
                    </Box>
                    {medicamentoDetalhes.proximaDose && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Próxima Dose</Typography>
                        <Typography variant="body1" color="warning.main" fontWeight={600}>
                          {formatarDataHora(medicamentoDetalhes.proximaDose)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Card>
              </Grid>

              {/* Período de Tratamento */}
              <Grid item xs={12}>
                <Card sx={{ p: 2, bgcolor: '#f8fafc' }}>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule /> Período de Tratamento
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Data de Início</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {medicamentoDetalhes.dataInicio ? new Date(medicamentoDetalhes.dataInicio).toLocaleDateString('pt-BR') : 'Não informado'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Data de Término</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {medicamentoDetalhes.dataFim ? new Date(medicamentoDetalhes.dataFim).toLocaleDateString('pt-BR') : 'Indefinido'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              {/* Observações */}
              {medicamentoDetalhes.observacoes && (
                <Grid item xs={12}>
                  <Card sx={{ p: 2, bgcolor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                    <Typography variant="h6" gutterBottom color="warning.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description /> Observações
                    </Typography>
                    <Typography variant="body1">
                      {medicamentoDetalhes.observacoes}
                    </Typography>
                  </Card>
                </Grid>
              )}

              {/* Receita Médica */}
              {medicamentoDetalhes.receita && (
                <Grid item xs={12}>
                  <Card sx={{ p: 2, bgcolor: '#e8f5e8', border: '1px solid #c8e6c9' }}>
                    <Typography variant="h6" gutterBottom color="success.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachFile /> Receita Médica
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body1">
                        📄 {medicamentoDetalhes.receita.nome}
                      </Typography>
                      <Button 
                        size="small" 
                        onClick={() => window.open(medicamentoDetalhes.receita.url, '_blank')}
                        startIcon={<AttachFile />}
                      >
                        Ver Receita
                      </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Enviado em: {formatarDataHora(medicamentoDetalhes.receita.dataUpload)}
                    </Typography>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={fecharDetalhes} color="primary" variant="contained">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgendaMedicaSection;