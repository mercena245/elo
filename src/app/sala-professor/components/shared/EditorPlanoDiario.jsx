"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { storage } from '../../../../firebase-storage';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  IconButton,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useSchoolDatabase } from '../../../../hooks/useSchoolDatabase';
import { FAIXAS_ETARIAS, obterCompetenciasFlat } from './competenciasBNCC';

const EditorPlanoDiario = ({
  open,
  onClose,
  onSave,
  plano,
  turmas,
  disciplinas,
  minhasTurmas,
  minhasDisciplinas,
  isEditing = false,
  userRole
}) => {
  const { user } = useAuth();
  const { getData, updateData, isReady } = useSchoolDatabase();
  
  const [formData, setFormData] = useState({
    tipo_plano: 'diario',
    turmaId: '',
    disciplinaId: [], // Array para múltiplas disciplinas
    data: '',
    faixaEtaria: '',
    competenciasBNCC: [],
    objetivosAprendizagem: '',
    conteudo: '',
    metodologia: '',
    tarefaCasa: '',
    recursos: [], // Array de arquivos
    imagens: [],
    observacoes: '',
    statusAprovacao: 'pendente',
    observacoesAprovacao: '',
    aprovadoPor: '',
    dataAprovacao: '',
    professorNome: '',
    professorUid: ''
  });

  const [errors, setErrors] = useState({});
  const [competenciasDisponiveis, setCompetenciasDisponiveis] = useState([]);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [arquivos, setArquivos] = useState([]);
  
  // Estados para aprovação/rejeição (coordenador)
  const [dialogRejeitar, setDialogRejeitar] = useState(false);
  const [observacoesRejeicao, setObservacoesRejeicao] = useState('');
  const [dialogHistorico, setDialogHistorico] = useState(false);

  // Carregar competências quando faixa etária mudar
  useEffect(() => {
    if (formData.faixaEtaria) {
      // Função assíncrona agora
      obterCompetenciasFlat(formData.faixaEtaria).then(competencias => {
        setCompetenciasDisponiveis(competencias);
      }).catch(error => {
        console.error('Erro ao carregar competências:', error);
        setCompetenciasDisponiveis([]);
      });
    } else {
      setCompetenciasDisponiveis([]);
    }
  }, [formData.faixaEtaria]);
  useEffect(() => {
    if (open) {
      if (isEditing && plano) {
        setFormData({
          tipo_plano: 'diario',
          turmaId: plano.turmaId || '',
          disciplinaId: Array.isArray(plano.disciplinaId) ? plano.disciplinaId : (plano.disciplinaId ? [plano.disciplinaId] : []),
          data: plano.data || '',
          faixaEtaria: plano.faixaEtaria || '',
          competenciasBNCC: plano.competenciasBNCC || plano.bncc || [],
          objetivosAprendizagem: plano.objetivosAprendizagem || plano.objetivos?.join('\n') || '',
          conteudo: plano.conteudo || plano.conteudoProgramatico || '',
          metodologia: plano.metodologia || '',
          tarefaCasa: plano.tarefaCasa || '',
          recursos: plano.recursos || [],
          imagens: plano.imagens || [],
          observacoes: plano.observacoes || '',
          statusAprovacao: plano.statusAprovacao || 'pendente',
          observacoesAprovacao: plano.observacoesAprovacao || '',
          aprovadoPor: plano.aprovadoPor || '',
          dataAprovacao: plano.dataAprovacao || '',
          professorNome: plano.professorNome || user?.displayName || user?.email || '',
          professorUid: plano.professorUid || user?.uid || ''
        });
        // Carregar arquivos existentes
        if (Array.isArray(plano.recursos)) {
          setArquivos(plano.recursos);
        }
      } else {
        // Resetar para novo plano
        setFormData({
          tipo_plano: 'diario',
          turmaId: '',
          disciplinaId: [],
          data: new Date().toISOString().split('T')[0],
          faixaEtaria: '',
          competenciasBNCC: [],
          objetivosAprendizagem: '',
          conteudo: '',
          metodologia: '',
          tarefaCasa: '',
          recursos: [],
          imagens: [],
          observacoes: '',
          statusAprovacao: 'pendente',
          observacoesAprovacao: '',
          aprovadoPor: '',
          dataAprovacao: '',
          professorNome: user?.displayName || user?.email || '',
          professorUid: user?.uid || ''
        });
        setArquivos([]);
      }
      setErrors({});
    }
  }, [open, plano, isEditing, user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.turmaId) newErrors.turmaId = 'Selecione uma turma';
    if (!formData.disciplinaId || formData.disciplinaId.length === 0) newErrors.disciplinaId = 'Selecione ao menos uma disciplina';
    if (!formData.data) newErrors.data = 'Selecione uma data';
    if (!formData.objetivosAprendizagem?.trim()) newErrors.objetivosAprendizagem = 'Defina os objetivos de aprendizagem';
    if (!formData.conteudo?.trim()) newErrors.conteudo = 'Descreva o conteúdo';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para aprovar plano (coordenador)
  const handleAprovar = async () => {
    if (!plano?.id) return;
    
    console.log('✅ [EditorPlanoDiario] Aprovando plano:', plano.id);
    
    const dadosAtualizacao = {
      statusAprovacao: 'aprovado',
      aprovadoPor: user?.uid || '',
      dataAprovacao: new Date().toISOString(),
      observacoesAprovacao: ''
    };
    
    try {
      await updateData(`planos-aula/${plano.id}`, dadosAtualizacao);
      console.log('✅ [handleAprovar] Plano diário aprovado com sucesso no Firebase');
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('❌ [handleAprovar] Erro ao aprovar plano diário:', error);
    }
  };

  // Função para solicitar revisão (coordenador)
  const handleRejeitar = async () => {
    if (!plano?.id) return;
    
    if (!observacoesRejeicao.trim()) {
      return;
    }
    
    console.log('🔄 [EditorPlanoDiario] Solicitando revisão do plano:', plano.id);
    
    const historicoRevisao = {
      data: new Date().toISOString(),
      solicitadoPor: user?.uid || '',
      observacoes: observacoesRejeicao.trim()
    };
    
    const historicoExistente = plano.historicoRevisoes || [];
    
    const dadosAtualizacao = {
      statusAprovacao: 'em_revisao',
      aprovadoPor: user?.uid || '',
      dataAprovacao: new Date().toISOString(),
      observacoesAprovacao: observacoesRejeicao.trim(),
      historicoRevisoes: [...historicoExistente, historicoRevisao]
    };
    
    console.log('💾 [EditorPlanoDiario] Dados de atualização:', dadosAtualizacao);
    
    try {
      await updateData(`planos-aula/${plano.id}`, dadosAtualizacao);
      console.log('✅ [EditorPlanoDiario] Plano atualizado - Revisão solicitada!');
      
      setDialogRejeitar(false);
      setObservacoesRejeicao('');
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('❌ [EditorPlanoDiario] Erro ao solicitar revisão:', error);
    }
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    console.log('💾 [handleSave] Salvando plano diário...', {
      statusAtual: formData.statusAprovacao,
      isCoordinator: isCoordinator(),
      planoId: plano?.id
    });
    
    const dadosPlano = {
      ...formData,
      recursos: arquivos, // ← CRÍTICO: Incluir arquivos salvos no estado separado
      id: plano?.id || Date.now().toString(),
      criadoEm: plano?.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      professorNome: user?.displayName || user?.email,
      professorUid: user?.uid
    };
    
    console.log('📎 [handleSave] Recursos sendo salvos:', {
      numRecursos: arquivos?.length || 0,
      recursos: arquivos
    });
    
    // Se a coordenadora está editando um plano em revisão, salva e aprova automaticamente
    if (formData.statusAprovacao === 'em_revisao' && isCoordinator()) {
      console.log('✅ [handleSave] Coordenadora editando plano diário em revisão! Salvando e aprovando...');
      dadosPlano.statusAprovacao = 'aprovado';
      dadosPlano.observacoesAprovacao = '';
      dadosPlano.aprovadoPor = user?.uid || '';
      dadosPlano.dataAprovacao = new Date().toISOString();
      console.log('🔄 [handleSave] Novo status: aprovado (pela coordenadora)');
    }
    // Se a professora está editando um plano em revisão, volta para pendente
    else if (formData.statusAprovacao === 'em_revisao' && !isCoordinator()) {
      console.log('✅ [handleSave] Professora editando plano diário em revisão! Voltando para pendente...');
      dadosPlano.statusAprovacao = 'pendente';
      dadosPlano.observacoesAprovacao = '';
      console.log('🔄 [handleSave] Novo status:', dadosPlano.statusAprovacao);
    }
    
    console.log('📤 [handleSave] Dados finais a serem salvos:', {
      id: dadosPlano.id,
      statusAprovacao: dadosPlano.statusAprovacao,
      observacoesAprovacao: dadosPlano.observacoesAprovacao
    });
    
    onSave(dadosPlano, plano?.id);
    onClose();
  };

  // Função para fazer upload de arquivo
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingImage(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const fileName = `planos-aula/${user.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error('Erro no upload:', error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                nome: file.name,
                url: downloadURL,
                tipo: file.type,
                tamanho: file.size,
                path: fileName
              });
            }
          );
        });
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setArquivos([...arquivos, ...uploadedFiles]);
      handleChange('recursos', [...(formData.recursos || []), ...uploadedFiles]);
      
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload dos arquivos. Tente novamente.');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  // Função para remover arquivo
  const handleRemoveFile = async (index) => {
    try {
      const arquivo = arquivos[index];
      if (arquivo.path) {
        const storageRef = ref(storage, arquivo.path);
        await deleteObject(storageRef);
      }
      
      const novosArquivos = arquivos.filter((_, i) => i !== index);
      setArquivos(novosArquivos);
      handleChange('recursos', novosArquivos);
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      alert('Erro ao remover arquivo. Tente novamente.');
    }
  };

  const getTurmasDisponiveis = () => {
    if (!turmas || typeof turmas !== 'object') {
      return [];
    }
    
    // Converter o objeto em array com IDs
    const todasTurmas = Object.keys(turmas).map(id => ({
      ...turmas[id],
      id: id
    }));
    
    if (!minhasTurmas || minhasTurmas.length === 0) {
      return todasTurmas;
    }
    
    return todasTurmas.filter(turma => minhasTurmas.includes(turma.id));
  };

  const getDisciplinasDisponiveis = () => {
    if (!disciplinas || typeof disciplinas !== 'object') {
      return [];
    }
    
    // Converter o objeto em array com IDs
    const todasDisciplinas = Object.keys(disciplinas).map(id => ({
      ...disciplinas[id],
      id: id
    }));
    
    if (!minhasDisciplinas || minhasDisciplinas.length === 0) {
      return todasDisciplinas;
    }
    
    return todasDisciplinas.filter(disc => minhasDisciplinas.includes(disc.id));
  };

  const isCoordinator = () => {
    return userRole === 'coordenador' || userRole === 'coordenadora';
  };

  const canEdit = () => {
    if (isCoordinator()) return true;
    // Professora pode editar se estiver pendente, em_revisao ou rejeitado
    return formData.statusAprovacao === 'rejeitado' || 
           formData.statusAprovacao === 'em_revisao' || 
           formData.statusAprovacao === 'pendente';
  };

  const getStatusColor = () => {
    switch (formData.statusAprovacao) {
      case 'aprovado': return 'success';
      case 'rejeitado': return 'error';
      case 'em_revisao': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = () => {
    switch (formData.statusAprovacao) {
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      case 'em_revisao': return 'Aguardando Revisão';
      default: return 'Pendente';
    }
  };

  return (
    <>
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CalendarIcon sx={{ fontSize: '2rem' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {isEditing ? 'Editar Plano Diário' : 'Novo Plano Diário'}
            </Typography>
            <Typography variant="caption">
              Planejamento completo do dia
            </Typography>
          </Box>
          {isEditing && (
            <Chip 
              label={getStatusText()} 
              color={getStatusColor()} 
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {/* Alert Informativo */}
        <Card 
          variant="outlined" 
          sx={{ 
            mb: 3, 
            border: '2px solid',
            borderColor: 'info.main',
            bgcolor: '#E3F2FD',
            cursor: 'pointer'
          }}
          onClick={() => setInfoExpanded(!infoExpanded)}
        >
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarIcon color="info" sx={{ fontSize: '2rem' }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    📅 Plano de Aula Diário
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Clique para {infoExpanded ? 'ocultar' : 'ver'} informações
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small">
                <ExpandMoreIcon 
                  sx={{ 
                    transform: infoExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                  }}
                />
              </IconButton>
            </Box>
            
            <Collapse in={infoExpanded}>
              <Divider sx={{ my: 2 }} />
              <Alert severity="info" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>Você está criando um plano de aula diário.</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Este formato é ideal para planejar todas as atividades do dia em um único documento.
                </Typography>
              </Alert>
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Caso deseje planejar por horário específico, utilize a <strong>grade horária</strong> da tela principal.
                </Typography>
              </Alert>
            </Collapse>
          </CardContent>
        </Card>

        {/* Formulário */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Informações Básicas */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📋 Informações Básicas
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <FormControl fullWidth error={!!errors.turmaId}>
                  <InputLabel id="turma-label">Turma *</InputLabel>
                  <Select
                    labelId="turma-label"
                    id="turma-select"
                    value={formData.turmaId}
                    onChange={(e) => handleChange('turmaId', e.target.value)}
                    label="Turma *"
                  >
                    <MenuItem value="">
                      <em>Selecione uma turma</em>
                    </MenuItem>
                    {getTurmasDisponiveis()?.map(turma => (
                      <MenuItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.turmaId && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.turmaId}</Typography>}
                </FormControl>

                <Box>
                  <Autocomplete
                    multiple
                    fullWidth
                    options={getDisciplinasDisponiveis() || []}
                    getOptionLabel={(option) => option.nome || ''}
                    value={getDisciplinasDisponiveis()?.filter(disc => 
                      formData.disciplinaId?.includes(disc.id)
                    ) || []}
                    onChange={(event, newValue) => {
                      handleChange('disciplinaId', newValue.map(disc => disc.id));
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Disciplinas *"
                        placeholder="Selecione uma ou mais disciplinas"
                        error={!!errors.disciplinaId}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option.nome}
                            {...tagProps}
                            color="secondary"
                            size="small"
                          />
                        );
                      })
                    }
                  />
                  {errors.disciplinaId && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.disciplinaId}</Typography>}
                </Box>

                <TextField
                  fullWidth
                  label="Data *"
                  type="date"
                  value={formData.data}
                  onChange={(e) => handleChange('data', e.target.value)}
                  error={!!errors.data}
                  helperText={errors.data}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  label="Professora"
                  value={formData.professorNome}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Competências BNCC */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🎯 Competências BNCC
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {/* Seletor de Faixa Etária */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="faixa-etaria-label">Faixa Etária / Nível de Ensino *</InputLabel>
                <Select
                  labelId="faixa-etaria-label"
                  value={formData.faixaEtaria}
                  label="Faixa Etária / Nível de Ensino *"
                  onChange={(e) => {
                    handleChange('faixaEtaria', e.target.value);
                    handleChange('competenciasBNCC', []); // Limpa competências ao mudar faixa
                  }}
                  error={!!errors.faixaEtaria}
                >
                  <MenuItem value="">
                    <em>Selecione uma faixa etária</em>
                  </MenuItem>
                  {FAIXAS_ETARIAS.map((faixa) => (
                    <MenuItem key={faixa.id} value={faixa.id}>
                      {faixa.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.faixaEtaria && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                    {errors.faixaEtaria}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 2, display: 'block' }}>
                  Selecione a faixa etária para carregar as competências específicas da BNCC
                </Typography>
              </FormControl>
              
              {/* Autocomplete - só aparece após selecionar faixa etária */}
              {formData.faixaEtaria && competenciasDisponiveis.length > 0 ? (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {competenciasDisponiveis.length} competências disponíveis para esta faixa etária
                  </Typography>
                  
                  <Autocomplete
                    multiple
                    options={competenciasDisponiveis}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      return `${option.codigo} - ${option.descricao}`;
                    }}
                    value={formData.competenciasBNCC || []}
                    onChange={(e, newValue) => handleChange('competenciasBNCC', newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Selecione as competências"
                        placeholder="Digite para buscar..."
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const label = typeof option === 'string' ? option : `${option.codigo} - ${option.descricao}`;
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={label}
                            {...tagProps}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        );
                      })
                    }
                    isOptionEqualToValue={(option, value) => {
                      if (typeof option === 'string' && typeof value === 'string') {
                        return option === value;
                      }
                      return option.codigo === value.codigo;
                    }}
                    filterSelectedOptions
                  />
                </>
              ) : formData.faixaEtaria && competenciasDisponiveis.length === 0 ? (
                <Alert severity="warning">
                  <Typography variant="body2">
                    Nenhuma competência BNCC encontrada para a faixa etária <strong>{formData.faixaEtaria}</strong>.
                  </Typography>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          {/* Planejamento Pedagógico */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📚 Planejamento Pedagógico
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Objetivos de Aprendizagem *"
                  value={formData.objetivosAprendizagem}
                  onChange={(e) => handleChange('objetivosAprendizagem', e.target.value)}
                  error={!!errors.objetivosAprendizagem}
                  helperText={errors.objetivosAprendizagem || "O que os alunos devem aprender hoje?"}
                  placeholder="Ex: Identificar e diferenciar figuras geométricas planas..."
                />

                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  label="Conteúdo *"
                  value={formData.conteudo}
                  onChange={(e) => handleChange('conteudo', e.target.value)}
                  error={!!errors.conteudo}
                  helperText={errors.conteudo || "Descreva o conteúdo que será trabalhado"}
                  placeholder="Ex: Formas geométricas: círculo, quadrado, triângulo e retângulo..."
                />

                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  label="Metodologia"
                  value={formData.metodologia}
                  onChange={(e) => handleChange('metodologia', e.target.value)}
                  helperText="Como você vai ensinar? Estratégias e atividades"
                  placeholder="Ex: Aula expositiva com uso de materiais concretos, seguida de atividade prática em grupos..."
                />

                {/* Campo de Recursos com Upload */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, fontWeight: 'bold' }}>
                    📎 Recursos e Materiais
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={uploadingImage}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    {uploadingImage ? `Enviando... ${Math.round(uploadProgress)}%` : 'Adicionar Arquivos'}
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      onChange={handleFileUpload}
                    />
                  </Button>

                  {/* Preview dos arquivos */}
                  {arquivos.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {arquivos.map((arquivo, index) => (
                        <Card key={index} variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                              {/* Preview da imagem ou ícone do arquivo */}
                              {arquivo.tipo?.startsWith('image/') ? (
                                <Box
                                  component="img"
                                  src={arquivo.url}
                                  alt={arquivo.nome}
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    border: '1px solid #e0e0e0'
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'primary.light',
                                    borderRadius: 1,
                                    color: 'white',
                                    fontSize: '1.5rem'
                                  }}
                                >
                                  📄
                                </Box>
                              )}
                              
                              {/* Informações do arquivo */}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {arquivo.nome}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {(arquivo.tamanho / 1024).toFixed(2)} KB
                                </Typography>
                              </Box>
                            </Box>

                            {/* Botão para remover */}
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemoveFile(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Recursos"
                  value={formData.recursos}
                  onChange={(e) => handleChange('recursos', e.target.value)}
                  helperText="Materiais e recursos necessários"
                  placeholder="Ex: Blocos lógicos, cartolina, tesoura, cola, quadro branco..."
                />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Tarefa de Casa"
                  value={formData.tarefaCasa}
                  onChange={(e) => handleChange('tarefaCasa', e.target.value)}
                  helperText="Atividade para os alunos fazerem em casa"
                  placeholder="Ex: Desenhar 3 objetos de cada forma geométrica estudada..."
                />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observações"
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  helperText="Anotações gerais, adaptações, lembretes..."
                  placeholder="Ex: Preparar material adaptado para o aluno João..."
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Botões de aprovação - só para coordenadores */}
            {isCoordinator() && isEditing && formData.statusAprovacao === 'pendente' && (
              <>
                <Button 
                  onClick={handleAprovar} 
                  variant="contained" 
                  color="success"
                  size="small"
                >
                  Aprovar
                </Button>
                <Button 
                  onClick={() => setDialogRejeitar(true)} 
                  variant="contained" 
                  color="error"
                  size="small"
                >
                  Solicitar Revisão
                </Button>
              </>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} color="inherit">
              Cancelar
            </Button>
            {canEdit() && (
              <Button 
                onClick={handleSave} 
                variant="contained" 
                color={
                  isCoordinator() && formData.statusAprovacao === 'em_revisao' 
                    ? 'success'  // Verde para "Salvar e Aprovar"
                    : 'primary'  // Azul para salvar normal
                }
                startIcon={<SaveIcon />}
                sx={{ minWidth: 160 }}
              >
                {isCoordinator() && formData.statusAprovacao === 'em_revisao' 
                  ? '✓ Salvar e Aprovar'
                  : isEditing 
                    ? 'Salvar Alterações' 
                    : 'Criar Plano'
                }
              </Button>
            )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>

    {/* Dialog de Solicitação de Revisão */}
    <Dialog 
      open={dialogRejeitar} 
      onClose={() => setDialogRejeitar(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: 'warning.light', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon />
          <Typography variant="h6">Solicitar Revisão do Plano Diário</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          O plano será marcado como "Em Revisão" e a professora receberá suas observações para realizar os ajustes necessários.
        </Alert>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            💡 Dica:
          </Typography>
          <Typography variant="body2">
            Caso a professora não possa fazer as alterações em tempo hábil, você pode editar e ao clicar em <strong>"Salvar e Aprovar"</strong>, o plano será automaticamente aprovado.
          </Typography>
        </Alert>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Observações para Revisão"
          placeholder="Descreva quais pontos precisam ser ajustados no plano..."
          value={observacoesRejeicao}
          onChange={(e) => setObservacoesRejeicao(e.target.value)}
          required
          helperText="As observações ajudarão a professora a entender o que precisa ser melhorado"
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => {
          setDialogRejeitar(false);
          setObservacoesRejeicao('');
        }}>
          Cancelar
        </Button>
        <Button 
          onClick={handleRejeitar} 
          variant="contained" 
          color="warning"
          disabled={!observacoesRejeicao.trim()}
        >
          Solicitar Revisão
        </Button>
      </DialogActions>
    </Dialog>

    {/* Dialog de Histórico de Revisões */}
    <Dialog 
      open={dialogHistorico} 
      onClose={() => setDialogHistorico(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: 'info.light', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon />
          <Typography variant="h6">Histórico de Revisões</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {plano?.historicoRevisoes && plano.historicoRevisoes.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {plano.historicoRevisoes.map((revisao, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(revisao.data).toLocaleString('pt-BR')}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {revisao.observacoes}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Alert severity="info">
            Nenhuma revisão solicitada ainda.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogHistorico(false)}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default EditorPlanoDiario;
