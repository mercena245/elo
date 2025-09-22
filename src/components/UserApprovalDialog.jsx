"use client";
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';

export default function UserApprovalDialog({ open, onClose, user, onApprove }) {
  const [selectedRole, setSelectedRole] = useState('');

  const handleApprove = () => {
    if (selectedRole) {
      onApprove(user.uid, selectedRole);
      onClose();
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
        <Button onClick={handleApprove} color="primary" disabled={!selectedRole}>Aprovar</Button>
      </DialogActions>
    </Dialog>
  );
}
