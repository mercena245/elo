'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete
} from '@mui/material';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';

export default function SeletorTurmaAluno({ 
  onTurmaChange = () => {}, 
  onAlunoChange = () => {},
  showAlunosSelector = true,
  title = "🔍 Filtros de Seleção",
  filtrarTurmasPorProfessor = false, // Nova prop para filtrar turmas
  professorUid = null, // UID do professor para filtro
  userRole = null // Role do usuário
}) {
  const { user } = useAuthUser();
  const { getData, isReady } = useSchoolDatabase();
  const [turmas, setTurmas] = useState({});
  const [alunos, setAlunos] = useState([]);
  const [selectedTurma, setSelectedTurma] = useState('');
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minhasTurmas, setMinhasTurmas] = useState([]); // Turmas vinculadas ao professor

  useEffect(() => {
    if (!isReady) {
      console.log('⏳ [SeletorTurmaAluno] Aguardando conexão com banco da escola...');
      return;
    }
    
    const carregarDados = async () => {
      if (!user) return;

      try {
        console.log('SeletorTurmaAluno - Carregando dados...');
        
        // Carregar turmas e alunos usando getData
        const [turmasData, alunosData] = await Promise.all([
          getData('turmas'),
          getData('alunos')
        ]);
        
        console.log('SeletorTurmaAluno - Turmas:', turmasData);
        
        // Se deve filtrar por professor, buscar dados do usuário
        if (filtrarTurmasPorProfessor && professorUid && userRole === 'professora') {
          const userData = await getData(`usuarios/${professorUid}`);
          
          if (userData) {
            const turmasVinculadas = userData.turmas || [];
            setMinhasTurmas(turmasVinculadas);
            console.log('SeletorTurmaAluno - Turmas vinculadas ao professor:', turmasVinculadas);
            
            // Filtrar apenas turmas vinculadas
            const turmasFiltradas = {};
            turmasVinculadas.forEach(turmaId => {
              if (turmasData && turmasData[turmaId]) {
                turmasFiltradas[turmaId] = turmasData[turmaId];
              }
            });
            setTurmas(turmasFiltradas);
          } else {
            setTurmas({});
          }
        } else {
          // Coordenadora ou sem filtro - mostrar todas
          setTurmas(turmasData || {});
        }

        // Processar alunos
        const alunosArray = alunosData 
          ? Object.keys(alunosData).map(id => ({
              id,
              ...alunosData[id]
            }))
          : [];

        console.log('SeletorTurmaAluno - Alunos:', alunosArray);
        setAlunos(alunosArray);
        setLoading(false);
      } catch (error) {
        console.error('SeletorTurmaAluno - Erro:', error);
        setLoading(false);
      }
    };

    carregarDados();
  }, [user, isReady, filtrarTurmasPorProfessor, professorUid, userRole]);

  const handleTurmaChange = (event) => {
    const turmaId = event.target.value;
    console.log('SeletorTurmaAluno - Turma selecionada:', turmaId);
    setSelectedTurma(turmaId);
    setSelectedAluno(null); // Limpar seleção de aluno
    onTurmaChange(turmaId);
  };

  const handleAlunoChange = (event, value) => {
    console.log('SeletorTurmaAluno - Aluno selecionado:', value);
    setSelectedAluno(value);
    onAlunoChange(value);
  };

  // Filtrar alunos da turma selecionada
  const alunosFiltrados = selectedTurma && selectedTurma !== '' 
    ? alunos.filter(aluno => aluno.turmaId === selectedTurma)
    : alunos;

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography>Carregando dados...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      mb: { xs: 2, md: 3 }, 
      bgcolor: '#f8fafc',
      borderRadius: { xs: 1, md: 2 }
    }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography 
          variant="subtitle1" 
          fontWeight={600} 
          gutterBottom 
          color="primary"
          sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}
        >
          {title}
        </Typography>
        
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ width: '100%' }}>
          {/* Seletor de Turma */}
          <Grid item xs={12} md={showAlunosSelector ? 6 : 12}>
            <FormControl fullWidth sx={{ minWidth: '250px' }}>
              <InputLabel>Turma</InputLabel>
              <Select
                value={selectedTurma}
                label="Turma"
                onChange={handleTurmaChange}
                size={window.innerWidth < 900 ? 'small' : 'medium'}
              >
                <MenuItem value="">Todas as Turmas</MenuItem>
                {Object.entries(turmas).map(([id, turma]) => (
                  <MenuItem key={id} value={id}>
                    {turma.nome} ({turma.ano})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Seletor de Aluno */}
          {showAlunosSelector && (
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={alunosFiltrados}
                getOptionLabel={(aluno) => `${aluno.nome || ''} ${aluno.sobrenome || ''}`.trim() || 'Nome não informado'}
                value={selectedAluno}
                onChange={handleAlunoChange}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Pesquisar aluno..." 
                    fullWidth 
                    size={window.innerWidth < 900 ? 'small' : 'medium'}
                    sx={{ minWidth: '250px' }}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                disabled={!selectedTurma || selectedTurma === ''}
                placeholder={selectedTurma ? "Selecione um aluno" : "Selecione uma turma primeiro"}
                ListboxProps={{
                  style: {
                    maxHeight: 300
                  }
                }}
              />
            </Grid>
          )}
        </Grid>

        {/* Informações da seleção */}
        <Box sx={{ 
          mt: { xs: 1.5, md: 2 }, 
          p: { xs: 1.5, md: 2 }, 
          bgcolor: 'grey.100', 
          borderRadius: 1 
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
          >
            <strong>Turma selecionada:</strong> {
              selectedTurma && turmas[selectedTurma] 
                ? `${turmas[selectedTurma].nome} (${turmas[selectedTurma].ano})`
                : 'Nenhuma'
            }
          </Typography>
          {showAlunosSelector && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
            >
              <strong>Aluno selecionado:</strong> {
                selectedAluno 
                  ? `${selectedAluno.nome || ''} ${selectedAluno.sobrenome || ''}`.trim()
                  : 'Nenhum'
              }
            </Typography>
          )}
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
          >
            <strong>Alunos disponíveis:</strong> {alunosFiltrados.length}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}