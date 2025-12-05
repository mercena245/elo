'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Box, 
  Chip,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Checkbox,
  FormGroup
} from '@mui/material';
import { 
  Description as HistoricoIcon,
  WorkspacePremium as CertificadoIcon,
  Article as DeclaracaoIcon,
  SwapHoriz as TransferenciaIcon,
  Verified as ValidacaoIcon,
  Settings as ConfigIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Assessment as StatsIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Security as SecurityIcon,
  QrCode as QrCodeIcon,
  SupervisorAccount as SupervisorIcon,
  FamilyRestroom as FamilyIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarMenu from '../../components/SidebarMenu';
import secretariaDigitalService from '../../services/secretariaDigitalService';
import '../../styles/Dashboard.css';

import { useSecretariaAccess } from '../../hooks/useSecretariaAccess';
import { useSchoolServices } from '../../hooks/useSchoolServices';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';

const SecretariaDigital = () => {
  // Hooks multi-tenant
  const { auditService, financeiroService, LOG_ACTIONS, isReady: servicesReady } = useSchoolServices();
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage, db: schoolDb } = useSchoolDatabase();

  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedAluno, setSelectedAluno] = useState('');
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear().toString());
  const [finalidade, setFinalidade] = useState('Para fins diversos');
  const [observacoes, setObservacoes] = useState('');
  const [alunos, setAlunos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [tabValue, setTabValue] = useState(0);
  
  // Estados para seleção de períodos no histórico
  const [anosDisponiveis, setAnosDisponiveis] = useState([]);
  const [periodosSelecionados, setPeriodosSelecionados] = useState([]);
  const [selecaoTipo, setSelecaoTipo] = useState('todos'); // 'todos', 'personalizado', 'faixa'
  const [anoInicio, setAnoInicio] = useState('');
  const [anoFim, setAnoFim] = useState('');

  const { 
    userRole, 
    alunosVinculados, 
    loading: accessLoading,
    podeAcessarSecretaria,
    filtrarDocumentosPermitidos,
    filtrarAlunosPermitidos
  } = useSecretariaAccess();

  // Helper para obter nome do aluno de forma segura (compatibilidade v2.0 e v3.0)
  const getNomeAluno = (doc) => {
    return doc?.aluno?.nome || doc?.dadosAluno?.nome || 'Nome não disponível';
  };

  const getCpfAluno = (doc) => {
    return doc?.aluno?.cpf || doc?.dadosAluno?.cpf || 'CPF não disponível';
  };

  const getRgAluno = (doc) => {
    return doc?.aluno?.rg || doc?.dadosAluno?.rg || 'RG não disponível';
  };

  const getDataNascimentoAluno = (doc) => {
    return doc?.aluno?.dataNascimento || doc?.dadosAluno?.dataNascimento || 'Data não disponível';
  };

  // Carregar anos disponíveis para um aluno
  const carregarAnosDisponiveis = async (alunoId) => {
    if (!isReady || !alunoId) return;
    
    try {
      // Buscar dados do aluno
      const alunoData = await getData(`alunos/${alunoId}`);
      
      if (!alunoData) {
        console.warn('Aluno não encontrado:', alunoId);
        setAnosDisponiveis([]);
        return;
      }

      // 1. Buscar anos do histórico acadêmico estruturado
      const historicoAcademico = alunoData.historicoAcademico || {};
      const anosHistorico = Object.keys(historicoAcademico);
      
      // 2. Buscar anos das notas e frequência (fallback/complemento)
      const notasData = await getData(`notas/${alunoId}`);
      const frequenciaData = await getData(`frequencia/${alunoId}`);
      
      const anosNotas = notasData ? Object.keys(notasData) : [];
      const anosFrequencia = frequenciaData ? Object.keys(frequenciaData) : [];
      
      // Combinar todas as fontes e remover duplicatas
      const todosAnos = [...new Set([...anosHistorico, ...anosNotas, ...anosFrequencia])].sort();
      
      console.log('📅 Anos disponíveis encontrados:', todosAnos);
      
      setAnosDisponiveis(todosAnos);
      
      // Selecionar todos por padrão
      setPeriodosSelecionados(todosAnos);
      setSelecaoTipo('todos');
      
      // Definir faixa padrão
      if (todosAnos.length > 0) {
        setAnoInicio(todosAnos[0]);
        setAnoFim(todosAnos[todosAnos.length - 1]);
      }
    } catch (error) {
      console.error('Erro ao carregar anos disponíveis:', error);
      setAnosDisponiveis([]);
    }
  };

  // Atualizar períodos selecionados baseado no tipo de seleção
  const handleSelecaoTipoChange = (tipo) => {
    setSelecaoTipo(tipo);
    
    if (tipo === 'todos') {
      setPeriodosSelecionados(anosDisponiveis);
    } else if (tipo === 'faixa' && anoInicio && anoFim) {
      const inicio = parseInt(anoInicio);
      const fim = parseInt(anoFim);
      const anosSelecionados = anosDisponiveis.filter(ano => {
        const anoNum = parseInt(ano);
        return anoNum >= inicio && anoNum <= fim;
      });
      setPeriodosSelecionados(anosSelecionados);
    }
  };

  // Atualizar quando mudar a faixa
  useEffect(() => {
    if (selecaoTipo === 'faixa' && anoInicio && anoFim) {
      const inicio = parseInt(anoInicio);
      const fim = parseInt(anoFim);
      const anosSelecionados = anosDisponiveis.filter(ano => {
        const anoNum = parseInt(ano);
        return anoNum >= inicio && anoNum <= fim;
      });
      setPeriodosSelecionados(anosSelecionados);
    }
  }, [anoInicio, anoFim, selecaoTipo, anosDisponiveis]);

  // Toggle de seleção individual
  const togglePeriodo = (ano) => {
    setPeriodosSelecionados(prev => 
      prev.includes(ano)
        ? prev.filter(a => a !== ano)
        : [...prev, ano].sort()
    );
  };

  // Configurar banco da escola no service
  useEffect(() => {
    if (schoolDb && isReady) {
      console.log('🏫 Configurando Secretaria Digital para escola:', currentSchool);
      secretariaDigitalService.setSchoolDatabase(schoolDb);
    }
  }, [schoolDb, isReady, currentSchool]);

  useEffect(() => {
    if (!accessLoading && userRole) {
      carregarDados();
    }
  }, [accessLoading, userRole]);

  const carregarDados = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }

    setLoading(true);
    try {
      // Carregar alunos
      let todosAlunos = [];
      const alunosResponse = await fetch('/api/alunos');
      if (alunosResponse.ok) {
        const alunosData = await alunosResponse.json();
        todosAlunos = alunosData;
      } else {
        // Fallback para buscar usando useSchoolDatabase
        const alunosData = await getData('alunos');
        if (alunosData) {
          todosAlunos = Object.entries(alunosData)
            .map(([id, aluno]) => ({ id, ...aluno }));
        }
      }

      // Filtrar alunos baseado nas permissões
      const alunosPermitidos = filtrarAlunosPermitidos(todosAlunos);
      setAlunos(alunosPermitidos);

      // Carregar documentos recentes
      const docs = await secretariaDigitalService.listarDocumentos(null, 50);
      const docsPermitidos = filtrarDocumentosPermitidos(docs);
      setDocumentos(docsPermitidos);

      // Carregar estatísticas
      const stats = await secretariaDigitalService.obterEstatisticas();
      setEstatisticas(stats);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erro ao carregar dados da secretaria digital', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialog = (tipo) => {
    setDialogType(tipo);
    setDialogOpen(true);
    setSelectedAluno('');
    setObservacoes('');
    setFinalidade('Para fins diversos');
  };

  const fecharDialog = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedAluno('');
    setObservacoes('');
    setFinalidade('Para fins diversos');
  };

  const gerarDocumento = async () => {
    if (!selectedAluno) {
      setSnackbar({ open: true, message: 'Selecione um aluno', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      let documento;
      
      switch (dialogType) {
        case 'historico':
          // Passar anos letivos selecionados ao invés de um único ano
          documento = await secretariaDigitalService.gerarHistoricoEscolar(
            selectedAluno, 
            periodosSelecionados.length > 0 ? periodosSelecionados : [anoLetivo], 
            observacoes
          );
          break;
        
        case 'declaracao':
          documento = await secretariaDigitalService.gerarDeclaracaoMatricula(
            selectedAluno, 
            finalidade
          );
          break;
        
        case 'certificado':
          documento = await secretariaDigitalService.gerarCertificado(
            selectedAluno,
            'Ensino Fundamental', // TODO: permitir seleção
            observacoes
          );
          break;
        
        case 'transferencia':
          documento = await secretariaDigitalService.gerarTransferencia(
            selectedAluno,
            finalidade, // escola destino
            observacoes, // motivo
            '' // observações adicionais
          );
          break;
        
        case 'declaracao_conclusao':
          documento = await secretariaDigitalService.gerarDeclaracaoConclusao(
            selectedAluno,
            'Ensino Fundamental',
            finalidade
          );
          break;
        
        case 'declaracao_frequencia':
          documento = await secretariaDigitalService.gerarDeclaracaoFrequencia(
            selectedAluno,
            '01/01/2024', // TODO: permitir seleção
            '31/12/2024',
            finalidade
          );
          break;
        
        default:
          throw new Error('Tipo de documento não suportado');
      }

      setSnackbar({ 
        open: true, 
        message: `Documento gerado com sucesso! Código: ${documento.codigoVerificacao}`, 
        severity: 'success' 
      });
      
      fecharDialog();
      carregarDados(); // Recarregar lista de documentos
      
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      setSnackbar({ 
        open: true, 
        message: `Erro ao gerar documento: ${error.message}`, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const baixarDocumento = async (documento) => {
    try {
      const nomeAluno = getNomeAluno(documento);
      const pdf = await secretariaDigitalService.gerarPDF(documento);
      pdf.save(`${documento.tipo}_${nomeAluno}_${documento.codigoVerificacao}.pdf`);
      
      await auditService?.logAction({
        action: 'DIGITAL_SECRETARY_DOCUMENT_DOWNLOADED',
        entityId: documento.id,
        details: `Download do documento ${documento.tipo} do aluno ${nomeAluno}`,
        changes: {
          documentoId: documento.id,
          tipoDocumento: documento.tipo,
          alunoNome: nomeAluno
        }
      });
      
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erro ao baixar documento', 
        severity: 'error' 
      });
    }
  };

  // 🆕 Estado para modal de visualização
  const [documentoVisualizado, setDocumentoVisualizado] = useState(null);
  const [modalVisualizacao, setModalVisualizacao] = useState(false);

  // 🆕 Função para visualizar documento
  const visualizarDocumento = (documento) => {
    setDocumentoVisualizado(documento);
    setModalVisualizacao(true);
  };

  const fecharVisualizacao = () => {
    setModalVisualizacao(false);
    setDocumentoVisualizado(null);
  };

  const menuCardsCoord = [
    {
      title: 'Históricos Escolares',
      description: 'Gerar históricos escolares digitais com assinatura eletrônica',
      icon: <HistoricoIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      action: () => abrirDialog('historico'),
      count: estatisticas?.porTipo?.historicos || 0
    },
    {
      title: 'Declarações',
      description: 'Emitir declarações de matrícula, frequência e conclusão',
      icon: <DeclaracaoIcon sx={{ fontSize: 40 }} />,
      color: '#388e3c',
      action: () => abrirDialog('declaracao'),
      count: estatisticas?.porTipo?.declaracoes || 0
    },
    {
      title: 'Certificados',
      description: 'Gerar certificados de conclusão com assinatura digital',
      icon: <CertificadoIcon sx={{ fontSize: 40 }} />,
      color: '#f57c00',
      action: () => abrirDialog('certificado'),
      count: estatisticas?.porTipo?.certificados || 0
    },
    {
      title: 'Transferências',
      description: 'Documentação digital para transferências escolares',
      icon: <TransferenciaIcon sx={{ fontSize: 40 }} />,
      color: '#7b1fa2',
      action: () => abrirDialog('transferencia'),
      count: estatisticas?.porTipo?.transferencias || 0
    },
    {
      title: 'Validação Online',
      description: 'Portal público para validar autenticidade de documentos',
      icon: <ValidacaoIcon sx={{ fontSize: 40 }} />,
      color: '#00796b',
      action: () => window.open('/validacao', '_blank'),
      count: null
    },
    {
      title: 'Configurações',
      description: 'Configurar dados da instituição e certificado digital',
      icon: <ConfigIcon sx={{ fontSize: 40 }} />,
      color: '#455a64',
      action: () => abrirDialog('configuracoes'),
      count: null
    }
  ];

  const menuCardsPai = [
    {
      title: 'Documentos dos Filhos',
      description: 'Visualizar e baixar documentos digitais dos seus filhos',
      icon: <FamilyIcon sx={{ fontSize: 40 }} />,
      color: '#7b1fa2',
      action: () => setTabValue(1),
      count: documentos.length
    },
    {
      title: 'Validação Online',
      description: 'Portal público para validar autenticidade de documentos',
      icon: <ValidacaoIcon sx={{ fontSize: 40 }} />,
      color: '#00796b',
      action: () => window.open('/validacao', '_blank'),
      count: null
    }
  ];

  const getDocumentTypeLabel = (tipo) => {
    const labels = {
      historico_escolar: 'Histórico Escolar',
      declaracao_matricula: 'Declaração de Matrícula',
      certificado: 'Certificado',
      diploma: 'Diploma',
      transferencia: 'Transferência'
    };
    return labels[tipo] || tipo;
  };

  const getStatusColor = (status) => {
    const colors = {
      assinado: 'success',
      pendente_assinatura: 'warning',
      rascunho: 'default',
      cancelado: 'error'
    };
    return colors[status] || 'default';
  };

  if (accessLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Carregando...
        </Typography>
      </Container>
    );
  }

  return (
    <ProtectedRoute requiredRole={['coordenadora', 'pai']}>
      <div className="dashboard-container">
        <SidebarMenu />
        <main className="dashboard-main">
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {/* Cabeçalho */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <SecurityIcon sx={{ fontSize: 60, color: '#7C3AED', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom>
            Secretaria Digital
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {userRole === 'coordenadora' 
              ? 'Documentos escolares digitais conforme normas do MEC'
              : 'Documentos digitais dos seus filhos'
            }
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userRole === 'coordenadora' && (
              <>
                <SupervisorIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                Modo Coordenadora • 
              </>
            )}
            {userRole === 'pai' && (
              <>
                <FamilyIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                Modo Responsável • 
              </>
            )}
            Portaria 1.570/2017 • Lei 14.533/2023 • Assinatura Digital ICP-Brasil
          </Typography>
        </Box>

        {/* Tabs para diferentes visões */}
        <Paper sx={{ mb: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="fullWidth"
          >
            <Tab 
              label={userRole === 'coordenadora' ? 'Geração de Documentos' : 'Visão Geral'} 
              icon={userRole === 'coordenadora' ? <SupervisorIcon /> : <FamilyIcon />}
            />
            <Tab 
              label="Documentos Emitidos" 
              icon={<StatsIcon />}
            />
          </Tabs>
        </Paper>

        {/* Tab 0: Geração de Documentos (Coordenadora) ou Visão Geral (Pai) */}
        {tabValue === 0 && (
          <>
            {/* Estatísticas Rápidas */}
            {estatisticas && (
              <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                      <Typography variant="h4" fontWeight="bold">
                        {userRole === 'coordenadora' ? estatisticas.totalDocumentos : documentos.length}
                      </Typography>
                      <Typography variant="body2">
                        Documentos {userRole === 'coordenadora' ? 'Emitidos' : 'dos Filhos'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                      <Typography variant="h4" fontWeight="bold">
                        {userRole === 'coordenadora' ? (estatisticas.porTipo.historicos || 0) : 
                         documentos.filter(d => d.tipo === 'historico_escolar').length}
                      </Typography>
                      <Typography variant="body2">
                        Históricos Escolares
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                      <Typography variant="h4" fontWeight="bold">
                        {userRole === 'coordenadora' ? (estatisticas.porTipo.declaracoes || 0) :
                         documentos.filter(d => d.tipo === 'declaracao_matricula').length}
                      </Typography>
                      <Typography variant="body2">
                        Declarações
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                      <Typography variant="h4" fontWeight="bold">
                        {alunosVinculados.length || alunos.length}
                      </Typography>
                      <Typography variant="body2">
                        {userRole === 'coordenadora' ? 'Alunos Cadastrados' : 'Filhos Vinculados'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Cards de Funcionalidades */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {(userRole === 'coordenadora' ? menuCardsCoord : menuCardsPai).map((card, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                    onClick={card.action}
                  >
                    <CardContent sx={{ textAlign: 'center', pt: 3 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: card.color, 
                          width: 80, 
                          height: 80, 
                          mx: 'auto', 
                          mb: 2 
                        }}
                      >
                        {card.icon}
                      </Avatar>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {card.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {card.description}
                      </Typography>
                      {card.count !== null && (
                        <Chip 
                          label={`${card.count} ${userRole === 'coordenadora' ? 'emitidos' : 'documentos'}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Informações específicas para pais */}
            {userRole === 'pai' && alunosVinculados.length > 0 && (
              <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  <FamilyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Seus Filhos Vinculados
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {alunosVinculados.map((aluno, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6">{aluno.nome}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Série: {aluno.serie}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Turma: {aluno.turma}
                          </Typography>
                          <Chip 
                            label={`${documentos.filter(d => getNomeAluno(d) === aluno.nome).length} documentos`}
                            size="small"
                            color="primary"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
          </>
        )}

        {/* Tab 1: Documentos Emitidos */}
        {tabValue === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              <StatsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {userRole === 'coordenadora' ? 'Documentos Recentes' : 'Documentos dos Seus Filhos'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {documentos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {userRole === 'coordenadora' 
                    ? 'Nenhum documento emitido ainda'
                    : 'Nenhum documento encontrado para seus filhos'
                  }
                </Typography>
              </Box>
            ) : (
              <List>
                {documentos.map((doc, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      {doc.tipo === 'historico_escolar' && <HistoricoIcon />}
                      {doc.tipo === 'declaracao_matricula' && <DeclaracaoIcon />}
                      {doc.tipo === 'certificado' && <CertificadoIcon />}
                      {doc.tipo === 'transferencia' && <TransferenciaIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" component="span">
                            {getDocumentTypeLabel(doc.tipo)}
                          </Typography>
                          <Chip 
                            label={doc.status} 
                            size="small" 
                            color={getStatusColor(doc.status)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box component="span">
                          <Typography variant="body2" component="span"
                            sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
                          >
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon sx={{ fontSize: 14, mr: 0.5 }} />
                              {getNomeAluno(doc)}
                            </Box>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                              <QrCodeIcon sx={{ fontSize: 12, mr: 0.5 }} />
                              {doc.codigoVerificacao} • {new Date(doc.dataEmissao).toLocaleDateString()}
                            </Box>
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Visualizar">
                        <IconButton 
                          size="small" 
                          sx={{ mr: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            visualizarDocumento(doc);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Baixar PDF">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            baixarDocumento(doc);
                          }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        )}

        {/* Dialog para Gerar Documentos (apenas coordenadora) */}
        {userRole === 'coordenadora' && (
          <Dialog open={dialogOpen} onClose={fecharDialog} maxWidth="md" fullWidth>
            <DialogTitle sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {dialogType === 'historico' && <><HistoricoIcon /> Gerar Histórico Escolar</>}
                {dialogType === 'declaracao' && <><DeclaracaoIcon /> Gerar Declaração</>}
                {dialogType === 'certificado' && <><CertificadoIcon /> Gerar Certificado</>}
                {dialogType === 'transferencia' && <><TransferenciaIcon /> Gerar Transferência</>}
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Aluno</InputLabel>
                <Select
                  value={selectedAluno}
                  onChange={(e) => {
                    setSelectedAluno(e.target.value);
                    if (dialogType === 'historico') {
                      carregarAnosDisponiveis(e.target.value);
                    }
                  }}
                  label="Aluno"
                >
                  {alunos.map((aluno) => (
                    <MenuItem key={aluno.id} value={aluno.id}>
                      {aluno.nome} - {aluno.serie}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {dialogType === 'historico' && selectedAluno && anosDisponiveis.length > 0 && (
                <Paper elevation={2} sx={{ mt: 3, p: 3, bgcolor: '#f8fafc' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                    📅 Selecionar Períodos do Histórico
                  </Typography>
                  
                  <RadioGroup
                    value={selecaoTipo}
                    onChange={(e) => handleSelecaoTipoChange(e.target.value)}
                  >
                    <FormControlLabel 
                      value="todos" 
                      control={<Radio color="primary" />} 
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={500}>Todos os períodos disponíveis</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Incluir todo o histórico acadêmico do aluno
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 1, p: 1.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                    />
                    <FormControlLabel 
                      value="faixa" 
                      control={<Radio color="primary" />} 
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={500}>Selecionar faixa de anos</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Escolher um período específico (ex: 2020 a 2023)
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 1, p: 1.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                    />
                    <FormControlLabel 
                      value="personalizado" 
                      control={<Radio color="primary" />} 
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={500}>Selecionar anos específicos</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Escolher manualmente quais anos incluir
                          </Typography>
                        </Box>
                      }
                      sx={{ p: 1.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                    />
                  </RadioGroup>

                  {selecaoTipo === 'faixa' && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Selecione o intervalo de anos:
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Ano Início</InputLabel>
                            <Select
                              value={anoInicio}
                              onChange={(e) => setAnoInicio(e.target.value)}
                              label="Ano Início"
                            >
                              {anosDisponiveis.map((ano) => (
                                <MenuItem key={ano} value={ano}>{ano}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Ano Fim</InputLabel>
                            <Select
                              value={anoFim}
                              onChange={(e) => setAnoFim(e.target.value)}
                              label="Ano Fim"
                            >
                              {anosDisponiveis.map((ano) => (
                                <MenuItem key={ano} value={ano}>{ano}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {selecaoTipo === 'personalizado' && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Marque os anos que deseja incluir:
                      </Typography>
                      <FormGroup>
                        <Grid container spacing={1}>
                          {anosDisponiveis.map((ano) => (
                            <Grid item xs={6} sm={4} key={ano}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={periodosSelecionados.includes(ano)}
                                    onChange={() => togglePeriodo(ano)}
                                    color="primary"
                                  />
                                }
                                label={`Ano ${ano}`}
                                sx={{ 
                                  m: 0,
                                  p: 1,
                                  borderRadius: 1,
                                  '&:hover': { bgcolor: 'action.hover' }
                                }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </FormGroup>
                    </Box>
                  )}

                  <Alert 
                    severity={periodosSelecionados.length > 0 ? "success" : "warning"} 
                    icon={periodosSelecionados.length > 0 ? "✓" : "⚠️"}
                    sx={{ mt: 2 }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      {periodosSelecionados.length > 0 
                        ? `${periodosSelecionados.length} período(s) selecionado(s): ${periodosSelecionados.join(', ')}` 
                        : 'Nenhum período selecionado'}
                    </Typography>
                  </Alert>
                </Paper>
              )}

              {dialogType === 'historico' && selectedAluno && anosDisponiveis.length === 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Nenhum histórico acadêmico encontrado para este aluno.
                </Alert>
              )}

              {dialogType === 'declaracao' && (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Finalidade"
                  value={finalidade}
                  onChange={(e) => setFinalidade(e.target.value)}
                  multiline
                  rows={2}
                />
              )}

              <TextField
                fullWidth
                margin="normal"
                label="Observações (opcional)"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                multiline
                rows={3}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={fecharDialog}>Cancelar</Button>
              <Button 
                onClick={gerarDocumento} 
                variant="contained"
                disabled={loading || !selectedAluno}
              >
                {loading ? 'Gerando...' : 'Gerar Documento'}
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Snackbar para mensagens */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* 🆕 Modal de Visualização do Documento */}
        <Dialog 
          open={modalVisualizacao} 
          onClose={fecharVisualizacao}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { minHeight: '80vh' }
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">
                Visualização do Documento
              </Typography>
              {documentoVisualizado && (
                <Typography variant="body2" color="text.secondary">
                  {getDocumentTypeLabel(documentoVisualizado.tipo)} - {getNomeAluno(documentoVisualizado)}
                </Typography>
              )}
            </Box>
            <IconButton onClick={fecharVisualizacao}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent dividers>
            {documentoVisualizado && (
              <Box sx={{ p: 2 }}>
                {/* Cabeçalho do Documento */}
                <Paper elevation={1} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
                  <Typography variant="h5" gutterBottom color="primary">
                    {documentoVisualizado.dadosInstituicao?.nome || 'ESCOLA ELO'}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {getDocumentTypeLabel(documentoVisualizado.tipo).toUpperCase()}
                  </Typography>
                  <Chip 
                    label={documentoVisualizado.status} 
                    color={getStatusColor(documentoVisualizado.status)}
                    sx={{ mt: 1 }}
                  />
                </Paper>

                {/* Dados do Aluno */}
                <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Dados do Aluno
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Nome:</Typography>
                      <Typography variant="body1">{getNomeAluno(documentoVisualizado)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">CPF:</Typography>
                      <Typography variant="body1">{getCpfAluno(documentoVisualizado)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">RG:</Typography>
                      <Typography variant="body1">{getRgAluno(documentoVisualizado)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Data de Nascimento:</Typography>
                      <Typography variant="body1">{getDataNascimentoAluno(documentoVisualizado)}</Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Histórico Acadêmico */}
                {documentoVisualizado.historicoAcademico && documentoVisualizado.historicoAcademico.length > 0 && (
                  <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Histórico Acadêmico
                    </Typography>
                    {documentoVisualizado.historicoAcademico.map((ano, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {ano.anoLetivo} - {ano.serie} ({ano.turma})
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Situação: {ano.situacao || 'Em andamento'} | Carga Horária: {ano.cargaHoraria || 0}h
                        </Typography>
                        
                        {ano.disciplinas && ano.disciplinas.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                              Disciplinas ({ano.disciplinas.length}):
                            </Typography>
                            <Grid container spacing={1}>
                              {ano.disciplinas.map((disciplina, discIndex) => (
                                <Grid item xs={12} sm={6} key={discIndex}>
                                  <Box sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    <Typography variant="body2" fontWeight="bold">
                                      {disciplina.nome}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                      Média: {disciplina.mediaFinal?.toFixed(1) || 'N/A'} | 
                                      Frequência: {disciplina.frequenciaPercentual?.toFixed(1) || 'N/A'}%
                                    </Typography>
                                    <Typography variant="caption" display="block" color={disciplina.aprovado ? 'success.main' : 'error.main'}>
                                      {disciplina.situacao || 'Pendente'}
                                    </Typography>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Paper>
                )}

                {/* Resumo Geral */}
                {documentoVisualizado.resumo && (
                  <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Resumo Geral
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Anos Cursados:</Typography>
                        <Typography variant="h6">{documentoVisualizado.resumo.totalAnos || 0}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Total Disciplinas:</Typography>
                        <Typography variant="h6">{documentoVisualizado.resumo.totalDisciplinas || 0}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Média Geral:</Typography>
                        <Typography variant="h6" color="primary">
                          {documentoVisualizado.resumo.mediaGeral?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">Frequência Geral:</Typography>
                        <Typography variant="h6" color="success.main">
                          {documentoVisualizado.resumo.frequenciaGeral?.toFixed(1) || 'N/A'}%
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Situação:</Typography>
                        <Chip 
                          label={documentoVisualizado.resumo.situacaoGeral || 'Em Andamento'}
                          color={documentoVisualizado.resumo.situacaoGeral === 'Concluído' ? 'success' : 'default'}
                          sx={{ mt: 0.5 }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Informações do Documento */}
                <Paper elevation={1} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Informações do Documento
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Código de Verificação:</Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {documentoVisualizado.codigoVerificacao}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Data de Emissão:</Typography>
                      <Typography variant="body1">
                        {new Date(documentoVisualizado.dataEmissao).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Grid>
                    {documentoVisualizado.totalRematriculas > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Rematrículas:</Typography>
                        <Typography variant="body1">
                          {documentoVisualizado.totalRematriculas} rematrícula(s) registrada(s)
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button onClick={fecharVisualizacao}>
              Fechar
            </Button>
            {documentoVisualizado && (
              <Button 
                variant="contained" 
                startIcon={<DownloadIcon />}
                onClick={() => {
                  baixarDocumento(documentoVisualizado);
                  fecharVisualizacao();
                }}
              >
                Baixar PDF
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Container>
    </main>
  </div>
</ProtectedRoute>
  );
};

export default SecretariaDigital;
