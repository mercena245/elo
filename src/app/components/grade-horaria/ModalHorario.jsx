import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Divider
} from '@mui/material';
;
import { logAction, LOG_ACTIONS } from '../../../services/auditService';
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';

const ModalHorario = ({ 
  open, 
  onClose, 
  turmaId, 
  diaSemana, 
  periodoAulaId, 
  horarioExistente = null,
  onSalvar,
  periodoLetivoId
}) => {
  // Hook para acessar banco da escola
  const { getData, setData, removeData, isReady } = useSchoolDatabase();
  
  const [form, setForm] = useState({
    disciplinaId: '',
    professorId: ''
  });
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const diasSemanaLabels = {
    1: 'Segunda-feira',
    2: 'Terça-feira', 
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira'
  };

  useEffect(() => {
    if (open) {
      carregarDados();
      if (horarioExistente) {
        setForm({
          disciplinaId: horarioExistente.disciplinaId || '',
          professorId: horarioExistente.professorId || ''
        });
      } else {
        setForm({ disciplinaId: '', professorId: '' });
      }
      setMsg('');
    }
  }, [open, horarioExistente, isReady]);

  const carregarDados = async () => {
    if (!isReady) return;
    
    try {
      // Carregar disciplinas e professores
      const [disciplinasData, usuariosData] = await Promise.all([
        getData('disciplinas'),
        getData('usuarios')
      ]);
      
      // Processar disciplinas
      const disciplinasArray = disciplinasData
        ? Object.entries(disciplinasData).map(([id, disc]) => ({ id, ...disc }))
        : [];
      setDisciplinas(disciplinasArray);

      // Processar professores
      const professoresArray = usuariosData
        ? Object.entries(usuariosData)
            .filter(([_, user]) => user.role === 'professora')
            .map(([id, prof]) => ({ id, ...prof }))
        : [];
      setProfessores(professoresArray);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validarConflitos = async () => {
    if (!isReady) return 'Aguarde, carregando dados...';
    
    try {
      // Verificar se professor já tem aula neste horário no mesmo período letivo
      const turmasData = await getData(`GradeHoraria/${periodoLetivoId}`);
      
      if (turmasData) {
        // Buscar em todas as turmas deste período letivo
        const todosHorarios = [];
        Object.keys(turmasData).forEach(turmaKey => {
          const horariosData = turmasData[turmaKey];
          if (horariosData && typeof horariosData === 'object') {
            Object.values(horariosData).forEach(h => {
              todosHorarios.push(h);
            });
          }
        });

        const conflitoProfessor = todosHorarios.find(h => 
          h.professorId === form.professorId && 
          h.diaSemana === diaSemana && 
          h.periodoAula === periodoAulaId &&
          (!horarioExistente || h.id !== horarioExistente.id) // Ignorar o próprio horário na edição
        );

        if (conflitoProfessor) {
          return 'Este professor já tem uma aula agendada neste horário!';
        }

        // Verificar se turma já tem aula neste horário
        const conflitoTurma = todosHorarios.find(h => 
          h.turmaId === turmaId && 
          h.diaSemana === diaSemana && 
          h.periodoAula === periodoAulaId &&
          (!horarioExistente || h.id !== horarioExistente.id)
        );

        if (conflitoTurma) {
          return 'Esta turma já tem uma aula agendada neste horário!';
        }
      }
      
      return null;
    } catch (err) {
      console.error('Erro ao validar conflitos:', err);
      return 'Erro ao validar conflitos.';
    }
  };

  const handleSalvar = async () => {
    if (!form.disciplinaId || !form.professorId) {
      setMsg('Selecione a disciplina e o professor.');
      return;
    }

    if (!periodoLetivoId) {
      setMsg('Período letivo não definido.');
      return;
    }

    setLoading(true);
    setMsg('');

    // Validar conflitos
    const conflito = await validarConflitos();
    if (conflito) {
      setMsg(conflito);
      setLoading(false);
      return;
    }

    try {
      const horarioId = horarioExistente ? horarioExistente.id : `horario_${Date.now()}`;
      const horarioData = {
        turmaId,
        disciplinaId: form.disciplinaId,
        professorId: form.professorId,
        diaSemana,
        periodoAula: periodoAulaId,
        periodoLetivoId,
        createdAt: horarioExistente ? horarioExistente.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Salvar no caminho específico do período letivo
      await setData('GradeHoraria/${periodoLetivoId}/${turmaId}/${horarioId}', horarioData);
      
      // Buscar nomes para o log
      const disciplinaNome = disciplinas.find(d => d.id === form.disciplinaId)?.nome || 'Disciplina não encontrada';
      const professorNome = professores.find(p => p.id === form.professorId)?.nome || 'Professor não encontrado';
      const diaNome = diasSemanaLabels[diaSemana] || `Dia ${diaSemana}`;
      
      // Log da operação
      if (horarioExistente) {
        // Edição
        await logAction({
          action: LOG_ACTIONS.SCHEDULE_UPDATE,
          entity: 'schedule',
          entityId: horarioId,
          details: `Aula atualizada: ${disciplinaNome} - ${professorNome} (${diaNome}, Período ${periodoAulaId})`,
          changes: {
            disciplina: disciplinaNome,
            professor: professorNome,
            diaSemana: diaNome,
            periodo: periodoAulaId,
            turmaId: turmaId
          }
        });
      } else {
        // Criação
        await logAction({
          action: LOG_ACTIONS.SCHEDULE_CREATE,
          entity: 'schedule',
          entityId: horarioId,
          details: `Nova aula criada: ${disciplinaNome} - ${professorNome} (${diaNome}, Período ${periodoAulaId})`,
          changes: {
            disciplina: disciplinaNome,
            professor: professorNome,
            diaSemana: diaNome,
            periodo: periodoAulaId,
            turmaId: turmaId
          }
        });
      }
      
      onSalvar();
      onClose();
    } catch (err) {
      setMsg('Erro ao salvar horário.');
    }
    setLoading(false);
  };

  const handleExcluir = async () => {
    if (!horarioExistente || !window.confirm('Confirma a exclusão desta aula?')) return;
    
    if (!periodoLetivoId) {
      setMsg('Período letivo não definido.');
      return;
    }
    
    setLoading(true);
    try {
      // Buscar nomes para o log antes de excluir
      const disciplinaNome = disciplinas.find(d => d.id === horarioExistente.disciplinaId)?.nome || 'Disciplina não encontrada';
      const professorNome = professores.find(p => p.id === horarioExistente.professorId)?.nome || 'Professor não encontrado';
      const diaNome = diasSemanaLabels[diaSemana] || `Dia ${diaSemana}`;
      
      await removeData('GradeHoraria/${periodoLetivoId}/${turmaId}/${horarioExistente.id}');
      
      // Log da exclusão
      await logAction({
        action: LOG_ACTIONS.SCHEDULE_DELETE,
        entity: 'schedule',
        entityId: horarioExistente.id,
        details: `Aula excluída: ${disciplinaNome} - ${professorNome} (${diaNome}, Período ${periodoAulaId})`,
        changes: {
          disciplina: disciplinaNome,
          professor: professorNome,
          diaSemana: diaNome,
          periodo: periodoAulaId,
          turmaId: turmaId
        }
      });
      
      onSalvar();
      onClose();
    } catch (err) {
      setMsg('Erro ao excluir horário.');
    }
    setLoading(false);
  };

  // Filtrar professores que podem lecionar a disciplina selecionada
  const professoresFiltrados = professores.filter(prof => {
    if (!form.disciplinaId) return true;
    if (!prof.disciplinas) return false;
    return prof.disciplinas.includes(form.disciplinaId);
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {horarioExistente ? 'Editar Aula' : 'Nova Aula'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box>
            <Typography variant="subtitle2" color="primary">
              📅 {diasSemanaLabels[diaSemana]} - Período: {periodoAulaId}
            </Typography>
            <Divider sx={{ my: 1 }} />
          </Box>

          <FormControl fullWidth required>
            <InputLabel>Disciplina</InputLabel>
            <Select
              name="disciplinaId"
              value={form.disciplinaId}
              label="Disciplina"
              onChange={handleFormChange}
            >
              {disciplinas.map((disciplina) => (
                <MenuItem key={disciplina.id} value={disciplina.id}>
                  {disciplina.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel>Professor(a)</InputLabel>
            <Select
              name="professorId"
              value={form.professorId}
              label="Professor(a)"
              onChange={handleFormChange}
              disabled={!form.disciplinaId}
            >
              {professoresFiltrados.map((professor) => (
                <MenuItem key={professor.id} value={professor.id}>
                  {professor.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {form.disciplinaId && professoresFiltrados.length === 0 && (
            <Alert severity="warning">
              Nenhum professor está habilitado para esta disciplina. 
              Verifique o cadastro dos professores.
            </Alert>
          )}

          {msg && (
            <Alert severity="error">{msg}</Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {horarioExistente && (
          <Button 
            onClick={handleExcluir} 
            color="error"
            disabled={loading}
          >
            Excluir
          </Button>
        )}
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSalvar}
          variant="contained"
          disabled={loading || !form.disciplinaId || !form.professorId}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalHorario;