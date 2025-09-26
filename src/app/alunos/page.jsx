
"use client";

import React, { useEffect, useState, useRef } from 'react';
import SidebarMenu from '../../components/SidebarMenu';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Box, CircularProgress, Select, MenuItem, InputLabel, FormControl, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { db, ref, get, auth } from '../../firebase';
import { storage } from '../../firebase-storage';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { deleteObject } from "firebase/storage";

import { set } from 'firebase/database';

const Alunos = () => {
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
  const [formError, setFormError] = useState('');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroMatricula, setFiltroMatricula] = useState('');
  const [formStep, setFormStep] = useState(1); // 1 = dados pessoais, 2 = dados financeiros
  const [financeiroError, setFinanceiroError] = useState('');
  const [inativarDialogOpen, setInativarDialogOpen] = useState(false);
  const [inativarMotivo, setInativarMotivo] = useState('');
  // Estado para anexos temporários
  const [anexosSelecionados, setAnexosSelecionados] = useState([]);
  const inputFileRef = useRef(null);

  // Remover anexo do Storage e do registro do aluno
  const handleRemoverAnexo = async (anexo, idx) => {
    if (!editForm.anexos || !editForm.anexos.length) return;
    try {
      // Remove do Storage
      const alunoId = isNew
        ? `id_aluno_${editForm.nome.replace(/\s/g, '').toLowerCase()}_${editForm.matricula}`
        : editAluno.id;
  const matricula = editForm.matricula || (editAluno && editAluno.matricula) || '';
  const fileRef = storageRef(storage, `anexos_alunos/${alunoId}_${matricula}/${anexo.name}`);
      await deleteObject(fileRef);
      // Remove do registro do aluno
      const novosAnexos = editForm.anexos.filter((_, i) => i !== idx);
      const dadosAtualizados = { ...editForm, anexos: novosAnexos };
      if (isNew) {
        const novoId = alunoId;
        await set(ref(db, `alunos/${novoId}`), dadosAtualizados);
      } else if (editAluno && editAluno.id) {
        await set(ref(db, `alunos/${editAluno.id}`), dadosAtualizados);
      }
      setEditForm(dadosAtualizados);
    } catch (err) {
      setFormError('Erro ao remover anexo.');
    }
  };
  // Função para tentar inativar aluno
  const handleInativarAluno = async () => {
    // Só pode inativar se não estiver em turma e status financeiro não for inadimplente
    let motivoTurma = '';
    let motivoFinanceiro = '';
    if (editForm.turmaId && editForm.turmaId !== '') {
      motivoTurma = `O aluno está vinculado à turma: "${getTurmaNome(editForm.turmaId)}".`;
    }
    if (editForm.financeiro?.status === 'inadimplente') {
      motivoFinanceiro = 'O status financeiro do aluno está como inadimplente.';
    }
    if (motivoTurma || motivoFinanceiro) {
      setInativarMotivo(`${motivoTurma}${motivoTurma && motivoFinanceiro ? '\n\n' : ''}${motivoFinanceiro}`);
      setInativarDialogOpen(true);
      return;
    }
    // Inativa o aluno
    try {
      setSaving(true);
      const novo = { ...editForm, status: 'inativo' };
      if (editAluno && editAluno.id) {
        await set(ref(db, `alunos/${editAluno.id}`), novo);
      }
      setEditOpen(false);
      await fetchData();
    } catch (err) {
      setFormError('Erro ao inativar aluno.');
    }
    setSaving(false);
  };
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
    // Garante estrutura financeira ao editar, mesmo que não exista ainda
    setEditForm({ 
      ...aluno,
      financeiro: {
        mensalidadeValor: aluno.financeiro?.mensalidadeValor || '',
        descontoPercentual: aluno.financeiro?.descontoPercentual || '',
        diaVencimento: aluno.financeiro?.diaVencimento || '',
        status: aluno.financeiro?.status || 'ativo',
        observacoes: aluno.financeiro?.observacoes || ''
      }
    });
    setIsNew(false);
    setEditOpen(true);
    setFormError('');
    setFormStep(1);
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
      contatoEmergencia: { nome: '', telefone: '' },
      financeiro: {
        mensalidadeValor: '',
        descontoPercentual: '',
        diaVencimento: '',
        status: 'ativo',
        observacoes: ''
      }
    });
  setIsNew(true);
  setEditOpen(true);
  setFormError('');
  setFormStep(1);
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    if (name === 'contatoEmergenciaNome') {
      setEditForm(prev => ({
        ...prev,
        contatoEmergencia: { ...prev.contatoEmergencia, nome: value }
      }));
    } else if (name === 'contatoEmergenciaTelefone') {
      setEditForm(prev => ({
        ...prev,
        contatoEmergencia: { ...prev.contatoEmergencia, telefone: value }
      }));
    } else if (name.startsWith('financeiro.')) {
      const key = name.split('.')[1];
      let val = value;
      if (key === 'diaVencimento') {
        // Mantém apenas dígitos
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
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };


  // Validação por passo
  const isStep1Valid = () => (
    editForm.nome?.trim() &&
    editForm.matricula?.trim() &&
    editForm.turmaId?.trim() &&
    editForm.dataNascimento?.trim() &&
    editForm.nomePai?.trim() &&
    editForm.nomeMae?.trim() &&
    editForm.contatoEmergencia?.nome?.trim() &&
    editForm.contatoEmergencia?.telefone?.trim()
  );

  const isStep2Valid = () => (
    // Campos financeiros básicos; pode expandir futuramente
    editForm.financeiro?.mensalidadeValor?.toString().trim() &&
    editForm.financeiro?.diaVencimento?.toString().trim() &&
    editForm.financeiro?.status?.trim() &&
    !financeiroError
  );

  const isFinalFormValid = () => isStep1Valid() && isStep2Valid();

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
            const fileRef = storageRef(storage, `anexos_alunos/${alunoId}_${matricula}/${anexo.name}`);
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
          const fileRef = storageRef(storage, `anexos_alunos/${alunoId}_${matricula}/${file.name}`);
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
        await set(ref(db, `alunos/${novoId}`), dadosParaSalvar);
      } else if (editAluno && editAluno.id) {
        await set(ref(db, `alunos/${editAluno.id}`), dadosParaSalvar);
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
            <Button variant="contained" color="primary" onClick={handleAddAluno}>Nova Matrícula</Button>
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
                                {aluno.financeiro?.status && (
                                  <Typography variant="body2">Status Financeiro: {aluno.financeiro.status}</Typography>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
                      <span>{isNew ? "Nova Matrícula" : "Editar Aluno"} {formStep === 2 && ' - Dados Financeiros'}</span>
                      <IconButton aria-label="fechar" onClick={() => setEditOpen(false)} size="small" sx={{ ml: 2 }}>
                        <span style={{ fontSize: 22, fontWeight: 'bold' }}>&times;</span>
                      </IconButton>
                    </DialogTitle>
                    <DialogContent>
                      {formError && <Box sx={{ mb: 2 }}><Alert severity="error">{formError}</Alert></Box>}
                      {formStep === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                      )}
                      {formStep === 2 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            label="Mensalidade (R$)"
                            name="financeiro.mensalidadeValor"
                            type="number"
                            value={editForm.financeiro?.mensalidadeValor}
                            onChange={handleFormChange}
                            fullWidth
                            required
                          />
                          <TextField
                            label="Desconto (%)"
                            name="financeiro.descontoPercentual"
                            type="number"
                            value={editForm.financeiro?.descontoPercentual}
                            onChange={handleFormChange}
                            fullWidth
                          />
                          <Box sx={{ fontSize: 14, color: 'text.secondary', mt: -1 }}>
                            Valor final: R$ {valorComDesconto.toFixed(2)}
                          </Box>
                          <TextField
                            label="Dia de Vencimento"
                            name="financeiro.diaVencimento"
                            type="number"
                            value={editForm.financeiro?.diaVencimento}
                            onChange={handleFormChange}
                            fullWidth
                            required
                            inputProps={{ min:1, max:31 }}
                            error={!!financeiroError}
                            helperText={financeiroError || 'Entre 1 e 31'}
                          />
                          <FormControl fullWidth required>
                            <InputLabel id="status-financeiro-label">Status</InputLabel>
                            <Select
                              labelId="status-financeiro-label"
                              name="financeiro.status"
                              value={editForm.financeiro?.status || 'ativo'}
                              label="Status"
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
                    <DialogActions>
                      {formStep === 2 && (
                        <IconButton onClick={() => setFormStep(1)} color="inherit" size="small" sx={{ mr: 1 }} aria-label="voltar">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </IconButton>
                      )}
                      {formStep === 1 && (
                        <Button onClick={() => { if (isStep1Valid()) { setFormError(''); setFormStep(2); } else { setFormError('Preencha os campos obrigatórios do passo 1.'); } }} color="primary" variant="contained">Avançar</Button>
                      )}
                      {formStep === 2 && !isNew && editForm.turmaId && editForm.turmaId !== '' && (
                        <Button
                          onClick={() => setEditForm(prev => ({ ...prev, turmaId: '' }))}
                          color="info"
                          variant="outlined"
                          size="small"
                          disabled={saving}
                          sx={{ fontSize: '0.80rem', textTransform: 'none', py: 0.5, px: 1.2 }}
                        >
                          Desvincular Turma
                        </Button>
                      )}
                      {formStep === 2 && !isNew && editForm.status === 'inativo' && (
                        <Button onClick={async () => {
                          try {
                            setSaving(true);
                            const novo = { ...editForm, status: 'ativo' };
                            if (editAluno && editAluno.id) {
                              await set(ref(db, `alunos/${editAluno.id}`), novo);
                            }
                            setEditOpen(false);
                            await fetchData();
                          } catch (err) {
                            setFormError('Erro ao ativar aluno.');
                          }
                          setSaving(false);
                        }} color="success" variant="outlined" disabled={saving}>Ativar</Button>
                      )}
                      {formStep === 2 && !isNew && editForm.status !== 'inativo' && (
                        <Button onClick={handleInativarAluno} color="warning" variant="outlined" disabled={saving}>Inativar</Button>
                      )}
                      {formStep === 2 && (
                        <Button onClick={handleSaveEdit} color="primary" variant="contained" disabled={saving || !isFinalFormValid()}>Salvar</Button>
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