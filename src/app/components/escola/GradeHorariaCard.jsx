import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

const GradeHorariaCard = () => {
  const router = useRouter();

  const handleNavigateToGrade = () => {
    router.push('/grade-horaria');
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Gerencie os horários de aula por turma e professor
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        size="small" 
        onClick={handleNavigateToGrade}
        sx={{ mb: 1 }}
      >
        Gerenciar Grade Horária
      </Button>
      <Typography variant="body2" color="text.secondary" fontSize={12}>
        Organize horários, disciplinas e professores por turma
      </Typography>
    </Box>
  );
};

export default GradeHorariaCard;