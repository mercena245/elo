"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid
} from '@mui/material';

const EditorPlanoAulaSimples = ({
  open,
  onClose,
  onSave,
  dadosIniciais,
  turmas = {},
  disciplinas = {},
  minhasTurmas,
  minhasDisciplinas
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    turmaId: '',
    disciplinaId: '',
    data: '',
    conteudoProgramatico: ''
  });
  
  const [errors, setErrors] = useState({});

  // Funções para obter nomes para exibição
  const getNomeTurma = () => {
    if (!formData.turmaId || !turmas) return '';
    const turma = turmas[formData.turmaId];
    if (!turma) return formData.turmaId;
    return `${turma.nome} ${turma.ano ? `- ${turma.ano}` : ''} ${turma.turno ? `(${turma.turno})` : ''}`.trim();
  };

  const getNomeDisciplina = () => {
    if (!formData.disciplinaId || !disciplinas) return '';
    const disciplina = disciplinas[formData.disciplinaId];
    if (!disciplina) return formData.disciplinaId;
    return disciplina.nome || disciplina.nomeDisciplina || 'Nome não definido';
  };

  useEffect(() => {
    if (open) {
      let novoFormData = {
        titulo: '',
        turmaId: '',
        disciplinaId: '',
        data: '',
        conteudoProgramatico: ''
      };
      
      if (dadosIniciais) {
        // Aplicar diretamente os dados da grade, sem verificação de arrays
        if (dadosIniciais.turmaId) {
          novoFormData.turmaId = dadosIniciais.turmaId;
        }
        
        if (dadosIniciais.disciplinaId) {
          novoFormData.disciplinaId = dadosIniciais.disciplinaId;
        }
        
        if (dadosIniciais.data) {
          novoFormData.data = dadosIniciais.data;
        }
      }
      
      setFormData(novoFormData);
      setErrors({});
    }
  }, [open, dadosIniciais]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSave = () => {
    const novoErros = {};
    
    if (!formData.titulo.trim()) novoErros.titulo = 'Título é obrigatório';
    if (!formData.turmaId) novoErros.turmaId = 'Turma é obrigatória';
    if (!formData.disciplinaId) novoErros.disciplinaId = 'Disciplina é obrigatória';
    if (!formData.data) novoErros.data = 'Data é obrigatória';
    
    if (Object.keys(novoErros).length > 0) {
      setErrors(novoErros);
      return;
    }
    
    onSave(formData);
  };

  const handleClose = () => {
    setFormData({
      titulo: '',
      turmaId: '',
      disciplinaId: '',
      data: '',
      conteudoProgramatico: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Novo Plano de Aula
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Título da Aula"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              error={!!errors.titulo}
              helperText={errors.titulo}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Turma"
              value={getNomeTurma()}
              InputProps={{
                readOnly: true,
              }}
              helperText="Definido pela grade horária"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Disciplina"
              value={getNomeDisciplina()}
              InputProps={{
                readOnly: true,
              }}
              helperText="Definido pela grade horária"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Data da Aula"
              value={formData.data}
              onChange={(e) => handleInputChange('data', e.target.value)}
              error={!!errors.data}
              helperText={errors.data}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Conteúdo Programático"
              value={formData.conteudoProgramatico}
              onChange={(e) => handleInputChange('conteudoProgramatico', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditorPlanoAulaSimples;