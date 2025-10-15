# 📁 Scripts do Projeto ELO

## Estrutura de Diretórios

```
scripts/
├── migration/      Scripts de migração de dados e estrutura
├── validation/     Scripts de validação e testes  
└── utils/          Utilitários gerais
```

## 🔄 Scripts de Migração (migration/)

### Scripts Disponíveis
- `migrate-to-multitenant.js` - Migração completa para multi-tenant
- `migrate-pages.js` - Migração de páginas
- `migrate-alunos-page.js` - Migração específica da página de alunos
- `rollback-migration.js` - Rollback de migrações
- `SCRIPT-MIGRACAO-SINGLE-PROJECT.js` - Migração para arquitetura single-project
- `update-services-imports.js` - Atualização de imports de serviços
- `convert-financeiro-service.js` - Conversão do serviço financeiro

### Como Usar
```bash
# Executar migração
node scripts/migration/migrate-to-multitenant.js

# Rollback se necessário
node scripts/migration/rollback-migration.js
```

## ✅ Scripts de Validação (validation/)

### Scripts Disponíveis
- `validate-all-imports.py` - Validação completa de imports
- `validate-imports.py` - Validação simples de useSchoolDatabase
- `test-migration.js` - Testes de migração
- `test-grade-horaria.js` - Testes de grade horária
- `debug-multi-tenant.js` - Debug de multi-tenant

### Como Usar
```bash
# Validar imports
python scripts/validation/validate-all-imports.py

# Testar migração
node scripts/validation/test-migration.js
```

## 🛠️ Utilitários (utils/)

Scripts auxiliares e ferramentas gerais.

## 📚 Documentação

Para mais detalhes, consulte:
- `docs/migration/` - Guias de migração
- `docs/guides/` - Guias de uso
