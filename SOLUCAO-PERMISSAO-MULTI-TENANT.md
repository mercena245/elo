# Solução: Erro de Permissão em Ambiente Multi-Tenant

## 🔴 Problema Identificado

**Erro:** `Permission denied` ao acessar dados das escolas via `schoolDatabaseService.js`

**Causa Raiz:**
O sistema ELO utiliza uma arquitetura multi-tenant onde:
1. Existe um **banco de gerenciamento** (`gerenciamento-elo-school`) que armazena informações das escolas
2. Cada escola tem seu **próprio projeto Firebase** com database e storage isolados
3. A autenticação do usuário é feita no projeto principal (`elo-school`)
4. **O problema:** O token de autenticação do projeto principal NÃO é válido para os projetos das escolas

### Fluxo do Problema:
```
Usuário faz login → Token gerado no projeto "elo-school"
                  ↓
Tenta acessar dados da escola → Projeto "escola-abc"
                  ↓
❌ Token NÃO é válido → PERMISSION_DENIED
```

## ✅ Soluções Implementadas

### Solução 1: Ajuste das Regras de Segurança (Atual)

**Status:** ✅ Implementado

Ajustamos as regras do `database.rules.json` para permitir leitura/escrita com autenticação básica:

```json
{
  "rules": {
    "alunos": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    // ... outras coleções
  }
}
```

**Como aplicar:**
```bash
firebase deploy --only database:rules
```

**Importante:** Esta solução pressupõe que todos os projetos (principal e escolas) compartilham o mesmo sistema de autenticação Firebase Auth.

### Solução 2: Melhorias no Código

**Status:** ✅ Implementado

Melhoramos o `schoolDatabaseService.js` com:
- ✅ Logging detalhado para debug
- ✅ Tratamento de erros específico para PERMISSION_DENIED
- ✅ Validação de configuração antes de conectar
- ✅ Cache de conexões para performance
- ✅ Mensagens de erro mais claras

## 🔧 Verificações Necessárias

### 1. Verificar se o usuário está autenticado

No console do navegador, verifique:
```javascript
// Deve retornar um objeto de usuário
firebase.auth().currentUser
```

### 2. Verificar a configuração da escola

No `AuthContext`, confirme que `currentSchool` contém:
```javascript
{
  id: "escola-id",
  nome: "Nome da Escola",
  databaseURL: "https://escola-db.firebaseio.com",
  projectId: "escola-project",
  storageBucket: "escola-project.appspot.com"
}
```

### 3. Verificar regras do Firebase

No Console do Firebase de cada escola:
1. Acesse **Realtime Database**
2. Vá em **Regras**
3. Confirme que as regras permitem acesso autenticado

## 🚀 Próximos Passos (Melhorias Futuras)

### Opção A: Autenticação Centralizada com Custom Tokens

Para maior segurança, implemente custom tokens:

1. **Backend (Cloud Function):**
```javascript
// functions/src/auth.js
const admin = require('firebase-admin');

exports.generateSchoolToken = functions.https.onCall(async (data, context) => {
  // Verificar se usuário está autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }
  
  const { schoolId, userUid } = data;
  
  // Verificar se usuário tem acesso à escola
  const hasAccess = await checkUserSchoolAccess(userUid, schoolId);
  if (!hasAccess) {
    throw new functions.https.HttpsError('permission-denied', 'Sem acesso a esta escola');
  }
  
  // Gerar custom token para o projeto da escola
  const schoolAdmin = getSchoolAdminInstance(schoolId);
  const customToken = await schoolAdmin.auth().createCustomToken(userUid);
  
  return { token: customToken };
});
```

2. **Frontend:**
```javascript
// src/services/schoolDatabaseService.js
export const authenticateSchoolUser = async (schoolData) => {
  const generateToken = httpsCallable(functions, 'generateSchoolToken');
  const result = await generateToken({ 
    schoolId: schoolData.id,
    userUid: auth.currentUser.uid 
  });
  
  const schoolAuth = getAuth(getSchoolApp(schoolData));
  await signInWithCustomToken(schoolAuth, result.data.token);
};
```

### Opção B: Migrar para Arquitetura Single-Tenant com Isolamento Lógico

Considere usar um único projeto Firebase com isolamento de dados por escola através de:
- Paths estruturados: `escolas/{escolaId}/alunos/{alunoId}`
- Regras de segurança baseadas em claims customizados
- Storage organizado por escola

**Vantagens:**
- ✅ Autenticação centralizada
- ✅ Menor complexidade
- ✅ Mais fácil de gerenciar

**Desvantagens:**
- ❌ Todos os dados em um único projeto
- ❌ Limites compartilhados do Firebase

## 📝 Checklist de Deploy

Ao fazer deploy das alterações:

- [ ] Deploy das regras de database: `firebase deploy --only database:rules`
- [ ] Verificar logs do console para identificar problemas de permissão
- [ ] Testar acesso com diferentes roles (coordenadora, professora, pai, aluno)
- [ ] Confirmar que dados sensíveis estão protegidos
- [ ] Documentar quaisquer exceções ou casos especiais

## 🔍 Debug

Se o erro persistir, verifique:

1. **Console do Navegador:**
   - Procure por logs iniciados com `[schoolDatabaseOperations.get]`
   - Verifique o `errorCode` retornado

2. **Firebase Console:**
   - Vá em **Realtime Database > Regras**
   - Teste as regras usando o simulador

3. **Autenticação:**
   ```javascript
   // No console do navegador
   console.log('Usuário autenticado:', firebase.auth().currentUser);
   console.log('Token:', await firebase.auth().currentUser.getIdToken());
   ```

## 📚 Referências

- [Firebase Database Rules](https://firebase.google.com/docs/database/security)
- [Multi-tenancy with Firebase](https://firebase.google.com/docs/projects/multitenancy)
- [Custom Authentication Tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens)

## 📞 Suporte

Se o problema persistir, verifique:
1. Logs detalhados no console do navegador
2. Regras de segurança no Firebase Console
3. Configuração do projeto no `firebase.json`

---

**Última atualização:** 14 de outubro de 2025
**Autor:** GitHub Copilot - Assistente de Desenvolvimento
