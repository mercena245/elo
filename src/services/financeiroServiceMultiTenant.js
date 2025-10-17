import { ref, get, set, push, update, remove } from 'firebase/database';

/**
 * Serviço Financeiro - Multi-Tenant
 * Factory function que cria uma instância do serviço para um banco específico
 * @param {Object} databaseWrapper - Wrapper com métodos get, set, push, etc da escola
 * @param {Storage} storage - Instância do Firebase Storage da escola (opcional)
 */
export const createFinanceiroService = (databaseWrapper, storage = null) => {
  if (!databaseWrapper) {
    console.error('❌ [financeiroService] Database wrapper não fornecido');
    return null;
  }

  // Extrair métodos e instância real do wrapper
  const { get: dbGet, set: dbSet, push: dbPush, update: dbUpdate, remove: dbRemove, _database } = databaseWrapper;
  
  // Para compatibilidade com código legado que usa ref() diretamente
  const database = _database;

  return {
  // Gerar título financeiro
  async gerarTitulo(tituloData) {
    try {
      const novoTitulo = {
        ...tituloData,
        status: 'pendente',
        dataGeracao: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const titulosRef = ref(database, 'titulos_financeiros');
      const resultado = await push(titulosRef, novoTitulo);
      
      return { success: true, id: resultado.key };
    } catch (error) {
      console.error('Erro ao gerar título:', error);
      return { success: false, error: error.message };
    }
  },

  // Gerar título de matrícula + mensalidades para novo aluno
  async gerarTitulosNovoAluno(alunoId, dadosAluno) {
    try {
      const { 
        nome, 
        matricula, 
        financeiro = {},
        turmaId 
      } = dadosAluno;

      const {
        mensalidadeValor = 0,
        diaVencimento = 10,
        descontoPercentual = 0,
        valorMatricula = 0,
        valorMateriais = 0,
        dataInicioCompetencia = '',
        dataFimCompetencia = ''
      } = financeiro;

      // Converter para números para garantir cálculos corretos
      const mensalidadeNum = parseFloat(mensalidadeValor) || 0;
      const descontoNum = parseFloat(descontoPercentual) || 0;
      const valorMatriculaNum = parseFloat(valorMatricula) || 0;
      const valorMateriaisNum = parseFloat(valorMateriais) || 0;
      const diaVencNum = parseInt(diaVencimento) || 10;

      if (!mensalidadeNum || mensalidadeNum <= 0) {
        return { success: false, error: 'Valor da mensalidade deve ser informado' };
      }

      const titulosGerados = [];
      const hoje = new Date();

      // 1. Gerar título de matrícula (vencimento em 7 dias)
      if (valorMatriculaNum > 0) {
        const vencimentoMatricula = new Date();
        vencimentoMatricula.setDate(hoje.getDate() + 7);

        const tituloMatricula = {
          alunoId,
          tipo: 'matricula',
          descricao: `Taxa de Matrícula - ${nome}`,
          valor: valorMatriculaNum,
          valorOriginal: valorMatriculaNum,
          vencimento: vencimentoMatricula.toISOString().split('T')[0],
          status: 'pendente',
          observacoes: 'Pagamento necessário para confirmar matrícula',
          dataGeracao: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const titulosRef = ref(database, 'titulos_financeiros');
        const novoTituloRef = await push(titulosRef, tituloMatricula);
        titulosGerados.push({ id: novoTituloRef.key, tipo: 'matricula', valor: valorMatriculaNum });
      }

      // 2. Gerar título de materiais (vencimento em 7 dias)
      if (valorMateriaisNum > 0) {
        const vencimentoMateriais = new Date();
        vencimentoMateriais.setDate(hoje.getDate() + 7);

        const tituloMateriais = {
          alunoId,
          tipo: 'materiais',
          descricao: `Taxa de Materiais - ${nome}`,
          valor: valorMateriaisNum,
          valorOriginal: valorMateriaisNum,
          vencimento: vencimentoMateriais.toISOString().split('T')[0],
          status: 'pendente',
          observacoes: 'Pagamento para aquisição de materiais escolares',
          dataGeracao: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const titulosRef = ref(database, 'titulos_financeiros');
        const novoTituloRef = await push(titulosRef, tituloMateriais);
        titulosGerados.push({ id: novoTituloRef.key, tipo: 'materiais', valor: valorMateriaisNum });
      }

      // 3. Gerar mensalidades baseadas na competência definida
      const valorMensalidadeComDesconto = mensalidadeNum * (1 - descontoNum / 100);
      
      // Validar e processar datas de competência
      if (!dataInicioCompetencia || !dataFimCompetencia) {
        return { 
          success: false, 
          error: 'Data de início e fim da competência são obrigatórias para geração de mensalidades' 
        };
      }

      // Parse das datas sem problema de timezone
      const [anoInicioStr, mesInicioStr, diaInicioStr] = dataInicioCompetencia.split('-');
      const [anoFimStr, mesFimStr, diaFimStr] = dataFimCompetencia.split('-');
      
      const anoInicio = parseInt(anoInicioStr);
      const mesInicio = parseInt(mesInicioStr) - 1; // 0-11 para Date
      const anoFim = parseInt(anoFimStr);
      const mesFim = parseInt(mesFimStr) - 1; // 0-11 para Date
      
      const dataInicio = new Date(anoInicio, mesInicio, 1);
      const dataFim = new Date(anoFim, mesFim, 1);
      
      // Validar se a data fim é posterior à data início
      if (dataFim < dataInicio) {
        return { 
          success: false, 
          error: 'Data fim da competência deve ser posterior à data início' 
        };
      }
      
      // Gerar mensalidades do mês início até o mês fim
      let mesAtual = mesInicio;
      let anoAtual = anoInicio;
      
      while (anoAtual < anoFim || (anoAtual === anoFim && mesAtual <= mesFim)) {
        const vencimento = new Date(anoAtual, mesAtual, diaVencNum);

        const mensalidade = {
          alunoId,
          tipo: 'mensalidade',
          descricao: `Mensalidade ${vencimento.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} - ${nome}`,
          valor: valorMensalidadeComDesconto,
          valorOriginal: mensalidadeNum,
          desconto: descontoNum,
          vencimento: vencimento.toISOString().split('T')[0],
          status: 'pendente',
          observacoes: `Turma: ${turmaId || 'Não definida'} | Competência: ${dataInicio.toLocaleDateString('pt-BR')} a ${dataFim.toLocaleDateString('pt-BR')}`,
          dataGeracao: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const titulosRef = ref(database, 'titulos_financeiros');
        const novoTituloRef = await push(titulosRef, mensalidade);
        titulosGerados.push({ id: novoTituloRef.key, tipo: 'mensalidade', valor: valorMensalidadeComDesconto });
        
        // Avançar para o próximo mês
        mesAtual++;
        if (mesAtual > 11) {
          mesAtual = 0;
          anoAtual++;
        }
      }

      return { 
        success: true, 
        titulosGerados: titulosGerados.length,
        matricula: titulosGerados.filter(t => t.tipo === 'matricula').length,
        materiais: titulosGerados.filter(t => t.tipo === 'materiais').length,
        mensalidades: titulosGerados.filter(t => t.tipo === 'mensalidade').length,
        valorTotal: titulosGerados.reduce((sum, t) => sum + t.valor, 0),
        detalhes: titulosGerados
      };
    } catch (error) {
      console.error('Erro ao gerar títulos para novo aluno:', error);
      return { success: false, error: error.message };
    }
  },

  // Verificar se aluno pode ser ativado (matrícula e materiais pagos)
  async verificarStatusMatricula(alunoId) {
    try {
      const titulosRef = ref(database, 'titulos_financeiros');
      const snapshot = await get(titulosRef);
      
      if (!snapshot.exists()) {
        return { success: true, status: 'sem_titulos', podeAtivar: false };
      }

      const titulosObrigatorios = Object.entries(snapshot.val())
        .filter(([id, titulo]) => titulo.alunoId === alunoId && (titulo.tipo === 'matricula' || titulo.tipo === 'materiais'))
        .map(([id, titulo]) => ({ id, ...titulo }));

      if (titulosObrigatorios.length === 0) {
        return { success: true, status: 'sem_pagamentos_obrigatorios', podeAtivar: true };
      }

      const todosPagos = titulosObrigatorios.every(titulo => titulo.status === 'pago');
      const algumPago = titulosObrigatorios.some(titulo => titulo.status === 'pago');
      
      let status = 'pendente';
      if (todosPagos) {
        status = 'todos_pagos';
      } else if (algumPago) {
        status = 'parcialmente_pago';
      }
      
      return { 
        success: true, 
        status,
        podeAtivar: todosPagos,
        titulosObrigatorios,
        detalhes: {
          totalTitulos: titulosObrigatorios.length,
          titulosPagos: titulosObrigatorios.filter(t => t.status === 'pago').length,
          valorTotal: titulosObrigatorios.reduce((sum, t) => sum + t.valor, 0),
          valorPago: titulosObrigatorios.filter(t => t.status === 'pago').reduce((sum, t) => sum + t.valor, 0)
        }
      };
    } catch (error) {
      console.error('Erro ao verificar status da matrícula:', error);
      return { success: false, error: error.message };
    }
  },

  // Gerar mensalidades personalizadas com configurações avançadas
  async gerarMensalidadesPersonalizadas(alunoId, dadosFinanceiros, parametros = {}) {
    try {
      const { 
        mensalidadeValor, 
        diaVencimento, 
        descontoPercentual = 0 
      } = dadosFinanceiros;
      
      // Converter para números
      const mensalidadeNum = parseFloat(mensalidadeValor) || 0;
      const descontoNum = parseFloat(descontoPercentual) || 0;
      const diaVencNum = parseInt(diaVencimento) || 10;
      
      const {
        mesesParaGerar = 12,
        mesInicio = new Date().getMonth() + 1,
        anoInicio = new Date().getFullYear(),
        observacoes = '',
        sobrescreverExistentes = false
      } = parametros;

      const valorComDesconto = mensalidadeNum * (1 - descontoNum / 100);
      
      const mensalidades = [];
      
      for (let i = 0; i < mesesParaGerar; i++) {
        const mesVencimento = (mesInicio - 1 + i) % 12;
        const anoVencimento = anoInicio + Math.floor((mesInicio - 1 + i) / 12);
        const vencimento = new Date(anoVencimento, mesVencimento, diaVencNum);
        
        // Verificar se já existe mensalidade para este mês/ano
        if (!sobrescreverExistentes) {
          const titulosExistentes = await this.buscarTitulosAluno(alunoId, {
            tipo: 'mensalidade'
          });
          
          if (titulosExistentes.success) {
            const jaExiste = titulosExistentes.titulos.some(titulo => {
              const vencTitulo = new Date(titulo.vencimento);
              return vencTitulo.getMonth() === mesVencimento && 
                     vencTitulo.getFullYear() === anoVencimento;
            });
            
            if (jaExiste) continue; // Pular este mês
          }
        }
        
        const mensalidade = {
          alunoId,
          tipo: 'mensalidade',
          descricao: `Mensalidade ${vencimento.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          valor: valorComDesconto,
          valorOriginal: mensalidadeNum,
          desconto: descontoNum,
          vencimento: vencimento.toISOString().split('T')[0],
          status: 'pendente',
          observacoes,
          dataGeracao: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        mensalidades.push(mensalidade);
      }

      if (mensalidades.length === 0) {
        return { success: true, quantidade: 0, message: 'Nenhuma mensalidade nova para gerar' };
      }

      // Salvar todas as mensalidades
      const titulosRef = ref(database, 'titulos_financeiros');
      const promessas = mensalidades.map(mensalidade => push(titulosRef, mensalidade));
      
      await Promise.all(promessas);
      
      return { success: true, quantidade: mensalidades.length };
    } catch (error) {
      console.error('Erro ao gerar mensalidades personalizadas:', error);
      return { success: false, error: error.message };
    }
  },

  // Gerar mensalidades para um aluno
  async gerarMensalidades(alunoId, dadosFinanceiros, meses = 12) {
    try {
      const { mensalidadeValor, diaVencimento, descontoPercentual = 0 } = dadosFinanceiros;
      
      // Converter para números
      const mensalidadeNum = parseFloat(mensalidadeValor) || 0;
      const descontoNum = parseFloat(descontoPercentual) || 0;
      const diaVencNum = parseInt(diaVencimento) || 10;
      
      const valorComDesconto = mensalidadeNum * (1 - descontoNum / 100);
      
      const mensalidades = [];
      const hoje = new Date();
      
      for (let i = 0; i < meses; i++) {
        const vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + i, diaVencNum);
        
        const mensalidade = {
          alunoId,
          tipo: 'mensalidade',
          descricao: `Mensalidade ${vencimento.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          valor: valorComDesconto,
          valorOriginal: mensalidadeNum,
          desconto: descontoNum,
          vencimento: vencimento.toISOString().split('T')[0],
          status: 'pendente',
          dataGeracao: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        mensalidades.push(mensalidade);
      }

      // Salvar todas as mensalidades
      const titulosRef = ref(database, 'titulos_financeiros');
      const promessas = mensalidades.map(mensalidade => push(titulosRef, mensalidade));
      
      await Promise.all(promessas);
      
      return { success: true, quantidade: mensalidades.length };
    } catch (error) {
      console.error('Erro ao gerar mensalidades:', error);
      return { success: false, error: error.message };
    }
  },

  // Dar baixa em título (pagamento)
  async darBaixa(tituloId, dadosPagamento) {
    try {
      console.log('🔄 Iniciando darBaixa para título:', tituloId);
      console.log('📝 Dados do pagamento:', dadosPagamento);
      
      const { 
        formaPagamento = 'dinheiro', 
        observacoes = '', 
        baixadoPor,
        valorPago,
        dataRecebimento,
        numeroComprovante,
        contaDestino
      } = dadosPagamento;
      
      const tituloRef = ref(database, `titulos_financeiros/${tituloId}`);
      console.log('🔍 Buscando título no Firebase...');
      
      const snapshot = await get(tituloRef);
      
      if (!snapshot.exists()) {
        console.log('❌ Título não encontrado:', tituloId);
        return { success: false, error: 'Título não encontrado' };
      }

      const titulo = snapshot.val();
      console.log('📄 Título encontrado:', titulo);
      
      if (titulo.status === 'pago') {
        console.log('⚠️ Título já está pago');
        return { success: false, error: 'Título já está pago' };
      }

      const atualizacao = {
        ...titulo,
        status: 'pago',
        dataPagamento: dataRecebimento || new Date().toISOString(),
        dataRecebimento: dataRecebimento || new Date().toISOString(),
        formaPagamento,
        valorPago: valorPago || titulo.valor,
        numeroComprovante: numeroComprovante || '',
        contaDestino: contaDestino || '',
        observacoesPagamento: observacoes,
        baixadoPor,
        updatedAt: new Date().toISOString()
      };

      console.log('🔧 Dados para atualização:', atualizacao);
      console.log('🔧 Atualizando título:', { tituloId, statusAnterior: titulo.status, novoStatus: 'pago' });
      
      await set(tituloRef, atualizacao);
      
      console.log('✅ Título atualizado com sucesso no Firebase');
      
      // Se for um título de crédito pago, adicionar crédito ao aluno
      if (titulo.tipo === 'credito') {
        console.log('💳 Título de crédito detectado, adicionando crédito ao aluno...');
        const resultadoCredito = await this.adicionarCredito(
          titulo.alunoId, 
          titulo.valor, 
          `Crédito gerado pelo pagamento do título: ${titulo.descricao}`,
          baixadoPor
        );
        
        if (resultadoCredito.success) {
          console.log('✅ Crédito adicionado com sucesso:', resultadoCredito.novoSaldo);
        } else {
          console.error('❌ Erro ao adicionar crédito:', resultadoCredito.error);
        }
      }
      
      // Atualizar status financeiro do aluno
      console.log('🔄 Atualizando status financeiro do aluno:', titulo.alunoId);
      const resultadoStatus = await this.atualizarStatusFinanceiroAluno(titulo.alunoId);
      console.log('📊 Resultado da atualização de status:', resultadoStatus);
      
      console.log('🎉 Baixa concluída com sucesso!');
      return { success: true, dadosAtualizados: atualizacao };
    } catch (error) {
      console.error('❌ Erro ao dar baixa no título:', error);
      return { success: false, error: error.message };
    }
  },

  // Cancelar título
  async cancelarTitulo(tituloId, motivo, canceladoPor) {
    try {
      const tituloRef = ref(database, `titulos_financeiros/${tituloId}`);
      const snapshot = await get(tituloRef);
      
      if (!snapshot.exists()) {
        return { success: false, error: 'Título não encontrado' };
      }

      const titulo = snapshot.val();
      
      if (titulo.status === 'pago') {
        return { success: false, error: 'Não é possível cancelar título pago' };
      }

      const atualizacao = {
        ...titulo,
        status: 'cancelado',
        motivoCancelamento: motivo,
        dataCancelamento: new Date().toISOString(),
        canceladoPor,
        updatedAt: new Date().toISOString()
      };

      await set(tituloRef, atualizacao);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao cancelar título:', error);
      return { success: false, error: error.message };
    }
  },

  // Buscar títulos por aluno
  async buscarTitulosAluno(alunoId, filtros = {}) {
    try {
      const titulosRef = ref(database, 'titulos_financeiros');
      const snapshot = await get(titulosRef);
      
      if (!snapshot.exists()) {
        return { success: true, titulos: [] };
      }

      let titulos = Object.entries(snapshot.val())
        .filter(([id, titulo]) => titulo.alunoId === alunoId)
        .map(([id, titulo]) => ({ id, ...titulo }));

      // Aplicar filtros
      if (filtros.status) {
        titulos = titulos.filter(t => t.status === filtros.status);
      }
      
      if (filtros.tipo) {
        titulos = titulos.filter(t => t.tipo === filtros.tipo);
      }
      
      if (filtros.vencimentoInicio) {
        titulos = titulos.filter(t => t.vencimento >= filtros.vencimentoInicio);
      }
      
      if (filtros.vencimentoFim) {
        titulos = titulos.filter(t => t.vencimento <= filtros.vencimentoFim);
      }

      // Ordenar por vencimento
      titulos.sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));
      
      return { success: true, titulos };
    } catch (error) {
      console.error('Erro ao buscar títulos do aluno:', error);
      return { success: false, error: error.message };
    }
  },

  // Buscar títulos vencidos
  async buscarTitulosVencidos() {
    try {
      const titulosRef = ref(database, 'titulos_financeiros');
      const snapshot = await get(titulosRef);
      
      if (!snapshot.exists()) {
        return { success: true, titulos: [] };
      }

      const hoje = new Date().toISOString().split('T')[0];
      
      const titulosVencidos = Object.entries(snapshot.val())
        .filter(([id, titulo]) => 
          titulo.status === 'pendente' && titulo.vencimento < hoje
        )
        .map(([id, titulo]) => ({ id, ...titulo }));

      return { success: true, titulos: titulosVencidos };
    } catch (error) {
      console.error('Erro ao buscar títulos vencidos:', error);
      return { success: false, error: error.message };
    }
  },

  // Buscar títulos próximos ao vencimento
  async buscarTitulosProximosVencimento(dias = 7) {
    try {
      const titulosRef = ref(database, 'titulos_financeiros');
      const snapshot = await get(titulosRef);
      
      if (!snapshot.exists()) {
        return { success: true, titulos: [] };
      }

      const hoje = new Date();
      const dataLimite = new Date(hoje.getTime() + dias * 24 * 60 * 60 * 1000);
      const hojeStr = hoje.toISOString().split('T')[0];
      const dataLimiteStr = dataLimite.toISOString().split('T')[0];
      
      const titulosProximos = Object.entries(snapshot.val())
        .filter(([id, titulo]) => 
          titulo.status === 'pendente' && 
          titulo.vencimento >= hojeStr && 
          titulo.vencimento <= dataLimiteStr
        )
        .map(([id, titulo]) => ({ id, ...titulo }));

      return { success: true, titulos: titulosProximos };
    } catch (error) {
      console.error('Erro ao buscar títulos próximos ao vencimento:', error);
      return { success: false, error: error.message };
    }
  },

  // Calcular métricas financeiras
  async calcularMetricas(filtros = {}) {
    try {
      const titulosRef = ref(database, 'titulos_financeiros');
      const alunosRef = ref(database, 'alunos');
      
      const [titulosSnap, alunosSnap] = await Promise.all([
        get(titulosRef),
        get(alunosRef)
      ]);

      const titulos = titulosSnap.exists() ? 
        Object.entries(titulosSnap.val()).map(([id, titulo]) => ({ id, ...titulo })) : [];
      
      const alunos = alunosSnap.exists() ? 
        Object.entries(alunosSnap.val()).map(([id, aluno]) => ({ id, ...aluno })) : [];

      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      // Calcular receita mensal
      const receitaMensal = titulos
        .filter(t => {
          const vencimento = new Date(t.vencimento);
          return t.status === 'pago' && 
                 vencimento.getMonth() === mesAtual && 
                 vencimento.getFullYear() === anoAtual;
        })
        .reduce((sum, t) => sum + (t.valor || 0), 0);

      // Calcular receita anual
      const receitaAnual = titulos
        .filter(t => {
          const vencimento = new Date(t.vencimento);
          return t.status === 'pago' && vencimento.getFullYear() === anoAtual;
        })
        .reduce((sum, t) => sum + (t.valor || 0), 0);

      // Títulos vencidos
      const hojeStr = hoje.toISOString().split('T')[0];
      const titulosVencidos = titulos.filter(t => 
        t.status === 'pendente' && t.vencimento < hojeStr
      );

      // Alunos inadimplentes
      const alunosInadimplentes = new Set(titulosVencidos.map(t => t.alunoId)).size;
      
      // Total de alunos ativos
      const alunosAtivos = alunos.filter(a => a.status === 'ativo').length;
      
      // Taxa de inadimplência
      const taxaInadimplencia = alunosAtivos > 0 ? (alunosInadimplentes / alunosAtivos) * 100 : 0;

      // Próximos vencimentos (7 dias)
      const dataLimite = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const proximosVencimentos = titulos
        .filter(t => 
          t.status === 'pendente' && 
          t.vencimento >= hojeStr && 
          t.vencimento <= dataLimite
        )
        .reduce((sum, t) => sum + (t.valor || 0), 0);

      const metricas = {
        receitaMensal,
        receitaAnual,
        taxaInadimplencia,
        proximosVencimentos,
        totalTitulos: titulos.length,
        titulosPendentes: titulos.filter(t => t.status === 'pendente').length,
        titulosPagos: titulos.filter(t => t.status === 'pago').length,
        titulosVencidos: titulosVencidos.length,
        totalAlunos: alunos.length,
        alunosAtivos,
        alunosInadimplentes,
        valorTotalPendente: titulos
          .filter(t => t.status === 'pendente')
          .reduce((sum, t) => sum + (t.valor || 0), 0),
        valorTotalVencido: titulosVencidos.reduce((sum, t) => sum + (t.valor || 0), 0)
      };

      return { success: true, metricas };
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
      return { success: false, error: error.message };
    }
  },

  // Atualizar status financeiro do aluno
  async atualizarStatusFinanceiroAluno(alunoId) {
    try {
      // Buscar títulos pendentes e vencidos do aluno
      const { success, titulos } = await this.buscarTitulosAluno(alunoId, { status: 'pendente' });
      
      if (!success) return { success: false, error: 'Erro ao buscar títulos' };

      const hoje = new Date().toISOString().split('T')[0];
      const titulosVencidos = titulos.filter(t => t.vencimento < hoje);
      
      let novoStatus = 'ativo';
      if (titulosVencidos.length > 0) {
        novoStatus = 'inadimplente';
      }

      // Atualizar status do aluno
      const alunoRef = ref(database, `alunos/${alunoId}/financeiro/status`);
      await set(alunoRef, novoStatus);
      
      return { success: true, status: novoStatus };
    } catch (error) {
      console.error('Erro ao atualizar status financeiro do aluno:', error);
      return { success: false, error: error.message };
    }
  },

  // Aplicar desconto em título
  async aplicarDesconto(tituloId, desconto, motivo, aplicadoPor) {
    try {
      const tituloRef = ref(database, `titulos_financeiros/${tituloId}`);
      const snapshot = await get(tituloRef);
      
      if (!snapshot.exists()) {
        return { success: false, error: 'Título não encontrado' };
      }

      const titulo = snapshot.val();
      
      if (titulo.status !== 'pendente') {
        return { success: false, error: 'Só é possível aplicar desconto em títulos pendentes' };
      }

      const valorOriginal = titulo.valorOriginal || titulo.valor;
      const novoValor = valorOriginal * (1 - desconto / 100);

      const atualizacao = {
        ...titulo,
        valorOriginal,
        valor: novoValor,
        desconto,
        motivoDesconto: motivo,
        dataDesconto: new Date().toISOString(),
        descontoPor: aplicadoPor,
        updatedAt: new Date().toISOString()
      };

      await set(tituloRef, atualizacao);
      
      return { success: true, valorAnterior: titulo.valor, novoValor };
    } catch (error) {
      console.error('Erro ao aplicar desconto:', error);
      return { success: false, error: error.message };
    }
  },

  // Gerar relatório de inadimplência
  async relatorioInadimplencia() {
    try {
      const { success: successVencidos, titulos: titulosVencidos } = await this.buscarTitulosVencidos();
      if (!successVencidos) return { success: false, error: 'Erro ao buscar títulos vencidos' };

      // Agrupar por aluno
      const inadimplenciaPorAluno = {};
      
      for (const titulo of titulosVencidos) {
        if (!inadimplenciaPorAluno[titulo.alunoId]) {
          inadimplenciaPorAluno[titulo.alunoId] = {
            alunoId: titulo.alunoId,
            titulos: [],
            valorTotal: 0,
            quantidadeTitulos: 0
          };
        }
        
        inadimplenciaPorAluno[titulo.alunoId].titulos.push(titulo);
        inadimplenciaPorAluno[titulo.alunoId].valorTotal += titulo.valor;
        inadimplenciaPorAluno[titulo.alunoId].quantidadeTitulos++;
      }

      const relatorio = Object.values(inadimplenciaPorAluno);
      relatorio.sort((a, b) => b.valorTotal - a.valorTotal);

      return { 
        success: true, 
        relatorio,
        totalInadimplentes: relatorio.length,
        valorTotalInadimplencia: relatorio.reduce((sum, item) => sum + item.valorTotal, 0)
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de inadimplência:', error);
      return { success: false, error: error.message };
    }
  },

  // Gerenciamento de Créditos
  async adicionarCredito(alunoId, valor, motivo = '', adicionadoPor = '') {
    try {
      console.log('🔄 Adicionando crédito ao aluno:', alunoId, valor);
      
      const alunoRef = ref(database, `alunos/${alunoId}`);
      const snapshot = await get(alunoRef);
      
      if (!snapshot.exists()) {
        return { success: false, error: 'Aluno não encontrado' };
      }

      const aluno = snapshot.val();
      const creditoAtual = aluno.creditoDisponivel || 0;
      const novoCredito = creditoAtual + valor;

      const atualizacao = {
        ...aluno,
        creditoDisponivel: novoCredito,
        updatedAt: new Date().toISOString()
      };

      await set(alunoRef, atualizacao);

      // Registrar histórico de crédito
      const historicoRef = ref(database, `historico_creditos/${alunoId}`);
      const novoHistorico = {
        tipo: 'adicao',
        valor: valor,
        saldoAnterior: creditoAtual,
        saldoNovo: novoCredito,
        motivo: motivo || 'Crédito gerado por título pago',
        adicionadoPor,
        dataHora: new Date().toISOString()
      };

      await push(historicoRef, novoHistorico);

      console.log('✅ Crédito adicionado com sucesso:', novoCredito);
      return { success: true, novoSaldo: novoCredito };
    } catch (error) {
      console.error('❌ Erro ao adicionar crédito:', error);
      return { success: false, error: error.message };
    }
  },

  async utilizarCredito(alunoId, valor, tituloId = '', motivoUso = '') {
    try {
      console.log('🔄 Utilizando crédito do aluno:', alunoId, valor);
      
      const alunoRef = ref(database, `alunos/${alunoId}`);
      const snapshot = await get(alunoRef);
      
      if (!snapshot.exists()) {
        return { success: false, error: 'Aluno não encontrado' };
      }

      const aluno = snapshot.val();
      const creditoAtual = aluno.creditoDisponivel || 0;

      if (creditoAtual < valor) {
        return { 
          success: false, 
          error: `Crédito insuficiente. Disponível: R$ ${creditoAtual.toFixed(2)}` 
        };
      }

      const novoCredito = creditoAtual - valor;

      const atualizacao = {
        ...aluno,
        creditoDisponivel: novoCredito,
        updatedAt: new Date().toISOString()
      };

      await set(alunoRef, atualizacao);

      // Registrar histórico de crédito
      const historicoRef = ref(database, `historico_creditos/${alunoId}`);
      const novoHistorico = {
        tipo: 'utilizacao',
        valor: valor,
        saldoAnterior: creditoAtual,
        saldoNovo: novoCredito,
        tituloId: tituloId,
        motivo: motivoUso || 'Crédito utilizado em pagamento',
        dataHora: new Date().toISOString()
      };

      await push(historicoRef, novoHistorico);

      console.log('✅ Crédito utilizado com sucesso:', novoCredito);
      return { success: true, novoSaldo: novoCredito };
    } catch (error) {
      console.error('❌ Erro ao utilizar crédito:', error);
      return { success: false, error: error.message };
    }
  },

  async obterSaldoCredito(alunoId) {
    try {
      const alunoRef = ref(database, `alunos/${alunoId}`);
      const snapshot = await get(alunoRef);
      
      if (!snapshot.exists()) {
        return { success: false, error: 'Aluno não encontrado' };
      }

      const aluno = snapshot.val();
      const saldo = aluno.creditoDisponivel || 0;

      return { success: true, saldo };
    } catch (error) {
      console.error('❌ Erro ao obter saldo de crédito:', error);
      return { success: false, error: error.message };
    }
  },

  async obterHistoricoCreditos(alunoId) {
    try {
      const historicoRef = ref(database, `historico_creditos/${alunoId}`);
      const snapshot = await get(historicoRef);
      
      if (!snapshot.exists()) {
        return { success: true, historico: [] };
      }

      const historico = [];
      snapshot.forEach((child) => {
        historico.push({
          id: child.key,
          ...child.val()
        });
      });

      // Ordenar por data (mais recente primeiro)
      historico.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

      return { success: true, historico };
    } catch (error) {
      console.error('❌ Erro ao obter histórico de créditos:', error);
      return { success: false, error: error.message };
    }
  },

  // === FUNÇÕES DE CONTAS A PAGAR/PAGAS ===
  
  async criarConta(contaData, userId) {
    try {
      const novaConta = {
        ...contaData,
        id: Date.now().toString(),
        status: 'pendente',
        criadaPor: userId,
        criadaEm: new Date().toISOString()
      };

      const contasRef = ref(database, 'contas_pagar');
      const resultado = await push(contasRef, novaConta);
      
      // Se for conta recorrente, criar próximas ocorrências
      if (contaData.recorrente) {
        await this.criarContasRecorrentes(contaData, userId);
      }
      
      return { success: true, id: resultado.key };
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      return { success: false, error: error.message };
    }
  },

  async obterContasPagar() {
    try {
      const contasRef = ref(database, 'contas_pagar');
      const snapshot = await get(contasRef);
      
      if (!snapshot.exists()) {
        return { success: true, contas: [] };
      }

      const contas = [];
      snapshot.forEach((child) => {
        contas.push({
          id: child.key,
          ...child.val()
        });
      });

      // Filtrar apenas contas pendentes
      const contasPendentes = contas.filter(conta => conta.status === 'pendente');
      
      return { success: true, contas: contasPendentes };
    } catch (error) {
      console.error('Erro ao obter contas a pagar:', error);
      return { success: false, error: error.message };
    }
  },

  async obterContasPagas() {
    try {
      const contasRef = ref(database, 'contas_pagas');
      const snapshot = await get(contasRef);
      
      if (!snapshot.exists()) {
        return { success: true, contas: [] };
      }

      const contas = [];
      snapshot.forEach((child) => {
        contas.push({
          id: child.key,
          ...child.val()
        });
      });

      return { success: true, contas };
    } catch (error) {
      console.error('Erro ao obter contas pagas:', error);
      return { success: false, error: error.message };
    }
  },

  async pagarConta(conta, dadosPagamento, userId, permitirSaldoNegativo = false) {
    try {
      // Verificar saldo da escola
      const saldoResult = await this.obterSaldoEscola();
      if (!saldoResult.success) {
        return { success: false, error: 'Erro ao verificar saldo da escola' };
      }

      // Só verificar saldo se não permitir saldo negativo
      if (!permitirSaldoNegativo && saldoResult.saldo < conta.valor) {
        return { success: false, error: 'Saldo insuficiente para pagamento' };
      }

      // Mover conta para contas pagas
      const contaPaga = {
        ...conta,
        status: 'pago',
        dataPagamento: dadosPagamento.dataPagamento,
        formaPagamento: dadosPagamento.formaPagamento,
        observacoesPagamento: dadosPagamento.observacoes,
        pagoPor: userId,
        pagoEm: new Date().toISOString()
      };

      // Adicionar à lista de contas pagas
      const contasPagasRef = ref(database, 'contas_pagas');
      await push(contasPagasRef, contaPaga);

      // Remover da lista de contas a pagar
      const contaPagarRef = ref(database, `contas_pagar/${conta.id}`);
      await remove(contaPagarRef);

      // Atualizar saldo da escola
      const novoSaldo = saldoResult.saldo - conta.valor;
      const escolaRef = ref(database, 'configuracoes/escola/saldoDisponivel');
      await set(escolaRef, novoSaldo);

      return { success: true };
    } catch (error) {
      console.error('Erro ao pagar conta:', error);
      return { success: false, error: error.message };
    }
  },

  async obterSaldoEscola() {
    try {
      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();
      
      // Calcular receita mensal atual (títulos pagos do mês)
      const titulosRef = ref(database, 'titulos_financeiros');
      const snapshot = await get(titulosRef);
      
      let receitaMensal = 0;
      
      if (snapshot.exists()) {
        Object.values(snapshot.val()).forEach(titulo => {
          if (titulo.status === 'pago' && titulo.dataPagamento) {
            const dataPagamento = new Date(titulo.dataPagamento);
            if (dataPagamento.getMonth() + 1 === mesAtual && 
                dataPagamento.getFullYear() === anoAtual) {
              receitaMensal += parseFloat(titulo.valor) || 0;
            }
          }
        });
      }
      
      // Calcular gastos mensais (contas pagas do mês)
      const contasPagasRef = ref(database, 'contas_pagas');
      const contasPagasSnapshot = await get(contasPagasRef);
      
      let gastosMensais = 0;
      if (contasPagasSnapshot.exists()) {
        Object.values(contasPagasSnapshot.val()).forEach(conta => {
          if (conta.dataPagamento) {
            const dataPagamento = new Date(conta.dataPagamento);
            if (dataPagamento.getMonth() + 1 === mesAtual && 
                dataPagamento.getFullYear() === anoAtual) {
              gastosMensais += parseFloat(conta.valor) || 0;
            }
          }
        });
      }
      
      // Saldo = Receita Mensal - Gastos Mensais
      const saldoCalculado = receitaMensal - gastosMensais;
      
      // Atualizar saldo calculado no Firebase para cache
      const escolaRef = ref(database, 'configuracoes/escola/saldoDisponivel');
      await set(escolaRef, saldoCalculado);
      
      return { 
        success: true, 
        saldo: saldoCalculado,
        receitaMensal,
        gastosMensais
      };
    } catch (error) {
      console.error('Erro ao calcular saldo da escola:', error);
      return { success: false, error: error.message };
    }
  },

  async criarContasRecorrentes(contaData, userId) {
    try {
      const { tipoRecorrencia, vencimento } = contaData;
      const dataBase = new Date(vencimento);
      const contasRecorrentes = [];

      for (let i = 1; i <= 12; i++) { // Criar 12 ocorrências futuras
        let proximaData = new Date(dataBase);
        
        switch (tipoRecorrencia) {
          case 'mensal':
            proximaData.setMonth(proximaData.getMonth() + i);
            break;
          case 'trimestral':
            proximaData.setMonth(proximaData.getMonth() + (i * 3));
            break;
          case 'anual':
            proximaData.setFullYear(proximaData.getFullYear() + i);
            break;
        }

        const contaRecorrente = {
          ...contaData,
          id: `${Date.now()}_${i}`,
          vencimento: proximaData.toISOString().split('T')[0],
          status: 'pendente',
          criadaPor: userId,
          criadaEm: new Date().toISOString(),
          contaOriginal: true
        };

        contasRecorrentes.push(contaRecorrente);
      }

      // Salvar todas as contas recorrentes
      const contasRef = ref(database, 'contas_pagar');
      for (const conta of contasRecorrentes) {
        await push(contasRef, conta);
      }

      return { success: true, quantidadeCriada: contasRecorrentes.length };
    } catch (error) {
      console.error('Erro ao criar contas recorrentes:', error);
      return { success: false, error: error.message };
    }
  },

  // === FUNÇÕES DE FECHAMENTO MENSAL ===

  async fecharMes(mesAno, userId) {
    try {
      const { mes, ano } = mesAno;
      const mesId = `${ano}-${mes.toString().padStart(2, '0')}`;
      
      // Buscar contas pendentes do mês
      const contasPagarRef = ref(database, 'contas_pagar');
      const snapshot = await get(contasPagarRef);
      
      const contasPendentes = [];
      if (snapshot.exists()) {
        Object.entries(snapshot.val()).forEach(([id, conta]) => {
          const vencimento = new Date(conta.vencimento);
          if (vencimento.getMonth() + 1 === mes && 
              vencimento.getFullYear() === ano && 
              conta.status === 'pendente') {
            contasPendentes.push({ id, ...conta });
          }
        });
      }

      // Migrar contas pendentes para o próximo mês
      const proximoMes = mes === 12 ? 1 : mes + 1;
      const proximoAno = mes === 12 ? ano + 1 : ano;
      
      for (const conta of contasPendentes) {
        // Criar nova data de vencimento (próximo mês, mesmo dia)
        const novaData = new Date(proximoAno, proximoMes - 1, new Date(conta.vencimento).getDate());
        
        const contaMigrada = {
          ...conta,
          vencimento: novaData.toISOString().split('T')[0],
          migradaDe: `${mes}/${ano}`,
          observacoes: `${conta.observacoes || ''} [Migrada do mês ${mes}/${ano}]`.trim()
        };
        
        // Adicionar conta migrada
        await push(contasPagarRef, contaMigrada);
        
        // Remover conta original
        const contaOriginalRef = ref(database, `contas_pagar/${conta.id}`);
        await remove(contaOriginalRef);
      }

      // Salvar dados do fechamento
      const fechamentoRef = ref(database, `fechamentos_mensais/${mesId}`);
      await set(fechamentoRef, {
        mes,
        ano,
        dataFechamento: new Date().toISOString(),
        fechadoPor: userId,
        contasMigradas: contasPendentes.length,
        contasPendentes: contasPendentes.map(c => ({
          id: c.id,
          descricao: c.descricao,
          valor: c.valor,
          vencimento: c.vencimento
        }))
      });

      return { success: true, contasMigradas: contasPendentes.length };
    } catch (error) {
      console.error('Erro ao fechar mês:', error);
      return { success: false, error: error.message };
    }
  },

  async verificarMesFechado(mes, ano) {
    try {
      console.log('🔍 [verificarMesFechado] Verificando mês:', { mes, ano });
      
      const mesId = `${ano}-${mes.toString().padStart(2, '0')}`;
      const path = `fechamentos_mensais/${mesId}`;
      
      // Usar o método wrapper em vez de ref() diretamente
      const dados = await dbGet(path);
      const fechado = dados !== null;
      
      console.log('✅ [verificarMesFechado] Resultado:', { fechado, temDados: !!dados });
      
      return { success: true, fechado, dados };
    } catch (error) {
      console.error('❌ [verificarMesFechado] Erro ao verificar fechamento do mês:', error);
      return { success: false, error: error.message };
    }
  }
};


};

export default createFinanceiroService;