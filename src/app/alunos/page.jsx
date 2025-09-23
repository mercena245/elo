"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '../../components/SidebarMenu';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Box, CircularProgress, Select, MenuItem, InputLabel, FormControl, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { db, ref, get, auth } from '../../firebase';
import { set } from 'firebase/database';

const Alunos = () => {
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
  const [formError, setFormError] = useState('');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroMatricula, setFiltroMatricula] = useState('');
  const userId = auth.currentUser ? auth.currentUser.uid : null;

  const fetchData = async () => {
    setLoading(true);
    try {
      const alunosSnap = await get(ref(db, 'alunos'));
      const turmasSnap = await get(ref(db, 'turmas'));
      let alunosArr = [];
      let turmasObj = {};
      if (alunosSnap.exists()) {
        const alunosData = alunosSnap.val();
        alunosArr = Object.entries(alunosData).map(([id, aluno]) => ({ ...aluno, id }));
      }
      if (turmasSnap.exists()) {
        turmasObj = turmasSnap.val();
      }
      setAlunos(alunosArr);
      setTurmas(turmasObj);
    } catch (err) {
      setAlunos([]);
      setTurmas({});
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

  const handleEditAluno = aluno => {
    setEditAluno(aluno);
    setEditForm({ ...aluno });
    setIsNew(false);
    setEditOpen(true);
    setFormError('');
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
      nome: '', 
      matricula: novaMatricula, 
      turmaId: '', 
      dataNascimento: '', 
      nomePai: '', 
      nomeMae: '', 
      contatoEmergencia: { nome: '', telefone: '' }
    });
    setIsNew(true);
    setEditOpen(true);
    setFormError('');
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    if (name === "contatoEmergenciaNome") {
      setEditForm(prev => ({ 
        ...prev, 
        contatoEmergencia: { ...prev.contatoEmergencia, nome: value }
      }));
    } else if (name === "contatoEmergenciaTelefone") {
      setEditForm(prev => ({ 
        ...prev, 
        contatoEmergencia: { ...prev.contatoEmergencia, telefone: value }
      }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Validação dos campos obrigatórios
  const isFormValid = () => {
    return (
      editForm.nome?.trim() &&
      editForm.matricula?.trim() &&
      editForm.turmaId?.trim() &&
      editForm.dataNascimento?.trim() &&
      editForm.nomePai?.trim() &&
      editForm.nomeMae?.trim() &&
      editForm.contatoEmergencia?.nome?.trim() &&
      editForm.contatoEmergencia?.telefone?.trim()
    );
  };

  const handleSaveEdit = async () => {
    if (!isFormValid()) {
      setFormError("Preencha todos os campos obrigatórios!");
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (isNew) {
        const novoId = `id_aluno_${editForm.nome.replace(/\s/g, '').toLowerCase()}_${editForm.matricula}`;
        await set(ref(db, `alunos/${novoId}`), editForm);
      } else if (editAluno && editAluno.id) {
        await set(ref(db, `alunos/${editAluno.id}`), editForm);
      }
      setEditOpen(false);
      await fetchData();
    } catch (err) {
      setFormError("Erro ao salvar. Tente novamente.");
    }
    setSaving(false);
  };

  if (!roleChecked) {
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
        <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" color="primary" gutterBottom>Lista de Alunos</Typography>
            <Button variant="contained" color="primary" onClick={handleAddAluno}>Adicionar Aluno</Button>
          </Box>
          <Card>
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>  
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <FormControl sx={{ minWidth: 160 }}>
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
                    />
                    <TextField
                      label="Matrícula"
                      value={filtroMatricula}
                      onChange={e => setFiltroMatricula(e.target.value)}
                      placeholder="Digite a matrícula"
                      variant="outlined"
                      fullWidth
                      disabled={turmaSelecionada === ""}
                    />
                  </Box>
                  {turmaSelecionada === '' ? (
                    <Typography variant="body2" color="text.secondary" align="center">
                      Selecione uma turma para ver os alunos.
                    </Typography>
                  ) : alunosFiltrados.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center">
                      Nenhum aluno encontrado para esta turma.
                    </Typography>
                  ) : (
                    <List>
                      {alunosFiltrados.map((aluno, idx) => (
                        <ListItem key={idx} divider alignItems="flex-start" button onClick={() => handleEditAluno(aluno)}>
                          <ListItemText
                            primary={aluno.nome}
                            secondary={
                              <>  
                                <Typography variant="body2">Matrícula: {aluno.matricula || '--'}</Typography>
                                <Typography variant="body2">Turma: {getTurmaNome(aluno.turmaId)}</Typography>
                                {aluno.dataNascimento && (
                                  <Typography variant="body2">Nascimento: {aluno.dataNascimento}</Typography>
                                )}
                                {aluno.nomePai && (
                                  <Typography variant="body2">Pai: {aluno.nomePai}</Typography>
                                )}
                                {aluno.nomeMae && (
                                  <Typography variant="body2">Mãe: {aluno.nomeMae}</Typography>
                                )}
                                {aluno.contatoEmergencia && (
                                  <Typography variant="body2">
                                    Contato Emergência: {aluno.contatoEmergencia.nome} ({aluno.contatoEmergencia.telefone})
                                  </Typography>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>{isNew ? "Adicionar Aluno" : "Editar Aluno"}</DialogTitle>
                    <DialogContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {formError && <Alert severity="error">{formError}</Alert>}
                        <TextField 
                          label="Nome" 
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
                          label="Nome do Pai" 
                          name="nomePai" 
                          value={editForm.nomePai || ''} 
                          onChange={handleFormChange} 
                          fullWidth 
                          required 
                        />
                        <TextField 
                          label="Nome da Mãe" 
                          name="nomeMae" 
                          value={editForm.nomeMae || ''} 
                          onChange={handleFormChange} 
                          fullWidth 
                          required 
                        />
                        <FormControl fullWidth required>
                          <InputLabel id="turma-modal-select-label">Turma</InputLabel>
                          <Select
                            labelId="turma-modal-select-label"
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
                        <TextField 
                          label="Contato Emergência (Nome)" 
                          name="contatoEmergenciaNome" 
                          value={editForm.contatoEmergencia?.nome || ''} 
                          onChange={handleFormChange} 
                          fullWidth 
                          required 
                        />
                        <TextField 
                          label="Contato Emergência (Telefone)" 
                          name="contatoEmergenciaTelefone" 
                          value={editForm.contatoEmergencia?.telefone || ''} 
                          onChange={handleFormChange} 
                          fullWidth 
                          required 
                        />
                      </Box>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setEditOpen(false)} color="secondary">Cancelar</Button>
                      <Button onClick={handleSaveEdit} color="primary" disabled={saving || !isFormValid()}>Salvar</Button>
                    </DialogActions>
                  </Dialog>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </main>
    </div>
  );
};

export default Alunos;