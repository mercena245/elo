"use client";

import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  Collapse, 
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Componente auxiliar para indicador de pré-matrícula (movido do arquivo principal)
const PreMatriculaIndicator = ({ aluno }) => {
  // Esta é uma versão simplificada - a lógica completa seria movida aqui
  return (
    <Chip 
      label="⏳" 
      size="small"
      sx={{ 
        bgcolor: '#fef3c7', 
        color: '#d97706',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        minWidth: '32px'
      }}
    />
  );
};

const AlunosList = ({ 
  alunosFiltrados,
  cardsExpandidos,
  toggleCardExpansao,
  getTurmaNome,
  onEditAluno,
  PreMatriculaDetalhes // Componente que seria criado separadamente
}) => {
  
  if (alunosFiltrados.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="body1" sx={{ color: '#6b7280', mb: 2 }}>
          😔 Nenhum aluno encontrado
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          Tente ajustar os filtros ou adicionar um novo aluno
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {alunosFiltrados.map((aluno, idx) => (
        <Box key={aluno.id || `${aluno.matricula}_${idx}`} sx={{ 
          mb: 2, 
          borderRadius: 3, 
          overflow: 'hidden', 
          border: '1px solid #e5e7eb',
          '&:hover': { 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transform: 'translateY(-2px)'
          },
          transition: 'all 0.3s ease'
        }}>
          <ListItem sx={{ 
            bgcolor: '#fafbff', 
            borderBottom: '1px solid #e0e7ff',
            py: 2
          }}>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                      {aluno.nome}
                    </Typography>
                    
                    <Chip 
                      label={aluno.status === 'ativo' ? '✅' : aluno.status === 'inativo' ? '❌' : '⏳'} 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        borderColor: aluno.status === 'ativo' ? '#059669' : aluno.status === 'inativo' ? '#dc2626' : '#d97706',
                        color: aluno.status === 'ativo' ? '#059669' : aluno.status === 'inativo' ? '#dc2626' : '#d97706',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        minWidth: '32px'
                      }}
                    />
                    
                    {/* Indicador de pendências para pré-matrícula */}
                    {aluno.status === 'pre_matricula' && (
                      <PreMatriculaIndicator aluno={aluno} />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onEditAluno(aluno)}
                      sx={{
                        minWidth: 'auto',
                        px: 1.5,
                        borderColor: '#6366f1',
                        color: '#6366f1',
                        '&:hover': {
                          bgcolor: '#f0f4ff',
                          borderColor: '#4f46e5'
                        }
                      }}
                    >
                      ✏️
                    </Button>
                    <IconButton
                      onClick={(e) => toggleCardExpansao(aluno.id || `${aluno.matricula}_${idx}`, e)}
                      sx={{
                        color: '#6366f1',
                        '&:hover': {
                          bgcolor: '#f0f4ff'
                        }
                      }}
                    >
                      {cardsExpandidos[aluno.id || `${aluno.matricula}_${idx}`] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                </Box>
              }
              secondary={
                <>
                  <Typography component="span" variant="body2" sx={{ color: '#6366f1', fontWeight: 500, mb: 0.5, display: 'block', mt: 1 }}>
                    📋 Matrícula: {aluno.matricula || '--'}
                  </Typography>
                  <Typography component="span" variant="body2" sx={{ color: '#059669', mb: 0.5, display: 'block' }}>
                    🏫 Turma: {getTurmaNome(aluno.turmaId)}
                  </Typography>
                </>
              }
            />
          </ListItem>
          
          {/* Seção expansível com dados detalhados */}
          <Collapse in={cardsExpandidos[aluno.id || `${aluno.matricula}_${idx}`]} timeout="auto" unmountOnExit>
            <Box sx={{ 
              mt: 1, 
              p: 2, 
              bgcolor: '#fafbff', 
              borderRadius: 2, 
              border: '1px solid #e0e7ff',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <Typography variant="subtitle2" sx={{ color: '#4f46e5', fontWeight: 'bold', mb: 2 }}>
                📊 Informações Detalhadas
              </Typography>
              
              {/* Seção especial para pré-matrícula */}
              {aluno.status === 'pre_matricula' && PreMatriculaDetalhes && (
                <Box sx={{ 
                  mb: 2, 
                  p: 2, 
                  bgcolor: '#fef7f0', 
                  borderRadius: 2, 
                  border: '1px solid #fed7aa' 
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#d97706', mb: 1 }}>
                    ⏳ Status de Pré-Matrícula
                  </Typography>
                  <PreMatriculaDetalhes aluno={aluno} />
                </Box>
              )}
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {/* Dados Pessoais */}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                    👤 Dados Pessoais
                  </Typography>
                  {aluno.dataNascimento && (
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                      🎂 Nascimento: {aluno.dataNascimento}
                    </Typography>
                  )}
                  {aluno.cpf && (
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                      🆔 CPF: {aluno.cpf}
                    </Typography>
                  )}
                  {aluno.endereco?.rua && (
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                      🏠 Endereço: {aluno.endereco.rua}, {aluno.endereco.bairro}
                    </Typography>
                  )}
                </Box>
                
                {/* Dados Financeiros */}
                {aluno.financeiro && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                      💰 Dados Financeiros
                    </Typography>
                    {aluno.financeiro.mensalidadeValor && (
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                        💵 Mensalidade: R$ {aluno.financeiro.mensalidadeValor.toFixed(2)}
                      </Typography>
                    )}
                    {aluno.financeiro.diaVencimento && (
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                        📅 Vencimento: Dia {aluno.financeiro.diaVencimento}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Collapse>
        </Box>
      ))}
    </List>
  );
};

export default AlunosList;