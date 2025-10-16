# 🔧 DEBUG: Super Admin - Correção de Acesso às Escolas

## 🐛 Problema Identificado

O Super Admin não estava vendo o menu completo nem conseguindo acessar dados das escolas selecionadas.

### Causa Raiz

**Inconsistência de Roles:**
- O sistema usa `'coordenadora'` (com A) como padrão em todo menu e verificações
- Estávamos setando `ROLES.COORDENADOR` (sem A) para o Super Admin
- Resultado: Menu filtrava por `userRole === 'coordenadora'` e não encontrava nada

## ✅ Correções Implementadas

### 1. **SidebarMenu.jsx**
```javascript
// ANTES
setUserRole(ROLES.COORDENADOR); // ❌ 'coordenador'

// DEPOIS
setUserRole(ROLES.COORDENADORA); // ✅ 'coordenadora'
```

### 2. **useSchoolDatabase.js**
```javascript
// Mock de dados do Super Admin
role: ROLES.COORDENADORA, // ✅ 'coordenadora'
```

### 3. **useAuthUser.js**
```javascript
// Detecção de Super Admin
setUserRole(ROLES.COORDENADORA); // ✅ 'coordenadora'
```

### 4. **AuthContext.jsx**
```javascript
// Quando Super Admin é detectado
setRole(ROLES.COORDENADORA); // ✅ 'coordenadora'
```

## 🎯 Itens do Menu Que Devem Aparecer Para Super Admin

Quando logado como Super Admin em uma escola, você DEVE ver:

### ✅ Menus Disponíveis (role: 'coordenadora')
- 🏠 **Início** (Dashboard)
- 👥 **Alunos**
- 🏫 **Escola**
- 🏪 **Loja**
- 👨‍🏫 **Colaboradores**
- 📅 **Agenda**
- 💰 **Caixa (Financeiro)**
- 📜 **Secretaria Digital**
- ✉️ **Avisos**
- 🖨️ **Impressões**
- 📸 **Galeria de Fotos**

### 🎓 Professor Items (também disponíveis para coordenadora)
- 🎓 **Sala do Professor**

## 📋 Fluxo de Teste

### Teste 1: Login e Seleção de Escola
```
1. Faça login com Super Admin
   Email: gubra19@gmail.com
   UID: qD6UucWtcgPC9GHA41OB8rSaghZ2

2. Deve aparecer AccessTypeSelector
   - ✅ Ver lista de TODAS as escolas
   - ✅ Opção "Gerenciar Sistema" disponível

3. Selecione uma escola
   - ✅ Redireciona para /dashboard
   - ✅ Sem erros no console
```

### Teste 2: Verificar Menu Completo
```
4. No Dashboard, abra o menu lateral (☰)
   - ✅ Nome: "Super Admin"
   - ✅ Badge: "Coordenador(a)" (verde)
   - ✅ Todos os 11+ itens do menu visíveis

5. Verifique o console do navegador
   - ✅ Sem erros "Permission denied"
   - ✅ Log: "👑 Super Admin detectado - tratando como COORDENADORA"
   - ✅ Log: "✅ Conectado ao banco da escola: [Nome da Escola]"
```

### Teste 3: Navegar Pelas Páginas
```
6. Clique em "Alunos"
   - ✅ Deve carregar lista de alunos da escola
   - ✅ Sem erro de permissão

7. Clique em "Escola"
   - ✅ Deve carregar dados da escola
   - ✅ Pode editar informações

8. Clique em "Colaboradores"
   - ✅ Deve ver lista de colaboradores
   - ✅ Pode adicionar/editar
```

### Teste 4: Alternar Entre Escolas
```
9. Faça logout
10. Faça login novamente
11. Selecione OUTRA escola
    - ✅ Dados da escola anterior são limpos
    - ✅ Conecta ao banco da nova escola
    - ✅ Menu funciona normalmente
```

### Teste 5: Modo Management
```
12. Faça logout
13. Faça login novamente
14. Selecione "Gerenciar Sistema"
    - ✅ Redireciona para /super-admin
    - ✅ Ver todas as escolas
    - ✅ Ver aprovações pendentes
```

## 🔍 Logs Esperados no Console

### Quando Super Admin seleciona uma escola:

```javascript
// 1. AccessTypeSelector
🎯 [AccessTypeSelector] handleSchoolAccess chamado
📋 [AccessTypeSelector] Escola selecionada: { id: "...", nome: "..." }
💾 [AccessTypeSelector] Escola salva no localStorage

// 2. AuthContext carrega dados da escola
🔍 [loadSchoolData] Iniciando carregamento...
📊 [loadSchoolData] Snapshot exists: true
✅ [loadSchoolData] Escola carregada e setada no contexto

// 3. useSchoolDatabase se conecta
🔄 [useSchoolDatabase] Escola encontrada: [Nome]
📋 [useSchoolDatabase] Database URL: https://...
🔌 [useSchoolDatabase] Conectando ao banco da escola: [Nome]
✅ [useSchoolDatabase] Conectado ao banco da escola: [Nome]

// 4. SidebarMenu detecta Super Admin
👑 [SidebarMenu] Super Admin detectado - tratando como COORDENADORA
✅ [SidebarMenu] Role setada: coordenadora

// 5. Busca de pendentes
🔍 [SidebarMenu] Buscando pendentes do School DB
📊 [SidebarMenu] X usuários pendentes encontrados
```

## ❌ Erros Que NÃO Devem Aparecer

```javascript
// ❌ Esses erros foram CORRIGIDOS
❌ Permission denied
❌ Database não inicializado
❌ Usuário não encontrado no banco da escola
❌ Role não encontrada
```

## 🚨 Se Ainda Houver Problemas

### Problema: Menu vazio ou incompleto
**Solução:**
1. Abra o console (F12)
2. Digite: `localStorage.getItem('selectedSchool')`
3. Deve retornar dados da escola
4. Se retornar `null`, o problema está no AccessTypeSelector

### Problema: "Permission denied" ainda aparece
**Solução:**
1. Verifique qual path está causando erro
2. Verifique se `currentSchool` tem `databaseURL`, `storageBucket`, `projectId`
3. Console: `console.log(JSON.parse(localStorage.getItem('selectedSchool')))`

### Problema: Role aparece incorreta
**Solução:**
1. Console: `localStorage.clear()`
2. Faça logout e login novamente
3. Verifique logs: "👑 Super Admin detectado"

## 📊 Checklist de Verificação

- [ ] Login como Super Admin funciona
- [ ] AccessTypeSelector mostra todas as escolas
- [ ] Seleção de escola salva no localStorage
- [ ] currentSchool é carregado com databaseURL
- [ ] useSchoolDatabase se conecta sem erros
- [ ] Super Admin é detectado em todos os hooks
- [ ] Role é setada como 'coordenadora'
- [ ] Menu mostra todos os 11+ itens
- [ ] Páginas carregam dados da escola
- [ ] Sem erros "Permission denied" no console
- [ ] Pode navegar entre páginas
- [ ] Pode alternar entre escolas

## 🎯 Próximos Passos Após Validação

1. ✅ Confirmar que tudo funciona
2. 📝 Git commit das alterações
3. 🚀 Deploy para produção (quando autorizado)
4. ✨ Reativar 2FA (quando necessário)

---

**Data da Correção:** 16/10/2025
**Arquivos Modificados:**
- `src/components/SidebarMenu.jsx`
- `src/hooks/useSchoolDatabase.js`
- `src/hooks/useAuthUser.js`
- `src/context/AuthContext.jsx`
