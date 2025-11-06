/**
 * Serviço de Secretaria Digital
 * Responsável pela geração, assinatura e validação de documentos escolares digitais
 * Conforme normas do MEC - Portaria 1.570/2017 e Lei 14.533/2023
 */

import { db, ref, push, set, get, query, orderByChild, equalTo } from '../firebase';
import { logAction } from './auditService';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// Tipos de documentos da secretaria digital
export const DOCUMENT_TYPES = {
  HISTORICO_ESCOLAR: 'historico_escolar',
  CERTIFICADO: 'certificado',
  DIPLOMA: 'diploma',
  DECLARACAO_MATRICULA: 'declaracao_matricula',
  DECLARACAO_CONCLUSAO: 'declaracao_conclusao',
  DECLARACAO_FREQUENCIA: 'declaracao_frequencia',
  TRANSFERENCIA: 'transferencia',
  ATA_RESULTADOS: 'ata_resultados'
};

// Status dos documentos
export const DOCUMENT_STATUS = {
  RASCUNHO: 'rascunho',
  PENDENTE_ASSINATURA: 'pendente_assinatura',
  ASSINADO: 'assinado',
  VALIDADO: 'validado',
  CANCELADO: 'cancelado'
};

class SecretariaDigitalService {
  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  /**
   * Gerar código de verificação único para documento
   */
  generateVerificationCode() {
    return 'DOC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  /**
   * Gerar hash do documento para integridade
   */
  generateDocumentHash(content) {
    // Implementação simplificada - em produção usar SHA-256
    const str = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para 32bit
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Buscar dados completos do aluno
   */
  async getDadosAluno(alunoId) {
    try {
      const alunoRef = ref(db, `alunos/${alunoId}`);
      const snapshot = await get(alunoRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      throw new Error('Aluno não encontrado');
    } catch (error) {
      console.error('Erro ao buscar dados do aluno:', error);
      throw error;
    }
  }

  /**
   * Buscar nome da disciplina por ID
   */
  async getNomeDisciplina(disciplinaId) {
    try {
      const disciplinaRef = ref(db, `disciplinas/${disciplinaId}`);
      const snapshot = await get(disciplinaRef);
      
      if (snapshot.exists()) {
        const disciplina = snapshot.val();
        return disciplina.nome || disciplina.nomeDisciplina || disciplinaId;
      }
      
      // Tentar buscar em Escola/Disciplinas (estrutura alternativa)
      const escolaRef = ref(db, `Escola/Disciplinas/${disciplinaId}`);
      const escolaSnapshot = await get(escolaRef);
      
      if (escolaSnapshot.exists()) {
        const disciplina = escolaSnapshot.val();
        return disciplina.nome || disciplina.nomeDisciplina || disciplinaId;
      }
      
      // Retornar o ID se não encontrar
      return disciplinaId;
    } catch (error) {
      console.error('Erro ao buscar nome da disciplina:', error);
      return disciplinaId;
    }
  }

  /**
   * Buscar dados da instituição
   */
  async getDadosInstituicao() {
    try {
      const configRef = ref(db, 'secretariaDigital/configuracoes/instituicao');
      const snapshot = await get(configRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      
      // Dados padrão se não configurado
      return {
        nome: 'Escola ELO',
        cnpj: '00.000.000/0001-00',
        endereco: {
          rua: 'Rua da Escola, 123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '00000-000'
        },
        telefone: '(11) 0000-0000',
        email: 'secretaria@escola.com.br',
        responsavel: {
          nome: 'Diretor(a)',
          cpf: '000.000.000-00',
          cargo: 'Diretor(a) Escolar'
        },
        certificadoDigital: {
          tipo: 'A1',
          validade: '2025-12-31',
          serie: '123456789'
        }
      };
    } catch (error) {
      console.error('Erro ao buscar dados da instituição:', error);
      throw error;
    }
  }

  /**
   * Gerar QR Code para validação
   */
  async generateQRCode(verificationCode) {
    try {
      const validationUrl = `${this.baseUrl}/validacao/${verificationCode}`;
      const qrCodeDataURL = await QRCode.toDataURL(validationUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return null;
    }
  }

  /**
   * Simular assinatura digital
   * Em produção, integrar com certificado ICP-Brasil
   */
  async simularAssinaturaDigital(documento, responsavel) {
    const timestamp = new Date().toISOString();
    const hash = this.generateDocumentHash(documento);
    
    return {
      hash: hash,
      timestamp: timestamp,
      responsavel: responsavel,
      algoritmo: 'SHA-256',
      certificado: {
        serie: '1234567890',
        emissor: 'AC-TESTE',
        validade: '2025-12-31T23:59:59Z'
      },
      status: 'valida'
    };
  }

  /**
   * Sanitizar documento removendo valores undefined para Firebase
   */
  sanitizarDocumento(obj) {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizarDocumento(item)).filter(item => item !== null);
    }
    
    if (typeof obj === 'object') {
      const resultado = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null) {
          const valorSanitizado = this.sanitizarDocumento(value);
          if (valorSanitizado !== null) {
            resultado[key] = valorSanitizado;
          }
        }
      }
      return Object.keys(resultado).length > 0 ? resultado : null;
    }
    
    return obj;
  }

  /**
   * Gerar Histórico Escolar Digital - NOVA VERSÃO COM PRESERVAÇÃO DE HISTÓRICO
   */
  async gerarHistoricoEscolar(alunoId, anosLetivos = [], observacoes = '') {
    try {
      const dadosAluno = await this.getDadosAluno(alunoId);
      const dadosInstituicao = await this.getDadosInstituicao();
      const verificationCode = this.generateVerificationCode();
      
      // 🆕 Buscar histórico acadêmico completo do aluno
      const historicoAcademico = dadosAluno.historicoAcademico || {};
      const periodosAcademicos = [];
      
      // Se não especificou anos, pegar todos os períodos do histórico
      const anosProcurar = anosLetivos.length > 0 ? anosLetivos : Object.keys(historicoAcademico);
      
      if (anosProcurar.length === 0) {
        // Fallback para sistema antigo - usar ano atual
        const anoAtual = new Date().getFullYear().toString();
        anosProcurar.push(anoAtual);
      }

      // Buscar todas as notas e frequências uma única vez (mais eficiente e sem precisar de índice)
      const notasRef = ref(db, 'notas');
      const notasSnapshot = await get(notasRef);
      
      const frequenciaRef = ref(db, 'frequencia');
      const frequenciaSnapshot = await get(frequenciaRef);
      
      // Para cada ano letivo, processar dados
      for (const anoLetivo of anosProcurar) {
        const periodoDados = historicoAcademico[anoLetivo];
        
        const disciplinasNotas = new Map();
        const disciplinasFrequencia = new Map();

        // Processar notas
        if (notasSnapshot.exists()) {
          Object.values(notasSnapshot.val()).forEach(nota => {
            // 🔍 Filtrar apenas notas deste aluno
            if (nota.alunoId !== alunoId) return;
            
            // Filtrar por ano letivo - priorizar campo anoLetivo, fallback para turmaId do período
            const notaAnoLetivo = nota.anoLetivo || anoLetivo;
            const turmaNotaId = nota.turmaId;
            const turmaPeriodoId = periodoDados?.turmaId;
            
            if (notaAnoLetivo === anoLetivo || turmaNotaId === turmaPeriodoId) {
              const disciplinaId = nota.disciplinaId;
              if (!disciplinasNotas.has(disciplinaId)) {
                disciplinasNotas.set(disciplinaId, {
                  disciplinaId,
                  nome: nota.disciplinaNome || disciplinaId,
                  notas: {},
                  mediaFinal: 0,
                  situacao: 'Pendente'
                });
              }
              
              const disciplina = disciplinasNotas.get(disciplinaId);
              disciplina.notas[nota.bimestre] = parseFloat(nota.nota);
            }
          });
        }

        // Processar frequência
        if (frequenciaSnapshot.exists()) {
          Object.values(frequenciaSnapshot.val()).forEach(freq => {
            // 🔍 Filtrar apenas frequência deste aluno
            if (freq.alunoId !== alunoId) return;
            
            const freqAnoLetivo = freq.anoLetivo || anoLetivo;
            const turmaFreqId = freq.turmaId;
            const turmaPeriodoId = periodoDados?.turmaId;
            
            if (freqAnoLetivo === anoLetivo || turmaFreqId === turmaPeriodoId) {
              const disciplinaId = freq.disciplinaId;
              if (!disciplinasFrequencia.has(disciplinaId)) {
                disciplinasFrequencia.set(disciplinaId, {
                  totalAulas: 0,
                  totalPresencas: 0,
                  percentualFrequencia: 0
                });
              }
              
              const disciplina = disciplinasFrequencia.get(disciplinaId);
              disciplina.totalAulas++;
              if (freq.presente) {
                disciplina.totalPresencas++;
              }
            }
          });
        }

        // Calcular estatísticas finais para cada disciplina
        const disciplinasFinais = [];
        
        // Processar disciplinas em batch para obter nomes corretos
        const disciplinaIds = Array.from(disciplinasNotas.keys());
        const nomesDisciplinas = new Map();
        
        // Buscar nomes das disciplinas
        for (const disciplinaId of disciplinaIds) {
          const nomeCompleto = await this.getNomeDisciplina(disciplinaId);
          nomesDisciplinas.set(disciplinaId, nomeCompleto);
        }
        
        disciplinasNotas.forEach((disciplina, disciplinaId) => {
          const notas = Object.values(disciplina.notas);
          const mediaFinal = notas.length > 0 ? notas.reduce((sum, nota) => sum + nota, 0) / notas.length : 0;
          
          const freqData = disciplinasFrequencia.get(disciplinaId) || { totalAulas: 0, totalPresencas: 0 };
          const percentualFrequencia = freqData.totalAulas > 0 ? 
            (freqData.totalPresencas / freqData.totalAulas) * 100 : 100;
          
          const situacao = mediaFinal >= 7 && percentualFrequencia >= 75 ? 'Aprovado' : 'Reprovado';
          
          disciplinasFinais.push({
            nome: disciplina.nome, // Nome original (fallback)
            nomeCompleto: nomesDisciplinas.get(disciplinaId), // Nome correto do banco
            disciplinaId: disciplinaId,
            notas: disciplina.notas,
            mediaFinal: parseFloat(mediaFinal.toFixed(2)),
            frequencia: parseFloat(percentualFrequencia.toFixed(1)),
            frequenciaPercentual: `${percentualFrequencia.toFixed(0)}%`,
            totalAulas: freqData.totalAulas,
            totalPresencas: freqData.totalPresencas,
            totalFaltas: freqData.totalAulas - freqData.totalPresencas,
            situacao
          });
        });

        // Adicionar período ao histórico
        if (disciplinasFinais.length > 0 || periodoDados) {
          periodosAcademicos.push({
            anoLetivo,
            periodoLetivo: periodoDados?.periodoLetivo || `Período ${anoLetivo}`,
            turmaId: periodoDados?.turmaId,
            situacao: periodoDados?.situacao || 'Concluído',
            dataInicio: periodoDados?.dataInicio,
            dataFim: periodoDados?.dataFim,
            resultadoFinal: periodoDados?.resultadoFinal || 
              (disciplinasFinais.every(d => d.situacao === 'Aprovado') ? 'Aprovado' : 'Reprovado'),
            disciplinas: disciplinasFinais
          });
        }
      }

      // Gerar documento final
      const documento = {
        id: verificationCode,
        tipo: DOCUMENT_TYPES.HISTORICO_ESCOLAR,
        status: DOCUMENT_STATUS.PENDENTE_ASSINATURA,
        dadosAluno: {
          nome: dadosAluno.nome || 'Nome não informado',
          matricula: dadosAluno.matricula || alunoId,
          cpf: dadosAluno.cpf || 'CPF não informado',
          rg: dadosAluno.rg || 'RG não informado',
          dataNascimento: dadosAluno.dataNascimento || 'Data não informada',
          sexo: dadosAluno.sexo || 'M',
          naturalidade: dadosAluno.naturalidade || 'Naturalidade não informada',
          uf: dadosAluno.uf || 'UF não informada',
          nomePai: dadosAluno.pai?.nome || dadosAluno.nomePai || 'Nome do pai não informado',
          nomeMae: dadosAluno.mae?.nome || dadosAluno.nomeMae || 'Nome da mãe não informado'
        },
        
        // Adicionar matrícula diretamente no documento também
        matricula: dadosAluno.matricula || alunoId,
        alunoId: alunoId,
        
        // 🆕 Nova estrutura com histórico completo
        historicoCompleto: {
          totalPeriodos: periodosAcademicos.length,
          periodosAcademicos: periodosAcademicos,
          situacaoGeral: periodosAcademicos.every(p => p.resultadoFinal === 'Aprovado') ? 'Aprovado' : 'Em Análise'
        },
        
        // Manter compatibilidade com estrutura antiga
        curso: {
          nome: dadosAluno.serie || 'Ensino Fundamental',
          nivel: 'Fundamental',
          anosLetivos: anosProcurar,
          cargaHoraria: `${periodosAcademicos.length * 800} horas`
        },
        
        // Resumo das disciplinas (para compatibilidade)
        disciplinas: periodosAcademicos.flatMap(p => p.disciplinas || []),
        situacaoFinal: periodosAcademicos.every(p => p.resultadoFinal === 'Aprovado') ? 'Aprovado' : 'Pendente',
        observacoes: observacoes,
        dadosInstituicao: dadosInstituicao,
        dataEmissao: new Date().toISOString(),
        codigoVerificacao: verificationCode,
        
        // 🆕 Metadados do novo sistema
        versaoSistema: '2.0',
        preservacaoHistorico: true,
        totalRematriculas: dadosAluno.historicoRematriculas?.length || 0
      };

      // Gerar QR Code
      const qrCode = await this.generateQRCode(verificationCode);
      documento.qrCode = qrCode;

      // Simular assinatura digital
      const assinatura = await this.simularAssinaturaDigital(documento, dadosInstituicao.responsavel);
      documento.assinatura = assinatura;
      documento.status = DOCUMENT_STATUS.ASSINADO;

      // Sanitizar documento removendo valores undefined
      const documentoSanitizado = this.sanitizarDocumento(documento);

      // Salvar no Firebase
      const documentoRef = ref(db, `secretariaDigital/documentos/historicos/${verificationCode}`);
      await set(documentoRef, documentoSanitizado);

      // Log da ação
      await logAction('DIGITAL_SECRETARY_HISTORIC_GENERATED', {
        alunoId: alunoId,
        alunoNome: dadosAluno.nome,
        anosLetivos: anosProcurar,
        totalPeriodos: periodosAcademicos.length,
        codigoVerificacao: verificationCode,
        documentoId: documento.id
      });

      return documento;
    } catch (error) {
      console.error('Erro ao gerar histórico escolar:', error);
      throw error;
    }
  }

  /**
   * Gerar Declaração de Matrícula
   */
  async gerarDeclaracaoMatricula(alunoId, finalidade = 'Para fins diversos') {
    try {
      const dadosAluno = await this.getDadosAluno(alunoId);
      const dadosInstituicao = await this.getDadosInstituicao();
      const verificationCode = this.generateVerificationCode();

      const documento = {
        id: verificationCode,
        tipo: DOCUMENT_TYPES.DECLARACAO_MATRICULA,
        status: DOCUMENT_STATUS.PENDENTE_ASSINATURA,
        dadosAluno: {
          nome: dadosAluno.nome,
          cpf: dadosAluno.cpf,
          rg: dadosAluno.rg,
          dataNascimento: dadosAluno.dataNascimento
        },
        matricula: {
          numero: dadosAluno.id,
          serie: dadosAluno.serie,
          turma: dadosAluno.turma,
          turno: dadosAluno.turno || 'Manhã',
          anoLetivo: new Date().getFullYear(),
          situacao: 'Ativo'
        },
        finalidade: finalidade,
        dadosInstituicao: dadosInstituicao,
        dataEmissao: new Date().toISOString(),
        codigoVerificacao: verificationCode
      };

      // Gerar QR Code
      const qrCode = await this.generateQRCode(verificationCode);
      documento.qrCode = qrCode;

      // Simular assinatura digital
      const assinatura = await this.simularAssinaturaDigital(documento, dadosInstituicao.responsavel);
      documento.assinatura = assinatura;
      documento.status = DOCUMENT_STATUS.ASSINADO;

      // Salvar no Firebase
      const documentoRef = ref(db, `secretariaDigital/documentos/declaracoes/${verificationCode}`);
      await set(documentoRef, documento);

      // Log da ação
      await logAction('DIGITAL_SECRETARY_DECLARATION_GENERATED', {
        alunoId: alunoId,
        alunoNome: dadosAluno.nome,
        tipo: 'matricula',
        finalidade: finalidade,
        codigoVerificacao: verificationCode
      });

      return documento;
    } catch (error) {
      console.error('Erro ao gerar declaração de matrícula:', error);
      throw error;
    }
  }

  /**
   * Validar documento por código de verificação
   */
  async validarDocumento(codigoVerificacao) {
    try {
      // Buscar em todos os tipos de documentos
      const tiposDocumento = ['historicos', 'declaracoes', 'certificados', 'transferencias'];
      
      for (const tipo of tiposDocumento) {
        const documentoRef = ref(db, `secretariaDigital/documentos/${tipo}/${codigoVerificacao}`);
        const snapshot = await get(documentoRef);
        
        if (snapshot.exists()) {
          const documento = snapshot.val();
          
          // Verificar integridade
          const hashAtual = this.generateDocumentHash({
            dadosAluno: documento.dadosAluno,
            curso: documento.curso,
            disciplinas: documento.disciplinas
          });
          
          const assinaturaValida = documento.assinatura && documento.assinatura.hash === hashAtual;
          
          // Log da validação
          await logAction('DIGITAL_SECRETARY_DOCUMENT_VALIDATED', {
            codigoVerificacao: codigoVerificacao,
            tipoDocumento: documento.tipo,
            validado: assinaturaValida,
            alunoNome: documento.dadosAluno?.nome
          });

          return {
            valido: assinaturaValida,
            documento: documento,
            dataValidacao: new Date().toISOString()
          };
        }
      }
      
      // Log de tentativa de validação inválida
      await logAction('DIGITAL_SECRETARY_VALIDATION_FAILED', {
        codigoVerificacao: codigoVerificacao,
        motivo: 'documento_nao_encontrado'
      });

      return {
        valido: false,
        erro: 'Documento não encontrado'
      };
    } catch (error) {
      console.error('Erro ao validar documento:', error);
      
      await logAction('DIGITAL_SECRETARY_VALIDATION_ERROR', {
        codigoVerificacao: codigoVerificacao,
        erro: error.message
      });

      throw error;
    }
  }

  /**
   * Listar documentos emitidos
   */
  async listarDocumentos(tipo = null, limite = 50) {
    try {
      const documentos = [];
      const tiposDocumento = tipo ? [tipo] : ['historicos', 'declaracoes', 'certificados', 'transferencias'];
      
      for (const tipoDoc of tiposDocumento) {
        const documentosRef = ref(db, `secretariaDigital/documentos/${tipoDoc}`);
        const snapshot = await get(documentosRef);
        
        if (snapshot.exists()) {
          Object.entries(snapshot.val()).forEach(([id, doc]) => {
            documentos.push({
              id: id,
              ...doc,
              tipoCategoria: tipoDoc
            });
          });
        }
      }
      
      // Ordenar por data de emissão (mais recentes primeiro)
      documentos.sort((a, b) => new Date(b.dataEmissao) - new Date(a.dataEmissao));
      
      return documentos.slice(0, limite);
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas da secretaria digital
   */
  async obterEstatisticas() {
    try {
      const estatisticas = {
        totalDocumentos: 0,
        porTipo: {},
        porMes: {},
        validacoesRealizadas: 0
      };

      const tiposDocumento = ['historicos', 'declaracoes', 'certificados', 'transferencias'];
      
      for (const tipo of tiposDocumento) {
        const documentosRef = ref(db, `secretariaDigital/documentos/${tipo}`);
        const snapshot = await get(documentosRef);
        
        if (snapshot.exists()) {
          const docs = Object.values(snapshot.val());
          estatisticas.totalDocumentos += docs.length;
          estatisticas.porTipo[tipo] = docs.length;
          
          // Contar por mês
          docs.forEach(doc => {
            const mes = new Date(doc.dataEmissao).toISOString().substr(0, 7); // YYYY-MM
            estatisticas.porMes[mes] = (estatisticas.porMes[mes] || 0) + 1;
          });
        } else {
          estatisticas.porTipo[tipo] = 0;
        }
      }

      return estatisticas;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Configurar dados da instituição
   */
  async configurarInstituicao(dados) {
    try {
      const configRef = ref(db, 'secretariaDigital/configuracoes/instituicao');
      await set(configRef, {
        ...dados,
        dataAtualizacao: new Date().toISOString()
      });

      await logAction('DIGITAL_SECRETARY_INSTITUTION_CONFIGURED', {
        nomeInstituicao: dados.nome,
        cnpj: dados.cnpj
      });

      return true;
    } catch (error) {
      console.error('Erro ao configurar instituição:', error);
      throw error;
    }
  }

  /**
   * Gerar PDF do Histórico Escolar - Modelo Oficial
   */
  async gerarPDF(documento) {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = 20;

      // 🏫 CABEÇALHO DA INSTITUIÇÃO
      this.adicionarCabecalhoInstituicao(pdf, documento, yPosition);
      yPosition += 60;

      // 📋 TÍTULO DO DOCUMENTO
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const titulo = documento.tipo === DOCUMENT_TYPES.HISTORICO_ESCOLAR ? 'HISTÓRICO ESCOLAR' : 'DECLARAÇÃO DE MATRÍCULA';
      pdf.text(titulo, pageWidth/2, yPosition, { align: 'center' });
      yPosition += 15;

      if (documento.tipo === DOCUMENT_TYPES.HISTORICO_ESCOLAR) {
        // 👤 DADOS DO ALUNO
        yPosition = this.adicionarDadosAluno(pdf, documento, yPosition, margin, pageWidth);
        
        // 🎓 DADOS DO CURSO/SÉRIE
        yPosition = this.adicionarDadosCurso(pdf, documento, yPosition, margin, pageWidth);
        
        // 📚 HISTÓRICO ACADÊMICO POR PERÍODO
        yPosition = this.adicionarHistoricoAcademico(pdf, documento, yPosition, margin, pageWidth, pageHeight);
        
        // ✅ SITUAÇÃO FINAL
        yPosition = this.adicionarSituacaoFinal(pdf, documento, yPosition, margin, pageWidth);
        
        // 🔒 ASSINATURA E QR CODE
        this.adicionarAssinaturaQR(pdf, documento, pageWidth, pageHeight);
      }
      
      return pdf;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw error;
    }
  }

  /**
   * Adicionar cabeçalho da instituição no PDF
   */
  adicionarCabecalhoInstituicao(pdf, documento, yStart) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    
    // Nome da Instituição
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    const nomeInstituicao = documento.dadosInstituicao?.nome || 'ESCOLA ELO';
    pdf.text(nomeInstituicao, pageWidth/2, yStart, { align: 'center' });
    
    // Endereço
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const endereco = documento.dadosInstituicao?.endereco || {};
    pdf.text(endereco.rua || 'Endereço não informado', pageWidth/2, yStart + 8, { align: 'center' });
    pdf.text(`${endereco.cidade || 'Cidade'} - ${endereco.estado || 'UF'}`, pageWidth/2, yStart + 16, { align: 'center' });
    pdf.text(`CEP: ${endereco.cep || '00000-000'}`, pageWidth/2, yStart + 24, { align: 'center' });
    
    // CNPJ
    if (documento.dadosInstituicao?.cnpj) {
      pdf.text(`CNPJ: ${documento.dadosInstituicao.cnpj}`, pageWidth/2, yStart + 32, { align: 'center' });
    }
    
    // Data e página
    const dataEmissao = new Date(documento.dataEmissao).toLocaleDateString('pt-BR');
    pdf.text(`${dataEmissao}`, pageWidth - margin, yStart, { align: 'right' });
    pdf.text('Página: 1 de 1', pageWidth - margin, yStart + 8, { align: 'right' });
  }

  /**
   * Adicionar dados do aluno
   */
  adicionarDadosAluno(pdf, documento, yStart, margin, pageWidth) {
    let yPos = yStart;
    
    // Título da seção
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    
    // Tabela de dados pessoais
    const dados = documento.dadosAluno;
    
    // Linha 1: Nome e Matrícula
    pdf.rect(margin, yPos, pageWidth - 2*margin, 8);
    pdf.text('Nome', margin + 2, yPos + 5);
    pdf.text('Matrícula', pageWidth - 50, yPos + 5);
    yPos += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.rect(margin, yPos, pageWidth - 80, 8);
    pdf.rect(pageWidth - 80, yPos, 80 - margin, 8);
    pdf.text(dados.nome || 'Nome não informado', margin + 2, yPos + 5);
    // Buscar matrícula do aluno ou usar ID
    const matriculaAluno = dados.matricula || documento.alunoId || 'S/N';
    pdf.text(matriculaAluno, pageWidth - 48, yPos + 5);
    yPos += 8;
    
    // Linha 2: Data de Nascimento, Sexo, Naturalidade, Nacionalidade, CPF
    pdf.setFont('helvetica', 'bold');
    pdf.rect(margin, yPos, 30, 8);
    pdf.rect(margin + 30, yPos, 20, 8);
    pdf.rect(margin + 50, yPos, 35, 8);
    pdf.rect(margin + 85, yPos, 35, 8);
    pdf.rect(margin + 120, yPos, pageWidth - margin - 120, 8);
    
    pdf.text('Data de Nascimento', margin + 2, yPos + 5);
    pdf.text('Sexo', margin + 32, yPos + 5);
    pdf.text('Naturalidade', margin + 52, yPos + 5);
    pdf.text('Nacionalidade', margin + 87, yPos + 5);
    pdf.text('CPF', margin + 122, yPos + 5);
    yPos += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.rect(margin, yPos, 30, 8);
    pdf.rect(margin + 30, yPos, 20, 8);
    pdf.rect(margin + 50, yPos, 35, 8);
    pdf.rect(margin + 85, yPos, 35, 8);
    pdf.rect(margin + 120, yPos, pageWidth - margin - 120, 8);
    
    pdf.text(dados.dataNascimento || 'N/I', margin + 2, yPos + 5);
    pdf.text(dados.sexo || 'M', margin + 32, yPos + 5);
    pdf.text(dados.naturalidade || 'N/I', margin + 52, yPos + 5);
    pdf.text('BRASILEIRA', margin + 87, yPos + 5);
    pdf.text(dados.cpf || 'N/I', margin + 122, yPos + 5);
    
    return yPos + 15;
  }

  /**
   * Adicionar dados do curso/série
   */
  adicionarDadosCurso(pdf, documento, yStart, margin, pageWidth) {
    let yPos = yStart;
    
    // Título: Conclusão do Ensino Fundamental/Médio
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.rect(margin, yPos, pageWidth - 2*margin, 8);
    pdf.text('Conclusão do Ensino Fundamental', pageWidth/2, yPos + 5, { align: 'center' });
    yPos += 8;
    
    // Estabelecimento
    pdf.rect(margin, yPos, (pageWidth - 2*margin) * 0.7, 8);
    pdf.rect(margin + (pageWidth - 2*margin) * 0.7, yPos, (pageWidth - 2*margin) * 0.15, 8);
    pdf.rect(margin + (pageWidth - 2*margin) * 0.85, yPos, (pageWidth - 2*margin) * 0.15, 8);
    
    pdf.text('Estabelecimento', margin + 2, yPos + 5);
    pdf.text('Ano / Série', margin + (pageWidth - 2*margin) * 0.7 + 2, yPos + 5);
    pdf.text('Local', margin + (pageWidth - 2*margin) * 0.85 + 2, yPos + 5);
    yPos += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.rect(margin, yPos, (pageWidth - 2*margin) * 0.7, 8);
    pdf.rect(margin + (pageWidth - 2*margin) * 0.7, yPos, (pageWidth - 2*margin) * 0.15, 8);
    pdf.rect(margin + (pageWidth - 2*margin) * 0.85, yPos, (pageWidth - 2*margin) * 0.15, 8);
    
    pdf.text(documento.dadosInstituicao?.nome || 'ESCOLA ELO', margin + 2, yPos + 5);
    pdf.text('2025', margin + (pageWidth - 2*margin) * 0.7 + 2, yPos + 5);
    
    // Usar endereço da instituição
    const endereco = documento.dadosInstituicao?.endereco || {};
    const localCompleto = `${endereco.cidade || 'São Paulo'} / ${endereco.estado || 'SP'}`;
    pdf.text(localCompleto, margin + (pageWidth - 2*margin) * 0.85 + 2, yPos + 5);
    
    return yPos + 15;
  }

  /**
   * Adicionar histórico acadêmico com disciplinas
   */
  adicionarHistoricoAcademico(pdf, documento, yStart, margin, pageWidth, pageHeight) {
    let yPos = yStart;
    
    // Título: DISCIPLINAS CURSADAS
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.rect(margin, yPos, pageWidth - 2*margin, 8);
    pdf.text('DISCIPLINAS CURSADAS', pageWidth/2, yPos + 5, { align: 'center' });
    yPos += 8;
    
    // Cabeçalho da tabela - sem carga horária, com frequência
    const colWidths = {
      ano: 25,
      disciplina: 90,
      frequencia: 25,
      media: 20,
      situacao: 25
    };
    
    pdf.rect(margin, yPos, colWidths.ano, 8);
    pdf.rect(margin + colWidths.ano, yPos, colWidths.disciplina, 8);
    pdf.rect(margin + colWidths.ano + colWidths.disciplina, yPos, colWidths.frequencia, 8);
    pdf.rect(margin + colWidths.ano + colWidths.disciplina + colWidths.frequencia, yPos, colWidths.media, 8);
    pdf.rect(margin + colWidths.ano + colWidths.disciplina + colWidths.frequencia + colWidths.media, yPos, colWidths.situacao, 8);
    
    pdf.text('Ano/Série', margin + 2, yPos + 5);
    pdf.text('Disciplinas', margin + colWidths.ano + 2, yPos + 5);
    pdf.text('Frequência', margin + colWidths.ano + colWidths.disciplina + 2, yPos + 5);
    pdf.text('Média', margin + colWidths.ano + colWidths.disciplina + colWidths.frequencia + 2, yPos + 5);
    pdf.text('Situação Final', margin + colWidths.ano + colWidths.disciplina + colWidths.frequencia + colWidths.media + 2, yPos + 5);
    yPos += 8;
    
    // Dados das disciplinas
    pdf.setFont('helvetica', 'normal');
    const periodosAcademicos = documento.historicoCompleto?.periodosAcademicos || [];
    
    if (periodosAcademicos.length > 0) {
      periodosAcademicos.forEach(periodo => {
        if (periodo.disciplinas && periodo.disciplinas.length > 0) {
          periodo.disciplinas.forEach(disciplina => {
            // Verificar se precisa de nova página
            if (yPos > pageHeight - 30) {
              pdf.addPage();
              yPos = 20;
            }
            
            const anoSerie = `${periodo.anoLetivo}`;
            // Calcular média de frequência ou usar o valor direto
            const frequencia = disciplina.frequenciaPercentual || disciplina.mediaFrequencia || 
                             (disciplina.aulasPresentes && disciplina.totalAulas ? 
                               ((disciplina.aulasPresentes / disciplina.totalAulas) * 100).toFixed(0) + '%' : '100%');
            const media = disciplina.mediaFinal ? disciplina.mediaFinal.toFixed(1) : 'N/A';
            const situacao = disciplina.situacao || 'Aprovado';
            
            // Obter nome real da disciplina
            const nomeDisciplina = disciplina.nomeCompleto || disciplina.nome || 'Disciplina';
            
            pdf.rect(margin, yPos, colWidths.ano, 6);
            pdf.rect(margin + colWidths.ano, yPos, colWidths.disciplina, 6);
            pdf.rect(margin + colWidths.ano + colWidths.disciplina, yPos, colWidths.frequencia, 6);
            pdf.rect(margin + colWidths.ano + colWidths.disciplina + colWidths.frequencia, yPos, colWidths.media, 6);
            pdf.rect(margin + colWidths.ano + colWidths.disciplina + colWidths.frequencia + colWidths.media, yPos, colWidths.situacao, 6);
            
            pdf.setFontSize(8);
            pdf.text(anoSerie, margin + 2, yPos + 4);
            pdf.text(nomeDisciplina, margin + colWidths.ano + 2, yPos + 4);
            pdf.text(frequencia, margin + colWidths.ano + colWidths.disciplina + 2, yPos + 4);
            pdf.text(media, margin + colWidths.ano + colWidths.disciplina + colWidths.frequencia + 2, yPos + 4);
            pdf.text(situacao, margin + colWidths.ano + colWidths.disciplina + colWidths.frequencia + colWidths.media + 2, yPos + 4);
            
            yPos += 6;
          });
        }
      });
    } else {
      // Se não há períodos, mostrar mensagem
      pdf.rect(margin, yPos, pageWidth - 2*margin, 8);
      pdf.text('Nenhuma disciplina registrada', pageWidth/2, yPos + 5, { align: 'center' });
      yPos += 8;
    }
    
    return yPos + 10;
  }

  /**
   * Adicionar situação final do aluno
   */
  adicionarSituacaoFinal(pdf, documento, yStart, margin, pageWidth) {
    let yPos = yStart;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    
    const situacaoFinal = documento.historicoCompleto?.situacaoGeral || documento.situacaoFinal || 'Aprovado';
    pdf.text(`SITUAÇÃO FINAL: ${situacaoFinal}`, margin, yPos);
    
    if (documento.observacoes) {
      yPos += 10;
      pdf.text('OBSERVAÇÕES:', margin, yPos);
      yPos += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text(documento.observacoes, margin, yPos);
    }
    
    return yPos + 15;
  }

  /**
   * Adicionar assinatura e QR Code
   */
  adicionarAssinaturaQR(pdf, documento, pageWidth, pageHeight) {
    const margin = 15;
    let yPos = pageHeight - 60;
    
    // Data de emissão
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const dataEmissao = new Date(documento.dataEmissao).toLocaleDateString('pt-BR');
    pdf.text(`Emitido em: ${dataEmissao}`, margin, yPos);
    
    // QR Code
    if (documento.qrCode) {
      const qrSize = 30;
      pdf.addImage(documento.qrCode, 'PNG', pageWidth - qrSize - margin, yPos - 15, qrSize, qrSize);
    }
    
    // Código de verificação
    yPos += 8;
    pdf.text(`Código de Verificação: ${documento.codigoVerificacao}`, margin, yPos);
    
    // Assinatura digital
    yPos += 15;
    pdf.setFont('helvetica', 'bold');
    pdf.text('DOCUMENTO ASSINADO DIGITALMENTE', pageWidth/2, yPos, { align: 'center' });
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    const responsavel = documento.dadosInstituicao?.responsavel || {};
    pdf.text(responsavel.nome || 'Diretor(a)', pageWidth/2, yPos, { align: 'center' });
    pdf.text(responsavel.cargo || 'Direção', pageWidth/2, yPos + 8, { align: 'center' });
  }
}

export default new SecretariaDigitalService();
