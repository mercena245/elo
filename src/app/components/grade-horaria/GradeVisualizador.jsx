import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Chip
} from '@mui/material';
import { Add, Print } from '@mui/icons-material';
import { db, ref, get } from '../../../firebase';
import ModalHorario from './ModalHorario';
import ImpressaoGradeNova from './ImpressaoGradeNova';

const GradeVisualizador = () => {
  const [turmas, setTurmas] = useState([]);
  const [periodosAula, setPeriodosAula] = useState([]);
  const [horariosAula, setHorariosAula] = useState([]);
  const [turmaSelected, setTurmaSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ diaSemana: null, periodoAulaId: null, horarioExistente: null });
  const impressaoRef = useRef(null);

  const diasSemana = [
    { id: 1, nome: 'Segunda' },
    { id: 2, nome: 'Terça' },
    { id: 3, nome: 'Quarta' },
    { id: 4, nome: 'Quinta' },
    { id: 5, nome: 'Sexta' }
  ];

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    
    try {
      // Carregar turmas
      const turmasSnap = await get(ref(db, 'turmas'));
      if (turmasSnap.exists()) {
        const turmasData = turmasSnap.val();
        const turmasArray = Object.entries(turmasData)
          .map(([id, turma]) => ({ id, ...turma }))
          .filter(turma => turma.nome && turma.nome.trim() !== ''); // Filtrar turmas sem nome
        setTurmas(turmasArray);
        
        // Selecionar primeira turma automaticamente se não houver seleção
        if (turmasArray.length > 0 && !turmaSelected) {
          setTurmaSelected(turmasArray[0].id);
        }
      } else {
        setTurmas([]);
      }

      // Carregar períodos de aula
      const periodosSnap = await get(ref(db, 'Escola/PeriodosAula'));
      if (periodosSnap.exists()) {
        const periodosData = periodosSnap.val();
        const periodosArray = Object.entries(periodosData)
          .map(([id, periodo]) => ({ id, ...periodo }))
          .sort((a, b) => a.ordem - b.ordem);
        setPeriodosAula(periodosArray);
      }

      // Carregar disciplinas
      const disciplinasSnap = await get(ref(db, 'disciplinas'));
      if (disciplinasSnap.exists()) {
        const disciplinasData = disciplinasSnap.val();
        const disciplinasArray = Object.entries(disciplinasData).map(([id, disc]) => ({ id, ...disc }));
        setDisciplinas(disciplinasArray);
      }

      // Carregar professores (usuários com role professora)
      const usuariosSnap = await get(ref(db, 'usuarios'));
      if (usuariosSnap.exists()) {
        const usuariosData = usuariosSnap.val();
        const professoresArray = Object.entries(usuariosData)
          .filter(([_, user]) => user.role === 'professora')
          .map(([id, prof]) => ({ id, ...prof }));
        setProfessores(professoresArray);
      }

      // Carregar horários (quando implementado)
      const horariosSnap = await get(ref(db, 'GradeHoraria'));
      if (horariosSnap.exists()) {
        const horariosData = horariosSnap.val();
        const horariosArray = Object.entries(horariosData).map(([id, horario]) => ({ id, ...horario }));
        setHorariosAula(horariosArray);
      }

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      // Manter arrays vazios em caso de erro
      setTurmas([]);
      setPeriodosAula([]);
      setDisciplinas([]);
      setProfessores([]);
      setHorariosAula([]);
    }
    setLoading(false);
  };

  const getHorario = (diaSemana, periodoAulaId) => {
    return horariosAula.find(h => 
      h.turmaId === turmaSelected && 
      h.diaSemana === diaSemana && 
      h.periodoAula === periodoAulaId
    );
  };

  const getDisciplinaNome = (disciplinaId) => {
    const disc = disciplinas.find(d => d.id === disciplinaId);
    return disc ? disc.nome : 'N/A';
  };

  const getProfessorNome = (professorId) => {
    const prof = professores.find(p => p.id === professorId);
    return prof ? prof.nome : 'N/A';
  };

  const handleImprimir = () => {
    if (!turmaSelected) {
      alert('Selecione uma turma para imprimir a grade.');
      return;
    }
    
    if (impressaoRef.current) {
      impressaoRef.current.handleImprimirGrade();
    }
  };

  const handleAbrirModal = (diaSemana, periodoAulaId, horarioExistente = null) => {
    setModalData({ diaSemana, periodoAulaId, horarioExistente });
    setModalOpen(true);
  };

  const handleFecharModal = () => {
    setModalOpen(false);
    setModalData({ diaSemana: null, periodoAulaId: null, horarioExistente: null });
  };

  const handleSalvarHorario = async () => {
    await carregarDados(); // Recarregar dados após salvar
  };

  const renderCelula = (diaSemana, periodo) => {
    if (periodo.tipo === 'intervalo') {
      return (
        <TableCell
          key={`${diaSemana}-${periodo.id}`}
          sx={{
            bgcolor: '#fff3e0',
            textAlign: 'center',
            fontWeight: 600,
            color: '#f57c00'
          }}
        >
          {periodo.nome}
        </TableCell>
      );
    }

    const horario = getHorario(diaSemana, periodo.id);

    return (
      <TableCell
        key={`${diaSemana}-${periodo.id}`}
        sx={{
          minWidth: 150,
          height: 80,
          bgcolor: horario ? '#e8f5e8' : '#fafafa',
          border: '1px solid #e0e0e0',
          p: 1,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: horario ? '#d4edda' : '#f5f5f5'
          }
        }}
        onClick={() => handleAbrirModal(diaSemana, periodo.id, horario)}
      >
        {horario ? (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="primary">
              {getDisciplinaNome(horario.disciplinaId)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {getProfessorNome(horario.professorId)}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', color: '#bdbdbd' }}>
            <Add fontSize="small" />
            <Typography variant="caption" display="block">
              Clique para adicionar
            </Typography>
          </Box>
        )}
      </TableCell>
    );
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Carregando dados...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" color="primary">
          Visualizador da Grade Horária
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {turmaSelected && (
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={handleImprimir}
              sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#45a049' } }}
            >
              Imprimir Grade
            </Button>
          )}
          <Typography variant="body2" color="text.secondary">
            {turmas.length} turma(s) disponível(is)
          </Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Selecionar Turma</InputLabel>
            <Select
              value={turmaSelected}
              label="Selecionar Turma"
              onChange={(e) => setTurmaSelected(e.target.value)}
            >
              {turmas.length === 0 ? (
                <MenuItem disabled>
                  <em>Nenhuma turma encontrada</em>
                </MenuItem>
              ) : (
                turmas.map((turma) => (
                  <MenuItem key={turma.id} value={turma.id}>
                    {turma.nome}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {turmas.length === 0 && !loading ? (
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main" gutterBottom>
              ⚠️ Nenhuma Turma Encontrada
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Não foi possível carregar as turmas. Verifique se existem turmas cadastradas no sistema.
            </Typography>
            <Button 
              variant="outlined" 
              onClick={carregarDados}
            >
              🔄 Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      ) : periodosAula.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main" gutterBottom>
              ⚠️ Períodos de Aula não Configurados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Antes de criar a grade horária, você precisa configurar os períodos de aula na aba "Configurações".
            </Typography>
          </CardContent>
        </Card>
      ) : !turmaSelected ? (
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Selecione uma turma para visualizar a grade horária
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                  Horário
                </TableCell>
                {diasSemana.map((dia) => (
                  <TableCell 
                    key={dia.id} 
                    align="center" 
                    sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}
                  >
                    {dia.nome}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {periodosAula.map((periodo) => (
                <TableRow key={periodo.id}>
                  <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>
                    <Box>
                      <Typography variant="subtitle2">
                        {periodo.nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {periodo.inicio} - {periodo.fim}
                      </Typography>
                      {periodo.tipo === 'intervalo' && (
                        <Chip 
                          label="Intervalo" 
                          size="small" 
                          color="warning" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Box>
                  </TableCell>
                  {diasSemana.map((dia) => renderCelula(dia.id, periodo))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {turmaSelected && periodosAula.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            💡 Clique em uma célula vazia para adicionar uma aula
          </Typography>
        </Box>
      )}

      <ModalHorario
        open={modalOpen}
        onClose={handleFecharModal}
        turmaId={turmaSelected}
        diaSemana={modalData.diaSemana}
        periodoAulaId={modalData.periodoAulaId}
        horarioExistente={modalData.horarioExistente}
        onSalvar={handleSalvarHorario}
      />

      {turmaSelected && (
        <ImpressaoGradeNova
          ref={impressaoRef}
          turma={turmas.find(t => t.id === turmaSelected)}
          periodosAula={periodosAula}
          horariosAula={horariosAula.filter(h => h.turmaId === turmaSelected)}
          disciplinas={disciplinas}
          professores={professores}
        />
      )}
    </Box>
  );
};

export default GradeVisualizador;