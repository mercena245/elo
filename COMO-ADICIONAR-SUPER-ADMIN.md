# 🔐 Como Adicionar Novos Super Admins

**Data:** 4 de dezembro de 2025  
**Versão:** 2.0 - Atualizado

---

## 🎯 Objetivo

Este documento explica como adicionar novos usuários com permissões de **Super Admin** no sistema ELO School.

---

## 📋 Pré-requisitos

Antes de adicionar um novo super admin, você precisa:

1. ✅ Ter acesso ao código do sistema
2. ✅ Saber o **UID (User ID)** do usuário no Firebase Authentication
3. ✅ Permissão para fazer deploy do sistema

---

## 🔍 Como Obter o UID de um Usuário

### Opção 1: Firebase Console (Recomendado)

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto: **elo-school**
3. Vá em **Authentication** → **Users**
4. Localize o usuário pelo e-mail
5. Copie o **User UID** (uma string como: `qD6UucWtcgPC9GHA41OB8rSaghZ2`)

### Opção 2: Pelo Sistema

1. Peça para o usuário fazer login no sistema
2. Abra o Console do navegador (F12)
3. Digite: `firebase.auth().currentUser.uid`
4. Copie o UID exibido

---

## ⚡ Como Adicionar um Novo Super Admin

### 🚀 MÉTODO 1: Script Automatizado (RECOMENDADO)

O sistema agora tem um script que facilita o processo:

```bash
node scripts/add-super-admin.js <UID_DO_FIREBASE>
```

**Exemplo:**
```bash
node scripts/add-super-admin.js qD6UucWtcgPC9GHA41OB8rSaghZ2
```

O script irá:
- ✅ Adicionar o UID automaticamente
- ✅ Verificar duplicatas
- ✅ Adicionar comentário com a data
- ✅ Mostrar próximos passos

---

### 📝 MÉTODO 2: Manual

#### Passo 1: Editar o Arquivo de Configuração

Abra o arquivo:
```
src/config/constants.js
```

### Passo 2: Adicionar o UID na Lista

Localize o array `SUPER_ADMIN_UIDS` e adicione o novo UID:

```javascript
export const SUPER_ADMIN_UIDS = [
  'qD6UucWtcgPC9GHA41OB8rSaghZ2', // Seu usuário atual
  'NOVO_UID_AQUI',                 // <- Adicione aqui
  // Pode adicionar quantos quiser:
  // 'OUTRO_UID_AQUI',
];
```

### Exemplo Prático:

**ANTES:**
```javascript
export const SUPER_ADMIN_UIDS = [
  'qD6UucWtcgPC9GHA41OB8rSaghZ2',
];
```

**DEPOIS:**
```javascript
export const SUPER_ADMIN_UIDS = [
  'qD6UucWtcgPC9GHA41OB8rSaghZ2', // Mariana (você)
  'xyz789abc456def123ghi789jkl',  // João Silva
  'mno456pqr789stu012vwx345yz6',  // Maria Santos
];
```

### Passo 3: Salvar e Fazer Deploy

```bash
# 1. Commit das mudanças
git add src/config/constants.js
git commit -m "feat: Adicionar novo super admin"
git push origin main

# 2. Build do projeto
npm run build

# 3. Deploy no Firebase
firebase deploy --only hosting
```

---

## 🚀 Verificar se Funcionou

1. Peça para o novo super admin fazer login
2. Ele deve ter acesso ao menu **Super Admin**
3. Verificar no console: `console.log(isSuperAdmin('UID_DO_USUARIO'))`
4. Deve retornar `true`

---

## 🔐 Permissões do Super Admin

Um usuário com permissões de Super Admin pode:

✅ Acessar o painel `/super-admin`
✅ Criar e gerenciar escolas
✅ Aprovar novos usuários
✅ Gerenciar todos os usuários do sistema
✅ Ver logs de auditoria
✅ Configurações globais do sistema
✅ Deletar escolas (se implementado)
✅ Acesso total a todas as escolas

---

## ⚠️ Segurança

### Boas Práticas:

1. **Apenas adicione usuários confiáveis** - Super Admin tem acesso total
2. **Use e-mails corporativos** - Evite e-mails pessoais
3. **Documente quem adicionou** - Adicione comentários no código
4. **Revise periodicamente** - Remova UIDs de pessoas que saíram
5. **2FA no futuro** - O sistema está preparado para autenticação em 2 fatores

### Adicione Comentários:

```javascript
export const SUPER_ADMIN_UIDS = [
  'qD6UucWtcgPC9GHA41OB8rSaghZ2', // Mariana - Fundadora
  'xyz789abc456def123ghi789jkl',  // João Silva - CTO (adicionado 03/12/2025)
  'mno456pqr789stu012vwx345yz6',  // Maria Santos - Diretora (adicionado 15/01/2026)
];
```

---

## ❌ Como Remover um Super Admin

Para remover um super admin, basta deletar a linha do UID:

```javascript
export const SUPER_ADMIN_UIDS = [
  'qD6UucWtcgPC9GHA41OB8rSaghZ2', // Você
  // 'xyz789abc456def123ghi789jkl',  // Removido - João saiu da empresa
];
```

Depois fazer commit, build e deploy novamente.

---

## 🛠️ Troubleshooting

### "Acesso Negado" mesmo após adicionar UID

**Solução:**
1. Verificar se o UID está correto (sem espaços extras)
2. Verificar se fez o deploy
3. Limpar cache do navegador (Ctrl + Shift + Delete)
4. Fazer logout e login novamente

### Usuário não vê o menu "Super Admin"

**Solução:**
1. Verificar se o `accessType` está como `'management'`
2. Fazer logout e selecionar "Acesso ao Sistema de Gerenciamento"
3. Verificar no localStorage: `localStorage.getItem('accessType')`

### Build falha ao fazer deploy

**Solução:**
1. Verificar sintaxe do JavaScript (vírgulas, aspas)
2. Rodar `npm run build` localmente primeiro
3. Verificar se o UID está entre aspas: `'UID_AQUI'`

---

## 📝 Exemplo Completo de Arquivo

```javascript
/**
 * Constantes do Sistema
 * Centralizadas para fácil manutenção
 */

// Lista de UIDs dos Super Admins
export const SUPER_ADMIN_UIDS = [
  'qD6UucWtcgPC9GHA41OB8rSaghZ2', // Mariana - Fundadora
  'xyz789abc456def123ghi789jkl',  // João Silva - CTO
];

// Mantém compatibilidade com código legado
export const SUPER_ADMIN_UID = SUPER_ADMIN_UIDS[0];

// Senha temporária do Super Admin (será substituída por 2FA)
export const SUPER_ADMIN_PASSWORD = '984984';

// Roles do sistema
export const ROLES = {
  SUPER_ADMIN: 'superAdmin',
  COORDENADOR: 'coordenador',
  COORDENADORA: 'coordenadora',
  PROFESSOR: 'professor',
  PROFESSORA: 'professora',
  PAI: 'pai',
  SECRETARIA: 'secretaria',
  PENDING: 'pending'
};

// Verificar se um usuário é Super Admin
export const isSuperAdmin = (uid) => {
  return SUPER_ADMIN_UIDS.includes(uid);
};

// Verificar se uma role é de coordenador
export const isCoordinator = (role) => {
  return role === ROLES.COORDENADOR || role === ROLES.COORDENADORA;
};

// Verificar se uma role é de professor
export const isProfessor = (role) => {
  return role === ROLES.PROFESSOR || role === ROLES.PROFESSORA;
};
```

---

## 📞 Suporte

Se tiver dúvidas ou problemas:

1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do Firebase Console
3. Consulte a documentação do Firebase Authentication
4. Entre em contato com o desenvolvedor responsável

---

## 🔄 Histórico de Mudanças

| Data | Mudança | Quem |
|------|---------|------|
| 03/12/2025 | Sistema alterado para suportar múltiplos super admins | Sistema |
| 03/12/2025 | Documentação criada | Sistema |

---

**⚠️ IMPORTANTE:** Guarde este documento em local seguro. A lista de Super Admins é sensível e não deve ser compartilhada publicamente.
