// Utilitários para exportação de dados
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Exporta dados para Excel (.xlsx)
 * @param {Array} dados - Array de objetos com os dados
 * @param {String} nomeArquivo - Nome do arquivo (sem extensão)
 * @param {String} nomePlanilha - Nome da aba da planilha
 */
export const exportarParaExcel = (dados, nomeArquivo = 'relatorio', nomePlanilha = 'Dados') => {
  try {
    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dados);

    // Ajustar largura das colunas automaticamente
    const colWidths = [];
    if (dados.length > 0) {
      Object.keys(dados[0]).forEach((key, index) => {
        const maxLength = Math.max(
          key.length,
          ...dados.map(row => String(row[key] || '').length)
        );
        colWidths.push({ wch: Math.min(maxLength + 2, 50) });
      });
      ws['!cols'] = colWidths;
    }

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, nomePlanilha);

    // Gerar arquivo
    XLSX.writeFile(wb, `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exporta dados para CSV
 * @param {Array} dados - Array de objetos com os dados
 * @param {String} nomeArquivo - Nome do arquivo (sem extensão)
 */
export const exportarParaCSV = (dados, nomeArquivo = 'relatorio') => {
  try {
    if (!dados || dados.length === 0) {
      throw new Error('Nenhum dado para exportar');
    }

    // BOM para UTF-8 (suporte a acentos)
    let csvContent = "\uFEFF";

    // Cabeçalhos
    const headers = Object.keys(dados[0]);
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n';

    // Dados
    dados.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '""';
        if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvContent += values.join(',') + '\n';
    });

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Erro ao exportar para CSV:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exporta dados para PDF
 * @param {Object} config - Configuração do PDF
 */
export const exportarParaPDF = (config) => {
  try {
    const {
      dados,
      titulo = 'Relatório',
      colunas, // Array de { header: 'Nome', dataKey: 'nome' }
      orientacao = 'portrait', // 'portrait' ou 'landscape'
      formatoMoeda = [], // Array de dataKeys que são valores monetários
      subtitulo = '',
      rodape = ''
    } = config;

    if (!dados || dados.length === 0) {
      throw new Error('Nenhum dado para exportar');
    }

    // Criar documento PDF
    const doc = new jsPDF({
      orientation: orientacao,
      unit: 'mm',
      format: 'a4'
    });

    // Configurar fonte
    doc.setFont('helvetica');

    // Título
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129); // Verde
    doc.text(titulo, 14, 20);

    // Subtítulo
    if (subtitulo) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitulo, 14, 27);
    }

    // Data de geração
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 33);

    // Preparar dados da tabela
    const body = dados.map(row => {
      return colunas.map(col => {
        let value = row[col.dataKey];
        
        // Formatar moeda
        if (formatoMoeda.includes(col.dataKey) && value !== null && value !== undefined) {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value);
        }
        
        // Formatar data
        if (value instanceof Date) {
          return value.toLocaleDateString('pt-BR');
        }
        
        // Verificar se é string de data ISO
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
          return new Date(value).toLocaleDateString('pt-BR');
        }
        
        return value || '-';
      });
    });

    // Adicionar tabela
    doc.autoTable({
      head: [colunas.map(col => col.header)],
      body: body,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        font: 'helvetica',
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [16, 185, 129], // Verde
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        // Alinhar colunas de valores à direita
        ...Object.fromEntries(
          colunas.map((col, index) => [
            index,
            formatoMoeda.includes(col.dataKey) ? { halign: 'right' } : {}
          ])
        )
      },
      margin: { top: 40, right: 14, bottom: 20, left: 14 },
      didDrawPage: (data) => {
        // Rodapé
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100);
        
        if (rodape) {
          doc.text(rodape, 14, doc.internal.pageSize.height - 10);
        }
        
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
      }
    });

    // Salvar PDF
    doc.save(`${titulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

    return { success: true };
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Formatar dados de aluno para exportação
 */
export const formatarDadosAluno = (aluno, titulo) => {
  return {
    'Nome': aluno?.nome || 'Aluno não cadastrado',
    'Matrícula': aluno?.matricula || 'N/A',
    'CPF': aluno?.cpf || 'N/A',
    'Turma': aluno?.turma || 'N/A',
    'Status': aluno?.status || 'ativo'
  };
};

/**
 * Formatar dados de responsável para exportação
 */
export const formatarDadosResponsavel = (aluno) => {
  if (!aluno) return {};
  
  return {
    'Nome do Responsável': aluno.responsavelNome || 'N/A',
    'CPF do Responsável': aluno.responsavelCpf || 'N/A',
    'Telefone': aluno.telefone || aluno.responsavelTelefone || 'N/A',
    'Email': aluno.email || aluno.responsavelEmail || 'N/A',
    'Endereço': aluno.endereco ? 
      `${aluno.endereco.rua || ''}, ${aluno.endereco.numero || ''} - ${aluno.endereco.bairro || ''} - ${aluno.endereco.cidade || ''}/${aluno.endereco.estado || ''}` 
      : 'N/A'
  };
};

/**
 * Formatar dados financeiros para exportação
 */
export const formatarDadosFinanceiros = (titulo) => {
  return {
    'Tipo': titulo.tipo || 'N/A',
    'Descrição': titulo.descricao || 'N/A',
    'Valor': titulo.valor || 0,
    'Vencimento': titulo.vencimento,
    'Status': titulo.status || 'pendente',
    'Data Pagamento': titulo.dataPagamento || null,
    'Dias Atraso': titulo.diasAtraso || 0
  };
};

/**
 * Gerar relatório de inadimplentes completo
 */
export const gerarRelatorioInadimplentes = (titulos, alunos) => {
  const inadimplentes = [];
  const hoje = new Date();
  
  // Agrupar títulos por aluno
  const titulosPorAluno = {};
  titulos.forEach(titulo => {
    if (titulo.status !== 'pago') {
      const vencimento = new Date(titulo.vencimento);
      if (vencimento < hoje) {
        if (!titulosPorAluno[titulo.alunoId]) {
          titulosPorAluno[titulo.alunoId] = [];
        }
        titulosPorAluno[titulo.alunoId].push(titulo);
      }
    }
  });
  
  // Criar relatório completo
  Object.keys(titulosPorAluno).forEach(alunoId => {
    const aluno = alunos.find(a => a.id === alunoId);
    const titulosAluno = titulosPorAluno[alunoId];
    
    const valorTotal = titulosAluno.reduce((sum, t) => sum + (t.valor || 0), 0);
    const maiorAtraso = Math.max(...titulosAluno.map(t => {
      const venc = new Date(t.vencimento);
      return Math.floor((hoje - venc) / (1000 * 60 * 60 * 24));
    }));
    
    inadimplentes.push({
      'Nome do Aluno': aluno?.nome || 'Aluno não cadastrado',
      'Matrícula': aluno?.matricula || 'N/A',
      'Turma': aluno?.turma || 'N/A',
      'Nome do Responsável': aluno?.responsavelNome || 'N/A',
      'CPF do Responsável': aluno?.responsavelCpf || 'N/A',
      'Telefone': aluno?.telefone || aluno?.responsavelTelefone || 'N/A',
      'Email': aluno?.email || aluno?.responsavelEmail || 'N/A',
      'Endereço Completo': aluno?.endereco ? 
        `${aluno.endereco.rua || ''}, ${aluno.endereco.numero || ''} - ${aluno.endereco.bairro || ''}, ${aluno.endereco.cidade || ''}/${aluno.endereco.estado || ''} - CEP: ${aluno.endereco.cep || ''}` 
        : 'N/A',
      'Quantidade de Títulos Vencidos': titulosAluno.length,
      'Valor Total em Atraso': valorTotal,
      'Maior Atraso (dias)': maiorAtraso,
      'Status do Aluno': aluno?.status || 'ativo'
    });
  });
  
  // Ordenar por valor total (maior para menor)
  inadimplentes.sort((a, b) => b['Valor Total em Atraso'] - a['Valor Total em Atraso']);
  
  return inadimplentes;
};

/**
 * Gerar relatório por turma
 */
export const gerarRelatorioPorTurma = (titulos, alunos, turma, periodo = null) => {
  let alunosDaTurma = alunos.filter(a => a.turma === turma);
  let titulosFiltrados = titulos.filter(t => {
    const aluno = alunos.find(a => a.id === t.alunoId);
    return aluno && aluno.turma === turma;
  });
  
  // Filtrar por período se fornecido
  if (periodo && periodo.dataInicio && periodo.dataFim) {
    const inicio = new Date(periodo.dataInicio);
    const fim = new Date(periodo.dataFim);
    titulosFiltrados = titulosFiltrados.filter(t => {
      const venc = new Date(t.vencimento);
      return venc >= inicio && venc <= fim;
    });
  }
  
  // Gerar relatório
  const relatorio = [];
  alunosDaTurma.forEach(aluno => {
    const titulosAluno = titulosFiltrados.filter(t => t.alunoId === aluno.id);
    const totalTitulos = titulosAluno.length;
    const valorTotal = titulosAluno.reduce((sum, t) => sum + (t.valor || 0), 0);
    const valorPago = titulosAluno.filter(t => t.status === 'pago').reduce((sum, t) => sum + (t.valor || 0), 0);
    const valorPendente = valorTotal - valorPago;
    
    relatorio.push({
      'Nome': aluno.nome,
      'Matrícula': aluno.matricula || 'N/A',
      'Turma': aluno.turma,
      'Total de Títulos': totalTitulos,
      'Valor Total': valorTotal,
      'Valor Pago': valorPago,
      'Valor Pendente': valorPendente,
      'Status': aluno.status || 'ativo'
    });
  });
  
  return relatorio;
};

/**
 * Gerar relatório por aluno específico
 */
export const gerarRelatorioPorAluno = (titulos, aluno, periodo = null) => {
  let titulosAluno = titulos.filter(t => t.alunoId === aluno.id);
  
  // Filtrar por período se fornecido
  if (periodo && periodo.dataInicio && periodo.dataFim) {
    const inicio = new Date(periodo.dataInicio);
    const fim = new Date(periodo.dataFim);
    titulosAluno = titulosAluno.filter(t => {
      const venc = new Date(t.vencimento);
      return venc >= inicio && venc <= fim;
    });
  }
  
  // Formatar dados
  return titulosAluno.map(titulo => ({
    'Aluno': aluno.nome,
    'Matrícula': aluno.matricula || 'N/A',
    'Turma': aluno.turma || 'N/A',
    'Tipo': titulo.tipo || 'N/A',
    'Descrição': titulo.descricao || 'N/A',
    'Valor': titulo.valor || 0,
    'Vencimento': new Date(titulo.vencimento).toLocaleDateString('pt-BR'),
    'Status': titulo.status === 'pago' ? 'Pago' : 'Pendente',
    'Data Pagamento': titulo.dataPagamento ? new Date(titulo.dataPagamento).toLocaleDateString('pt-BR') : 'N/A'
  }));
};
