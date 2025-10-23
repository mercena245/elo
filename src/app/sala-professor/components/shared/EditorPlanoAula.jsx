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
  Autocomplete,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse
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
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useSchoolDatabase } from '../../../../hooks/useSchoolDatabase';
import { FAIXAS_ETARIAS, obterCompetenciasFlat } from './competenciasBNCC';

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
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();
  
  const [formData, setFormData] = useState({
    titulo: '',
    turmaId: '',
    disciplinaId: '',
    data: '',
    horaInicio: '',
    horaFim: '',
    faixaEtaria: '', // NOVO: Seletor de faixa etária
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
  const [competenciasDisponiveis, setCompetenciasDisponiveis] = useState([]); // NOVO: Competências filtradas por faixa etária
  
  // Estados para dialog de rejeição
  const [dialogRejeitar, setDialogRejeitar] = useState(false);
  const [observacoesRejeicao, setObservacoesRejeicao] = useState('');
  const [dialogHistorico, setDialogHistorico] = useState(false);
  const [historicoExpanded, setHistoricoExpanded] = useState(false);
  
  // Estados para modais modernos e dropdowns
  const [infoRevisaoExpanded, setInfoRevisaoExpanded] = useState(false);
  const [modalRevisaoProfessora, setModalRevisaoProfessora] = useState(false);
  const [modalRevisaoCoordenadora, setModalRevisaoCoordenadora] = useState(false);

  // NOVO: Atualizar competências quando faixa etária mudar
  useEffect(() => {
    if (formData.faixaEtaria) {
      const competencias = obterCompetenciasFlat(formData.faixaEtaria);
      setCompetenciasDisponiveis(competencias);
      console.log(`📚 Competências carregadas para ${formData.faixaEtaria}:`, competencias.length);
    } else {
      setCompetenciasDisponiveis([]);
    }
  }, [formData.faixaEtaria]);

  // NOVO: Abrir modais informativos quando necessário
  useEffect(() => {
    if (open && formData.statusAprovacao === 'em_revisao') {
      if (!isCoordinator()) {
        // Professora vê modal laranja
        setModalRevisaoProfessora(true);
      } else {
        // Coordenadora vê modal azul
        setModalRevisaoCoordenadora(true);
      }
    }
  }, [open, formData.statusAprovacao]);

  useEffect(() => {
    if (open) {
      console.log('🔄 [EditorPlanoAula useEffect] Executando...', {
        open,
        isEditing,
        planoId: plano?.id,
        statusAprovacao: plano?.statusAprovacao
      });
      
      if (isEditing && plano) {
        // Editando plano existente
        console.log('📝 [EditorPlanoAula useEffect] Carregando plano existente:', {
          id: plano.id,
          titulo: plano.titulo,
          statusAprovacao: plano.statusAprovacao,
          observacoesAprovacao: plano.observacoesAprovacao,
          historicoRevisoes: plano.historicoRevisoes?.length || 0
        });
        
        setFormData({
          titulo: plano.titulo || '',
          turmaId: plano.turmaId || '',
          disciplinaId: plano.disciplinaId || '',
          data: plano.data || '',
          horaInicio: plano.horaInicio || '',
          horaFim: plano.horaFim || '',
          periodoAula: plano.periodoAula || '',
          faixaEtaria: plano.faixaEtaria || '', // NOVO
          bncc: plano.bncc || [],
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
          observacoesAprovacao: plano.observacoesAprovacao || '',
          aprovadoPor: plano.aprovadoPor || '',
          dataAprovacao: plano.dataAprovacao || '',
          publicado: plano.publicado || false
        });
        
        console.log('✅ [EditorPlanoAula useEffect] FormData atualizado com status:', plano.statusAprovacao);
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
          faixaEtaria: '', // NOVO
          bncc: [], // NOVO
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
            const periodo = await getData(`Escola/Periodo/${periodoId}`);
            
            if (periodo) {
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
  }, [formData.turmaId, turmas, isReady, getData]);

  // Funções para obter nomes para exibição
  const getNomeTurma = () => {
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

    if (!formData.faixaEtaria) {
      newErrors.faixaEtaria = 'Faixa etária é obrigatória';
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
      console.log('💾 [handleSave] Salvando plano...', {
        statusAtual: formData.statusAprovacao,
        isCoordinator: isCoordinator(),
        planoId: plano?.id
      });
      
      const dadosPlano = {
        ...formData,
        id: plano?.id || Date.now().toString(),
        criadoEm: plano?.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };
      
      // NOVO: Se a coordenadora está editando um plano em revisão, salva e aprova automaticamente
      if (formData.statusAprovacao === 'em_revisao' && isCoordinator()) {
        console.log('✅ [handleSave] Coordenadora editando plano em revisão! Salvando e aprovando...');
        dadosPlano.statusAprovacao = 'aprovado';
        dadosPlano.observacoesAprovacao = ''; // Limpa as observações
        dadosPlano.aprovadoPor = user?.uid || '';
        dadosPlano.dataAprovacao = new Date().toISOString();
        console.log('🔄 [handleSave] Novo status: aprovado (pela coordenadora)');
      }
      // Se a professora está editando um plano em revisão, volta para pendente
      else if (formData.statusAprovacao === 'em_revisao' && !isCoordinator()) {
        console.log('✅ [handleSave] Professora editando plano em revisão! Voltando para pendente...');
        dadosPlano.statusAprovacao = 'pendente';
        dadosPlano.observacoesAprovacao = ''; // Limpa as observações anteriores
        console.log('🔄 [handleSave] Novo status:', dadosPlano.statusAprovacao);
      }
      
      console.log('📤 [handleSave] Dados finais a serem salvos:', {
        id: dadosPlano.id,
        statusAprovacao: dadosPlano.statusAprovacao,
        observacoesAprovacao: dadosPlano.observacoesAprovacao
      });
      
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
    // Professora pode editar se estiver pendente, em_revisao ou rejeitado
    return formData.statusAprovacao === 'rejeitado' || 
           formData.statusAprovacao === 'em_revisao' || 
           formData.statusAprovacao === 'pendente';
  };

  // Aprovação/rejeição: atualiza apenas status e campos de aprovação no Firebase
  const handleApprovar = async () => {
    if (!plano?.id) return;
    
    console.log('✅ [handleApprovar] Aprovando plano:', plano.id);
    
    const dadosAtualizacao = {
      statusAprovacao: 'aprovado',
      aprovadoPor: user?.uid || '',
      dataAprovacao: new Date().toISOString(),
      observacoesAprovacao: ''
    };
    
    try {
      await updateData(`planos-aula/${plano.id}`, dadosAtualizacao);
      console.log('✅ [handleApprovar] Plano aprovado com sucesso no Firebase');
      
      // Fecha o editor para forçar reload ao reabrir
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('❌ [handleApprovar] Erro ao aprovar:', error);
    }
  };

  const handleRejeitar = async () => {
    if (!plano?.id) return;
    
    // Validar se há observações
    if (!observacoesRejeicao.trim()) {
      return; // Validação já é feita pelo botão disabled
    }
    
    console.log('🔄 [EditorPlanoAula] Solicitando revisão do plano:', plano.id);
    
    // Criar histórico de revisões
    const historicoRevisao = {
      data: new Date().toISOString(),
      solicitadoPor: user?.uid || '',
      observacoes: observacoesRejeicao.trim()
    };
    
    // Buscar histórico existente ou criar novo
    const historicoExistente = plano.historicoRevisoes || [];
    
    const dadosAtualizacao = {
      statusAprovacao: 'em_revisao',
      aprovadoPor: user?.uid || '',
      dataAprovacao: new Date().toISOString(),
      observacoesAprovacao: observacoesRejeicao.trim(),
      historicoRevisoes: [...historicoExistente, historicoRevisao]
    };
    
    console.log('💾 [EditorPlanoAula] Dados de atualização:', dadosAtualizacao);
    
    try {
      await updateData(`planos-aula/${plano.id}`, dadosAtualizacao);
      console.log('✅ [EditorPlanoAula] Plano atualizado com sucesso - Revisão solicitada!');
      
      // Limpar dialog
      setDialogRejeitar(false);
      setObservacoesRejeicao('');
      
      // Fechar editor para forçar reload
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('❌ [EditorPlanoAula] Erro ao solicitar revisão:', error);
    }
  };

  const getStatusColor = () => {
    switch (formData.statusAprovacao) {
      case 'aprovado': return 'success';
      case 'rejeitado': return 'error';
      case 'em_revisao': return 'warning';
      case 'pendente': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = () => {
    switch (formData.statusAprovacao) {
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      case 'em_revisao': return 'Em Revisão';
      case 'pendente': return 'Pendente de Aprovação';
      default: return 'Desconhecido';
    }
  };

  return (
    <>
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
        {/* Card de Informações de Revisão - Dropdown Colapsável */}
        {formData.statusAprovacao === 'em_revisao' && formData.observacoesAprovacao && (
          <Card 
            variant="outlined" 
            sx={{ 
              mb: 3, 
              border: '2px solid',
              borderColor: isCoordinator() ? 'info.main' : 'warning.main',
              bgcolor: isCoordinator() ? '#E3F2FD' : '#FFF3E0'
            }}
          >
            <CardContent sx={{ pb: 1 }}>
              <Box 
                onClick={() => setInfoRevisaoExpanded(!infoRevisaoExpanded)}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.02)'
                  },
                  p: 1,
                  borderRadius: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AssessmentIcon color={isCoordinator() ? 'info' : 'warning'} sx={{ fontSize: '2rem' }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {isCoordinator() 
                        ? 'ℹ️ Plano aguardando revisão' 
                        : '⚠️ Plano precisa de revisão'
                      }
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Clique para {infoRevisaoExpanded ? 'ocultar' : 'ver'} detalhes
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {plano?.historicoRevisoes && plano.historicoRevisoes.length > 0 && (
                    <Chip 
                      label={`${plano.historicoRevisoes.length} revisão(ões)`}
                      size="small"
                      color="warning"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDialogHistorico(true);
                      }}
                    />
                  )}
                  <IconButton size="small">
                    <ExpandMoreIcon 
                      sx={{ 
                        transform: infoRevisaoExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s'
                      }}
                    />
                  </IconButton>
                </Box>
              </Box>
              
              <Collapse in={infoRevisaoExpanded}>
                <Divider sx={{ my: 2 }} />
                
                {!isCoordinator() ? (
                  // Informações para Professora
                  <>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                      📝 Observações da Coordenadora:
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        bgcolor: 'white', 
                        p: 2, 
                        borderRadius: 1,
                        border: '1px solid #FFB74D',
                        whiteSpace: 'pre-wrap',
                        mb: 2
                      }}
                    >
                      {formData.observacoesAprovacao}
                    </Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        💡 Faça as correções necessárias e clique em <strong>"Salvar Alterações"</strong> para reenviar o plano à aprovação.
                      </Typography>
                    </Alert>
                  </>
                ) : (
                  // Informações para Coordenadora
                  <>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Este plano está aguardando que a professora faça as correções solicitadas.
                    </Typography>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ✓ Você pode editar este plano diretamente
                      </Typography>
                      <Typography variant="body2">
                        Caso a professora não possa fazer as alterações em tempo hábil, você pode editar e ao clicar em <strong>"Salvar e Aprovar"</strong>, o plano será automaticamente aprovado.
                      </Typography>
                    </Alert>
                    {formData.observacoesAprovacao && (
                      <>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                          📝 Suas observações para a professora:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            bgcolor: 'white', 
                            p: 2, 
                            borderRadius: 1,
                            border: '1px solid #42A5F5',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {formData.observacoesAprovacao}
                        </Typography>
                      </>
                    )}
                  </>
                )}
              </Collapse>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Revisões - Visível para Coordenadoras após plano voltar para pendente */}
        {isCoordinator() && plano?.historicoRevisoes && plano.historicoRevisoes.length > 0 && (
          <Card 
            variant="outlined" 
            sx={{ 
              mb: 3, 
              border: '1px solid #90CAF9',
              bgcolor: '#E3F2FD'
            }}
          >
            <CardContent sx={{ pb: 2 }}>
              <Box 
                onClick={() => setHistoricoExpanded(!historicoExpanded)}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.02)'
                  },
                  p: 1,
                  borderRadius: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon color="info" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    📋 Histórico de Revisões Solicitadas ({plano.historicoRevisoes.length})
                  </Typography>
                </Box>
                <IconButton size="small">
                  <ExpandMoreIcon 
                    sx={{ 
                      transform: historicoExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s'
                    }}
                  />
                </IconButton>
              </Box>
              
              <Collapse in={historicoExpanded}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" display="block" sx={{ mb: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                  💡 Utilize este histórico para validar se as correções solicitadas foram realizadas pela professora.
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {plano.historicoRevisoes
                    .sort((a, b) => new Date(b.data) - new Date(a.data))
                    .map((revisao, index) => (
                      <Card 
                        key={index} 
                        variant="outlined" 
                        sx={{ 
                          bgcolor: 'white',
                          borderLeft: '4px solid #FF9800'
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Chip 
                              label={`Revisão #${plano.historicoRevisoes.length - index}`}
                              size="small"
                              color="warning"
                              variant="filled"
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              {new Date(revisao.data).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ 
                            bgcolor: '#FFF3E0', 
                            p: 2, 
                            borderRadius: 1,
                            border: '1px solid #FFB74D',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {revisao.observacoes}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        )}
        
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
                
                {/* NOVO: Seletor de Faixa Etária */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="faixa-etaria-label">Faixa Etária / Nível de Ensino *</InputLabel>
                  <Select
                    labelId="faixa-etaria-label"
                    value={formData.faixaEtaria}
                    label="Faixa Etária / Nível de Ensino *"
                    onChange={(e) => {
                      handleInputChange('faixaEtaria', e.target.value);
                      handleInputChange('bncc', []); // Limpa competências ao mudar faixa
                    }}
                    error={!!errors.faixaEtaria}
                    required
                  >
                    {FAIXAS_ETARIAS.map((faixa) => (
                      <MenuItem key={faixa.id} value={faixa.id}>
                        {faixa.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.faixaEtaria && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.faixaEtaria}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Selecione a faixa etária para carregar as competências específicas da BNCC
                  </Typography>
                </FormControl>
                
                {/* Autocomplete - só aparece após selecionar faixa etária */}
                {formData.faixaEtaria && competenciasDisponiveis.length > 0 && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {competenciasDisponiveis.length} competências disponíveis para esta faixa etária
                    </Typography>
                    
                    <Autocomplete
                      multiple
                      options={competenciasDisponiveis}
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
                          placeholder="Digite para buscar (ex: EF01LP01, EI03EO01)"
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
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps} sx={{ display: 'block !important' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {option.codigo}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.descricao}
                            </Typography>
                          </Box>
                        );
                      }}
                      sx={{ mb: 1 }}
                    />
                  </>
                )}
                
                {!formData.faixaEtaria && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Selecione uma faixa etária acima para visualizar e escolher as competências da BNCC
                  </Alert>
                )}
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
                  {Array.isArray(formData.recursos) && formData.recursos.map((recurso, index) => (
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
    
    {/* Dialog de Histórico de Revisões */}
    <Dialog 
      open={dialogHistorico} 
      onClose={() => setDialogHistorico(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: 'info.light', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          <Typography variant="h6">Histórico de Revisões</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {plano?.historicoRevisoes && plano.historicoRevisoes.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {plano.historicoRevisoes
              .sort((a, b) => new Date(b.data) - new Date(a.data)) // Mais recente primeiro
              .map((revisao, index) => (
                <Card key={index} variant="outlined" sx={{ bgcolor: '#f5f5f5' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip 
                        label={`Revisão #${plano.historicoRevisoes.length - index}`}
                        size="small"
                        color="warning"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(revisao.data).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ 
                      bgcolor: 'white', 
                      p: 2, 
                      borderRadius: 1,
                      border: '1px solid #ddd',
                      whiteSpace: 'pre-wrap'
                    }}>
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
    
    {/* Dialog de Rejeição com Observações */}
    <Dialog 
      open={dialogRejeitar} 
      onClose={() => setDialogRejeitar(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: 'error.light', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon />
          <Typography variant="h6">Solicitar Revisão do Plano</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Informe à professora o que precisa ser corrigido ou melhorado no planejamento.
        </Alert>
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={6}
          label="Observações para a Professora *"
          value={observacoesRejeicao}
          onChange={(e) => setObservacoesRejeicao(e.target.value)}
          placeholder="Exemplo: Por favor, revise os objetivos de aprendizagem para alinhá-los melhor com as competências da BNCC selecionadas. Além disso, especifique os recursos didáticos que serão utilizados na atividade prática."
          helperText="Seja específico(a) sobre o que precisa ser ajustado"
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

    {/* Modal Moderno - Professora precisa revisar */}
    <Dialog 
      open={modalRevisaoProfessora} 
      onClose={() => setModalRevisaoProfessora(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(255, 152, 0, 0.2)'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'warning.light', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        pb: 2
      }}>
        <Box sx={{ 
          bgcolor: 'white', 
          borderRadius: '50%', 
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <AssessmentIcon sx={{ fontSize: '2rem', color: 'warning.main' }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Revisão Necessária
          </Typography>
          <Typography variant="caption">
            Observações da coordenadora
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Este plano precisa de correções antes da aprovação
          </Typography>
        </Alert>
        
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          📝 Observações:
        </Typography>
        <Box sx={{ 
          bgcolor: '#FFF3E0', 
          p: 2.5, 
          borderRadius: 2,
          border: '2px solid #FFB74D',
          mb: 3
        }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {formData.observacoesAprovacao}
          </Typography>
        </Box>

        <Alert severity="info" icon={false} sx={{ bgcolor: '#E3F2FD' }}>
          <Typography variant="body2">
            <strong>💡 Próximos passos:</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            1. Realize as correções solicitadas<br/>
            2. Clique em "Salvar Alterações"<br/>
            3. O plano voltará para análise da coordenadora
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={() => setModalRevisaoProfessora(false)} 
          variant="contained"
          fullWidth
        >
          Entendi, vou corrigir
        </Button>
      </DialogActions>
    </Dialog>

    {/* Modal Moderno - Coordenadora pode editar */}
    <Dialog 
      open={modalRevisaoCoordenadora} 
      onClose={() => setModalRevisaoCoordenadora(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(33, 150, 243, 0.2)'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'info.light', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        pb: 2
      }}>
        <Box sx={{ 
          bgcolor: 'white', 
          borderRadius: '50%', 
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <AssessmentIcon sx={{ fontSize: '2rem', color: 'info.main' }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Plano em Revisão
          </Typography>
          <Typography variant="caption">
            Aguardando professora
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Este plano está aguardando que a professora realize as correções solicitadas.
          </Typography>
        </Alert>

        <Alert severity="success" icon={false} sx={{ bgcolor: '#E8F5E9', mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'success.dark' }}>
            ✓ Você tem permissão para editar
          </Typography>
          <Typography variant="body2" sx={{ color: 'success.dark' }}>
            Caso a professora não possa fazer as alterações em tempo hábil, você pode editar o plano diretamente.
          </Typography>
        </Alert>

        <Box sx={{ 
          bgcolor: '#F5F5F5', 
          p: 2.5, 
          borderRadius: 2,
          border: '1px solid #E0E0E0'
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SaveIcon sx={{ fontSize: '1.2rem' }} />
            Ao salvar suas alterações:
          </Typography>
          <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold', pl: 3 }}>
            → O plano será automaticamente aprovado
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', pl: 3, mt: 0.5 }}>
            Não será necessário aprovar novamente
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={() => setModalRevisaoCoordenadora(false)} 
          variant="contained"
          fullWidth
        >
          Entendi
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default EditorPlanoAula;