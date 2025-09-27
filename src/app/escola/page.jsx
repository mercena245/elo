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
import DisciplinaCard from "../components/escola/DisciplinaCard";
import GestaoEscolarCard from "../components/escola/GestaoEscolarCard";
import NotasFrequenciaCard from "../components/escola/NotasFrequenciaCard";
import TurmaCard from "../components/escola/TurmaCard";
import PeriodoCard from "../components/escola/PeriodoCard";
import GradeHorariaCard from "../components/escola/GradeHorariaCard";

// Helpers
function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
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
  const [editColabForm, setEditColabForm] = useState({ nome: '', cargo: '', email: '', disciplinas: [] });
  const [savingColab, setSavingColab] = useState(false);
  const [isNewColab, setIsNewColab] = useState(false);

  // ROLE/LOGIN
  const [userRole, setUserRole] = useState('');
  const [roleChecked, setRoleChecked] = useState(false);
  const userId = auth.currentUser ? auth.currentUser.uid : null;

  // Função para carregar dados iniciais (turmas e avisos)
  const fetchData = async () => {
    setLoading(true);
    try {
      // Carregar turmas
      const turmasSnap = await get(ref(db, 'turmas'));
      if (turmasSnap.exists()) {
        const turmasData = turmasSnap.val();
        const turmasArray = Object.entries(turmasData).map(([id, turma]) => ({ ...turma, id }));
        setTurmas(turmasArray);
      } else {
        setTurmas([]);
      }

      // Carregar avisos
      const avisosSnap = await get(ref(db, 'avisos'));
      if (avisosSnap.exists()) {
        const avisosData = avisosSnap.val();
        const avisosArray = Object.entries(avisosData).map(([id, aviso]) => ({ ...aviso, id }));
        setAvisos(avisosArray);
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
    setSavingColab(true);
    try {
      const colabData = { ...editColabForm };
      if (colabData.cargo !== 'professora') {
        colabData.disciplinas = [];
      }
      if (isNewColab) {
        const novoId = `id_colab_${editColabForm.nome.replace(/\s/g, '').toLowerCase()}`;
        await set(ref(db, `colaboradores/${novoId}`), colabData);
      } else if (editColab && editColab.id) {
        await set(ref(db, `colaboradores/${editColab.id}`), colabData);
      }
      setOpenColabModal(false);
      await fetchData();
    } catch (err) {}
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
      await set(ref(db, `disciplinas/${disciplinaId}`), { nome: novaDisciplina });
      setNovaDisciplina("");
      await fetchDataDisciplinas();
    } catch (err) {
      alert("Erro ao adicionar disciplina!");
    }
    setLoadingDisciplinas(false);
  };

  const handleExcluirDisciplina = async (disciplina) => {
    setLoadingDisciplinas(true);
    try {
      await remove(ref(db, `disciplinas/${disciplina.id}`));
      await fetchDataDisciplinas();
    } catch (err) {
      alert("Erro ao excluir disciplina!");
    }
    setLoadingDisciplinas(false);
  };

  const fetchDataDisciplinas = async () => {
    setLoadingDisciplinas(true);
    try {
      const snap = await get(ref(db, 'disciplinas'));
      if (snap.exists()) {
        const data = snap.val();
        const listaDisciplinas = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setDisciplinas(listaDisciplinas);
      } else {
        setDisciplinas([]);
      }
    } catch (err) {
      setDisciplinas([]);
    }
    setLoadingDisciplinas(false);
  };

  useEffect(() => {
    fetchDataDisciplinas();
    carregarPeriodosCadastrados();
    fetchData();
    fetchPeriodosAtivos();
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