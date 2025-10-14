"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  School as SchoolIcon,
  AutoAwesome as AutoAwesomeIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { ref, onValue, push, update, remove } from 'firebase/database';
;
import { useAuthUser } from '../../../hooks/useAuthUser';
import { auditService } from '../../../services/auditService';
import SeletorTurmaAluno from './SeletorTurmaAluno';
import geminiService from '../../../services/geminiService';
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';

const RelatoriosPedagogicos = () => {
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  // SEMPRE declare todos os hooks no topo!
  const { user, userRole } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [relatorios, setRelatorios] = useState({});
  const [turmas, setTurmas] = useState({});
  const [disciplinas, setDisciplinas] = useState({});
  const [alunos, setAlunos] = useState({});
  // Filtros
  const [selectedTurmas, setSelectedTurmas] = useState([]);
  const [selectedAlunos, setSelectedAlunos] = useState([]);
  const [minhasTurmas, setMinhasTurmas] = useState([]);
  // Gerador
  const [geradorOpen, setGeradorOpen] = useState(false);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [relatorioGerado, setRelatorioGerado] = useState('');
  const [templateSelecionado, setTemplateSelecionado] = useState('desenvolvimento');
  const [detalhesAluno, setDetalhesAluno] = useState('');
  // Visualização
  const [relatoriosOrganizados, setRelatoriosOrganizados] = useState([]);
  // Edição/feedback (devem estar aqui em cima também)
  const [editandoRelatorio, setEditandoRelatorio] = useState(null);
  const [conteudoEditado, setConteudoEditado] = useState('');
  const [feedback, setFeedback] = useState('');

  // Templates BNCC para relatórios
  const templatesBNCC = {
    desenvolvimento: {
      nome: 'Desenvolvimento Geral',
      descricao: 'Relatório de desenvolvimento baseado nas competências gerais da BNCC',
      prompt: `Gere um relatório pedagógico detalhado baseado na BNCC sobre o desenvolvimento do aluno. 
      Inclua: aspectos cognitivos, socioemocionais, participação em atividades, evolução acadêmica, 
      pontos de destaque e sugestões de desenvolvimento. Use linguagem profissional e educativa.`
    },
    comportamental: {
      nome: 'Comportamental e Social',
      descricao: 'Foco em aspectos comportamentais e sociais do aluno',
      prompt: `Elabore um relatório pedagógico focado nos aspectos comportamentais e sociais do aluno, 
      considerando as competências socioemocionais da BNCC. Analise: relacionamentos interpessoais, 
      autorregulação, participação em grupos, resolução de conflitos e desenvolvimento da autonomia.`
    },
    aprendizagem: {
      nome: 'Aprendizagem Específica',
      descricao: 'Relatório focado em habilidades específicas de aprendizagem',
      prompt: `Desenvolva um relatório pedagógico sobre as habilidades específicas de aprendizagem do aluno, 
      alinhado com a BNCC. Aborde: compreensão de conceitos, aplicação prática, dificuldades identificadas, 
      estratégias utilizadas e progressos observados nas áreas de conhecimento.`
    }
  };

  useEffect(() => {
    if (user?.uid) {
      carregarDados();
    }
  }, [user]);

  useEffect(() => {
    organizarRelatorios();
  }, [relatorios, selectedTurmas, selectedAlunos]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const refs = {
        relatorios: ref(db, 'relatorios-pedagogicos'),
        turmas: ref(db, 'turmas'),
        disciplinas: ref(db, 'disciplinas'),
        alunos: ref(db, 'alunos')
      };

      // Listeners
      const unsubscribes = [];

      unsubscribes.push(
        onValue(refs.relatorios, (snapshot) => {
          setRelatorios(snapshot.val() || {});
        })
      );

      unsubscribes.push(
        onValue(refs.turmas, (snapshot) => {
          const turmasData = snapshot.val() || {};
          setTurmas(turmasData);
          
          // Se é professor, filtrar só suas turmas
          if (userRole === 'professor' || userRole === 'professora') {
            const minhasTurmasIds = Object.keys(turmasData).filter(turmaId => {
              // Aqui você pode implementar a lógica para verificar se o professor leciona nesta turma
              // Por enquanto, retorna todas (pode ser refinado conforme a estrutura de dados)
              return true;
            });
            setMinhasTurmas(minhasTurmasIds);
          }
        })
      );

      unsubscribes.push(
        onValue(refs.disciplinas, (snapshot) => {
          setDisciplinas(snapshot.val() || {});
        })
      );

      unsubscribes.push(
        onValue(refs.alunos, (snapshot) => {
          setAlunos(snapshot.val() || {});
        })
      );

      return () => unsubscribes.forEach(unsub => unsub());
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizarRelatorios = () => {
    const relatoriosArray = Object.entries(relatorios).map(([id, relatorio]) => ({
      id,
      ...relatorio
    }));

    // Filtrar por professor (se não for coordenador)
    let relatoriosFiltrados = relatoriosArray;
    if (userRole !== 'coordenador' && userRole !== 'coordenadora') {
      relatoriosFiltrados = relatoriosArray.filter(relatorio => 
        relatorio.professorUid === user?.uid
      );
    }

    // Filtrar por turmas selecionadas
    if (selectedTurmas.length > 0) {
      relatoriosFiltrados = relatoriosFiltrados.filter(relatorio => 
        selectedTurmas.includes(relatorio.turmaId)
      );
    }

    // Filtrar por alunos selecionados
    if (selectedAlunos.length > 0 && selectedAlunos[0] !== 'todos') {
      relatoriosFiltrados = relatoriosFiltrados.filter(relatorio => 
        selectedAlunos.includes(relatorio.alunoId)
      );
    }

    // Ordenar por data (mais recentes primeiro)
    relatoriosFiltrados.sort((a, b) => {
      const dataA = new Date(a.criadoEm || 0);
      const dataB = new Date(b.criadoEm || 0);
      return dataB - dataA;
    });

    setRelatoriosOrganizados(relatoriosFiltrados);
  };

  const limparCamposGerador = () => {
    setRelatorioGerado('');
    setDetalhesAluno('');
    setTemplateSelecionado('desenvolvimento');
  };

  const gerarRelatorioComIA = async () => {
    if (!selectedAlunos.length || selectedAlunos[0] === 'todos') {
      alert('Selecione um aluno específico para gerar o relatório.');
      return;
    }

    setGerandoRelatorio(true);
    setRelatorioGerado('');

    try {
      const alunoId = selectedAlunos[0];
      const aluno = alunos[alunoId];
      const turma = turmas[selectedTurmas[0]];
      const template = templatesBNCC[templateSelecionado];

      // Verificar se o serviço Gemini está configurado
      if (!geminiService.isConfigurado()) {
        throw new Error(
          'IA não configurada. Configure a chave da API do Google Gemini em .env.local:\n' +
          'NEXT_PUBLIC_GEMINI_API_KEY=sua_chave_aqui\n\n' +
          'Obtenha sua chave gratuita em: https://aistudio.google.com/app/apikey'
        );
      }

      // Preparar dados do aluno para a IA
      const dadosAluno = {
        nome: aluno?.nomeCompleto || aluno?.nome || 'Aluno',
        turma: turma?.nome || 'N/A',
        dataNascimento: aluno?.dataNascimento || 'Não informado',
        professor: user?.displayName || user?.email || 'Professor(a)'
      };

      console.log('🤖 Gerando relatório com Google Gemini AI...');
      console.log('📋 Dados do aluno:', dadosAluno);
      console.log('📝 Template:', template.nome);
      console.log('💬 Detalhes personalizados:', detalhesAluno ? 'Sim' : 'Não');

      // Chamar o serviço Gemini AI
      const resultado = await geminiService.gerarRelatorioEducacional(
        dadosAluno,
        template,
        detalhesAluno
      );

      if (resultado.sucesso) {
        console.log('✅ Relatório gerado com sucesso!');
        setRelatorioGerado(resultado.relatorio);
      } else {
        throw new Error(resultado.erro || 'Erro desconhecido na geração do relatório');
      }

    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      
      // Mostrar erro amigável para o usuário
      let mensagemErro = 'Erro ao gerar relatório com IA.';
      
      if (error.message.includes('API key')) {
        mensagemErro = 'Configuração da IA necessária. Verifique as configurações do sistema.';
      } else if (error.message.includes('quota')) {
        mensagemErro = 'Limite de uso da IA atingido. Tente novamente mais tarde.';
      } else if (error.message.includes('network')) {
        mensagemErro = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      alert(`${mensagemErro}\n\nDetalhes técnicos: ${error.message}`);
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const salvarRelatorio = async () => {
    if (!relatorioGerado || !selectedAlunos.length || !selectedTurmas.length) {
      alert('Dados incompletos para salvar o relatório.');
      return;
    }

    try {
      const relatorioData = {
        alunoId: selectedAlunos[0],
        turmaId: selectedTurmas[0],
        professorUid: user.uid,
        professorNome: user.displayName || user.email,
        template: templateSelecionado,
        conteudo: relatorioGerado,
        detalhesAluno: detalhesAluno,
        statusAprovacao: userRole === 'coordenador' || userRole === 'coordenadora' ? 'aprovado' : 'pendente',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };

      await pushData('relatorios-pedagogicos', relatorioData);

      // Log de auditoria
      await auditService.logAction(
        'relatorio_pedagogico_create',
        user.uid,
        {
          description: `Criou relatório pedagógico para aluno ${alunos[selectedAlunos[0]]?.nome}`,
          alunoId: selectedAlunos[0],
          template: templateSelecionado
        }
      );

      alert('Relatório salvo com sucesso!');
      setGeradorOpen(false);
      limparCamposGerador();

    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      alert('Erro ao salvar relatório.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // ...existing code...

  // Função para aprovar relatório
  const aprovarRelatorio = async (relatorio) => {
    try {
      await updateData('relatorios-pedagogicos/${relatorio.id}', {
        statusAprovacao: 'aprovado',
        atualizadoEm: new Date().toISOString(),
      });
      await auditService.logAction('relatorio_pedagogico_aprovar', user.uid, {
        description: `Aprovou relatório pedagógico para aluno ${alunos[relatorio.alunoId]?.nome}`,
        alunoId: relatorio.alunoId,
        relatorioId: relatorio.id
      });
      setFeedback('Relatório aprovado com sucesso!');
    } catch (error) {
      setFeedback('Erro ao aprovar relatório.');
    }
  };

  // Função para baixar relatório como PDF
  const baixarPDF = async (relatorio) => {
    // Geração simples de PDF usando window.print para MVP
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Relatório Pedagógico</title></head><body>
      <h2>Relatório Pedagógico</h2>
      <p><b>Aluno:</b> ${alunos[relatorio.alunoId]?.nomeCompleto || alunos[relatorio.alunoId]?.nome || 'Aluno'}</p>
      <p><b>Turma:</b> ${turmas[relatorio.turmaId]?.nome || 'Turma'}</p>
      <p><b>Data:</b> ${new Date(relatorio.criadoEm).toLocaleDateString('pt-BR')}</p>
      <hr />
      <pre style="font-family:inherit;white-space:pre-wrap;">${relatorio.conteudo}</pre>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  // Função para abrir modal de edição
  const abrirEdicao = (relatorio) => {
    setEditandoRelatorio(relatorio);
    setConteudoEditado(relatorio.conteudo);
  };

  // Função para salvar edição
  const salvarEdicao = async () => {
    if (!editandoRelatorio) return;
    try {
      await updateData('relatorios-pedagogicos/${editandoRelatorio.id}', {
        conteudo: conteudoEditado,
        atualizadoEm: new Date().toISOString(),
      });
      await auditService.logAction('relatorio_pedagogico_editar', user.uid, {
        description: `Editou relatório pedagógico para aluno ${alunos[editandoRelatorio.alunoId]?.nome}`,
        alunoId: editandoRelatorio.alunoId,
        relatorioId: editandoRelatorio.id
      });
      setFeedback('Relatório editado com sucesso!');
      setEditandoRelatorio(null);
      setConteudoEditado('');
    } catch (error) {
      setFeedback('Erro ao editar relatório.');
    }
  };

  // Função para fechar feedback
  const fecharFeedback = () => setFeedback('');

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: { xs: 2, md: 3 },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
          }}
        >
          <PsychologyIcon color="primary" />
          Relatórios Pedagógicos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => setGeradorOpen(true)}
          sx={{ 
            borderRadius: 2, 
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            minWidth: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.875rem', md: '1rem' },
            py: { xs: 1.5, md: 1 }
          }}
        >
          Gerar com IA
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: { xs: 2, md: 3 }, borderRadius: { xs: 1, md: 2 } }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontSize: { xs: '1.125rem', md: '1.25rem' }
            }}
          >
            <AssignmentIcon color="primary" />
            Filtros
          </Typography>
          <SeletorTurmaAluno 
            showAlunosSelector={true}
            title="📊 Filtros para Relatórios"
            onTurmaChange={(turmaId) => setSelectedTurmas([turmaId])}
            onAlunoChange={(aluno) => setSelectedAlunos(aluno ? [aluno.id] : [])}
          />
        </CardContent>
      </Card>

      {/* Lista de Relatórios */}
      <Card sx={{ borderRadius: { xs: 1, md: 2 } }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontSize: { xs: '1.125rem', md: '1.25rem' }
            }}
          >
            <SchoolIcon color="primary" />
            Relatórios Criados ({relatoriosOrganizados.length})
          </Typography>

          {relatoriosOrganizados.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                💡 <strong>Nenhum relatório encontrado</strong>
              </Typography>
              <Typography variant="body2">
                Use o botão "Gerar com IA" para criar relatórios pedagógicos automáticos baseados na BNCC.
              </Typography>
            </Alert>
          ) : (
            <Box sx={{ mt: 2 }}>
              {relatoriosOrganizados.map((relatorio) => (
                <Accordion key={relatorio.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>
                        {alunos[relatorio.alunoId]?.nomeCompleto || alunos[relatorio.alunoId]?.nome || 'Aluno'}
                      </Typography>
                      <Chip
                        label={turmas[relatorio.turmaId]?.nome || 'Turma'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={templatesBNCC[relatorio.template]?.nome || relatorio.template}
                        size="small"
                        color="secondary"
                      />
                      <Chip
                        label={relatorio.statusAprovacao || 'pendente'}
                        size="small"
                        color={relatorio.statusAprovacao === 'aprovado' ? 'success' : 'warning'}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(relatorio.criadoEm).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                      {relatorio.conteudo}
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<DownloadIcon />} onClick={() => baixarPDF(relatorio)}>
                        Baixar PDF
                      </Button>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => abrirEdicao(relatorio)}>
                        Editar
                      </Button>
                      {(userRole === 'coordenador' || userRole === 'coordenadora') && relatorio.statusAprovacao !== 'aprovado' && (
                        <Button size="small" color="success" startIcon={<SendIcon />} onClick={() => aprovarRelatorio(relatorio)}>
                          Aprovar
                        </Button>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição de Relatório */}
      <Dialog open={!!editandoRelatorio} onClose={() => setEditandoRelatorio(null)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Relatório</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={8}
            value={conteudoEditado}
            onChange={e => setConteudoEditado(e.target.value)}
            label="Conteúdo do Relatório"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditandoRelatorio(null)}>Cancelar</Button>
          <Button onClick={salvarEdicao} variant="contained" color="primary">Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Feedback simples */}
      <Dialog open={!!feedback} onClose={fecharFeedback}>
        <DialogTitle>Mensagem</DialogTitle>
        <DialogContent>
          <Typography>{feedback}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharFeedback}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Gerador de Relatório */}
      <Dialog open={geradorOpen} onClose={() => { setGeradorOpen(false); limparCamposGerador(); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" />
          Gerador de Relatório com IA
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Template BNCC</InputLabel>
                <Select
                  value={templateSelecionado}
                  onChange={(e) => setTemplateSelecionado(e.target.value)}
                  label="Template BNCC"
                >
                  {Object.entries(templatesBNCC).map(([key, template]) => (
                    <MenuItem key={key} value={key}>
                      <Box>
                        <Typography variant="subtitle2">{template.nome}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.descricao}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Detalhes e observações específicas sobre o aluno"
                placeholder="Descreva comportamentos, habilidades, dificuldades, progressos ou qualquer observação que ajude a IA a gerar um relatório mais preciso..."
                value={detalhesAluno}
                onChange={(e) => setDetalhesAluno(e.target.value)}
                helperText="Quanto mais detalhes você fornecer, mais personalizado e preciso será o relatório gerado pela IA."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Alert severity="info">
                <Typography variant="caption">
                  Selecione um aluno e uma turma nos filtros acima para gerar o relatório.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                size="small"
                onClick={async () => {
                  const teste = await geminiService.testarConexao();
                  alert(teste.mensagem);
                }}
                sx={{ width: '100%' }}
              >
                🔧 Testar Conexão com IA
              </Button>
            </Grid>
          </Grid>

          {gerandoRelatorio && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                🤖 Gerando relatório com Google Gemini AI... Isso pode levar alguns segundos.
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {relatorioGerado && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Relatório Gerado:
              </Typography>
              <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-line' }}>
                {relatorioGerado}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setGeradorOpen(false); limparCamposGerador(); }}>
            Cancelar
          </Button>
          <Button 
            onClick={gerarRelatorioComIA} 
            variant="contained" 
            disabled={gerandoRelatorio || !selectedAlunos.length || selectedAlunos[0] === 'todos'}
            startIcon={<AutoAwesomeIcon />}
          >
            {gerandoRelatorio ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
          {relatorioGerado && (
            <Button onClick={salvarRelatorio} variant="contained" color="success">
              Salvar Relatório
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RelatoriosPedagogicos;