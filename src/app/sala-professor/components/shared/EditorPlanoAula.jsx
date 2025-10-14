"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
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
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Assignment as AssignmentIcon,
  Psychology as PsychologyIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { ref, get, update } from 'firebase/database';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
;

const EditorPlanoAula = ({
  open,
  onClose,
  onSave,
  plano,
  dadosIniciais, // Dados pré-preenchidos do calendário
  turmas,
  disciplinas,
  minhasTurmas,
  minhasDisciplinas,
  isEditing = false
}) => {
  const { user, role: userRole } = useAuth();
  
  const [formData, setFormData] = useState({
    titulo: '',
    turmaId: '',
    disciplinaId: '',
    data: '',
    horaInicio: '',
    horaFim: '',
    bncc: [],
    objetivos: [],
    conteudoProgramatico: '',
    metodologia: '',
    recursos: [],
    avaliacao: '',
    observacoes: '',
    atividades: [],
    leituraObrigatoria: '',
    tarefaCasa: '',
    statusAprovacao: 'pendente',
    observacoesAprovacao: '',
    aprovadoPor: '',
    dataAprovacao: '',
    publicado: false
  });

  const [novoObjetivo, setNovoObjetivo] = useState('');
  const [novoRecurso, setNovoRecurso] = useState('');
  const [novaAtividade, setNovaAtividade] = useState({
    nome: '',
    duracao: '',
    descricao: ''
  });
  const [errors, setErrors] = useState({});
  const [periodoLetivo, setPeriodoLetivo] = useState(null);
  const [dataMinima, setDataMinima] = useState('');
  const [dataMaxima, setDataMaxima] = useState('');

  // Competências BNCC simplificadas (principais áreas)
  const competenciasBNCC = [
    { codigo: 'EF01LP01', descricao: 'Reconhecer que textos são lidos e escritos da esquerda para a direita e de cima para baixo da página.' },
    { codigo: 'EF01LP02', descricao: 'Escrever, espontaneamente ou por ditado, palavras e frases de forma alfabética.' },
    { codigo: 'EF01MA01', descricao: 'Utilizar números naturais como indicador de quantidade ou de ordem em diferentes situações cotidianas.' },
    { codigo: 'EF01MA02', descricao: 'Contar de maneira exata ou aproximada, utilizando diferentes estratégias.' },
    { codigo: 'EF02LP01', descricao: 'Utilizar, ao produzir o texto, grafia correta de palavras conhecidas.' },
    { codigo: 'EF02MA01', descricao: 'Comparar e ordenar números naturais (até a ordem de centenas).' },
    { codigo: 'EF03LP01', descricao: 'Ler e escrever palavras com correspondências regulares diretas entre letras e fonemas.' },
    { codigo: 'EF03MA01', descricao: 'Ler, escrever e comparar números naturais de até a ordem de unidade de milhar.' },
    { codigo: 'EF04LP01', descricao: 'Grafar palavras utilizando regras de correspondência fonema-grafema regulares.' },
    { codigo: 'EF04MA01', descricao: 'Ler, escrever e ordenar números naturais até a ordem de dezenas de milhar.' },
    { codigo: 'EF05LP01', descricao: 'Grafar palavras utilizando regras de correspondência fonema-grafema regulares, contextuais e morfológicas.' },
    { codigo: 'EF05MA01', descricao: 'Ler, escrever e ordenar números naturais até a ordem de centenas de milhar.' },
    { codigo: 'EF06LP01', descricao: 'Reconhecer a impossibilidade de uma neutralidade absoluta no relato de fatos.' },
    { codigo: 'EF06MA01', descricao: 'Comparar, ordenar, ler e escrever números naturais e números racionais.' },
    { codigo: 'EF07LP01', descricao: 'Distinguir diferentes propostas editoriais.' },
    { codigo: 'EF07MA01', descricao: 'Resolver e elaborar problemas com números inteiros e racionais.' },
    { codigo: 'EF08LP01', descricao: 'Identificar e comparar as várias editorias de jornais impressos e digitais.' },
    { codigo: 'EF08MA01', descricao: 'Efetuar cálculos com potências de expoentes inteiros e aplicar esse conhecimento.' },
    { codigo: 'EF09LP01', descricao: 'Analisar o fenômeno da disseminação de informações e opiniões nos meios digitais.' },
    { codigo: 'EF09MA01', descricao: 'Reconhecer que, uma vez fixada uma unidade de comprimento, existem segmentos de reta cujo comprimento não é expresso por número racional.' }
  ];

  useEffect(() => {
    if (open) {
      if (isEditing && plano) {
        // Editando plano existente
        setFormData({
          titulo: plano.titulo || '',
          turmaId: plano.turmaId || '',
          disciplinaId: plano.disciplinaId || '',
          data: plano.data || '',
          horaInicio: plano.horaInicio || '',
          horaFim: plano.horaFim || '',
          periodoAula: plano.periodoAula || '',
          objetivos: plano.objetivos || [],
          conteudoProgramatico: plano.conteudoProgramatico || '',
          metodologia: plano.metodologia || '',
          recursos: plano.recursos || [],
          avaliacao: plano.avaliacao || '',
          observacoes: plano.observacoes || '',
          atividades: plano.atividades || [],
          leituraObrigatoria: plano.leituraObrigatoria || '',
          tarefaCasa: plano.tarefaCasa || '',
          statusAprovacao: plano.statusAprovacao || 'pendente',
          publicado: plano.publicado || false
        });
      } else {
        // Novo plano - resetar tudo primeiro
        setFormData({
          titulo: '',
          turmaId: '',
          disciplinaId: '',
          data: '',
          horaInicio: '',
          horaFim: '',
          periodoAula: '',
          objetivos: [],
          conteudoProgramatico: '',
          metodologia: '',
          recursos: [],
          avaliacao: '',
          observacoes: '',
          atividades: [],
          leituraObrigatoria: '',
          tarefaCasa: '',
          statusAprovacao: 'pendente',
          publicado: false
        });
        
        // Se há dados iniciais (do calendário), aplicar
        if (dadosIniciais) {
          console.log('🎯 EditorPlanoAula - Dados iniciais recebidos:', dadosIniciais);
          setFormData(prev => ({
            ...prev,
            turmaId: dadosIniciais.turmaId || '',
            disciplinaId: dadosIniciais.disciplinaId || '',
            data: dadosIniciais.data || '',
            horaInicio: dadosIniciais.horaInicio || '',
            horaFim: dadosIniciais.horaFim || '',
            periodoAula: dadosIniciais.periodoAula || ''
          }));
          console.log('🎯 EditorPlanoAula - FormData após aplicar dados iniciais');
        } else {
          console.log('❌ EditorPlanoAula - Nenhum dado inicial recebido');
        }
      }
      setErrors({});
    }
  }, [open, plano, dadosIniciais, isEditing]);

  // Buscar informações do período letivo quando turma é selecionada
  useEffect(() => {
    if (!isReady) return;
    
    const buscarPeriodoLetivo = async () => {
      if (formData.turmaId && turmas[formData.turmaId]) {
        const turma = turmas[formData.turmaId];
        const periodoId = turma.periodoId;
        
        if (periodoId) {
          try {
            console.log('🔍 Buscando período letivo:', periodoId);
            const periodoRef = ref(db, `Escola/Periodo/${periodoId}`);
            const periodoSnapshot = await get(periodoRef);
            
            if (periodoSnapshot.exists()) {
              const periodo = periodoSnapshot.val();
              console.log('📅 Período letivo encontrado:', periodo);
              
              setPeriodoLetivo(periodo);
              setDataMinima(periodo.dataInicio || '2025-01-01');
              setDataMaxima(periodo.dataFim || '2025-12-31');
            } else {
              console.log('❌ Período letivo não encontrado');
              // Usar datas padrão
              setDataMinima('2025-01-01');
              setDataMaxima('2025-12-31');
            }
          } catch (error) {
            console.error('Erro ao buscar período letivo:', error);
            // Usar datas padrão em caso de erro
            setDataMinima('2025-01-01');
            setDataMaxima('2025-12-31');
          }
        }
      }
    };

    buscarPeriodoLetivo();
  }, [formData.turmaId, turmas]);

  // Funções para obter nomes para exibição
  const getNomeTurma = () => {
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

    if (!formData.turmaId || !turmas) return '';
    const turma = turmas[formData.turmaId];
    if (!turma) return formData.turmaId;
    return `${turma.nome} ${turma.ano ? `- ${turma.ano}` : ''} ${turma.turno ? `(${turma.turno})` : ''}`.trim();
  };

  const getNomeDisciplina = () => {
    if (!formData.disciplinaId || !disciplinas) return '';
    const disciplina = disciplinas[formData.disciplinaId];
    if (!disciplina) return formData.disciplinaId;
    return disciplina.nome || disciplina.nomeDisciplina || 'Nome não definido';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleAddObjetivo = () => {
    if (novoObjetivo.trim()) {
      setFormData(prev => ({
        ...prev,
        objetivos: [...prev.objetivos, novoObjetivo.trim()]
      }));
      setNovoObjetivo('');
    }
  };

  const handleRemoveObjetivo = (index) => {
    setFormData(prev => ({
      ...prev,
      objetivos: prev.objetivos.filter((_, i) => i !== index)
    }));
  };

  const handleAddRecurso = () => {
    if (novoRecurso.trim()) {
      setFormData(prev => ({
        ...prev,
        recursos: [...prev.recursos, novoRecurso.trim()]
      }));
      setNovoRecurso('');
    }
  };

  const handleRemoveRecurso = (index) => {
    setFormData(prev => ({
      ...prev,
      recursos: prev.recursos.filter((_, i) => i !== index)
    }));
  };

  const handleAddAtividade = () => {
    if (novaAtividade.nome.trim()) {
      setFormData(prev => ({
        ...prev,
        atividades: [...prev.atividades, { ...novaAtividade }]
      }));
      setNovaAtividade({ nome: '', duracao: '', descricao: '' });
    }
  };

  const handleRemoveAtividade = (index) => {
    setFormData(prev => ({
      ...prev,
      atividades: prev.atividades.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }

    if (!formData.turmaId) {
      newErrors.turmaId = 'Turma é obrigatória';
    }

    if (!formData.disciplinaId) {
      newErrors.disciplinaId = 'Disciplina é obrigatória';
    }

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória';
    }

    if (!formData.conteudoProgramatico.trim()) {
      newErrors.conteudoProgramatico = 'Conteúdo programático é obrigatório';
    }

    if (formData.objetivos.length === 0) {
      newErrors.objetivos = 'Pelo menos um objetivo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const dadosPlano = {
        ...formData,
        id: plano?.id || Date.now().toString(),
        criadoEm: plano?.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };
      // Passa o id do plano para garantir update correto
      onSave(dadosPlano, plano?.id);
      onClose();
    }
  };

  const getTurmasDisponiveis = () => {
    if (!minhasTurmas || minhasTurmas.length === 0) {
      return Object.values(turmas);
    }
    return Object.values(turmas).filter(turma => minhasTurmas.includes(turma.id));
  };

  const getDisciplinasDisponiveis = () => {
    if (!minhasDisciplinas || minhasDisciplinas.length === 0) {
      return Object.values(disciplinas);
    }
    return Object.values(disciplinas).filter(disc => minhasDisciplinas.includes(disc.id));
  };

  const getDataMinima = () => {
    return dataMinima || new Date().toISOString().split('T')[0];
  };

  const getDataMaxima = () => {
    return dataMaxima || `${new Date().getFullYear()}-12-31`;
  };

  // Funções de aprovação
  const isCoordinator = () => {
    return userRole === 'coordenador' || userRole === 'coordenadora';
  };

  const canEdit = () => {
    if (isCoordinator()) return true;
    return formData.statusAprovacao === 'rejeitado' || formData.statusAprovacao === 'pendente';
  };

  // Aprovação/rejeição: atualiza apenas status e campos de aprovação no Firebase
  const handleApprovar = async () => {
    if (!plano?.id) return;
    const updateData = {
      statusAprovacao: 'aprovado',
      aprovadoPor: user?.uid || '',
      dataAprovacao: new Date().toISOString(),
      observacoesAprovacao: ''
    };
    await updateData('planos-aula/${plano.id}', updateData);
    setFormData(prev => ({ ...prev, ...updateData }));
    if (onClose) onClose();
  };

  const handleRejeitar = async (observacoes = '') => {
    if (!plano?.id) return;
    const updateData = {
      statusAprovacao: 'rejeitado',
      aprovadoPor: user?.uid || '',
      dataAprovacao: new Date().toISOString(),
      observacoesAprovacao: observacoes
    };
    await updateData('planos-aula/${plano.id}', updateData);
    setFormData(prev => ({ ...prev, ...updateData }));
    if (onClose) onClose();
  };

  const getStatusColor = () => {
    switch (formData.statusAprovacao) {
      case 'aprovado': return 'success';
      case 'rejeitado': return 'error';
      case 'pendente': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = () => {
    switch (formData.statusAprovacao) {
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      case 'pendente': return 'Pendente de Aprovação';
      default: return 'Desconhecido';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBookIcon color="primary" />
          <Typography variant="h6">
            {isEditing ? 'Editar Plano de Aula' : 'Novo Plano de Aula'}
          </Typography>
          {isEditing && (
            <Chip 
              label={getStatusText()} 
              color={getStatusColor()} 
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 2 }}>
        <Grid container spacing={3}>
          {/* Informações Básicas */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon color="primary" />
                  Informações Básicas
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Título da Aula"
                      value={formData.titulo}
                      onChange={(e) => handleInputChange('titulo', e.target.value)}
                      error={!!errors.titulo}
                      helperText={errors.titulo}
                      placeholder="Ex: Introdução às Funções Quadráticas"
                      disabled={!canEdit()}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Turma"
                      value={getNomeTurma()}
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText="Definido pela grade horária"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Disciplina"
                      value={getNomeDisciplina()}
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText="Definido pela grade horária"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Período da Aula"
                      value={formData.periodoAula}
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText="Definido pela grade horária"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Data da Aula"
                      value={formData.data}
                      onChange={(e) => handleInputChange('data', e.target.value)}
                      error={!!errors.data}
                      helperText={errors.data || 'Data deve estar dentro do período letivo da turma'}
                      InputLabelProps={{ shrink: true }}
                      disabled={!canEdit()}
                      inputProps={{
                        min: getDataMinima(),
                        max: getDataMaxima()
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={3} md={4}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Hora Início"
                      value={formData.horaInicio}
                      onChange={(e) => handleInputChange('horaInicio', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={6} sm={3} md={4}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Hora Fim"
                      value={formData.horaFim}
                      onChange={(e) => handleInputChange('horaFim', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Competências BNCC */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" />
                  Competências BNCC
                </Typography>
                
                <Autocomplete
                  multiple
                  options={competenciasBNCC}
                  value={formData.bncc || []}
                  onChange={(event, newValue) => {
                    handleInputChange('bncc', newValue);
                  }}
                  getOptionLabel={(option) => `${option.codigo} - ${option.descricao}`}
                  filterOptions={(options, { inputValue }) => {
                    return options.filter(option =>
                      option.codigo.toLowerCase().includes(inputValue.toLowerCase()) ||
                      option.descricao.toLowerCase().includes(inputValue.toLowerCase())
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecione as competências BNCC"
                      placeholder="Digite para buscar (ex: EF01LP01)"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option.codigo}
                        {...getTagProps({ index })}
                        key={option.codigo}
                        size="small"
                        color="primary"
                      />
                    ))
                  }
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ display: 'block !important' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {option.codigo}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.descricao}
                      </Typography>
                    </Box>
                  )}
                  sx={{ mb: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Objetivos */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PsychologyIcon color="primary" />
                  Objetivos da Aula
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Novo objetivo"
                    value={novoObjetivo}
                    onChange={(e) => setNovoObjetivo(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddObjetivo()}
                    placeholder="Ex: Compreender o conceito de função quadrática"
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddObjetivo}
                    disabled={!novoObjetivo.trim()}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                
                {errors.objetivos && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.objetivos}
                  </Alert>
                )}
                
                <List dense>
                  {formData.objetivos.map((objetivo, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText 
                        primary={objetivo}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          size="small" 
                          onClick={() => handleRemoveObjetivo(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recursos */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon color="primary" />
                  Recursos Necessários
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Novo recurso"
                    value={novoRecurso}
                    onChange={(e) => setNovoRecurso(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddRecurso()}
                    placeholder="Ex: Projetor, lousa digital, calculadora"
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddRecurso}
                    disabled={!novoRecurso.trim()}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.recursos.map((recurso, index) => (
                    <Chip
                      key={index}
                      label={recurso}
                      onDelete={() => handleRemoveRecurso(index)}
                      size="small"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Conteúdo Programático */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Conteúdo Programático"
              value={formData.conteudoProgramatico}
              onChange={(e) => handleInputChange('conteudoProgramatico', e.target.value)}
              error={!!errors.conteudoProgramatico}
              helperText={errors.conteudoProgramatico || 'Descreva o conteúdo que será abordado na aula'}
              placeholder="Ex: Definição de função quadrática, forma geral f(x) = ax² + bx + c, coeficientes e suas interpretações..."
            />
          </Grid>

          {/* Metodologia */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Metodologia"
              value={formData.metodologia}
              onChange={(e) => handleInputChange('metodologia', e.target.value)}
              placeholder="Ex: Aula expositiva com exemplos práticos, exercícios em grupo..."
            />
          </Grid>

          {/* Avaliação */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Forma de Avaliação"
              value={formData.avaliacao}
              onChange={(e) => handleInputChange('avaliacao', e.target.value)}
              placeholder="Ex: Exercícios em sala, participação, prova..."
            />
          </Grid>

          {/* Leitura Obrigatória e Tarefa de Casa */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Leitura Obrigatória"
              value={formData.leituraObrigatoria}
              onChange={(e) => handleInputChange('leituraObrigatoria', e.target.value)}
              placeholder="Ex: Capítulo 5 do livro didático, páginas 125-140"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Tarefa de Casa"
              value={formData.tarefaCasa}
              onChange={(e) => handleInputChange('tarefaCasa', e.target.value)}
              placeholder="Ex: Exercícios 1 a 10 da página 145"
            />
          </Grid>

          {/* Observações */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Observações"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais sobre a aula..."
            />
          </Grid>

          {/* Status de Publicação */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.publicado}
                      onChange={(e) => handleInputChange('publicado', e.target.checked)}
                    />
                  }
                  label="Publicar plano de aula"
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Planos publicados ficam visíveis para a coordenação e podem ser aprovados.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Botões de aprovação - só para coordenadores */}
            {isCoordinator() && isEditing && formData.statusAprovacao === 'pendente' && (
              <>
                <Button 
                  onClick={handleApprovar} 
                  variant="contained" 
                  color="success"
                  size="small"
                >
                  Aprovar
                </Button>
                <Button 
                  onClick={() => handleRejeitar()} 
                  variant="contained" 
                  color="error"
                  size="small"
                >
                  Rejeitar
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
                startIcon={<SaveIcon />}
                sx={{ minWidth: 120 }}
              >
                {isEditing ? 'Salvar Alterações' : 'Criar Plano'}
              </Button>
            )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EditorPlanoAula;