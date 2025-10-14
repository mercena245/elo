/**
 * Script de Rollback - Migração Multi-Tenant
 * 
 * Reverte as mudanças feitas pelo script de migração,
 * restaurando os arquivos do backup.
 * 
 * Uso: node rollback-migration.js
 */

const fs = require('fs');
const path = require('path');

// Configurações
const CONFIG = {
  srcDir: path.join(__dirname, 'src', 'app'),
  backupDir: path.join(__dirname, 'backup-pre-migration')
};

// Estatísticas
const stats = {
  filesRestored: 0,
  filesNotFound: 0,
  errors: []
};

/**
 * Restaura um arquivo do backup
 */
function restoreFile(backupPath, originalPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      console.log(`  ⚠️  Backup não encontrado: ${path.relative(CONFIG.backupDir, backupPath)}`);
      stats.filesNotFound++;
      return false;
    }
    
    // Copiar backup de volta
    fs.copyFileSync(backupPath, originalPath);
    console.log(`  ✅ Restaurado: ${path.relative(CONFIG.srcDir, originalPath)}`);
    stats.filesRestored++;
    return true;
  } catch (error) {
    console.error(`  ❌ Erro ao restaurar: ${error.message}`);
    stats.errors.push(path.relative(CONFIG.srcDir, originalPath));
    return false;
  }
}

/**
 * Processa todos os arquivos de backup
 */
function restoreAllBackups(backupDir, srcDir) {
  if (!fs.existsSync(backupDir)) {
    console.error('❌ Diretório de backup não encontrado!');
    console.error(`   Esperado em: ${backupDir}`);
    console.error('   Execute a migração primeiro para criar o backup.');
    return;
  }
  
  const entries = fs.readdirSync(backupDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const backupPath = path.join(backupDir, entry.name);
    const originalPath = path.join(srcDir, entry.name);
    
    if (entry.isDirectory()) {
      restoreAllBackups(backupPath, originalPath);
    } else if (entry.isFile()) {
      restoreFile(backupPath, originalPath);
    }
  }
}

/**
 * Confirma antes de prosseguir
 */
function confirm() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('Deseja continuar? (s/n): ', (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 's' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Main
 */
async function main() {
  console.log('🔄 ROLLBACK - Reverter Migração Multi-Tenant\n');
  console.log('⚠️  ATENÇÃO: Esta operação irá:');
  console.log('  1. Restaurar todos os arquivos do backup');
  console.log('  2. Perder todas as mudanças feitas pela migração');
  console.log('  3. Não pode ser desfeita\n');
  
  console.log(`📂 Restaurar de: ${CONFIG.backupDir}`);
  console.log(`📂 Restaurar em: ${CONFIG.srcDir}\n`);
  
  // Verificar se backup existe
  if (!fs.existsSync(CONFIG.backupDir)) {
    console.error('❌ Diretório de backup não encontrado!');
    console.error('   A migração ainda não foi executada ou o backup foi deletado.');
    process.exit(1);
  }
  
  // Confirmar
  const shouldContinue = await confirm();
  
  if (!shouldContinue) {
    console.log('\n❌ Rollback cancelado pelo usuário.');
    process.exit(0);
  }
  
  console.log('\n🔄 Restaurando arquivos...\n');
  
  // Restaurar backups
  restoreAllBackups(CONFIG.backupDir, CONFIG.srcDir);
  
  // Mostrar estatísticas
  console.log('\n' + '='.repeat(60));
  console.log('📊 ESTATÍSTICAS DO ROLLBACK');
  console.log('='.repeat(60));
  console.log(`✅ Arquivos restaurados: ${stats.filesRestored}`);
  console.log(`⚠️  Backups não encontrados: ${stats.filesNotFound}`);
  console.log(`❌ Erros: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ Arquivos com erro:');
    stats.errors.forEach(file => console.log(`  - ${file}`));
  }
  
  console.log('\n✅ Rollback concluído!');
  console.log('\n📝 Próximos passos:');
  console.log('  1. Verificar se os arquivos foram restaurados');
  console.log('  2. Testar a aplicação');
  console.log('  3. Corrigir problemas antes de tentar migrar novamente');
}

// Executar
main();
