# 🧪 Guia de Teste - Sistema Multi-Tenant

## 📋 Checklist de Testes

### Fase 1: Criar Escolas de Teste ✅

#### Teste 1.1: Criar Escola A
1. [ ] Login como SuperAdmin
2. [ ] Acesse: SuperAdmin → Escolas → "Nova Escola"
3. [ ] **Step 1 - Dados Básicos:**
   - Nome: `Escola Teste A`
   - CNPJ: `11.111.111/0001-11`
   - Responsável: `Coordenador A`
   - Email: `escolaa@teste.com`
   - Telefone: `(11) 11111-1111`
4. [ ] **Step 2 - Endereço:**
   - Rua: `Rua A, 100`
   - Cidade: `São Paulo`
   - CEP: `01000-000`
   - Estado: `SP`
5. [ ] **Step 3 - Plano:**
   - Selecione: `Básico`
   - Mensalidade: `R$ 1.200,00`
   - Vencimento: `Dia 10`
6. [ ] **Step 4 - Configurações Técnicas (NOVO!):**
   - Verificar auto-geração:
     - Project ID: `escola-teste-a`
     - Database URL: `https://escola-teste-a-default-rtdb.firebaseio.com`
     - Storage Bucket: `escola-teste-a.firebasestorage.app`
7. [ ] Clique "Criar Escola"
8. [ ] **Resultado esperado:** 
   - ✅ Mensagem de sucesso
   - ✅ Escola aparece na lista

#### Teste 1.2: Criar Escola B
Repita o processo com:
- Nome: `Escola Teste B`
- CNPJ: `22.222.222/0001-22`
- Email: `escolab@teste.com`
- Telefone: `(22) 22222-2222`
- **URLs esperadas:**
  - Project ID: `escola-teste-b`
  - Database URL: `https://escola-teste-b-default-rtdb.firebaseio.com`
  - Storage Bucket: `escola-teste-b.firebasestorage.app`

---

### Fase 2: Testar Seleção de Escola ✅

#### Teste 2.1: Selecionar Escola A
1. [ ] Faça logout do SuperAdmin
2. [ ] Crie conta normal ou use conta de teste
3. [ ] No seletor de escola, escolha: `Escola Teste A`
4. [ ] **Abra o Console do navegador (F12)**
5. [ ] Verifique os logs:
   ```
   ✅ Esperado:
   🔍 Carregando dados completos da escola: <id-escola-a>
   ✅ Escola carregada: Escola Teste A
   📊 Database URL: https://escola-teste-a-default-rtdb.firebaseio.com
   📦 Storage Bucket: escola-teste-a.firebasestorage.app
   ```

#### Teste 2.2: Alternar para Escola B
1. [ ] Clique no seletor de escola
2. [ ] Escolha: `Escola Teste B`
3. [ ] Verifique logs no console:
   ```
   ✅ Esperado:
   🔍 Carregando dados completos da escola: <id-escola-b>
   ✅ Escola carregada: Escola Teste B
   📊 Database URL: https://escola-teste-b-default-rtdb.firebaseio.com
   📦 Storage Bucket: escola-teste-b.firebasestorage.app
   ```

---

### Fase 3: Testar Hook em Componente ✅

#### Teste 3.1: Criar Componente de Teste
Crie arquivo: `src/app/teste-multi-tenant/page.jsx`

```javascript
'use client';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';

export default function TestePage() {
  const { 
    isReady, 
    isLoading, 
    error, 
    currentSchool,
    getData,
    pushData 
  } = useSchoolDatabase();

  const handleTest = async () => {
    console.log('🧪 TESTE - Escola atual:', currentSchool?.nome);
    console.log('🧪 TESTE - Database URL:', currentSchool?.databaseURL);
    
    // Teste 1: Adicionar dado de teste
    const testId = await pushData('teste-multi-tenant', {
      mensagem: 'Teste de isolamento',
      escola: currentSchool.nome,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Dado salvo com ID:', testId);
    
    // Teste 2: Buscar dados
    const dados = await getData('teste-multi-tenant');
    console.log('📊 Dados da escola:', dados);
  };

  if (isLoading || !isReady) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Teste Multi-Tenant</h1>
        <p>⏳ Conectando ao banco da escola...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Erro!</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste Multi-Tenant</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="font-semibold">Escola Conectada:</p>
        <p className="text-lg">{currentSchool.nome}</p>
        <p className="text-sm text-gray-600 mt-2">
          Database: {currentSchool.databaseURL}
        </p>
        <p className="text-sm text-gray-600">
          Storage: {currentSchool.storageBucket}
        </p>
      </div>

      <button
        onClick={handleTest}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        🧪 Executar Teste de Isolamento
      </button>

      <div className="mt-6 bg-gray-50 p-4 rounded">
        <p className="text-sm text-gray-600">
          ℹ️ Abra o Console (F12) para ver os logs detalhados
        </p>
      </div>
    </div>
  );
}
```

#### Teste 3.2: Executar Teste de Isolamento
1. [ ] Acesse: `http://localhost:3000/teste-multi-tenant`
2. [ ] Verifique que está conectado à **Escola A**
3. [ ] Clique "Executar Teste de Isolamento"
4. [ ] Verifique logs no console:
   ```
   ✅ Esperado:
   🔌 Conectando ao banco da escola: Escola Teste A
   ✅ Firebase App inicializado para escola: Escola Teste A (escola-teste-a)
   ✅ Database conectado para: Escola Teste A
   🧪 TESTE - Escola atual: Escola Teste A
   🧪 TESTE - Database URL: https://escola-teste-a-default-rtdb.firebaseio.com
   ✅ Dado salvo com ID: -N...
   📊 Dados da escola: {...}
   ```

#### Teste 3.3: Alternar Escola e Verificar Isolamento
1. [ ] Troque para **Escola B** no seletor
2. [ ] Volte para: `http://localhost:3000/teste-multi-tenant`
3. [ ] Verifique que conectou à **Escola B**
4. [ ] Clique "Executar Teste de Isolamento" novamente
5. [ ] Verifique logs:
   ```
   ✅ Esperado:
   🔌 Conectando ao banco da escola: Escola Teste B
   ✅ Firebase App inicializado para escola: Escola Teste B (escola-teste-b)
   ✅ Database conectado para: Escola Teste B
   🧪 TESTE - Escola atual: Escola Teste B
   🧪 TESTE - Database URL: https://escola-teste-b-default-rtdb.firebaseio.com
   ✅ Dado salvo com ID: -M...
   📊 Dados da escola: {...} (SÓ TEM DADOS DA ESCOLA B!)
   ```

#### ✅ Resultado Esperado do Teste de Isolamento:
- Escola A tem seus próprios dados
- Escola B tem seus próprios dados
- **NÃO há mistura** entre eles
- Dados ficam completamente isolados

---

### Fase 4: Testar Cache ✅

#### Teste 4.1: Verificar Reutilização de Conexão
1. [ ] Alterne entre Escola A e B várias vezes
2. [ ] Verifique logs no console
3. [ ] **Resultado esperado:** Após a primeira vez, deve aparecer:
   ```
   (Conexão reutilizada do cache - sem logs de inicialização)
   ```

#### Teste 4.2: Limpar Cache Manualmente (Opcional)
Adicione ao componente de teste:
```javascript
import { clearSchoolCache } from '../../services/schoolDatabaseService';

const handleClearCache = () => {
  clearSchoolCache(currentSchool.projectId);
  console.log('🗑️ Cache limpo!');
};
```

---

### Fase 5: Testar Edição de Escola ✅

#### Teste 5.1: Tentar Editar Escola Existente
1. [ ] Acesse SuperAdmin → Escolas
2. [ ] Clique "Editar" na Escola Teste A
3. [ ] Vá para Step 4
4. [ ] **Verificar:**
   - [ ] Campos Project ID, Database URL e Storage Bucket estão **readOnly**
   - [ ] Aparece aviso: "Não podem ser alteradas após criação"
   - [ ] Não é possível modificar as URLs

#### ✅ Resultado Esperado:
- URLs são imutáveis após criação da escola
- Previne alterações acidentais que quebrariam a conexão

---

## 🎯 Checklist Final de Validação

### Funcionalidades Básicas:
- [ ] Criação de escola gera URLs automaticamente
- [ ] URLs seguem padrão correto do Firebase
- [ ] Seleção de escola carrega dados completos
- [ ] useSchoolDatabase conecta ao banco correto
- [ ] Dados são salvos no banco da escola selecionada

### Isolamento de Dados:
- [ ] Dados da Escola A não aparecem na Escola B
- [ ] Dados da Escola B não aparecem na Escola A
- [ ] Alternância entre escolas funciona corretamente
- [ ] Cada escola tem seus próprios registros

### Performance e Cache:
- [ ] Cache reutiliza conexões existentes
- [ ] Sem re-inicializações desnecessárias
- [ ] Alternância entre escolas é rápida

### Segurança:
- [ ] URLs não podem ser alteradas após criação
- [ ] Validação de formato de URL funciona
- [ ] Erro claro se configurações incompletas

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: "Database não inicializado"
**Causa:** Componente tentou usar hook antes de isReady
**Solução:** Sempre verificar `if (!isReady) return <Loading />;`

### Problema 2: URLs não geradas automaticamente
**Causa:** Nome da escola não foi preenchido
**Solução:** Preencher campo "Nome" primeiro (Step 1)

### Problema 3: Dados misturados entre escolas
**Causa:** Hook ainda conectado à escola anterior
**Solução:** Verificar que loadSchoolData() foi chamado corretamente

### Problema 4: "Firebase App already exists"
**Causa:** Tentativa de criar app duplicado
**Solução:** Cache resolve automaticamente (verificar getApps().find)

---

## 📊 Métricas de Sucesso

### ✅ Testes Passaram Se:
1. **Criação:** 2 escolas criadas com URLs diferentes
2. **Seleção:** Troca entre escolas funciona
3. **Isolamento:** Dados não se misturam
4. **Cache:** Reutilização funciona
5. **Segurança:** URLs imutáveis após criação

### 📈 Próximo Nível:
- Migrar componente real (ex: Alunos)
- Testar com múltiplos usuários simultâneos
- Testar upload de arquivos (Storage)
- Performance com muitas escolas

---

## 🎓 Comandos Úteis para Debug

### Ver Logs Detalhados:
```javascript
// No console do navegador:
console.table(currentSchool);
```

### Verificar Estado do Hook:
```javascript
const hook = useSchoolDatabase();
console.log('Hook State:', hook);
```

### Verificar Cache:
```javascript
// Adicione temporariamente no serviço:
console.log('Apps cache:', schoolApps.size);
console.log('DB cache:', schoolDatabases.size);
console.log('Storage cache:', schoolStorages.size);
```

---

**Tempo Estimado de Testes:** 30-45 minutos  
**Complexidade:** Média  
**Pré-requisitos:** SuperAdmin configurado, Firebase configurado

**Última atualização:** 14/10/2025

---

## 🔄 PARTE 2: Validação de Integração com Páginas Reais

### Fase 6: Testar Dashboard com Banco Real ✅

#### O que foi implementado:
- ✅ Dashboard migrado para usar `useSchoolDatabase`
- ✅ Verificação de escola selecionada
- ✅ Mensagens de erro detalhadas
- ✅ Logs de conexão ao banco

#### Teste 6.1: Acessar Dashboard após Seleção de Escola

1. [ ] **Faça login** com usuário vinculado a uma escola
2. [ ] **Selecione a escola** no AccessTypeSelector
3. [ ] **Será redirecionado** para `/dashboard`

#### Teste 6.2: Verificar Logs no Console

Ao acessar o dashboard, deve aparecer:

```
✅ Logs esperados:
🔍 Carregando dados completos da escola: {escolaId}
✅ Escola carregada: Escola Teste
📊 Database URL: https://escola-teste-default-rtdb.firebaseio.com
📦 Storage Bucket: escola-teste.appspot.com
🔌 Conectando ao banco da escola: Escola Teste
✅ Conectado ao banco da escola: Escola Teste
🔄 Carregando dados do dashboard da escola: Escola Teste
📊 Conectado ao banco: https://escola-teste-default-rtdb.firebaseio.com
✅ Dados do dashboard carregados com sucesso
```

#### Teste 6.3: Verificar Requisições de Rede (IMPORTANTE!)

1. [ ] Abra **DevTools** (F12) → Aba **Network**
2. [ ] Filtre por: `firebaseio.com`
3. [ ] **Verifique que todas as requisições vão para**:
   ```
   escola-teste-default-rtdb.firebaseio.com
   ```
4. [ ] **NÃO devem ir para**:
   ```
   elo-school-default-rtdb.firebaseio.com (banco antigo)
   ```

---

**Documentado por**: Sistema ELO  
**Versão**: 2.0 (Integração com Dashboard)  
**Data**: 14 de Outubro de 2025

````
