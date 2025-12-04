import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    // Inicializar o cliente Gemini com a chave da API
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('⚠️ Chave da API do Gemini não configurada!');
      console.log('📝 Configure a chave em .env.local:');
      console.log('   NEXT_PUBLIC_GEMINI_API_KEY=sua_chave_aqui');
      console.log('🔗 Obtenha sua chave em: https://aistudio.google.com/app/apikey');
      this.genAI = null;
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async gerarRelatorioEducacional(dadosAluno, template, detalhesPersonalizados = '') {
    if (!this.genAI) {
      throw new Error('Serviço Gemini não está configurado. Configure a chave da API.');
    }

    try {
      // Construir prompt especializado para relatórios educacionais
      const prompt = this.construirPromptEducacional(dadosAluno, template, detalhesPersonalizados);
      
      console.log('🤖 Enviando prompt para Gemini AI...');
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const texto = response.text();

      console.log('✅ Relatório gerado com sucesso pela IA!');
      
      return {
        sucesso: true,
        relatorio: texto,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao gerar relatório com Gemini:', error);
      
      // Retornar erro detalhado
      return {
        sucesso: false,
        erro: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  construirPromptEducacional(dadosAluno, template, detalhesPersonalizados) {
    // Calcular idade se tiver data de nascimento
    let idadeCalculada = 'Não informada';
    if (dadosAluno.dataNascimento) {
      try {
        const dataNasc = new Date(dadosAluno.dataNascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - dataNasc.getFullYear();
        const mes = hoje.getMonth() - dataNasc.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < dataNasc.getDate())) {
          idade--;
        }
        idadeCalculada = `${idade} anos`;
      } catch (e) {
        idadeCalculada = dadosAluno.dataNascimento;
      }
    }

    // Determinar período do ano letivo
    const mesAtual = new Date().getMonth() + 1; // 1-12
    let periodoLetivo = '';
    if (mesAtual >= 2 && mesAtual <= 4) {
      periodoLetivo = '1º Bimestre/Trimestre';
    } else if (mesAtual >= 5 && mesAtual <= 6) {
      periodoLetivo = '2º Bimestre/Trimestre';
    } else if (mesAtual >= 7 && mesAtual <= 9) {
      periodoLetivo = '3º Bimestre/Trimestre';
    } else if (mesAtual >= 10 && mesAtual <= 12) {
      periodoLetivo = '4º Bimestre/Final do Ano Letivo';
    } else {
      periodoLetivo = 'Início do Ano Letivo';
    }

    const promptBase = `Você é um(a) pedagogo(a) especialista em educação brasileira, com amplo conhecimento da BNCC (Base Nacional Comum Curricular), desenvolvimento infantil e práticas educacionais contemporâneas.

═══════════════════════════════════════════════════════════════
📋 DADOS DO ALUNO
═══════════════════════════════════════════════════════════════
👤 Nome: ${dadosAluno.nome}
🏫 Turma: ${dadosAluno.turma}
🎂 Idade: ${idadeCalculada}
📅 Período: ${periodoLetivo}
👨‍🏫 Professor(a): ${dadosAluno.professor}

═══════════════════════════════════════════════════════════════
📊 TIPO DE RELATÓRIO SOLICITADO
═══════════════════════════════════════════════════════════════
📌 Categoria: ${template.nome}
📝 Foco: ${template.descricao}

Diretrizes específicas do template:
${template.prompt}

═══════════════════════════════════════════════════════════════
🔍 OBSERVAÇÕES DO(A) PROFESSOR(A)
═══════════════════════════════════════════════════════════════
${detalhesPersonalizados 
  ? `O(a) professor(a) forneceu as seguintes observações específicas que DEVEM ser incorporadas de forma natural e detalhada no relatório:\n\n"${detalhesPersonalizados}"\n\n⚠️ IMPORTANTE: Utilize essas observações como base principal do relatório, expandindo e contextualizando cada ponto mencionado.`
  : `⚠️ ATENÇÃO: O(a) professor(a) não forneceu observações específicas. Neste caso, você deve:\n- Criar um relatório profissional e estruturado\n- Usar linguagem pedagógica adequada\n- Incluir aspectos gerais esperados para a idade/série\n- Deixar espaço para o professor complementar posteriormente\n- Usar formulações como "Durante o período observado...", "No contexto das atividades propostas..."`
}

═══════════════════════════════════════════════════════════════
✍️ INSTRUÇÕES DETALHADAS PARA ELABORAÇÃO
═══════════════════════════════════════════════════════════════

1️⃣ ESTRUTURA OBRIGATÓRIA DO RELATÓRIO:

**CABEÇALHO** (Dados do aluno formatados)
**INTRODUÇÃO** (1-2 parágrafos contextualizando o período avaliado)
**DESENVOLVIMENTO** (3-4 parágrafos sobre os aspectos solicitados)
**CONSIDERAÇÕES FINAIS** (1 parágrafo sintetizando os principais pontos)
**ENCAMINHAMENTOS PEDAGÓGICOS** (2-3 sugestões práticas e específicas)

2️⃣ LINGUAGEM E TOM:
- Use terminologia pedagógica apropriada (zona de desenvolvimento proximal, competências socioemocionais, protagonismo, autonomia)
- Tom respeitoso, construtivo e profissional
- Evite jargões excessivos que dificultem compreensão dos pais
- Balance entre linguagem técnica e acessível
- NUNCA use linguagem genérica ou "enrolação"

3️⃣ CONTEÚDO ESPECÍFICO:
- Cite exemplos concretos de comportamentos/situações (mesmo que hipotéticos baseados nas observações)
- Mencione competências BNCC relevantes para a idade/série
- Seja específico: em vez de "bom desempenho", descreva "demonstra autonomia ao realizar atividades de..."
- Inclua pontos positivos E áreas de desenvolvimento (sempre de forma construtiva)

4️⃣ EXTENSÃO E FORMATO:
- **350-450 palavras** (relatório substancial, mas não excessivo)
- Use **parágrafos bem estruturados** (não tópicos/bullets no corpo)
- Formatação em **Markdown** para seções
- Linguagem coesa e fluida entre parágrafos

5️⃣ ALINHAMENTO COM BNCC:
- Mencione competências gerais da BNCC quando relevante
- Conecte observações com habilidades esperadas para a faixa etária
- Use referências à BNCC de forma natural, não forçada

6️⃣ ENCAMINHAMENTOS PEDAGÓGICOS:
- Sugestões PRÁTICAS e APLICÁVEIS
- Direcionadas tanto para escola quanto família
- Específicas para o contexto descrito
- Exemplos: "Sugere-se trabalhar com jogos de raciocínio lógico...", "Recomenda-se estimular a leitura diária..."

═══════════════════════════════════════════════════════════════
⚠️ O QUE NÃO FAZER
═══════════════════════════════════════════════════════════════
❌ NÃO use frases genéricas como "O aluno é participativo e interessado"
❌ NÃO repita informações do cabeçalho no corpo do texto
❌ NÃO deixe seções vazias ou muito curtas
❌ NÃO use linguagem infantilizada
❌ NÃO inclua informações que não foram fornecidas (notas, frequência, etc.)
❌ NÃO faça diagnósticos médicos ou psicológicos

═══════════════════════════════════════════════════════════════
🎯 EXEMPLO DE ESTRUTURA ESPERADA
═══════════════════════════════════════════════════════════════

# Relatório Pedagógico

**Aluno(a):** [Nome]  
**Turma:** [Turma]  
**Período:** [Período]  
**Professor(a):** [Nome]

---

## Introdução

[Parágrafo contextualizando o período avaliado e objetivo do relatório]

## Desenvolvimento

[Parágrafo 1: Aspecto principal 1 com exemplos específicos]

[Parágrafo 2: Aspecto principal 2 conectando com BNCC]

[Parágrafo 3: Aspectos socioemocionais/comportamentais]

[Parágrafo 4: Áreas de desenvolvimento identificadas]

## Considerações Finais

[Síntese dos principais pontos observados]

## Encaminhamentos Pedagógicos

[2-3 sugestões práticas e específicas para continuidade do desenvolvimento]

═══════════════════════════════════════════════════════════════
🚀 AGORA GERE O RELATÓRIO PEDAGÓGICO COMPLETO
═══════════════════════════════════════════════════════════════`;

    return promptBase;
  }

  // Método para testar a conexão com a API
  async testarConexao() {
    if (!this.genAI) {
      return {
        sucesso: false,
        mensagem: 'Chave da API não configurada'
      };
    }

    try {
      const result = await this.model.generateContent('Responda apenas: "Conexão OK"');
      const response = await result.response;
      const texto = response.text();

      return {
        sucesso: true,
        mensagem: 'Conexão com Gemini AI estabelecida com sucesso!',
        resposta: texto
      };
    } catch (error) {
      return {
        sucesso: false,
        mensagem: `Erro na conexão: ${error.message}`
      };
    }
  }

  // Método para verificar se o serviço está configurado
  isConfigurado() {
    return this.genAI !== null;
  }
}

// Exportar instância única (singleton)
const geminiService = new GeminiService();
export default geminiService;