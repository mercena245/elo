"use client";

import React from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField 
} from '@mui/material';

const AlunosFiltros = ({ 
  turmaSelecionada, 
  setTurmaSelecionada, 
  filtroNome, 
  setFiltroNome, 
  filtroMatricula, 
  setFiltroMatricula, 
  turmas 
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      mb: 3, 
      p: 2, 
      borderRadius: 3, 
      bgcolor: '#f8fafc',
      border: '1px solid #e2e8f0'
    }}>
      <FormControl sx={{ 
        minWidth: 160,
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          '&:hover': {
            '& > fieldset': {
              borderColor: '#6366f1'
            }
          }
        }
      }}>
        <InputLabel id="turma-select-label">Turma</InputLabel>
        <Select
          labelId="turma-select-label"
          value={turmaSelecionada}
          label="Selecione a turma"
          onChange={e => setTurmaSelecionada(e.target.value)}
          required
        >
          <MenuItem value="todos">🌟 Todas as Turmas</MenuItem>
          {Object.entries(turmas).map(([id, turma]) => (
            <MenuItem key={id} value={id}>
              📚 {turma.nome}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <TextField
        label="🔍 Buscar por nome"
        variant="outlined"
        value={filtroNome}
        onChange={e => setFiltroNome(e.target.value)}
        sx={{ 
          flexGrow: 1,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&:hover': {
              '& > fieldset': {
                borderColor: '#6366f1'
              }
            }
          }
        }}
        placeholder="Digite o nome do aluno..."
      />
      
      <TextField
        label="🆔 Buscar por matrícula"
        variant="outlined"
        value={filtroMatricula}
        onChange={e => setFiltroMatricula(e.target.value)}
        sx={{ 
          minWidth: 180,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&:hover': {
              '& > fieldset': {
                borderColor: '#6366f1'
              }
            }
          }
        }}
        placeholder="Digite a matrícula..."
      />
    </Box>
  );
};

export default AlunosFiltros;