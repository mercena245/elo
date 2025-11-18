import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import { 
  Schedule, 
  EventNote, 
  School, 
  Person,
  CalendarMonth,
  CheckCircle
} from '@mui/icons-material';

const GradeHorariaCard = () => {
  const router = useRouter();
  const [openGradeInfo, setOpenGradeInfo] = useState(false);

  const handleNavigateToGrade = () => {
    router.push('/grade-horaria');
  };

  const handleToggleExpansion = () => {
    setOpenGradeInfo(!openGradeInfo);
  };

  const features = [
    { icon: <Schedule />, label: 'Horários de Aula', desc: 'Por turma e turno' },
    { icon: <Person />, label: 'Professores', desc: 'Alocação por disciplina' },
    { icon: <EventNote />, label: 'Disciplinas', desc: 'Organização semanal' },
    { icon: <CalendarMonth />, label: 'Calendário', desc: 'Visão completa' }
  ];

  return (
    <Card 
      elevation={3}
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
        }
      }}
    >
      <CardContent>
        {/* Cabeçalho */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Schedule 
            sx={{ 
              fontSize: 40, 
              mr: 2,
              background: 'rgba(255,255,255,0.2)',
              padding: 1,
              borderRadius: 2
            }} 
          />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              🕐 Grade Horária
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Organização de horários e professores
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)', mb: 2 }} />

        {/* Funcionalidades */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            ✨ Funcionalidades:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
            {features.map((feature, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {feature.icon}
                </Box>
                <Box>
                  <Typography variant="caption" display="block" fontWeight={600}>
                    {feature.label}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                    {feature.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Status */}
        <Box sx={{ mb: 2 }}>
          <Chip 
            icon={<CheckCircle />}
            label="Sistema Ativo"
            size="small"
            sx={{ 
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              color: 'white',
              border: '1px solid rgba(76, 175, 80, 0.5)'
            }}
          />
        </Box>

        {/* Botão Principal */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleNavigateToGrade}
          sx={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontWeight: 600,
            py: 1.2,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.3)',
              transform: 'scale(1.02)'
            }
          }}
        >
          📅 Gerenciar Grade Horária
        </Button>

        {/* Botão Secundário para Expandir Info */}
        <Button
          variant="text"
          fullWidth
          onClick={handleToggleExpansion}
          sx={{
            color: 'rgba(255,255,255,0.8)',
            mt: 1,
            fontSize: '0.875rem'
          }}
        >
          {openGradeInfo ? '▼ Ver menos detalhes' : '▶ Ver mais detalhes'}
        </Button>

        {/* Área Expansível */}
        {openGradeInfo && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.3)' }}>
            <Alert 
              severity="info" 
              sx={{ 
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                color: 'white',
                '& .MuiAlert-icon': { color: 'white' },
                mb: 2
              }}
            >
              Sistema integrado com turmas, disciplinas e professores para montagem completa da grade horária
            </Alert>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setOpenGradeInfo(false)}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                ← Recolher
              </Button>
            </Box>

            {/* Conteúdo dos recursos */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                📚 <strong>Recursos disponíveis:</strong>
              </Typography>
              {features.map((feature, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1, opacity: 0.9 }}>
                  {feature.icon}
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {feature.label}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {feature.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Informações adicionais */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                📌 <strong>Como usar:</strong>
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="caption" display="block" sx={{ opacity: 0.8, mb: 0.5 }}>
                  1. Defina os horários de entrada e saída
                </Typography>
                <Typography variant="caption" display="block" sx={{ opacity: 0.8, mb: 0.5 }}>
                  2. Associe professores às disciplinas
                </Typography>
                <Typography variant="caption" display="block" sx={{ opacity: 0.8, mb: 0.5 }}>
                  3. Monte a grade por turma
                </Typography>
                <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                  4. Visualize e exporte a grade completa
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default GradeHorariaCard;