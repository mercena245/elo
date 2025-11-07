"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '../../components/SidebarMenu';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Avatar,
  Button,
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
  IconButton,
  CircularProgress,
  Collapse,
  Switch,
  Divider,
  Chip,
  Alert,
  TextareaAutosize
} from '@mui/material';
import { ExpandMore, ExpandLess, Edit, Delete, Add, Notifications, AttachFile, PriorityHigh, Visibility, CheckCircle, CloudUpload } from '@mui/icons-material';
import { FaTrash } from 'react-icons/fa';
import { FaUsers, FaChalkboardTeacher } from 'react-icons/fa';
import { db, ref, get, set, push, remove, storage, storageRef, uploadBytes, getDownloadURL, deleteObject } from '@/firebase';
import { auth, onAuthStateChanged } from '@/firebase';
import { auditService } from '../../services/auditService';

const { logAction, LOG_ACTIONS } = auditService;
import DisciplinaCard from "../components/escola/DisciplinaCard";
import GestaoEscolarCard from "../components/escola/GestaoEscolarCard";
import NotasFrequenciaCard from "../components/escola/NotasFrequenciaCard";
import TurmaCard from "../components/escola/TurmaCard";
import PeriodoCard from "../components/escola/PeriodoCard";
import GradeHorariaCard from "../components/escola/GradeHorariaCard";
import { useSchoolServices } from '../../hooks/useSchoolServices';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';

// Helpers
function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}



const Escola = () => {
  // Services multi-tenant
  const { auditService, financeiroService, LOG_ACTIONS, isReady: servicesReady } = useSchoolServices();
  
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  // TURMAS
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTurmaModal, setOpenTurmaModal] = useState(false);
  const [filtroTurno, setFiltroTurno] = useState('');
  const [filtroNomeTurma, setFiltroNomeTurma] = useState('');
  const [editTurma, setEditTurma] = useState(null);
  const [editTurmaForm, setEditTurmaForm] = useState({ nome: '', status: 'ativa', turnoId: '', periodoId: '' });
  const [savingTurma, setSavingTurma] = useState(false);
  const [isNewTurma, setIsNewTurma] = useState(false);

  // TURMA: Exclusão
  const [turmaExcluir, setTurmaExcluir] = useState(null);
  const [vinculosTurma, setVinculosTurma] = useState([]);
  const [modalVinculosOpen, setModalVinculosOpen] = useState(false);
  const [modalConfirmExcluirOpen, setModalConfirmExcluirOpen] = useState(false);
  const [excluindoTurma, setExcluindoTurma] = useState(false);

  // AVISOS
  const [avisos, setAvisos] = useState([]);
  const [novoAviso, setNovoAviso] = useState('');
  const [salvandoAviso, setSalvandoAviso] = useState(false);
  const [openAvisoModal, setOpenAvisoModal] = useState(false);
  const [avisoForm, setAvisoForm] = useState({
    titulo: '',
    conteudo: '',
    anexo: '',
    prioridade: 'media',
    dataExpiracao: '',
    visibilidade: 'todos',
    autor: '',
    categoria: 'geral'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [avisosExpanded, setAvisosExpanded] = useState(false); // Iniciado como retraído

  // COLABORADORES (código mantido para eventual uso futuro)
  const [colaboradores, setColaboradores] = useState([]);
  const [openColabModal, setOpenColabModal] = useState(false);
  const [editColab, setEditColab] = useState(null);
  const [editColabForm, setEditColabForm] = useState({ nome: '', cargo: '', email: '', disciplinas: [] });
  const [savingColab, setSavingColab] = useState(false);
  const [isNewColab, setIsNewColab] = useState(false);

  // ROLE/LOGIN
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [roleChecked, setRoleChecked] = useState(false);

  // Função para verificar se um aviso está expirado
  const isAvisoExpirado = (aviso) => {
    if (!aviso.dataExpiracao) return false; // Se não tem data de expiração, nunca expira
    const hoje = new Date();
    const dataExpiracao = new Date(aviso.dataExpiracao);
    return hoje > dataExpiracao;
  };

  // Função para verificar se um aviso está próximo do vencimento (3 dias)
  const isAvisoProximoVencimento = (aviso) => {
    if (!aviso.dataExpiracao) return false;
    const hoje = new Date();
    const dataExpiracao = new Date(aviso.dataExpiracao);
    const diferencaDias = Math.ceil((dataExpiracao - hoje) / (1000 * 60 * 60 * 24));
    return diferencaDias > 0 && diferencaDias <= 3;
  };

  // Função para limpar avisos expirados do banco (opcional - executa periodicamente)
  const limparAvisosExpirados = async () => {
    if (!isReady) return;
    
    try {
      const avisosData = await getData('avisos');
      if (avisosData) {
        let contadorRemovidos = 0;
        
        for (const [id, aviso] of Object.entries(avisosData)) {
          if (isAvisoExpirado(aviso)) {
            await removeData(`avisos/${id}`);
            contadorRemovidos++;
          }
        }
        
        if (contadorRemovidos > 0) {
          console.log(`🗑️ Removidos ${contadorRemovidos} avisos expirados automaticamente`);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar avisos expirados:', error);
    }
  };

  // Função para carregar dados iniciais (turmas e avisos)
  const fetchData = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    setLoading(true);
    try {
      // Carregar turmas
      const turmasData = await getData('turmas');
      if (turmasData) {
        const turmasArray = Object.entries(turmasData).map(([id, turma]) => ({ ...turma, id }));
        setTurmas(turmasArray);
      } else {
        setTurmas([]);
      }

      // Carregar avisos
      const avisosData = await getData('avisos');
      if (avisosData) {
        const avisosArray = Object.entries(avisosData).map(([id, aviso]) => ({ ...aviso, id }));
        
        // Filtrar avisos não expirados e ativos
        const avisosAtivos = avisosArray.filter(aviso => {
          const naoExpirado = !isAvisoExpirado(aviso);
          const ativo = aviso.ativo !== false; // Considera ativo se não estiver explicitamente como false
          return naoExpirado && ativo;
        });
        
        // Ordenar por data de criação (mais recentes primeiro)
        avisosAtivos.sort((a, b) => {
          const dataA = new Date(a.dataCreacao || 0);
          const dataB = new Date(b.dataCreacao || 0);
          return dataB - dataA;
        });
        
        setAvisos(avisosAtivos);
        
        // Log para debug - remover depois
        console.log(`📢 Avisos carregados: ${avisosArray.length} total, ${avisosAtivos.length} ativos`);
        
      } else {
        setAvisos([]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setTurmas([]);
      setAvisos([]);
    }
    setLoading(false);
  };

  // PERÍODOS
  const [periodoForm, setPeriodoForm] = useState({
    ano: "",
    periodo: "",
    ativo: true,
    dataInicio: "",
    dataFim: ""
  });
  const [salvandoPeriodo, setSalvandoPeriodo] = useState(false);
  const [msgPeriodo, setMsgPeriodo] = useState("");
  const [abaPeriodo, setAbaPeriodo] = useState("consulta");
  const [modalCadastroPeriodoOpen, setModalCadastroPeriodoOpen] = useState(false);
  const [periodosCadastrados, setPeriodosCadastrados] = useState([]);
  const [loadingConsulta, setLoadingConsulta] = useState(false);

  // Edição de período
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPeriodo, setEditPeriodo] = useState(null);
  const [editPeriodoForm, setEditPeriodoForm] = useState({
    id: "",
    ano: "",
    periodo: "",
    ativo: true,
    dataInicio: "",
    dataFim: ""
  });
  const [editMsg, setEditMsg] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // PERÍODOS ATIVOS PARA TURMA
  const [periodosAtivos, setPeriodosAtivos] = useState([]);
  const [loadingPeriodosAtivos, setLoadingPeriodosAtivos] = useState(false);

  // Buscar períodos ativos para turmas
  const fetchPeriodosAtivos = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    setLoadingPeriodosAtivos(true);
    try {
      const data = await getData("Escola/Periodo");
      if (data) {
        const ativos = Object.entries(data)
          .filter(([, p]) => p.ativo)
          .map(([id, p]) => ({
            id,
            ano: p.ano,
            periodo: p.periodo,
            dataInicio: p.dataInicio,
            dataFim: p.dataFim,
            label: `Ano ${p.ano} - Período ${p.periodo} (${formatDateBR(p.dataInicio)} a ${formatDateBR(p.dataFim)})`
          }));
        setPeriodosAtivos(ativos);
      } else {
        setPeriodosAtivos([]);
      }
    } catch {
      setPeriodosAtivos([]);
    }
    setLoadingPeriodosAtivos(false);
  };

  // MODAL GESTÃO TURMA
  const [gestaoTurmaOpen, setGestaoTurmaOpen] = useState(false);
  const [gestaoTurma, setGestaoTurma] = useState(null);
  const [alunosTurma, setAlunosTurma] = useState([]);
  // Função para calcular idade
  function calcularIdade(dataNascStr) {
    if (!dataNascStr) return '-';
    const [d, m, y] = dataNascStr.split(/[\/\-]/);
    const dataNasc = new Date(`${y}-${m}-${d}`);
    if (isNaN(dataNasc)) return '-';
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNasc.getFullYear();
    const mDiff = hoje.getMonth() - dataNasc.getMonth();
    if (mDiff < 0 || (mDiff === 0 && hoje.getDate() < dataNasc.getDate())) idade--;
    return idade;
  }

  const handleOpenGestaoTurma = async turma => {
    setGestaoTurma(turma);
    setGestaoTurmaOpen(true);
    // Buscar alunos vinculados
    if (!isReady) {
      setAlunosTurma([]);
      return;
    }
    
    try {
      const alunosData = await getData('alunos');
      if (alunosData) {
        const alunos = Object.values(alunosData).filter(a => a.turmaId === turma.id);
        setAlunosTurma(alunos);
      } else {
        setAlunosTurma([]);
      }
    } catch {
      setAlunosTurma([]);
    }
  };
  const handleCloseGestaoTurma = () => {
    setGestaoTurmaOpen(false);
    setGestaoTurma(null);
    setAlunosTurma([]);
  };

  // TURMAS CRUD
  const handleAddTurma = async () => {
    await fetchPeriodosAtivos();
    setEditTurma(null);
    setEditTurmaForm({ nome: '', status: 'ativa', turnoId: '', periodoId: '' });
    setIsNewTurma(true);
    setOpenTurmaModal(true);
  };

  const handleEditTurma = async turma => {
    await fetchPeriodosAtivos();
    setEditTurma(turma);
    setEditTurmaForm({
      nome: turma.nome || '',
      status: turma.status || '',
      turnoId: turma.turnoId || '',
      periodoId: turma.periodoId || ''
    });
    setIsNewTurma(false);
    setOpenTurmaModal(true);
  };

  const handleTurmaFormChange = e => {
    const { name, value } = e.target;
    setEditTurmaForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveTurma = async () => {
    if (!editTurmaForm.periodoId) {
      alert("Selecione o período!");
      return;
    }
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    setSavingTurma(true);
    try {
      const periodo = periodosAtivos.find(p => p.id === editTurmaForm.periodoId);
      const periodoLabel = periodo ? periodo.label : 'Período não encontrado';
      
      if (isNewTurma) {
        const novoId = `id_turma_${editTurmaForm.nome.replace(/\s/g, '').toLowerCase()}`;
        await setData(`turmas/${novoId}`, editTurmaForm);
        
        // Log da criação da turma
        const userData = {
          id: userId,
          email: auth.currentUser?.email,
          role: userRole
        };
        await auditService?.logAction({
          action: LOG_ACTIONS.CLASS_CREATE,
          entity: 'class',
          entityId: novoId,
          details: `Nova turma criada: ${editTurmaForm.nome}`,
          changes: {
            nome: editTurmaForm.nome,
            status: editTurmaForm.status,
            turno: editTurmaForm.turnoId,
            periodo: periodoLabel
          },
          userData: userData
        });
      } else if (editTurma && editTurma.id) {
        // Identificar mudanças para o log
        const mudancas = {};
        if (editTurma.nome !== editTurmaForm.nome) mudancas.nome = { de: editTurma.nome, para: editTurmaForm.nome };
        if (editTurma.status !== editTurmaForm.status) mudancas.status = { de: editTurma.status, para: editTurmaForm.status };
        if (editTurma.turnoId !== editTurmaForm.turnoId) mudancas.turno = { de: editTurma.turnoId, para: editTurmaForm.turnoId };
        if (editTurma.periodoId !== editTurmaForm.periodoId) mudancas.periodo = { de: editTurma.periodoId, para: editTurmaForm.periodoId };
        
        await setData(`turmas/${editTurma.id}`, editTurmaForm);
        
        // Log da atualização da turma
        if (Object.keys(mudancas).length > 0) {
          const userData = {
            id: userId,
            email: auth.currentUser?.email,
            role: userRole
          };
          await auditService?.logAction({
            action: LOG_ACTIONS.CLASS_UPDATE,
            entity: 'class',
            entityId: editTurma.id,
            details: `Turma atualizada: ${editTurmaForm.nome}`,
            changes: mudancas,
            userData: userData
          });
        }
      }
      setOpenTurmaModal(false);
      await fetchData();
    } catch (err) {
      console.error('Erro ao salvar turma:', err);
      alert('Erro ao salvar turma: ' + (err.message || 'Erro desconhecido'));
    }
    setSavingTurma(false);
  };

  // Excluir turma
  const handleExcluirTurma = async turma => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    setTurmaExcluir(turma);
    // Buscar vínculos
    const vinculos = [];
    // Alunos
    const alunos = await getData(`alunos`);
    if (alunos) {
      const alunosTurma = Object.values(alunos).filter(a => a.turmaId === turma.id);
      if (alunosTurma.length > 0) {
        vinculos.push({ tipo: "Alunos", lista: alunosTurma.map(a => a.nome || a.id) });
      }
    }
    // Professores
    const profs = await getData(`professores`);
    if (profs) {
      const profsTurma = Object.values(profs).filter(p => p.turmaId === turma.id);
      if (profsTurma.length > 0) {
        vinculos.push({ tipo: "Professores", lista: profsTurma.map(p => p.nome || p.id) });
      }
    }
    // Usuários
    const usuarios = await getData(`usuarios`);
    if (usuarios) {
      const usuariosTurma = Object.values(usuarios).filter(u => u.turmaId === turma.id);
      if (usuariosTurma.length > 0) {
        vinculos.push({ tipo: "Usuários", lista: usuariosTurma.map(u => u.nome || u.id) });
      }
    }
    setVinculosTurma(vinculos);
    if (vinculos.length > 0) {
      setModalVinculosOpen(true);
    } else {
      setModalConfirmExcluirOpen(true);
    }
  };

  const handleConfirmExcluirTurma = async () => {
    if (!turmaExcluir) return;
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    setExcluindoTurma(true);
    try {
      await removeData(`turmas/${turmaExcluir.id}`);
      
      // Log da exclusão da turma
      const userData = {
        id: userId,
        email: auth.currentUser?.email,
        role: userRole
      };
      await auditService?.logAction({
        action: LOG_ACTIONS.CLASS_DELETE,
        entity: 'class',
        entityId: turmaExcluir.id,
        details: `Turma excluída: ${turmaExcluir.nome}`,
        changes: {
          nome: turmaExcluir.nome,
          status: turmaExcluir.status,
          turno: turmaExcluir.turnoId,
          periodo: turmaExcluir.periodoId,
          vinculosRemovidos: vinculosTurma.length > 0 ? vinculosTurma : 'Nenhum vínculo'
        },
        userData: userData
      });
      
      setModalConfirmExcluirOpen(false);
      setTurmaExcluir(null);
      await fetchData();
    } catch (err) {
      alert("Erro ao excluir turma!");
    }
    setExcluindoTurma(false);
  };

  // Função para fazer upload do arquivo
  const uploadFile = async (file) => {
    try {
      const timestamp = Date.now();
      const fileName = `avisos/${timestamp}_${file.name}`;
      const fileRef = storageRef(storage, fileName);
      
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload do arquivo');
      return null;
    }
  };

  // Função para lidar com a seleção de arquivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Valida o tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('O arquivo deve ter no máximo 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  // AVISOS
  const handleAddAviso = async () => {
    if (!avisoForm.titulo.trim() || !avisoForm.conteudo.trim()) {
      alert('Título e conteúdo são obrigatórios!');
      return;
    }
    
    setSalvandoAviso(true);
    setUploading(true);
    
    try {
      let anexoURL = avisoForm.anexo; // Link manual se fornecido
      
      // Se há um arquivo selecionado, faz o upload
      if (selectedFile) {
        const uploadedURL = await uploadFile(selectedFile);
        if (uploadedURL) {
          anexoURL = uploadedURL;
        } else {
          setSalvandoAviso(false);
          setUploading(false);
          return; // Para se o upload falhou
        }
      }

      const avisoId = `aviso_${Date.now()}`;
      const avisoData = {
        ...avisoForm,
        anexo: anexoURL,
        dataCreacao: new Date().toISOString(),
        autor: auth.currentUser?.displayName || auth.currentUser?.email || 'Administrador',
        ativo: true
      };
      
      await setData(`avisos/${avisoId}`, avisoData);
      
      // Log da criação do aviso
      await auditService?.logAction({
        action: LOG_ACTIONS.ANNOUNCEMENT_CREATE,
        entity: 'announcement',
        entityId: avisoId,
        details: `Novo aviso criado: ${avisoForm.titulo}`,
        changes: {
          titulo: avisoForm.titulo,
          prioridade: avisoForm.prioridade,
          categoria: avisoForm.categoria,
          visibilidade: avisoForm.visibilidade,
          temAnexo: !!anexoURL,
          dataExpiracao: avisoForm.dataExpiracao || 'Sem expiração'
        }
      });
      
      setAvisoForm({
        titulo: '',
        conteudo: '',
        anexo: '',
        prioridade: 'media',
        dataExpiracao: '',
        visibilidade: 'todos',
        autor: '',
        categoria: 'geral'
      });
      setSelectedFile(null);
      setOpenAvisoModal(false);
      await fetchData();
    } catch (err) {
      console.error('Erro ao salvar aviso:', err);
      alert('Erro ao salvar aviso!');
    }
    setSalvandoAviso(false);
    setUploading(false);
  };

  const handleAvisoFormChange = (e) => {
    const { name, value } = e.target;
    setAvisoForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAvisoModal = () => {
    setAvisoForm({
      titulo: '',
      conteudo: '',
      anexo: '',
      prioridade: 'media',
      dataExpiracao: '',
      visibilidade: 'todos',
      autor: '',
      categoria: 'geral'
    });
    setSelectedFile(null);
    setOpenAvisoModal(true);
  };

  // Função antiga mantida para compatibilidade
  const handleAddAvisoAntigo = async () => {
    if (!novoAviso.trim()) return;
    if (!isReady) return;
    
    setSalvandoAviso(true);
    const avisoId = `aviso_${Date.now()}`;
    await setData(`avisos/${avisoId}`, { 
      texto: novoAviso,
      titulo: 'Aviso',
      conteudo: novoAviso,
      dataCreacao: new Date().toISOString(),
      autor: auth.currentUser?.displayName || auth.currentUser?.email || 'Administrador',
      categoria: 'geral',
      prioridade: 'media',
      visibilidade: 'todos',
      ativo: true
    });
    setNovoAviso('');
    await fetchData();
    setSalvandoAviso(false);
  };

  const handleRemoveAviso = async id => {
    if (!isReady) return;
    
    // Buscar dados do aviso antes de excluir para o log
    const avisoData = await getData(`avisos/${id}`) || {};
    
    await removeData(`avisos/${id}`);
    
    // Log da remoção do aviso
    await auditService?.logAction({
      action: LOG_ACTIONS.ANNOUNCEMENT_DELETE,
      entity: 'announcement',
      entityId: id,
      details: `Aviso removido: ${avisoData.titulo || 'Título não disponível'}`,
      changes: {
        titulo: avisoData.titulo,
        categoria: avisoData.categoria,
        prioridade: avisoData.prioridade,
        autor: avisoData.autor,
        dataCreacao: avisoData.dataCreacao
      }
    });
    
    await fetchData();
  };

  // COLABORADORES
  const handleAddColab = () => {
    setEditColab(null);
    setEditColabForm({ nome: '', cargo: '', email: '' });
    setIsNewColab(true);
    setOpenColabModal(true);
  };

  const handleEditColab = colab => {
    setEditColab(colab);
    setEditColabForm({
      nome: colab.nome || '',
      cargo: colab.cargo || '',
      email: colab.email || '',
      disciplinas: colab.disciplinas || [],
      role: colab.role || ''
    });
    setIsNewColab(false);
    setOpenColabModal(true);
  };

  const handleColabFormChange = e => {
    const { name, value } = e.target;
    setEditColabForm(prev => ({ ...prev, [name]: value }));
  };

  const handleColabDisciplinasChange = e => {
    const { value } = e.target;
    setEditColabForm(prev => ({ ...prev, disciplinas: typeof value === 'string' ? value.split(',') : value }));
  };

  const handleSaveColab = async () => {
    if (!isReady) return;
    
    setSavingColab(true);
    try {
      const colabData = { ...editColabForm };
      if (colabData.cargo !== 'professora') {
        colabData.disciplinas = [];
      }
      if (isNewColab) {
        const novoId = `id_colab_${editColabForm.nome.replace(/\s/g, '').toLowerCase()}`;
        await setData(`colaboradores/${novoId}`, colabData);
      } else if (editColab && editColab.id) {
        await setData(`colaboradores/${editColab.id}`, colabData);
      }
      setOpenColabModal(false);
      await fetchData();
    } catch (err) {
      console.error('Erro ao salvar colaborador:', err);
      alert('Erro ao salvar colaborador: ' + (err.message || 'Erro desconhecido'));
    }
    setSavingColab(false);
  };
  {/* Modal de cadastro/edição de colaborador */}
  <Dialog open={openColabModal} onClose={() => setOpenColabModal(false)} maxWidth="sm" fullWidth>
    <DialogTitle>{isNewColab ? 'Incluir Colaborador(a)' : 'Editar Colaborador(a)'}</DialogTitle>
    <DialogContent>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField label="Nome" name="nome" value={editColabForm.nome} onChange={handleColabFormChange} fullWidth required />
        <FormControl fullWidth required>
          <InputLabel id="cargo-select-label">Cargo</InputLabel>
          <Select labelId="cargo-select-label" name="cargo" value={editColabForm.cargo} label="Cargo" onChange={handleColabFormChange}>
            <MenuItem value="professora">Professora</MenuItem>
            <MenuItem value="coordenadora">Coordenadora</MenuItem>
            <MenuItem value="funcionario">Funcionário(a)</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Email" name="email" value={editColabForm.email} onChange={handleColabFormChange} fullWidth />
  {((editColabForm.cargo && editColabForm.cargo.toLowerCase().includes('professor')) ||
    (editColabForm.role && editColabForm.role.toLowerCase().includes('professor'))) && (
          <FormControl fullWidth>
            <InputLabel id="disciplinas-select-label">Disciplinas</InputLabel>
            <Select
              labelId="disciplinas-select-label"
              multiple
              name="disciplinas"
              value={editColabForm.disciplinas}
              onChange={handleColabDisciplinasChange}
              renderValue={selected =>
                disciplinas.filter(d => selected.includes(d.id)).map(d => d.nome).join(', ')
              }
            >
              {disciplinas.map(disc => (
                <MenuItem key={disc.id} value={disc.id}>
                  {disc.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setOpenColabModal(false)} color="secondary">Cancelar</Button>
      <Button onClick={handleSaveColab} color="primary" disabled={savingColab}>Salvar</Button>
    </DialogActions>
  </Dialog>

  // PERÍODO CRUD
  const handlePeriodoFormChange = e => {
    const { name, value, type, checked } = e.target;
    setPeriodoForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  async function handleSalvarPeriodo(e) {
    e.preventDefault();
    setMsgPeriodo("");
    if (!periodoForm.ano || !periodoForm.periodo || !periodoForm.dataInicio || !periodoForm.dataFim) {
      setMsgPeriodo("Preencha todos os campos!");
      return;
    }
    setSalvandoPeriodo(true);
    try {
      const periodoId = `${periodoForm.ano}_${periodoForm.periodo}_${Date.now()}`;
      console.log('💾 [Escola] Salvando período:', periodoId);
      await setData(`Escola/Periodo/${periodoId}`, {
        ...periodoForm
      });
      
      // Log da criação do período
      await auditService?.logAction({
        action: LOG_ACTIONS.PERIOD_CREATE,
        entity: 'period',
        entityId: periodoId,
        details: `Novo período criado: Ano ${periodoForm.ano} - Período ${periodoForm.periodo}`,
        changes: {
          ano: periodoForm.ano,
          periodo: periodoForm.periodo,
          dataInicio: periodoForm.dataInicio,
          dataFim: periodoForm.dataFim,
          ativo: periodoForm.ativo
        }
      });
      
      console.log('✅ [Escola] Período salvo com sucesso');
      setMsgPeriodo("Período salvo com sucesso!");
      setPeriodoForm({
        ano: "",
        periodo: "",
        ativo: true,
        dataInicio: "",
        dataFim: ""
      });
      setAbaPeriodo('consulta');
      setModalCadastroPeriodoOpen(false);
      carregarPeriodosCadastrados();
    } catch (err) {
      setMsgPeriodo("Falha ao salvar período!");
    }
    setSalvandoPeriodo(false);
  }

  async function carregarPeriodosCadastrados() {
    setLoadingConsulta(true);
    setPeriodosCadastrados([]);
    try {
      console.log('📡 [Escola] Carregando períodos do banco da escola...');
      const data = await getData("Escola/Periodo");
      if (data) {
        const lista = Object.entries(data).map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => {
            if (a.ano !== b.ano) return b.ano - a.ano;
            if (a.periodo !== b.periodo) return b.periodo - a.periodo;
            return a.dataInicio.localeCompare(b.dataInicio);
          });
        setPeriodosCadastrados(lista);
        console.log('✅ [Escola] Períodos carregados:', lista.length);
      } else {
        console.log('⚠️ [Escola] Nenhum período encontrado');
        setPeriodosCadastrados([]);
      }
    } catch (err) {
      console.error('❌ [Escola] Erro ao carregar períodos:', err);
      setPeriodosCadastrados([]);
    }
    setLoadingConsulta(false);
  }

  const handleTrocarAbaPeriodo = (aba) => {
    setAbaPeriodo(aba);
    if (aba === "consulta") carregarPeriodosCadastrados();
    setMsgPeriodo("");
  };

  const handleEditarPeriodoClick = (periodo) => {
    setEditPeriodo(periodo);
    setEditPeriodoForm({
      id: periodo.id,
      ano: periodo.ano,
      periodo: periodo.periodo,
      ativo: !!periodo.ativo,
      dataInicio: periodo.dataInicio,
      dataFim: periodo.dataFim
    });
    setEditMsg("");
    setEditDialogOpen(true);
  };

  const handleEditPeriodoFormChange = e => {
    const { name, value, type, checked } = e.target;
    setEditPeriodoForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  async function handleSalvarEdicaoPeriodo(e) {
    e.preventDefault();
    setEditMsg("");
    if (!editPeriodoForm.ano || !editPeriodoForm.periodo || !editPeriodoForm.dataInicio || !editPeriodoForm.dataFim) {
      setEditMsg("Preencha todos os campos!");
      return;
    }
    setEditLoading(true);
    try {
      // Identificar mudanças para o log
      const mudancas = {};
      if (editPeriodo.ano !== editPeriodoForm.ano) mudancas.ano = { de: editPeriodo.ano, para: editPeriodoForm.ano };
      if (editPeriodo.periodo !== editPeriodoForm.periodo) mudancas.periodo = { de: editPeriodo.periodo, para: editPeriodoForm.periodo };
      if (editPeriodo.ativo !== editPeriodoForm.ativo) mudancas.ativo = { de: editPeriodo.ativo, para: editPeriodoForm.ativo };
      if (editPeriodo.dataInicio !== editPeriodoForm.dataInicio) mudancas.dataInicio = { de: editPeriodo.dataInicio, para: editPeriodoForm.dataInicio };
      if (editPeriodo.dataFim !== editPeriodoForm.dataFim) mudancas.dataFim = { de: editPeriodo.dataFim, para: editPeriodoForm.dataFim };
      
      console.log('🔄 [Escola] Editando período:', editPeriodoForm.id);
      await setData(`Escola/Periodo/${editPeriodoForm.id}`, {
        ano: editPeriodoForm.ano,
        periodo: editPeriodoForm.periodo,
        ativo: !!editPeriodoForm.ativo,
        dataInicio: editPeriodoForm.dataInicio,
        dataFim: editPeriodoForm.dataFim
      });
      
      // Log da atualização do período
      if (Object.keys(mudancas).length > 0) {
        await auditService?.logAction({
          action: LOG_ACTIONS.PERIOD_UPDATE,
          entity: 'period',
          entityId: editPeriodoForm.id,
          details: `Período atualizado: Ano ${editPeriodoForm.ano} - Período ${editPeriodoForm.periodo}`,
          changes: mudancas
        });
      }
      
      setEditMsg("Período atualizado com sucesso!");
      setEditDialogOpen(false);
      carregarPeriodosCadastrados();
    } catch (err) {
      setEditMsg("Falha ao salvar alterações!");
    }
    setEditLoading(false);
  }

  async function handleExcluirPeriodo(id) {
    if (!window.confirm('Confirma excluir este período?')) return;
    try {
      console.log('🗑️ [Escola] Excluindo período:', id);
      // Buscar dados do período antes de excluir para o log
      const periodoData = await getData(`Escola/Periodo/${id}`);
      
      await removeData(`Escola/Periodo/${id}`);
      
      // Log da exclusão do período
      await auditService?.logAction({
        action: LOG_ACTIONS.PERIOD_DELETE,
        entity: 'period',
        entityId: id,
        details: `Período excluído: Ano ${periodoData?.ano || 'N/A'} - Período ${periodoData?.periodo || 'N/A'}`,
        changes: {
          ano: periodoData?.ano,
          periodo: periodoData?.periodo,
          dataInicio: periodoData?.dataInicio,
          dataFim: periodoData?.dataFim,
          ativo: periodoData?.ativo
        }
      });
      
      console.log('✅ [Escola] Período excluído com sucesso');
      carregarPeriodosCadastrados();
    } catch (err) {
      console.error('❌ [Escola] Erro ao excluir período:', err);
      alert('Erro ao excluir período!');
    }
  }

  // DISCIPLINAS
  const [disciplinas, setDisciplinas] = useState([]);
  const [loadingDisciplinas, setLoadingDisciplinas] = useState(false);
  const [openDisciplinaModal, setOpenDisciplinaModal] = useState(false);
  const [novaDisciplina, setNovaDisciplina] = useState("");

  // Funções de CRUD de disciplinas (exemplo, ajuste conforme sua lógica real)
  const handleAddDisciplina = async () => {
    if (!novaDisciplina.trim()) return;
    setLoadingDisciplinas(true);
    try {
      const disciplinaId = `disciplina_${Date.now()}`;
      console.log('💾 [Escola] Salvando disciplina:', disciplinaId);
      await setData(`disciplinas/${disciplinaId}`, { nome: novaDisciplina });
      
      // Log da criação da disciplina
      await auditService?.logAction({
        action: LOG_ACTIONS.SUBJECT_CREATE,
        entity: 'subject',
        entityId: disciplinaId,
        details: `Nova disciplina criada: ${novaDisciplina}`,
        changes: {
          nome: novaDisciplina
        }
      });
      
      console.log('✅ [Escola] Disciplina salva com sucesso');
      setNovaDisciplina("");
      await fetchDataDisciplinas();
    } catch (err) {
      console.error('❌ [Escola] Erro ao adicionar disciplina:', err);
      alert("Erro ao adicionar disciplina!");
    }
    setLoadingDisciplinas(false);
  };

  const handleExcluirDisciplina = async (disciplina) => {
    setLoadingDisciplinas(true);
    try {
      console.log('🗑️ [Escola] Excluindo disciplina:', disciplina.id);
      await removeData(`disciplinas/${disciplina.id}`);
      
      // Log da exclusão da disciplina
      await auditService?.logAction({
        action: LOG_ACTIONS.SUBJECT_DELETE,
        entity: 'subject',
        entityId: disciplina.id,
        details: `Disciplina excluída: ${disciplina.nome}`,
        changes: {
          nome: disciplina.nome
        }
      });
      
      await fetchDataDisciplinas();
    } catch (err) {
      alert("Erro ao excluir disciplina!");
    }
    setLoadingDisciplinas(false);
  };

  const fetchDataDisciplinas = async () => {
    setLoadingDisciplinas(true);
    try {
      console.log('📡 [Escola] Carregando disciplinas do banco da escola...');
      const data = await getData('disciplinas');
      if (data) {
        const listaDisciplinas = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setDisciplinas(listaDisciplinas);
        console.log('✅ [Escola] Disciplinas carregadas:', listaDisciplinas.length);
      } else {
        console.log('⚠️ [Escola] Nenhuma disciplina encontrada');
        setDisciplinas([]);
      }
    } catch (err) {
      console.error('❌ [Escola] Erro ao carregar disciplinas:', err);
      setDisciplinas([]);
    }
    setLoadingDisciplinas(false);
  };

  useEffect(() => {
    if (isReady) {
      fetchDataDisciplinas();
      carregarPeriodosCadastrados();
      fetchData();
      fetchPeriodosAtivos();
      
      // Executar limpeza de avisos expirados na inicialização
      limparAvisosExpirados();
    }
    
    // Executar limpeza periódica a cada 6 horas (opcional)
    const interval = setInterval(() => {
      if (isReady) {
        limparAvisosExpirados();
      }
    }, 6 * 60 * 60 * 1000); // 6 horas em milissegundos
    
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  // Listener de autenticação - DEVE rodar imediatamente
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ [Escola] Usuário autenticado:', user.uid);
        setUserId(user.uid);
      } else {
        console.log('❌ [Escola] Nenhum usuário autenticado');
        setUserId(null);
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Verificar role do usuário
  useEffect(() => {
    async function fetchRole() {
      console.log('🔍 [Escola] Verificando role - userId:', userId, 'isReady:', isReady);
      
      if (!userId) {
        console.log('⚠️ [Escola] Sem userId - marcando roleChecked como true');
        setUserRole(null);
        setRoleChecked(true);
        return;
      }

      if (!isReady) {
        console.log('⏳ [Escola] Aguardando conexão com banco da escola...');
        return;
      }
      
      try {
        console.log('📡 [Escola] Buscando dados do usuário:', `usuarios/${userId}`);
        const userData = await getData(`usuarios/${userId}`);
        console.log('📦 [Escola] Dados recebidos:', userData);
        
        if (userData) {
          // ✅ Não converter para lowercase - manter o valor original
          setUserRole(userData.role || '');
          console.log('✅ [Escola] Role carregada:', userData.role);
        } else {
          console.log('⚠️ [Escola] Nenhum dado encontrado para o usuário');
          setUserRole(null);
        }
      } catch (error) {
        console.error('❌ [Escola] Erro ao buscar dados do usuário:', error);
        setUserRole(null);
      } finally {
        setRoleChecked(true);
        console.log('✔️ [Escola] roleChecked marcado como true');
      }
    }
    fetchRole();
  }, [userId, isReady, getData]);

  if (!roleChecked) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Verificar se é coordenadora ou coordenador
  if (!userRole || (userRole !== 'coordenadora' && userRole !== 'coordenador')) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Acesso negado
        </Typography>
        <Typography variant="body1">
          Esta página é restrita para coordenadoras/coordenadores.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Role detectada: "{userRole || 'não definida'}"
        </Typography>
      </Box>
    );
  }

  return (
    <div className="dashboard-container">
      <SidebarMenu />
      <main className="dashboard-main">
        <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
          <Typography
            variant="h4"
            color="primary"
            fontWeight={700}
            gutterBottom
            align="center"
          >
            Informações da Escola
          </Typography>
          {/* Gerenciador de avisos */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    borderRadius: 1,
                    p: 1,
                    '&:hover': {
                      bgcolor: 'rgba(33, 150, 243, 0.04)'
                    }
                  }}
                  onClick={() => setAvisosExpanded(!avisosExpanded)}
                >
                  <Notifications sx={{ color: 'primary.main', mr: 2, fontSize: 28 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" color="primary" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                      Quadro de Avisos
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                      {avisos.length} {avisos.length === 1 ? 'aviso' : 'avisos'} disponível{avisos.length === 1 ? '' : 'eis'}
                    </Typography>
                  </Box>
                  {avisosExpanded ? (
                    <ExpandLess sx={{ color: 'primary.main', ml: 2 }} />
                  ) : (
                    <ExpandMore sx={{ color: 'primary.main', ml: 2 }} />
                  )}
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleOpenAvisoModal}
                  sx={{
                    background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2, #0288D1)',
                    }
                  }}
                >
                  Novo Aviso
                </Button>
              </Box>

              {/* Prévia compacta quando retraído */}
              {!avisosExpanded && avisos.length > 0 && (
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#f8fafc',
                    borderRadius: 1,
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: '#f1f5f9'
                    }
                  }}
                  onClick={() => setAvisosExpanded(true)}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    📋 {avisos.length} aviso{avisos.length !== 1 ? 's' : ''} disponível{avisos.length !== 1 ? 'eis' : ''} • Clique para expandir
                  </Typography>
                </Box>
              )}

              {/* Lista de avisos com collapse */}
              <Collapse in={avisosExpanded} timeout="auto" unmountOnExit>
                {avisos.length === 0 ? (
                  <Box 
                    sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      bgcolor: '#f8fafc',
                      borderRadius: 2,
                      border: '2px dashed #e2e8f0'
                    }}
                  >
                    <Notifications sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                    <Typography color="text.secondary" variant="h6">
                      Nenhum aviso cadastrado
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Clique em "Novo Aviso" para criar o primeiro aviso
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                  {avisos.map((aviso, index) => (
                    <Card 
                      key={aviso.id} 
                      sx={{ 
                        mb: 2, 
                        border: '1px solid #e2e8f0',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            {/* Cabeçalho do aviso */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6" fontWeight={600} sx={{ mr: 2 }}>
                                {aviso.titulo || 'Aviso'}
                              </Typography>
                              <Chip 
                                size="small"
                                label={aviso.prioridade || 'média'}
                                color={
                                  aviso.prioridade === 'alta' ? 'error' : 
                                  aviso.prioridade === 'media' ? 'warning' : 'default'
                                }
                                sx={{ mr: 1 }}
                              />
                              <Chip 
                                size="small"
                                label={aviso.categoria || 'geral'}
                                variant="outlined"
                                sx={{ mr: 1 }}
                              />
                              {/* Indicador de vencimento próximo */}
                              {isAvisoProximoVencimento(aviso) && (
                                <Chip 
                                  size="small"
                                  label="⏰ Expira em breve"
                                  color="warning"
                                  variant="filled"
                                  sx={{ 
                                    animation: 'pulse 2s infinite',
                                    bgcolor: '#ff9800',
                                    color: 'white',
                                    '@keyframes pulse': {
                                      '0%': { opacity: 1 },
                                      '50%': { opacity: 0.7 },
                                      '100%': { opacity: 1 }
                                    }
                                  }}
                                />
                              )}
                            </Box>

                            {/* Conteúdo do aviso */}
                            <Typography variant="body1" sx={{ mb: 2 }}>
                              {aviso.conteudo || aviso.texto}
                            </Typography>

                            {/* Pré-visualização do anexo */}
                            {aviso.anexo && (
                              <Box sx={{ mb: 2 }}>
                                {/* Verifica se é uma imagem */}
                                {(aviso.anexo.toLowerCase().includes('.jpg') || 
                                  aviso.anexo.toLowerCase().includes('.jpeg') || 
                                  aviso.anexo.toLowerCase().includes('.png') || 
                                  aviso.anexo.toLowerCase().includes('.gif') ||
                                  aviso.anexo.toLowerCase().includes('.webp')) ? (
                                  <Box 
                                    component="img"
                                    src={aviso.anexo}
                                    alt="Anexo do aviso"
                                    sx={{
                                      width: '100%',
                                      maxHeight: 300,
                                      objectFit: 'cover',
                                      borderRadius: 2,
                                      border: '1px solid #e2e8f0',
                                      cursor: 'pointer',
                                      '&:hover': {
                                        opacity: 0.9
                                      }
                                    }}
                                    onClick={() => window.open(aviso.anexo, '_blank')}
                                  />
                                ) : (
                                  /* Se não é imagem, mostra link do anexo */
                                  <Box sx={{ p: 1, bgcolor: '#f0f9ff', borderRadius: 1, border: '1px solid #bfdbfe' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <AttachFile sx={{ fontSize: 16, color: '#3b82f6', mr: 1 }} />
                                      <Typography 
                                        variant="body2" 
                                        color="primary"
                                        component="a"
                                        href={aviso.anexo}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ 
                                          textDecoration: 'none',
                                          '&:hover': { textDecoration: 'underline' }
                                        }}
                                      >
                                        {aviso.anexo.includes('http') 
                                          ? 'Link do anexo' 
                                          : aviso.anexo.split('/').pop()?.split('_').slice(1).join('_') || 'Arquivo anexado'
                                        }
                                      </Typography>
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            )}                            {/* Informações do aviso */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                              <Typography variant="caption" color="text.secondary">
                                <strong>Autor:</strong> {aviso.autor || 'Sistema'}
                              </Typography>
                              {aviso.dataCreacao && (
                                <Typography variant="caption" color="text.secondary">
                                  <strong>Criado em:</strong> {new Date(aviso.dataCreacao).toLocaleDateString('pt-BR')}
                                </Typography>
                              )}
                              {aviso.dataExpiracao && (
                                <Typography 
                                  variant="caption" 
                                  color={isAvisoProximoVencimento(aviso) ? 'warning.main' : 'text.secondary'}
                                  sx={{ 
                                    fontWeight: isAvisoProximoVencimento(aviso) ? 600 : 'normal',
                                  }}
                                >
                                  <strong>Expira em:</strong> {new Date(aviso.dataExpiracao).toLocaleDateString('pt-BR')}
                                  {isAvisoProximoVencimento(aviso) && ' ⏰'}
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          {/* Ações */}
                          <Box sx={{ ml: 2 }}>
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveAviso(aviso.id)}
                              sx={{
                                '&:hover': {
                                  bgcolor: 'error.light',
                                  color: 'white'
                                }
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
              </Collapse>
            </CardContent>
          </Card>

          {/* Modal para criar/editar aviso */}
          <Dialog open={openAvisoModal} onClose={() => setOpenAvisoModal(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Notifications sx={{ color: 'primary.main', mr: 1 }} />
                Criar Novo Aviso
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                {/* Título */}
                <TextField
                  label="Título do Aviso"
                  name="titulo"
                  value={avisoForm.titulo}
                  onChange={handleAvisoFormChange}
                  fullWidth
                  required
                  placeholder="Digite um título claro e objetivo"
                />

                {/* Conteúdo */}
                <TextField
                  label="Conteúdo do Aviso"
                  name="conteudo"
                  value={avisoForm.conteudo}
                  onChange={handleAvisoFormChange}
                  fullWidth
                  required
                  multiline
                  rows={4}
                  placeholder="Descreva o aviso com detalhes..."
                />

                {/* Linha 1: Prioridade e Categoria */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Prioridade</InputLabel>
                    <Select
                      name="prioridade"
                      value={avisoForm.prioridade}
                      label="Prioridade"
                      onChange={handleAvisoFormChange}
                    >
                      <MenuItem value="baixa">🟢 Baixa</MenuItem>
                      <MenuItem value="media">🟡 Média</MenuItem>
                      <MenuItem value="alta">🔴 Alta</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      name="categoria"
                      value={avisoForm.categoria}
                      label="Categoria"
                      onChange={handleAvisoFormChange}
                    >
                      <MenuItem value="geral">📢 Geral</MenuItem>
                      <MenuItem value="academico">📚 Acadêmico</MenuItem>
                      <MenuItem value="evento">🎉 Evento</MenuItem>
                      <MenuItem value="urgente">⚠️ Urgente</MenuItem>
                      <MenuItem value="manutencao">🔧 Manutenção</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Linha 2: Visibilidade e Data de Expiração */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Visibilidade</InputLabel>
                    <Select
                      name="visibilidade"
                      value={avisoForm.visibilidade}
                      label="Visibilidade"
                      onChange={handleAvisoFormChange}
                    >
                      <MenuItem value="todos">👥 Todos</MenuItem>
                      <MenuItem value="professores">👨‍🏫 Professores</MenuItem>
                      <MenuItem value="coordenacao">👩‍💼 Coordenação</MenuItem>
                      <MenuItem value="pais">👨‍👩‍👧‍👦 Pais/Responsáveis</MenuItem>
                      <MenuItem value="alunos">🎓 Alunos</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Data de Expiração"
                    name="dataExpiracao"
                    type="date"
                    value={avisoForm.dataExpiracao}
                    onChange={handleAvisoFormChange}
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    helperText="Deixe em branco se o aviso não expira"
                  />
                </Box>

                {/* Anexo */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary', fontWeight: 600 }}>
                    📎 Anexar Arquivo
                  </Typography>
                  
                  {/* Campo de Link */}
                  <TextField
                    label="Link do anexo (opcional)"
                    name="anexo"
                    value={avisoForm.anexo}
                    onChange={handleAvisoFormChange}
                    fullWidth
                    placeholder="https://exemplo.com/arquivo.pdf"
                    helperText="Cole a URL de um arquivo online"
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: <AttachFile sx={{ color: 'text.secondary', mr: 1 }} />
                    }}
                  />

                  {/* Campo de Upload */}
                  <Box sx={{ 
                    border: '2px dashed #ddd', 
                    borderRadius: 2, 
                    p: 2, 
                    textAlign: 'center',
                    backgroundColor: selectedFile ? '#f0f9ff' : '#fafafa',
                    borderColor: selectedFile ? '#3b82f6' : '#ddd',
                    transition: 'all 0.3s ease'
                  }}>
                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      accept="image/*,application/pdf,.doc,.docx,.txt"
                    />
                    <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        {selectedFile ? (
                          <>
                            <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
                            <Typography variant="body1" color="success.main" fontWeight={600}>
                              {selectedFile.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('file-upload').click();
                              }}
                            >
                              Alterar arquivo
                            </Button>
                          </>
                        ) : (
                          <>
                            <CloudUpload sx={{ color: 'text.secondary', fontSize: 32 }} />
                            <Typography variant="body1" color="text.primary">
                              Clique aqui para selecionar um arquivo
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Ou arraste e solte o arquivo aqui
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Máximo: 10MB • Formatos: PDF, DOC, IMG, TXT
                            </Typography>
                          </>
                        )}
                      </Box>
                    </label>
                  </Box>

                  {uploading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      <Typography variant="body2" color="primary">
                        Fazendo upload do arquivo...
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button onClick={() => setOpenAvisoModal(false)} color="secondary" variant="outlined">
                Cancelar
              </Button>
              <Button 
                onClick={handleAddAviso} 
                color="primary" 
                variant="contained"
                disabled={salvandoAviso || uploading || !avisoForm.titulo.trim() || !avisoForm.conteudo.trim()}
                sx={{
                  background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976D2, #0288D1)',
                  }
                }}
              >
                {uploading ? (
                  <>
                    <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                    Enviando arquivo...
                  </>
                ) : salvandoAviso ? (
                  <>
                    <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                    Salvando...
                  </>
                ) : (
                  'Publicar Aviso'
                )}
              </Button>
            </DialogActions>
          </Dialog>
          <GestaoEscolarCard
            turmasContent={
              <TurmaCard
                turmas={turmas}
                loading={loading}
                filtroTurno={filtroTurno}
                setFiltroTurno={setFiltroTurno}
                filtroNomeTurma={filtroNomeTurma}
                setFiltroNomeTurma={setFiltroNomeTurma}
                handleAddTurma={handleAddTurma}
                handleEditTurma={handleEditTurma}
                handleExcluirTurma={handleExcluirTurma}
                periodosAtivos={periodosAtivos}
                openTurmaModal={openTurmaModal}
                setOpenTurmaModal={setOpenTurmaModal}
                editTurma={editTurma}
                editTurmaForm={editTurmaForm}
                setEditTurmaForm={setEditTurmaForm}
                isNewTurma={isNewTurma}
                savingTurma={savingTurma}
                handleTurmaFormChange={handleTurmaFormChange}
                handleSaveTurma={handleSaveTurma}
                gestaoTurmaOpen={gestaoTurmaOpen}
                gestaoTurma={gestaoTurma}
                handleOpenGestaoTurma={handleOpenGestaoTurma}
                handleCloseGestaoTurma={handleCloseGestaoTurma}
                alunosTurma={alunosTurma}
                calcularIdade={calcularIdade}
                modalVinculosOpen={modalVinculosOpen}
                setModalVinculosOpen={setModalVinculosOpen}
                vinculosTurma={vinculosTurma}
                modalConfirmExcluirOpen={modalConfirmExcluirOpen}
                setModalConfirmExcluirOpen={setModalConfirmExcluirOpen}
                turmaExcluir={turmaExcluir}
                handleConfirmExcluirTurma={handleConfirmExcluirTurma}
                excluindoTurma={excluindoTurma}
                loadingPeriodosAtivos={loadingPeriodosAtivos}
              />
            }
            periodosContent={
              <PeriodoCard
                periodoForm={periodoForm}
                salvandoPeriodo={salvandoPeriodo}
                msgPeriodo={msgPeriodo}
                abaPeriodo={abaPeriodo}
                setAbaPeriodo={setAbaPeriodo}
                modalCadastroPeriodoOpen={modalCadastroPeriodoOpen}
                setModalCadastroPeriodoOpen={setModalCadastroPeriodoOpen}
                handlePeriodoFormChange={handlePeriodoFormChange}
                handleSalvarPeriodo={handleSalvarPeriodo}
                loadingConsulta={loadingConsulta}
                periodosCadastrados={periodosCadastrados}
                carregarPeriodosCadastrados={carregarPeriodosCadastrados}
                handleTrocarAbaPeriodo={handleTrocarAbaPeriodo}
                editDialogOpen={editDialogOpen}
                setEditDialogOpen={setEditDialogOpen}
                editPeriodoForm={editPeriodoForm}
                handleEditPeriodoFormChange={handleEditPeriodoFormChange}
                handleSalvarEdicaoPeriodo={handleSalvarEdicaoPeriodo}
                editMsg={editMsg}
                editLoading={editLoading}
                handleEditarPeriodoClick={handleEditarPeriodoClick}
                handleExcluirPeriodo={handleExcluirPeriodo}
                formatDateBR={formatDateBR}
              />
            }
            disciplinasContent={
              <DisciplinaCard
                disciplinas={disciplinas}
                loadingDisciplinas={loadingDisciplinas}
                openDisciplinaModal={openDisciplinaModal}
                novaDisciplina={novaDisciplina}
                setOpenDisciplinaModal={setOpenDisciplinaModal}
                setNovaDisciplina={setNovaDisciplina}
                handleAddDisciplina={handleAddDisciplina}
                handleExcluirDisciplina={handleExcluirDisciplina}
              />
            }
            gradeHorariaContent={
              <GradeHorariaCard />
            }
            notasFrequenciaContent={
              <NotasFrequenciaCard />
            }
          />
        </Box>
      </main>
    </div>
  );
};
export default Escola;