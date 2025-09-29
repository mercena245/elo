import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Alert
} from '@mui/material';
import {
  LocalPharmacy,
  Add,
  Schedule,
  Description,
  Warning,
  CheckCircle
} from '@mui/icons-material';

const AgendaMedicaSection = ({ userRole, userData }) => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [dialogNovoMedicamento, setDialogNovoMedicamento] = useState(false);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          💊 Agenda Médica
        </Typography>
        {(userRole === 'pai' || userRole === 'coordenadora') && (
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setDialogNovoMedicamento(true)}
            sx={{ 
              background: 'linear-gradient(45deg, #10B981, #059669)',
              textTransform: 'none'
            }}
          >
            Novo Medicamento
          </Button>
        )}
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Em desenvolvimento - Sistema para gerenciar medicamentos, receitas e horários.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🕐 Medicamentos Ativos
              </Typography>
              <Typography color="text.secondary">
                Lista de medicamentos em uso com horários programados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Receitas e Laudos
              </Typography>
              <Typography color="text.secondary">
                Documentos médicos anexados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AgendaMedicaSection;