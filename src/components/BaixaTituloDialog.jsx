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
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  InputAdornment,
  Grid
} from '@mui/material';
import {
  Payment,
  CreditCard,
  AccountBalance,
  MonetizationOn,
  Receipt,
  CheckCircle,
  Info,
  Warning,
  AttachFile,
  Print,
  Email
} from '@mui/icons-material';
import financeiroService from '../services/financeiroService';
import { auditService } from '../services/auditService';

const BaixaTituloDialog = ({ open, onClose, titulo, onSuccess, userId }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Estados para créditos
  const [creditoDisponivel, setCreditoDisponivel] = useState(0);
  const [creditoAUtilizar, setCreditoAUtilizar] = useState(0);
  const [carregandoCredito, setCarregandoCredito] = useState(false);
  
  const [dadosPagamento, setDadosPagamento] = useState({
    formaPagamento: 'dinheiro',
    valorPago: '',
    valorDesconto: 0,
    motivoDesconto: '',
    observacoes: '',
    dataRecebimento: new Date().toISOString().split('T')[0],
    numeroComprovante: '',
    contaDestino: '',
    gerarRecibo: true,
    enviarEmailConfirmacao: false,
    usarCredito: false,
    valorCredito: 0
  });

  const [resumoOperacao, setResumoOperacao] = useState(null);

  const steps = ['Forma de Pagamento', 'Confirmação', 'Finalização'];

  const formasPagamento = [
    { value: 'dinheiro', label: 'Dinheiro', icon: MonetizationOn, color: '#10B981' },
    { value: 'pix', label: 'PIX', icon: CreditCard, color: '#8B5CF6' },
    { value: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard, color: '#3B82F6' },
    { value: 'cartao_debito', label: 'Cartão de Débito', icon: CreditCard, color: '#F59E0B' },
    { value: 'transferencia', label: 'Transferência Bancária', icon: AccountBalance, color: '#EF4444' },
    { value: 'cheque', label: 'Cheque', icon: Receipt, color: '#6B7280' },
    { value: 'boleto', label: 'Boleto Bancário', icon: Receipt, color: '#059669' }
  ];

  useEffect(() => {
    if (open && titulo) {
      resetDialog();
      buscarCreditoAluno();
    }
  }, [open, titulo]);

  const buscarCreditoAluno = async () => {
    if (!titulo?.alunoId) return;
    
    setCarregandoCredito(true);
    try {
      const resultado = await financeiroService.obterSaldoCredito(titulo.alunoId);
      if (resultado.success) {
        setCreditoDisponivel(resultado.saldo);
      } else {
        console.error('Erro ao buscar crédito:', resultado.error);
        setCreditoDisponivel(0);
      }
    } catch (error) {
      console.error('Erro ao buscar crédito:', error);
      setCreditoDisponivel(0);
    } finally {
      setCarregandoCredito(false);
    }
  };

  const resetDialog = () => {
    setStep(0);
    setCreditoAUtilizar(0);
    setDadosPagamento({
      formaPagamento: 'dinheiro',
      valorPago: titulo?.valor?.toString() || '',
      valorDesconto: 0,
      motivoDesconto: '',
      observacoes: '',
      dataRecebimento: new Date().toISOString().split('T')[0],
      numeroComprovante: '',
      contaDestino: '',
      gerarRecibo: true,
      enviarEmailConfirmacao: false,
      usarCredito: false,
      valorCredito: 0
    });
    setResumoOperacao(null);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calcularValorFinal = () => {
    const valorOriginal = parseFloat(titulo?.valor || 0);
    const desconto = parseFloat(dadosPagamento.valorDesconto || 0);
    const credito = dadosPagamento.usarCredito ? creditoAUtilizar : 0;
    return Math.max(0, valorOriginal - desconto - credito);
  };

  const calcularValorComCredito = () => {
    const valorOriginal = parseFloat(titulo?.valor || 0);
    const desconto = parseFloat(dadosPagamento.valorDesconto || 0);
    const valorAposDEsconto = valorOriginal - desconto;
    const creditoMaximo = Math.min(creditoDisponivel, valorAposDEsconto);
    return creditoMaximo;
  };

  const validarStep = () => {
    switch (step) {
      case 0:
        const valorFinal = calcularValorFinal();
        // Se usar crédito e ele cobrir o valor total, não precisa de valor pago
        const creditoCobre = dadosPagamento.usarCredito && valorFinal === 0;
        
        return dadosPagamento.formaPagamento && 
               (creditoCobre || 
                (parseFloat(dadosPagamento.valorPago) > 0 && 
                 parseFloat(dadosPagamento.valorPago) >= valorFinal));
      case 1:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step === 0) {
      // Gerar resumo da operação
      const valorFinal = calcularValorFinal();
      const resumo = {
        titulo: titulo,
        formaPagamento: dadosPagamento.formaPagamento,
        valorOriginal: titulo?.valor || 0,
        valorDesconto: parseFloat(dadosPagamento.valorDesconto || 0),
        creditoUtilizado: dadosPagamento.usarCredito ? creditoAUtilizar : 0,
        valorFinal: valorFinal,
        valorPago: valorFinal > 0 ? parseFloat(dadosPagamento.valorPago || 0) : 0,
        troco: valorFinal > 0 ? parseFloat(dadosPagamento.valorPago || 0) - valorFinal : 0,
        dataRecebimento: dadosPagamento.dataRecebimento,
        observacoes: dadosPagamento.observacoes,
        usouCredito: dadosPagamento.usarCredito
      };
      setResumoOperacao(resumo);
      setStep(prev => prev + 1);
    } else if (step === 1) {
      // Ir para o step final e executar a baixa automaticamente
      setStep(prev => prev + 1);
      executarBaixa();
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const executarBaixa = async () => {
    setLoading(true);
    try {
      // Utilizar crédito se houver
      if (dadosPagamento.usarCredito && creditoAUtilizar > 0) {
        console.log('💳 Utilizando crédito:', creditoAUtilizar);
        const resultadoCredito = await financeiroService.utilizarCredito(
          titulo.alunoId,
          creditoAUtilizar,
          titulo.id,
          `Crédito utilizado no pagamento do título: ${titulo.descricao}`
        );
        
        if (!resultadoCredito.success) {
          throw new Error('Erro ao utilizar crédito: ' + resultadoCredito.error);
        }
        
        console.log('✅ Crédito utilizado com sucesso:', resultadoCredito.novoSaldo);
      }

      // Aplicar desconto se houver
      if (parseFloat(dadosPagamento.valorDesconto) > 0) {
        const descontoPercentual = (parseFloat(dadosPagamento.valorDesconto) / titulo.valor) * 100;
        const resultadoDesconto = await financeiroService.aplicarDesconto(
          titulo.id,
          descontoPercentual,
          dadosPagamento.motivoDesconto || 'Desconto aplicado no pagamento',
          userId
        );
        
        if (!resultadoDesconto.success) {
          throw new Error('Erro ao aplicar desconto: ' + resultadoDesconto.error);
        }
      }

      // Dar baixa no título
      const valorFinalPago = calcularValorFinal();
      const dadosBaixa = {
        formaPagamento: dadosPagamento.formaPagamento,
        valorPago: valorFinalPago > 0 ? valorFinalPago : titulo.valor,
        dataRecebimento: dadosPagamento.dataRecebimento,
        numeroComprovante: dadosPagamento.numeroComprovante,
        contaDestino: dadosPagamento.contaDestino,
        observacoes: dadosPagamento.observacoes + 
          (dadosPagamento.usarCredito ? ` | Crédito utilizado: R$ ${creditoAUtilizar.toFixed(2)}` : ''),
        baixadoPor: userId,
        creditoUtilizado: dadosPagamento.usarCredito ? creditoAUtilizar : 0
      };

      console.log('🔄 Executando baixa do título:', titulo.id, dadosBaixa);

      const resultado = await financeiroService.darBaixa(titulo.id, dadosBaixa);
      
      if (!resultado.success) {
        throw new Error('Erro ao dar baixa no título: ' + resultado.error);
      }

      console.log('✅ Baixa executada com sucesso:', resultado);

      // Log da operação
      await auditService.logAction('payment_manual', userId, {
        entityId: titulo.id,
        description: `Baixa manual de título: ${titulo.descricao}`,
        changes: {
          formaPagamento: dadosPagamento.formaPagamento,
          valorPago: dadosPagamento.valorPago,
          valorOriginal: titulo.valor,
          desconto: dadosPagamento.valorDesconto
        }
      });

      // Simular ações pós-baixa
      if (dadosPagamento.gerarRecibo) {
        console.log('📄 Recibo seria gerado aqui');
      }
      
      if (dadosPagamento.enviarEmailConfirmacao) {
        console.log('📧 Email de confirmação seria enviado aqui');
      }

      // Aguardar 2 segundos para mostrar o sucesso e depois fechar
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }, 2000);

    } catch (error) {
      console.error('❌ Erro na baixa do título:', error);
      alert('Erro ao processar pagamento: ' + error.message);
      setStep(1); // Voltar para a etapa de confirmação
    } finally {
      setLoading(false);
    }
  };

  if (!titulo) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Payment color="primary" />
          <Typography variant="h6">
            Registrar Pagamento
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

        {/* Informações do Título */}
        <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Título
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {titulo.descricao}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Valor Original
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(titulo.valor)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Vencimento
                </Typography>
                <Typography variant="body1">
                  {formatDate(titulo.vencimento)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Step 1: Forma de Pagamento */}
        {step === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              💳 Selecione a Forma de Pagamento
            </Typography>
            
            <RadioGroup
              value={dadosPagamento.formaPagamento}
              onChange={(e) => setDadosPagamento(prev => ({ 
                ...prev, 
                formaPagamento: e.target.value 
              }))}
            >
              <Grid container spacing={2}>
                {formasPagamento.map((forma) => (
                  <Grid item xs={12} sm={6} md={4} key={forma.value}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: dadosPagamento.formaPagamento === forma.value ? 2 : 1,
                        borderColor: dadosPagamento.formaPagamento === forma.value ? 'primary.main' : 'grey.300'
                      }}
                      onClick={() => setDadosPagamento(prev => ({ 
                        ...prev, 
                        formaPagamento: forma.value 
                      }))}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <FormControlLabel
                          value={forma.value}
                          control={<Radio />}
                          label=""
                          sx={{ display: 'none' }}
                        />
                        <Avatar 
                          sx={{ 
                            bgcolor: forma.color, 
                            width: 48, 
                            height: 48, 
                            mx: 'auto', 
                            mb: 1 
                          }}
                        >
                          <forma.icon />
                        </Avatar>
                        <Typography variant="body2" fontWeight="bold">
                          {forma.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Valor Pago"
                  type="number"
                  value={dadosPagamento.valorPago}
                  onChange={(e) => setDadosPagamento(prev => ({ 
                    ...prev, 
                    valorPago: e.target.value 
                  }))}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    inputProps: { min: 0, step: 0.01 }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Desconto (R$)"
                  type="number"
                  value={dadosPagamento.valorDesconto}
                  onChange={(e) => setDadosPagamento(prev => ({ 
                    ...prev, 
                    valorDesconto: e.target.value 
                  }))}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    inputProps: { min: 0, step: 0.01, max: titulo.valor }
                  }}
                />
              </Grid>

              {parseFloat(dadosPagamento.valorDesconto) > 0 && (
                <Grid item xs={12}>
                  <TextField
                    label="Motivo do Desconto"
                    value={dadosPagamento.motivoDesconto}
                    onChange={(e) => setDadosPagamento(prev => ({ 
                      ...prev, 
                      motivoDesconto: e.target.value 
                    }))}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Informe o motivo do desconto..."
                  />
                </Grid>
              )}

              {/* Seção de Créditos */}
              {creditoDisponivel > 0 && (
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: '#f0f9ff', border: '1px solid #0ea5e9' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <MonetizationOn sx={{ color: '#0ea5e9', mr: 1 }} />
                        <Typography variant="h6" color="#0ea5e9">
                          Créditos Disponíveis
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">
                            Saldo Disponível: <strong>{formatCurrency(creditoDisponivel)}</strong>
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={dadosPagamento.usarCredito}
                                onChange={(e) => {
                                  const usar = e.target.checked;
                                  setDadosPagamento(prev => ({ ...prev, usarCredito: usar }));
                                  if (usar) {
                                    const creditoMaximo = calcularValorComCredito();
                                    setCreditoAUtilizar(creditoMaximo);
                                  } else {
                                    setCreditoAUtilizar(0);
                                  }
                                }}
                                color="primary"
                              />
                            }
                            label="Usar créditos"
                          />
                        </Grid>
                        
                        {dadosPagamento.usarCredito && (
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Valor do Crédito"
                              type="number"
                              value={creditoAUtilizar}
                              onChange={(e) => {
                                const valor = Math.min(
                                  parseFloat(e.target.value) || 0,
                                  calcularValorComCredito()
                                );
                                setCreditoAUtilizar(valor);
                              }}
                              fullWidth
                              InputProps={{
                                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                inputProps: { 
                                  min: 0, 
                                  step: 0.01, 
                                  max: calcularValorComCredito()
                                }
                              }}
                            />
                          </Grid>
                        )}
                      </Grid>
                      
                      {dadosPagamento.usarCredito && creditoAUtilizar > 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Valor após crédito: <strong>{formatCurrency(calcularValorFinal())}</strong>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  label="Data do Recebimento"
                  type="date"
                  value={dadosPagamento.dataRecebimento}
                  onChange={(e) => setDadosPagamento(prev => ({ 
                    ...prev, 
                    dataRecebimento: e.target.value 
                  }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {['pix', 'transferencia', 'cartao_credito', 'cartao_debito'].includes(dadosPagamento.formaPagamento) && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Número do Comprovante"
                    value={dadosPagamento.numeroComprovante}
                    onChange={(e) => setDadosPagamento(prev => ({ 
                      ...prev, 
                      numeroComprovante: e.target.value 
                    }))}
                    fullWidth
                    placeholder="Número de identificação da transação"
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  label="Observações"
                  value={dadosPagamento.observacoes}
                  onChange={(e) => setDadosPagamento(prev => ({ 
                    ...prev, 
                    observacoes: e.target.value 
                  }))}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Observações sobre o pagamento..."
                />
              </Grid>
            </Grid>

            {/* Resumo dos Valores */}
            <Card sx={{ mt: 3, bgcolor: 'primary.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  💰 Resumo Financeiro
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Valor Original:</Typography>
                  <Typography fontWeight="bold">{formatCurrency(titulo.valor)}</Typography>
                </Box>
                {parseFloat(dadosPagamento.valorDesconto) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Desconto:</Typography>
                    <Typography fontWeight="bold" color="success.light">
                      -{formatCurrency(dadosPagamento.valorDesconto)}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">Valor a Pagar:</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(calcularValorFinal())}
                  </Typography>
                </Box>
                {parseFloat(dadosPagamento.valorPago) > calcularValorFinal() && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Troco:</Typography>
                    <Typography fontWeight="bold" color="warning.light">
                      {formatCurrency(parseFloat(dadosPagamento.valorPago) - calcularValorFinal())}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Step 2: Confirmação */}
        {step === 1 && resumoOperacao && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Atenção:</strong> Confirme os dados antes de finalizar o pagamento. 
                Esta operação não poderá ser desfeita.
              </Typography>
            </Alert>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  📋 Confirmação do Pagamento
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon><Receipt /></ListItemIcon>
                    <ListItemText
                      primary="Título"
                      secondary={resumoOperacao.titulo.descricao}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon><CreditCard /></ListItemIcon>
                    <ListItemText
                      primary="Forma de Pagamento"
                      secondary={formasPagamento.find(f => f.value === dadosPagamento.formaPagamento)?.label}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon><MonetizationOn /></ListItemIcon>
                    <ListItemText
                      primary="Valores"
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Original: {formatCurrency(resumoOperacao.valorOriginal)}
                          </Typography>
                          {resumoOperacao.valorDesconto > 0 && (
                            <Typography variant="body2" color="success.main">
                              Desconto: -{formatCurrency(resumoOperacao.valorDesconto)}
                            </Typography>
                          )}
                          {resumoOperacao.usouCredito && (
                            <Typography variant="body2" color="info.main">
                              Crédito: -{formatCurrency(resumoOperacao.creditoUtilizado)}
                            </Typography>
                          )}
                          <Typography variant="body2" fontWeight="bold">
                            Final: {formatCurrency(resumoOperacao.valorFinal)}
                          </Typography>
                          {resumoOperacao.valorFinal > 0 && (
                            <Typography variant="body2">
                              Pago: {formatCurrency(resumoOperacao.valorPago)}
                            </Typography>
                          )}
                          {resumoOperacao.usouCredito && resumoOperacao.valorFinal === 0 && (
                            <Typography variant="body2" color="success.main" fontWeight="bold">
                              💳 Título quitado com créditos!
                            </Typography>
                          )}
                          {resumoOperacao.troco > 0 && (
                            <Typography variant="body2" color="warning.main">
                              Troco: {formatCurrency(resumoOperacao.troco)}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={dadosPagamento.gerarRecibo}
                        onChange={(e) => setDadosPagamento(prev => ({ 
                          ...prev, 
                          gerarRecibo: e.target.checked 
                        }))}
                      />
                    }
                    label="Gerar recibo automaticamente"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={dadosPagamento.enviarEmailConfirmacao}
                        onChange={(e) => setDadosPagamento(prev => ({ 
                          ...prev, 
                          enviarEmailConfirmacao: e.target.checked 
                        }))}
                      />
                    }
                    label="Enviar email de confirmação"
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Step 3: Finalização */}
        {step === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {loading ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Processando pagamento...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Por favor, aguarde enquanto registramos o pagamento.
                </Typography>
              </Box>
            ) : (
              <Box>
                <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom color="success.main">
                  Pagamento Registrado com Sucesso!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  O título foi quitado e todas as informações foram atualizadas.
                </Typography>
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
            disabled={!validarStep()}
          >
            Próximo
          </Button>
        )}
        
        {step === 1 && (
          <Button 
            onClick={handleNext}
            variant="contained"
            color="success"
            disabled={loading}
          >
            Confirmar e Processar Pagamento
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BaixaTituloDialog;