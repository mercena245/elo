import React from 'react';
import { 
  Box, 
  Typography
} from '@mui/material';

const FichaMatricula = ({ aluno, turmas, onClose }) => {
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const getTurmaNome = turmaId => turmas?.[turmaId]?.nome || '---';

  const formatarEndereco = (endereco) => {
    if (typeof endereco === 'string') return endereco;
    if (!endereco) return '';
    return `${endereco.rua || ''}, ${endereco.bairro || ''}, ${endereco.cidade || ''} - ${endereco.uf || ''}, CEP: ${endereco.cep || ''}`.replace(/^,\s*|,\s*$/, '');
  };

  const formatarSimNao = (valor) => {
    if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
    if (valor === true || valor === 'true' || valor === 'sim') return 'Sim';
    if (valor === false || valor === 'false' || valor === 'não' || valor === 'nao') return 'Não';
    return valor || 'Não informado';
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const fichaContent = document.getElementById('ficha-matricula-content').innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ficha de Matrícula Completa - ${aluno.nome}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.3;
              color: #333;
              background: white;
            }
            
            .ficha-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 12mm;
              background: white;
            }
            
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            
            .header h1 {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #1976d2;
            }
            
            .header h2 {
              font-size: 13px;
              font-weight: normal;
              color: #666;
            }
            
            .section {
              margin: 12px 0;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 3px;
              background: #f9f9f9;
              page-break-inside: avoid;
            }
            
            .section-title {
              font-size: 12px;
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 6px;
              border-bottom: 1px solid #e0e0e0;
              padding-bottom: 2px;
            }
            
            .field-row {
              display: flex;
              margin-bottom: 6px;
              align-items: flex-start;
            }
            
            .field-label {
              font-weight: bold;
              color: #555;
              min-width: 140px;
              margin-right: 8px;
              font-size: 10px;
            }
            
            .field-value {
              flex: 1;
              border-bottom: 1px dotted #999;
              min-height: 14px;
              padding-bottom: 1px;
              font-size: 10px;
            }
            
            .two-column {
              display: flex;
              gap: 15px;
              margin-bottom: 6px;
            }
            
            .two-column > div {
              flex: 1;
            }
            
            .signature-section {
              margin-top: 20px;
              display: flex;
              justify-content: space-between;
              gap: 20px;
              page-break-inside: avoid;
            }
            
            .signature-box {
              flex: 1;
              text-align: center;
              padding: 10px;
              border: 1px solid #ddd;
              background: white;
            }
            
            .signature-line {
              border-top: 1px solid #333;
              margin: 30px 8px 6px 8px;
              height: 1px;
            }
            
            .signature-label {
              font-size: 9px;
              color: #666;
              margin-top: 3px;
            }
            
            .photo-placeholder {
              width: 70px;
              height: 90px;
              border: 2px solid #ddd;
              background: #f5f5f5;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              color: #999;
              text-align: center;
              margin: 0 auto 8px;
              float: right;
            }
            
            .footer {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 9px;
              color: #888;
              page-break-inside: avoid;
            }
            
            .checkbox {
              width: 12px;
              height: 12px;
              border: 1px solid #333;
              display: inline-block;
              margin-right: 5px;
              vertical-align: middle;
              text-align: center;
              line-height: 10px;
              font-size: 8px;
            }
            
            @media print {
              body { 
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              .ficha-container { 
                margin: 0; 
                padding: 8mm;
                box-shadow: none;
              }
              .section { 
                break-inside: avoid; 
                background: #f9f9f9 !important;
              }
              .page-break {
                page-break-before: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="ficha-container">
            ${fichaContent}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Box>
      {/* Visualização na tela */}
      <Box sx={{ p: 2, maxHeight: '80vh', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Ficha de Matrícula Completa</Typography>
          <Box>
            <button 
              onClick={handlePrint}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              🖨️ Imprimir
            </button>
            <button 
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>
          </Box>
        </Box>

        {/* Conteúdo da ficha para impressão */}
        <div id="ficha-matricula-content">
          <div className="header">
            <h1>ESCOLA ELO</h1>
            <h2>FICHA DE MATRÍCULA COMPLETA</h2>
          </div>

          {/* DADOS PESSOAIS */}
          <div className="section">
            <div className="section-title">📋 DADOS PESSOAIS DO ALUNO</div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <div className="field-row">
                  <span className="field-label">Nome Completo:</span>
                  <span className="field-value">{aluno.nome || ''}</span>
                </div>
                
                <div className="two-column">
                  <div className="field-row">
                    <span className="field-label">Matrícula:</span>
                    <span className="field-value">{aluno.matricula || ''}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">CPF:</span>
                    <span className="field-value">{aluno.cpf || ''}</span>
                  </div>
                </div>
                
                <div className="field-row">
                  <span className="field-label">Data Nascimento:</span>
                  <span className="field-value">{aluno.dataNascimento || ''}</span>
                </div>

                <div className="field-row">
                  <span className="field-label">Endereço Completo:</span>
                  <span className="field-value">{formatarEndereco(aluno.endereco)}</span>
                </div>
              </div>
              
              <div className="photo-placeholder">
                FOTO<br />3x4
              </div>
            </div>
          </div>

          {/* DADOS ACADÊMICOS */}
          <div className="section">
            <div className="section-title">🎓 DADOS ACADÊMICOS</div>
            
            <div className="two-column">
              <div className="field-row">
                <span className="field-label">Turma:</span>
                <span className="field-value">{getTurmaNome(aluno.turmaId)}</span>
              </div>
              <div className="field-row">
                <span className="field-label">Série:</span>
                <span className="field-value">{aluno.serie || ''}</span>
              </div>
            </div>
            
            <div className="two-column">
              <div className="field-row">
                <span className="field-label">Turno:</span>
                <span className="field-value">{aluno.turno || ''}</span>
              </div>
              <div className="field-row">
                <span className="field-label">Ano Letivo:</span>
                <span className="field-value">{new Date().getFullYear()}</span>
              </div>
            </div>
            
            <div className="field-row">
              <span className="field-label">Status:</span>
              <span className="field-value">{aluno.status?.toUpperCase() || 'ATIVO'}</span>
            </div>
          </div>

          {/* DADOS DA MÃE */}
          <div className="section">
            <div className="section-title">👩 DADOS DA MÃE</div>
            
            <div className="field-row">
              <span className="field-label">Nome Completo:</span>
              <span className="field-value">{aluno.nomeMae || aluno.mae?.nome || ''}</span>
            </div>
            
            {aluno.mae && (
              <>
                <div className="two-column">
                  <div className="field-row">
                    <span className="field-label">RG:</span>
                    <span className="field-value">{aluno.mae.rg || ''}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">CPF:</span>
                    <span className="field-value">{aluno.mae.cpf || ''}</span>
                  </div>
                </div>
                
                <div className="two-column">
                  <div className="field-row">
                    <span className="field-label">Nacionalidade:</span>
                    <span className="field-value">{aluno.mae.nacionalidade || ''}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Escolaridade:</span>
                    <span className="field-value">{aluno.mae.escolaridade || ''}</span>
                  </div>
                </div>
                
                <div className="two-column">
                  <div className="field-row">
                    <span className="field-label">Profissão:</span>
                    <span className="field-value">{aluno.mae.profissao || ''}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Celular:</span>
                    <span className="field-value">{aluno.mae.celular || ''}</span>
                  </div>
                </div>
                
                <div className="field-row">
                  <span className="field-label">Email:</span>
                  <span className="field-value">{aluno.mae.email || ''}</span>
                </div>
                
                <div className="field-row">
                  <span className="field-label">Endereço:</span>
                  <span className="field-value">{formatarEndereco(aluno.mae.endereco)}</span>
                </div>
                
                <div style={{ marginTop: '8px' }}>
                  <span style={{ marginRight: '8px' }}>{aluno.mae.responsavelFinanceiro ? '☑' : '☐'}</span>
                  <span style={{ fontSize: '10px', marginRight: '20px' }}>Responsável Financeiro</span>
                  
                  <span style={{ marginRight: '8px' }}>{aluno.mae.responsavelLegal ? '☑' : '☐'}</span>
                  <span style={{ fontSize: '10px' }}>Responsável Legal</span>
                </div>
              </>
            )}
          </div>

          {/* DADOS DO PAI */}
          <div className="section">
            <div className="section-title">👨 DADOS DO PAI</div>
            
            <div className="field-row">
              <span className="field-label">Nome Completo:</span>
              <span className="field-value">{aluno.nomePai || aluno.pai?.nome || ''}</span>
            </div>
            
            {aluno.pai && (
              <>
                <div className="two-column">
                  <div className="field-row">
                    <span className="field-label">RG:</span>
                    <span className="field-value">{aluno.pai.rg || ''}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">CPF:</span>
                    <span className="field-value">{aluno.pai.cpf || ''}</span>
                  </div>
                </div>
                
                <div className="two-column">
                  <div className="field-row">
                    <span className="field-label">Nacionalidade:</span>
                    <span className="field-value">{aluno.pai.nacionalidade || ''}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Escolaridade:</span>
                    <span className="field-value">{aluno.pai.escolaridade || ''}</span>
                  </div>
                </div>
                
                <div className="two-column">
                  <div className="field-row">
                    <span className="field-label">Profissão:</span>
                    <span className="field-value">{aluno.pai.profissao || ''}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Celular:</span>
                    <span className="field-value">{aluno.pai.celular || ''}</span>
                  </div>
                </div>
                
                <div className="field-row">
                  <span className="field-label">Email:</span>
                  <span className="field-value">{aluno.pai.email || ''}</span>
                </div>
                
                <div className="field-row">
                  <span className="field-label">Endereço:</span>
                  <span className="field-value">{formatarEndereco(aluno.pai.endereco)}</span>
                </div>
                
                <div style={{ marginTop: '8px' }}>
                  <span style={{ marginRight: '8px' }}>{aluno.pai.responsavelFinanceiro ? '☑' : '☐'}</span>
                  <span style={{ fontSize: '10px', marginRight: '20px' }}>Responsável Financeiro</span>
                  
                  <span style={{ marginRight: '8px' }}>{aluno.pai.responsavelLegal ? '☑' : '☐'}</span>
                  <span style={{ fontSize: '10px' }}>Responsável Legal</span>
                </div>
              </>
            )}
          </div>

          {/* CONTATO DE EMERGÊNCIA */}
          <div className="section">
            <div className="section-title">🚨 CONTATO DE EMERGÊNCIA</div>
            
            {aluno.contatoEmergencia && (
              <>
                <div className="two-column">
                  <div className="field-row">
                    <span className="field-label">Nome:</span>
                    <span className="field-value">{aluno.contatoEmergencia.nome || ''}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Parentesco:</span>
                    <span className="field-value">{aluno.contatoEmergencia.parentesco || ''}</span>
                  </div>
                </div>
                
                <div className="field-row">
                  <span className="field-label">Telefone:</span>
                  <span className="field-value">{aluno.contatoEmergencia.telefone || ''}</span>
                </div>
              </>
            )}
            
            {aluno.responsavelUsuario && (
              <>
                <div className="field-row" style={{ marginTop: '10px' }}>
                  <span className="field-label">Responsável Sistema:</span>
                  <span className="field-value">
                    {aluno.responsavelUsuario.nome} - {aluno.responsavelUsuario.email}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* INFORMAÇÕES DE SAÚDE */}
          {aluno.saude && (
            <div className="section">
              <div className="section-title">🏥 INFORMAÇÕES DE SAÚDE</div>
              
              <div className="field-row">
                <span className="field-label">Doenças que já teve:</span>
                <span className="field-value">
                  {formatarSimNao(aluno.saude.doencasJaTeve?.tem)} 
                  {aluno.saude.doencasJaTeve?.quais && ` - ${aluno.saude.doencasJaTeve.quais}`}
                </span>
              </div>
              
              <div className="field-row">
                <span className="field-label">Alergias:</span>
                <span className="field-value">
                  {formatarSimNao(aluno.saude.alergias?.tem)}
                  {aluno.saude.alergias?.quais && ` - ${aluno.saude.alergias.quais}`}
                </span>
              </div>
              
              <div className="field-row">
                <span className="field-label">Alergia a remédios:</span>
                <span className="field-value">
                  {formatarSimNao(aluno.saude.alergiaRemedio?.tem)}
                  {aluno.saude.alergiaRemedio?.quais && ` - ${aluno.saude.alergiaRemedio.quais}`}
                </span>
              </div>
              
              <div className="field-row">
                <span className="field-label">Problemas de saúde:</span>
                <span className="field-value">
                  {formatarSimNao(aluno.saude.problemaSaude?.tem)}
                  {aluno.saude.problemaSaude?.quais && ` - ${aluno.saude.problemaSaude.quais}`}
                </span>
              </div>
              
              <div className="field-row">
                <span className="field-label">Acompanhamento terapêutico:</span>
                <span className="field-value">
                  {formatarSimNao(aluno.saude.acompanhamentoTerapeutico?.tem)}
                  {aluno.saude.acompanhamentoTerapeutico?.quais && ` - ${aluno.saude.acompanhamentoTerapeutico.quais}`}
                </span>
              </div>
              
              <div className="field-row">
                <span className="field-label">Medicação contínua:</span>
                <span className="field-value">
                  {formatarSimNao(aluno.saude.medicacaoContinua?.tem)}
                  {aluno.saude.medicacaoContinua?.quais && ` - ${aluno.saude.medicacaoContinua.quais}`}
                </span>
              </div>
              
              <div className="field-row">
                <span className="field-label">Acompanhamento médico:</span>
                <span className="field-value">
                  {formatarSimNao(aluno.saude.acompanhamentoMedico?.tem)}
                  {aluno.saude.acompanhamentoMedico?.quais && ` - ${aluno.saude.acompanhamentoMedico.quais}`}
                </span>
              </div>
            </div>
          )}

          {/* DADOS FINANCEIROS */}
          {aluno.financeiro && (
            <div className="section">
              <div className="section-title">💰 INFORMAÇÕES FINANCEIRAS</div>
              
              <div className="two-column">
                <div className="field-row">
                  <span className="field-label">Status Financeiro:</span>
                  <span className="field-value">{aluno.financeiro.status?.toUpperCase() || 'ATIVO'}</span>
                </div>
                <div className="field-row">
                  <span className="field-label">Dia Vencimento:</span>
                  <span className="field-value">{aluno.financeiro.diaVencimento || ''}</span>
                </div>
              </div>
              
              <div className="two-column">
                <div className="field-row">
                  <span className="field-label">Valor Mensalidade:</span>
                  <span className="field-value">
                    {aluno.financeiro.mensalidadeValor ? `R$ ${parseFloat(aluno.financeiro.mensalidadeValor).toFixed(2)}` : ''}
                  </span>
                </div>
                <div className="field-row">
                  <span className="field-label">Desconto:</span>
                  <span className="field-value">
                    {aluno.financeiro.descontoPercentual ? `${aluno.financeiro.descontoPercentual}%` : ''}
                  </span>
                </div>
              </div>
              
              <div className="two-column">
                <div className="field-row">
                  <span className="field-label">Valor Matrícula:</span>
                  <span className="field-value">
                    {aluno.financeiro.valorMatricula ? `R$ ${parseFloat(aluno.financeiro.valorMatricula).toFixed(2)}` : ''}
                  </span>
                </div>
                <div className="field-row">
                  <span className="field-label">Valor Materiais:</span>
                  <span className="field-value">
                    {aluno.financeiro.valorMateriais ? `R$ ${parseFloat(aluno.financeiro.valorMateriais).toFixed(2)}` : ''}
                  </span>
                </div>
              </div>
              
              {aluno.financeiro.observacoes && (
                <div className="field-row">
                  <span className="field-label">Observações Financeiras:</span>
                  <span className="field-value">{aluno.financeiro.observacoes}</span>
                </div>
              )}
            </div>
          )}

          {/* ANEXOS */}
          {aluno.anexos && aluno.anexos.length > 0 && (
            <div className="section">
              <div className="section-title">📎 DOCUMENTOS ANEXADOS</div>
              {aluno.anexos.map((anexo, idx) => (
                <div key={idx} className="field-row">
                  <span className="field-label">Documento {idx + 1}:</span>
                  <span className="field-value">{anexo.nome || anexo}</span>
                </div>
              ))}
            </div>
          )}

          {/* ASSINATURAS */}
          <div className="signature-section">
            <div className="signature-box">
              <div className="signature-line"></div>
              <div className="signature-label">
                <strong>Assinatura da Diretora</strong><br />
                Data: {dataAtual}
              </div>
            </div>
            
            <div className="signature-box">
              <div className="signature-line"></div>
              <div className="signature-label">
                <strong>Assinatura do Responsável</strong><br />
                Data: ___/___/______
              </div>
            </div>
          </div>

          <div className="footer">
            <p>Documento gerado automaticamente em {dataAtual}</p>
            <p>ESCOLA ELO - Sistema de Gestão Escolar</p>
          </div>
        </div>
      </Box>
    </Box>
  );
};

export default FichaMatricula;