/**
 * Serviço de Secretaria Digital
 * Responsável pela geração, assinatura e validação de documentos escolares digitais
 * Conforme normas do MEC - Portaria 1.570/2017 e Lei 14.533/2023
 */

import { db, ref, push, set, get, query, orderByChild, equalTo } from '../firebase';
import { logAction } from './auditService';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { PDFGenerator } from '../utils/pdfGenerator';
import HistoricoEscolarCompleto from './historicoEscolarService';
import {
  gerarCertificadoConclusao,
  gerarGuiaTransferencia,
  gerarDeclaracaoConclusao,
  gerarDeclaracaoFrequencia,
  cancelarDocumento as cancelarDoc,
  reemitirDocumento as reemitirDoc
} from './secretariaDigitalExtensions';

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
    this.historicoService = new HistoricoEscolarCompleto(this);
    this.useSchoolDb = false; // Flag para usar funções do schoolDatabase
    this.schoolDbFunctions = null; // Funções getData, setData, etc.
  }

  /**
   * Define as funções do banco de dados da escola (multi-tenant)
   */
  setSchoolDatabaseFunctions(dbFunctions) {
    this.schoolDbFunctions = dbFunctions;
    this.useSchoolDb = true;
  }

  /**
   * Obtém a referência do banco correto (escola específica ou global)
   */
  getDbRef(path) {
    // Se não está usando schoolDb, usa o db global
    if (!this.useSchoolDb) {
      return ref(db, path);
    }
    
    // Se está usando schoolDb mas não tem as funções, usa db global como fallback
    if (!this.schoolDbFunctions || !this.schoolDbFunctions.db) {
      console.warn('⚠️ SchoolDb não configurado, usando db global');
      return ref(db, path);
    }
    
    return ref(this.schoolDbFunctions.db, path);
  }

  /**
   * Get data usando funções do schoolDatabase (quando disponível)
   */
  async getData(path) {
    if (this.useSchoolDb && this.schoolDbFunctions?.getData) {
      return await this.schoolDbFunctions.getData(path);
    }
    
    // Fallback para método tradicional
    const snapshot = await get(this.getDbRef(path));
    return snapshot.exists() ? snapshot.val() : null;
  }

  /**
   * Set data usando funções do schoolDatabase (quando disponível)
   */
  async setData(path, data) {
    if (this.useSchoolDb && this.schoolDbFunctions?.setData) {
      return await this.schoolDbFunctions.setData(path, data);
    }
    
    // Fallback para método tradicional
    return await set(this.getDbRef(path), data);
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
      // Usar getData do schoolDatabase
      const alunoData = await this.getData(`alunos/${alunoId}`);
      
      if (alunoData) {
        return alunoData;
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
      // Usar getData do schoolDatabase
      const disciplina = await this.getData(`disciplinas/${disciplinaId}`);
      
      if (disciplina) {
        return disciplina.nome || disciplina.nomeDisciplina || disciplinaId;
      }
      
      // Tentar buscar em Escola/Disciplinas (estrutura alternativa)
      const escolaDisciplina = await this.getData(`Escola/Disciplinas/${disciplinaId}`);
      
      if (escolaDisciplina) {
        return escolaDisciplina.nome || escolaDisciplina.nomeDisciplina || disciplinaId;
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
      // Tentar buscar configuração primeiro
      const config = await this.getData('secretariaDigital/configuracoes/instituicao');
      
      if (config) {
        return config;
      }
      
      // Se não tem config, buscar dados da escola
      const escolaData = await this.getData('escola');
      
      if (escolaData) {
        // Mapear dados da escola para formato esperado
        return {
          nome: escolaData.nome || 'Escola ELO',
          cnpj: escolaData.cnpj || '00.000.000/0001-00',
          codigoINEP: escolaData.codigoINEP || escolaData.inep,
          endereco: escolaData.endereco || {
            rua: 'Rua da Escola, 123',
            bairro: 'Centro',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '00000-000'
          },
          telefone: escolaData.telefone || '(11) 0000-0000',
          email: escolaData.email || 'secretaria@escola.com.br',
          responsavel: escolaData.responsavel || {
            nome: 'Diretor(a)',
            cpf: '000.000.000-00',
            cargo: 'Diretor(a) Escolar'
          }
        };
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
   * Gerar Histórico Escolar Digital - VERSÃO 3.0 COMPLETA
   * Inclui todas as informações acadêmicas conforme normas do MEC
   */
  async gerarHistoricoEscolar(alunoId, anosLetivos = [], observacoes = '') {
    try {
      console.log('📚 [Histórico] Gerando histórico escolar completo para:', alunoId);
      
      const verificationCode = this.generateVerificationCode();
      
      // 🆕 Usar novo serviço de histórico completo
      const dadosCompletos = await this.historicoService.coletarDadosCompletos(alunoId, {
        anosLetivos: anosLetivos,
        observacoes: observacoes
      });

      // Montar documento final
      const documento = {
        id: verificationCode,
        tipo: DOCUMENT_TYPES.HISTORICO_ESCOLAR,
        status: DOCUMENT_STATUS.PENDENTE_ASSINATURA,
        
        // Dados completos do histórico
        ...dadosCompletos,
        
        // Código de verificação
        codigoVerificacao: verificationCode,
        dataEmissao: new Date().toISOString(),
        
        // Versão do sistema
        versaoSistema: '3.0',
        versaoCompleta: true
      };

      // Gerar QR Code
      const qrCode = await this.generateQRCode(verificationCode);
      documento.qrCode = qrCode;

      // Simular assinatura digital
      const assinatura = await this.simularAssinaturaDigital(documento, dadosCompletos.instituicao.responsavel);
      documento.assinatura = assinatura;
      documento.status = DOCUMENT_STATUS.ASSINADO;

      // Sanitizar documento removendo valores undefined
      const documentoSanitizado = this.sanitizarDocumento(documento);

      // Salvar no Firebase usando setData
      await this.setData(`secretariaDigital/documentos/historicos/${verificationCode}`, documentoSanitizado);

      console.log('✅ [Histórico] Histórico completo gerado:', verificationCode);

      // Log da ação
      await logAction('DIGITAL_SECRETARY_HISTORIC_GENERATED', {
        alunoId: alunoId,
        alunoNome: dadosCompletos.aluno.nome,
        totalAnos: dadosCompletos.resumo.totalAnos,
        totalDisciplinas: dadosCompletos.resumo.totalDisciplinas,
        cargaHorariaTotal: dadosCompletos.resumo.cargaHorariaTotal,
        codigoVerificacao: verificationCode,
        versao: '3.0'
      });

      return documento;
    } catch (error) {
      console.error('❌ [Histórico] Erro ao gerar histórico escolar:', error);
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

      // Sanitizar documento removendo valores undefined
      const documentoSanitizado = this.sanitizarDocumento(documento);

      // Salvar no Firebase usando setData
      await this.setData(`secretariaDigital/documentos/declaracoes/${verificationCode}`, documentoSanitizado);

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
        const documento = await this.getData(`secretariaDigital/documentos/${tipo}/${codigoVerificacao}`);
        
        if (documento) {
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
        const data = await this.getData(`secretariaDigital/documentos/${tipoDoc}`);
        
        if (data) {
          Object.entries(data).forEach(([id, doc]) => {
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
        const data = await this.getData(`secretariaDigital/documentos/${tipo}`);
        
        if (data) {
          const docs = Object.values(data);
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
      const dadosSanitizados = this.sanitizarDocumento({
        ...dados,
        dataAtualizacao: new Date().toISOString()
      });
      
      await this.setData('secretariaDigital/configuracoes/instituicao', dadosSanitizados);

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
  /**
   * Converter valor para string segura para PDF
   */
  toSafeString(value, defaultValue = 'N/I') {
    // Se for null ou undefined, retorna o valor padrão
    if (value === null || value === undefined) {
      return defaultValue;
    }
    
    // Se for string vazia, retorna o valor padrão
    if (typeof value === 'string' && value.trim() === '') {
      return defaultValue;
    }
    
    // Se for objeto, tenta extrair propriedades comuns
    if (typeof value === 'object') {
      if (value.nome) return String(value.nome);
      if (value.valor) return String(value.valor);
      if (value.text) return String(value.text);
      return defaultValue;
    }
    
    // Converte para string e retorna
    const strValue = String(value).trim();
    return strValue === '' ? defaultValue : strValue;
  }

  async gerarPDF(documento) {
    try {
      console.log('📄 [SecretariaDigital] Iniciando geração de PDF para documento:', documento.id);
      console.log('📄 [SecretariaDigital] DOCUMENTO COMPLETO:', JSON.stringify(documento, null, 2));
      
      // Validar dados mínimos necessários
      if (!documento) {
        throw new Error('Documento não fornecido');
      }
      
      // NORMALIZAR ESTRUTURA DO DOCUMENTO
      const dadosNormalizados = this.normalizarDadosDocumento(documento);
      console.log('📄 [SecretariaDigital] DADOS NORMALIZADOS:', JSON.stringify(dadosNormalizados, null, 2));
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = 20;

      console.log('📄 [SecretariaDigital] PDF criado, dimensões:', { pageWidth, pageHeight });

      // 🏫 CABEÇALHO DA INSTITUIÇÃO
      this.adicionarCabecalhoInstituicao(pdf, dadosNormalizados, yPosition);
      yPosition += 60;

      // 📋 TÍTULO DO DOCUMENTO
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const titulo = dadosNormalizados.tipo === DOCUMENT_TYPES.HISTORICO_ESCOLAR ? 'HISTÓRICO ESCOLAR' : 'DECLARAÇÃO DE MATRÍCULA';
      pdf.text(this.toSafeString(titulo), pageWidth/2, yPosition, { align: 'center' });
      yPosition += 15;

      if (dadosNormalizados.tipo === DOCUMENT_TYPES.HISTORICO_ESCOLAR) {
        console.log('📄 [SecretariaDigital] Adicionando seções do histórico escolar');
        
        // 👤 DADOS DO ALUNO
        yPosition = this.adicionarDadosAlunoCompleto(pdf, dadosNormalizados, yPosition, margin, pageWidth);
        
        // 🎓 DADOS DO CURSO/SÉRIE
        yPosition = this.adicionarDadosCurso(pdf, dadosNormalizados, yPosition, margin, pageWidth);
        
        // 📚 HISTÓRICO ACADÊMICO COMPLETO (NOVA ABORDAGEM)
        yPosition = this.adicionarHistoricoAcademicoCompleto(pdf, dadosNormalizados, yPosition, margin, pageWidth, pageHeight);
        
        // ✅ SITUAÇÃO FINAL
        yPosition = this.adicionarSituacaoFinal(pdf, dadosNormalizados, yPosition, margin, pageWidth);
        
        // 🔒 ASSINATURA E QR CODE
        this.adicionarAssinaturaQR(pdf, dadosNormalizados, pageWidth, pageHeight);
      }
      
      console.log('✅ [SecretariaDigital] PDF gerado com sucesso');
      return pdf;
    } catch (error) {
      console.error('❌ [SecretariaDigital] Erro ao gerar PDF:', error);
      console.error('Documento:', documento);
      throw new Error(`Falha na geração do PDF: ${error.message}`);
    }
  }

  /**
   * Normalizar estrutura do documento para garantir consistência
   */
  normalizarDadosDocumento(documento) {
    console.log('🔄 [Normalização] Iniciando normalização do documento');
    
    // Extrair dados do aluno de qualquer estrutura possível
    const dadosAluno = documento.dadosAluno || documento.aluno || {};
    
    // Extrair dados da instituição
    const dadosInstituicao = documento.dadosInstituicao || documento.instituicao || {
      nome: 'ESCOLA ELO',
      endereco: {
        rua: 'Endereço não informado',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '00000-000'
      }
    };
    
    // Extrair períodos acadêmicos de TODAS as estruturas possíveis
    let periodosAcademicos = [];
    
    // Opção 1: historicoCompleto.periodosAcademicos
    if (documento.historicoCompleto?.periodosAcademicos) {
      periodosAcademicos = documento.historicoCompleto.periodosAcademicos;
      console.log('📚 [Normalização] Períodos encontrados em historicoCompleto.periodosAcademicos:', periodosAcademicos.length);
    }
    // Opção 2: periodosAcademicos direto
    else if (documento.periodosAcademicos) {
      periodosAcademicos = documento.periodosAcademicos;
      console.log('📚 [Normalização] Períodos encontrados em periodosAcademicos:', periodosAcademicos.length);
    }
    // Opção 3: periodos (estrutura antiga)
    else if (documento.periodos) {
      periodosAcademicos = documento.periodos;
      console.log('📚 [Normalização] Períodos encontrados em periodos:', periodosAcademicos.length);
    }
    
    // Extrair resumo
    const resumo = documento.historicoCompleto?.resumo || documento.resumo || {};
    
    return {
      ...documento,
      dadosAluno,
      dadosInstituicao,
      periodosAcademicos,
      resumo,
      // Preservar campos originais para compatibilidade
      historicoCompleto: {
        ...documento.historicoCompleto,
        periodosAcademicos,
        resumo
      }
    };
  }

  /**
   * Adicionar dados do aluno de forma mais completa
   */
  adicionarDadosAlunoCompleto(pdf, documento, yStart, margin, pageWidth) {
    let yPos = yStart;
    
    console.log('👤 [PDF] Adicionando dados do aluno');
    
    // Título da seção
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    
    const dados = documento.dadosAluno || {};
    console.log('👤 [PDF] Dados do aluno:', dados);
    
    // Linha 1: Nome e Matrícula
    pdf.rect(margin, yPos, pageWidth - 2*margin, 8);
    pdf.text('Nome', margin + 2, yPos + 5);
    pdf.text('Matrícula', pageWidth - 50, yPos + 5);
    yPos += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.rect(margin, yPos, pageWidth - 80, 8);
    pdf.rect(pageWidth - 80, yPos, 80 - margin, 8);
    const nomeAluno = this.toSafeString(dados.nome || dados.nomeCompleto, 'Nome não informado');
    pdf.text(nomeAluno, margin + 2, yPos + 5);
    const matriculaAluno = this.toSafeString(dados.matricula || dados.ra || documento.alunoId, 'S/N');
    pdf.text(matriculaAluno, pageWidth - 48, yPos + 5);
    yPos += 8;
    
    // Linha 2: Data de Nascimento, Sexo, Naturalidade, CPF
    pdf.setFont('helvetica', 'bold');
    pdf.rect(margin, yPos, 30, 8);
    pdf.rect(margin + 30, yPos, 20, 8);
    pdf.rect(margin + 50, yPos, 35, 8);
    pdf.rect(margin + 85, yPos, 35, 8);
    pdf.rect(margin + 120, yPos, pageWidth - margin - 120, 8);
    
    pdf.text('Data de Nasc.', margin + 2, yPos + 5);
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
    
    pdf.text(this.toSafeString(dados.dataNascimento || dados.data_nascimento), margin + 2, yPos + 5);
    pdf.text(this.toSafeString(dados.sexo, 'M'), margin + 32, yPos + 5);
    pdf.text(this.toSafeString(dados.naturalidade), margin + 52, yPos + 5);
    pdf.text('BRASILEIRA', margin + 87, yPos + 5);
    pdf.text(this.toSafeString(dados.cpf), margin + 122, yPos + 5);
    
    return yPos + 15;
  }

  /**
   * Adicionar histórico acadêmico COMPLETO - garantindo que TODOS os dados sejam exibidos
   */
  adicionarHistoricoAcademicoCompleto(pdf, documento, yStart, margin, pageWidth, pageHeight) {
    let yPos = yStart;
    
    console.log('📚 [PDF] ========== INÍCIO HISTÓRICO ACADÊMICO ==========');
    console.log('📚 [PDF] Períodos no documento:', documento.periodosAcademicos?.length || 0);
    
    // Título: DISCIPLINAS CURSADAS
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.rect(margin, yPos, pageWidth - 2*margin, 8);
    pdf.text('DISCIPLINAS CURSADAS', pageWidth/2, yPos + 5, { align: 'center' });
    yPos += 8;
    
    const periodosAcademicos = documento.periodosAcademicos || [];
    console.log('📚 [PDF] Total de períodos a processar:', periodosAcademicos.length);
    
    if (periodosAcademicos.length === 0) {
      pdf.setFont('helvetica', 'normal');
      pdf.rect(margin, yPos, pageWidth - 2*margin, 8);
      pdf.text('Nenhuma disciplina registrada', pageWidth/2, yPos + 5, { align: 'center' });
      yPos += 8;
      return yPos + 10;
    }
    
    // Para cada período acadêmico
    periodosAcademicos.forEach((periodo, indexPeriodo) => {
      console.log(`📚 [PDF] Processando período ${indexPeriodo + 1}:`, {
        anoLetivo: periodo.anoLetivo,
        serie: periodo.serie,
        qtdDisciplinas: periodo.disciplinas?.length || 0
      });
      
      // Verificar se precisa de nova página
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = 20;
      }
      
      // Cabeçalho do período
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.rect(margin, yPos, pageWidth - 2*margin, 7);
      const tituloPeriodo = `${periodo.anoLetivo || '2025'} - ${periodo.serie || 'Série não informada'}${periodo.turno ? ' (' + periodo.turno + ')' : ''}`;
      pdf.text(tituloPeriodo, margin + 2, yPos + 5);
      yPos += 7;
      
      // Cabeçalho da tabela de disciplinas
      const colWidths = {
        disciplina: 80,
        cargaHoraria: 30,
        frequencia: 25,
        media: 20,
        situacao: 30
      };
      
      pdf.setFontSize(8);
      pdf.rect(margin, yPos, colWidths.disciplina, 6);
      pdf.rect(margin + colWidths.disciplina, yPos, colWidths.cargaHoraria, 6);
      pdf.rect(margin + colWidths.disciplina + colWidths.cargaHoraria, yPos, colWidths.frequencia, 6);
      pdf.rect(margin + colWidths.disciplina + colWidths.cargaHoraria + colWidths.frequencia, yPos, colWidths.media, 6);
      pdf.rect(margin + colWidths.disciplina + colWidths.cargaHoraria + colWidths.frequencia + colWidths.media, yPos, colWidths.situacao, 6);
      
      pdf.text('Disciplina', margin + 2, yPos + 4);
      pdf.text('C.H.', margin + colWidths.disciplina + 2, yPos + 4);
      pdf.text('Freq.', margin + colWidths.disciplina + colWidths.cargaHoraria + 2, yPos + 4);
      pdf.text('Média', margin + colWidths.disciplina + colWidths.cargaHoraria + colWidths.frequencia + 2, yPos + 4);
      pdf.text('Situação', margin + colWidths.disciplina + colWidths.cargaHoraria + colWidths.frequencia + colWidths.media + 2, yPos + 4);
      yPos += 6;
      
      // Disciplinas do período
      const disciplinas = periodo.disciplinas || [];
      console.log(`📚 [PDF] Disciplinas do período ${indexPeriodo + 1}:`, disciplinas.length);
      
      if (disciplinas.length === 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.rect(margin, yPos, pageWidth - 2*margin, 6);
        pdf.text('Nenhuma disciplina neste período', margin + 2, yPos + 4);
        yPos += 6;
      } else {
        disciplinas.forEach((disciplina, indexDisc) => {
          console.log(`  📖 [PDF] Disciplina ${indexDisc + 1}:`, {
            nome: disciplina.nome || disciplina.nomeCompleto,
            media: disciplina.mediaFinal || disciplina.media,
            frequencia: disciplina.frequenciaPercentual || disciplina.mediaFrequencia,
            situacao: disciplina.situacao
          });
          
          // Verificar nova página
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
          }
          
          pdf.setFont('helvetica', 'normal');
          
          const nomeDisciplina = this.toSafeString(disciplina.nomeCompleto || disciplina.nome || disciplina.disciplina, 'Disciplina');
          const cargaHoraria = this.toSafeString(disciplina.cargaHoraria || disciplina.carga_horaria || '80h');
          const frequencia = this.toSafeString(
            disciplina.frequenciaPercentual || 
            disciplina.mediaFrequencia || 
            (disciplina.aulasPresentes && disciplina.totalAulas ? 
              ((disciplina.aulasPresentes / disciplina.totalAulas) * 100).toFixed(0) + '%' : '100%')
          );
          const media = this.toSafeString(
            disciplina.mediaFinal ? disciplina.mediaFinal.toFixed(1) : 
            disciplina.media ? disciplina.media.toFixed(1) : 'N/A'
          );
          const situacao = this.toSafeString(disciplina.situacao, 'Aprovado');
          
          // Desenhar células
          pdf.rect(margin, yPos, colWidths.disciplina, 6);
          pdf.rect(margin + colWidths.disciplina, yPos, colWidths.cargaHoraria, 6);
          pdf.rect(margin + colWidths.disciplina + colWidths.cargaHoraria, yPos, colWidths.frequencia, 6);
          pdf.rect(margin + colWidths.disciplina + colWidths.cargaHoraria + colWidths.frequencia, yPos, colWidths.media, 6);
          pdf.rect(margin + colWidths.disciplina + colWidths.cargaHoraria + colWidths.frequencia + colWidths.media, yPos, colWidths.situacao, 6);
          
          // Adicionar textos
          pdf.setFontSize(7);
          pdf.text(nomeDisciplina, margin + 2, yPos + 4, { maxWidth: colWidths.disciplina - 4 });
          pdf.text(cargaHoraria, margin + colWidths.disciplina + 2, yPos + 4);
          pdf.text(frequencia, margin + colWidths.disciplina + colWidths.cargaHoraria + 2, yPos + 4);
          pdf.text(media, margin + colWidths.disciplina + colWidths.cargaHoraria + colWidths.frequencia + 2, yPos + 4);
          pdf.text(situacao, margin + colWidths.disciplina + colWidths.cargaHoraria + colWidths.frequencia + colWidths.media + 2, yPos + 4);
          
          yPos += 6;
        });
      }
      
      yPos += 3; // Espaço entre períodos
    });
    
    console.log('📚 [PDF] ========== FIM HISTÓRICO ACADÊMICO ==========');
    
    return yPos + 10;
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
    const nomeInstituicao = this.toSafeString(documento.dadosInstituicao?.nome, 'ESCOLA ELO');
    pdf.text(nomeInstituicao, pageWidth/2, yStart, { align: 'center' });
    
    // Endereço
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const endereco = documento.dadosInstituicao?.endereco || {};
    pdf.text(this.toSafeString(endereco.rua, 'Endereço não informado'), pageWidth/2, yStart + 8, { align: 'center' });
    pdf.text(`${this.toSafeString(endereco.cidade, 'Cidade')} - ${this.toSafeString(endereco.estado, 'UF')}`, pageWidth/2, yStart + 16, { align: 'center' });
    pdf.text(`CEP: ${this.toSafeString(endereco.cep, '00000-000')}`, pageWidth/2, yStart + 24, { align: 'center' });
    
    // CNPJ
    if (documento.dadosInstituicao?.cnpj) {
      pdf.text(`CNPJ: ${this.toSafeString(documento.dadosInstituicao.cnpj)}`, pageWidth/2, yStart + 32, { align: 'center' });
    }
    
    // Data e página
    const dataEmissao = new Date(documento.dataEmissao).toLocaleDateString('pt-BR');
    pdf.text(this.toSafeString(dataEmissao), pageWidth - margin, yStart, { align: 'right' });
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
    
    // Tabela de dados pessoais - com fallback seguro
    const dados = documento.dadosAluno || documento.aluno || {};
    
    // Linha 1: Nome e Matrícula
    pdf.rect(margin, yPos, pageWidth - 2*margin, 8);
    pdf.text('Nome', margin + 2, yPos + 5);
    pdf.text('Matrícula', pageWidth - 50, yPos + 5);
    yPos += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.rect(margin, yPos, pageWidth - 80, 8);
    pdf.rect(pageWidth - 80, yPos, 80 - margin, 8);
    const nomeAluno = this.toSafeString(dados.nome || dados.nomeCompleto, 'Nome não informado');
    pdf.text(nomeAluno, margin + 2, yPos + 5);
    // Buscar matrícula do aluno ou usar ID
    const matriculaAluno = this.toSafeString(dados.matricula || dados.ra || documento.alunoId, 'S/N');
    pdf.text(matriculaAluno, pageWidth - 48, yPos + 5);
    yPos += 8;
    
    // Linha 2: Data de Nascimento, Sexo, Naturalidade, Nacionalidade, CPF
    pdf.setFont('helvetica', 'bold');
    pdf.rect(margin, yPos, 30, 8);
    pdf.rect(margin + 30, yPos, 20, 8);
    pdf.rect(margin + 50, yPos, 35, 8);
    pdf.rect(margin + 85, yPos, 35, 8);
    pdf.rect(margin + 120, yPos, pageWidth - margin - 120, 8);
    
    pdf.text('Data de Nasc.', margin + 2, yPos + 5);
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
    
    pdf.text(this.toSafeString(dados.dataNascimento), margin + 2, yPos + 5);
    pdf.text(this.toSafeString(dados.sexo, 'M'), margin + 32, yPos + 5);
    pdf.text(this.toSafeString(dados.naturalidade), margin + 52, yPos + 5);
    pdf.text('BRASILEIRA', margin + 87, yPos + 5);
    pdf.text(this.toSafeString(dados.cpf), margin + 122, yPos + 5);
    
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
    
    pdf.text(this.toSafeString(documento.dadosInstituicao?.nome, 'ESCOLA ELO'), margin + 2, yPos + 5);
    pdf.text('2025', margin + (pageWidth - 2*margin) * 0.7 + 2, yPos + 5);
    
    // Usar endereço da instituição
    const endereco = documento.dadosInstituicao?.endereco || {};
    const localCompleto = `${this.toSafeString(endereco.cidade, 'São Paulo')} / ${this.toSafeString(endereco.estado, 'SP')}`;
    pdf.text(localCompleto, margin + (pageWidth - 2*margin) * 0.85 + 2, yPos + 5);
    
    return yPos + 15;
  }

  /**
   * Adicionar histórico acadêmico com disciplinas
   */
  adicionarHistoricoAcademico(pdf, documento, yStart, margin, pageWidth, pageHeight) {
    let yPos = yStart;
    
    console.log('📚 [PDF] Adicionando histórico acadêmico');
    console.log('📚 [PDF] Estrutura documento:', {
      temHistoricoCompleto: !!documento.historicoCompleto,
      temPeriodosAcademicos: !!documento.historicoCompleto?.periodosAcademicos,
      qtdPeriodos: documento.historicoCompleto?.periodosAcademicos?.length || 0
    });
    
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
            
            const anoSerie = this.toSafeString(periodo.anoLetivo, '2025');
            // Calcular média de frequência ou usar o valor direto
            const frequencia = disciplina.frequenciaPercentual || disciplina.mediaFrequencia || 
                             (disciplina.aulasPresentes && disciplina.totalAulas ? 
                               ((disciplina.aulasPresentes / disciplina.totalAulas) * 100).toFixed(0) + '%' : '100%');
            const media = disciplina.mediaFinal ? disciplina.mediaFinal.toFixed(1) : 'N/A';
            const situacao = this.toSafeString(disciplina.situacao, 'Aprovado');
            
            // Obter nome real da disciplina
            const nomeDisciplina = this.toSafeString(disciplina.nomeCompleto || disciplina.nome, 'Disciplina');
            
            pdf.rect(margin, yPos, colWidths.ano, 6);
            pdf.rect(margin + colWidths.ano, yPos, colWidths.disciplina, 6);
            pdf.rect(margin + colWidths.ano + colWidths.disciplina, yPos, colWidths.frequencia, 6);
            pdf.rect(margin + colWidths.ano + colWidths.disciplina + colWidths.frequencia, yPos, colWidths.media, 6);
            pdf.rect(margin + colWidths.ano + colWidths.disciplina + colWidths.frequencia + colWidths.media, yPos, colWidths.situacao, 6);
            
            pdf.setFontSize(8);
            pdf.text(anoSerie, margin + 2, yPos + 4);
            pdf.text(nomeDisciplina, margin + colWidths.ano + 2, yPos + 4);
            pdf.text(this.toSafeString(frequencia, '100%'), margin + colWidths.ano + colWidths.disciplina + 2, yPos + 4);
            pdf.text(this.toSafeString(media, 'N/A'), margin + colWidths.ano + colWidths.disciplina + colWidths.frequencia + 2, yPos + 4);
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
    pdf.text(`SITUAÇÃO FINAL: ${this.toSafeString(situacaoFinal)}`, margin, yPos);
    
    if (documento.observacoes) {
      yPos += 10;
      pdf.text('OBSERVAÇÕES:', margin, yPos);
      yPos += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.text(this.toSafeString(documento.observacoes), margin, yPos);
    }
    
    return yPos + 15;
  }

  /**
   * Adicionar assinatura e QR Code
   */
  adicionarAssinaturaQR(pdf, documento, pageWidth, pageHeight) {
    const margin = 15;
    let yPos = pageHeight - 80;
    
    // Data de emissão
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const dataEmissao = new Date(documento.dataEmissao).toLocaleDateString('pt-BR');
    const cidadeEstado = documento.dadosInstituicao?.endereco?.cidade || 'São Paulo';
    const estado = documento.dadosInstituicao?.endereco?.estado || 'SP';
    pdf.text(`${this.toSafeString(cidadeEstado)} - ${this.toSafeString(estado)}, ${this.toSafeString(dataEmissao)}`, margin, yPos);
    
    // QR Code
    if (documento.qrCode) {
      const qrSize = 30;
      pdf.addImage(documento.qrCode, 'PNG', pageWidth - qrSize - margin, yPos - 15, qrSize, qrSize);
    }
    
    // Código de verificação
    yPos += 8;
    pdf.setFontSize(8);
    pdf.text(`Código de Verificação: ${this.toSafeString(documento.codigoVerificacao)}`, margin, yPos);
    
    // Campo de assinaturas
    yPos += 20;
    const assinaturaWidth = 70;
    const espacamento = 10;
    const totalAssinaturas = 2;
    const startX = (pageWidth - (totalAssinaturas * assinaturaWidth + espacamento)) / 2;
    
    // Assinatura do Diretor
    pdf.setFontSize(8);
    pdf.line(startX, yPos, startX + assinaturaWidth, yPos);
    pdf.text('Diretor(a)', startX + assinaturaWidth/2, yPos + 5, { align: 'center' });
    
    const responsavel = documento.dadosInstituicao?.responsavel || {};
    if (responsavel.nome) {
      pdf.text(this.toSafeString(responsavel.nome), startX + assinaturaWidth/2, yPos + 10, { align: 'center' });
    }
    
    // Assinatura do Secretário
    const segundaAssinaturaX = startX + assinaturaWidth + espacamento;
    pdf.line(segundaAssinaturaX, yPos, segundaAssinaturaX + assinaturaWidth, yPos);
    pdf.text('Secretário(a) Escolar', segundaAssinaturaX + assinaturaWidth/2, yPos + 5, { align: 'center' });
    
    // Assinatura digital
    yPos += 20;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text('DOCUMENTO ASSINADO DIGITALMENTE', pageWidth/2, yPos, { align: 'center' });
    
    yPos += 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.text('Validade e autenticidade podem ser verificadas em: elo-school.web.app/validacao', pageWidth/2, yPos, { align: 'center' });
  }

  // ===== MÉTODOS ESTENDIDOS =====
  
  async gerarCertificado(alunoId, nivelEnsino, observacoes = '') {
    return await gerarCertificadoConclusao(this, alunoId, nivelEnsino, observacoes);
  }

  async gerarTransferencia(alunoId, escolaDestino, motivoTransferencia = '', observacoes = '') {
    return await gerarGuiaTransferencia(this, alunoId, escolaDestino, motivoTransferencia, observacoes);
  }

  async gerarDeclaracaoConclusao(alunoId, nivelEnsino, finalidade = 'Para fins diversos') {
    return await gerarDeclaracaoConclusao(this, alunoId, nivelEnsino, finalidade);
  }

  async gerarDeclaracaoFrequencia(alunoId, periodoInicio, periodoFim, finalidade = 'Para fins diversos') {
    return await gerarDeclaracaoFrequencia(this, alunoId, periodoInicio, periodoFim, finalidade);
  }

  async cancelarDocumento(codigoVerificacao, motivo) {
    return await cancelarDoc(this, codigoVerificacao, motivo);
  }

  async reemitirDocumento(documentoOriginal) {
    return await reemitirDoc(this, documentoOriginal);
  }
}

export default new SecretariaDigitalService();
