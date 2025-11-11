import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box
} from '@mui/material';

const DialogAprovarRejeitar = ({ open, tipo, onConfirmar, onCancelar }) => {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      await onConfirmar(motivo);
    } finally {
      setLoading(false);
      setMotivo('');
    }
  };

  const handleCancelar = () => {
    setMotivo('');
    onCancelar();
  };

  return (
    <Dialog open={open} onClose={handleCancelar} maxWidth="sm" fullWidth>
      <DialogTitle>
        {tipo === 'aprovar' ? '✓ Aprovar Mensagem' : '✗ Rejeitar Mensagem'}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {tipo === 'aprovar' ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Você está prestes a aprovar esta mensagem. Ela será entregue aos destinatários.
            </Alert>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Você está prestes a rejeitar esta mensagem. Os remetentes serão notificados.
              </Alert>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Motivo da Rejeição (Obrigatório)"
                placeholder="Descreva por que está rejeitando esta mensagem..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                variant="outlined"
                sx={{ mt: 1 }}
              />
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancelar} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirmar}
          variant="contained"
          color={tipo === 'aprovar' ? 'success' : 'error'}
          disabled={loading || (tipo === 'rejeitar' && !motivo.trim())}
        >
          {loading ? 'Processando...' : tipo === 'aprovar' ? 'Aprovar' : 'Rejeitar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DialogAprovarRejeitar;