# 🔄 Guia de Migração para Multi-Tenant Completo

## 📋 Objetivo

Migrar **TODAS as telas** do sistema para usar o banco de dados e storage **específicos da escola logada**.

## ✅ Situação Atual

- ✅ **AccessTypeSelector** - JÁ usa multi-tenant
- ✅ **Dashboard** - JÁ usa `useSchoolDatabase`
- ❌ **Todas as outras telas** - Ainda usam `db` e `storage` padrão

## 🎯 Padrão de Migração

### **ANTES (usando banco padrão):**

```jsx
import { db, ref, get, set, storage } from '../../firebase';

const MinhaPage = () => {
  const [dados, setDados] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await get(ref(db, 'alunos'));
      if (snapshot.exists()) {
        setDados(Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })));
      }
    };
    fetchData();
  }, []);
  
  const salvar = async (id, dados) => {
    await set(ref(db, `alunos/${id}`), dados);
  };
  
  return <div>...</div>;
};
```

### **DEPOIS (usando banco da escola):**

```jsx
import { auth } from '../../firebase';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';

const MinhaPage = () => {
  const { getData, setData, isReady, error, currentSchool, storage } = useSchoolDatabase();
  const [dados, setDados] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!isReady) return;
      
      const alunosData = await getData('alunos');
      if (alunosData) {
        setDados(Object.entries(alunosData).map(([id, data]) => ({ id, ...data })));
      }
    };
    fetchData();
  }, [isReady]);
  
  const salvar = async (id, dados) => {
    await setData(`alunos/${id}`, dados);
  };
  
  // Mostrar loading enquanto não está pronto
  if (!isReady) {
    return <div>Carregando banco da escola...</div>;
  }
  
  // Mostrar erro se não conseguir conectar
  if (error) {
    return <div>Erro ao conectar: {error}</div>;
  }
  
  return <div>...</div>;
};
```

## 🔧 Mudanças Necessárias

### 1. **Imports**

**REMOVER:**
```jsx
import { db, ref, get, set, push, remove, update, storage } from '../../firebase';
```

**ADICIONAR:**
```jsx
import { auth } from '../../firebase'; // Manter apenas auth
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
```

### 2. **Hook no Componente**

**ADICIONAR no início do componente:**
```jsx
const { getData, setData, isReady, error, currentSchool, storage } = useSchoolDatabase();
```

### 3. **Substituir Operações Firebase**

| Operação Antiga | Operação Nova |
|----------------|---------------|
| `get(ref(db, 'path'))` | `await getData('path')` |
| `set(ref(db, 'path'), data)` | `await setData('path', data)` |
| `push(ref(db, 'path'), data)` | `await pushData('path', data)` |
| `remove(ref(db, 'path'))` | `await removeData('path')` |
| `update(ref(db, 'path'), data)` | `await updateData('path', data)` |

### 4. **Storage da Escola**

**ANTES:**
```jsx
import { storage } from '../../firebase';
const fileRef = storageRef(storage, 'fotos/aluno.jpg');
```

**DEPOIS:**
```jsx
const { storage } = useSchoolDatabase();
const fileRef = storageRef(storage, 'fotos/aluno.jpg');
```

### 5. **Verificações de Ready**

**ADICIONAR no início de useEffect e funções assíncronas:**
```jsx
useEffect(() => {
  if (!isReady) return;
  // ... resto do código
}, [isReady]);
```

## 📂 Arquivos a Migrar (Por Prioridade)

### **Nível 1 - Crítico** (dados principais)
1. ✅ `/dashboard/page.jsx` - JÁ MIGRADO
2. ❌ `/alunos/page.jsx` (3476 linhas!)
3. ❌ `/colaboradores/page.jsx`
4. ❌ `/escola/page.jsx`

### **Nível 2 - Importante** (operações frequentes)
5. ❌ `/financeiro/page.jsx`
6. ❌ `/notas-frequencia/page.jsx`
7. ❌ `/grade-horaria/page.jsx`
8. ❌ `/avisos/page.jsx`
9. ❌ `/agenda/page.jsx`

### **Nível 3 - Secundário** (funcionalidades auxiliares)
10. ❌ `/galeriafotos/page.jsx`
11. ❌ `/loja/page.jsx`
12. ❌ `/configuracoes/page.jsx`
13. ❌ `/turma-filho/page.jsx`

### **Nível 4 - Components**
14. ❌ `/components/notas-frequencia/*`
15. ❌ `/components/grade-horaria/*`
16. ❌ `/components/impressoes/*`
17. ❌ `/components/escola/*`
18. ❌ `/agenda/components/*`

## 🚨 Pontos de Atenção

### **1. Services (financeiroService, auditService, etc)**

Os services precisam **RECEBER** o database como parâmetro:

**ANTES:**
```jsx
import { db } from '../firebase';

export const financeiroService = {
  buscarTitulos: async () => {
    return await get(ref(db, 'titulos'));
  }
};
```

**DEPOIS:**
```jsx
export const financeiroService = {
  buscarTitulos: async (database) => {
    return await database.getData('titulos');
  }
};
```

**USO:**
```jsx
const { getData } = useSchoolDatabase();
const titulos = await financeiroService.buscarTitulos({ getData });
```

### **2. Storage de Imagens/Arquivos**

Todos uploads devem usar o `storage` do hook:

**ANTES:**
```jsx
import { storage } from '../../firebase';
const imgRef = storageRef(storage, `fotos/${id}.jpg`);
await uploadBytes(imgRef, file);
```

**DEPOIS:**
```jsx
const { storage } = useSchoolDatabase();
const imgRef = storageRef(storage, `fotos/${id}.jpg`);
await uploadBytes(imgRef, file);
```

### **3. Verificação de Escola Selecionada**

Adicionar no início do componente:

```jsx
if (!currentSchool) {
  return (
    <div>
      <p>Nenhuma escola selecionada</p>
      <button onClick={() => router.push('/')}>Selecionar Escola</button>
    </div>
  );
}
```

## 🧪 Como Testar

1. **Fazer logout completo**
2. **Fazer login novamente**
3. **Selecionar a escola "teste"**
4. **Abrir cada tela migrada**
5. **Verificar no Network (F12)**:
   - Requisições devem ir para: `escola-teste-default-rtdb.firebaseio.com`
   - NÃO para: `elo-school-default-rtdb.firebaseio.com`
6. **Criar/Editar/Excluir dados**
7. **Verificar no Firebase Console** que dados estão no banco correto

## ✅ Checklist de Migração

Para cada arquivo:

- [ ] Remover imports de `db`, `ref`, `get`, `set`, etc
- [ ] Adicionar `useSchoolDatabase` hook
- [ ] Substituir todas operações Firebase
- [ ] Adicionar verificação `isReady`
- [ ] Adicionar tratamento de erro
- [ ] Atualizar storage para usar `storage` do hook
- [ ] Testar criação de dados
- [ ] Testar leitura de dados
- [ ] Testar atualização de dados
- [ ] Testar exclusão de dados
- [ ] Verificar Network requests
- [ ] Confirmar dados no banco correto

## 🎯 Resultado Esperado

Após migração completa:

✅ Cada escola tem seus **próprios dados isolados**
✅ Aluno da Escola A **NÃO aparece** na Escola B
✅ Uploads vão para o **Storage da escola**
✅ Relatórios mostram apenas **dados da escola logada**
✅ Sistema **multi-tenant completo e funcional**

---

**🔐 Segurança**: Cada escola só acessa SEU banco e SEU storage!
