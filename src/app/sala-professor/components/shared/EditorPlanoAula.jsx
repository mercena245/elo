"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  ListItemSecondaryAction
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
import { ref, get } from 'firebase/database';
import { db } from '../../../../firebase';

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
  const [formData, setFormData] = useState({
    titulo: '',
    turmaId: '',
    disciplinaId: '',
    data: '',
    horaInicio: '',
    horaFim: '',
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
            horaFim: dadosIniciais.horaFim || ''
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
      
      onSave(dadosPlano);
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
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ minWidth: '250px' }}>
                      <InputLabel>Turma</InputLabel>
                      <Select
                        value={formData.turmaId}
                        onChange={(e) => handleInputChange('turmaId', e.target.value)}
                        label="Turma"
                        error={!!errors.turmaId}
                      >
                        {getTurmasDisponiveis().map((turma) => (
                          <MenuItem key={turma.id} value={turma.id}>
                            {turma.nome} {turma.ano && `- ${turma.ano}`} {turma.turno && `(${turma.turno})`}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.turmaId && (
                        <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                          {errors.turmaId}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ minWidth: '250px' }}>
                      <InputLabel>Disciplina</InputLabel>
                      <Select
                        value={formData.disciplinaId}
                        onChange={(e) => handleInputChange('disciplinaId', e.target.value)}
                        label="Disciplina"
                        error={!!errors.disciplinaId}
                      >
                        {getDisciplinasDisponiveis().map((disciplina) => (
                          <MenuItem key={disciplina.id} value={disciplina.id}>
                            {disciplina.nome || disciplina.nomeDisciplina || 'Nome não definido'}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.disciplinaId && (
                        <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                          {errors.disciplinaId}
                        </Typography>
                      )}
                    </FormControl>
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
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          startIcon={<SaveIcon />}
          sx={{ minWidth: 120 }}
        >
          {isEditing ? 'Salvar Alterações' : 'Criar Plano'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditorPlanoAula;