# 👥 Gerenciamento de Usuários - SuperAdmin

## 📋 Visão Geral

Sistema de gerenciamento de usuários no painel SuperAdmin que permite:
- ✅ Buscar usuários do banco de gerenciamento
- ✅ Vincular usuários a uma ou mais escolas
- ✅ Definir função (role) do usuário em cada escola
- ✅ Ativar/desativar vínculos por escola
- ✅ Atualizar dados dos usuários

## 🗄️ Estrutura no Banco de Dados

### Banco de Gerenciamento
**URL**: `https://gerenciamento-elo-school.firebaseio.com/`

**Caminho**: `/usuarios/<userUid>`

```json
{
  "usuarios": {
    "qD6UucWtcgPC9GHA41OB8rSaghZ2": {
      "email": "gubra19@gmail.com",
      "nome": "Gustavo",
      "telefone": "(62) 98492-8016",
      "status": "ativo",
      "dataRegistro": "2025-10-13",
      "escolas": {
        "-N1aB2cD3eF4gH5": {
          "role": "coordenadora",
          "ativo": true,
          "dataVinculo": "2025-10-13T20:00:00.000Z",
          "permissoes": ["*"]
        },
        "-N2bC3dE4fG5hI6": {
          "role": "professor",
          "ativo": true,
          "dataVinculo": "2025-10-13T21:00:00.000Z",
          "permissoes": ["*"]
        }
      }
    },
    "ASVPIWzIdKQvppIydvsewUPosdI3": {
      "email": "gustavo.braganca.prestador@prf.gov.br",
      "nome": "Gustavo",
      "telefone": "",
      "status": "ativo",
      "dataRegistro": "2025-01-01",
      "escolas": {}
    },
    "LcLXCrhTfIWTfbsRbOjeBA3QlCF3": {
      "email": "maritedesco.contato@gmail.com",
      "nome": "Mariana Tedesco",
      "telefone": "",
      "status": "ativo",
      "dataRegistro": "2025-01-01",
      "escolas": {}
    }
  }
}
```

## 🎯 Campos do Usuário

### Campos Básicos
| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `uid` | String | ID único do usuário (Firebase Auth) | ✅ Sim |
| `email` | String | Email do usuário | ✅ Sim |
| `nome` | String | Nome completo | ✅ Sim |
| `telefone` | String | Telefone de contato | ❌ Não |
| `status` | String | Status do usuário: `ativo`, `inativo`, `suspenso` | ✅ Sim |
| `dataRegistro` | String | Data de registro (YYYY-MM-DD) | ✅ Sim |

### Campo `escolas`
Objeto com vínculos do usuário às escolas:

```json
{
  "<escolaId>": {
    "role": "coordenadora",
    "ativo": true,
    "dataVinculo": "2025-10-13T20:00:00.000Z",
    "permissoes": ["*"]
  }
}
```

**Subcampos**:
- `role`: Função do usuário na escola
  - `coordenadora` - Acesso total
  - `secretaria` - Financeiro, alunos, secretaria
  - `professor` - Notas, frequência, sala de aula
  - `responsavel` - Consulta de informações dos filhos

- `ativo`: Booleano indicando se o vínculo está ativo
- `dataVinculo`: Data/hora do vínculo ISO 8601
- `permissoes`: Array de permissões (por enquanto sempre `["*"]`)

## 📊 Funcionalidades

### 1. Listagem de Usuários

#### Exibição
- Lista todos os usuários do banco de gerenciamento
- Mostra avatar com inicial do nome
- Exibe escolas vinculadas com roles
- Status com badge colorido
- Data de registro formatada

#### Filtros
- 🔍 **Busca**: Nome ou email
- 🎭 **Role**: Coordenadores, Secretárias, Professores, Responsáveis
- 🏫 **Escola**: Filtra por escola específica

#### Estatísticas
- Total de usuários
- Usuários ativos
- Coordenadores
- Professores

### 2. Edição de Usuário

#### Formulário
- **Informações Básicas**:
  - Nome completo *
  - Email * (não editável)
  - Telefone
  - Status (ativo/inativo/suspenso)

- **Vínculos com Escolas**:
  - Adicionar múltiplas escolas
  - Selecionar escola
  - Definir função (role)
  - Ativar/desativar vínculo
  - Remover vínculo

#### Validações
- ✅ Nome obrigatório
- ✅ Email obrigatório e formato válido
- ✅ Pelo menos uma escola vinculada
- ✅ Email não pode ser alterado
- ✅ Não permite duplicação de escola

### 3. Atualização no Banco

```javascript
// Atualizar usuário
const usuarioRef = ref(managementDB, `usuarios/${userData.uid}`);
await update(usuarioRef, {
  nome: userData.nome,
  email: userData.email,
  telefone: userData.telefone || '',
  escolas: userData.escolas || {},
  status: userData.status || 'ativo'
});
```

## 🔧 Componentes

### UserManagement.jsx
**Responsabilidades**:
- Carregar usuários e escolas do banco
- Gerenciar estado da lista
- Aplicar filtros e busca
- Abrir modal de edição
- Atualizar usuários no banco

**Funções principais**:
- `loadUsers()` - Busca usuários do banco
- `loadSchools()` - Busca escolas do banco
- `handleUpdateUser()` - Atualiza usuário no banco
- `handleEditUser()` - Abre modal de edição
- `handleToggleUserStatus()` - Ativa/desativa usuário

### UserForm.jsx
**Responsabilidades**:
- Formulário de edição de usuário
- Gerenciar vínculos com escolas
- Validação de dados
- Conversão de dados (array ↔ objeto)

**Funções principais**:
- `handleAddSchool()` - Adiciona nova escola
- `handleRemoveSchool()` - Remove escola
- `handleSchoolChange()` - Atualiza dados da escola
- `validateForm()` - Valida formulário
- `handleSubmit()` - Envia dados

## 🎨 UI/UX

### Cores de Status
| Status | Cor | Badge |
|--------|-----|-------|
| Ativo | Verde | `bg-green-100 text-green-800` |
| Inativo | Vermelho | `bg-red-100 text-red-800` |
| Suspenso | Amarelo | `bg-yellow-100 text-yellow-800` |

### Cores de Roles
| Role | Cor | Badge |
|------|-----|-------|
| Coordenador | Roxo | `bg-purple-100 text-purple-800` |
| Secretária | Azul | `bg-blue-100 text-blue-800` |
| Professor | Verde | `bg-green-100 text-green-800` |
| Responsável | Amarelo | `bg-yellow-100 text-yellow-800` |

### Feedback Visual
- ✅ **Modal de Sucesso**: Confirmação verde após salvar
- ❌ **Modal de Erro**: Alerta vermelho em caso de erro
- 🔄 **Loading**: Spinner durante operações assíncronas
- 📝 **Validação**: Bordas vermelhas e mensagens de erro

## 🚀 Fluxo de Uso

### 1. Acessar Painel de Usuários
```
SuperAdmin → Aba "Usuários"
```

### 2. Visualizar Lista
- Veja todos os usuários carregados do banco
- Use filtros para encontrar usuários específicos

### 3. Editar Usuário
1. Clique em **"Editar"** no usuário desejado
2. Modal abre com dados atuais
3. **Adicionar Escola**:
   - Clique em "Adicionar Escola"
   - Selecione a escola na lista
   - Escolha a função (role)
   - Marque como ativo/inativo
4. **Remover Escola**:
   - Clique no ícone de lixeira 🗑️
5. Clique em **"Atualizar Usuário"**

### 4. Confirmação
- Modal de sucesso aparece
- Lista é atualizada automaticamente
- Dados salvos no banco

## 🔐 Segurança

### Regras do Banco de Gerenciamento
```json
{
  "rules": {
    "usuarios": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

**⚠️ Importante**: Por enquanto, qualquer usuário autenticado pode ler/escrever. Em produção, deve-se restringir acesso apenas ao SuperAdmin.

### Regras Recomendadas (Produção)
```json
{
  "rules": {
    "usuarios": {
      ".read": "auth.uid === 'qD6UucWtcgPC9GHA41OB8rSaghZ2'",
      ".write": "auth.uid === 'qD6UucWtcgPC9GHA41OB8rSaghZ2'"
    }
  }
}
```

## 📝 Exemplo de Uso

### Vincular Usuário a Escola

**Antes**:
```json
{
  "usuarios": {
    "ASVPIWzIdKQvppIydvsewUPosdI3": {
      "email": "gustavo.braganca.prestador@prf.gov.br",
      "nome": "Gustavo",
      "escolas": {}
    }
  }
}
```

**Depois**:
```json
{
  "usuarios": {
    "ASVPIWzIdKQvppIydvsewUPosdI3": {
      "email": "gustavo.braganca.prestador@prf.gov.br",
      "nome": "Gustavo",
      "telefone": "(11) 99999-9999",
      "status": "ativo",
      "escolas": {
        "-N1aB2cD3eF4gH5": {
          "role": "professor",
          "ativo": true,
          "dataVinculo": "2025-10-13T20:30:00.000Z",
          "permissoes": ["*"]
        }
      }
    }
  }
}
```

## 🔄 Próximos Passos

### Funcionalidades Futuras
1. **Permissões Granulares**: Permitir seleção específica de permissões por role
2. **Histórico de Alterações**: Log de mudanças nos vínculos
3. **Convite de Usuários**: Sistema para enviar convites por email
4. **Gerenciamento em Massa**: Ações em múltiplos usuários
5. **Exportação**: Relatório de usuários e vínculos

### Melhorias Técnicas
1. **Paginação**: Para listas com muitos usuários
2. **Cache**: Otimizar carregamento com cache local
3. **Validação de Email**: Verificar se email existe no Firebase Auth
4. **Soft Delete**: Arquivar ao invés de deletar

## 🐛 Troubleshooting

### Usuários não aparecem
- ✅ Verificar se está autenticado
- ✅ Verificar regras do banco de gerenciamento
- ✅ Verificar console do navegador para erros
- ✅ Verificar se banco tem dados em `/usuarios`

### Erro ao salvar
- ✅ Verificar permissões de escrita no banco
- ✅ Verificar se todos os campos obrigatórios estão preenchidos
- ✅ Verificar se pelo menos uma escola está vinculada

### Escola não aparece na lista
- ✅ Verificar se escola está cadastrada em `/escolas`
- ✅ Verificar se função `loadSchools()` foi executada
- ✅ Ver console para erros de carregamento

## 📚 Referências

- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [React Hooks](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com/docs)
