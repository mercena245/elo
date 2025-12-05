/**
 * Serviço de Histórico Escolar Completo
 * Conforme normas do MEC:
 * - Portaria MEC nº 1.570/2017 (Histórico Escolar Digital)
 * - Resolução CNE/CEB nº 2/2020
 * - Lei nº 14.533/2023 (Política Nacional de Educação Digital)
 * 
 * ESTRUTURA COMPLETA DO HISTÓRICO ESCOLAR:
 * 1. Identificação da Instituição
 * 2. Identificação do Aluno
 * 3. Dados da Matrícula
 * 4. Histórico Acadêmico por Série/Ano
 * 5. Informações de Aprovação/Reprovação
 * 6. Dados de Transferência (se houver)
 * 7. Observações e Observâncias Legais
 * 8. Assinatura Digital e Validação
 */

import { db, ref, get } from '../firebase';

export class HistoricoEscolarCompleto {
  constructor(secretariaService) {
    this.service = secretariaService;
  }

  /**
   * Coletar dados completos do histórico escolar do aluno
   */
  async coletarDadosCompletos(alunoId, opcoes = {}) {
    try {
      console.log('📚 [Histórico] Iniciando coleta de dados completos para:', alunoId);
      
      // 1. Dados do Aluno
      const dadosAluno = await this.service.getDadosAluno(alunoId);
      
      // 2. Dados da Instituição
      const dadosInstituicao = await this.service.getDadosInstituicao();
      
      // 3. Histórico Acadêmico Completo (com filtro de anos se especificado)
      const historicoAcademico = await this.processarHistoricoAcademico(alunoId, dadosAluno, opcoes);
      
      // 4. Dados de Matrícula e Transferências
      const historicoMatriculas = await this.processarHistoricoMatriculas(dadosAluno);
      
      // 5. Documentação e Observações
      const observacoes = await this.coletarObservacoes(dadosAluno, opcoes);
      
      // 6. Dados de Conclusão (se aplicável)
      const dadosConclusao = await this.verificarConclusao(dadosAluno, historicoAcademico);

      const dadosCompletos = {
        // Identificação da Instituição
        instituicao: {
          nome: dadosInstituicao.nome,
          cnpj: dadosInstituicao.cnpj,
          codigoINEP: dadosInstituicao.codigoINEP || 'Não informado',
          endereco: dadosInstituicao.endereco,
          telefone: dadosInstituicao.telefone,
          email: dadosInstituicao.email,
          dependenciaAdministrativa: dadosInstituicao.dependenciaAdministrativa || 'Privada',
          responsavel: dadosInstituicao.responsavel
        },

        // Identificação do Aluno
        aluno: {
          nome: dadosAluno.nome,
          matricula: dadosAluno.matricula || alunoId,
          cpf: dadosAluno.cpf,
          rg: dadosAluno.rg,
          orgaoExpedidor: dadosAluno.orgaoExpedidor || 'SSP',
          ufRG: dadosAluno.ufRG || dadosAluno.uf,
          dataNascimento: dadosAluno.dataNascimento,
          sexo: dadosAluno.sexo || 'Não informado',
          corRaca: dadosAluno.corRaca || 'Não declarada',
          
          // Filiação
          nomePai: dadosAluno.pai?.nome || dadosAluno.nomePai,
          nomeMae: dadosAluno.mae?.nome || dadosAluno.nomeMae,
          
          // Naturalidade
          naturalidade: dadosAluno.naturalidade,
          uf: dadosAluno.uf,
          nacionalidade: dadosAluno.nacionalidade || 'Brasileira',
          
          // Contato
          telefone: dadosAluno.telefone,
          email: dadosAluno.email,
          
          // Endereço Residencial
          endereco: {
            rua: dadosAluno.endereco?.rua || dadosAluno.rua,
            numero: dadosAluno.endereco?.numero || dadosAluno.numero,
            complemento: dadosAluno.endereco?.complemento || dadosAluno.complemento,
            bairro: dadosAluno.endereco?.bairro || dadosAluno.bairro,
            cidade: dadosAluno.endereco?.cidade || dadosAluno.cidade,
            estado: dadosAluno.endereco?.estado || dadosAluno.estado,
            cep: dadosAluno.endereco?.cep || dadosAluno.cep
          },
          
          // Necessidades Especiais
          necessidadesEspeciais: dadosAluno.necessidadesEspeciais || 'Nenhuma',
          laudoMedico: dadosAluno.laudoMedico || false
        },

        // Histórico de Matrículas
        matriculas: historicoMatriculas,

        // Histórico Acadêmico Completo (Por Série/Ano)
        historicoAcademico: historicoAcademico,

        // Resumo Geral
        resumo: {
          totalAnos: historicoAcademico.length,
          totalDisciplinas: historicoAcademico.reduce((total, ano) => 
            total + (ano.disciplinas?.length || 0), 0),
          cargaHorariaTotal: historicoAcademico.reduce((total, ano) => 
            total + (ano.cargaHoraria || 0), 0),
          situacaoGeral: dadosConclusao.concluido ? 'Concluído' : 'Em Andamento',
          mediaGeral: this.calcularMediaGeral(historicoAcademico),
          frequenciaGeral: this.calcularFrequenciaGeral(historicoAcademico)
        },

        // Dados de Conclusão
        conclusao: dadosConclusao,

        // Observações e Anotações
        observacoes: observacoes,

        // Metadados
        metadados: {
          dataGeracao: new Date().toISOString(),
          geradoPor: 'Sistema ELO - Secretaria Digital',
          versaoSistema: '2.0',
          normasAplicadas: [
            'Portaria MEC nº 1.570/2017',
            'Resolução CNE/CEB nº 2/2020',
            'Lei nº 14.533/2023'
          ]
        }
      };

      console.log('✅ [Histórico] Dados completos coletados com sucesso');
      return dadosCompletos;

    } catch (error) {
      console.error('❌ [Histórico] Erro ao coletar dados:', error);
      throw error;
    }
  }

  /**
   * Processar histórico acadêmico completo
   */
  async processarHistoricoAcademico(alunoId, dadosAluno, opcoes = {}) {
    const historicoCompleto = [];
    
    // Buscar dados do histórico acadêmico estruturado
    const historicoAcademico = dadosAluno.historicoAcademico || {};
    
    // Buscar todas as notas e frequências
    const notasSnapshot = await get(ref(db, 'notas'));
    const frequenciaSnapshot = await get(ref(db, 'frequencia'));
    const turmasSnapshot = await get(ref(db, 'turmas'));
    
    const todasNotas = notasSnapshot.exists() ? notasSnapshot.val() : {};
    const todasFrequencias = frequenciaSnapshot.exists() ? frequenciaSnapshot.val() : {};
    const todasTurmas = turmasSnapshot.exists() ? turmasSnapshot.val() : {};

    // Processar cada ano letivo do histórico
    let anosLetivos = Object.keys(historicoAcademico).sort();
    
    // 🆕 Filtrar por anos selecionados se especificado
    if (opcoes.anosLetivos && opcoes.anosLetivos.length > 0) {
      const anosSelecionados = opcoes.anosLetivos.map(String);
      anosLetivos = anosLetivos.filter(ano => anosSelecionados.includes(ano));
      console.log(`📅 Filtrando anos selecionados: ${anosLetivos.join(', ')}`);
    }
    
    for (const anoLetivo of anosLetivos) {
      const dadosAno = historicoAcademico[anoLetivo];
      
      // Identificar a série/turma do ano
      const turmaId = dadosAno.turmaId;
      const turmaDados = turmaId ? todasTurmas[turmaId] : null;
      
      const serie = turmaDados?.serie || dadosAno.serie || 'Série não informada';
      const turma = turmaDados?.nome || dadosAno.turma || 'Turma não informada';
      const periodo = dadosAno.periodo || 'Anual';
      
      // Processar disciplinas do ano
      const disciplinas = await this.processarDisciplinasAno(
        alunoId, 
        anoLetivo, 
        turmaId,
        todasNotas,
        todasFrequencias
      );

      // Calcular carga horária do ano
      const cargaHoraria = disciplinas.reduce((total, disc) => 
        total + (disc.cargaHoraria || 0), 0);

      // Determinar resultado final do ano
      const aprovadoNoAno = this.determinarAprovacaoAno(disciplinas, dadosAno);

      // Informações de rematrícula/progressão
      const progressao = {
        tipo: dadosAno.tipoProgressao || 'Regular',
        dataMatricula: dadosAno.dataMatricula,
        dataTransferencia: dadosAno.dataTransferencia,
        escolaOrigem: dadosAno.escolaOrigem,
        escolaDestino: dadosAno.escolaDestino
      };

      historicoCompleto.push({
        anoLetivo: parseInt(anoLetivo),
        serie: serie,
        turma: turma,
        turmaId: turmaId,
        periodo: periodo,
        modalidade: dadosAno.modalidade || 'Presencial',
        regime: dadosAno.regime || 'Seriado',
        
        // Datas importantes
        dataInicio: dadosAno.dataInicio,
        dataTermino: dadosAno.dataTermino,
        diasLetivos: dadosAno.diasLetivos || 200,
        
        // Disciplinas cursadas
        disciplinas: disciplinas,
        
        // Totalizadores
        totalDisciplinas: disciplinas.length,
        cargaHoraria: cargaHoraria,
        
        // Resultado Final
        resultadoFinal: aprovadoNoAno.resultado,
        situacao: aprovadoNoAno.situacao,
        motivoReprovacao: aprovadoNoAno.motivo,
        
        // Progressão
        progressao: progressao,
        
        // Observações específicas do ano
        observacoes: dadosAno.observacoes || ''
      });
    }

    return historicoCompleto;
  }

  /**
   * Processar disciplinas de um ano específico
   */
  async processarDisciplinasAno(alunoId, anoLetivo, turmaId, todasNotas, todasFrequencias) {
    const disciplinasMap = new Map();

    // Processar notas do aluno no ano
    Object.values(todasNotas).forEach(nota => {
      if (nota.alunoId !== alunoId) return;
      
      const notaAno = nota.anoLetivo || anoLetivo;
      const notaTurma = nota.turmaId;
      
      if (notaAno === anoLetivo || notaTurma === turmaId) {
        const disciplinaId = nota.disciplinaId;
        
        if (!disciplinasMap.has(disciplinaId)) {
          disciplinasMap.set(disciplinaId, {
            disciplinaId: disciplinaId,
            nome: nota.disciplinaNome || disciplinaId,
            notas: {},
            notasPorBimestre: [],
            faltas: {},
            faltasPorBimestre: [],
            totalAulas: 0,
            totalPresencas: 0,
            totalFaltas: 0
          });
        }
        
        const disc = disciplinasMap.get(disciplinaId);
        const bimestre = nota.bimestre || nota.periodo || 'B1';
        disc.notas[bimestre] = parseFloat(nota.nota) || 0;
        disc.notasPorBimestre.push({
          periodo: bimestre,
          nota: parseFloat(nota.nota) || 0,
          data: nota.data
        });
      }
    });

    // Processar frequências
    Object.values(todasFrequencias).forEach(freq => {
      if (freq.alunoId !== alunoId) return;
      
      const freqAno = freq.anoLetivo || anoLetivo;
      const freqTurma = freq.turmaId;
      
      if (freqAno === anoLetivo || freqTurma === turmaId) {
        const disciplinaId = freq.disciplinaId;
        
        if (!disciplinasMap.has(disciplinaId)) {
          disciplinasMap.set(disciplinaId, {
            disciplinaId: disciplinaId,
            nome: freq.disciplinaNome || disciplinaId,
            notas: {},
            notasPorBimestre: [],
            faltas: {},
            faltasPorBimestre: [],
            totalAulas: 0,
            totalPresencas: 0,
            totalFaltas: 0
          });
        }
        
        const disc = disciplinasMap.get(disciplinaId);
        disc.totalAulas++;
        
        if (freq.presente) {
          disc.totalPresencas++;
        } else {
          disc.totalFaltas++;
          const bimestre = freq.bimestre || freq.periodo || 'B1';
          disc.faltas[bimestre] = (disc.faltas[bimestre] || 0) + 1;
        }
      }
    });

    // Buscar nomes corretos das disciplinas e calcular estatísticas finais
    const disciplinasFinais = [];
    
    for (const [disciplinaId, disc] of disciplinasMap) {
      // Buscar nome completo da disciplina
      const nomeCompleto = await this.service.getNomeDisciplina(disciplinaId);
      
      // Calcular média final
      const notasArray = Object.values(disc.notas);
      const mediaFinal = notasArray.length > 0 
        ? notasArray.reduce((sum, nota) => sum + nota, 0) / notasArray.length 
        : 0;
      
      // Calcular frequência
      const frequenciaPercentual = disc.totalAulas > 0 
        ? (disc.totalPresencas / disc.totalAulas) * 100 
        : 100;
      
      // Determinar situação
      const situacao = this.determinarSituacaoDisciplina(mediaFinal, frequenciaPercentual);
      
      // Carga horária estimada (pode ser configurável)
      const cargaHoraria = disc.totalAulas || 80; // Padrão 80h/ano

      disciplinasFinais.push({
        codigo: disciplinaId,
        nome: nomeCompleto,
        
        // Notas detalhadas
        notasPorPeriodo: disc.notasPorBimestre.sort((a, b) => a.periodo.localeCompare(b.periodo)),
        nota1Bimestre: disc.notas['B1'] || disc.notas['1'] || null,
        nota2Bimestre: disc.notas['B2'] || disc.notas['2'] || null,
        nota3Bimestre: disc.notas['B3'] || disc.notas['3'] || null,
        nota4Bimestre: disc.notas['B4'] || disc.notas['4'] || null,
        mediaFinal: parseFloat(mediaFinal.toFixed(2)),
        
        // Frequência detalhada
        faltasPorPeriodo: Object.entries(disc.faltas).map(([periodo, faltas]) => ({
          periodo,
          faltas
        })),
        totalAulas: disc.totalAulas,
        totalPresencas: disc.totalPresencas,
        totalFaltas: disc.totalFaltas,
        frequenciaPercentual: parseFloat(frequenciaPercentual.toFixed(1)),
        frequenciaFormatada: `${frequenciaPercentual.toFixed(0)}%`,
        
        // Carga horária
        cargaHoraria: cargaHoraria,
        
        // Situação final
        situacao: situacao.situacao,
        aprovado: situacao.aprovado,
        motivoReprovacao: situacao.motivo
      });
    }

    return disciplinasFinais.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  /**
   * Determinar situação da disciplina
   */
  determinarSituacaoDisciplina(mediaFinal, frequenciaPercentual) {
    const mediaMinima = 7.0;
    const frequenciaMinima = 75;

    if (mediaFinal >= mediaMinima && frequenciaPercentual >= frequenciaMinima) {
      return {
        situacao: 'Aprovado',
        aprovado: true,
        motivo: null
      };
    }

    if (mediaFinal < mediaMinima && frequenciaPercentual < frequenciaMinima) {
      return {
        situacao: 'Reprovado',
        aprovado: false,
        motivo: 'Média e Frequência insuficientes'
      };
    }

    if (mediaFinal < mediaMinima) {
      return {
        situacao: 'Reprovado',
        aprovado: false,
        motivo: 'Média insuficiente'
      };
    }

    return {
      situacao: 'Reprovado',
      aprovado: false,
      motivo: 'Frequência insuficiente'
    };
  }

  /**
   * Determinar aprovação no ano
   */
  determinarAprovacaoAno(disciplinas, dadosAno) {
    if (disciplinas.length === 0) {
      return {
        resultado: 'Pendente',
        situacao: 'Sem dados de avaliação',
        motivo: 'Nenhuma disciplina cursada'
      };
    }

    const reprovadas = disciplinas.filter(d => !d.aprovado);
    
    if (reprovadas.length === 0) {
      return {
        resultado: 'Aprovado',
        situacao: 'Aprovado em todas as disciplinas',
        motivo: null
      };
    }

    if (reprovadas.length <= 2) {
      return {
        resultado: 'Aprovado com Dependência',
        situacao: `Aprovado com ${reprovadas.length} dependência(s)`,
        motivo: `Disciplinas: ${reprovadas.map(d => d.nome).join(', ')}`
      };
    }

    return {
      resultado: 'Reprovado',
      situacao: 'Reprovado',
      motivo: `Reprovado em ${reprovadas.length} disciplinas`
    };
  }

  /**
   * Processar histórico de matrículas
   */
  async processarHistoricoMatriculas(dadosAluno) {
    const matriculas = [];
    
    // Matrícula inicial
    if (dadosAluno.dataMatricula) {
      matriculas.push({
        tipo: 'Matrícula Inicial',
        data: dadosAluno.dataMatricula,
        serie: dadosAluno.serieInicial || dadosAluno.serie,
        turma: dadosAluno.turmaInicial || dadosAluno.turma,
        observacao: 'Primeira matrícula na instituição'
      });
    }

    // Rematrículas
    if (dadosAluno.historicoRematriculas) {
      dadosAluno.historicoRematriculas.forEach(rematricula => {
        matriculas.push({
          tipo: 'Rematrícula',
          data: rematricula.data,
          serie: rematricula.serie,
          turma: rematricula.turma,
          anoLetivo: rematricula.anoLetivo,
          observacao: rematricula.observacao || 'Rematrícula regular'
        });
      });
    }

    // Transferências
    if (dadosAluno.historicoTransferencias) {
      dadosAluno.historicoTransferencias.forEach(transf => {
        matriculas.push({
          tipo: transf.tipo === 'entrada' ? 'Transferência de Entrada' : 'Transferência de Saída',
          data: transf.data,
          escolaOrigem: transf.escolaOrigem,
          escolaDestino: transf.escolaDestino,
          serie: transf.serie,
          observacao: transf.observacao
        });
      });
    }

    return matriculas.sort((a, b) => 
      new Date(a.data) - new Date(b.data)
    );
  }

  /**
   * Verificar conclusão de curso
   */
  async verificarConclusao(dadosAluno, historicoAcademico) {
    const ultimoAno = historicoAcademico[historicoAcademico.length - 1];
    
    if (!ultimoAno) {
      return {
        concluido: false,
        dataC: null,
        nivel: null
      };
    }

    // Verificar se concluiu o último ano
    const concluido = ultimoAno.resultadoFinal === 'Aprovado' && 
                     (ultimoAno.serie === '9º Ano' || ultimoAno.serie === '3º Ano');

    return {
      concluido: concluido,
      dataConclusao: concluido ? ultimoAno.dataTermino : null,
      nivel: ultimoAno.serie?.includes('9º') ? 'Ensino Fundamental' : 
             ultimoAno.serie?.includes('3º') ? 'Ensino Médio' : null,
      certificado: concluido,
      observacao: concluido ? 'Concluiu o curso com aproveitamento' : null
    };
  }

  /**
   * Coletar observações relevantes
   */
  async coletarObservacoes(dadosAluno, opcoes) {
    const observacoes = [];

    // Observações gerais do aluno
    if (dadosAluno.observacoes) {
      observacoes.push({
        tipo: 'Geral',
        texto: dadosAluno.observacoes
      });
    }

    // Necessidades especiais
    if (dadosAluno.necessidadesEspeciais && dadosAluno.necessidadesEspeciais !== 'Nenhuma') {
      observacoes.push({
        tipo: 'Necessidades Especiais',
        texto: `Aluno(a) com necessidades especiais: ${dadosAluno.necessidadesEspeciais}`
      });
    }

    // Observações adicionais fornecidas
    if (opcoes.observacoes) {
      observacoes.push({
        tipo: 'Adicional',
        texto: opcoes.observacoes
      });
    }

    // Observâncias legais obrigatórias
    observacoes.push({
      tipo: 'Legal',
      texto: 'Documento emitido em conformidade com a Portaria MEC nº 1.570/2017 e Lei nº 14.533/2023'
    });

    return observacoes;
  }

  /**
   * Calcular média geral de todos os anos
   */
  calcularMediaGeral(historicoAcademico) {
    if (historicoAcademico.length === 0) return 0;

    let somaMedias = 0;
    let totalDisciplinas = 0;

    historicoAcademico.forEach(ano => {
      ano.disciplinas?.forEach(disc => {
        somaMedias += disc.mediaFinal;
        totalDisciplinas++;
      });
    });

    return totalDisciplinas > 0 
      ? parseFloat((somaMedias / totalDisciplinas).toFixed(2)) 
      : 0;
  }

  /**
   * Calcular frequência geral de todos os anos
   */
  calcularFrequenciaGeral(historicoAcademico) {
    if (historicoAcademico.length === 0) return 100;

    let totalAulas = 0;
    let totalPresencas = 0;

    historicoAcademico.forEach(ano => {
      ano.disciplinas?.forEach(disc => {
        totalAulas += disc.totalAulas;
        totalPresencas += disc.totalPresencas;
      });
    });

    return totalAulas > 0 
      ? parseFloat(((totalPresencas / totalAulas) * 100).toFixed(1)) 
      : 100;
  }
}

export default HistoricoEscolarCompleto;
