'use client';

import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

/**
 * Componente para impressão de Histórico Escolar
 * Otimizado para window.print() - salvar como PDF
 */
export default function HistoricoEscolarPrint({ documento }) {
  if (!documento) return null;

  // Extrair dados com fallbacks seguros
  const aluno = documento.dadosAluno || documento.aluno || {};
  const instituicao = documento.dadosInstituicao || documento.instituicao || {};
  const endereco = instituicao.endereco || {};
  const periodosAcademicos = documento.periodosAcademicos || 
                             documento.historicoCompleto?.periodosAcademicos || 
                             documento.periodos || 
                             [];
  const resumo = documento.resumo || documento.historicoCompleto?.resumo || {};

  // Helper para converter valores em strings seguras
  const toSafeString = (value, defaultValue = 'N/I') => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object') {
      if (value.nome) return String(value.nome);
      if (value.valor) return String(value.valor);
      if (value.text) return String(value.text);
      return defaultValue;
    }
    if (typeof value === 'string' && value.trim() === '') return defaultValue;
    return String(value).trim() || defaultValue;
  };

  console.log('🖨️ [Impressão] Documento:', {
    alunoNome: toSafeString(aluno.nome),
    instituicaoNome: toSafeString(instituicao.nome),
    qtdPeriodos: periodosAcademicos.length
  });

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
        
        .print-container {
          font-family: 'Helvetica', 'Arial', sans-serif;
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        
        .header-instituicao {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        
        .header-instituicao h1 {
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 5px 0;
          color: #333;
        }
        
        .header-instituicao p {
          font-size: 11px;
          margin: 2px 0;
          color: #666;
        }
        
        .documento-titulo {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          margin: 20px 0;
          text-transform: uppercase;
          color: #333;
        }
        
        .secao {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .secao-titulo {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        
        .dados-aluno-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          border: 1px solid #ddd;
          padding: 10px;
          font-size: 11px;
        }
        
        .campo {
          padding: 5px;
        }
        
        .campo-label {
          font-weight: bold;
          color: #666;
          font-size: 9px;
          text-transform: uppercase;
          display: block;
          margin-bottom: 2px;
        }
        
        .campo-valor {
          color: #333;
          font-size: 11px;
        }
        
        .tabela-disciplinas {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 10px;
        }
        
        .tabela-disciplinas th {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          padding: 6px 8px;
          text-align: left;
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .tabela-disciplinas td {
          border: 1px solid #ddd;
          padding: 5px 8px;
          font-size: 10px;
        }
        
        .periodo-header {
          background-color: #e8f5e9;
          border: 1px solid #4caf50;
          padding: 8px;
          margin: 15px 0 10px 0;
          font-weight: bold;
          font-size: 11px;
        }
        
        .assinatura-container {
          margin-top: 40px;
          display: flex;
          justify-content: space-around;
          page-break-inside: avoid;
        }
        
        .assinatura-campo {
          text-align: center;
          width: 45%;
        }
        
        .assinatura-linha {
          border-top: 1px solid #333;
          margin-top: 50px;
          padding-top: 5px;
          font-size: 10px;
        }
        
        .rodape {
          margin-top: 30px;
          text-align: center;
          font-size: 9px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        
        .no-print {
          display: block;
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <Box id="printable-area" className="print-container">
        {/* Cabeçalho da Instituição */}
        <div className="header-instituicao">
          <h1>{toSafeString(instituicao.nome, 'ESCOLA ELO')}</h1>
          {endereco.rua && <p>{toSafeString(endereco.rua)}</p>}
          {endereco.cidade && <p>{toSafeString(endereco.cidade)} - {toSafeString(endereco.estado, 'SP')} | CEP: {toSafeString(endereco.cep)}</p>}
          {instituicao.cnpj && <p>CNPJ: {toSafeString(instituicao.cnpj)}</p>}
          <p style={{ marginTop: '10px', fontSize: '10px' }}>
            Emitido em: {new Date(documento.dataEmissao).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Título do Documento */}
        <div className="documento-titulo">
          HISTÓRICO ESCOLAR
        </div>

        {/* Dados do Aluno */}
        <div className="secao">
          <div className="secao-titulo">Dados do Aluno</div>
          <div className="dados-aluno-grid">
            <div className="campo" style={{ gridColumn: 'span 2' }}>
              <span className="campo-label">Nome Completo</span>
              <span className="campo-valor">{toSafeString(aluno.nome || aluno.nomeCompleto, 'Não informado')}</span>
            </div>
            <div className="campo">
              <span className="campo-label">Matrícula</span>
              <span className="campo-valor">{toSafeString(aluno.matricula || aluno.ra, 'N/A')}</span>
            </div>
            <div className="campo">
              <span className="campo-label">Data de Nascimento</span>
              <span className="campo-valor">{toSafeString(aluno.dataNascimento || aluno.data_nascimento)}</span>
            </div>
            <div className="campo">
              <span className="campo-label">Sexo</span>
              <span className="campo-valor">{toSafeString(aluno.sexo)}</span>
            </div>
            <div className="campo">
              <span className="campo-label">Naturalidade</span>
              <span className="campo-valor">{toSafeString(aluno.naturalidade)}</span>
            </div>
            <div className="campo">
              <span className="campo-label">CPF</span>
              <span className="campo-valor">{toSafeString(aluno.cpf)}</span>
            </div>
            <div className="campo">
              <span className="campo-label">RG</span>
              <span className="campo-valor">{toSafeString(aluno.rg)}</span>
            </div>
            <div className="campo">
              <span className="campo-label">Nacionalidade</span>
              <span className="campo-valor">BRASILEIRA</span>
            </div>
          </div>
        </div>

        {/* Histórico Acadêmico por Período */}
        <div className="secao">
          <div className="secao-titulo">Histórico Acadêmico</div>
          
          {periodosAcademicos.length > 0 ? (
            periodosAcademicos.map((periodo, index) => {
              const disciplinas = periodo.disciplinas || [];
              console.log(`🖨️ [Impressão] Período ${index + 1}:`, {
                ano: toSafeString(periodo.anoLetivo),
                serie: toSafeString(periodo.serie),
                qtdDisciplinas: disciplinas.length
              });
              
              return (
                <div key={index} style={{ pageBreakInside: 'avoid' }}>
                  <div className="periodo-header">
                    {toSafeString(periodo.anoLetivo, '2025')} - {toSafeString(periodo.serie, 'Série não informada')}
                    {periodo.turno && ` (${toSafeString(periodo.turno)})`}
                    {periodo.situacao && ` | Situação: ${toSafeString(periodo.situacao)}`}
                  </div>
                  
                  {disciplinas.length > 0 ? (
                    <table className="tabela-disciplinas">
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }}>Disciplina</th>
                          <th style={{ width: '15%', textAlign: 'center' }}>C.H.</th>
                          <th style={{ width: '15%', textAlign: 'center' }}>Frequência</th>
                          <th style={{ width: '10%', textAlign: 'center' }}>Média</th>
                          <th style={{ width: '20%', textAlign: 'center' }}>Situação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disciplinas.map((disc, discIndex) => {
                          const nomeDisciplina = toSafeString(disc.nomeCompleto || disc.nome || disc.disciplina, 'Disciplina');
                          const cargaHoraria = toSafeString(disc.cargaHoraria || disc.carga_horaria, '80h');
                          const frequencia = toSafeString(
                            disc.frequenciaPercentual || 
                            disc.mediaFrequencia || 
                            (disc.aulasPresentes && disc.totalAulas ? 
                              ((disc.aulasPresentes / disc.totalAulas) * 100).toFixed(0) + '%' : '100%')
                          );
                          const media = toSafeString(
                            disc.mediaFinal ? disc.mediaFinal.toFixed(1) : 
                            disc.media ? disc.media.toFixed(1) : 'N/A'
                          );
                          const situacao = toSafeString(disc.situacao, 'Aprovado');
                          
                          return (
                            <tr key={discIndex}>
                              <td>{nomeDisciplina}</td>
                              <td style={{ textAlign: 'center' }}>{cargaHoraria}</td>
                              <td style={{ textAlign: 'center' }}>{frequencia}</td>
                              <td style={{ textAlign: 'center' }}>{media}</td>
                              <td style={{ textAlign: 'center' }}>{situacao}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '11px' }}>
                      Nenhuma disciplina registrada neste período
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <p style={{ textAlign: 'center', padding: '30px', color: '#999', fontSize: '12px' }}>
              Nenhum período acadêmico registrado
            </p>
          )}
        </div>

        {/* Resumo */}
        {resumo && Object.keys(resumo).length > 0 && (
          <div className="secao">
            <div className="secao-titulo">Resumo Geral</div>
            <div className="dados-aluno-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {resumo.totalAnos && (
                <div className="campo">
                  <span className="campo-label">Anos Cursados</span>
                  <span className="campo-valor">{toSafeString(resumo.totalAnos)}</span>
                </div>
              )}
              {resumo.totalDisciplinas && (
                <div className="campo">
                  <span className="campo-label">Total Disciplinas</span>
                  <span className="campo-valor">{toSafeString(resumo.totalDisciplinas)}</span>
                </div>
              )}
              {resumo.cargaHorariaTotal && (
                <div className="campo">
                  <span className="campo-label">Carga Horária Total</span>
                  <span className="campo-valor">{toSafeString(resumo.cargaHorariaTotal)}h</span>
                </div>
              )}
              {resumo.mediaGeral && (
                <div className="campo">
                  <span className="campo-label">Média Geral</span>
                  <span className="campo-valor">{toSafeString(typeof resumo.mediaGeral === 'number' ? resumo.mediaGeral.toFixed(2) : resumo.mediaGeral)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Situação Final */}
        <div className="secao">
          <div style={{ 
            border: '2px solid #4caf50', 
            padding: '15px', 
            textAlign: 'center',
            backgroundColor: '#e8f5e9',
            fontWeight: 'bold',
            fontSize: '13px'
          }}>
            SITUAÇÃO FINAL: {toSafeString(documento.situacaoFinal || documento.historicoCompleto?.situacaoGeral, 'EM ANDAMENTO')}
          </div>
        </div>

        {/* Observações */}
        {documento.observacoes && (
          <div className="secao">
            <div className="secao-titulo">Observações</div>
            <div style={{ border: '1px solid #ddd', padding: '10px', fontSize: '10px' }}>
              {toSafeString(documento.observacoes)}
            </div>
          </div>
        )}

        {/* Assinaturas */}
        <div className="assinatura-container">
          <div className="assinatura-campo">
            <div className="assinatura-linha">
              {toSafeString(instituicao.responsavel?.nome, 'Diretor(a)')}
              <br />
              <strong>Diretor(a)</strong>
            </div>
          </div>
          <div className="assinatura-campo">
            <div className="assinatura-linha">
              _____________________________
              <br />
              <strong>Secretário(a) Escolar</strong>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="rodape">
          <p><strong>DOCUMENTO ASSINADO DIGITALMENTE</strong></p>
          <p>Código de Verificação: {toSafeString(documento.codigoVerificacao)}</p>
          <p>Validade e autenticidade podem ser verificadas em: elo-school.web.app/validacao</p>
        </div>
      </Box>
    </>
  );
}
