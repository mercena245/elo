
"use client";
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, provider, signInWithPopup, db, ref, get, set } from '../firebase';
import { 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Box,
  InputAdornment,
  CircularProgress,
  Fade,
  Slide
} from '@mui/material';
import { 
  FaSchool, 
  FaGoogle, 
  FaEnvelope, 
  FaLock, 
  FaUserPlus 
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

const LoginForm = ({ onLoginStart }) => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  
  // Estados do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: ''
  });

  const handleGoogleLogin = async () => {
    setLoading(true);
    if (onLoginStart) onLoginStart();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = ref(db, `usuarios/${user.uid}`);
      const snap = await get(userRef);
      
      if (snap.exists()) {
        const userData = snap.val();
        if (userData.role) {
          // Usuário com role definida - redireciona para dashboard
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        } else {
          // Usuário sem role - redireciona para seleção de escola
          setLoading(false);
          router.push('/school-selection');
        }
      } else {
        // Usuário novo - cria no banco e redireciona para seleção de escola
        await set(userRef, {
          email: user.email,
          nome: user.displayName || '',
          role: null
        });
        setLoading(false);
        router.push('/school-selection');
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      setModalConfig({
        type: 'error',
        title: '❌ Erro no Login',
        message: 'Não foi possível fazer login com o Google. Tente novamente.'
      });
      setModalOpen(true);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (onLoginStart) onLoginStart();
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, senha);
      const user = result.user;
      const userRef = ref(db, `usuarios/${user.uid}`);
      const snap = await get(userRef);
      
      if (snap.exists()) {
        const userData = snap.val();
        if (userData.role) {
          // Usuário com role definida - redireciona para dashboard
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        } else {
          // Usuário sem role - redireciona para seleção de escola
          setLoading(false);
          router.push('/school-selection');
        }
      } else {
        // Usuário novo - cria no banco e redireciona para seleção de escola
        await set(userRef, {
          email: user.email,
          nome: user.displayName || email.split('@')[0],
          role: null
        });
        setLoading(false);
        router.push('/school-selection');
      }
    } catch (error) {
      setLoading(false);
      
      // Mensagem de erro mais amigável baseada no tipo de erro
      let errorMessage = 'Não foi possível fazer login. Tente novamente.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado. Verifique seu e-mail ou crie uma conta.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta. Tente novamente.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'E-mail inválido. Verifique o formato do e-mail.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Esta conta foi desativada. Entre em contato com o administrador.';
      }
      
      setModalConfig({
        type: 'error',
        title: '❌ Erro no Login',
        message: errorMessage
      });
      setModalOpen(true);
    }
  };

  const handleCreateAccount = () => {
    router.push('/register');
  };

  if (loading) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998
        }}
      >
        <Fade in timeout={800}>
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                mx: 'auto',
                animation: 'pulse 2s infinite'
              }}
            >
              <FaSchool size={32} color="white" />
            </Box>
            
            <Typography
              variant="h5"
              sx={{
                color: 'white',
                fontWeight: 600,
                mb: 2,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
              }}
            >
              Entrando no sistema...
            </Typography>
            
            <CircularProgress 
              sx={{ 
                color: 'white',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round'
                }
              }} 
            />
            
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                mt: 2
              }}
            >
              Aguarde um momento
            </Typography>
          </Box>
        </Fade>

        <style jsx global>{`
          @keyframes pulse {
            0% {
              transform: scale(1);
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            }
          }
        `}</style>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      {/* Elementos decorativos de fundo */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          blur: '40px'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          blur: '30px'
        }}
      />

      <Slide direction="up" in={showForm} timeout={800}>
        <Paper 
          elevation={24}
          sx={{
            p: 5,
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.2)',
            width: '100%',
            maxWidth: 480,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Header com logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                mx: 'auto',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
              }}
            >
              <FaSchool size={32} color="white" />
            </Box>
            
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 1
              }}
            >
              ELO
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#64748b',
                fontWeight: 400
              }}
            >
              Sistema Educacional
            </Typography>
          </Box>

          {/* Formulário */}
          <form onSubmit={handleEmailLogin}>
            <TextField 
              label="E-mail" 
              variant="outlined" 
              fullWidth 
              margin="normal"
              value={email} 
              onChange={e => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaEnvelope color="#64748b" />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  '&:hover': {
                    '& > fieldset': {
                      borderColor: '#6366f1'
                    }
                  },
                  '&.Mui-focused': {
                    '& > fieldset': {
                      borderColor: '#6366f1',
                      borderWidth: 2
                    }
                  }
                }
              }}
            />
            
            <TextField 
              label="Senha" 
              type="password" 
              variant="outlined" 
              fullWidth 
              margin="normal"
              value={senha} 
              onChange={e => setSenha(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaLock color="#64748b" />
                  </InputAdornment>
                )
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  '&:hover': {
                    '& > fieldset': {
                      borderColor: '#6366f1'
                    }
                  },
                  '&.Mui-focused': {
                    '& > fieldset': {
                      borderColor: '#6366f1',
                      borderWidth: 2
                    }
                  }
                }
              }}
            />

            {/* Botões principais */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button 
                variant="contained" 
                fullWidth 
                type="submit"
                size="large"
                sx={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  borderRadius: 3,
                  py: 1.5,
                  fontWeight: 600,
                  boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                  '&:hover': {
                    boxShadow: '0 12px 35px rgba(99, 102, 241, 0.4)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Entrar
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FaGoogle />}
                onClick={handleGoogleLogin}
                size="large"
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#6366f1',
                    color: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Google
              </Button>
            </Box>

            {/* Botão criar conta */}
            <Button
              variant="text"
              fullWidth
              startIcon={<FaUserPlus />}
              onClick={handleCreateAccount}
              size="large"
              sx={{
                color: '#64748b',
                fontWeight: 500,
                borderRadius: 3,
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.05)',
                  color: '#6366f1'
                }
              }}
            >
              Criar nova conta
            </Button>
          </form>

          {/* Decoração inferior */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
              borderRadius: '0 0 24px 24px'
            }}
          />
        </Paper>
      </Slide>

      {/* Modal de feedback */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText="OK"
      />
    </Box>
  );
};

export default LoginForm;
