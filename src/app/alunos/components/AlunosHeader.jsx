"use client";

import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const AlunosHeader = ({ 
  verificandoPagamentos, 
  onVerificarPagamentos, 
  onNovaMatricula 
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      mb: 3, 
      p: 3, 
      borderRadius: 3, 
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
      color: 'white', 
      boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)' 
    }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom={false}>
        👥 Gestão de Alunos
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button 
          variant="outlined" 
          size="small"
          onClick={onVerificarPagamentos}
          disabled={verificandoPagamentos}
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.1)', 
            color: 'white',
            borderColor: 'rgba(255,255,255,0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 2,
            fontSize: '0.75rem',
            '&:hover': { 
              bgcolor: 'rgba(255,255,255,0.2)',
              borderColor: 'rgba(255,255,255,0.4)'
            }
          }} 
        >
          {verificandoPagamentos ? '🔄 Verificando...' : '🔍 Verificar Pagamentos'}
        </Button>
        
        <Button 
          variant="contained" 
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.15)', 
            color: 'white',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 2,
            '&:hover': { 
              bgcolor: 'rgba(255,255,255,0.25)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            },
            transition: 'all 0.3s ease'
          }} 
          onClick={onNovaMatricula}
        >
          + Nova Matrícula
        </Button>
      </Box>
    </Box>
  );
};

export default AlunosHeader;