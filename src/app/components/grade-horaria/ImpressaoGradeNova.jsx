import React, { forwardRef, useImperativeHandle } from 'react';

const ImpressaoGradeNova = forwardRef(({ 
  turma, 
  periodosAula, 
  horariosAula, 
  disciplinas, 
  professores 
}, ref) => {
  const diasSemana = [
    { id: 1, nome: 'Segunda-feira' },
    { id: 2, nome: 'Terça-feira' },
    { id: 3, nome: 'Quarta-feira' },
    { id: 4, nome: 'Quinta-feira' },
    { id: 5, nome: 'Sexta-feira' }
  ];

  // Função para encontrar disciplina por ID
  const getDisciplinaNome = (id) => {
    const disc = disciplinas.find(d => d.id === id);
    return disc ? disc.nome : 'N/A';
  };

  // Função para encontrar professor por ID
  const getProfessorNome = (id) => {
    const prof = professores.find(p => p.id === id);
    return prof ? prof.nome : 'N/A';
  };

  // Função para obter horário de uma célula específica
  const getHorarioAula = (dia, periodoId) => {
    const horario = horariosAula.find(
      h => h.diaSemana === dia && h.periodoAula === periodoId
    );
    return horario || null;
  };

  const gerarDocumentoImpressao = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Gerar linhas da tabela
    let linhasTabela = '';
    periodosAula.forEach(periodo => {
      if (periodo.tipo === 'aula') {
        linhasTabela += `
          <tr>
            <td class="celula-periodo">
              <div class="periodo-nome">${periodo.nome}</div>
              <div class="periodo-horario">${periodo.horaInicio} - ${periodo.horaFim}</div>
            </td>`;
        
        diasSemana.forEach(dia => {
          const horario = getHorarioAula(dia.id, periodo.id);
          if (horario) {
            linhasTabela += `
              <td class="celula-aula">
                <div class="disciplina-nome">${getDisciplinaNome(horario.disciplinaId)}</div>
                <div class="professor-nome">Prof. ${getProfessorNome(horario.professorId)}</div>
              </td>`;
          } else {
            linhasTabela += `<td class="celula-vazia">—</td>`;
          }
        });
        linhasTabela += '</tr>';
      } else if (periodo.tipo === 'intervalo') {
        linhasTabela += `
          <tr class="linha-intervalo">
            <td class="celula-periodo intervalo">
              <div class="periodo-nome">🍽️ ${periodo.nome}</div>
              <div class="periodo-horario">${periodo.horaInicio} - ${periodo.horaFim}</div>
            </td>
            <td colspan="5" class="celula-intervalo">INTERVALO</td>
          </tr>`;
      }
    });

    const documentoHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grade Horária - ${turma?.nome || 'Turma'}</title>
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
            margin-bottom: 30px;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 20px;
        }
        
        .logo-escola {
            font-size: 28px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .titulo-documento {
            font-size: 22px;
            font-weight: 600;
            color: #444;
            margin-bottom: 12px;
        }
        
        .info-turma {
            font-size: 18px;
            color: #666;
            margin-bottom: 8px;
        }
        
        .data-geracao {
            font-size: 14px;
            color: #888;
            font-style: italic;
        }
        
        .tabela-container {
            margin: 0 auto;
            max-width: 100%;
            overflow-x: auto;
        }
        
        .tabela-grade {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .tabela-grade th {
            background: linear-gradient(135deg, #1976d2, #1565c0);
            color: white;
            font-weight: 600;
            padding: 12px 8px;
            text-align: center;
            border: 2px solid #1976d2;
            font-size: 14px;
        }
        
        .tabela-grade td {
            border: 1px solid #ddd;
            padding: 10px 8px;
            text-align: center;
            vertical-align: middle;
            min-height: 60px;
        }
        
        .celula-periodo {
            background: #f8f9fa;
            font-weight: 600;
            min-width: 100px;
            max-width: 100px;
            border-right: 2px solid #1976d2 !important;
        }
        
        .periodo-nome {
            font-size: 13px;
            margin-bottom: 4px;
            color: #1976d2;
        }
        
        .periodo-horario {
            font-size: 11px;
            color: #666;
            font-weight: normal;
        }
        
        .celula-aula {
            background: #fff;
            min-height: 65px;
            padding: 8px 6px;
        }
        
        .disciplina-nome {
            font-weight: 600;
            font-size: 12px;
            color: #1976d2;
            margin-bottom: 4px;
            line-height: 1.2;
        }
        
        .professor-nome {
            font-size: 10px;
            color: #666;
            line-height: 1.1;
        }
        
        .celula-vazia {
            background: #fafafa;
            color: #ccc;
            font-weight: bold;
            font-size: 18px;
        }
        
        .linha-intervalo {
            background: #fff3e0;
        }
        
        .celula-periodo.intervalo {
            background: #ff9800;
            color: white;
        }
        
        .celula-intervalo {
            background: #fff3e0;
            color: #f57c00;
            font-weight: bold;
            font-size: 14px;
            border: 2px solid #ff9800 !important;
        }
        
        .rodape {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        
        .rodape-info {
            margin-bottom: 8px;
        }
        
        .assinatura {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        
        .campo-assinatura {
            text-align: center;
            width: 200px;
        }
        
        .linha-assinatura {
            border-top: 1px solid #333;
            margin-bottom: 5px;
        }
        
        .label-assinatura {
            font-size: 11px;
            color: #666;
        }
        
        /* Estilos específicos para impressão */
        @media print {
            body {
                padding: 15mm;
                font-size: 12px;
            }
            
            .tabela-grade {
                page-break-inside: avoid;
            }
            
            .linha-intervalo {
                page-break-inside: avoid;
            }
            
            .cabecalho {
                page-break-after: avoid;
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
        <div class="titulo-documento">Grade Horária</div>
        <div class="info-turma">
            <strong>${turma?.nome || 'N/A'}</strong> - ${turma?.serie || 'N/A'} 
            ${turma?.turno ? `(${turma.turno})` : ''}
        </div>
        <div class="data-geracao">Documento gerado em ${dataAtual}</div>
    </div>
    
    <div class="tabela-container">
        <table class="tabela-grade">
            <thead>
                <tr>
                    <th style="width: 100px;">Período</th>
                    <th>Segunda-feira</th>
                    <th>Terça-feira</th>
                    <th>Quarta-feira</th>
                    <th>Quinta-feira</th>
                    <th>Sexta-feira</th>
                </tr>
            </thead>
            <tbody>
                ${linhasTabela}
            </tbody>
        </table>
    </div>
    
    <div class="rodape">
        <div class="rodape-info">
            <strong>Sistema de Gestão Escolar ELO</strong> | 
            Coordenação Pedagógica | 
            Ano Letivo ${new Date().getFullYear()}
        </div>
        <div class="assinatura">
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

  const handleImprimirGrade = () => {
    const documentoHTML = gerarDocumentoImpressao();
    
    // Criar uma nova janela
    const janelaImpressao = window.open('', '_blank');
    
    // Escrever o HTML na nova janela
    janelaImpressao.document.write(documentoHTML);
    janelaImpressao.document.close();
    
    // Aguardar o carregamento e imprimir
    janelaImpressao.onload = () => {
      janelaImpressao.print();
    };
    
    // Fechar a janela após a impressão (opcional)
    janelaImpressao.onafterprint = () => {
      janelaImpressao.close();
    };
  };

  // Expor a função para uso externo
  useImperativeHandle(ref, () => ({
    handleImprimirGrade
  }));

  return null; // Este componente não renderiza nada na tela
});

export default ImpressaoGradeNova;