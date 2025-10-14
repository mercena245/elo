# 🔍 DEBUG - Sistema Multi-Tenant

## O que Foi Corrigido

### Problema Identificado:
O sistema não estava carregando os dados completos da escola do `managementDB` quando o usuário fazia login. O `selectedSchool` era carregado do localStorage, mas o `currentSchool` (com databaseURL, storageBucket, projectId) não era buscado.

### Correções Aplicadas:

#### 1. **AuthContext** - Carregamento Automático ✅
**Arquivo**: `src/context/AuthContext.jsx`

**O que mudou**:
```javascript
// ANTES: Apenas carregava do localStorage
if (savedSchool) {
  setSelectedSchool(JSON.parse(savedSchool));
}

// AGORA: Carrega do localStorage E busca dados completos do managementDB
if (savedSchool) {
  const schoolData = JSON.parse(savedSchool);
  setSelectedSchool(schoolData);
  
  // BUSCA DADOS COMPLETOS DO MANAGEMENTDB
  if (schoolData.id) {
    loadSchoolData(schoolData.id);
  }
}
```

**Benefício**: Garante que SEMPRE teremos databaseURL, storageBucket e projectId atualizados do banco de gerenciamento.

#### 2. **Logs Detalhados Adicionados** ✅

**AuthContext** agora mostra:
- `🔄 Inicializando AuthContext...`
- `💾 Tipo de acesso salvo: school`
- `💾 Escola salva: Sim/Não`
- `📋 Escola do localStorage: [nome]`
- `🔑 ID da escola: [id]`
- `🔍 Buscando dados completos da escola no managementDB...`
- `📄 [loadSchoolData] Dados brutos: {...}`
- `✅ [loadSchoolData] Escola carregada e setada no contexto`

**useSchoolDatabase** agora mostra:
- `🔄 [useSchoolDatabase] useEffect triggered`
- `🔄 [useSchoolDatabase] currentSchool: {...}`
- `📋 [useSchoolDatabase] Database URL: [url]`
- `🔌 [useSchoolDatabase] Conectando ao banco da escola...`
- `✅ [useSchoolDatabase] isReady: true`

## Como Testar Agora

### Passo 0: IMPORTANTE - Limpar Cache Antes de Testar

**Execute no Console do navegador (F12)**:
```javascript
// Limpar TUDO
localStorage.clear();
sessionStorage.clear();
console.clear();

// Recarregar
location.reload();
```

### Passo 1: Verificar Se Tem Escola Salva

1. **Abra o Console do navegador** (F12)

2. **Execute**:
   ```javascript
   console.log('Escola salva:', localStorage.getItem('selectedSchool'));
   console.log('Access type:', localStorage.getItem('accessType'));
   ```

3. **Resultado esperado após limpar**:
   ```
   Escola salva: null
   Access type: null
   ```

### Passo 2: Fazer Login

1. **Acesse**: `http://localhost:3000/login`

2. **Faça login** com usuário vinculado a uma escola

3. **Console deve mostrar**:
   ```
   🔄 [AuthContext Init] Inicializando AuthContext...
   💾 [AuthContext Init] Tipo de acesso salvo: null
   💾 [AuthContext Init] Escola salva: Não
   ⚠️ [AuthContext Init] Nenhuma escola salva no localStorage
   ```

### Passo 3: Selecionar Escola (CRÍTICO)

1. **Na tela de seleção**, escolha uma escola

2. **Console DEVE mostrar ESTES logs** (em ordem):
   ```
   🔍 [AccessTypeSelector] Buscando escolas do usuário: {userId}
   📋 [AccessTypeSelector] Usuário vinculado a X escola(s): [ids]
   ✅ [AccessTypeSelector] X escolas carregadas para o usuário
   
   🎯 [AccessTypeSelector] handleSchoolAccess chamado
   📋 [AccessTypeSelector] Escola selecionada: {objeto}
   🔑 [AccessTypeSelector] ID da escola: {id}
   📊 [AccessTypeSelector] Database URL: https://...
   💾 [AccessTypeSelector] Escola salva no localStorage
   ✅ [AccessTypeSelector] Verificação - Salvo: Sim
   📞 [AccessTypeSelector] onSchoolSelect chamado
   🔄 [AccessTypeSelector] Redirecionando para dashboard
   
   🔍 [loadSchoolData] Iniciando carregamento...
   🔍 [loadSchoolData] School ID: {escolaId}
   🔍 [loadSchoolData] Caminho: escolas/{escolaId}
   📊 [loadSchoolData] Snapshot exists: true
   📄 [loadSchoolData] Dados brutos: {...}
   📦 [loadSchoolData] Dados completos preparados:
     - ID: {escolaId}
     - Nome: Escola Teste
     - Database URL: https://escola-teste-default-rtdb.firebaseio.com
     - Storage Bucket: escola-teste.appspot.com
     - Project ID: escola-teste
   ✅ [loadSchoolData] Escola carregada e setada no contexto
   🏁 [loadSchoolData] Finalizado. isLoadingSchool: false
   ```

3. **Se NÃO aparecer `[loadSchoolData]`**, o problema é que:
   - A escola não tem `id` (verificar no log `🔑 ID da escola`)
   - O `onSchoolSelect` não está chamando `loadSchoolData`

### Passo 3.1: Debug se Escola Não Tem ID

**Execute no Console**:
```javascript
const saved = JSON.parse(localStorage.getItem('selectedSchool'));
console.log('Escola salva:', saved);
console.log('Tem ID?', saved?.id);
console.log('Tem databaseURL?', saved?.databaseURL);
```

**Problema comum**: Se `id` é `undefined`, a escola foi salva sem ID pelo AccessTypeSelector

**Solução**: Verificar se `loadUserSchools` está retornando o `id` corretamente

1. **Na tela de seleção**, escolha uma escola

2. **Console deve mostrar** (em ordem):
   ```
   🔍 [AccessTypeSelector] Buscando escolas do usuário: {userId}
   📋 [AccessTypeSelector] Usuário vinculado a X escola(s): [ids]
   ✅ [AccessTypeSelector] X escolas carregadas para o usuário
   
   🔍 [loadSchoolData] Iniciando carregamento...
   🔍 [loadSchoolData] School ID: {escolaId}
   🔍 [loadSchoolData] Caminho: escolas/{escolaId}
   📊 [loadSchoolData] Snapshot exists: true
   📄 [loadSchoolData] Dados brutos: {...}
   📦 [loadSchoolData] Dados completos preparados:
     - ID: {escolaId}
     - Nome: Escola Teste
     - Database URL: https://escola-teste-default-rtdb.firebaseio.com
     - Storage Bucket: escola-teste.appspot.com
     - Project ID: escola-teste
   ✅ [loadSchoolData] Escola carregada e setada no contexto
   🏁 [loadSchoolData] Finalizado. isLoadingSchool: false
   ```

### Passo 4: Acessar Dashboard

1. **Você será redirecionado** para `/dashboard`

2. **Console deve mostrar**:
   ```
   🔄 [useSchoolDatabase] useEffect triggered
   🔄 [useSchoolDatabase] isLoadingSchool: false
   🔄 [useSchoolDatabase] initializeDatabase chamado
   🔄 [useSchoolDatabase] currentSchool: {...}
   📋 [useSchoolDatabase] Escola encontrada: Escola Teste
   📋 [useSchoolDatabase] Database URL: https://escola-teste-default-rtdb.firebaseio.com
   📋 [useSchoolDatabase] Storage Bucket: escola-teste.appspot.com
   📋 [useSchoolDatabase] Project ID: escola-teste
   🔌 [useSchoolDatabase] Conectando ao banco da escola: Escola Teste
   ✅ Firebase App inicializado para escola: Escola Teste (escola-teste)
   ✅ Database conectado para: Escola Teste
   ✅ [useSchoolDatabase] Conectado ao banco da escola: Escola Teste
   ✅ [useSchoolDatabase] isReady: true
   
   🔄 Carregando dados do dashboard da escola: Escola Teste
   📊 Conectado ao banco: https://escola-teste-default-rtdb.firebaseio.com
   ✅ Dados do dashboard carregados com sucesso
   ```

### Passo 5: Verificar Aba Network

1. **Abra a aba Network** no DevTools

2. **Filtre por**: `firebaseio.com`

3. **VALIDAÇÃO CRÍTICA**:
   - ✅ **Requisições DEVEM ir para**: `escola-teste-default-rtdb.firebaseio.com`
   - ❌ **Requisições NÃO DEVEM ir para**: `elo-school-default-rtdb.firebaseio.com`

### Passo 6: Recarregar Página (Teste de Persistência)

1. **Recarregue a página**: `Ctrl + R`

2. **Console deve mostrar**:
   ```
   🔄 Inicializando AuthContext...
   💾 Tipo de acesso salvo: school
   💾 Escola salva: Sim
   📋 Escola do localStorage: Escola Teste
   🔑 ID da escola: {escolaId}
   🔍 Buscando dados completos da escola no managementDB...
   🔍 [loadSchoolData] Iniciando carregamento...
   ...
   ✅ [loadSchoolData] Escola carregada e setada no contexto
   ```

3. **Validação**: Mesmo após reload, os dados da escola são buscados novamente do managementDB

## 🐛 Problemas Comuns

### Problema 1: "Nenhuma escola no contexto"

**Console mostra**:
```
⚠️ [useSchoolDatabase] Nenhuma escola no contexto
```

**Causa**: `currentSchool` está null

**Debug**:
1. Verifique se `loadSchoolData` foi chamado:
   ```javascript
   // No console
   console.log(localStorage.getItem('selectedSchool'));
   ```

2. Se tiver escola salva mas não carregou, verifique se o ID está correto:
   ```javascript
   const saved = JSON.parse(localStorage.getItem('selectedSchool'));
   console.log('ID salvo:', saved.id);
   ```

3. Vá no Firebase Console → managementDB → `escolas/{id}` e verifique se existe

**Solução**: 
- Se escola não existe no managementDB, vincule o usuário novamente
- Se ID está errado, limpe o localStorage e faça login novamente

### Problema 2: "Configurações de banco de dados incompletas"

**Console mostra**:
```
❌ [useSchoolDatabase] Configurações incompletas. Faltando: databaseURL, storageBucket
```

**Causa**: Escola existe mas não tem os campos técnicos preenchidos

**Debug**:
1. Abra Firebase Console → managementDB
2. Vá em `escolas/{escolaId}`
3. Verifique se tem:
   ```json
   {
     "databaseURL": "https://...",
     "storageBucket": "...",
     "projectId": "..."
   }
   ```

**Solução**: 
1. Vá em Super Admin → Escolas
2. Edite a escola (se campos são readOnly, delete e recrie)
3. Ou adicione manualmente no Firebase Console

### Problema 3: Dados não carregam mesmo com tudo OK

**Console mostra**:
```
✅ [useSchoolDatabase] isReady: true
🔄 Carregando dados do dashboard da escola: Escola Teste
❌ Erro ao carregar dados do dashboard: ...
```

**Causa**: Banco da escola está vazio ou não tem os nós esperados

**Debug**:
1. Abra Firebase Console do banco da **ESCOLA** (não do gerenciamento)
2. URL: `https://console.firebase.google.com/project/{projectId}`
3. Vá em Realtime Database
4. Verifique se tem dados em:
   - `alunos/`
   - `colaboradores/`
   - `turmas/`
   - etc.

**Solução**:
- Popule o banco da escola com dados de teste
- Ou use o sistema para adicionar dados (alunos, colaboradores, etc.)

### Problema 4: Ainda conecta ao banco antigo

**Aba Network mostra**:
```
Requisições para: elo-school-default-rtdb.firebaseio.com
```

**Causa**: Cache do navegador ou alguma página ainda usa `db` antigo

**Debug**:
1. Verifique qual página está fazendo a requisição
2. Procure no código: `import { db } from`
3. Essa página ainda não foi migrada para `useSchoolDatabase`

**Solução**:
- Migre a página para usar `useSchoolDatabase`
- Ou aguarde, pois ainda não migramos todas as páginas (só o Dashboard por enquanto)

## 📊 Entendendo o Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LOGIN                                                    │
│    - Usuário faz login                                      │
│    - AuthContext carrega usuário                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SELEÇÃO DE ESCOLA (AccessTypeSelector)                  │
│    - Busca escolas do usuário no managementDB              │
│    - Lista: usuarios/{userId}/escolas                       │
│    - Para cada escolaId, busca: escolas/{escolaId}         │
│    - Inclui: databaseURL, storageBucket, projectId         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SALVAR ESCOLA (handleSchoolSelect)                      │
│    - Salva no localStorage                                  │
│    - Chama loadSchoolData(escolaId)                        │
│    - Busca dados COMPLETOS de: escolas/{escolaId}          │
│    - Seta currentSchool no contexto                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. INICIALIZAR BANCO (useSchoolDatabase)                   │
│    - Hook detecta currentSchool                             │
│    - Valida: databaseURL, storageBucket, projectId         │
│    - Chama schoolDatabaseOperations(currentSchool)          │
│    - Cria Firebase App específico da escola                 │
│    - Seta isReady = true                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. CARREGAR DADOS (Dashboard)                              │
│    - Aguarda isReady = true                                 │
│    - Usa getData('alunos'), getData('avisos'), etc.        │
│    - Dados vêm do banco CORRETO da escola                   │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Checklist de Validação Final

Após seguir todos os passos, valide:

- [ ] Console mostra `💾 Escola salva: Sim` ao recarregar
- [ ] Console mostra `✅ [loadSchoolData] Escola carregada e setada no contexto`
- [ ] Console mostra `📋 [useSchoolDatabase] Database URL: https://escola-teste-...`
- [ ] Console mostra `✅ [useSchoolDatabase] isReady: true`
- [ ] Aba Network mostra requisições para URL da escola (não para elo-school-default)
- [ ] Dashboard carrega dados (mesmo que estejam vazios)
- [ ] Ao recarregar página, tudo funciona novamente sem precisar selecionar escola

## 🎯 Próximos Passos

Se tudo acima funcionar:

1. ✅ Sistema multi-tenant está funcionando!
2. 📊 Popule o banco da escola com dados de teste
3. 🔄 Migre as outras páginas para usar `useSchoolDatabase`
4. 🧪 Teste com múltiplas escolas

---

**Criado**: 14/10/2025  
**Versão**: 1.0  
**Status**: Correções aplicadas, aguardando testes
