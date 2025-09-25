"use client";
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { deleteUserFunction } from '../firebase';
import { getFunctions, httpsCallable } from "firebase/functions";



export default function UserApprovalDialog({ open, onClose, user, onApprove }) {
  const [selectedRole, setSelectedRole] = useState('');

  const handleApprove = () => {
    if (selectedRole) {
      onApprove(user.uid, selectedRole);
      onClose();
    }
  };

  const handleReject = async () => {
    if (user.uid) {
      if (window.confirm('Tem certeza que deseja recusar este usuário? Ele será excluído do sistema.')) {
        try {
          // Força refresh do token para garantir claims atualizados
          if (typeof window !== 'undefined' && window.firebaseAuth && window.firebaseAuth.currentUser) {
            await window.firebaseAuth.currentUser.getIdToken(true);
          }
          await deleteUserFunction({ uid: user.uid });
          onClose();
        } catch (e) {
          // Mostra detalhes completos do erro
          console.error(e);
          alert('Erro ao excluir usuário: ' + (e.details || e.message || JSON.stringify(e)));
        }
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Aprovar usuário</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          {user.nome || user.email}
        </Typography>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="role-select-label">Tipo de acesso</InputLabel>
          <Select
            labelId="role-select-label"
            value={selectedRole}
            label="Tipo de acesso"
            onChange={e => setSelectedRole(e.target.value)}
          >
            <MenuItem value="coordenadora">Coordenadora</MenuItem>
            <MenuItem value="professora">Professora</MenuItem>
            <MenuItem value="pai">Pai</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
  <Button onClick={handleApprove} color="primary" disabled={!selectedRole}>Validar acesso</Button>
        <Button onClick={handleReject} color="error">Recusar</Button>
      </DialogActions>
    </Dialog>
  );
}
