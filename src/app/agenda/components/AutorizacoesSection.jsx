import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

const AutorizacoesSection = ({ userRole, userData }) => {
  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        🚌 Autorizações
      </Typography>
      <Alert severity="info">
        Em desenvolvimento - Sistema de autorizações para passeios e atividades externas.
      </Alert>
    </Box>
  );
};

export default AutorizacoesSection;