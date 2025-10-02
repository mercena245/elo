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
  Tabs
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
  FamilyRestroom as FamilyIcon
} from '@mui/icons-material';
import ProtectedRoute from '../../components/ProtectedRoute';
import secretariaDigitalService from '../../services/secretariaDigitalService';
import { logAction } from '../../services/auditService';
import { useSecretariaAccess } from '../../hooks/useSecretariaAccess';

const SecretariaDigital = () => {
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

  const { 
    userRole, 
    alunosVinculados, 
    loading: accessLoading,
    podeAcessarSecretaria,
    filtrarDocumentosPermitidos,
    filtrarAlunosPermitidos
  } = useSecretariaAccess();

  useEffect(() => {
    if (!accessLoading && userRole) {
      carregarDados();
    }
  }, [accessLoading, userRole]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar alunos
      let todosAlunos = [];
      const alunosResponse = await fetch('/api/alunos');
      if (alunosResponse.ok) {
        const alunosData = await alunosResponse.json();
        todosAlunos = alunosData;
      } else {
        // Fallback para buscar do Firebase
        const { db, ref, get } = await import('../../firebase');
        const alunosRef = ref(db, 'alunos');
        const snapshot = await get(alunosRef);
        if (snapshot.exists()) {
          todosAlunos = Object.entries(snapshot.val())
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
          documento = await secretariaDigitalService.gerarHistoricoEscolar(
            selectedAluno, 
            anoLetivo, 
            observacoes
          );
          break;
        case 'declaracao':
          documento = await secretariaDigitalService.gerarDeclaracaoMatricula(
            selectedAluno, 
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
      const pdf = await secretariaDigitalService.gerarPDF(documento);
      pdf.save(`${documento.tipo}_${documento.dadosAluno.nome}_${documento.codigoVerificacao}.pdf`);
      
      await logAction('DIGITAL_SECRETARY_DOCUMENT_DOWNLOADED', {
        documentoId: documento.id,
        tipoDocumento: documento.tipo,
        alunoNome: documento.dadosAluno.nome
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
                            label={`${documentos.filter(d => d.dadosAluno.nome === aluno.nome).length} documentos`}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
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
                        <Box>
                          <Typography variant="body2" component="span">
                            <PersonIcon sx={{ fontSize: 14, mr: 0.5 }} />
                            {doc.dadosAluno.nome}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            <QrCodeIcon sx={{ fontSize: 12, mr: 0.5 }} />
                            {doc.codigoVerificacao} • {new Date(doc.dataEmissao).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Visualizar">
                        <IconButton size="small" sx={{ mr: 1 }}>
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
          <Dialog open={dialogOpen} onClose={fecharDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              {dialogType === 'historico' && 'Gerar Histórico Escolar'}
              {dialogType === 'declaracao' && 'Gerar Declaração'}
              {dialogType === 'certificado' && 'Gerar Certificado'}
              {dialogType === 'transferencia' && 'Gerar Transferência'}
            </DialogTitle>
            <DialogContent>
              <FormControl fullWidth margin="normal">
                <InputLabel>Aluno</InputLabel>
                <Select
                  value={selectedAluno}
                  onChange={(e) => setSelectedAluno(e.target.value)}
                  label="Aluno"
                >
                  {alunos.map((aluno) => (
                    <MenuItem key={aluno.id} value={aluno.id}>
                      {aluno.nome} - {aluno.serie}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {dialogType === 'historico' && (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Ano Letivo"
                  value={anoLetivo}
                  onChange={(e) => setAnoLetivo(e.target.value)}
                  type="number"
                />
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
      </Container>
    </ProtectedRoute>
  );
};

export default SecretariaDigital;
