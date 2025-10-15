# 🤖 Scripts de Migração Automática

## 📋 Arquivos

1. **migrate-to-multitenant.js** - Script principal de migração
2. **test-migration.js** - Teste em modo simulação (dry-run)
3. **rollback-migration.js** - Reverter mudanças se necessário

## 🚀 Como Usar

### Passo 1: Testar (Simulação)

```bash
node test-migration.js
```

Este comando **NÃO modifica nenhum arquivo**. Apenas mostra:
- Quais arquivos seriam migrados
- Quantos arquivos seriam afetados
- Se há erros potenciais

### Passo 2: Revisar Resultados

Analise a saída do teste:
- ✅ Quantos arquivos serão migrados?
- ⏭️  Quantos serão pulados?
- ❌ Há algum erro?

### Passo 3: Fazer Commit Antes

**IMPORTANTE**: Commite todas as mudanças atuais antes de migrar!

```bash
git add .
git commit -m "backup antes da migração multi-tenant"
git push
```

### Passo 4: Executar Migração Real

```bash
node migrate-to-multitenant.js
```

Este comando **MODIFICA OS ARQUIVOS** e cria backup em `backup-pre-migration/`

### Passo 5: Revisar Mudanças

```bash
git diff
```

Revise todas as mudanças feitas pelo script.

### Passo 6: Testar Aplicação

```bash
npm run dev
```

Teste cada tela:
1. Login
2. Selecionar escola
3. Abrir Dashboard
4. Abrir Alunos
5. Abrir Financeiro
6. Etc.

### Passo 7: Commit ou Rollback

**Se tudo funcionar:**
```bash
git add .
git commit -m "feat: Migração completa para multi-tenant em todas telas"
git push
```

**Se houver problemas:**
```bash
node rollback-migration.js
```

## 📊 O que o Script Faz

### 1. Atualiza Imports

**ANTES:**
```jsx
import { db, ref, get, set, storage } from '../../firebase';
```

**DEPOIS:**
```jsx
import { auth } from '../../firebase';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
```

### 2. Adiciona Hook

**ANTES:**
```jsx
const MinhaPage = () => {
  const [dados, setDados] = useState([]);
```

**DEPOIS:**
```jsx
const MinhaPage = () => {
  // Hook para acessar banco da escola
  const { getData, setData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();
  
  const [dados, setDados] = useState([]);
```

### 3. Substitui Operações Firebase

| Antes | Depois |
|-------|--------|
| `get(ref(db, 'alunos'))` | `getData('alunos')` |
| `set(ref(db, 'alunos/1'), data)` | `setData('alunos/1', data)` |
| `push(ref(db, 'alunos'), data)` | `pushData('alunos', data)` |
| `remove(ref(db, 'alunos/1'))` | `removeData('alunos/1')` |
| `update(ref(db, 'alunos/1'), data)` | `updateData('alunos/1', data)` |

### 4. Adiciona Verificação isReady

**ANTES:**
```jsx
useEffect(() => {
  const fetchData = async () => {
    // buscar dados
  };
  fetchData();
}, []);
```

**DEPOIS:**
```jsx
useEffect(() => {
  if (!isReady) return;
  
  const fetchData = async () => {
    // buscar dados
  };
  fetchData();
}, [isReady]);
```

### 5. Atualiza Storage

**ANTES:**
```jsx
const imgRef = storageRef(storage, 'fotos/aluno.jpg');
```

**DEPOIS:**
```jsx
const imgRef = storageRef(schoolStorage, 'fotos/aluno.jpg');
```

## ⚠️ Arquivos Ignorados

O script **NÃO modifica**:
- `/dashboard/page.jsx` - Já migrado manualmente
- `/super-admin/*` - Usa managementDB, não escola
- `/pending-approval/*` - Não precisa de dados de escola
- Página raiz `/page.jsx`

## 🔍 Verificação Manual Necessária

Após a migração, revisar manualmente:

1. **Services** (financeiroService, auditService, etc)
   - Precisam receber database como parâmetro
   - Exemplo em `services/README.md`

2. **Components complexos**
   - Verificar se lógica está correta
   - Testar funcionalidades

3. **Uploads de arquivo**
   - Confirmar que usam `schoolStorage`
   - Testar upload/download

## 📝 Logs e Debug

O script gera logs detalhados:

```
📄 Analisando: alunos/page.jsx
  🔄 Migrando...
  ✅ Migrado com sucesso!

📄 Analisando: dashboard/page.jsx
  ✅ Já migrado - pulando

📄 Analisando: avisos/page.jsx
  ⏭️  Não usa Firebase direto - pulando
```

## 🆘 Troubleshooting

### Erro: "Cannot find module"
```bash
# Instalar dependências
npm install
```

### Erro: "Permission denied"
```bash
# Windows: Executar como administrador
# Linux/Mac: 
sudo node migrate-to-multitenant.js
```

### Migração incompleta
```bash
# Reverter e tentar novamente
node rollback-migration.js
node migrate-to-multitenant.js
```

### Conflitos no Git
```bash
# Ver o que mudou
git diff

# Reverter tudo
git checkout .

# Tentar novamente
node migrate-to-multitenant.js
```

## ✅ Checklist Pós-Migração

- [ ] Script executado sem erros
- [ ] Git diff revisado
- [ ] Aplicação inicia sem erros
- [ ] Login funciona
- [ ] Seleção de escola funciona
- [ ] Dashboard carrega dados
- [ ] Alunos carrega dados
- [ ] Colaboradores carrega dados
- [ ] Financeiro carrega dados
- [ ] Criar novo registro funciona
- [ ] Editar registro funciona
- [ ] Deletar registro funciona
- [ ] Upload de arquivo funciona
- [ ] Cada escola vê apenas seus dados
- [ ] Network aponta para banco correto
- [ ] Storage usa bucket correto

## 🎯 Resultado Esperado

Após migração bem-sucedida:

✅ **49 arquivos migrados**
✅ **Todas telas usam banco da escola**
✅ **Storage isolado por escola**
✅ **Sistema multi-tenant completo**
✅ **Zero erros de compilação**
✅ **Aplicação funcional**

---

**💡 Dica**: Execute primeiro em **modo teste** (test-migration.js) para ver o que será mudado antes de aplicar!
