
// Componente que exibe um accordion para mostrar os claims do usuário logado
// Usado na área de desenvolvedor para debug de permissões e claims customizados
import React, { useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import AdminClaimChecker from './AdminClaimChecker'; // Exibe os claims detalhados

// Accordion para mostrar claims do usuário logado apenas quando expandido

// Accordion customizado: só mostra os dados ao ser expandido
export default function DevClaimsAccordion() {
  // Estado para controlar se o accordion está aberto ou fechado
  const [open, setOpen] = useState(false);
  return (
    <Card sx={{ bgcolor: '#333', color: '#fff' }}>
      {/* CardContent funciona como botão para expandir/recolher */}
      <CardContent sx={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {/* Ícone de seta indica estado do accordion */}
          {open ? '▼' : '▶'} Dados do usuário logado (claims)
        </Typography>
        {/* Só renderiza os claims se estiver aberto */}
        {open && (
          <Box sx={{ mt: 2 }}>
            <AdminClaimChecker /> {/* Mostra os claims customizados do usuário logado */}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
