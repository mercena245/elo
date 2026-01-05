import React from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

/**
 * Componente reutilizável de Snackbar para feedback ao usuário
 * @param {boolean} open - Controla visibilidade
 * @param {function} onClose - Callback ao fechar
 * @param {string} message - Mensagem a exibir
 * @param {string} severity - Tipo: 'success' | 'error' | 'warning' | 'info'
 * @param {number} duration - Duração em ms (padrão: 6000)
 */
const FeedbackSnackbar = ({ 
  open = false, 
  onClose, 
  message = '', 
  severity = 'info',
  duration = 6000 
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default FeedbackSnackbar;
