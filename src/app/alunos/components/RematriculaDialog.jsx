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
  Grid,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  AccountBalance as AccountBalanceIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

/**
 * Dialog de Rematrícula
 * Exibe dados do aluno para conferência e gerencia títulos em aberto
 */
const RematriculaDialog = ({ 
  open, 
  onClose, 
  aluno, 
  turmas = {},
  financeiroService,
  userId,
  userName = 'Sistema',
  updateAluno,
  onRematriculaSuccess 
}) => {
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [titulosAbertos, setTitulosAbertos] = useState([]);
  const [etapa, setEtapa] = useState('conferencia'); // conferencia, pendencias, confirmacao
  const [acaoEscolhida, setAcaoEscolhida] = useState('');
  const [dadosRematricula, setDadosRematricula] = useState({
    turmaId: '',
    mensalidadeValor: 0,
    diaVencimento: 10,
    descontoPercentual: 0,
    valorMatricula: 0,
    valorMateriais: 0,
    dataInicioCompetencia: '',
    dataFimCompetencia: ''
  });
  const [renegociacaoConfig, setRenegociacaoConfig] = useState({
    valorTotal: 0,
    numeroParcelas: 1,
    diaVencimento: 10,
    valorParcela: 0
  });
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    if (open && aluno) {
      carregarDadosRematricula();
    }
  }, [open, aluno]);

  const carregarDadosRematricula = async () => {
    setLoading(true);
    setMensagem({ tipo: '', texto: '' });
    
    try {
      // Carregar títulos em aberto
      if (financeiroService && financeiroService.buscarTitulosAluno) {
        const resultado = await financeiroService.buscarTitulosAluno(aluno.id);
        
        if (resultado.success && resultado.titulos) {
          const abertos = resultado.titulos.filter(t => 
            t.status === 'pendente' || t.status === 'vencido'
          );
          setTitulosAbertos(abertos);
        }
      }

      // Preencher dados iniciais com informações do aluno
      setDadosRematricula({
        turmaId: aluno.turmaId || '',
        mensalidadeValor: aluno.financeiro?.mensalidadeValor || 0,
        diaVencimento: aluno.financeiro?.diaVencimento || 10,
        descontoPercentual: aluno.financeiro?.descontoPercentual || 0,
        valorMatricula: aluno.financeiro?.valorMatricula || 0,
        valorMateriais: aluno.financeiro?.valorMateriais || 0,
        dataInicioCompetencia: '',
        dataFimCompetencia: ''
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setMensagem({ tipo: 'error', texto: 'Erro ao carregar informações do aluno' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvancar = () => {
    // Validar campos obrigatórios
    if (!dadosRematricula.turmaId) {
      setMensagem({ tipo: 'error', texto: 'Selecione uma turma' });
      return;
    }
    if (!dadosRematricula.dataInicioCompetencia || !dadosRematricula.dataFimCompetencia) {
      setMensagem({ tipo: 'error', texto: 'Defina o período de competência (início e fim)' });
      return;
    }
    if (dadosRematricula.mensalidadeValor <= 0) {
      setMensagem({ tipo: 'error', texto: 'Valor da mensalidade deve ser maior que zero' });
      return;
    }

    // Verificar se tem pendências
    if (titulosAbertos.length > 0) {
      // Inicializar configuração de renegociação com valor total correto
      const total = calcularTotalAberto();
      setRenegociacaoConfig({
        valorTotal: parseFloat(total.toFixed(2)),
        numeroParcelas: 1,
        diaVencimento: dadosRematricula.diaVencimento || 10,
        valorParcela: parseFloat(total.toFixed(2))
      });
      setEtapa('pendencias');
    } else {
      setEtapa('confirmacao');
    }
  };

  const calcularTotalAberto = () => {
    return titulosAbertos.reduce((total, titulo) => total + (parseFloat(titulo.valor) || 0), 0);
  };

  const handleRenegociacaoChange = (field, value) => {
    const novaConfig = { ...renegociacaoConfig, [field]: value };
    
    // Recalcular valor da parcela se mudou número de parcelas ou valor total
    if (field === 'numeroParcelas' || field === 'valorTotal') {
      const numParcelas = field === 'numeroParcelas' ? parseInt(value) : novaConfig.numeroParcelas;
      const valorTotal = field === 'valorTotal' ? parseFloat(value) : novaConfig.valorTotal;
      
      if (numParcelas > 0 && valorTotal > 0) {
        novaConfig.valorParcela = parseFloat((valorTotal / numParcelas).toFixed(2));
      } else {
        novaConfig.valorParcela = 0;
      }
    }
    
    setRenegociacaoConfig(novaConfig);
  };

  const handleConfirmarRematricula = async () => {
    setProcessando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      // 1. Processar títulos em aberto conforme ação escolhida
      if (titulosAbertos.length > 0 && acaoEscolhida) {
        await processarTitulosAbertos();
      }

      // 2. Gerar novos títulos da rematrícula
      await gerarTitulosRematricula();

      // 3. Atualizar aluno com data de rematrícula
      if (updateAluno && aluno?.id) {
        await updateAluno(aluno.id, {
          ...aluno,
          dataRematricula: new Date().toISOString(),
          ultimaRematricula: {
            data: new Date().toISOString(),
            usuario: userName || 'Sistema',
            turmaId: dadosRematricula?.turmaId || aluno.turmaId
          }
        });
      }

      // 4. Sucesso
      setMensagem({ tipo: 'success', texto: 'Rematrícula realizada com sucesso!' });
      
      setTimeout(() => {
        if (onRematriculaSuccess) {
          onRematriculaSuccess();
        }
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Erro na rematrícula:', error);
      setMensagem({ tipo: 'error', texto: error.message || 'Erro ao processar rematrícula' });
    } finally {
      setProcessando(false);
    }
  };

  const processarTitulosAbertos = async () => {
    if (!financeiroService) throw new Error('Serviço financeiro não disponível');

    switch (acaoEscolhida) {
      case 'manter':
        // Não faz nada, títulos continuam em aberto
        console.log('Títulos mantidos em aberto para pagamento posterior');
        break;

      case 'renegociar_total':
        // Baixar todos os títulos antigos e criar um novo com valor total
        await renegociarValorTotal();
        break;

      case 'renegociar_parcelas':
        // Baixar todos os títulos antigos e criar parcelas
        await renegociarEmParcelas();
        break;

      case 'baixar_todos':
        // Marcar todos como pagos (confirmação de recebimento)
        await baixarTodosTitulos();
        break;

      default:
        throw new Error('Ação não especificada para títulos em aberto');
    }
  };

  const renegociarValorTotal = async () => {
    if (!aluno?.id || !titulosAbertos) return;
    
    const valorTotal = calcularTotalAberto();
    const dataRenegociacao = new Date().toISOString();
    
    // Cancelar títulos antigos com informações de renegociação
    for (const titulo of titulosAbertos) {
      if (financeiroService?.cancelarTitulo && titulo?.id) {
        await financeiroService.cancelarTitulo(
          titulo.id, 
          `Cancelado por renegociação de rematrícula. Valor total: R$ ${valorTotal.toFixed(2)}. Data: ${new Date(dataRenegociacao).toLocaleDateString('pt-BR')}`,
          userName || 'Sistema'
        );
      }
    }

    // Criar novo título único
    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + 30); // 30 dias

    if (financeiroService?.gerarTitulo) {
      await financeiroService.gerarTitulo({
        alunoId: aluno.id,
        tipo: 'renegociacao',
        descricao: `Renegociação de Débitos - ${aluno.nome || 'Aluno'}`,
        valor: valorTotal,
        valorOriginal: valorTotal,
        vencimento: vencimento.toISOString().split('T')[0],
        status: 'pendente',
        observacoes: `Renegociação de ${titulosAbertos.length} título(s) em aberto`,
        dataRenegociacao,
        renegociadoPor: userName || 'Sistema'
      });
    }
  };

  const renegociarEmParcelas = async () => {
    if (!aluno?.id || !titulosAbertos || !renegociacaoConfig) return;
    
    const { valorTotal, numeroParcelas, diaVencimento, valorParcela } = renegociacaoConfig;
    const dataRenegociacao = new Date().toISOString();
    
    // Cancelar títulos antigos com informações de renegociação
    for (const titulo of titulosAbertos) {
      if (financeiroService?.cancelarTitulo && titulo?.id) {
        await financeiroService.cancelarTitulo(
          titulo.id, 
          `Cancelado por renegociação em ${numeroParcelas} parcelas (rematrícula). Valor total: R$ ${valorTotal.toFixed(2)}. Data: ${new Date(dataRenegociacao).toLocaleDateString('pt-BR')}`,
          userName || 'Sistema'
        );
      }
    }

    // Criar parcelas
    for (let i = 1; i <= (numeroParcelas || 1); i++) {
      const vencimento = new Date();
      vencimento.setMonth(vencimento.getMonth() + i);
      vencimento.setDate(diaVencimento || 10);

      if (financeiroService?.gerarTitulo) {
        await financeiroService.gerarTitulo({
          alunoId: aluno.id,
          tipo: 'renegociacao',
          descricao: `Renegociação ${i}/${numeroParcelas} - ${aluno.nome || 'Aluno'}`,
          valor: valorParcela || 0,
          valorOriginal: valorParcela || 0,
          vencimento: vencimento.toISOString().split('T')[0],
          status: 'pendente',
          observacoes: `Parcela ${i} de ${numeroParcelas} da renegociação`,
          dataRenegociacao,
          renegociadoPor: userName || 'Sistema'
        });
      }
    }
  };

  const baixarTodosTitulos = async () => {
    if (!titulosAbertos || !Array.isArray(titulosAbertos)) return;
    
    for (const titulo of titulosAbertos) {
      if (financeiroService?.registrarPagamento && titulo?.id) {
        await financeiroService.registrarPagamento({
          tituloId: titulo.id,
          valorPago: titulo.valor || 0,
          dataPagamento: new Date().toISOString().split('T')[0],
          formaPagamento: 'rematricula',
          observacoes: 'Pagamento confirmado na rematrícula'
        });
      }
    }
  };

  const gerarTitulosRematricula = async () => {
    if (!financeiroService || !financeiroService.gerarTitulosNovoAluno) {
      throw new Error('Serviço de geração de títulos não disponível');
    }

    if (!aluno?.id || !aluno?.nome) {
      throw new Error('Dados do aluno incompletos');
    }

    const dadosFinanceiros = {
      nome: aluno.nome,
      matricula: aluno.matricula || '',
      turmaId: dadosRematricula?.turmaId || '',
      financeiro: dadosRematricula || {}
    };

    const resultado = await financeiroService.gerarTitulosNovoAluno(aluno.id, dadosFinanceiros);
    
    if (!resultado?.success) {
      throw new Error(resultado?.error || 'Erro ao gerar títulos da rematrícula');
    }
  };

  const renderConferencia = () => {
    if (!aluno) return null;
    
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Conferência de Dados</strong><br/>
            Revise as informações do aluno e configure os valores da rematrícula.
          </Typography>
        </Alert>

        {/* Dados do Aluno */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            Dados do Aluno
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Nome:</Typography>
              <Typography variant="body1" fontWeight={600}>{aluno?.nome || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Matrícula:</Typography>
              <Typography variant="body1" fontWeight={600}>{aluno?.matricula || 'Não informada'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">CPF:</Typography>
              <Typography variant="body1">{aluno?.cpf || 'Não informado'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Data de Nascimento:</Typography>
              <Typography variant="body1">
                {aluno?.dataNascimento ? dayjs(aluno.dataNascimento).format('DD/MM/YYYY') : 'Não informada'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Responsável Financeiro:</Typography>
              <Typography variant="body1">{aluno?.responsavelFinanceiro?.nome || 'Não informado'}</Typography>
            </Grid>
          </Grid>
        </Paper>

      {/* Configuração da Rematrícula */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon color="primary" />
          Configuração da Rematrícula
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Turma *</InputLabel>
              <Select
                value={dadosRematricula.turmaId}
                label="Turma *"
                onChange={(e) => setDadosRematricula({ ...dadosRematricula, turmaId: e.target.value })}
              >
                {Object.entries(turmas).map(([id, turma]) => (
                  <MenuItem key={id} value={id}>{turma.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Valor da Mensalidade *"
              type="number"
              value={dadosRematricula.mensalidadeValor}
              onChange={(e) => setDadosRematricula({ ...dadosRematricula, mensalidadeValor: parseFloat(e.target.value) })}
              InputProps={{ startAdornment: 'R$ ' }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Dia do Vencimento"
              type="number"
              value={dadosRematricula.diaVencimento}
              onChange={(e) => setDadosRematricula({ ...dadosRematricula, diaVencimento: parseInt(e.target.value) })}
              inputProps={{ min: 1, max: 28 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Desconto (%)"
              type="number"
              value={dadosRematricula.descontoPercentual}
              onChange={(e) => setDadosRematricula({ ...dadosRematricula, descontoPercentual: parseFloat(e.target.value) })}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Taxa de Matrícula"
              type="number"
              value={dadosRematricula.valorMatricula}
              onChange={(e) => setDadosRematricula({ ...dadosRematricula, valorMatricula: parseFloat(e.target.value) })}
              InputProps={{ startAdornment: 'R$ ' }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Data Início Competência *"
              type="date"
              value={dadosRematricula.dataInicioCompetencia}
              onChange={(e) => setDadosRematricula({ ...dadosRematricula, dataInicioCompetencia: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Data Fim Competência *"
              type="date"
              value={dadosRematricula.dataFimCompetencia}
              onChange={(e) => setDadosRematricula({ ...dadosRematricula, dataFimCompetencia: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Taxa de Materiais"
              type="number"
              value={dadosRematricula.valorMateriais}
              onChange={(e) => setDadosRematricula({ ...dadosRematricula, valorMateriais: parseFloat(e.target.value) })}
              InputProps={{ startAdornment: 'R$ ' }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Alerta sobre títulos em aberto */}
      {titulosAbertos && titulosAbertos.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />}>
          <Typography variant="body2">
            <strong>Atenção!</strong> Este aluno possui {titulosAbertos.length} título(s) em aberto 
            no valor total de <strong>R$ {calcularTotalAberto().toFixed(2)}</strong>.
            <br/>
            Você deverá escolher uma ação para esses títulos na próxima etapa.
          </Typography>
        </Alert>
      )}
      </Box>
    );
  };

  const renderPendencias = () => {
    if (!titulosAbertos || titulosAbertos.length === 0) return null;
    
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Títulos em Aberto Encontrados</strong><br/>
            Escolha uma ação para os títulos pendentes antes de prosseguir com a rematrícula.
          </Typography>
        </Alert>

        {/* Lista de Títulos */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceIcon color="error" />
            Títulos em Aberto
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Descrição</strong></TableCell>
                  <TableCell align="center"><strong>Vencimento</strong></TableCell>
                  <TableCell align="right"><strong>Valor</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {titulosAbertos.map((titulo) => (
                  <TableRow key={titulo?.id || Math.random()}>
                    <TableCell>{titulo?.descricao || 'N/A'}</TableCell>
                    <TableCell align="center">
                      {titulo?.vencimento ? dayjs(titulo.vencimento).format('DD/MM/YYYY') : 'N/A'}
                    </TableCell>
                    <TableCell align="right">R$ {(titulo?.valor || 0).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={titulo?.status || 'pendente'} 
                        size="small" 
                        color={titulo?.status === 'vencido' ? 'error' : 'warning'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2}><strong>Total:</strong></TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" color="error">
                      R$ {calcularTotalAberto().toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

      {/* Opções de Ação */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Escolha uma Ação
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <RadioGroup value={acaoEscolhida} onChange={(e) => setAcaoEscolhida(e.target.value)}>
          <FormControlLabel 
            value="manter" 
            control={<Radio />} 
            label={
              <Box>
                <Typography variant="body1" fontWeight={600}>Manter títulos em aberto</Typography>
                <Typography variant="body2" color="text.secondary">
                  Os títulos continuam pendentes para pagamento posterior
                </Typography>
              </Box>
            }
          />

          <Divider sx={{ my: 2 }} />

          <FormControlLabel 
            value="renegociar_total" 
            control={<Radio />} 
            label={
              <Box>
                <Typography variant="body1" fontWeight={600}>Renegociar valor total em único título</Typography>
                <Typography variant="body2" color="text.secondary">
                  Cancela os títulos antigos e cria um novo com vencimento em 30 dias
                </Typography>
              </Box>
            }
          />

          <Divider sx={{ my: 2 }} />

          <FormControlLabel 
            value="renegociar_parcelas" 
            control={<Radio />} 
            label={
              <Box>
                <Typography variant="body1" fontWeight={600}>Renegociar em parcelas</Typography>
                <Typography variant="body2" color="text.secondary">
                  Cancela os títulos antigos e divide o valor em parcelas mensais
                </Typography>
              </Box>
            }
          />

          {acaoEscolhida === 'renegociar_parcelas' && (
            <Box sx={{ ml: 4, mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Valor Total"
                    type="number"
                    value={(renegociacaoConfig.valorTotal || 0).toFixed(2)}
                    onChange={(e) => handleRenegociacaoChange('valorTotal', parseFloat(e.target.value) || 0)}
                    InputProps={{ startAdornment: 'R$ ' }}
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Número de Parcelas"
                    type="number"
                    value={renegociacaoConfig.numeroParcelas}
                    onChange={(e) => handleRenegociacaoChange('numeroParcelas', parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1, max: 12 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Dia Vencimento"
                    type="number"
                    value={renegociacaoConfig.diaVencimento}
                    onChange={(e) => handleRenegociacaoChange('diaVencimento', parseInt(e.target.value) || 10)}
                    inputProps={{ min: 1, max: 28 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Valor de cada parcela:</strong> R$ {(renegociacaoConfig.valorParcela || 0).toFixed(2).replace('.', ',')}
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <FormControlLabel 
            value="baixar_todos" 
            control={<Radio />} 
            label={
              <Box>
                <Typography variant="body1" fontWeight={600} color="success.main">
                  Baixar todos os títulos (confirmar pagamento)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Marca todos como pagos - use apenas se o responsável já pagou os valores
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </Paper>
      </Box>
    );
  };

  const renderConfirmacao = () => {
    if (!aluno) return null;
    
    return (
      <Box>
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Tudo pronto para rematrícula!</strong><br/>
            Revise as informações abaixo e confirme.
          </Typography>
        </Alert>

        <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Resumo da Rematrícula</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Aluno:</Typography>
              <Typography variant="body1" fontWeight={600}>{aluno?.nome || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Turma:</Typography>
              <Typography variant="body1" fontWeight={600}>
                {turmas && dadosRematricula?.turmaId ? turmas[dadosRematricula.turmaId]?.nome || 'Não selecionada' : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Valor Mensalidade:</Typography>
              <Typography variant="body1" fontWeight={600}>
                R$ {(dadosRematricula?.mensalidadeValor || 0).toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Período:</Typography>
              <Typography variant="body1" fontWeight={600}>
                {dadosRematricula?.dataInicioCompetencia && dadosRematricula?.dataFimCompetencia ? (
                  <>
                    {dayjs(dadosRematricula.dataInicioCompetencia).format('MM/YYYY')} a{' '}
                    {dayjs(dadosRematricula.dataFimCompetencia).format('MM/YYYY')}
                  </>
                ) : 'N/A'}
              </Typography>
            </Grid>
            
            {titulosAbertos && titulosAbertos.length > 0 && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">Ação para títulos em aberto:</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {acaoEscolhida === 'manter' && '📋 Manter em aberto'}
                  {acaoEscolhida === 'renegociar_total' && '🔄 Renegociar em título único'}
                  {acaoEscolhida === 'renegociar_parcelas' && `🔄 Renegociar em ${renegociacaoConfig?.numeroParcelas || 1} parcelas`}
                  {acaoEscolhida === 'baixar_todos' && '✅ Baixar todos (pagamento confirmado)'}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
    );
  };

  // Validação de dados obrigatórios
  if (!aluno) {
    return null;
  }

  if (loading) {
    return (
      <Dialog open={open} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RefreshIcon />
          <Typography variant="h6">Rematrícula de Aluno</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {mensagem.texto && (
          <Alert severity={mensagem.tipo} sx={{ mb: 2 }} onClose={() => setMensagem({ tipo: '', texto: '' })}>
            {mensagem.texto}
          </Alert>
        )}

        {/* Indicador de Etapas */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Chip 
            label="1. Conferência" 
            color={etapa === 'conferencia' ? 'primary' : 'default'}
            sx={{ mx: 0.5 }}
          />
          {titulosAbertos.length > 0 && (
            <Chip 
              label="2. Pendências" 
              color={etapa === 'pendencias' ? 'warning' : 'default'}
              sx={{ mx: 0.5 }}
            />
          )}
          <Chip 
            label={titulosAbertos.length > 0 ? '3. Confirmação' : '2. Confirmação'}
            color={etapa === 'confirmacao' ? 'success' : 'default'}
            sx={{ mx: 0.5 }}
          />
        </Box>

        {etapa === 'conferencia' && renderConferencia()}
        {etapa === 'pendencias' && renderPendencias()}
        {etapa === 'confirmacao' && renderConfirmacao()}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {etapa !== 'conferencia' && (
          <Button 
            onClick={() => {
              if (etapa === 'pendencias') setEtapa('conferencia');
              if (etapa === 'confirmacao') {
                setEtapa(titulosAbertos.length > 0 ? 'pendencias' : 'conferencia');
              }
            }}
            disabled={processando}
          >
            Voltar
          </Button>
        )}
        <Button onClick={onClose} disabled={processando}>
          Cancelar
        </Button>
        {etapa === 'conferencia' && (
          <Button 
            variant="contained" 
            onClick={handleAvancar}
            disabled={processando}
          >
            Avançar
          </Button>
        )}
        {etapa === 'pendencias' && (
          <Button 
            variant="contained" 
            onClick={() => setEtapa('confirmacao')}
            disabled={!acaoEscolhida || processando}
          >
            Avançar
          </Button>
        )}
        {etapa === 'confirmacao' && (
          <Button 
            variant="contained" 
            color="success"
            onClick={handleConfirmarRematricula}
            disabled={processando}
            startIcon={processando ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {processando ? 'Processando...' : 'Confirmar Rematrícula'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RematriculaDialog;
