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
import { db } from '../../../firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { auditService } from '../../../services/auditService';
import SeletorTurmaAluno from './SeletorTurmaAluno';

const RelatoriosPedagogicos = () => {
  const { user, userRole } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [relatorios, setRelatorios] = useState({});
  const [turmas, setTurmas] = useState({});
  const [disciplinas, setDisciplinas] = useState({});
  const [alunos, setAlunos] = useState({});
  
  // Estados de filtro
  const [selectedTurmas, setSelectedTurmas] = useState([]);
  const [selectedAlunos, setSelectedAlunos] = useState([]);
  const [minhasTurmas, setMinhasTurmas] = useState([]);
  
  // Estados do gerador de relatório
  const [geradorOpen, setGeradorOpen] = useState(false);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [relatorioGerado, setRelatorioGerado] = useState('');
  const [templateSelecionado, setTemplateSelecionado] = useState('desenvolvimento');
  const [detalhesAluno, setDetalhesAluno] = useState('');
  
  // Estados de visualização
  const [relatoriosOrganizados, setRelatoriosOrganizados] = useState([]);

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

      // Simulação de chamada para IA (Google Gemini)
      // Em produção, isso seria uma chamada real para a API
      const promptCompleto = `
        ${template.prompt}
        
        Dados do aluno:
        - Nome: ${aluno?.nomeCompleto || aluno?.nome || 'Aluno'}
        - Turma: ${turma?.nome || 'N/A'}
        - Data de nascimento: ${aluno?.dataNascimento || 'N/A'}
        
        Observações específicas da professora sobre o aluno:
        ${detalhesAluno || 'Nenhuma observação específica foi fornecida.'}
        
        Gere um relatório de aproximadamente 300-400 palavras, profissional e construtivo, 
        incorporando as observações específicas da professora quando relevantes.
      `;

      // Simulação de resposta da IA (substitua por chamada real à API)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const relatorioSimulado = `
**RELATÓRIO PEDAGÓGICO - ${template.nome.toUpperCase()}**

**Aluno:** ${aluno?.nomeCompleto || aluno?.nome || 'Aluno'}
**Turma:** ${turma?.nome || 'N/A'}
**Período:** ${new Date().toLocaleDateString('pt-BR')}
**Professora:** ${user?.displayName || user?.email}

**DESENVOLVIMENTO OBSERVADO:**

Durante o período avaliado, ${aluno?.nome || 'o(a) aluno(a)'} demonstrou evolução significativa em diversos aspectos do desenvolvimento. ${detalhesAluno ? `Conforme observado pela professora: "${detalhesAluno.slice(0, 150)}${detalhesAluno.length > 150 ? '...' : ''}". ` : ''}No âmbito cognitivo, observa-se crescimento na capacidade de concentração e resolução de problemas, alinhado com as competências gerais da BNCC.

**ASPECTOS SOCIOEMOCIONAIS:**

${aluno?.nome || 'O(a) estudante'} apresenta boa capacidade de relacionamento interpessoal, demonstrando empatia e colaboração nas atividades em grupo. Tem desenvolvido gradualmente a autorregulação emocional e a autonomia nas tarefas acadêmicas.

**PARTICIPAÇÃO E ENGAJAMENTO:**

A participação em atividades tem sido consistente, com contribuições relevantes durante as discussões em sala. ${detalhesAluno && detalhesAluno.toLowerCase().includes('participaç') ? 'As observações específicas da professora reforçam este aspecto positivo do desenvolvimento do aluno. ' : ''}Demonstra curiosidade e interesse pelas atividades propostas, mantendo uma postura proativa no processo de aprendizagem.

**PONTOS DE DESTAQUE:**

• Excelente capacidade de comunicação oral
• Criatividade na resolução de atividades
• Responsabilidade com as tarefas escolares
• Relacionamento respeitoso com colegas e professores${detalhesAluno ? '\n• Características específicas observadas pela professora foram consideradas nesta avaliação' : ''}

**SUGESTÕES PARA DESENVOLVIMENTO:**

Recomenda-se continuar estimulando a leitura diversificada e atividades que desenvolvam o pensamento crítico. O trabalho em equipe pode ser fortalecido através de projetos colaborativos que explorem diferentes linguagens e formas de expressão.

**CONSIDERAÇÕES FINAIS:**

${aluno?.nome || 'O(a) aluno(a)'} está em trajetória positiva de desenvolvimento, demonstrando potencial para alcançar os objetivos de aprendizagem estabelecidos. ${detalhesAluno ? 'As observações detalhadas da professora foram fundamentais para esta análise personalizada. ' : ''}O acompanhamento contínuo e o apoio familiar são fundamentais para a consolidação dos avanços observados.

*Relatório elaborado em conformidade com a Base Nacional Comum Curricular (BNCC) e diretrizes pedagógicas da instituição.*
      `;

      setRelatorioGerado(relatorioSimulado);

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
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

      await push(ref(db, 'relatorios-pedagogicos'), relatorioData);

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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PsychologyIcon color="primary" />
          Relatórios Pedagógicos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => setGeradorOpen(true)}
          sx={{ borderRadius: 2, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}
        >
          Gerar com IA
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
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
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                      <Button size="small" startIcon={<DownloadIcon />}>
                        Baixar PDF
                      </Button>
                      <Button size="small" startIcon={<EditIcon />}>
                        Editar
                      </Button>
                      {(userRole === 'coordenador' || userRole === 'coordenadora') && (
                        <Button size="small" color="success" startIcon={<SendIcon />}>
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
          </Grid>

          {gerandoRelatorio && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Gerando relatório com IA... Isso pode levar alguns segundos.
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