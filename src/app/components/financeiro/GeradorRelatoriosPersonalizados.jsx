import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, FormControl, InputLabel,
  Select, MenuItem, Checkbox, FormControlLabel,
  Typography, Box, Chip, Stack, Alert,
  Card, CardContent, IconButton, Tooltip, Tab, Tabs,
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';
import {
  Close, Download, PictureAsPdf, TableChart,
  Assessment, FilterList, CalendarToday, School,
  Person, AttachMoney, Description, Refresh, Warning
} from '@mui/icons-material';
import { exportarParaExcel, exportarParaPDF, exportarParaCSV } from '../../../utils/exportUtils';

const GeradorRelatoriosPersonalizados = ({
  open,
  onClose,
  titulos = [],
  alunos = []
}) => {
  const [tabAtiva, setTabAtiva] = useState(0);
  
  const [config, setConfig] = useState({
    tipo: 'inadimplentes',
    formato: 'excel',
    periodo: {
      ativo: false,
      dataInicio: '',
      dataFim: ''
    },
    filtros: {
      turma: '',
      aluno: '',
      status: '',
      tipoTitulo: ''
    },
    camposSelecionados: {
      // Aluno
      nomeAluno: true,
      matricula: true,
      turma: true,
      statusAluno: false,
      // Responsável
      nomeResponsavel: true,
      cpfResponsavel: true,
      telefone: true,
      email: false,
      enderecoCompleto: true,
      // Financeiro
      tipoTitulo: true,
      descricaoTitulo: true,
      valor: true,
      vencimento: true,
      statusTitulo: true,
      dataPagamento: false,
      diasAtraso: true,
      // Estatísticas
      quantidadeTitulos: true,
      valorTotal: true,
      valorPago: false,
      valorPendente: true
    },
    ordenacao: {
      campo: 'nomeAluno',
      direcao: 'asc'
    }
  });

  const camposDisponiveis = {
    'Dados do Aluno': [
      { key: 'nomeAluno', label: 'Nome do Aluno' },
      { key: 'matricula', label: 'Matrícula' },
      { key: 'turma', label: 'Turma' },
      { key: 'statusAluno', label: 'Status' }
    ],
    'Dados do Responsável': [
      { key: 'nomeResponsavel', label: 'Nome do Responsável' },
      { key: 'cpfResponsavel', label: 'CPF' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'email', label: 'Email' },
      { key: 'enderecoCompleto', label: 'Endereço' }
    ],
    'Dados Financeiros': [
      { key: 'tipoTitulo', label: 'Tipo' },
      { key: 'descricaoTitulo', label: 'Descrição' },
      { key: 'valor', label: 'Valor' },
      { key: 'vencimento', label: 'Vencimento' },
      { key: 'statusTitulo', label: 'Status' },
      { key: 'dataPagamento', label: 'Data Pagamento' },
      { key: 'diasAtraso', label: 'Dias de Atraso' }
    ],
    'Estatísticas': [
      { key: 'quantidadeTitulos', label: 'Qtd. Títulos' },
      { key: 'valorTotal', label: 'Valor Total' },
      { key: 'valorPago', label: 'Valor Pago' },
      { key: 'valorPendente', label: 'Valor Pendente' }
    ]
  };

  const criarLinhaRelatorio = (aluno, titulos, hoje, detalhado = false) => {
    const linha = {};
    const campos = config.camposSelecionados;

    if (!aluno) {
      aluno = { nome: 'N/A', matricula: 'N/A', turma: 'N/A' };
    }

    if (campos.nomeAluno) linha['Nome do Aluno'] = aluno.nome || 'N/A';
    if (campos.matricula) linha['Matrícula'] = aluno.matricula || 'N/A';
    if (campos.turma) linha['Turma'] = aluno.turma || 'N/A';
    if (campos.statusAluno) linha['Status do Aluno'] = aluno.status || 'ativo';
    if (campos.nomeResponsavel) linha['Nome do Responsável'] = aluno.responsavelNome || 'N/A';
    if (campos.cpfResponsavel) linha['CPF do Responsável'] = aluno.responsavelCpf || 'N/A';
    if (campos.telefone) linha['Telefone'] = aluno.telefone || aluno.responsavelTelefone || 'N/A';
    if (campos.email) linha['Email'] = aluno.email || aluno.responsavelEmail || 'N/A';
    if (campos.enderecoCompleto && aluno.endereco) {
      linha['Endereço Completo'] = `${aluno.endereco.rua || ''}, ${aluno.endereco.numero || ''} - ${aluno.endereco.bairro || ''}, ${aluno.endereco.cidade || ''}`;
    }

    if (detalhado && titulos.length === 1) {
      const titulo = titulos[0];
      if (campos.tipoTitulo) linha['Tipo'] = titulo.tipo || 'N/A';
      if (campos.descricaoTitulo) linha['Descrição'] = titulo.descricao || 'N/A';
      if (campos.valor) linha['Valor'] = titulo.valor || 0;
      if (campos.vencimento) linha['Vencimento'] = new Date(titulo.vencimento).toLocaleDateString('pt-BR');
      if (campos.statusTitulo) linha['Status'] = titulo.status === 'pago' ? 'Pago' : 'Pendente';
      if (campos.dataPagamento) linha['Data Pagamento'] = titulo.dataPagamento ? new Date(titulo.dataPagamento).toLocaleDateString('pt-BR') : 'N/A';
      if (campos.diasAtraso && titulo.status !== 'pago') {
        const venc = new Date(titulo.vencimento);
        linha['Dias de Atraso'] = venc < hoje ? Math.floor((hoje - venc) / (1000 * 60 * 60 * 24)) : 0;
      }
    } else {
      const valorTotal = titulos.reduce((sum, t) => sum + (t.valor || 0), 0);
      const valorPago = titulos.filter(t => t.status === 'pago').reduce((sum, t) => sum + (t.valor || 0), 0);
      const maiorAtraso = Math.max(0, ...titulos.map(t => {
        if (t.status === 'pago') return 0;
        const venc = new Date(t.vencimento);
        return venc < hoje ? Math.floor((hoje - venc) / (1000 * 60 * 60 * 24)) : 0;
      }));

      if (campos.quantidadeTitulos) linha['Quantidade de Títulos'] = titulos.length;
      if (campos.valorTotal) linha['Valor Total'] = valorTotal;
      if (campos.valorPago) linha['Valor Pago'] = valorPago;
      if (campos.valorPendente) linha['Valor Pendente'] = valorTotal - valorPago;
      if (campos.diasAtraso) linha['Maior Atraso (dias)'] = maiorAtraso;
    }

    return linha;
  };

  const dadosRelatorio = useMemo(() => {
    const hoje = new Date();
    let dadosFiltrados = [];
    let titulosFiltrados = [...titulos];

    if (config.periodo.ativo && config.periodo.dataInicio && config.periodo.dataFim) {
      const inicio = new Date(config.periodo.dataInicio);
      const fim = new Date(config.periodo.dataFim);
      titulosFiltrados = titulosFiltrados.filter(t => {
        const venc = new Date(t.vencimento);
        return venc >= inicio && venc <= fim;
      });
    }

    if (config.filtros.turma) {
      titulosFiltrados = titulosFiltrados.filter(t => {
        const aluno = alunos.find(a => a.id === t.alunoId);
        return aluno && aluno.turma === config.filtros.turma;
      });
    }

    if (config.filtros.aluno) {
      titulosFiltrados = titulosFiltrados.filter(t => t.alunoId === config.filtros.aluno);
    }

    if (config.filtros.status && config.filtros.status !== 'todos') {
      if (config.filtros.status === 'vencido') {
        titulosFiltrados = titulosFiltrados.filter(t => {
          if (t.status === 'pago') return false;
          const venc = new Date(t.vencimento);
          return venc < hoje;
        });
      } else {
        titulosFiltrados = titulosFiltrados.filter(t => t.status === config.filtros.status);
      }
    }

    if (config.filtros.tipoTitulo && config.filtros.tipoTitulo !== 'todos') {
      titulosFiltrados = titulosFiltrados.filter(t => t.tipo === config.filtros.tipoTitulo);
    }

    if (config.tipo === 'inadimplentes') {
      const alunosInadimplentes = {};
      titulosFiltrados.forEach(titulo => {
        if (titulo.status !== 'pago') {
          const venc = new Date(titulo.vencimento);
          if (venc < hoje) {
            if (!alunosInadimplentes[titulo.alunoId]) {
              alunosInadimplentes[titulo.alunoId] = [];
            }
            alunosInadimplentes[titulo.alunoId].push(titulo);
          }
        }
      });

      Object.keys(alunosInadimplentes).forEach(alunoId => {
        const aluno = alunos.find(a => a.id === alunoId);
        const titulosAluno = alunosInadimplentes[alunoId];
        dadosFiltrados.push(criarLinhaRelatorio(aluno, titulosAluno, hoje));
      });
    } else if (config.tipo === 'turma' || config.tipo === 'aluno') {
      const titulosPorAluno = {};
      titulosFiltrados.forEach(titulo => {
        if (!titulosPorAluno[titulo.alunoId]) {
          titulosPorAluno[titulo.alunoId] = [];
        }
        titulosPorAluno[titulo.alunoId].push(titulo);
      });

      Object.keys(titulosPorAluno).forEach(alunoId => {
        const aluno = alunos.find(a => a.id === alunoId);
        const titulosAluno = titulosPorAluno[alunoId];
        dadosFiltrados.push(criarLinhaRelatorio(aluno, titulosAluno, hoje));
      });
    } else {
      titulosFiltrados.forEach(titulo => {
        const aluno = alunos.find(a => a.id === titulo.alunoId);
        dadosFiltrados.push(criarLinhaRelatorio(aluno, [titulo], hoje, true));
      });
    }

    dadosFiltrados.sort((a, b) => {
      const valorA = a[config.ordenacao.campo] || '';
      const valorB = b[config.ordenacao.campo] || '';
      return config.ordenacao.direcao === 'asc' ? (valorA > valorB ? 1 : -1) : (valorA < valorB ? 1 : -1);
    });

    return dadosFiltrados;
  }, [titulos, alunos, config]);

  const handleExportar = async () => {
    if (dadosRelatorio.length === 0) {
      alert('Nenhum dado encontrado para exportar.');
      return;
    }

    const nomeArquivo = `Relatorio_${config.tipo}_${new Date().toISOString().split('T')[0]}`;
    const dadosRelatorioSaida = dadosRelatorio;

    try {
      if (config.formato === 'excel') {
        exportarParaExcel(dadosRelatorioSaida, nomeArquivo, 'Relatório');
        alert('Relatório exportado para Excel com sucesso!');
        onClose();
      } else if (config.formato === 'csv') {
        exportarParaCSV(dadosRelatorioSaida, nomeArquivo);
        alert('Relatório exportado para CSV com sucesso!');
        onClose();
      } else if (config.formato === 'pdf') {
        const colunas = Object.keys(dadosRelatorioSaida[0]).map(key => ({
          header: key,
          dataKey: key
        }));

        const camposMonetarios = ['Valor', 'Valor Total', 'Valor Pago', 'Valor Pendente'];

        exportarParaPDF({
          dados: dadosRelatorioSaida,
          titulo: `Relatório - ${config.tipo}`,
          colunas: colunas,
          orientacao: colunas.length > 6 ? 'landscape' : 'portrait',
          formatoMoeda: camposMonetarios,
          subtitulo: `Período: ${config.periodo.ativo ? 
            `${config.periodo.dataInicio} a ${config.periodo.dataFim}` : 
            'Todos os períodos'}`
        });
        alert('Relatório exportado para PDF com sucesso!');
        onClose();
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar relatório: ' + error.message);
    }
  };

  const toggleCampo = (key) => {
    setConfig({
      ...config,
      camposSelecionados: {
        ...config.camposSelecionados,
        [key]: !config.camposSelecionados[key]
      }
    });
  };

  const selecionarTodosCampos = (categoria) => {
    const novosCampos = { ...config.camposSelecionados };
    camposDisponiveis[categoria].forEach(campo => {
      novosCampos[campo.key] = true;
    });
    setConfig({ ...config, camposSelecionados: novosCampos });
  };

  const desselecionarTodosCampos = (categoria) => {
    const novosCampos = { ...config.camposSelecionados };
    camposDisponiveis[categoria].forEach(campo => {
      novosCampos[campo.key] = false;
    });
    setConfig({ ...config, camposSelecionados: novosCampos });
  };

  const camposSelecionadosCount = Object.values(config.camposSelecionados).filter(v => v).length;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '90vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#10B981', 
        color: 'white',
        py: 2
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Gerador de Relatórios
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Crie relatórios personalizados com filtros avançados
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
        <Tabs 
          value={tabAtiva} 
          onChange={(e, v) => setTabAtiva(v)}
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '0.95rem'
            }
          }}
        >
          <Tab label="Templates" icon={<Description />} iconPosition="start" />
          <Tab label="Filtros" icon={<FilterList />} iconPosition="start" />
          <Tab label="Campos" icon={<TableChart />} iconPosition="start" />
          <Tab label="Prévia" icon={<Assessment />} iconPosition="start" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
        {/* TAB 0: TEMPLATES */}
        {tabAtiva === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                Escolha um Template
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Selecione um modelo pronto ou personalize
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: 2,
                  borderColor: config.tipo === 'inadimplentes' ? '#10B981' : 'transparent',
                  bgcolor: config.tipo === 'inadimplentes' ? '#d1fae5' : 'white',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                }}
                onClick={() => setConfig({ ...config, tipo: 'inadimplentes' })}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Warning sx={{ color: '#dc2626', fontSize: 36, mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">Inadimplentes</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Dados completos para cobrança
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: 2,
                  borderColor: config.tipo === 'turma' ? '#10B981' : 'transparent',
                  bgcolor: config.tipo === 'turma' ? '#d1fae5' : 'white',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                }}
                onClick={() => setConfig({ ...config, tipo: 'turma' })}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <School sx={{ color: '#10B981', fontSize: 36, mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">Por Turma</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Estatísticas por turma
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: 2,
                  borderColor: config.tipo === 'aluno' ? '#10B981' : 'transparent',
                  bgcolor: config.tipo === 'aluno' ? '#d1fae5' : 'white',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                }}
                onClick={() => setConfig({ ...config, tipo: 'aluno' })}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Person sx={{ color: '#3b82f6', fontSize: 36, mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">Por Aluno</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Histórico individual
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: 2,
                  borderColor: config.tipo === 'personalizado' ? '#10B981' : 'transparent',
                  bgcolor: config.tipo === 'personalizado' ? '#d1fae5' : 'white',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                }}
                onClick={() => setConfig({ ...config, tipo: 'personalizado' })}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Assessment sx={{ color: '#8b5cf6', fontSize: 36, mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">Personalizado</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Configure tudo manualmente
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="contained" size="large" onClick={() => setTabAtiva(1)}>
                  Próximo: Filtros
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* TAB 1: FILTROS */}
        {tabAtiva === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                Filtros Avançados
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarToday sx={{ color: '#10B981', mr: 1 }} />
                    <Typography variant="subtitle1" fontWeight="bold">Período</Typography>
                    {config.periodo.ativo && <Chip label="Ativo" color="success" size="small" sx={{ ml: 'auto' }} />}
                  </Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.periodo.ativo}
                        onChange={(e) => setConfig({ ...config, periodo: { ...config.periodo, ativo: e.target.checked } })}
                      />
                    }
                    label="Filtrar por período"
                  />
                  {config.periodo.ativo && (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth size="small" type="date" label="Data Início" value={config.periodo.dataInicio} onChange={(e) => setConfig({ ...config, periodo: { ...config.periodo, dataInicio: e.target.value } })} InputLabelProps={{ shrink: true }} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth size="small" type="date" label="Data Fim" value={config.periodo.dataFim} onChange={(e) => setConfig({ ...config, periodo: { ...config.periodo, dataFim: e.target.value } })} InputLabelProps={{ shrink: true }} />
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Filtros Adicionais</Typography>
                  <Grid container spacing={{ xs: 2, md: 3 }} sx={{ width: '100%' }}>
                    <Grid item xs={12} sx={{ minWidth: '300px' }}>
                      <FormControl fullWidth sx={{ minWidth: '250px' }}>
                        <InputLabel>Status</InputLabel>
                        <Select 
                          value={config.filtros.status} 
                          label="Status"
                          onChange={(e) => setConfig({ ...config, filtros: { ...config.filtros, status: e.target.value } })}
                        >
                          <MenuItem value="">Todos</MenuItem>
                          <MenuItem value="pago">✅ Pago</MenuItem>
                          <MenuItem value="pendente">⏳ Pendente</MenuItem>
                          <MenuItem value="vencido">🔴 Vencido</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sx={{ minWidth: '300px' }}>
                      <FormControl fullWidth sx={{ minWidth: '250px' }}>
                        <InputLabel>Tipo</InputLabel>
                        <Select 
                          value={config.filtros.tipoTitulo} 
                          label="Tipo"
                          onChange={(e) => setConfig({ ...config, filtros: { ...config.filtros, tipoTitulo: e.target.value } })}
                        >
                          <MenuItem value="">Todos</MenuItem>
                          <MenuItem value="Mensalidade">Mensalidade</MenuItem>
                          <MenuItem value="Matrícula">Matrícula</MenuItem>
                          <MenuItem value="Material">Material</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={() => setTabAtiva(0)}>Voltar</Button>
                <Button variant="contained" onClick={() => setTabAtiva(2)}>Próximo: Campos</Button>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* TAB 2: CAMPOS */}
        {tabAtiva === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                Selecione os Campos
              </Typography>
              <Alert severity="info">{camposSelecionadosCount} campos selecionados</Alert>
            </Grid>

            {Object.entries(camposDisponiveis).map(([categoria, campos]) => (
              <Grid item xs={12} md={6} key={categoria}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">{categoria}</Typography>
                      <Box>
                        <Button size="small" onClick={() => selecionarTodosCampos(categoria)}>Todos</Button>
                        <Button size="small" onClick={() => desselecionarTodosCampos(categoria)}>Nenhum</Button>
                      </Box>
                    </Box>
                    <Stack spacing={1}>
                      {campos.map(campo => (
                        <FormControlLabel key={campo.key} control={<Checkbox checked={config.camposSelecionados[campo.key]} onChange={() => toggleCampo(campo.key)} size="small" />} label={campo.label} />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={() => setTabAtiva(1)}>Voltar</Button>
                <Button variant="contained" onClick={() => setTabAtiva(3)} disabled={camposSelecionadosCount === 0}>Ver Prévia</Button>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* TAB 3: PRÉVIA */}
        {tabAtiva === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" color="primary" fontWeight="bold">Prévia do Relatório</Typography>
                  <Typography variant="body2" color="text.secondary">{dadosRelatorio.length} registros</Typography>
                </Box>
              </Box>
            </Grid>

            {dadosRelatorio.length > 0 ? (
              <Grid item xs={12}>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {Object.keys(dadosRelatorio[0]).map(col => (
                          <TableCell key={col} sx={{ fontWeight: 'bold', bgcolor: '#10B981', color: 'white' }}>{col}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dadosRelatorio.slice(0, 10).map((row, idx) => (
                        <TableRow key={idx} hover>
                          {Object.values(row).map((val, i) => (
                            <TableCell key={i}>{typeof val === 'number' && val > 100 ? formatCurrency(val) : val}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {dadosRelatorio.length > 10 && <Alert severity="info" sx={{ mt: 2 }}>Mostrando 10 de {dadosRelatorio.length} registros</Alert>}
              </Grid>
            ) : (
              <Grid item xs={12}><Alert severity="warning">Nenhum dado encontrado</Alert></Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={() => setTabAtiva(2)}>Voltar</Button>
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, mr: 'auto' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Formato</InputLabel>
            <Select value={config.formato} onChange={(e) => setConfig({ ...config, formato: e.target.value })} label="Formato">
              <MenuItem value="excel"><TableChart fontSize="small" sx={{ mr: 1 }} /> Excel</MenuItem>
              <MenuItem value="pdf"><PictureAsPdf fontSize="small" sx={{ mr: 1 }} /> PDF</MenuItem>
              <MenuItem value="csv"><Description fontSize="small" sx={{ mr: 1 }} /> CSV</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Button onClick={onClose} size="large">Cancelar</Button>
        <Button variant="contained" size="large" startIcon={<Download />} onClick={handleExportar} disabled={dadosRelatorio.length === 0 || camposSelecionadosCount === 0} sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}>
          Exportar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GeradorRelatoriosPersonalizados;
