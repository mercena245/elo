/**
 * Serviço para gerenciar histórico de matrículas dos alunos
 * Responsável por buscar e processar dados de matrículas anteriores, rematrículas e status atual
 */

class HistoricoMatriculaService {
  constructor(database, getData, auditService) {
    this.database = database;
    this.getData = getData;
    this.auditService = auditService;
  }

  /**
   * Busca o histórico completo de matrículas de um aluno
   * @param {string} alunoId - ID do aluno
   * @returns {Promise<Array>} Lista de registros de matrícula ordenados por data
   */
  async buscarHistoricoCompleto(alunoId) {
    try {
      console.log('🔍 Buscando histórico completo para aluno:', alunoId);

      // Buscar dados atuais do aluno
      const aluno = await this.getData(`alunos/${alunoId}`);
      if (!aluno) {
        throw new Error('Aluno não encontrado');
      }

      // Array para armazenar todo o histórico
      const historico = [];

      // 1. Registrar matrícula inicial
      if (aluno.dataMatricula || aluno.createdAt) {
        historico.push({
          id: `matricula_inicial_${alunoId}`,
          tipoOperacao: 'matricula_inicial',
          titulo: '🎓 Matrícula Inicial',
          descricao: 'Primeira matrícula do aluno no sistema',
          dataOperacao: aluno.dataMatricula || aluno.createdAt,
          status: 'matriculado',
          turmaId: aluno.turmaInicial || aluno.turmaId,
          valorMatricula: aluno.valorMatriculaInicial || aluno.valorMatricula,
          responsavel: aluno.usuarioCriacao || aluno.createdBy || 'Sistema',
          detalhes: `Matrícula número: ${aluno.matricula}${aluno.observacoesMatricula ? ` - ${aluno.observacoesMatricula}` : ''}`
        });
      }

      // 2. Buscar histórico de rematrículas
      await this.buscarRematriculas(alunoId, historico);

      // 3. Buscar histórico de mudanças de status
      await this.buscarMudancasStatus(alunoId, historico);

      // 4. Buscar transferências de turma
      await this.buscarTransferenciasTurma(alunoId, historico);

      // 5. Adicionar registro do status atual
      if (aluno.status) {
        const ultimaAtualizacao = aluno.updatedAt || aluno.dataUltimaAtualizacao || new Date().toISOString();
        
        historico.push({
          id: `status_atual_${alunoId}`,
          tipoOperacao: 'status_atual',
          titulo: this.getTituloStatus(aluno.status),
          descricao: this.getDescricaoStatus(aluno.status),
          dataOperacao: ultimaAtualizacao,
          status: aluno.status,
          turmaId: aluno.turmaId,
          valorMatricula: aluno.valorMatricula,
          responsavel: aluno.usuarioUltimaAtualizacao || 'Sistema',
          detalhes: aluno.observacoes || this.getDetalhesStatus(aluno)
        });
      }

      // Ordenar por data (mais recente primeiro)
      const historicoOrdenado = historico.sort((a, b) => 
        new Date(b.dataOperacao) - new Date(a.dataOperacao)
      );

      console.log('📋 Histórico completo encontrado:', historicoOrdenado.length, 'registros');
      return historicoOrdenado;

    } catch (error) {
      console.error('❌ Erro ao buscar histórico completo:', error);
      throw new Error(`Erro ao buscar histórico: ${error.message}`);
    }
  }

  /**
   * Busca histórico de rematrículas do aluno
   */
  async buscarRematriculas(alunoId, historico) {
    try {
      // Buscar no histórico de rematrículas se existir
      const rematriculas = await this.getData(`historico_rematriculas/${alunoId}`);
      
      if (rematriculas) {
        Object.entries(rematriculas).forEach(([key, rematricula]) => {
          historico.push({
            id: `rematricula_${key}`,
            tipoOperacao: 'rematricula',
            titulo: '🔄 Rematrícula',
            descricao: `Rematrícula para o ano letivo ${rematricula.anoLetivo || 'N/A'}`,
            dataOperacao: rematricula.dataRematricula || rematricula.createdAt,
            status: rematricula.status || 'rematriculado',
            turmaId: rematricula.novaTurmaId,
            valorMatricula: rematricula.valorMatricula,
            responsavel: rematricula.responsavel || rematricula.usuarioRematricula,
            detalhes: this.formatarDetalhesRematricula(rematricula)
          });
        });
      }

      // Verificar se tem flag de rematrícula no próprio aluno
      const aluno = await this.getData(`alunos/${alunoId}`);
      if (aluno.dataRematricula && aluno.rematriculaInfo) {
        historico.push({
          id: `rematricula_atual_${alunoId}`,
          tipoOperacao: 'rematricula',
          titulo: '🔄 Rematrícula Recente',
          descricao: 'Rematrícula mais recente registrada',
          dataOperacao: aluno.dataRematricula,
          status: aluno.status,
          turmaId: aluno.turmaId,
          valorMatricula: aluno.rematriculaInfo.valorMatricula,
          responsavel: aluno.rematriculaInfo.responsavel,
          detalhes: this.formatarDetalhesRematricula(aluno.rematriculaInfo)
        });
      }

    } catch (error) {
      console.warn('⚠️ Erro ao buscar rematrículas:', error.message);
    }
  }

  /**
   * Busca histórico de mudanças de status
   */
  async buscarMudancasStatus(alunoId, historico) {
    try {
      // Buscar logs de auditoria se disponível
      if (this.auditService) {
        const logs = await this.auditService.buscarLogsPorEntidade(alunoId);
        
        logs.filter(log => 
          log.action.includes('student_') && 
          (log.action.includes('activate') || log.action.includes('inactivate'))
        ).forEach(log => {
          historico.push({
            id: `status_change_${log.id}`,
            tipoOperacao: log.action.includes('activate') ? 'reativacao' : 'inativacao',
            titulo: log.action.includes('activate') ? '✅ Reativação' : '🔴 Inativação',
            descricao: log.description || 'Mudança de status do aluno',
            dataOperacao: log.timestamp,
            status: log.action.includes('activate') ? 'ativo' : 'inativo',
            responsavel: log.userName || log.userId,
            detalhes: this.formatarDetalhesLog(log)
          });
        });
      }

      // Verificar campos específicos no aluno
      const aluno = await this.getData(`alunos/${alunoId}`);
      
      if (aluno.dataAtivacao) {
        historico.push({
          id: `ativacao_${alunoId}`,
          tipoOperacao: 'reativacao',
          titulo: '✅ Ativação',
          descricao: 'Aluno ativado no sistema',
          dataOperacao: aluno.dataAtivacao,
          status: 'ativo',
          responsavel: aluno.usuarioAtivacao || 'Sistema',
          detalhes: aluno.ativacaoAutomatica ? 'Ativação automática após pagamento' : 'Ativação manual'
        });
      }

      if (aluno.dataInativacao) {
        historico.push({
          id: `inativacao_${alunoId}`,
          tipoOperacao: 'inativacao',
          titulo: '🔴 Inativação',
          descricao: 'Aluno inativado no sistema',
          dataOperacao: aluno.dataInativacao,
          status: 'inativo',
          responsavel: aluno.usuarioInativacao || 'Sistema',
          detalhes: aluno.inativacaoPorInadimplencia ? 
            `Inativado por inadimplência - ${aluno.inativacaoPorInadimplencia.quantidadeTitulos} títulos em aberto` :
            'Inativação manual'
        });
      }

    } catch (error) {
      console.warn('⚠️ Erro ao buscar mudanças de status:', error.message);
    }
  }

  /**
   * Busca transferências de turma
   */
  async buscarTransferenciasTurma(alunoId, historico) {
    try {
      // Buscar histórico de turmas se existir
      const historicoTurmas = await this.getData(`historico_turmas/${alunoId}`);
      
      if (historicoTurmas) {
        Object.entries(historicoTurmas).forEach(([key, transferencia]) => {
          historico.push({
            id: `transferencia_${key}`,
            tipoOperacao: 'transferencia',
            titulo: '🔄 Transferência de Turma',
            descricao: `Transferido de "${transferencia.turmaAnterior}" para "${transferencia.turmaNova}"`,
            dataOperacao: transferencia.dataTransferencia,
            status: 'transferido',
            turmaId: transferencia.novaTurmaId,
            responsavel: transferencia.responsavel,
            detalhes: transferencia.motivo || 'Transferência de turma'
          });
        });
      }

    } catch (error) {
      console.warn('⚠️ Erro ao buscar transferências:', error.message);
    }
  }

  /**
   * Funções auxiliares para formatação
   */
  getTituloStatus(status) {
    const titulos = {
      'ativo': '✅ Ativo',
      'inativo': '🔴 Inativo',
      'pre_matricula': '📝 Pré-Matrícula',
      'matriculado': '🎓 Matriculado',
      'rematriculado': '🔄 Rematriculado',
      'suspenso': '⏸️ Suspenso',
      'transferido': '🔄 Transferido'
    };
    return titulos[status] || `📋 ${status}`;
  }

  getDescricaoStatus(status) {
    const descricoes = {
      'ativo': 'Aluno ativo e frequente',
      'inativo': 'Aluno inativo no sistema',
      'pre_matricula': 'Aguardando confirmação de matrícula',
      'matriculado': 'Matrícula confirmada',
      'rematriculado': 'Rematrícula realizada',
      'suspenso': 'Matrícula suspensa temporariamente',
      'transferido': 'Transferido para outra instituição'
    };
    return descricoes[status] || `Status: ${status}`;
  }

  getDetalhesStatus(aluno) {
    const detalhes = [];
    
    if (aluno.turmaId) {
      detalhes.push(`Turma atual: ${aluno.turmaId}`);
    }
    
    if (aluno.valorMatricula) {
      detalhes.push(`Valor da matrícula: R$ ${parseFloat(aluno.valorMatricula).toFixed(2)}`);
    }
    
    if (aluno.observacoes) {
      detalhes.push(`Observações: ${aluno.observacoes}`);
    }

    return detalhes.join(' | ') || 'Sem observações adicionais';
  }

  formatarDetalhesRematricula(rematricula) {
    const detalhes = [];
    
    if (rematricula.anoLetivo) {
      detalhes.push(`Ano letivo: ${rematricula.anoLetivo}`);
    }
    
    if (rematricula.valorMatricula) {
      detalhes.push(`Valor: R$ ${parseFloat(rematricula.valorMatricula).toFixed(2)}`);
    }
    
    if (rematricula.observacoes) {
      detalhes.push(`Obs: ${rematricula.observacoes}`);
    }

    return detalhes.join(' | ') || 'Rematrícula processada';
  }

  formatarDetalhesLog(log) {
    if (log.changes) {
      const mudancas = [];
      Object.entries(log.changes).forEach(([campo, valor]) => {
        if (typeof valor === 'object' && valor.antes && valor.depois) {
          mudancas.push(`${campo}: ${valor.antes} → ${valor.depois}`);
        } else {
          mudancas.push(`${campo}: ${valor}`);
        }
      });
      return mudancas.join(' | ');
    }
    return log.description || 'Alteração registrada';
  }
}

export default HistoricoMatriculaService;