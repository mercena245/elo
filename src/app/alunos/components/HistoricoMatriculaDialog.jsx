'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  School as SchoolIcon,
  Event as EventIcon,
  AccountCircle as AccountCircleIcon,
  AttachMoney as AttachMoneyIcon,
  Class as ClassIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const HistoricoMatriculaDialog = ({ 
  open, 
  onClose, 
  aluno, 
  historicoService,
  turmas = [],
  getData,
  onRematricula
}) => {
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [error, setError] = useState(null);

  // Buscar dados quando o dialog abrir
  useEffect(() => {
    if (open && aluno?.id) {
      buscarHistoricoMatriculas();
    }
  }, [open, aluno?.id]);

  const buscarHistoricoMatriculas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar histórico de matrículas
      const dados = await historicoService.buscarHistoricoCompleto(aluno.id);
      
      // Ordenar por data (mais recente primeiro)
      const historicoOrdenado = dados.sort((a, b) => 
        new Date(b.dataOperacao) - new Date(a.dataOperacao)
      );
      
      setHistorico(historicoOrdenado);
    } catch (error) {
      console.error('Erro ao buscar histórico de matrículas:', error);
      setError('Erro ao carregar histórico de matrículas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ativo':
      case 'matriculado':
      case 'concluido':
        return 'success';
      case 'inativo':
      case 'cancelado':
        return 'error';
      case 'pre_matricula':
      case 'aguardando':
        return 'warning';
      case 'rematriculado':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (tipoOperacao, status) => {
    switch (tipoOperacao) {
      case 'matricula_inicial':
        return <SchoolIcon />;
      case 'rematricula':
        return '🔄';
      case 'reativacao':
        return <CheckCircleIcon />;
      case 'inativacao':
        return <CancelIcon />;
      case 'transferencia':
        return <ClassIcon />;
      default:
        return <EventIcon />;
    }
  };

  const getTurmaNome = (turmaId) => {
    if (!turmaId) return 'Sem turma';
    const turma = turmas.find(t => t.id === turmaId);
    return turma ? turma.nome : `Turma ID: ${turmaId}`;
  };

  const formatarData = (data) => {
    if (!data) return '--';
    try {
      return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(data);
    }
  };

  const renderHistoricoItem = (item, index) => {
    return (
      <Card 
        key={index}
        elevation={2}
        sx={{ 
          mb: 2,
          bgcolor: index === 0 ? '#f8fafc' : 'white',
          border: index === 0 ? '2px solid #6366f1' : '1px solid #e2e8f0',
          position: 'relative'
        }}
      >
        {/* Indicador de posição na timeline */}
        <Box
          sx={{
            position: 'absolute',
            left: -1,
            top: 0,
            bottom: 0,
            width: 4,
            bgcolor: getStatusColor(item.status) === 'success' ? '#22c55e' :
                     getStatusColor(item.status) === 'error' ? '#ef4444' :
                     getStatusColor(item.status) === 'warning' ? '#f59e0b' :
                     getStatusColor(item.status) === 'info' ? '#3b82f6' : '#6b7280'
          }}
        />

        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          {/* Header com título e data */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar 
                sx={{ 
                  bgcolor: getStatusColor(item.status) === 'success' ? '#22c55e' :
                           getStatusColor(item.status) === 'error' ? '#ef4444' :
                           getStatusColor(item.status) === 'warning' ? '#f59e0b' :
                           getStatusColor(item.status) === 'info' ? '#3b82f6' : '#6b7280',
                  width: 40,
                  height: 40
                }}
              >
                {getStatusIcon(item.tipoOperacao, item.status)}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ 
                  color: index === 0 ? '#6366f1' : '#334155',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  mb: 0.5
                }}>
                  {item.titulo}
                  {index === 0 && (
                    <Chip 
                      label="Atual" 
                      size="small" 
                      color="primary" 
                      sx={{ ml: 1, fontWeight: 'bold' }}
                    />
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.descricao}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', minWidth: 120 }}>
              {formatarData(item.dataOperacao)}
            </Typography>
          </Box>

          {/* Chips com informações */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip 
              label={item.status} 
              color={getStatusColor(item.status)}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
            {item.turmaId && (
              <Chip 
                label={getTurmaNome(item.turmaId)}
                variant="outlined"
                size="small"
                icon={<ClassIcon />}
              />
            )}
            {item.valorMatricula && (
              <Chip 
                label={`R$ ${parseFloat(item.valorMatricula).toFixed(2)}`}
                variant="outlined"
                size="small"
                icon={<AttachMoneyIcon />}
                color="success"
              />
            )}
          </Box>

          {/* Observações */}
          {item.detalhes && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: '#f1f5f9', 
              borderRadius: 2,
              borderLeft: '4px solid #6366f1'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569', mb: 1 }}>
                📋 Observações:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.detalhes}
              </Typography>
            </Box>
          )}

          {/* Responsável */}
          {item.responsavel && (
            <Box sx={{ 
              mt: 2,
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'text.secondary'
            }}>
              <AccountCircleIcon fontSize="small" />
              <Typography variant="caption">
                Responsável: {item.responsavel}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          borderRadius: 0,
          maxHeight: '100vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        p: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <HistoryIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Histórico de Matrículas
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {aluno?.nome} - Matrícula: {aluno?.matricula}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Botão Rematrícula */}
          {onRematricula && (
            <Button
              variant="contained"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => onRematricula(aluno)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)'
                },
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              REMATRÍCULA
            </Button>
          )}
          <IconButton 
            onClick={onClose} 
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            gap: 2, 
            p: 4 
          }}>
            <CircularProgress />
            <Typography>Carregando histórico de matrículas...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">
              {error}
            </Alert>
          </Box>
        )}

        {!loading && !error && (
          <>
            {historico.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                gap: 2, 
                p: 4,
                color: 'text.secondary'
              }}>
                <HistoryIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                <Typography variant="h6">
                  Nenhum histórico encontrado
                </Typography>
                <Typography variant="body2" textAlign="center">
                  Este aluno ainda não possui registros de matrículas anteriores.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 2 }}>
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                    📊 Resumo do Histórico
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Typography variant="body2">
                      <strong>Total de registros:</strong> {historico.length}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Primeira matrícula:</strong> {formatarData(historico[historico.length - 1]?.dataOperacao)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status atual:</strong> 
                      <Chip 
                        label={aluno?.status || 'N/A'} 
                        size="small" 
                        color={getStatusColor(aluno?.status)}
                        sx={{ ml: 1, fontWeight: 'bold' }}
                      />
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  {historico.map((item, index) => renderHistoricoItem(item, index))}
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: '#6366f1',
            '&:hover': {
              bgcolor: '#5b59f0'
            },
            borderRadius: 2,
            px: 3
          }}
        >
          ✓ Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HistoricoMatriculaDialog;