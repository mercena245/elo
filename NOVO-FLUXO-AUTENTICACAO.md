# 🔄 Novo Fluxo de Autenticação Multi-Tenant

## 📊 Estrutura do Banco de Gerenciamento

```
gerenciamento-elo-school.firebaseio.com/
└── escolas/
    ├── -ObZHudPDoVkWnCFvkVD/          ← ID da Escola (gerado pelo Firebase)
    │   ├── nome: "Escola Teste"
    │   ├── cnpj: "11.111.111/0001-11"
    │   ├── databaseURL: "https://escola-teste-default-rtdb.firebaseio.com"
    │   ├── storageBucket: "escola-teste.appspot.com"
    │   ├── projectId: "escola-teste"
    │   ├── endereco: {...}
    │   └── usuarios/                   ← Usuários DENTRO de cada escola
    │       ├── WVXDx8LKR0UTSMXCILr8L3BLQxp1/
    │       │   ├── email: "usuario@escola.com"
    │       │   ├── role: "coordenadora"
    │       │   └── ativo: true
    │       └── xyz123.../
    │           ├── email: "professor@escola.com"
    │           ├── role: "professora"
    │           └── ativo: true
    └── -Abc123XyzDefGhi/
        ├── nome: "Outra Escola"
        └── usuarios/
            └── ...
```

## ⚠️ IMPORTANTE: Estrutura Antiga vs Nova

### ❌ Estrutura Antiga (NÃO FUNCIONA):
```
gerenciamento-elo-school/
├── escolas/
│   └── {escolaId}/
│       └── dados da escola
└── usuarios/                    ← Separado!
    └── {userId}/
        └── escolas/
            └── {escolaId}: {role}
```

### ✅ Estrutura Nova (CORRETA):
```
gerenciamento-elo-school/
└── escolas/
    └── {escolaId}/
        ├── dados da escola
        └── usuarios/            ← Dentro da escola!
            └── {userId}/
                ├── email
                ├── role
                └── ativo
```

## 🔄 Fluxo Completo Explicado

### 1️⃣ **Login**
```
Usuário faz login com Firebase Auth
   ↓
Firebase retorna: userId (WVXDx8LKR0UTSMXCILr8L3BLQxp1)
```

### 2️⃣ **Buscar Escolas do Usuário**
```javascript
// ANTES (ERRADO - causava Permission Denied):
const userRef = ref(managementDB, `usuarios/${userId}`);
// ❌ Não existe esse nó!

// AGORA (CORRETO):
const escolasRef = ref(managementDB, 'escolas');
const todasEscolas = await get(escolasRef);

// Percorrer TODAS as escolas
for (const [escolaId, escolaData] of Object.entries(todasEscolas)) {
  // Verificar se o usuário está nesta escola
  if (escolaData.usuarios && escolaData.usuarios[userId]) {
    // ✅ ENCONTROU! Adiciona à lista
    escolasDoUsuario.push({
      id: escolaId,
      nome: escolaData.nome,
      databaseURL: escolaData.databaseURL,
      storageBucket: escolaData.storageBucket,
      projectId: escolaData.projectId,
      role: escolaData.usuarios[userId].role
    });
  }
}
```

### 3️⃣ **Exibir Tela de Seleção**
```
Se usuário encontrado em 1 ou mais escolas:
   ↓
Mostra AccessTypeSelector com lista de escolas
```

### 4️⃣ **Usuário Seleciona Escola**
```
Usuário clica em "Escola Teste"
   ↓
handleSchoolAccess(escola) é chamado
   ↓
localStorage.setItem('selectedSchool', JSON.stringify(escola))
   ↓
onSchoolSelect(escola) - chama loadSchoolData(escola.id)
```

### 5️⃣ **Carregar Dados Completos da Escola**
```javascript
// loadSchoolData busca no managementDB
const escolaRef = ref(managementDB, `escolas/${escolaId}`);
const snapshot = await get(escolaRef);

const fullSchoolData = {
  id: escolaId,
  nome: "Escola Teste",
  databaseURL: "https://escola-teste-default-rtdb.firebaseio.com",
  storageBucket: "escola-teste.appspot.com",
  projectId: "escola-teste",
  ...outrosDados
};

setCurrentSchool(fullSchoolData);
```

### 6️⃣ **Conectar ao Banco da Escola**
```javascript
// useSchoolDatabase detecta currentSchool
const databaseOps = schoolDatabaseOperations(currentSchool);
// ↓
// Cria conexão com: https://escola-teste-default-rtdb.firebaseio.com
// ✅ AGORA todas as operações vão para o banco CORRETO!
```

### 7️⃣ **Carregar Dados Operacionais**
```javascript
// Dashboard usa o hook
const { getData } = useSchoolDatabase();

// Busca no banco da escola (NÃO no gerenciamento)
const alunos = await getData('alunos');
const turmas = await getData('turmas');
// etc.
```

## 🎯 Resumo dos Bancos

### **Banco de Gerenciamento** (managementDB)
- **URL**: `https://gerenciamento-elo-school.firebaseio.com/`
- **Usado para**:
  - ✅ Cadastro de escolas
  - ✅ Vincular usuários às escolas
  - ✅ Buscar configurações técnicas (databaseURL, storageBucket, etc.)
  - ✅ Gerenciar permissões e planos

### **Banco da Escola** (dinâmico por escola)
- **URL**: `https://escola-teste-default-rtdb.firebaseio.com/` (exemplo)
- **Usado para**:
  - ✅ Alunos
  - ✅ Turmas
  - ✅ Colaboradores
  - ✅ Notas
  - ✅ Frequência
  - ✅ Avisos
  - ✅ Galeria de fotos
  - ✅ Tudo relacionado à operação da escola

## 🔧 Como Vincular um Usuário a uma Escola

### Opção 1: Via Firebase Console (Manual)

1. Abra: `https://console.firebase.google.com/project/gerenciamento-elo-school`
2. Vá em: **Realtime Database**
3. Navegue até: `escolas/-ObZHudPDoVkWnCFvkVD/usuarios`
4. Clique no **+** para adicionar
5. **Nome**: `WVXDx8LKR0UTSMXCILr8L3BLQxp1` (ID do usuário do Firebase Auth)
6. **Adicione campos**:
   ```json
   {
     "email": "gubra10@gmail.com",
     "role": "coordenadora",
     "ativo": true,
     "criadoEm": "2025-10-14T10:00:00.000Z"
   }
   ```
7. Salve

### Opção 2: Via Super Admin (Automático)

1. Login como Super Admin
2. Vá em: **Super Admin → Escolas**
3. Clique em **"Vincular Usuário"** na escola desejada
4. Selecione o usuário
5. Defina a role (coordenadora, professora, etc.)
6. ✅ O sistema adiciona automaticamente em `escolas/{escolaId}/usuarios/{userId}`

## 📋 Checklist de Validação

Após implementar o novo fluxo, valide:

- [ ] `loadUserSchools` percorre TODAS as escolas
- [ ] Verifica se `escolaData.usuarios[userId]` existe
- [ ] Retorna lista de escolas com ID, databaseURL, storageBucket, projectId
- [ ] Tela de seleção mostra as escolas corretas
- [ ] Ao selecionar, `loadSchoolData` é chamado
- [ ] `currentSchool` é setado com dados completos
- [ ] `useSchoolDatabase` conecta ao banco correto
- [ ] Dashboard carrega dados do banco da escola (não do gerenciamento)

## 🐛 Troubleshooting

### Erro: "Permission denied" ao buscar usuários

**Causa**: Tentando acessar `usuarios/{userId}` que não existe

**Solução**: ✅ Usar novo fluxo que percorre `escolas/`

### Erro: "Nenhuma escola encontrada"

**Causa**: Usuário não está vinculado em nenhuma escola

**Solução**: Vincular usuário via Firebase Console ou Super Admin

### Erro: "databaseURL undefined"

**Causa**: Escola não tem campos técnicos preenchidos

**Solução**: 
1. Vá em Super Admin → Escolas
2. Edite a escola
3. Preencha Step 4 (Configurações Técnicas)
4. Salve

---

**Documentado**: 14/10/2025  
**Versão**: 3.0 - Novo Fluxo de Busca
