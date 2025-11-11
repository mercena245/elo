import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Typography,
  Paper
} from '@mui/material';
import CardMensagemPendente from './CardMensagemPendente';

const MensagensPendentes = ({ userData, conversas, onAprovar, onRejeitar, isReady }) => {
  const [filtroStatus, setFiltroStatus] = useState(0); // 0: Pendentes, 1: Aprovadas, 2: Rejeitadas
  const [mensagensFiltr, setMensagensFiltr] = useState([]);
  const [loading, setLoading] = useState(false);

  const euSouCoordenador = userData?.role === 'coordenadora';

  useEffect(() => {
    filtrarMensagens();
  }, [conversas, filtroStatus]);

  const filtrarMensagens = () => {
    if (!euSouCoordenador) return;

    const userId = userData.id;

    let filtradas = conversas.filter(msg => {
      const estaNoProcessoAprovacao = msg.coordenadoresParaAprovar?.includes(userId);
      const requerAprovacao = msg.requerAprovacao === true;
      
      return estaNoProcessoAprovacao && requerAprovacao;
    });

    // Aplicar filtro de status
    if (filtroStatus === 0) {
      filtradas = filtradas.filter(msg => msg.statusAprovacao === 'pendente');
    } else if (filtroStatus === 1) {
      filtradas = filtradas.filter(msg => msg.statusAprovacao === 'aprovada');
    } else if (filtroStatus === 2) {
      filtradas = filtradas.filter(msg => msg.statusAprovacao === 'rejeitada');
    }

    setMensagensFiltr(filtradas);
  };

  if (!euSouCoordenador) {
    return (
      <Alert severity="info">
        Apenas coordenadores podem acessar esta seção.
      </Alert>
    );
  }

  const contadores = {
    pendentes: conversas.filter(
      msg => msg.statusAprovacao === 'pendente' && 
             msg.coordenadoresParaAprovar?.includes(userData.id)
    ).length,
    aprovadas: conversas.filter(
      msg => msg.statusAprovacao === 'aprovada' && 
             msg.coordenadoresParaAprovar?.includes(userData.id)
    ).length,
    rejeitadas: conversas.filter(
      msg => msg.statusAprovacao === 'rejeitada' && 
             msg.coordenadoresParaAprovar?.includes(userData.id)
    ).length
  };

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={filtroStatus} 
          onChange={(e, newValue) => setFiltroStatus(newValue)}
          aria-label="filtro de mensagens pendentes"
        >
          <Tab 
            label={`Pendentes (${contadores.pendentes})`}
            sx={{
              backgroundColor: contadores.pendentes > 0 ? '#fca5a5' : 'transparent',
              fontWeight: contadores.pendentes > 0 ? 600 : 400
            }}
          />
          <Tab 
            label={`Aprovadas (${contadores.aprovadas})`}
            sx={{
              backgroundColor: contadores.aprovadas > 0 ? '#dcfce7' : 'transparent'
            }}
          />
          <Tab 
            label={`Rejeitadas (${contadores.rejeitadas})`}
            sx={{
              backgroundColor: contadores.rejeitadas > 0 ? '#fee2e2' : 'transparent'
            }}
          />
        </Tabs>
      </Box>

      <Box sx={{ p: 2 }}>
        {loading && <CircularProgress />}

        {!loading && mensagensFiltr.length === 0 && (
          <Alert severity="success">
            {filtroStatus === 0 
              ? 'Nenhuma mensagem pendente de aprovação'
              : filtroStatus === 1
              ? 'Nenhuma mensagem aprovada'
              : 'Nenhuma mensagem rejeitada'
            }
          </Alert>
        )}

        {!loading && mensagensFiltr.map((mensagem) => (
          <CardMensagemPendente
            key={mensagem.id}
            mensagem={mensagem}
            userData={userData}
            onAprovar={onAprovar}
            onRejeitar={onRejeitar}
            status={filtroStatus}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default MensagensPendentes;