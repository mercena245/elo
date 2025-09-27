import React, { forwardRef, useImperativeHandle } from 'react';

const ImpressaoRelatorios = forwardRef(({ 
  estatisticas, 
  cargaProfessores, 
  distDisciplinas,
  turmas 
}, ref) => {

  const gerarRelatorioHTML = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Gerar tabela de carga horária dos professores
    let tabelaCargaProfessores = '';
    cargaProfessores.forEach((prof, index) => {
      const corLinha = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
      const corCarga = prof.totalAulas >= 20 ? '#ffebee' : prof.totalAulas >= 15 ? '#fff3e0' : '#e8f5e8';
      
      tabelaCargaProfessores += `
        <tr style="background-color: ${corLinha};">
          <td style="padding: 10px; border: 1px solid #ddd; text-align: left;">${prof.nome}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; background-color: ${corCarga}; font-weight: bold;">
            ${prof.totalAulas}
          </td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${prof.porDia[1] || 0}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${prof.porDia[2] || 0}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${prof.porDia[3] || 0}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${prof.porDia[4] || 0}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${prof.porDia[5] || 0}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${prof.turmas.size}</td>
        </tr>`;
    });

    // Gerar tabela de distribuição de disciplinas
    let tabelaDistDisciplinas = '';
    distDisciplinas.forEach((disc, index) => {
      const corLinha = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
      
      tabelaDistDisciplinas += `
        <tr style="background-color: ${corLinha};">
          <td style="padding: 10px; border: 1px solid #ddd; text-align: left;">${disc.nome}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #1976d2;">
            ${disc.totalAulas}
          </td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${disc.porDia[1] || 0}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${disc.porDia[2] || 0}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${disc.porDia[3] || 0}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${disc.porDia[4] || 0}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${disc.porDia[5] || 0}</td>
        </tr>`;
    });

    const documentoHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatórios da Grade Horária</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            background: white;
            padding: 20mm;
        }
        
        .cabecalho {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 25px;
        }
        
        .logo-escola {
            font-size: 32px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .titulo-documento {
            font-size: 26px;
            font-weight: 600;
            color: #444;
            margin-bottom: 15px;
        }
        
        .data-geracao {
            font-size: 16px;
            color: #888;
            font-style: italic;
        }
        
        .secao-estatisticas {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        .titulo-secao {
            font-size: 20px;
            font-weight: 600;
            color: #1976d2;
            margin-bottom: 20px;
            border-left: 4px solid #1976d2;
            padding-left: 15px;
        }
        
        .cards-estatisticas {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .card-estatistica {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        
        .card-estatistica.professor {
            background: linear-gradient(135deg, #f093fb, #f5576c);
        }
        
        .card-estatistica.disciplina {
            background: linear-gradient(135deg, #4facfe, #00f2fe);
        }
        
        .card-estatistica.ocupacao {
            background: linear-gradient(135deg, #43e97b, #38f9d7);
        }
        
        .numero-estatistica {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .label-estatistica {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .tabela-relatorio {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            page-break-inside: avoid;
        }
        
        .tabela-relatorio th {
            background: linear-gradient(135deg, #1976d2, #1565c0);
            color: white;
            font-weight: 600;
            padding: 12px 8px;
            text-align: center;
            border: 1px solid #1976d2;
            font-size: 13px;
        }
        
        .tabela-relatorio td {
            padding: 10px 8px;
            border: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
        }
        
        .analise-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-left: 4px solid #28a745;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 0 8px 8px 0;
        }
        
        .analise-titulo {
            font-size: 16px;
            font-weight: 600;
            color: #28a745;
            margin-bottom: 15px;
        }
        
        .analise-item {
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .rodape {
            margin-top: 50px;
            padding-top: 25px;
            border-top: 2px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        
        .assinatura-container {
            margin-top: 40px;
            display: flex;
            justify-content: space-around;
        }
        
        .campo-assinatura {
            text-align: center;
            width: 250px;
        }
        
        .linha-assinatura {
            border-top: 1px solid #333;
            margin-bottom: 8px;
        }
        
        .label-assinatura {
            font-size: 11px;
            color: #666;
        }
        
        /* Estilos para impressão */
        @media print {
            body {
                padding: 15mm;
            }
            
            .secao-estatisticas {
                page-break-inside: avoid;
            }
            
            .tabela-relatorio {
                page-break-inside: avoid;
            }
            
            .cards-estatisticas {
                display: grid !important;
                grid-template-columns: repeat(4, 1fr) !important;
                gap: 10px !important;
            }
        }
        
        @page {
            margin: 15mm;
            size: A4;
        }
    </style>
</head>
<body>
    <div class="cabecalho">
        <div class="logo-escola">Sistema Escolar ELO</div>
        <div class="titulo-documento">Relatórios da Grade Horária</div>
        <div class="data-geracao">Relatório gerado em ${dataAtual}</div>
    </div>
    
    <!-- Seção de Estatísticas Gerais -->
    <div class="secao-estatisticas">
        <h2 class="titulo-secao">📊 Estatísticas Gerais</h2>
        
        <div class="cards-estatisticas">
            <div class="card-estatistica">
                <div class="numero-estatistica">${estatisticas.totalAulas}</div>
                <div class="label-estatistica">Total de Aulas</div>
            </div>
            <div class="card-estatistica professor">
                <div class="numero-estatistica">${estatisticas.professoresAtivos}</div>
                <div class="label-estatistica">Professores Ativos</div>
            </div>
            <div class="card-estatistica disciplina">
                <div class="numero-estatistica">${estatisticas.disciplinasEmUso}</div>
                <div class="label-estatistica">Disciplinas em Uso</div>
            </div>
            <div class="card-estatistica ocupacao">
                <div class="numero-estatistica">${estatisticas.percentualOcupacao}%</div>
                <div class="label-estatistica">Ocupação da Grade</div>
            </div>
        </div>
    </div>
    
    <!-- Tabela de Carga Horária dos Professores -->
    <div class="secao-estatisticas">
        <h2 class="titulo-secao">👨‍🏫 Carga Horária por Professor</h2>
        
        <table class="tabela-relatorio">
            <thead>
                <tr>
                    <th style="width: 200px;">Professor</th>
                    <th style="width: 80px;">Total Aulas</th>
                    <th>Seg</th>
                    <th>Ter</th>
                    <th>Qua</th>
                    <th>Qui</th>
                    <th>Sex</th>
                    <th>Turmas</th>
                </tr>
            </thead>
            <tbody>
                ${tabelaCargaProfessores}
            </tbody>
        </table>
    </div>
    
    <!-- Tabela de Distribuição de Disciplinas -->
    <div class="secao-estatisticas">
        <h2 class="titulo-secao">📚 Distribuição de Disciplinas</h2>
        
        <table class="tabela-relatorio">
            <thead>
                <tr>
                    <th style="width: 200px;">Disciplina</th>
                    <th style="width: 80px;">Total Aulas</th>
                    <th>Seg</th>
                    <th>Ter</th>
                    <th>Qua</th>
                    <th>Qui</th>
                    <th>Sex</th>
                </tr>
            </thead>
            <tbody>
                ${tabelaDistDisciplinas}
            </tbody>
        </table>
    </div>
    
    <!-- Análises e Recomendações -->
    <div class="secao-estatisticas">
        <h2 class="titulo-secao">🎯 Análises e Recomendações</h2>
        
        ${cargaProfessores.length > 0 ? `
        <div class="analise-box">
            <div class="analise-titulo">Análise de Carga Horária</div>
            <div class="analise-item"><strong>Professor com mais aulas:</strong> ${cargaProfessores[0]?.nome} (${cargaProfessores[0]?.totalAulas} aulas)</div>
            <div class="analise-item"><strong>Média de aulas por professor:</strong> ${(cargaProfessores.reduce((acc, p) => acc + p.totalAulas, 0) / cargaProfessores.length).toFixed(1)} aulas</div>
            <div class="analise-item"><strong>Professores com sobrecarga (>20h):</strong> ${cargaProfessores.filter(p => p.totalAulas > 20).length}</div>
        </div>
        ` : ''}
        
        ${distDisciplinas.length > 0 ? `
        <div class="analise-box" style="border-left-color: #2196f3;">
            <div class="analise-titulo" style="color: #2196f3;">Análise de Disciplinas</div>
            <div class="analise-item"><strong>Disciplina com mais aulas:</strong> ${distDisciplinas[0]?.nome} (${distDisciplinas[0]?.totalAulas} aulas)</div>
            <div class="analise-item"><strong>Média de aulas por disciplina:</strong> ${(distDisciplinas.reduce((acc, d) => acc + d.totalAulas, 0) / distDisciplinas.length).toFixed(1)} aulas</div>
            <div class="analise-item"><strong>Disciplinas pouco utilizadas (<5 aulas):</strong> ${distDisciplinas.filter(d => d.totalAulas < 5).length}</div>
        </div>
        ` : ''}
    </div>
    
    <div class="rodape">
        <div style="margin-bottom: 15px;">
            <strong>Sistema de Gestão Escolar ELO</strong> | 
            Coordenação Pedagógica | 
            Ano Letivo ${new Date().getFullYear()}
        </div>
        
        <div class="assinatura-container">
            <div class="campo-assinatura">
                <div class="linha-assinatura"></div>
                <div class="label-assinatura">Coordenação Pedagógica</div>
            </div>
            <div class="campo-assinatura">
                <div class="linha-assinatura"></div>
                <div class="label-assinatura">Direção Escolar</div>
            </div>
        </div>
    </div>
</body>
</html>`;

    return documentoHTML;
  };

  const handleImprimirRelatorio = () => {
    const documentoHTML = gerarRelatorioHTML();
    
    // Criar uma nova janela para impressão
    const janelaImpressao = window.open('', '_blank');
    
    // Escrever o HTML na nova janela
    janelaImpressao.document.write(documentoHTML);
    janelaImpressao.document.close();
    
    // Aguardar o carregamento e imprimir
    janelaImpressao.onload = () => {
      janelaImpressao.print();
    };
    
    // Fechar a janela após a impressão
    janelaImpressao.onafterprint = () => {
      janelaImpressao.close();
    };
  };

  // Expor a função para uso externo
  useImperativeHandle(ref, () => ({
    handleImprimirRelatorio
  }));

  return null; // Este componente não renderiza nada na tela
});

export default ImpressaoRelatorios;