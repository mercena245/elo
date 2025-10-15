# Fluxo Completo - Primeiro Acesso de Usuário

## 📋 Visão Geral

Sistema de gerenciamento de usuários multi-tenant com aprovação automática e manual baseado na existência de coordenadora na escola.

---

## 🔄 Fluxo Detalhado

### 1️⃣ **Login Primeiro Acesso**

**Usuário faz login pela primeira vez (Google ou Email/Senha)**

```
LoginForm.jsx → Firebase Auth → Cria usuário no banco
```

**Dados salvos:**
```javascript
usuarios/{userId}: {
  email: "usuario@email.com",
  nome: "Nome do Usuário",
  role: null  // ← Ainda não tem role definida
}
```

**Redirecionamento:**
```javascript
// LoginForm.jsx detecta: usuário sem role
if (!userData.role) {
  router.push('/school-selection');
}
```

---

### 2️⃣ **Seleção de Escola**

**Página:** `/school-selection`

**Componente:** `SchoolSelection.jsx`

**Ações:**
1. Exibe lista de todas as escolas cadastradas
2. Usuário seleciona a escola desejada
3. Sistema valida se escola tem coordenadora

**Validação de Coordenadora:**
```javascript
const result = await userManagementService.requestSchoolAccess(
  user.uid,
  schoolId,
  { email, nome }
);
```

---

### 3️⃣ **Fluxos de Aprovação**

#### **Cenário A: Escola COM Coordenadora** ✅

**Status:** `AUTO_APPROVED`

**Banco Management:**
```javascript
usuarios/{userId}/escolas/{schoolId}: {
  status: 'auto_approved',
  role: null,  // ← Coordenadora vai definir depois
  ativo: false,
  requestedAt: "2025-10-15T10:30:00Z"
}
```

**Banco da Escola:**
```javascript
usuarios/{userId}: {
  email: "usuario@email.com",
  nome: "Nome do Usuário",
  role: null,  // ← Aguardando coordenadora definir
  ativo: false,
  turmas: [],
  createdAt: "2025-10-15T10:30:00Z"
}
```

**Modal Exibido:**
```
Título: "Acesso Concedido!"
Mensagem: "Sua conta foi criada! A coordenadora da escola vai definir sua função."
Redirecionamento: /dashboard
```

**Próximo Passo:**
- Coordenadora acessa sistema
- Vai em gestão de usuários
- Define role do novo usuário
- Usuário pode acessar funcionalidades da role

---

#### **Cenário B: Escola SEM Coordenadora** ⏳

**Status:** `PENDING`

**Banco Management:**
```javascript
// 1. Registro do usuário
usuarios/{userId}/escolas/{schoolId}: {
  status: 'pending',
  role: null,
  ativo: false,
  requestedAt: "2025-10-15T10:30:00Z"
}

// 2. Fila de aprovação
pendingApprovals/{schoolId}/{userId}: {
  userId: "abc123",
  email: "usuario@email.com",
  nome: "Nome do Usuário",
  schoolId: "escola-xyz",
  requestedAt: "2025-10-15T10:30:00Z"
}
```

**Modal Exibido:**
```
Título: "Aguardando Aprovação"
Mensagem: "Sua solicitação foi enviada para análise do administrador."
Redirecionamento: /aguardando-aprovacao
```

**Próximo Passo:**
- Super Admin acessa `/super-admin/pending-approvals`
- Visualiza todas as aprovações pendentes
- Define role e aprova usuário

---

### 4️⃣ **Aprovação pelo Super Admin**

**Página:** `/super-admin/pending-approvals`

**Interface:**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Aprovações Pendentes                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 👤 Nome do Usuário                                      │
│    usuario@email.com                                     │
│    Solicitado em: 15/10/2025                            │
│                                                          │
│ 🏫 Escola XYZ                                           │
│                                                          │
│ Função: [Dropdown]                                      │
│    - 👑 Coordenadora                                    │
│    - 👨‍🏫 Professor(a)                                   │
│    - 👨‍👩‍👧‍👦 Pai/Mãe (Responsável)                      │
│    - 📋 Secretaria                                      │
│                                                          │
│ [Aprovar]                                               │
└─────────────────────────────────────────────────────────┘
```

**Roles Disponíveis:**
- `coordenadora` - Coordenadora da escola
- `professor` - Professor(a)
- `responsavel` - Pai/Mãe (Responsável)
- `secretaria` - Secretaria

**Processo de Aprovação:**

1. Super Admin seleciona role no dropdown
2. Clica em "Aprovar"
3. Sistema executa `approveUserBySuperAdmin()`

**O que acontece:**

```javascript
// 1. Atualiza Management Database
usuarios/{userId}/escolas/{schoolId}: {
  status: 'manual_approved',
  role: 'professor',  // ← Role definida pelo super admin
  ativo: true,
  approvedAt: "2025-10-15T11:00:00Z",
  approvedBy: "{superAdminId}"
}

// 2. Remove da fila de aprovação
pendingApprovals/{schoolId}/{userId}: null

// 3. Adiciona ao banco da escola
// Banco da Escola:
usuarios/{userId}: {
  email: "usuario@email.com",
  nome: "Nome do Usuário",
  role: 'professor',  // ← Role definida!
  ativo: true,
  turmas: [],
  createdAt: "2025-10-15T11:00:00Z"
}
```

**Modal de Sucesso:**
```
Título: "Aprovado com Sucesso!"
Mensagem: "Usuário aprovado como professor com sucesso!"
```

---

### 5️⃣ **Validação de Role no Próximo Login**

**AuthContext verifica:**

```javascript
// 1. Busca dados do usuário
const userRef = ref(db, `usuarios/${userId}`);
const userData = await get(userRef);

// 2. Verifica se tem role
if (userData.role) {
  // Usuário aprovado - mostra seletor de escola
  setShowAccessSelector(true);
} else {
  // Usuário sem role - redireciona para seleção
  router.push('/school-selection');
}
```

---

## 🎯 Resumo dos Status

| Status | Descrição | Onde aparece |
|--------|-----------|--------------|
| `null` | Usuário acabou de criar conta | Primeiro login |
| `pending` | Aguardando aprovação super admin | Escola SEM coordenadora |
| `auto_approved` | Aprovado automaticamente | Escola COM coordenadora |
| `manual_approved` | Aprovado pelo super admin | Após aprovação manual |

---

## 📁 Estrutura de Dados

### **Management Database**

```javascript
{
  "usuarios": {
    "{userId}": {
      "email": "usuario@email.com",
      "nome": "Nome do Usuário",
      "escolas": {
        "{escolaId}": {
          "status": "auto_approved | pending | manual_approved",
          "role": "coordenadora | professor | responsavel | secretaria",
          "ativo": true | false,
          "requestedAt": "ISO timestamp",
          "approvedAt": "ISO timestamp",
          "approvedBy": "{adminId}"
        }
      }
    }
  },
  
  "pendingApprovals": {
    "{escolaId}": {
      "{userId}": {
        "userId": "abc123",
        "email": "usuario@email.com",
        "nome": "Nome do Usuário",
        "schoolId": "escola-xyz",
        "requestedAt": "ISO timestamp"
      }
    }
  },
  
  "escolas": {
    "{escolaId}": {
      "nome": "Nome da Escola",
      "cidade": "Cidade",
      "databaseURL": "https://escola-db.firebaseio.com/",
      "projectId": "projeto-id"
    }
  }
}
```

### **School Database** (Cada escola tem seu próprio)

```javascript
{
  "usuarios": {
    "{userId}": {
      "email": "usuario@email.com",
      "nome": "Nome do Usuário",
      "role": "coordenadora | professor | responsavel | secretaria",
      "ativo": true | false,
      "turmas": [],
      "createdAt": "ISO timestamp"
    }
  }
}
```

---

## 🔐 Permissões por Role

| Role | Descrição | Permissões |
|------|-----------|-----------|
| `coordenadora` | Coordenadora da escola | Todas as permissões da escola |
| `professor` | Professor(a) | Gerenciar turmas, notas, frequência |
| `responsavel` | Pai/Mãe | Visualizar dados dos filhos |
| `secretaria` | Secretaria | Gerenciar alunos, financeiro |
| `superAdmin` | Super Administrador | Gerenciar todas as escolas |

---

## 🧪 Como Testar

### **Teste 1: Escola COM Coordenadora**

1. Criar nova conta de teste
2. Login → Redireciona para `/school-selection`
3. Selecionar escola que tem coordenadora
4. Modal: "Acesso Concedido!"
5. Redireciona para `/dashboard`
6. Coordenadora define role
7. Usuário pode acessar

### **Teste 2: Escola SEM Coordenadora**

1. Criar nova conta de teste
2. Login → Redireciona para `/school-selection`
3. Selecionar escola que NÃO tem coordenadora
4. Modal: "Aguardando Aprovação"
5. Redireciona para `/aguardando-aprovacao`
6. Super admin acessa `/super-admin/pending-approvals`
7. Define role e aprova
8. Usuário pode fazer login e acessar

---

## 📝 Arquivos Envolvidos

### **Componentes**
- `src/components/LoginForm.jsx` - Tela de login
- `src/components/SchoolSelection.jsx` - Seleção de escola
- `src/app/super-admin/pending-approvals/page.jsx` - Aprovações pendentes
- `src/app/aguardando-aprovacao/page.jsx` - Tela de espera

### **Serviços**
- `src/services/userManagementService.js` - Lógica de aprovação
- `src/services/schoolDatabaseService.js` - Conexão com bancos das escolas

### **Context**
- `src/context/AuthContext.jsx` - Gerenciamento de autenticação

---

## ✅ Checklist de Implementação

- [x] Login detecta usuário sem role
- [x] Redireciona para seleção de escola
- [x] Valida existência de coordenadora
- [x] Aprova automaticamente (com coordenadora)
- [x] Envia para fila (sem coordenadora)
- [x] Interface de aprovação super admin
- [x] 4 roles disponíveis
- [x] Salva no banco da escola com role
- [x] Validação de role no próximo login
- [x] Modais substituindo alerts
- [x] Documentação completa

---

## 🚀 Próximos Passos (Opcional)

1. **Email de notificação** quando usuário for aprovado
2. **Dashboard para coordenadora** aprovar usuários auto-aprovados
3. **Histórico de aprovações** no management database
4. **Rejeitar solicitações** com motivo
5. **Editar role** de usuários existentes

---

**Data de Criação:** 15/10/2025  
**Versão:** 1.0  
**Status:** ✅ Implementado e Funcionando
