import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';

const ImpressaoGrade = ({ 
  turma, 
  periodosAula, 
  horariosAula, 
  disciplinas, 
  professores 
}) => {
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
      h => h.dia === dia && h.periodoAulaId === periodoId
    );
    return horario || null;
  };

  const estilosImpressao = `
    <style>
      @media print {
        body * {
          visibility: hidden;
        }
        .impressao-grade, .impressao-grade * {
          visibility: visible;
        }
        .impressao-grade {
          position: absolute;
          left: 0;
          top: 0;
          width: 100% !important;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        .cabecalho-impressao {
          text-align: center;
          margin-bottom: 30px;
        }
        .titulo-impressao {
          font-size: 24px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 10px;
        }
        .info-turma {
          font-size: 18px;
          color: #666;
          margin-bottom: 5px;
        }
        .data-impressao {
          font-size: 14px;
          color: #999;
        }
        .tabela-grade {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .tabela-grade th,
        .tabela-grade td {
          border: 2px solid #ddd;
          padding: 8px;
          text-align: center;
          vertical-align: middle;
        }
        .tabela-grade th {
          background-color: #f5f5f5;
          font-weight: bold;
          font-size: 14px;
        }
        .celula-horario {
          min-height: 60px;
          font-size: 12px;
        }
        .celula-periodo {
          background-color: #f8f9fa;
          font-weight: bold;
          min-width: 120px;
        }
        .disciplina-nome {
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 2px;
        }
        .professor-nome {
          color: #666;
          font-size: 11px;
        }
        .rodape-impressao {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }
        .no-print {
          display: none !important;
        }
      }
    </style>
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: estilosImpressao }} />
      
      <Box className="impressao-grade" sx={{ display: 'none', '@media print': { display: 'block' } }}>
        {/* Cabeçalho */}
        <Box className="cabecalho-impressao">
          <Typography className="titulo-impressao">
            Grade Horária Escolar
          </Typography>
          <Typography className="info-turma">
            Turma: {turma?.nome || 'N/A'} - {turma?.serie || 'N/A'} {turma?.turno || 'N/A'}
          </Typography>
          <Typography className="data-impressao">
            Gerado em: {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
        </Box>

        {/* Tabela da Grade */}
        <table className="tabela-grade">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Horário</th>
              {diasSemana.map(dia => (
                <th key={dia.id} style={{ width: '160px' }}>
                  {dia.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodosAula.map((periodo) => (
              <tr key={periodo.id}>
                <td className="celula-periodo">
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {periodo.nome}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {periodo.horaInicio} - {periodo.horaFim}
                  </div>
                </td>
                {diasSemana.map(dia => {
                  const horario = getHorarioAula(dia.id, periodo.id);
                  return (
                    <td key={dia.id} className="celula-horario">
                      {horario ? (
                        <div>
                          <div className="disciplina-nome">
                            {getDisciplinaNome(horario.disciplinaId)}
                          </div>
                          <div className="professor-nome">
                            Prof. {getProfessorNome(horario.professorId)}
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#ccc', fontStyle: 'italic' }}>
                          Livre
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Rodapé */}
        <Box className="rodape-impressao">
          <Typography style={{ marginBottom: '8px' }}>
            Sistema de Gestão Escolar ELO
          </Typography>
          <Typography>
            Coordenação Pedagógica - Escola {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default ImpressaoGrade;