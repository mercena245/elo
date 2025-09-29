import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

const ComportamentosSection = ({ userRole, userData }) => {
  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        🧠 Comportamentos e Incidentes
      </Typography>
      <Alert severity="info">
        Em desenvolvimento - Sistema para registro de comportamentos e incidentes dos alunos.
      </Alert>
    </Box>
  );
};

export default ComportamentosSection;