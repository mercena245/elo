import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Grid,
  Divider
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  AttachFile as AttachIcon
} from '@mui/icons-material';
import DialogAprovarRejeitar from './DialogAprovarRejeitar';

const CardMensagemPendente = ({ mensagem, userData, onAprovar, onRejeitar, status }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [tipoAcao, setTipoAcao] = useState(null); // 'aprovar' ou 'rejeitar'

  const handleAbrirDialog = (tipo) => {
    setTipoAcao(tipo);
    setOpenDialog(true);
  };

  const handleConfirmar = async (motivo = '') => {
    if (tipoAcao === 'aprovar') {
      await onAprovar(mensagem.id, mensagem);
    } else if (tipoAcao === 'rejeitar') {
      await onRejeitar(mensagem.id, mensagem, motivo);
    }
    setOpenDialog(false);
  };

  const formatarData = (dataISO) => {
    return new Date(dataISO).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role) => {
    const cores = {
      pai: '#3B82F6',
      professor: '#8B5CF6',
      coordenadora: '#10B981',
      default: '#6B7280'
    };
    return cores[role] || cores.default;
  };

  const getRoleLabel = (role) => {
    const labels = {
      pai: 'Pai/Responsável',
      professor: 'Professor',
      coordenadora: 'Coordenação'
    };
    return labels[role] || role;
  };

  const statusStyleMap = {
    pendente: { bgColor: '#fef3c7', borderColor: '#f59e0b', textColor: '#92400e' },
    aprovada: { bgColor: '#dcfce7', borderColor: '#10b981', textColor: '#065f46' },
    rejeitada: { bgColor: '#fee2e2', borderColor: '#ef4444', textColor: '#7f1d1d' }
  };

  const statusStyle = statusStyleMap[mensagem.statusAprovacao] || statusStyleMap.pendente;
  const isPendente = mensagem.statusAprovacao === 'pendente';

  return (
    <>
      <Card
        sx={{
          mb: 2,
          backgroundColor: statusStyle.bgColor,
          borderLeft: `4px solid ${statusStyle.borderColor}`,
          '&:hover': {
            boxShadow: 3
          }
        }}
      >
        <CardContent>
          {/* Cabeçalho com Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              {mensagem.assunto}
            </Typography>
            <Chip
              icon={
                mensagem.statusAprovacao === 'aprovada'
                  ? <ApprovedIcon />
                  : mensagem.statusAprovacao === 'rejeitada'
                  ? <RejectedIcon />
                  : undefined
              }
              label={
                mensagem.statusAprovacao === 'pendente'
                  ? '⏳ Pendente'
                  : mensagem.statusAprovacao === 'aprovada'
                  ? '✓ Aprovada'
                  : '✗ Rejeitada'
              }
              color={
                mensagem.statusAprovacao === 'pendente'
                  ? 'warning'
                  : mensagem.statusAprovacao === 'aprovada'
                  ? 'success'
                  : 'error'
              }
              variant="outlined"
              size="small"
            />
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Remetente e Destinatário */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: getRoleColor(mensagem.remetente?.role), width: 32, height: 32 }}>
                  {mensagem.remetente?.nome?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    De:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {mensagem.remetente?.nome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getRoleLabel(mensagem.remetente?.role)}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: getRoleColor(mensagem.destinatario?.role), width: 32, height: 32 }}>
                  {mensagem.destinatario?.nome?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Para:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {mensagem.destinatario?.nome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getRoleLabel(mensagem.destinatario?.role)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Conteúdo */}
          <Typography 
            variant="body2" 
            sx={{ 
              p: 1.5, 
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: 1,
              mb: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {mensagem.conteudo}
          </Typography>

          {/* Anexos */}
          {mensagem.anexos && mensagem.anexos.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                📎 Anexos ({mensagem.anexos.length}):
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {mensagem.anexos.map((anexo, idx) => (
                  <Chip
                    key={idx}
                    icon={<AttachIcon />}
                    label={anexo.nome || `Arquivo ${idx + 1}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Data e Informações de Aprovação */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              📅 Enviado: {formatarData(mensagem.dataEnvio)}
            </Typography>

            {mensagem.dataAprovacao && (
              <Typography variant="caption" color="text.secondary">
                ✓ {mensagem.statusAprovacao === 'aprovada' ? 'Aprovado' : 'Rejeitado'}: {formatarData(mensagem.dataAprovacao)}
              </Typography>
            )}
          </Box>

          {/* Motivo da Rejeição */}
          {mensagem.statusAprovacao === 'rejeitada' && mensagem.motivoRejeicao && (
            <Box sx={{ mt: 1.5, p: 1, backgroundColor: '#fee2e2', borderRadius: 1, borderLeft: '3px solid #ef4444' }}>
              <Typography variant="caption" fontWeight={600} color="error">
                Motivo da Rejeição:
              </Typography>
              <Typography variant="caption" display="block" color="error">
                {mensagem.motivoRejeicao}
              </Typography>
            </Box>
          )}
        </CardContent>

        {/* Ações */}
        {isPendente && (
          <CardActions sx={{ backgroundColor: 'rgba(0,0,0,0.02)', display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => handleAbrirDialog('rejeitar')}
            >
              Rejeitar
            </Button>
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={() => handleAbrirDialog('aprovar')}
            >
              Aprovar
            </Button>
          </CardActions>
        )}
      </Card>

      {/* Dialog de Confirmação */}
      <DialogAprovarRejeitar
        open={openDialog}
        tipo={tipoAcao}
        onConfirmar={handleConfirmar}
        onCancelar={() => setOpenDialog(false)}
      />
    </>
  );
};

export default CardMensagemPendente;