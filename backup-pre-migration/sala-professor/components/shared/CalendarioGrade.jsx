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
import { ref, get } from 'firebase/database';
import { db } from '../../../../firebase';

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
  const [periodosAula, setPeriodosAula] = useState({}); // Para buscar horários dos períodos
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

  // Carregar períodos de aula para obter horários
  useEffect(() => {
    const carregarPeriodosAula = async () => {
      try {
        const periodosRef = ref(db, 'Escola/PeriodosAula');
        const snapshot = await get(periodosRef);
        if (snapshot.exists()) {
          setPeriodosAula(snapshot.val());
        }
      } catch (error) {
        console.error('Erro ao carregar períodos de aula:', error);
      }
    };
    
    carregarPeriodosAula();
  }, []);

  const processarGradeHoraria = () => {
    console.log('🎯 CalendarioGrade - Processando grade horária:', {
      gradeHoraria,
      gradeHorariaType: typeof gradeHoraria,
      gradeHorariaKeys: Object.keys(gradeHoraria || {}),
      gradeHorariaValues: Object.values(gradeHoraria || {}),
      selectedTurmas,
      professorUid,
      userRole
    });
    
    if (!gradeHoraria || typeof gradeHoraria !== 'object') {
      console.log('❌ Grade horária inválida ou vazia');
      setMinhasAulas([]);
      return;
    }

    const aulasArray = [];
    
    Object.entries(gradeHoraria).forEach(([id, aula]) => {
      console.log('📝 Processando aula:', { id, aula, selectedTurmas, professorUid, userRole });
      
      // Se é coordenador, mostra todas as aulas das turmas selecionadas
      if (userRole === 'coordenador' || userRole === 'coordenadora') {
        if (selectedTurmas.length === 0 || selectedTurmas.includes(aula.turmaId)) {
          console.log('✅ Aula incluída (coordenador):', aula);
          aulasArray.push({ id, ...aula });
        } else {
          console.log('❌ Aula não incluída (turma não selecionada):', aula.turmaId);
        }
      } 
      // Se é professor, mostra apenas suas aulas (verificar professorUid ou professorId)
      else if ((aula.professorUid === professorUid) || (aula.professorId === professorUid)) {
        if (selectedTurmas.length === 0 || selectedTurmas.includes(aula.turmaId)) {
          console.log('✅ Aula incluída (professor):', aula);
          aulasArray.push({ id, ...aula });
        } else {
          console.log('❌ Aula não incluída (turma não selecionada):', aula.turmaId);
        }
      } 
      // Para professores, também mostrar todas as aulas das turmas selecionadas (visão de planejamento)
      else if ((userRole === 'professor' || userRole === 'professora') && (selectedTurmas.length === 0 || selectedTurmas.includes(aula.turmaId))) {
        console.log('✅ Aula incluída (visão de planejamento da turma):', aula);
        aulasArray.push({ id, ...aula });
      } else {
        console.log('❌ Aula não incluída:', {
          professorUid: aula.professorUid, 
          professorId: aula.professorId, 
          esperado: professorUid,
          turmaId: aula.turmaId,
          selectedTurmas
        });
      }
    });

    console.log('📋 Total de aulas processadas:', aulasArray.length);
    setMinhasAulas(aulasArray);
  };

  const organizarAulasPorDia = () => {
    console.log('📅 CalendarioGrade - Organizando aulas por dia:', minhasAulas);
    
    const aulasMap = {};
    
    // Inicializar todos os dias
    diasSemana.forEach(dia => {
      aulasMap[dia.id] = [];
    });

    // Organizar aulas por dia da semana
    minhasAulas.forEach(aula => {
      console.log(`📅 Organizando aula: diaSemana=${aula.diaSemana}, id=${aula.id}`);
      if (aula.diaSemana && aulasMap[aula.diaSemana]) {
        aulasMap[aula.diaSemana].push(aula);
        console.log(`✅ Aula adicionada ao dia ${aula.diaSemana}`);
      } else {
        console.log(`❌ Aula não organizada: diaSemana=${aula.diaSemana}, dias disponíveis:`, Object.keys(aulasMap));
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

    console.log('📅 CalendarioGrade - Aulas organizadas por dia:', aulasMap);
    setAulasOrganizadas(aulasMap);
  };

  const navegarSemana = (direcao) => {
    const novaSemana = new Date(semanaAtual);
    novaSemana.setDate(semanaAtual.getDate() + (direcao * 7));
    setSemanaAtual(novaSemana);
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
    // Buscar informações do período letivo da turma para limitação de datas
    const turma = turmas[aula.turmaId];
    const periodoLetivoId = turma?.periodoId;
    
    // Buscar horários do período de aula
    const periodo = periodosAula[aula.periodoAula];
    const horaInicio = periodo?.inicio || '';
    const horaFim = periodo?.fim || '';
    
    // Dados que o EditorPlanoAula espera receber
    const dadosPlano = {
      turmaId: aula.turmaId,
      disciplinaId: aula.disciplinaId,
      data: data.toISOString().split('T')[0], // YYYY-MM-DD
      gradeHorariaId: aula.id,
      diaSemana: aula.diaSemana,
      periodoAula: aula.periodoAula,
      periodoLetivoId: periodoLetivoId, // Para buscar datas do período
      // Horários vindos do período de aula
      horaInicio: horaInicio,
      horaFim: horaFim
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
            Grade Horária
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navegarSemana(-1)}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="body2" sx={{ minWidth: 120, textAlign: 'center' }}>
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
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Nenhuma aula encontrada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selecione uma turma para visualizar a grade horária
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: 120 }}>
                    <strong>Horário</strong>
                  </TableCell>
                  {diasSemana.map(dia => (
                    <TableCell key={dia.id} align="center" sx={{ fontWeight: 'bold' }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {dia.abrev}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatarData(getDataDaSemana(dia.id))}
                        </Typography>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Agrupar aulas por período/horário */}
                {Array.from(new Set(
                  minhasAulas.map(aula => aula.periodoAula || 'sem-periodo')
                )).map(periodoId => {
                  const aulasDoPeríodo = minhasAulas.filter(aula => 
                    (aula.periodoAula || 'sem-periodo') === periodoId
                  );
                  
                  return (
                    <TableRow key={periodoId}>
                      <TableCell sx={{ 
                        bgcolor: '#f1f5f9', 
                        fontWeight: 'medium', 
                        minWidth: 120,
                        verticalAlign: 'top'
                      }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {periodoId === 'sem-periodo' ? 'Período não definido' : `Período ${periodoId}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {/* Aqui poderia buscar horário do período */}
                            Horário
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      {diasSemana.map(dia => {
                        const aulaDoDia = aulasDoPeríodo.find(aula => aula.diaSemana === dia.id);
                        
                        return (
                          <TableCell 
                            key={dia.id} 
                            align="center" 
                            sx={{ 
                              p: 1,
                              verticalAlign: 'top',
                              minHeight: 80,
                              borderRight: '1px solid #e0e0e0'
                            }}
                          >
                            {aulaDoDia ? (
                              <Box 
                                sx={{ 
                                  p: 1.5, 
                                  bgcolor: '#e3f2fd', 
                                  borderRadius: 1,
                                  border: '1px solid #2196f3',
                                  minHeight: 70,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    bgcolor: '#bbdefb',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                  }
                                }}
                                onClick={() => handleCriarPlano(aulaDoDia, getDataDaSemana(dia.id))}
                              >
                                <Typography variant="caption" sx={{ 
                                  fontWeight: 'bold',
                                  color: '#1976d2',
                                  mb: 0.5,
                                  fontSize: '0.75rem'
                                }}>
                                  {disciplinas[aulaDoDia.disciplinaId]?.nome || 'Disciplina'}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  color: '#666',
                                  mb: 0.5,
                                  fontSize: '0.7rem'
                                }}>
                                  {turmas[aulaDoDia.turmaId]?.nome || 'Turma'}
                                </Typography>
                                
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5,
                                  justifyContent: 'center',
                                  mt: 'auto',
                                  pt: 0.5
                                }}>
                                  <AddIcon fontSize="small" color="primary" />
                                  <Typography variant="caption" color="primary" sx={{ 
                                    fontWeight: 'bold',
                                    fontSize: '0.7rem'
                                  }}>
                                    Plano
                                  </Typography>
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ 
                                minHeight: 70,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.3
                              }}>
                                <Typography variant="caption" color="text.secondary">
                                  -
                                </Typography>
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
              💡 Clique em uma aula para criar um plano específico
            </Typography>
            <Chip
              label={`${minhasAulas.length} aula(s) total`}
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