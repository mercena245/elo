# 🐛 Debug - Erro "Dados obrigatórios faltando"

## Erro Reportado
```
FirebaseError: Dados obrigatórios faltando.
```

## ✅ Melhorias Implementadas

### 1. Logs Detalhados no Frontend (SchoolManagement.jsx)
```javascript
console.log('📤 Dados sendo enviados para provisionNewSchool:');
console.log('nome:', dataToSend.nome);
console.log('cnpj:', dataToSend.cnpj);
console.log('responsavel:', dataToSend.responsavel);
console.log('email:', dataToSend.email);
console.log('userUid:', dataToSend.userUid);
console.log('userEmail:', dataToSend.userEmail);
console.log('Dados completos:', JSON.stringify(dataToSend, null, 2));
```

### 2. Logs Detalhados na Cloud Function (index.ts)
```typescript
console.log('📥 Dados recebidos na Cloud Function:', JSON.stringify(data, null, 2));
console.log('Validação de campos obrigatórios:');
console.log('nome:', nome, '- válido?', !!nome);
console.log('cnpj:', cnpj, '- válido?', !!cnpj);
console.log('responsavel:', responsavel, '- válido?', !!responsavel);
console.log('email:', email, '- válido?', !!email);
console.log('userUid:', userUid, '- válido?', !!userUid);
```

### 3. Mensagem de Erro Mais Específica
Agora quando faltar algum campo, a mensagem dirá **exatamente qual campo está faltando**:
```
Dados obrigatórios faltando: nome, email
```
Em vez de só:
```
Dados obrigatórios faltando.
```

## 📋 Campos Obrigatórios Verificados

A Cloud Function valida:
- ✅ `nome` - Nome da escola
- ✅ `cnpj` - CNPJ da escola
- ✅ `responsavel` - Nome do responsável
- ✅ `email` - Email de contato
- ✅ `userUid` - UID do usuário criador

## 🔍 Como Debugar

### Passo 1: Abrir Console do Navegador
1. Pressione `F12` no navegador
2. Vá na aba **Console**

### Passo 2: Tentar Criar uma Escola
1. Acesse o painel SuperAdmin
2. Clique em **"Nova Escola"**
3. Preencha o formulário (3 steps)
4. Clique em **"Criar Escola"**

### Passo 3: Verificar Logs no Console do Navegador
Você verá logs como:
```
📤 Dados sendo enviados para provisionNewSchool:
nome: Escola Teste ABC
cnpj: 12.345.678/0001-90
responsavel: Maria Silva
email: contato@escolateste.com
userUid: abc123xyz
userEmail: admin@elo.com
Dados completos: { ... }
```

### Passo 4: Verificar Logs no Firebase Console
1. Acesse: https://console.firebase.google.com/project/elo-school/functions/logs
2. Filtre por função: `provisionNewSchool`
3. Veja os logs da execução:
```
📥 Dados recebidos na Cloud Function: { ... }
Validação de campos obrigatórios:
nome: Escola Teste - válido? true
cnpj: 12.345.678/0001-90 - válido? true
...
```

## 🎯 Possíveis Causas do Erro

### 1. Campo Vazio no Formulário
- **Sintoma**: Um campo obrigatório não foi preenchido
- **Solução**: Preencher todos os campos com `*` (asterisco)

### 2. Campo com Apenas Espaços
- **Sintoma**: Campo preenchido com espaços vazios
- **Solução**: Adicionar trim() nos inputs

### 3. Usuário Não Autenticado
- **Sintoma**: `userUid` ou `userEmail` são `undefined`
- **Solução**: Garantir que usuário está logado antes de acessar painel

### 4. Estrutura de Dados Incorreta
- **Sintoma**: Campo aninhado não sendo enviado corretamente
- **Solução**: Verificar estrutura do `formData`

## 🛠️ Próximos Passos

1. **Teste a criação de escola** com o console aberto
2. **Copie os logs** que aparecerem (tanto do navegador quanto do Firebase)
3. **Identifique qual campo específico** está causando o erro
4. **Ajuste a validação/formulário** conforme necessário

## 📝 Estrutura Esperada dos Dados

```json
{
  "nome": "Escola ABC",
  "cnpj": "12.345.678/0001-90",
  "responsavel": "Maria Silva",
  "email": "contato@escolaabc.com",
  "telefone": "(11) 99999-9999",
  "endereco": {
    "rua": "Rua das Flores, 123",
    "cidade": "São Paulo",
    "cep": "01234-567",
    "estado": "SP"
  },
  "plano": "basico",
  "mensalidade": 1200,
  "dataVencimento": 15,
  "configuracoes": {
    "modulosAtivos": ["financeiro", "notas", "alunos"],
    "limiteAlunos": 200,
    "limiteProfessores": 15
  },
  "userUid": "xyz789abc",
  "userEmail": "admin@elo.com"
}
```

## ⚠️ Importante

- Os logs só aparecerão **após fazer o deploy** da função atualizada ✅ (já feito)
- Certifique-se de que está testando em **modo de desenvolvimento** para ver os logs
- Os logs do Firebase podem demorar alguns segundos para aparecer no console
