"use client";
import SidebarMenu from '../../components/SidebarMenu';
import AdminClaimChecker from '../../components/AdminClaimChecker';
import DevClaimsAccordion from '../../components/DevClaimsAccordion';
import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, CircularProgress, Button, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, Chip } from '@mui/material';
import { useEffect, useState } from 'react';
import { db, ref, get, set, push, remove, auth, deleteUserFunction } from '../../firebase';
import UserApprovalDialog from '../../components/UserApprovalDialog';
import { useRouter } from 'next/navigation';

export default function Configuracoes() {
  // Função para recusar usuário (excluir do banco e do Auth)
  async function rejectUser(uid) {
    // Remove do banco
    const userRef = ref(db, `usuarios/${uid}`);
    await set(userRef, null);
    // Excluir do Auth (apenas se admin, normalmente via backend)
    try {
      // Se for possível usar admin SDK, aqui seria feito
      // No client, só é possível se o usuário estiver logado
      if (auth.currentUser && auth.currentUser.uid === uid) {
        await auth.currentUser.delete();
      }
    } catch (e) {
      // Se não conseguir, ignora
    }
    await fetchUsuarios();
  }

  // Torna a função acessível globalmente para o dialog
  if (typeof window !== 'undefined') {
    window.rejectUser = rejectUser;
  }
  // Estado para DEV
  const [devClickCount, setDevClickCount] = useState(0);
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const [devAccess, setDevAccess] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [alunosSelecionados, setAlunosSelecionados] = useState([]);
  // Função para atualizar lista de usuários e pendentes
  const fetchUsuarios = async () => {
    setLoading(true);
    setLoadingUsuarios(true);
    const usuariosRef = ref(db, 'usuarios');
    const snap = await get(usuariosRef);
    if (snap.exists()) {
      const all = snap.val();
      const listaPendentes = Object.entries(all)
        .filter(([_, u]) => !u.role)
        .map(([uid, u]) => ({ ...u, uid }));
      setPendentes(listaPendentes);
      // Todos os usuários
      const listaUsuarios = Object.entries(all)
        .map(([uid, u]) => ({ ...u, uid }));
      setUsuarios(listaUsuarios);
    } else {
      setPendentes([]);
      setUsuarios([]);
    }
    setLoading(false);
    setLoadingUsuarios(false);
  };

  // Função para buscar alunos
  const fetchAlunos = async () => {
    try {
      const alunosRef = ref(db, 'alunos');
      const snap = await get(alunosRef);
      if (snap.exists()) {
        const all = snap.val();
        const listaAlunos = Object.entries(all)
          .map(([id, aluno]) => ({ 
            id, 
            ...aluno,
            nome: aluno.nome || 'Nome não informado',
            matricula: aluno.matricula || 'S/N'
          }))
          .filter(aluno => aluno.status !== 'inativo'); // Filtrar apenas alunos ativos
        setAlunos(listaAlunos);
      } else {
        setAlunos([]);
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      setAlunos([]);
    }
  };

  // Atualiza role do usuário e vincula com aluno se aplicável
  const handleEditRole = async () => {
    if (!editUser) return;
    try {
      const userRef = ref(db, `usuarios/${editUser.uid}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const userData = snap.val();
        
        // Remover vinculações antigas se necessário
        const alunosAntigos = userData.alunosVinculados || (userData.alunoVinculado ? [userData.alunoVinculado] : []);
        const novosIds = editRole === 'pai' ? alunosSelecionados.map(a => a.id) : [];
        const alunosParaRemover = alunosAntigos.filter(id => !novosIds.includes(id));
        
        for (const alunoId of alunosParaRemover) {
          const alunoAntigoRef = ref(db, `alunos/${alunoId}`);
          const alunoAntigoSnap = await get(alunoAntigoRef);
          if (alunoAntigoSnap.exists()) {
            const alunoAntigoData = alunoAntigoSnap.val();
            const { responsavelUsuario, ...alunoSemResponsavel } = alunoAntigoData;
            await set(alunoAntigoRef, alunoSemResponsavel);
          }
        }
        
        // Atualizar dados do usuário
        const updatedUserData = {
          ...userData,
          role: editRole,
          turmas: editUser.turmas || [],
          alunosVinculados: (editRole === 'pai' && alunosSelecionados.length > 0) ? alunosSelecionados.map(a => a.id) : []
        };
        
        await set(userRef, updatedUserData);
        
        // Vincular novos alunos se o role é "pai"
        if (editRole === 'pai' && alunosSelecionados.length > 0) {
          for (const aluno of alunosSelecionados) {
            const alunoRef = ref(db, `alunos/${aluno.id}`);
            const alunoSnap = await get(alunoRef);
            if (alunoSnap.exists()) {
              const alunoData = alunoSnap.val();
              await set(alunoRef, {
                ...alunoData,
                responsavelUsuario: {
                  uid: editUser.uid,
                  nome: editUser.nome || editUser.email,
                  email: editUser.email
                }
              });
            }
          }
        }
        
        setEditDialogOpen(false);
        setEditUser(null);
        setAlunosSelecionados([]);
        await fetchUsuarios();
      }
    } catch (error) {
      console.error('Erro ao salvar vinculação:', error);
      alert('Erro ao salvar vinculação: ' + error.message);
    }
  };

  // Inativa usuário
  const handleInativar = async () => {
    if (!editUser) return;
    const userRef = ref(db, `usuarios/${editUser.uid}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      const userData = snap.val();
      
      // Se havia alunos vinculados, remover as vinculações
      const alunosVinculados = userData.alunosVinculados || (userData.alunoVinculado ? [userData.alunoVinculado] : []);
      for (const alunoId of alunosVinculados) {
        const alunoRef = ref(db, `alunos/${alunoId}`);
        const alunoSnap = await get(alunoRef);
        if (alunoSnap.exists()) {
          const alunoData = alunoSnap.val();
          const { responsavelUsuario, ...alunoSemResponsavel } = alunoData;
          await set(alunoRef, alunoSemResponsavel);
        }
      }
      
      await set(userRef, { ...userData, role: 'inativo', alunosVinculados: [] });
      setEditDialogOpen(false);
      setEditUser(null);
      setAlunosSelecionados([]);
      await fetchUsuarios();
    }
  };

  // Exclui usuário do banco e do Auth via Cloud Function
  const handleDeleteUser = async () => {
    if (!editUser) return;
    try {
      // Se havia alunos vinculados, remover as vinculações primeiro
      const alunosVinculados = editUser.alunosVinculados || (editUser.alunoVinculado ? [editUser.alunoVinculado] : []);
      for (const alunoId of alunosVinculados) {
        const alunoRef = ref(db, `alunos/${alunoId}`);
        const alunoSnap = await get(alunoRef);
        if (alunoSnap.exists()) {
          const alunoData = alunoSnap.val();
          const { responsavelUsuario, ...alunoSemResponsavel } = alunoData;
          await set(alunoRef, alunoSemResponsavel);
        }
      }
      
      // Força refresh do token para garantir claims atualizados
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdTokenResult(true);
        console.log('Token claims antes da exclusão:', token.claims);
      }
      await deleteUserFunction({ uid: editUser.uid });
      setConfirmDeleteOpen(false);
      setEditDialogOpen(false);
      setEditUser(null);
      setAlunosSelecionados([]);
      await fetchUsuarios();
    } catch (e) {
      // Mostra detalhes completos do erro
      console.error(e);
      alert('Erro ao excluir usuário: ' + (e.details || e.message || JSON.stringify(e)));
    }
  };
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [roleFiltro, setRoleFiltro] = useState('todos');
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [filtroNomeUsuario, setFiltroNomeUsuario] = useState('');
  const [turmas, setTurmas] = useState([]);
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);
  const [roleChecked, setRoleChecked] = useState(false);
  // Busca o userId diretamente do usuário autenticado
  const userId = auth.currentUser ? auth.currentUser.uid : null;

  useEffect(() => {
    fetchUsuarios();
    fetchAlunos();
    // Buscar turmas do banco
    const fetchTurmas = async () => {
      const turmasRef = ref(db, 'turmas');
      const snap = await get(turmasRef);
      if (snap.exists()) {
        const all = snap.val();
        // Se turmas for objeto, transforma em array de nomes
        const listaTurmas = Object.values(all).map(t => t.nome || t);
        setTurmas(listaTurmas);
      } else {
        setTurmas([]);
      }
    };
    fetchTurmas();
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
          Esta página é restrita para coordenadoras. Entre em contato com a administração caso precise de acesso.
        </Typography>
      </Box>
    );
  }

  const handleApprove = async (uid, role) => {
    const userRef = ref(db, `usuarios/${uid}`);
    // Busca os dados atuais do usuário
    const snap = await get(userRef);
    if (snap.exists()) {
      const userData = snap.val();
      await set(userRef, { ...userData, role });
    }
    setDialogOpen(false);
  };

  // Função para contar cliques no Card do título
  const handleDevCardClick = () => {
    setDevClickCount(prev => {
      if (prev + 1 >= 5) {
        setDevModalOpen(true);
        return 0;
      }
      return prev + 1;
    });
  };

  // Função para validar senha DEV e UID
  const handleDevPasswordSubmit = () => {
    if (devPassword === '984984') {
      if (userId === 'qD6UucWtcgPC9GHA41OB8rSaghZ2') {
        setDevAccess(true);
        setDevModalOpen(false);
        setDevPassword('');
      } else {
        alert('Usuário logado não tem permissão para acessar configurações de DEV.');
        setDevModalOpen(false);
        setDevPassword('');
      }
    } else {
      alert('Senha incorreta!');
      setDevPassword('');
    }
  };

  // Função para backup do banco
  const handleBackupBanco = async () => {
    try {
      const rootRef = ref(db, '/');
      const snap = await get(rootRef);
      if (snap.exists()) {
        const data = snap.val();
        const json = JSON.stringify(data, null, 2);
        // Cria arquivo para download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_banco_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Banco de dados vazio ou inacessível.');
      }
    } catch (err) {
      alert('Erro ao gerar backup: ' + err.message);
    }
  };

  // ...existing code...
  return (
    <div className="dashboard-container">
      <SidebarMenu />
      <main className="dashboard-main">
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 6 }}>
          <Card sx={{ mb: 3 }} onClick={handleDevCardClick} style={{ cursor: 'pointer' }}>
            <CardContent>
              <Typography variant="h4" color="primary" gutterBottom align="center">
                Configurações
              </Typography>
            </CardContent>
          </Card>
          {/* Modal DEV */}
          <Dialog open={devModalOpen} onClose={() => setDevModalOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Acesso Desenvolvedor</DialogTitle>
            <DialogContent>
              <TextField
                label="Senha de desenvolvedor"
                type="password"
                value={devPassword}
                onChange={e => setDevPassword(e.target.value)}
                fullWidth
                autoFocus
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDevModalOpen(false)} color="secondary">Cancelar</Button>
              <Button onClick={handleDevPasswordSubmit} color="primary" disabled={!devPassword}>Entrar</Button>
            </DialogActions>
          </Dialog>
          {/* Conteúdo DEV */}
          {devAccess && (
            <Card sx={{ mb: 3, bgcolor: '#222', color: '#fff' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                  Área de Desenvolvedor
                </Typography>
                <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                  Funções exclusivas para DEV podem ser implementadas aqui.
                </Typography>
                <Button variant="contained" color="info" onClick={handleBackupBanco} sx={{ display: 'block', mx: 'auto', mt: 2 }}>
                  Fazer backup do banco (JSON)
                </Button>
                {/* Menu recolhido para claims do usuário logado */}
                <Box sx={{ mt: 3 }}>
                  <DevClaimsAccordion />
                </Box>
              </CardContent>
            </Card>
          )}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom align="center">
                Usuários pendentes de aprovação
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : pendentes.length === 0 ? (
                <Typography align="center" color="text.secondary">Nenhum usuário pendente.</Typography>
              ) : (
                <List>
                  {pendentes.map(user => (
                    <ListItem key={user.uid} divider button onClick={() => { setSelectedUser(user); setDialogOpen(true); }}>
                      <ListItemText primary={user.nome || user.email} secondary={user.email} />
                      <Button variant="outlined" color="primary" onClick={() => { setSelectedUser(user); setDialogOpen(true); }}>Validar acesso</Button>
                    </ListItem>
                  ))}
                </List>
              )}
              <UserApprovalDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                user={selectedUser || {}}
                onApprove={handleApprove}
              />
            </CardContent>
          </Card>
          {/* Card de usuários do sistema */}
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom align="center">
                Usuários do sistema
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="role-filtro-label">Filtrar por tipo</InputLabel>
                <Select
                  labelId="role-filtro-label"
                  value={roleFiltro}
                  label="Filtrar por tipo"
                  onChange={e => setRoleFiltro(e.target.value)}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="coordenadora">Coordenadora</MenuItem>
                  <MenuItem value="professora">Professora</MenuItem>
                  <MenuItem value="pai">Pai</MenuItem>
                  <MenuItem value="inativo">Inativo</MenuItem>
                </Select>
              </FormControl>
              <TextField
                 label="Filtrar por nome"
                 value={filtroNomeUsuario}
                 onChange={e => setFiltroNomeUsuario(e.target.value)}
                 placeholder="Digite o nome do usuário"
                 variant="outlined"
                 size="small"
                 fullWidth
                 sx={{ mb: 2 }}
               />
              {loadingUsuarios ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : usuarios.length === 0 ? (
                <Typography align="center" color="text.secondary">Nenhum usuário cadastrado.</Typography>
              ) : (
                <List>
                  {usuarios
                    .filter(u => roleFiltro === 'todos' ? true : u.role === roleFiltro)
                    .filter(u =>
                      !filtroNomeUsuario ||
                      (u.nome && u.nome.toLowerCase().includes(filtroNomeUsuario.toLowerCase())) ||
                      (u.email && u.email.toLowerCase().includes(filtroNomeUsuario.toLowerCase()))
                    )
                    .map(user => (
                      <ListItem key={user.uid} divider button onClick={() => {
                        setEditUser(user);
                        setEditRole(user.role || '');
                        
                        // Carregar alunos vinculados existentes se houver
                        const alunosVinculados = user.alunosVinculados || (user.alunoVinculado ? [user.alunoVinculado] : []);
                        if (alunosVinculados.length > 0) {
                          const alunosCarregados = alunosVinculados.map(id => 
                            alunos.find(aluno => aluno.id === id)
                          ).filter(Boolean); // Remove valores undefined
                          setAlunosSelecionados(alunosCarregados);
                        } else {
                          setAlunosSelecionados([]);
                        }
                        
                        setEditDialogOpen(true);
                      }}>
                        <ListItemText
                          primary={user.nome || user.email}
                          secondary={
                            user.email + 
                            (user.role ? ` • ${user.role}` : ' • (pendente)') +
                            (user.role === 'pai' ? (() => {
                              const alunosVinculados = user.alunosVinculados || (user.alunoVinculado ? [user.alunoVinculado] : []);
                              if (alunosVinculados.length > 0) {
                                const nomesAlunos = alunosVinculados.map(id => 
                                  alunos.find(a => a.id === id)?.nome || 'Nome não encontrado'
                                );
                                return ` • Filhos: ${nomesAlunos.join(', ')} (${alunosVinculados.length})`;
                              }
                              return '';
                            })() : '')
                          }
                        />
                      </ListItem>
                    ))}
          {/* Modal de edição de usuário */}
          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogContent>
              <Typography variant="subtitle1" gutterBottom>{editUser?.nome || editUser?.email}</Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="edit-role-label">Tipo de acesso</InputLabel>
                <Select
                  labelId="edit-role-label"
                  value={editRole}
                  label="Tipo de acesso"
                  onChange={e => {
                    setEditRole(e.target.value);
                    // Se mudou de "pai" para outra role, limpar seleção de alunos
                    if (editRole === 'pai' && e.target.value !== 'pai') {
                      setAlunosSelecionados([]);
                    }
                  }}
                >
                  <MenuItem value="coordenadora">Coordenadora</MenuItem>
                  <MenuItem value="professora">Professora</MenuItem>
                  <MenuItem value="pai">Pai</MenuItem>
                  <MenuItem value="inativo">Inativo</MenuItem>
                </Select>
              </FormControl>
              {/* Seleção de turmas */}
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="edit-turmas-label">Turmas</InputLabel>
                <Select
                  labelId="edit-turmas-label"
                  multiple
                  value={editUser?.turmas || []}
                  onChange={e => {
                    const turmasSelecionadas = e.target.value;
                    setEditUser({ ...editUser, turmas: turmasSelecionadas });
                  }}
                  renderValue={selected => selected.join(', ')}
                >
                  {turmas.map((turma, idx) => (
                    <MenuItem key={idx} value={turma}>{turma}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Seleção de alunos (apenas para role "pai") */}
              {editRole === 'pai' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Vincular aos Alunos
                  </Typography>
                  <Autocomplete
                    multiple
                    options={alunos}
                    getOptionLabel={(option) => `${option.nome} - Matrícula: ${option.matricula}`}
                    value={alunosSelecionados}
                    onChange={(event, newValue) => {
                      setAlunosSelecionados(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Selecionar Alunos"
                        placeholder="Digite o nome dos alunos para buscar..."
                        variant="outlined"
                        size="medium"
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {option.nome}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Matrícula: {option.matricula}
                            {option.nomePai && ` • Pai: ${option.nomePai}`}
                            {option.nomeMae && ` • Mãe: ${option.nomeMae}`}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => (
                        <Chip
                          key={option.id}
                          label={`${option.nome} (${option.matricula})`}
                          {...getTagProps({ index })}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))
                    }
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(option =>
                        option.nome.toLowerCase().includes(inputValue.toLowerCase()) ||
                        option.matricula.toLowerCase().includes(inputValue.toLowerCase()) ||
                        (option.nomePai && option.nomePai.toLowerCase().includes(inputValue.toLowerCase())) ||
                        (option.nomeMae && option.nomeMae.toLowerCase().includes(inputValue.toLowerCase()))
                      );
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    noOptionsText="Nenhum aluno encontrado"
                    sx={{ mt: 1 }}
                  />
                  {alunosSelecionados.length > 0 && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Alunos Selecionados ({alunosSelecionados.length}):
                      </Typography>
                      {alunosSelecionados.map((aluno, index) => (
                        <Box key={aluno.id} sx={{ mb: index < alunosSelecionados.length - 1 ? 1.5 : 0 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {index + 1}. {aluno.nome}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                            Matrícula: {aluno.matricula}
                          </Typography>
                          {aluno.nomePai && (
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                              Pai: {aluno.nomePai}
                            </Typography>
                          )}
                          {aluno.nomeMae && (
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                              Mãe: {aluno.nomeMae}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setEditDialogOpen(false);
                setAlunosSelecionados([]);
              }} color="secondary">Cancelar</Button>
              <Button onClick={handleEditRole} color="primary" disabled={!editRole}>Salvar</Button>
              <Button onClick={handleInativar} color="warning">Inativar</Button>
              <Button onClick={() => setConfirmDeleteOpen(true)} color="error">Excluir</Button>
            </DialogActions>
          </Dialog>
          {/* Confirmação de exclusão */}
          <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Excluir usuário?</DialogTitle>
            <DialogContent>
              <Typography>Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDeleteOpen(false)} color="secondary">Cancelar</Button>
              <Button onClick={handleDeleteUser} color="error">Excluir</Button>
            </DialogActions>
          </Dialog>
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </main>
    </div>
  );
}
