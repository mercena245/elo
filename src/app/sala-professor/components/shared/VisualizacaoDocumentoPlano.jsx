"use client";
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  IconButton,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import RecursosPreview from './RecursosPreview';

/**
 * Função helper para formatar data corretamente do formato YYYY-MM-DD
 * Evita problemas de timezone ao criar Date object
 */
const formatarDataLocal = (dataString) => {
  if (!dataString) return '';
  
  // Se a data já está no formato DD/MM/YYYY, retornar diretamente
  if (dataString.includes('/')) return dataString;
  
  // Se está no formato YYYY-MM-DD, converter para DD/MM/YYYY sem criar Date object
  const partes = dataString.split('-');
  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }
  
  // Fallback: tentar usar toLocaleDateString
  try {
    // Adiciona 'T00:00:00' para forçar timezone local
    return new Date(dataString + 'T00:00:00').toLocaleDateString('pt-BR');
  } catch {
    return dataString;
  }
};

/**
 * Componente para visualização de planos de aula em formato de documento
 * Suporta tanto planos diários quanto por grade horária
 */
const VisualizacaoDocumentoPlano = ({ 
  open, 
  onClose, 
  plano, 
  turmas = {}, 
  disciplinas = {} 
}) => {
  if (!plano) return null;

  const isDiario = plano.tipo_plano === 'diario';

  // Debug: verificar estrutura do plano
  console.log('🔍 VisualizacaoDocumento - Plano recebido:', {
    id: plano.id,
    tipo_plano: plano.tipo_plano,
    isDiario,
    hasAulasDetalhadas: !!plano.aulasDetalhadas,
    aulasDetalhadas: plano.aulasDetalhadas,
    objetivosAprendizagem: plano.objetivosAprendizagem,
    keys: Object.keys(plano)
  });

  // Função para obter nome da turma
  const getNomeTurma = (turmaId) => {
    return turmas[turmaId]?.nome || 'Turma não encontrada';
  };

  // Função para obter nome da disciplina
  const getNomeDisciplina = (discId) => {
    return disciplinas[discId]?.nome || 'Disciplina não encontrada';
  };

  // Função para imprimir
  const handlePrint = () => {
    window.print();
  };

  // Renderiza seção de cabeçalho
  const renderCabecalho = () => (
    <Paper elevation={0} sx={{ 
      p: 3, 
      mb: 3, 
      backgroundColor: 'primary.main', 
      color: 'white',
      borderRadius: 2
    }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
        {isDiario 
          ? `Plano Diário - ${formatarDataLocal(plano.data)}`
          : (plano.titulo || 'Plano de Aula')
        }
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
        <Chip 
          icon={<CalendarIcon />} 
          label={formatarDataLocal(plano.data)}
          sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
        />
        
        {!isDiario && plano.horaInicio && plano.horaFim && (
          <Chip 
            icon={<AccessTimeIcon />} 
            label={`${plano.horaInicio} - ${plano.horaFim}`}
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        )}
        
        <Chip 
          icon={<SchoolIcon />} 
          label={getNomeTurma(plano.turmaId)}
          sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
        />
        
        {plano.statusAprovacao === 'aprovado' && (
          <Chip 
            icon={<CheckCircleIcon />} 
            label="Aprovado"
            sx={{ backgroundColor: 'success.main', color: 'white' }}
          />
        )}
      </Box>
    </Paper>
  );

  // Renderiza seção de informações gerais
  const renderInformacoesGerais = () => (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ 
        mb: 2, 
        fontWeight: 'bold',
        color: 'primary.main',
        borderBottom: '2px solid',
        borderColor: 'primary.main',
        pb: 1
      }}>
        📋 Informações Gerais
      </Typography>

      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
            Professor(a):
          </Typography>
          <Typography variant="body1">{plano.professorNome || 'Não informado'}</Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            <SchoolIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
            {isDiario ? 'Disciplina(s):' : 'Disciplina:'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
            {Array.isArray(plano.disciplinaId) ? (
              plano.disciplinaId.map(discId => (
                <Chip 
                  key={discId}
                  label={getNomeDisciplina(discId)}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              ))
            ) : (
              <Chip 
                label={getNomeDisciplina(plano.disciplinaId)}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {isDiario && plano.faixaEtaria && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              👶 Faixa Etária:
            </Typography>
            <Typography variant="body1">
              {plano.faixaEtaria === 'educacao_infantil' ? 'Educação Infantil' :
               plano.faixaEtaria === 'anos_iniciais' ? 'Anos Iniciais (1º ao 5º)' :
               plano.faixaEtaria === 'anos_finais' ? 'Anos Finais (6º ao 9º)' :
               plano.faixaEtaria === 'ensino_medio' ? 'Ensino Médio' :
               plano.faixaEtaria}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );

  // Renderiza detalhes de cada aula consolidados por seção (nova estrutura de planos diários)
  const renderAulasDetalhadasConsolidadas = () => {
    if (!isDiario || !plano.aulasDetalhadas || plano.aulasDetalhadas.length === 0) {
      return null;
    }

    const aulasComConteudo = plano.aulasDetalhadas.filter(aula => 
      aula.disciplinaNome || aula.disciplinaId
    );

    if (aulasComConteudo.length === 0) return null;

    return (
      <Box sx={{ mb: 3 }}>
        {/* Competências BNCC */}
        {aulasComConteudo.some(aula => aula.competenciasBNCC && aula.competenciasBNCC.length > 0) && (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: 'primary.main',
              borderBottom: '2px solid',
              borderColor: 'primary.main',
              pb: 1
            }}>
              📚 Competências BNCC
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {aulasComConteudo.map((aula, index) => (
                aula.competenciasBNCC && aula.competenciasBNCC.length > 0 && (
                  <Box key={index}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 1 }}>
                      {aula.disciplinaNome || getNomeDisciplina(aula.disciplinaId)}
                      {aula.horario && ` (${aula.horario})`}
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {aula.competenciasBNCC.map((comp, idx) => (
                        <Paper key={idx} elevation={0} sx={{ p: 1.5, mb: 1, backgroundColor: 'grey.50' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {typeof comp === 'string' ? comp : `${comp.codigo}`}
                          </Typography>
                          {typeof comp === 'object' && comp.descricao && (
                            <Typography variant="caption" color="text.secondary">
                              {comp.descricao}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )
              ))}
            </Box>
          </Paper>
        )}

        {/* Objetivos de Aprendizagem */}
        {aulasComConteudo.some(aula => aula.objetivosAprendizagem) && (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: 'primary.main',
              borderBottom: '2px solid',
              borderColor: 'primary.main',
              pb: 1
            }}>
              🎯 Objetivos de Aprendizagem
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {aulasComConteudo.map((aula, index) => (
                aula.objetivosAprendizagem && (
                  <Box key={index}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 1 }}>
                      {aula.disciplinaNome || getNomeDisciplina(aula.disciplinaId)}
                      {aula.horario && ` (${aula.horario})`}
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', pl: 2 }}>
                      {aula.objetivosAprendizagem}
                    </Typography>
                  </Box>
                )
              ))}
            </Box>
          </Paper>
        )}

        {/* Conteúdo */}
        {aulasComConteudo.some(aula => aula.conteudo) && (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: 'primary.main',
              borderBottom: '2px solid',
              borderColor: 'primary.main',
              pb: 1
            }}>
              📖 Conteúdo Programático
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {aulasComConteudo.map((aula, index) => (
                aula.conteudo && (
                  <Box key={index}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 1 }}>
                      {aula.disciplinaNome || getNomeDisciplina(aula.disciplinaId)}
                      {aula.horario && ` (${aula.horario})`}
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', pl: 2 }}>
                      {aula.conteudo}
                    </Typography>
                  </Box>
                )
              ))}
            </Box>
          </Paper>
        )}

        {/* Metodologia */}
        {aulasComConteudo.some(aula => aula.metodologia) && (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: 'primary.main',
              borderBottom: '2px solid',
              borderColor: 'primary.main',
              pb: 1
            }}>
              🔧 Metodologia
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {aulasComConteudo.map((aula, index) => (
                aula.metodologia && (
                  <Box key={index}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 1 }}>
                      {aula.disciplinaNome || getNomeDisciplina(aula.disciplinaId)}
                      {aula.horario && ` (${aula.horario})`}
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', pl: 2 }}>
                      {aula.metodologia}
                    </Typography>
                  </Box>
                )
              ))}
            </Box>
          </Paper>
        )}

        {/* Tarefa de Casa */}
        {aulasComConteudo.some(aula => aula.tarefaCasa) && (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: 'primary.main',
              borderBottom: '2px solid',
              borderColor: 'primary.main',
              pb: 1
            }}>
              🏠 Tarefa de Casa
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {aulasComConteudo.map((aula, index) => (
                aula.tarefaCasa && (
                  <Box key={index}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 1 }}>
                      {aula.disciplinaNome || getNomeDisciplina(aula.disciplinaId)}
                      {aula.horario && ` (${aula.horario})`}
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', pl: 2 }}>
                      {aula.tarefaCasa}
                    </Typography>
                  </Box>
                )
              ))}
            </Box>
          </Paper>
        )}

        {/* Recursos */}
        {aulasComConteudo.some(aula => aula.recursos && aula.recursos.length > 0) && (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: 'primary.main',
              borderBottom: '2px solid',
              borderColor: 'primary.main',
              pb: 1
            }}>
              📎 Recursos Didáticos
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {aulasComConteudo.map((aula, index) => (
                aula.recursos && aula.recursos.length > 0 && (
                  <Box key={index}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 1 }}>
                      {aula.disciplinaNome || getNomeDisciplina(aula.disciplinaId)}
                      {aula.horario && ` (${aula.horario})`}
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <RecursosPreview recursos={aula.recursos} variant="list" showDownload={true} />
                    </Box>
                  </Box>
                )
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    );
  };

  // Renderiza BNCC (apenas para planos diários antigos sem aulasDetalhadas)
  const renderBNCC = () => {
    if (!isDiario || plano.aulasDetalhadas || !plano.competenciasBNCC || plano.competenciasBNCC.length === 0) {
      return null;
    }

    return (
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ 
          mb: 2, 
          fontWeight: 'bold',
          color: 'primary.main',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          pb: 1
        }}>
          📚 Competências BNCC
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {plano.competenciasBNCC.map((comp, index) => (
            <Paper key={index} elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.5 }}>
                {typeof comp === 'string' ? comp : `${comp.codigo}`}
              </Typography>
              {typeof comp === 'object' && comp.descricao && (
                <Typography variant="body2" color="text.secondary">
                  {comp.descricao}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      </Paper>
    );
  };

  // Renderiza objetivos (apenas para planos por grade ou planos diários antigos)
  const renderObjetivos = () => {
    // Se for plano diário com nova estrutura, pula (renderizado em renderAulasDetalhadas)
    if (isDiario && plano.aulasDetalhadas) {
      return null;
    }

    const hasObjetivos = isDiario 
      ? plano.objetivosAprendizagem 
      : (Array.isArray(plano.objetivos) && plano.objetivos.length > 0);

    if (!hasObjetivos) return null;

    return (
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ 
          mb: 2, 
          fontWeight: 'bold',
          color: 'primary.main',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          pb: 1
        }}>
          🎯 Objetivos de Aprendizagem
        </Typography>

        {isDiario ? (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {plano.objetivosAprendizagem}
          </Typography>
        ) : (
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {plano.objetivos.map((obj, index) => (
              <li key={index}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {obj}
                </Typography>
              </li>
            ))}
          </Box>
        )}
      </Paper>
    );
  };

  // Renderiza conteúdo programático (apenas para planos por grade ou planos diários antigos)
  const renderConteudo = () => {
    // Se for plano diário com nova estrutura, pula (renderizado em renderAulasDetalhadas)
    if (isDiario && plano.aulasDetalhadas) {
      return null;
    }

    if (!plano.conteudo) return null;

    return (
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ 
          mb: 2, 
          fontWeight: 'bold',
          color: 'primary.main',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          pb: 1
        }}>
          📖 Conteúdo Programático
        </Typography>

        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {plano.conteudo}
        </Typography>
      </Paper>
    );
  };

  // Renderiza metodologia (apenas para planos por grade ou planos diários antigos)
  const renderMetodologia = () => {
    // Se for plano diário com nova estrutura, pula (renderizado em renderAulasDetalhadas)
    if (isDiario && plano.aulasDetalhadas) {
      return null;
    }

    if (!plano.metodologia) return null;

    return (
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ 
          mb: 2, 
          fontWeight: 'bold',
          color: 'primary.main',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          pb: 1
        }}>
          🔧 Metodologia
        </Typography>

        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {plano.metodologia}
        </Typography>
      </Paper>
    );
  };

  // Renderiza recursos (apenas para planos por grade ou planos diários antigos)
  const renderRecursos = () => {
    // Se for plano diário com nova estrutura, pula (renderizado em renderAulasDetalhadas)
    if (isDiario && plano.aulasDetalhadas) {
      return null;
    }

    const hasRecursos = Array.isArray(plano.recursos) && plano.recursos.length > 0;
    const hasRecursosString = typeof plano.recursos === 'string' && plano.recursos.trim();

    if (!hasRecursos && !hasRecursosString) return null;

    return (
      <Paper elevation={1} sx={{ 
        p: 3, 
        mb: 3,
        '@media print': {
          pageBreakInside: 'avoid'
        }
      }}>
        <Typography variant="h6" sx={{ 
          mb: 2, 
          fontWeight: 'bold',
          color: 'primary.main',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          pb: 1
        }}>
          📎 Recursos Didáticos
        </Typography>

        {hasRecursos ? (
          <RecursosPreview recursos={plano.recursos} variant="grid" showDownload={true} />
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ 
            fontStyle: 'italic',
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 1
          }}>
            {plano.recursos}
          </Typography>
        )}
      </Paper>
    );
  };

  // Renderiza avaliação
  const renderAvaliacao = () => {
    if (!plano.avaliacao) return null;

    return (
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ 
          mb: 2, 
          fontWeight: 'bold',
          color: 'primary.main',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          pb: 1
        }}>
          ✅ Avaliação
        </Typography>

        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {plano.avaliacao}
        </Typography>
      </Paper>
    );
  };

  // Renderiza tarefa de casa (apenas planos diários antigos sem aulasDetalhadas)
  const renderTarefaCasa = () => {
    if (!isDiario || plano.aulasDetalhadas || !plano.tarefaCasa) return null;

    return (
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ 
          mb: 2, 
          fontWeight: 'bold',
          color: 'primary.main',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          pb: 1
        }}>
          🏠 Tarefa de Casa
        </Typography>

        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {plano.tarefaCasa}
        </Typography>
      </Paper>
    );
  };

  // Renderiza observações
  const renderObservacoes = () => {
    if (!plano.observacoes) return null;

    return (
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ 
          mb: 2, 
          fontWeight: 'bold',
          color: 'primary.main',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          pb: 1
        }}>
          💭 Observações
        </Typography>

        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {plano.observacoes}
        </Typography>
      </Paper>
    );
  };

  // Renderiza rodapé
  const renderRodape = () => (
    <Paper elevation={0} sx={{ 
      p: 2, 
      backgroundColor: 'grey.100',
      borderTop: '3px solid',
      borderColor: 'primary.main',
      mt: 3
    }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        <strong>Data de criação:</strong> {new Date(plano.criadoEm || plano.data).toLocaleString('pt-BR')}
      </Typography>
      {plano.atualizadoEm && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          <strong>Última atualização:</strong> {new Date(plano.atualizadoEm).toLocaleString('pt-BR')}
        </Typography>
      )}
    </Paper>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          '@media print': {
            maxWidth: '100%',
            maxHeight: '100%',
            boxShadow: 'none',
            margin: 0
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        '@media print': {
          display: 'none'
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DescriptionIcon color="primary" />
          Visualização do Plano de Aula
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handlePrint} color="primary">
            <PrintIcon />
          </IconButton>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        p: 4,
        '@media print': {
          p: 2
        }
      }}>
        {renderCabecalho()}
        {renderInformacoesGerais()}
        {renderAulasDetalhadasConsolidadas()}
        {renderBNCC()}
        {renderObjetivos()}
        {renderConteudo()}
        {renderMetodologia()}
        {renderRecursos()}
        {renderAvaliacao()}
        {renderTarefaCasa()}
        {renderObservacoes()}
        {renderRodape()}
      </DialogContent>

      <DialogActions sx={{ 
        borderTop: '1px solid',
        borderColor: 'divider',
        p: 2,
        '@media print': {
          display: 'none'
        }
      }}>
        <Button onClick={handlePrint} startIcon={<PrintIcon />} variant="outlined">
          Imprimir
        </Button>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VisualizacaoDocumentoPlano;
