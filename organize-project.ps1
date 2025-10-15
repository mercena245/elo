# Script de Organização do Projeto ELO
# Autor: GitHub Copilot
# Data: 15/10/2025

Write-Host "🚀 Iniciando organização do projeto..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. DOCUMENTAÇÃO - ARQUITETURA
# ============================================
Write-Host "📐 Movendo documentos de arquitetura..." -ForegroundColor Yellow

Move-Item -Path "ABORDAGEM-SIMPLIFICADA-MULTI-TENANT.md" -Destination "docs\architecture\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "ARQUITETURA-MULTI-TENANT.md" -Destination "docs\architecture\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "NOVO-FLUXO-AUTENTICACAO.md" -Destination "docs\architecture\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "ESTRUTURA-DADOS-GRADE.md" -Destination "docs\architecture\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "EXEMPLO-GRADE-HORARIOS.md" -Destination "docs\architecture\" -Force -ErrorAction SilentlyContinue

# ============================================
# 2. DOCUMENTAÇÃO - MIGRAÇÃO
# ============================================
Write-Host "🔄 Movendo documentos de migração..." -ForegroundColor Yellow

Move-Item -Path "ANALISE-COMPLETA-MIGRACAO-MULTI-TENANT.md" -Destination "docs\migration\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "GUIA-MIGRACAO-MULTI-TENANT.md" -Destination "docs\migration\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "MIGRACAO-MULTI-TENANT-100-COMPLETA.md" -Destination "docs\migration\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "MIGRACAO-ALUNOS-COMPLETA.md" -Destination "docs\migration\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "MIGRACAO-GALERIAFOTOS-COMPLETA.md" -Destination "docs\migration\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "RESUMO-MIGRACAO-COMPLETA.md" -Destination "docs\migration\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "COMO-USAR-SCRIPTS-MIGRACAO.md" -Destination "docs\migration\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "MUDANCA-INSERCAO-DIRETA.md" -Destination "docs\migration\" -Force -ErrorAction SilentlyContinue

# ============================================
# 3. DOCUMENTAÇÃO - GUIAS
# ============================================
Write-Host "📚 Movendo guias de uso..." -ForegroundColor Yellow

Move-Item -Path "GUIA-TESTES-MULTI-TENANT.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "GUIA-USO-SERVICES-MULTITENANT.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "GUIA-PREVENCAO-ERROS-IMPORTS.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "COMO-IMPORTAR-ESTRUTURA-BASE.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "CONFIGURAR-REGRAS-BANCO.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "MAPEAMENTO-CAMINHOS-CORRETOS.md" -Destination "docs\guides\" -Force -ErrorAction SilentlyContinue

# ============================================
# 4. DOCUMENTAÇÃO - RELATÓRIOS
# ============================================
Write-Host "📊 Movendo relatórios..." -ForegroundColor Yellow

Move-Item -Path "RELATORIO-*.md" -Destination "docs\reports\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "RESUMO-EXECUTIVO-MULTI-TENANT.md" -Destination "docs\reports\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "RESUMO-IMPLEMENTACAO-MULTI-TENANT.md" -Destination "docs\reports\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "CORRECAO-*.md" -Destination "docs\reports\" -Force -ErrorAction SilentlyContinue

# ============================================
# 5. DOCUMENTAÇÃO - DEBUG
# ============================================
Write-Host "🐛 Movendo documentos de debug..." -ForegroundColor Yellow

Move-Item -Path "DEBUG-*.md" -Destination "docs\debug\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "ANALISE-COMPLETA-PROBLEMAS.md" -Destination "docs\debug\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "SOLUCAO-*.md" -Destination "docs\debug\" -Force -ErrorAction SilentlyContinue

# ============================================
# 6. DOCUMENTAÇÃO - SISTEMAS
# ============================================
Write-Host "⚙️ Movendo documentação de sistemas..." -ForegroundColor Yellow

Move-Item -Path "SISTEMA-*.md" -Destination "docs\systems\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "GERENCIAMENTO-USUARIOS-SUPERADMIN.md" -Destination "docs\systems\" -Force -ErrorAction SilentlyContinue

# ============================================
# 7. DOCUMENTAÇÃO - PRF
# ============================================
Write-Host "📋 Movendo PRFs..." -ForegroundColor Yellow

Move-Item -Path "PRF-*.md" -Destination "docs\prf\" -Force -ErrorAction SilentlyContinue

# ============================================
# 8. SCRIPTS - MIGRAÇÃO
# ============================================
Write-Host "🔧 Movendo scripts de migração..." -ForegroundColor Yellow

Move-Item -Path "migrate-*.js" -Destination "scripts\migration\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "rollback-migration.js" -Destination "scripts\migration\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "SCRIPT-MIGRACAO-SINGLE-PROJECT.js" -Destination "scripts\migration\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "update-services-imports.js" -Destination "scripts\migration\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "convert-financeiro-service.js" -Destination "scripts\migration\" -Force -ErrorAction SilentlyContinue

# ============================================
# 9. SCRIPTS - VALIDAÇÃO
# ============================================
Write-Host "✅ Movendo scripts de validação..." -ForegroundColor Yellow

Move-Item -Path "validate-*.py" -Destination "scripts\validation\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "test-*.js" -Destination "scripts\validation\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "debug-multi-tenant.js" -Destination "scripts\validation\" -Force -ErrorAction SilentlyContinue

# ============================================
# 10. BACKUPS - BANCO DE DADOS
# ============================================
Write-Host "💾 Movendo backups de banco..." -ForegroundColor Yellow

Move-Item -Path "BKP BANCO.json" -Destination "backups\database\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "estrutura-base-escola-vazia.json" -Destination "backups\database\" -Force -ErrorAction SilentlyContinue

# ============================================
# 11. BACKUPS - PÁGINAS
# ============================================
Write-Host "📄 Movendo backups de páginas..." -ForegroundColor Yellow

Move-Item -Path "backup-pages-migration" -Destination "backups\pages\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "backup-pre-migration" -Destination "backups\pages\" -Force -ErrorAction SilentlyContinue

# ============================================
# 12. CONFIGURAÇÕES - FIREBASE
# ============================================
Write-Host "🔥 Movendo configurações Firebase..." -ForegroundColor Yellow

Move-Item -Path "elo-school-firebase-adminsdk-*.json" -Destination "config\firebase\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "setAdminClaim.ts" -Destination "config\firebase\" -Force -ErrorAction SilentlyContinue

# ============================================
# 13. CONFIGURAÇÕES - REGRAS
# ============================================
Write-Host "🛡️ Movendo regras de banco..." -ForegroundColor Yellow

Move-Item -Path "database.*.json" -Destination "config\rules\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "storage.rules" -Destination "config\rules\" -Force -ErrorAction SilentlyContinue

# ============================================
# 14. LIMPEZA - ARQUIVOS TEMPORÁRIOS
# ============================================
Write-Host "🧹 Removendo arquivos temporários..." -ForegroundColor Yellow

Remove-Item -Path "temp_*.txt" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "relatorio" -Force -ErrorAction SilentlyContinue

# ============================================
# 15. CRIAR README NA RAIZ DAS PASTAS
# ============================================
Write-Host "📝 Criando arquivos README..." -ForegroundColor Yellow

# README para scripts
@"
# Scripts do Projeto ELO

## 📁 Estrutura

- **migration/**: Scripts de migração de dados e estrutura
- **validation/**: Scripts de validação e testes
- **utils/**: Utilitários gerais

## 🚀 Como Usar

Consulte a documentação em `docs/guides/` para instruções detalhadas.
"@ | Out-File -FilePath "scripts\README.md" -Encoding UTF8

# README para backups
@"
# Backups do Projeto ELO

## 📁 Estrutura

- **database/**: Backups de estrutura e dados do banco
- **pages/**: Backups de páginas antes de migrações

## ⚠️ Importante

Não versionar arquivos grandes de backup no Git.
Mantenha apenas estruturas vazias e exemplos.
"@ | Out-File -FilePath "backups\README.md" -Encoding UTF8

# README para config
@"
# Configurações do Projeto ELO

## 📁 Estrutura

- **firebase/**: Credenciais e configurações Firebase
- **rules/**: Regras de segurança (Database, Storage)

## 🔒 Segurança

**NUNCA** commitar credenciais reais!
Use apenas arquivos de exemplo (.example).
"@ | Out-File -FilePath "config\README.md" -Encoding UTF8

# ============================================
# FINALIZAÇÃO
# ============================================
Write-Host ""
Write-Host "✅ Organização concluída com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Estrutura final:" -ForegroundColor Cyan
Write-Host "  📁 docs/" -ForegroundColor White
Write-Host "    ├── architecture/    (Documentos de arquitetura)" -ForegroundColor Gray
Write-Host "    ├── migration/       (Guias de migração)" -ForegroundColor Gray
Write-Host "    ├── guides/          (Guias de uso)" -ForegroundColor Gray
Write-Host "    ├── reports/         (Relatórios)" -ForegroundColor Gray
Write-Host "    ├── debug/           (Documentos de debug)" -ForegroundColor Gray
Write-Host "    ├── systems/         (Documentação de sistemas)" -ForegroundColor Gray
Write-Host "    └── prf/             (PRFs)" -ForegroundColor Gray
Write-Host ""
Write-Host "  📁 scripts/" -ForegroundColor White
Write-Host "    ├── migration/       (Scripts de migração)" -ForegroundColor Gray
Write-Host "    ├── validation/      (Scripts de validação)" -ForegroundColor Gray
Write-Host "    └── utils/           (Utilitários)" -ForegroundColor Gray
Write-Host ""
Write-Host "  📁 backups/" -ForegroundColor White
Write-Host "    ├── database/        (Backups de banco)" -ForegroundColor Gray
Write-Host "    └── pages/           (Backups de páginas)" -ForegroundColor Gray
Write-Host ""
Write-Host "  📁 config/" -ForegroundColor White
Write-Host "    ├── firebase/        (Configurações Firebase)" -ForegroundColor Gray
Write-Host "    └── rules/           (Regras de segurança)" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Projeto organizado e pronto para uso!" -ForegroundColor Green
