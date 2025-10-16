# 🚨 ALERTA: Migração Pendente - Página `/escola`

**Data de Detecção:** 16 de outubro de 2025  
**Prioridade:** 🔴 **CRÍTICA**  
**Status:** ⏳ **PENDENTE**

---

## 📋 Resumo

Durante a validação do sistema multi-tenant, foi identificado que a página **`/escola`** (`src/app/escola/page.jsx`) ainda não foi migrada para a arquitetura multi-tenant e **está usando imports diretos do Firebase**.

---

## ⚠️ Risco

### **Segurança:**
- ❌ Acessa banco de dados compartilhado (não isolado)
- ❌ Possível vazamento de dados entre escolas
- ❌ Uploads vão para storage compartilhado
- ❌ Viola princípio de isolamento multi-tenant

### **Funcionalidade:**
- ❌ Configurações da escola podem afetar outras escolas
- ❌ Dados não ficam na escola correta
- ❌ Inconsistência com resto do sistema

### **Impacto:**
- 🔴 **ALTO** - Página gerencia dados críticos da escola
- 🔴 **CRÍTICO** - Pode causar perda ou mistura de dados

---

## 🔍 Detalhes Técnicos

### **Arquivo Afetado:**
```
src/app/escola/page.jsx
```

### **Código Problemático:**

**Linhas 36-37:**
```javascript
// ❌ IMPORTS DIRETOS DO FIREBASE (NÃO MULTI-TENANT)
import { db, ref, get, set, push, remove, storage, storageRef, uploadBytes, getDownloadURL, deleteObject } from '@/firebase';
import { auth, onAuthStateChanged } from '@/firebase';
```

**Uso no Código:**
```javascript
// ❌ Acessa banco compartilhado
const alunosRef = ref(db, 'alunos');
const snapshot = await get(alunosRef);

// ❌ Upload vai para storage compartilhado
const imageRef = storageRef(storage, `escola-fotos/${fileName}`);
await uploadBytes(imageRef, file);
```

---

## ✅ Solução

### **1. Atualizar Imports**

**REMOVER:**
```javascript
import { db, ref, get, set, push, remove, storage, storageRef, uploadBytes, getDownloadURL, deleteObject } from '@/firebase';
```

**ADICIONAR:**
```javascript
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
```

**MANTER:**
```javascript
import { auth, onAuthStateChanged } from '../../firebase'; // Auth é global
```

---

### **2. Adicionar Hook no Componente**

**ADICIONAR no início do componente:**
```javascript
export default function EscolaPage() {
  // Hook multi-tenant
  const { 
    getData, 
    setData, 
    pushData, 
    removeData, 
    updateData, 
    isReady, 
    error: dbError, 
    currentSchool, 
    storage: schoolStorage 
  } = useSchoolDatabase();

  // ... resto do código
}
```

---

### **3. Substituir Operações de Database**

#### **Buscar Dados**

**ANTES:**
```javascript
const alunosRef = ref(db, 'alunos');
const snapshot = await get(alunosRef);
if (snapshot.exists()) {
  const data = snapshot.val();
  setAlunos(data);
}
```

**DEPOIS:**
```javascript
const data = await getData('alunos');
if (data) {
  setAlunos(data);
}
```

---

#### **Salvar Dados**

**ANTES:**
```javascript
const escolaRef = ref(db, 'configuracoes/escola');
await set(escolaRef, escolaData);
```

**DEPOIS:**
```javascript
await setData('configuracoes/escola', escolaData);
```

---

#### **Adicionar Dados**

**ANTES:**
```javascript
const novosRef = ref(db, 'turmas');
await push(novosRef, turmaData);
```

**DEPOIS:**
```javascript
await pushData('turmas', turmaData);
```

---

#### **Atualizar Dados**

**ANTES:**
```javascript
const turmaRef = ref(db, `turmas/${turmaId}`);
await set(turmaRef, updates);
```

**DEPOIS:**
```javascript
await updateData(`turmas/${turmaId}`, updates);
```

---

#### **Remover Dados**

**ANTES:**
```javascript
const turmaRef = ref(db, `turmas/${turmaId}`);
await remove(turmaRef);
```

**DEPOIS:**
```javascript
await removeData(`turmas/${turmaId}`);
```

---

### **4. Substituir Operações de Storage**

#### **Upload de Arquivo**

**ANTES:**
```javascript
const imageRef = storageRef(storage, `escola-fotos/${fileName}`);
await uploadBytes(imageRef, file);
const downloadURL = await getDownloadURL(imageRef);
```

**DEPOIS:**
```javascript
import { useSchoolStorage } from '../../hooks/useSchoolStorage';

// No componente:
const { uploadFile } = useSchoolStorage();

// Upload:
const downloadURL = await uploadFile(file, `escola-fotos/${fileName}`);
```

---

#### **Deletar Arquivo**

**ANTES:**
```javascript
const imageRef = storageRef(storage, `escola-fotos/${fileName}`);
await deleteObject(imageRef);
```

**DEPOIS:**
```javascript
const { deleteFile } = useSchoolStorage();
await deleteFile(`escola-fotos/${fileName}`);
```

---

### **5. Adicionar Verificação de `isReady`**

**ADICIONAR em useEffect e funções:**
```javascript
useEffect(() => {
  const fetchData = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }

    // Buscar dados aqui
    const alunos = await getData('alunos');
    // ...
  };

  fetchData();
}, [isReady, getData]);
```

---

## 📋 Checklist de Migração

### **Imports:**
- [ ] Remover `db, ref, get, set, push, remove` de imports
- [ ] Remover `storage, storageRef, uploadBytes, getDownloadURL, deleteObject` de imports
- [ ] Adicionar `import { useSchoolDatabase } from '../../hooks/useSchoolDatabase'`
- [ ] Adicionar `import { useSchoolStorage } from '../../hooks/useSchoolStorage'` (se usar storage)
- [ ] Manter apenas `import { auth, onAuthStateChanged } from '../../firebase'`

### **Hooks:**
- [ ] Adicionar `useSchoolDatabase()` no componente
- [ ] Adicionar `useSchoolStorage()` se necessário
- [ ] Extrair `getData, setData, pushData, removeData, updateData, isReady`

### **Operações de Database:**
- [ ] Substituir `ref(db, ...)` por caminhos string
- [ ] Substituir `get(ref(...))` por `getData(path)`
- [ ] Substituir `set(ref(...), data)` por `setData(path, data)`
- [ ] Substituir `push(ref(...), data)` por `pushData(path, data)`
- [ ] Substituir `remove(ref(...))` por `removeData(path)`

### **Operações de Storage:**
- [ ] Substituir `uploadBytes(storageRef(...), file)` por `uploadFile(file, path)`
- [ ] Substituir `deleteObject(storageRef(...))` por `deleteFile(path)`
- [ ] Remover `getDownloadURL` (upload já retorna URL)

### **Validações:**
- [ ] Adicionar verificação `if (!isReady) return` antes de operações
- [ ] Adicionar logs para debug (opcional)
- [ ] Testar com múltiplas escolas
- [ ] Validar uploads em storage correto

---

## 🧪 Testes Após Migração

### **1. Teste de Isolamento:**
```
1. Login como Coordenadora da Escola A
2. Acessar /escola
3. Salvar configurações
4. Fazer upload de logo
5. Logout
6. Login como Coordenadora da Escola B
7. Acessar /escola
8. Verificar que configurações de A não aparecem
9. Verificar que logo de A não aparece
```

### **2. Teste de Storage:**
```
1. Login na Escola A
2. Upload de imagem em /escola
3. Verificar URL contém "escola-a" no path
4. Login na Escola B
5. Upload de imagem em /escola
6. Verificar URL contém "escola-b" no path
7. Confirmar que imagens são diferentes
```

### **3. Teste de Dados:**
```
1. Console do Firebase
2. Verificar que dados salvos vão para:
   - escola-a.firebaseio.com/configuracoes/escola
   - escola-b.firebaseio.com/configuracoes/escola
3. Confirmar isolamento completo
```

---

## 📊 Impacto da Migração

### **Antes da Migração:**
```
❌ Dados misturados entre escolas
❌ Risco de vazamento
❌ Uploads em storage compartilhado
❌ 93.3% multi-tenant
```

### **Após a Migração:**
```
✅ Dados isolados por escola
✅ Zero risco de vazamento
✅ Uploads em storage dedicado
✅ 100% multi-tenant
```

---

## 🎯 Priorização

### **Por que CRÍTICO?**
1. **Volume de Dados:** Página gerencia informações cruciais da escola
2. **Frequência de Uso:** Coordenadoras acessam regularmente
3. **Risco de Perda:** Dados podem ser sobrescritos ou perdidos
4. **Compliance:** Viola LGPD (dados não isolados)

### **Quando Fazer?**
🔴 **IMEDIATAMENTE** - Antes de qualquer operação crítica na página `/escola`

---

## 📚 Referências

- **Guia de Migração:** `GUIA-MIGRACAO-MULTI-TENANT.md`
- **Documentação do Hook:** `src/hooks/useSchoolDatabase.js`
- **Exemplo de Uso:** `src/app/components/ExemploUsoSchoolDatabase.jsx`
- **Validação Completa:** `VALIDACAO-MULTI-TENANT-HEADER.md`

---

## 🚀 Próximos Passos

1. ✅ **Validação do Sistema de Header** - Concluído
2. ✅ **Correção de Bug em configuracoes/page.jsx** - Concluído
3. ⏳ **Migração de escola/page.jsx** - **PENDENTE (VOCÊ ESTÁ AQUI)**
4. ⏳ Teste completo de isolamento
5. ⏳ Validação 100% multi-tenant
6. ⏳ Deploy em produção

---

**Criado por:** GitHub Copilot  
**Data:** 16 de outubro de 2025  
**Última Atualização:** 16 de outubro de 2025

**⚠️ ATENÇÃO:** Não utilize a página `/escola` em produção até que esta migração seja concluída!
