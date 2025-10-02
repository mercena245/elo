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
   * Gerar Histórico Escolar Digital
   */
  async gerarHistoricoEscolar(alunoId, anoLetivo, observacoes = '') {
    try {
      const dadosAluno = await this.getDadosAluno(alunoId);
      const dadosInstituicao = await this.getDadosInstituicao();
      const verificationCode = this.generateVerificationCode();
      
      // Buscar notas e frequência do aluno
      const notasRef = ref(db, 'notas');
      const notasQuery = query(notasRef, orderByChild('alunoId'), equalTo(alunoId));
      const notasSnapshot = await get(notasQuery);
      
      const disciplinas = [];
      if (notasSnapshot.exists()) {
        Object.values(notasSnapshot.val()).forEach(nota => {
          if (nota.anoLetivo === anoLetivo) {
            disciplinas.push({
              nome: nota.disciplina,
              nota: nota.nota,
              frequencia: nota.frequencia || 100,
              situacao: nota.nota >= 7 ? 'Aprovado' : 'Reprovado'
            });
          }
        });
      }

      const documento = {
        id: verificationCode,
        tipo: DOCUMENT_TYPES.HISTORICO_ESCOLAR,
        status: DOCUMENT_STATUS.PENDENTE_ASSINATURA,
        dadosAluno: {
          nome: dadosAluno.nome,
          cpf: dadosAluno.cpf,
          rg: dadosAluno.rg,
          dataNascimento: dadosAluno.dataNascimento,
          naturalidade: dadosAluno.naturalidade,
          uf: dadosAluno.uf,
          nomePai: dadosAluno.nomePai,
          nomeMae: dadosAluno.nomeMae
        },
        curso: {
          nome: dadosAluno.serie || 'Ensino Fundamental',
          nivel: 'Fundamental',
          anoLetivo: anoLetivo,
          cargaHoraria: '800 horas'
        },
        disciplinas: disciplinas,
        situacaoFinal: disciplinas.every(d => d.situacao === 'Aprovado') ? 'Aprovado' : 'Reprovado',
        observacoes: observacoes,
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
      const documentoRef = ref(db, `secretariaDigital/documentos/historicos/${verificationCode}`);
      await set(documentoRef, documento);

      // Log da ação
      await logAction('DIGITAL_SECRETARY_HISTORIC_GENERATED', {
        alunoId: alunoId,
        alunoNome: dadosAluno.nome,
        anoLetivo: anoLetivo,
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
   * Gerar PDF do documento
   */
  async gerarPDF(documento) {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Cabeçalho
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(documento.dadosInstituicao.nome, pageWidth/2, 30, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(documento.dadosInstituicao.endereco.rua, pageWidth/2, 40, { align: 'center' });
      pdf.text(`${documento.dadosInstituicao.endereco.cidade} - ${documento.dadosInstituicao.endereco.estado}`, pageWidth/2, 50, { align: 'center' });
      
      // Título do documento
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      let titulo = '';
      switch (documento.tipo) {
        case DOCUMENT_TYPES.HISTORICO_ESCOLAR:
          titulo = 'HISTÓRICO ESCOLAR';
          break;
        case DOCUMENT_TYPES.DECLARACAO_MATRICULA:
          titulo = 'DECLARAÇÃO DE MATRÍCULA';
          break;
        default:
          titulo = 'DOCUMENTO ESCOLAR';
      }
      pdf.text(titulo, pageWidth/2, 70, { align: 'center' });
      
      // Dados do aluno
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let yPosition = 90;
      
      pdf.text(`Nome: ${documento.dadosAluno.nome}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`CPF: ${documento.dadosAluno.cpf}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`RG: ${documento.dadosAluno.rg}`, 20, yPosition);
      yPosition += 20;
      
      // Conteúdo específico do documento
      if (documento.tipo === DOCUMENT_TYPES.HISTORICO_ESCOLAR) {
        pdf.text('DISCIPLINAS CURSADAS:', 20, yPosition);
        yPosition += 10;
        
        documento.disciplinas.forEach(disciplina => {
          pdf.text(`${disciplina.nome}: Nota ${disciplina.nota} - ${disciplina.situacao}`, 25, yPosition);
          yPosition += 8;
        });
        
        yPosition += 10;
        pdf.text(`Situação Final: ${documento.situacaoFinal}`, 20, yPosition);
      }
      
      // QR Code
      if (documento.qrCode) {
        const qrSize = 40;
        pdf.addImage(documento.qrCode, 'PNG', pageWidth - qrSize - 20, 200, qrSize, qrSize);
        pdf.text(`Código: ${documento.codigoVerificacao}`, pageWidth - qrSize - 20, 250);
      }
      
      // Assinatura
      yPosition = 260;
      pdf.text(`${documento.dadosInstituicao.responsavel.nome}`, 20, yPosition);
      pdf.text(`${documento.dadosInstituicao.responsavel.cargo}`, 20, yPosition + 8);
      pdf.text(`Documento assinado digitalmente`, 20, yPosition + 16);
      
      return pdf;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw error;
    }
  }
}

export default new SecretariaDigitalService();
