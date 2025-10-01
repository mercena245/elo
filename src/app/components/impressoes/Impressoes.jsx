import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Print,
  FilterList,
  Download,
  Visibility,
  School,
  Group,
  Assignment,
  BarChart,
  ExpandMore,
  AutoAwesome,
  Tune,
  Description
} from '@mui/icons-material';
import { db, ref, get } from '../../../firebase';

const Impressoes = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [relatorioGerado, setRelatorioGerado] = useState(null);

  // Dados para filtros
  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [alunos, setAlunos] = useState([]);

  // Filtros personalizáveis
  const [filtrosPersonalizados, setFiltrosPersonalizados] = useState({
    turmaIds: [],
    disciplinaIds: [],
    professorIds: [],
    alunoIds: [],
    bimestres: [],
    periodoInicio: '',
    periodoFim: '',
    incluirNotas: true,
    incluirFrequencia: true,
    incluirComportamentos: false,
    incluirDadosPessoais: true
  });

  // Bimestres fixos
  const bimestres = [
    { id: '1º Bimestre', nome: '1º Bimestre' },
    { id: '2º Bimestre', nome: '2º Bimestre' },
    { id: '3º Bimestre', nome: '3º Bimestre' },
    { id: '4º Bimestre', nome: '4º Bimestre' }
  ];

  // Relatórios pré-configurados
  const relatoriosPreConfigurados = [
    {
      id: 'lista-alunos-completa',
      titulo: '📋 Lista Completa de Alunos',
      descricao: 'Lista com todos os alunos, dados pessoais e turmas',
      icone: <Group />,
      config: {
        incluirDadosPessoais: true,
        incluirTurma: true,
        incluirNotas: false,
        incluirFrequencia: false
      }
    },
    {
      id: 'notas-por-turma',
      titulo: '📊 Relatório de Notas por Turma',
      descricao: 'Notas de todos os alunos organizadas por turma e disciplina',
      icone: <BarChart />,
      config: {
        incluirNotas: true,
        incluirFrequencia: false,
        incluirDadosPessoais: true,
        agruparPorTurma: true
      }
    },
    {
      id: 'frequencia-geral',
      titulo: '📅 Relatório de Frequência Geral',
      descricao: 'Relatório de presença e faltas por turma e período',
      icone: <Assignment />,
      config: {
        incluirFrequencia: true,
        incluirNotas: false,
        incluirDadosPessoais: true,
        agruparPorTurma: true
      }
    },
    {
      id: 'boletim-completo',
      titulo: '🎓 Boletim Escolar Completo',
      descricao: 'Boletim com notas e frequência de todos os alunos',
      icone: <School />,
      config: {
        incluirNotas: true,
        incluirFrequencia: true,
        incluirDadosPessoais: true,
        formatoBoletim: true
      }
    }
  ];

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [turmasSnap, disciplinasSnap, usuariosSnap, alunosSnap] = await Promise.all([
        get(ref(db, 'turmas')),
        get(ref(db, 'disciplinas')),
        get(ref(db, 'usuarios')),
        get(ref(db, 'alunos'))
      ]);

      // Carregar turmas
      const turmasData = [];
      if (turmasSnap.exists()) {
        Object.entries(turmasSnap.val()).forEach(([id, data]) => {
          turmasData.push({ id, ...data });
        });
      }
      setTurmas(turmasData);

      // Carregar disciplinas
      const disciplinasData = [];
      if (disciplinasSnap.exists()) {
        Object.entries(disciplinasSnap.val()).forEach(([id, data]) => {
          disciplinasData.push({ id, ...data });
        });
      }
      setDisciplinas(disciplinasData);

      // Carregar professores
      const professoresData = [];
      if (usuariosSnap.exists()) {
        Object.entries(usuariosSnap.val()).forEach(([id, data]) => {
          if (data.role === 'professora' && data.nome) {
            professoresData.push({ id, ...data });
          }
        });
      }
      setProfessores(professoresData);

      // Carregar alunos
      const alunosData = [];
      if (alunosSnap.exists()) {
        Object.entries(alunosSnap.val()).forEach(([id, data]) => {
          alunosData.push({ id, ...data });
        });
      }
      alunosData.sort((a, b) => a.nome?.localeCompare(b.nome) || 0);
      setAlunos(alunosData);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setMensagem('❌ Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltrosPersonalizados(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleMultiSelectChange = (campo, valor) => {
    setFiltrosPersonalizados(prev => ({
      ...prev,
      [campo]: typeof valor === 'string' ? valor.split(',') : valor
    }));
  };

  const gerarRelatorioPersonalizado = async (tipo) => {
    try {
      setGerandoRelatorio(true);
      setMensagem('');

      const temFiltros = filtrosPersonalizados.turmaIds.length > 0 || 
                        filtrosPersonalizados.disciplinaIds.length > 0 || 
                        filtrosPersonalizados.professorIds.length > 0;

      if (!temFiltros) {
        setMensagem('⚠️ Selecione pelo menos uma turma, disciplina ou professor para gerar o relatório.');
        return;
      }

      const dados = await carregarDadosRelatorio();
      
      if (!dados || dados.alunos.length === 0) {
        setMensagem('❌ Nenhum dado encontrado com os filtros selecionados.');
        return;
      }

      const htmlRelatorio = gerarHTMLRelatorio(dados);
      setRelatorioGerado(htmlRelatorio);

      if (tipo === 'preview') {
        setPreviewOpen(true);
      } else if (tipo === 'print') {
        imprimirRelatorio(htmlRelatorio);
      } else if (tipo === 'download') {
        baixarPDFRelatorio(htmlRelatorio);
      }

      setMensagem('✅ Relatório gerado com sucesso!');

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setMensagem('❌ Erro ao gerar relatório. Tente novamente.');
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const gerarRelatorioPreConfigurado = async (relatorio) => {
    try {
      setGerandoRelatorio(true);
      setMensagem('');

      const dados = await carregarDadosRelatorioCompleto(relatorio.config);
      
      if (!dados || dados.alunos.length === 0) {
        setMensagem('❌ Nenhum dado encontrado para gerar o relatório.');
        return;
      }

      let htmlRelatorio;
      switch (relatorio.id) {
        case 'lista-alunos-completa':
          htmlRelatorio = gerarHTMLListaAlunos(dados);
          break;
        case 'notas-por-turma':
          htmlRelatorio = gerarHTMLNotasPorTurma(dados);
          break;
        case 'frequencia-geral':
          htmlRelatorio = gerarHTMLFrequenciaGeral(dados);
          break;
        case 'boletim-completo':
          htmlRelatorio = gerarHTMLBoletimCompleto(dados);
          break;
        default:
          htmlRelatorio = gerarHTMLRelatorio(dados);
      }

      setRelatorioGerado(htmlRelatorio);
      setPreviewOpen(true);
      setMensagem('✅ Relatório gerado com sucesso!');

    } catch (error) {
      console.error('Erro ao gerar relatório pré-configurado:', error);
      setMensagem('❌ Erro ao gerar relatório. Tente novamente.');
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const carregarDadosRelatorio = async () => {
    try {
      const dados = { alunos: [], notas: [], frequencia: [], comportamentos: [] };

      const alunosSnap = await get(ref(db, 'alunos'));
      if (alunosSnap.exists()) {
        Object.entries(alunosSnap.val()).forEach(([id, data]) => {
          const incluirAluno = filtrosPersonalizados.turmaIds.length === 0 || 
                              filtrosPersonalizados.turmaIds.includes(data.turmaId);
          
          if (incluirAluno) {
            dados.alunos.push({ id, ...data });
          }
        });
      }

      if (filtrosPersonalizados.incluirNotas) {
        const notasSnap = await get(ref(db, 'notas'));
        if (notasSnap.exists()) {
          Object.entries(notasSnap.val()).forEach(([id, data]) => {
            const incluirNota = (filtrosPersonalizados.turmaIds.length === 0 || filtrosPersonalizados.turmaIds.includes(data.turmaId)) &&
                               (filtrosPersonalizados.disciplinaIds.length === 0 || filtrosPersonalizados.disciplinaIds.includes(data.disciplinaId)) &&
                               (filtrosPersonalizados.professorIds.length === 0 || filtrosPersonalizados.professorIds.includes(data.professorId)) &&
                               (filtrosPersonalizados.bimestres.length === 0 || filtrosPersonalizados.bimestres.includes(data.bimestre));
            
            if (incluirNota) {
              dados.notas.push({ id, ...data });
            }
          });
        }
      }

      return dados;

    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
      throw error;
    }
  };

  const carregarDadosRelatorioCompleto = async (config) => {
    try {
      const dados = { alunos: [], notas: [], frequencia: [], comportamentos: [] };

      const alunosSnap = await get(ref(db, 'alunos'));
      if (alunosSnap.exists()) {
        Object.entries(alunosSnap.val()).forEach(([id, data]) => {
          dados.alunos.push({ id, ...data });
        });
      }

      if (config.incluirNotas) {
        const notasSnap = await get(ref(db, 'notas'));
        if (notasSnap.exists()) {
          Object.entries(notasSnap.val()).forEach(([id, data]) => {
            dados.notas.push({ id, ...data });
          });
        }
      }

      if (config.incluirFrequencia) {
        const frequenciaSnap = await get(ref(db, 'frequencia'));
        if (frequenciaSnap.exists()) {
          Object.entries(frequenciaSnap.val()).forEach(([id, data]) => {
            dados.frequencia.push({ id, ...data });
          });
        }
      }

      return dados;

    } catch (error) {
      console.error('Erro ao carregar dados completos:', error);
      throw error;
    }
  };

  const gerarHTMLRelatorio = (dados) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR');

    return `
      <html>
        <head>
          <title>Relatório Escolar</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            .subtitle { font-size: 16px; color: #666; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">📋 Relatório Escolar Personalizado</div>
            <div class="subtitle">Gerado em ${dataAtual} às ${horaAtual}</div>
          </div>
          <p>Total de registros encontrados: ${dados.alunos.length}</p>
        </body>
      </html>
    `;
  };

  const gerarHTMLListaAlunos = (dados) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    return `
      <html>
        <head>
          <title>Lista Completa de Alunos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #2196F3; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">📋 Lista Completa de Alunos</div>
            <div>Gerado em ${dataAtual}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Nome Completo</th>
                <th>Matrícula</th>
                <th>Turma</th>
                <th>Data de Nascimento</th>
                <th>Responsável</th>
              </tr>
            </thead>
            <tbody>
              ${dados.alunos.map(aluno => {
                const turma = turmas.find(t => t.id === aluno.turmaId);
                return `
                  <tr>
                    <td style="font-weight: bold;">${aluno.nome}</td>
                    <td>${aluno.matricula || '-'}</td>
                    <td>${turma?.nome || '-'}</td>
                    <td>${aluno.dataNascimento ? new Date(aluno.dataNascimento).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>${aluno.responsavel || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            Total de alunos: ${dados.alunos.length} | Sistema ELO - ${new Date().toLocaleString('pt-BR')}
          </div>
        </body>
      </html>
    `;
  };

  const gerarHTMLNotasPorTurma = (dados) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Agrupar dados por turma
    const dadosPorTurma = {};
    dados.alunos.forEach(aluno => {
      if (!dadosPorTurma[aluno.turmaId]) {
        const turma = turmas.find(t => t.id === aluno.turmaId);
        dadosPorTurma[aluno.turmaId] = {
          nome: turma?.nome || 'Turma não identificada',
          alunos: []
        };
      }
      
      const notasAluno = dados.notas.filter(n => n.alunoId === aluno.id);
      dadosPorTurma[aluno.turmaId].alunos.push({
        ...aluno,
        notas: notasAluno
      });
    });

    let html = `
      <html>
        <head>
          <title>Relatório de Notas por Turma</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            .turma-section { margin: 30px 0; page-break-before: auto; }
            .turma-title { font-size: 20px; font-weight: bold; color: #2196F3; margin-bottom: 15px; border-left: 4px solid #2196F3; padding-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .aluno-nome { text-align: left; font-weight: bold; }
            .nota-aprovado { color: #4caf50; font-weight: bold; }
            .nota-recuperacao { color: #ff9800; font-weight: bold; }
            .nota-reprovado { color: #f44336; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">📊 Relatório de Notas por Turma</div>
            <div>Gerado em ${dataAtual}</div>
          </div>
    `;

    Object.values(dadosPorTurma).forEach(turmaData => {
      html += `
        <div class="turma-section">
          <div class="turma-title">Turma: ${turmaData.nome}</div>
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>1º Bim</th>
                <th>2º Bim</th>
                <th>3º Bim</th>
                <th>4º Bim</th>
                <th>Média</th>
              </tr>
            </thead>
            <tbody>
      `;

      turmaData.alunos.forEach(aluno => {
        const notasPorBimestre = {};
        aluno.notas.forEach(nota => {
          if (!notasPorBimestre[nota.bimestre]) {
            notasPorBimestre[nota.bimestre] = [];
          }
          notasPorBimestre[nota.bimestre].push(nota.nota);
        });

        const medias = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'].map(bim => {
          const notas = notasPorBimestre[bim] || [];
          return notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : '-';
        });

        const mediaGeral = medias.filter(m => m !== '-').length > 0 
          ? (medias.filter(m => m !== '-').reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / medias.filter(m => m !== '-').length).toFixed(1)
          : '-';

        const getClasseNota = (nota) => {
          if (nota === '-') return '';
          const valor = parseFloat(nota);
          return valor >= 7 ? 'nota-aprovado' : valor >= 5 ? 'nota-recuperacao' : 'nota-reprovado';
        };

        html += `
          <tr>
            <td class="aluno-nome">${aluno.nome}</td>
            <td class="${getClasseNota(medias[0])}">${medias[0]}</td>
            <td class="${getClasseNota(medias[1])}">${medias[1]}</td>
            <td class="${getClasseNota(medias[2])}">${medias[2]}</td>
            <td class="${getClasseNota(medias[3])}">${medias[3]}</td>
            <td class="${getClasseNota(mediaGeral)}" style="font-weight: bold;">${mediaGeral}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    });

    html += `
          <div class="footer">
            Sistema ELO - Relatório de Notas - ${new Date().toLocaleString('pt-BR')}
          </div>
        </body>
      </html>
    `;

    return html;
  };

  const gerarHTMLFrequenciaGeral = (dados) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    return `
      <html>
        <head>
          <title>Relatório de Frequência Geral</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4caf50; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            .frequencia-boa { color: #4caf50; font-weight: bold; }
            .frequencia-alerta { color: #ff9800; font-weight: bold; }
            .frequencia-critica { color: #f44336; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">📅 Relatório de Frequência Geral</div>
            <div>Gerado em ${dataAtual}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Nome do Aluno</th>
                <th>Turma</th>
                <th>Total de Presenças</th>
                <th>Total de Faltas</th>
                <th>% Frequência</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${dados.alunos.map(aluno => {
                const turma = turmas.find(t => t.id === aluno.turmaId);
                const frequenciaAluno = dados.frequencia.filter(f => f.alunoId === aluno.id);
                
                const totalPresencas = frequenciaAluno.filter(f => f.presente === true).length;
                const totalFaltas = frequenciaAluno.filter(f => f.presente === false).length;
                const totalAulas = totalPresencas + totalFaltas;
                const percentualFreq = totalAulas > 0 ? ((totalPresencas / totalAulas) * 100).toFixed(1) : 0;
                
                const getClasseFreq = (perc) => {
                  if (perc >= 75) return 'frequencia-boa';
                  if (perc >= 60) return 'frequencia-alerta';
                  return 'frequencia-critica';
                };
                
                const getStatusFreq = (perc) => {
                  if (perc >= 75) return 'Regular';
                  if (perc >= 60) return 'Atenção';
                  return 'Crítica';
                };
                
                return `
                  <tr>
                    <td style="font-weight: bold;">${aluno.nome}</td>
                    <td>${turma?.nome || '-'}</td>
                    <td style="text-align: center;">${totalPresencas}</td>
                    <td style="text-align: center;">${totalFaltas}</td>
                    <td style="text-align: center;" class="${getClasseFreq(percentualFreq)}">${percentualFreq}%</td>
                    <td class="${getClasseFreq(percentualFreq)}">${getStatusFreq(percentualFreq)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            Total de alunos: ${dados.alunos.length} | Sistema ELO - ${new Date().toLocaleString('pt-BR')}
          </div>
        </body>
      </html>
    `;
  };

  const gerarHTMLBoletimCompleto = (dados) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    return `
      <html>
        <head>
          <title>Boletim Escolar Completo</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            .aluno-section { margin: 40px 0; page-break-before: auto; border: 2px solid #333; padding: 20px; }
            .aluno-header { font-size: 18px; font-weight: bold; color: #2196F3; margin-bottom: 15px; text-align: center; }
            .info-pessoal { margin-bottom: 20px; background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #2196F3; color: white; font-weight: bold; }
            .disciplina { text-align: left; font-weight: bold; }
            .nota-aprovado { color: #4caf50; font-weight: bold; }
            .nota-recuperacao { color: #ff9800; font-weight: bold; }
            .nota-reprovado { color: #f44336; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">🎓 Boletim Escolar Completo</div>
            <div>Gerado em ${dataAtual}</div>
          </div>
          
          ${dados.alunos.map(aluno => {
            const turma = turmas.find(t => t.id === aluno.turmaId);
            const notasAluno = dados.notas.filter(n => n.alunoId === aluno.id);
            const frequenciaAluno = dados.frequencia.filter(f => f.alunoId === aluno.id);
            
            // Agrupar notas por disciplina
            const notasPorDisciplina = {};
            notasAluno.forEach(nota => {
              if (!notasPorDisciplina[nota.disciplinaId]) {
                notasPorDisciplina[nota.disciplinaId] = {};
              }
              notasPorDisciplina[nota.disciplinaId][nota.bimestre] = nota.nota;
            });
            
            return `
              <div class="aluno-section">
                <div class="aluno-header">BOLETIM DE ${aluno.nome.toUpperCase()}</div>
                
                <div class="info-pessoal">
                  <strong>Matrícula:</strong> ${aluno.matricula || 'Não informada'} | 
                  <strong>Turma:</strong> ${turma?.nome || 'Não informada'} | 
                  <strong>Data de Nascimento:</strong> ${aluno.dataNascimento ? new Date(aluno.dataNascimento).toLocaleDateString('pt-BR') : 'Não informada'}
                </div>
                
                <table>
                  <thead>
                    <tr>
                      <th>Disciplina</th>
                      <th>1º Bim</th>
                      <th>2º Bim</th>
                      <th>3º Bim</th>
                      <th>4º Bim</th>
                      <th>Média Final</th>
                      <th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${disciplinas.map(disciplina => {
                      const notasDisc = notasPorDisciplina[disciplina.id] || {};
                      const notas = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'].map(bim => notasDisc[bim] || '-');
                      const notasValidas = notas.filter(n => n !== '-').map(n => parseFloat(n));
                      const mediaFinal = notasValidas.length > 0 ? (notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(1) : '-';
                      
                      const getClasseNota = (nota) => {
                        if (nota === '-') return '';
                        const valor = parseFloat(nota);
                        return valor >= 7 ? 'nota-aprovado' : valor >= 5 ? 'nota-recuperacao' : 'nota-reprovado';
                      };
                      
                      const getSituacao = (media) => {
                        if (media === '-') return 'Não avaliado';
                        const valor = parseFloat(media);
                        return valor >= 7 ? 'Aprovado' : valor >= 5 ? 'Recuperação' : 'Reprovado';
                      };
                      
                      return `
                        <tr>
                          <td class="disciplina">${disciplina.nome}</td>
                          <td class="${getClasseNota(notas[0])}">${notas[0]}</td>
                          <td class="${getClasseNota(notas[1])}">${notas[1]}</td>
                          <td class="${getClasseNota(notas[2])}">${notas[2]}</td>
                          <td class="${getClasseNota(notas[3])}">${notas[3]}</td>
                          <td class="${getClasseNota(mediaFinal)}" style="font-weight: bold;">${mediaFinal}</td>
                          <td class="${getClasseNota(mediaFinal)}">${getSituacao(mediaFinal)}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `;
          }).join('')}
          
          <div class="footer">
            Sistema ELO - Boletim Escolar - ${new Date().toLocaleString('pt-BR')}
          </div>
        </body>
      </html>
    `;
  };

  const imprimirRelatorio = (html) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const baixarPDFRelatorio = (html) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
        <Print sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="primary" fontWeight={600}>
            🖨️ Central de Impressões e Relatórios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gere relatórios personalizados e imprima documentos escolares
          </Typography>
        </Box>
      </Box>

      {/* Mensagens */}
      {mensagem && (
        <Alert 
          severity={mensagem.includes('✅') ? 'success' : 'error'} 
          sx={{ mb: 2 }}
          onClose={() => setMensagem('')}
        >
          {mensagem}
        </Alert>
      )}

      {/* Tabs principais */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable" 
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: { xs: 48, sm: 64 },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }
            }}
          >
            <Tab 
              icon={<AutoAwesome />} 
              label="Relatórios Pré-configurados" 
              iconPosition="start"
              sx={{ 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.5, sm: 1 }
              }}
            />
            <Tab 
              icon={<Tune />} 
              label="Relatórios Personalizados" 
              iconPosition="start"
              sx={{ 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.5, sm: 1 }
              }}
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* Aba 1: Relatórios Pré-configurados */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome color="primary" />
                Relatórios Prontos para Uso
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Selecione um dos relatórios pré-configurados abaixo para gerar rapidamente
              </Typography>

              <Grid container spacing={3}>
                {relatoriosPreConfigurados.map((relatorio) => (
                  <Grid item xs={12} md={6} lg={4} key={relatorio.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 3
                        }
                      }}
                      onClick={() => gerarRelatorioPreConfigurado(relatorio)}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 3 }}>
                        <Box sx={{ color: 'primary.main', mb: 2 }}>
                          {React.cloneElement(relatorio.icone, { sx: { fontSize: 48 } })}
                        </Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {relatorio.titulo}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {relatorio.descricao}
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Description />}
                          size="small"
                          sx={{ mt: 1 }}
                        >
                          Gerar Relatório
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Aba 2: Relatórios Personalizados */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tune color="primary" />
                Crie Seu Relatório Personalizado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure os filtros abaixo para gerar um relatório sob medida
              </Typography>

              {/* Seção 1: Filtros de Seleção */}
              <Accordion defaultExpanded sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterList color="primary" />
                    Filtros de Seleção
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    {/* Filtro Turmas */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Turmas</InputLabel>
                        <Select
                          multiple
                          value={filtrosPersonalizados.turmaIds}
                          label="Turmas"
                          onChange={(e) => handleMultiSelectChange('turmaIds', e.target.value)}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => {
                                const turma = turmas.find(t => t.id === value);
                                return (
                                  <Chip key={value} label={turma?.nome || value} size="small" />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {turmas.map((turma) => (
                            <MenuItem key={turma.id} value={turma.id}>
                              {turma.nome}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Filtro Disciplinas */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Disciplinas</InputLabel>
                        <Select
                          multiple
                          value={filtrosPersonalizados.disciplinaIds}
                          label="Disciplinas"
                          onChange={(e) => handleMultiSelectChange('disciplinaIds', e.target.value)}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => {
                                const disciplina = disciplinas.find(d => d.id === value);
                                return (
                                  <Chip key={value} label={disciplina?.nome || value} size="small" />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {disciplinas.map((disciplina) => (
                            <MenuItem key={disciplina.id} value={disciplina.id}>
                              {disciplina.nome}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Filtro Professores */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Professores</InputLabel>
                        <Select
                          multiple
                          value={filtrosPersonalizados.professorIds}
                          label="Professores"
                          onChange={(e) => handleMultiSelectChange('professorIds', e.target.value)}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => {
                                const professor = professores.find(p => p.id === value);
                                return (
                                  <Chip key={value} label={professor?.nome || value} size="small" />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {professores.map((professor) => (
                            <MenuItem key={professor.id} value={professor.id}>
                              {professor.nome}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Filtro Bimestres */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Bimestres</InputLabel>
                        <Select
                          multiple
                          value={filtrosPersonalizados.bimestres}
                          label="Bimestres"
                          onChange={(e) => handleMultiSelectChange('bimestres', e.target.value)}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {bimestres.map((bimestre) => (
                            <MenuItem key={bimestre.id} value={bimestre.id}>
                              {bimestre.nome}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Filtro Período */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Data Início"
                        value={filtrosPersonalizados.periodoInicio}
                        onChange={(e) => handleFiltroChange('periodoInicio', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Data Fim"
                        value={filtrosPersonalizados.periodoFim}
                        onChange={(e) => handleFiltroChange('periodoFim', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Seção 2: Conteúdo do Relatório */}
              <Accordion defaultExpanded sx={{ mb: 3 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Description color="primary" />
                    Conteúdo do Relatório
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormGroup>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filtrosPersonalizados.incluirDadosPessoais}
                              onChange={(e) => handleFiltroChange('incluirDadosPessoais', e.target.checked)}
                            />
                          }
                          label="Dados Pessoais"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filtrosPersonalizados.incluirNotas}
                              onChange={(e) => handleFiltroChange('incluirNotas', e.target.checked)}
                            />
                          }
                          label="Notas"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filtrosPersonalizados.incluirFrequencia}
                              onChange={(e) => handleFiltroChange('incluirFrequencia', e.target.checked)}
                            />
                          }
                          label="Frequência"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filtrosPersonalizados.incluirComportamentos}
                              onChange={(e) => handleFiltroChange('incluirComportamentos', e.target.checked)}
                            />
                          }
                          label="Comportamentos"
                        />
                      </Grid>
                    </Grid>
                  </FormGroup>
                </AccordionDetails>
              </Accordion>

              {/* Botões de Ação */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={() => gerarRelatorioPersonalizado('preview')}
                  disabled={gerandoRelatorio}
                  size="large"
                >
                  Visualizar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Print />}
                  onClick={() => gerarRelatorioPersonalizado('print')}
                  disabled={gerandoRelatorio}
                  size="large"
                >
                  {gerandoRelatorio ? 'Gerando...' : 'Gerar e Imprimir'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={() => gerarRelatorioPersonalizado('download')}
                  disabled={gerandoRelatorio}
                  color="secondary"
                  size="large"
                >
                  Baixar PDF
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modal de Preview */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility color="primary" />
            Visualização do Relatório
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<Print />}
              onClick={() => {
                if (relatorioGerado) {
                  imprimirRelatorio(relatorioGerado);
                }
              }}
              variant="outlined"
              size="small"
            >
              Imprimir
            </Button>
            <Button
              startIcon={<Download />}
              onClick={() => {
                if (relatorioGerado) {
                  baixarPDFRelatorio(relatorioGerado);
                }
              }}
              variant="outlined"
              size="small"
              color="secondary"
            >
              Baixar
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              border: 'none',
              '& iframe': {
                width: '100%',
                height: '100%',
                border: 'none'
              }
            }}
          >
            {relatorioGerado && (
              <iframe
                srcDoc={relatorioGerado}
                title="Preview do Relatório"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Overlay */}
      {gerandoRelatorio && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" color="primary">
              Gerando Relatório...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Por favor, aguarde enquanto processamos os dados
            </Typography>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default Impressoes;