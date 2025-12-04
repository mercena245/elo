"use client";
import SidebarMenu from '../../components/SidebarMenu';
import AdminClaimChecker from '../../components/AdminClaimChecker';
import DevClaimsAccordion from '../../components/DevClaimsAccordion';
import LogsViewer from '../components/LogsViewer';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  CircularProgress, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Autocomplete, 
  Chip,
  Tabs,
  Tab,
  Paper,
  Grid,
  Divider,
  IconButton,
  Badge
} from '@mui/material';
import { useEffect, useState } from 'react';
import { auth, deleteUserFunction } from '../../firebase';

import UserApprovalDialog from '../../components/UserApprovalDialog';
import TwoFactorManager from '../../components/TwoFactorManager';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
import { useSchoolServices } from '../../hooks/useSchoolServices';
import { isSuperAdmin as checkIsSuperAdmin } from '../../config/constants';
import {
  Settings as SettingsIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  ArrowBack,
  Notifications,
  CheckCircle
} from '@mui/icons-material';

export default function Configuracoes() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  // Services multi-tenant
  const { auditService, financeiroService, LOG_ACTIONS, isReady: servicesReady } = useSchoolServices();

  const { user } = useAuth();
  const isUserSuperAdmin = checkIsSuperAdmin(user?.uid);
  // Função para recusar usuário (excluir do banco e do Auth)
  async function rejectUser(uid) {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    // Buscar dados do usuário para o log antes de excluir
    const userData = await getData(`usuarios/${uid}`) || {};
    
    // Remove do banco
    await removeData(`usuarios/${uid}`);
    
    // Log da rejeição do usuário
    await auditService?.logAction({
      action: LOG_ACTIONS.USER_DELETE,
      entity: 'user',
      entityId: uid,
      details: `Usuário rejeitado: ${userData.nome || userData.email || 'Usuário desconhecido'}`,
      changes: {
        email: userData.email,
        nome: userData.nome,
        motivo: 'Acesso negado durante aprovação'
      }
    });
    
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
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [alunosSelecionados, setAlunosSelecionados] = useState([]);
  
  // Estados para configurações da escola
  const [dadosEscola, setDadosEscola] = useState({
    nomeEscola: '',
    endereco: '',
    telefone: '',
    email: '',
    cnpj: '',
    diretor: ''
  });
  const [loadingEscola, setLoadingEscola] = useState(true);
  const [salvandoEscola, setSalvandoEscola] = useState(false);

  // Função para atualizar lista de usuários e pendentes
  const fetchUsuarios = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    setLoading(true);
    setLoadingUsuarios(true);
    const all = await getData('usuarios');
    if (all) {
      const listaPendentes = Object.entries(all)
        .filter(([uid, u]) => {
          // Não mostrar usuários sem role que sejam:
          // 1. O próprio usuário logado
          // 2. Usuários sem nome E sem email válido
          // 3. Super admin
          if (!u.role) {
            if (uid === user?.uid) return false; // Não mostrar o próprio usuário
            if (uid === superAdminId) return false; // Não mostrar super admin
            if (!u.nome && !u.email) return false; // Não mostrar sem dados
            return true;
          }
          return false;
        })
        .map(([uid, u]) => ({ ...u, uid }));
      setPendentes(listaPendentes);
      
      // Todos os usuários (exceto super admin na lista geral se não for super admin visualizando)
      const listaUsuarios = Object.entries(all)
        .filter(([uid, u]) => {
          // Filtrar usuários inválidos
          if (!u.nome && !u.email) return false;
          // Se não for super admin, não mostrar outros super admins na lista
          if (!isUserSuperAdmin && checkIsSuperAdmin(uid)) return false;
          return true;
        })
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
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    try {
      const all = await getData('alunos');
      if (all) {
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

  // Função para buscar dados da escola
  const fetchDadosEscola = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    setLoadingEscola(true);
    try {
      const configEscola = await getData('configuracoes/escola');
      console.log('📋 [Configuracoes] Dados da escola:', configEscola);
      
      if (configEscola) {
        setDadosEscola({
          nomeEscola: configEscola.nomeEscola || '',
          endereco: configEscola.endereco || '',
          telefone: configEscola.telefone || '',
          email: configEscola.email || '',
          cnpj: configEscola.cnpj || '',
          diretor: configEscola.diretor || ''
        });
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados da escola:', error);
    } finally {
      setLoadingEscola(false);
    }
  };

  // Função para salvar dados da escola
  const handleSalvarDadosEscola = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    setSalvandoEscola(true);
    try {
      await setData('configuracoes/escola', dadosEscola);
      
      // Log da atualização
      const currentUserData = {
        id: user?.uid,
        uid: user?.uid,
        email: user?.email,
        nome: user?.displayName || user?.email,
        role: user?.role
      };
      
      await auditService?.logAction({
        action: 'school_update',
        entity: 'school',
        entityId: 'configuracoes',
        details: 'Dados da escola atualizados',
        changes: {
          nomeEscola: dadosEscola.nomeEscola,
          endereco: dadosEscola.endereco,
          telefone: dadosEscola.telefone
        },
        userData: currentUserData
      });
      
      alert('✅ Dados da escola salvos com sucesso!');
      console.log('✅ Dados da escola salvos:', dadosEscola);
    } catch (error) {
      console.error('❌ Erro ao salvar dados da escola:', error);
      alert('❌ Erro ao salvar dados da escola');
    } finally {
      setSalvandoEscola(false);
    }
  };

  // Atualiza role do usuário e vincula com aluno se aplicável
  const handleEditRole = async () => {
    if (!editUser) return;
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    try {
      const userData = await getData(`usuarios/${editUser.uid}`);
      if (userData) {
        const dadosAnteriores = { ...userData };
        
        // Remover vinculações antigas se necessário
        const alunosAntigos = userData.alunosVinculados || (userData.alunoVinculado ? [userData.alunoVinculado] : []);
        const novosIds = editRole === 'pai' ? alunosSelecionados.map(a => a.id) : [];
        const alunosParaRemover = alunosAntigos.filter(id => !novosIds.includes(id));
        
        for (const alunoId of alunosParaRemover) {
          const alunoAntigoData = await getData(`alunos/${alunoId}`);
          if (alunoAntigoData) {
            const { responsavelUsuario, ...alunoSemResponsavel } = alunoAntigoData;
            await setData(`alunos/${alunoId}`, alunoSemResponsavel);
          }
        }
        
        // Atualizar dados do usuário
        const updatedUserData = {
          ...userData,
          role: editRole,
          turmas: editUser.turmas || [],
          alunosVinculados: (editRole === 'pai' && alunosSelecionados.length > 0) ? alunosSelecionados.map(a => a.id) : [],
          isSuporte: editUser.isSuporte || false
        };
        
        await setData(`usuarios/${editUser.uid}`, updatedUserData);
        
        // Identificar mudanças para o log
        const mudancas = {};
        if (dadosAnteriores.role !== editRole) {
          mudancas.role = { de: dadosAnteriores.role || 'pendente', para: editRole };
        }
        
        // Verificar mudanças em turmas
        const turmasAntigas = dadosAnteriores.turmas || [];
        const turmasNovas = editUser.turmas || [];
        if (JSON.stringify(turmasAntigas.sort()) !== JSON.stringify(turmasNovas.sort())) {
          mudancas.turmas = { de: turmasAntigas, para: turmasNovas };
        }
        
        // Verificar mudanças em alunos vinculados
        if (JSON.stringify(alunosAntigos.sort()) !== JSON.stringify(novosIds.sort())) {
          const nomesAlunosAntigos = alunosAntigos.map(id => {
            const aluno = alunos.find(a => a.id === id);
            return aluno ? aluno.nome : 'Aluno não encontrado';
          });
          const nomesAlunosNovos = alunosSelecionados.map(a => a.nome);
          mudancas.alunosVinculados = { de: nomesAlunosAntigos, para: nomesAlunosNovos };
        }
        
        // Obter dados do usuário logado para o log
        const currentUserData = {
          id: user?.uid,
          uid: user?.uid,
          email: user?.email,
          nome: user?.displayName || user?.email,
          role: user?.role
        };
        
        // Log da atualização do usuário
        await auditService?.logAction({
          action: LOG_ACTIONS.USER_UPDATE,
          entity: 'user',
          entityId: editUser.uid,
          details: `Dados atualizados para usuário: ${editUser.nome || editUser.email}`,
          changes: mudancas,
          userData: currentUserData // ← Passar userData explicitamente
        });
        
        // Vincular novos alunos se o role é "pai"
        if (editRole === 'pai' && alunosSelecionados.length > 0) {
          for (const aluno of alunosSelecionados) {
            const alunoData = await getData(`alunos/${aluno.id}`);
            if (alunoData) {
              await setData(`alunos/${aluno.id}`, {
                ...alunoData,
                responsavelUsuario: {
                  uid: editUser.uid,
                  nome: editUser.nome || editUser.email,
                  email: editUser.email
                }
              });
            }
          }
          
          // Log específico da vinculação de alunos
          if (alunosSelecionados.length > 0) {
            await auditService?.logAction({
              action: LOG_ACTIONS.USER_UPDATE,
              entity: 'user',
              entityId: editUser.uid,
              details: `${alunosSelecionados.length} aluno(s) vinculado(s) ao responsável ${editUser.nome || editUser.email}`,
              changes: {
                alunosVinculados: alunosSelecionados.map(a => `${a.nome} (${a.matricula})`)
              },
              userData: currentUserData // ← Passar userData explicitamente
            });
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
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }

    // Criar userData do usuário atual (quem está inativando)
    const currentUserData = {
      id: user?.uid,
      uid: user?.uid,
      email: user?.email,
      nome: user?.displayName || user?.email,
      role: user?.role
    };
    
    const userData = await getData(`usuarios/${editUser.uid}`);
    if (userData) {
      // Se havia alunos vinculados, remover as vinculações
      const alunosVinculados = userData.alunosVinculados || (userData.alunoVinculado ? [userData.alunoVinculado] : []);
      const nomesAlunosVinculados = alunosVinculados.map(id => {
        const aluno = alunos.find(a => a.id === id);
        return aluno ? aluno.nome : 'Aluno não encontrado';
      });
      
      for (const alunoId of alunosVinculados) {
        const alunoData = await getData(`alunos/${alunoId}`);
        if (alunoData) {
          const { responsavelUsuario, ...alunoSemResponsavel } = alunoData;
          await setData(`alunos/${alunoId}`, alunoSemResponsavel);
        }
      }
      
      await setData(`usuarios/${editUser.uid}`, { ...userData, role: 'inativo', alunosVinculados: [] });
      
      // Log da inativação do usuário
      await auditService?.logAction({
        action: LOG_ACTIONS.USER_UPDATE,
        entity: 'user',
        entityId: editUser.uid,
        details: `Usuário inativado: ${editUser.nome || editUser.email}`,
        changes: {
          statusAnterior: userData.role,
          statusNovo: 'inativo',
          alunosDesvinculados: nomesAlunosVinculados
        },
        userData: currentUserData // ← Passar userData explicitamente
      });
      
      setEditDialogOpen(false);
      setEditUser(null);
      setAlunosSelecionados([]);
      await fetchUsuarios();
    }
  };

  // Exclui usuário do banco e do Auth via Cloud Function
  const handleDeleteUser = async () => {
    if (!editUser) return;
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    try {
      // Se havia alunos vinculados, remover as vinculações primeiro
      const alunosVinculados = editUser.alunosVinculados || (editUser.alunoVinculado ? [editUser.alunoVinculado] : []);
      const nomesAlunosVinculados = alunosVinculados.map(id => {
        const aluno = alunos.find(a => a.id === id);
        return aluno ? aluno.nome : 'Aluno não encontrado';
      });
      
      for (const alunoId of alunosVinculados) {
        const alunoData = await getData(`alunos/${alunoId}`);
        if (alunoData) {
          const { responsavelUsuario, ...alunoSemResponsavel } = alunoData;
          await setData(`alunos/${alunoId}`, alunoSemResponsavel);
        }
      }
      
      // Log da exclusão do usuário ANTES de excluir
      await auditService?.logAction({
        action: LOG_ACTIONS.USER_DELETE,
        entity: 'user',
        entityId: editUser.uid,
        details: `Usuário excluído permanentemente: ${editUser.nome || editUser.email}`,
        changes: {
          email: editUser.email,
          nome: editUser.nome,
          role: editUser.role,
          alunosDesvinculados: nomesAlunosVinculados,
          motivo: 'Exclusão manual pelo administrador'
        }
      });
      
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
  const [userRole, setUserRole] = useState(null);
  const [roleChecked, setRoleChecked] = useState(false);
  // Busca o userId diretamente do usuário autenticado
  const userId = auth.currentUser ? auth.currentUser.uid : null;

  // useEffect para detectar parâmetro 'aba' na URL e mudar para aba correspondente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const abaParam = urlParams.get('aba');
      if (abaParam !== null) {
        const abaNumero = parseInt(abaParam, 10);
        if (!isNaN(abaNumero) && abaNumero >= 0 && abaNumero <= 4) {
          setTabValue(abaNumero);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
    fetchAlunos();
    // Buscar turmas do banco
    const fetchTurmas = async () => {
      if (!isReady) {
        console.log('⏳ Aguardando conexão com banco da escola...');
        return;
      }
      
      const all = await getData('turmas');
      if (all) {
        // Transformar em array de objetos com ID e nome para usar no Select
        const listaTurmas = Object.entries(all).map(([id, turma]) => ({
          id,
          nome: turma.nome || turma
        }));
        setTurmas(listaTurmas);
      } else {
        setTurmas([]);
      }
    };
    fetchTurmas();
  }, [isReady, getData]);

  useEffect(() => {
    async function fetchRole() {
      if (!userId) {
        setUserRole(null);
        setRoleChecked(true);
        return;
      }
      if (!isReady) {
        console.log('⏳ Aguardando conexão com banco da escola...');
        return;
      }
      
      const userData = await getData(`usuarios/${userId}`);
      if (userData) {
        setUserRole((userData.role || '').trim().toLowerCase());
      } else {
        setUserRole(null);
      }
      setRoleChecked(true);
    }
    fetchRole();
  }, [userId, isReady, getData]);

  // useEffect para carregar dados da escola
  useEffect(() => {
    if (isReady) {
      fetchDadosEscola();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

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
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }
    
    console.log('✅ [handleApprove] Aprovando usuário:', { uid, role });
    
    // Busca os dados atuais do usuário
    const userData = await getData(`usuarios/${uid}`);
    if (userData) {
      // Atualiza com role E marca como ativo
      await setData(`usuarios/${uid}`, { 
        ...userData, 
        role,
        ativo: true,  // ← CORREÇÃO: Marca como ativo
        aprovadoEm: new Date().toISOString(),
        aprovadoPor: user?.uid
      });
      
      console.log('✅ [handleApprove] Usuário salvo como ativo no banco da escola');
      
      // Log da aprovação do usuário
      await auditService?.logAction({
        action: LOG_ACTIONS.USER_CREATE,
        entity: 'user',
        entityId: uid,
        details: `Usuário aprovado: ${userData.nome || userData.email} como ${role}`,
        changes: {
          email: userData.email,
          nome: userData.nome,
          roleAtribuido: role,
          statusAnterior: 'pendente',
          statusNovo: 'ativo',
          ativo: true
        }
      });
    }
    setDialogOpen(false);
    
    // Recarregar lista
    await carregarDadosUsuarios();
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
    if (!isReady) {
      alert('⏳ Aguardando conexão com banco da escola...');
      return;
    }

    try {
      console.log('📦 [Backup] Iniciando backup do banco...');
      console.log('📦 [Backup] Escola:', currentSchool?.nome);

      // Buscar todos os dados do banco da escola atual
      const data = await getData('/');
      
      if (data) {
        console.log('📦 [Backup] Dados carregados, gerando JSON...');
        const json = JSON.stringify(data, null, 2);
        
        // Criar arquivo para download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Nome do arquivo com escola e data
        const escolaNome = (currentSchool?.nome || 'escola').replace(/[^a-z0-9]/gi, '_');
        const dataHora = new Date().toISOString().slice(0,19).replace(/[:T]/g,'_');
        a.download = `backup_${escolaNome}_${dataHora}.json`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ [Backup] Backup criado com sucesso!');
        alert('✅ Backup do banco criado com sucesso!');
      } else {
        console.log('⚠️ [Backup] Banco de dados vazio ou inacessível');
        alert('⚠️ Banco de dados vazio ou inacessível.');
      }
    } catch (err) {
      console.error('❌ [Backup] Erro ao gerar backup:', err);
      alert('❌ Erro ao gerar backup: ' + err.message);
    }
  };

  // ...existing code...
  return (
    <div className="dashboard-container">
      <SidebarMenu />
      <main className="dashboard-main">
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, px: 2 }}>
          {/* Header com gradiente */}
          <Paper 
            sx={{ 
              mb: 3,
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.25)',
              position: 'relative'
            }}
          >
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                onClick={() => window.history.back()}
                sx={{ 
                  color: 'white',
                  '&:hover': { background: 'rgba(255,255,255,0.1)' }
                }}
              >
                <ArrowBack />
              </IconButton>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
                  ⚙️ Configurações do Sistema
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Gerencie usuários, dados da escola e configurações avançadas
                </Typography>
              </Box>
              <IconButton 
                onClick={handleDevCardClick}
                sx={{ 
                  color: 'white',
                  '&:hover': { background: 'rgba(255,255,255,0.1)' }
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Box>
          </Paper>

          {/* Tabs */}
          <Paper 
            sx={{ 
              mb: 3,
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(102, 126, 234, 0.1)'
            }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="Abas de Configurações"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                borderBottom: '2px solid rgba(102, 126, 234, 0.2)',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem' },
                  fontWeight: 600,
                  py: { xs: 2, md: 2.5 },
                  px: { xs: 2, md: 3 },
                  minHeight: { xs: 64, md: 72 },
                  color: '#666',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(102, 126, 234, 0.08)',
                    color: '#667eea'
                  },
                  '&.Mui-selected': {
                    color: '#667eea',
                    fontWeight: 700,
                    background: 'rgba(102, 126, 234, 0.1)'
                  }
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                },
                '& .MuiTabs-scrollButtons': {
                  color: '#667eea',
                  '&.Mui-disabled': {
                    opacity: 0.3
                  }
                }
              }}
            >
              <Tab icon={<BusinessIcon />} iconPosition="start" label="Dados da Escola" />
              <Tab 
                icon={
                  <Badge badgeContent={pendentes.length} color="error" max={99}>
                    <Notifications />
                  </Badge>
                } 
                iconPosition="start" 
                label="Aprovações Pendentes" 
              />
              <Tab icon={<PeopleIcon />} iconPosition="start" label="Usuários do Sistema" />
              <Tab icon={<SecurityIcon />} iconPosition="start" label="Segurança" />
              {devAccess && <Tab icon={<StorageIcon />} iconPosition="start" label="DEV" />}
            </Tabs>
          </Paper>

          {/* Conteúdo das Abas */}
          <Box sx={{ mt: 3 }}>
            
            {/* ABA 0: Dados da Escola */}
            {tabValue === 0 && (
              <Card 
                sx={{ 
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(102, 126, 234, 0.1)'
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon /> Configurações da Escola para Relatórios
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Estas informações serão exibidas nas fichas de matrícula e outros documentos impressos
                  </Typography>
                  
                  {loadingEscola ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Nome da Escola"
                        value={dadosEscola.nomeEscola}
                        onChange={(e) => setDadosEscola({ ...dadosEscola, nomeEscola: e.target.value })}
                        fullWidth
                        required
                        helperText="Nome completo da escola (aparece no cabeçalho dos relatórios)"
                      />
                      
                      <TextField
                        label="Endereço Completo"
                        value={dadosEscola.endereco}
                        onChange={(e) => setDadosEscola({ ...dadosEscola, endereco: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        helperText="Endereço completo da escola"
                      />
                      
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="Telefone"
                          value={dadosEscola.telefone}
                          onChange={(e) => setDadosEscola({ ...dadosEscola, telefone: e.target.value })}
                          fullWidth
                          placeholder="(00) 00000-0000"
                        />
                        
                        <TextField
                          label="E-mail"
                          value={dadosEscola.email}
                          onChange={(e) => setDadosEscola({ ...dadosEscola, email: e.target.value })}
                          fullWidth
                          type="email"
                          placeholder="contato@escola.com.br"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="CNPJ"
                          value={dadosEscola.cnpj}
                          onChange={(e) => setDadosEscola({ ...dadosEscola, cnpj: e.target.value })}
                          fullWidth
                          placeholder="00.000.000/0000-00"
                        />
                        
                        <TextField
                          label="Diretor(a)"
                          value={dadosEscola.diretor}
                          onChange={(e) => setDadosEscola({ ...dadosEscola, diretor: e.target.value })}
                          fullWidth
                          placeholder="Nome do(a) diretor(a)"
                        />
                      </Box>
                      
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSalvarDadosEscola}
                        disabled={salvandoEscola || !dadosEscola.nomeEscola}
                        sx={{ mt: 2 }}
                      >
                        {salvandoEscola ? 'Salvando...' : '💾 Salvar Configurações'}
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ABA 1: Aprovações Pendentes */}
            {tabValue === 1 && (
              <Card 
                sx={{ 
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(102, 126, 234, 0.1)'
                }}
              >
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Notifications /> Usuários pendentes de aprovação
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Revise e aprove novos usuários que solicitaram acesso ao sistema
                  </Typography>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : pendentes.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <CheckCircle sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Nenhum usuário pendente
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Todas as solicitações de acesso foram processadas
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {pendentes.map(user => (
                        <ListItem key={user.uid} divider disablePadding>
                          <ListItemButton onClick={() => { setSelectedUser(user); setDialogOpen(true); }}>
                            <ListItemText 
                              primary={user.nome || user.email || 'Usuário sem identificação'} 
                              secondary={user.email || 'Email não informado'} 
                            />
                            <Button variant="outlined" color="primary" onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setDialogOpen(true); }}>Validar acesso</Button>
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ABA 2: Usuários do Sistema */}
            {tabValue === 2 && (
              <Card
                sx={{ 
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(102, 126, 234, 0.1)'
                }}
              >
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon /> Gerenciar Usuários do Sistema
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Edite permissões, vincule alunos e gerencie o acesso dos usuários
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
                            <ListItem key={user.uid} divider disablePadding>
                              <ListItemButton onClick={() => {
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
                                primary={user.nome || user.email || 'Usuário sem identificação'}
                                secondary={
                                  (user.email || 'Email não informado') + 
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
                              </ListItemButton>
                            </ListItem>
                          ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
            )}

            {/* ABA 3: Segurança */}
            {tabValue === 3 && isUserSuperAdmin && (
              <Card 
                sx={{ 
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(102, 126, 234, 0.1)'
                }}
              >
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon /> Configurações de Segurança 2FA
                  </Typography>
                  <TwoFactorManager user={user} />
                </CardContent>
              </Card>
            )}

            {/* ABA 4: DEV (só aparece se devAccess) */}
            {devAccess && tabValue === 4 && (
              <Card 
                sx={{ 
                  mb: 3,
                  bgcolor: '#222', 
                  color: '#fff',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom align="center">
                    🔧 Área de Desenvolvedor
                  </Typography>
                  <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                    Funções exclusivas para DEV podem ser implementadas aqui.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button 
                      variant="contained" 
                      color="info" 
                      onClick={handleBackupBanco}
                      sx={{ minWidth: '200px' }}
                    >
                      Fazer backup do banco (JSON)
                    </Button>
                    <Button 
                      variant="contained" 
                      color="secondary" 
                      onClick={() => setLogsDialogOpen(true)}
                      sx={{ minWidth: '200px' }}
                    >
                      📋 Visualizar Logs de Auditoria
                    </Button>
                  </Box>
                  {/* Menu recolhido para claims do usuário logado */}
                  <Box sx={{ mt: 3 }}>
                    <DevClaimsAccordion />
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>

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

          {/* Modal de aprovação de usuário */}
          <UserApprovalDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            user={selectedUser || {}}
            onApprove={handleApprove}
          />

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
                  renderValue={selected => {
                    // Mostrar nomes das turmas selecionadas
                    return selected.map(turmaId => {
                      const turma = turmas.find(t => t.id === turmaId);
                      return turma ? turma.nome : turmaId;
                    }).join(', ');
                  }}
                >
                  {turmas.map((turma) => (
                    <MenuItem key={turma.id} value={turma.id}>{turma.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Checkbox para atribuir função de suporte */}
              {isUserSuperAdmin && (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="checkbox"
                      checked={editUser?.isSuporte || false}
                      onChange={(e) => setEditUser({ ...editUser, isSuporte: e.target.checked })}
                      style={{ width: 20, height: 20, cursor: 'pointer' }}
                    />
                    <Typography variant="body1">
                      👤 Membro da equipe de suporte
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5, mt: 0.5 }}>
                    Usuários com esta permissão podem visualizar e responder todos os tickets de suporte
                  </Typography>
                </FormControl>
              )}
              
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

          {/* Dialog de Logs */}
          <LogsViewer 
            open={logsDialogOpen} 
            onClose={() => setLogsDialogOpen(false)} 
          />
        </Box>
      </main>
    </div>
  );
}
