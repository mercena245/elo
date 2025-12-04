import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, FormControl, InputLabel,
  Select, MenuItem, Checkbox, FormControlLabel,
  Typography, Box, Chip, Stack, Alert, Divider,
  List, ListItem, ListItemText, ListItemIcon,
  Accordion, AccordionSummary, AccordionDetails,
  Paper, IconButton, Tooltip
} from '@mui/material';
import {
  Close, ExpandMore, Download, PictureAsPdf,
  TableChart, CheckBox, CheckBoxOutlineBlank,
  Info, FilterList
} from '@mui/icons-material';
import { exportarParaExcel, exportarParaPDF, exportarParaCSV } from '../../../utils/exportUtils';

const GeradorRelatoriosPersonalizados = ({
  open,
  onClose,
  titulos = [],
  alunos = [],
  turmas = []
}) => {
  const [config, setConfig] = useState({
    tipo: 'inadimplentes', // inadimplentes, turma, aluno, personalizado
    formato: 'excel', // excel, pdf, csv
    periodo: {
      ativo: false,
      dataInicio: '',
      dataFim: ''
    },
    filtros: {
      turma: '',
      aluno: '',
      status: '', // todos, pago, pendente, vencido
      tipoTitulo: '' // todos, mensalidade, matricula, etc
    },
    camposSelecionados: {
      // Dados do Aluno
      nomeAluno: true,
      matricula: true,
      turma: true,
      statusAluno: false,
      
      // Dados do Responsável
      nomeResponsavel: true,
      cpfResponsavel: true,
      telefone: true,
      email: false,
      enderecoCompleto: true,
      
      // Dados Financeiros
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

  // Campos disponíveis organizados por categoria
  const camposDisponiveis = {
    'Dados do Aluno': [
      { key: 'nomeAluno', label: 'Nome do Aluno', tipo: 'texto' },
      { key: 'matricula', label: 'Matrícula', tipo: 'texto' },
      { key: 'turma', label: 'Turma', tipo: 'texto' },
      { key: 'statusAluno', label: 'Status do Aluno', tipo: 'texto' }
    ],
    'Dados do Responsável': [
      { key: 'nomeResponsavel', label: 'Nome do Responsável', tipo: 'texto' },
      { key: 'cpfResponsavel', label: 'CPF do Responsável', tipo: 'texto' },
      { key: 'telefone', label: 'Telefone', tipo: 'texto' },
      { key: 'email', label: 'Email', tipo: 'texto' },
      { key: 'enderecoCompleto', label: 'Endereço Completo', tipo: 'texto' }
    ],
    'Dados Financeiros': [
      { key: 'tipoTitulo', label: 'Tipo de Título', tipo: 'texto' },
      { key: 'descricaoTitulo', label: 'Descrição', tipo: 'texto' },
      { key: 'valor', label: 'Valor', tipo: 'moeda' },
      { key: 'vencimento', label: 'Data de Vencimento', tipo: 'data' },
      { key: 'statusTitulo', label: 'Status do Título', tipo: 'texto' },
      { key: 'dataPagamento', label: 'Data de Pagamento', tipo: 'data' },
      { key: 'diasAtraso', label: 'Dias de Atraso', tipo: 'numero' }
    ],
    'Estatísticas': [
      { key: 'quantidadeTitulos', label: 'Quantidade de Títulos', tipo: 'numero' },
      { key: 'valorTotal', label: 'Valor Total', tipo: 'moeda' },
      { key: 'valorPago', label: 'Valor Pago', tipo: 'moeda' },
      { key: 'valorPendente', label: 'Valor Pendente', tipo: 'moeda' }
    ]
  };

  // Função auxiliar para criar linha de relatório (deve estar antes do useMemo)
  const criarLinhaRelatorio = (aluno, titulos, hoje, detalhado = false) => {
    const linha = {};
    const campos = config.camposSelecionados;

    if (!aluno) {
      aluno = {
        nome: 'Aluno não cadastrado',
        matricula: 'N/A',
        turma: 'N/A'
      };
    }

    // Dados do Aluno
    if (campos.nomeAluno) linha['Nome do Aluno'] = aluno.nome || 'N/A';
    if (campos.matricula) linha['Matrícula'] = aluno.matricula || 'N/A';
    if (campos.turma) linha['Turma'] = aluno.turma || 'N/A';
    if (campos.statusAluno) linha['Status do Aluno'] = aluno.status || 'ativo';

    // Dados do Responsável
    if (campos.nomeResponsavel) linha['Nome do Responsável'] = aluno.responsavelNome || 'N/A';
    if (campos.cpfResponsavel) linha['CPF do Responsável'] = aluno.responsavelCpf || 'N/A';
    if (campos.telefone) linha['Telefone'] = aluno.telefone || aluno.responsavelTelefone || 'N/A';
    if (campos.email) linha['Email'] = aluno.email || aluno.responsavelEmail || 'N/A';
    if (campos.enderecoCompleto && aluno.endereco) {
      linha['Endereço Completo'] = `${aluno.endereco.rua || ''}, ${aluno.endereco.numero || ''} - ${aluno.endereco.bairro || ''}, ${aluno.endereco.cidade || ''}/${aluno.endereco.estado || ''} - CEP: ${aluno.endereco.cep || ''}`;
    }

    if (detalhado && titulos.length === 1) {
      // Modo detalhado (um título por linha)
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
      // Modo agrupado (estatísticas)
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

  // Gerar dados do relatório com base na configuração
  const dadosRelatorio = useMemo(() => {
    const hoje = new Date();
    let dadosFiltrados = [];

    // Filtrar títulos por período
    let titulosFiltrados = [...titulos];
    if (config.periodo.ativo && config.periodo.dataInicio && config.periodo.dataFim) {
      const inicio = new Date(config.periodo.dataInicio);
      const fim = new Date(config.periodo.dataFim);
      titulosFiltrados = titulosFiltrados.filter(t => {
        const venc = new Date(t.vencimento);
        return venc >= inicio && venc <= fim;
      });
    }

    // Filtrar por turma
    if (config.filtros.turma) {
      titulosFiltrados = titulosFiltrados.filter(t => {
        const aluno = alunos.find(a => a.id === t.alunoId);
        return aluno && aluno.turma === config.filtros.turma;
      });
    }

    // Filtrar por aluno específico
    if (config.filtros.aluno) {
      titulosFiltrados = titulosFiltrados.filter(t => t.alunoId === config.filtros.aluno);
    }

    // Filtrar por status
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

    // Filtrar por tipo de título
    if (config.filtros.tipoTitulo && config.filtros.tipoTitulo !== 'todos') {
      titulosFiltrados = titulosFiltrados.filter(t => t.tipo === config.filtros.tipoTitulo);
    }

    // Processar dados baseado no tipo de relatório
    if (config.tipo === 'inadimplentes') {
      // Agrupar por aluno (apenas inadimplentes)
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
      // Agrupar por aluno
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

    } else if (config.tipo === 'personalizado') {
      // Relatório detalhado título por título
      titulosFiltrados.forEach(titulo => {
        const aluno = alunos.find(a => a.id === titulo.alunoId);
        dadosFiltrados.push(criarLinhaRelatorio(aluno, [titulo], hoje, true));
      });
    }

    // Ordenar dados
    dadosFiltrados.sort((a, b) => {
      const valorA = a[config.ordenacao.campo] || '';
      const valorB = b[config.ordenacao.campo] || '';
      
      if (config.ordenacao.direcao === 'asc') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });

    return dadosFiltrados;
  }, [titulos, alunos, config, config.filtros]);

  // Exportar relatório
  const handleExportar = async () => {
    if (dadosRelatorio.length === 0) {
      alert('Nenhum dado encontrado para exportar com os filtros aplicados.');
      return;
    }

    const nomeArquivo = `Relatorio_${config.tipo}_${new Date().toISOString().split('T')[0]}`;

    try {
      if (config.formato === 'excel') {
        exportarParaExcel(dadosRelatorio, nomeArquivo, 'Relatório');
        alert('Relatório exportado para Excel com sucesso!');
        onClose();
      } else if (config.formato === 'csv') {
        exportarParaCSV(dadosRelatorio, nomeArquivo);
        alert('Relatório exportado para CSV com sucesso!');
        onClose();
      } else if (config.formato === 'pdf') {
        // Preparar colunas para PDF
        const colunas = Object.keys(dadosRelatorio[0]).map(key => ({
          header: key,
          dataKey: key
        }));

        const camposMonetarios = ['Valor', 'Valor Total', 'Valor Pago', 'Valor Pendente'];

        const resultado = exportarParaPDF({
          dados: dadosRelatorio,
          titulo: `Relatório - ${config.tipo}`,
          colunas: colunas,
          orientacao: colunas.length > 6 ? 'landscape' : 'portrait',
          formatoMoeda: camposMonetarios,
          subtitulo: `Período: ${config.periodo.ativo ? 
            `${config.periodo.dataInicio} a ${config.periodo.dataFim}` : 
            'Todos os períodos'}`,
          rodape: `Gerado automaticamente pelo Sistema ELO`
        });

        if (resultado.success) {
          alert('Relatório exportado para PDF com sucesso!');
          onClose();
        } else {
          alert(`Erro ao exportar: ${resultado.error}`);
        }
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      alert(`Erro ao exportar relatório: ${error.message}`);
    }
  };

  // Toggle campo
  const toggleCampo = (key) => {
    setConfig({
      ...config,
      camposSelecionados: {
        ...config.camposSelecionados,
        [key]: !config.camposSelecionados[key]
      }
    });
  };

  // Selecionar todos campos de uma categoria
  const selecionarTodosCampos = (categoria) => {
    const novosCampos = { ...config.camposSelecionados };
    camposDisponiveis[categoria].forEach(campo => {
      novosCampos[campo.key] = true;
    });
    setConfig({ ...config, camposSelecionados: novosCampos });
  };

  // Desselecionar todos campos de uma categoria
  const desselecionarTodosCampos = (categoria) => {
    const novosCampos = { ...config.camposSelecionados };
    camposDisponiveis[categoria].forEach(campo => {
      novosCampos[campo.key] = false;
    });
    setConfig({ ...config, camposSelecionados: novosCampos });
  };

  const camposSelecionadosCount = Object.values(config.camposSelecionados).filter(v => v).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">📊 Gerador de Relatórios Personalizados</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Tipo de Relatório */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                1️⃣ Tipo de Relatório
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant={config.tipo === 'inadimplentes' ? 'contained' : 'outlined'}
                    onClick={() => setConfig({ ...config, tipo: 'inadimplentes' })}
                    sx={{ py: 2 }}
                  >
                    🔴 Inadimplentes
                  </Button>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant={config.tipo === 'turma' ? 'contained' : 'outlined'}
                    onClick={() => setConfig({ ...config, tipo: 'turma' })}
                    sx={{ py: 2 }}
                  >
                    🎓 Por Turma
                  </Button>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant={config.tipo === 'aluno' ? 'contained' : 'outlined'}
                    onClick={() => setConfig({ ...config, tipo: 'aluno' })}
                    sx={{ py: 2 }}
                  >
                    👤 Por Aluno
                  </Button>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant={config.tipo === 'personalizado' ? 'contained' : 'outlined'}
                    onClick={() => setConfig({ ...config, tipo: 'personalizado' })}
                    sx={{ py: 2 }}
                  >
                    ⚙️ Personalizado
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Período */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  📅 Período {config.periodo.ativo && <Chip label="Ativo" color="primary" size="small" sx={{ ml: 1 }} />}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={config.periodo.ativo}
                          onChange={(e) => setConfig({
                            ...config,
                            periodo: { ...config.periodo, ativo: e.target.checked }
                          })}
                        />
                      }
                      label="Filtrar por período"
                    />
                  </Grid>
                  {config.periodo.ativo && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Data Início"
                          value={config.periodo.dataInicio}
                          onChange={(e) => setConfig({
                            ...config,
                            periodo: { ...config.periodo, dataInicio: e.target.value }
                          })}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Data Fim"
                          value={config.periodo.dataFim}
                          onChange={(e) => setConfig({
                            ...config,
                            periodo: { ...config.periodo, dataFim: e.target.value }
                          })}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Filtros */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  <FilterList sx={{ mr: 1 }} /> Filtros Avançados
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Turma</InputLabel>
                      <Select
                        value={config.filtros.turma}
                        onChange={(e) => setConfig({
                          ...config,
                          filtros: { ...config.filtros, turma: e.target.value }
                        })}
                        label="Turma"
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {turmas.map(turma => (
                          <MenuItem key={turma} value={turma}>{turma}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Aluno Específico</InputLabel>
                      <Select
                        value={config.filtros.aluno}
                        onChange={(e) => setConfig({
                          ...config,
                          filtros: { ...config.filtros, aluno: e.target.value }
                        })}
                        label="Aluno Específico"
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {alunos.map(aluno => (
                          <MenuItem key={aluno.id} value={aluno.id}>
                            {aluno.nome} - {aluno.turma}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Status do Título</InputLabel>
                      <Select
                        value={config.filtros.status}
                        onChange={(e) => setConfig({
                          ...config,
                          filtros: { ...config.filtros, status: e.target.value }
                        })}
                        label="Status do Título"
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="pago">Pago</MenuItem>
                        <MenuItem value="pendente">Pendente</MenuItem>
                        <MenuItem value="vencido">Vencido</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Título</InputLabel>
                      <Select
                        value={config.filtros.tipoTitulo}
                        onChange={(e) => setConfig({
                          ...config,
                          filtros: { ...config.filtros, tipoTitulo: e.target.value }
                        })}
                        label="Tipo de Título"
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="Mensalidade">Mensalidade</MenuItem>
                        <MenuItem value="Matrícula">Matrícula</MenuItem>
                        <MenuItem value="Material">Material</MenuItem>
                        <MenuItem value="Transporte">Transporte</MenuItem>
                        <MenuItem value="Outros">Outros</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Campos do Relatório */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  ✅ Campos do Relatório ({camposSelecionadosCount} selecionados)
                </Typography>
              </Stack>

              {Object.keys(camposDisponiveis).map((categoria) => (
                <Accordion key={categoria}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%', pr: 2 }}>
                      <Typography fontWeight="medium">{categoria}</Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            selecionarTodosCampos(categoria);
                          }}
                        >
                          Todos
                        </Button>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            desselecionarTodosCampos(categoria);
                          }}
                        >
                          Nenhum
                        </Button>
                      </Stack>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {camposDisponiveis[categoria].map((campo) => (
                        <ListItem key={campo.key} button onClick={() => toggleCampo(campo.key)}>
                          <ListItemIcon>
                            {config.camposSelecionados[campo.key] ? (
                              <CheckBox color="primary" />
                            ) : (
                              <CheckBoxOutlineBlank />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={campo.label}
                            secondary={`Tipo: ${campo.tipo}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>
          </Grid>

          {/* Formato de Exportação */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                💾 Formato de Exportação
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant={config.formato === 'excel' ? 'contained' : 'outlined'}
                    startIcon={<TableChart />}
                    onClick={() => setConfig({ ...config, formato: 'excel' })}
                    sx={{ py: 2 }}
                  >
                    Excel (.xlsx)
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant={config.formato === 'pdf' ? 'contained' : 'outlined'}
                    startIcon={<PictureAsPdf />}
                    onClick={() => setConfig({ ...config, formato: 'pdf' })}
                    sx={{ py: 2 }}
                  >
                    PDF
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant={config.formato === 'csv' ? 'contained' : 'outlined'}
                    startIcon={<Download />}
                    onClick={() => setConfig({ ...config, formato: 'csv' })}
                    sx={{ py: 2 }}
                  >
                    CSV
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Alert severity="info" icon={<Info />}>
              <Typography variant="body2">
                <strong>{dadosRelatorio.length}</strong> registro(s) serão exportados com os filtros aplicados.
              </Typography>
              {camposSelecionadosCount === 0 && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  ⚠️ Selecione pelo menos um campo para o relatório!
                </Typography>
              )}
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExportar}
          disabled={dadosRelatorio.length === 0 || camposSelecionadosCount === 0}
        >
          Gerar Relatório
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GeradorRelatoriosPersonalizados;
