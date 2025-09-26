import React, { useState } from "react";
import { Box, Button, Typography, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { getProfessoresPorDisciplina } from "./useProfessoresPorDisciplina";

export default function DisciplinaCard({
  disciplinas, loadingDisciplinas, openDisciplinaModal, novaDisciplina,
  setOpenDisciplinaModal, setNovaDisciplina, handleAddDisciplina, handleExcluirDisciplina
}) {

  const [confirmDisciplina, setConfirmDisciplina] = useState(null);
  const [professoresVinculados, setProfessoresVinculados] = useState([]);
  const [abrindoConfirm, setAbrindoConfirm] = useState(false);
  const [loadingProfs, setLoadingProfs] = useState(false);

  const handleClickExcluir = async (disc) => {
    setAbrindoConfirm(true);
    setConfirmDisciplina(disc);
    setLoadingProfs(true);
    try {
      const profs = await getProfessoresPorDisciplina(disc.id);
      setProfessoresVinculados(profs);
    } catch {
      setProfessoresVinculados([]);
    }
    setLoadingProfs(false);
  };

  const handleConfirmExclusao = () => {
    if (confirmDisciplina && professoresVinculados.length === 0) {
      handleExcluirDisciplina(confirmDisciplina);
    }
    // Sempre fecha o modal customizado e não chama mais nada
    setConfirmDisciplina(null);
    setProfessoresVinculados([]);
    setAbrindoConfirm(false);
  };

  const handleFecharConfirm = () => {
    // Apenas fecha o modal customizado, sem chamar handleExcluirDisciplina
    setConfirmDisciplina(null);
    setProfessoresVinculados([]);
    setAbrindoConfirm(false);
  };

  return (
    <Box>
      <Button variant="contained" color="primary" size="small" sx={{ mb: 2 }} onClick={() => setOpenDisciplinaModal(true)}>
        Nova Disciplina
      </Button>
      {loadingDisciplinas ? (
        <Typography variant="body2" color="text.secondary">Carregando...</Typography>
      ) : disciplinas.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Nenhuma disciplina cadastrada.</Typography>
      ) : (
        <List>
          {disciplinas.map(disc => (
            <ListItem key={disc.id} secondaryAction={
              <IconButton edge="end" color="error" onClick={e => { e.stopPropagation(); if (!abrindoConfirm) handleClickExcluir(disc); }}>
  <Dialog open={abrindoConfirm} onClose={() => handleFecharConfirm()} maxWidth="xs" fullWidth>
        <DialogTitle>Excluir disciplina</DialogTitle>
        <DialogContent>
          {loadingProfs ? (
            <Typography>Carregando vínculos...</Typography>
          ) : professoresVinculados.length > 0 ? (
            <>
              <Typography color="error" fontWeight={600} gutterBottom>
                Não é possível excluir esta disciplina pois há professores vinculados:
              </Typography>
              <List>
                {professoresVinculados.map((nome, idx) => (
                  <ListItem key={idx}><ListItemText primary={nome} /></ListItem>
                ))}
              </List>
            </>
          ) : (
            <Typography>Deseja realmente excluir esta disciplina?</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleFecharConfirm()} color="secondary">Cancelar</Button>
          <Button onClick={handleConfirmExclusao} color="error" disabled={professoresVinculados.length > 0 || loadingProfs}>Excluir</Button>
        </DialogActions>
      </Dialog>
                <Delete />
              </IconButton>
            }>
              <ListItemText primary={disc.nome} />
            </ListItem>
          ))}
        </List>
      )}
      <Dialog open={openDisciplinaModal} onClose={() => setOpenDisciplinaModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nova Disciplina</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome da disciplina"
            value={novaDisciplina}
            onChange={e => setNovaDisciplina(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDisciplinaModal(false)} color="secondary">Cancelar</Button>
          <Button onClick={handleAddDisciplina} color="primary" disabled={!novaDisciplina.trim()}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
