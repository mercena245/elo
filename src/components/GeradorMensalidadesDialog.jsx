"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Schedule,
  AttachMoney,
  AutoAwesome,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
import { financeiroService } from '../services/financeiroService';
import { db, ref, get } from '../firebase';

const GeradorMensalidadesDialog = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alunos, setAlunos] = useState([]);
  
  // Estados do formulário
  const [configuracao, setConfiguracao] = useState({
    modo: 'individual', // individual, turma, todos
    alunoSelecionado: null,
    turmaSelecionada: null,
    mesesParaGerar: 12,
    mesInicio: new Date().getMonth() + 1,
    anoInicio: new Date().getFullYear(),
    sobrescreverExistentes: false,
    aplicarDesconto: false,
    descontoPercentual: 0,
    observacoes: ''
  });

  const [preview, setPreview] = useState({
    alunos: [],
    totalTitulos: 0,
    valorTotal: 0
  });

  const [resultado, setResultado] = useState(null);

  const steps = ['Configuração', 'Preview', 'Geração'];

  useEffect(() => {
    if (open) {
      fetchAlunos();
      resetDialog();
    }
  }, [open]);

  const resetDialog = () => {
    setStep(0);
    setResultado(null);
    setPreview({ alunos: [], totalTitulos: 0, valorTotal: 0 });
    setConfiguracao({
      modo: 'individual',
      alunoSelecionado: null,
      turmaSelecionada: null,
      mesesParaGerar: 12,
      mesInicio: new Date().getMonth() + 1,
      anoInicio: new Date().getFullYear(),
      sobrescreverExistentes: false,
      aplicarDesconto: false,
      descontoPercentual: 0,
      observacoes: ''
    });
  };

  const fetchAlunos = async () => {
    try {
      const alunosRef = ref(db, 'alunos');
      const snapshot = await get(alunosRef);
      
      if (snapshot.exists()) {
        const alunosData = Object.entries(snapshot.val())
          .map(([id, aluno]) => ({
            id,
            ...aluno
          }))
          .filter(aluno => aluno.status === 'ativo' && aluno.financeiro?.mensalidadeValor);
        
        setAlunos(alunosData);
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    }
  };

  const gerarPreview = () => {
    let alunosParaProcessar = [];

    switch (configuracao.modo) {
      case 'individual':
        if (configuracao.alunoSelecionado) {
          alunosParaProcessar = [configuracao.alunoSelecionado];
        }
        break;
      case 'turma':
        if (configuracao.turmaSelecionada) {
          alunosParaProcessar = alunos.filter(a => a.turmaId === configuracao.turmaSelecionada);
        }
        break;
      case 'todos':
        alunosParaProcessar = alunos;
        break;
    }

    const previewData = alunosParaProcessar.map(aluno => {
      const valorMensalidade = aluno.financeiro.mensalidadeValor;
      const desconto = configuracao.aplicarDesconto ? configuracao.descontoPercentual : (aluno.financeiro.descontoPercentual || 0);
      const valorComDesconto = valorMensalidade * (1 - desconto / 100);

      return {
        id: aluno.id,
        nome: aluno.nome,
        matricula: aluno.matricula,
        valorOriginal: valorMensalidade,
        desconto,
        valorFinal: valorComDesconto,
        quantidadeMeses: configuracao.mesesParaGerar,
        valorTotalAluno: valorComDesconto * configuracao.mesesParaGerar
      };
    });

    const totalTitulos = previewData.reduce((sum, item) => sum + item.quantidadeMeses, 0);
    const valorTotal = previewData.reduce((sum, item) => sum + item.valorTotalAluno, 0);

    setPreview({
      alunos: previewData,
      totalTitulos,
      valorTotal
    });
  };

  const handleNext = () => {
    if (step === 0) {
      gerarPreview();
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const executarGeracao = async () => {
    setLoading(true);
    try {
      const resultados = {
        sucessos: 0,
        erros: 0,
        detalhes: []
      };

      for (const alunoPreview of preview.alunos) {
        const aluno = alunos.find(a => a.id === alunoPreview.id);
        
        // Preparar dados financeiros
        const dadosFinanceiros = {
          mensalidadeValor: alunoPreview.valorFinal,
          diaVencimento: aluno.financeiro.diaVencimento || 10,
          descontoPercentual: alunoPreview.desconto
        };

        // Configurar parâmetros adicionais
        const parametrosGeracao = {
          mesesParaGerar: configuracao.mesesParaGerar,
          mesInicio: configuracao.mesInicio,
          anoInicio: configuracao.anoInicio,
          observacoes: configuracao.observacoes
        };

        const resultado = await financeiroService.gerarMensalidadesPersonalizadas(
          alunoPreview.id,
          dadosFinanceiros,
          parametrosGeracao
        );

        if (resultado.success) {
          resultados.sucessos++;
          resultados.detalhes.push({
            aluno: aluno.nome,
            status: 'sucesso',
            quantidade: resultado.quantidade
          });
        } else {
          resultados.erros++;
          resultados.detalhes.push({
            aluno: aluno.nome,
            status: 'erro',
            erro: resultado.error
          });
        }
      }

      setResultado(resultados);
      
      if (resultados.sucessos > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro na geração:', error);
      setResultado({
        sucessos: 0,
        erros: preview.alunos.length,
        detalhes: [{ erro: 'Erro geral na geração' }]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const turmasUnicas = [...new Set(alunos.map(a => a.turmaId))].filter(Boolean);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="primary" />
          <Typography variant="h6">
            Gerador Automático de Mensalidades
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={step} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Step 1: Configuração */}
        {step === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info" icon={<Info />}>
              Configure os parâmetros para geração automática das mensalidades. 
              Serão considerados apenas alunos ativos com valor de mensalidade definido.
            </Alert>

            <FormControl fullWidth>
              <InputLabel>Modo de Geração</InputLabel>
              <Select
                value={configuracao.modo}
                label="Modo de Geração"
                onChange={(e) => setConfiguracao(prev => ({ 
                  ...prev, 
                  modo: e.target.value,
                  alunoSelecionado: null,
                  turmaSelecionada: null
                }))}
              >
                <MenuItem value="individual">Aluno Individual</MenuItem>
                <MenuItem value="turma">Por Turma</MenuItem>
                <MenuItem value="todos">Todos os Alunos</MenuItem>
              </Select>
            </FormControl>

            {configuracao.modo === 'individual' && (
              <Autocomplete
                options={alunos}
                getOptionLabel={(aluno) => `${aluno.nome} - ${aluno.matricula}`}
                value={configuracao.alunoSelecionado}
                onChange={(e, value) => setConfiguracao(prev => ({ ...prev, alunoSelecionado: value }))}
                renderInput={(params) => (
                  <TextField {...params} label="Selecionar Aluno" required />
                )}
              />
            )}

            {configuracao.modo === 'turma' && (
              <FormControl fullWidth>
                <InputLabel>Selecionar Turma</InputLabel>
                <Select
                  value={configuracao.turmaSelecionada || ''}
                  label="Selecionar Turma"
                  onChange={(e) => setConfiguracao(prev => ({ ...prev, turmaSelecionada: e.target.value }))}
                >
                  {turmasUnicas.map(turmaId => (
                    <MenuItem key={turmaId} value={turmaId}>
                      {turmaId} ({alunos.filter(a => a.turmaId === turmaId).length} alunos)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Quantidade de Meses"
                type="number"
                value={configuracao.mesesParaGerar}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, mesesParaGerar: parseInt(e.target.value) }))}
                inputProps={{ min: 1, max: 24 }}
                sx={{ flex: 1 }}
              />

              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Mês de Início</InputLabel>
                <Select
                  value={configuracao.mesInicio}
                  label="Mês de Início"
                  onChange={(e) => setConfiguracao(prev => ({ ...prev, mesInicio: e.target.value }))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Ano"
                type="number"
                value={configuracao.anoInicio}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, anoInicio: parseInt(e.target.value) }))}
                inputProps={{ min: new Date().getFullYear(), max: new Date().getFullYear() + 2 }}
                sx={{ flex: 1 }}
              />
            </Box>

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={configuracao.aplicarDesconto}
                  onChange={(e) => setConfiguracao(prev => ({ ...prev, aplicarDesconto: e.target.checked }))}
                />
              }
              label="Aplicar desconto personalizado (sobrescreve desconto individual)"
            />

            {configuracao.aplicarDesconto && (
              <TextField
                label="Desconto Percentual"
                type="number"
                value={configuracao.descontoPercentual}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, descontoPercentual: parseFloat(e.target.value) }))}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                InputProps={{ endAdornment: '%' }}
                fullWidth
              />
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={configuracao.sobrescreverExistentes}
                  onChange={(e) => setConfiguracao(prev => ({ ...prev, sobrescreverExistentes: e.target.checked }))}
                />
              }
              label="Sobrescrever mensalidades existentes"
            />

            <TextField
              label="Observações"
              value={configuracao.observacoes}
              onChange={(e) => setConfiguracao(prev => ({ ...prev, observacoes: e.target.value }))}
              multiline
              rows={2}
              fullWidth
              placeholder="Observações sobre esta geração de mensalidades..."
            />
          </Box>
        )}

        {/* Step 2: Preview */}
        {step === 1 && (
          <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Atenção:</strong> Serão gerados <strong>{preview.totalTitulos} títulos</strong> totalizando{' '}
                <strong>{formatCurrency(preview.valorTotal)}</strong>. Revise os dados antes de confirmar.
              </Typography>
            </Alert>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Aluno</TableCell>
                    <TableCell>Matrícula</TableCell>
                    <TableCell align="right">Valor Original</TableCell>
                    <TableCell align="center">Desconto</TableCell>
                    <TableCell align="right">Valor Final</TableCell>
                    <TableCell align="center">Meses</TableCell>
                    <TableCell align="right">Total Aluno</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.alunos.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.nome}</TableCell>
                      <TableCell>{item.matricula}</TableCell>
                      <TableCell align="right">{formatCurrency(item.valorOriginal)}</TableCell>
                      <TableCell align="center">
                        {item.desconto > 0 && (
                          <Chip 
                            label={`${item.desconto}%`} 
                            color="success" 
                            size="small" 
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(item.valorFinal)}</TableCell>
                      <TableCell align="center">{item.quantidadeMeses}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(item.valorTotalAluno)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Card sx={{ mt: 2, bgcolor: 'primary.main', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">
                      Resumo da Geração
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {preview.alunos.length} alunos • {preview.totalTitulos} títulos
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(preview.valorTotal)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Step 3: Resultado */}
        {step === 2 && (
          <Box>
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography variant="body1">
                  Gerando mensalidades... Isso pode levar alguns momentos.
                </Typography>
              </Box>
            ) : resultado && (
              <Box>
                <Alert 
                  severity={resultado.erros === 0 ? "success" : resultado.sucessos === 0 ? "error" : "warning"}
                  sx={{ mb: 3 }}
                >
                  <Typography variant="body1">
                    <strong>Geração concluída!</strong>
                  </Typography>
                  <Typography variant="body2">
                    Sucessos: {resultado.sucessos} • Erros: {resultado.erros}
                  </Typography>
                </Alert>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Aluno</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Detalhes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resultado.detalhes.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.aluno}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.status}
                              color={item.status === 'sucesso' ? 'success' : 'error'}
                              icon={item.status === 'sucesso' ? <CheckCircle /> : <Warning />}
                            />
                          </TableCell>
                          <TableCell>
                            {item.status === 'sucesso' 
                              ? `${item.quantidade} mensalidades geradas`
                              : item.erro
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {step === 2 ? 'Fechar' : 'Cancelar'}
        </Button>
        
        {step > 0 && step < 2 && (
          <Button onClick={handleBack}>
            Voltar
          </Button>
        )}
        
        {step < 1 && (
          <Button 
            onClick={handleNext}
            variant="contained"
            disabled={
              (configuracao.modo === 'individual' && !configuracao.alunoSelecionado) ||
              (configuracao.modo === 'turma' && !configuracao.turmaSelecionada)
            }
          >
            Próximo
          </Button>
        )}
        
        {step === 1 && (
          <Button 
            onClick={handleNext}
            variant="contained"
            disabled={preview.alunos.length === 0}
          >
            Gerar Mensalidades
          </Button>
        )}
        
        {step === 2 && !loading && resultado && (
          <Button 
            onClick={executarGeracao}
            variant="contained"
            disabled={true}
          >
            Concluído
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GeradorMensalidadesDialog;