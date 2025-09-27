import React, { useState, useEffect } from 'react';
import { FaBars, FaHome, FaUserFriends, FaSchool, FaSignOutAlt, FaStore, FaUsers, FaCalendarAlt, FaCashRegister, FaEnvelope, FaPrint, FaImages, FaUserCircle, FaCog, FaGraduationCap } from 'react-icons/fa';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, Badge } from '@mui/material';
import { ref, get } from 'firebase/database';

// Versão limpa do componente sem duplicações
const SidebarMenu = () => {
  const [open, setOpen] = useState(false);
  const [hideIcon, setHideIcon] = useState(false);
  const [pendentes, setPendentes] = useState(0);
  const [userRole, setUserRole] = useState('');
  const router = useRouter();

  const userId = typeof window !== 'undefined' && localStorage.getItem('userId')
    ? localStorage.getItem('userId')
    : (auth.currentUser ? auth.currentUser.uid : '');

  useEffect(() => {
    async function fetchRole() {
      try {
        if (!userId) return;
        const userRef = ref(db, `usuarios/${userId}`);
        const snap = await get(userRef);
        if (snap.exists()) {
          const data = snap.val();
          setUserRole(data.role || '');
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
    async function fetchPendentes() {
      try {
        const usuariosRef = ref(db, 'usuarios');
        const snap = await get(usuariosRef);
        if (snap.exists()) {
          const all = snap.val();
          const lista = Object.values(all).filter(u => !u.role);
          setPendentes(lista.length);
        } else {
          setPendentes(0);
        }
      } catch {
        setPendentes(0);
      }
    }
    fetchPendentes();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleMenuClick = () => {
    setHideIcon(true);
    setTimeout(() => setOpen(true), 300);
  };

  const go = (path) => {
    setOpen(false);
    setHideIcon(false);
    router.push(path);
  };

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
            <ListItem button onClick={() => go('/dashboard')}>
              <ListItemIcon><FaHome /></ListItemIcon>
              <ListItemText primary="Início" />
            </ListItem>
            <ListItem button onClick={() => go('/profile')}>
              <ListItemIcon><FaUserCircle /></ListItemIcon>
              <ListItemText primary="Perfil" />
            </ListItem>
            {(userRole === 'coordenadora' || userRole === 'professora') && (
              <ListItem button onClick={() => go('/alunos')}>
                <ListItemIcon><FaUserFriends /></ListItemIcon>
                <ListItemText primary="Alunos" />
              </ListItem>
            )}
            {userRole === 'professora' && (
              <ListItem button onClick={() => go('/notas-frequencia')}>
                <ListItemIcon><FaGraduationCap /></ListItemIcon>
                <ListItemText primary="Notas & Frequência" />
              </ListItem>
            )}
            {userRole === 'coordenadora' && (
              <ListItem button onClick={() => go('/escola')}>
                <ListItemIcon><FaSchool /></ListItemIcon>
                <ListItemText primary="Escola" />
              </ListItem>
            )}
            <ListItem button>
              <ListItemIcon><FaStore /></ListItemIcon>
              <ListItemText primary="Loja" />
            </ListItem>
            {userRole === 'coordenadora' && (
              <ListItem button onClick={() => go('/colaboradores')}>
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
            <ListItem button onClick={() => go('/galeriafotos')}>
              <ListItemIcon><FaImages /></ListItemIcon>
              <ListItemText primary="Galeria de Fotos" />
            </ListItem>
            {userRole === 'coordenadora' && (
              <ListItem button onClick={() => go('/configuracoes')}>
                <ListItemIcon>
                  <Badge
                    badgeContent={pendentes}
                    color="error"
                    invisible={pendentes === 0}
                    overlap="circular"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.7rem',
                        minWidth: 16,
                        height: 16,
                        padding: '0 4px',
                        transform: 'scale(0.7)',
                        top: '-4px',
                        right: '-4px'
                      }
                    }}
                  >
                    <FaCog />
                  </Badge>
                </ListItemIcon>
                <ListItemText primary="Configurações" />
              </ListItem>
            )}
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
