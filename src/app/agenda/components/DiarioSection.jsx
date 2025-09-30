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
  Rating,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Badge,
  Fab
} from '@mui/material';
import {
  MenuBook,
  Add,
  Person,
  Today,
  Restaurant,
  Bed,
  Psychology,
  School,
  LocalActivity,
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
  Edit,
  Visibility,
  ExpandMore,
  TrendingUp,
  TrendingDown,
  Assessment,
  DateRange,
  PhotoCamera,
  AttachFile
} from '@mui/icons-material';
import { db, ref, get, push, set } from '../../../firebase';

const DiarioSection = ({ userRole, userData }) => {
  const [entradas, setEntradas] = useState([]);
  const [dialogNovaEntrada, setDialogNovaEntrada] = useState(false);
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [entradaSelecionada, setEntradaSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState([]);
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0]);
  const [filtroAluno, setFiltroAluno] = useState('');
  const [estatisticas, setEstatisticas] = useState({});
  const [novaEntrada, setNovaEntrada] = useState({
    aluno: '',
    data: new Date().toISOString().split('T')[0],
    alimentacao: {
      cafeCompleto: false,
      cafeObs: '',
      almoco: 'bom',
      almocoObs: '',
      lanche: 'bom',
      lancheObs: ''
    },
    sono: {
      dormiu: false,
      qualidade: 'bom',
      duracao: '',
      observacoes: ''
    },
    humor: {
      chegada: 3,
      saida: 3,
      observacoes: ''
    },
    atividades: {
      participacao: 'boa',
      atividade: '',
      destaque: '',
      dificuldades: ''
    },
    comportamento: {
      geral: 'bom',
      relacionamento: 'bom',
      autonomia: 'bom',
      observacoes: ''
    },
    higiene: {
      trocas: 0,
      observacoes: ''
    },
    observacoesGerais: '',
    fotos: []
  });

  const avaliacoes = {
    otimo: { label: 'Ótimo', color: '#10B981', icon: <SentimentVerySatisfied /> },
    bom: { label: 'Bom', color: '#3B82F6', icon: <SentimentSatisfied /> },
    regular: { label: 'Regular', color: '#F59E0B', icon: <SentimentNeutral /> },
    ruim: { label: 'Ruim', color: '#EF4444', icon: <SentimentDissatisfied /> },
    nao_se_aplica: { label: 'Não se aplica', color: '#6B7280', icon: <SentimentNeutral /> }
  };

  const humorLabels = {
    1: 'Muito triste',
    2: 'Triste', 
    3: 'Normal',
    4: 'Feliz',
    5: 'Muito feliz'
  };

  useEffect(() => {
    fetchEntradas();
    fetchAlunos();
  }, [userData, filtroData, filtroAluno]);

  useEffect(() => {
    if (entradas.length > 0) {
      calcularEstatisticas();
    }
  }, [entradas]);

  const fetchEntradas = async () => {
    try {
      const entradasRef = ref(db, 'diario');
      const snap = await get(entradasRef);
      
      if (snap.exists()) {
        const dados = snap.val();
        const entradasList = Object.entries(dados).map(([id, entrada]) => ({
          id,
          ...entrada
        }));
        
        // Filtrar baseado na role
        let entradasFiltradas = entradasList;
        if (userRole === 'pai') {
          const alunosVinculados = userData?.filhosVinculados || userData?.alunosVinculados || (userData?.alunoVinculado ? [userData.alunoVinculado] : []);
          entradasFiltradas = entradasList.filter(entrada => 
            alunosVinculados.includes(entrada.aluno)
          );
        } else if (userRole === 'professora') {
          entradasFiltradas = entradasList.filter(entrada => {
            const aluno = alunos.find(a => a.id === entrada.aluno);
            return aluno && userData?.turmas?.includes(aluno.turmaId);
          });
        }
        
        // Aplicar filtros
        if (filtroData) {
          entradasFiltradas = entradasFiltradas.filter(entrada => 
            entrada.data === filtroData
          );
        }
        
        if (filtroAluno) {
          entradasFiltradas = entradasFiltradas.filter(entrada => 
            entrada.aluno === filtroAluno
          );
        }
        
        setEntradas(entradasFiltradas.sort((a, b) => 
          new Date(b.dataRegistro) - new Date(a.dataRegistro)
        ));
      }
    } catch (error) {
      console.error('Erro ao buscar entradas do diário:', error);
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

  const calcularEstatisticas = () => {
    const stats = {};
    
    alunos.forEach(aluno => {
      const entradasAluno = entradas.filter(e => e.aluno === aluno.id);
      
      if (entradasAluno.length > 0) {
        const mediaHumorChegada = entradasAluno.reduce((acc, e) => acc + (e.humor?.chegada || 3), 0) / entradasAluno.length;
        const mediaHumorSaida = entradasAluno.reduce((acc, e) => acc + (e.humor?.saida || 3), 0) / entradasAluno.length;
        
        const alimentacaoBoa = entradasAluno.filter(e => 
          e.alimentacao?.almoco === 'bom' || e.alimentacao?.almoco === 'otimo'
        ).length;
        
        const sonoBom = entradasAluno.filter(e => 
          e.sono?.qualidade === 'bom' || e.sono?.qualidade === 'otimo'
        ).length;
        
        stats[aluno.id] = {
          totalEntradas: entradasAluno.length,
          mediaHumorChegada: Math.round(mediaHumorChegada * 10) / 10,
          mediaHumorSaida: Math.round(mediaHumorSaida * 10) / 10,
          percentualAlimentacaoBoa: Math.round((alimentacaoBoa / entradasAluno.length) * 100),
          percentualSonoBom: Math.round((sonoBom / entradasAluno.length) * 100),
          tendenciaHumor: mediaHumorSaida > mediaHumorChegada ? 'melhorando' : 
                         mediaHumorSaida < mediaHumorChegada ? 'piorando' : 'estavel'
        };
      }
    });
    
    setEstatisticas(stats);
  };

  const salvarEntrada = async () => {
    try {
      const entradaData = {
        ...novaEntrada,
        registradoPor: userData?.id || userData?.uid,
        dataRegistro: new Date().toISOString(),
        turmaId: alunos.find(a => a.id === novaEntrada.aluno)?.turmaId
      };

      const diarioRef = ref(db, 'diario');
      await push(diarioRef, entradaData);
      
      setDialogNovaEntrada(false);
      setNovaEntrada({
        aluno: '', data: new Date().toISOString().split('T')[0],
        alimentacao: { cafeCompleto: false, cafeObs: '', almoco: 'bom', almocoObs: '', lanche: 'bom', lancheObs: '' },
        sono: { dormiu: false, qualidade: 'bom', duracao: '', observacoes: '' },
        humor: { chegada: 3, saida: 3, observacoes: '' },
        atividades: { participacao: 'boa', atividade: '', destaque: '', dificuldades: '' },
        comportamento: { geral: 'bom', relacionamento: 'bom', autonomia: 'bom', observacoes: '' },
        higiene: { trocas: 0, observacoes: '' },
        observacoesGerais: '', fotos: []
      });
      
      fetchEntradas();
    } catch (error) {
      console.error('Erro ao salvar entrada do diário:', error);
    }
  };

  const formatarData = (dataISO) => {
    return new Date(dataISO).toLocaleDateString('pt-BR');
  };

  const getHumorIcon = (valor) => {
    if (valor >= 4) return <SentimentVerySatisfied sx={{ color: '#10B981' }} />;
    if (valor === 3) return <SentimentNeutral sx={{ color: '#F59E0B' }} />;
    return <SentimentDissatisfied sx={{ color: '#EF4444' }} />;
  };

  const getAvaliacaoColor = (avaliacao) => {
    return avaliacoes[avaliacao]?.color || '#6B7280';
  };

  if (loading) {
    return <Typography>Carregando diário...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          📖 Diário da Criança
        </Typography>
        {(userRole === 'professora' || userRole === 'coordenadora') && (
          <Fab 
            size="medium"
            color="primary"
            onClick={() => setDialogNovaEntrada(true)}
            sx={{ 
              background: 'linear-gradient(45deg, #6366F1, #4F46E5)',
              '&:hover': {
                background: 'linear-gradient(45deg, #4F46E5, #4338CA)'
              }
            }}
          >
            <Add />
          </Fab>
        )}
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>🔍 Filtros</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Data"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Aluno</InputLabel>
                <Select
                  value={filtroAluno}
                  onChange={(e) => setFiltroAluno(e.target.value)}
                >
                  <MenuItem value="">Todos os alunos</MenuItem>
                  {alunos.map((aluno) => (
                    <MenuItem key={aluno.id} value={aluno.id}>
                      {aluno.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {Object.keys(estatisticas).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>📊 Estatísticas</Typography>
            <Grid container spacing={2}>
              {Object.entries(estatisticas).map(([alunoId, stats]) => {
                const aluno = alunos.find(a => a.id === alunoId);
                if (!aluno) return null;
                
                return (
                  <Grid item xs={12} md={6} lg={4} key={alunoId}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          {aluno.nome}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="body2">Humor:</Typography>
                          {getHumorIcon(stats.mediaHumorChegada)}
                          <Typography variant="caption">→</Typography>
                          {getHumorIcon(stats.mediaHumorSaida)}
                          {stats.tendenciaHumor === 'melhorando' && <TrendingUp color="success" />}
                          {stats.tendenciaHumor === 'piorando' && <TrendingDown color="error" />}
                        </Box>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2">Alimentação:</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={stats.percentualAlimentacaoBoa}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                          <Typography variant="caption">{stats.percentualAlimentacaoBoa}% bom/ótimo</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2">Sono:</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={stats.percentualSonoBom}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                          <Typography variant="caption">{stats.percentualSonoBom}% bom/ótimo</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Entradas do Diário */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {entradas.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <MenuBook sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                <Typography color="text.secondary">
                  Nenhuma entrada encontrada para os filtros selecionados
                </Typography>
              </CardContent>
            </Card>
          ) : (
            entradas.map((entrada) => {
              const aluno = alunos.find(a => a.id === entrada.aluno);
              
              return (
                <Card key={entrada.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          📖 {aluno?.nome || 'Aluno não encontrado'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatarData(entrada.data)} • Registrado em {new Date(entrada.dataRegistro).toLocaleString('pt-BR')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          label={`Humor: ${humorLabels[entrada.humor?.chegada] || 'Normal'} → ${humorLabels[entrada.humor?.saida] || 'Normal'}`}
                          icon={getHumorIcon(entrada.humor?.saida)}
                          size="small"
                        />
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEntradaSelecionada(entrada);
                            setDialogDetalhes(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {/* Resumo rápido */}
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                          <Restaurant sx={{ color: getAvaliacaoColor(entrada.alimentacao?.almoco) }} />
                          <Typography variant="caption" display="block">
                            Almoço: {avaliacoes[entrada.alimentacao?.almoco]?.label}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                          <Bed sx={{ color: getAvaliacaoColor(entrada.sono?.qualidade) }} />
                          <Typography variant="caption" display="block">
                            Sono: {avaliacoes[entrada.sono?.qualidade]?.label}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                          <Psychology sx={{ color: getAvaliacaoColor(entrada.comportamento?.geral) }} />
                          <Typography variant="caption" display="block">
                            Comportamento: {avaliacoes[entrada.comportamento?.geral]?.label}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                          <School sx={{ color: getAvaliacaoColor(entrada.atividades?.participacao) }} />
                          <Typography variant="caption" display="block">
                            Participação: {avaliacoes[entrada.atividades?.participacao]?.label}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    {entrada.observacoesGerais && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f9ff', borderRadius: 1, borderLeft: '4px solid #3B82F6' }}>
                        <Typography variant="body2">
                          <strong>Observações:</strong> {entrada.observacoesGerais}
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

      {/* Dialog Nova Entrada */}
      <Dialog 
        open={dialogNovaEntrada} 
        onClose={() => setDialogNovaEntrada(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>📖 Nova Entrada do Diário</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Aluno</InputLabel>
                  <Select
                    value={novaEntrada.aluno}
                    onChange={(e) => setNovaEntrada({ ...novaEntrada, aluno: e.target.value })}
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
                  type="date"
                  label="Data"
                  value={novaEntrada.data}
                  onChange={(e) => setNovaEntrada({ ...novaEntrada, data: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {/* Alimentação */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">🍽️ Alimentação</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Café da manhã</Typography>
                    <FormControl component="fieldset">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <label>
                          <input
                            type="checkbox"
                            checked={novaEntrada.alimentacao.cafeCompleto}
                            onChange={(e) => setNovaEntrada({
                              ...novaEntrada,
                              alimentacao: { ...novaEntrada.alimentacao, cafeCompleto: e.target.checked }
                            })}
                          />
                          Tomou café completo
                        </label>
                      </Box>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Observações do café"
                      value={novaEntrada.alimentacao.cafeObs}
                      onChange={(e) => setNovaEntrada({
                        ...novaEntrada,
                        alimentacao: { ...novaEntrada.alimentacao, cafeObs: e.target.value }
                      })}
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Almoço</InputLabel>
                      <Select
                        value={novaEntrada.alimentacao.almoco}
                        onChange={(e) => setNovaEntrada({
                          ...novaEntrada,
                          alimentacao: { ...novaEntrada.alimentacao, almoco: e.target.value }
                        })}
                      >
                        {Object.entries(avaliacoes).map(([key, avaliacao]) => (
                          <MenuItem key={key} value={key}>
                            {avaliacao.icon} {avaliacao.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Lanche</InputLabel>
                      <Select
                        value={novaEntrada.alimentacao.lanche}
                        onChange={(e) => setNovaEntrada({
                          ...novaEntrada,
                          alimentacao: { ...novaEntrada.alimentacao, lanche: e.target.value }
                        })}
                      >
                        {Object.entries(avaliacoes).map(([key, avaliacao]) => (
                          <MenuItem key={key} value={key}>
                            {avaliacao.icon} {avaliacao.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Sono */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">😴 Sono</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <label>
                          <input
                            type="checkbox"
                            checked={novaEntrada.sono.dormiu}
                            onChange={(e) => setNovaEntrada({
                              ...novaEntrada,
                              sono: { ...novaEntrada.sono, dormiu: e.target.checked }
                            })}
                          />
                          Dormiu
                        </label>
                      </Box>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Qualidade do sono</InputLabel>
                      <Select
                        value={novaEntrada.sono.qualidade}
                        onChange={(e) => setNovaEntrada({
                          ...novaEntrada,
                          sono: { ...novaEntrada.sono, qualidade: e.target.value }
                        })}
                      >
                        {Object.entries(avaliacoes).map(([key, avaliacao]) => (
                          <MenuItem key={key} value={key}>
                            {avaliacao.icon} {avaliacao.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Duração do sono"
                      value={novaEntrada.sono.duracao}
                      onChange={(e) => setNovaEntrada({
                        ...novaEntrada,
                        sono: { ...novaEntrada.sono, duracao: e.target.value }
                      })}
                      placeholder="Ex: 1h30min"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Humor */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">😊 Humor</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography gutterBottom>Humor na chegada</Typography>
                    <Rating
                      value={novaEntrada.humor.chegada}
                      onChange={(event, newValue) => setNovaEntrada({
                        ...novaEntrada,
                        humor: { ...novaEntrada.humor, chegada: newValue || 3 }
                      })}
                      max={5}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography gutterBottom>Humor na saída</Typography>
                    <Rating
                      value={novaEntrada.humor.saida}
                      onChange={(event, newValue) => setNovaEntrada({
                        ...novaEntrada,
                        humor: { ...novaEntrada.humor, saida: newValue || 3 }
                      })}
                      max={5}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Atividades */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">🎯 Atividades</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Participação</InputLabel>
                      <Select
                        value={novaEntrada.atividades.participacao}
                        onChange={(e) => setNovaEntrada({
                          ...novaEntrada,
                          atividades: { ...novaEntrada.atividades, participacao: e.target.value }
                        })}
                      >
                        {Object.entries(avaliacoes).map(([key, avaliacao]) => (
                          <MenuItem key={key} value={key}>
                            {avaliacao.icon} {avaliacao.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Atividade principal"
                      value={novaEntrada.atividades.atividade}
                      onChange={(e) => setNovaEntrada({
                        ...novaEntrada,
                        atividades: { ...novaEntrada.atividades, atividade: e.target.value }
                      })}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Destaque do dia"
                      multiline
                      rows={2}
                      value={novaEntrada.atividades.destaque}
                      onChange={(e) => setNovaEntrada({
                        ...novaEntrada,
                        atividades: { ...novaEntrada.atividades, destaque: e.target.value }
                      })}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Comportamento */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">🎭 Comportamento</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Geral</InputLabel>
                      <Select
                        value={novaEntrada.comportamento.geral}
                        onChange={(e) => setNovaEntrada({
                          ...novaEntrada,
                          comportamento: { ...novaEntrada.comportamento, geral: e.target.value }
                        })}
                      >
                        {Object.entries(avaliacoes).map(([key, avaliacao]) => (
                          <MenuItem key={key} value={key}>
                            {avaliacao.icon} {avaliacao.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Relacionamento</InputLabel>
                      <Select
                        value={novaEntrada.comportamento.relacionamento}
                        onChange={(e) => setNovaEntrada({
                          ...novaEntrada,
                          comportamento: { ...novaEntrada.comportamento, relacionamento: e.target.value }
                        })}
                      >
                        {Object.entries(avaliacoes).map(([key, avaliacao]) => (
                          <MenuItem key={key} value={key}>
                            {avaliacao.icon} {avaliacao.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Autonomia</InputLabel>
                      <Select
                        value={novaEntrada.comportamento.autonomia}
                        onChange={(e) => setNovaEntrada({
                          ...novaEntrada,
                          comportamento: { ...novaEntrada.comportamento, autonomia: e.target.value }
                        })}
                      >
                        {Object.entries(avaliacoes).map(([key, avaliacao]) => (
                          <MenuItem key={key} value={key}>
                            {avaliacao.icon} {avaliacao.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Higiene */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">🧼 Higiene</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Número de trocas"
                      value={novaEntrada.higiene.trocas}
                      onChange={(e) => setNovaEntrada({
                        ...novaEntrada,
                        higiene: { ...novaEntrada.higiene, trocas: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Observações de higiene"
                      multiline
                      rows={2}
                      value={novaEntrada.higiene.observacoes}
                      onChange={(e) => setNovaEntrada({
                        ...novaEntrada,
                        higiene: { ...novaEntrada.higiene, observacoes: e.target.value }
                      })}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Observações Gerais */}
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Observações gerais do dia"
                multiline
                rows={3}
                value={novaEntrada.observacoesGerais}
                onChange={(e) => setNovaEntrada({ ...novaEntrada, observacoesGerais: e.target.value })}
                placeholder="Conte como foi o dia da criança, momentos especiais, conquistas..."
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogNovaEntrada(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={salvarEntrada}
            disabled={!novaEntrada.aluno || !novaEntrada.data}
          >
            Salvar Entrada
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
        <DialogTitle>📋 Detalhes do Diário</DialogTitle>
        <DialogContent>
          {entradaSelecionada && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {alunos.find(a => a.id === entradaSelecionada.aluno)?.nome} - {formatarData(entradaSelecionada.data)}
              </Typography>
              
              {/* Resumo visual completo */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>🍽️ Alimentação</Typography>
                    <Typography variant="body2">Café: {entradaSelecionada.alimentacao?.cafeCompleto ? 'Completo' : 'Incompleto'}</Typography>
                    <Typography variant="body2">Almoço: {avaliacoes[entradaSelecionada.alimentacao?.almoco]?.label}</Typography>
                    <Typography variant="body2">Lanche: {avaliacoes[entradaSelecionada.alimentacao?.lanche]?.label}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>😴 Sono</Typography>
                    <Typography variant="body2">Dormiu: {entradaSelecionada.sono?.dormiu ? 'Sim' : 'Não'}</Typography>
                    <Typography variant="body2">Qualidade: {avaliacoes[entradaSelecionada.sono?.qualidade]?.label}</Typography>
                    {entradaSelecionada.sono?.duracao && (
                      <Typography variant="body2">Duração: {entradaSelecionada.sono.duracao}</Typography>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>😊 Humor</Typography>
                    <Typography variant="body2">Chegada: {humorLabels[entradaSelecionada.humor?.chegada]}</Typography>
                    <Typography variant="body2">Saída: {humorLabels[entradaSelecionada.humor?.saida]}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>🎯 Atividades</Typography>
                    <Typography variant="body2">Participação: {avaliacoes[entradaSelecionada.atividades?.participacao]?.label}</Typography>
                    {entradaSelecionada.atividades?.atividade && (
                      <Typography variant="body2">Principal: {entradaSelecionada.atividades.atividade}</Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
              
              {entradaSelecionada.observacoesGerais && (
                <Paper sx={{ p: 2, mt: 2, bgcolor: '#f0f9ff' }}>
                  <Typography variant="subtitle1" gutterBottom>📝 Observações Gerais</Typography>
                  <Typography variant="body2">{entradaSelecionada.observacoesGerais}</Typography>
                </Paper>
              )}
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

export default DiarioSection;