"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSecretariaAccess } from '../../hooks/useSecretariaAccess';
import SidebarMenu from '../../components/SidebarMenu';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
import { 
  Card, 
  CardContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Box, 
  CircularProgress, 
  Alert,
  Grid,
  Paper,
  Chip,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton
} from '@mui/material';


const TurmaFilho = () => {

  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  const { user, role, loading: authLoading } = useAuth();
  const { alunosVinculados, loading: secretariaLoading } = useSecretariaAccess();
  const [loading, setLoading] = useState(true);
  const [filhoData, setFilhoData] = useState(null);
  const [filhosData, setFilhosData] = useState([]); // Array para múltiplos filhos
  const [filhoSelecionado, setFilhoSelecionado] = useState(0); // Índice do filho selecionado
  const [turmaData, setTurmaData] = useState(null);
  const [turmas, setTurmas] = useState({});
  const [gradeHoraria, setGradeHoraria] = useState([]);
  const [periodosAula, setPeriodosAula] = useState([]);
  const [totalAulas, setTotalAulas] = useState(0);
  const [avisosTurma, setAvisosTurma] = useState([]);
  const [avisoSelecionado, setAvisoSelecionado] = useState(null);
  const [modalAvisoOpen, setModalAvisoOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isReady) return;
    if (user && role === 'pai' && !secretariaLoading && alunosVinculados.length > 0) {
      carregarDadosFilho();
    }
  }, [user, role, secretariaLoading, alunosVinculados]);

  const carregarDadosFilho = async () => {
    try {
      setLoading(true);
      console.log('Alunos vinculados recebidos:', alunosVinculados);
      
      if (alunosVinculados.length === 0) {
        setError('Nenhum filho vinculado encontrado para este responsável.');
        return;
      }

      // Usar os alunos já carregados pelo useSecretariaAccess
      setFilhosData(alunosVinculados);
      setFilhoData(alunosVinculados[0]);
      console.log('Primeiro filho selecionado:', alunosVinculados[0]);

      // Carregar turmas para ter informações completas
      const turmasRef = ref(db, 'turmas');
      const turmasSnapshot = await get(turmasRef);
      
      if (turmasSnapshot.exists()) {
        const turmasData = turmasSnapshot.val();
        setTurmas(turmasData);
        console.log('Turmas carregadas:', Object.keys(turmasData));
        
        // Carregar dados da turma do primeiro filho
        const primeiroFilho = alunosVinculados[0];
        if (primeiroFilho.turmaId && turmasData[primeiroFilho.turmaId]) {
          const dadosTurma = turmasData[primeiroFilho.turmaId];
          
          // Buscar professor responsável
          const professorResponsavel = await buscarProfessorTurma(primeiroFilho.turmaId);
          
          // Contar alunos da turma
          const totalAlunos = await contarAlunosTurma(primeiroFilho.turmaId);
          
          setTurmaData({ 
            id: primeiroFilho.turmaId, 
            ...dadosTurma,
            professorResponsavel,
            totalAlunos
          });
          console.log('Dados da turma carregados:', { ...dadosTurma, professorResponsavel, totalAlunos });
          
          // Carregar avisos e grade horária
          await carregarAvisosTurma(primeiroFilho.turmaId);
          await carregarGradeHoraria(primeiroFilho.turmaId);
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dados do filho:', error);
      setError('Erro ao carregar informações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const carregarAvisosTurma = async (turmaId) => {
    try {
      console.log('Carregando avisos específicos para turma:', turmaId);
      
      const avisosRef = ref(db, 'avisosEspecificos');
      const avisosSnapshot = await get(avisosRef);
      
      if (avisosSnapshot.exists()) {
        const dados = avisosSnapshot.val();
        const avisosList = Object.entries(dados).map(([id, aviso]) => ({
          id,
          ...aviso
        }));
        
        console.log('Todos os avisos específicos:', avisosList);
        
        // Filtrar avisos para pais com filhos nesta turma
        const avisosPais = avisosList.filter(aviso => {
          if (!aviso.ativo) return false;
          
          // Verifica se é para todos ou se é para a turma específica
          if (aviso.tipoDestinatario === 'todos') return true;
          
          if (aviso.tipoDestinatario === 'turma') {
            return aviso.destinatarios && aviso.destinatarios.includes(turmaId);
          }
          
          if (aviso.tipoDestinatario === 'aluno') {
            // Verifica se algum dos filhos está nos destinatários
            return filhosData.some(filho => 
              aviso.destinatarios && aviso.destinatarios.includes(filho.id)
            );
          }
          
          return false;
        })
        .sort((a, b) => {
          const dateA = new Date(a.dataCreacao || a.timestamp || 0);
          const dateB = new Date(b.dataCreacao || b.timestamp || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5); // Últimos 5 avisos
        
        setAvisosTurma(avisosPais);
        console.log('Avisos filtrados para pais:', avisosPais);
      } else {
        console.log('Nenhum aviso específico encontrado');
        setAvisosTurma([]);
      }
      
    } catch (error) {
      console.error('Erro ao carregar avisos:', error);
    }
  };

  const getTurmaNome = (turmaId) => {
    return turmas[turmaId]?.nome || 'Turma não encontrada';
  };

  // Função para buscar professor responsável pela turma
  const buscarProfessorTurma = async (turmaId) => {
    try {
      const usuariosRef = ref(db, 'usuarios');
      const snapshot = await get(usuariosRef);
      
      if (snapshot.exists()) {
        const usuarios = Object.entries(snapshot.val());
        const professores = usuarios.filter(([id, usuario]) => usuario.role === 'professora');
        
        // Encontrar professor que tem esta turma vinculada
        const professorTurma = professores.find(([id, professor]) => {
          return professor.turmas && professor.turmas.includes(turmaId);
        });
        
        if (professorTurma) {
          return professorTurma[1].nome || professorTurma[1].displayName || 'Professor não identificado';
        }
      }
      
      return 'Professor não atribuído';
    } catch (error) {
      console.error('Erro ao buscar professor:', error);
      return 'Erro ao carregar professor';
    }
  };

  // Função para contar alunos da turma
  const contarAlunosTurma = async (turmaId) => {
    try {
      const alunosRef = ref(db, 'alunos');
      const snapshot = await get(alunosRef);
      
      if (snapshot.exists()) {
        const alunos = Object.values(snapshot.val());
        const alunosNaTurma = alunos.filter(aluno => aluno.turmaId === turmaId);
        return alunosNaTurma.length;
      }
      
      return 0;
    } catch (error) {
      console.error('Erro ao contar alunos:', error);
      return 0;
    }
  };

  // Função para buscar nome de disciplina
  const buscarNomeDisciplina = async (disciplinaId) => {
    try {
      // Tentar primeiro em 'disciplinas'
      let disciplinaRef = ref(db, `disciplinas/${disciplinaId}`);
      let snapshot = await get(disciplinaRef);
      
      if (snapshot.exists()) {
        return snapshot.val().nome || snapshot.val().nomeDisciplina || disciplinaId;
      }
      
      // Se não encontrar, tentar em 'Escola/Disciplinas'
      disciplinaRef = ref(db, `Escola/Disciplinas/${disciplinaId}`);
      snapshot = await get(disciplinaRef);
      
      if (snapshot.exists()) {
        return snapshot.val().nome || snapshot.val().nomeDisciplina || disciplinaId;
      }
      
      console.log('⚠️ Disciplina não encontrada:', disciplinaId);
      return disciplinaId;
    } catch (error) {
      console.error('Erro ao buscar disciplina:', error);
      return disciplinaId;
    }
  };

  // Função para buscar nome de professor por ID
  const buscarNomeProfessor = async (professorId) => {
    try {
      const professorRef = ref(db, `usuarios/${professorId}`);
      const snapshot = await get(professorRef);
      
      if (snapshot.exists()) {
        return snapshot.val().name || snapshot.val().nome || snapshot.val().displayName || 'Professor não informado';
      }
      return 'Professor não encontrado';
    } catch (error) {
      console.error('Erro ao buscar professor:', error);
      return 'Professor não encontrado';
    }
  };

  // Função para trocar o filho selecionado
  const trocarFilhoSelecionado = async (index) => {
    if (index >= 0 && index < filhosData.length) {
      setFilhoSelecionado(index);
      const novoFilho = filhosData[index];
      setFilhoData(novoFilho);

      // Carregar dados da turma do novo filho
      if (novoFilho.turmaId && turmas[novoFilho.turmaId]) {
        const dadosTurma = turmas[novoFilho.turmaId];
        
        // Buscar professor responsável
        const professorResponsavel = await buscarProfessorTurma(novoFilho.turmaId);
        
        // Contar alunos da turma
        const totalAlunos = await contarAlunosTurma(novoFilho.turmaId);
        
        setTurmaData({ 
          id: novoFilho.turmaId, 
          ...dadosTurma,
          professorResponsavel,
          totalAlunos
        });
        
        // Carregar avisos da nova turma
        await carregarAvisosTurma(novoFilho.turmaId);
        
        // Carregar grade horária da nova turma
        await carregarGradeHoraria(novoFilho.turmaId);
      }
    }
  };

  // Função para carregar grade horária
  const carregarGradeHoraria = async (turmaId) => {
    try {
      // Primeiro, buscar o período letivo da turma específica
      const turmaSnapshot = await getData('turmas/${turmaId}');
      
      if (!turmaSnapshot.exists()) {
        console.log('❌ Turma não encontrada');
        setGradeHoraria([]);
        setPeriodosAula([]);
        return;
      }
      
      const dadosTurma = turmaSnapshot.val();
      const periodoLetivoId = dadosTurma.periodoId;
      
      if (!periodoLetivoId) {
        console.log('❌ Turma não possui período letivo associado');
        setGradeHoraria([]);
        setPeriodosAula([]);
        return;
      }
      
      console.log('📅 Período letivo da turma:', periodoLetivoId);
      console.log('📅 Dados da turma:', dadosTurma);
      
      // Carregar períodos de aula da estrutura correta com período letivo
      const periodosAulaRef = ref(db, `Escola/PeriodosAula/${periodoLetivoId}`);
      const periodosAulaSnapshot = await get(periodosAulaRef);
      
      if (periodosAulaSnapshot.exists()) {
        const periodosData = Object.entries(periodosAulaSnapshot.val()).map(([id, periodo]) => ({
          id,
          ...periodo
        }));
        
        // Filtrar períodos pelo turno da turma
        let periodosFiltrados = periodosData;
        const turnoTurma = dadosTurma.turnoId;
        
        // Filtrar apenas períodos do turno da turma
        if (turnoTurma && turnoTurma !== 'Integral') {
          periodosFiltrados = periodosData.filter(periodo => 
            periodo.turno === turnoTurma
          );
        }
        
        // Ordenar por ordem
        periodosFiltrados.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        setPeriodosAula(periodosFiltrados);
      } else {
        setPeriodosAula([]);
      }
      
      // Carregar horários da grade usando a nova estrutura hierárquica
      const horariosRef = ref(db, `GradeHoraria/${periodoLetivoId}/${turmaId}`);
      const horariosSnapshot = await get(horariosRef);
      
      console.log('📚 Carregando grade horária do caminho:', `GradeHoraria/${periodoLetivoId}/${turmaId}`);
      
      if (horariosSnapshot.exists()) {
        const horariosData = horariosSnapshot.val();
        
        // Converter objeto para array
        const todosHorarios = Object.entries(horariosData).map(([id, horario]) => ({
          id,
          ...horario
        }));
        
        console.log('📚 Horários encontrados:', todosHorarios);
        
        // Buscar nomes de disciplinas e professores para cada horário
        const horariosComNomes = await Promise.all(
          todosHorarios.map(async (horario) => {
            const disciplinaNome = await buscarNomeDisciplina(horario.disciplinaId);
            const professorNome = await buscarNomeProfessor(horario.professorId);
            
            return {
              ...horario,
              disciplinaNome,
              professorNome
            };
          })
        );
        
        setGradeHoraria(horariosComNomes);
        
        // Contar total de aulas da turma
        setTotalAulas(horariosComNomes.length);
      } else {
        console.log('❌ Nenhuma grade horária encontrada para esta turma no período letivo da turma');
        setGradeHoraria([]);
      }
      
    } catch (error) {
      console.error('Erro ao carregar grade horária:', error);
    }
  };

  const formatarHorario = (horario) => {
    if (!horario) return '--';
    return `${horario.inicio} - ${horario.fim}`;
  };

  const formatarData = (dataString) => {
    if (!dataString) return '--';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  
  // Mapeamento de números para dias da semana
  const mapearDiaSemana = (numeroOuString) => {
    const mapeamento = {
      1: 'segunda',
      2: 'terça', 
      3: 'quarta',
      4: 'quinta',
      5: 'sexta',
      'segunda': 'segunda',
      'terça': 'terça',
      'quarta': 'quarta', 
      'quinta': 'quinta',
      'sexta': 'sexta'
    };
    return mapeamento[numeroOuString] || numeroOuString;
  };

  // Funções para modal de avisos
  const abrirModalAviso = (aviso) => {
    setAvisoSelecionado(aviso);
    setModalAvisoOpen(true);
  };

  const fecharModalAviso = () => {
    setModalAvisoOpen(false);
    setAvisoSelecionado(null);
  };

  if (authLoading || secretariaLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || role !== 'pai') {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Acesso negado
        </Typography>
        <Typography variant="body1">
          Esta página é exclusiva para pais e responsáveis.
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <SidebarMenu />
        <main className="dashboard-main">
          <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <SidebarMenu />
      <main className="dashboard-main">
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 3 }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 4, 
            p: 3, 
            borderRadius: 3, 
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', 
            color: 'white', 
            boxShadow: '0 8px 32px rgba(37, 99, 235, 0.2)' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 56, height: 56 }}>
                🎓
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Informações da Turma
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {getTurmaNome(filhoData?.turmaId) || 'Carregando...'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Seletor de filhos - apenas se houver múltiplos filhos */}
          {filhosData.length > 1 && (
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <FormControl sx={{ minWidth: 300 }}>
                <InputLabel>
                  Selecionar Aluno
                </InputLabel>
                <Select
                  value={filhoSelecionado}
                  label="Selecionar Aluno"
                  onChange={(e) => trocarFilhoSelecionado(e.target.value)}
                >
                  {filhosData.map((filho, index) => (
                    <MenuItem key={filho.id} value={index}>
                      {filho.nome} - {getTurmaNome(filho.turmaId)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          <Grid container spacing={3} justifyContent="center">
            {/* Informações da Turma */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: 'fit-content', borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#2563eb', fontWeight: 'bold' }}>
                    📚 Informações da Turma
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">Nome da Turma</Typography>
                    <Typography variant="body1" fontWeight="medium">{getTurmaNome(filhoData?.turmaId)}</Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">Professor(a) Principal</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {turmaData?.professorResponsavel || '--'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">Turno</Typography>
                        <Chip 
                          label={(turmas[filhoData?.turmaId]?.turnoId || 
                                 turmaData?.turnoId || 
                                 'Indefinido').toUpperCase()} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">Total de Alunos</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {turmaData?.totalAlunos || '--'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">Total de Aulas</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {totalAulas || '--'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant="body2" color="textSecondary">Ano Letivo</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {turmas[filhoData?.turmaId]?.anoLetivo || 
                       turmaData?.anoLetivo || 
                       new Date().getFullYear()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Grade Horária */}
            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#2563eb', fontWeight: 'bold' }}>
                    ⏰ Grade Horária da Turma
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {periodosAula.length > 0 && gradeHoraria.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell><strong>Horário</strong></TableCell>
                            {diasDaSemana.map(dia => (
                              <TableCell key={dia} align="center"><strong>{dia}</strong></TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {periodosAula.map((periodo, index) => {
                            return (
                              <TableRow key={periodo.id}>
                              <TableCell sx={{ bgcolor: '#f1f5f9', fontWeight: 'medium', minWidth: 120 }}>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {periodo.nome || `Período ${periodo.ordem || 1}`}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {periodo.inicio || periodo.horaInicio} - {periodo.fim || periodo.horaFim}
                                  </Typography>
                                </Box>
                              </TableCell>
                              {diasDaSemana.map(dia => {
                                // Buscar horário específico para este período e dia
                                const horario = gradeHoraria.find(h => {
                                  const diaFormatado = dia.toLowerCase();
                                  const diaBanco = mapearDiaSemana(h.diaSemana);
                                  const match = h.periodoAula === periodo.id && diaBanco === diaFormatado;
                                  
                                  return match;
                                });
                                
                                return (
                                  <TableCell 
                                    key={dia} 
                                    align="center"
                                    sx={{
                                      minWidth: 100,
                                      height: 60,
                                      bgcolor: horario ? '#e8f5e8' : '#fafafa',
                                      border: '1px solid #e0e0e0',
                                      p: 0.5
                                    }}
                                  >
                                    {horario ? (
                                      <Box>
                                        <Typography variant="caption" fontWeight={600} color="primary" sx={{ fontSize: '0.7rem' }}>
                                          {horario.disciplinaNome || horario.disciplinaId || '--'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                                          {horario.professorNome || horario.professorId || '--'}
                                        </Typography>
                                      </Box>
                                    ) : (
                                      <Typography variant="body2" color="textSecondary">--</Typography>
                                    )}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box>
                      <Alert severity="info">
                        {loading ? 'Carregando grade horária...' : 'Grade horária não disponível para esta turma.'}
                      </Alert>
                      
                      {/* Debug da grade horária */}
                      <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Debug: Períodos={periodosAula.length}, Horários={gradeHoraria.length}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="textSecondary">
                          Turma ID: {filhoData?.turmaId}
                        </Typography>
                        {gradeHoraria.length > 0 && (
                          <>
                            <br />
                            <Typography variant="caption" color="textSecondary">
                              Primeira entrada: {JSON.stringify(gradeHoraria[0])}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Avisos da Turma */}
            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 3, height: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#2563eb', fontWeight: 'bold' }}>
                    📢 Avisos da Turma
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {avisosTurma.length > 0 ? (
                      <List dense>
                        {avisosTurma.map((aviso) => (
                          <ListItem 
                            key={aviso.id} 
                            alignItems="flex-start" 
                            sx={{ 
                              px: 0, 
                              mb: 1, 
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#f5f5f5' },
                              borderRadius: 1
                            }}
                            onClick={() => abrirModalAviso(aviso)}
                          >
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight="medium">
                                  {aviso.titulo}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                    {aviso.conteudo?.substring(0, 100)}...
                                  </Typography>
                                  <Typography variant="caption" color="primary">
                                    {formatarData(aviso.dataCreacao || aviso.timestamp)}
                                  </Typography>
                                  {aviso.prioridade && aviso.prioridade !== 'normal' && (
                                    <Chip 
                                      size="small" 
                                      label={aviso.prioridade} 
                                      color={aviso.prioridade === 'alta' ? 'error' : 'warning'}
                                      sx={{ ml: 1, fontSize: '0.6rem' }}
                                    />
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Alert severity="info">Nenhum aviso disponível para esta turma.</Alert>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </main>

      {/* Modal para exibir aviso completo */}
      <Dialog 
        open={modalAvisoOpen} 
        onClose={fecharModalAviso} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#2563eb', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            📢 {avisoSelecionado?.titulo}
          </Box>
          {avisoSelecionado?.prioridade && avisoSelecionado.prioridade !== 'normal' && (
            <Chip 
              size="small" 
              label={avisoSelecionado.prioridade.toUpperCase()} 
              color={avisoSelecionado.prioridade === 'alta' ? 'error' : 'warning'}
              sx={{ color: 'white', fontWeight: 'bold' }}
            />
          )}
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          {avisoSelecionado && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                {avisoSelecionado.conteudo}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                  Publicado em: {formatarData(avisoSelecionado.dataCreacao || avisoSelecionado.timestamp)}
                </Typography>
                
                <Chip 
                  size="small" 
                  label={avisoSelecionado.tipo || 'Informativo'} 
                  variant="outlined"
                  color="primary"
                />
              </Box>

              {avisoSelecionado.dataVencimento && (
                <Alert 
                  severity={new Date(avisoSelecionado.dataVencimento) < new Date() ? 'error' : 'warning'} 
                  sx={{ mt: 2 }}
                >
                  Vencimento: {formatarData(avisoSelecionado.dataVencimento)}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={fecharModalAviso} variant="contained" color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TurmaFilho;