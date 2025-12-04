/**
 * Utilitário para Geração de PDFs de Documentos Escolares
 * Layout profissional conforme normas do MEC
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class PDFGenerator {
  constructor(documento, logoBase64 = null) {
    this.doc = new jsPDF();
    this.documento = documento;
    this.logo = logoBase64;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margin = 20;
    this.currentY = this.margin;
  }

  // Adicionar cabeçalho oficial
  addHeader() {
    const instituicao = this.documento.dadosInstituicao || {};
    
    // Logo (se existir)
    if (this.logo) {
      try {
        this.doc.addImage(this.logo, 'PNG', this.margin, this.margin, 30, 30);
      } catch (error) {
        console.warn('Erro ao adicionar logo:', error);
      }
    }

    // Dados da instituição
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    const nomeInstituicao = instituicao.nome || 'ESCOLA ELO';
    this.doc.text(nomeInstituicao, this.pageWidth / 2, this.margin + 10, { align: 'center' });

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const endereco = instituicao.endereco || {};
    const enderecoCompleto = `${endereco.rua || ''}, ${endereco.numero || ''} - ${endereco.bairro || ''} - ${endereco.cidade || ''}/${endereco.estado || ''} - CEP: ${endereco.cep || ''}`;
    this.doc.text(enderecoCompleto, this.pageWidth / 2, this.margin + 17, { align: 'center' });
    
    if (instituicao.telefone) {
      this.doc.text(`Tel: ${instituicao.telefone} | Email: ${instituicao.email || ''}`, this.pageWidth / 2, this.margin + 22, { align: 'center' });
    }
    
    if (instituicao.cnpj) {
      this.doc.text(`CNPJ: ${instituicao.cnpj}`, this.pageWidth / 2, this.margin + 27, { align: 'center' });
    }

    // Linha separadora
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.margin + 32, this.pageWidth - this.margin, this.margin + 32);
    
    this.currentY = this.margin + 40;
  }

  // Adicionar rodapé com QR Code e validação
  addFooter(pageNumber = 1) {
    const footerY = this.pageHeight - 30;
    
    // Linha separadora
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY);

    // QR Code (lado esquerdo)
    if (this.documento.qrCode) {
      try {
        this.doc.addImage(this.documento.qrCode, 'PNG', this.margin, footerY + 5, 20, 20);
      } catch (error) {
        console.warn('Erro ao adicionar QR Code:', error);
      }
    }

    // Código de verificação e validação (centro)
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('AUTENTICIDADE DO DOCUMENTO', this.pageWidth / 2, footerY + 8, { align: 'center' });
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Código de Verificação: ${this.documento.codigoVerificacao}`, this.pageWidth / 2, footerY + 13, { align: 'center' });
    this.doc.text(`Valide em: ${typeof window !== 'undefined' ? window.location.origin : 'https://elo-school.web.app'}/validacao`, this.pageWidth / 2, footerY + 18, { align: 'center' });

    // Data de emissão e página (direita)
    this.doc.text(`Emitido em: ${new Date(this.documento.dataEmissao).toLocaleDateString('pt-BR')}`, this.pageWidth - this.margin, footerY + 13, { align: 'right' });
    this.doc.text(`Página ${pageNumber}`, this.pageWidth - this.margin, footerY + 18, { align: 'right' });

    // Assinatura digital
    if (this.documento.assinatura) {
      this.doc.setFontSize(7);
      this.doc.text('Documento assinado digitalmente', this.pageWidth / 2, footerY + 23, { align: 'center' });
    }
  }

  // Adicionar título do documento
  addTitle(titulo, subtitulo = null) {
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(titulo.toUpperCase(), this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 10;

    if (subtitulo) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(subtitulo, this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 8;
    }

    this.currentY += 5;
  }

  // Adicionar seção
  addSection(titulo, conteudo) {
    // Verificar espaço na página
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = this.margin;
      this.addFooter(2);
    }

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 102, 204); // Azul
    this.doc.text(titulo, this.margin, this.currentY);
    this.currentY += 7;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0); // Preto

    if (typeof conteudo === 'string') {
      const lines = this.doc.splitTextToSize(conteudo, this.pageWidth - (this.margin * 2));
      this.doc.text(lines, this.margin, this.currentY);
      this.currentY += lines.length * 5 + 5;
    } else if (Array.isArray(conteudo)) {
      conteudo.forEach(item => {
        const lines = this.doc.splitTextToSize(item, this.pageWidth - (this.margin * 2));
        this.doc.text(lines, this.margin, this.currentY);
        this.currentY += lines.length * 5 + 2;
      });
      this.currentY += 3;
    }
  }

  // Adicionar tabela
  addTable(headers, rows, titulo = null) {
    if (titulo) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(titulo, this.margin, this.currentY);
      this.currentY += 7;
    }

    this.doc.autoTable({
      startY: this.currentY,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        // Atualizar currentY após a tabela
        this.currentY = data.cursor.y + 10;
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  // Adicionar dados do aluno
  addDadosAluno() {
    const aluno = this.documento.dadosAluno || {};
    
    this.addSection('DADOS DO ALUNO', [
      `Nome: ${aluno.nome || 'N/A'}`,
      `CPF: ${aluno.cpf || 'N/A'}`,
      `RG: ${aluno.rg || 'N/A'}`,
      `Data de Nascimento: ${aluno.dataNascimento ? new Date(aluno.dataNascimento).toLocaleDateString('pt-BR') : 'N/A'}`,
      `Filiação: ${aluno.filiacao || aluno.nomePai || aluno.nomeMae || 'N/A'}`
    ]);
  }

  // Adicionar assinatura
  addAssinatura() {
    const responsavel = this.documento.dadosInstituicao?.responsavel || {};
    
    this.currentY += 20;
    
    if (this.currentY > this.pageHeight - 100) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    const assinaturaX = this.pageWidth / 2;
    
    // Linha de assinatura
    this.doc.line(assinaturaX - 40, this.currentY, assinaturaX + 40, this.currentY);
    this.currentY += 5;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(responsavel.nome || 'Diretor(a)', assinaturaX, this.currentY, { align: 'center' });
    this.currentY += 5;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(responsavel.cargo || 'Diretor(a) Escolar', assinaturaX, this.currentY, { align: 'center' });
    this.currentY += 5;
    
    if (responsavel.cpf) {
      this.doc.text(`CPF: ${responsavel.cpf}`, assinaturaX, this.currentY, { align: 'center' });
    }
  }

  // Gerar e retornar o PDF
  generate() {
    return this.doc;
  }

  // Salvar PDF
  save(filename) {
    this.doc.save(filename);
  }
}

// Função auxiliar para formatar nota
export function formatarNota(nota) {
  if (nota === null || nota === undefined) return 'N/A';
  return typeof nota === 'number' ? nota.toFixed(1) : nota;
}

// Função auxiliar para formatar frequência
export function formatarFrequencia(frequencia) {
  if (frequencia === null || frequencia === undefined) return 'N/A';
  return `${frequencia}%`;
}

// Função auxiliar para determinar situação
export function determinarSituacao(media, frequencia, mediaMinima = 6.0, frequenciaMinima = 75) {
  if (!media || !frequencia) return 'Pendente';
  if (media >= mediaMinima && frequencia >= frequenciaMinima) return 'Aprovado';
  if (media < mediaMinima && frequencia >= frequenciaMinima) return 'Reprovado por Nota';
  if (media >= mediaMinima && frequencia < frequenciaMinima) return 'Reprovado por Falta';
  return 'Reprovado';
}
