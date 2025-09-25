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
  Divider
} from '@mui/material';
import { ExpandMore, ExpandLess, Edit, Delete } from '@mui/icons-material';
import { FaTrash } from 'react-icons/fa';
import { FaUsers, FaChalkboardTeacher } from 'react-icons/fa';
import { db, ref, get, set, remove, auth } from '../../firebase';

// Helpers
function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// Card expansivo Gestão Escolar
function GestaoEscolarCard({ turmasContent, periodosContent }) {
  const [openTurmas, setOpenTurmas] = React.useState(false);
  const [openPeriodos, setOpenPeriodos] = React.useState(false);
  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" color="primary" fontWeight={700} sx={{ mb: 2 }}>
          Gestão Escolar
        </Typography>
        {/* Botão expansivo de Turmas */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            mb: 1
          }}
          onClick={() => setOpenTurmas(v => !v)}
        >
          <Avatar sx={{ bgcolor: '#1976d2' }}>
            <FaChalkboardTeacher />
          </Avatar>
          <Typography variant="h6">Turmas</Typography>
          <IconButton>{openTurmas ? <ExpandLess /> : <ExpandMore />}</IconButton>
        </Box>
        <Collapse in={openTurmas} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>{turmasContent}</Box>
        </Collapse>
        {/* Botão expansivo de Períodos */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            mb: 1
          }}
          onClick={() => setOpenPeriodos(v => !v)}
        >
          <Avatar sx={{ bgcolor: '#7b1fa2' }}>
            <Typography fontWeight={700} color="white">
              P
            </Typography>
          </Avatar>
          <Typography variant="h6">Períodos</Typography>
          <IconButton>
            {openPeriodos ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        <Collapse in={openPeriodos} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>{periodosContent}</Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

const Escola = () => {
  // TURMAS
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTurmaModal, setOpenTurmaModal] = useState(false);
  const [filtroTurno, setFiltroTurno] = useState('');
  const [filtroNomeTurma, setFiltroNomeTurma] = useState('');
  const [editTurma, setEditTurma] = useState(null);
  const [editTurmaForm, setEditTurmaForm] = useState({ nome: '', status: '', turnoId: '', periodoId: '' });
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

  // COLABORADORES (código mantido para eventual uso futuro)
  const [colaboradores, setColaboradores] = useState([]);
  const [openColabModal, setOpenColabModal] = useState(false);
  const [editColab, setEditColab] = useState(null);
  const [editColabForm, setEditColabForm] = useState({ nome: '', cargo: '', email: '' });
  const [savingColab, setSavingColab] = useState(false);
  const [isNewColab, setIsNewColab] = useState(false);

  // ROLE/LOGIN
  const [userRole, setUserRole] = useState('');
  const [roleChecked, setRoleChecked] = useState(false);
  const userId = auth.currentUser ? auth.currentUser.uid : null;

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
  const [abaPeriodo, setAbaPeriodo] = useState("cadastro");
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
    setLoadingPeriodosAtivos(true);
    try {
      const snap = await get(ref(db, "Escola/Periodo"));
      if (snap.exists()) {
        const data = snap.val();
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
    try {
      const snap = await get(ref(db, 'alunos'));
      if (snap.exists()) {
        const alunos = Object.values(snap.val()).filter(a => a.turmaId === turma.id);
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
    setEditTurmaForm({ nome: '', status: '', turnoId: '', periodoId: '' });
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
    setSavingTurma(true);
    try {
      if (isNewTurma) {
        const novoId = `id_turma_${editTurmaForm.nome.replace(/\s/g, '').toLowerCase()}`;
        await set(ref(db, `turmas/${novoId}`), editTurmaForm);
      } else if (editTurma && editTurma.id) {
        await set(ref(db, `turmas/${editTurma.id}`), editTurmaForm);
      }
      setOpenTurmaModal(false);
      await fetchData();
    } catch (err) {}
    setSavingTurma(false);
  };

  // Excluir turma
  const handleExcluirTurma = async turma => {
    setTurmaExcluir(turma);
    // Buscar vínculos
    const vinculos = [];
    // Alunos
    const alunosSnap = await get(ref(db, `alunos`));
    if (alunosSnap.exists()) {
      const alunos = alunosSnap.val();
      const alunosTurma = Object.values(alunos).filter(a => a.turmaId === turma.id);
      if (alunosTurma.length > 0) {
        vinculos.push({ tipo: "Alunos", lista: alunosTurma.map(a => a.nome || a.id) });
      }
    }
    // Professores
    const profsSnap = await get(ref(db, `professores`));
    if (profsSnap.exists()) {
      const profs = profsSnap.val();
      const profsTurma = Object.values(profs).filter(p => p.turmaId === turma.id);
      if (profsTurma.length > 0) {
        vinculos.push({ tipo: "Professores", lista: profsTurma.map(p => p.nome || p.id) });
      }
    }
    // Usuários
    const usuariosSnap = await get(ref(db, `usuarios`));
    if (usuariosSnap.exists()) {
      const usuarios = usuariosSnap.val();
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
    setExcluindoTurma(true);
    try {
      await remove(ref(db, `turmas/${turmaExcluir.id}`));
      setModalConfirmExcluirOpen(false);
      setTurmaExcluir(null);
      await fetchData();
    } catch (err) {
      alert("Erro ao excluir turma!");
    }
    setExcluindoTurma(false);
  };

  // AVISOS
  const handleAddAviso = async () => {
    if (!novoAviso.trim()) return;
    setSalvandoAviso(true);
    const avisoId = `aviso_${Date.now()}`;
    await set(ref(db, `avisos/${avisoId}`), { texto: novoAviso });
    setNovoAviso('');
    await fetchData();
    setSalvandoAviso(false);
  };

  const handleRemoveAviso = async id => {
    await set(ref(db, `avisos/${id}`), null);
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
      email: colab.email || ''
    });
    setIsNewColab(false);
    setOpenColabModal(true);
  };

  const handleColabFormChange = e => {
    const { name, value } = e.target;
    setEditColabForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveColab = async () => {
    setSavingColab(true);
    try {
      if (isNewColab) {
        const novoId = `id_colab_${editColabForm.nome.replace(/\s/g, '').toLowerCase()}`;
        await set(ref(db, `colaboradores/${novoId}`), editColabForm);
      } else if (editColab && editColab.id) {
        await set(ref(db, `colaboradores/${editColab.id}`), editColabForm);
      }
      setOpenColabModal(false);
      await fetchData();
    } catch (err) {}
    setSavingColab(false);
  };

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
      await set(ref(db, `Escola/Periodo/${periodoId}`), {
        ...periodoForm
      });
      setMsgPeriodo("Período salvo com sucesso!");
      setPeriodoForm({
        ano: "",
        periodo: "",
        ativo: true,
        dataInicio: "",
        dataFim: ""
      });
      if (abaPeriodo === "consulta") carregarPeriodosCadastrados();
    } catch (err) {
      setMsgPeriodo("Falha ao salvar período!");
    }
    setSalvandoPeriodo(false);
  }

  async function carregarPeriodosCadastrados() {
    setLoadingConsulta(true);
    setPeriodosCadastrados([]);
    try {
      const snap = await get(ref(db, "Escola/Periodo"));
      if (snap.exists()) {
        const data = snap.val();
        const lista = Object.entries(data).map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => {
            if (a.ano !== b.ano) return b.ano - a.ano;
            if (a.periodo !== b.periodo) return b.periodo - a.periodo;
            return a.dataInicio.localeCompare(b.dataInicio);
          });
        setPeriodosCadastrados(lista);
      } else {
        setPeriodosCadastrados([]);
      }
    } catch (err) {
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
      await set(ref(db, `Escola/Periodo/${editPeriodoForm.id}`), {
        ano: editPeriodoForm.ano,
        periodo: editPeriodoForm.periodo,
        ativo: !!editPeriodoForm.ativo,
        dataInicio: editPeriodoForm.dataInicio,
        dataFim: editPeriodoForm.dataFim
      });
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
      await remove(ref(db, `Escola/Periodo/${id}`));
      carregarPeriodosCadastrados();
    } catch (err) {
      alert('Erro ao excluir período!');
    }
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const colabSnap = await get(ref(db, 'colaboradores'));
      const turmasSnap = await get(ref(db, 'turmas'));
      const avisosSnap = await get(ref(db, 'avisos'));
      let colabArr = [];
      let turmasArr = [];
      let avisosArr = [];
      if (colabSnap.exists()) {
        const colabData = colabSnap.val();
        colabArr = Object.entries(colabData).map(([id, colab]) => ({
          ...colab,
          id
        }));
      }
      if (turmasSnap.exists()) {
        const turmasData = turmasSnap.val();
        turmasArr = Object.entries(turmasData).map(([id, turma]) => ({
          ...turma,
          id
        }));
      }
      if (avisosSnap.exists()) {
        const avisosData = avisosSnap.val();
        avisosArr = Object.entries(avisosData).map(([id, aviso]) => ({
          id,
          ...aviso
        }));
      }
      setColaboradores(colabArr);
      setTurmas(turmasArr);
      setAvisos(avisosArr);
    } catch {
      setColaboradores([]);
      setTurmas([]);
      setAvisos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchRole() {
      if (!userId) {
        setUserRole(null);
        setRoleChecked(true);
        return;
      }
      const userRef = ref(db, `usuarios/${userId}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const userData = snap.val();
        setUserRole((userData.role || '').trim().toLowerCase());
      } else {
        setUserRole(null);
      }
      setRoleChecked(true);
    }
    fetchRole();
  }, [userId]);

  if (!roleChecked) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (userRole !== 'coordenadora') {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Acesso negado
        </Typography>
        <Typography variant="body1">
          Esta página é restrita para coordenadoras.
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
              <Typography variant="h6" color="primary" gutterBottom>
                Quadro de Avisos
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Novo aviso"
                  value={novoAviso}
                  onChange={e => setNovoAviso(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddAviso}
                  disabled={salvandoAviso || !novoAviso.trim()}
                >
                  Adicionar
                </Button>
              </Box>
              {avisos.length === 0 ? (
                <Typography color="text.secondary" align="center">
                  Nenhum aviso cadastrado.
                </Typography>
              ) : (
                <List>
                  {avisos.map(aviso => (
                    <ListItem
                      key={aviso.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleRemoveAviso(aviso.id)}
                        >
                          <FaTrash />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={aviso.texto} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
          <GestaoEscolarCard
            turmasContent={
              <Grid container spacing={2} justifyContent="center">
                <Grid
                  item
                  xs={12}
                  md={6}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                >
                  <Card
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start'
                    }}
                  >
                    <CardContent sx={{ height: '100%' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 2,
                          justifyContent: 'center'
                        }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          sx={{ ml: 2 }}
                          onClick={handleAddTurma}
                        >
                          Incluir Turma
                        </Button>
                      </Box>
                      <Box
                        sx={{
                          mb: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          gap: 2
                        }}
                      >
                        <FormControl sx={{ minWidth: 120 }} size="small">
                          <InputLabel id="filtro-turno-label">
                            Filtrar por turno
                          </InputLabel>
                          <Select
                            labelId="filtro-turno-label"
                            value={filtroTurno || ''}
                            label="Filtrar por turno"
                            onChange={e => setFiltroTurno(e.target.value)}
                          >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="Manhã">Manhã</MenuItem>
                            <MenuItem value="Tarde">Tarde</MenuItem>
                            <MenuItem value="Noite">Noite</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          label="Filtrar por nome"
                          variant="outlined"
                          size="small"
                          value={filtroNomeTurma}
                          onChange={e => setFiltroNomeTurma(e.target.value)}
                          sx={{ minWidth: 180 }}
                        />
                      </Box>
                      {loading ? (
                        <Typography variant="body2" color="text.secondary">
                          Carregando...
                        </Typography>
                      ) : turmas.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Nenhuma turma encontrada.
                        </Typography>
                      ) : (
                        turmas
                          .filter(
                            turma =>
                              (!filtroTurno || turma.turnoId === filtroTurno) &&
                              (!filtroNomeTurma || turma.nome.toLowerCase().includes(filtroNomeTurma.toLowerCase()))
                          )
                          .map(turma => (
                            <Box
                              key={turma.id}
                              sx={{
                                mb: 2,
                                p: 1,
                                borderRadius: 2,
                                bgcolor: '#f5f5f5',
                                textAlign: 'center',
                                cursor: 'pointer',
                                position: 'relative'
                              }}
                              onClick={e => {
                                // Evita abrir modal se clicar nos ícones de editar/excluir
                                if (e.target.closest('.turma-action-btn')) return;
                                handleOpenGestaoTurma(turma);
                              }}
                            >
                              <Box
                                sx={{
                                  position: 'absolute',
                                  right: 8,
                                  top: 8,
                                  display: 'flex',
                                  gap: 1
                                }}
                              >
                                <IconButton
                                  className="turma-action-btn"
                                  color="primary"
                                  size="small"
                                  onClick={e => { e.stopPropagation(); handleEditTurma(turma); }}
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton
                                  className="turma-action-btn"
                                  color="error"
                                  size="small"
                                  onClick={e => { e.stopPropagation(); handleExcluirTurma(turma); }}
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {turma.nome}
                              </Typography>
                              <Typography variant="body2">
                                Status: {turma.status || '-'}
                              </Typography>
                              <Typography variant="body2">
                                Turno: {turma.turnoId || '-'}
                              </Typography>
                              <Typography variant="body2">
                                Período: {periodosAtivos.find(p => p.id === turma.periodoId)?.label || turma.periodoId || "-"}
                              </Typography>
                            </Box>
                          ))
                        )}
                      {/* Modal de Gestão da Turma */}
                      <Dialog open={gestaoTurmaOpen} onClose={handleCloseGestaoTurma} maxWidth="md" fullWidth>
                        <DialogTitle>Gestão da Turma: {gestaoTurma?.nome}</DialogTitle>
                        <DialogContent>
                          <Typography variant="subtitle1" sx={{ mb: 2 }}>Alunos vinculados</Typography>
                          {alunosTurma.length === 0 ? (
                            <Typography color="text.secondary">Nenhum aluno vinculado a esta turma.</Typography>
                          ) : (
                            <List>
                              {alunosTurma.map((aluno, idx) => (
                                <ListItem key={aluno.id || idx} divider>
                                  <ListItemText
                                    primary={<>
                                      <b>{aluno.nome}</b> (Matrícula: {aluno.matricula || '--'})
                                    </>}
                                    secondary={<>
                                      <Typography variant="body2">Pai: {aluno.nomePai || '--'}</Typography>
                                      <Typography variant="body2">Mãe: {aluno.nomeMae || '--'}</Typography>
                                      <Typography variant="body2">Idade: {calcularIdade(aluno.dataNascimento)}</Typography>
                                    </>}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          )}
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={handleCloseGestaoTurma} color="primary">Fechar</Button>
                        </DialogActions>
                      </Dialog>
                      <Dialog
                        open={openTurmaModal}
                        onClose={() => setOpenTurmaModal(false)}
                        maxWidth="sm"
                        fullWidth
                      >
                        <DialogTitle>
                          {isNewTurma ? 'Incluir Turma' : 'Editar Turma'}
                        </DialogTitle>
                        <DialogContent>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 2
                            }}
                          >
                            <TextField
                              label="Nome"
                              name="nome"
                              value={editTurmaForm.nome || ''}
                              onChange={handleTurmaFormChange}
                              fullWidth
                              required
                            />
                            <TextField
                              label="Status"
                              name="status"
                              value={editTurmaForm.status || ''}
                              onChange={handleTurmaFormChange}
                              fullWidth
                            />
                            <FormControl fullWidth>
                              <InputLabel id="turno-select-label">
                                Turno
                              </InputLabel>
                              <Select
                                labelId="turno-select-label"
                                name="turnoId"
                                value={editTurmaForm.turnoId || ''}
                                label="Turno"
                                onChange={handleTurmaFormChange}
                                required
                              >
                                <MenuItem value="Manhã">Manhã</MenuItem>
                                <MenuItem value="Tarde">Tarde</MenuItem>
                                <MenuItem value="Noite">Noite</MenuItem>
                              </Select>
                            </FormControl>
                            <FormControl fullWidth required>
                              <InputLabel id="periodo-select-label-turma">
                                Período
                              </InputLabel>
                              <Select
                                labelId="periodo-select-label-turma"
                                name="periodoId"
                                value={editTurmaForm.periodoId || ''}
                                label="Período"
                                onChange={handleTurmaFormChange}
                                required
                                disabled={loadingPeriodosAtivos}
                              >
                                {loadingPeriodosAtivos ? (
                                  <MenuItem value="">
                                    <CircularProgress size={20} />
                                  </MenuItem>
                                ) : periodosAtivos.length === 0 ? (
                                  <MenuItem value="">
                                    Nenhum período ativo disponível
                                  </MenuItem>
                                ) : (
                                  periodosAtivos.map(periodo => (
                                    <MenuItem key={periodo.id} value={periodo.id}>
                                      {periodo.label}
                                    </MenuItem>
                                  ))
                                )}
                              </Select>
                            </FormControl>
                          </Box>
                        </DialogContent>
                        <DialogActions>
                          <Button
                            onClick={() => setOpenTurmaModal(false)}
                            color="secondary"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSaveTurma}
                            color="primary"
                            disabled={savingTurma}
                          >
                            Salvar
                          </Button>
                        </DialogActions>
                      </Dialog>
                      {/* Modal de vínculos */}
                      <Dialog open={modalVinculosOpen} onClose={() => setModalVinculosOpen(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>Não é possível excluir a turma</DialogTitle>
                        <DialogContent>
                          <Typography variant="body1" color="error" gutterBottom>
                            Existem os seguintes vínculos registrados nesta turma:
                          </Typography>
                          {vinculosTurma.map((vinc, i) => (
                            <Box key={i} sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" fontWeight={700}>{vinc.tipo}:</Typography>
                              <List dense>
                                {vinc.lista.map((nome, idx) => (<ListItem key={idx}><ListItemText primary={nome} /></ListItem>))}
                              </List>
                            </Box>
                          ))}
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={() => setModalVinculosOpen(false)} color="primary">Fechar</Button>
                        </DialogActions>
                      </Dialog>
                      {/* Modal de confirmação de exclusão */}
                      <Dialog open={modalConfirmExcluirOpen} onClose={() => setModalConfirmExcluirOpen(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>Confirma exclusão da turma?</DialogTitle>
                        <DialogContent>
                          <Typography variant="body1" gutterBottom>
                            Tem certeza que deseja excluir a turma <b>{turmaExcluir?.nome}</b>?
                          </Typography>
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={() => setModalConfirmExcluirOpen(false)} color="secondary">Não</Button>
                          <Button onClick={handleConfirmExcluirTurma} color="error" disabled={excluindoTurma}>
                            {excluindoTurma ? "Excluindo..." : "Sim, excluir"}
                          </Button>
                        </DialogActions>
                      </Dialog>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            }
            periodosContent={
              <Box
                sx={{
                  maxWidth: 400,
                  mx: 'auto',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#f5f5f5'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Cadastrar Período
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: abaPeriodo === "consulta" ? "#1976d2" : "text.secondary",
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontWeight: 500
                    }}
                    onClick={() => handleTrocarAbaPeriodo(abaPeriodo === "consulta" ? "cadastro" : "consulta")}
                  >
                    {abaPeriodo === "consulta" ? "← Voltar ao Cadastro" : "Consultar Período"}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {abaPeriodo === "cadastro" ? (
                  <Box
                    component="form"
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    onSubmit={handleSalvarPeriodo}
                  >
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel id="ano-select-label">Ano</InputLabel>
                        <Select
                          labelId="ano-select-label"
                          name="ano"
                          value={periodoForm.ano}
                          label="Ano"
                          onChange={handlePeriodoFormChange}
                          required
                        >
                          {[2023, 2024, 2025, 2026].map(ano => (
                            <MenuItem key={ano} value={ano}>
                              {ano}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth>
                        <InputLabel id="periodo-select-label">Período</InputLabel>
                        <Select
                          labelId="periodo-select-label"
                          name="periodo"
                          value={periodoForm.periodo}
                          label="Período"
                          onChange={handlePeriodoFormChange}
                          required
                        >
                          <MenuItem value={1}>1</MenuItem>
                          <MenuItem value={2}>2</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <FormControl fullWidth>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography>Status:</Typography>
                        <Switch
                          checked={periodoForm.ativo}
                          onChange={e =>
                            setPeriodoForm(prev => ({
                              ...prev,
                              ativo: e.target.checked
                            }))
                          }
                          color="primary"
                        />
                        <Typography>
                          {periodoForm.ativo ? 'Ativo' : 'Inativo'}
                        </Typography>
                      </Box>
                    </FormControl>
                    <TextField
                      label="Data de Início"
                      type="date"
                      name="dataInicio"
                      value={periodoForm.dataInicio}
                      onChange={handlePeriodoFormChange}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Data de Fim"
                      type="date"
                      name="dataFim"
                      value={periodoForm.dataFim}
                      onChange={handlePeriodoFormChange}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      required
                    />
                    <Button variant="contained" color="primary" type="submit" disabled={salvandoPeriodo}>
                      {salvandoPeriodo ? "Salvando..." : "Salvar Período"}
                    </Button>
                    {msgPeriodo && (
                      <Typography
                        color={msgPeriodo.includes("sucesso") ? "primary" : "error"}
                        variant="body2"
                        align="center"
                        mt={1}
                      >
                        {msgPeriodo}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Box>
                    {loadingConsulta ? (
                      <Box sx={{ textAlign: "center", py: 2 }}>
                        <CircularProgress size={32} />
                      </Box>
                    ) : periodosCadastrados.length === 0 ? (
                      <Typography color="text.secondary" align="center">
                        Nenhum período cadastrado.
                      </Typography>
                    ) : (
                      <List>
                        {periodosCadastrados.map(periodo => (
                          <ListItem
                            key={periodo.id}
                            sx={{
                              mb: 1,
                              bgcolor: "#f8f8f8",
                              borderRadius: 2,
                              display: "flex",
                              alignItems: "center"
                            }}
                            secondaryAction={
                              <Box>
                                <IconButton
                                  edge="end"
                                  color="primary"
                                  sx={{ mr: 1 }}
                                  onClick={() => handleEditarPeriodoClick(periodo)}
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton
                                  edge="end"
                                  color="error"
                                  onClick={() => handleExcluirPeriodo(periodo.id)}
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            }
                          >
                            <ListItemText
                              primary={`Ano: ${periodo.ano} | Período: ${periodo.periodo} | ${periodo.ativo ? "Ativo" : "Inativo"}`}
                              secondary={
                                <>
                                  Início: {formatDateBR(periodo.dataInicio)} • Fim: {formatDateBR(periodo.dataFim)}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                    {/* Modal de edição */}
                    <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                      <DialogTitle>Editar Período</DialogTitle>
                      <DialogContent>
                        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl fullWidth>
                              <InputLabel id="edit-ano-label">Ano</InputLabel>
                              <Select
                                labelId="edit-ano-label"
                                name="ano"
                                value={editPeriodoForm.ano}
                                label="Ano"
                                onChange={handleEditPeriodoFormChange}
                                required
                              >
                                {[2023, 2024, 2025, 2026].map(ano => (
                                  <MenuItem key={ano} value={ano}>
                                    {ano}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <FormControl fullWidth>
                              <InputLabel id="edit-periodo-label">Período</InputLabel>
                              <Select
                                labelId="edit-periodo-label"
                                name="periodo"
                                value={editPeriodoForm.periodo}
                                label="Período"
                                onChange={handleEditPeriodoFormChange}
                                required
                              >
                                <MenuItem value={1}>1</MenuItem>
                                <MenuItem value={2}>2</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                          <FormControl fullWidth>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography>Status:</Typography>
                              <Switch
                                checked={editPeriodoForm.ativo}
                                onChange={e =>
                                  setEditPeriodoForm(prev => ({
                                    ...prev,
                                    ativo: e.target.checked
                                  }))
                                }
                                color="primary"
                              />
                              <Typography>
                                {editPeriodoForm.ativo ? 'Ativo' : 'Inativo'}
                              </Typography>
                            </Box>
                          </FormControl>
                          <TextField
                            label="Data de Início"
                            type="date"
                            name="dataInicio"
                            value={editPeriodoForm.dataInicio}
                            onChange={handleEditPeriodoFormChange}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            required
                          />
                          <TextField
                            label="Data de Fim"
                            type="date"
                            name="dataFim"
                            value={editPeriodoForm.dataFim}
                            onChange={handleEditPeriodoFormChange}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            required
                          />
                          {editMsg && (
                            <Typography color={editMsg.includes("sucesso") ? "primary" : "error"} variant="body2" align="center" mt={1}>
                              {editMsg}
                            </Typography>
                          )}
                        </Box>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)} color="secondary">Cancelar</Button>
                        <Button onClick={handleSalvarEdicaoPeriodo} color="primary" disabled={editLoading}>
                          {editLoading ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </Box>
                )}
              </Box>
            }
          />
        </Box>
      </main>
    </div>
  );
};
export default Escola;