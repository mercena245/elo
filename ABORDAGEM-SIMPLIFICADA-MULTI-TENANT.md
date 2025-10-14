# Abordagem Simplificada - Gerenciamento Multi-Tenant

## 📋 Visão Geral

A partir de agora, o sistema adota uma abordagem **manual e controlada** para o onboarding de novas escolas no ambiente multi-tenant.

## 🔄 Mudanças Implementadas

### 1. **Cloud Function `provisionNewSchool`**
- ✅ Salva apenas dados de negócio no banco de gerenciamento
- ✅ Campos técnicos (projectId, databaseURL, storageBucket) são deixados vazios
- ✅ Status inicial da escola: `pendente` (até configuração manual)
- ❌ NÃO gera automaticamente recursos do Firebase

### 2. **Formulário de Cadastro (SchoolForm)**
- ✅ Simplificado para apenas **3 steps**:
  - **Step 1**: Informações Básicas (nome, CNPJ, responsável, email, telefone)
  - **Step 2**: Endereço (rua, cidade, CEP, estado)
  - **Step 3**: Plano e Configurações (plano, mensalidade, módulos)
- ❌ Removido Step 4 (Configurações Firebase)

### 3. **Estrutura de Dados no Banco**

#### Banco de Gerenciamento
**URL**: `https://gerenciamento-elo-school.firebaseio.com/`

**Estrutura**:
```json
{
  "escolas": {
    "<escolaId>": {
      "nome": "Escola ABC",
      "cnpj": "12.345.678/0001-90",
      "responsavel": "Maria Silva",
      "email": "contato@escolaabc.com",
      "telefone": "(11) 99999-9999",
      "endereco": {
        "rua": "Rua das Flores, 123",
        "cidade": "São Paulo",
        "cep": "01234-567",
        "estado": "SP"
      },
      "plano": "premium",
      "mensalidade": 2500,
      "dataVencimento": 15,
      "status": "pendente",
      "dataContrato": "2024-01-15",
      "criadoEm": "2024-01-15T10:30:00.000Z",
      
      // Campos técnicos - PREENCHER MANUALMENTE
      "projectId": "",
      "databaseURL": "",
      "storageBucket": "",
      
      "configuracoes": {
        "modulosAtivos": ["financeiro", "notas", "alunos"],
        "limiteAlunos": 200,
        "limiteProfessores": 15
      },
      "usuarios": {
        "<userUid>": {
          "email": "responsavel@escola.com",
          "role": "coordenadora",
          "ativo": true,
          "criadoEm": "2024-01-15T10:30:00.000Z"
        }
      }
    }
  }
}
```

#### Banco de Teste
**URL**: `https://elo-school-default-rtdb.firebaseio.com/`
- ✅ Usado para desenvolvimento e testes
- ✅ Base de referência para estrutura de dados

## 🔧 Processo Manual de Configuração

### Passo a Passo para Configurar uma Nova Escola

#### 1. **Criar Escola no Painel SuperAdmin**
   - Acesse o painel SuperAdmin
   - Clique em "Nova Escola"
   - Preencha os 3 steps do formulário
   - A escola será salva com status `pendente`

#### 2. **Criar Projeto Firebase Manualmente**
   - Acesse: https://console.firebase.google.com/
   - Clique em "Add project"
   - Nome do projeto: `elo-<nome-escola>` (ex: `elo-escola-abc`)
   - Ative Google Analytics (opcional)

#### 3. **Configurar Realtime Database**
   - No projeto criado, vá em **Realtime Database**
   - Clique em **Create Database**
   - Escolha localização: `us-central1` (ou mesma do projeto principal)
   - Modo inicial: **Locked mode**
   - Copie a URL do banco: `https://elo-escola-abc-default-rtdb.firebaseio.com/`

#### 4. **Configurar Firebase Storage**
   - Vá em **Storage**
   - Clique em **Get started**
   - Aceite as regras padrão
   - Copie o bucket: `elo-escola-abc.appspot.com`

#### 5. **Configurar Regras de Segurança**
   
   **Database Rules:**
   ```json
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null"
     }
   }
   ```
   
   **Storage Rules:**
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

#### 6. **Atualizar Dados no Banco de Gerenciamento**
   - Acesse: https://console.firebase.google.com/project/elo-school/database/gerenciamento-elo-school
   - Navegue até: `escolas/<escolaId>`
   - Edite os campos técnicos:
     ```json
     {
       "projectId": "elo-escola-abc",
       "databaseURL": "https://elo-escola-abc-default-rtdb.firebaseio.com/",
       "storageBucket": "elo-escola-abc.appspot.com",
       "status": "ativa"
     }
     ```

#### 7. **Criar Estrutura Inicial de Dados**
   - No banco da escola (`elo-escola-abc`), crie a estrutura básica:
   ```json
   {
     "configuracoes": {
       "nomeEscola": "Escola ABC",
       "anoLetivo": "2024"
     },
     "usuarios": {},
     "alunos": {},
     "turmas": {},
     "colaboradores": {}
   }
   ```

## 📊 Status das Escolas

| Status | Descrição |
|--------|-----------|
| `pendente` | Escola criada no painel, aguardando configuração manual |
| `configurando` | Em processo de configuração técnica |
| `ativa` | Totalmente configurada e operacional |
| `suspensa` | Temporariamente desativada |
| `inativa` | Desativada permanentemente |

## 🎯 Próximos Passos (Futuro)

1. **Automatização Parcial**: Script para criar projeto e configurações básicas via Firebase Admin SDK
2. **Template de Dados**: Estrutura inicial de dados copiada automaticamente
3. **Migração de Dados**: Ferramenta para migrar dados de escola para escola
4. **Monitoramento**: Dashboard de status de configuração das escolas

## ⚠️ Importante

- ✅ Sempre teste em `https://elo-school-default-rtdb.firebaseio.com/` primeiro
- ✅ Documente as credenciais de cada escola em local seguro
- ✅ Mantenha backup das regras de segurança
- ❌ Nunca exponha credenciais Firebase em repositórios públicos
- ❌ Não delete escolas sem backup completo dos dados
