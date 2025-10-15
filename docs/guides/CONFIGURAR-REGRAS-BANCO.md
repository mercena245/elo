# Instruções para Configurar Regras do Banco de Gerenciamento

## Opção 1: Via Firebase Console (Recomendado)

1. Acesse o Firebase Console: https://console.firebase.google.com/project/elo-school
2. No menu lateral, vá em **Realtime Database**
3. Se você tiver múltiplos bancos, selecione: **gerenciamento-elo-school**
4. Clique na aba **Regras** (Rules)
5. Cole as seguintes regras:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "escolas": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$escolaId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "usuarios": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "configuracoes": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

6. Clique em **Publicar** (Publish)

## Opção 2: Verificar se o Banco Existe

Se o banco `gerenciamento-elo-school` não existir ainda:

1. No Firebase Console, vá em **Realtime Database**
2. Clique em **Criar banco de dados** (Create Database)
3. Escolha o local: `us-central1` (ou o mesmo da sua aplicação principal)
4. Modo inicial: **Modo bloqueado** (locked mode)
5. Após criar, configure as regras conforme a Opção 1

## Verificar Autenticação

Certifique-se de que:
- O usuário está autenticado (logado) antes de acessar o painel SuperAdmin
- O token de autenticação está válido
- As regras do banco permitem acesso com `auth != null`

## Testar

Após configurar, teste:
1. Faça login na aplicação
2. Acesse o painel SuperAdmin
3. Tente carregar a lista de escolas
4. Se ainda houver erro, verifique o console do navegador para mais detalhes
