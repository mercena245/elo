
"use client";
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, provider, signInWithPopup } from '../firebase';
import { Button, TextField, Typography, Paper, Divider } from '@mui/material';
import { FaSchool, FaGoogle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import '../styles/LoginForm.css';

const LoginForm = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const { db, ref, get, set } = require('../firebase');

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = ref(db, `usuarios/${user.uid}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const userData = snap.val();
        if (userData.role) {
          router.push('/dashboard');
        } else {
          alert('Aguardando liberação para acesso.');
        }
      } else {
        // Cria o usuário no banco sem role
        await set(userRef, {
          email: user.email,
          nome: user.displayName || '',
          role: null
        });
        alert('Aguardando liberação para acesso.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao fazer login com Google');
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, senha);
      const user = result.user;
      const userRef = ref(db, `usuarios/${user.uid}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const userData = snap.val();
        if (userData.role) {
          router.push('/dashboard');
        } else {
          alert('Aguardando liberação para acesso.');
        }
      } else {
        // Cria o usuário no banco sem role
        await set(userRef, {
          email: user.email,
          nome: user.displayName || '',
          role: null
        });
        alert('Aguardando liberação para acesso.');
      }
    } catch (error) {
      alert('Erro ao fazer login: ' + error.message);
    }
    setLoading(false);
  };

  const handleCreateAccount = () => {
  router.push('/register');
  };

  return (
    <Paper elevation={3} className="login-form">
      <div className="login-icon">
        <FaSchool size={48} color="#1976d2" />
      </div>
      <Typography variant="h5" component="h1" gutterBottom>
        ELO
      </Typography>
      <form onSubmit={handleEmailLogin}>
        <TextField label="E-mail" variant="outlined" fullWidth margin="normal" value={email} onChange={e => setEmail(e.target.value)} />
        <TextField label="Senha" type="password" variant="outlined" fullWidth margin="normal" value={senha} onChange={e => setSenha(e.target.value)} />
        <div style={{ display: 'flex', gap: 12, marginTop: 16, marginBottom: 16 }}>
          <Button variant="contained" color="primary" fullWidth type="submit" style={{ flex: 1 }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            startIcon={<FaGoogle />}
            onClick={handleGoogleLogin}
            style={{ flex: 1 }}
          >
            Google
          </Button>
        </div>
        <Button
          variant="text"
          color="secondary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleCreateAccount}
        >
          Criar conta
        </Button>
      </form>
    </Paper>
  );
};

export default LoginForm;
