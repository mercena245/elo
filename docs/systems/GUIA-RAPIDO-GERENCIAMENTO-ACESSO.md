# Guia Rápido: Sistema de Gerenciamento de Acesso

## 🎯 Objetivo

Sistema de aprovação inteligente de usuários com validação automática de coordenadora.

---

## 📍 Fluxo Simplificado

```
Usuário Novo
   ↓
Seleciona Escola
   ↓
Escola tem coordenadora?
   ├─ SIM  → Auto-aprovação → Coordenadora define role
   └─ NÃO  → Super Admin → Define role
```

---

## 📁 Arquivos Principais

| Arquivo | Localização | Função |
|---------|-------------|---------|
| **userManagementService.js** | `src/services/` | Lógica de validação e aprovação |
| **SchoolSelection.jsx** | `src/components/` | Interface de seleção de escola |
| **pending-approvals/page.jsx** | `src/app/super-admin/` | Interface do super admin |
| **aguardando-aprovacao/page.jsx** | `src/app/` | Tela de aguardo |

---

## 🔑 Funções Principais

### userManagementService

```javascript
// Verificar coordenadora
await checkSchoolHasCoordinator(schoolId)
→ { hasCoordinator: boolean, coordinatorCount: number }

// Solicitar acesso
await requestSchoolAccess(userId, schoolId, userData)
→ { success: boolean, status: string, message: string }

// Aprovar (Super Admin)
await approveUserBySuperAdmin(userId, schoolId, role, adminId)
→ { success: boolean, message: string }

// Buscar pendentes
await getPendingApprovals()
→ Array de aprovações

// Buscar escolas do usuário
await getUserSchools(userId)
→ Array de escolas associadas
```

---

## 🗄️ Estrutura de Dados

### Management DB

```json
// usuarios/{userId}
{
  "uid": "user123",
  "email": "usuario@email.com",
  "nome": "João Silva"
}

// usuarios/{userId}/escolas/{schoolId}
{
  "escolaId": "escola123",
  "status": "auto_approved",  // pending, auto_approved, manual_approved
  "role": "pending",           // null (sem role) ou role definida
  "ativo": true,
  "approvedBy": "auto"         // "auto" ou adminId
}

// pendingApprovals/{schoolId}/{userId}
{
  "userId": "user123",
  "schoolId": "escola123",
  "email": "usuario@email.com",
  "nome": "João Silva",
  "status": "pending"
}
```

### School DB

```json
// usuarios/{userId}
{
  "email": "usuario@email.com",
  "nome": "João Silva",
  "role": null,      // null = coordenadora define | definida = super admin definiu
  "ativo": false,    // false = aguardando | true = aprovado
  "turmas": []
}
```

---

## 🚦 Status de Aprovação

| Status | Significado | Próximo Passo |
|--------|-------------|---------------|
| **pending** | Aguardando super admin | Super admin deve aprovar |
| **auto_approved** | Escola tem coordenadora | Coordenadora define role |
| **manual_approved** | Super admin aprovou | Usuário pode acessar |
| **rejected** | Rejeitado | (futuro) |

---

## 👥 Roles Disponíveis

```javascript
USER_ROLES = {
  SUPER_ADMIN: 'superAdmin',
  COORDENADORA: 'coordenadora',
  PROFESSOR: 'professor',
  RESPONSAVEL: 'responsavel',
  SECRETARIA: 'secretaria',
  PENDING: 'pending'
}
```

---

## 🔄 Implementação no AuthContext

### 1. Verificar se usuário tem escola

```javascript
useEffect(() => {
  if (user) {
    const schools = await userManagementService.getUserSchools(user.uid);
    
    if (schools.length === 0) {
      // Redirecionar para seleção
      router.push('/selecionar-escola');
    } else {
      // Carregar escola
      await loadSchoolData(schools[0].id);
    }
  }
}, [user]);
```

### 2. Componente de seleção

```javascript
// Renderizar SchoolSelection se sem escola
if (!selectedSchool) {
  return <SchoolSelection />;
}
```

---

## 🎨 Rotas do Sistema

| Rota | Acesso | Função |
|------|--------|--------|
| `/selecionar-escola` | Usuário sem escola | Selecionar escola |
| `/aguardando-aprovacao` | Usuário pendente | Aguardar aprovação |
| `/super-admin/pending-approvals` | Super Admin | Aprovar usuários |
| `/dashboard` | Usuário aprovado | Dashboard principal |

---

## 🧪 Testes Rápidos

### Teste 1: Escola COM coordenadora

```bash
1. Login com usuário novo
2. Selecionar escola que tem coordenadora
3. ✅ Deve ir direto para dashboard
4. ✅ Role deve ser null
5. ✅ Ativo deve ser false
```

### Teste 2: Escola SEM coordenadora

```bash
1. Login com usuário novo
2. Selecionar escola sem coordenadora
3. ✅ Deve ir para /aguardando-aprovacao
4. ✅ Deve aparecer em pendingApprovals
5. Super admin aprova
6. ✅ Usuário pode acessar dashboard
```

---

## 🐛 Debug Rápido

### Verificar no Console

```javascript
// Verificar coordenadora
console.log('🔍 Verificando coordenadora:', schoolId);

// Ver resultado
console.log('✅ Coordenadoras encontradas:', count);

// Ver status de solicitação
console.log('📝 Status:', status);
```

### Verificar no Firebase

```bash
# Management DB
/usuarios/{userId}/escolas/{schoolId}
→ Verificar status e role

# School DB
/usuarios/{userId}
→ Verificar se foi adicionado

# Pending Approvals
/pendingApprovals/{schoolId}/{userId}
→ Verificar se está na fila
```

---

## ⚡ Comandos Úteis

### Limpar cache do usuário

```javascript
localStorage.clear();
window.location.reload();
```

### Verificar estado atual

```javascript
const schools = await userManagementService.getUserSchools(userId);
console.log('Escolas do usuário:', schools);
```

### Buscar pendentes

```javascript
const pending = await userManagementService.getPendingApprovals();
console.log('Aprovações pendentes:', pending);
```

---

## 📞 Checklist de Implementação

- [x] Criar `userManagementService.js`
- [x] Criar `SchoolSelection.jsx`
- [x] Criar página de aprovações do super admin
- [x] Criar página de aguardando aprovação
- [x] Documentação completa
- [ ] Integrar no `AuthContext`
- [ ] Atualizar regras de segurança do Firebase
- [ ] Testar fluxo completo
- [ ] Adicionar notificações por email
- [ ] Deploy e testes em produção

---

## 🔗 Próximos Passos

1. **Integrar no AuthContext**
   - Adicionar verificação de escola no login
   - Redirecionar para seleção se necessário

2. **Atualizar Regras de Segurança**
   - Management DB: permitir leitura de escolas
   - School DB: permitir coordenadora gerenciar usuários

3. **Testar Fluxo Completo**
   - Usuário novo → Seleção → Auto-aprovação
   - Usuário novo → Seleção → Aguardar super admin
   - Super admin → Aprovar usuário

4. **Implementar Melhorias**
   - Notificações por email
   - Logs detalhados
   - Analytics para super admin

---

## 📖 Documentação Completa

Para detalhes completos, consulte:
- [SISTEMA-GERENCIAMENTO-ACESSO.md](SISTEMA-GERENCIAMENTO-ACESSO.md)
