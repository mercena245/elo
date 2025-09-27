"use client";
import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Box,
  InputAdornment,
  CircularProgress,
  Fade,
  Slide,
  Alert
} from '@mui/material';
import { 
  FaSchool, 
  FaUserPlus, 
  FaEnvelope, 
  FaLock, 
  FaUser,
  FaArrowLeft 
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';

const RegisterForm = ({ onRegisterStart }) => {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { db, ref, get, set } = require('../firebase');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (onRegisterStart) onRegisterStart();
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      
      // Atualizar o perfil com o nome
      await updateProfile(user, { displayName: nome });
      
      // Criar entrada no banco de dados sem role (aguardando aprovação)
      const userRef = ref(db, `usuarios/${user.uid}`);
      await set(userRef, {
        email: user.email,
        nome: nome,
        role: null, // Sem role = aguardando aprovação
        createdAt: new Date().toISOString()
      });
      
      setSuccess(true);
      
      // Delay antes de redirecionar
      setTimeout(() => {
        router.push('/login');
      }, 2500);
      
    } catch (error) {
      setLoading(false);
      console.error("Erro ao criar conta:", error);
      
      // Traduzir erros do Firebase para português
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Este e-mail já está em uso. Tente fazer login.');
          break;
        case 'auth/weak-password':
          setError('A senha deve ter pelo menos 6 caracteres.');
          break;
        case 'auth/invalid-email':
          setError('E-mail inválido. Verifique o formato.');
          break;
        default:
          setError('Erro ao criar conta. Tente novamente.');
      }
    }
  };

  const goBackToLogin = () => {
    router.push('/login');
  };

  if (loading || success) {
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
                animation: success ? 'pulse 2s infinite' : 'bounce 1s infinite'
              }}
            >
              {success ? (
                <Typography sx={{ fontSize: '2rem', color: 'white' }}>✓</Typography>
              ) : (
                <FaUserPlus size={32} color="white" />
              )}
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
              {success ? 'Conta criada com sucesso!' : 'Criando sua conta...'}
            </Typography>
            
            {!success && (
              <CircularProgress 
                sx={{ 
                  color: 'white',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round'
                  }
                }} 
              />
            )}
            
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                mt: 2
              }}
            >
              {success 
                ? 'Redirecionando para o login...'
                : 'Aguarde um momento'
              }
            </Typography>
          </Box>
        </Fade>

        <style jsx global>{`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
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
          top: '15%',
          right: '15%',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          blur: '35px'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '10%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          blur: '25px'
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
            maxWidth: 500,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Header com logo e botão voltar */}
          <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
            {/* Botão voltar */}
            <Button
              startIcon={<FaArrowLeft />}
              onClick={goBackToLogin}
              sx={{
                position: 'absolute',
                left: 0,
                top: 5,
                color: '#64748b',
                fontSize: '0.9rem',
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.05)',
                  color: '#6366f1'
                }
              }}
            >
              Voltar
            </Button>

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
              variant="h5" 
              sx={{ 
                color: '#1e293b',
                fontWeight: 600,
                mb: 1
              }}
            >
              Criar Nova Conta
            </Typography>

            <Typography 
              variant="body1" 
              sx={{ 
                color: '#64748b',
                fontWeight: 400
              }}
            >
              Preencha os dados para se cadastrar
            </Typography>
          </Box>

          {/* Formulário */}
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                {error}
              </Alert>
            )}

            <TextField 
              label="Nome Completo" 
              variant="outlined" 
              fullWidth 
              margin="normal"
              value={nome} 
              onChange={e => setNome(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaUser color="#64748b" />
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
              label="E-mail" 
              type="email"
              variant="outlined" 
              fullWidth 
              margin="normal"
              value={email} 
              onChange={e => setEmail(e.target.value)}
              required
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
              required
              helperText="Mínimo de 6 caracteres"
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
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button 
                variant="contained" 
                fullWidth 
                type="submit"
                size="large"
                startIcon={<FaUserPlus />}
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
                Criar Conta
              </Button>
            </Box>

            {/* Texto informativo */}
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                borderRadius: 3,
                border: '1px solid rgba(99, 102, 241, 0.1)'
              }}
            >
              <Typography variant="body2" sx={{ color: '#6366f1', fontWeight: 500 }}>
                ℹ️ Sua conta será criada e aguardará aprovação
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                Você receberá acesso após a liberação pelo administrador
              </Typography>
            </Box>
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
    </Box>
  );
};

export default RegisterForm;
