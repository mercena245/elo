import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Tabs,
  Tab,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  Assessment,
  Print,
  Download,
  FilterList,
  School,
  TrendingUp,
  TrendingDown,
  Remove,
  ExpandMore,
  Person,
  Grade,
  EventBusy,
  CheckCircle
} from '@mui/icons-material';
import { db, ref, get } from '../../../firebase';

const ConsultaBoletim = ({ alunoId = null, turmaId = null, professorId = null }) => {
  const [loading, setLoading] = useState(true);
  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [usuarios, setUsuarios] = useState({});
  const [notas, setNotas] = useState([]);
  const [frequencia, setFrequencia] = useState([]);
  
  const [filtros, setFiltros] = useState({
    turmaId: turmaId || '',
    alunoId: alunoId || '',
    bimestre: '', // Todos por padrão
    disciplinaId: '',
    professorId: professorId || ''
  });
  
  const [tabAtiva, setTabAtiva] = useState(0);
  const [boletimCompleto, setBoletimCompleto] = useState({});

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (filtros.turmaId) {
      carregarAlunos();
    }
  }, [filtros.turmaId]);

  useEffect(() => {
    if (filtros.turmaId || filtros.alunoId) {
      carregarBoletim();
    }
  }, [filtros.turmaId, filtros.alunoId, filtros.bimestre, filtros.disciplinaId, filtros.professorId]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [turmasSnap, disciplinasSnap, usuariosSnap] = await Promise.all([
        get(ref(db, 'turmas')),
        get(ref(db, 'disciplinas')),
        get(ref(db, 'usuarios'))
      ]);

      // Carregar turmas
      const turmasData = [];
      if (turmasSnap.exists()) {
        Object.entries(turmasSnap.val()).forEach(([id, data]) => {
          turmasData.push({ id, ...data });
        });
      }
      setTurmas(turmasData);

      // Carregar disciplinas
      const disciplinasData = [];
      if (disciplinasSnap.exists()) {
        Object.entries(disciplinasSnap.val()).forEach(([id, data]) => {
          disciplinasData.push({ id, ...data });
        });
      }
      setDisciplinas(disciplinasData);

      // Carregar usuários para nomes de professores
      const usuariosData = {};
      const professoresData = [];
      if (usuariosSnap.exists()) {
        Object.entries(usuariosSnap.val()).forEach(([id, data]) => {
          if (data.role === 'professora' && data.nome) {
            usuariosData[id] = data;
            professoresData.push({ id, ...data });
          }
        });
      }
      setUsuarios(usuariosData);
      setProfessores(professoresData);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarAlunos = async () => {
    try {
      const alunosSnap = await get(ref(db, 'alunos'));
      const alunosData = [];
      
      if (alunosSnap.exists()) {
        Object.entries(alunosSnap.val()).forEach(([id, data]) => {
          if (data.turmaId === filtros.turmaId) {
            alunosData.push({ id, ...data });
          }
        });
      }
      
      // Ordenar por nome
      alunosData.sort((a, b) => a.nome?.localeCompare(b.nome) || 0);
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  const carregarBoletim = async () => {
    try {
      const [notasSnap, frequenciaSnap] = await Promise.all([
        get(ref(db, 'notas')),
        get(ref(db, 'frequencia'))
      ]);

      // Carregar notas
      const notasData = [];
      if (notasSnap.exists()) {
        Object.entries(notasSnap.val()).forEach(([id, data]) => {
          let incluir = false;
          
          if (filtros.alunoId && data.alunoId === filtros.alunoId) incluir = true;
          else if (filtros.turmaId && data.turmaId === filtros.turmaId) incluir = true;
          
          if (incluir && filtros.bimestre && data.bimestre !== filtros.bimestre) incluir = false;
          if (incluir && filtros.disciplinaId && data.disciplinaId !== filtros.disciplinaId) incluir = false;
          if (incluir && filtros.professorId && data.professorId !== filtros.professorId) incluir = false;
          
          if (incluir) {
            notasData.push({ id, ...data });
          }
        });
      }
      setNotas(notasData);

      // Carregar frequência
      const frequenciaData = [];
      if (frequenciaSnap.exists()) {
        Object.entries(frequenciaSnap.val()).forEach(([id, data]) => {
          let incluir = false;
          
          if (filtros.alunoId && data.alunoId === filtros.alunoId) incluir = true;
          else if (filtros.turmaId && data.turmaId === filtros.turmaId) incluir = true;
          
          if (incluir && filtros.disciplinaId && data.disciplinaId !== filtros.disciplinaId) incluir = false;
          if (incluir && filtros.professorId && data.professorId !== filtros.professorId) incluir = false;
          
          if (incluir) {
            frequenciaData.push({ id, ...data });
          }
        });
      }
      setFrequencia(frequenciaData);

      // Processar dados para boletim completo
      processarBoletimCompleto(notasData, frequenciaData);

    } catch (error) {
      console.error('Erro ao carregar boletim:', error);
    }
  };

  const processarBoletimCompleto = (notasData, frequenciaData) => {
    const boletim = {};

    // Processar por aluno
    const alunosConsiderados = filtros.alunoId ? 
      alunos.filter(a => a.id === filtros.alunoId) : 
      alunos;

    alunosConsiderados.forEach(aluno => {
      boletim[aluno.id] = {
        ...aluno,
        disciplinas: {}
      };

      disciplinas.forEach(disciplina => {
        if (filtros.disciplinaId && disciplina.id !== filtros.disciplinaId) return;

        boletim[aluno.id].disciplinas[disciplina.id] = {
          nome: disciplina.nome,
          notas: {
            '1º Bimestre': null,
            '2º Bimestre': null,
            '3º Bimestre': null,
            '4º Bimestre': null,
          },
          media: 0,
          status: 'Pendente',
          faltas: 0,
          totalAulas: 0,
          frequencia: 0
        };

        // Processar notas
        const notasDisciplina = notasData.filter(n => 
          n.alunoId === aluno.id && n.disciplinaId === disciplina.id
        );

        notasDisciplina.forEach(nota => {
          boletim[aluno.id].disciplinas[disciplina.id].notas[nota.bimestre] = parseFloat(nota.nota);
        });

        // Calcular média
        const notasValidas = Object.values(boletim[aluno.id].disciplinas[disciplina.id].notas)
          .filter(n => n !== null && n !== undefined);
        
        if (notasValidas.length > 0) {
          const soma = notasValidas.reduce((acc, nota) => acc + nota, 0);
          boletim[aluno.id].disciplinas[disciplina.id].media = soma / notasValidas.length;
        }

        // Processar frequência
        const faltasDisciplina = frequenciaData.filter(f => 
          f.alunoId === aluno.id && f.disciplinaId === disciplina.id
        );

        const totalAulas = faltasDisciplina.length;
        const faltas = faltasDisciplina.filter(f => !f.presente).length;
        const frequenciaPercentual = totalAulas > 0 ? ((totalAulas - faltas) / totalAulas) * 100 : 0;

        boletim[aluno.id].disciplinas[disciplina.id].faltas = faltas;
        boletim[aluno.id].disciplinas[disciplina.id].totalAulas = totalAulas;
        boletim[aluno.id].disciplinas[disciplina.id].frequencia = frequenciaPercentual;

        // Determinar status
        const media = boletim[aluno.id].disciplinas[disciplina.id].media;
        if (notasValidas.length === 0) {
          boletim[aluno.id].disciplinas[disciplina.id].status = 'Pendente';
        } else if (media >= 7 && frequenciaPercentual >= 75) {
          boletim[aluno.id].disciplinas[disciplina.id].status = 'Aprovado';
        } else if (media >= 5 && frequenciaPercentual >= 75) {
          boletim[aluno.id].disciplinas[disciplina.id].status = 'Recuperação';
        } else {
          boletim[aluno.id].disciplinas[disciplina.id].status = 'Reprovado';
        }
      });
    });

    setBoletimCompleto(boletim);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Aprovado': return 'success';
      case 'Recuperação': return 'warning';
      case 'Reprovado': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Aprovado': return <TrendingUp />;
      case 'Recuperação': return <Remove />;
      case 'Reprovado': return <TrendingDown />;
      default: return <School />;
    }
  };

  const handleImprimirBoletim = () => {
    const printContent = `
      <html>
        <head>
          <title>Boletim Escolar</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .aluno-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .aprovado { color: #4caf50; font-weight: bold; }
            .recuperacao { color: #ff9800; font-weight: bold; }
            .reprovado { color: #f44336; font-weight: bold; }
            .pendente { color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Boletim Escolar</h1>
            <p>Sistema Educacional ELO</p>
          </div>
          ${Object.entries(boletimCompleto).map(([alunoId, dadosAluno]) => `
            <div class="aluno-info">
              <h2>${dadosAluno.nome}</h2>
              <p>Matrícula: ${dadosAluno.matricula || 'N/A'} | Turma: ${turmas.find(t => t.id === dadosAluno.turmaId)?.nome || 'N/A'}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Disciplina</th>
                  <th>1º Bim</th>
                  <th>2º Bim</th>
                  <th>3º Bim</th>
                  <th>4º Bim</th>
                  <th>Média</th>
                  <th>Faltas</th>
                  <th>Freq.</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(dadosAluno.disciplinas).map(([disciplinaId, dadosDisciplina]) => `
                  <tr>
                    <td>${dadosDisciplina.nome}</td>
                    <td>${dadosDisciplina.notas['1º Bimestre'] || '-'}</td>
                    <td>${dadosDisciplina.notas['2º Bimestre'] || '-'}</td>
                    <td>${dadosDisciplina.notas['3º Bimestre'] || '-'}</td>
                    <td>${dadosDisciplina.notas['4º Bimestre'] || '-'}</td>
                    <td>${dadosDisciplina.media.toFixed(1)}</td>
                    <td>${dadosDisciplina.faltas}</td>
                    <td>${dadosDisciplina.frequencia.toFixed(1)}%</td>
                    <td class="${dadosDisciplina.status.toLowerCase()}">${dadosDisciplina.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `).join('')}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Assessment sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
        <Box>
          <Typography variant="h6" color="primary" fontWeight={600}>
            📊 Consulta de Boletim
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {alunoId ? 'Visualização individual' : professorId ? 'Suas turmas e disciplinas' : 'Relatórios completos'}
          </Typography>
        </Box>
      </Box>

      {/* Alert para professor */}
      {professorId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Modo Professor:</strong> Visualizando apenas boletins das suas disciplinas e turmas.
        </Alert>
      )}

      {/* Filtros */}
      {!alunoId && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              <FilterList sx={{ mr: 1 }} />
              Filtros de Consulta
            </Typography>
            
            <Grid container spacing={3} sx={{ width: '100%' }}>
              <Grid item xs={12} sx={{ minWidth: '300px' }}>
                <FormControl fullWidth sx={{ minWidth: '250px' }}>
                  <InputLabel>Turma</InputLabel>
                  <Select
                    value={filtros.turmaId}
                    label="Turma"
                    onChange={(e) => setFiltros(prev => ({ ...prev, turmaId: e.target.value }))}
                  >
                    {turmas.map((turma) => (
                      <MenuItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sx={{ minWidth: '300px' }}>
                <FormControl fullWidth sx={{ minWidth: '250px' }}>
                  <InputLabel>Aluno (Opcional)</InputLabel>
                  <Select
                    value={filtros.alunoId}
                    label="Aluno (Opcional)"
                    onChange={(e) => setFiltros(prev => ({ ...prev, alunoId: e.target.value }))}
                  >
                    <MenuItem value="">Todos os alunos</MenuItem>
                    {alunos.map((aluno) => (
                      <MenuItem key={aluno.id} value={aluno.id}>
                        {aluno.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sx={{ minWidth: '300px' }}>
                <FormControl fullWidth sx={{ minWidth: '250px' }}>
                  <InputLabel>Bimestre</InputLabel>
                  <Select
                    value={filtros.bimestre}
                    label="Bimestre"
                    onChange={(e) => setFiltros(prev => ({ ...prev, bimestre: e.target.value }))}
                  >
                    <MenuItem value="">Todos os bimestres</MenuItem>
                    <MenuItem value="1º Bimestre">1º Bimestre</MenuItem>
                    <MenuItem value="2º Bimestre">2º Bimestre</MenuItem>
                    <MenuItem value="3º Bimestre">3º Bimestre</MenuItem>
                    <MenuItem value="4º Bimestre">4º Bimestre</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {!professorId && (
                <Grid item xs={12} sx={{ minWidth: '300px' }}>
                  <FormControl fullWidth sx={{ minWidth: '250px' }}>
                    <InputLabel>Professor(a) (Opcional)</InputLabel>
                    <Select
                      value={filtros.professorId}
                      label="Professor(a) (Opcional)"
                      onChange={(e) => setFiltros(prev => ({ ...prev, professorId: e.target.value }))}
                    >
                      <MenuItem value="">Todos os professores</MenuItem>
                      {professores.map((professora) => (
                        <MenuItem key={professora.id} value={professora.id}>
                          {professora.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12} sx={{ minWidth: '300px' }}>
                <FormControl fullWidth sx={{ minWidth: '250px' }}>
                  <InputLabel>Disciplina</InputLabel>
                  <Select
                    value={filtros.disciplinaId}
                    label="Disciplina"
                    onChange={(e) => setFiltros(prev => ({ ...prev, disciplinaId: e.target.value }))}
                  >
                    <MenuItem value="">Todas as disciplinas</MenuItem>
                    {disciplinas.map((disciplina) => (
                      <MenuItem key={disciplina.id} value={disciplina.id}>
                        {disciplina.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={handleImprimirBoletim}
                disabled={Object.keys(boletimCompleto).length === 0}
              >
                Imprimir Boletim
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Boletins */}
      {Object.entries(boletimCompleto).map(([alunoId, dadosAluno]) => (
        <Card key={alunoId} sx={{ mb: 3 }}>
          <CardContent>
            {/* Informações do Aluno */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Person sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                {dadosAluno.nome}
              </Typography>
              <Chip 
                label={`Matrícula: ${dadosAluno.matricula || 'N/A'}`}
                size="small"
                sx={{ ml: 2 }}
              />
              <Chip 
                label={`Turma: ${turmas.find(t => t.id === dadosAluno.turmaId)?.nome || 'N/A'}`}
                size="small"
                sx={{ ml: 1 }}
              />
            </Box>

            {/* Tabela de Notas */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Disciplina</strong></TableCell>
                    <TableCell align="center"><strong>1º Bim</strong></TableCell>
                    <TableCell align="center"><strong>2º Bim</strong></TableCell>
                    <TableCell align="center"><strong>3º Bim</strong></TableCell>
                    <TableCell align="center"><strong>4º Bim</strong></TableCell>
                    <TableCell align="center"><strong>Média</strong></TableCell>
                    <TableCell align="center"><strong>Faltas</strong></TableCell>
                    <TableCell align="center"><strong>Freq.</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(dadosAluno.disciplinas).map(([disciplinaId, dadosDisciplina]) => (
                    <TableRow key={disciplinaId} hover>
                      <TableCell>
                        <Typography fontWeight={500}>{dadosDisciplina.nome}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        {dadosDisciplina.notas['1º Bimestre'] || '-'}
                      </TableCell>
                      <TableCell align="center">
                        {dadosDisciplina.notas['2º Bimestre'] || '-'}
                      </TableCell>
                      <TableCell align="center">
                        {dadosDisciplina.notas['3º Bimestre'] || '-'}
                      </TableCell>
                      <TableCell align="center">
                        {dadosDisciplina.notas['4º Bimestre'] || '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight={600} color="primary.main">
                          {dadosDisciplina.media.toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <EventBusy sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          {dadosDisciplina.faltas}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <LinearProgress
                            variant="determinate"
                            value={dadosDisciplina.frequencia}
                            sx={{ width: 40, mr: 1 }}
                            color={dadosDisciplina.frequencia >= 75 ? 'success' : 'error'}
                          />
                          <Typography variant="caption">
                            {dadosDisciplina.frequencia.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={getStatusIcon(dadosDisciplina.status)}
                          label={dadosDisciplina.status}
                          color={getStatusColor(dadosDisciplina.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}

      {/* Estado vazio */}
      {Object.keys(boletimCompleto).length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Grade sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhum boletim encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selecione os filtros ou verifique se há dados lançados.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ConsultaBoletim;