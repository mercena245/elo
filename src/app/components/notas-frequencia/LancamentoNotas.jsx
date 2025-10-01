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
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import { 
  Save, 
  Search, 
  Edit, 
  CheckCircle, 
  School, 
  Person,
  MenuBook,
  Grade
} from '@mui/icons-material';
import { db, ref, get, set } from '../../../firebase';

const LancamentoNotas = ({ professorId = null }) => {
  const [loading, setLoading] = useState(true);
  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [notas, setNotas] = useState([]);
  
  const [filtros, setFiltros] = useState({
    turmaId: '',
    disciplinaId: '',
    professorIdSelecionado: professorId || '',
    periodoId: ''
  });
  
  const [notasEditadas, setNotasEditadas] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (filtros.turmaId && turmas.length > 0) {
      carregarAlunos();
    }
  }, [filtros.turmaId, turmas]);

  useEffect(() => {
    if (filtros.turmaId && filtros.disciplinaId && filtros.professorIdSelecionado && filtros.periodoId) {
      carregarNotas();
    }
  }, [filtros.turmaId, filtros.disciplinaId, filtros.professorIdSelecionado, filtros.periodoId]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [turmasSnap, disciplinasSnap, usuariosSnap, escolaSnap] = await Promise.all([
        get(ref(db, 'turmas')),
        get(ref(db, 'disciplinas')),
        get(ref(db, 'usuarios')),
        get(ref(db, 'Escola/Periodo'))
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

      // Carregar professores - corrigir filtro
      const professoresData = [];
      if (usuariosSnap.exists()) {
        Object.entries(usuariosSnap.val()).forEach(([id, data]) => {
          if (data.role === 'professora' && data.nome) {
            professoresData.push({ id, ...data });
          }
        });
      }
      setProfessores(professoresData);

      // Carregar períodos letivos
      const periodosData = [];
      if (escolaSnap.exists()) {
        Object.entries(escolaSnap.val()).forEach(([id, data]) => {
          periodosData.push({ id, ...data });
        });
      }
      setPeriodos(periodosData);

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

  const carregarNotas = async () => {
    try {
      const notasSnap = await get(ref(db, 'notas'));
      const notasData = [];
      
      if (notasSnap.exists()) {
        Object.entries(notasSnap.val()).forEach(([id, data]) => {
          if (
            data.turmaId === filtros.turmaId &&
            data.disciplinaId === filtros.disciplinaId &&
            data.professorId === filtros.professorIdSelecionado &&
            data.periodoId === filtros.periodoId
          ) {
            notasData.push({ id, ...data });
          }
        });
      }
      
      setNotas(notasData);
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
    }
  };

  const getNotaAluno = (alunoId) => {
    const nota = notas.find(n => n.alunoId === alunoId);
    return nota?.nota || '';
  };

  const handleNotaChange = (alunoId, valor) => {
    // Validar se é um número válido entre 0 e 10
    if (valor === '' || (!isNaN(valor) && valor >= 0 && valor <= 10)) {
      setNotasEditadas(prev => ({
        ...prev,
        [alunoId]: valor
      }));
    }
  };

  const handleSalvarNotas = async () => {
    if (Object.keys(notasEditadas).length === 0) {
      setMensagem('Nenhuma nota foi alterada.');
      return;
    }

    setSalvando(true);
    setMensagem('');

    try {
      const promises = [];

      for (const [alunoId, nota] of Object.entries(notasEditadas)) {
        const notaExistente = notas.find(n => n.alunoId === alunoId);
        const notaId = notaExistente ? notaExistente.id : `nota_${Date.now()}_${alunoId}`;
        
        const notaData = {
          alunoId,
          turmaId: filtros.turmaId,
          disciplinaId: filtros.disciplinaId,
          professorId: filtros.professorIdSelecionado,
          periodoId: filtros.periodoId,
          nota: parseFloat(nota),
          dataLancamento: new Date().toISOString(),
          createdAt: notaExistente?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        promises.push(set(ref(db, `notas/${notaId}`), notaData));
      }

      await Promise.all(promises);
      
      // Recarregar notas e limpar edições
      await carregarNotas();
      setNotasEditadas({});
      setMensagem(`✅ ${Object.keys(notasEditadas).length} nota(s) salva(s) com sucesso!`);

    } catch (error) {
      console.error('Erro ao salvar notas:', error);
      setMensagem('❌ Erro ao salvar notas. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const getCorNota = (nota) => {
    if (nota === '' || nota === undefined) return '#e0e0e0';
    const valor = parseFloat(nota);
    if (valor >= 7) return '#4caf50'; // Verde
    if (valor >= 5) return '#ff9800'; // Laranja  
    return '#f44336'; // Vermelho
  };

  const getStatusNota = (nota) => {
    if (nota === '' || nota === undefined) return 'Não lançada';
    const valor = parseFloat(nota);
    if (valor >= 7) return 'Aprovado';
    if (valor >= 5) return 'Recuperação';
    return 'Reprovado';
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
        <Grade sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
        <Box>
          <Typography variant="h6" color="primary" fontWeight={600}>
            📝 Lançamento de Notas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {professorId ? 'Suas disciplinas' : 'Sistema completo'}
          </Typography>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3, maxWidth: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            🎯 Filtros de Busca
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
                <InputLabel>Disciplina</InputLabel>
                <Select
                  value={filtros.disciplinaId}
                  label="Disciplina"
                  onChange={(e) => setFiltros(prev => ({ ...prev, disciplinaId: e.target.value }))}
                >
                  {disciplinas.map((disciplina) => (
                    <MenuItem key={disciplina.id} value={disciplina.id}>
                      {disciplina.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {!professorId && (
              <Grid item xs={12} sx={{ minWidth: '300px' }}>
                <FormControl fullWidth sx={{ minWidth: '250px' }}>
                  <InputLabel>Professor(a)</InputLabel>
                  <Select
                    value={filtros.professorIdSelecionado}
                    label="Professor(a)"
                    onChange={(e) => setFiltros(prev => ({ ...prev, professorIdSelecionado: e.target.value }))}
                  >
                    {professores.map((professor) => (
                      <MenuItem key={professor.id} value={professor.id}>
                        {professor.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sx={{ minWidth: '300px' }}>
              <FormControl fullWidth sx={{ minWidth: '250px' }}>
                <InputLabel>Período Letivo</InputLabel>
                <Select
                  value={filtros.periodoId}
                  label="Período Letivo"
                  onChange={(e) => setFiltros(prev => ({ ...prev, periodoId: e.target.value }))}
                >
                  {periodos.map((periodo) => (
                    <MenuItem key={periodo.id} value={periodo.id}>
                      {periodo.nome || `Período ${periodo.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>


          </Grid>
        </CardContent>
      </Card>

      {/* Mensagem */}
      {mensagem && (
        <Alert 
          severity={mensagem.includes('✅') ? 'success' : 'error'} 
          sx={{ mb: 2 }}
          onClose={() => setMensagem('')}
        >
          {mensagem}
        </Alert>
      )}

      {/* Tabela de Notas */}
      {filtros.turmaId && filtros.disciplinaId && filtros.professorIdSelecionado && filtros.periodoId && alunos.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                📊 Lançamento de Notas - Período Selecionado
              </Typography>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSalvarNotas}
                disabled={salvando || Object.keys(notasEditadas).length === 0}
                sx={{ backgroundColor: '#4caf50' }}
              >
                {salvando ? 'Salvando...' : `Salvar ${Object.keys(notasEditadas).length} Nota(s)`}
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Aluno(a)</strong></TableCell>
                    <TableCell align="center"><strong>Matrícula</strong></TableCell>
                    <TableCell align="center"><strong>Nota Atual</strong></TableCell>
                    <TableCell align="center"><strong>Nova Nota</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alunos.map((aluno) => {
                    const notaAtual = getNotaAluno(aluno.id);
                    const notaEditada = notasEditadas[aluno.id];
                    const notaFinal = notaEditada !== undefined ? notaEditada : notaAtual;
                    
                    return (
                      <TableRow key={aluno.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person sx={{ color: 'primary.main' }} />
                            <Typography fontWeight={500}>{aluno.nome}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{aluno.matricula || '-'}</TableCell>
                        <TableCell align="center">
                          {notaAtual ? (
                            <Chip 
                              label={notaAtual}
                              size="small"
                              sx={{ 
                                backgroundColor: getCorNota(notaAtual),
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Não lançada
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={notaEditada !== undefined ? notaEditada : notaAtual}
                            onChange={(e) => handleNotaChange(aluno.id, e.target.value)}
                            inputProps={{
                              min: 0,
                              max: 10,
                              step: 0.1,
                              style: { textAlign: 'center' }
                            }}
                            sx={{ 
                              width: 80,
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: notaEditada !== undefined ? '#fff3e0' : 'white'
                              }
                            }}
                            placeholder="0.0"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={getStatusNota(notaFinal)}
                            size="small"
                            color={
                              notaFinal === '' ? 'default' :
                              parseFloat(notaFinal) >= 7 ? 'success' :
                              parseFloat(notaFinal) >= 5 ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {(!filtros.turmaId || !filtros.disciplinaId || !filtros.professorIdSelecionado || !filtros.periodoId) && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <School sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Selecione os filtros para começar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Escolha a turma, disciplina{!professorId && ', professor'} e período letivo para lançar as notas.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default LancamentoNotas;