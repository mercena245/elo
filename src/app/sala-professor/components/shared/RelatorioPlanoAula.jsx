"use client";

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Grid
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  MenuBook as MenuBookIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import RecursosPreview from './RecursosPreview';

const RelatorioPlanoAula = ({ plano, turma, disciplina, escola }) => {
  console.log('📄 RelatorioPlanoAula renderizado:', {
    planoId: plano?.id,
    titulo: plano?.titulo,
    recursos: plano?.recursos,
    tipoRecursos: typeof plano?.recursos,
    isArray: Array.isArray(plano?.recursos),
    temUrl: plano?.recursos?.[0]?.url
  });

  const formatarData = (data) => {
    if (!data) return 'Não informada';
    return new Date(data).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getFaixaEtariaLabel = (faixaId) => {
    const faixas = {
      'creche': 'Educação Infantil - Creche (0 a 3 anos)',
      'pre_escola': 'Educação Infantil - Pré-escola (4 a 5 anos)',
      'ef_anos_iniciais_1_2': 'Ensino Fundamental - Anos Iniciais (1º e 2º ano)',
      'ef_anos_iniciais_3_5': 'Ensino Fundamental - Anos Iniciais (3º, 4º e 5º ano)',
      'ef_anos_finais_6_7': 'Ensino Fundamental - Anos Finais (6º e 7º ano)',
      'ef_anos_finais_8_9': 'Ensino Fundamental - Anos Finais (8º e 9º ano)',
      'ensino_medio': 'Ensino Médio'
    };
    return faixas[faixaId] || faixaId;
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 4,
        bgcolor: 'white',
        '@media print': {
          boxShadow: 'none',
          p: 3
        }
      }}
    >
      {/* Cabeçalho */}
      <Box sx={{ mb: 4, textAlign: 'center', borderBottom: '3px solid', borderColor: 'primary.main', pb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
          PLANO DE AULA
        </Typography>
        {escola && (
          <Typography variant="h6" color="text.secondary">
            {escola.nome}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
        </Typography>
      </Box>

      {/* Informações Principais */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
          {plano.titulo || 'Sem título'}
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SchoolIcon color="primary" fontSize="small" />
              <Typography variant="body1">
                <strong>Turma:</strong> {turma?.nome || 'Não informada'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <MenuBookIcon color="primary" fontSize="small" />
              <Typography variant="body1">
                <strong>Disciplina:</strong> {disciplina?.nome || 'Não informada'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarIcon color="primary" fontSize="small" />
              <Typography variant="body1">
                <strong>Data:</strong> {formatarData(plano.data)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ScheduleIcon color="primary" fontSize="small" />
              <Typography variant="body1">
                <strong>Horário:</strong> {plano.horaInicio && plano.horaFim ? `${plano.horaInicio} às ${plano.horaFim}` : 'Não informado'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonIcon color="primary" fontSize="small" />
              <Typography variant="body1">
                <strong>Professor(a):</strong> {plano.professorNome || 'Não informado'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircleIcon color="success" fontSize="small" />
              <Chip 
                label="APROVADO" 
                color="success" 
                size="small" 
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Faixa Etária */}
      {plano.faixaEtaria && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
            📚 Faixa Etária
          </Typography>
          <Typography variant="body1">
            {getFaixaEtariaLabel(plano.faixaEtaria)}
          </Typography>
        </Box>
      )}

      {/* Competências BNCC */}
      {plano.bncc && plano.bncc.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              🎯 Competências BNCC
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {plano.bncc.map((comp, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, flex: '1 1 100%' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.5 }}>
                    {comp.codigo}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {comp.descricao}
                  </Typography>
                  {comp.disciplina && (
                    <Chip label={comp.disciplina} size="small" color="secondary" variant="outlined" />
                  )}
                </Paper>
              ))}
            </Box>
          </Box>
        </>
      )}

      {/* Objetivos */}
      {plano.objetivos && plano.objetivos.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              🎯 Objetivos de Aprendizagem
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              {plano.objetivos.map((obj, index) => (
                <Typography component="li" key={index} variant="body1" sx={{ mb: 1 }}>
                  {obj}
                </Typography>
              ))}
            </Box>
          </Box>
        </>
      )}

      {/* Conteúdo Programático */}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
          📖 Conteúdo Programático
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
          {plano.conteudoProgramatico || 'Não informado'}
        </Typography>
      </Box>

      {/* Metodologia */}
      {plano.metodologia && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              🔬 Metodologia
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
              {plano.metodologia}
            </Typography>
          </Box>
        </>
      )}

      {/* Recursos */}
      {plano.recursos && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              🛠️ Recursos Didáticos
            </Typography>
            
            {/* Verifica se é array de arquivos (novo formato) ou array de strings (formato antigo) */}
            {Array.isArray(plano.recursos) && plano.recursos.length > 0 ? (
              // Novo formato: array de objetos com url
              plano.recursos[0]?.url ? (
                <RecursosPreview recursos={plano.recursos} variant="grid" showDownload={true} />
              ) : (
                // Formato antigo: array de strings/objetos simples
                <Box component="ul" sx={{ pl: 3 }}>
                  {plano.recursos.map((recurso, index) => (
                    <Typography component="li" key={index} variant="body1" sx={{ mb: 1 }}>
                      {typeof recurso === 'string' ? recurso : (recurso.nome || recurso)}
                      {recurso.quantidade && ` (${recurso.quantidade})`}
                    </Typography>
                  ))}
                </Box>
              )
            ) : typeof plano.recursos === 'string' && plano.recursos.trim() ? (
              // Formato string simples
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', fontStyle: 'italic' }}>
                {plano.recursos}
              </Typography>
            ) : null}
          </Box>
        </>
      )}

      {/* Atividades */}
      {plano.atividades && plano.atividades.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              📝 Atividades Propostas
            </Typography>
            {plano.atividades.map((atividade, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {index + 1}. {atividade.nome}
                  {atividade.duracao && (
                    <Chip 
                      label={`⏱️ ${atividade.duracao}`} 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
                {atividade.descricao && (
                  <Typography variant="body2" color="text.secondary">
                    {atividade.descricao}
                  </Typography>
                )}
              </Paper>
            ))}
          </Box>
        </>
      )}

      {/* Avaliação */}
      {plano.avaliacao && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              ✅ Avaliação
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
              {plano.avaliacao}
            </Typography>
          </Box>
        </>
      )}

      {/* Observações */}
      {plano.observacoes && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              💭 Observações
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
              {plano.observacoes}
            </Typography>
          </Box>
        </>
      )}

      {/* Rodapé com aprovação */}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Criado em:</strong> {formatarData(plano.criadoEm)}
            </Typography>
          </Grid>
          {plano.dataAprovacao && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="success.main">
                <strong>Aprovado em:</strong> {formatarData(plano.dataAprovacao)}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Espaço para assinaturas */}
      <Box sx={{ mt: 6, pt: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ borderTop: '1px solid #000', pt: 1, textAlign: 'center' }}>
              <Typography variant="body2">
                Assinatura do(a) Professor(a)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ borderTop: '1px solid #000', pt: 1, textAlign: 'center' }}>
              <Typography variant="body2">
                Assinatura do(a) Coordenador(a)
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default RelatorioPlanoAula;
