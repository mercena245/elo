# 💾 Backups do Projeto ELO

## Estrutura de Diretórios

```
backups/
├── database/      Backups de estrutura e dados do banco
└── pages/         Backups de páginas antes de migrações
```

## 🗄️ Backups de Banco de Dados (database/)

### Arquivos
- `BKP BANCO.json` - Backup completo do banco de dados
- `estrutura-base-escola-vazia.json` - Estrutura vazia para novas escolas

### Como Usar
```bash
# Importar estrutura vazia no Firebase Console
# 1. Acesse Firebase Console → Realtime Database
# 2. Clique nos três pontos → Import JSON
# 3. Selecione estrutura-base-escola-vazia.json
```

## 📄 Backups de Páginas (pages/)

### Diretórios
- `backup-pages-migration/` - Backup antes da migração de páginas
- `backup-pre-migration/` - Backup antes da migração completa

### Conteúdo Preservado
- Versões antigas de componentes
- Código antes de refatorações importantes
- Referência para rollback se necessário

## ⚠️ Importante

### Boas Práticas
- ✅ Fazer backup antes de migrações grandes
- ✅ Manter estruturas vazias versionadas
- ✅ Documentar cada backup (data, motivo, conteúdo)
- ❌ **NÃO** versionar backups grandes no Git
- ❌ **NÃO** commitar dados sensíveis ou de produção

### Política de Retenção
- Backups de estrutura: Manter versionado
- Backups de dados: Local apenas (adicionar ao .gitignore)
- Backups de páginas: Manter por 30 dias após migração bem-sucedida

## 📚 Documentação Relacionada

- `docs/migration/GUIA-MIGRACAO-MULTI-TENANT.md`
- `docs/guides/COMO-IMPORTAR-ESTRUTURA-BASE.md`
