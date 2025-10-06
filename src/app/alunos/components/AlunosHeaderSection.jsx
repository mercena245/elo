import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress
} from '@mui/material';

const AlunosHeaderSection = ({
  qtdAlunos,
  userRole,
  loading,
  onVerificarPagamentos,
  verificandoPagamentos,
  resultadoPagamentos
}) => {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', mb: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1f2937' }}>
              👥 Gestão de Alunos
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                label={loading ? 'Carregando...' : `${qtdAlunos || 0} alunos cadastrados`}
                color="primary"
                sx={{ fontWeight: 600 }}
              />
              {userRole && (
                <Chip
                  label={`Acesso: ${userRole === 'coordenadora' ? 'Coordenação' : 'Professor(a)'}`}
                  variant="outlined"
                  color="secondary"
                />
              )}
            </Box>
          </Box>
          
          {/* Botões de ação rápida */}
          {userRole === 'coordenadora' && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={onVerificarPagamentos}
                disabled={verificandoPagamentos}
                sx={{
                  borderColor: '#10b981',
                  color: '#10b981',
                  '&:hover': {
                    borderColor: '#059669',
                    backgroundColor: '#10b981',
                    color: 'white'
                  }
                }}
              >
                {verificandoPagamentos ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Verificando...
                  </>
                ) : (
                  '💳 Verificar Pagamentos'
                )}
              </Button>
            </Box>
          )}
        </Box>
        
        {/* Resultado da verificação de pagamentos */}
        {resultadoPagamentos && (
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            backgroundColor: '#f0fdf4', 
            borderRadius: 2, 
            border: '1px solid #bbf7d0' 
          }}>
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
              ✅ Verificação concluída: {resultadoPagamentos}
            </Typography>
          </Box>
        )}
        
        {/* Estatísticas rápidas */}
        {!loading && qtdAlunos > 0 && (
          <Box sx={{ 
            mt: 3, 
            p: 3, 
            backgroundColor: '#f8fafc', 
            borderRadius: 3,
            border: '1px solid #e2e8f0'
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#374151', fontWeight: 600 }}>
              📊 Resumo Rápido
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
              gap: 2 
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {qtdAlunos}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Alunos
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  --
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ativos
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  --
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pré-matrícula
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  --
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inativos
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AlunosHeaderSection;