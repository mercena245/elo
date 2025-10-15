# 🔧 Solução para Permission Denied - Multi-Tenant

## 🚨 Problema Identificado

**Erro:** `Permission denied` ao acessar dados do projeto "elo-teste"

**Causa Raiz:** Usuário autenticado no projeto A (elo-school management) tentando acessar dados do projeto B (elo-teste) sem autorização válida.

---

## 📊 Arquitetura Atual (Problemática)

```
┌─────────────────────────────────────────────────┐
│  Usuário Logado no Projeto MANAGEMENT          │
│  (elo-school)                                   │
│  UID: qD6UucWtcgPC9GHA41OB8rSaghZ2             │
└─────────────────┬───────────────────────────────┘
                  │
                  │ Tenta acessar ❌
                  ▼
┌─────────────────────────────────────────────────┐
│  Projeto da Escola: ELO-TESTE                   │
│  Database: elo-school-default-rtdb              │
│                                                  │
│  ❌ Usuário não reconhecido neste projeto!      │
└─────────────────────────────────────────────────┘
```

**Problema:** Firebase não permite autenticação cross-project automaticamente!

---

## ✅ SOLUÇÃO RECOMENDADA: Single-Project Architecture

### Por que Single-Project?

✅ **Simplicidade:** Não precisa de Custom Tokens  
✅ **Segurança:** Regras de segurança garantem isolamento  
✅ **Performance:** Menos overhead de autenticação  
✅ **Custo:** Um projeto Firebase (melhor para Free Tier)  
✅ **Manutenção:** Mais fácil de gerenciar  

### Estrutura Single-Project:

```
Firebase Project: elo-school
Database URL: https://elo-school-default-rtdb.firebaseio.com/

/
├── management/                    ← Dados de gerenciamento
│   ├── escolas/
│   │   ├── escola_1/
│   │   │   ├── nome: "Escola Alpha"
│   │   │   ├── ativa: true
│   │   │   └── config: {...}
│   │   └── escola_2/
│   │       └── ...
│   └── userSchools/
│       ├── uid_user_1: "escola_1"
│       └── uid_user_2: "escola_2"
│
└── escolasData/                   ← Dados isolados por escola
    ├── escola_1/
    │   ├── alunos/
    │   ├── turmas/
    │   ├── professores/
    │   ├── usuarios/
    │   ├── titulos_financeiros/
    │   └── avisos/
    └── escola_2/
        ├── alunos/
        ├── turmas/
        └── ...
```

### Regras de Segurança (database.rules.json):

```json
{
  "rules": {
    "management": {
      ".read": "auth != null",
      "escolas": {
        "$escolaId": {
          ".write": "root.child('management/superAdmins/' + auth.uid).exists()"
        }
      },
      "userSchools": {
        "$userId": {
          ".write": "auth.uid === $userId || root.child('management/superAdmins/' + auth.uid).exists()"
        }
      }
    },
    "escolasData": {
      "$escolaId": {
        ".read": "root.child('management/userSchools/' + auth.uid).val() === $escolaId",
        ".write": "root.child('management/userSchools/' + auth.uid).val() === $escolaId"
      }
    }
  }
}
```

---

## 🔧 Implementação: Migrar para Single-Project

### Passo 1: Atualizar Estrutura do Banco

**Execute este script no Firebase Console:**

```javascript
// 1. Mover dados de management para subpasta
// Manualmente no Firebase Console:
// /escolas → /management/escolas
// /userSchools → /management/userSchools

// 2. Criar estrutura escolasData
// Manualmente criar:
// /escolasData/escola_id_1/
// /escolasData/escola_id_2/
```

### Passo 2: Copiar Dados Existentes

Se você já tem dados na raiz (`/alunos`, `/turmas`, etc), copie para dentro da escola:

```javascript
// Execute no Firebase Console (JavaScript)
const escolaId = '-ObZWZIHI1oNnZ5Oss8_'; // ID da sua escola

// Copiar dados da raiz para escolasData
const pathsToCopy = ['alunos', 'turmas', 'colaboradores', 'usuarios', 'avisos', 'titulos_financeiros'];

// IMPORTANTE: Faça backup antes!
```

### Passo 3: Atualizar schoolDatabaseService.js

Vou criar a versão atualizada agora...

---

## ⚠️ SOLUÇÃO ALTERNATIVA: Multi-Project (Avançada)

Se você REALMENTE precisa de projetos separados (raro), precisa implementar:

### 1. Backend com Firebase Admin SDK
Criar Firebase Function que gera Custom Tokens:

```javascript
// functions/generateCustomToken.js
const admin = require('firebase-admin');

exports.generateSchoolToken = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { escolaId } = data;
  
  // Verificar se usuário tem acesso à escola
  const userSchool = await admin.database()
    .ref(`userSchools/${context.auth.uid}`)
    .once('value');
  
  if (userSchool.val() !== escolaId) {
    throw new functions.https.HttpsError('permission-denied', 'Sem acesso à escola');
  }

  // Buscar configuração da escola
  const escola = await admin.database()
    .ref(`escolas/${escolaId}`)
    .once('value');
  
  const escolaData = escola.val();
  
  // Inicializar app da escola
  const schoolApp = admin.initializeApp({
    projectId: escolaData.projectId,
    databaseURL: escolaData.databaseURL
  }, escolaId);

  // Gerar Custom Token
  const customToken = await schoolApp.auth().createCustomToken(context.auth.uid);

  return { customToken };
});
```

### 2. Frontend usa o Custom Token

```javascript
// Atualizar schoolDatabaseService.js para usar Custom Token
const authenticateSchoolUser = async (schoolData, userUid) => {
  // Chamar Function para obter Custom Token
  const generateToken = httpsCallable(functions, 'generateSchoolToken');
  const result = await generateToken({ escolaId: schoolData.id });
  
  // Fazer login no projeto da escola
  const schoolAuth = getAuth(schoolApp);
  await signInWithCustomToken(schoolAuth, result.data.customToken);
};
```

**PORÉM:** Isso é muito complexo e tem custos adicionais!

---

## 🎯 RECOMENDAÇÃO FINAL

**USE SINGLE-PROJECT!** É:
- ✅ Mais simples
- ✅ Mais barato
- ✅ Igualmente seguro
- ✅ Mais performático
- ✅ Mais fácil de manter

Multi-project só faz sentido se você precisa:
- Isolamento total de infraestrutura
- Billing separado por escola
- Diferentes regiões geográficas

**Deseja que eu implemente a solução Single-Project para você?**
