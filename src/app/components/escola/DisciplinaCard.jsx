import React, { useState } from "react";
import { 
  Box, 
  Button, 
  Typography, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { getProfessoresPorDisciplina } from "./useProfessoresPorDisciplina";

export default function DisciplinaCard({
  disciplinas, loadingDisciplinas, openDisciplinaModal, novaDisciplina,
  setOpenDisciplinaModal, setNovaDisciplina, handleAddDisciplina, handleExcluirDisciplina
}) {

  const [confirmDisciplina, setConfirmDisciplina] = useState(null);
  const [professoresVinculados, setProfessoresVinculados] = useState([]);
  const [abrindoConfirm, setAbrindoConfirm] = useState(false);
  const [loadingProfs, setLoadingProfs] = useState(false);
  
  // Estados para edição
  const [editDisciplina, setEditDisciplina] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [openEditModal, setOpenEditModal] = useState(false);

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
    setConfirmDisciplina(null);
    setProfessoresVinculados([]);
    setAbrindoConfirm(false);
  };

  const handleFecharConfirm = () => {
    setConfirmDisciplina(null);
    setProfessoresVinculados([]);
    setAbrindoConfirm(false);
  };

  // Funções de edição
  const handleClickEditar = (disc) => {
    setEditDisciplina(disc);
    setEditNome(disc.nome);
    setOpenEditModal(true);
  };

  const handleSaveEdit = () => {
    if (editNome.trim() && editDisciplina) {
      // Aqui você deve implementar a função para atualizar no banco
      // Por enquanto, vou apenas fechar o modal
      // Você precisará adicionar essa função no componente pai
      console.log("Editando disciplina:", editDisciplina.id, "para:", editNome);
      setOpenEditModal(false);
      setEditDisciplina(null);
      setEditNome("");
    }
  };

  const handleCancelEdit = () => {
    setOpenEditModal(false);
    setEditDisciplina(null);
    setEditNome("");
  };

  return (
    <Box>
      <Button 
        variant="contained" 
        color="primary" 
        size="small" 
        sx={{ mb: 2 }} 
        onClick={() => setOpenDisciplinaModal(true)}
      >
        Nova Disciplina
      </Button>

      {loadingDisciplinas ? (
        <Typography variant="body2" color="text.secondary">Carregando...</Typography>
      ) : disciplinas.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Nenhuma disciplina cadastrada.</Typography>
      ) : (
        <List>
          {disciplinas.map(disc => (
            <ListItem 
              key={disc.id}
              sx={{ mb: 1, bgcolor: '#f8f8f8', borderRadius: 2, display: 'flex', alignItems: 'center' }}
              secondaryAction={
                <Box>
                  <IconButton 
                    color="primary" 
                    size="small" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleClickEditar(disc); 
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    color="error" 
                    size="small" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (!abrindoConfirm) handleClickExcluir(disc); 
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText primary={<b>{disc.nome}</b>} />
            </ListItem>
          ))}
        </List>
      )}

      {/* Modal de confirmação de exclusão */}
      <Dialog open={abrindoConfirm} onClose={handleFecharConfirm} maxWidth="xs" fullWidth>
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
          <Button onClick={handleFecharConfirm} color="secondary">Cancelar</Button>
          <Button onClick={handleConfirmExclusao} color="error" disabled={professoresVinculados.length > 0 || loadingProfs}>Excluir</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de edição */}
      <Dialog open={openEditModal} onClose={handleCancelEdit} maxWidth="xs" fullWidth>
        <DialogTitle>Editar Disciplina</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome da disciplina"
            value={editNome}
            onChange={e => setEditNome(e.target.value)}
            fullWidth
            autoFocus
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} color="secondary">Cancelar</Button>
          <Button onClick={handleSaveEdit} color="primary" disabled={!editNome.trim()}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de adicionar nova disciplina */}
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
