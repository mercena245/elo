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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Badge
} from '@mui/material';
import { 
  Save, 
  CheckCircle, 
  Cancel,
  EventNote,
  Person,
  CalendarToday,
  Check,
  Close
} from '@mui/icons-material';
import { db, ref, get, set } from '../../../firebase';

const RegistroFaltas = ({ professorId = null }) => {
  const [loading, setLoading] = useState(true);
  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [faltas, setFaltas] = useState([]);
  
  const [filtros, setFiltros] = useState({
    turmaId: '',
    disciplinaId: '',
    professorIdSelecionado: professorId || '',
    data: new Date().toISOString().split('T')[0] // Data atual
  });
  
  const [presencas, setPresencas] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (filtros.turmaId && turmas.length > 0) {
      carregarAlunos();
    }
  }, [filtros.turmaId, turmas]);

  useEffect(() => {
    if (filtros.turmaId && filtros.disciplinaId && filtros.professorIdSelecionado && filtros.data) {
      carregarFaltas();
    }
  }, [filtros.turmaId, filtros.disciplinaId, filtros.professorIdSelecionado, filtros.data]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [turmasSnap, disciplinasSnap, usuariosSnap] = await Promise.all([
        get(ref(db, 'turmas')),
        get(ref(db, 'disciplinas')),
        get(ref(db, 'usuarios'))
      ]);

      // Carregar turmas - aplicar filtro para professoras
      let turmasData = [];
      if (turmasSnap.exists()) {
        const todasTurmas = [];
        Object.entries(turmasSnap.val()).forEach(([id, data]) => {
          todasTurmas.push({ id, ...data });
        });

        // Se é professora, filtrar apenas suas turmas usando ID
        if (professorId) {
          const professoraSnap = await get(ref(db, `usuarios/${professorId}`));
          if (professoraSnap.exists()) {
            const professoraData = professoraSnap.val();
            const minhasTurmas = professoraData.turmas || [];
            
            turmasData = todasTurmas.filter(turma => 
              minhasTurmas.includes(turma.id)
            );
          }
        } else {
          // Se é coordenadora, mostrar todas as turmas
          turmasData = todasTurmas;
        }
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

      // Carregar professores
      const professoresData = [];
      if (usuariosSnap.exists()) {
        Object.entries(usuariosSnap.val()).forEach(([id, data]) => {
          if (data.role === 'professora' && data.nome) {
            professoresData.push({ id, ...data });
          }
        });
      }
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
        // Se é professora, verificar se tem permissão para ver esta turma
        if (professorId) {
          const professoraSnap = await get(ref(db, `usuarios/${professorId}`));
          
          if (professoraSnap.exists()) {
            const professoraData = professoraSnap.val();
            const minhasTurmas = professoraData.turmas || [];
            
            // Verificar se a turma selecionada está nas turmas da professora usando ID
            if (!minhasTurmas.includes(filtros.turmaId)) {
              console.log('Professora não tem acesso a esta turma');
              setAlunos([]);
              return;
            }
          }
        }
        
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

  const carregarFaltas = async () => {
    try {
      const faltasSnap = await get(ref(db, 'frequencia'));
      const faltasData = [];
      const presencasIniciais = {};
      
      if (faltasSnap.exists()) {
        Object.entries(faltasSnap.val()).forEach(([id, data]) => {
          if (
            data.turmaId === filtros.turmaId &&
            data.disciplinaId === filtros.disciplinaId &&
            data.professorId === filtros.professorIdSelecionado &&
            data.data === filtros.data
          ) {
            faltasData.push({ id, ...data });
            presencasIniciais[data.alunoId] = data.presente;
          }
        });
      }
      
      // Inicializar presença como true para alunos sem registro
      alunos.forEach(aluno => {
        if (presencasIniciais[aluno.id] === undefined) {
          presencasIniciais[aluno.id] = true; // Presente por padrão
        }
      });
      
      setFaltas(faltasData);
      setPresencas(presencasIniciais);
    } catch (error) {
      console.error('Erro ao carregar faltas:', error);
    }
  };

  const handlePresencaChange = (alunoId, presente) => {
    setPresencas(prev => ({
      ...prev,
      [alunoId]: presente
    }));
  };

  const handleMarcarTodosPresentes = () => {
    const novasPresencas = {};
    alunos.forEach(aluno => {
      novasPresencas[aluno.id] = true;
    });
    setPresencas(novasPresencas);
  };

  const handleMarcarTodosFaltosos = () => {
    const novasPresencas = {};
    alunos.forEach(aluno => {
      novasPresencas[aluno.id] = false;
    });
    setPresencas(novasPresencas);
  };

  const handleSalvarFrequencia = async () => {
    setSalvando(true);
    setMensagem('');

    try {
      const promises = [];

      for (const [alunoId, presente] of Object.entries(presencas)) {
        const faltaExistente = faltas.find(f => f.alunoId === alunoId);
        const frequenciaId = faltaExistente ? faltaExistente.id : `freq_${Date.now()}_${alunoId}`;
        
        const frequenciaData = {
          alunoId,
          turmaId: filtros.turmaId,
          disciplinaId: filtros.disciplinaId,
          professorId: filtros.professorIdSelecionado,
          data: filtros.data,
          presente: presente,
          dataRegistro: new Date().toISOString(),
          createdAt: faltaExistente?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        promises.push(set(ref(db, `frequencia/${frequenciaId}`), frequenciaData));
      }

      await Promise.all(promises);
      
      // Recarregar faltas
      await carregarFaltas();
      
      const totalPresentes = Object.values(presencas).filter(p => p).length;
      const totalFaltosos = Object.values(presencas).filter(p => !p).length;
      
      setMensagem(`✅ Frequência salva! ${totalPresentes} presente(s), ${totalFaltosos} falta(s).`);

    } catch (error) {
      console.error('Erro ao salvar frequência:', error);
      setMensagem('❌ Erro ao salvar frequência. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const contarFaltasAluno = (alunoId) => {
    // Aqui você pode implementar a contagem total de faltas do aluno
    // Por enquanto, retorna 0
    return 0;
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalPresentes = Object.values(presencas).filter(p => p).length;
  const totalFaltosos = Object.values(presencas).filter(p => !p).length;

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <EventNote sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
        <Box>
          <Typography variant="h6" color="primary" fontWeight={600}>
            📅 Registro de Frequência
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {professorId ? 'Suas disciplinas' : 'Controle completo de presença'}
          </Typography>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
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
              <TextField
                fullWidth
                sx={{ minWidth: '250px' }}
                label="Data da Aula"
                type="date"
                value={filtros.data}
                onChange={(e) => setFiltros(prev => ({ ...prev, data: e.target.value }))}
                InputLabelProps={{
                  shrink: true,
                }}
              />
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

      {/* Resumo da Aula */}
      {filtros.turmaId && filtros.disciplinaId && filtros.professorIdSelecionado && filtros.data && alunos.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              📊 Resumo da Aula - {formatarData(filtros.data)}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#e8f5e8', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="#4caf50">
                    {totalPresentes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Presentes
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#ffebee', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="#f44336">
                    {totalFaltosos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Faltosos
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="#2196f3">
                    {alunos.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Alunos
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CheckCircle />}
                onClick={handleMarcarTodosPresentes}
                sx={{ color: '#4caf50', borderColor: '#4caf50' }}
              >
                Todos Presentes
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Cancel />}
                onClick={handleMarcarTodosFaltosos}
                sx={{ color: '#f44336', borderColor: '#f44336' }}
              >
                Todos Faltosos
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSalvarFrequencia}
                disabled={salvando}
                sx={{ backgroundColor: '#2196f3', ml: 'auto' }}
              >
                {salvando ? 'Salvando...' : 'Salvar Frequência'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Lista de Frequência */}
      {filtros.turmaId && filtros.disciplinaId && filtros.professorIdSelecionado && filtros.data && alunos.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              👥 Lista de Frequência
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Aluno(a)</strong></TableCell>
                    <TableCell align="center"><strong>Matrícula</strong></TableCell>
                    <TableCell align="center"><strong>Presente</strong></TableCell>
                    <TableCell align="center"><strong>Faltoso</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alunos.map((aluno) => {
                    const presente = presencas[aluno.id];
                    const totalFaltas = contarFaltasAluno(aluno.id);
                    
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
                          <IconButton
                            onClick={() => handlePresencaChange(aluno.id, true)}
                            sx={{
                              color: presente ? '#4caf50' : '#e0e0e0',
                              backgroundColor: presente ? '#e8f5e8' : 'transparent',
                              '&:hover': { backgroundColor: '#e8f5e8' }
                            }}
                          >
                            <Check />
                          </IconButton>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={() => handlePresencaChange(aluno.id, false)}
                            sx={{
                              color: !presente ? '#f44336' : '#e0e0e0',
                              backgroundColor: !presente ? '#ffebee' : 'transparent',
                              '&:hover': { backgroundColor: '#ffebee' }
                            }}
                          >
                            <Close />
                          </IconButton>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={presente ? 'Presente' : 'Faltoso'}
                            size="small"
                            color={presente ? 'success' : 'error'}
                            icon={presente ? <CheckCircle /> : <Cancel />}
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
      {(!filtros.turmaId || !filtros.disciplinaId || !filtros.professorIdSelecionado) && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Selecione os filtros para começar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Escolha a turma, disciplina{!professorId && ', professor'} e data para registrar a frequência.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RegistroFaltas;