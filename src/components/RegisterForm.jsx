import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Button, TextField, Typography, Paper } from '@mui/material';
import { FaUserPlus } from 'react-icons/fa';
import '../styles/RegisterForm.css';

const RegisterForm = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(userCredential.user, { displayName: nome });
      alert("Conta criada com sucesso!");
      // Aqui você pode redirecionar ou limpar o formulário
    } catch (error) {
      alert("Erro ao criar conta: " + error.message);
    }
    setLoading(false);
  };

  return (
    <Paper elevation={3} className="register-form">
      <div className="register-icon">
        <FaUserPlus size={48} color="#1976d2" />
      </div>
      <Typography variant="h5" component="h1" gutterBottom>
        Criar Conta
      </Typography>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <TextField label="Nome" variant="outlined" fullWidth margin="normal" value={nome} onChange={e => setNome(e.target.value)} />
        <TextField label="E-mail" variant="outlined" fullWidth margin="normal" value={email} onChange={e => setEmail(e.target.value)} />
        <TextField label="Senha" type="password" variant="outlined" fullWidth margin="normal" value={senha} onChange={e => setSenha(e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="contained" color="primary" type="submit" disabled={loading} style={{ flex: 1 }}>
            {loading ? "Registrando..." : "Registrar"}
          </Button>
          <Button variant="outlined" color="primary" style={{ flex: 1 }} onClick={() => window.location.href = '/login'}>
            Entrar
          </Button>
        </div>
      </form>
    </Paper>
  );
};

export default RegisterForm;
