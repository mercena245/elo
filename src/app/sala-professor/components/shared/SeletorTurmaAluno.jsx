"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Typography,
  Divider,
  ListSubheader,
  Avatar,
  ListItemIcon,
  ListItemText,
  Checkbox
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Group as GroupIcon
} from '@mui/icons-material';

const SeletorTurmaAluno = ({
  turmas = {},
  alunos = {},
  selectedTurmas = [],
  setSelectedTurmas,
  selectedAlunos = [],
  setSelectedAlunos,
  minhasTurmas = [], // turmas do professor logado
  variant = 'outlined',
  showAlunosSelector = true,
  showTurmasSelector = true,
  disabled = false
}) => {
  const [alunosFiltrados, setAlunosFiltrados] = useState([]);

  useEffect(() => {
    filtrarAlunosPorTurmas();
  }, [selectedTurmas, alunos, turmas]);

  const filtrarAlunosPorTurmas = () => {
    if (!selectedTurmas.length) {
      setAlunosFiltrados([]);
      setSelectedAlunos([]);
      return;
    }

    const alunosDisponiveis = Object.values(alunos).filter(aluno => 
      selectedTurmas.includes(aluno.turmaId) && aluno.ativo !== false
    );

    setAlunosFiltrados(alunosDisponiveis);

    // Remover alunos selecionados que não estão mais nas turmas selecionadas
    const alunosValidosIds = alunosDisponiveis.map(aluno => aluno.id);
    const alunosAtualizados = selectedAlunos.filter(alunoId => 
      alunosValidosIds.includes(alunoId)
    );
    
    if (alunosAtualizados.length !== selectedAlunos.length) {
      setSelectedAlunos(alunosAtualizados);
    }
  };

  const handleTurmaChange = (event) => {
    const value = event.target.value;
    console.log('🔧 Turma selecionada:', value);
    
    // Garantir que seja sempre um array
    let newValue;
    if (Array.isArray(value)) {
      newValue = value;
    } else if (typeof value === 'string') {
      newValue = value === '' ? [] : value.split(',');
    } else {
      newValue = [value];
    }
    
    console.log('🔧 Valor final processado:', newValue);
    
    if (setSelectedTurmas && typeof setSelectedTurmas === 'function') {
      setSelectedTurmas(newValue);
      console.log('🔧 Estado atualizado com sucesso');
    } else {
      console.error('🔧 setSelectedTurmas não é uma função:', setSelectedTurmas);
    }
  };

  const handleAlunoChange = (event) => {
    const value = event.target.value;
    setSelectedAlunos(typeof value === 'string' ? value.split(',') : value);
  };

  const getTurmasDisponiveis = () => {
    if (!turmas || typeof turmas !== 'object') {
      return [];
    }
    
    const todasTurmas = Object.values(turmas);
    
    if (!minhasTurmas || minhasTurmas.length === 0) {
      return todasTurmas;
    }
    
    return todasTurmas.filter(turma => 
      minhasTurmas.includes(turma.id)
    );
  };

  const getAlunoNome = (aluno) => {
    return aluno.nomeCompleto || aluno.nome || `Aluno ${aluno.id}`;
  };

  const getTurmaNome = (turmaId) => {
    return turmas[turmaId]?.nome || `Turma ${turmaId}`;
  };

  const renderTurmaValue = (selected) => {
    if (selected.length === 0) return '';
    if (selected.length === 1) {
      return getTurmaNome(selected[0]);
    }
    return `${selected.length} turmas selecionadas`;
  };

  const renderAlunoValue = (selected) => {
    if (selected.length === 0) return '';
    if (selected.length === 1) {
      const aluno = alunos[selected[0]];
      return aluno ? getAlunoNome(aluno) : 'Aluno';
    }
    return `${selected.length} alunos selecionados`;
  };

  const turmasDisponiveis = getTurmasDisponiveis();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {showTurmasSelector && (
        <FormControl variant={variant} fullWidth disabled={disabled}>
          <InputLabel id="turmas-label">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon fontSize="small" />
              Turmas
            </Box>
          </InputLabel>
          <Select
            labelId="turmas-label"
            id="turmas-select"
            multiple
            value={selectedTurmas || []}
            onChange={handleTurmaChange}
            input={<OutlinedInput label="Turmas" />}
            renderValue={renderTurmaValue}
            sx={{ minHeight: 56, minWidth: '250px' }}
          >
            {turmasDisponiveis.length === 0 
              ? <MenuItem disabled>Nenhuma turma disponível</MenuItem>
              : turmasDisponiveis.map((turma) => (
                  <MenuItem key={turma.id} value={turma.id}>
                    <Checkbox 
                      checked={(selectedTurmas || []).indexOf(turma.id) > -1} 
                      sx={{ mr: 1 }}
                    />
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          bgcolor: 'primary.main',
                          fontSize: '0.75rem'
                        }}
                      >
                        {turma.nome?.charAt(0) || 'T'}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={turma.nome}
                      secondary={`${turma.serie || ''} ${turma.turno || ''}`.trim()}
                    />
                  </MenuItem>
                ))
            }
          </Select>
          
          {selectedTurmas.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedTurmas.map((turmaId) => (
                <Chip
                  key={turmaId}
                  label={getTurmaNome(turmaId)}
                  size="small"
                  onDelete={() => {
                    setSelectedTurmas(selectedTurmas.filter(id => id !== turmaId));
                  }}
                  disabled={disabled}
                />
              ))}
            </Box>
          )}
        </FormControl>
      )}

      {showAlunosSelector && (
        <FormControl 
          variant={variant} 
          fullWidth 
          disabled={disabled || selectedTurmas.length === 0}
        >
          <InputLabel id="alunos-label">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" />
              Alunos {selectedTurmas.length === 0 && '(selecione uma turma primeiro)'}
            </Box>
          </InputLabel>
          <Select
            labelId="alunos-label"
            id="alunos-select"
            multiple
            value={selectedAlunos}
            onChange={handleAlunoChange}
            input={<OutlinedInput label="Alunos" />}
            renderValue={renderAlunoValue}
            sx={{ minHeight: 56, minWidth: '250px' }}
          >
            {alunosFiltrados.length === 0 
              ? <MenuItem disabled>
                  {selectedTurmas.length === 0 
                    ? 'Selecione uma turma primeiro'
                    : 'Nenhum aluno encontrado'
                  }
                </MenuItem>
              : [
                  <MenuItem key="todos" value="todos">
                    <ListItemIcon>
                      <GroupIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Todos os alunos"
                      secondary={`${alunosFiltrados.length} alunos disponíveis`}
                    />
                  </MenuItem>,
                  ...alunosFiltrados.map((aluno) => (
                    <MenuItem key={aluno.id} value={aluno.id}>
                      <ListItemIcon>
                        <Avatar 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            bgcolor: 'secondary.main',
                            fontSize: '0.75rem'
                          }}
                        >
                          {getAlunoNome(aluno).charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={getAlunoNome(aluno)}
                        secondary={`Matrícula: ${aluno.matricula || 'N/A'}`}
                      />
                    </MenuItem>
                  ))
                ]
            }
          </Select>
          
          {selectedAlunos.length > 0 && selectedAlunos[0] !== 'todos' && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedAlunos.map((alunoId) => {
                const aluno = alunos[alunoId];
                return (
                  <Chip
                    key={alunoId}
                    label={aluno ? getAlunoNome(aluno) : 'Aluno'}
                    size="small"
                    onDelete={() => {
                      setSelectedAlunos(selectedAlunos.filter(id => id !== alunoId));
                    }}
                    disabled={disabled}
                  />
                );
              })}
            </Box>
          )}
        </FormControl>
      )}

      {(selectedTurmas.length > 0 || selectedAlunos.length > 0) && (
        <Box sx={{ 
          p: 2, 
          bgcolor: 'grey.50', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Seleção atual:
          </Typography>
          
          {selectedTurmas.length > 0 && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              📚 <strong>Turmas:</strong> {selectedTurmas.map(id => getTurmaNome(id)).join(', ')}
            </Typography>
          )}
          
          {selectedAlunos.length > 0 && (
            <Typography variant="body2">
              👥 <strong>Alunos:</strong> {
                selectedAlunos[0] === 'todos' 
                  ? `Todos (${alunosFiltrados.length})`
                  : selectedAlunos.length === alunosFiltrados.length
                    ? `Todos (${selectedAlunos.length})`
                    : `${selectedAlunos.length} selecionados`
              }
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SeletorTurmaAluno;