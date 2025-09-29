import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

const DiarioSection = ({ userRole, userData }) => {
  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        📖 Diário
      </Typography>
      <Alert severity="info">
        Em desenvolvimento - Sistema de registro diário: alimentação, sono, banho e atividades.
      </Alert>
    </Box>
  );
};

export default DiarioSection;