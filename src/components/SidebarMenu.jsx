import React, { useState, useEffect } from 'react';
import { FaBars, FaHome, FaUserFriends, FaSchool, FaSignOutAlt, FaStore, FaUsers, FaCalendarAlt, FaCashRegister, FaEnvelope, FaPrint, FaImages, FaUserCircle, FaCog } from 'react-icons/fa';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Badge } from '@mui/material';

const SidebarMenu = () => {
  const [open, setOpen] = useState(false);
  const [hideIcon, setHideIcon] = useState(false);
  const [pendentes, setPendentes] = useState(0);
  const [userRole, setUserRole] = useState('');
  const router = useRouter();

  const userId = typeof window !== 'undefined' && localStorage.getItem('userId')
    ? localStorage.getItem('userId')
    : (auth.currentUser ? auth.currentUser.uid : 'anon');

  // Busca quantidade de usuários pendentes
  React.useEffect(() => {
    async function fetchPendentes() {
      try {
        const { db, ref, get } = require('../firebase');
        const usuariosRef = ref(db, 'usuarios');
        const snap = await get(usuariosRef);
        if (snap.exists()) {
          const all = snap.val();
          const lista = Object.values(all).filter(u => !u.role);
          setPendentes(lista.length);
        } else {
          setPendentes(0);
        }
      } catch (e) {
        setPendentes(0);
      }
    }
    fetchPendentes();
  }, [open]);

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

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleMenuClick = () => {
    setHideIcon(true);
    setTimeout(() => setOpen(true), 300);
  };

  const handleEditRole = async () => {
    if (!editUser) return;
    const userRef = ref(db, `usuarios/${editUser.uid}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      const userData = snap.val();
      await set(userRef, { ...userData, role: editRole });
      setEditDialogOpen(false);
      setEditUser(null);
      await fetchUsuarios();
    }
  };

  const handleInativar = async () => {
    if (!editUser) return;
    const userRef = ref(db, `usuarios/${editUser.uid}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      const userData = snap.val();
      await set(userRef, { ...userData, role: 'inativo' });
      setEditDialogOpen(false);
      setEditUser(null);
      await fetchUsuarios();
    }
  };

  const handleDeleteUser = async () => {
    if (!editUser) return;
    const userRef = ref(db, `usuarios/${editUser.uid}`);
    await set(userRef, null);
    setConfirmDeleteOpen(false);
    setEditDialogOpen(false);
    setEditUser(null);
    await fetchUsuarios();
  };

  useEffect(() => {
    async function fetchRole() {
      try {
        const { db, ref, get } = require('../firebase');
        if (!userId || userId === 'anon') return setUserRole('');
        const userRef = ref(db, `usuarios/${userId}`);
        const snap = await get(userRef);
        if (snap.exists()) {
          const userData = snap.val();
          setUserRole(userData.role || '');
        } else {
          setUserRole('');
        }
      } catch {
        setUserRole('');
      }
    }
    fetchRole();
  }, [userId]);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return (
    <>
      <IconButton
        onClick={handleMenuClick}
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1300,
          opacity: hideIcon ? 0 : 1,
          transition: 'opacity 0.3s',
          pointerEvents: hideIcon ? 'none' : 'auto'
        }}
      >
        <FaBars size={28} />
      </IconButton>
      <Drawer anchor="left" open={open} onClose={() => { setOpen(false); setHideIcon(false); }}>
        <div style={{ width: 240 }}>
          <List>
            <ListItem button onClick={() => { setOpen(false); setHideIcon(false); router.push('/dashboard'); }}>
              <ListItemIcon><FaHome /></ListItemIcon>
              <ListItemText primary="Início" />
            </ListItem>
            <ListItem button onClick={() => { setOpen(false); setHideIcon(false); router.push('/profile'); }}>
              <ListItemIcon><FaUserCircle /></ListItemIcon>
              <ListItemText primary="Perfil" />
            </ListItem>
            {/* Alunos: apenas coordenadora e professora */}
            {(userRole === 'coordenadora' || userRole === 'professora') && (
              <ListItem button onClick={() => { setOpen(false); setHideIcon(false); router.push('/alunos'); }}>
                <ListItemIcon><FaUserFriends /></ListItemIcon>
                <ListItemText primary="Alunos" />
              </ListItem>
            )}
            {/* Escola: apenas coordenadora */}
            {userRole === 'coordenadora' && (
              <ListItem button onClick={() => { setOpen(false); setHideIcon(false); router.push('/escola'); }}>
                <ListItemIcon><FaSchool /></ListItemIcon>
                <ListItemText primary="Escola" />
              </ListItem>
            )}
            <ListItem button>
              <ListItemIcon><FaStore /></ListItemIcon>
              <ListItemText primary="Loja" />
            </ListItem>
            {/* Colaboradores: apenas coordenadora */}
            {userRole === 'coordenadora' && (
              <ListItem button onClick={() => { setOpen(false); setHideIcon(false); router.push('/colaboradores'); }}>
                <ListItemIcon><FaUsers /></ListItemIcon>
                <ListItemText primary="Colaboradores" />
              </ListItem>
            )}
            <ListItem button>
              <ListItemIcon><FaCalendarAlt /></ListItemIcon>
              <ListItemText primary="Agenda" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><FaCashRegister /></ListItemIcon>
              <ListItemText primary="Caixa (Financeiro)" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><FaEnvelope /></ListItemIcon>
              <ListItemText primary="Mensageria" />
            </ListItem>
            <ListItem button>
              <ListItemIcon><FaPrint /></ListItemIcon>
              <ListItemText primary="Impressões" />
            </ListItem>
            <ListItem button onClick={() => { setOpen(false); setHideIcon(false); router.push('/galeriafotos'); }}>
              <ListItemIcon><FaImages /></ListItemIcon>
              <ListItemText primary="Galeria de Fotos" />
            </ListItem>
            <ListItem button onClick={() => { setOpen(false); setHideIcon(false); router.push('/configuracoes'); }}
              style={{ display: userRole === 'coordenadora' ? 'flex' : 'none' }}>
              <ListItemIcon>
                <Badge
                  badgeContent={pendentes}
                  color="error"
                  invisible={pendentes === 0}
                  overlap="circular"
                  sx={{
                    mr: -1,
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      minWidth: 16,
                      height: 16,
                      padding: '0 4px',
                      transform: 'scale(0.7)',
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                    }
                  }}
                >
                  <FaCog />
                </Badge>
              </ListItemIcon>
              <ListItemText primary="Configurações" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon><FaSignOutAlt /></ListItemIcon>
              <ListItemText primary="Sair" />
            </ListItem>
          </List>
        </div>
      </Drawer>
    </>
  );
};

export default SidebarMenu;
