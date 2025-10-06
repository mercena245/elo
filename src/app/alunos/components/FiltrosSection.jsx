import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button
} from '@mui/material';

const FiltrosSection = ({
  turmaSelecionada,
  setTurmaSelecionada,
  filtroNome,
  setFiltroNome,
  filtroMatricula,
  setFiltroMatricula,
  turmas,
  userRole,
  onNovoAluno
}) => {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', mb: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#374151' }}>
            🔍 Filtros e Pesquisa
          </Typography>
          {userRole === 'coordenadora' && (
            <Button
              variant="contained"
              onClick={onNovoAluno}
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5b5df1 0%, #7c3aed 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)'
                }
              }}
            >
              ➕ Novo Aluno
            </Button>
          )}
        </Box>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, 
          gap: 3 
        }}>
          {/* Filtro por Turma */}
          <FormControl fullWidth>
            <InputLabel>Filtrar por Turma</InputLabel>
            <Select
              value={turmaSelecionada}
              onChange={(e) => setTurmaSelecionada(e.target.value)}
              label="Filtrar por Turma"
            >
              <MenuItem value="todos">Todas as Turmas</MenuItem>
              {Object.entries(turmas).map(([id, turma]) => (
                <MenuItem key={id} value={id}>
                  {turma.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Filtro por Nome */}
          <TextField
            fullWidth
            label="Pesquisar por Nome"
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
            placeholder="Digite o nome do aluno..."
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#6366f1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6366f1',
                },
              },
            }}
          />
          
          {/* Filtro por Matrícula */}
          <TextField
            fullWidth
            label="Pesquisar por Matrícula"
            value={filtroMatricula}
            onChange={(e) => setFiltroMatricula(e.target.value)}
            placeholder="Digite a matrícula..."
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#6366f1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6366f1',
                },
              },
            }}
          />
        </Box>
        
        {/* Indicador de resultados */}
        {(filtroNome || filtroMatricula || turmaSelecionada !== 'todos') && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
              🔍 Filtros ativos: {[
                filtroNome && `Nome: "${filtroNome}"`,
                filtroMatricula && `Matrícula: "${filtroMatricula}"`,
                turmaSelecionada !== 'todos' && `Turma: "${turmas[turmaSelecionada]?.nome}"`
              ].filter(Boolean).join(' | ')}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default FiltrosSection;