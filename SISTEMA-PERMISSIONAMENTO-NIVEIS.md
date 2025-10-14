# 🔐 Sistema de Permissionamento em Níveis

## Como Funciona

### 📊 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. NOVO USUÁRIO FAZ CADASTRO/LOGIN                          │
│    - Cria conta no Firebase Auth                            │
│    - Ainda não tem registro no banco de gerenciamento       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SISTEMA VERIFICA ACESSO                                  │
│    - AccessControl component checa banco de gerenciamento   │
│    - Verifica se usuário tem campo "escolas"                │
│    - Se escolas = {} (vazio) → USUÁRIO PENDENTE             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. REDIRECIONA PARA /pending-approval                       │
│    - Tela de "Aguardando Aprovação"                         │
│    - Usuário vê mensagem explicativa                        │
│    - Pode verificar status ou fazer logout                  │
│    - Fica bloqueado até você aprovar                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. VOCÊ (SUPERADMIN) APROVA                                 │
│    - Acessa SuperAdmin → Aba Usuários                       │
│    - Vê destaque laranja com usuários pendentes             │
│    - Clica em "Aprovar e Vincular"                          │
│    - Adiciona escola(s) + define role (coordenadora, etc)   │
│    - Salva no banco de gerenciamento                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. USUÁRIO TEM ACESSO AUTOMATICAMENTE                       │
│    - Listener em tempo real detecta mudança no banco        │
│    - /pending-approval redireciona automaticamente para /   │
│    - Usuário agora vê seletor de escola                     │
│    - Acessa a escola vinculada como coordenadora            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. COORDENADOR GERENCIA OUTROS USUÁRIOS (FUTURO)            │
│    - Coordenador acessa "Configurações" da escola           │
│    - Vê lista de usuários pendentes da escola dele          │
│    - Aprova professores, pais, etc da ESCOLA DELE           │
│    - Não pode aprovar para outras escolas                   │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Componentes Criados

### 1. `/pending-approval/page.jsx`
**O que faz:**
- Tela de espera para usuários sem escola
- Listener em tempo real no banco
- Quando campo `escolas` é preenchido → redireciona automaticamente
- Botão "Verificar Status" para forçar reload
- Botão "Sair" para fazer logout

### 2. `AccessControl.jsx`
**O que faz:**
- HOC (Higher Order Component) que envolve toda a aplicação
- Verifica em cada mudança de rota se usuário tem acesso
- Lógica:
  ```javascript
  if (!user) → /login
  if (user.uid === SUPER_ADMIN) → libera tudo
  if (user.escolas === {}) → /pending-approval
  if (user.escolas tem dados) → libera app
  ```

### 3. `UserManagement.jsx` (Atualizado)
**Novidades:**
- **Card laranja no topo** com usuários pendentes
- **Badge "Aguardando aprovação"** na coluna de escolas
- **Filtro "Aguardando Aprovação"** no select de status
- **Estatística** de quantos usuários estão pendentes
- **Botão "Aprovar e Vincular"** abre modal direto

## 📝 Estrutura no Banco

### Usuário Novo (Pendente)
```json
{
  "usuarios": {
    "abc123xyz": {
      "email": "maria@email.com",
      "nome": "Maria Silva",
      "telefone": "",
      "status": "ativo",
      "dataRegistro": "2025-10-13",
      "escolas": {}  // ← VAZIO = PENDENTE
    }
  }
}
```

### Usuário Aprovado
```json
{
  "usuarios": {
    "abc123xyz": {
      "email": "maria@email.com",
      "nome": "Maria Silva",
      "telefone": "(11) 99999-9999",
      "status": "ativo",
      "dataRegistro": "2025-10-13",
      "escolas": {  // ← COM DADOS = APROVADO
        "-N1aB2cD3eF4gH5": {
          "role": "coordenadora",
          "ativo": true,
          "dataVinculo": "2025-10-13T20:00:00.000Z",
          "permissoes": ["*"]
        }
      }
    }
  }
}
```

## 🚀 Como Testar

### Teste 1: Novo Usuário
1. Crie uma conta nova com email diferente
2. Faça login
3. **Resultado esperado:** Vai para `/pending-approval` automaticamente
4. Vê tela "Aguardando Aprovação"

### Teste 2: Aprovar Usuário
1. Faça login como SuperAdmin
2. Vá em SuperAdmin → Usuários
3. Veja o card laranja com usuários pendentes
4. Clique em "Aprovar e Vincular"
5. Adicione uma escola e defina como coordenadora
6. Salve

### Teste 3: Usuário Aprovado
1. Volte para a conta do usuário novo
2. Clique em "Verificar Status" OU espere alguns segundos
3. **Resultado esperado:** Redireciona automaticamente para /
4. Vê seletor de escola
5. Acessa a escola normalmente

## 🔮 Próximo Passo: Coordenador Aprovar Outros

### Ainda não implementado, mas vai funcionar assim:

**Na tela de Configurações da escola:**
```jsx
// src/app/configuracoes/components/UserApprovalSection.jsx

- Lista usuários que pediram acesso À ESCOLA DELE
- Coordenador seleciona role: professor, secretaria, responsavel
- Salva no banco de gerenciamento
- Usuário recebe acesso apenas àquela escola
```

**Filtro de usuários pendentes por escola:**
```javascript
const pendingForMySchool = allPendingUsers.filter(user => {
  // Lógica para identificar que usuário pediu acesso a escola X
  // Pode ser por:
  // - Seleção manual do usuário
  // - Convite enviado pela escola
  // - Código de acesso da escola
});
```

## ⚙️ Configurações Necessárias

### 1. Atualizar layout.jsx (root)
Envolva o app com AccessControl:

```jsx
import AccessControl from '../components/AccessControl';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <AccessControl>
            {children}
          </AccessControl>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Regras do Banco (já devem estar configuradas)
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

## 🎨 Interface Visual

### Card de Usuários Pendentes
- Fundo laranja degradê
- Ícone de relógio
- Lista com até 3 usuários
- Botão "Aprovar e Vincular" laranja
- Link "Ver todos"

### Badge na Tabela
- Cor laranja: `bg-orange-100 text-orange-800`
- Emoji ⏳ para destaque visual
- Texto: "Aguardando aprovação"

### Tela /pending-approval
- Fundo gradient azul claro
- Card branco centralizado
- Ícone de relógio amarelo
- Mensagem explicativa
- Box azul com "O que acontece agora?"
- Botões: "Verificar Status" e "Sair"

## 🔐 Segurança

### Proteção de Rotas
- `AccessControl` roda em TODA navegação
- Verifica antes de renderizar qualquer página
- Usuário sem escola não consegue acessar nada

### SuperAdmin
- UID hardcoded: `qD6UucWtcgPC9GHA41OB8rSaghZ2`
- Sempre tem acesso total
- Não passa por verificação de escolas

### Tempo Real
- Usa `onValue` do Firebase
- Detecta mudanças instantaneamente
- Usuário aprovado vê mudança em < 1 segundo

## 📊 Estatísticas

### No SuperAdmin
- Total de usuários
- Usuários ativos
- **Usuários aguardando aprovação** (NOVO)
- Coordenadores

### Filtros
- Por nome/email
- Por role
- Por escola
- **Por status: "Aguardando Aprovação"** (NOVO)

## ✅ Resumo Final

### O que foi implementado:
✅ Tela de espera para usuários sem escola
✅ Verificação automática de acesso
✅ Redirecionamento inteligente
✅ Destaque visual para pendentes
✅ Aprovação pelo SuperAdmin
✅ Atualização em tempo real

### O que falta (futuro):
❌ Coordenador aprovar usuários da escola dele
❌ Sistema de convites por email
❌ Código de acesso por escola
❌ Notificações de novos pedidos
❌ Histórico de aprovações
