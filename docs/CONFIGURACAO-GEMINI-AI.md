# 🤖 Integração com Google Gemini AI - Relatórios Pedagógicos

Este documento explica como configurar e usar a integração com a Google Gemini AI para geração automática de relatórios pedagógicos.

## 🎯 Funcionalidade

A integração permite que professores gerem relatórios pedagógicos personalizados usando Inteligência Artificial, baseados em:
- Dados do aluno (nome, turma, idade)
- Template educacional selecionado
- Observações específicas da professora
- Diretrizes da BNCC

## ⚙️ Configuração

### 1. Obter Chave da API do Google Gemini

1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave gerada

### 2. Configurar no Projeto

1. Crie um arquivo `.env.local` na raiz do projeto (se não existir)
2. Adicione a linha:
```
NEXT_PUBLIC_GEMINI_API_KEY=sua_chave_aqui
```
3. Substitua `sua_chave_aqui` pela chave obtida no passo anterior
4. Reinicie o servidor de desenvolvimento

### 3. Verificar Configuração

1. Acesse **Sala do Professor > Relatórios Pedagógicos**
2. Clique em **"Gerar Relatório com IA"**
3. Clique no botão **"🔧 Testar Conexão com IA"**
4. Se configurado corretamente, verá: "Conexão com Gemini AI estabelecida com sucesso!"

## 🚀 Como Usar

### 1. Selecionar Dados
- Escolha uma **turma** nos filtros
- Selecione um **aluno específico**
- Escolha o **template** de relatório desejado

### 2. Personalizar (Opcional)
- Preencha o campo **"Detalhes e observações específicas"**
- Inclua comportamentos, habilidades, dificuldades observadas
- Quanto mais detalhes, mais personalizado será o relatório

### 3. Gerar Relatório
- Clique em **"Gerar Relatório"**
- Aguarde alguns segundos (a IA está processando)
- Revise o relatório gerado
- Clique em **"Salvar Relatório"** se satisfeito

## 📋 Templates Disponíveis

### 🎓 Desenvolvimento Geral
Relatório abrangente baseado nas competências da BNCC, incluindo aspectos cognitivos, socioemocionais, participação e evolução acadêmica.

### 👥 Comportamental e Social
Foco em relacionamentos interpessoais, autorregulação, participação em grupos e desenvolvimento da autonomia.

### 📚 Aprendizagem Específica
Análise de habilidades específicas, compreensão de conceitos, dificuldades identificadas e estratégias de aprendizagem.

## 💡 Dicas para Melhores Resultados

### Observações Específicas Eficazes:
✅ **BOM:** "João tem dificuldade em matemática, mas é excelente em leitura. Muito criativo e colaborativo."

❌ **RUIM:** "Aluno bom."

### Exemplos de Detalhes Úteis:
- Comportamentos específicos observados
- Dificuldades em disciplinas específicas
- Habilidades destacadas
- Interação com colegas
- Evolução ao longo do período
- Participação em atividades

## 🔧 Solução de Problemas

### Erro: "IA não configurada"
**Causa:** Chave da API não configurada ou inválida
**Solução:** Verificar configuração da chave no `.env.local`

### Erro: "Limite de uso atingido"
**Causa:** Excedeu o limite gratuito da API (15 req/min)
**Solução:** Aguardar alguns minutos ou upgradar plano

### Erro: "Erro de conexão"
**Causa:** Problema de internet ou API indisponível
**Solução:** Verificar conexão e tentar novamente

### Relatório genérico demais
**Causa:** Poucas informações específicas fornecidas
**Solução:** Fornecer mais detalhes no campo de observações

## 🆓 Limites da API Gratuita

- **15 requisições por minuto**
- **1.500 requisições por dia**
- Suficiente para uso normal da escola

Para uso intensivo, considere upgrade para plano pago.

## 🔒 Segurança

- A chave da API fica no frontend (NEXT_PUBLIC_)
- Para maior segurança, considere implementação backend
- Nunca compartilhe sua chave da API
- Monitore uso para evitar abusos

## 📈 Próximos Passos

- [ ] Implementar cache de relatórios
- [ ] Adicionar mais templates
- [ ] Integração com Cloud Functions (mais seguro)
- [ ] Métricas de uso da IA
- [ ] Feedback de qualidade dos relatórios

---

**Desenvolvido em:** 8 de outubro de 2025  
**Versão:** 1.0  
**Status:** ✅ Ativo e Funcional