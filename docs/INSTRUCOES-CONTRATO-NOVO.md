# 📋 Instruções - Novo Sistema de Contratos

## 🎯 O que foi implementado

Criei um **novo componente de contrato** (`ContratoAlunoNovo.jsx`) que:

✅ Gera contrato HTML dinamicamente com todos os dados do aluno
✅ Substitui automaticamente variáveis do template
✅ Formata datas, CPF, CEP, telefones e valores monetários
✅ Calcula idade automaticamente
✅ Busca dados da escola do Firebase
✅ Layout profissional pronto para impressão
✅ Versão resumida e legível (não mais 100 páginas!)

---

## 🔧 Como Usar

### 1. Substituir o Componente Antigo

Abra `src/app/alunos/page.jsx` e substitua:

```javascript
// ❌ ANTIGO
import ContratoAluno from '../../components/ContratoAluno';

// ✅ NOVO
import ContratoAluno from '../../components/ContratoAlunoNovo';
```

### 2. As Props Já Estão Corretas

O componente já está recebendo as props necessárias:
```javascript
<ContratoAluno 
  aluno={alunoSelecionadoFicha}
  database={db}
  getData={getData}
  onClose={handleFecharContrato}
/>
```

### 3. Testar

1. Abra a página de alunos
2. Selecione um aluno
3. Clique em "Gerar Contrato"
4. Verifique se os dados aparecem corretamente
5. Use o botão "Imprimir" para gerar o PDF

---

## 📊 Dados Necessários no Cadastro do Aluno

Para o contrato funcionar completamente, certifique-se de que o aluno tem:

### **Dados do Aluno:**
- ✅ Nome completo
- ✅ CPF
- ✅ Data de nascimento
- ✅ Turma (ex: "MATERNAL", "1º ANO")
- ✅ Turno (ex: "MATUTINO", "VESPERTINO", "INTEGRAL")

### **Dados da Mãe:**
- ✅ Nome completo
- ✅ CPF
- ✅ RG
- ✅ Endereço completo (rua, bairro, cidade, UF, CEP)
- ✅ Telefone
- ✅ Marcação de "Responsável Financeiro" (se aplicável)

### **Dados do Pai:**
- ✅ Nome completo
- ✅ CPF
- ✅ RG
- ✅ Endereço completo
- ✅ Telefone
- ✅ Marcação de "Responsável Financeiro" (se aplicável)

### **Dados Financeiros:**
- ✅ Valor da mensalidade
- ✅ Desconto percentual (se houver)
- ✅ Dia de vencimento
- ✅ Data início competência
- ✅ Data fim competência
- ✅ Data de matrícula

### **Dados da Escola** (em Configurações):
- ✅ Nome da escola
- ✅ CNPJ
- ✅ Endereço completo
- ✅ Nome do diretor
- ✅ Email
- ✅ Telefone

---

## 🎨 Personalização do Contrato

### Alterar Valores Padrão

No arquivo `ContratoAlunoNovo.jsx`, procure por:

```javascript
// Linha ~295
MINIMO_ALUNOS_TURMA: '15',
VALOR_2VIA_DOCUMENTOS: 'R$ 25,00',
HORA_INICIO: '07:00',
HORA_FIM: '18:00',
// etc...
```

### Alterar Horários

```javascript
HORA_INICIO_MANHA: '07:00',
HORA_FIM_MANHA: '11:00',
HORA_INICIO_TARDE: '13:00',
HORA_FIM_TARDE: '17:00',
```

### Adicionar Cláusulas Personalizadas

No HTML do contrato (linha ~350+), adicione novas divs:

```javascript
<div class="clausula">
  <div class="clausula-title">CLÁUSULA SÉTIMA - SUA NOVA CLÁUSULA</div>
  <p class="paragrafo">Texto da sua cláusula...</p>
</div>
```

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: Dados da escola não aparecem
**Solução:** Verifique se os dados estão salvos em **Configurações > Dados da Escola**

### Problema 2: Idade aparece como "0"
**Solução:** Verifique o formato da data de nascimento (deve ser DD/MM/YYYY ou YYYY-MM-DD)

### Problema 3: CPF sem formatação
**Solução:** O sistema formata automaticamente, mas certifique-se de que o CPF tem 11 dígitos

### Problema 4: Valores monetários errados
**Solução:** Verifique se o valor da mensalidade está como número, não texto

### Problema 5: Competência invertida
**Solução:** Verifique se salvou data início ANTES da data fim

---

## 📱 Versão Mobile/Impressão

O contrato é **automaticamente otimizado para impressão**:

- ✅ Formato A4
- ✅ Margens ajustadas
- ✅ Fonte Times New Roman (padrão jurídico)
- ✅ Botões de impressão ocultos na impressão
- ✅ Layout profissional

Para gerar PDF:
1. Clique em "Imprimir"
2. Escolha "Salvar como PDF"
3. Pronto!

---

## 🚀 Próximas Melhorias Sugeridas

1. **Adicionar logo da escola** no cabeçalho
2. **Criar versões de contrato** por nível (infantil, fundamental, médio)
3. **Salvar histórico de contratos** assinados
4. **Assinatura digital** integrada
5. **Envio por email** automático
6. **Cláusulas condicionais** (ex: só mostrar período integral se aplicável)

---

## 📞 Suporte

Se tiver problemas ou dúvidas:
1. Verifique os logs no console do navegador (F12)
2. Confira se todos os dados estão preenchidos
3. Teste com outro aluno para comparar

---

## ✅ Checklist de Deploy

Antes de colocar em produção:

- [ ] Testar com alunos de diferentes turmas
- [ ] Testar com dados incompletos (validar fallbacks)
- [ ] Imprimir e revisar formatação
- [ ] Validar com advogado (se necessário)
- [ ] Testar em diferentes navegadores
- [ ] Testar impressão em diferentes impressoras
- [ ] Backup do componente antigo
- [ ] Documentar mudanças no README principal

---

**Criado em:** Janeiro 2025
**Versão:** 1.0
**Status:** ✅ Pronto para uso
