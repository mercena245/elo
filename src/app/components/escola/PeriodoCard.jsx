import React from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const PeriodoCard = ({
  periodoForm,
  salvandoPeriodo,
  msgPeriodo,
  abaPeriodo,
  setAbaPeriodo,
  modalCadastroPeriodoOpen,
  setModalCadastroPeriodoOpen,
  handlePeriodoFormChange,
  handleSalvarPeriodo,
  loadingConsulta,
  periodosCadastrados,
  carregarPeriodosCadastrados,
  handleTrocarAbaPeriodo,
  editDialogOpen,
  setEditDialogOpen,
  editPeriodoForm,
  handleEditPeriodoFormChange,
  handleSalvarEdicaoPeriodo,
  editMsg,
  editLoading,
  handleEditarPeriodoClick,
  handleExcluirPeriodo,
  formatDateBR
}) => {
  return (
    <Box>
      <Button variant="contained" color="primary" size="small" sx={{ mb: 2 }} onClick={() => setModalCadastroPeriodoOpen(true)}>
        Novo Período
      </Button>
      <Dialog open={modalCadastroPeriodoOpen} onClose={() => setModalCadastroPeriodoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Período</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }} onSubmit={handleSalvarPeriodo}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="ano-select-label">Ano</InputLabel>
                <Select labelId="ano-select-label" name="ano" value={periodoForm.ano} label="Ano" onChange={handlePeriodoFormChange} required>
                  {[2023, 2024, 2025, 2026].map(ano => (<MenuItem key={ano} value={ano}>{ano}</MenuItem>))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="periodo-select-label">Período</InputLabel>
                <Select labelId="periodo-select-label" name="periodo" value={periodoForm.periodo} label="Período" onChange={handlePeriodoFormChange} required>
                  <MenuItem value="integral">Integral</MenuItem>
                  <MenuItem value="meio-periodo">Meio Período</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <FormControl fullWidth>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>Status:</Typography>
                <Switch checked={periodoForm.ativo} onChange={e => handlePeriodoFormChange({ target: { name: 'ativo', type: 'checkbox', checked: e.target.checked } })} color="primary" />
                <Typography>{periodoForm.ativo ? 'Ativo' : 'Inativo'}</Typography>
              </Box>
            </FormControl>
            <TextField label="Data de Início" type="date" name="dataInicio" value={periodoForm.dataInicio} onChange={handlePeriodoFormChange} InputLabelProps={{ shrink: true }} fullWidth required />
            <TextField label="Data de Fim" type="date" name="dataFim" value={periodoForm.dataFim} onChange={handlePeriodoFormChange} InputLabelProps={{ shrink: true }} fullWidth required />
            {msgPeriodo && (<Typography color={msgPeriodo.includes("sucesso") ? "primary" : "error"} variant="body2" align="center" mt={1}>{msgPeriodo}</Typography>)}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalCadastroPeriodoOpen(false)} color="secondary">Cancelar</Button>
          <Button onClick={handleSalvarPeriodo} color="primary" disabled={salvandoPeriodo} type="submit">{salvandoPeriodo ? "Salvando..." : "Salvar Período"}</Button>
        </DialogActions>
      </Dialog>
        <Box>
        <Box>
          {loadingConsulta ? (
            <Box sx={{ textAlign: "center", py: 2 }}><CircularProgress size={32} /></Box>
          ) : periodosCadastrados.length === 0 ? (
            <Typography color="text.secondary" align="center">Nenhum período cadastrado.</Typography>
          ) : (
            <List>
              {periodosCadastrados.map(periodo => (
                <ListItem key={periodo.id} sx={{ mb: 1, bgcolor: "#f8f8f8", borderRadius: 2, display: "flex", alignItems: "center" }}
                  secondaryAction={
                    <Box>
                      <IconButton edge="end" color="primary" sx={{ mr: 1 }} onClick={() => handleEditarPeriodoClick(periodo)}><Edit /></IconButton>
                      <IconButton edge="end" color="error" onClick={() => handleExcluirPeriodo(periodo.id)}><Delete /></IconButton>
                    </Box>
                  }>
                  <ListItemText primary={`Ano: ${periodo.ano} | Período: ${periodo.periodo} | ${periodo.ativo ? "Ativo" : "Inativo"}`} secondary={<>Início: {formatDateBR(periodo.dataInicio)} • Fim: {formatDateBR(periodo.dataFim)}</>} />
                </ListItem>
              ))}
            </List>
          )}
          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Editar Período</DialogTitle>
            <DialogContent>
              <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel id="edit-ano-label">Ano</InputLabel>
                    <Select labelId="edit-ano-label" name="ano" value={editPeriodoForm.ano} label="Ano" onChange={handleEditPeriodoFormChange} required>
                      {[2023, 2024, 2025, 2026].map(ano => (<MenuItem key={ano} value={ano}>{ano}</MenuItem>))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel id="edit-periodo-label">Período</InputLabel>
                    <Select labelId="edit-periodo-label" name="periodo" value={editPeriodoForm.periodo} label="Período" onChange={handleEditPeriodoFormChange} required>
                      <MenuItem value={1}>1</MenuItem>
                      <MenuItem value={2}>2</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <FormControl fullWidth>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography>Status:</Typography>
                    <Switch checked={editPeriodoForm.ativo} onChange={e => handleEditPeriodoFormChange({ target: { name: 'ativo', type: 'checkbox', checked: e.target.checked } })} color="primary" />
                    <Typography>{editPeriodoForm.ativo ? 'Ativo' : 'Inativo'}</Typography>
                  </Box>
                </FormControl>
                <TextField label="Data de Início" type="date" name="dataInicio" value={editPeriodoForm.dataInicio} onChange={handleEditPeriodoFormChange} InputLabelProps={{ shrink: true }} fullWidth required />
                <TextField label="Data de Fim" type="date" name="dataFim" value={editPeriodoForm.dataFim} onChange={handleEditPeriodoFormChange} InputLabelProps={{ shrink: true }} fullWidth required />
                {editMsg && (<Typography color={editMsg.includes("sucesso") ? "primary" : "error"} variant="body2" align="center" mt={1}>{editMsg}</Typography>)}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)} color="secondary">Cancelar</Button>
              <Button onClick={handleSalvarEdicaoPeriodo} color="primary" disabled={editLoading}>{editLoading ? "Salvando..." : "Salvar Alterações"}</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
};

export default PeriodoCard;
