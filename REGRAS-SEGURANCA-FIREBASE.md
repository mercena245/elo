# ⚠️ REGRAS DE SEGURANÇA FIREBASE - DESENVOLVIMENTO

## 🔓 Status Atual: REGRAS ABERTAS

**Data:** 16/10/2025  
**Ambiente:** Desenvolvimento/Teste  
**Segurança:** ⚠️ DESABILITADA

---

## 📋 Arquivos Modificados

### 1. **Database Rules** (`config/rules/database.rules.json`)
```json
{
  "rules": {
    ".read": "true",
    ".write": "true"
  }
}
```

### 2. **Database Management Rules** (`config/rules/database.management.rules.json`)
```json
{
  "rules": {
    ".read": "true",
    ".write": "true"
  }
}
```

### 3. **Storage Rules** (`config/rules/storage.rules`)
```plaintext
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### 4. **Firebase Config** (`firebase.json`)
```json
{
  "database": {
    "rules": "config/rules/database.rules.json"
  },
  "storage": {
    "rules": "config/rules/storage.rules"
  }
}
```

---

## 🚨 IMPORTANTE: Segurança em Produção

### ⚠️ NUNCA usar essas regras em produção!

**Riscos:**
- ❌ Qualquer pessoa pode ler TODOS os dados
- ❌ Qualquer pessoa pode modificar/deletar dados
- ❌ Sem autenticação ou autorização
- ❌ Vulnerável a ataques maliciosos
- ❌ Violação de LGPD/GDPR

---

## ✅ Regras Seguras para Produção

### **Database Rules (Produção)**
```json
{
  "rules": {
    "alunos": {
      ".read": "auth != null && (
        root.child('usuarios').child(auth.uid).child('role').val() == 'coordenadora' ||
        root.child('usuarios').child(auth.uid).child('role').val() == 'professora'
      )",
      ".write": "auth != null && root.child('usuarios').child(auth.uid).child('role').val() == 'coordenadora'",
      ".indexOn": ["nome", "turma", "ativo"]
    },
    
    "usuarios": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || root.child('usuarios').child(auth.uid).child('role').val() == 'coordenadora')",
        ".write": "auth != null && (auth.uid == $uid || root.child('usuarios').child(auth.uid).child('role').val() == 'coordenadora')"
      }
    },
    
    "colaboradores": {
      ".read": "auth != null && root.child('usuarios').child(auth.uid).child('role').val() == 'coordenadora'",
      ".write": "auth != null && root.child('usuarios').child(auth.uid).child('role').val() == 'coordenadora'",
      ".indexOn": ["nome", "cargo", "ativo"]
    },
    
    "financeiro": {
      ".read": "auth != null && (
        root.child('usuarios').child(auth.uid).child('role').val() == 'coordenadora' ||
        root.child('usuarios').child(auth.uid).child('role').val() == 'secretaria'
      )",
      ".write": "auth != null && (
        root.child('usuarios').child(auth.uid).child('role').val() == 'coordenadora' ||
        root.child('usuarios').child(auth.uid).child('role').val() == 'secretaria'
      )",
      ".indexOn": ["alunoId", "status", "vencimento"]
    },
    
    "notas": {
      ".read": "auth != null && (
        root.child('usuarios').child(auth.uid).child('role').val() == 'coordenadora' ||
        root.child('usuarios').child(auth.uid).child('role').val() == 'professora' ||
        data.child('alunoId').val() == auth.uid
      )",
      ".write": "auth != null && (
        root.child('usuarios').child(auth.uid).child('role').val() == 'coordenadora' ||
        root.child('usuarios').child(auth.uid).child('role').val() == 'professora'
      )",
      ".indexOn": ["alunoId", "disciplina", "data"]
    },
    
    "$other": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('usuarios').child(auth.uid).child('role').val() == 'coordenadora'"
    }
  }
}
```

### **Storage Rules (Produção)**
```plaintext
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Fotos de perfil
    match /perfil/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.auth.uid == userId &&
                      request.resource.size < 5 * 1024 * 1024 && // 5MB
                      request.resource.contentType.matches('image/.*');
    }
    
    // Galeria de fotos
    match /galeria/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      (request.resource.size < 10 * 1024 * 1024) && // 10MB
                      request.resource.contentType.matches('image/.*');
    }
    
    // Documentos
    match /documentos/{path=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.resource.size < 20 * 1024 * 1024; // 20MB
    }
    
    // Bloqueio geral
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🔄 Como Implementar Regras Seguras

### **Passo 1: Teste em Desenvolvimento**
```bash
# Manter regras abertas durante desenvolvimento
firebase deploy --only database:rules
firebase deploy --only storage:rules
```

### **Passo 2: Preparar Produção**
```bash
# 1. Criar arquivo de regras de produção
cp config/rules/database.rules.json config/rules/database.rules.prod.json

# 2. Editar com regras seguras

# 3. Deploy em produção
firebase deploy --only database:rules --project prod
```

### **Passo 3: Validar**
```bash
# Testar regras localmente
firebase emulators:start --only database,storage
```

---

## 📊 Checklist de Segurança

### Antes de Deploy em Produção

- [ ] Remover `".read": "true"` e `".write": "true"`
- [ ] Adicionar verificação de `auth != null`
- [ ] Implementar controle por roles
- [ ] Validar tamanhos de arquivo
- [ ] Validar tipos de arquivo (images, pdf, etc)
- [ ] Testar com emulador local
- [ ] Revisar índices de performance
- [ ] Documentar regras customizadas
- [ ] Criar backup das regras atuais
- [ ] Testar casos de uso principais

---

## 🎯 Níveis de Acesso por Role

### **Super Admin**
- ✅ Acesso total ao Management DB
- ✅ Tratado como coordenadora nas escolas
- ✅ Pode criar/editar/deletar escolas
- ✅ Pode aprovar usuários

### **Coordenadora**
- ✅ Acesso total à escola
- ✅ Gerenciar alunos, professores, colaboradores
- ✅ Acessar financeiro
- ✅ Configurações da escola
- ❌ Não acessa outras escolas
- ❌ Não acessa Management DB

### **Professora**
- ✅ Ver alunos de suas turmas
- ✅ Lançar notas e frequência
- ✅ Acessar agenda
- ❌ Não acessa financeiro
- ❌ Não edita colaboradores
- ❌ Não edita configurações

### **Pai/Responsável**
- ✅ Ver dados do filho
- ✅ Ver notas e frequência do filho
- ✅ Ver agenda da turma
- ✅ Acessar financeiro próprio
- ❌ Não vê outros alunos
- ❌ Não edita nada

### **Secretaria**
- ✅ Acessar financeiro
- ✅ Ver alunos
- ✅ Imprimir documentos
- ❌ Não lança notas
- ❌ Não edita configurações

---

## 🔐 Backup das Regras Anteriores

### **Database Rules (Backup)**
Salvo em: `backups/database.rules.backup.json`

### **Storage Rules (Backup)**
Salvo em: `backups/storage.rules.backup`

---

## 📞 Contatos

**Em caso de incidente de segurança:**
1. Reverter regras imediatamente
2. Verificar logs de acesso
3. Notificar equipe de segurança
4. Implementar regras corretas

---

## ⚠️ LEMBRETE FINAL

```
╔════════════════════════════════════════════╗
║                                            ║
║     🚨 REGRAS ABERTAS = DESENVOLVIMENTO    ║
║                                            ║
║     NÃO USAR EM PRODUÇÃO!                  ║
║                                            ║
║     Implementar segurança adequada         ║
║     antes de qualquer deploy público       ║
║                                            ║
╚════════════════════════════════════════════╝
```

---

**Última Atualização:** 16/10/2025  
**Responsável:** Equipe de Desenvolvimento  
**Status:** ⚠️ DESENVOLVIMENTO - REGRAS ABERTAS
