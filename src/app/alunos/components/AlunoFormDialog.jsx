import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const AlunoFormDialog = ({
  open,
  onClose,
  editAluno,
  editForm,
  setEditForm,
  isNew,
  saving,
  formError,
  formStep,
  setFormStep,
  onSave,
  turmas,
  userRole
}) => {
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Função para validar CPF
  const validarCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf[10]);
  };

  // Função para buscar endereço por CEP
  const buscarEnderecoPorCep = async (cep) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setEditForm(prev => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            cep,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  // Detectar mudanças no formulário
  useEffect(() => {
    const hasFormChanges = Object.keys(editForm).some(key => {
      if (!editAluno) return !!editForm[key];
      return editForm[key] !== editAluno[key];
    });
    setHasChanges(hasFormChanges);
  }, [editForm, editAluno]);

  // Função para lidar com tentativa de fechamento
  const handleCloseAttempt = () => {
    if (hasChanges) {
      setConfirmCloseOpen(true);
    } else {
      onClose();
    }
  };

  // Função para confirmar fechamento
  const handleConfirmClose = () => {
    setConfirmCloseOpen(false);
    onClose();
  };

  // Função para cancelar fechamento
  const handleCancelClose = () => {
    setConfirmCloseOpen(false);
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`form-tabpanel-${index}`}
      aria-labelledby={`form-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={handleCloseAttempt}
        maxWidth="md"
        fullWidth
        sx={{ '& .MuiDialog-paper': { maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {isNew ? '➕ Novo Aluno' : '✏️ Editar Aluno'}
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Tabs
            value={formStep - 1}
            onChange={(e, newValue) => setFormStep(newValue + 1)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab label="👤 Dados Pessoais" />
            <Tab label="💰 Dados Financeiros" />
          </Tabs>

          {/* Aba 1: Dados Pessoais */}
          <TabPanel value={formStep - 1} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  👤 Informações Pessoais
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome Completo"
                  value={editForm.nome || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CPF"
                  value={editForm.cpf || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, cpf: e.target.value }))}
                  error={editForm.cpf && !validarCPF(editForm.cpf)}
                  helperText={editForm.cpf && !validarCPF(editForm.cpf) ? 'CPF inválido' : ''}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Matrícula"
                  value={editForm.matricula || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, matricula: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Data de Nascimento"
                    value={editForm.dataNascimento ? dayjs(editForm.dataNascimento) : null}
                    onChange={(date) => setEditForm(prev => ({ 
                      ...prev, 
                      dataNascimento: date ? date.format('YYYY-MM-DD') : '' 
                    }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={editForm.telefone || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </Grid>

              {/* Seção de Endereço */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  📍 Endereço
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="CEP"
                  value={editForm.endereco?.cep || ''}
                  onChange={(e) => {
                    const cep = e.target.value;
                    setEditForm(prev => ({
                      ...prev,
                      endereco: { ...prev.endereco, cep }
                    }));
                    if (cep.length === 8) {
                      buscarEnderecoPorCep(cep);
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Rua"
                  value={editForm.endereco?.rua || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, rua: e.target.value }
                  }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  label="Número"
                  value={editForm.endereco?.numero || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, numero: e.target.value }
                  }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Bairro"
                  value={editForm.endereco?.bairro || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, bairro: e.target.value }
                  }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={editForm.endereco?.cidade || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, cidade: e.target.value }
                  }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Estado"
                  value={editForm.endereco?.estado || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    endereco: { ...prev.endereco, estado: e.target.value }
                  }))}
                />
              </Grid>

              {/* Turma */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  🎓 Dados Acadêmicos
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Turma</InputLabel>
                  <Select
                    value={editForm.turmaId || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, turmaId: e.target.value }))}
                    label="Turma"
                  >
                    {Object.entries(turmas).map(([id, turma]) => (
                      <MenuItem key={id} value={id}>
                        {turma.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editForm.status || 'ativo'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    label="Status"
                  >
                    <MenuItem value="ativo">Ativo</MenuItem>
                    <MenuItem value="inativo">Inativo</MenuItem>
                    <MenuItem value="transferido">Transferido</MenuItem>
                    <MenuItem value="formado">Formado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  multiline
                  rows={3}
                  value={editForm.observacoes || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Aba 2: Dados Financeiros */}
          <TabPanel value={formStep - 1} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  💰 Informações Financeiras
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome do Responsável"
                  value={editForm.responsavelNome || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, responsavelNome: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefone do Responsável"
                  value={editForm.responsavelTelefone || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, responsavelTelefone: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Dia de Vencimento"
                  type="number"
                  value={editForm.diaVencimento || 10}
                  onChange={(e) => setEditForm(prev => ({ ...prev, diaVencimento: parseInt(e.target.value) }))}
                  inputProps={{ min: 1, max: 31 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor da Mensalidade"
                  type="number"
                  value={editForm.valorMensalidade || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, valorMensalidade: parseFloat(e.target.value) }))}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {formError && (
            <Alert severity="error" sx={{ m: 3, mt: 0 }}>
              {formError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseAttempt}
            color="inherit"
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            variant="contained"
            disabled={saving}
            sx={{ minWidth: 120 }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : (isNew ? 'Salvar' : 'Atualizar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Fechamento */}
      <Dialog
        open={confirmCloseOpen}
        onClose={handleCancelClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          ⚠️ Confirmar Fechamento
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Você tem alterações não salvas no formulário.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Se fechar agora, todos os dados inseridos serão perdidos. Deseja realmente continuar?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCancelClose}
            color="inherit"
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmClose}
            sx={{
              bgcolor: '#dc2626',
              color: 'white',
              '&:hover': {
                bgcolor: '#b91c1c'
              }
            }}
            variant="contained"
          >
            Sim, Fechar e Perder Dados
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AlunoFormDialog;