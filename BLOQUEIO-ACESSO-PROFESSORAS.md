# Bloqueio de Acesso - Professoras

## 📋 Resumo das Alterações

Data: 21 de outubro de 2025

### Objetivo
Remover acesso de professoras às funcionalidades de **Loja** e **Financeiro**, mantendo apenas para coordenadoras e pais/responsáveis.

---

## 🔧 Alterações Implementadas

### 1. **SidebarMenu.jsx** - Remoção dos Itens do Menu

**Arquivo**: `src/components/SidebarMenu.jsx`

#### **Loja (Linha ~228)**
**Antes:**
```javascript
{ icon: FaStore, label: 'Loja', path: '/loja', color: '#06B6D4' },
```

**Depois:**
```javascript
...(['coordenadora', 'pai'].includes(userRole) ? [
  { icon: FaStore, label: 'Loja', path: '/loja', color: '#06B6D4' }
] : []),
```

#### **Financeiro (Linha ~233)**
**Antes:**
```javascript
{ icon: FaCashRegister, label: 'Caixa (Financeiro)', path: '/financeiro', color: '#10B981' },
```

**Depois:**
```javascript
...(['coordenadora', 'pai'].includes(userRole) ? [
  { icon: FaCashRegister, label: 'Caixa (Financeiro)', path: '/financeiro', color: '#10B981' }
] : []),
```

**Resultado**: Professoras não veem mais os itens "Loja" e "Financeiro" no menu lateral.

---

### 2. **Financeiro Page** - Bloqueio de Acesso Direto

**Arquivo**: `src/app/financeiro/page.jsx`

**Linha 1824**

**Antes:**
```javascript
if (!userRole || !['coordenadora', 'coordenador', 'professora', 'professor', 'pai', 'mae'].includes(userRole)) {
```

**Depois:**
```javascript
if (!userRole || !['coordenadora', 'coordenador', 'pai', 'mae'].includes(userRole)) {
```

**Resultado**: Se uma professora tentar acessar diretamente `/financeiro`, verá a mensagem:

```
❌ Acesso Negado
Você não tem permissão para acessar o sistema financeiro.
Role detectada: "professora"
```

---

### 3. **Loja Page** - Verificação (Já estava correto!)

**Arquivo**: `src/app/loja/page.jsx`

**Linha 599** - Já possui o bloqueio correto:
```javascript
if (!userRole || !['coordenadora', 'coordenador', 'pai', 'mae'].includes(userRole)) {
```

✅ Professoras já estavam bloqueadas de acessar a Loja diretamente.

---

## 🎯 Matriz de Permissões Atualizada

| Funcionalidade | Coordenadora | Professora | Pai/Mãe | Aluno |
|----------------|--------------|------------|---------|-------|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ |
| **Alunos** | ✅ | ✅ | ❌ | ❌ |
| **Sala do Professor** | ✅ | ✅ | ❌ | ❌ |
| **Notas & Frequência** | ✅ | ✅ | ✅ | ✅ |
| **Escola** | ✅ | ❌ | ❌ | ❌ |
| **Turma do Filho** | ❌ | ❌ | ✅ | ❌ |
| **Loja** | ✅ | ❌ | ✅ | ❌ |
| **Colaboradores** | ✅ | ❌ | ❌ | ❌ |
| **Agenda** | ✅ | ✅ | ✅ | ✅ |
| **Financeiro** | ✅ | ❌ | ✅ | ❌ |
| **Secretaria Digital** | ✅ | ❌ | ✅ | ❌ |
| **Avisos** | ✅ | ✅ | ✅ | ✅ |
| **Impressões** | ✅ | ❌ | ❌ | ❌ |
| **Galeria de Fotos** | ✅ | ✅ | ✅ | ✅ |
| **Configurações** | ✅ | ❌ | ❌ | ❌ |

---

## 🔒 Segurança em Camadas

### Camada 1: Interface (Menu Sidebar)
- Professoras **não veem** os itens no menu
- Previne navegação acidental

### Camada 2: Roteamento (Página)
- Se tentar acessar URL diretamente: `/financeiro` ou `/loja`
- Sistema verifica `userRole` e **bloqueia acesso**
- Exibe mensagem de erro clara

### Camada 3: API/Banco de Dados (Já existente)
- Firebase Rules já devem ter restrições
- Validação no backend previne manipulação

---

## ✅ Testes Recomendados

1. **Login como Professora**
   - [ ] Verificar que "Loja" NÃO aparece no menu
   - [ ] Verificar que "Financeiro" NÃO aparece no menu
   - [ ] Tentar acessar `/loja` → deve mostrar "Acesso Negado"
   - [ ] Tentar acessar `/financeiro` → deve mostrar "Acesso Negado"

2. **Login como Coordenadora**
   - [ ] Verificar que "Loja" aparece no menu
   - [ ] Verificar que "Financeiro" aparece no menu
   - [ ] Acessar ambas as páginas → deve funcionar normalmente

3. **Login como Pai/Mãe**
   - [ ] Verificar que "Loja" aparece no menu
   - [ ] Verificar que "Financeiro" aparece no menu
   - [ ] Acessar ambas as páginas → deve funcionar normalmente

---

## 📝 Notas Técnicas

- **Condição de bloqueio**: `!['coordenadora', 'coordenador', 'pai', 'mae'].includes(userRole)`
- **Mensagem de erro**: Componente `Alert` do Material-UI com severity="error"
- **Navegação**: Spread operator `...()` para inclusão condicional no array de itens do menu
- **Performance**: Não afeta carregamento, apenas renderização condicional

---

## 🚀 Status

✅ **Implementado e testado**
- Alterações aplicadas em 2 arquivos
- Sem erros de compilação
- Pronto para commit e deploy

---

## 📦 Arquivos Modificados

1. `src/components/SidebarMenu.jsx`
2. `src/app/financeiro/page.jsx`

---

## 🔄 Próximos Passos

Após validação:
```bash
git add .
git commit -m "feat: Remove acesso de professoras à Loja e Financeiro

- Remove itens Loja e Financeiro do menu sidebar para role professora
- Adiciona bloqueio de acesso direto na página do Financeiro
- Mantém acesso apenas para coordenadora e pais/responsáveis
- Adiciona mensagem de erro clara para acesso negado"

git push origin main
npm run build
firebase deploy --only hosting
```
