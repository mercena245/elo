import { db, ref, get, set, push, update, remove } from '../firebase';

export const financeiroService = {
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

      const titulosRef = ref(db, 'titulos_financeiros');
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
        valorMatricula = 0
      } = financeiro;

      // Converter para números para garantir cálculos corretos
      const mensalidadeNum = parseFloat(mensalidadeValor) || 0;
      const descontoNum = parseFloat(descontoPercentual) || 0;
      const valorMatriculaNum = parseFloat(valorMatricula) || 0;
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

        const titulosRef = ref(db, 'titulos_financeiros');
        const novoTituloRef = await push(titulosRef, tituloMatricula);
        titulosGerados.push({ id: novoTituloRef.key, tipo: 'matricula', valor: valorMatriculaNum });
      }

      // 2. Gerar mensalidades do mês atual até dezembro
      const valorMensalidadeComDesconto = mensalidadeNum * (1 - descontoNum / 100);
      const mesAtual = hoje.getMonth(); // 0-11 (Janeiro=0, Dezembro=11)
      const anoAtual = hoje.getFullYear();
      const mesesRestantes = 12 - mesAtual; // Quantos meses restam até dezembro
      
      for (let i = 0; i < mesesRestantes; i++) {
        const mesVencimento = mesAtual + i;
        const anoVencimento = anoAtual;
        const vencimento = new Date(anoVencimento, mesVencimento, diaVencNum);

        const mensalidade = {
          alunoId,
          tipo: 'mensalidade',
          descricao: `Mensalidade ${vencimento.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} - ${nome}`,
          valor: valorMensalidadeComDesconto,
          valorOriginal: mensalidadeNum,
          desconto: descontoNum,
          vencimento: vencimento.toISOString().split('T')[0],
          status: 'pendente',
          observacoes: `Turma: ${turmaId || 'Não definida'}`,
          dataGeracao: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const titulosRef = ref(db, 'titulos_financeiros');
        const novoTituloRef = await push(titulosRef, mensalidade);
        titulosGerados.push({ id: novoTituloRef.key, tipo: 'mensalidade', valor: valorMensalidadeComDesconto });
      }

      return { 
        success: true, 
        titulosGerados: titulosGerados.length,
        matricula: titulosGerados.filter(t => t.tipo === 'matricula').length,
        mensalidades: titulosGerados.filter(t => t.tipo === 'mensalidade').length,
        valorTotal: titulosGerados.reduce((sum, t) => sum + t.valor, 0),
        detalhes: titulosGerados
      };
    } catch (error) {
      console.error('Erro ao gerar títulos para novo aluno:', error);
      return { success: false, error: error.message };
    }
  },

  // Verificar se aluno pode ser ativado (matrícula paga)
  async verificarStatusMatricula(alunoId) {
    try {
      const titulosRef = ref(db, 'titulos_financeiros');
      const snapshot = await get(titulosRef);
      
      if (!snapshot.exists()) {
        return { success: true, status: 'sem_titulos', podeAtivar: false };
      }

      const titulos = Object.entries(snapshot.val())
        .filter(([id, titulo]) => titulo.alunoId === alunoId && titulo.tipo === 'matricula')
        .map(([id, titulo]) => ({ id, ...titulo }));

      if (titulos.length === 0) {
        return { success: true, status: 'sem_matricula', podeAtivar: true };
      }

      const matriculaPaga = titulos.some(titulo => titulo.status === 'pago');
      
      return { 
        success: true, 
        status: matriculaPaga ? 'matricula_paga' : 'matricula_pendente',
        podeAtivar: matriculaPaga,
        titulosMatricula: titulos
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
      const titulosRef = ref(db, 'titulos_financeiros');
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
      const titulosRef = ref(db, 'titulos_financeiros');
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
      
      const tituloRef = ref(db, `titulos_financeiros/${tituloId}`);
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
      const tituloRef = ref(db, `titulos_financeiros/${tituloId}`);
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
      const titulosRef = ref(db, 'titulos_financeiros');
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
      const titulosRef = ref(db, 'titulos_financeiros');
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
      const titulosRef = ref(db, 'titulos_financeiros');
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
      const titulosRef = ref(db, 'titulos_financeiros');
      const alunosRef = ref(db, 'alunos');
      
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
      const alunoRef = ref(db, `alunos/${alunoId}/financeiro/status`);
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
      const tituloRef = ref(db, `titulos_financeiros/${tituloId}`);
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
  }
};

export default financeiroService;