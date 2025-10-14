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
  AttachFile,
  Delete,
  AccessTime,
  Close
} from '@mui/icons-material';
import { storageRef, uploadBytes, getDownloadURL } from '../../../firebase';
import { auditService, LOG_ACTIONS } from '../../../services/auditService';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';

const DiarioSection = ({ userRole, userData }) => {
  // Funções para detectar tipo de turma baseado no turnoId
  const isTurmaIntegral = () => {
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

    if (!novaEntrada.turma || !turmas.length) return false;
    const turma = turmas.find(t => t.id === novaEntrada.turma);
    return turma?.turnoId === 'Integral';
  };

  const isTurmaMeioPeriodo = () => {
    if (!novaEntrada.turma || !turmas.length) return false;
    const turma = turmas.find(t => t.id === novaEntrada.turma);
    return turma?.turnoId === 'Manhã' || turma?.turnoId === 'Tarde';
  };

  const isEntradaTurmaIntegral = (entrada) => {
    if (!entrada?.turma || !turmas.length) return false;
    const turma = turmas.find(t => t.id === entrada.turma);
    return turma?.turnoId === 'Integral';
  };

  const isEntradaTurmaMeioPeriodo = (entrada) => {
    if (!entrada?.turma || !turmas.length) return false;
    const turma = turmas.find(t => t.id === entrada.turma);
    return turma?.turnoId === 'Manhã' || turma?.turnoId === 'Tarde';
  };

  const [entradas, setEntradas] = useState([]);
  const [dialogNovaEntrada, setDialogNovaEntrada] = useState(false);
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [entradaSelecionada, setEntradaSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0]);
  const [filtroAluno, setFiltroAluno] = useState('');
  const [estatisticas, setEstatisticas] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [showAllExpanded, setShowAllExpanded] = useState(false);
  const [filePreviewDialog, setFilePreviewDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [novaEntrada, setNovaEntrada] = useState({
    turma: '',
    data: new Date().toISOString().split('T')[0],
    periodo: '',
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
    atividadesDinamicas: [
      { titulo: '', descricao: '' }
    ],
    homework: {
      tem: false,
      descricao: '',
      arquivo: '',
      arquivoUrl: '',
      arquivoOriginal: ''
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
    fetchTurmas();
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
          // Para pais: mostrar entradas das turmas onde seus filhos estão matriculados
          const turmasFilhos = alunos
            .filter(aluno => alunosVinculados.includes(aluno.id))
            .map(aluno => aluno.turmaId);
          
          entradasFiltradas = entradasList.filter(entrada => 
            turmasFilhos.includes(entrada.turmaId)
          );
        } else if (userRole === 'professora') {
          entradasFiltradas = entradasList.filter(entrada => {
            return userData?.turmas?.includes(entrada.turmaId);
          });
        }
        
        // Aplicar filtros
        if (filtroData) {
          entradasFiltradas = entradasFiltradas.filter(entrada => 
            entrada.data === filtroData
          );
        }
        
        if (filtroAluno) {
          // Filtrar entradas da turma onde o aluno está matriculado
          const alunoSelecionado = alunos.find(aluno => aluno.id === filtroAluno);
          if (alunoSelecionado) {
            entradasFiltradas = entradasFiltradas.filter(entrada => 
              entrada.turmaId === alunoSelecionado.turmaId
            );
          }
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
        // Coordenadoras e administradores veem todas as turmas (sem filtro)
        
        setTurmas(turmasFiltradas);
      }
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
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
        turmaId: novaEntrada.turma
      };

      const diarioRef = ref(db, 'diario');
      const entradaRef = await push(diarioRef, entradaData);
      
      // Log da criação da entrada do diário
      await auditService.logAction(
        LOG_ACTIONS.DIARY_ENTRY_CREATED,
        userData?.id,
        {
          entradaId: entradaRef.key,
          turmaId: novaEntrada.turma,
          turma: turmas.find(t => t.id === novaEntrada.turma)?.nome,
          data: novaEntrada.data,
          periodo: novaEntrada.periodo,
          temHomework: novaEntrada.homework?.tem,
          quantidadeAtividades: novaEntrada.atividadesDinamicas?.length || 0,
          temObservacoes: !!novaEntrada.observacoesGerais
        }
      );
      
      setDialogNovaEntrada(false);
      setNovaEntrada({
        turma: '',
        data: new Date().toISOString().split('T')[0],
        periodo: '',
        alimentacao: { cafeCompleto: false, cafeObs: '', almoco: 'bom', almocoObs: '', lanche: 'bom', lancheObs: '' },
        sono: { dormiu: false, qualidade: 'bom', duracao: '', observacoes: '' },
        humor: { chegada: 3, saida: 3, observacoes: '' },
        atividades: { participacao: 'boa', atividade: '', destaque: '', dificuldades: '' },
        comportamento: { geral: 'bom', relacionamento: 'bom', autonomia: 'bom', observacoes: '' },
        higiene: { trocas: 0, observacoes: '' },
        atividadesDinamicas: [{ titulo: '', descricao: '' }],
        homework: { tem: false, descricao: '', arquivo: '', arquivoUrl: '', arquivoOriginal: '' },
        observacoesGerais: '', fotos: []
      });
      
      fetchEntradas();
    } catch (error) {
      console.error('Erro ao salvar entrada do diário:', error);
      
      // Log do erro
      await auditService.logAction(
        LOG_ACTIONS.DIARY_ENTRY_ERROR,
        userData?.id,
        {
          erro: error.message,
          turmaId: novaEntrada.turma,
          data: novaEntrada.data
        }
      );
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

  const toggleCardExpansion = (entradaId) => {
    setExpandedCards(prev => ({
      ...prev,
      [entradaId]: !prev[entradaId]
    }));
  };

  const toggleAllCards = () => {
    const newShowAllExpanded = !showAllExpanded;
    setShowAllExpanded(newShowAllExpanded);
    
    if (newShowAllExpanded) {
      // Expandir todos os cards
      const allExpanded = {};
      entradas.forEach(entrada => {
        allExpanded[entrada.id] = true;
      });
      setExpandedCards(allExpanded);
    } else {
      // Colapsar todos os cards
      setExpandedCards({});
    }
  };

  const uploadFile = async (file) => {
    try {
      setUploadingFile(true);
      
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileName = `homework_${timestamp}_${file.name}`;
      
      // Criar referência do arquivo no schoolStorage
      const fileRef = storageRef(schoolStorage, `homework/${fileName}`);
      
      // Fazer upload do arquivo
      const uploadResult = await uploadBytes(fileRef, file);
      
      // Obter URL de download
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      // Log do upload do arquivo
      await auditService.logAction(
        LOG_ACTIONS.ATTACHMENT_UPLOADED,
        userData?.id,
        {
          context: 'diario_homework',
          arquivo: {
            nome: file.name,
            tipo: file.type,
            tamanho: file.size,
            nomeStorage: fileName
          }
        }
      );
      
      return {
        name: fileName,
        originalName: file.name,
        url: downloadURL,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      
      // Log do erro no upload
      await auditService.logAction(
        LOG_ACTIONS.ATTACHMENT_UPLOAD_ERROR,
        userData?.id,
        {
          context: 'diario_homework',
          erro: error.message,
          arquivo: {
            nome: file.name,
            tipo: file.type,
            tamanho: file.size
          }
        }
      );
      
      throw error;
    } finally {
      setUploadingFile(false);
    }
  };

  const openFilePreview = (fileName) => {
    setSelectedFile(fileName);
    setFilePreviewDialog(true);
    
    // Log da visualização do arquivo
    auditService.logAction(
      LOG_ACTIONS.ATTACHMENT_VIEWED,
      userData?.id,
      {
        context: 'diario_homework',
        arquivo: {
          nome: fileName.originalName || fileName.name || fileName,
          tipo: fileName.type || getFileType(fileName.originalName || fileName.name || fileName)
        }
      }
    );
  };

  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    return extension;
  };

  const renderFilePreview = () => {
    if (!selectedFile) return null;
    
    const fileType = getFileType(selectedFile.originalName || selectedFile);
    const fileUrl = selectedFile.url || selectedFile; // Usar URL do Firebase ou fallback
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return (
        <Box sx={{ textAlign: 'center', p: 2 }}>
          <img 
            src={fileUrl} 
            alt={selectedFile.originalName || selectedFile}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '400px', 
              objectFit: 'contain'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <Typography 
            variant="body2" 
            color="error" 
            sx={{ display: 'none', mt: 2 }}
          >
            Não foi possível carregar a imagem
          </Typography>
        </Box>
      );
    } else if (['pdf'].includes(fileType)) {
      return (
        <Box sx={{ height: '400px', p: 1 }}>
          <iframe
            src={fileUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title={selectedFile.originalName || selectedFile}
          />
        </Box>
      );
    } else {
      return (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <AttachFile sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {selectedFile.originalName || selectedFile}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Tipo de arquivo: {fileType.toUpperCase()}
            {selectedFile.size && (
              <Typography variant="caption" display="block">
                Tamanho: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            )}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AttachFile />}
            onClick={() => {
              const link = document.createElement('a');
              link.href = fileUrl;
              link.download = selectedFile.originalName || selectedFile;
              link.click();
            }}
          >
            Baixar Arquivo
          </Button>
        </Box>
      );
    }
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
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={toggleAllCards}
            sx={{ 
              textTransform: 'none',
              borderColor: '#e2e8f0',
              color: '#64748b',
              '&:hover': {
                borderColor: '#cbd5e1',
                bgcolor: '#f8fafc'
              }
            }}
          >
            {showAllExpanded ? 'Colapsar Todos' : 'Expandir Todos'}
          </Button>
          {(userRole === 'professora' || userRole === 'coordenadora') && (
            <Fab 
              size="medium"
              color="primary"
              onClick={() => {
                setDialogNovaEntrada(true);
                // Log da abertura do dialog de nova entrada
                auditService.logAction(
                  LOG_ACTIONS.DIARY_COMPOSE_STARTED,
                  userData?.id,
                  {}
                );
              }}
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
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>🔍 Filtros</Typography>
          <Grid container spacing={3} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6} sx={{ minWidth: '300px' }}>
              <TextField
                fullWidth
                type="date"
                label="Data"
                value={filtroData}
                onChange={(e) => {
                  const novaData = e.target.value;
                  const dataAnterior = filtroData;
                  setFiltroData(novaData);
                  
                  // Log da mudança de filtro de data
                  if (dataAnterior !== novaData) {
                    auditService.logAction(
                      LOG_ACTIONS.DIARY_FILTER_CHANGED,
                      userData?.id,
                      {
                        filtro: 'data',
                        valorAnterior: dataAnterior,
                        novoValor: novaData
                      }
                    );
                  }
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: '250px' }}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ minWidth: '300px' }}>
              <FormControl fullWidth sx={{ minWidth: '250px' }}>
                <InputLabel>Aluno</InputLabel>
                <Select
                  value={filtroAluno}
                  onChange={(e) => {
                    const novoAluno = e.target.value;
                    const alunoAnterior = filtroAluno;
                    setFiltroAluno(novoAluno);
                    
                    // Log da mudança de filtro de aluno
                    if (alunoAnterior !== novoAluno) {
                      const alunoNome = novoAluno ? alunos.find(a => a.id === novoAluno)?.nome : 'Todos os alunos';
                      const alunoAnteriorNome = alunoAnterior ? alunos.find(a => a.id === alunoAnterior)?.nome : 'Todos os alunos';
                      
                      auditService.logAction(
                        LOG_ACTIONS.DIARY_FILTER_CHANGED,
                        userData?.id,
                        {
                          filtro: 'aluno',
                          valorAnterior: alunoAnteriorNome,
                          novoValor: alunoNome
                        }
                      );
                    }
                  }}
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
              const turma = turmas.find(t => t.id === entrada.turmaId);
              const isExpanded = expandedCards[entrada.id] || showAllExpanded;
              
              return (
                <Card key={entrada.id} sx={{ mb: 2 }}>
                  <CardContent>
                    {/* Cabeçalho sempre visível */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1, cursor: 'pointer' }} onClick={() => toggleCardExpansion(entrada.id)}>
                        <Typography variant="h6" fontWeight={600}>
                          📖 {turma?.nome || 'Turma não encontrada'} {entrada.periodo && `- ${entrada.periodo}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatarData(entrada.data)} • Registrado em {new Date(entrada.dataRegistro).toLocaleString('pt-BR')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip 
                          label={`Humor: ${humorLabels[entrada.humor?.chegada] || 'Normal'} → ${humorLabels[entrada.humor?.saida] || 'Normal'}`}
                          icon={getHumorIcon(entrada.humor?.saida)}
                          size="small"
                        />
                        <IconButton
                          size="small"
                          onClick={() => toggleCardExpansion(entrada.id)}
                          sx={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}
                        >
                          <ExpandMore />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEntradaSelecionada(entrada);
                            setDialogDetalhes(true);
                            
                            // Log da visualização dos detalhes
                            auditService.logAction(
                              LOG_ACTIONS.DIARY_ENTRY_VIEWED,
                              userData?.id,
                              {
                                entradaId: entrada.id,
                                turma: turma?.nome,
                                data: entrada.data,
                                periodo: entrada.periodo
                              }
                            );
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {/* Resumo básico sempre visível */}
                    {(() => {
                      const turmaEntrada = turmas.find(t => t.id === entrada.turmaId);
                      const isIntegral = turmaEntrada?.turnoId === 'Integral';
                      
                      return (
                        <Grid container spacing={2}>
                          {/* Informações básicas para todas as turmas */}
                          <Grid item xs={6} sm={isIntegral ? 3 : 6}>
                            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f0f9ff', borderRadius: 1.5, border: '1px solid #e0f2fe' }}>
                              <School sx={{ color: getAvaliacaoColor(entrada.atividades?.participacao), fontSize: 20 }} />
                              <Typography variant="caption" display="block" fontWeight={600}>
                                Participação
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {avaliacoes[entrada.atividades?.participacao]?.label || 'N/A'}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={6} sm={isIntegral ? 3 : 6}>
                            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f0f9ff', borderRadius: 1.5, border: '1px solid #e0f2fe' }}>
                              <Psychology sx={{ color: getAvaliacaoColor(entrada.comportamento?.geral), fontSize: 20 }} />
                              <Typography variant="caption" display="block" fontWeight={600}>
                                Comportamento
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {avaliacoes[entrada.comportamento?.geral]?.label || 'N/A'}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {/* Resumo para turmas integrais */}
                          {isIntegral && (
                            <>
                              <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1.5, border: '1px solid #dcfce7' }}>
                                  <Restaurant sx={{ color: getAvaliacaoColor(entrada.alimentacao?.almoco), fontSize: 20 }} />
                                  <Typography variant="caption" display="block" fontWeight={600}>
                                    Almoço
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {avaliacoes[entrada.alimentacao?.almoco]?.label || 'N/A'}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6} sm={3}>
                                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#fefce8', borderRadius: 1.5, border: '1px solid #fef3c7' }}>
                                  <Bed sx={{ color: getAvaliacaoColor(entrada.sono?.qualidade), fontSize: 20 }} />
                                  <Typography variant="caption" display="block" fontWeight={600}>
                                    Sono
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {avaliacoes[entrada.sono?.qualidade]?.label || 'N/A'}
                                  </Typography>
                                </Box>
                              </Grid>
                            </>
                          )}
                        </Grid>
                      );
                    })()}
                    
                    {/* Seção detalhada - expansível */}
                    {isExpanded && (() => {
                      const turmaEntrada = turmas.find(t => t.id === entrada.turmaId);
                      const isIntegral = turmaEntrada?.turnoId === 'Integral';
                      
                      return (
                        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                          {/* Atividades específicas */}
                          {entrada.atividades?.atividade && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#1e40af', mb: 1 }}>
                                🎯 Atividade Realizada
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {entrada.atividades.atividade}
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Informações de alimentação detalhadas - apenas turmas integrais */}
                          {isIntegral && (entrada.alimentacao?.cafeCompleto || entrada.alimentacao?.cafeObs || entrada.alimentacao?.lanche !== 'bom' || entrada.alimentacao?.lancheObs) && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #dcfce7' }}>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#15803d', mb: 1 }}>
                                🍽️ Detalhes da Alimentação
                              </Typography>
                              <Grid container spacing={2}>
                                {entrada.alimentacao?.cafeCompleto && (
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">
                                      ☕ Café da manhã: Completo
                                    </Typography>
                                  </Grid>
                                )}
                                {entrada.alimentacao?.lanche && entrada.alimentacao.lanche !== 'bom' && (
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">
                                      🥪 Lanche: {avaliacoes[entrada.alimentacao.lanche]?.label}
                                    </Typography>
                                  </Grid>
                                )}
                                {entrada.alimentacao?.cafeObs && (
                                  <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">
                                      Obs. Café: {entrada.alimentacao.cafeObs}
                                    </Typography>
                                  </Grid>
                                )}
                                {entrada.alimentacao?.lancheObs && (
                                  <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">
                                      Obs. Lanche: {entrada.alimentacao.lancheObs}
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          )}
                          
                          {/* Destaques - apenas turmas integrais */}
                          {isIntegral && entrada.atividades?.destaque && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #dcfce7' }}>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#15803d', mb: 1 }}>
                                ⭐ Destaque do Dia
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {entrada.atividades.destaque}
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Informações detalhadas do sono - apenas turmas integrais */}
                          {isIntegral && (entrada.sono?.dormiu || entrada.sono?.duracao || entrada.sono?.observacoes) && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#fefce8', borderRadius: 2, border: '1px solid #fef3c7' }}>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#d97706', mb: 1 }}>
                                😴 Detalhes do Sono
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Dormiu: {entrada.sono?.dormiu ? 'Sim' : 'Não'}
                                  </Typography>
                                </Grid>
                                {entrada.sono?.duracao && (
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">
                                      Duração: {entrada.sono.duracao}
                                    </Typography>
                                  </Grid>
                                )}
                                {entrada.sono?.observacoes && (
                                  <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">
                                      Observações: {entrada.sono.observacoes}
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          )}
                          
                          {/* Homework - apenas turmas integrais */}
                          {isIntegral && entrada.homework?.tem && entrada.homework?.descricao && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: '#fefce8', borderRadius: 2, border: '1px solid #fef3c7' }}>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#d97706', mb: 1 }}>
                                📚 Tarefa de Casa
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {entrada.homework.descricao}
                              </Typography>
                              {entrada.homework?.arquivo && (
                                <Box sx={{ mt: 1, p: 1, bgcolor: '#fff7ed', borderRadius: 1, border: '1px solid #fed7aa' }}>
                                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#9a3412' }}>
                                    <AttachFile sx={{ fontSize: 16 }} />
                                    Anexo: {entrada.homework.arquivoOriginal || entrada.homework.arquivo}
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      sx={{ ml: 'auto', minWidth: 'auto', px: 1 }}
                                      onClick={() => openFilePreview({
                                        name: entrada.homework.arquivo,
                                        originalName: entrada.homework.arquivoOriginal || entrada.homework.arquivo,
                                        url: entrada.homework.arquivoUrl
                                      })}
                                    >
                                      Ver
                                    </Button>
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          )}
                          
                          {/* Observações gerais */}
                          {entrada.observacoesGerais && (
                            <Box sx={{ p: 3, bgcolor: '#f0f9ff', borderRadius: 2, borderLeft: '4px solid #3B82F6' }}>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#1e40af', mb: 1 }}>
                                💭 Observações Gerais
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                {entrada.observacoesGerais}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    })()}
                    
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
        onClose={() => {
          // Log do cancelamento se havia dados preenchidos
          const temDados = novaEntrada.turma || 
                          novaEntrada.data !== new Date().toISOString().split('T')[0] ||
                          novaEntrada.periodo ||
                          novaEntrada.observacoesGerais ||
                          novaEntrada.homework?.tem ||
                          novaEntrada.atividadesDinamicas?.some(ativ => ativ.titulo || ativ.descricao);
          
          if (temDados) {
            auditService.logAction(
              LOG_ACTIONS.DIARY_COMPOSE_CANCELLED,
              userData?.id,
              {
                temTurma: !!novaEntrada.turma,
                temPeriodo: !!novaEntrada.periodo,
                temObservacoes: !!novaEntrada.observacoesGerais,
                temHomework: !!novaEntrada.homework?.tem,
                temAtividades: !!(novaEntrada.atividadesDinamicas?.some(ativ => ativ.titulo || ativ.descricao))
              }
            );
          }
          
          setDialogNovaEntrada(false);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>📖 Nova Entrada do Diário</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={3} sx={{ mb: 3, width: '100%' }}>
              <Grid item xs={12} sm={6} sx={{ minWidth: '300px' }}>
                <FormControl fullWidth sx={{ minWidth: '250px' }}>
                  <InputLabel>Turma</InputLabel>
                  <Select
                    value={novaEntrada.turma}
                    onChange={(e) => setNovaEntrada({ ...novaEntrada, turma: e.target.value })}
                  >
                    {turmas.map((turma) => (
                      <MenuItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} sx={{ minWidth: '300px' }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data"
                  value={novaEntrada.data}
                  onChange={(e) => setNovaEntrada({ ...novaEntrada, data: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: '250px' }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} sx={{ minWidth: '300px' }}>
                <FormControl fullWidth sx={{ minWidth: '250px' }}>
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={novaEntrada.periodo}
                    onChange={(e) => setNovaEntrada({ ...novaEntrada, periodo: e.target.value })}
                  >
                    <MenuItem value="manhã">Manhã</MenuItem>
                    <MenuItem value="tarde">Tarde</MenuItem>
                    <MenuItem value="integral">Integral</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Seções específicas para turmas integrais */}
            {isTurmaIntegral() && (
              <Box>
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
                    <FormControl fullWidth sx={{ minWidth: '250px' }}>
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
                    <FormControl fullWidth sx={{ minWidth: '250px' }}>
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
                    <FormControl fullWidth sx={{ minWidth: '250px' }}>
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
                    <FormControl fullWidth sx={{ minWidth: '250px' }}>
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
                    <FormControl fullWidth sx={{ minWidth: '250px' }}>
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
                    <FormControl fullWidth sx={{ minWidth: '250px' }}>
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
                    <FormControl fullWidth sx={{ minWidth: '250px' }}>
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
              </Box>
            )}

            {/* Seção de atividades dinâmicas - comum para turmas integrais e meio período */}
            {(isTurmaIntegral() || isTurmaMeioPeriodo()) && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">🎯 Hoje nós realizamos em sala:</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {novaEntrada.atividadesDinamicas.map((atividade, index) => (
                      <Grid item xs={12} key={index}>
                        <Box sx={{ border: 1, borderColor: 'grey.300', borderRadius: 1, p: 2, mb: 1 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={5}>
                              <TextField
                                fullWidth
                                label={`Título da atividade ${index + 1}`}
                                value={atividade.titulo}
                                onChange={(e) => {
                                  const novasAtividades = [...novaEntrada.atividadesDinamicas];
                                  novasAtividades[index] = { ...novasAtividades[index], titulo: e.target.value };
                                  setNovaEntrada({ ...novaEntrada, atividadesDinamicas: novasAtividades });
                                }}
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label={`Descrição da atividade ${index + 1}`}
                                value={atividade.descricao}
                                onChange={(e) => {
                                  const novasAtividades = [...novaEntrada.atividadesDinamicas];
                                  novasAtividades[index] = { ...novasAtividades[index], descricao: e.target.value };
                                  setNovaEntrada({ ...novaEntrada, atividadesDinamicas: novasAtividades });
                                }}
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={12} sm={1}>
                              <IconButton
                                color="error"
                                onClick={() => {
                                  const novasAtividades = novaEntrada.atividadesDinamicas.filter((_, i) => i !== index);
                                  setNovaEntrada({ ...novaEntrada, atividadesDinamicas: novasAtividades });
                                }}
                                disabled={novaEntrada.atividadesDinamicas.length === 1}
                              >
                                <Delete />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                    ))}
                    <Grid item xs={12}>
                      <Button
                        startIcon={<Add />}
                        onClick={() => {
                          setNovaEntrada({
                            ...novaEntrada,
                            atividadesDinamicas: [...novaEntrada.atividadesDinamicas, { titulo: '', descricao: '' }]
                          });
                        }}
                        variant="outlined"
                        size="small"
                      >
                        Adicionar Atividade
                      </Button>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Seção de atividades de casa - comum para todos os tipos de turma */}
            {(isTurmaIntegral() || isTurmaMeioPeriodo()) && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">📚 Atividades de Casa</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl component="fieldset">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <label>
                            <input
                              type="checkbox"
                              checked={novaEntrada.homework.tem}
                              onChange={(e) => setNovaEntrada({
                                ...novaEntrada,
                                homework: { ...novaEntrada.homework, tem: e.target.checked }
                              })}
                            />
                            Tem atividade de casa hoje
                          </label>
                        </Box>
                      </FormControl>
                    </Grid>
                    {novaEntrada.homework.tem && (
                      <>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Descrição da atividade de casa"
                            multiline
                            rows={2}
                            value={novaEntrada.homework.descricao}
                            onChange={(e) => setNovaEntrada({
                              ...novaEntrada,
                              homework: { ...novaEntrada.homework, descricao: e.target.value }
                            })}
                            placeholder="Descreva a atividade de casa que foi enviada..."
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                try {
                                  const uploadedFile = await uploadFile(file);
                                  setNovaEntrada({
                                    ...novaEntrada,
                                    homework: { 
                                      ...novaEntrada.homework, 
                                      arquivo: uploadedFile.name,
                                      arquivoUrl: uploadedFile.url,
                                      arquivoOriginal: uploadedFile.originalName
                                    }
                                  });
                                } catch (error) {
                                  alert('Erro ao fazer upload do arquivo. Tente novamente.');
                                }
                              }
                            }}
                            style={{ display: 'none' }}
                            id="homework-file-input"
                          />
                          <label htmlFor="homework-file-input">
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<AttachFile />}
                              size="small"
                              disabled={uploadingFile}
                            >
                              {uploadingFile ? 'Enviando...' : 'Anexar Arquivo'}
                            </Button>
                          </label>
                          {novaEntrada.homework.arquivo && (
                            <Typography variant="caption" sx={{ ml: 2 }}>
                              Arquivo: {novaEntrada.homework.arquivo}
                            </Typography>
                          )}
                        </Grid>
                      </>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}

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
            disabled={!novaEntrada.turma || !novaEntrada.data}
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
                {/* Seções específicas para turmas integrais */}
                {isEntradaTurmaIntegral(entradaSelecionada) && (
                  <>
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
                  </>
                )}

                {/* Seções para turmas integrais e meio período */}
                {(isEntradaTurmaIntegral(entradaSelecionada) || isEntradaTurmaMeioPeriodo(entradaSelecionada)) && entradaSelecionada.atividadesDinamicas && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>🎯 Hoje nós realizamos em sala:</Typography>
                      {entradaSelecionada.atividadesDinamicas.map((atividade, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Typography variant="body2"><strong>{atividade.titulo}:</strong> {atividade.descricao}</Typography>
                        </Box>
                      ))}
                    </Paper>
                  </Grid>
                )}

                {(isEntradaTurmaIntegral(entradaSelecionada) || isEntradaTurmaMeioPeriodo(entradaSelecionada)) && entradaSelecionada.homework?.tem && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>📚 Atividades de Casa</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>{entradaSelecionada.homework.descricao}</Typography>
                      {entradaSelecionada.homework.arquivo && (
                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AttachFile sx={{ fontSize: 18, color: '#6b7280' }} />
                              <Typography variant="body2" fontWeight={500}>
                                {entradaSelecionada.homework.arquivoOriginal || entradaSelecionada.homework.arquivo}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => openFilePreview({
                                name: entradaSelecionada.homework.arquivo,
                                originalName: entradaSelecionada.homework.arquivoOriginal || entradaSelecionada.homework.arquivo,
                                url: entradaSelecionada.homework.arquivoUrl
                              })}
                            >
                              Visualizar
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                )}
                
                {/* Seções específicas para turmas integrais */}
                {isEntradaTurmaIntegral(entradaSelecionada) && (
                  <>
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
                  </>
                )}
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

      {/* Dialog Preview de Arquivo */}
      <Dialog
        open={filePreviewDialog}
        onClose={() => setFilePreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">📎 Visualizar Anexo</Typography>
          <IconButton onClick={() => setFilePreviewDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {renderFilePreview()}
        </DialogContent>
        <DialogActions>
          <Button 
            startIcon={<AttachFile />}
            onClick={() => {
              if (selectedFile) {
                // Log do download do arquivo
                auditService.logAction(
                  LOG_ACTIONS.ATTACHMENT_DOWNLOADED,
                  userData?.id,
                  {
                    context: 'diario_homework',
                    arquivo: {
                      nome: selectedFile.originalName || selectedFile.name || selectedFile,
                      tipo: selectedFile.type || getFileType(selectedFile.originalName || selectedFile.name || selectedFile)
                    }
                  }
                );
                
                const link = document.createElement('a');
                link.href = selectedFile.url || selectedFile;
                link.download = selectedFile.originalName || selectedFile;
                link.click();
              }
            }}
          >
            Baixar
          </Button>
          <Button onClick={() => setFilePreviewDialog(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DiarioSection;