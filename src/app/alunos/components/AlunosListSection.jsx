import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Chip,
  IconButton,
  Collapse,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';

const AlunosListSection = ({
  alunosFiltrados,
  cardsExpandidos,
  toggleCardExpansao,
  editarAluno,
  confirmarInativacao,
  handleAbrirSelecaoTemplate,
  userRole,
  getTurmaNome
}) => {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#374151', mb: 3 }}>
          👥 Lista de Alunos
        </Typography>
        
        {alunosFiltrados.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhum aluno encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ajuste os filtros ou adicione um novo aluno
            </Typography>
          </Box>
        ) : (
          <List>
            {alunosFiltrados.map((aluno, index) => (
              <React.Fragment key={aluno.id}>
                <ListItem sx={{ 
                  borderRadius: 3, 
                  mb: 2, 
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                    borderColor: '#cbd5e1',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937' }}>
                            {aluno.nome}
                          </Typography>
                          <Chip
                            label={aluno.status || 'ativo'}
                            size="small"
                            color={aluno.status === 'ativo' ? 'success' : 'default'}
                            sx={{ fontWeight: 500 }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => editarAluno(aluno)}
                            sx={{ 
                              borderColor: '#6366f1',
                              color: '#6366f1',
                              '&:hover': {
                                borderColor: '#4f46e5',
                                backgroundColor: '#6366f1',
                                color: 'white'
                              }
                            }}
                          >
                            ✏️ Editar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleAbrirSelecaoTemplate(aluno)}
                            sx={{ 
                              borderColor: '#10b981',
                              color: '#10b981',
                              '&:hover': {
                                borderColor: '#059669',
                                backgroundColor: '#10b981',
                                color: 'white'
                              }
                            }}
                          >
                            📄 Gerar Contrato
                          </Button>
                          {userRole === 'coordenadora' && aluno.status === 'ativo' && (
                            <IconButton
                              size="small"
                              onClick={() => confirmarInativacao(aluno)}
                              sx={{ 
                                color: '#ef4444',
                                '&:hover': { 
                                  backgroundColor: '#fef2f2',
                                  color: '#dc2626'
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => toggleCardExpansao(aluno.id)}
                            sx={{ color: '#6b7280' }}
                          >
                            {cardsExpandidos[aluno.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Matrícula:</strong> {aluno.matricula || 'Não informada'} | 
                          <strong> Turma:</strong> {getTurmaNome(aluno.turmaId)} |
                          <strong> CPF:</strong> {aluno.cpf || 'Não informado'}
                        </Typography>
                        {aluno.telefone && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            <strong>Telefone:</strong> {aluno.telefone}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                
                {/* Seção expandida do card */}
                <Collapse in={cardsExpandidos[aluno.id]} timeout="auto" unmountOnExit>
                  <Box sx={{ 
                    ml: 2, 
                    mr: 2, 
                    mb: 2, 
                    p: 3, 
                    backgroundColor: '#ffffff',
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
                      📋 Detalhes do Aluno
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                      {/* Informações pessoais */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#6366f1', mb: 1 }}>
                          👤 Dados Pessoais
                        </Typography>
                        {aluno.dataNascimento && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Data de Nascimento:</strong> {new Date(aluno.dataNascimento).toLocaleDateString('pt-BR')}
                          </Typography>
                        )}
                        {aluno.email && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Email:</strong> {aluno.email}
                          </Typography>
                        )}
                        {aluno.endereco && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Endereço:</strong> {aluno.endereco.rua}, {aluno.endereco.numero} - {aluno.endereco.bairro}, {aluno.endereco.cidade}/{aluno.endereco.estado}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Informações acadêmicas */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#10b981', mb: 1 }}>
                          🎓 Dados Acadêmicos
                        </Typography>
                        {aluno.dataMatricula && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Data de Matrícula:</strong> {new Date(aluno.dataMatricula).toLocaleDateString('pt-BR')}
                          </Typography>
                        )}
                        {aluno.anoLetivo && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Ano Letivo:</strong> {aluno.anoLetivo}
                          </Typography>
                        )}
                        {aluno.observacoes && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Observações:</strong> {aluno.observacoes}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {/* Responsáveis */}
                    {(aluno.responsavelNome || aluno.responsavelTelefone) && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#f59e0b', mb: 1 }}>
                          👨‍👩‍👧‍👦 Responsáveis
                        </Typography>
                        {aluno.responsavelNome && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Nome:</strong> {aluno.responsavelNome}
                          </Typography>
                        )}
                        {aluno.responsavelTelefone && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Telefone:</strong> {aluno.responsavelTelefone}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default AlunosListSection;