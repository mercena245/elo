'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Box, 
  Alert, 
  Chip,
  Divider,
  Grid,
  Paper,
  Avatar,
  CircularProgress
} from '@mui/material';
import { 
  Verified as VerifiedIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  Description as DocumentIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { useParams } from 'next/navigation';
import secretariaDigitalService from '../../services/secretariaDigitalService';

const ValidacaoDocumento = () => {
  const [codigoVerificacao, setCodigoVerificacao] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const params = useParams();

  useEffect(() => {
    // Se chegou via URL com código, validar automaticamente
    if (params?.codigo) {
      setCodigoVerificacao(params.codigo);
      validarDocumento(params.codigo);
    }
  }, [params]);

  const validarDocumento = async (codigo = codigoVerificacao) => {
    if (!codigo || codigo.length < 5) {
      setErro('Digite um código de verificação válido');
      return;
    }

    setLoading(true);
    setErro('');
    setResultado(null);

    try {
      const validacao = await secretariaDigitalService.validarDocumento(codigo);
      setResultado(validacao);
    } catch (error) {
      console.error('Erro na validação:', error);
      setErro('Erro ao validar documento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataISO) => {
    return new Date(dataISO).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentTypeLabel = (tipo) => {
    const labels = {
      historico_escolar: 'Histórico Escolar',
      declaracao_matricula: 'Declaração de Matrícula',
      declaracao_conclusao: 'Declaração de Conclusão',
      declaracao_frequencia: 'Declaração de Frequência',
      certificado: 'Certificado',
      diploma: 'Diploma',
      transferencia: 'Transferência'
    };
    return labels[tipo] || tipo;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Cabeçalho */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <SecurityIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Validação de Documentos
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Verifique a autenticidade de documentos escolares digitais
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sistema de Secretaria Digital - Conforme normas do MEC
        </Typography>
      </Box>

      {/* Formulário de Validação */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          <QrCodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Digite o Código de Verificação
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          O código de verificação está presente no documento digital (exemplo: DOC-ABC123-XYZ45)
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            label="Código de Verificação"
            value={codigoVerificacao}
            onChange={(e) => setCodigoVerificacao(e.target.value.toUpperCase())}
            placeholder="DOC-ABC123-XYZ45"
            error={!!erro}
            helperText={erro}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            size="large"
            onClick={() => validarDocumento()}
            disabled={loading || !codigoVerificacao}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            sx={{ px: 3 }}
          >
            {loading ? 'Validando...' : 'Validar'}
          </Button>
        </Box>
      </Paper>

      {/* Resultado da Validação */}
      {resultado && (
        <Paper sx={{ p: 4 }}>
          {resultado.valido ? (
            <Box>
              <Alert 
                severity="success" 
                sx={{ mb: 3, fontSize: '1.1rem' }}
                icon={<VerifiedIcon fontSize="large" />}
              >
                <Typography variant="h6" component="div">
                  Documento Válido e Autêntico
                </Typography>
                <Typography variant="body2">
                  Este documento foi emitido digitalmente e possui assinatura eletrônica válida
                </Typography>
              </Alert>

              {/* Informações do Documento */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <DocumentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Informações do Documento
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Tipo de Documento
                        </Typography>
                        <Chip 
                          label={getDocumentTypeLabel(resultado.documento.tipo)}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Código de Verificação
                        </Typography>
                        <Typography variant="body1" fontFamily="monospace">
                          {resultado.documento.codigoVerificacao}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Data de Emissão
                        </Typography>
                        <Typography variant="body1">
                          <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          {formatarData(resultado.documento.dataEmissao)}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Status
                        </Typography>
                        <Chip 
                          label="Assinado Digitalmente"
                          color="success"
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Dados do Estudante
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Nome Completo
                        </Typography>
                        <Typography variant="body1">
                          {resultado.documento.dadosAluno.nome}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          CPF
                        </Typography>
                        <Typography variant="body1">
                          {resultado.documento.dadosAluno.cpf}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          RG
                        </Typography>
                        <Typography variant="body1">
                          {resultado.documento.dadosAluno.rg}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Data de Nascimento
                        </Typography>
                        <Typography variant="body1">
                          {new Date(resultado.documento.dadosAluno.dataNascimento).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Instituição de Ensino
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Nome da Instituição
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {resultado.documento.dadosInstituicao.nome}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            CNPJ
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {resultado.documento.dadosInstituicao.cnpj}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Endereço
                          </Typography>
                          <Typography variant="body1">
                            {resultado.documento.dadosInstituicao.endereco.rua}, {resultado.documento.dadosInstituicao.endereco.bairro} - {resultado.documento.dadosInstituicao.endereco.cidade}/{resultado.documento.dadosInstituicao.endereco.estado}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Informações de Assinatura Digital */}
                <Grid item xs={12}>
                  <Card sx={{ backgroundColor: '#f5f5f5' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <VerifiedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Assinatura Digital
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Responsável
                          </Typography>
                          <Typography variant="body1">
                            {resultado.documento.assinatura.responsavel.nome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {resultado.documento.assinatura.responsavel.cargo}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Data/Hora da Assinatura
                          </Typography>
                          <Typography variant="body1">
                            {formatarData(resultado.documento.assinatura.timestamp)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Algoritmo
                          </Typography>
                          <Typography variant="body1">
                            {resultado.documento.assinatura.algoritmo}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Hash: {resultado.documento.assinatura.hash.substring(0, 16)}...
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Alert 
              severity="error" 
              sx={{ fontSize: '1.1rem' }}
              icon={<ErrorIcon fontSize="large" />}
            >
              <Typography variant="h6" component="div">
                Documento Inválido ou Não Encontrado
              </Typography>
              <Typography variant="body2">
                {resultado.erro || 'O código de verificação não foi encontrado em nossa base de dados.'}
              </Typography>
            </Alert>
          )}
        </Paper>
      )}

      {/* Informações sobre o Sistema */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>
          Sobre a Validação de Documentos
        </Typography>
        <Typography variant="body2" paragraph>
          Este sistema de validação permite verificar a autenticidade de documentos escolares digitais emitidos pela instituição. 
          Todos os documentos são assinados digitalmente conforme as normas do Ministério da Educação (MEC).
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Marcos Regulatórios:</strong>
        </Typography>
        <Typography variant="body2" component="ul">
          <li>Portaria MEC nº 1.570/2017 - Documentos escolares digitais</li>
          <li>Lei 14.533/2023 - Política Nacional de Educação Digital</li>
          <li>Lei 14.063/2020 - Assinaturas eletrônicas</li>
          <li>LGPD - Proteção de dados pessoais</li>
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Em caso de dúvidas sobre a autenticidade de um documento, entre em contato com a secretaria da instituição.
        </Typography>
      </Paper>
    </Container>
  );
};

export default ValidacaoDocumento;