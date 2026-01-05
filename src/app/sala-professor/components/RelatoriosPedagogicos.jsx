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
      prompt: `Elabore um relatório pedagógico ABRANGENTE focado no desenvolvimento integral do aluno.

ASPECTOS OBRIGATÓRIOS A ABORDAR:

1. **DESENVOLVIMENTO COGNITIVO:**
   - Capacidade de compreensão e assimilação de novos conhecimentos
   - Raciocínio lógico e resolução de problemas
   - Memória e atenção durante as atividades
   - Criatividade e pensamento crítico
   
2. **DESENVOLVIMENTO SOCIOEMOCIONAL (BNCC - Competências Gerais 8, 9 e 10):**
   - Autoconhecimento e autocuidado
   - Empatia e cooperação
   - Responsabilidade e cidadania
   - Gestão de emoções e resiliência

3. **PARTICIPAÇÃO E ENGAJAMENTO:**
   - Interesse e motivação pelas atividades propostas
   - Frequência e pontualidade
   - Participação em aulas e discussões
   - Envolvimento em projetos e trabalhos em grupo

4. **EVOLUÇÃO ACADÊMICA:**
   - Progressos observados ao longo do período
   - Conquistas e avanços significativos
   - Comparação com expectativas de aprendizagem da série/ano
   - Apropriação de conteúdos trabalhados

5. **PONTOS DE DESTAQUE:**
   - Habilidades e talentos identificados
   - Áreas de maior facilidade e interesse
   - Potencialidades a serem estimuladas

6. **ÁREAS PARA DESENVOLVIMENTO:**
   - Aspectos que necessitam maior atenção
   - Dificuldades observadas (sempre de forma construtiva)
   - Estratégias que estão sendo aplicadas

Use as 10 Competências Gerais da BNCC como referência para análise integral do desenvolvimento.`
    },
    comportamental: {
      nome: 'Comportamental e Social',
      descricao: 'Foco em aspectos comportamentais e sociais do aluno',
      prompt: `Elabore um relatório pedagógico DETALHADO sobre os aspectos COMPORTAMENTAIS e SOCIAIS do aluno.

ASPECTOS OBRIGATÓRIOS A ABORDAR:

1. **RELACIONAMENTOS INTERPESSOAIS:**
   - Interação com colegas (cooperação, respeito, amizade)
   - Relacionamento com professores e funcionários
   - Habilidade de comunicação verbal e não-verbal
   - Capacidade de trabalhar em equipe
   - Empatia e consideração pelos sentimentos alheios

2. **AUTORREGULAÇÃO (BNCC - Competência Geral 8):**
   - Controle emocional em diferentes situações
   - Capacidade de lidar com frustrações
   - Persistência diante de desafios
   - Paciência e espera de sua vez
   - Gerenciamento do tempo e organização pessoal

3. **PARTICIPAÇÃO EM GRUPOS:**
   - Liderança e iniciativa
   - Escuta ativa das opiniões dos colegas
   - Contribuição em trabalhos coletivos
   - Respeito às regras de convivência
   - Adaptação a diferentes contextos sociais

4. **RESOLUÇÃO DE CONFLITOS:**
   - Estratégias utilizadas para resolver divergências
   - Capacidade de diálogo e negociação
   - Reações diante de situações desafiadoras
   - Pedidos de ajuda quando necessário
   - Mediação entre pares

5. **DESENVOLVIMENTO DA AUTONOMIA (BNCC - Competência Geral 10):**
   - Independência em tarefas cotidianas
   - Tomada de decisões responsáveis
   - Autocuidado e responsabilidade pessoal
   - Iniciativa e proatividade
   - Consciência de direitos e deveres

6. **VALORES E ATITUDES:**
   - Respeito à diversidade
   - Honestidade e integridade
   - Solidariedade e colaboração
   - Responsabilidade social e ambiental

Conecte as observações com as competências socioemocionais da BNCC e contexto escolar.`
    },
    aprendizagem: {
      nome: 'Aprendizagem Específica',
      descricao: 'Relatório focado em habilidades específicas de aprendizagem',
      prompt: `Desenvolva um relatório pedagógico ESPECÍFICO sobre as HABILIDADES DE APRENDIZAGEM do aluno.

ASPECTOS OBRIGATÓRIOS A ABORDAR:

1. **COMPREENSÃO DE CONCEITOS:**
   - Capacidade de entender conceitos novos
   - Estabelecimento de relações entre conteúdos
   - Profundidade de compreensão (superficial/aprofundada)
   - Transferência de conhecimento entre diferentes contextos
   - Questionamentos e curiosidade intelectual

2. **ÁREAS DE CONHECIMENTO (BNCC):**
   - Linguagens (Língua Portuguesa, Arte, Educação Física)
   - Matemática (raciocínio lógico, resolução de problemas)
   - Ciências da Natureza (investigação, experimentação)
   - Ciências Humanas (compreensão social e histórica)
   - Ensino Religioso (se aplicável)

3. **APLICAÇÃO PRÁTICA:**
   - Uso de conhecimentos em situações reais
   - Resolução de problemas cotidianos
   - Criatividade na aplicação de conceitos
   - Conexão teoria-prática
   - Produção de trabalhos e projetos

4. **HABILIDADES ESPECÍFICAS OBSERVADAS:**
   - Leitura: fluência, compreensão, interpretação
   - Escrita: ortografia, coerência, expressão
   - Cálculo: operações, raciocínio matemático
   - Oralidade: expressão, argumentação
   - Pesquisa: busca, seleção, organização de informações

5. **DIFICULDADES IDENTIFICADAS:**
   - Áreas específicas que apresentam desafios
   - Natureza das dificuldades (conceitual, procedimental, motivacional)
   - Hipóteses sobre as causas
   - Impacto no processo de aprendizagem geral

6. **ESTRATÉGIAS E INTERVENÇÕES:**
   - Metodologias que têm funcionado bem
   - Recursos didáticos mais eficazes
   - Adaptações realizadas
   - Apoios necessários (reforço, acompanhamento)
   - Parceria escola-família

7. **PROGRESSOS OBSERVADOS:**
   - Avanços em relação ao ponto de partida
   - Conquistas específicas do período
   - Comparação com objetivos de aprendizagem
   - Ritmo de evolução
   - Indicadores de desenvolvimento

Relacione as observações com as habilidades específicas da BNCC para a série/ano do aluno.`
    }
  };

  useEffect(() => {
    if (!isReady) {
      console.log('⏳ [RelatoriosPedagogicos] Aguardando conexão com banco da escola...');
      return;
    }
    
    if (user?.uid) {
      carregarDados();
    }
  }, [user, isReady]);

  useEffect(() => {
    organizarRelatorios();
  }, [relatorios, selectedTurmas, selectedAlunos]);

  const carregarDados = async () => {
    if (!isReady) return;
    
    try {
      setLoading(true);
      
      // Buscar dados usando getData
      const [relatoriosData, turmasData, disciplinasData, alunosData] = await Promise.all([
        getData('relatorios-pedagogicos'),
        getData('turmas'),
        getData('disciplinas'),
        getData('alunos')
      ]);

      setRelatorios(relatoriosData || {});
      setTurmas(turmasData || {});
      
      // Se é professor, filtrar só suas turmas
      if (userRole === 'professor' || userRole === 'professora') {
        const minhasTurmasIds = Object.keys(turmasData || {}).filter(turmaId => {
          // Aqui você pode implementar a lógica para verificar se o professor leciona nesta turma
          // Por enquanto, retorna todas (pode ser refinado conforme a estrutura de dados)
          return true;
        });
        setMinhasTurmas(minhasTurmasIds);
      }
      
      setDisciplinas(disciplinasData || {});
      setAlunos(alunosData || {});
      
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
        const relatorioProcessado = processarMarkdown(resultado.relatorio);
        setRelatorioGerado(relatorioProcessado);
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
          description: `Criou relatório pedagógico para aluno ${alunos[selectedAlunos[0]]?.nomeCompleto || alunos[selectedAlunos[0]]?.nome}`,
          alunoId: selectedAlunos[0],
          template: templateSelecionado
        }
      );

      // Recarregar dados para exibir o novo relatório
      await carregarDados();
      
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
      await updateData(`relatorios-pedagogicos/${relatorio.id}`, {
        statusAprovacao: 'aprovado',
        atualizadoEm: new Date().toISOString(),
      });
      await auditService.logAction('relatorio_pedagogico_aprovar', user.uid, {
        description: `Aprovou relatório pedagógico para aluno ${alunos[relatorio.alunoId]?.nomeCompleto || alunos[relatorio.alunoId]?.nome}`,
        alunoId: relatorio.alunoId,
        relatorioId: relatorio.id
      });
      await carregarDados();
      setFeedback('Relatório aprovado com sucesso!');
    } catch (error) {
      console.error('Erro ao aprovar relatório:', error);
      setFeedback('Erro ao aprovar relatório. Tente novamente.');
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
      await updateData(`relatorios-pedagogicos/${editandoRelatorio.id}`, {
        conteudo: conteudoEditado,
        atualizadoEm: new Date().toISOString(),
      });
      await auditService.logAction('relatorio_pedagogico_editar', user.uid, {
        description: `Editou relatório pedagógico para aluno ${alunos[editandoRelatorio.alunoId]?.nomeCompleto || alunos[editandoRelatorio.alunoId]?.nome}`,
        alunoId: editandoRelatorio.alunoId,
        relatorioId: editandoRelatorio.id
      });
      await carregarDados();
      setFeedback('Relatório editado com sucesso!');
      setEditandoRelatorio(null);
      setConteudoEditado('');
    } catch (error) {
      console.error('Erro ao editar relatório:', error);
      setFeedback('Erro ao editar relatório. Tente novamente.');
    }
  };

  // Função para fechar feedback
  const fecharFeedback = () => setFeedback('');

  // Função para processar markdown e formatar o relatório
  const processarMarkdown = (texto) => {
    if (!texto) return '';
    
    return texto
      // Remover múltiplas hashtags (## ou ### ou ####)
      .replace(/^#{1,6}\s+/gm, '')
      // Remover ** (negrito)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      // Remover * simples (itálico)
      .replace(/\*([^*]+)\*/g, '$1')
      // Remover --- (separadores)
      .replace(/^---$/gm, '')
      // Limpar linhas vazias excessivas (mais de 2 seguidas)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

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
                    <Box sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, fontSize: '0.95rem' }}>
                      {processarMarkdown(relatorio.conteudo)}
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
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ✏️ Relatório Gerado (Editável):
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={12}
                maxRows={20}
                value={relatorioGerado}
                onChange={(e) => setRelatorioGerado(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    lineHeight: 1.8,
                    bgcolor: '#f9fafb'
                  }
                }}
                helperText="💡 Você pode editar o texto acima antes de salvar"
              />
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