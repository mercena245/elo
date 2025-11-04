"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import {
  Print as PrintIcon,
  CalendarMonth as CalendarIcon,
  School as SchoolIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useSchoolDatabase } from '@/hooks/useSchoolDatabase';
import { useSchoolServices } from '@/hooks/useSchoolServices';
import { useAuth } from '@/context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

// Configurar dayjs para português
dayjs.locale('pt-br');

const DiarioClasse = () => {
  const { getData } = useSchoolDatabase();
  const { isReady } = useSchoolServices();
  const { user, role } = useAuth();
  const componentRef = useRef();

  // Hook para impressão
  const reactToPrintFn = useReactToPrint({
    contentRef: componentRef,
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 0.5cm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-container {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 10px !important;
        }
        .page-break {
          page-break-before: always !important;
          break-before: page !important;
        }
        .no-print {
          display: none !important;
        }
        table {
          width: 100% !important;
          table-layout: fixed !important;
        }
      }
    `,
  });

  // Função de impressão com título dinâmico
  const handlePrint = () => {
    if (dadosDiario) {
      document.title = `Diario_Classe_${dadosDiario.turma?.nome || 'Turma'}_${dayjs(mesAno).format('MM-YYYY')}`;
    }
    reactToPrintFn();
  };

  // Estados
  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [headerConfig, setHeaderConfig] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  
  // Filtros
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [mesAno, setMesAno] = useState(dayjs().format('YYYY-MM'));
  const [professorId, setProfessorId] = useState('');
  
  // Dados do diário
  const [dadosDiario, setDadosDiario] = useState(null);
  const [loading, setLoading] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    if (!isReady) return;
    carregarDadosIniciais();
  }, [isReady]);

  // Detectar professor automaticamente
  useEffect(() => {
    if (user && (role === 'professor' || role === 'professora')) {
      console.log('🔍 DEBUG - Auto-detecção professor:', {
        email: user.email,
        role: role,
        totalProfessores: professores.length
      });
      
      // Buscar o professor pelo email do usuário
      const professorAtual = professores.find(p => p.email === user.email);
      if (professorAtual) {
        setProfessorId(professorAtual.id);
        console.log('✅ Professor detectado:', professorAtual.nome);
      } else {
        console.warn('⚠️ Professor não encontrado para email:', user.email);
      }
    }
  }, [user, role, professores]);

  const carregarDadosIniciais = async () => {
    try {
      const [
        turmasData,
        alunosData,
        planosData,
        professoresData,
        headerData,
        escolaData
      ] = await Promise.all([
        getData('turmas'),
        getData('alunos'),
        getData('planos-aula'),
        getData('colaboradores'),
        getData('configuracoes/header'),
        getData('configuracoes/escola')
      ]);

      const turmasArray = turmasData ? Object.entries(turmasData).map(([id, data]) => ({ id, ...data })) : [];
      const alunosArray = alunosData ? Object.entries(alunosData).map(([id, data]) => ({ id, ...data })) : [];
      const planosArray = planosData ? Object.entries(planosData).map(([id, data]) => ({ id, ...data })) : [];
      
      // Filtrar professores - aceita funcao, cargo ou tipo
      const profsArray = professoresData ? Object.entries(professoresData)
        .map(([id, data]) => ({ id, ...data }))
        .filter(p => {
          const funcao = (p.funcao || p.cargo || p.tipo || '').toLowerCase();
          return funcao.includes('professor') || funcao.includes('professora');
        }) : [];

      setTurmas(turmasArray);
      setAlunos(alunosArray);
      setPlanos(planosArray);
      setProfessores(profsArray);
      
      // Configurações da escola
      setHeaderConfig(headerData || {});
      setSchoolInfo(escolaData || {});
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    }
  };

  // Gerar dados do diário
  const gerarDiario = async () => {
    if (!turmaSelecionada || !mesAno) {
      return;
    }

    setLoading(true);
    try {
      const turma = turmas.find(t => t.id === turmaSelecionada);
      if (!turma) return;

      // Filtrar alunos da turma (ativos)
      const alunosDaTurma = alunos
        .filter(a => a.turmaId === turmaSelecionada && a.status === 'ativo')
        .sort((a, b) => a.nome.localeCompare(b.nome));

      // Buscar frequências do mês (usar frequencia normal)
      const frequenciasData = await getData('frequencia');
      const frequencias = frequenciasData ? Object.entries(frequenciasData)
        .map(([id, data]) => ({ id, ...data }))
        .filter(f => 
          f.turmaId === turmaSelecionada &&
          dayjs(f.data).format('YYYY-MM') === mesAno
        ) : [];

      // Buscar planos de aula do mês
      const planosDoMes = planos.filter(p => 
        p.turmaId === turmaSelecionada &&
        dayjs(p.data).format('YYYY-MM') === mesAno
      ).sort((a, b) => new Date(a.data) - new Date(b.data));

      // Buscar professor da turma
      const professor = professores.find(p => p.id === professorId || p.id === turma.professorId);

      // Calcular faltas por aluno
      const faltasPorAluno = {};
      alunosDaTurma.forEach(aluno => {
        const faltasAluno = frequencias.filter(f => 
          f.presencas && f.presencas[aluno.id] === false
        );
        faltasPorAluno[aluno.id] = faltasAluno.length;
      });

      // Processar planos com aulasDetalhadas
      const datasComAtividades = planosDoMes.map(plano => {
        // Se tem aulasDetalhadas, extrair dados de lá
        if (plano.aulasDetalhadas && plano.aulasDetalhadas.length > 0) {
          // Para cada aula detalhada, criar uma disciplina
          const disciplinasPorData = [];
          
          plano.aulasDetalhadas.forEach(aula => {
            // Criar objeto de disciplina baseado na aula
            const disciplina = {
              nome: aula.disciplinaNome,
              disciplina: aula.disciplinaNome,
              id: aula.disciplinaId,
              conteudo: aula.conteudo,
              objetivos: aula.objetivosAprendizagem,
              metodologia: aula.metodologia,
              habilidadesBNCC: aula.competenciasBNCC || [],
              // Campos adicionais
              tarefaCasa: aula.tarefaCasa,
              horario: aula.horario,
              faixaEtaria: aula.faixaEtaria
            };

            disciplinasPorData.push(disciplina);
          });

          return [{
            data: plano.data, // Usar data do plano pai
            tema: plano.tema || 'Aulas Programadas',
            disciplinas: disciplinasPorData, // Array com todas as disciplinas
            conteudo: '', // Conteúdo vai estar nas disciplinas individuais
            objetivos: '',
            metodologia: '',
            recursos: [],
            habilidadesBNCC: []
          }];
        }
        
        // Fallback para estrutura simples (raramente usado)
        return [{
          data: plano.data,
          tema: plano.tema || plano.titulo,
          disciplinas: plano.disciplinas || [],
          conteudo: plano.conteudo || plano.descricao,
          objetivos: plano.objetivos,
          metodologia: plano.metodologia,
          recursos: plano.recursos,
          habilidadesBNCC: plano.habilidadesBNCC || [],
          competenciasBNCC: plano.competenciasBNCC || []
        }];
      }).flat();

      setDadosDiario({
        turma,
        professor,
        alunos: alunosDaTurma,
        frequencias,
        planosDoMes: datasComAtividades, // Usar dados processados em vez de raw
        faltasPorAluno,
        datasComAtividades,
        mesAno,
        schoolInfo: schoolInfo || { nome: 'ESCOLA' },
        headerConfig: headerConfig || {}
      });
    } catch (error) {
      console.error('Erro ao gerar diário:', error);
    } finally {
      setLoading(false);
    }
  };

  // Imprimir diário
  const imprimirDiario = () => {
    window.print();
  };

  // Obter dias do mês
  const getDiasDoMes = () => {
    const [ano, mes] = mesAno.split('-');
    const diasNoMes = dayjs(`${ano}-${mes}-01`).daysInMonth();
    const dias = [];
    
    for (let dia = 1; dia <= diasNoMes; dia++) {
      dias.push(dia);
    }
    
    return dias;
  };

  // Verificar se aluno faltou em uma data
  const verificarFalta = (alunoId, dia) => {
    if (!dadosDiario) return '';
    
    const dataCompleta = `${mesAno}-${String(dia).padStart(2, '0')}`;
    
    // Buscar todas as frequências do aluno nesta data
    const frequenciasDoDia = dadosDiario.frequencias.filter(f => 
      f.alunoId === alunoId && 
      dayjs(f.data).format('YYYY-MM-DD') === dataCompleta
    );
    
    if (frequenciasDoDia.length === 0) return ''; // Sem registro
    
    // Se tem registro, verificar se faltou em TODAS as disciplinas
    const totalFaltas = frequenciasDoDia.filter(f => f.presente === false).length;
    const totalRegistros = frequenciasDoDia.length;
    
    // Se faltou em TODAS as disciplinas que tem registro = falta no dia
    if (totalFaltas === totalRegistros && totalFaltas > 0) {
      return 'F';
    }
    
    // Se tem pelo menos uma presença = presente no dia
    return '';
  };

  if (!isReady) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Carregando dados da escola...</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Área de Filtros - Oculta na impressão */}
      <Card sx={{ mb: 3, '@media print': { display: 'none' } }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon color="primary" />
            Filtros do Diário de Classe
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth sx={{ minWidth: '250px' }}>
                <InputLabel>Turma</InputLabel>
                <Select
                  value={turmaSelecionada}
                  onChange={(e) => setTurmaSelecionada(e.target.value)}
                  label="Turma"
                >
                  {turmas.map(turma => (
                    <MenuItem key={turma.id} value={turma.id}>
                      {turma.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Mês/Ano"
                type="month"
                value={mesAno}
                onChange={(e) => setMesAno(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth sx={{ minWidth: '250px' }} disabled={role === 'professor' || role === 'professora'}>
                <InputLabel>Professor(a)</InputLabel>
                <Select
                  value={professorId}
                  onChange={(e) => setProfessorId(e.target.value)}
                  label="Professor(a)"
                >
                  {professores.map(professor => (
                    <MenuItem key={professor.id} value={professor.id}>
                      {professor.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={12} md={3}>
              <Button 
                fullWidth
                variant="outlined" 
                onClick={() => {
                  setTurmaSelecionada('');
                  setMesAno(dayjs().format('YYYY-MM'));
                  setProfessorId('');
                  setDadosDiario(null);
                }}
                sx={{ height: '56px' }}
              >
                Limpar
              </Button>
            </Grid>
          </Grid>

          {/* Botões de Ação */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              onClick={gerarDiario}
              disabled={!turmaSelecionada || !mesAno || loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SchoolIcon />}
              size="large"
            >
              {loading ? 'Gerando...' : 'Gerar Diário'}
            </Button>

            {dadosDiario && (
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                size="large"
                onClick={handlePrint}
              >
                Imprimir Diário
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Conteúdo Imprimível */}
      {dadosDiario && (
        <Box ref={componentRef} className="print-container" sx={{
          '@media print': {
            width: '100vw !important',
            maxWidth: 'none !important',
            margin: '0 !important',
            padding: '0.5cm !important'
          }
        }}>
          {/* PÁGINA 1 - FREQUÊNCIA */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              mb: 3,
              '@media print': {
                boxShadow: 'none',
                margin: 0,
                padding: '0.5cm',
                width: '100%',
                maxWidth: 'none'
              }
            }}
          >
            {/* Cabeçalho com Logo */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {dadosDiario.headerConfig?.logoUrl ? (
                <Box
                  component="img"
                  src={dadosDiario.headerConfig.logoUrl}
                  alt="Logo Escola"
                  sx={{ 
                    height: 60,
                    maxWidth: 200,
                    objectFit: 'contain',
                    mb: 2,
                    '@media print': { 
                      height: 40,
                      maxWidth: 150,
                      mb: 1
                    }
                  }}
                />
              ) : (
                <Box
                  component="img"
                  src="/icon.svg"
                  alt="Logo Escola"
                  sx={{ 
                    height: 60,
                    mb: 2,
                    '@media print': { height: 50 }
                  }}
                />
              )}
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold',
                '@media print': {
                  fontSize: '16px !important'
                }
              }}>
                {dadosDiario.schoolInfo?.nome || 'ESCOLA'}
              </Typography>
              {dadosDiario.schoolInfo?.motto && (
                <Typography variant="caption" color="text.secondary" sx={{
                  '@media print': {
                    fontSize: '12px !important'
                  }
                }}>
                  {dadosDiario.schoolInfo.motto}
                </Typography>
              )}
            </Box>

            {/* Informações da Turma */}
            <Grid container spacing={1} sx={{ 
              mb: 2, 
              fontSize: '0.9rem',
              '@media print': { 
                mb: 1,
                '& .MuiTypography-root': {
                  fontSize: '10px !important'
                }
              }
            }}>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Etapa:</strong> {dadosDiario.turma.etapa || 'EDUCAÇÃO INFANTIL'}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography><strong>Turma:</strong> {dadosDiario.turma.nome}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography><strong>Turno:</strong> {dadosDiario.turma.turno?.toUpperCase()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Agrupamento:</strong> {dadosDiario.turma.serie || dadosDiario.turma.faixaEtaria}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Professor(a) Regente:</strong> {dadosDiario.professor?.nome || '_______________________'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Mês:</strong> {dayjs(mesAno).format('MMMM/YYYY').toUpperCase()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>DIÁRIO 2025</strong></Typography>
              </Grid>
            </Grid>

            {/* Tabela de Frequência */}
            <TableContainer>
              <Table size="small" sx={{ 
                border: '1px solid #000',
                tableLayout: 'fixed',
                width: '100%',
                '& th, & td': { 
                  border: '1px solid #000',
                  padding: '4px',
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                },
                '@media print': {
                  fontSize: '8px !important',
                  '& th, & td': {
                    padding: '1px !important',
                    fontSize: '8px !important',
                    lineHeight: '1.2 !important'
                  }
                }
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      width: '200px',
                      '@media print': {
                        width: '150px !important'
                      }
                    }}>
                      NOME DO ALUNO
                    </TableCell>
                    {getDiasDoMes().map(dia => (
                      <TableCell key={dia} align="center" sx={{ 
                        fontWeight: 'bold', 
                        width: '20px',
                        '@media print': {
                          width: '15px !important',
                          minWidth: '15px !important'
                        }
                      }}>
                        {dia}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ 
                      fontWeight: 'bold', 
                      width: '50px',
                      '@media print': {
                        width: '40px !important'
                      }
                    }}>
                      Faltas
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dadosDiario.alunos.map(aluno => (
                    <TableRow key={aluno.id}>
                      <TableCell sx={{ 
                        textTransform: 'uppercase',
                        fontSize: '0.7rem',
                        '@media print': {
                          fontSize: '7px !important'
                        }
                      }}>
                        {aluno.nome}
                      </TableCell>
                      {getDiasDoMes().map(dia => (
                        <TableCell key={dia} align="center" sx={{
                          '@media print': {
                            fontSize: '8px !important'
                          }
                        }}>
                          {verificarFalta(aluno.id, dia)}
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{
                        fontWeight: 'bold',
                        '@media print': {
                          fontSize: '8px !important'
                        }
                      }}>
                        {dadosDiario.faltasPorAluno[aluno.id] || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Rodapé */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="body2" sx={{ mb: 3 }}>
                EU, _______________________, Professor(a) Regente da Educação Infantil, na turma{' '}
                <strong>{dadosDiario.turma.nome} - {dadosDiario.turma.turno}</strong>, confirmo para os devidos fins que todas as informações contidas neste diário são verídicas.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
                <Box sx={{ textAlign: 'center', minWidth: 200 }}>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="caption">Assinatura do Professor(a)</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: 200 }}>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="caption">Coordenador(a) Pedagógico</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: 200 }}>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="caption">Secretária Geral</Typography>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
                Goiânia-GO, _____ de _________________ de _______
              </Typography>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Divider sx={{ maxWidth: 300, mx: 'auto', mb: 1 }} />
                <Typography variant="caption">Assinatura</Typography>
              </Box>
            </Box>
          </Paper>

          {/* PÁGINA 2 - ATIVIDADES DESENVOLVIDAS */}
          <Paper 
            elevation={3} 
            className="page-break"
            sx={{ 
              p: 3,
              '@media print': {
                boxShadow: 'none',
                margin: 0,
                padding: '1cm',
                width: '100%',
                maxWidth: 'none'
              }
            }}
          >
            {/* Cabeçalho - Igual página 1 */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {dadosDiario.headerConfig?.logoUrl ? (
                <Box
                  component="img"
                  src={dadosDiario.headerConfig.logoUrl}
                  alt="Logo da Escola"
                  sx={{ 
                    height: 80,
                    mb: 2,
                    '@media print': { height: 60 }
                  }}
                />
              ) : (
                <Box
                  component="img"
                  src="/icon.svg"
                  alt="Logo Escola"
                  sx={{ 
                    height: 60,
                    mb: 2,
                    '@media print': { height: 50 }
                  }}
                />
              )}
              
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: dadosDiario.headerConfig?.primaryColor || '#1976d2', mb: 1 }}>
                {dadosDiario.schoolInfo?.nome || 'ESCOLA'}
              </Typography>
              
              {dadosDiario.schoolInfo?.motto && (
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  {dadosDiario.schoolInfo.motto}
                </Typography>
              )}
            </Box>

            <Typography variant="h6" align="center" sx={{ mb: 3, fontWeight: 'bold' }}>
              ATIVIDADES DESENVOLVIDAS - {dayjs(mesAno).format('MMMM/YYYY').toUpperCase()}
            </Typography>

            <Typography variant="body2" sx={{ mb: 3 }}>
              <strong>Turma:</strong> {dadosDiario.turma.nome} - {dadosDiario.turma.turno} | {' '}
              <strong>Professor(a):</strong> {dadosDiario.professor?.nome}
            </Typography>

            {/* Tabela de Atividades */}
            <TableContainer>
              <Table size="small" sx={{ 
                border: '1px solid #000',
                '& th, & td': { 
                  border: '1px solid #000',
                  padding: '8px',
                  fontSize: '0.8rem'
                },
                '@media print': {
                  fontSize: '11px !important',
                  '& th, & td': {
                    padding: '4px !important',
                    fontSize: '11px !important'
                  }
                }
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: 100 }}>DATA</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>ATIVIDADES DESENVOLVIDAS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dadosDiario.planosDoMes.length > 0 ? (
                    dadosDiario.planosDoMes.map((plano, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ verticalAlign: 'top' }}>
                          {dayjs(plano.data).format('DD/MM/YYYY')}
                        </TableCell>
                        <TableCell>
                          {/* Tema/Título - Múltiplas fontes */}
                          {(plano.tema || plano.titulo || plano.assunto || plano.tituloAula) && (
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
                              📋 {plano.tema || plano.titulo || plano.assunto || plano.tituloAula}
                            </Typography>
                          )}

                          {/* Conteúdo/Descrição principal */}
                          {(plano.conteudo || plano.descricao || plano.atividade || plano.resumo) && (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {plano.conteudo || plano.descricao || plano.atividade || plano.resumo}
                            </Typography>
                          )}

                          {/* Metodologia - Sempre mostrar se existir */}
                          {plano.metodologia && (
                            <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic', color: '#666' }}>
                              <strong>Metodologia:</strong> {plano.metodologia}
                            </Typography>
                          )}

                          {/* Objetivos */}
                          {plano.objetivos && (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>🎯 Objetivos:</strong> {plano.objetivos}
                            </Typography>
                          )}

          {/* DISCIPLINAS - SEMPRE MOSTRAR SE EXISTIR */}
          {plano.disciplinas && plano.disciplinas.length > 0 && (
            <Box sx={{ mb: 1 }}>
              {plano.disciplinas.map((disc, idx) => (
                <Box key={idx} sx={{ mb: 2, p: 1, bgcolor: '#f0f7ff', borderRadius: 1, border: '1px solid #1976d2' }}>
                  {/* Nome da Disciplina */}
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                    📚 {disc.nome || disc.disciplina || `Disciplina ${idx + 1}`}
                  </Typography>
                  
                  {/* BNCC da Disciplina */}
                  {disc.habilidadesBNCC && disc.habilidadesBNCC.length > 0 && (
                    <Box sx={{ mb: 1, p: 0.5, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                        📋 BNCC: {disc.habilidadesBNCC.map(h => 
                          typeof h === 'object' ? (h.codigo || h.code || h.id) : h
                        ).filter(Boolean).join(', ')}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Conteúdo da Disciplina */}
                  {disc.conteudo && (
                    <Typography variant="body2" sx={{ color: 'text.primary', mb: 1 }}>
                      {disc.conteudo}
                    </Typography>
                  )}

                  {/* Objetivos da Disciplina */}
                  {disc.objetivos && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      🎯 Objetivos: {disc.objetivos}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}                          {/* BNCC GERAL (se não tiver disciplinas específicas) */}
                          {!plano.disciplinas?.length && plano.habilidadesBNCC && plano.habilidadesBNCC.length > 0 && (
                            <Box sx={{ mb: 1, p: 1, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                📋 BNCC: {plano.habilidadesBNCC.map(h => 
                                  typeof h === 'string' ? h : (h.codigo || h.code || h.id || '')
                                ).filter(Boolean).join(', ')}
                              </Typography>
                            </Box>
                          )}

                          {/* BNCC alternativo */}
                          {!plano.disciplinas?.length && plano.competenciasBNCC && plano.competenciasBNCC.length > 0 && (
                            <Box sx={{ mb: 1, p: 1, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                📋 BNCC: {plano.competenciasBNCC.map(c => 
                                  typeof c === 'string' ? c : (c.codigo || c.code || c.id || '')
                                ).filter(Boolean).join(', ')}
                              </Typography>
                            </Box>
                          )}

                          {/* Recursos */}
                          {plano.recursos && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                              <strong>📦 Recursos:</strong> {Array.isArray(plano.recursos) ? plano.recursos.join(', ') : plano.recursos}
                            </Typography>
                          )}

                          {/* Procedimentos/Atividades */}
                          {(plano.atividades || plano.procedimentos) && (
                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                              <strong>📋 Procedimentos:</strong> {plano.atividades || plano.procedimentos}
                            </Typography>
                          )}

                          {/* Avaliação */}
                          {plano.avaliacao && (
                            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                              <strong>📊 Avaliação:</strong> {plano.avaliacao}
                            </Typography>
                          )}

                          {/* Fallback APENAS se realmente não tem NENHUM conteúdo */}
                          {!plano.tema && !plano.titulo && !plano.conteudo && !plano.descricao && 
                           !plano.objetivos && !plano.atividades && !plano.metodologia && 
                           !plano.habilidadesBNCC?.length && !plano.competenciasBNCC?.length &&
                           !(plano.disciplinas && plano.disciplinas.length > 0) && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Plano de aula registrado
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Nenhum plano de aula registrado para este período
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Rodapé */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ textAlign: 'center', minWidth: 200 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="caption">Assinatura do Professor(a)</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 200 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="caption">Coordenador(a) Pedagógico</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 200 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="caption">Secretária Geral</Typography>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
              Goiânia-GO, _____ de _________________ de _______
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Mensagem quando não há dados */}
      {!dadosDiario && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SchoolIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Selecione os filtros e clique em "Gerar Diário"
          </Typography>
          <Typography variant="body2" color="text.secondary">
            O diário será gerado automaticamente com dados de frequência e planos de aula
          </Typography>
        </Paper>
      )}

      {/* Estilos de Impressão */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .diario-impressao {
            width: 100%;
          }

          @page {
            size: A4 portrait;
            margin: 1cm;
          }

          /* Ocultar elementos não imprimíveis */
          nav, header, footer, .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default DiarioClasse;
