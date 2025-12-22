import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

/**
 * Serviço para processamento de templates de contratos
 */
class ContratoTemplateService {
  /**
   * Formata CPF
   */
  formatarCPF(cpf) {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Formata CEP
   */
  formatarCEP(cep) {
    if (!cep) return '';
    const numeros = cep.replace(/\D/g, '');
    return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  /**
   * Formata telefone
   */
  formatarTelefone(telefone) {
    if (!telefone) return '';
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }

  /**
   * Formata valor monetário
   */
  formatarValor(valor) {
    if (!valor && valor !== 0) return 'R$ 0,00';
    const num = parseFloat(valor);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * Formata data para DD/MM/AAAA
   */
  formatarData(data) {
    if (!data) return '';
    try {
      let date;
      if (data instanceof Date) {
        date = data;
      } else if (typeof data === 'string' && data.includes('/')) {
        const [dia, mes, ano] = data.split('/');
        date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      } else {
        date = new Date(data);
      }
      
      if (!date || isNaN(date.getTime())) return '';
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  }

  /**
   * Formata data por extenso
   */
  formatarDataExtenso(data) {
    if (!data) return '';
    try {
      let date;
      if (data instanceof Date) {
        date = data;
      } else if (typeof data === 'string' && data.includes('/')) {
        const [dia, mes, ano] = data.split('/');
        date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      } else {
        date = new Date(data);
      }
      
      if (!date || isNaN(date.getTime())) return '';
      
      const dia = date.getDate();
      const meses = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      const mes = meses[date.getMonth()];
      const ano = date.getFullYear();
      return `${dia} de ${mes} de ${ano}`;
    } catch (error) {
      console.error('Erro ao formatar data por extenso:', error);
      return '';
    }
  }

  /**
   * Calcula idade a partir da data de nascimento
   */
  calcularIdade(dataNascimento) {
    if (!dataNascimento) return 0;
    try {
      const hoje = new Date();
      let nascimento;
      
      if (dataNascimento instanceof Date) {
        nascimento = dataNascimento;
      } else if (typeof dataNascimento === 'string' && dataNascimento.includes('/')) {
        const [dia, mes, ano] = dataNascimento.split('/');
        nascimento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      } else {
        nascimento = new Date(dataNascimento);
      }
      
      if (!nascimento || isNaN(nascimento.getTime())) return 0;
      
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const mes = hoje.getMonth() - nascimento.getMonth();
      if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }
      return idade;
    } catch (error) {
      console.error('Erro ao calcular idade:', error);
      return 0;
    }
  }

  /**
   * Extrai cidade do endereço
   */
  extrairCidade(endereco) {
    if (!endereco) return '';
    const match = endereco.match(/([A-ZÀ-Ú][a-zà-ú\s]+)\s*-\s*([A-Z]{2})/);
    return match ? match[1] : '';
  }

  /**
   * Extrai UF do endereço
   */
  extrairUF(endereco) {
    if (!endereco) return '';
    const match = endereco.match(/([A-Z]{2})\s*$/);
    return match ? match[1] : '';
  }

  /**
   * Obtém ano letivo do aluno
   */
  obterAnoLetivo(aluno) {
    // Primeira prioridade: período letivo da turma selecionada
    if (aluno.periodoLetivo?.ano) {
      return aluno.periodoLetivo.ano;
    }

    // Segunda prioridade: extrair ano do ID do período da turma
    if (aluno.turmaInfo?.periodoId) {
      const match = aluno.turmaInfo.periodoId.match(/^(\d{4})/);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // Terceira prioridade: ano baseado na data da matrícula/rematrícula
    if (aluno.dataRematricula) {
      return new Date(aluno.dataRematricula).getFullYear();
    }

    // Quarta prioridade: dados financeiros
    if (aluno.financeiro?.dataInicioCompetencia) {
      const data = new Date(aluno.financeiro.dataInicioCompetencia);
      if (data && !isNaN(data.getTime())) {
        return data.getFullYear();
      }
    }

    // Última opção: ano atual
    return new Date().getFullYear();
  }

  /**
   * Obtém nível de ensino baseado na turma
   */
  obterNivelEnsino(aluno) {
    const turma = (aluno.turma || '').toLowerCase();
    
    if (turma.includes('maternal') || turma.includes('berçário')) {
      return 'EDUCAÇÃO INFANTIL';
    }
    if (turma.includes('fundamental')) {
      return 'ENSINO FUNDAMENTAL';
    }
    if (turma.includes('médio')) {
      return 'ENSINO MÉDIO';
    }
    return 'EDUCAÇÃO BÁSICA';
  }

  /**
   * Obtém responsável financeiro
   */
  obterResponsavelFinanceiro(aluno) {
    if (aluno.mae?.responsavelFinanceiro) {
      return {
        tipo: 'MÃE',
        nome: aluno.mae.nome,
        cpf: this.formatarCPF(aluno.mae.cpf)
      };
    }
    if (aluno.pai?.responsavelFinanceiro) {
      return {
        tipo: 'PAI',
        nome: aluno.pai.nome,
        cpf: this.formatarCPF(aluno.pai.cpf)
      };
    }
    return {
      tipo: '',
      nome: '',
      cpf: ''
    };
  }

  /**
   * Prepara dados do aluno para o template
   */
  prepararDadosAluno(aluno, configEscola) {
    const dataHoje = new Date();
    const respFinanceiro = this.obterResponsavelFinanceiro(aluno);
    
    // Valores financeiros
    const valorMensalidade = parseFloat(aluno.financeiro?.mensalidadeValor) || 0;
    const descontoPercentual = parseFloat(aluno.financeiro?.descontoPercentual) || 0;
    const valorDesconto = valorMensalidade * (descontoPercentual / 100);
    const valorFinal = valorMensalidade - valorDesconto;

    return {
      // === DADOS DO ALUNO ===
      nomeAluno: aluno.nome?.toUpperCase() || 'NÃO INFORMADO',
      cpfAluno: this.formatarCPF(aluno.cpf),
      dataNascimento: this.formatarData(aluno.dataNascimento),
      idade: this.calcularIdade(aluno.dataNascimento).toString(),
      turma: aluno.turma || 'Não definida',
      turno: (aluno.turno || aluno.turmaInfo?.turno || 'NÃO DEFINIDO').toUpperCase(),
      nivelEnsino: this.obterNivelEnsino(aluno),
      anoLetivo: this.obterAnoLetivo(aluno).toString(),
      
      // === DADOS DA MÃE ===
      nomeMae: aluno.mae?.nome?.toUpperCase() || 'NÃO INFORMADO',
      cpfMae: this.formatarCPF(aluno.mae?.cpf),
      rgMae: aluno.mae?.rg || '',
      enderecoMae: aluno.mae?.endereco?.rua || '',
      bairroMae: aluno.mae?.endereco?.bairro || '',
      cidadeMae: aluno.mae?.endereco?.cidade || '',
      ufMae: aluno.mae?.endereco?.uf || '',
      cepMae: this.formatarCEP(aluno.mae?.endereco?.cep),
      telefoneMae: this.formatarTelefone(aluno.mae?.telefone),
      emailMae: aluno.mae?.email || '',
      
      // === DADOS DO PAI ===
      nomePai: aluno.pai?.nome?.toUpperCase() || 'NÃO INFORMADO',
      cpfPai: this.formatarCPF(aluno.pai?.cpf),
      rgPai: aluno.pai?.rg || '',
      enderecoPai: aluno.pai?.endereco?.rua || '',
      bairroPai: aluno.pai?.endereco?.bairro || '',
      cidadePai: aluno.pai?.endereco?.cidade || '',
      ufPai: aluno.pai?.endereco?.uf || '',
      cepPai: this.formatarCEP(aluno.pai?.endereco?.cep),
      telefonePai: this.formatarTelefone(aluno.pai?.telefone),
      emailPai: aluno.pai?.email || '',
      
      // === RESPONSÁVEL FINANCEIRO ===
      responsavelFinanceiroTipo: respFinanceiro.tipo,
      responsavelFinanceiroNome: respFinanceiro.nome || '',
      responsavelFinanceiroCpf: respFinanceiro.cpf || '',
      
      // === DADOS DA ESCOLA ===
      nomeEscola: (configEscola.nomeEscola || configEscola.nome || 'ESCOLA').toUpperCase(),
      cnpjEscola: configEscola.cnpj || '',
      enderecoEscola: configEscola.endereco || '',
      telefoneEscola: configEscola.telefone || '',
      emailEscola: configEscola.email || '',
      nomeDiretor: (configEscola.diretor || '').toUpperCase(),
      cidadeEscola: this.extrairCidade(configEscola.endereco) || 'Goiânia',
      ufEscola: this.extrairUF(configEscola.endereco) || 'GO',
      
      // === DADOS FINANCEIROS ===
      valorMensalidade: this.formatarValor(valorMensalidade),
      valorMensalidadeNumerico: valorMensalidade.toFixed(2),
      descontoPercentual: descontoPercentual.toString(),
      valorDesconto: this.formatarValor(valorDesconto),
      valorDescontoNumerico: valorDesconto.toFixed(2),
      valorFinal: this.formatarValor(valorFinal),
      valorFinalNumerico: valorFinal.toFixed(2),
      diaVencimento: (aluno.financeiro?.diaVencimento || '10').toString(),
      dataInicioCompetencia: this.formatarData(aluno.financeiro?.dataInicioCompetencia),
      dataFimCompetencia: this.formatarData(aluno.financeiro?.dataFimCompetencia),
      
      // === DATAS ===
      dataMatricula: this.formatarData(aluno.dataMatricula || dataHoje),
      dataMatriculaExtenso: this.formatarDataExtenso(aluno.dataMatricula || dataHoje),
      dataHoje: this.formatarData(dataHoje),
      dataHojeExtenso: this.formatarDataExtenso(dataHoje)
    };
  }

  /**
   * Processa template .docx com os dados do aluno
   * @param {ArrayBuffer} templateBuffer - Template .docx em formato ArrayBuffer
   * @param {Object} aluno - Dados do aluno
   * @param {Object} configEscola - Configurações da escola
   * @returns {Promise<Blob>} - Documento preenchido em formato Blob
   */
  async processarTemplate(templateBuffer, aluno, configEscola) {
    try {
      console.log('📄 [Template] Iniciando processamento do template...');
      
      // Carregar o template
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Preparar dados
      const dados = this.prepararDadosAluno(aluno, configEscola);
      console.log('📋 [Template] Dados preparados:', dados);

      // Renderizar o documento
      doc.render(dados);

      // Gerar o arquivo
      const blob = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      console.log('✅ [Template] Template processado com sucesso');
      return blob;
    } catch (error) {
      console.error('❌ [Template] Erro ao processar template:', error);
      
      // Erros específicos do docxtemplater
      if (error.properties && error.properties.errors) {
        console.error('Detalhes dos erros:');
        error.properties.errors.forEach((err) => {
          console.error(`- ${err.name}: ${err.message}`);
          console.error(`  Posição: ${err.properties.offset}`);
          console.error(`  Tag: ${err.properties.id}`);
        });
      }
      
      throw new Error(`Erro ao processar template: ${error.message}`);
    }
  }

  /**
   * Baixa o documento processado
   * @param {Blob} blob - Documento em formato Blob
   * @param {string} nomeAluno - Nome do aluno para o arquivo
   */
  baixarDocumento(blob, nomeAluno = 'Aluno') {
    const timestamp = new Date().toISOString().split('T')[0];
    const nomeArquivoSafe = (nomeAluno || 'Aluno').replace(/\s+/g, '_');
    const nomeArquivo = `Contrato_${nomeArquivoSafe}_${timestamp}.docx`;
    saveAs(blob, nomeArquivo);
    console.log('💾 [Template] Arquivo baixado:', nomeArquivo);
  }

  /**
   * Lista de todos os placeholders disponíveis
   */
  getPlaceholdersDisponiveis() {
    return {
      aluno: [
        { tag: 'nomeAluno', descricao: 'Nome completo do aluno em maiúsculas' },
        { tag: 'cpfAluno', descricao: 'CPF do aluno formatado (000.000.000-00)' },
        { tag: 'dataNascimento', descricao: 'Data de nascimento do aluno (DD/MM/AAAA)' },
        { tag: 'idade', descricao: 'Idade do aluno em anos' },
        { tag: 'turma', descricao: 'Nome da turma do aluno' },
        { tag: 'turno', descricao: 'Turno (MATUTINO, VESPERTINO, INTEGRAL)' },
        { tag: 'nivelEnsino', descricao: 'Nível de ensino (EDUCAÇÃO INFANTIL, etc)' },
        { tag: 'anoLetivo', descricao: 'Ano letivo da matrícula' }
      ],
      mae: [
        { tag: 'nomeMae', descricao: 'Nome completo da mãe' },
        { tag: 'cpfMae', descricao: 'CPF da mãe formatado' },
        { tag: 'rgMae', descricao: 'RG da mãe' },
        { tag: 'enderecoMae', descricao: 'Endereço (rua) da mãe' },
        { tag: 'bairroMae', descricao: 'Bairro da mãe' },
        { tag: 'cidadeMae', descricao: 'Cidade da mãe' },
        { tag: 'ufMae', descricao: 'UF da mãe' },
        { tag: 'cepMae', descricao: 'CEP da mãe formatado (00000-000)' },
        { tag: 'telefoneMae', descricao: 'Telefone da mãe formatado' },
        { tag: 'emailMae', descricao: 'E-mail da mãe' }
      ],
      pai: [
        { tag: 'nomePai', descricao: 'Nome completo do pai' },
        { tag: 'cpfPai', descricao: 'CPF do pai formatado' },
        { tag: 'rgPai', descricao: 'RG do pai' },
        { tag: 'enderecoPai', descricao: 'Endereço (rua) do pai' },
        { tag: 'bairroPai', descricao: 'Bairro do pai' },
        { tag: 'cidadePai', descricao: 'Cidade do pai' },
        { tag: 'ufPai', descricao: 'UF do pai' },
        { tag: 'cepPai', descricao: 'CEP do pai formatado' },
        { tag: 'telefonePai', descricao: 'Telefone do pai formatado' },
        { tag: 'emailPai', descricao: 'E-mail do pai' }
      ],
      responsavelFinanceiro: [
        { tag: 'responsavelFinanceiroTipo', descricao: 'Tipo (MÃE ou PAI)' },
        { tag: 'responsavelFinanceiroNome', descricao: 'Nome do responsável financeiro' },
        { tag: 'responsavelFinanceiroCpf', descricao: 'CPF do responsável financeiro' }
      ],
      escola: [
        { tag: 'nomeEscola', descricao: 'Nome da escola em maiúsculas' },
        { tag: 'cnpjEscola', descricao: 'CNPJ da escola' },
        { tag: 'enderecoEscola', descricao: 'Endereço completo da escola' },
        { tag: 'telefoneEscola', descricao: 'Telefone da escola' },
        { tag: 'emailEscola', descricao: 'E-mail da escola' },
        { tag: 'nomeDiretor', descricao: 'Nome do diretor' },
        { tag: 'cidadeEscola', descricao: 'Cidade da escola' },
        { tag: 'ufEscola', descricao: 'UF da escola' }
      ],
      financeiro: [
        { tag: 'valorMensalidade', descricao: 'Valor da mensalidade formatado (R$ 0,00)' },
        { tag: 'valorMensalidadeNumerico', descricao: 'Valor da mensalidade numérico (0.00)' },
        { tag: 'descontoPercentual', descricao: 'Percentual de desconto' },
        { tag: 'valorDesconto', descricao: 'Valor do desconto formatado' },
        { tag: 'valorDescontoNumerico', descricao: 'Valor do desconto numérico' },
        { tag: 'valorFinal', descricao: 'Valor final com desconto formatado' },
        { tag: 'valorFinalNumerico', descricao: 'Valor final numérico' },
        { tag: 'diaVencimento', descricao: 'Dia de vencimento da mensalidade' },
        { tag: 'dataInicioCompetencia', descricao: 'Data de início da competência' },
        { tag: 'dataFimCompetencia', descricao: 'Data de fim da competência' }
      ],
      datas: [
        { tag: 'dataMatricula', descricao: 'Data da matrícula (DD/MM/AAAA)' },
        { tag: 'dataMatriculaExtenso', descricao: 'Data da matrícula por extenso' },
        { tag: 'dataHoje', descricao: 'Data atual (DD/MM/AAAA)' },
        { tag: 'dataHojeExtenso', descricao: 'Data atual por extenso' }
      ]
    };
  }
}

export default new ContratoTemplateService();
