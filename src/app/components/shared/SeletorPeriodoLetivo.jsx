"use client";

import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  CircularProgress
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';

const SeletorPeriodoLetivo = ({ 
  value = '', 
  onChange = () => {}, 
  label = "Período Letivo",
  disabled = false,
  showCreateOption = false,
  size = "medium",
  fullWidth = true,
  sx = {}
}) => {
  // Hook para acessar banco da escola
  const { getData, isReady, error: dbError, currentSchool } = useSchoolDatabase();
  
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isReady) {
      carregarPeriodos();
    }
  }, [isReady, getData]);

  const carregarPeriodos = async () => {
    if (!isReady) {
      console.log('⏳ [SeletorPeriodo] Aguardando conexão com banco da escola...');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      console.log('📅 [SeletorPeriodo] Carregando períodos da escola:', currentSchool?.nome);
      const data = await getData('Escola/Periodo');
      if (data) {
        const lista = Object.entries(data)
          .map(([id, periodo]) => ({ id, ...periodo }))
          .sort((a, b) => {
            // Ordenar por ano desc, depois por período desc
            if (a.ano !== b.ano) return b.ano - a.ano;
            if (a.periodo !== b.periodo) return b.periodo - a.periodo;
            return new Date(b.dataInicio) - new Date(a.dataInicio);
          });
        setPeriodos(lista);
        
        // Se não há valor selecionado e há períodos, selecionar o primeiro ativo
        if (!value && lista.length > 0) {
          const periodoAtivo = lista.find(p => p.ativo) || lista[0];
          onChange(periodoAtivo.id);
        }
      } else {
        setPeriodos([]);
        setError('Nenhum período letivo encontrado');
      }
    } catch (err) {
      console.error('Erro ao carregar períodos:', err);
      setError('Erro ao carregar períodos letivos');
      setPeriodos([]);
    }
    setLoading(false);
  };

  const formatarPeriodo = (periodo) => {
    return `${periodo.ano} - ${periodo.periodo}º Período`;
  };

  const getStatusColor = (periodo) => {
    if (periodo.ativo) return 'success';
    const hoje = new Date();
    const dataFim = new Date(periodo.dataFim);
    return dataFim < hoje ? 'default' : 'warning';
  };

  const getStatusLabel = (periodo) => {
    if (periodo.ativo) return 'Ativo';
    const hoje = new Date();
    const dataFim = new Date(periodo.dataFim);
    return dataFim < hoje ? 'Finalizado' : 'Inativo';
  };

  if (loading) {
    return (
      <FormControl fullWidth={fullWidth} size={size} sx={sx} disabled>
        <InputLabel>{label}</InputLabel>
        <Select
          value=""
          label={label}
          disabled
        >
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Carregando períodos...</Typography>
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  if (error || periodos.length === 0) {
    return (
      <FormControl fullWidth={fullWidth} size={size} sx={sx} disabled>
        <InputLabel error>{label}</InputLabel>
        <Select
          value=""
          label={label}
          error
          disabled
        >
          <MenuItem disabled>
            <Typography variant="body2" color="error">
              {error || 'Nenhum período letivo cadastrado'}
            </Typography>
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  return (
    <FormControl fullWidth={fullWidth} size={size} sx={sx} disabled={disabled}>
      <InputLabel>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon fontSize="small" />
          {label}
        </Box>
      </InputLabel>
      <Select
        value={value?.id || ''}
        label={label}
        onChange={(e) => {
          const periodoSelecionado = periodos.find(p => p.id === e.target.value);
          onChange(periodoSelecionado || '');
        }}
      >
        {showCreateOption && (
          <MenuItem value="__criar_novo__" sx={{ fontStyle: 'italic', color: 'primary.main' }}>
            + Criar novo período letivo
          </MenuItem>
        )}
        
        {periodos.map((periodo) => (
          <MenuItem key={periodo.id} value={periodo.id}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              width: '100%',
              gap: 1
            }}>
              <Box>
                <Typography variant="body1" fontWeight={500}>
                  {formatarPeriodo(periodo)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(periodo.dataInicio).toLocaleDateString('pt-BR')} - {new Date(periodo.dataFim).toLocaleDateString('pt-BR')}
                </Typography>
              </Box>
              <Chip
                label={getStatusLabel(periodo)}
                color={getStatusColor(periodo)}
                size="small"
                variant={periodo.ativo ? 'filled' : 'outlined'}
              />
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SeletorPeriodoLetivo;