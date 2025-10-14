import React, { useState, useEffect } from 'react';
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
  Button,
  CircularProgress,
  Chip,
  Divider,
  LinearProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { 
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
  School,
  TrendingUp,
  TrendingDown,
  Remove,
  Person,
  Grade,
  EventBusy,
  CheckCircle,
  Print,
  Assessment,
  CalendarToday,
  Star,
  Warning
} from '@mui/icons-material';
;

const BoletimAluno = ({ alunoId, responsavelId }) => {
  const [loading, setLoading] = useState(true);
  const [dadosAluno, setDadosAluno] = useState(null);
  const [turma, setTurma] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [usuarios, setUsuarios] = useState({});
  const [boletim, setBoletim] = useState({});
  const [estatisticas, setEstatisticas] = useState({});
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);

  useEffect(() => {
    if (alunoId) {
      carregarDadosAluno();
    } else if (responsavelId) {
      // Para responsáveis, primeiro encontrar o ID do filho
      carregarDadosFilho();
    }
  }, [alunoId, responsavelId]);

  const carregarDadosFilho = async () => {
    try {
      // Para responsáveis, buscar o aluno vinculado
      const alunosSnap = await getData('alunos');
      let filhoId = null;
      
      if (alunosSnap.exists()) {
        Object.entries(alunosSnap.val()).forEach(([id, data]) => {
          if (data.responsavelId === responsavelId || data.paiId === responsavelId) {
            filhoId = id;
          }
        });
      }
      
      if (filhoId) {
        // Carregar dados do filho encontrado
        await carregarDadosAluno(filhoId);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do filho:', error);
      setLoading(false);
    }
  };

  const carregarDadosAluno = async (idAluno = alunoId) => {
    setLoading(true);
    try {
      const [alunoSnap, turmasSnap, disciplinasSnap, usuariosSnap, notasSnap, frequenciaSnap] = await Promise.all([
        get(ref(db, `alunos/${idAluno}`)),
        getData('turmas'),
        getData('disciplinas'),
        getData('usuarios'),
        getData('notas'),
        getData('frequencia')
      ]);

      // Dados do aluno
      if (alunoSnap.exists()) {
        setDadosAluno({ id: idAluno, ...alunoSnap.val() });
      }

      // Turmas
      const turmasData = {};
      if (turmasSnap.exists()) {
        Object.entries(turmasSnap.val()).forEach(([id, data]) => {
          turmasData[id] = data;
        });
        if (alunoSnap.exists() && alunoSnap.val().turmaId) {
          setTurma(turmasData[alunoSnap.val().turmaId]);
        }
      }

      // Disciplinas
      const disciplinasData = [];
      if (disciplinasSnap.exists()) {
        Object.entries(disciplinasSnap.val()).forEach(([id, data]) => {
          disciplinasData.push({ id, ...data });
        });
      }
      setDisciplinas(disciplinasData);

      // Usuários (professores)
      const usuariosData = {};
      if (usuariosSnap.exists()) {
        Object.entries(usuariosSnap.val()).forEach(([id, data]) => {
          usuariosData[id] = data;
        });
      }
      setUsuarios(usuariosData);

      // Processar boletim
      const boletimData = {};
      const estatisticasData = {
        totalDisciplinas: disciplinasData.length,
        aprovado: 0,
        recuperacao: 0,
        reprovado: 0,
        mediaGeral: 0,
        frequenciaGeral: 0,
        totalFaltas: 0,
        totalAulas: 0
      };

      disciplinasData.forEach(disciplina => {
        boletimData[disciplina.id] = {
          nome: disciplina.nome,
          professor: '',
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
          frequencia: 0,
          observacoes: []
        };
      });

      // Processar notas
      if (notasSnap.exists()) {
        Object.entries(notasSnap.val()).forEach(([id, nota]) => {
          if (nota.alunoId === idAluno && boletimData[nota.disciplinaId]) {
            boletimData[nota.disciplinaId].notas[nota.bimestre] = parseFloat(nota.nota);
            if (nota.professorId && usuarios[nota.professorId]) {
              boletimData[nota.disciplinaId].professor = usuarios[nota.professorId].nome;
            }
          }
        });
      }

      // Processar frequência
      if (frequenciaSnap.exists()) {
        Object.entries(frequenciaSnap.val()).forEach(([id, freq]) => {
          if (freq.alunoId === idAluno && boletimData[freq.disciplinaId]) {
            boletimData[freq.disciplinaId].totalAulas++;
            if (!freq.presente) {
              boletimData[freq.disciplinaId].faltas++;
            }
          }
        });
      }

      // Calcular médias e status
      Object.keys(boletimData).forEach(disciplinaId => {
        const disciplinaBoletim = boletimData[disciplinaId];
        
        // Calcular média
        const notasValidas = Object.values(disciplinaBoletim.notas)
          .filter(n => n !== null && n !== undefined);
        
        if (notasValidas.length > 0) {
          const soma = notasValidas.reduce((acc, nota) => acc + nota, 0);
          disciplinaBoletim.media = soma / notasValidas.length;
        }

        // Calcular frequência
        if (disciplinaBoletim.totalAulas > 0) {
          disciplinaBoletim.frequencia = ((disciplinaBoletim.totalAulas - disciplinaBoletim.faltas) / disciplinaBoletim.totalAulas) * 100;
        }

        // Determinar status
        const media = disciplinaBoletim.media;
        const frequencia = disciplinaBoletim.frequencia;
        
        if (notasValidas.length === 0) {
          disciplinaBoletim.status = 'Pendente';
        } else if (media >= 7 && frequencia >= 75) {
          disciplinaBoletim.status = 'Aprovado';
          estatisticasData.aprovado++;
        } else if (media >= 5 && frequencia >= 75) {
          disciplinaBoletim.status = 'Recuperação';
          estatisticasData.recuperacao++;
        } else {
          disciplinaBoletim.status = 'Reprovado';
          estatisticasData.reprovado++;
        }

        // Adicionar observações
        if (media < 5) {
          disciplinaBoletim.observacoes.push('Média baixa - necessita atenção especial');
        }
        if (frequencia < 75) {
          disciplinaBoletim.observacoes.push('Frequência abaixo do mínimo exigido (75%)');
        }
        if (disciplinaBoletim.faltas > 10) {
          disciplinaBoletim.observacoes.push('Muitas faltas registradas');
        }

        // Acumular estatísticas gerais
        estatisticasData.totalFaltas += disciplinaBoletim.faltas;
        estatisticasData.totalAulas += disciplinaBoletim.totalAulas;
        if (notasValidas.length > 0) {
          estatisticasData.mediaGeral += disciplinaBoletim.media;
        }
      });

      // Finalizar estatísticas
      const disciplinasComNota = Object.values(boletimData).filter(d => d.media > 0).length;
      if (disciplinasComNota > 0) {
        estatisticasData.mediaGeral = estatisticasData.mediaGeral / disciplinasComNota;
      }
      if (estatisticasData.totalAulas > 0) {
        estatisticasData.frequenciaGeral = ((estatisticasData.totalAulas - estatisticasData.totalFaltas) / estatisticasData.totalAulas) * 100;
      }

      setBoletim(boletimData);
      setEstatisticas(estatisticasData);

    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
    } finally {
      setLoading(false);
    }
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
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

    const printContent = `
      <html>
        <head>
          <title>Boletim Individual - ${dadosAluno?.nome}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .aluno-info { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .estatisticas { display: flex; justify-content: space-around; margin-bottom: 20px; }
            .stat-box { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .aprovado { color: #4caf50; font-weight: bold; }
            .recuperacao { color: #ff9800; font-weight: bold; }
            .reprovado { color: #f44336; font-weight: bold; }
            .pendente { color: #666; }
            .observacoes { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Boletim Individual</h1>
            <p>Sistema Educacional ELO</p>
          </div>
          
          <div class="aluno-info">
            <h2>${dadosAluno?.nome}</h2>
            <p><strong>Matrícula:</strong> ${dadosAluno?.matricula || 'N/A'}</p>
            <p><strong>Turma:</strong> ${turma?.nome || 'N/A'}</p>
            <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div class="estatisticas">
            <div class="stat-box">
              <h3>${estatisticas.mediaGeral?.toFixed(1) || '0.0'}</h3>
              <p>Média Geral</p>
            </div>
            <div class="stat-box">
              <h3>${estatisticas.frequenciaGeral?.toFixed(1) || '0.0'}%</h3>
              <p>Frequência</p>
            </div>
            <div class="stat-box">
              <h3>${estatisticas.aprovado}</h3>
              <p>Aprovações</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Disciplina</th>
                <th>Professor(a)</th>
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
              ${Object.entries(boletim).map(([disciplinaId, dados]) => `
                <tr>
                  <td>${dados.nome}</td>
                  <td>${dados.professor || '-'}</td>
                  <td>${dados.notas['1º Bimestre'] || '-'}</td>
                  <td>${dados.notas['2º Bimestre'] || '-'}</td>
                  <td>${dados.notas['3º Bimestre'] || '-'}</td>
                  <td>${dados.notas['4º Bimestre'] || '-'}</td>
                  <td>${dados.media.toFixed(1)}</td>
                  <td>${dados.faltas}</td>
                  <td>${dados.frequencia.toFixed(1)}%</td>
                  <td class="${dados.status.toLowerCase()}">${dados.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${Object.entries(boletim).some(([_, dados]) => dados.observacoes.length > 0) ? `
            <div class="observacoes">
              <h3>Observações:</h3>
              ${Object.entries(boletim).map(([disciplinaId, dados]) => 
                dados.observacoes.length > 0 ? `
                  <p><strong>${dados.nome}:</strong> ${dados.observacoes.join(', ')}</p>
                ` : ''
              ).join('')}
            </div>
          ` : ''}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const abrirDetalhes = (disciplinaId) => {
    setDisciplinaSelecionada(disciplinaId);
    setDialogDetalhes(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dadosAluno && !loading) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {responsavelId ? 'Dados do(a) filho(a) não encontrados.' : 'Dados do aluno não encontrados.'}
      </Alert>
    );
  }

  if (!dadosAluno) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Carregando boletim...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header do Aluno */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
            <Avatar sx={{ width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', mr: 2 }}>
              <Person sx={{ fontSize: 32 }} />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" fontWeight={600}>
                {dadosAluno.nome}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Matrícula: {dadosAluno.matricula || 'N/A'} | Turma: {turma?.nome || 'N/A'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={handleImprimirBoletim}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Imprimir
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="#2196f3">
                {estatisticas.mediaGeral.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Média Geral
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="#4caf50">
                {estatisticas.frequenciaGeral.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Frequência Geral
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="#4caf50">
                {estatisticas.aprovado}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aprovações
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <EventBusy sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="#f44336">
                {estatisticas.totalFaltas}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de Faltas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela de Notas */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            📊 Desempenho por Disciplina
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Disciplina</strong></TableCell>
                  <TableCell><strong>Professor(a)</strong></TableCell>
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
                {Object.entries(boletim).map(([disciplinaId, dados]) => (
                  <TableRow 
                    key={disciplinaId} 
                    hover 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => abrirDetalhes(disciplinaId)}
                  >
                    <TableCell>
                      <Typography fontWeight={500}>{dados.nome}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{dados.professor || '-'}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      {dados.notas['1º Bimestre'] || '-'}
                    </TableCell>
                    <TableCell align="center">
                      {dados.notas['2º Bimestre'] || '-'}
                    </TableCell>
                    <TableCell align="center">
                      {dados.notas['3º Bimestre'] || '-'}
                    </TableCell>
                    <TableCell align="center">
                      {dados.notas['4º Bimestre'] || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight={600} color="primary.main">
                        {dados.media.toFixed(1)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {dados.faltas}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={dados.frequencia}
                          sx={{ width: 40, mr: 1 }}
                          color={dados.frequencia >= 75 ? 'success' : 'error'}
                        />
                        <Typography variant="caption">
                          {dados.frequencia.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={getStatusIcon(dados.status)}
                        label={dados.status}
                        color={getStatusColor(dados.status)}
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

      {/* Dialog de Detalhes */}
      <Dialog open={dialogDetalhes} onClose={() => setDialogDetalhes(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalhes - {disciplinaSelecionada && boletim[disciplinaSelecionada]?.nome}
        </DialogTitle>
        <DialogContent>
          {disciplinaSelecionada && boletim[disciplinaSelecionada] && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Professor(a): {boletim[disciplinaSelecionada].professor || 'Não informado'}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Notas por Bimestre:
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {Object.entries(boletim[disciplinaSelecionada].notas).map(([bimestre, nota]) => (
                  <Grid item xs={3} key={bimestre}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6" color="primary">
                          {nota || '-'}
                        </Typography>
                        <Typography variant="caption">
                          {bimestre}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {boletim[disciplinaSelecionada].observacoes.length > 0 && (
                <>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Observações:
                  </Typography>
                  {boletim[disciplinaSelecionada].observacoes.map((obs, index) => (
                    <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                      {obs}
                    </Alert>
                  ))}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDetalhes(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BoletimAluno;