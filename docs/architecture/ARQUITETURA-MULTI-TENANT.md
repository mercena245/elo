# 🏗️ Arquitetura Multi-Tenant: Múltiplos Bancos por Escola

## 📋 Visão Geral

O sistema ELO School agora suporta **isolamento completo de dados por escola**, onde cada escola tem:
- ✅ Seu próprio Firebase Realtime Database
- ✅ Seu próprio Firebase Storage
- ✅ URLs exclusivas e independentes
- ✅ Dados completamente isolados de outras escolas

## 🔄 Como Funciona

### 1. Estrutura de Dados no Banco de Gerenciamento

Cada escola cadastrada possui as configurações técnicas:

```json
{
  "escolas": {
    "-N1aB2cD3eF4": {
      "nome": "Escola Exemplo",
      "cnpj": "12.345.678/0001-90",
      "email": "contato@escolaexemplo.com",
      
      // ⚙️ CONFIGURAÇÕES TÉCNICAS
      "projectId": "escola-exemplo",
      "databaseURL": "https://escola-exemplo-default-rtdb.firebaseio.com",
      "storageBucket": "escola-exemplo.firebasestorage.app",
      
      // 📊 Outras configs
      "plano": "intermediario",
      "status": "ativo",
      "configuracoes": {...}
    }
  }
}
```

### 2. Fluxo de Conexão Automática

```
┌─────────────────────────────────────────────────────────┐
│ 1. USUÁRIO FAZ LOGIN                                    │
│    - Firebase Auth autentica                            │
│    - AuthContext carrega usuário                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. SELEÇÃO DE ESCOLA                                    │
│    - Usuário seleciona escola no AccessSelector         │
│    - handleSchoolSelect() é chamado                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. CARREGAMENTO DE DADOS DA ESCOLA                      │
│    - loadSchoolData() busca no managementDB             │
│    - Carrega: databaseURL, storageBucket, projectId     │
│    - Define currentSchool no AuthContext                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. HOOK DETECTA MUDANÇA                                 │
│    - useSchoolDatabase detecta currentSchool            │
│    - Inicializa Firebase App para essa escola           │
│    - Cria instância de Database e Storage               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. COMPONENTES USAM O HOOK                              │
│    - Chamam getData(), pushData(), etc                  │
│    - Operações vão automaticamente para banco correto   │
│    - Dados isolados por escola                          │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Componentes da Arquitetura

### 1. schoolDatabaseService.js

**Localização:** `src/services/schoolDatabaseService.js`

**Responsabilidades:**
- Gerenciar múltiplas instâncias do Firebase
- Cache de conexões por escola
- Inicialização sob demanda
- Operações de Database e Storage

**Principais Funções:**

```javascript
// Inicializar App Firebase para uma escola
const app = getSchoolApp(schoolData);

// Obter Database da escola
const db = getSchoolDatabase(schoolData);

// Obter Storage da escola
const storage = getSchoolStorage(schoolData);

// Wrapper com operações prontas
const dbOps = schoolDatabaseOperations(schoolData);
await dbOps.get('alunos');
await dbOps.push('alunos', { nome: 'João' });
```

**Cache Inteligente:**
- Mantém instâncias ativas em Map()
- Reutiliza conexões para performance
- Função clearSchoolCache() para limpeza

### 2. useSchoolDatabase Hook

**Localização:** `src/hooks/useSchoolDatabase.js`

**Responsabilidades:**
- Interface React para o serviço
- Conexão automática baseada em currentSchool
- Estados de loading e erro
- Métodos simplificados

**Como Usar:**

```javascript
import { useSchoolDatabase } from '@/hooks/useSchoolDatabase';

function MeuComponente() {
  const { 
    isReady,        // Banco pronto para usar
    isLoading,      // Carregando configurações
    error,          // Erro de conexão
    currentSchool,  // Dados da escola
    getData,        // Buscar dados
    pushData,       // Adicionar item
    updateData,     // Atualizar dados
    removeData,     // Remover dados
    listen,         // Listener tempo real
    uploadFile,     // Upload para Storage
    getFileURL,     // URL de arquivo
    deleteFile      // Deletar arquivo
  } = useSchoolDatabase();

  // Aguardar banco pronto
  if (!isReady) return <Loading />;

  // Usar métodos
  const alunos = await getData('alunos');
  await pushData('alunos', { nome: 'Maria' });
}
```

### 3. AuthContext Atualizado

**Localização:** `src/context/AuthContext.jsx`

**Novos Estados:**

```javascript
const {
  currentSchool,      // Dados completos da escola (com URLs)
  isLoadingSchool,    // Carregando dados da escola
  handleSchoolSelect, // Selecionar escola (agora busca dados completos)
  loadSchoolData      // Recarregar dados da escola
} = useAuth();
```

**Fluxo:**

1. Usuário seleciona escola → `handleSchoolSelect(school)`
2. Salva no localStorage → `selectedSchool`
3. Busca dados completos → `loadSchoolData(school.id)`
4. Define → `currentSchool` (com databaseURL, storageBucket, etc)
5. Hook detecta → `useSchoolDatabase` inicializa conexão

### 4. SchoolForm com Configurações Técnicas

**Localização:** `src/app/super-admin/components/SchoolForm.jsx`

**Novo Step 4: Configurações Técnicas**

Campos adicionados:
- **Project ID**: Identificador único do projeto Firebase
- **Database URL**: URL do Realtime Database
- **Storage Bucket**: Bucket do Firebase Storage

**Auto-Geração:**
Quando o nome da escola é preenchido, as URLs são geradas automaticamente:

```javascript
Nome: "Escola Maria Clara"
↓
projectId: "escola-maria-clara"
databaseURL: "https://escola-maria-clara-default-rtdb.firebaseio.com"
storageBucket: "escola-maria-clara.firebasestorage.app"
```

**Validações:**
- URLs só podem ser definidas na criação (readOnly no edit)
- Formato de URL verificado (deve começar com https://)
- Todos os campos obrigatórios

## 📝 Como Usar em Componentes

### Exemplo Básico: Buscar Dados

```javascript
'use client';
import { useSchoolDatabase } from '@/hooks/useSchoolDatabase';

export default function ListaAlunos() {
  const [alunos, setAlunos] = useState([]);
  const { getData, isReady } = useSchoolDatabase();

  useEffect(() => {
    if (!isReady) return;

    const load = async () => {
      const data = await getData('alunos');
      setAlunos(Object.values(data || {}));
    };
    
    load();
  }, [isReady]);

  return (
    <div>
      {alunos.map(aluno => (
        <div key={aluno.id}>{aluno.nome}</div>
      ))}
    </div>
  );
}
```

### Exemplo: Adicionar Dados

```javascript
const { pushData } = useSchoolDatabase();

const handleAddAluno = async (novoAluno) => {
  const id = await pushData('alunos', {
    nome: novoAluno.nome,
    matricula: novoAluno.matricula,
    dataCadastro: new Date().toISOString()
  });
  
  console.log('Aluno adicionado com ID:', id);
};
```

### Exemplo: Listener Tempo Real

```javascript
const { listen } = useSchoolDatabase();

useEffect(() => {
  if (!isReady) return;

  const unsubscribe = listen('alunos', (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      setAlunos(Object.values(data));
    }
  });

  return () => unsubscribe();
}, [isReady]);
```

### Exemplo: Upload de Arquivo

```javascript
const { uploadFile, getFileURL } = useSchoolDatabase();

const handleUpload = async (file) => {
  const path = `alunos/fotos/${Date.now()}_${file.name}`;
  
  const { url } = await uploadFile(path, file, {
    contentType: file.type
  });
  
  console.log('Arquivo salvo em:', url);
  return url;
};
```

## 🔐 Segurança e Isolamento

### Isolamento de Dados

✅ **Por Banco de Dados:**
- Cada escola tem Firebase Database separado
- Impossível acessar dados de outra escola por erro
- URLs completamente independentes

✅ **Por Storage:**
- Buckets separados por escola
- Arquivos isolados fisicamente
- Sem risco de mistura de arquivos

### Validação de Acesso

```javascript
// AuthContext garante que currentSchool está correta
// useSchoolDatabase usa currentSchool automaticamente
// Impossível conectar ao banco errado

if (!currentSchool) {
  throw new Error('Nenhuma escola selecionada');
}

// Sempre conecta ao banco da escola atual
const db = getSchoolDatabase(currentSchool);
```

### Regras do Firebase

Cada banco de escola deve ter suas próprias regras:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

## 🚀 Migração de Componentes Existentes

### Antes (banco único):

```javascript
import { db, ref, get } from '@/firebase';

const alunosRef = ref(db, 'alunos');
const snapshot = await get(alunosRef);
```

### Depois (multi-tenant):

```javascript
import { useSchoolDatabase } from '@/hooks/useSchoolDatabase';

const { getData } = useSchoolDatabase();
const alunos = await getData('alunos');
```

### Checklist de Migração:

- [ ] Substituir imports diretos do firebase
- [ ] Usar useSchoolDatabase() no componente
- [ ] Aguardar isReady antes de fazer operações
- [ ] Tratar estados de loading e erro
- [ ] Testar com múltiplas escolas

## 📊 Monitoramento e Debug

### Console Logs

O sistema registra automaticamente:

```
✅ Firebase App inicializado para escola: Escola Exemplo (escola-exemplo)
✅ Database conectado para: Escola Exemplo
✅ Storage conectado para: Escola Exemplo
```

### Verificar Conexão Atual

```javascript
const { currentSchool } = useSchoolDatabase();

console.log('Escola atual:', currentSchool.nome);
console.log('Database:', currentSchool.databaseURL);
console.log('Storage:', currentSchool.storageBucket);
```

### Limpar Cache (se necessário)

```javascript
import { clearSchoolCache } from '@/services/schoolDatabaseService';

// Limpar cache de uma escola específica
clearSchoolCache('escola-exemplo');

// Limpar todo o cache
clearAllSchoolCaches();
```

## ⚠️ Cuidados Importantes

### 1. Nunca usar imports diretos

❌ **Errado:**
```javascript
import { db } from '@/firebase';
const ref = ref(db, 'alunos');
```

✅ **Correto:**
```javascript
const { getData } = useSchoolDatabase();
const alunos = await getData('alunos');
```

### 2. Sempre verificar isReady

❌ **Errado:**
```javascript
const { getData } = useSchoolDatabase();
const data = await getData('alunos'); // Pode falhar!
```

✅ **Correto:**
```javascript
const { getData, isReady } = useSchoolDatabase();

if (!isReady) {
  return <Loading />;
}

const data = await getData('alunos');
```

### 3. Configurações na criação

⚠️ **Importante:**
- DatabaseURL e StorageBucket **NÃO podem ser alterados** após criação
- Certifique-se que as URLs estão corretas antes de criar a escola
- Use os campos readOnly no modo edição

### 4. Performance

✅ **Boas Práticas:**
- O cache reutiliza conexões automaticamente
- Evite criar múltiplas instâncias desnecessárias
- Use listeners apenas quando necessário
- Cleanup de listeners no useEffect cleanup

## 🎯 Próximos Passos

1. **Migrar componentes existentes** para useSchoolDatabase
2. **Testar com múltiplas escolas** diferentes
3. **Configurar regras de segurança** em cada banco
4. **Monitorar performance** de conexões
5. **Documentar padrões** específicos do projeto

## 📚 Referência Rápida

### Import
```javascript
import { useSchoolDatabase } from '@/hooks/useSchoolDatabase';
```

### Setup
```javascript
const { getData, pushData, isReady } = useSchoolDatabase();
```

### Uso
```javascript
if (!isReady) return <Loading />;

// Buscar
const data = await getData('path');

// Adicionar
const id = await pushData('path', { ... });

// Atualizar
await updateData('path', { ... });

// Remover
await removeData('path');

// Listener
const unsub = listen('path', callback);
```

---

**Última atualização:** 14/10/2025
**Versão da Arquitetura:** 2.0 (Multi-Tenant)
