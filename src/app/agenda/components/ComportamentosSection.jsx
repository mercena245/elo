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
  LinearProgress,
  IconButton,
  Fab
} from '@mui/material';
import {
  Psychology,
  Add,
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
  Warning,
  CheckCircle,
  Person,
  School,
  Edit,
  Visibility,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { db, ref, get, push, set, remove } from '../../../firebase';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const ComportamentosSection = ({ userRole, userData }) => {
  const [comportamentos, setComportamentos] = useState([]);
  const [dialogNovoComportamento, setDialogNovoComportamento] = useState(false);
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [comportamentoSelecionado, setComportamentoSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [novoComportamento, setNovoComportamento] = useState({
    aluno: '',
    tipo: '',
    categoria: '',
    descricao: '',
    acao: '',
    gravidade: 1,
    data: new Date().toISOString().split('T')[0]
  });

  const categorias = {
    positivo: {
      label: 'Comportamento Positivo',
      color: '#10B981',
      icon: <SentimentVerySatisfied />,
      opcoes: ['Ajuda outros alunos', 'Participação ativa', 'Liderança positiva', 'Criatividade', 'Responsabilidade']
    },
    neutro: {
      label: 'Observação',
      color: '#6B7280',
      icon: <SentimentNeutral />,
      opcoes: ['Observação geral', 'Mudança de comportamento', 'Progresso acadêmico', 'Interação social']
    },
    atencao: {
      label: 'Requer Atenção',
      color: '#F59E0B',
      icon: <SentimentDissatisfied />,
      opcoes: ['Conversa paralela', 'Distração', 'Não participação', 'Atraso frequente', 'Material incompleto']
    },
    incidente: {
      label: 'Incidente',
      color: '#EF4444',
      icon: <SentimentVeryDissatisfied />,
      opcoes: ['Agressão física', 'Agressão verbal', 'Desrespeito', 'Vandalismo', 'Bullying']
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchComportamentos(),
          fetchAlunos(),
          fetchUsuarios()
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    if (userData) {
      loadData();
    }
  }, [userRole, userData]);

  useEffect(() => {
    if (comportamentos.length > 0) {
      calcularEstatisticas();
    }
  }, [comportamentos]);

  // Reprocessar alunos quando usuários carregarem (apenas para associar responsáveis)
  useEffect(() => {
    if (usuarios.length > 0 && alunos.length > 0) {
      // Só reprocessar se ainda não temos responsáveis associados
      const temResponsaveis = alunos.some(aluno => aluno.responsavelUsuario);
      if (!temResponsaveis) {
        fetchAlunos();
      }
    }
  }, [usuarios]);

  const fetchComportamentos = async () => {
    try {
      const comportamentosRef = ref(db, 'comportamentos');
      const snap = await get(comportamentosRef);
      
      if (snap.exists()) {
        const dados = snap.val();
        const comportamentosList = Object.entries(dados).map(([id, comp]) => ({
          id,
          ...comp
        }));
        
        // Filtrar baseado na role
        let comportamentosFiltrados = comportamentosList;
        if (userRole === 'pai') {
          const alunosVinculados = userData?.filhosVinculados || userData?.alunosVinculados || (userData?.alunoVinculado ? [userData.alunoVinculado] : []);
          comportamentosFiltrados = comportamentosList.filter(comp => 
            alunosVinculados.includes(comp.aluno)
          );
        } else if (userRole === 'professora') {
          comportamentosFiltrados = comportamentosList.filter(comp => 
            userData?.turmas?.some(turma => 
              comp.turma === turma
            )
          );
        }
        
        setComportamentos(comportamentosFiltrados.sort((a, b) => 
          new Date(b.data) - new Date(a.data)
        ));
      }
    } catch (error) {
      console.error('Erro ao buscar comportamentos:', error);
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
          
          // Debug apenas se não há alunos filtrados
          if (alunosFiltrados.length === 0) {
            console.log('⚠️ ComportamentosSection - Nenhum aluno encontrado para professora');
            console.log('Turmas da professora:', userData?.turmas);
            console.log('Alunos disponíveis:', alunosList.map(a => ({ nome: a.nome, turmaId: a.turmaId })));
          }
        }
        
        // Associar dados do responsável aos alunos quando os usuários estiverem carregados
        if (usuarios.length > 0) {
          alunosFiltrados = alunosFiltrados.map(aluno => {
            if (aluno.responsavelUsuarioId) {
              const responsavel = usuarios.find(u => u.id === aluno.responsavelUsuarioId);
              if (responsavel) {
                return {
                  ...aluno,
                  responsavelUsuario: {
                    id: responsavel.id,
                    nome: responsavel.nome || responsavel.email,
                    email: responsavel.email
                  }
                };
              }
            }
            return aluno;
          });
        }
        
        setAlunos(alunosFiltrados);
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const usuariosRef = ref(db, 'users');
      const snap = await get(usuariosRef);
      
      if (snap.exists()) {
        const dados = snap.val();
        const usuariosList = Object.entries(dados).map(([id, user]) => ({
          id,
          ...user
        }));
        
        setUsuarios(usuariosList);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const calcularEstatisticas = () => {
    const stats = {};
    
    alunos.forEach(aluno => {
      const comportamentosAluno = comportamentos.filter(c => c.aluno === aluno.id);
      const ultimo30Dias = comportamentosAluno.filter(c => {
        const dataComp = new Date(c.data);
        const agora = new Date();
        const diasAtras = (agora - dataComp) / (1000 * 60 * 60 * 24);
        return diasAtras <= 30;
      });
      
      stats[aluno.id] = {
        total: comportamentosAluno.length,
        positivos: ultimo30Dias.filter(c => c.categoria === 'positivo').length,
        neutros: ultimo30Dias.filter(c => c.categoria === 'neutro').length,
        atencao: ultimo30Dias.filter(c => c.categoria === 'atencao').length,
        incidentes: ultimo30Dias.filter(c => c.categoria === 'incidente').length,
        tendencia: calcularTendencia(comportamentosAluno)
      };
    });
    
    setEstatisticas(stats);
  };

  const calcularTendencia = (comportamentosAluno) => {
    if (comportamentosAluno.length < 2) return 'neutro';
    
    const recentes = comportamentosAluno.slice(0, 5);
    const anteriores = comportamentosAluno.slice(5, 10);
    
    const scoreRecente = recentes.reduce((acc, c) => {
      switch (c.categoria) {
        case 'positivo': return acc + 2;
        case 'neutro': return acc + 0;
        case 'atencao': return acc - 1;
        case 'incidente': return acc - 3;
        default: return acc;
      }
    }, 0) / recentes.length;
    
    const scoreAnterior = anteriores.reduce((acc, c) => {
      switch (c.categoria) {
        case 'positivo': return acc + 2;
        case 'neutro': return acc + 0;
        case 'atencao': return acc - 1;
        case 'incidente': return acc - 3;
        default: return acc;
      }
    }, 0) / Math.max(anteriores.length, 1);
    
    if (scoreRecente > scoreAnterior + 0.5) return 'melhorando';
    if (scoreRecente < scoreAnterior - 0.5) return 'piorando';
    return 'estavel';
  };

  const salvarComportamento = async () => {
    try {
      // Validar dados obrigatórios
      if (!novoComportamento.aluno || !novoComportamento.categoria || !novoComportamento.tipo) {
        alert('Por favor, preencha todos os campos obrigatórios (Aluno, Categoria e Tipo).');
        return;
      }

      const alunoSelecionado = alunos.find(a => a.id === novoComportamento.aluno);
      
      const comportamentoData = {
        ...novoComportamento,
        registradoPor: userData?.id || userData?.uid,
        registradorNome: userData?.nome || userData?.displayName || 'N/A',
        registradorRole: userRole || 'N/A',
        dataRegistro: new Date().toISOString(),
        turma: alunoSelecionado?.turma || 'N/A',
        alunoNome: alunoSelecionado?.nome || 'N/A'
      };

      // Remover campos undefined/null antes de salvar
      Object.keys(comportamentoData).forEach(key => {
        if (comportamentoData[key] === undefined || comportamentoData[key] === null) {
          comportamentoData[key] = '';
        }
      });

      const comportamentosRef = ref(db, 'comportamentos');
      await push(comportamentosRef, comportamentoData);
      
      setDialogNovoComportamento(false);
      setNovoComportamento({
        aluno: '', tipo: '', categoria: '', descricao: '',
        acao: '', gravidade: 1, data: new Date().toISOString().split('T')[0]
      });
      
      fetchComportamentos();
    } catch (error) {
      console.error('Erro ao salvar comportamento:', error);
    }
  };

  const formatarData = (dataISO) => {
    return new Date(dataISO).toLocaleDateString('pt-BR');
  };

  const getIconeCategoria = (categoria) => {
    return categorias[categoria]?.icon || <SentimentNeutral />;
  };

  const getCorCategoria = (categoria) => {
    return categorias[categoria]?.color || '#6B7280';
  };

  const getTendenciaIcon = (tendencia) => {
    switch (tendencia) {
      case 'melhorando': return <TrendingUp color="success" />;
      case 'piorando': return <TrendingDown color="error" />;
      default: return <SentimentNeutral color="disabled" />;
    }
  };

  if (loading) {
    return <Typography>Carregando comportamentos...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          🧠 Comportamentos e Incidentes
        </Typography>
        {(userRole === 'professora' || userRole === 'coordenadora') && (
          <Fab 
            size="medium"
            color="primary"
            onClick={() => setDialogNovoComportamento(true)}
            sx={{ 
              background: 'linear-gradient(45deg, #8B5CF6, #7C3AED)',
              '&:hover': {
                background: 'linear-gradient(45deg, #7C3AED, #6D28D9)'
              }
            }}
          >
            <Add />
          </Fab>
        )}
      </Box>

      {/* Estatísticas Gerais */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ bgcolor: '#F0FDF4', borderLeft: '4px solid #10B981' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="#10B981">
                    {comportamentos.filter(c => c.categoria === 'positivo').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Positivos
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#10B981' }}>
                  <SentimentVerySatisfied />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Card sx={{ bgcolor: '#FEF3E2', borderLeft: '4px solid #F59E0B' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="#F59E0B">
                    {comportamentos.filter(c => c.categoria === 'atencao').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Atenção
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#F59E0B' }}>
                  <Warning />
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
                    {comportamentos.filter(c => c.categoria === 'incidente').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Incidentes
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#EF4444' }}>
                  <SentimentVeryDissatisfied />
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
                    {comportamentos.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#6B7280' }}>
                  <Psychology />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Timeline de Comportamentos */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Psychology /> Registros Recentes
              </Typography>
              
              {comportamentos.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Psychology sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                  <Typography color="text.secondary">
                    Nenhum comportamento registrado
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 0 }}>
                  {comportamentos.slice(0, 10).map((comportamento, index) => (
                    <Card key={comportamento.id} sx={{ mb: 2, border: `1px solid ${getCorCategoria(comportamento.categoria)}20` }}>
                      <CardContent sx={{ py: 2 }}>
                        {/* Header do Card - Responsivo */}
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between', 
                          alignItems: { xs: 'flex-start', sm: 'flex-start' },
                          gap: { xs: 1, sm: 2 },
                          mb: 2 
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                            <Avatar sx={{ bgcolor: getCorCategoria(comportamento.categoria), width: 40, height: 40 }}>
                              {getIconeCategoria(comportamento.categoria)}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                                {alunos.find(a => a.id === comportamento.aluno)?.nome || 'Aluno não encontrado'}
                              </Typography>
                              {/* Mostrar responsável se disponível */}
                              {(() => {
                                const aluno = alunos.find(a => a.id === comportamento.aluno);
                                if (aluno?.responsavelUsuario) {
                                  return (
                                    <Typography variant="body2" sx={{ color: '#7C3AED', mb: 0.5 }}>
                                      👤 Responsável: {aluno.responsavelUsuario.nome} ({aluno.responsavelUsuario.email})
                                    </Typography>
                                  );
                                }
                                return null;
                              })()}
                              <Box sx={{ 
                                display: 'flex', 
                                flexWrap: 'wrap',
                                gap: 0.5,
                                alignItems: 'center'
                              }}>
                                <Chip 
                                  size="small" 
                                  label={categorias[comportamento.categoria]?.label}
                                  sx={{ 
                                    bgcolor: getCorCategoria(comportamento.categoria),
                                    color: 'white',
                                    fontSize: '0.75rem'
                                  }}
                                />
                                <Chip 
                                  size="small" 
                                  label={comportamento.tipo}
                                  sx={{ fontSize: '0.75rem' }}
                                />
                                <Chip 
                                  size="small" 
                                  label={`Nível: ${comportamento.gravidade}`}
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              </Box>
                            </Box>
                          </Box>
                          
                          {/* Data e Ações */}
                          <Box sx={{ 
                            display: 'flex',
                            flexDirection: { xs: 'row', sm: 'column' },
                            alignItems: { xs: 'center', sm: 'flex-end' },
                            gap: 1,
                            minWidth: 'fit-content'
                          }}>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                textAlign: { xs: 'left', sm: 'right' },
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {formatarData(comportamento.data)}
                            </Typography>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setComportamentoSelecionado(comportamento);
                                setDialogDetalhes(true);
                              }}
                              sx={{ ml: { xs: 'auto', sm: 0 } }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        {/* Descrição */}
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 1,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {comportamento.descricao}
                        </Typography>
                        
                        {/* Ação Tomada */}
                        {comportamento.acao && (
                          <Paper 
                            variant="outlined"
                            sx={{ 
                              p: 1.5, 
                              bgcolor: '#f8fafc',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                              <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                Ação tomada:
                              </Box>
                              {' '}{comportamento.acao}
                            </Typography>
                          </Paper>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Estatísticas por Aluno */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Estatísticas por Aluno
              </Typography>
              
              {Object.keys(estatisticas).length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  Estatísticas serão exibidas após registros
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {Object.entries(estatisticas).map(([alunoId, stats]) => {
                    const aluno = alunos.find(a => a.id === alunoId);
                    if (!aluno) return null;
                    
                    return (
                      <ListItem key={alunoId} sx={{ px: 0, border: '1px solid #f3f4f6', borderRadius: 1, mb: 1 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#3B82F6' }}>
                            <Person />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={aluno.nome}
                          secondary={
                            <Box>
                              <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                                <Chip size="small" label={`+${stats.positivos}`} color="success" />
                                <Chip size="small" label={`⚠${stats.atencao}`} color="warning" />
                                <Chip size="small" label={`!${stats.incidentes}`} color="error" />
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getTendenciaIcon(stats.tendencia)}
                                <Typography variant="caption">
                                  {stats.tendencia === 'melhorando' ? 'Melhorando' :
                                   stats.tendencia === 'piorando' ? 'Precisa atenção' : 'Estável'}
                                </Typography>
                              </Box>
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
      </Grid>

      {/* Dialog Novo Comportamento */}
      <Dialog 
        open={dialogNovoComportamento} 
        onClose={() => setDialogNovoComportamento(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>🧠 Registrar Comportamento</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Aluno</InputLabel>
                  <Select
                    value={novoComportamento.aluno}
                    onChange={(e) => setNovoComportamento({ ...novoComportamento, aluno: e.target.value })}
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
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={novoComportamento.categoria}
                    onChange={(e) => setNovoComportamento({ ...novoComportamento, categoria: e.target.value, tipo: '' })}
                  >
                    {Object.entries(categorias).map(([key, cat]) => (
                      <MenuItem key={key} value={key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {cat.icon}
                          {cat.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {novoComportamento.categoria && (
                <Grid item xs={12}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={novoComportamento.tipo}
                      onChange={(e) => setNovoComportamento({ ...novoComportamento, tipo: e.target.value })}
                    >
                      {categorias[novoComportamento.categoria].opcoes.map((opcao) => (
                        <MenuItem key={opcao} value={opcao}>
                          {opcao}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data"
                  value={novoComportamento.data}
                  onChange={(e) => setNovoComportamento({ ...novoComportamento, data: e.target.value })}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Gravidade</InputLabel>
                  <Select
                    value={novoComportamento.gravidade}
                    onChange={(e) => setNovoComportamento({ ...novoComportamento, gravidade: e.target.value })}
                  >
                    <MenuItem value={1}>Baixa</MenuItem>
                    <MenuItem value={2}>Média</MenuItem>
                    <MenuItem value={3}>Alta</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição detalhada"
                  multiline
                  rows={3}
                  value={novoComportamento.descricao}
                  onChange={(e) => setNovoComportamento({ ...novoComportamento, descricao: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ação tomada (opcional)"
                  multiline
                  rows={2}
                  value={novoComportamento.acao}
                  onChange={(e) => setNovoComportamento({ ...novoComportamento, acao: e.target.value })}
                  sx={{ mb: 2 }}
                  placeholder="Descreva as medidas tomadas ou orientações dadas"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogNovoComportamento(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={salvarComportamento}
            disabled={!novoComportamento.aluno || !novoComportamento.categoria || !novoComportamento.tipo}
          >
            Registrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Detalhes */}
      <Dialog 
        open={dialogDetalhes} 
        onClose={() => setDialogDetalhes(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {comportamentoSelecionado && (
              <>
                <Avatar sx={{ 
                  bgcolor: getCorCategoria(comportamentoSelecionado.categoria),
                  width: 40,
                  height: 40
                }}>
                  {getIconeCategoria(comportamentoSelecionado.categoria)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Detalhes do Comportamento
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {alunos.find(a => a.id === comportamentoSelecionado.aluno)?.nome}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {comportamentoSelecionado && (
            <Grid container spacing={3}>
              {/* Informações Principais */}
              <Grid item xs={12}>
                <Card sx={{ p: 2, bgcolor: `${getCorCategoria(comportamentoSelecionado.categoria)}10`, border: `1px solid ${getCorCategoria(comportamentoSelecionado.categoria)}30` }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    📊 Classificação
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip 
                      label={categorias[comportamentoSelecionado.categoria]?.label}
                      sx={{ 
                        bgcolor: getCorCategoria(comportamentoSelecionado.categoria), 
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                    <Chip 
                      label={comportamentoSelecionado.tipo}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip 
                      label={`Gravidade: ${comportamentoSelecionado.gravidade}/5`}
                      color={comportamentoSelecionado.gravidade >= 4 ? 'error' : comportamentoSelecionado.gravidade >= 3 ? 'warning' : 'success'}
                      variant="outlined"
                    />
                  </Box>
                </Card>
              </Grid>
              
              {/* Detalhes */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, height: 'fit-content' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    📅 Informações Gerais
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Data do Registro</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {formatarData(comportamentoSelecionado.data)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Aluno</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {alunos.find(a => a.id === comportamentoSelecionado.aluno)?.nome || 'N/A'}
                      </Typography>
                    </Box>
                    {comportamentoSelecionado.registradorNome && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Registrado por</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {comportamentoSelecionado.registradorNome} ({comportamentoSelecionado.registradorRole})
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Card>
              </Grid>
              
              {/* Descrição */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, height: 'fit-content' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    📝 Descrição
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                    {comportamentoSelecionado.descricao}
                  </Typography>
                </Card>
              </Grid>
              
              {/* Ação Tomada */}
              {comportamentoSelecionado.acao && (
                <Grid item xs={12}>
                  <Card sx={{ p: 2, bgcolor: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                      ⚡ Ação Tomada
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                      {comportamentoSelecionado.acao}
                    </Typography>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button 
            onClick={() => setDialogDetalhes(false)}
            color="primary"
            variant="contained"
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComportamentosSection;