
import React from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const TurmaCard = ({
  turmas,
  loading,
  filtroTurno,
  setFiltroTurno,
  filtroNomeTurma,
  setFiltroNomeTurma,
  handleAddTurma,
  handleEditTurma,
  handleExcluirTurma,
  periodosAtivos,
  openTurmaModal,
  setOpenTurmaModal,
  editTurma,
  editTurmaForm,
  setEditTurmaForm,
  isNewTurma,
  savingTurma,
  handleTurmaFormChange,
  handleSaveTurma,
  gestaoTurmaOpen,
  gestaoTurma,
  handleOpenGestaoTurma,
  handleCloseGestaoTurma,
  alunosTurma,
  calcularIdade,
  modalVinculosOpen,
  setModalVinculosOpen,
  vinculosTurma,
  modalConfirmExcluirOpen,
  setModalConfirmExcluirOpen,
  turmaExcluir,
  handleConfirmExcluirTurma,
  excluindoTurma,
  loadingPeriodosAtivos
}) => {
  return (
    <Box>
      <Button variant="contained" color="primary" size="small" sx={{ mb: 2 }} onClick={handleAddTurma}>
        Nova Turma
      </Button>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel id="filtro-turno-label">Filtrar por turno</InputLabel>
          <Select labelId="filtro-turno-label" value={filtroTurno || ''} label="Filtrar por turno" onChange={e => setFiltroTurno(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="Manhã">Manhã</MenuItem>
            <MenuItem value="Tarde">Tarde</MenuItem>
            <MenuItem value="Noite">Noite</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Filtrar por nome" variant="outlined" size="small" value={filtroNomeTurma} onChange={e => setFiltroNomeTurma(e.target.value)} sx={{ minWidth: 180 }} />
      </Box>
      {loading ? (
        <Typography variant="body2" color="text.secondary">Carregando...</Typography>
      ) : turmas.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Nenhuma turma encontrada.</Typography>
      ) : (
        <List>
          {turmas
            .filter(
              turma =>
                (!filtroTurno || turma.turnoId === filtroTurno) &&
                (!filtroNomeTurma || turma.nome.toLowerCase().includes(filtroNomeTurma.toLowerCase()))
            )
            .map(turma => (
              <ListItem
                key={turma.id}
                sx={{ mb: 1, bgcolor: '#f8f8f8', borderRadius: 2, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                onClick={e => { if (e.target.closest('.turma-action-btn')) return; handleOpenGestaoTurma(turma); }}
                secondaryAction={
                  <Box>
                    <IconButton className="turma-action-btn" color="primary" size="small" onClick={e => { e.stopPropagation(); handleEditTurma(turma); }}>
                      <Edit />
                    </IconButton>
                    <IconButton className="turma-action-btn" color="error" size="small" onClick={e => { e.stopPropagation(); handleExcluirTurma(turma); }}>
                      <Delete />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={<b>{turma.nome}</b>}
                  secondary={<>
                    <Typography variant="body2">Status: {turma.status || '-'}</Typography>
                    <Typography variant="body2">Turno: {turma.turnoId || '-'}</Typography>
                    <Typography variant="body2">Período: {periodosAtivos.find(p => p.id === turma.periodoId)?.label || turma.periodoId || '-'}</Typography>
                  </>}
                />
              </ListItem>
            ))}
        </List>
      )}
      {/* Modais mantidos */}
      <Dialog open={gestaoTurmaOpen} onClose={handleCloseGestaoTurma} maxWidth="md" fullWidth>
        <DialogTitle>Gestão da Turma: {gestaoTurma?.nome}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Alunos vinculados</Typography>
          {alunosTurma.length === 0 ? (
            <Typography color="text.secondary">Nenhum aluno vinculado a esta turma.</Typography>
          ) : (
            <List>
              {alunosTurma.map((aluno, idx) => (
                <ListItem key={aluno.id || idx} divider>
                  <ListItemText
                    primary={<><b>{aluno.nome}</b> (Matrícula: {aluno.matricula || '--'})</>}
                    secondary={<><Typography variant="body2">Pai: {aluno.nomePai || '--'}</Typography><Typography variant="body2">Mãe: {aluno.nomeMae || '--'}</Typography><Typography variant="body2">Idade: {calcularIdade(aluno.dataNascimento)}</Typography></>}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGestaoTurma} color="primary">Fechar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openTurmaModal} onClose={() => setOpenTurmaModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isNewTurma ? 'Incluir Turma' : 'Editar Turma'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nome" name="nome" value={editTurmaForm.nome || ''} onChange={handleTurmaFormChange} fullWidth required />
            <TextField label="Status" name="status" value={editTurmaForm.status || ''} onChange={handleTurmaFormChange} fullWidth />
            <FormControl fullWidth>
              <InputLabel id="turno-select-label">Turno</InputLabel>
              <Select labelId="turno-select-label" name="turnoId" value={editTurmaForm.turnoId || ''} label="Turno" onChange={handleTurmaFormChange} required>
                <MenuItem value="Manhã">Manhã</MenuItem>
                <MenuItem value="Tarde">Tarde</MenuItem>
                <MenuItem value="Noite">Noite</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel id="periodo-select-label-turma">Período</InputLabel>
              <Select labelId="periodo-select-label-turma" name="periodoId" value={editTurmaForm.periodoId || ''} label="Período" onChange={handleTurmaFormChange} required disabled={loadingPeriodosAtivos}>
                {loadingPeriodosAtivos ? (
                  <MenuItem value=""><CircularProgress size={20} /></MenuItem>
                ) : periodosAtivos.length === 0 ? (
                  <MenuItem value="">Nenhum período ativo disponível</MenuItem>
                ) : (
                  periodosAtivos.map(periodo => (
                    <MenuItem key={periodo.id} value={periodo.id}>{periodo.label}</MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTurmaModal(false)} color="secondary">Cancelar</Button>
          <Button onClick={handleSaveTurma} color="primary" disabled={savingTurma}>Salvar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={modalVinculosOpen} onClose={() => setModalVinculosOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Não é possível excluir a turma</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="error" gutterBottom>Existem os seguintes vínculos registrados nesta turma:</Typography>
          {vinculosTurma.map((vinc, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>{vinc.tipo}:</Typography>
              <List dense>
                {vinc.lista.map((nome, idx) => (<ListItem key={idx}><ListItemText primary={nome} /></ListItem>))}
              </List>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalVinculosOpen(false)} color="primary">Fechar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={modalConfirmExcluirOpen} onClose={() => setModalConfirmExcluirOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirma exclusão da turma?</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>Tem certeza que deseja excluir a turma <b>{turmaExcluir?.nome}</b>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalConfirmExcluirOpen(false)} color="secondary">Não</Button>
          <Button onClick={handleConfirmExcluirTurma} color="error" disabled={excluindoTurma}>{excluindoTurma ? "Excluindo..." : "Sim, excluir"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TurmaCard;
