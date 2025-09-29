import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

const AvisosEspecificosSection = ({ userRole, userData }) => {
  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        📢 Avisos Específicos
      </Typography>
      <Alert severity="info">
        Em desenvolvimento - Sistema de avisos direcionados para alunos específicos.
      </Alert>
    </Box>
  );
};

export default AvisosEspecificosSection;