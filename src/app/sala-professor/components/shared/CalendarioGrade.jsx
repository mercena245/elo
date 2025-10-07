"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Schedule as ScheduleIcon,
  ChevronLeft,
  ChevronRight,
  School as SchoolIcon
} from '@mui/icons-material';

const CalendarioGrade = ({
  gradeHoraria = {},
  turmas = {},
  disciplinas = {},
  selectedTurmas = [],
  onCriarPlano,
  professorUid,
  userRole
}) => {
  const [semanaAtual, setSemanaAtual] = useState(new Date());
  const [aulasOrganizadas, setAulasOrganizadas] = useState({});
  const [minhasAulas, setMinhasAulas] = useState([]);

  const diasSemana = [
    { id: 1, nome: 'Segunda', abrev: 'SEG' },
    { id: 2, nome: 'Terça', abrev: 'TER' },
    { id: 3, nome: 'Quarta', abrev: 'QUA' },
    { id: 4, nome: 'Quinta', abrev: 'QUI' },
    { id: 5, nome: 'Sexta', abrev: 'SEX' }
  ];

  useEffect(() => {
    processarGradeHoraria();
  }, [gradeHoraria, selectedTurmas, professorUid, userRole]);

  useEffect(() => {
    organizarAulasPorDia();
  }, [minhasAulas, semanaAtual]);

  const processarGradeHoraria = () => {
    if (!gradeHoraria || typeof gradeHoraria !== 'object') {
      setMinhasAulas([]);
      return;
    }

    const aulasArray = [];
    
    Object.entries(gradeHoraria).forEach(([id, aula]) => {
      // Se é coordenador, mostra todas as aulas das turmas selecionadas
      if (userRole === 'coordenador' || userRole === 'coordenadora') {
        if (selectedTurmas.length === 0 || selectedTurmas.includes(aula.turmaId)) {
          aulasArray.push({ id, ...aula });
        }
      } 
      // Se é professor, mostra apenas suas aulas
      else if (aula.professorUid === professorUid) {
        if (selectedTurmas.length === 0 || selectedTurmas.includes(aula.turmaId)) {
          aulasArray.push({ id, ...aula });
        }
      }
    });

    setMinhasAulas(aulasArray);
  };

  const organizarAulasPorDia = () => {
    const aulasMap = {};
    
    // Inicializar todos os dias
    diasSemana.forEach(dia => {
      aulasMap[dia.id] = [];
    });

    // Organizar aulas por dia da semana
    minhasAulas.forEach(aula => {
      if (aula.diaSemana && aulasMap[aula.diaSemana]) {
        aulasMap[aula.diaSemana].push(aula);
      }
    });

    // Ordenar aulas por horário
    Object.keys(aulasMap).forEach(dia => {
      aulasMap[dia].sort((a, b) => {
        const horaA = a.horaInicio || '00:00';
        const horaB = b.horaInicio || '00:00';
        return horaA.localeCompare(horaB);
      });
    });

    setAulasOrganizadas(aulasMap);
  };

  const navegarSemana = (direcao) => {
    const novaSemana = new Date(semanaAtual);
    novaSemana.setDate(novaSemana.getDate() + (direcao * 7));
    setSemanaAtual(novaSemana);
    setSelectedWeek(novaSemana);
  };

  const getDataDaSemana = (diaSemana) => {
    const inicioSemana = new Date(semanaAtual);
    const diaAtual = inicioSemana.getDay();
    const diferenca = diaSemana - (diaAtual === 0 ? 7 : diaAtual);
    
    const dataDia = new Date(inicioSemana);
    dataDia.setDate(inicioSemana.getDate() + diferenca);
    
    return dataDia;
  };

  const formatarData = (data) => {
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const handleCriarPlano = (aula, data) => {
    const dadosPlano = {
      turmaId: aula.turmaId,
      disciplinaId: aula.disciplinaId,
      data: data.toISOString().split('T')[0],
      horaInicio: aula.horaInicio,
      horaFim: aula.horaFim,
      gradeHorariaId: aula.id
    };
    
    if (onCriarPlano) {
      onCriarPlano(dadosPlano);
    }
  };

  const getSemanaFormatada = () => {
    const inicio = getDataDaSemana(1);
    const fim = getDataDaSemana(5);
    
    return `${formatarData(inicio)} - ${formatarData(fim)}`;
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon color="primary" />
            Minha Grade Horária
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navegarSemana(-1)}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="subtitle1" sx={{ minWidth: 120, textAlign: 'center' }}>
              {getSemanaFormatada()}
            </Typography>
            <IconButton onClick={() => navegarSemana(1)}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        {minhasAulas.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Nenhuma aula encontrada na sua grade horária.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Entre em contato com a coordenação para configurar sua grade.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Horário</TableCell>
                  {diasSemana.map(dia => (
                    <TableCell key={dia.id} align="center" sx={{ fontWeight: 'bold' }}>
                      <Box>
                        <Typography variant="subtitle2">{dia.abrev}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatarData(getDataDaSemana(dia.id))}
                        </Typography>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Gerar linhas baseadas nos horários únicos */}
                {Array.from(new Set(
                  minhasAulas.map(aula => `${aula.horaInicio}-${aula.horaFim}`)
                )).sort().map(horario => {
                  const [inicio, fim] = horario.split('-');
                  
                  return (
                    <TableRow key={horario}>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        bgcolor: '#fafafa',
                        borderRight: '1px solid #e0e0e0'
                      }}>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          {inicio}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fim}
                        </Typography>
                      </TableCell>
                      
                      {diasSemana.map(dia => {
                        const aulaDoDia = aulasOrganizadas[dia.id]?.find(
                          aula => aula.horaInicio === inicio && aula.horaFim === fim
                        );
                        
                        return (
                          <TableCell 
                            key={dia.id} 
                            align="center" 
                            sx={{ 
                              p: 1,
                              minHeight: 80,
                              borderRight: '1px solid #e0e0e0'
                            }}
                          >
                            {aulaDoDia ? (
                              <Box sx={{ 
                                p: 1, 
                                bgcolor: '#e3f2fd', 
                                borderRadius: 1,
                                border: '1px solid #2196f3',
                                minHeight: 60,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                              }}>
                                <Box>
                                  <Typography variant="caption" sx={{ 
                                    fontWeight: 'bold',
                                    color: '#1976d2',
                                    display: 'block'
                                  }}>
                                    {disciplinas[aulaDoDia.disciplinaId]?.nome || 'Disciplina'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ 
                                    color: '#666',
                                    display: 'block'
                                  }}>
                                    {turmas[aulaDoDia.turmaId]?.nome || 'Turma'}
                                  </Typography>
                                </Box>
                                
                                <Tooltip title="Criar Plano de Aula">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCriarPlano(aulaDoDia, getDataDaSemana(dia.id))}
                                    sx={{ 
                                      bgcolor: '#1976d2',
                                      color: 'white',
                                      '&:hover': {
                                        bgcolor: '#1565c0'
                                      },
                                      width: 24,
                                      height: 24
                                    }}
                                  >
                                    <AddIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ) : (
                              <Box sx={{ 
                                height: 60,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'text.disabled'
                              }}>
                                -
                              </Box>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {minhasAulas.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              💡 Clique no ícone + dentro de uma aula para criar um plano específico
            </Typography>
            <Chip
              label={`${minhasAulas.length} aula(s) esta semana`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarioGrade;