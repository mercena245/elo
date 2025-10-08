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
    const promptBase = `
Você é uma assistente pedagógica especializada em relatórios educacionais brasileiros, com conhecimento da BNCC (Base Nacional Comum Curricular).

CONTEXTO DO ALUNO:
- Nome: ${dadosAluno.nome}
- Turma: ${dadosAluno.turma}
- Idade/Data de nascimento: ${dadosAluno.dataNascimento || 'Não informado'}
- Professor(a) responsável: ${dadosAluno.professor}

TIPO DE RELATÓRIO SOLICITADO:
${template.nome} - ${template.descricao}

DIRETRIZES ESPECÍFICAS:
${template.prompt}

OBSERVAÇÕES ESPECÍFICAS DO PROFESSOR:
${detalhesPersonalizados || 'Nenhuma observação específica fornecida.'}

INSTRUÇÕES PARA GERAÇÃO:
1. Gere um relatório pedagógico profissional de 300-400 palavras
2. Use linguagem técnica educacional apropriada
3. Seja específico e construtivo
4. Inclua as observações do professor de forma natural no texto
5. Alinhado com as competências da BNCC
6. Estruture em seções claras
7. Conclua com sugestões práticas de desenvolvimento

FORMATO DE SAÍDA:
- Use formatação em Markdown
- Inclua cabeçalho com dados do aluno
- Organize em seções bem definidas
- Seja objetivo e profissional

Gere o relatório agora:`;

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