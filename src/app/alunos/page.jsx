
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SidebarMenu from '../../components/SidebarMenu';
import { 
  Card, 
  CardContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Box, 
  CircularProgress, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText,
  DialogActions, 
  Button, 
  TextField, 
  Alert,
  IconButton,
  Collapse,
  Chip,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ContentCopy from '@mui/icons-material/ContentCopy';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';
import Print from '@mui/icons-material/Print';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { auth, onAuthStateChanged } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";


import FichaMatricula from '../../components/FichaMatricula';
import ContratoAluno from '../../components/ContratoAlunoNovo';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
import { useSchoolServices } from '../../hooks/useSchoolServices';
import RematriculaDialog from './components/RematriculaDialog';
import HistoricoMatriculaDialog from './components/HistoricoMatriculaDialog';
import HistoricoMatriculaService from '../../services/historicoMatriculaService';

// Componente para indicador de pré-matrícula
const PreMatriculaIndicator = ({ aluno, financeiroService }) => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarInfo = async () => {
      try {
        if (!financeiroService || !financeiroService.buscarTitulosAluno) {
          setLoading(false);
          return;
        }

        const resultado = await financeiroService.buscarTitulosAluno(aluno.id);
        
        if (resultado.success && resultado.titulos) {
          const tituloMatricula = resultado.titulos.find(t => t.tipo === 'matricula');
          const tituloMateriais = resultado.titulos.find(t => t.tipo === 'materiais');
          
          const pendencias = [];
          if (tituloMatricula && tituloMatricula.status === 'pendente') {
            pendencias.push(`💳 R$ ${(tituloMatricula.valor || 0).toFixed(2)}`);
          }
          if (tituloMateriais && tituloMateriais.status === 'pendente') {
            pendencias.push(`📚 R$ ${(tituloMateriais.valor || 0).toFixed(2)}`);
          }
          
          setInfo({
            pendencias,
            temPendencias: pendencias.length > 0,
            matriculaPaga: !tituloMatricula || tituloMatricula.status === 'pago',
            materiaisPago: !tituloMateriais || tituloMateriais.status === 'pago'
          });
        }
      } catch (error) {
        console.error('Erro ao buscar info pré-matrícula:', error);
      }
      setLoading(false);
    };

    buscarInfo();
  }, [aluno.id]);

  if (loading) {
    return (
      <Chip 
        label="🔄" 
        size="small"
        sx={{ 
          bgcolor: '#f3f4f6', 
          color: '#6b7280',
          fontSize: '0.7rem',
          minWidth: '32px'
        }}
      />
    );
  }

  if (!info || !info.temPendencias) {
    return (
      <Chip 
        label="✅" 
        size="small"
        sx={{ 
          bgcolor: '#dcfce7', 
          color: '#16a34a',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          minWidth: '32px'
        }}
      />
    );
  }

  const tooltipText = `Pendente: ${info.pendencias.join(', ')}`;

  return (
    <Chip 
      label={`💰 ${info.pendencias.length}`}
      size="small"
      title={tooltipText}
      sx={{ 
        bgcolor: '#fef3c7', 
        color: '#d97706',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        minWidth: '40px',
        cursor: 'help'
      }}
    />
  );
};

// Componente para indicador de rematrícula aguardando pagamento
const RematriculaIndicator = ({ aluno, financeiroService }) => {
  const [aguardando, setAguardando] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificar = async () => {
      try {
        // Verificar se tem flag de rematrícula recente
        if (!aluno.dataRematricula || aluno.status === 'ativo') {
          setLoading(false);
          return;
        }

        if (!financeiroService?.buscarTitulosAluno) {
          setLoading(false);
          return;
        }

        const resultado = await financeiroService.buscarTitulosAluno(aluno.id);
        if (!resultado.success || !resultado.titulos) {
          setLoading(false);
          return;
        }

        // Buscar títulos de matrícula e materiais pendentes criados após rematrícula
        const titulosRecentes = resultado.titulos.filter(t => 
          (t.tipo === 'matricula' || t.tipo === 'materiais') && 
          t.status === 'pendente' &&
          t.createdAt && new Date(t.createdAt) >= new Date(aluno.dataRematricula)
        );

        setAguardando(titulosRecentes.length > 0);
      } catch (error) {
        console.error('Erro ao verificar rematrícula:', error);
      }
      setLoading(false);
    };

    verificar();
  }, [aluno.id, aluno.dataRematricula, aluno.status, financeiroService]);

  if (loading || !aguardando) return null;

  return (
    <Chip 
      label="🔄 Rematriculado"
      size="small"
      title="Aguardando pagamento de matrícula/materiais"
      sx={{ 
        bgcolor: '#e0f2fe', 
        color: '#0369a1',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        cursor: 'help'
      }}
    />
  );
};

// Componente para botão de atalho de inadimplência
const InadimplenciaBotaoAtalho = ({ aluno }) => {
  const router = useRouter();
  const { financeiroService } = useSchoolServices();
  const [titulosEmAtraso, setTitulosEmAtraso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const buscarTitulosEmAtraso = async () => {
      try {
        if (!financeiroService?.buscarTitulosAluno) {
          setLoading(false);
          return;
        }

        const resultado = await financeiroService.buscarTitulosAluno(aluno.id, { status: 'pendente' });
        
        if (resultado.success && resultado.titulos) {
          const hoje = new Date().toISOString().split('T')[0];
          const titulosVencidos = resultado.titulos.filter(titulo => titulo.vencimento < hoje);
          setTitulosEmAtraso(titulosVencidos);
        }
      } catch (error) {
        console.error('Erro ao buscar títulos em atraso:', error);
      }
      setLoading(false);
    };

    buscarTitulosEmAtraso();
  }, [aluno.id, financeiroService]);

  const handleClickTitulo = (titulo) => {
    // Fechar modal
    setModalOpen(false);
    
    // Redirecionar para financeiro com filtros específicos do título
    const params = new URLSearchParams({
      tab: 'titulos',
      aluno: aluno.nome, // Usar nome em vez de ID para o filtro
      status: 'vencido', // Usar 'vencido' (singular) conforme getStatusVisual
      vencidos: 'true'
    });
    
    router.push(`/financeiro?${params.toString()}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CircularProgress size={16} />
      </Box>
    );
  }

  if (titulosEmAtraso.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setModalOpen(true)}
        sx={{
          minWidth: 'auto',
          px: 1.5,
          py: 0.5,
          borderColor: '#dc2626',
          color: '#dc2626',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          '&:hover': {
            bgcolor: '#fef2f2',
            borderColor: '#b91c1c'
          }
        }}
        title={`${titulosEmAtraso.length} título(s) em atraso`}
      >
        ⚠️ {titulosEmAtraso.length} Em Atraso
      </Button>

      {/* Modal com lista de títulos em atraso */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: '#fef2f2', 
          color: '#dc2626',
          borderBottom: '1px solid #fecaca'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>⚠️</span>
            <span>Títulos em Atraso - {aluno.nome}</span>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <List>
            {titulosEmAtraso.map((titulo, index) => {
              const diasAtraso = Math.floor((new Date() - new Date(titulo.vencimento)) / (1000 * 60 * 60 * 24));
              
              return (
                <ListItem
                  key={titulo.id || index}
                  sx={{
                    borderBottom: index < titulosEmAtraso.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: '#fef2f2'
                    }
                  }}
                  onClick={() => handleClickTitulo(titulo)}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {titulo.descricao}
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#dc2626', fontWeight: 'bold' }}>
                          R$ {(titulo.valor || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 500 }}>
                          Venceu em: {new Date(titulo.vencimento).toLocaleDateString('pt-BR')} 
                          ({diasAtraso} dia{diasAtraso !== 1 ? 's' : ''} de atraso)
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          Tipo: {titulo.tipo} | Clique para ver no financeiro
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        
        <DialogActions sx={{ 
          px: 3, 
          py: 2, 
          bgcolor: '#f9fafb',
          borderTop: '1px solid #e5e7eb'
        }}>
          <Button 
            onClick={() => setModalOpen(false)}
            sx={{ color: '#6b7280' }}
          >
            Fechar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setModalOpen(false);
              const params = new URLSearchParams({
                tab: 'titulos',
                aluno: aluno.nome, // Usar nome em vez de ID
                status: 'pendente',
                vencidos: 'true'
              });
              router.push(`/financeiro?${params.toString()}`);
            }}
            sx={{
              bgcolor: '#dc2626',
              '&:hover': {
                bgcolor: '#b91c1c'
              }
            }}
          >
            Ir para Financeiro
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Componente para detalhes de pré-matrícula
const PreMatriculaDetalhes = ({ aluno }) => {
  const [detalhes, setDetalhes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarDetalhes = async () => {
      try {
        if (!financeiroService || !financeiroService.buscarTitulosAluno) {
          setLoading(false);
          return;
        }

        const resultado = await financeiroService.buscarTitulosAluno(aluno.id);
        
        if (resultado.success && resultado.titulos) {
          const tituloMatricula = resultado.titulos.find(t => t.tipo === 'matricula');
          const tituloMateriais = resultado.titulos.find(t => t.tipo === 'materiais');
          
          setDetalhes({
            matricula: tituloMatricula,
            materiais: tituloMateriais,
            totalPendente: [tituloMatricula, tituloMateriais]
              .filter(t => t && t.status === 'pendente')
              .reduce((sum, t) => sum + (t.valor || 0), 0)
          });
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes pré-matrícula:', error);
      }
      setLoading(false);
    };

    buscarDetalhes();
  }, [aluno.id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography component="span" variant="body2" sx={{ color: '#64748b' }}>
          Carregando informações de pagamento...
        </Typography>
      </Box>
    );
  }

  if (!detalhes) {
    return (
      <Typography component="div" variant="body2" sx={{ color: '#dc2626' }}>
        ❌ Erro ao carregar informações de pagamento
      </Typography>
    );
  }

  const getStatusIcon = (titulo) => {
    if (!titulo) return '➖';
    return titulo.status === 'pago' ? '✅' : '⏳';
  };

  const getStatusText = (titulo) => {
    if (!titulo) return 'Não aplicável';
    return titulo.status === 'pago' ? 'PAGO' : 'PENDENTE';
  };

  const getStatusColor = (titulo) => {
    if (!titulo) return '#6b7280';
    return titulo.status === 'pago' ? '#059669' : '#d97706';
  };

  return (
    <Box>
      <Typography component="div" variant="body2" sx={{ color: '#92400e', mb: 1 }}>
        📋 Situação dos Pagamentos Obrigatórios
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
        <Box>
          <Typography component="div" variant="body2" sx={{ 
            color: getStatusColor(detalhes.matricula),
            fontWeight: 500 
          }}>
            {getStatusIcon(detalhes.matricula)} Taxa de Matrícula: {getStatusText(detalhes.matricula)}
          </Typography>
          {detalhes.matricula && (
            <Typography component="span" variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Valor: R$ {(detalhes.matricula.valor || 0).toFixed(2)}
              {detalhes.matricula.vencimento && ` | Vencimento: ${new Date(detalhes.matricula.vencimento).toLocaleDateString('pt-BR')}`}
            </Typography>
          )}
        </Box>
        
        <Box>
          <Typography component="div" variant="body2" sx={{ 
            color: getStatusColor(detalhes.materiais),
            fontWeight: 500 
          }}>
            {getStatusIcon(detalhes.materiais)} Taxa de Materiais: {getStatusText(detalhes.materiais)}
          </Typography>
          {detalhes.materiais && (
            <Typography component="span" variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Valor: R$ {(detalhes.materiais.valor || 0).toFixed(2)}
              {detalhes.materiais.vencimento && ` | Vencimento: ${new Date(detalhes.materiais.vencimento).toLocaleDateString('pt-BR')}`}
            </Typography>
          )}
        </Box>
      </Box>
      
      {detalhes.totalPendente > 0 ? (
        <Alert severity="warning" sx={{ mt: 1 }}>
          <span style={{ fontSize: '0.875rem' }}>
            💰 <strong>Total pendente: R$ {detalhes.totalPendente.toFixed(2)}</strong><br />
            ⚠️ O aluno será ativado automaticamente após quitação dos valores obrigatórios.
          </span>
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mt: 1 }}>
          <span style={{ fontSize: '0.875rem' }}>
            🎉 <strong>Todos os pagamentos obrigatórios foram realizados!</strong><br />
            ✅ O aluno será ativado automaticamente na próxima verificação.
          </span>
        </Alert>
      )}
    </Box>
  );
};

const Alunos = () => {
  // Router para navegação
  const router = useRouter();
  
  // Services multi-tenant
  const { auditService, financeiroService, LOG_ACTIONS, isReady: servicesReady } = useSchoolServices();

  // Hook para acessar banco da escola
  const { getData, setData, isReady, error: dbError, currentSchool, storage: schoolStorage, db } = useSchoolDatabase();
  
  // Instância do serviço de histórico de matrículas
  const historicoMatriculaService = new HistoricoMatriculaService(db, getData, null);
  
  // Marcar/desmarcar anexo para exclusão (por nome)
  const handleMarcarParaExcluir = (nome) => {
    setAnexosParaExcluir(prev =>
      prev.includes(nome) ? prev.filter(n => n !== nome) : [...prev, nome]
    );
  };
  // Estado para anexos marcados para exclusão
  const [anexosParaExcluir, setAnexosParaExcluir] = useState([]);
  // Estado para dialog de anexos enviados
  const [dialogAnexosOpen, setDialogAnexosOpen] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState({});
  const [loading, setLoading] = useState(true);
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editAluno, setEditAluno] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [roleChecked, setRoleChecked] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('Sistema');
  const [formError, setFormError] = useState('');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroMatricula, setFiltroMatricula] = useState('');
 // const [formStep, setFormStep] = useState(1); // 1 = dados pessoais, 2 = dados financeiros
  const [financeiroError, setFinanceiroError] = useState('');
  const [gerandoTitulos, setGerandoTitulos] = useState(false);
  const [resultadoTitulos, setResultadoTitulos] = useState(null);
  const [statusMatricula, setStatusMatricula] = useState(null);
  const [inativarDialogOpen, setInativarDialogOpen] = useState(false);
  const [inativarMotivo, setInativarMotivo] = useState('');
  // Estados para inadimplência
  const [inadimplenciaDialogOpen, setInadimplenciaDialogOpen] = useState(false);
  const [titulosEmAberto, setTitulosEmAberto] = useState([]);
  const [carregandoTitulos, setCarregandoTitulos] = useState(false);
  // Estados para histórico de matrícula
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false);
  const [alunoHistorico, setAlunoHistorico] = useState(null);
  // Estado para controlar expansão dos cards
  const [cardsExpandidos, setCardsExpandidos] = useState({});
  // Estados para anexos temporários
  const [anexosSelecionados, setAnexosSelecionados] = useState([]);
  const inputFileRef = useRef(null);
  // Estados para informações de pré-matrícula
  const [infoPreMatricula, setInfoPreMatricula] = useState({});
  const [verificandoPagamentos, setVerificandoPagamentos] = useState(false);
  // Estados para o novo formulário
  const [formStep, setFormStep] = useState(1); // 1=pessoais, 2=mãe, 3=pai, 4=emergência, 5=saúde
  const [dadosTurma, setDadosTurma] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [validacaoCpf, setValidacaoCpf] = useState({});
  const [fotoAluno, setFotoAluno] = useState(null);
  const inputFotoRef = useRef(null);
  // Estado para ficha de matrícula e contrato
  const [fichaMatriculaOpen, setFichaMatriculaOpen] = useState(false);
  const [contratoOpen, setContratoOpen] = useState(false);
  const [dialogSelecaoOpen, setDialogSelecaoOpen] = useState(false);
  const [alunoSelecionadoFicha, setAlunoSelecionadoFicha] = useState(null);
  // Estados para confirmação de fechamento do modal
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  // Estados para rematrícula
  const [rematriculaDialogOpen, setRematriculaDialogOpen] = useState(false);
  const [alunoRematricula, setAlunoRematricula] = useState(null);
  
  // Estados para seleção de contrato de rematrícula
  const [selecaoContratoOpen, setSelecaoContratoOpen] = useState(false);
  const [matriculasDisponiveis, setMatriculasDisponiveis] = useState([]);
  const [contratoSelecionado, setContratoSelecionado] = useState(null);

  // Estados para seleção de ficha de matrícula de rematrícula
  const [selecaoFichaOpen, setSelecaoFichaOpen] = useState(false);
  const [matriculasDisponiveisFicha, setMatriculasDisponiveisFicha] = useState([]);
  const [fichaSelecionada, setFichaSelecionada] = useState(null);

  // Remover anexo do Storage e do registro do aluno
  const handleRemoverAnexo = async (anexo, idx) => {
    if (!editForm.anexos || !editForm.anexos.length) return;
    try {
      // Remove do Storage
      const alunoId = isNew
        ? `id_aluno_${editForm.nome.replace(/\s/g, '').toLowerCase()}_${editForm.matricula}`
        : editAluno.id;
  const matricula = editForm.matricula || (editAluno && editAluno.matricula) || '';
  const fileRef = storageRef(schoolStorage, `anexos_alunos/${alunoId}_${matricula}/${anexo.name}`);
      await deleteObject(fileRef);
      // Remove do registro do aluno
      const novosAnexos = editForm.anexos.filter((_, i) => i !== idx);
      const dadosAtualizados = { ...editForm, anexos: novosAnexos };
      if (isNew) {
        const novoId = alunoId;
        await setData(`alunos/${novoId}`, dadosAtualizados);
        // Log da remoção de anexo
        await auditService.auditService?.logAction(
          LOG_ACTIONS.STUDENT_FILE_DELETE,
          userId,
          {
            entityId: novoId,
            description: `Anexo removido: ${anexo.name}`,
            changes: { anexoRemovido: anexo.name }
          }
        );
      } else if (editAluno && editAluno.id) {
        await setData(`alunos/${editAluno.id}`, dadosAtualizados);
        // Log da remoção de anexo
        await auditService.auditService?.logAction(
          LOG_ACTIONS.STUDENT_FILE_DELETE,
          userId,
          {
            entityId: editAluno.id,
            description: `Anexo removido: ${anexo.name}`,
            changes: { anexoRemovido: anexo.name }
          }
        );
      }
      setEditForm(dadosAtualizados);
    } catch (err) {
      setFormError('Erro ao remover anexo.');
    }
  };
  
  // Função para buscar informações de pré-matrícula
  const buscarInfoPreMatricula = async (alunoId) => {
    try {
      if (!financeiroService) return null;
      
      const verificacao = await verificarPagamentosPreMatricula(alunoId);
      return verificacao;
    } catch (error) {
      console.error('Erro ao buscar info pré-matrícula:', error);
      return null;
    }
  };

  // Função para validar CPF
  const validarCPF = (cpf) => {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digito1 = 11 - (soma % 11);
    if (digito1 >= 10) digito1 = 0;
    
    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    let digito2 = 11 - (soma % 11);
    if (digito2 >= 10) digito2 = 0;
    
    return parseInt(cpf.charAt(9)) === digito1 && parseInt(cpf.charAt(10)) === digito2;
  };

  // Função para buscar endereço por CEP
  const buscarEnderecoPorCep = async (cep, tipo) => {
    if (!cep || cep.length < 8) return;
    
    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setEditForm(prev => {
          if (tipo === 'endereco') {
            // Para o endereço do aluno - preservar CEP
            return {
              ...prev,
              endereco: {
                ...prev.endereco,
                cep: cep, // Preservar o CEP digitado
                rua: data.logradouro || '',
                bairro: data.bairro || '',
                cidade: data.localidade || '',
                uf: data.uf || ''
              }
            };
          } else {
            // Para endereços de responsáveis (mae, pai) - preservar CEP
            return {
              ...prev,
              [tipo]: {
                ...prev[tipo],
                endereco: {
                  ...prev[tipo]?.endereco,
                  cep: cep, // Preservar o CEP digitado
                  rua: data.logradouro || '',
                  bairro: data.bairro || '',
                  cidade: data.localidade || '',
                  uf: data.uf || ''
                }
              }
            };
          }
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
    setBuscandoCep(false);
  };

  // Função para copiar endereço do aluno para mãe ou pai
  const copiarEnderecoAluno = (destino) => {
    const enderecoAluno = editForm.endereco;
    
    if (!enderecoAluno || !enderecoAluno.cep) {
      alert('⚠️ Preencha o endereço do aluno primeiro!');
      return;
    }

    setEditForm(prev => ({
      ...prev,
      [destino]: {
        ...(prev[destino] || {}),
        endereco: {
          cep: enderecoAluno.cep || '',
          rua: enderecoAluno.rua || '',
          bairro: enderecoAluno.bairro || '',
          cidade: enderecoAluno.cidade || '',
          uf: enderecoAluno.uf || ''
        }
      }
    }));

    console.log(`✅ Endereço do aluno copiado para ${destino === 'mae' ? 'mãe' : 'pai'}`);
  };

  // Função para buscar dados da turma
  const buscarDadosTurma = async (turmaId) => {
    if (!turmaId || !turmas[turmaId]) return;
    
    const turma = turmas[turmaId];
    setDadosTurma(turma);
    
    // Atualizar form com dados da turma
    setEditForm(prev => ({
      ...prev,
      serie: turma.serie || '',
      turno: turma.turno || ''
    }));
  };

  // Função para alternar a expansão dos cards
  const toggleCardExpansao = (alunoId, event) => {
    event.stopPropagation(); // Impede que o clique no dropdown abra o modal de edição
    setCardsExpandidos(prev => ({
      ...prev,
      [alunoId]: !prev[alunoId]
    }));
  };
  
  // Função para verificar e atualizar status de inadimplência automaticamente
  const verificarEAtualizarInadimplencia = async (alunos) => {
    try {
      console.log('🔄 Verificando inadimplência de todos os alunos...');
      const hoje = new Date().toISOString().split('T')[0];
      let alunosAtualizados = 0;
      
      for (const aluno of alunos) {
        try {
          // Buscar títulos pendentes do aluno
          const resultado = await financeiroService.buscarTitulosAluno(aluno.id, { status: 'pendente' });
          
          if (resultado.success && resultado.titulos) {
            // Verificar se há títulos vencidos
            const titulosVencidos = resultado.titulos.filter(titulo => titulo.vencimento < hoje);
            
            const statusAtual = aluno.financeiro?.status || 'ativo';
            const novoStatus = titulosVencidos.length > 0 ? 'inadimplente' : 'ativo';
            
            // Atualizar apenas se houve mudança
            if (statusAtual !== novoStatus) {
              console.log(`💰 Atualizando status de ${aluno.nome}: ${statusAtual} → ${novoStatus}`);
              
              const alunoAtualizado = {
                ...aluno,
                financeiro: {
                  ...aluno.financeiro,
                  status: novoStatus,
                  ultimaVerificacao: new Date().toISOString(),
                  titulosVencidos: titulosVencidos.length
                }
              };
              
              await setData(`alunos/${aluno.id}`, alunoAtualizado);
              alunosAtualizados++;
              
              // Log da atualização de status
              if (auditService && LOG_ACTIONS) {
                await auditService.auditService?.logAction(
                  LOG_ACTIONS.STUDENT_UPDATE,
                  userId,
                  {
                    entityId: aluno.id,
                    description: `Status financeiro atualizado automaticamente: ${aluno.nome} - ${statusAtual} → ${novoStatus}`,
                    changes: {
                      statusFinanceiroAnterior: statusAtual,
                      statusFinanceiroNovo: novoStatus,
                      titulosVencidos: titulosVencidos.length,
                      verificacaoAutomatica: true
                    }
                  }
                );
              }
            }
          }
        } catch (error) {
          console.error(`Erro ao verificar inadimplência do aluno ${aluno.nome}:`, error);
        }
      }
      
      console.log(`✅ Verificação concluída. ${alunosAtualizados} alunos atualizados.`);
      return alunosAtualizados;
    } catch (error) {
      console.error('Erro na verificação automática de inadimplência:', error);
      return 0;
    }
  };
  
  // Função para buscar títulos vencidos de um aluno específico
  // Função para buscar títulos vencidos de um aluno específico
  const buscarTitulosVencidos = async (alunoId) => {
    try {
      console.log('🔍 Buscando títulos VENCIDOS para aluno:', alunoId);
      
      if (!financeiroService || !financeiroService.buscarTitulosAluno) {
        console.error('❌ FinanceiroService não está disponível');
        return [];
      }
      
      const resultado = await financeiroService.buscarTitulosAluno(alunoId, { status: 'pendente' });
      console.log('📊 Resultado da busca de títulos:', resultado);
      
      if (resultado.success && resultado.titulos) {
        const hoje = new Date().toISOString().split('T')[0];
        console.log('📅 Data de hoje:', hoje);
        
        const titulosVencidos = resultado.titulos.filter(titulo => {
          const isVencido = titulo.vencimento < hoje;
          console.log(`📋 ${titulo.descricao} - Vencimento: ${titulo.vencimento} - VENCIDO: ${isVencido}`);
          return isVencido;
        });
        
        console.log('✅ Títulos VENCIDOS encontrados:', titulosVencidos.length);
        return titulosVencidos;
      }
      
      console.log('❌ Nenhum título encontrado');
      return [];
    } catch (error) {
      console.error('💥 Erro ao buscar títulos vencidos:', error);
      return [];
    }
  };

  // Função para redirecionar para financeiro com filtros de inadimplência
  const redirecionarParaFinanceiroInadimplencia = (aluno, titulosEmAtraso) => {
    // Criar parâmetros de busca para filtrar os títulos em atraso do aluno
    const params = new URLSearchParams({
      tab: 'titulos',
      aluno: aluno.id,
      status: 'pendente',
      vencidos: 'true'
    });
    
    // Navegar para a tela do financeiro com os filtros aplicados
    router.push(`/financeiro?${params.toString()}`);
  };

  // Função para buscar títulos em aberto (mantida para compatibilidade)
  const buscarTitulosEmAberto = async (alunoId) => {
    try {
      console.log('🔍 === BUSCA DE TÍTULOS INICIADA ===');
      console.log('🆔 ID do aluno:', alunoId);
      console.log('🛠️ FinanceiroService disponível:', !!financeiroService);
      console.log('🛠️ Método buscarTitulosAluno disponível:', !!financeiroService?.buscarTitulosAluno);
      
      if (!financeiroService || !financeiroService.buscarTitulosAluno) {
        console.error('❌ FinanceiroService não está disponível');
        return [];
      }
      
      // Fazer a busca
      console.log('📡 Fazendo requisição ao Firebase...');
      const resultado = await financeiroService.buscarTitulosAluno(alunoId, { status: 'pendente' });
      console.log('📊 Resultado COMPLETO da busca:', JSON.stringify(resultado, null, 2));
      
      if (resultado.success) {
        console.log('✅ Busca bem-sucedida!');
        console.log('📋 Total de títulos pendentes encontrados:', resultado.titulos?.length || 0);
        
        if (resultado.titulos && resultado.titulos.length > 0) {
          console.log('📝 Lista de todos os títulos:', resultado.titulos);
          
          // Filtrar títulos vencidos e próximos ao vencimento
          const hoje = new Date().toISOString().split('T')[0];
          console.log('📅 Data de hoje para comparação:', hoje);
          
          const titulosRelevantes = resultado.titulos.filter(titulo => {
            const vencimento = titulo.vencimento;
            const isVencido = vencimento <= hoje;
            const dataVencimento = new Date(vencimento);
            const dataLimite = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const isProximo = dataVencimento <= dataLimite;
            
            console.log(`📋 Analisando título:`);
            console.log(`   - Descrição: ${titulo.descricao}`);
            console.log(`   - Valor: R$ ${titulo.valor}`);
            console.log(`   - Vencimento: ${vencimento}`);
            console.log(`   - É vencido? ${isVencido}`);
            console.log(`   - É próximo (30 dias)? ${isProximo}`);
            console.log(`   - Será incluído? ${isVencido || isProximo}`);
            
            return isVencido || isProximo;
          });
          
          console.log('✅ Títulos relevantes filtrados:', titulosRelevantes.length);
          console.log('📝 Lista de títulos relevantes:', titulosRelevantes);
          return titulosRelevantes;
        } else {
          console.log('ℹ️ Nenhum título pendente encontrado para este aluno');
          return [];
        }
      } else {
        console.log('❌ Busca falhou:', resultado.error || 'Erro desconhecido');
        return [];
      }
    } catch (error) {
      console.error('💥 ERRO CRÍTICO na busca de títulos:', error);
      console.error('Stack trace:', error.stack);
      return [];
    }
  };
  
  // Função para verificar se aluno pode ser reativado
  const verificarSePodeReativar = async (alunoId) => {
    try {
      console.log('🔍 Verificando se aluno pode ser reativado...');
      
      if (!editForm.inativacaoPorInadimplencia) {
        console.log('✅ Aluno não foi inativado por inadimplência, pode reativar');
        return { podeReativar: true };
      }
      
      // Se foi inativado por inadimplência, verificar se ainda há títulos vencidos
      const titulosVencidos = await buscarTitulosVencidos(alunoId);
      
      if (titulosVencidos.length > 0) {
        console.log(`❌ Ainda há ${titulosVencidos.length} títulos vencidos`);
        return { 
          podeReativar: false, 
          motivo: 'Ainda há títulos vencidos que precisam ser quitados',
          titulosVencidos 
        };
      }
      
      console.log('✅ Todos os títulos foram quitados, pode reativar');
      return { podeReativar: true };
    } catch (error) {
      console.error('Erro ao verificar reativação:', error);
      return { 
        podeReativar: false, 
        motivo: 'Erro ao verificar status financeiro' 
      };
    }
  };

  // Função para verificar se títulos de matrícula e materiais foram pagos
  const verificarPagamentosPreMatricula = async (alunoId) => {
    try {
      console.log('🔍 Verificando pagamentos de pré-matrícula para:', alunoId);
      
      if (!financeiroService || !financeiroService.buscarTitulosAluno) {
        return { matriculaPaga: false, materiaisPago: false, erro: 'Serviço financeiro indisponível' };
      }

      // Buscar todos os títulos do aluno
      const resultado = await financeiroService.buscarTitulosAluno(alunoId);
      
      if (!resultado.success || !resultado.titulos) {
        return { matriculaPaga: false, materiaisPago: false, erro: 'Erro ao buscar títulos' };
      }

      // Verificar títulos de matrícula e materiais
      const tituloMatricula = resultado.titulos.find(t => t.tipo === 'matricula');
      const tituloMateriais = resultado.titulos.find(t => t.tipo === 'materiais');

      const matriculaPaga = !tituloMatricula || tituloMatricula.status === 'pago';
      const materiaisPago = !tituloMateriais || tituloMateriais.status === 'pago';

      console.log('📊 Status dos pagamentos:', { matriculaPaga, materiaisPago });
      
      return {
        matriculaPaga,
        materiaisPago,
        tituloMatricula,
        tituloMateriais,
        podeAtivar: matriculaPaga && materiaisPago
      };
    } catch (error) {
      console.error('Erro ao verificar pagamentos:', error);
      return { matriculaPaga: false, materiaisPago: false, erro: error.message };
    }
  };

  // Função para verificar se aluno está rematriculado aguardando pagamento
  const verificarRematriculaAguardandoPagamento = async (aluno) => {
    try {
      // Verificar se tem flag de rematrícula recente
      if (!aluno.dataRematricula) return false;
      
      // Se já está ativo, não precisa mostrar como aguardando
      if (aluno.status === 'ativo') return false;

      // Verificar se tem títulos de matrícula/materiais pendentes
      if (!financeiroService?.buscarTitulosAluno) return false;

      const resultado = await financeiroService.buscarTitulosAluno(aluno.id);
      if (!resultado.success || !resultado.titulos) return false;

      // Buscar títulos de matrícula e materiais criados recentemente
      const titulosRecentes = resultado.titulos.filter(t => 
        (t.tipo === 'matricula' || t.tipo === 'materiais') && 
        t.status === 'pendente' &&
        t.createdAt && new Date(t.createdAt) > new Date(aluno.dataRematricula)
      );

      return titulosRecentes.length > 0;
    } catch (error) {
      console.error('Erro ao verificar rematrícula:', error);
      return false;
    }
  };

  // Função para ativar automaticamente aluno após pagamentos obrigatórios
  const ativarAutomaticamenteSeAprovado = async (alunoData) => {
    try {
      if (alunoData.status !== 'pre_matricula') {
        return false; // Só processa alunos em pré-matrícula
      }

      const verificacao = await verificarPagamentosPreMatricula(alunoData.id);
      
      if (verificacao.podeAtivar) {
        console.log('✅ Ativando aluno automaticamente:', alunoData.nome);
        
        // Remover valores undefined do objeto verificacao para o Firebase
        const verificacaoLimpa = {
          matriculaPaga: verificacao.matriculaPaga || false,
          materiaisPago: verificacao.materiaisPago || false,
          podeAtivar: verificacao.podeAtivar || false
        };

        // Adicionar IDs dos títulos apenas se existirem
        if (verificacao.tituloMatricula?.id) {
          verificacaoLimpa.tituloMatriculaId = verificacao.tituloMatricula.id;
        }
        if (verificacao.tituloMateriais?.id) {
          verificacaoLimpa.tituloMateriaisId = verificacao.tituloMateriais.id;
        }
        
        const alunoAtualizado = {
          ...alunoData,
          status: 'ativo',
          dataAtivacao: new Date().toISOString(),
          ativacaoAutomatica: {
            data: new Date().toISOString(),
            motivo: 'Pagamentos de matrícula e materiais confirmados',
            verificacao: verificacaoLimpa
          }
        };
        
        await setData(`alunos/${alunoData.id}`, alunoAtualizado);
        
        // Log da ativação automática
        await auditService.auditService?.logAction(
          'student_auto_activated',
          userId,
          {
            entityId: alunoData.id,
            description: `Aluno ativado automaticamente: ${alunoData.nome} - pagamentos confirmados`,
            changes: {
              statusAnterior: 'pre_matricula',
              novoStatus: 'ativo',
              ativacaoAutomatica: true,
              matriculaPaga: verificacao.matriculaPaga,
              materiaisPago: verificacao.materiaisPago
            }
          }
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro na ativação automática:', error);
      return false;
    }
  };
  
  // Função para tentar inativar aluno
  const handleInativarAluno = async () => {
    console.log('🔄 Iniciando processo de inativação do aluno');
    console.log('👤 Dados do aluno:', editForm.nome, editForm.matricula);
    
    // Verificar se está vinculado a turma
    if (editForm.turmaId && editForm.turmaId !== '') {
      const motivoTurma = `O aluno está vinculado à turma: "${getTurmaNome(editForm.turmaId)}".`;
      console.log('🏫 Aluno está vinculado a turma, mostrando modal de impedimento');
      setInativarMotivo(motivoTurma);
      setInativarDialogOpen(true);
      return;
    }
    
    // Verificar se há títulos vencidos
    console.log('🔍 Verificando títulos vencidos...');
    setCarregandoTitulos(true);
    const titulosVencidos = await buscarTitulosVencidos(editAluno.id);
    setTitulosEmAberto(titulosVencidos); // Usar o mesmo estado para compatibilidade
    setCarregandoTitulos(false);
    
    console.log('📋 Títulos vencidos encontrados:', titulosVencidos.length);
    
    // Se há títulos vencidos, mostrar modal de confirmação
    if (titulosVencidos.length > 0) {
      console.log('⚠️ Aluno possui títulos vencidos, abrindo modal de confirmação');
      setInadimplenciaDialogOpen(true);
      return;
    }
    
    // Se não há títulos vencidos, pode inativar normalmente
    console.log('✅ Nenhum título vencido encontrado, prosseguindo com inativação normal');
    await confirmarInativacao();
  };
  
  // Função para confirmar inativação (com ou sem inadimplência)
  const confirmarInativacao = async (motivoInadimplencia = null) => {
    try {
      setSaving(true);
      const dataInativacao = new Date().toISOString();
      
      const dadosInativacao = {
        ...editForm, 
        status: 'inativo',
        dataInativacao
      };
      
      // Se foi inativado por inadimplência, adicionar informações específicas
      if (motivoInadimplencia) {
        dadosInativacao.inativacaoPorInadimplencia = {
          data: dataInativacao,
          titulosEmAberto: titulosEmAberto.map(titulo => ({
            id: titulo.id,
            tipo: titulo.tipo,
            descricao: titulo.descricao,
            valor: titulo.valor,
            vencimento: titulo.vencimento,
            diasAtraso: Math.floor((new Date() - new Date(titulo.vencimento)) / (1000 * 60 * 60 * 24))
          })),
          valorTotalEmAberto: titulosEmAberto.reduce((total, titulo) => total + (titulo.valor || 0), 0),
          quantidadeTitulos: titulosEmAberto.length,
          motivo: motivoInadimplencia
        };
      }
      
      if (editAluno && editAluno.id) {
        await setData(`alunos/${editAluno.id}`, dadosInativacao);
        
        // Log da inativação do aluno
        await auditService.auditService?.logAction(
          LOG_ACTIONS.STUDENT_DEACTIVATE,
          userId,
          {
            entityId: editAluno.id,
            description: motivoInadimplencia 
              ? `Aluno inativado por inadimplência: ${editForm.nome} (${editForm.matricula}) - ${titulosEmAberto.length} títulos em aberto`
              : `Aluno inativado: ${editForm.nome} (${editForm.matricula})`,
            changes: { 
              statusAnterior: editForm.status,
              statusNovo: 'inativo',
              inativacaoPorInadimplencia: !!motivoInadimplencia,
              titulosEmAberto: motivoInadimplencia ? titulosEmAberto.length : 0,
              valorTotalEmAberto: motivoInadimplencia ? titulosEmAberto.reduce((total, titulo) => total + (titulo.valor || 0), 0) : 0
            }
          }
        );
      }
      
      setEditOpen(false);
      setInadimplenciaDialogOpen(false);
      await fetchData();
    } catch (err) {
      setFormError('Erro ao inativar aluno.');
    }
    setSaving(false);
  };

  // Verificar autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        // Redirecionar para login se necessário
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    if (!isReady) {
      console.log('⏳ [Alunos] Aguardando conexão com banco da escola...');
      return;
    }
    
    setLoading(true);
    try {
      console.log('👨‍🎓 [Alunos] Conectando ao banco da escola:', currentSchool?.nome);
      const alunosData = await getData('alunos');
      const turmasData = await getData('turmas');
      let alunosArr = [];
      let turmasObj = {};
      
      if (alunosData) {
        alunosArr = Object.entries(alunosData).map(([id, aluno]) => ({ ...aluno, id }));
      }
      if (turmasData) {
        turmasObj = turmasData;
      }
      
      // Primeiro definir os dados básicos
      setAlunos(alunosArr);
      setTurmas(turmasObj);
      
      // Verificar ativações automáticas para alunos em pré-matrícula
      if (alunosArr.length > 0 && financeiroService) {
        console.log('🔄 Verificando ativações automáticas...');
        
        const alunosPreMatricula = alunosArr.filter(aluno => aluno.status === 'pre_matricula');
        let ativacoesRealizadas = 0;
        
        for (const aluno of alunosPreMatricula) {
          const ativado = await ativarAutomaticamenteSeAprovado(aluno);
          if (ativado) ativacoesRealizadas++;
        }
        
        // Se houver ativações, recarregar dados
        if (ativacoesRealizadas > 0) {
          console.log(`✅ ${ativacoesRealizadas} alunos ativados automaticamente. Recarregando...`);
          const alunosDataNovo = await getData('alunos');
          if (alunosDataNovo) {
            const alunosArrNovo = Object.entries(alunosDataNovo).map(([id, aluno]) => ({ ...aluno, id }));
            setAlunos(alunosArrNovo);
          }
        }
        
        // Verificar e atualizar inadimplência automaticamente
        setTimeout(async () => {
          const atualizados = await verificarEAtualizarInadimplencia(alunosArr);
          
          if (atualizados > 0) {
            console.log(`✅ ${atualizados} alunos tiveram status atualizado. Recarregando dados...`);
            const alunosDataFinal = await getData('alunos');
            if (alunosDataFinal) {
              const alunosArrFinal = Object.entries(alunosDataFinal).map(([id, aluno]) => ({ ...aluno, id }));
              setAlunos(alunosArrFinal);
            }
          }
        }, 1500);
      }
      
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setAlunos([]);
      setTurmas({});
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isReady && userId) {
      console.log('👨‍🎓 [Alunos] Banco pronto, carregando dados...');
      fetchData();
    }
  }, [isReady, userId, getData, currentSchool]);

  useEffect(() => {
    async function fetchRole() {
      if (!userId || !isReady) {
        setUserRole(null);
        setRoleChecked(true);
        return;
      }
      const userData = await getData(`usuarios/${userId}`);
      if (userData) {
        setUserRole((userData.role || '').trim().toLowerCase());
        setUserName(userData.nome || userData.email || 'Sistema');
      } else {
        setUserRole(null);
        setUserName('Sistema');
      }
      setRoleChecked(true);
    }
    fetchRole();
  }, [userId, isReady, getData]);

  const getTurmaNome = turmaId => turmas[turmaId]?.nome || '---';

  // Filtragem ajustada para turma, nome e matrícula
  const alunosFiltrados = turmaSelecionada === 'todos'
    ? alunos.filter(aluno =>
        (!filtroNome || aluno.nome.toLowerCase().includes(filtroNome.toLowerCase())) &&
        (!filtroMatricula || aluno.matricula.toLowerCase().includes(filtroMatricula.toLowerCase()))
      )
    : turmaSelecionada
      ? alunos.filter(aluno =>
          aluno.turmaId === turmaSelecionada &&
          (!filtroNome || aluno.nome.toLowerCase().includes(filtroNome.toLowerCase())) &&
          (!filtroMatricula || aluno.matricula.toLowerCase().includes(filtroMatricula.toLowerCase()))
        )
      : [];

  const handleEditAluno = async aluno => {
    setEditAluno(aluno);
    
    // Preparar dados com estrutura completa, mantendo compatibilidade
    const dadosCompletos = {
      // Dados pessoais
      nome: aluno.nome || '',
      matricula: aluno.matricula || '',
      turmaId: aluno.turmaId || '',
      serie: aluno.serie || '',
      turno: aluno.turno || '',
      dataNascimento: aluno.dataNascimento || '',
      cpf: aluno.cpf || '',
      endereco: aluno.endereco || {
        rua: '',
        bairro: '',
        cep: '',
        cidade: '',
        uf: ''
      },
      foto: aluno.foto || '',
      
      // Dados da mãe (compatibilidade com campo antigo)
      mae: aluno.mae || {
        nome: aluno.nomeMae || '',
        rg: '',
        cpf: '',
        nacionalidade: '',
        escolaridade: '',
        profissao: '',
        celular: '',
        email: '',
        endereco: {
          rua: '',
          bairro: '',
          cep: '',
          cidade: '',
          uf: ''
        },
        responsavelFinanceiro: false,
        responsavelLegal: false
      },
      
      // Dados do pai (compatibilidade com campo antigo)
      pai: aluno.pai || {
        nome: aluno.nomePai || '',
        rg: '',
        cpf: '',
        nacionalidade: '',
        escolaridade: '',
        profissao: '',
        celular: '',
        email: '',
        endereco: {
          rua: '',
          bairro: '',
          cep: '',
          cidade: '',
          uf: ''
        },
        responsavelFinanceiro: false,
        responsavelLegal: false
      },
      
      // Contato de emergência
      contatoEmergencia: aluno.contatoEmergencia || { 
        nome: '', 
        parentesco: '',
        telefone: '' 
      },
      
      // Informações de saúde
      saude: aluno.saude || {
        doencasJaTeve: { tem: false, quais: '' },
        alergias: { tem: false, quais: '' },
        alergiaRemedio: { tem: false, quais: '' },
        problemaSaude: { tem: false, quais: '' },
        acompanhamentoTerapeutico: { tem: false, quais: '' },
        medicacaoContinua: { tem: false, quais: '' },
        acompanhamentoMedico: { tem: false, quais: '' }
      },
      
      // Dados financeiros
      financeiro: {
        mensalidadeValor: aluno.financeiro?.mensalidadeValor || '',
        descontoPercentual: aluno.financeiro?.descontoPercentual || '',
        percentualMulta: aluno.financeiro?.percentualMulta ?? 2,
        jurosDia: aluno.financeiro?.jurosDia ?? 0.033,
        diaVencimento: aluno.financeiro?.diaVencimento || '10',
        dataInicioCompetencia: aluno.financeiro?.dataInicioCompetencia || '',
        dataFimCompetencia: aluno.financeiro?.dataFimCompetencia || '',
        status: aluno.financeiro?.status || 'ativo',
        valorMatricula: aluno.financeiro?.valorMatricula || '',
        valorMateriais: aluno.financeiro?.valorMateriais || '',
        observacoes: aluno.financeiro?.observacoes || ''
      },
      
      // Outros campos
      status: aluno.status || 'ativo',
      anexos: aluno.anexos || []
    };
    
    setEditForm(dadosCompletos);
    setIsNew(false);
    setEditOpen(true);
    setFormError('');
    setFormStep(1);
    setResultadoTitulos(null);
    setDadosTurma(null);
    setFotoAluno(null);
    setValidacaoCpf({});
    
    // Buscar dados da turma se houver
    if (dadosCompletos.turmaId) {
      await buscarDadosTurma(dadosCompletos.turmaId);
    }
    
    // Verificar status da matrícula se o aluno estiver em pré-matrícula
    if (aluno.status === 'pre_matricula') {
      const statusMatricula = await financeiroService.verificarStatusMatricula(aluno.id);
      setStatusMatricula(statusMatricula);
    } else {
      setStatusMatricula(null);
    }
  };

  // Abrir dialog de rematrícula
  const handleAbrirRematricula = (aluno) => {
    setAlunoRematricula(aluno);
    setRematriculaDialogOpen(true);
  };

  // Callback após rematrícula bem-sucedida
  const handleRematriculaSuccess = async () => {
    // Recarregar dados dos alunos
    await carregarAlunos();
    setRematriculaDialogOpen(false);
    setAlunoRematricula(null);
  };

  // Abrir dialog de histórico de matrícula
  const handleAbrirHistorico = (aluno) => {
    setAlunoHistorico(aluno);
    setHistoricoDialogOpen(true);
  };

  // Ativar aluno após pagamento da matrícula
  const handleAtivarAluno = async () => {
    if (!editAluno || !editAluno.id) return;
    
    // Se é uma reativação (não uma primeira ativação), verificar se pode reativar
    if (editForm.status === 'inativo') {
      const verificacao = await verificarSePodeReativar(editAluno.id);
      
      if (!verificacao.podeReativar) {
        setFormError(`⚠️ Não é possível reativar este aluno: ${verificacao.motivo}`);
        return;
      }
    }
    
    setSaving(true);
    try {
      const alunoAtualizado = {
        ...editForm,
        status: 'ativo',
        dataAtivacao: new Date().toISOString(),
        // Resetar campos de inadimplência se estava inativo por inadimplência
        ...(editForm.inativacaoPorInadimplencia && {
          inadimplente: false,
          inativacaoPorInadimplencia: false,
          ultimaVerificacaoFinanceira: Date.now()
        })
      };
      
      await setData(`alunos/${editAluno.id}`, alunoAtualizado);
      
      // Log da ativação
      await auditService.auditService?.logAction(
        'student_activated',
        userId,
        {
          entityId: editAluno.id,
          description: `Aluno ativado: ${editForm.nome} (${editForm.matricula})`,
          changes: {
            statusAnterior: editForm.status,
            novoStatus: 'ativo',
            dataAtivacao: alunoAtualizado.dataAtivacao,
            reativacaoAposInadimplencia: editForm.inativacaoPorInadimplencia || false
          }
        }
      );
      
      console.log('✅ Aluno ativado com sucesso');
      setEditOpen(false);
      setStatusMatricula(null);
      fetchData(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao ativar aluno:', error);
      setFormError('Erro ao ativar aluno. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAluno = () => {
    let lastMatricula = 0;
    alunos.forEach(a => {
      const num = parseInt(a.matricula?.replace(/\D/g, ''));
      if (!isNaN(num) && num > lastMatricula) lastMatricula = num;
    });
    const novaMatricula = `S${String(lastMatricula + 1).padStart(3, '0')}`;
    setEditAluno(null);
    setEditForm({ 
      // Dados pessoais
      nome: '', 
      matricula: novaMatricula, 
      turmaId: '', 
      serie: '',
      turno: '',
      dataNascimento: '', 
      cpf: '',
      endereco: {
        rua: '',
        bairro: '',
        cep: '',
        cidade: '',
        uf: ''
      },
      foto: '',
      
      // Dados da mãe
      mae: {
        nome: '',
        rg: '',
        cpf: '',
        nacionalidade: '',
        escolaridade: '',
        profissao: '',
        celular: '',
        email: '',
        endereco: {
          rua: '',
          bairro: '',
          cep: '',
          cidade: '',
          uf: ''
        },
        responsavelFinanceiro: false,
        responsavelLegal: false
      },
      
      // Dados do pai
      pai: {
        nome: '',
        rg: '',
        cpf: '',
        nacionalidade: '',
        escolaridade: '',
        profissao: '',
        celular: '',
        email: '',
        endereco: {
          rua: '',
          bairro: '',
          cep: '',
          cidade: '',
          uf: ''
        },
        responsavelFinanceiro: false,
        responsavelLegal: false
      },
      
      // Contato de emergência
      contatoEmergencia: { 
        nome: '', 
        parentesco: '',
        telefone: '' 
      },
      
      // Informações de saúde
      saude: {
        doencasJaTeve: { tem: false, quais: '' },
        alergias: { tem: false, quais: '' },
        alergiaRemedio: { tem: false, quais: '' },
        problemaSaude: { tem: false, quais: '' },
        acompanhamentoTerapeutico: { tem: false, quais: '' },
        medicacaoContinua: { tem: false, quais: '' },
        acompanhamentoMedico: { tem: false, quais: '' }
      },
      
      // Dados financeiros (mantidos)
      financeiro: {
        mensalidadeValor: '',
        descontoPercentual: '',
        percentualMulta: 2,
        jurosDia: 0.033,
        diaVencimento: '',
        valorMatricula: '',
        valorMateriais: '',
        dataInicioCompetencia: '',
        dataFimCompetencia: '',
        status: 'ativo',
        observacoes: ''
      },
      status: 'pre_matricula',
      dataMatricula: new Date().toISOString(),
      dataAtivacao: null
    });
    setIsNew(true);
    setEditOpen(true);
    setFormError('');
    setFormStep(1); // Começar na primeira aba
    setResultadoTitulos(null);
    setStatusMatricula(null);
    setDadosTurma(null);
    setFotoAluno(null);
    setValidacaoCpf({});
  };

  // Função para buscar histórico de matrículas do aluno
  const buscarHistoricoMatriculas = async (alunoId, aluno = null) => {
    console.group('📋 DEBUG - BuscarHistoricoMatriculas');
    console.log('AlunoId:', alunoId);
    console.log('Aluno completo:', aluno);
    
    try {
      // Primeiro, verificar se o histórico está nos dados do próprio aluno
      if (aluno?.historicoRematriculas && Array.isArray(aluno.historicoRematriculas)) {
        console.log('✅ Encontrado historicoRematriculas no aluno:', aluno.historicoRematriculas);
        const historico = aluno.historicoRematriculas.map((item, index) => ({
          id: `historico-${index}`,
          ...item
        })).sort((a, b) => new Date(b.dataMatricula || b.data) - new Date(a.dataMatricula || a.data));
        
        console.log('✅ Histórico do aluno processado:', historico);
        console.groupEnd();
        return historico;
      }

      // Se não encontrou no aluno, buscar no path separado
      const historicoData = await getData(`historicoMatricula/${alunoId}`);
      console.log('Dados do histórico brutos (path separado):', historicoData);
      
      if (historicoData) {
        const historico = Object.entries(historicoData).map(([id, dados]) => ({
          id,
          ...dados
        })).sort((a, b) => new Date(b.dataMatricula) - new Date(a.dataMatricula));
        
        console.log('✅ Histórico do path separado processado:', historico);
        console.groupEnd();
        return historico;
      }
      
      console.log('❌ Nenhum histórico encontrado');
      console.groupEnd();
      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar histórico de matrículas:', error);
      console.groupEnd();
      return [];
    }
  };

  // Função para verificar se aluno tem rematrícula
  const verificarSeTemRematricula = async (aluno) => {
    console.group('🔍 DEBUG - VerificarSeTemRematricula');
    console.log('Aluno recebido:', aluno);
    console.log('dataRematricula:', aluno?.dataRematricula);
    console.log('historicoRematriculas:', aluno?.historicoRematriculas);
    
    if (!aluno?.dataRematricula) {
      console.log('❌ Não tem dataRematricula');
      console.groupEnd();
      return false;
    }
    
    console.log('✅ Tem dataRematricula, buscando histórico...');
    const historico = await buscarHistoricoMatriculas(aluno.id, aluno);
    console.log('📋 Histórico encontrado:', historico);
    console.log('📊 Quantidade no histórico:', historico.length);
    
    const resultado = historico.length > 0;
    console.log('🎯 Resultado final:', resultado);
    console.groupEnd();
    
    return resultado;
  };

  // Função para buscar matrículas disponíveis (atual + histórico)
  const buscarMatriculasDisponiveis = async (aluno) => {
    console.group('📋 DEBUG - BuscarMatriculasDisponiveis');
    console.log('Aluno completo:', aluno);
    console.log('Turmas disponíveis:', turmas);
    
    const historico = await buscarHistoricoMatriculas(aluno.id, aluno);
    
    // Para rematrícula atual - verificar se tem turmaDestino
    const turmaAtualId = aluno.transicaoPendente?.turmaDestino || aluno.turmaId;
    const turmaAtualInfo = turmas[turmaAtualId];
    console.log('Turma atual ID:', turmaAtualId);
    console.log('Turma atual info:', turmaAtualInfo);
    
    const matriculas = [
      // Matrícula atual (rematrícula)
      {
        ...aluno,
        isCurrent: true,
        dataMatricula: aluno.dataRematricula || aluno.dataMatricula,
        nomeTurma: turmaAtualInfo?.nome || 'N/A',
        turmaId: turmaAtualId,
        turmaInfo: turmaAtualInfo,
        ano: new Date(aluno.dataRematricula || aluno.dataMatricula).getFullYear()
      },
      // Matrículas do histórico
      ...historico.map((h, index) => {
        console.log(`Processando histórico ${index}:`, h);
        const turmaHistoricoId = h.turmaId || h.turmaDestino || h.turmaAtual;
        const turmaHistoricoInfo = turmas[turmaHistoricoId];
        console.log(`Turma histórico ${index} ID:`, turmaHistoricoId);
        console.log(`Turma histórico ${index} info:`, turmaHistoricoInfo);
        
        return {
          ...h,
          isCurrent: false,
          nomeTurma: turmaHistoricoInfo?.nome || 'N/A',
          turmaId: turmaHistoricoId,
          turmaInfo: turmaHistoricoInfo,
          ano: new Date(h.dataMatricula || h.data).getFullYear(),
          dataMatricula: h.dataMatricula || h.data
        };
      })
    ];
    
    console.log('Matrículas processadas:', matriculas);
    console.groupEnd();
    return matriculas;
  };

  // Função para buscar ou criar dados financeiros específicos da matrícula
  const buscarDadosFinanceirosMatricula = async (matriculaData) => {
    console.group('💰 DEBUG - BuscarDadosFinanceirosMatricula');
    console.log('Dados da matrícula recebida:', matriculaData);
    
    try {
      // Buscar dados do período letivo da turma selecionada
      let periodoLetivo = null;
      const periodoId = matriculaData.turmaInfo?.periodoLetivoId || matriculaData.turmaInfo?.periodoId;
      if (periodoId) {
        console.log('Buscando período letivo:', periodoId);
        periodoLetivo = await getData(`periodosLetivos/${periodoId}`);
        console.log('Período letivo encontrado:', periodoLetivo);
      } else {
        console.log('❌ Nenhum periodoId encontrado na turmaInfo:', matriculaData.turmaInfo);
      }

      const dadosCompletos = {
        ...matriculaData,
        periodoLetivo: periodoLetivo,
        // Garantir que os dados da turma estejam corretos
        turmaId: matriculaData.turmaId,
        nomeTurma: matriculaData.nomeTurma,
        turmaInfo: matriculaData.turmaInfo
      };

      // Se é a matrícula atual, usar os dados como estão (mas com período correto)
      if (matriculaData.isCurrent) {
        console.log('✅ Matrícula atual - usando dados com período da turma');
        console.groupEnd();
        return dadosCompletos;
      }

      // Para matrículas históricas, verificar se existem dados financeiros específicos
      const dadosFinanceiros = await financeiroService.buscarTitulosAluno?.(matriculaData.id);
      
      if (!dadosFinanceiros?.success || !dadosFinanceiros.titulos?.length) {
        // Se não tem dados financeiros, criar baseado na matrícula histórica
        console.log('⚠️ Criando dados financeiros para matrícula histórica:', matriculaData.id);
        
        console.groupEnd();
        return {
          ...dadosCompletos,
          dadosFinanceirosCriados: true // Flag para indicar que foram criados
        };
      }

      // Se tem dados financeiros, incluir eles na matrícula
      console.log('✅ Dados financeiros encontrados para matrícula histórica');
      console.groupEnd();
      return {
        ...dadosCompletos,
        dadosFinanceiros: dadosFinanceiros.titulos
      };

    } catch (error) {
      console.error('❌ Erro ao buscar dados financeiros da matrícula:', error);
      console.groupEnd();
      return matriculaData; // Retorna os dados originais em caso de erro
    }
  };

  // Função para abrir dialog de seleção (Ficha ou Contrato)
  const handleAbrirSelecaoImpressao = (aluno) => {
    setAlunoSelecionadoFicha(aluno);
    setDialogSelecaoOpen(true);
  };

  // Função para abrir ficha de matrícula
  const handleAbrirFichaMatricula = async (dadosFicha = null) => {
    console.group('🎯 DEBUG - HandleAbrirFichaMatricula');
    console.log('dadosFicha recebido:', dadosFicha);
    console.log('alunoSelecionadoFicha atual:', alunoSelecionadoFicha);
    
    setDialogSelecaoOpen(false);
    
    // Se foi passado dados específicos (vem do diálogo de seleção), usar eles
    if (dadosFicha) {
      console.log('✅ Usando dados específicos da ficha');
      console.log('📋 Dados recebidos do diálogo:', dadosFicha);
      setSelecaoFichaOpen(false);
      
      // Buscar dados financeiros específicos da matrícula selecionada
      console.log('🔄 Chamando buscarDadosFinanceirosMatricula...');
      const dadosCompletos = await buscarDadosFinanceirosMatricula(dadosFicha);
      console.log('✅ Dados completos processados:', dadosCompletos);
      setAlunoSelecionadoFicha(dadosCompletos);
      setFichaMatriculaOpen(true);
      console.groupEnd();
      return;
    }
    
    // Se não foi passado dados, verificar se aluno tem rematrícula
    const aluno = alunoSelecionadoFicha;
    console.log('🔍 Verificando se aluno tem rematrícula:', aluno?.nome);
    console.log('dataRematricula:', aluno?.dataRematricula);
    
    const temRematricula = await verificarSeTemRematricula(aluno);
    console.log('🎯 Resultado verificação rematrícula:', temRematricula);
    
    if (temRematricula) {
      console.log('✅ Tem rematrícula - abrindo diálogo de seleção');
      // Tem rematrícula - abrir diálogo de seleção
      const matriculas = await buscarMatriculasDisponiveis(aluno);
      console.log('📋 Matrículas disponíveis:', matriculas);
      setMatriculasDisponiveisFicha(matriculas);
      setSelecaoFichaOpen(true);
    } else {
      console.log('❌ Não tem rematrícula - abrindo ficha normal');
      // Não tem rematrícula - abrir ficha normal
      setFichaMatriculaOpen(true);
    }
    
    console.groupEnd();
  };

  const handleFecharFichaMatricula = () => {
    setFichaMatriculaOpen(false);
    setAlunoSelecionadoFicha(null);
  };

  // Função para fechar diálogo de seleção de ficha
  const handleFecharSelecaoFicha = () => {
    setSelecaoFichaOpen(false);
    setMatriculasDisponiveisFicha([]);
    setFichaSelecionada(null);
    setAlunoSelecionadoFicha(null);
  };

  // Função para abrir contrato
  const handleAbrirContrato = async (dadosContrato = null) => {
    console.group('🎯 DEBUG - HandleAbrirContrato');
    console.log('dadosContrato recebido:', dadosContrato);
    console.log('alunoSelecionadoFicha atual:', alunoSelecionadoFicha);
    
    setDialogSelecaoOpen(false);
    
    // Se foi passado dados específicos (vem do diálogo de seleção), usar eles
    if (dadosContrato) {
      console.log('✅ Usando dados específicos do contrato');
      console.log('📋 Dados recebidos do diálogo:', dadosContrato);
      setSelecaoContratoOpen(false);
      
      // Buscar dados financeiros específicos da matrícula selecionada
      console.log('🔄 Chamando buscarDadosFinanceirosMatricula...');
      const dadosCompletos = await buscarDadosFinanceirosMatricula(dadosContrato);
      console.log('✅ Dados completos processados:', dadosCompletos);
      setAlunoSelecionadoFicha(dadosCompletos);
      setContratoOpen(true);
      console.groupEnd();
      return;
    }
    
    // Se não foi passado dados, verificar se aluno tem rematrícula
    const aluno = alunoSelecionadoFicha;
    console.log('🔍 Verificando se aluno tem rematrícula:', aluno?.nome);
    console.log('dataRematricula:', aluno?.dataRematricula);
    
    const temRematricula = await verificarSeTemRematricula(aluno);
    console.log('🎯 Resultado verificação rematrícula:', temRematricula);
    
    if (temRematricula) {
      console.log('✅ Tem rematrícula - abrindo diálogo de seleção');
      // Tem rematrícula - abrir diálogo de seleção
      const matriculas = await buscarMatriculasDisponiveis(aluno);
      console.log('📋 Matrículas disponíveis:', matriculas);
      setMatriculasDisponiveis(matriculas);
      setSelecaoContratoOpen(true);
    } else {
      console.log('❌ Não tem rematrícula - abrindo contrato normal');
      // Não tem rematrícula - abrir contrato normal
      setContratoOpen(true);
    }
    
    console.groupEnd();
  };

  const handleFecharContrato = () => {
    setContratoOpen(false);
    setAlunoSelecionadoFicha(null);
  };

  // Função para fechar diálogo de seleção de contrato
  const handleFecharSelecaoContrato = () => {
    setSelecaoContratoOpen(false);
    setMatriculasDisponiveis([]);
    setContratoSelecionado(null);
    setAlunoSelecionadoFicha(null);
  };

  // Fechar dialog de seleção
  const handleFecharDialogSelecao = () => {
    setDialogSelecaoOpen(false);
    setAlunoSelecionadoFicha(null);
  };

  // Função para tentar fechar o modal com confirmação
  const handleTentarFecharModal = () => {
    setConfirmCloseOpen(true);
    setPendingClose(true);
  };

  // Função para confirmar fechamento e perder dados
  const handleConfirmarFechamento = () => {
    setConfirmCloseOpen(false);
    setPendingClose(false);
    setEditOpen(false);
    // Limpar dados do formulário
    setEditForm({});
    setEditAluno(null);
    setFormError('');
    setFormStep(1);
    setDadosTurma(null);
    setFotoAluno(null);
    setValidacaoCpf({});
  };

  // Função para cancelar fechamento
  const handleCancelarFechamento = () => {
    setConfirmCloseOpen(false);
    setPendingClose(false);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Tratamento especial para checkboxes de responsabilidade
    if (name === 'mae.responsavelFinanceiro' || name === 'pai.responsavelFinanceiro') {
      const [pessoa] = name.split('.');
      setEditForm(prev => ({
        ...prev,
        mae: {
          ...prev.mae,
          responsavelFinanceiro: pessoa === 'mae' ? checked : false
        },
        pai: {
          ...prev.pai,
          responsavelFinanceiro: pessoa === 'pai' ? checked : false
        }
      }));
      return;
    }
    
    // Tratamento para checkboxes de responsável legal
    if (name === 'mae.responsavelLegal' || name === 'pai.responsavelLegal') {
      const [pessoa] = name.split('.');
      setEditForm(prev => ({
        ...prev,
        [pessoa]: {
          ...prev[pessoa],
          responsavelLegal: checked
        }
      }));
      return;
    }
    
    // Tratamento para mudança de turma
    if (name === 'turmaId') {
      setEditForm(prev => ({ 
        ...prev, 
        turmaId: value,
        turno: value ? (turmas[value]?.turno || '') : '' // Atualiza turno automaticamente
      }));
      if (value) {
        buscarDadosTurma(value);
      }
      return;
    }
    
    // Tratamento para CEP com busca automática (mantido para compatibilidade)
    if (name.endsWith('.endereco.cep') || name === 'endereco.cep') {
      // Esta lógica agora é tratada diretamente nos campos onChange
      // Mantido apenas para compatibilidade com outros campos que ainda usam handleFormChange
      return;
    }
    
    // Tratamento para validação de CPF
    if (name === 'cpf' || name.endsWith('.cpf')) {
      const cpfLimpo = value.replace(/\D/g, '');
      const isValido = validarCPF(cpfLimpo);
      
      if (name.includes('.')) {
        const [pessoa] = name.split('.');
        setEditForm(prev => ({
          ...prev,
          [pessoa]: {
            ...prev[pessoa],
            cpf: cpfLimpo
          }
        }));
        setValidacaoCpf(prev => ({
          ...prev,
          [pessoa]: isValido
        }));
      } else {
        setEditForm(prev => ({ ...prev, cpf: cpfLimpo }));
        setValidacaoCpf(prev => ({
          ...prev,
          aluno: isValido
        }));
      }
      return;
    }
    
    // Tratamento para campos aninhados (pessoa.campo ou pessoa.endereco.campo)
    if (name.includes('.')) {
      const partes = name.split('.');
      
      if (partes.length === 2) {
        // pessoa.campo
        const [pessoa, campo] = partes;
        setEditForm(prev => ({
          ...prev,
          [pessoa]: {
            ...prev[pessoa],
            [campo]: value
          }
        }));
      } else if (partes.length === 3) {
        // pessoa.endereco.campo ou saude.item.campo
        const [pessoa, subObj, campo] = partes;
        setEditForm(prev => ({
          ...prev,
          [pessoa]: {
            ...prev[pessoa],
            [subObj]: {
              ...prev[pessoa][subObj],
              [campo]: value
            }
          }
        }));
      }
      return;
    }
    
    // Tratamento para contato de emergência
    if (name === 'contatoEmergenciaNome') {
      setEditForm(prev => ({
        ...prev,
        contatoEmergencia: { ...prev.contatoEmergencia, nome: value }
      }));
    } else if (name === 'contatoEmergenciaParentesco') {
      setEditForm(prev => ({
        ...prev,
        contatoEmergencia: { ...prev.contatoEmergencia, parentesco: value }
      }));
    } else if (name === 'contatoEmergenciaTelefone') {
      setEditForm(prev => ({
        ...prev,
        contatoEmergencia: { ...prev.contatoEmergencia, telefone: value }
      }));
    } else if (name.startsWith('financeiro.')) {
      // Campos financeiros (mantém lógica existente)
      const key = name.split('.')[1];
      let val = value;
      if (key === 'diaVencimento') {
        val = val.replace(/\D/g, '');
        if (val) {
          let num = parseInt(val, 10);
          if (num < 1) num = 1;
          if (num > 31) num = 31;
          val = String(num);
        }
      }
      setEditForm(prev => ({
        ...prev,
        financeiro: { ...prev.financeiro, [key]: val }
      }));
      if (key === 'diaVencimento') {
        if (!val) {
          setFinanceiroError('Informe o dia de vencimento (1 a 31).');
        } else if (parseInt(val,10) < 1 || parseInt(val,10) > 31) {
          setFinanceiroError('Dia de vencimento deve ser entre 1 e 31.');
        } else {
          setFinanceiroError('');
        }
      }
    } else {
      // Campos simples do nível raiz
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };


  // Validação por passo
  const isStep1Valid = () => (
    editForm.nome?.trim() &&
    editForm.matricula?.trim() &&
    editForm.turmaId?.trim() &&
    editForm.dataNascimento?.trim() &&
    editForm.cpf?.trim() &&
    validacaoCpf.aluno &&
    editForm.endereco?.rua?.trim() &&
    editForm.endereco?.bairro?.trim() &&
    editForm.endereco?.cep?.trim() &&
    editForm.endereco?.cidade?.trim()
  );

  const isMaeValid = () => (
    !editForm.mae?.responsavelFinanceiro || (
      editForm.mae?.nome?.trim() &&
      editForm.mae?.rg?.trim() &&
      editForm.mae?.cpf?.trim() &&
      validacaoCpf.mae &&
      editForm.mae?.nacionalidade?.trim() &&
      editForm.mae?.escolaridade?.trim() &&
      editForm.mae?.profissao?.trim() &&
      editForm.mae?.celular?.trim() &&
      editForm.mae?.email?.trim() &&
      editForm.mae?.endereco?.rua?.trim() &&
      editForm.mae?.endereco?.bairro?.trim() &&
      editForm.mae?.endereco?.cep?.trim() &&
      editForm.mae?.endereco?.cidade?.trim()
    )
  );

  const isPaiValid = () => (
    !editForm.pai?.responsavelFinanceiro || (
      editForm.pai?.nome?.trim() &&
      editForm.pai?.rg?.trim() &&
      editForm.pai?.cpf?.trim() &&
      validacaoCpf.pai &&
      editForm.pai?.nacionalidade?.trim() &&
      editForm.pai?.escolaridade?.trim() &&
      editForm.pai?.profissao?.trim() &&
      editForm.pai?.celular?.trim() &&
      editForm.pai?.email?.trim() &&
      editForm.pai?.endereco?.rua?.trim() &&
      editForm.pai?.endereco?.bairro?.trim() &&
      editForm.pai?.endereco?.cep?.trim() &&
      editForm.pai?.endereco?.cidade?.trim()
    )
  );

  const isEmergenciaValid = () => (
    editForm.contatoEmergencia?.nome?.trim() &&
    editForm.contatoEmergencia?.parentesco?.trim() &&
    editForm.contatoEmergencia?.telefone?.trim()
  );

  const isStep2Valid = () => (
    // Campos financeiros básicos; pode expandir futuramente
    editForm.financeiro?.mensalidadeValor?.toString().trim() &&
    editForm.financeiro?.diaVencimento?.toString().trim() &&
    editForm.financeiro?.dataInicioCompetencia?.trim() &&
    editForm.financeiro?.dataFimCompetencia?.trim() &&
    editForm.financeiro?.status?.trim() &&
    !financeiroError
  );

  const isFinalFormValid = () => (
    isStep1Valid() && 
    isMaeValid() && 
    isPaiValid() && 
    isEmergenciaValid() && 
    isStep2Valid() &&
    (editForm.mae?.responsavelFinanceiro || editForm.pai?.responsavelFinanceiro)
  );

  const valorMensalidadeNumber = parseFloat(editForm.financeiro?.mensalidadeValor || '0') || 0;
  const descontoPercent = parseFloat(editForm.financeiro?.descontoPercentual || '0') || 0;
  const valorComDesconto = Math.max(0, valorMensalidadeNumber - (valorMensalidadeNumber * (descontoPercent / 100)));

  const handleSaveEdit = async () => {
    if (!isFinalFormValid()) {
      setFormError("Preencha todos os campos obrigatórios dos dois passos!");
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      let anexosUrls = editForm.anexos ? [...editForm.anexos] : [];
      const alunoId = isNew
        ? `id_aluno_${editForm.nome.replace(/\s/g, '').toLowerCase()}_${editForm.matricula}`
        : editAluno.id;
      // Excluir anexos marcados (por nome, tratamento extra)
      if (anexosParaExcluir.length > 0 && editForm.anexos) {
        let erroExclusao = false;
        for (const anexo of editForm.anexos) {
          // Normaliza nome para comparação
          const nomeAnexo = anexo.name.trim().toLowerCase();
          if (anexosParaExcluir.map(n => n.trim().toLowerCase()).includes(nomeAnexo)) {
            const matricula = editForm.matricula || (editAluno && editAluno.matricula) || '';
            const fileRef = storageRef(schoolStorage, `anexos_alunos/${alunoId}_${matricula}/${anexo.name}`);
            try {
              await deleteObject(fileRef);
            } catch (err) {
              erroExclusao = true;
              console.error('Erro ao excluir anexo do Storage:', anexo.name, err);
            }
          }
        }
        anexosUrls = anexosUrls.filter(anexo => !anexosParaExcluir.map(n => n.trim().toLowerCase()).includes(anexo.name.trim().toLowerCase()));
        if (erroExclusao) {
          setFormError('Um ou mais anexos não puderam ser excluídos do Storage. Tente novamente ou contate o suporte.');
        }
      }
      // Upload de novos anexos
      if (anexosSelecionados.length > 0) {
        for (const file of anexosSelecionados) {
          const matricula = editForm.matricula || (editAluno && editAluno.matricula) || '';
          const fileRef = storageRef(schoolStorage, `anexos_alunos/${alunoId}_${matricula}/${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          anexosUrls.push({ name: file.name, url });
        }
      }
      const dadosParaSalvar = {
        ...editForm,
        anexos: anexosUrls
      };
      
      if (isNew) {
        const novoId = alunoId;
        
        // Definir status inicial baseado na existência de valor de matrícula ou materiais
        const statusInicial = (dadosParaSalvar.financeiro?.valorMatricula > 0 || dadosParaSalvar.financeiro?.valorMateriais > 0) ? 'pre_matricula' : 'ativo';
        const dadosComStatus = {
          ...dadosParaSalvar,
          status: statusInicial
        };
        
        await setData(`alunos/${novoId}`, dadosComStatus);
        
        // Gerar títulos financeiros automaticamente
        if (dadosParaSalvar.financeiro?.mensalidadeValor > 0) {
          setGerandoTitulos(true);
          
          const resultadoFinanceiro = await financeiroService.gerarTitulosNovoAluno(novoId, dadosComStatus);
          
          if (resultadoFinanceiro.success) {
            setResultadoTitulos(resultadoFinanceiro);
            
            // Log da geração de títulos
            await auditService.auditService?.logAction(
              'financial_titles_generated',
              userId,
              {
                entityId: novoId,
                description: `Títulos financeiros gerados automaticamente para ${dadosComStatus.nome}`,
                changes: {
                  titulosGerados: resultadoFinanceiro.titulosGerados,
                  matricula: resultadoFinanceiro.matricula,
                  materiais: resultadoFinanceiro.materiais,
                  mensalidades: resultadoFinanceiro.mensalidades,
                  valorTotal: resultadoFinanceiro.valorTotal
                }
              }
            );
          } else {
            console.error('Erro ao gerar títulos:', resultadoFinanceiro.error);
          }
          
          setGerandoTitulos(false);
        }
        
        // Log da criação do aluno
        await auditService.auditService?.logAction(
          LOG_ACTIONS.STUDENT_CREATE,
          userId,
          {
            entityId: novoId,
            description: `Novo aluno cadastrado: ${dadosComStatus.nome} (${dadosComStatus.matricula})`,
            changes: {
              nome: dadosComStatus.nome,
              matricula: dadosComStatus.matricula,
              turma: getTurmaNome(dadosComStatus.turmaId),
              dataNascimento: dadosComStatus.dataNascimento,
              statusFinanceiro: dadosComStatus.financeiro?.status,
              statusAluno: statusInicial,
              anexosCount: anexosUrls.length
            }
          }
        );
        
        // Log de upload de anexos se houver
        if (anexosSelecionados.length > 0) {
          await auditService.auditService?.logAction(
            LOG_ACTIONS.STUDENT_FILE_UPLOAD,
            userId,
            {
              entityId: novoId,
              description: `${anexosSelecionados.length} anexo(s) enviado(s) para ${dadosParaSalvar.nome}`,
              changes: {
                anexosEnviados: anexosSelecionados.map(f => f.name)
              }
            }
          );
        }
        
      } else if (editAluno && editAluno.id) {
        // Identificar mudanças para o log
        const mudancas = {};
        
        if (editAluno.nome !== dadosParaSalvar.nome) mudancas.nome = { de: editAluno.nome, para: dadosParaSalvar.nome };
        if (editAluno.turmaId !== dadosParaSalvar.turmaId) mudancas.turma = { de: getTurmaNome(editAluno.turmaId), para: getTurmaNome(dadosParaSalvar.turmaId) };
        if (editAluno.dataNascimento !== dadosParaSalvar.dataNascimento) mudancas.dataNascimento = { de: editAluno.dataNascimento, para: dadosParaSalvar.dataNascimento };
        if (editAluno.nomePai !== dadosParaSalvar.nomePai) mudancas.nomePai = { de: editAluno.nomePai, para: dadosParaSalvar.nomePai };
        if (editAluno.nomeMae !== dadosParaSalvar.nomeMae) mudancas.nomeMae = { de: editAluno.nomeMae, para: dadosParaSalvar.nomeMae };
        if (editAluno.contatoEmergencia?.nome !== dadosParaSalvar.contatoEmergencia?.nome) mudancas.contatoEmergenciaNome = { de: editAluno.contatoEmergencia?.nome, para: dadosParaSalvar.contatoEmergencia?.nome };
        if (editAluno.contatoEmergencia?.telefone !== dadosParaSalvar.contatoEmergencia?.telefone) mudancas.contatoEmergenciaTelefone = { de: editAluno.contatoEmergencia?.telefone, para: dadosParaSalvar.contatoEmergencia?.telefone };
        
        // Verificar mudanças financeiras
        if (editAluno.financeiro?.mensalidadeValor !== dadosParaSalvar.financeiro?.mensalidadeValor) mudancas.mensalidade = { de: editAluno.financeiro?.mensalidadeValor, para: dadosParaSalvar.financeiro?.mensalidadeValor };
        if (editAluno.financeiro?.status !== dadosParaSalvar.financeiro?.status) mudancas.statusFinanceiro = { de: editAluno.financeiro?.status, para: dadosParaSalvar.financeiro?.status };
        if (editAluno.financeiro?.diaVencimento !== dadosParaSalvar.financeiro?.diaVencimento) mudancas.diaVencimento = { de: editAluno.financeiro?.diaVencimento, para: dadosParaSalvar.financeiro?.diaVencimento };
        
        await setData(`alunos/${editAluno.id}`, dadosParaSalvar);
        
        // Log da atualização do aluno
        if (Object.keys(mudancas).length > 0) {
          await auditService.auditService?.logAction(
            LOG_ACTIONS.STUDENT_UPDATE,
            userId,
            {
              entityId: editAluno.id,
              description: `Dados atualizados para ${dadosParaSalvar.nome} (${dadosParaSalvar.matricula})`,
              changes: mudancas
            }
          );
        }
        
        // Log de exclusão de anexos se houver
        if (anexosParaExcluir.length > 0) {
          await auditService.auditService?.logAction(
            LOG_ACTIONS.STUDENT_FILE_DELETE,
            userId,
            {
              entityId: editAluno.id,
              description: `${anexosParaExcluir.length} anexo(s) excluído(s) de ${dadosParaSalvar.nome}`,
              changes: {
                anexosExcluidos: anexosParaExcluir
              }
            }
          );
        }
        
        // Log de upload de novos anexos se houver
        if (anexosSelecionados.length > 0) {
          await auditService.auditService?.logAction(
            LOG_ACTIONS.STUDENT_FILE_UPLOAD,
            userId,
            {
              entityId: editAluno.id,
              description: `${anexosSelecionados.length} anexo(s) enviado(s) para ${dadosParaSalvar.nome}`,
              changes: {
                anexosEnviados: anexosSelecionados.map(f => f.name)
              }
            }
          );
        }
      }
      
      setEditOpen(false);
      await fetchData();
      setAnexosSelecionados([]);
      setAnexosParaExcluir([]);
    } catch (err) {
      setFormError("Erro ao salvar. Tente novamente.");
    }
    setSaving(false);
  };

  if (!roleChecked || userId === null) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (userRole !== 'coordenadora' && userRole !== 'professora') {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Acesso negado
        </Typography>
        <Typography variant="body1">
          Esta página é restrita para coordenadoras e professoras.
        </Typography>
      </Box>
    );
  }

  return (
    <div className="dashboard-container">
      <SidebarMenu />
      <main className="dashboard-main">
        <Box sx={{ width: '100%', px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom={false}>👥 Gestão de Alunos</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={async () => {
                  setVerificandoPagamentos(true);
                  const alunosPreMatricula = alunos.filter(a => a.status === 'pre_matricula');
                  let ativados = 0;
                  for (const aluno of alunosPreMatricula) {
                    const ativado = await ativarAutomaticamenteSeAprovado(aluno);
                    if (ativado) ativados++;
                  }
                  if (ativados > 0) {
                    await fetchData();
                  }
                  setVerificandoPagamentos(false);
                }}
                disabled={verificandoPagamentos}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  fontSize: '0.75rem',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderColor: 'rgba(255,255,255,0.4)'
                  }
                }} 
              >
                {verificandoPagamentos ? '🔄 Verificando...' : '🔍 Verificar Pagamentos'}
              </Button>
              <Button 
                variant="contained" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.15)', 
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.25)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  },
                  transition: 'all 0.3s ease'
                }} 
                onClick={handleAddAluno}
              >
                + Nova Matrícula
              </Button>
            </Box>
          </Box>
          
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    mb: 3, 
                    p: 2, 
                    borderRadius: 3, 
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}>
                    <FormControl sx={{ 
                      minWidth: 160,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover': {
                          '& > fieldset': {
                            borderColor: '#6366f1'
                          }
                        }
                      }
                    }}>
                      <InputLabel id="turma-select-label">Turma</InputLabel>
                      <Select
                        labelId="turma-select-label"
                        value={turmaSelecionada}
                        label="Selecione a turma"
                        onChange={e => setTurmaSelecionada(e.target.value)}
                        required
                      >
                        <MenuItem value="">Selecione</MenuItem>
                        <MenuItem value="todos">Todos</MenuItem>
                        {Object.entries(turmas).map(([id, turma]) => (
                          <MenuItem key={id} value={id}>{turma.nome}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Nome"
                      value={filtroNome}
                      onChange={e => setFiltroNome(e.target.value)}
                      placeholder="Digite o nome"
                      variant="outlined"
                      fullWidth
                      disabled={turmaSelecionada === ""}
                      sx={{
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
                    <TextField
                      label="Matrícula"
                      value={filtroMatricula}
                      onChange={e => setFiltroMatricula(e.target.value)}
                      placeholder="Digite a matrícula"
                      variant="outlined"
                      fullWidth
                      disabled={turmaSelecionada === ""}
                      sx={{
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
                  </Box>
                  {turmaSelecionada === '' ? (
                    <Typography component="div" variant="body2" color="text.secondary" align="center">
                      Selecione uma turma para ver os alunos.
                    </Typography>
                  ) : alunosFiltrados.length === 0 ? (
                    <Typography component="div" variant="body2" color="text.secondary" align="center">
                      Nenhum aluno encontrado para esta turma.
                    </Typography>
                  ) : (
                    <List>
                      {alunosFiltrados.map((aluno, idx) => {
                        // Determinar se é aluno inativo e inadimplente
                        const isInativo = aluno.status === 'inativo';
                        const isInadimplente = aluno.financeiro?.status === 'inadimplente';
                        const isInativoInadimplente = isInativo && aluno.inativacaoPorInadimplencia;
                        
                        // Definir cores baseadas no status
                        const getBackgroundColor = () => {
                          if (isInativoInadimplente) return '#fef2f2'; // Vermelho muito claro para inativo por inadimplência
                          if (isInadimplente) return '#fef7f0'; // Laranja muito claro para inadimplente ativo
                          if (isInativo) return '#f8fafc'; // Cinza claro para inativo normal
                          return 'white'; // Branco para ativos normais
                        };
                        
                        const getBorderColor = () => {
                          if (isInativoInadimplente) return '#fecaca'; // Vermelho claro
                          if (isInadimplente) return '#fed7aa'; // Laranja claro
                          if (isInativo) return '#e2e8f0'; // Cinza
                          return '#f1f5f9'; // Padrão
                        };
                        
                        return (
                        <Box key={idx} sx={{ mb: 1 }}>
                          <ListItem 
                            divider 
                            alignItems="flex-start" 
                            sx={{
                              borderRadius: 2,
                              bgcolor: getBackgroundColor(),
                              border: `1px solid ${getBorderColor()}`,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                bgcolor: isInativoInadimplente ? '#fee2e2' : isInadimplente ? '#fed7aa' : '#f8fafc',
                                boxShadow: isInativoInadimplente 
                                  ? '0 4px 12px rgba(239, 68, 68, 0.2)' 
                                  : isInadimplente 
                                    ? '0 4px 12px rgba(251, 146, 60, 0.2)'
                                    : '0 4px 12px rgba(99, 102, 241, 0.1)',
                                borderColor: isInativoInadimplente ? '#f87171' : isInadimplente ? '#fb923c' : '#e0e7ff'
                              }
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                      {aluno.nome}
                                    </Typography>
                                    {isInativoInadimplente && (
                                      <Chip 
                                        label="⚠️" 
                                        size="small"
                                        sx={{ 
                                          bgcolor: '#dc2626', 
                                          color: 'white', 
                                          fontSize: '0.75rem',
                                          fontWeight: 'bold',
                                          minWidth: '32px'
                                        }}
                                      />
                                    )}
                                    {isInadimplente && !isInativo && (
                                      <Chip 
                                        label="⚠️" 
                                        size="small"
                                        sx={{ 
                                          bgcolor: '#d97706', 
                                          color: 'white', 
                                          fontSize: '0.75rem',
                                          fontWeight: 'bold',
                                          minWidth: '32px'
                                        }}
                                      />
                                    )}
                                    {isInativo && !isInativoInadimplente && (
                                      <Chip 
                                        label="❌" 
                                        size="small"
                                        sx={{ 
                                          bgcolor: '#6b7280', 
                                          color: 'white', 
                                          fontSize: '0.75rem',
                                          fontWeight: 'bold',
                                          minWidth: '32px'
                                        }}
                                      />
                                    )}
                                    {/* Status da Matrícula */}
                                    <Chip 
                                      label={aluno.status === 'ativo' ? "✅" : aluno.status === 'inativo' ? "❌" : aluno.status === 'pre_matricula' ? "⏳" : "❓"} 
                                      size="small"
                                      variant="outlined"
                                      sx={{ 
                                        borderColor: aluno.status === 'ativo' ? '#059669' : aluno.status === 'inativo' ? '#dc2626' : '#d97706',
                                        color: aluno.status === 'ativo' ? '#059669' : aluno.status === 'inativo' ? '#dc2626' : '#d97706',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        minWidth: '32px'
                                      }}
                                    />
                                    
                                    {/* Indicador de Rematrícula */}
                                    <RematriculaIndicator 
                                      aluno={aluno} 
                                      financeiroService={financeiroService} 
                                    />
                                    
                                    {/* Indicador de pendências para pré-matrícula */}
                                    {aluno.status === 'pre_matricula' && (
                                      <PreMatriculaIndicator 
                                        aluno={aluno} 
                                        financeiroService={financeiroService} 
                                      />
                                    )}
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => handleEditAluno(aluno)}
                                      sx={{
                                        minWidth: 'auto',
                                        px: 1.5,
                                        borderColor: '#6366f1',
                                        color: '#6366f1',
                                        '&:hover': {
                                          bgcolor: '#f0f4ff',
                                          borderColor: '#4f46e5'
                                        }
                                      }}
                                    >
                                      ✏️
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => handleAbrirSelecaoImpressao(aluno)}
                                      sx={{
                                        minWidth: 'auto',
                                        px: 1.5,
                                        borderColor: '#059669',
                                        color: '#059669',
                                        '&:hover': {
                                          bgcolor: '#f0fdf4',
                                          borderColor: '#047857'
                                        }
                                      }}
                                      title="Imprimir Documentos"
                                    >
                                      🖨️
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => handleAbrirHistorico(aluno)}
                                      sx={{
                                        minWidth: 'auto',
                                        px: 1.5,
                                        borderColor: '#7c3aed',
                                        color: '#7c3aed',
                                        '&:hover': {
                                          bgcolor: '#faf5ff',
                                          borderColor: '#6d28d9'
                                        }
                                      }}
                                      title="Informações de Matrícula"
                                    >
                                      <EditIcon sx={{ fontSize: 16 }} />
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => handleAbrirRematricula(aluno)}
                                      sx={{
                                        minWidth: 'auto',
                                        px: 1.5,
                                        borderColor: '#d97706',
                                        color: '#d97706',
                                        '&:hover': {
                                          bgcolor: '#fffbeb',
                                          borderColor: '#b45309'
                                        }
                                      }}
                                      title="Rematrícula"
                                    >
                                      REMATRÍCULA
                                    </Button>
                                    <IconButton
                                      onClick={(e) => toggleCardExpansao(aluno.id || `${aluno.matricula}_${idx}`, e)}
                                      sx={{
                                        color: '#6366f1',
                                        '&:hover': {
                                          bgcolor: '#f0f4ff'
                                        }
                                      }}
                                    >
                                      {cardsExpandidos[aluno.id || `${aluno.matricula}_${idx}`] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                  </Box>
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography component="span" variant="body2" sx={{ color: '#6366f1', fontWeight: 500, mb: 0.5, display: 'block', mt: 1 }}>
                                    📋 Matrícula: {aluno.matricula || '--'}
                                  </Typography>
                                  <Typography component="span" variant="body2" sx={{ color: '#059669', mb: 0.5, display: 'block' }}>
                                    🏫 Turma: {getTurmaNome(aluno.turmaId)}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                          
                          {/* Seção expansível com dados detalhados */}
                          <Collapse in={cardsExpandidos[aluno.id || `${aluno.matricula}_${idx}`]} timeout="auto" unmountOnExit>
                            <Box sx={{ 
                              mt: 1, 
                              p: 2, 
                              bgcolor: '#fafbff', 
                              borderRadius: 2, 
                              border: '1px solid #e0e7ff',
                              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
                            }}>
                              <Typography component="div" variant="subtitle2" sx={{ color: '#4f46e5', fontWeight: 'bold', mb: 2 }}>
                                📊 Informações Detalhadas
                              </Typography>
                              
                              {/* Seção especial para pré-matrícula */}
                              {aluno.status === 'pre_matricula' && (
                                <Box sx={{ 
                                  mb: 2, 
                                  p: 2, 
                                  bgcolor: '#fef7f0', 
                                  borderRadius: 2, 
                                  border: '1px solid #fed7aa' 
                                }}>
                                  <Typography component="div" variant="body2" sx={{ fontWeight: 'bold', color: '#d97706', mb: 1 }}>
                                    ⏳ Status de Pré-Matrícula
                                  </Typography>
                                  <PreMatriculaDetalhes aluno={aluno} />
                                </Box>
                              )}
                              
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                {/* Dados Pessoais */}
                                <Box>
                                  <Typography component="div" variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                                    👤 Dados Pessoais
                                  </Typography>
                                  {aluno.dataNascimento && (
                                    <Typography component="span" variant="body2" sx={{ color: '#64748b', mb: 0.5, display: 'block' }}>
                                      🎂 Nascimento: {aluno.dataNascimento}
                                    </Typography>
                                  )}
                                  {aluno.cpf && (
                                    <Typography component="span" variant="body2" sx={{ color: '#64748b', mb: 0.5, display: 'block' }}>
                                      🆔 CPF: {aluno.cpf}
                                    </Typography>
                                  )}
                                  {aluno.endereco && (
                                    <Typography component="span" variant="body2" sx={{ color: '#64748b', mb: 0.5, display: 'block' }}>
                                      🏠 Endereço: {typeof aluno.endereco === 'string' 
                                        ? aluno.endereco 
                                        : `${aluno.endereco.rua || ''}, ${aluno.endereco.bairro || ''}, ${aluno.endereco.cidade || ''} - ${aluno.endereco.uf || ''}, CEP: ${aluno.endereco.cep || ''}`
                                      }
                                    </Typography>
                                  )}
                                  {aluno.telefone && (
                                    <Typography component="span" variant="body2" sx={{ color: '#64748b', mb: 0.5, display: 'block' }}>
                                      📞 Telefone: {aluno.telefone}
                                    </Typography>
                                  )}
                                </Box>
                                
                                {/* Dados Familiares */}
                                <Box>
                                  <Typography component="div" variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                                    👨‍👩‍👧‍👦 Família
                                  </Typography>
                                  {(aluno.nomePai || aluno.pai?.nome) && (
                                    <Typography component="span" variant="body2" sx={{ color: '#64748b', mb: 0.5, display: 'block' }}>
                                      👨 Pai: {aluno.nomePai || aluno.pai?.nome}
                                    </Typography>
                                  )}
                                  {(aluno.nomeMae || aluno.mae?.nome) && (
                                    <Typography component="span" variant="body2" sx={{ color: '#64748b', mb: 0.5, display: 'block' }}>
                                      👩 Mãe: {aluno.nomeMae || aluno.mae?.nome}
                                    </Typography>
                                  )}
                                  {aluno.responsavelUsuario && (
                                    <Typography component="span" variant="body2" sx={{ color: '#8b5cf6', fontWeight: 500, mb: 0.5, display: 'block' }}>
                                      👤 Responsável: {aluno.responsavelUsuario.nome} ({aluno.responsavelUsuario.email})
                                    </Typography>
                                  )}
                                  {aluno.contatoEmergencia && aluno.contatoEmergencia.nome && (
                                    <Typography component="span" variant="body2" sx={{ color: '#dc2626', mb: 0.5, display: 'block' }}>
                                      🚨 Emergência: {aluno.contatoEmergencia.nome} ({aluno.contatoEmergencia.telefone})
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                              
                              {/* Status Financeiro */}
                              {aluno.financeiro && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography component="div" variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                                      💰 Informações Financeiras
                                    </Typography>
                                    
                                    {/* Botão de atalho para inadimplência */}
                                    {(aluno.financeiro.status === 'inadimplente' || (isInativo && aluno.inativacaoPorInadimplencia)) && (
                                      <InadimplenciaBotaoAtalho aluno={aluno} />
                                    )}
                                  </Box>
                                  
                                  <Typography component="span" variant="body2" sx={{ 
                                    color: aluno.financeiro.status === 'ativo' ? '#059669' : aluno.financeiro.status === 'inadimplente' ? '#d97706' : '#dc2626',
                                    fontWeight: 500,
                                    mb: 0.5,
                                    display: 'block'
                                  }}>
                                    Status: {aluno.financeiro.status?.toUpperCase() || 'INDEFINIDO'}
                                  </Typography>
                                  {aluno.financeiro.mensalidadeValor && (
                                    <Typography component="span" variant="body2" sx={{ color: '#64748b', mb: 0.5, display: 'block' }}>
                                      💵 Mensalidade: R$ {parseFloat(aluno.financeiro.mensalidadeValor).toFixed(2)}
                                    </Typography>
                                  )}
                                  {aluno.financeiro.descontoPercentual && (
                                    <Typography component="span" variant="body2" sx={{ color: '#059669', mb: 0.5, display: 'block' }}>
                                      💸 Desconto: {aluno.financeiro.descontoPercentual}%
                                    </Typography>
                                  )}
                                  {aluno.financeiro.diaVencimento && (
                                    <Typography component="span" variant="body2" sx={{ color: '#64748b', mb: 0.5, display: 'block' }}>
                                      📅 Vencimento: Dia {aluno.financeiro.diaVencimento}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </Box>
                        );
                      })}
                    </List>
                  )}
                  <Dialog open={editOpen} onClose={handleTentarFecharModal} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      pr: 1,
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white',
                      borderRadius: '4px 4px 0 0'
                    }}>
                      <span>
                        {isNew ? "Nova Matrícula" : "Editar Aluno"} 
                        {formStep === 1 && ' - Dados Pessoais'}
                        {formStep === 2 && ' - Dados da Mãe'}
                        {formStep === 3 && ' - Dados do Pai'}
                        {formStep === 4 && ' - Contato de Emergência'}
                        {formStep === 5 && ' - Informações de Saúde'}
                        {formStep === 6 && ' - Dados Financeiros'}
                      </span>
                      <IconButton aria-label="fechar" onClick={handleTentarFecharModal} size="small" sx={{ ml: 2 }}>
                        <span style={{ fontSize: 22, fontWeight: 'bold' }}>&times;</span>
                      </IconButton>
                    </DialogTitle>
                    <DialogContent>
                      {formError && <Box sx={{ mb: 2 }}><Alert severity="error">{formError}</Alert></Box>}
                      
                      {/* Aba 1: Dados Pessoais */}
                      {formStep === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Typography variant="h6" sx={{ color: '#6366f1', mb: 1 }}>
                            👤 Informações Pessoais do Aluno
                          </Typography>
                          
                          {/* Foto do aluno */}
                          <Box sx={{ textAlign: 'center', mb: 2 }}>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              ref={inputFotoRef}
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  setFotoAluno(file);
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    setEditForm(prev => ({ ...prev, foto: e.target.result }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <Box 
                              sx={{ 
                                width: 120, 
                                height: 120, 
                                border: '2px dashed #d1d5db', 
                                borderRadius: '50%',
                                mx: 'auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                backgroundImage: editForm.foto ? `url(${editForm.foto})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                '&:hover': { borderColor: '#6366f1' }
                              }}
                              onClick={() => inputFotoRef.current?.click()}
                            >
                              {!editForm.foto && (
                                <Box sx={{ textAlign: 'center', color: '#9ca3af' }}>
                                  <Typography variant="body2">📷</Typography>
                                  <Typography variant="caption">Foto</Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>

                          <TextField
                            label="Nome Completo"
                            name="nome"
                            value={editForm.nome || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required
                          />
                          
                          <TextField
                            label="Matrícula"
                            name="matricula"
                            value={editForm.matricula || ''}
                            fullWidth
                            InputProps={{ readOnly: true }}
                            required
                          />
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                              <DatePicker
                                label="Data de Nascimento"
                                format="DD/MM/YYYY"
                                value={editForm.dataNascimento ? dayjs(editForm.dataNascimento, 'DD/MM/YYYY') : null}
                                onChange={newValue => setEditForm(prev => ({ ...prev, dataNascimento: newValue ? newValue.format('DD/MM/YYYY') : '' }))}
                                slotProps={{ textField: { fullWidth: true, required: true } }}
                              />
                            </LocalizationProvider>
                            
                            <TextField
                              label="CPF"
                              name="cpf"
                              value={editForm.cpf || ''}
                              onChange={handleFormChange}
                              fullWidth
                              required
                              error={editForm.cpf && !validacaoCpf.aluno}
                              helperText={editForm.cpf && !validacaoCpf.aluno ? 'CPF inválido' : ''}
                            />
                          </Box>
                          
                          <Typography variant="subtitle2" sx={{ color: '#374151', mt: 2 }}>
                            🏠 Endereço Residencial
                          </Typography>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 2 }}>
                            <TextField
                              label="CEP"
                              name="endereco.cep"
                              value={editForm.endereco?.cep || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').substring(0, 8);
                                setEditForm(prev => ({
                                  ...prev,
                                  endereco: {
                                    ...(prev.endereco || {}),
                                    cep: value
                                  }
                                }));
                                
                                // Buscar endereço automaticamente quando CEP estiver completo
                                if (value.length === 8) {
                                  buscarEnderecoPorCep(value, 'endereco');
                                }
                              }}
                              required
                              helperText={buscandoCep ? 'Buscando endereço...' : 'Digite o CEP (apenas números)'}
                            />
                            {buscandoCep && <CircularProgress size={20} />}
                          </Box>
                          
                          <TextField
                            label="Rua/Logradouro"
                            name="endereco.rua"
                            value={editForm.endereco?.rua || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required
                          />
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                              label="Bairro"
                              name="endereco.bairro"
                              value={editForm.endereco?.bairro || ''}
                              onChange={handleFormChange}
                              required
                            />
                            <TextField
                              label="Cidade"
                              name="endereco.cidade"
                              value={editForm.endereco?.cidade || ''}
                              onChange={handleFormChange}
                              required
                            />
                          </Box>
                          
                          <Typography variant="subtitle2" sx={{ color: '#374151', mt: 2 }}>
                            🏫 Informações Escolares
                          </Typography>
                          
                          <FormControl fullWidth required>
                            <InputLabel>Turma</InputLabel>
                            <Select
                              name="turmaId"
                              value={editForm.turmaId || ''}
                              label="Turma"
                              onChange={handleFormChange}
                              required
                            >
                              {Object.entries(turmas).map(([id, turma]) => (
                                <MenuItem key={id} value={id}>{turma.nome}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                              label="Série"
                              name="serie"
                              value={editForm.serie || ''}
                              onChange={handleFormChange}
                              placeholder="Ex: 1º Ano, 2º Ano, etc."
                            />
                            <TextField
                              label="Turno"
                              value={dadosTurma?.turno || ''}
                              InputProps={{ readOnly: true }}
                              sx={{ bgcolor: '#f8fafc' }}
                              helperText="Turno vem automaticamente da turma selecionada"
                            />
                          </Box>
                        </Box>
                      )}
                      
                      {/* Aba 2: Dados da Mãe */}
                      {formStep === 2 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" sx={{ color: '#6366f1' }}>
                              👩 Informações da Mãe
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    name="mae.responsavelFinanceiro"
                                    checked={editForm.mae?.responsavelFinanceiro || false}
                                    onChange={handleFormChange}
                                  />
                                }
                                label="Responsável Financeiro"
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    name="mae.responsavelLegal"
                                    checked={editForm.mae?.responsavelLegal || false}
                                    onChange={handleFormChange}
                                  />
                                }
                                label="Responsável Legal"
                              />
                            </Box>
                          </Box>
                          
                          <TextField
                            label="Nome Completo"
                            name="mae.nome"
                            value={editForm.mae?.nome || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required={editForm.mae?.responsavelFinanceiro}
                          />
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                            <TextField
                              label="RG"
                              name="mae.rg"
                              value={editForm.mae?.rg || ''}
                              onChange={handleFormChange}
                              required={editForm.mae?.responsavelFinanceiro}
                            />
                            <TextField
                              label="CPF"
                              name="mae.cpf"
                              value={editForm.mae?.cpf || ''}
                              onChange={handleFormChange}
                              required={editForm.mae?.responsavelFinanceiro}
                              error={editForm.mae?.cpf && !validacaoCpf.mae}
                              helperText={editForm.mae?.cpf && !validacaoCpf.mae ? 'CPF inválido' : ''}
                            />
                            <TextField
                              label="Nacionalidade"
                              name="mae.nacionalidade"
                              value={editForm.mae?.nacionalidade || ''}
                              onChange={handleFormChange}
                              required={editForm.mae?.responsavelFinanceiro}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                              label="Escolaridade"
                              name="mae.escolaridade"
                              value={editForm.mae?.escolaridade || ''}
                              onChange={handleFormChange}
                              required={editForm.mae?.responsavelFinanceiro}
                            />
                            <TextField
                              label="Profissão"
                              name="mae.profissao"
                              value={editForm.mae?.profissao || ''}
                              onChange={handleFormChange}
                              required={editForm.mae?.responsavelFinanceiro}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                              label="Celular"
                              name="mae.celular"
                              value={editForm.mae?.celular || ''}
                              onChange={handleFormChange}
                              required={editForm.mae?.responsavelFinanceiro}
                            />
                            <TextField
                              label="Email"
                              name="mae.email"
                              type="email"
                              value={editForm.mae?.email || ''}
                              onChange={handleFormChange}
                              required={editForm.mae?.responsavelFinanceiro}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: '#374151' }}>
                              🏠 Endereço da Mãe
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => copiarEnderecoAluno('mae')}
                              startIcon={<ContentCopy />}
                              sx={{ 
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1.5,
                                borderColor: '#6366f1',
                                color: '#6366f1',
                                '&:hover': {
                                  borderColor: '#4f46e5',
                                  bgcolor: '#f0f4ff'
                                }
                              }}
                            >
                              Copiar endereço do aluno
                            </Button>
                          </Box>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 2 }}>
                            <TextField
                              label="CEP"
                              name="mae.endereco.cep"
                              value={editForm.mae?.endereco?.cep || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').substring(0, 8);
                                setEditForm(prev => ({
                                  ...prev,
                                  mae: {
                                    ...(prev.mae || {}),
                                    endereco: {
                                      ...(prev.mae?.endereco || {}),
                                      cep: value
                                    }
                                  }
                                }));
                                
                                // Buscar endereço automaticamente quando CEP estiver completo
                                if (value.length === 8) {
                                  buscarEnderecoPorCep(value, 'mae');
                                }
                              }}
                              required={editForm.mae?.responsavelFinanceiro}
                              helperText={buscandoCep ? 'Buscando endereço...' : ''}
                            />
                            {buscandoCep && <CircularProgress size={20} />}
                          </Box>
                          
                          <TextField
                            label="Rua/Logradouro"
                            name="mae.endereco.rua"
                            value={editForm.mae?.endereco?.rua || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required={editForm.mae?.responsavelFinanceiro}
                          />
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                              label="Bairro"
                              name="mae.endereco.bairro"
                              value={editForm.mae?.endereco?.bairro || ''}
                              onChange={handleFormChange}
                              required={editForm.mae?.responsavelFinanceiro}
                            />
                            <TextField
                              label="Cidade"
                              name="mae.endereco.cidade"
                              value={editForm.mae?.endereco?.cidade || ''}
                              onChange={handleFormChange}
                              required={editForm.mae?.responsavelFinanceiro}
                            />
                          </Box>
                        </Box>
                      )}
                      
                      {/* Aba 3: Dados do Pai */}
                      {formStep === 3 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" sx={{ color: '#6366f1' }}>
                              👨 Informações do Pai
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    name="pai.responsavelFinanceiro"
                                    checked={editForm.pai?.responsavelFinanceiro || false}
                                    onChange={handleFormChange}
                                  />
                                }
                                label="Responsável Financeiro"
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    name="pai.responsavelLegal"
                                    checked={editForm.pai?.responsavelLegal || false}
                                    onChange={handleFormChange}
                                  />
                                }
                                label="Responsável Legal"
                              />
                            </Box>
                          </Box>
                          
                          <TextField
                            label="Nome Completo"
                            name="pai.nome"
                            value={editForm.pai?.nome || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required={editForm.pai?.responsavelFinanceiro}
                          />
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                            <TextField
                              label="RG"
                              name="pai.rg"
                              value={editForm.pai?.rg || ''}
                              onChange={handleFormChange}
                              required={editForm.pai?.responsavelFinanceiro}
                            />
                            <TextField
                              label="CPF"
                              name="pai.cpf"
                              value={editForm.pai?.cpf || ''}
                              onChange={handleFormChange}
                              required={editForm.pai?.responsavelFinanceiro}
                              error={editForm.pai?.cpf && !validacaoCpf.pai}
                              helperText={editForm.pai?.cpf && !validacaoCpf.pai ? 'CPF inválido' : ''}
                            />
                            <TextField
                              label="Nacionalidade"
                              name="pai.nacionalidade"
                              value={editForm.pai?.nacionalidade || ''}
                              onChange={handleFormChange}
                              required={editForm.pai?.responsavelFinanceiro}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                              label="Escolaridade"
                              name="pai.escolaridade"
                              value={editForm.pai?.escolaridade || ''}
                              onChange={handleFormChange}
                              required={editForm.pai?.responsavelFinanceiro}
                            />
                            <TextField
                              label="Profissão"
                              name="pai.profissao"
                              value={editForm.pai?.profissao || ''}
                              onChange={handleFormChange}
                              required={editForm.pai?.responsavelFinanceiro}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                              label="Celular"
                              name="pai.celular"
                              value={editForm.pai?.celular || ''}
                              onChange={handleFormChange}
                              required={editForm.pai?.responsavelFinanceiro}
                            />
                            <TextField
                              label="Email"
                              name="pai.email"
                              type="email"
                              value={editForm.pai?.email || ''}
                              onChange={handleFormChange}
                              required={editForm.pai?.responsavelFinanceiro}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: '#374151' }}>
                              🏠 Endereço do Pai
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => copiarEnderecoAluno('pai')}
                              startIcon={<ContentCopy />}
                              sx={{ 
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1.5,
                                borderColor: '#6366f1',
                                color: '#6366f1',
                                '&:hover': {
                                  borderColor: '#4f46e5',
                                  bgcolor: '#f0f4ff'
                                }
                              }}
                            >
                              Copiar endereço do aluno
                            </Button>
                          </Box>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 2 }}>
                            <TextField
                              label="CEP"
                              name="pai.endereco.cep"
                              value={editForm.pai?.endereco?.cep || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').substring(0, 8);
                                setEditForm(prev => ({
                                  ...prev,
                                  pai: {
                                    ...(prev.pai || {}),
                                    endereco: {
                                      ...(prev.pai?.endereco || {}),
                                      cep: value
                                    }
                                  }
                                }));
                                
                                // Buscar endereço automaticamente quando CEP estiver completo
                                if (value.length === 8) {
                                  buscarEnderecoPorCep(value, 'pai');
                                }
                              }}
                              required={editForm.pai?.responsavelFinanceiro}
                              helperText={buscandoCep ? 'Buscando endereço...' : ''}
                            />
                            {buscandoCep && <CircularProgress size={20} />}
                          </Box>
                          
                          <TextField
                            label="Rua/Logradouro"
                            name="pai.endereco.rua"
                            value={editForm.pai?.endereco?.rua || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required={editForm.pai?.responsavelFinanceiro}
                          />
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                              label="Bairro"
                              name="pai.endereco.bairro"
                              value={editForm.pai?.endereco?.bairro || ''}
                              onChange={handleFormChange}
                              required={editForm.pai?.responsavelFinanceiro}
                            />
                            <TextField
                              label="Cidade"
                              name="pai.endereco.cidade"
                              value={editForm.pai?.endereco?.cidade || ''}
                              onChange={handleFormChange}
                              required={editForm.pai?.responsavelFinanceiro}
                            />
                          </Box>
                        </Box>
                      )}
                      
                      {/* Aba 4: Contato de Emergência */}
                      {formStep === 4 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Typography variant="h6" sx={{ color: '#6366f1', mb: 2 }}>
                            🚨 Contato de Emergência
                          </Typography>
                          
                          <TextField
                            label="Nome Completo"
                            name="contatoEmergenciaNome"
                            value={editForm.contatoEmergencia?.nome || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required
                          />
                          
                          <TextField
                            label="Parentesco"
                            name="contatoEmergenciaParentesco"
                            value={editForm.contatoEmergencia?.parentesco || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required
                            placeholder="Ex: Tio(a), Avô(ó), Irmão(ã)"
                          />
                          
                          <TextField
                            label="Telefone/Celular"
                            name="contatoEmergenciaTelefone"
                            value={editForm.contatoEmergencia?.telefone || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required
                          />
                          
                          <Alert severity="info">
                            📞 Este contato será acionado em casos de emergência quando não for possível localizar os responsáveis diretos.
                          </Alert>
                        </Box>
                      )}
                      
                      {/* Aba 5: Informações de Saúde */}
                      {formStep === 5 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <Typography variant="h6" sx={{ color: '#6366f1', mb: 2 }}>
                            🏥 Informações de Saúde
                          </Typography>
                          
                          {/* Componente para questões de saúde */}
                          {[
                            { key: 'doencasJaTeve', label: 'Doenças que a criança já teve' },
                            { key: 'alergias', label: 'Alergias alimentares ou outras' },
                            { key: 'alergiaRemedio', label: 'Alergia a medicamentos' },
                            { key: 'problemaSaude', label: 'Problema de saúde atual' },
                            { key: 'acompanhamentoTerapeutico', label: 'Acompanhamento terapêutico' },
                            { key: 'medicacaoContinua', label: 'Medicação contínua' },
                            { key: 'acompanhamentoMedico', label: 'Acompanhamento médico regular' }
                          ].map((item) => (
                            <Box key={item.key} sx={{ 
                              p: 2, 
                              border: '1px solid #e5e7eb', 
                              borderRadius: 2,
                              '&:hover': { borderColor: '#6366f1' }
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                                {item.label}
                              </Typography>
                              
                              <RadioGroup
                                row
                                value={editForm.saude?.[item.key]?.tem ? 'sim' : 'nao'}
                                onChange={(e) => {
                                  const tem = e.target.value === 'sim';
                                  setEditForm(prev => ({
                                    ...prev,
                                    saude: {
                                      ...prev.saude,
                                      [item.key]: {
                                        tem,
                                        quais: tem ? prev.saude?.[item.key]?.quais || '' : ''
                                      }
                                    }
                                  }));
                                }}
                              >
                                <FormControlLabel value="nao" control={<Radio />} label="Não" />
                                <FormControlLabel value="sim" control={<Radio />} label="Sim" />
                              </RadioGroup>
                              
                              {editForm.saude?.[item.key]?.tem && (
                                <TextField
                                  label="Quais?"
                                  name={`saude.${item.key}.quais`}
                                  value={editForm.saude?.[item.key]?.quais || ''}
                                  onChange={handleFormChange}
                                  fullWidth
                                  multiline
                                  rows={2}
                                  sx={{ mt: 1 }}
                                  placeholder="Descreva detalhadamente..."
                                />
                              )}
                            </Box>
                          ))}
                          
                          <Alert severity="warning">
                            ⚠️ Importante: Todas as informações de saúde são confidenciais e serão utilizadas apenas para garantir o bem-estar e segurança do aluno.
                          </Alert>
                        </Box>
                      )}
                      
                      {/* Aba 6: Dados Financeiros */}
                      {formStep === 6 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            Sistema Financeiro Automático:\n\nSe informar valor de matrícula ou materiais, o aluno ficará em "pré-matrícula" até o pagamento.\nMensalidades serão geradas automaticamente do mês atual até dezembro.\nStatus financeiro será atualizado automaticamente conforme pagamentos.\n\nSobre Pré-Matrícula:\nAluno fica com acesso restrito até quitação dos valores obrigatórios.\nAtivação automática após pagamento de matrícula/materiais.\nMensalidades continuam sendo geradas normalmente.
                          </Alert>
                          
                          {/* Alerta especial para alunos em pré-matrícula */}
                          {!isNew && editForm.status === 'pre_matricula' && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                              ⏳ Este aluno está em PRÉ-MATRÍCULA\n📊 Verificar na seção "Informações Detalhadas" quais pagamentos estão pendentes.\n✅ O aluno será ativado automaticamente após quitação dos valores obrigatórios.
                            </Alert>
                          )}
                          
                          <TextField
                            label="Valor da Matrícula (R$)"
                            name="financeiro.valorMatricula"
                            type="number"
                            value={editForm.financeiro?.valorMatricula || ''}
                            onChange={handleFormChange}
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                            helperText="Deixe em branco se não há taxa de matrícula"
                          />
                          
                          <TextField
                            label="Valor dos Materiais (R$)"
                            name="financeiro.valorMateriais"
                            type="number"
                            value={editForm.financeiro?.valorMateriais || ''}
                            onChange={handleFormChange}
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                            helperText="Deixe em branco se não há taxa de materiais"
                          />
                          
                          <TextField
                            label="Mensalidade (R$)"
                            name="financeiro.mensalidadeValor"
                            type="number"
                            value={editForm.financeiro?.mensalidadeValor || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                          
                          <TextField
                            label="Desconto (%)"
                            name="financeiro.descontoPercentual"
                            type="number"
                            value={editForm.financeiro?.descontoPercentual || ''}
                            onChange={handleFormChange}
                            fullWidth
                            inputProps={{ min: 0, max: 100, step: 0.1 }}
                          />
                          
                          <TextField
                            label="Multa por Atraso (%)"
                            name="financeiro.percentualMulta"
                            type="number"
                            value={editForm.financeiro?.percentualMulta ?? 2}
                            onChange={handleFormChange}
                            fullWidth
                            inputProps={{ min: 0, max: 100, step: 0.1 }}
                            helperText="Percentual de multa aplicado sobre o valor em caso de atraso (padrão: 2%)"
                          />
                          
                          <TextField
                            label="Juros por Dia de Atraso (%)"
                            name="financeiro.jurosDia"
                            type="number"
                            value={editForm.financeiro?.jurosDia ?? 0.033}
                            onChange={handleFormChange}
                            fullWidth
                            inputProps={{ min: 0, max: 100, step: 0.001 }}
                            helperText="Percentual de juros por dia de atraso (padrão: 0,033% = 1% ao mês)"
                          />
                          
                          <Box sx={{ fontSize: 14, color: 'text.secondary', mt: -1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            📊 <strong>Resumo Financeiro:</strong><br />
                            Mensalidade original: R$ {(parseFloat(editForm.financeiro?.mensalidadeValor || '0')).toFixed(2)}<br />
                            Desconto: {(parseFloat(editForm.financeiro?.descontoPercentual || '0')).toFixed(1)}%<br />
                            <strong>Valor final: R$ {valorComDesconto.toFixed(2)}</strong><br />
                            <Box component="span" sx={{ fontSize: 12, color: 'warning.main', mt: 1, display: 'block' }}>
                              ⚠️ Multa: {(parseFloat(editForm.financeiro?.percentualMulta ?? 2)).toFixed(1)}% | 
                              Juros: {(parseFloat(editForm.financeiro?.jurosDia ?? 0.033)).toFixed(3)}%/dia
                            </Box>
                          </Box>
                          
                          <TextField
                            label="Dia de Vencimento"
                            name="financeiro.diaVencimento"
                            type="number"
                            value={editForm.financeiro?.diaVencimento || '10'}
                            onChange={handleFormChange}
                            fullWidth
                            required
                            inputProps={{ min:1, max:31 }}
                            error={!!financeiroError}
                            helperText={financeiroError || 'Entre 1 e 31 (dia do mês para vencimento das mensalidades)'}
                          />
                          
                          <Alert severity="info" icon={<InfoOutlined />} sx={{ mt: 2, mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              📅 Competência das Mensalidades
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                              Defina o período de geração das mensalidades. Por exemplo:<br />
                              • <strong>Início: 01/02/2025</strong> e <strong>Fim: 31/12/2025</strong> = gera mensalidades de fevereiro a dezembro<br />
                              • As mensalidades serão geradas automaticamente dentro deste período<br />
                              • <strong>Importante:</strong> Taxa de matrícula e materiais são geradas sempre no mês de cadastro com vencimento em 7 dias
                            </Typography>
                          </Alert>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                              label="Data Início Competência"
                              name="financeiro.dataInicioCompetencia"
                              type="date"
                              value={editForm.financeiro?.dataInicioCompetencia || ''}
                              onChange={handleFormChange}
                              fullWidth
                              required
                              InputLabelProps={{ shrink: true }}
                              helperText="Primeiro mês das mensalidades"
                            />
                            
                            <TextField
                              label="Data Fim Competência"
                              name="financeiro.dataFimCompetencia"
                              type="date"
                              value={editForm.financeiro?.dataFimCompetencia || ''}
                              onChange={handleFormChange}
                              fullWidth
                              required
                              InputLabelProps={{ shrink: true }}
                              helperText="Último mês das mensalidades"
                            />
                          </Box>
                          
                          <FormControl fullWidth required>
                            <InputLabel id="status-financeiro-label">Status Financeiro Inicial</InputLabel>
                            <Select
                              labelId="status-financeiro-label"
                              name="financeiro.status"
                              value={editForm.financeiro?.status || 'ativo'}
                              label="Status Financeiro Inicial"
                              onChange={handleFormChange}
                              required
                            >
                              <MenuItem value="ativo">Ativo</MenuItem>
                              <MenuItem value="inadimplente">Inadimplente</MenuItem>
                              <MenuItem value="suspenso">Suspenso</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField
                              label="Observações"
                              name="financeiro.observacoes"
                              value={editForm.financeiro?.observacoes}
                              onChange={handleFormChange}
                              fullWidth
                              multiline
                              minRows={3}
                          />
                          {/* Campo de anexos estilizado */}
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2">Anexos do Aluno</Typography>
                            <input
                              type="file"
                              multiple
                              accept="image/*,application/pdf"
                              style={{ display: 'none' }}
                              ref={inputFileRef}
                              onChange={e => {
                                const novos = Array.from(e.target.files);
                                setAnexosSelecionados(prev => [...prev, ...novos]);
                                e.target.value = '';
                              }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                              <Button
                                variant="outlined"
                                onClick={() => inputFileRef.current && inputFileRef.current.click()}
                              >
                                Selecionar arquivos
                              </Button>
                              <Button
                                variant="outlined"
                                color="info"
                                onClick={() => setDialogAnexosOpen(true)}
                                disabled={!editForm.anexos || editForm.anexos.length === 0}
                              >
                                Visualizar anexos
                              </Button>
                            </Box>
                            {anexosSelecionados.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2">Arquivos selecionados:</Typography>
                                <ul>
                                  {anexosSelecionados.map((file, idx) => (
                                    <li key={idx}>{file.name}</li>
                                  ))}
                                </ul>
                              </Box>
                            )}
                            {/* Dialog para visualizar anexos já enviados */}
                            <Dialog open={dialogAnexosOpen || false} onClose={() => setDialogAnexosOpen(false)}>
                              <DialogTitle>Anexos enviados</DialogTitle>
                              <DialogContent>
                                {editForm.anexos && editForm.anexos.length > 0 ? (
                                  <ul>
                                    {editForm.anexos.map((anexo, idx) => (
                                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ textDecoration: anexosParaExcluir.includes(anexo.name) ? 'line-through' : 'none', color: anexosParaExcluir.includes(anexo.name) ? '#888' : 'inherit' }}>
                                          <a href={anexo.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', pointerEvents: anexosParaExcluir.includes(anexo.name) ? 'none' : 'auto' }}>{anexo.name}</a>
                                        </span>
                                        <IconButton aria-label="remover" size="small" color={anexosParaExcluir.includes(anexo.name) ? 'default' : 'error'} onClick={() => handleMarcarParaExcluir(anexo.name)}>
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <Typography>Nenhum anexo enviado.</Typography>
                                )}
                              </DialogContent>
                              <DialogActions>
                                <Button onClick={() => setDialogAnexosOpen(false)} color="primary">Fechar</Button>
                              </DialogActions>
                            </Dialog>
                          </Box>
                        </Box>
                      )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1 }}>
                      {/* Botão Voltar */}
                      {formStep > 1 && (
                        <IconButton 
                          onClick={() => setFormStep(formStep - 1)} 
                          color="inherit" 
                          size="small" 
                          sx={{ mr: 1 }} 
                          aria-label="voltar"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </IconButton>
                      )}
                      
                      {/* Indicador de progresso */}
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {[1, 2, 3, 4, 5, 6].map((step) => (
                          <Box
                            key={step}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: step <= formStep ? '#6366f1' : '#e5e7eb',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        ))}
                        <Typography variant="body2" sx={{ ml: 1, color: '#6b7280' }}>
                          {formStep}/6
                        </Typography>
                      </Box>

                      {/* Verificação de responsável financeiro */}
                      {(formStep === 2 || formStep === 3) && (
                        <Alert severity="warning" size="small" sx={{ maxWidth: 300 }}>
                          {!editForm.mae?.responsavelFinanceiro && !editForm.pai?.responsavelFinanceiro ? 
                            '⚠️ É obrigatório marcar um responsável financeiro!' : 
                            `✅ ${editForm.mae?.responsavelFinanceiro ? 'Mãe' : 'Pai'} é o responsável financeiro`
                          }
                        </Alert>
                      )}
                      
                      {/* Botões de ação */}
                      {formStep < 6 && (
                        <Button 
                          onClick={() => setFormStep(formStep + 1)}
                          disabled={
                            (formStep === 1 && !isStep1Valid()) ||
                            (formStep === 2 && editForm.mae?.responsavelFinanceiro && !isMaeValid()) ||
                            (formStep === 3 && editForm.pai?.responsavelFinanceiro && !isPaiValid()) ||
                            (formStep === 4 && !isEmergenciaValid()) ||
                            ((formStep === 2 || formStep === 3) && !editForm.mae?.responsavelFinanceiro && !editForm.pai?.responsavelFinanceiro)
                          }
                          sx={{
                            bgcolor: '#6366f1',
                            color: 'white',
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: '#5b59f0',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Avançar →
                        </Button>
                      )}
                      
                      {/* Botões de ação da última aba */}
                      {formStep === 6 && (
                        <>
                          {!isNew && editForm.turmaId && editForm.turmaId !== '' && (
                            <Button
                              onClick={async () => {
                                const turmaAnterior = getTurmaNome(editForm.turmaId);
                                setEditForm(prev => ({ ...prev, turmaId: '' }));
                                
                                // Log da desvinculação de turma
                                if (editAluno && editAluno.id) {
                                  await auditService.auditService?.logAction(
                                    LOG_ACTIONS.CLASS_REMOVE_STUDENT,
                                    userId,
                                    {
                                      entityId: editAluno.id,
                                      description: `Aluno ${editForm.nome} desvinculado da turma ${turmaAnterior}`,
                                      changes: {
                                        turmaAnterior: turmaAnterior,
                                        turmaNova: 'Sem turma'
                                      }
                                    }
                                  );
                                }
                              }}
                              color="info"
                              variant="outlined"
                              size="small"
                              disabled={saving}
                              sx={{ fontSize: '0.80rem', textTransform: 'none', py: 0.5, px: 1.2 }}
                            >
                              Desvincular Turma
                            </Button>
                          )}
                          
                          {!isNew && editForm.status === 'inativo' && (
                            <Button 
                              onClick={handleAtivarAluno}
                              sx={{
                                borderColor: '#059669',
                                color: '#059669',
                                borderRadius: 2,
                                '&:hover': {
                                  bgcolor: '#f0fdf4',
                                  borderColor: '#047857',
                                  color: '#047857'
                                }
                              }}
                              variant="outlined" 
                              disabled={saving}
                            >
                              ✓ Ativar
                            </Button>
                          )}
                          
                          {!isNew && editForm.status !== 'inativo' && (
                            <Button 
                              onClick={handleInativarAluno} 
                              sx={{
                                borderColor: '#d97706',
                                color: '#d97706',
                                borderRadius: 2,
                                '&:hover': {
                                  bgcolor: '#fffbeb',
                                  borderColor: '#b45309',
                                  color: '#b45309'
                                }
                              }}
                              variant="outlined" 
                              disabled={saving}
                            >
                              ⚠ Inativar
                            </Button>
                          )}
                          
                          {gerandoTitulos && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                              <CircularProgress size={16} />
                              <Typography variant="body2">Gerando títulos financeiros...</Typography>
                            </Box>
                          )}
                          
                          <Button 
                            onClick={handleSaveEdit} 
                            sx={{
                              bgcolor: '#059669',
                              color: 'white',
                              borderRadius: 2,
                              minWidth: 100,
                              '&:hover': {
                                bgcolor: '#047857',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                              },
                              '&:disabled': {
                                bgcolor: '#94a3b8',
                                color: 'white'
                              },
                              transition: 'all 0.3s ease'
                            }}
                            disabled={saving || !isFinalFormValid() || gerandoTitulos}
                          >
                            {saving ? '💾 Salvando...' : gerandoTitulos ? '🔄 Gerando títulos...' : isNew ? '✓ Criar Matrícula' : '✓ Salvar'}
                          </Button>
                        </>
                      )}
                      
                      {resultadoTitulos && (
                        <Alert severity="success" sx={{ mt: 1 }}>
                          <span>
                            🎉 Títulos gerados com sucesso!{'\n'}
                            {resultadoTitulos.matricula > 0 && `• Taxa de matrícula: R$ ${(parseFloat(resultadoTitulos.detalhes.find(t => t.tipo === 'matricula')?.valor) || 0).toFixed(2)}\n`}
                            {resultadoTitulos.materiais > 0 && `• Taxa de materiais: R$ ${(parseFloat(resultadoTitulos.detalhes.find(t => t.tipo === 'materiais')?.valor) || 0).toFixed(2)}\n`}
                            • Mensalidades: {resultadoTitulos.mensalidades} títulos{'\n'}
                            • Total: R$ {(parseFloat(resultadoTitulos.valorTotal) || 0).toFixed(2)}
                          </span>
                        </Alert>
                      )}
                    </DialogActions>
                  {/* Modal de impedimento para inativação */}
                  <Dialog open={inativarDialogOpen} onClose={() => setInativarDialogOpen(false)}>
                    <DialogTitle>Não é possível inativar o aluno</DialogTitle>
                    <DialogContent>
                      <Alert severity="warning" sx={{ whiteSpace: 'pre-line', fontSize: '1rem', mb: 1 }}>
                        {inativarMotivo.split('\n').map((linha, idx) => (
                          <span key={idx}>{linha}{idx < inativarMotivo.split('\n').length - 1 ? <br /> : null}</span>
                        ))}
                      </Alert>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setInativarDialogOpen(false)} color="primary">OK</Button>
                    </DialogActions>
                  </Dialog>

                  {/* Modal de confirmação para inadimplência */}
                  <Dialog 
                    open={inadimplenciaDialogOpen} 
                    onClose={() => setInadimplenciaDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                  >
                    <DialogTitle sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      color: 'white'
                    }}>
                      ⚠️ Aluno com Títulos Vencidos - Confirmar Inativação
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                      <Alert severity="warning" sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          🚨 O aluno <strong>{editForm?.nome || 'Nome não disponível'}</strong> possui títulos vencidos
                        </Typography>
                        <Typography variant="body2">
                          Confirme se deseja inativar o aluno mesmo com títulos vencidos. 
                          Essas informações serão armazenadas para consultas futuras.
                        </Typography>
                      </Alert>

                      {carregandoTitulos ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress />
                          <Typography sx={{ ml: 2 }}>Carregando títulos em aberto...</Typography>
                        </Box>
                      ) : (
                        <>
                          <Box sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            bgcolor: '#fef2f2', 
                            border: '1px solid #fed7d7',
                            mb: 3
                          }}>
                            <Typography variant="h6" sx={{ color: '#dc2626', mb: 2 }}>
                              📊 Títulos Vencidos
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                              <Typography variant="body2">
                                <strong>Títulos vencidos:</strong> {titulosEmAberto.length}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Valor total:</strong> R$ {titulosEmAberto.reduce((total, titulo) => total + (titulo.valor || 0), 0).toFixed(2)}
                              </Typography>
                            </Box>
                          </Box>

                          {titulosEmAberto.length > 0 && (
                            <Box>
                              <Typography variant="h6" gutterBottom sx={{ color: '#dc2626' }}>
                                📄 Títulos Vencidos
                              </Typography>
                              <List dense sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 1 }}>
                                {titulosEmAberto.map((titulo, idx) => {
                                  const vencimento = new Date(titulo.vencimento);
                                  const hoje = new Date();
                                  const diasAtraso = Math.floor((hoje - vencimento) / (1000 * 60 * 60 * 24));
                                  const isVencido = diasAtraso > 0;
                                  
                                  return (
                                    <ListItem key={idx} divider={idx < titulosEmAberto.length - 1}>
                                      <ListItemText
                                        primary={
                                          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography component="span" variant="body2" sx={{ fontWeight: 500 }}>
                                              {titulo.descricao}
                                            </Typography>
                                            <Typography component="span" variant="body2" sx={{ 
                                              color: isVencido ? '#dc2626' : '#d97706',
                                              fontWeight: 'bold'
                                            }}>
                                              R$ {(titulo.valor || 0).toFixed(2)}
                                            </Typography>
                                          </span>
                                        }
                                        secondary={
                                          <>
                                            <Typography component="span" variant="caption" sx={{ 
                                              color: isVencido ? '#dc2626' : '#64748b',
                                              fontWeight: isVencido ? 'bold' : 'normal',
                                              display: 'block',
                                              mt: 0.5
                                            }}>
                                              Vencimento: {vencimento.toLocaleDateString('pt-BR')}
                                              {isVencido && ` (${diasAtraso} dias em atraso)`}
                                              {!isVencido && diasAtraso < 0 && ` (vence em ${Math.abs(diasAtraso)} dias)`}
                                            </Typography>
                                            <Typography component="span" variant="caption" sx={{ display: 'block', color: '#6366f1' }}>
                                              Tipo: {titulo.tipo}
                                            </Typography>
                                          </>
                                        }
                                      />
                                    </ListItem>
                                  );
                                })}
                              </List>
                            </Box>
                          )}
                        </>
                      )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                      <Button 
                        onClick={() => setInadimplenciaDialogOpen(false)} 
                        color="inherit"
                        variant="outlined"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={() => confirmarInativacao('Inativado por inadimplência - possui títulos vencidos')} 
                        sx={{
                          bgcolor: '#dc2626',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#b91c1c'
                          }
                        }}
                        variant="contained"
                        disabled={saving || carregandoTitulos}
                      >
                        {saving ? '⏳ Inativando...' : '✓ Inativar com Títulos Vencidos'}
                      </Button>
                    </DialogActions>
                  </Dialog>
                  </Dialog>

                  {/* Modal de Confirmação de Fechamento */}
                  <Dialog
                    open={confirmCloseOpen}
                    onClose={handleCancelarFechamento}
                    aria-labelledby="confirm-close-dialog-title"
                    aria-describedby="confirm-close-dialog-description"
                  >
                    <DialogTitle id="confirm-close-dialog-title">
                      Confirmar Fechamento
                    </DialogTitle>
                    <DialogContent>
                      <DialogContentText id="confirm-close-dialog-description">
                        Os dados preenchidos no formulário serão perdidos. Deseja realmente fechar?
                      </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleCancelarFechamento} color="inherit">
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleConfirmarFechamento} 
                        color="error" 
                        variant="contained"
                        autoFocus
                      >
                        Sim, Fechar
                      </Button>
                    </DialogActions>
                  </Dialog>

                  {/* Dialog Seleção de Impressão */}
                  <Dialog 
                    open={dialogSelecaoOpen} 
                    onClose={handleFecharDialogSelecao}
                    maxWidth="sm"
                    fullWidth
                  >
                    <DialogTitle sx={{ 
                      bgcolor: '#4f46e5', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <span>🖨️</span>
                      Selecione o documento para imprimir
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={handleAbrirFichaMatricula}
                          sx={{
                            py: 2,
                            borderColor: '#059669',
                            color: '#059669',
                            fontSize: '1rem',
                            fontWeight: 600,
                            '&:hover': {
                              bgcolor: '#f0fdf4',
                              borderColor: '#047857',
                              transform: 'scale(1.02)'
                            },
                            transition: 'all 0.2s'
                          }}
                        >
                          📋 Ficha de Matrícula
                        </Button>
                        
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => handleAbrirContrato()}
                          sx={{
                            py: 2,
                            borderColor: '#6366f1',
                            color: '#6366f1',
                            fontSize: '1rem',
                            fontWeight: 600,
                            '&:hover': {
                              bgcolor: '#f0f4ff',
                              borderColor: '#4f46e5',
                              transform: 'scale(1.02)'
                            },
                            transition: 'all 0.2s'
                          }}
                        >
                          📄 Contrato de Prestação de Serviços
                        </Button>
                      </Box>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleFecharDialogSelecao} color="inherit">
                        Cancelar
                      </Button>
                    </DialogActions>
                  </Dialog>

                  {/* Dialog Ficha de Matrícula */}
                  <Dialog 
                    open={fichaMatriculaOpen} 
                    onClose={handleFecharFichaMatricula}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                      sx: { 
                        width: '90vw', 
                        height: '90vh',
                        maxWidth: 'none'
                      }
                    }}
                  >
                    <DialogTitle sx={{ p: 0 }}>
                      {/* Título será renderizado dentro do componente FichaMatricula */}
                    </DialogTitle>
                    <DialogContent sx={{ p: 0 }}>
                      {alunoSelecionadoFicha && (
                        <FichaMatricula 
                          aluno={alunoSelecionadoFicha}
                          turmas={turmas}
                          onClose={handleFecharFichaMatricula}
                        />
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Dialog Contrato */}
                  <Dialog 
                    open={contratoOpen} 
                    onClose={handleFecharContrato}
                    maxWidth="lg"
                    fullWidth
                    className="dialog-contrato-impressao"
                    PaperProps={{
                      className: 'paper-contrato-impressao',
                      sx: { 
                        width: '95vw', 
                        height: '95vh',
                        maxWidth: 'none',
                        '@media print': {
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: '100%',
                          height: '100%',
                          boxShadow: 'none',
                          margin: 0,
                          position: 'static'
                        }
                      }
                    }}
                  >
                    <DialogContent 
                      className="content-contrato-impressao"
                      sx={{ 
                        p: 0, 
                        overflow: 'auto',
                        '@media print': {
                          overflow: 'visible',
                          p: 0
                        }
                      }}>
                      {alunoSelecionadoFicha && (
                        <ContratoAluno 
                          aluno={alunoSelecionadoFicha}
                          database={db}
                          getData={getData}
                          onClose={handleFecharContrato}
                        />
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Dialog Rematrícula */}
                  <RematriculaDialog
                    open={rematriculaDialogOpen}
                    onClose={() => {
                      setRematriculaDialogOpen(false);
                      setAlunoRematricula(null);
                    }}
                    aluno={alunoRematricula}
                    turmas={turmas}
                    financeiroService={financeiroService}
                    userId={userId}
                    userName={userName}
                    updateAluno={async (id, dados) => {
                      await setData(`alunos/${id}`, dados);
                    }}
                    onRematriculaSuccess={handleRematriculaSuccess}
                  />

                  {/* Dialog Histórico de Matrícula */}
                  <HistoricoMatriculaDialog
                    open={historicoDialogOpen}
                    onClose={() => {
                      setHistoricoDialogOpen(false);
                      setAlunoHistorico(null);
                    }}
                    aluno={alunoHistorico}
                    historicoService={historicoMatriculaService}
                    turmas={Object.values(turmas || {})}
                    getData={getData}
                    onRematricula={(aluno) => {
                      // Fechar o dialog do histórico
                      setHistoricoDialogOpen(false);
                      setAlunoHistorico(null);
                      // Abrir o dialog de rematrícula
                      handleAbrirRematricula(aluno);
                    }}
                  />

                  {/* Dialog Seleção de Contrato */}
                  <Dialog
                    open={selecaoContratoOpen}
                    onClose={() => {
                      setSelecaoContratoOpen(false);
                      setMatriculasDisponiveis([]);
                      setContratoSelecionado(null);
                    }}
                    maxWidth="md"
                    fullWidth
                  >
                    <DialogTitle>
                      <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Print /> Selecionar Contrato para Impressão
                      </Typography>
                    </DialogTitle>
                    <DialogContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Este aluno possui múltiplas matrículas. Selecione qual contrato deseja imprimir:
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        {matriculasDisponiveis.map((matricula, index) => (
                          <Card 
                            key={index}
                            variant={contratoSelecionado === matricula ? "outlined" : "elevation"}
                            sx={{ 
                              mb: 2, 
                              cursor: 'pointer',
                              border: contratoSelecionado === matricula ? '2px solid #1976d2' : '1px solid #e0e0e0',
                              backgroundColor: contratoSelecionado === matricula ? '#f3f8ff' : 'inherit',
                              '&:hover': {
                                backgroundColor: contratoSelecionado === matricula ? '#f3f8ff' : '#f5f5f5'
                              }
                            }}
                            onClick={() => setContratoSelecionado(matricula)}
                          >
                            <CardContent>
                              <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                                {matricula.isCurrent ? 'REMATRÍCULA ATUAL' : `MATRÍCULA ${matricula.ano || new Date(matricula.dataMatricula).getFullYear()}`}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Data:</strong> {new Date(matricula.dataMatricula).toLocaleDateString('pt-BR')}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Turma:</strong> {matricula.nomeTurma || matricula.nometurma || 'Não informado'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Status:</strong> {matricula.isCurrent ? 'Ativa (Rematrícula)' : 'Histórica'}
                              </Typography>
                              {matricula.valorMensalidade && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Mensalidade:</strong> R$ {parseFloat(matricula.valorMensalidade).toFixed(2)}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    </DialogContent>
                    <DialogActions>
                      <Button 
                        onClick={() => {
                          setSelecaoContratoOpen(false);
                          setMatriculasDisponiveis([]);
                          setContratoSelecionado(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        variant="contained"
                        disabled={!contratoSelecionado}
                        onClick={() => {
                          if (contratoSelecionado) {
                            handleAbrirContrato(contratoSelecionado);
                            setSelecaoContratoOpen(false);
                            setMatriculasDisponiveis([]);
                            setContratoSelecionado(null);
                          }
                        }}
                        startIcon={<Print />}
                      >
                        Imprimir Contrato Selecionado
                      </Button>
                    </DialogActions>
                  </Dialog>

                  {/* Dialog Seleção de Ficha de Matrícula */}
                  <Dialog
                    open={selecaoFichaOpen}
                    onClose={() => {
                      setSelecaoFichaOpen(false);
                      setMatriculasDisponiveisFicha([]);
                      setFichaSelecionada(null);
                    }}
                    maxWidth="md"
                    fullWidth
                  >
                    <DialogTitle>
                      <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Print /> Selecionar Ficha de Matrícula para Impressão
                      </Typography>
                    </DialogTitle>
                    <DialogContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Este aluno possui múltiplas matrículas. Selecione qual ficha de matrícula deseja imprimir:
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        {matriculasDisponiveisFicha.map((matricula, index) => (
                          <Card 
                            key={index}
                            variant={fichaSelecionada === matricula ? "outlined" : "elevation"}
                            sx={{ 
                              mb: 2, 
                              cursor: 'pointer',
                              border: fichaSelecionada === matricula ? '2px solid #1976d2' : '1px solid #e0e0e0',
                              backgroundColor: fichaSelecionada === matricula ? '#f3f8ff' : 'inherit',
                              '&:hover': {
                                backgroundColor: fichaSelecionada === matricula ? '#f3f8ff' : '#f5f5f5'
                              }
                            }}
                            onClick={() => setFichaSelecionada(matricula)}
                          >
                            <CardContent>
                              <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                                {matricula.isCurrent ? 'REMATRÍCULA ATUAL' : `MATRÍCULA ${matricula.ano || new Date(matricula.dataMatricula).getFullYear()}`}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Data:</strong> {new Date(matricula.dataMatricula).toLocaleDateString('pt-BR')}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Turma:</strong> {matricula.nomeTurma || matricula.nometurma || 'Não informado'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Status:</strong> {matricula.isCurrent ? 'Ativa (Rematrícula)' : 'Histórica'}
                              </Typography>
                              {matricula.valorMensalidade && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Mensalidade:</strong> R$ {parseFloat(matricula.valorMensalidade).toFixed(2)}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    </DialogContent>
                    <DialogActions>
                      <Button 
                        onClick={() => {
                          setSelecaoFichaOpen(false);
                          setMatriculasDisponiveisFicha([]);
                          setFichaSelecionada(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        variant="contained"
                        disabled={!fichaSelecionada}
                        onClick={() => {
                          if (fichaSelecionada) {
                            handleAbrirFichaMatricula(fichaSelecionada);
                            setSelecaoFichaOpen(false);
                            setMatriculasDisponiveisFicha([]);
                            setFichaSelecionada(null);
                          }
                        }}
                        startIcon={<Print />}
                      >
                        Imprimir Ficha Selecionada
                      </Button>
                    </DialogActions>
                  </Dialog>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </main>
      
      {/* Estilos globais para impressão do contrato */}
      <style jsx global>{`
        @media print {
          /* Oculta TUDO primeiro */
          * {
            visibility: hidden !important;
          }
          
          /* Mostra APENAS o contrato e seus filhos */
          .dialog-contrato-impressao,
          .dialog-contrato-impressao *,
          .paper-contrato-impressao,
          .paper-contrato-impressao *,
          .content-contrato-impressao,
          .content-contrato-impressao *,
          .contrato-wrapper,
          .contrato-wrapper * {
            visibility: visible !important;
          }
          
          /* Remove backdrop */
          .MuiBackdrop-root {
            display: none !important;
          }
          
          /* Posiciona o dialog na origem */
          .dialog-contrato-impressao {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
          
          .dialog-contrato-impressao .MuiDialog-container {
            position: static !important;
            display: block !important;
            height: auto !important;
          }
          
          .paper-contrato-impressao {
            position: static !important;
            max-width: none !important;
            max-height: none !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          
          .content-contrato-impressao {
            padding: 0 !important;
            overflow: visible !important;
          }
          
          /* Remove margens do body */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          
          /* Configuração da página */
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Alunos;