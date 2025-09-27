import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
  Divider,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Download, 
  Assessment, 
  Schedule, 
  Person, 
  MenuBook,
  BarChart,
  PieChart
} from '@mui/icons-material';
import { db, ref, get } from '../../../firebase';
import ImpressaoRelatorios from './ImpressaoRelatorios';

const RelatoriosGrade = () => {
  const [loading, setLoading] = useState(true);
  const [dadosRelatorio, setDadosRelatorio] = useState({
    turmas: [],
    disciplinas: [],
    professores: [],
    periodosAula: [],
    gradeHoraria: {}
  });
  const [tabValue, setTabValue] = useState(0);
  const [filtroTurma, setFiltroTurma] = useState('todas');
  const impressaoRelatorioRef = useRef(null);

  useEffect(() => {
    carregarDadosRelatorio();
  }, []);

  const carregarDadosRelatorio = async () => {
    setLoading(true);
    try {
      // Carregar todos os dados necessários
      const [turmasSnap, disciplinasSnap, usuariosSnap, periodosSnap, gradeSnap] = await Promise.all([
        get(ref(db, 'turmas')),
        get(ref(db, 'disciplinas')),
        get(ref(db, 'usuarios')),
        get(ref(db, 'Escola/PeriodosAula')),
        get(ref(db, 'GradeHoraria'))
      ]);

      const turmas = [];
      if (turmasSnap.exists()) {
        Object.entries(turmasSnap.val()).forEach(([id, data]) => {
          turmas.push({ id, ...data });
        });
      }

      const disciplinas = [];
      if (disciplinasSnap.exists()) {
        Object.entries(disciplinasSnap.val()).forEach(([id, data]) => {
          disciplinas.push({ id, ...data });
        });
      }

      const professores = [];
      if (usuariosSnap.exists()) {
        Object.entries(usuariosSnap.val()).forEach(([id, data]) => {
          if (data.role === 'professor' && data.nome) {
            professores.push({ id, ...data });
          }
        });
      }

      const periodosAula = [];
      if (periodosSnap.exists()) {
        Object.entries(periodosSnap.val()).forEach(([id, data]) => {
          if (data.tipo === 'aula') {
            periodosAula.push({ id, ...data });
          }
        });
        periodosAula.sort((a, b) => a.ordem - b.ordem);
      }

      const gradeHoraria = gradeSnap.exists() ? gradeSnap.val() : {};

      setDadosRelatorio({
        turmas,
        disciplinas,
        professores,
        periodosAula,
        gradeHoraria
      });

    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular estatísticas gerais
  const calcularEstatisticas = () => {
    const { turmas, disciplinas, professores, periodosAula, gradeHoraria } = dadosRelatorio;
    
    let totalAulas = 0;
    let professoresAtivos = new Set();
    let disciplinasEmUso = new Set();
    let horariosOcupados = 0;
    let totalHorariosDisponiveis = turmas.length * 5 * periodosAula.length; // turmas * dias * períodos

    Object.entries(gradeHoraria).forEach(([turmaId, diasData]) => {
      Object.entries(diasData).forEach(([dia, periodosData]) => {
        Object.entries(periodosData).forEach(([periodoId, aulaData]) => {
          totalAulas++;
          horariosOcupados++;
          if (aulaData.professorId) professoresAtivos.add(aulaData.professorId);
          if (aulaData.disciplinaId) disciplinasEmUso.add(aulaData.disciplinaId);
        });
      });
    });

    return {
      totalAulas,
      professoresAtivos: professoresAtivos.size,
      disciplinasEmUso: disciplinasEmUso.size,
      horariosLivres: totalHorariosDisponiveis - horariosOcupados,
      percentualOcupacao: totalHorariosDisponiveis > 0 ? ((horariosOcupados / totalHorariosDisponiveis) * 100).toFixed(1) : 0
    };
  };

  // Função para calcular carga horária por professor
  const calcularCargaHorariaProfessores = () => {
    const { professores, gradeHoraria } = dadosRelatorio;
    const cargaPorProfessor = {};

    // Inicializar contadores
    professores.forEach(prof => {
      cargaPorProfessor[prof.id] = {
        nome: prof.nome,
        totalAulas: 0,
        porDia: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        turmas: new Set(),
        disciplinas: new Set()
      };
    });

    // Contar aulas
    Object.entries(gradeHoraria).forEach(([turmaId, diasData]) => {
      Object.entries(diasData).forEach(([dia, periodosData]) => {
        Object.entries(periodosData).forEach(([periodoId, aulaData]) => {
          const profId = aulaData.professorId;
          if (profId && cargaPorProfessor[profId]) {
            cargaPorProfessor[profId].totalAulas++;
            cargaPorProfessor[profId].porDia[dia]++;
            cargaPorProfessor[profId].turmas.add(turmaId);
            if (aulaData.disciplinaId) {
              cargaPorProfessor[profId].disciplinas.add(aulaData.disciplinaId);
            }
          }
        });
      });
    });

    return Object.values(cargaPorProfessor)
      .filter(prof => prof.totalAulas > 0)
      .sort((a, b) => b.totalAulas - a.totalAulas);
  };

  // Função para calcular distribuição de disciplinas
  const calcularDistribuicaoDisciplinas = () => {
    const { disciplinas, turmas, gradeHoraria } = dadosRelatorio;
    const distPorDisciplina = {};

    // Inicializar contadores
    disciplinas.forEach(disc => {
      distPorDisciplina[disc.id] = {
        nome: disc.nome,
        totalAulas: 0,
        porTurma: {},
        porDia: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    });

    // Inicializar contadores por turma
    turmas.forEach(turma => {
      disciplinas.forEach(disc => {
        if (!distPorDisciplina[disc.id].porTurma[turma.id]) {
          distPorDisciplina[disc.id].porTurma[turma.id] = {
            nome: turma.nome,
            aulas: 0
          };
        }
      });
    });

    // Contar distribuição
    Object.entries(gradeHoraria).forEach(([turmaId, diasData]) => {
      Object.entries(diasData).forEach(([dia, periodosData]) => {
        Object.entries(periodosData).forEach(([periodoId, aulaData]) => {
          const discId = aulaData.disciplinaId;
          if (discId && distPorDisciplina[discId]) {
            distPorDisciplina[discId].totalAulas++;
            distPorDisciplina[discId].porDia[dia]++;
            if (distPorDisciplina[discId].porTurma[turmaId]) {
              distPorDisciplina[discId].porTurma[turmaId].aulas++;
            }
          }
        });
      });
    });

    return Object.values(distPorDisciplina)
      .filter(disc => disc.totalAulas > 0)
      .sort((a, b) => b.totalAulas - a.totalAulas);
  };

  const estatisticas = calcularEstatisticas();
  const cargaProfessores = calcularCargaHorariaProfessores();
  const distDisciplinas = calcularDistribuicaoDisciplinas();

  const diasSemanaLabels = {
    1: 'Seg',
    2: 'Ter',
    3: 'Qua',
    4: 'Qui',
    5: 'Sex'
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600} color="primary">
          📊 Relatórios da Grade Horária
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => {
              if (impressaoRelatorioRef.current) {
                impressaoRelatorioRef.current.handleImprimirRelatorio();
              }
            }}
            sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
          >
            Imprimir Relatório
          </Button>
        </Box>
      </Box>

      {/* Cards de Estatísticas Gerais */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {estatisticas.totalAulas}
              </Typography>
              <Typography variant="body2">
                Total de Aulas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Person sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {estatisticas.professoresAtivos}
              </Typography>
              <Typography variant="body2">
                Professores Ativos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MenuBook sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {estatisticas.disciplinasEmUso}
              </Typography>
              <Typography variant="body2">
                Disciplinas em Uso
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {estatisticas.percentualOcupacao}%
              </Typography>
              <Typography variant="body2">
                Ocupação da Grade
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs dos Relatórios */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Person />} label="Carga Horária" />
          <Tab icon={<MenuBook />} label="Disciplinas" />
          <Tab icon={<BarChart />} label="Análises" />
        </Tabs>
      </Box>

      {/* Tab 0: Carga Horária por Professor */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              Carga Horária por Professor
            </Typography>
            
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Professor</strong></TableCell>
                    <TableCell align="center"><strong>Total Aulas</strong></TableCell>
                    <TableCell align="center"><strong>Seg</strong></TableCell>
                    <TableCell align="center"><strong>Ter</strong></TableCell>
                    <TableCell align="center"><strong>Qua</strong></TableCell>
                    <TableCell align="center"><strong>Qui</strong></TableCell>
                    <TableCell align="center"><strong>Sex</strong></TableCell>
                    <TableCell align="center"><strong>Turmas</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cargaProfessores.map((prof) => (
                    <TableRow key={prof.nome} hover>
                      <TableCell>{prof.nome}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={prof.totalAulas}
                          color={prof.totalAulas >= 20 ? 'error' : prof.totalAulas >= 15 ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      {[1, 2, 3, 4, 5].map(dia => (
                        <TableCell key={dia} align="center">
                          {prof.porDia[dia] || 0}
                        </TableCell>
                      ))}
                      <TableCell align="center">{prof.turmas.size}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {cargaProfessores.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Nenhum professor com aulas cadastradas encontrado.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 1: Distribuição de Disciplinas */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MenuBook color="primary" />
              Distribuição de Disciplinas
            </Typography>
            
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Disciplina</strong></TableCell>
                    <TableCell align="center"><strong>Total Aulas</strong></TableCell>
                    <TableCell align="center"><strong>Seg</strong></TableCell>
                    <TableCell align="center"><strong>Ter</strong></TableCell>
                    <TableCell align="center"><strong>Qua</strong></TableCell>
                    <TableCell align="center"><strong>Qui</strong></TableCell>
                    <TableCell align="center"><strong>Sex</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {distDisciplinas.map((disc) => (
                    <TableRow key={disc.nome} hover>
                      <TableCell>{disc.nome}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={disc.totalAulas}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      {[1, 2, 3, 4, 5].map(dia => (
                        <TableCell key={dia} align="center">
                          {disc.porDia[dia] || 0}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {distDisciplinas.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Nenhuma disciplina com aulas cadastradas encontrada.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Análises Gerais */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  🎯 Análise de Carga Horária
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {cargaProfessores.length > 0 ? (
                  <>
                    <Typography variant="body2" gutterBottom>
                      <strong>Professor com mais aulas:</strong> {cargaProfessores[0]?.nome} ({cargaProfessores[0]?.totalAulas} aulas)
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Média de aulas por professor:</strong> {
                        (cargaProfessores.reduce((acc, p) => acc + p.totalAulas, 0) / cargaProfessores.length).toFixed(1)
                      } aulas
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Professores com sobrecarga (&gt;20h):</strong> {
                        cargaProfessores.filter(p => p.totalAulas > 20).length
                      }
                    </Typography>
                  </>
                ) : (
                  <Alert severity="info">Dados insuficientes para análise</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  📚 Análise de Disciplinas
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {distDisciplinas.length > 0 ? (
                  <>
                    <Typography variant="body2" gutterBottom>
                      <strong>Disciplina com mais aulas:</strong> {distDisciplinas[0]?.nome} ({distDisciplinas[0]?.totalAulas} aulas)
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Média de aulas por disciplina:</strong> {
                        (distDisciplinas.reduce((acc, d) => acc + d.totalAulas, 0) / distDisciplinas.length).toFixed(1)
                      } aulas
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Disciplinas pouco utilizadas (&lt;5 aulas):</strong> {
                        distDisciplinas.filter(d => d.totalAulas < 5).length
                      }
                    </Typography>
                  </>
                ) : (
                  <Alert severity="info">Dados insuficientes para análise</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  ⚠️ Recomendações
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {cargaProfessores.filter(p => p.totalAulas > 20).length > 0 && (
                    <Alert severity="warning">
                      Existem professores com sobrecarga horária (&gt;20 aulas). Considere redistribuir as aulas.
                    </Alert>
                  )}
                  
                  {estatisticas.percentualOcupacao < 70 && (
                    <Alert severity="info">
                      Ocupação da grade está abaixo de 70%. Há espaço para mais atividades.
                    </Alert>
                  )}
                  
                  {distDisciplinas.filter(d => d.totalAulas < 3).length > 0 && (
                    <Alert severity="info">
                      Algumas disciplinas têm poucas aulas na semana. Verifique se está adequado ao currículo.
                    </Alert>
                  )}
                  
                  {cargaProfessores.length > 0 && distDisciplinas.length > 0 && (
                    <Alert severity="success">
                      Sistema de grade horária funcionando bem! Continue o monitoramento regular.
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      <ImpressaoRelatorios
        ref={impressaoRelatorioRef}
        estatisticas={estatisticas}
        cargaProfessores={cargaProfessores}
        distDisciplinas={distDisciplinas}
        turmas={dadosRelatorio.turmas}
      />
    </Box>
  );
};

export default RelatoriosGrade;