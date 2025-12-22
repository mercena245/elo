# 🚀 Guia Rápido - Sistema de Templates de Contratos

## ✅ Status: IMPLEMENTADO E FUNCIONAL

---

## 📦 Passo 1: Verificar Instalação

As dependências já foram instaladas:
- ✅ docxtemplater
- ✅ pizzip
- ✅ file-saver

---

## 🎯 Passo 2: Primeiro Uso

### 2.1 - Acessar Configurações

1. Faça login no sistema
2. Acesse: **Configurações → Templates e Contratos** (nova aba)

### 2.2 - Ler o Tutorial

A primeira vez que acessar, **leia o tutorial completo** que está integrado na tela. Ele explica:
- Como criar templates
- Como usar marcadores
- Lista completa de campos disponíveis

### 2.3 - Baixar Template Base

1. Clique em **"Baixar Template Base"**
2. Isso vai tentar baixar de `public/data/template_contrato_base.docx`

**⚠️ IMPORTANTE:** Se o arquivo não existir ainda, você precisará criá-lo manualmente.

---

## 📝 Passo 3: Criar Template Base (Se Necessário)

Como arquivos .docx são binários, você precisa criar manualmente:

### Opção A - Criar do Zero:

1. Abra o arquivo: `docs/CRIAR-TEMPLATE-BASE.md`
2. Copie todo o conteúdo do contrato
3. Abra Microsoft Word ou LibreOffice Writer
4. Cole o conteúdo
5. Formate (títulos, negrito, espaçamento)
6. Salve como: `public/data/template_contrato_base.docx`

### Opção B - Usar Contrato Existente:

Se você já tem um contrato em Word:
1. Abra seu contrato no Word
2. Substitua os dados fixos por marcadores: `{nomeAluno}`, `{cpfMae}`, etc
3. Consulte a lista de marcadores em `docs/TUTORIAL-TEMPLATES-CONTRATOS.md`
4. Salve como: `public/data/template_contrato_base.docx`

---

## 📤 Passo 4: Fazer Upload do Template

1. Acesse: **Configurações → Templates e Contratos**
2. Clique: **"Adicionar Template"**
3. Preencha:
   - **Nome:** Contrato de Matrícula 2025
   - **Tipo:** Matrícula
   - **Arquivo:** Selecione seu arquivo .docx
4. Clique: **"Salvar"**

---

## 🎨 Passo 5: Testar Geração

1. Acesse: **Alunos**
2. Localize um aluno com dados completos
3. Clique no botão **📄** (ao lado de 🖨️)
4. Selecione o template criado
5. Clique: **"Gerar Contrato"**
6. Aguarde o processamento (2-3 segundos)
7. O arquivo será baixado automaticamente

---

## 🔍 Verificar Resultado

Abra o arquivo .docx baixado e verifique:
- ✅ Todos os marcadores foram substituídos?
- ✅ Dados estão formatados corretamente?
- ✅ Não há `{nomeAluno}` ou outros marcadores visíveis?

Se aparecer marcadores não substituídos:
1. Verifique se o nome está EXATAMENTE como na lista
2. Verifique se não há espaços extras: `{ nomeAluno }` ❌
3. Verifique se os dados do aluno estão completos no cadastro

---

## 📋 Lista Rápida de Marcadores Essenciais

```
ALUNO:
{nomeAluno}, {cpfAluno}, {dataNascimento}, {idade}
{turma}, {turno}, {anoLetivo}

MÃE:
{nomeMae}, {cpfMae}, {telefoneMae}, {emailMae}

PAI:
{nomePai}, {cpfPai}, {telefonePai}, {emailPai}

ESCOLA:
{nomeEscola}, {cnpjEscola}, {enderecoEscola}
{nomeDiretor}, {emailEscola}

FINANCEIRO:
{valorFinal}, {diaVencimento}, {valorMensalidade}

DATAS:
{dataHoje}, {dataHojeExtenso}, {dataMatricula}
```

**Lista completa:** 60+ marcadores em `docs/TUTORIAL-TEMPLATES-CONTRATOS.md`

---

## ⚙️ Configurações Avançadas

### Múltiplos Templates

Você pode ter vários templates:
- Contrato de Matrícula
- Contrato de Rematrícula  
- Contrato de Transferência
- Termo de Responsabilidade

Basta fazer upload de cada um e ativar/desativar conforme necessário.

### Ativar/Desativar Templates

Na tela de **Templates e Contratos**, use o switch para:
- ✅ **Ativo:** Aparece na seleção ao gerar contratos
- ❌ **Inativo:** Não aparece, mas mantém o histórico

### Excluir Templates

Clique no ícone de lixeira para excluir permanentemente.
⚠️ **Atenção:** Esta ação não pode ser desfeita.

---

## 🆘 Solução de Problemas

### Problema: "Nenhum template disponível"
**Solução:** Faça upload de pelo menos um template e ative-o.

### Problema: "Erro ao gerar contrato"
**Soluções:**
1. Verifique se o template está no formato .docx (não .doc)
2. Verifique se os marcadores estão escritos corretamente
3. Abra o navegador no modo desenvolvedor (F12) e veja o console

### Problema: Marcadores não foram substituídos
**Soluções:**
1. Verifique se o nome está exatamente como na lista
2. Remove espaços extras: `{nomeAluno}` ✅ vs `{ nomeAluno }` ❌
3. Verifique se os dados do aluno estão completos

### Problema: "Dados vazios no contrato"
**Solução:** Complete o cadastro do aluno com todas as informações (CPF, endereço, responsáveis, etc).

---

## 📚 Documentação Completa

- **Tutorial Detalhado:** `docs/TUTORIAL-TEMPLATES-CONTRATOS.md`
- **Criar Template Base:** `docs/CRIAR-TEMPLATE-BASE.md`
- **Resumo da Implementação:** `SISTEMA-TEMPLATES-CONTRATOS-COMPLETO.md`

---

## ✨ Dicas Finais

1. **Teste primeiro:** Sempre teste com um aluno de exemplo antes de usar em produção
2. **Backup:** Mantenha uma cópia do template original antes de modificar
3. **Versões:** Crie templates inativos como backup ao atualizar
4. **Formatação:** Aplique negrito, cores e tamanhos FORA das chaves `{}`
5. **Copiar/Colar:** Use o botão "Copiar" ao lado de cada marcador na lista

---

**Sistema pronto para uso! 🎉**

Em caso de dúvidas, consulte a documentação completa em `docs/`.
