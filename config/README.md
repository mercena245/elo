# ⚙️ Configurações do Projeto ELO

## Estrutura de Diretórios

```
config/
├── firebase/      Credenciais e configurações Firebase
└── rules/         Regras de segurança (Database, Storage)
```

## 🔥 Configurações Firebase (firebase/)

### Arquivos
- `elo-school-firebase-adminsdk-*.json` - Service Account Keys
- `setAdminClaim.ts` - Script para definir claims de admin

### ⚠️ SEGURANÇA CRÍTICA

**NUNCA** commitar credenciais reais para o repositório!

```bash
# Adicione ao .gitignore:
config/firebase/*.json
!config/firebase/*.example.json
```

### Como Usar Credenciais

1. **Desenvolvimento Local:**
   ```bash
   # Copiar arquivo de exemplo
   cp config/firebase/firebase-admin.example.json config/firebase/firebase-admin.json
   
   # Preencher com suas credenciais do Firebase Console
   ```

2. **Produção:**
   - Use variáveis de ambiente
   - Configure secrets no GitHub Actions / Vercel / Heroku
   - NUNCA exponha chaves em código

### Obter Service Account Key
1. Firebase Console → Project Settings
2. Service Accounts
3. Generate New Private Key
4. Salvar em `config/firebase/` (não versionar!)

## 🛡️ Regras de Segurança (rules/)

### Arquivos
- `database.rules.json` - Regras atuais do Realtime Database
- `database.management.rules.json` - Regras do banco de gerenciamento
- `database.rules.SINGLE-PROJECT.json` - Regras para arquitetura single-project
- `storage.rules` - Regras do Firebase Storage

### Aplicar Regras

**Via Firebase Console:**
1. Realtime Database → Rules
2. Copiar conteúdo do arquivo desejado
3. Publicar

**Via Firebase CLI:**
```bash
# Deploy das regras
firebase deploy --only database

# Deploy do storage
firebase deploy --only storage
```

### Testar Regras Localmente
```bash
# Instalar emulators
firebase init emulators

# Executar
firebase emulators:start
```

## 📝 Arquivos de Exemplo

### firebase-admin.example.json
```json
{
  "type": "service_account",
  "project_id": "seu-projeto-id",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## 🔒 Checklist de Segurança

- [ ] Credenciais adicionadas ao .gitignore
- [ ] Service Account Keys não commitadas
- [ ] Variáveis de ambiente configuradas em produção
- [ ] Regras de segurança revisadas
- [ ] Acesso mínimo necessário (least privilege)
- [ ] Audit logs habilitados
- [ ] Backup das configurações (sem credenciais)

## 📚 Documentação Relacionada

- `docs/guides/CONFIGURAR-REGRAS-BANCO.md`
- `docs/systems/SISTEMA-PERMISSIONAMENTO-NIVEIS.md`
- Firebase Security Rules: https://firebase.google.com/docs/rules
