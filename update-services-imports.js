/**
 * Script para atualizar imports e uso dos services para versão multi-tenant
 * Substitui imports antigos por useSchoolServices hook
 */

const fs = require('fs');
const path = require('path');

// Arquivos a processar (excluindo temp_git)
const filesToProcess = [
  'src/app/alunos/page.jsx',
  'src/app/alunos/page_clean.jsx',
  'src/app/alunos/page_refatorada.jsx',
  'src/app/financeiro/page.jsx',
  'src/app/configuracoes/page.jsx',
  'src/app/secretaria-digital/page.jsx',
  'src/app/escola/page.jsx',
  'src/app/components/LogsViewer.jsx'
];

const stats = {
  processed: 0,
  updated: 0,
  skipped: 0,
  errors: []
};

function updateFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⏭️  ${filePath} - não encontrado`);
      stats.skipped++;
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Verificar se já usa useSchoolServices
    if (content.includes('useSchoolServices')) {
      console.log(`✅ ${filePath} - já atualizado`);
      stats.skipped++;
      return;
    }

    console.log(`\n📄 Processando: ${filePath}`);
    stats.processed++;

    // 1. Remover imports antigos de auditService
    const oldAuditImports = [
      /import\s*\{\s*auditService\s*,\s*LOG_ACTIONS\s*\}\s*from\s*['"]\.\.\/\.\.\/services\/auditService['"];?\n?/g,
      /import\s*\{\s*logAction\s*,\s*LOG_ACTIONS\s*\}\s*from\s*['"]\.\.\/\.\.\/services\/auditService['"];?\n?/g,
      /import\s*\{\s*auditService\s*\}\s*from\s*['"]\.\.\/\.\.\/services\/auditService['"];?\n?/g,
      /import\s*\{\s*logAction\s*\}\s*from\s*['"]\.\.\/\.\.\/services\/auditService['"];?\n?/g
    ];

    oldAuditImports.forEach(regex => {
      if (regex.test(content)) {
        content = content.replace(regex, '');
        modified = true;
      }
    });

    // 2. Remover imports antigos de financeiroService
    const oldFinanceiroImports = [
      /import\s*\{\s*financeiroService\s*\}\s*from\s*['"]\.\.\/\.\.\/services\/financeiroService['"];?\n?/g,
      /import\s*financeiroService\s*from\s*['"]\.\.\/\.\.\/services\/financeiroService['"];?\n?/g
    ];

    oldFinanceiroImports.forEach(regex => {
      if (regex.test(content)) {
        content = content.replace(regex, '');
        modified = true;
      }
    });

    // 3. Adicionar import do useSchoolServices
    if (!content.includes("useSchoolServices")) {
      // Encontrar última linha de import
      const lines = content.split('\n');
      let lastImportIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex !== -1) {
        lines.splice(lastImportIndex + 1, 0, "import { useSchoolServices } from '../../hooks/useSchoolServices';");
        content = lines.join('\n');
        modified = true;
      }
    }

    // 4. Adicionar hook no componente
    // Encontrar declaração do componente e adicionar hook
    const componentMatch = content.match(/(const\s+\w+\s*=\s*\(\)\s*=>\s*\{)/);
    if (componentMatch) {
      const hookDeclaration = `
  // Services multi-tenant
  const { auditService, financeiroService, LOG_ACTIONS, isReady: servicesReady } = useSchoolServices();
`;
      
      if (!content.includes('useSchoolServices()')) {
        content = content.replace(
          componentMatch[0],
          componentMatch[0] + hookDeclaration
        );
        modified = true;
      }
    }

    // 5. Substituir logAction por auditService.logAction
    if (content.includes('logAction(')) {
      content = content.replace(/\blogAction\(/g, 'auditService?.logAction(');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`  ✅ Atualizado com sucesso!`);
      stats.updated++;
    } else {
      console.log(`  ⏭️  Nenhuma alteração necessária`);
      stats.skipped++;
    }

  } catch (error) {
    console.error(`  ❌ Erro: ${error.message}`);
    stats.errors.push(filePath);
  }
}

// Main
console.log('🚀 Atualizando imports de services para multi-tenant\n');

filesToProcess.forEach(updateFile);

// Estatísticas
console.log('\n' + '='.repeat(60));
console.log('📊 ESTATÍSTICAS');
console.log('='.repeat(60));
console.log(`📄 Arquivos processados: ${stats.processed}`);
console.log(`✅ Arquivos atualizados: ${stats.updated}`);
console.log(`⏭️  Arquivos pulados: ${stats.skipped}`);
console.log(`❌ Erros: ${stats.errors.length}`);

if (stats.errors.length > 0) {
  console.log('\n❌ Arquivos com erro:');
  stats.errors.forEach(file => console.log(`  - ${file}`));
}

console.log('\n✅ Atualização concluída!');
console.log('\n📝 Próximos passos:');
console.log('  1. Revisar os arquivos alterados');
console.log('  2. Adicionar verificações de isReady onde necessário');
console.log('  3. Testar cada página atualizada');
console.log('  4. Fazer commit das alterações');
