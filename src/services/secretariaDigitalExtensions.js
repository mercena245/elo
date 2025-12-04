/**
 * Extensões do Secretaria Digital Service
 * Funções adicionais para Certificados, Transferências e Declarações
 */

import { db, ref, push, set, get } from '../firebase';
import { logAction } from './auditService';

// Reutilizar tipos do serviço principal
const DOCUMENT_TYPES = {
  HISTORICO_ESCOLAR: 'historico_escolar',
  CERTIFICADO: 'certificado',
  DIPLOMA: 'diploma',
  DECLARACAO_MATRICULA: 'declaracao_matricula',
  DECLARACAO_CONCLUSAO: 'declaracao_conclusao',
  DECLARACAO_FREQUENCIA: 'declaracao_frequencia',
  TRANSFERENCIA: 'transferencia',
  ATA_RESULTADOS: 'ata_resultados'
};

const DOCUMENT_STATUS = {
  RASCUNHO: 'rascunho',
  PENDENTE_ASSINATURA: 'pendente_assinatura',
  ASSINADO: 'assinado',
  VALIDADO: 'validado',
  CANCELADO: 'cancelado'
};

/**
 * Gerar Certificado de Conclusão
 */
export async function gerarCertificadoConclusao(service, alunoId, nivelEnsino = 'Ensino Fundamental', observacoes = '') {
  try {
    const dadosAluno = await service.getDadosAluno(alunoId);
    const dadosInstituicao = await service.getDadosInstituicao();
    const verificationCode = service.generateVerificationCode();

    const anoAtual = new Date().getFullYear();

    const documento = {
      id: verificationCode,
      tipo: DOCUMENT_TYPES.CERTIFICADO,
      status: DOCUMENT_STATUS.PENDENTE_ASSINATURA,
      dadosAluno: {
        nome: dadosAluno.nome,
        cpf: dadosAluno.cpf,
        rg: dadosAluno.rg,
        dataNascimento: dadosAluno.dataNascimento,
        naturalidade: dadosAluno.naturalidade || 'Não informado',
        nacionalidade: 'Brasileira'
      },
      certificacao: {
        nivelEnsino: nivelEnsino,
        anoLetivo: anoAtual,
        serie: dadosAluno.serie || 'Não informado',
        turma: dadosAluno.turma || 'Não informado',
        dataInicio: dadosAluno.dataMatricula || `01/02/${anoAtual}`,
        dataConclusao: new Date().toLocaleDateString('pt-BR'),
        resultado: 'APROVADO'
      },
      observacoes: observacoes,
      dadosInstituicao: dadosInstituicao,
      dataEmissao: new Date().toISOString(),
      codigoVerificacao: verificationCode
    };

    // Gerar QR Code
    const qrCode = await service.generateQRCode(verificationCode);
    documento.qrCode = qrCode;

    // Simular assinatura digital
    const assinatura = await service.simularAssinaturaDigital(documento, dadosInstituicao.responsavel);
    documento.assinatura = assinatura;
    documento.status = DOCUMENT_STATUS.ASSINADO;

    // Sanitizar e salvar no Firebase
    const documentoSanitizado = service.sanitizarDocumento(documento);
    const documentoRef = ref(db, `secretariaDigital/documentos/certificados/${verificationCode}`);
    await set(documentoRef, documentoSanitizado);

    // Log da ação
    await logAction('DIGITAL_SECRETARY_CERTIFICATE_GENERATED', {
      alunoId: alunoId,
      alunoNome: dadosAluno.nome,
      nivelEnsino: nivelEnsino,
      codigoVerificacao: verificationCode
    });

    return documento;
  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    throw error;
  }
}

/**
 * Gerar Guia de Transferência
 */
export async function gerarGuiaTransferencia(service, alunoId, escolaDestino = '', motivoTransferencia = '', observacoes = '') {
  try {
    const dadosAluno = await service.getDadosAluno(alunoId);
    const dadosInstituicao = await service.getDadosInstituicao();
    const verificationCode = service.generateVerificationCode();

    // Buscar histórico acadêmico completo
    const historicoAcademico = dadosAluno.historicoAcademico || {};
    const periodosAcademicos = [];

    // Processar todos os períodos disponíveis
    for (const [ano, periodos] of Object.entries(historicoAcademico)) {
      for (const [periodo, dadosPeriodo] of Object.entries(periodos)) {
        if (dadosPeriodo && typeof dadosPeriodo === 'object') {
          const disciplinas = [];
          
          if (dadosPeriodo.disciplinas) {
            for (const [discId, dadosDisc] of Object.entries(dadosPeriodo.disciplinas)) {
              const nomeDisciplina = await service.getNomeDisciplina(discId);
              disciplinas.push({
                nome: nomeDisciplina,
                mediaFinal: dadosDisc.mediaFinal || 0,
                frequenciaPercentual: dadosDisc.frequenciaPercentual || 100,
                situacao: dadosDisc.situacao || 'Aprovado'
              });
            }
          }

          periodosAcademicos.push({
            anoLetivo: ano,
            periodoLetivo: periodo,
            disciplinas: disciplinas,
            resultadoFinal: dadosPeriodo.resultadoFinal || 'Aprovado'
          });
        }
      }
    }

    const documento = {
      id: verificationCode,
      tipo: DOCUMENT_TYPES.TRANSFERENCIA,
      status: DOCUMENT_STATUS.PENDENTE_ASSINATURA,
      dadosAluno: {
        nome: dadosAluno.nome,
        cpf: dadosAluno.cpf,
        rg: dadosAluno.rg,
        dataNascimento: dadosAluno.dataNascimento,
        naturalidade: dadosAluno.naturalidade || 'Não informado',
        filiacao: dadosAluno.nomePai || dadosAluno.nomeMae || 'Não informado'
      },
      transferencia: {
        escolaOrigem: dadosInstituicao.nome,
        escolaDestino: escolaDestino,
        motivoTransferencia: motivoTransferencia,
        dataTransferencia: new Date().toLocaleDateString('pt-BR'),
        serieAtual: dadosAluno.serie || 'Não informado',
        turmaAtual: dadosAluno.turma || 'Não informado',
        situacao: 'Regular'
      },
      historicoCompleto: {
        periodosAcademicos: periodosAcademicos,
        observacoes: dadosAluno.observacoes || ''
      },
      observacoes: observacoes,
      dadosInstituicao: dadosInstituicao,
      dataEmissao: new Date().toISOString(),
      codigoVerificacao: verificationCode
    };

    // Gerar QR Code
    const qrCode = await service.generateQRCode(verificationCode);
    documento.qrCode = qrCode;

    // Simular assinatura digital
    const assinatura = await service.simularAssinaturaDigital(documento, dadosInstituicao.responsavel);
    documento.assinatura = assinatura;
    documento.status = DOCUMENT_STATUS.ASSINADO;

    // Sanitizar e salvar no Firebase
    const documentoSanitizado = service.sanitizarDocumento(documento);
    const documentoRef = ref(db, `secretariaDigital/documentos/transferencias/${verificationCode}`);
    await set(documentoRef, documentoSanitizado);

    // Log da ação
    await logAction('DIGITAL_SECRETARY_TRANSFER_GENERATED', {
      alunoId: alunoId,
      alunoNome: dadosAluno.nome,
      escolaDestino: escolaDestino,
      codigoVerificacao: verificationCode
    });

    return documento;
  } catch (error) {
    console.error('Erro ao gerar guia de transferência:', error);
    throw error;
  }
}

/**
 * Gerar Declaração de Conclusão
 */
export async function gerarDeclaracaoConclusao(service, alunoId, nivelEnsino = 'Ensino Fundamental', finalidade = 'Para fins diversos') {
  try {
    const dadosAluno = await service.getDadosAluno(alunoId);
    const dadosInstituicao = await service.getDadosInstituicao();
    const verificationCode = service.generateVerificationCode();

    const documento = {
      id: verificationCode,
      tipo: DOCUMENT_TYPES.DECLARACAO_CONCLUSAO,
      status: DOCUMENT_STATUS.PENDENTE_ASSINATURA,
      dadosAluno: {
        nome: dadosAluno.nome,
        cpf: dadosAluno.cpf,
        rg: dadosAluno.rg,
        dataNascimento: dadosAluno.dataNascimento
      },
      declaracao: {
        tipo: 'Conclusão de Curso',
        nivelEnsino: nivelEnsino,
        anoLetivo: new Date().getFullYear(),
        dataConclusao: new Date().toLocaleDateString('pt-BR'),
        situacao: 'Concluído com aprovação'
      },
      finalidade: finalidade,
      dadosInstituicao: dadosInstituicao,
      dataEmissao: new Date().toISOString(),
      codigoVerificacao: verificationCode
    };

    // Gerar QR Code
    const qrCode = await service.generateQRCode(verificationCode);
    documento.qrCode = qrCode;

    // Simular assinatura digital
    const assinatura = await service.simularAssinaturaDigital(documento, dadosInstituicao.responsavel);
    documento.assinatura = assinatura;
    documento.status = DOCUMENT_STATUS.ASSINADO;

    // Sanitizar e salvar
    const documentoSanitizado = service.sanitizarDocumento(documento);
    const documentoRef = ref(db, `secretariaDigital/documentos/declaracoes/${verificationCode}`);
    await set(documentoRef, documentoSanitizado);

    await logAction('DIGITAL_SECRETARY_DECLARATION_CONCLUSION_GENERATED', {
      alunoId: alunoId,
      alunoNome: dadosAluno.nome,
      nivelEnsino: nivelEnsino,
      codigoVerificacao: verificationCode
    });

    return documento;
  } catch (error) {
    console.error('Erro ao gerar declaração de conclusão:', error);
    throw error;
  }
}

/**
 * Gerar Declaração de Frequência
 */
export async function gerarDeclaracaoFrequencia(service, alunoId, periodoInicio, periodoFim, finalidade = 'Para fins diversos') {
  try {
    const dadosAluno = await service.getDadosAluno(alunoId);
    const dadosInstituicao = await service.getDadosInstituicao();
    const verificationCode = service.generateVerificationCode();

    // Calcular frequência do período (simplificado - em produção, buscar do banco)
    const frequenciaMedia = 95; // Placeholder - implementar cálculo real

    const documento = {
      id: verificationCode,
      tipo: DOCUMENT_TYPES.DECLARACAO_FREQUENCIA,
      status: DOCUMENT_STATUS.PENDENTE_ASSINATURA,
      dadosAluno: {
        nome: dadosAluno.nome,
        cpf: dadosAluno.cpf,
        rg: dadosAluno.rg,
        dataNascimento: dadosAluno.dataNascimento
      },
      declaracao: {
        tipo: 'Frequência Escolar',
        periodoInicio: periodoInicio,
        periodoFim: periodoFim,
        serie: dadosAluno.serie || 'Não informado',
        turma: dadosAluno.turma || 'Não informado',
        frequenciaMedia: frequenciaMedia,
        situacao: frequenciaMedia >= 75 ? 'Frequência Regular' : 'Frequência Insuficiente'
      },
      finalidade: finalidade,
      dadosInstituicao: dadosInstituicao,
      dataEmissao: new Date().toISOString(),
      codigoVerificacao: verificationCode
    };

    // Gerar QR Code
    const qrCode = await service.generateQRCode(verificationCode);
    documento.qrCode = qrCode;

    // Simular assinatura digital
    const assinatura = await service.simularAssinaturaDigital(documento, dadosInstituicao.responsavel);
    documento.assinatura = assinatura;
    documento.status = DOCUMENT_STATUS.ASSINADO;

    // Sanitizar e salvar
    const documentoSanitizado = service.sanitizarDocumento(documento);
    const documentoRef = ref(db, `secretariaDigital/documentos/declaracoes/${verificationCode}`);
    await set(documentoRef, documentoSanitizado);

    await logAction('DIGITAL_SECRETARY_DECLARATION_FREQUENCY_GENERATED', {
      alunoId: alunoId,
      alunoNome: dadosAluno.nome,
      periodo: `${periodoInicio} a ${periodoFim}`,
      codigoVerificacao: verificationCode
    });

    return documento;
  } catch (error) {
    console.error('Erro ao gerar declaração de frequência:', error);
    throw error;
  }
}

/**
 * Cancelar Documento
 */
export async function cancelarDocumento(service, codigoVerificacao, motivo) {
  try {
    const tiposDocumento = ['historicos', 'declaracoes', 'certificados', 'transferencias'];
    
    for (const tipo of tiposDocumento) {
      const documentoRef = ref(db, `secretariaDigital/documentos/${tipo}/${codigoVerificacao}`);
      const snapshot = await get(documentoRef);
      
      if (snapshot.exists()) {
        const documento = snapshot.val();
        
        // Atualizar status
        await set(documentoRef, {
          ...documento,
          status: DOCUMENT_STATUS.CANCELADO,
          cancelamento: {
            data: new Date().toISOString(),
            motivo: motivo
          }
        });

        await logAction('DIGITAL_SECRETARY_DOCUMENT_CANCELLED', {
          codigoVerificacao: codigoVerificacao,
          tipoDocumento: documento.tipo,
          motivo: motivo,
          alunoNome: documento.dadosAluno?.nome
        });

        return { success: true, documento };
      }
    }

    throw new Error('Documento não encontrado');
  } catch (error) {
    console.error('Erro ao cancelar documento:', error);
    throw error;
  }
}

/**
 * Reemitir Documento (criar nova versão)
 */
export async function reemitirDocumento(service, documentoOriginal) {
  try {
    const novoCodigoVerificacao = service.generateVerificationCode();
    
    const novoDocumento = {
      ...documentoOriginal,
      id: novoCodigoVerificacao,
      codigoVerificacao: novoCodigoVerificacao,
      dataEmissao: new Date().toISOString(),
      reemissao: {
        documentoOriginal: documentoOriginal.codigoVerificacao,
        dataReemissao: new Date().toISOString()
      },
      status: DOCUMENT_STATUS.PENDENTE_ASSINATURA
    };

    // Gerar novo QR Code
    const qrCode = await service.generateQRCode(novoCodigoVerificacao);
    novoDocumento.qrCode = qrCode;

    // Nova assinatura
    const assinatura = await service.simularAssinaturaDigital(novoDocumento, documentoOriginal.dadosInstituicao.responsavel);
    novoDocumento.assinatura = assinatura;
    novoDocumento.status = DOCUMENT_STATUS.ASSINADO;

    // Determinar tipo de documento e salvar
    const tipoCategoria = documentoOriginal.tipoCategoria || 'declaracoes';
    const documentoRef = ref(db, `secretariaDigital/documentos/${tipoCategoria}/${novoCodigoVerificacao}`);
    await set(documentoRef, service.sanitizarDocumento(novoDocumento));

    await logAction('DIGITAL_SECRETARY_DOCUMENT_REISSUED', {
      codigoOriginal: documentoOriginal.codigoVerificacao,
      codigoNovo: novoCodigoVerificacao,
      tipoDocumento: documentoOriginal.tipo,
      alunoNome: documentoOriginal.dadosAluno?.nome
    });

    return novoDocumento;
  } catch (error) {
    console.error('Erro ao reemitir documento:', error);
    throw error;
  }
}
