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
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
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
  TrendingDown,
  ExpandMore,
  FilterList,
  Assessment,
  Delete
} from '@mui/icons-material';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';

const ComportamentosSection = ({ userRole, userData }) => {
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  const [comportamentos, setComportamentos] = useState([]);
  const [dialogNovoComportamento, setDialogNovoComportamento] = useState(false);
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [comportamentoSelecionado, setComportamentoSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [filtrosEstatisticas, setFiltrosEstatisticas] = useState({
    aluno: '',
    turma: '',
    periodo: '30' // dias
  });
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
    if (userData) {
      setLoading(true);
      fetchComportamentos();
      fetchAlunos();
      fetchUsuarios();
    }
  }, [userData, isReady]);

  useEffect(() => {
    if (comportamentos.length > 0 && alunos.length > 0) {
      calcularEstatisticas();
    }
  }, [comportamentos, alunos, filtrosEstatisticas]);

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
    if (!isReady) return;
    
    try {
      const dados = await getData('comportamentos');
      
      if (dados) {
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
    } finally {
      setLoading(false);
    }
  };

  const fetchAlunos = async () => {
    if (!isReady) return;
    
    try {
      const dados = await getData('alunos');
      
      if (dados) {
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
    if (!isReady) return;
    
    try {
      const dados = await getData('users');
      
      if (dados) {
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
    
    // Filtrar alunos baseado nos filtros
    let alunosFiltrados = [...alunos];
    
    // Filtrar por turma primeiro
    if (filtrosEstatisticas.turma) {
      alunosFiltrados = alunosFiltrados.filter(a => a.turmaId === filtrosEstatisticas.turma);
    }
    
    // Filtrar por nome (busca por texto enquanto digita)
    if (filtrosEstatisticas.aluno) {
      alunosFiltrados = alunosFiltrados.filter(a => 
        a.nome.toLowerCase().includes(filtrosEstatisticas.aluno.toLowerCase())
      );
    }
    
    const diasPeriodo = parseInt(filtrosEstatisticas.periodo) || 30;
    
    alunosFiltrados.forEach(aluno => {
      const comportamentosAluno = comportamentos.filter(c => c.aluno === aluno.id);
      const ultimosDias = comportamentosAluno.filter(c => {
        const dataComp = new Date(c.data);
        const agora = new Date();
        const diasAtras = (agora - dataComp) / (1000 * 60 * 60 * 24);
        return diasAtras <= diasPeriodo;
      });
      
      const total = comportamentosAluno.length;
      const positivos = ultimosDias.filter(c => c.categoria === 'positivo').length;
      const neutros = ultimosDias.filter(c => c.categoria === 'neutro').length;
      const atencao = ultimosDias.filter(c => c.categoria === 'atencao').length;
      const incidentes = ultimosDias.filter(c => c.categoria === 'incidente').length;
      
      // Calcular score geral (últimos N dias)
      const scoreGeral = (positivos * 2) - (atencao * 1) - (incidentes * 3);
      
      stats[aluno.id] = {
        aluno,
        total,
        positivos,
        neutros,
        atencao,
        incidentes,
        scoreGeral,
        ultimosDias: ultimosDias.length,
        tendencia: calcularTendencia(comportamentosAluno),
        ultimoRegistro: comportamentosAluno.length > 0 ? 
          new Date(comportamentosAluno[0].data).toLocaleDateString('pt-BR') : 'Sem registros'
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
    // 🔒 Verificar se banco está pronto
    if (!isReady) {
      alert('Sistema não está pronto. Aguarde um momento e tente novamente.');
      console.error('❌ Banco não está pronto para salvar comportamento');
      return;
    }

    if (!pushData) {
      alert('Serviço de banco de dados não disponível.');
      console.error('❌ pushData não está disponível');
      return;
    }

    try {
      // Validar dados obrigatórios
      if (!novoComportamento.aluno || !novoComportamento.categoria || !novoComportamento.tipo) {
        alert('Por favor, preencha todos os campos obrigatórios (Aluno, Categoria e Tipo).');
        return;
      }

      const alunoSelecionado = alunos.find(a => a.id === novoComportamento.aluno);
      
      console.log('📝 Salvando comportamento:', novoComportamento);
      
      const comportamentoData = {
        ...novoComportamento,
        registradoPor: userData?.id || userData?.uid,
        registradorNome: userData?.nome || userData?.displayName || 'N/A',
        registradorRole: userRole || 'N/A',
        dataRegistro: new Date().toISOString(),
        turma: alunoSelecionado?.turmaId || 'N/A',
        alunoNome: alunoSelecionado?.nome || 'N/A'
      };

      // Remover campos undefined/null antes de salvar
      Object.keys(comportamentoData).forEach(key => {
        if (comportamentoData[key] === undefined || comportamentoData[key] === null) {
          comportamentoData[key] = '';
        }
      });

      // 🔒 Usar pushData do hook multi-tenant
      console.log('💾 Salvando em comportamentos...');
      const novoId = await pushData('comportamentos', comportamentoData);
      console.log('✅ Comportamento salvo com ID:', novoId);
      
      setDialogNovoComportamento(false);
      setNovoComportamento({
        aluno: '', tipo: '', categoria: '', descricao: '',
        acao: '', gravidade: 1, data: new Date().toISOString().split('T')[0]
      });
      
      await fetchComportamentos();
      alert('Comportamento registrado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar comportamento:', error);
      alert(`Erro ao salvar comportamento: ${error.message}`);
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

        {/* Estatísticas por Aluno - VERSÃO EXPANDIDA */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Assessment color="primary" />
                <Typography variant="h6">
                  📊 Estatísticas Detalhadas por Aluno
                </Typography>
                <Chip 
                  label={`${Object.keys(estatisticas).length} ${Object.keys(estatisticas).length === 1 ? 'aluno' : 'alunos'}`} 
                  size="small" 
                  color="primary"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {/* Filtros */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 3, 
                p: 2, 
                borderRadius: 3, 
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                flexWrap: 'wrap'
              }}>
                <FormControl sx={{ 
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover': {
                      '& > fieldset': {
                        borderColor: '#6366f1'
                      }
                    }
                  }
                }}>
                  <InputLabel id="turma-filter-label">Turma</InputLabel>
                  <Select
                    labelId="turma-filter-label"
                    value={filtrosEstatisticas.turma}
                    label="Turma"
                    onChange={(e) => setFiltrosEstatisticas(prev => ({ ...prev, turma: e.target.value, aluno: '' }))}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {[...new Set(alunos.map(a => a.turmaId))].filter(Boolean).map((turmaId) => {
                      const aluno = alunos.find(a => a.turmaId === turmaId);
                      return (
                        <MenuItem key={turmaId} value={turmaId}>
                          {aluno?.turmaNome || turmaId}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                
                <TextField
                  label="Nome do Aluno"
                  value={filtrosEstatisticas.aluno}
                  onChange={(e) => setFiltrosEstatisticas(prev => ({ ...prev, aluno: e.target.value }))}
                  placeholder="Digite o nome"
                  variant="outlined"
                  fullWidth
                  disabled={filtrosEstatisticas.turma === ""}
                  sx={{
                    flex: 1,
                    minWidth: 200,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover': {
                        '& > fieldset': {
                          borderColor: '#6366f1'
                        }
                      }
                    }
                  }}
                />
                
                <FormControl sx={{ 
                  minWidth: 180,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover': {
                      '& > fieldset': {
                        borderColor: '#6366f1'
                      }
                    }
                  }
                }}>
                  <InputLabel id="periodo-filter-label">Período</InputLabel>
                  <Select
                    labelId="periodo-filter-label"
                    value={filtrosEstatisticas.periodo}
                    label="Período"
                    onChange={(e) => setFiltrosEstatisticas(prev => ({ ...prev, periodo: e.target.value }))}
                  >
                    <MenuItem value="7">Últimos 7 dias</MenuItem>
                    <MenuItem value="15">Últimos 15 dias</MenuItem>
                    <MenuItem value="30">Últimos 30 dias</MenuItem>
                    <MenuItem value="60">Últimos 60 dias</MenuItem>
                    <MenuItem value="90">Últimos 90 dias</MenuItem>
                    <MenuItem value="365">Último ano</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Tabela de Estatísticas */}
              {Object.keys(estatisticas).length === 0 ? (
                <Alert severity="info">
                  <Typography variant="body2">
                    {alunos.length === 0 
                      ? 'Nenhum aluno encontrado. Cadastre alunos para visualizar estatísticas.'
                      : comportamentos.length === 0
                      ? 'Nenhum comportamento registrado ainda. As estatísticas serão exibidas após os primeiros registros.'
                      : 'Nenhum resultado para os filtros selecionados.'}
                  </Typography>
                </Alert>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#F3F4F6' }}>Aluno</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#F3F4F6' }}>
                          <Tooltip title="Total de registros no período">
                            <span>Total</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#E8F5E9' }}>
                          <Tooltip title="Comportamentos positivos">
                            <span>✅ Positivos</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#FFF3E0' }}>
                          <Tooltip title="Pontos de atenção">
                            <span>⚠️ Atenção</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#FFEBEE' }}>
                          <Tooltip title="Incidentes graves">
                            <span>❗ Incidentes</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#F3F4F6' }}>
                          <Tooltip title="Score geral: Positivos (+2) - Atenção (-1) - Incidentes (-3)">
                            <span>Score</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#F3F4F6' }}>Tendência</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#F3F4F6' }}>Último Registro</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(estatisticas)
                        .sort(([, a], [, b]) => b.scoreGeral - a.scoreGeral) // Ordenar por score
                        .map(([alunoId, stats]) => {
                          const scorePercent = Math.max(0, Math.min(100, ((stats.scoreGeral + 10) / 20) * 100));
                          const scoreColor = stats.scoreGeral > 5 ? 'success.main' : 
                                           stats.scoreGeral > 0 ? 'info.main' :
                                           stats.scoreGeral > -5 ? 'warning.main' : 'error.main';
                          
                          return (
                            <TableRow key={alunoId} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                    <Person fontSize="small" />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                      {stats.aluno.nome}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {stats.aluno.turmaNome || 'Sem turma'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={stats.ultimosDias} 
                                  size="small" 
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={stats.positivos} 
                                  size="small" 
                                  color="success"
                                  sx={{ minWidth: 40 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={stats.atencao} 
                                  size="small" 
                                  color="warning"
                                  sx={{ minWidth: 40 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={stats.incidentes} 
                                  size="small" 
                                  color="error"
                                  sx={{ minWidth: 40 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                  <Typography 
                                    variant="h6" 
                                    sx={{ 
                                      color: scoreColor,
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {stats.scoreGeral > 0 ? '+' : ''}{stats.scoreGeral}
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={scorePercent} 
                                    sx={{ 
                                      width: 60, 
                                      height: 6, 
                                      borderRadius: 3,
                                      bgcolor: 'grey.200',
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: scoreColor
                                      }
                                    }} 
                                  />
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                  {getTendenciaIcon(stats.tendencia)}
                                  <Typography variant="caption" fontWeight={600}>
                                    {stats.tendencia === 'melhorando' ? 'Melhorando' :
                                     stats.tendencia === 'piorando' ? 'Precisa Atenção' : 
                                     stats.tendencia === 'estavel' ? 'Estável' : 'Sem dados'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="caption" color="text.secondary">
                                  {stats.ultimoRegistro}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Resumo Geral */}
              {Object.keys(estatisticas).length > 0 && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#E8F5E9', textAlign: 'center' }}>
                      <CardContent>
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {Object.values(estatisticas).reduce((acc, s) => acc + s.positivos, 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Comportamentos Positivos
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#FFF3E0', textAlign: 'center' }}>
                      <CardContent>
                        <Typography variant="h4" color="warning.main" fontWeight="bold">
                          {Object.values(estatisticas).reduce((acc, s) => acc + s.atencao, 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pontos de Atenção
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#FFEBEE', textAlign: 'center' }}>
                      <CardContent>
                        <Typography variant="h4" color="error.main" fontWeight="bold">
                          {Object.values(estatisticas).reduce((acc, s) => acc + s.incidentes, 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Incidentes
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#E3F2FD', textAlign: 'center' }}>
                      <CardContent>
                        <Typography variant="h4" color="primary.main" fontWeight="bold">
                          {Object.values(estatisticas).reduce((acc, s) => acc + s.ultimosDias, 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total no Período
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </AccordionDetails>
          </Accordion>
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
                <FormControl fullWidth sx={{ mb: 2, minWidth: '250px' }}>
                  <InputLabel>Aluno</InputLabel>
                  <Select
                    value={novoComportamento.aluno}
                    label="Aluno"
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
                <FormControl fullWidth sx={{ mb: 2, minWidth: '250px' }}>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={novoComportamento.categoria}
                    label="Categoria"
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
                  <FormControl fullWidth sx={{ mb: 2, minWidth: '250px' }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={novoComportamento.tipo}
                      label="Tipo"
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