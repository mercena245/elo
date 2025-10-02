import React, { useState, useEffect } from 'react';
import { FaBars, FaHome, FaUserFriends, FaSchool, FaSignOutAlt, FaStore, FaUsers, FaCalendarAlt, FaCashRegister, FaEnvelope, FaPrint, FaImages, FaUserCircle, FaCog, FaGraduationCap, FaCertificate } from 'react-icons/fa';
import { db, ref, get, auth, onAuthStateChanged } from '../firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Badge, 
  Box, 
  Typography, 
  Avatar, 
  Divider,
  Chip
} from '@mui/material';

// Versão modernizada do SidebarMenu
const SidebarMenu = () => {
  const [open, setOpen] = useState(false);
  const [hideIcon, setHideIcon] = useState(false);
  const [pendentes, setPendentes] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  // Verificar autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        localStorage.setItem('userId', user.uid);
      } else {
        setUserId(null);
        localStorage.removeItem('userId');
        setUserRole('');
        setUserName('Usuário');
        setUserEmail('');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchRole() {
      try {
        if (!userId) return;
        const userRef = ref(db, `usuarios/${userId}`);
        const snap = await get(userRef);
        if (snap.exists()) {
          const data = snap.val();
          setUserRole(data.role || '');
          setUserName(data.nome || data.displayName || 'Usuário');
          setUserEmail(data.email || '');
        } else {
          setUserRole('');
          setUserName('Usuário');
          setUserEmail('');
        }
      } catch {
        setUserRole('');
        setUserName('Usuário');
        setUserEmail('');
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

  const getRoleColor = (role) => {
    switch (role) {
      case 'coordenadora': return '#10B981';
      case 'professora': return '#3B82F6';
      case 'pai': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'coordenadora': return 'Coordenadora';
      case 'professora': return 'Professora';
      case 'pai': return 'Responsável';
      default: return 'Usuário';
    }
  };

  const menuItems = [
    { icon: FaHome, label: 'Início', path: '/dashboard', color: '#10B981' },
    // { icon: FaUserCircle, label: 'Perfil', path: '/profile', color: '#3B82F6' }, // Desativado temporariamente
    ...(userRole === 'coordenadora' || userRole === 'professora' ? [
      { icon: FaUserFriends, label: 'Alunos', path: '/alunos', color: '#F59E0B' }
    ] : []),
    ...(userRole === 'professora' ? [
      { icon: FaGraduationCap, label: 'Notas & Frequência', path: '/notas-frequencia', color: '#8B5CF6' }
    ] : []),
    ...(userRole === 'coordenadora' ? [
      { icon: FaSchool, label: 'Escola', path: '/escola', color: '#EF4444' }
    ] : []),
    { icon: FaStore, label: 'Loja', path: '/loja', color: '#06B6D4' },
    ...(userRole === 'coordenadora' ? [
      { icon: FaUsers, label: 'Colaboradores', path: '/colaboradores', color: '#84CC16' }
    ] : []),
    { icon: FaCalendarAlt, label: 'Agenda', path: '/agenda', color: '#F97316' },
    { icon: FaCashRegister, label: 'Caixa (Financeiro)', path: '/financeiro', color: '#10B981' },
    ...(userRole === 'coordenadora' || userRole === 'pai' ? [
      { icon: FaCertificate, label: 'Secretaria Digital', path: '/secretaria-digital', color: '#7C3AED' }
    ] : []),
    { icon: FaEnvelope, label: 'Avisos', path: '/avisos', color: '#8B5CF6' },
    ...(userRole === 'coordenadora' ? [
      { icon: FaPrint, label: 'Impressões', path: '/impressoes', color: '#6B7280' }
    ] : []),
    { icon: FaImages, label: 'Galeria de Fotos', path: '/galeriafotos', color: '#EC4899' }
  ];

  return (
    <>
      <IconButton
        onClick={handleMenuClick}
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1300,
          opacity: hideIcon ? 0 : 1,
          transition: 'all 0.3s ease',
          pointerEvents: hideIcon ? 'none' : 'auto',
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 1)',
            transform: 'scale(1.05)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <FaBars size={24} color="#374151" />
      </IconButton>
      
      <Drawer 
        anchor="left" 
        open={open} 
        onClose={() => { setOpen(false); setHideIcon(false); }}
        PaperProps={{
          sx: {
            width: 280,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '0 20px 20px 0',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }
        }}
      >
        {/* Header do usuário */}
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 56, 
                height: 56,
                bgcolor: getRoleColor(userRole),
                fontSize: '1.5rem',
                fontWeight: 600,
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                fontSize: '1.1rem',
                mb: 0.5,
                color: 'white'
              }}>
                {userName}
              </Typography>
              <Chip 
                label={getRoleLabel(userRole)}
                size="small"
                sx={{
                  bgcolor: getRoleColor(userRole),
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
          </Box>
          {userEmail && (
            <Typography variant="caption" sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.8rem'
            }}>
              {userEmail}
            </Typography>
          )}
        </Box>

        {/* Menu Items */}
        <Box sx={{ flex: 1, py: 1 }}>
          <List sx={{ px: 1 }}>
            {menuItems.map((item, index) => (
              <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  onClick={() => item.path !== '#' && go(item.path)}
                  disabled={item.path === '#'}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                      color: 'rgba(255, 255, 255, 0.6)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      bgcolor: item.color,
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}>
                      <item.icon size={16} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      sx: { 
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        color: 'white'
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}

            <Divider sx={{ my: 2, mx: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />

            {/* Configurações (apenas coordenadora) */}
            {userRole === 'coordenadora' && (
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  onClick={() => go('/configuracoes')}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      bgcolor: '#6B7280',
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      position: 'relative'
                    }}>
                      <FaCog size={16} />
                      {pendentes > 0 && (
                        <Badge
                          badgeContent={pendentes}
                          color="error"
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            '& .MuiBadge-badge': {
                              fontSize: '0.7rem',
                              minWidth: 18,
                              height: 18,
                              borderRadius: '50%',
                              animation: 'pulse 2s infinite'
                            }
                          }}
                        />
                      )}
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Configurações"
                    primaryTypographyProps={{
                      sx: { 
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        color: 'white'
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )}

            {/* Logout */}
            <ListItem disablePadding>
              <ListItemButton 
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(239, 68, 68, 0.2)',
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    bgcolor: '#EF4444',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }}>
                    <FaSignOutAlt size={16} />
                  </Box>
                </ListItemIcon>
                <ListItemText 
                  primary="Sair"
                  primaryTypographyProps={{
                    sx: { 
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      color: 'white'
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>

        {/* Footer */}
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 100%)'
        }}>
          <Typography variant="caption" sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.75rem',
            textAlign: 'center',
            display: 'block'
          }}>
            ELO - Sistema Educacional
          </Typography>
          <Typography variant="caption" sx={{ 
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.7rem',
            textAlign: 'center',
            display: 'block',
            mt: 0.5
          }}>
            Versão 1.0.0
          </Typography>
        </Box>
      </Drawer>
      
      {/* Animação de pulse para badges */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default SidebarMenu;
