# 📄 Sistema de Templates de Contratos

## Visão Geral

O Sistema de Templates de Contratos permite que você crie documentos Word personalizados (.docx) que serão preenchidos automaticamente com os dados dos alunos, responsáveis e escola. Isso elimina a necessidade de editar manualmente cada contrato.

## 🎯 Benefícios

- ✅ **Flexibilidade Total**: Edite seus contratos no Word sem precisar programar
- ✅ **Automação Completa**: Dados preenchidos automaticamente
- ✅ **Formatação Profissional**: Mantém toda a formatação do Word (negrito, cores, tabelas, logos)
- ✅ **Múltiplos Templates**: Crie diferentes contratos para matrícula, rematrícula, transferência, etc.
- ✅ **Versionamento**: Mantenha múltiplas versões ativas ou inativas

---

## 📋 Como Funciona

### Passo 1: Criar o Template no Word

1. Baixe o **Template Base** na tela de Configurações → Templates e Contratos
2. Abra o arquivo no Microsoft Word ou LibreOffice
3. Edite o conteúdo do contrato conforme sua necessidade
4. Use **marcadores** (placeholders) onde os dados devem ser preenchidos

### Passo 2: Usar Marcadores

Os marcadores são palavras entre chaves `{}` que serão substituídas pelos dados reais.

**Exemplo:**

```
CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS

CONTRATANTE: {nomeMae}, CPF {cpfMae}
ALUNO: {nomeAluno}, nascido em {dataNascimento}
TURMA: {turma}, TURNO: {turno}
VALOR: {valorFinal}
```

**Resultado após processamento:**

```
CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS

CONTRATANTE: MARIA DA SILVA, CPF 123.456.789-00
ALUNO: JOÃO DA SILVA, nascido em 15/03/2015
TURMA: 3º Ano A, TURNO: MATUTINO
VALOR: R$ 850,00
```

### Passo 3: Fazer Upload

1. Salve seu template como `.docx`
2. Acesse **Configurações → Templates e Contratos**
3. Clique em **"Adicionar Template"**
4. Preencha o nome e selecione o arquivo
5. Clique em **"Salvar"**

### Passo 4: Gerar Contratos

1. Acesse a tela de **Alunos**
2. Selecione um aluno
3. Clique em **"Gerar Contrato"**
4. O sistema preencherá automaticamente e gerará o arquivo para download

---

## 🏷️ Lista Completa de Marcadores

### 👨‍🎓 Dados do Aluno

| Marcador | Descrição | Exemplo |
|----------|-----------|---------|
| `{nomeAluno}` | Nome completo em maiúsculas | JOÃO DA SILVA |
| `{cpfAluno}` | CPF formatado | 123.456.789-00 |
| `{dataNascimento}` | Data de nascimento | 15/03/2015 |
| `{idade}` | Idade em anos | 10 |
| `{turma}` | Nome da turma | 3º Ano A |
| `{turno}` | Turno | MATUTINO |
| `{nivelEnsino}` | Nível de ensino | ENSINO FUNDAMENTAL |
| `{anoLetivo}` | Ano letivo | 2025 |

### 👩 Dados da Mãe

| Marcador | Descrição | Exemplo |
|----------|-----------|---------|
| `{nomeMae}` | Nome completo | MARIA DA SILVA |
| `{cpfMae}` | CPF formatado | 987.654.321-00 |
| `{rgMae}` | RG | 12.345.678-9 |
| `{enderecoMae}` | Endereço (rua) | Rua das Flores, 123 |
| `{bairroMae}` | Bairro | Centro |
| `{cidadeMae}` | Cidade | Goiânia |
| `{ufMae}` | UF | GO |
| `{cepMae}` | CEP formatado | 74000-000 |
| `{telefoneMae}` | Telefone formatado | (62) 99999-9999 |
| `{emailMae}` | E-mail | maria@email.com |

### 👨 Dados do Pai

| Marcador | Descrição | Exemplo |
|----------|-----------|---------|
| `{nomePai}` | Nome completo | JOSÉ DA SILVA |
| `{cpfPai}` | CPF formatado | 111.222.333-44 |
| `{rgPai}` | RG | 98.765.432-1 |
| `{enderecoPai}` | Endereço (rua) | Rua das Flores, 123 |
| `{bairroPai}` | Bairro | Centro |
| `{cidadePai}` | Cidade | Goiânia |
| `{ufPai}` | UF | GO |
| `{cepPai}` | CEP formatado | 74000-000 |
| `{telefonePai}` | Telefone formatado | (62) 98888-8888 |
| `{emailPai}` | E-mail | jose@email.com |

### 💳 Responsável Financeiro

| Marcador | Descrição | Exemplo |
|----------|-----------|---------|
| `{responsavelFinanceiroTipo}` | Tipo (MÃE ou PAI) | MÃE |
| `{responsavelFinanceiroNome}` | Nome do responsável | MARIA DA SILVA |
| `{responsavelFinanceiroCpf}` | CPF formatado | 987.654.321-00 |

### 🏫 Dados da Escola

| Marcador | Descrição | Exemplo |
|----------|-----------|---------|
| `{nomeEscola}` | Nome da escola | ESCOLA EXEMPLO |
| `{cnpjEscola}` | CNPJ | 12.345.678/0001-00 |
| `{enderecoEscola}` | Endereço completo | Av. Principal, 456 - Goiânia/GO |
| `{telefoneEscola}` | Telefone | (62) 3333-3333 |
| `{emailEscola}` | E-mail | contato@escola.com |
| `{nomeDiretor}` | Nome do diretor | JOÃO DIRETOR |
| `{cidadeEscola}` | Cidade | Goiânia |
| `{ufEscola}` | UF | GO |

### 💰 Dados Financeiros

| Marcador | Descrição | Exemplo |
|----------|-----------|---------|
| `{valorMensalidade}` | Valor formatado | R$ 1.000,00 |
| `{valorMensalidadeNumerico}` | Valor numérico | 1000.00 |
| `{descontoPercentual}` | Percentual de desconto | 15 |
| `{valorDesconto}` | Valor do desconto | R$ 150,00 |
| `{valorDescontoNumerico}` | Valor numérico | 150.00 |
| `{valorFinal}` | Valor com desconto | R$ 850,00 |
| `{valorFinalNumerico}` | Valor numérico | 850.00 |
| `{diaVencimento}` | Dia de vencimento | 10 |
| `{dataInicioCompetencia}` | Data de início | 01/02/2025 |
| `{dataFimCompetencia}` | Data de fim | 30/11/2025 |

### 📅 Datas

| Marcador | Descrição | Exemplo |
|----------|-----------|---------|
| `{dataMatricula}` | Data da matrícula | 15/01/2025 |
| `{dataMatriculaExtenso}` | Data por extenso | 15 de janeiro de 2025 |
| `{dataHoje}` | Data atual | 22/12/2025 |
| `{dataHojeExtenso}` | Data atual por extenso | 22 de dezembro de 2025 |

---

## ⚠️ Regras Importantes

### ✅ FAÇA:

- Use chaves `{}` ao redor dos marcadores
- Mantenha os nomes EXATAMENTE como listado (case-sensitive)
- Mantenha a formatação (negrito, cores) **fora das chaves**
- Teste com um aluno antes de usar em produção

**Exemplo correto:**

```
O aluno **{nomeAluno}** está matriculado na turma {turma}.
```

### ❌ NÃO FAÇA:

- ❌ Não adicione espaços dentro das chaves: `{ nomeAluno }`
- ❌ Não altere o nome dos marcadores: `{nome_aluno}` ou `{NOMEALUNO}`
- ❌ Não aplique formatação dentro das chaves: `{**nomeAluno**}`
- ❌ Não use aspas ou outros caracteres: `{"nomeAluno"}`

---

## 🎨 Dicas de Formatação

### Negrito e Itálico

Aplique formatação **fora** das chaves:

```
O valor da mensalidade é **{valorFinal}**.
O aluno *{nomeAluno}* foi matriculado com sucesso.
```

### Tabelas

Você pode usar marcadores dentro de tabelas:

| Campo | Valor |
|-------|-------|
| Nome | {nomeAluno} |
| CPF | {cpfAluno} |
| Turma | {turma} |

### Listas

Combine texto fixo com marcadores:

- Aluno: {nomeAluno}
- Responsável: {nomeMae}
- Valor: {valorFinal}

---

## 🔧 Solução de Problemas

### Problema: "Erro ao processar template"

**Causa:** Marcador digitado incorretamente.

**Solução:** Verifique se todos os marcadores estão escritos EXATAMENTE como na lista acima. Use copiar/colar para evitar erros.

---

### Problema: Marcador não foi substituído (aparece {nomeAluno} no documento final)

**Causa:** Nome do marcador incorreto ou espaços extras.

**Solução:**
1. Abra o template no Word
2. Clique no marcador problemático
3. Delete e digite novamente (ou copie da lista)
4. Certifique-se de não ter espaços: `{nomeAluno}` ✅ vs `{ nomeAluno }` ❌

---

### Problema: Template não aparece na tela de alunos

**Causa:** Template está inativo.

**Solução:** Acesse Configurações → Templates e Contratos e ative o template usando o switch.

---

### Problema: Dados vazios no contrato

**Causa:** Informações faltando no cadastro do aluno.

**Solução:** Complete o cadastro do aluno com todas as informações necessárias antes de gerar o contrato.

---

## 📞 Suporte

Se você encontrar problemas não listados aqui:

1. Verifique se os dados do aluno estão completos
2. Teste com o template base fornecido
3. Verifique se o arquivo está salvo como `.docx` (não `.doc` ou `.pdf`)
4. Entre em contato com o suporte técnico

---

## 🚀 Recursos Avançados

### Múltiplos Templates

Você pode ter vários templates ativos:
- **Contrato de Matrícula**: Para novos alunos
- **Contrato de Rematrícula**: Para alunos antigos
- **Contrato de Transferência**: Para alunos transferidos

### Controle de Versão

Mantenha templates inativos como backup:
1. Faça upload do novo template
2. Desative o template antigo (não exclua)
3. Teste o novo template
4. Se necessário, reative o antigo

---

## ✨ Exemplo Completo de Contrato

Veja um exemplo completo no **Template Base** disponível para download na tela de Configurações.

O template inclui:
- Cabeçalho com dados da escola
- Qualificação dos contratantes
- Dados do aluno
- Cláusulas contratuais
- Informações financeiras
- Assinaturas

Você pode usar este template como está ou modificá-lo conforme necessário.

---

**Última atualização:** 22 de dezembro de 2025
