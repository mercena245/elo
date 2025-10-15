/**
 * Script de Migração Multi-Tenant - Páginas Principais
 * 
 * Migra as páginas principais (page.jsx) que ainda não foram migradas
 * para usar o hook useSchoolDatabase ao invés de acessar Firebase diretamente.
 * 
 * Uso: node migrate-pages.js
 */

const fs = require('fs');
const path = require('path');

// Configurações
const CONFIG = {
  srcDir: path.join(__dirname, 'src', 'app'),
  backupDir: path.join(__dirname, 'backup-pages-migration'),
  dryRun: false, // true = apenas simula, false = aplica mudanças
  
  // Páginas a migrar (page.jsx)
  pagesToMigrate: [
    'agenda/page.jsx',
    'avisos/page.jsx',
    'colaboradores/page.jsx',
    'configuracoes/page.jsx',
    'escola/page.jsx',
    'financeiro/page.jsx',
    'galeriafotos/page.jsx',
    'grade-horaria/page.jsx',
    'impressoes/page.jsx',
    'loja/page.jsx',
    'notas-frequencia/page.jsx',
    'secretaria-digital/page.jsx',
    'turma-filho/page.jsx',
    'validacao/page.jsx'
  ]
};

// Estatísticas
const stats = {
  filesAnalyzed: 0,
  filesMigrated: 0,
  filesSkipped: 0,
  errors: []
};

/**
 * Verifica se o arquivo deve ser processado
 */
function shouldProcessFile(content, filePath) {
  // Pular se já usa useSchoolDatabase
  if (content.includes('useSchoolDatabase')) {
    console.log(`  ✅ Já migrado - pulando`);
    return false;
  }
  
  // Pular se não importa db do firebase
  if (!content.includes("from '../../firebase'") && 
      !content.includes('from "@/firebase"') &&
      !content.includes("from '../../firebase-storage'")) {
    console.log(`  ⏭️  Não usa Firebase direto - pulando`);
    return false;
  }
  
  return true;
}

/**
 * Cria backup do arquivo
 */
function createBackup(filePath) {
  const relativePath = path.relative(CONFIG.srcDir, filePath);
  const backupPath = path.join(CONFIG.backupDir, relativePath);
  const backupDir = path.dirname(backupPath);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  fs.copyFileSync(filePath, backupPath);
}

/**
 * Atualiza imports do Firebase
 */
function updateImports(content) {
  let newContent = content;
  
  // Remover imports de db, ref, get, set, push, remove, update
  newContent = newContent.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/\.\.\/firebase['"];?/g,
    (match, imports) => {
      const importList = imports.split(',').map(i => i.trim());
      const keepImports = importList.filter(imp => {
        const cleanImp = imp.split(' as ')[0].trim();
        return !['db', 'ref', 'get', 'set', 'push', 'remove', 'update', 'storage', 'storageRef', 'uploadBytes', 'getDownloadURL', 'deleteObject'].includes(cleanImp);
      });
      
      if (keepImports.length === 0) return '';
      return `import { ${keepImports.join(', ')} } from '../../firebase';`;
    }
  );
  
  // Remover import de @/firebase se existir
  newContent = newContent.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]@\/firebase['"];?/g,
    (match, imports) => {
      const importList = imports.split(',').map(i => i.trim());
      const keepImports = importList.filter(imp => {
        const cleanImp = imp.split(' as ')[0].trim();
        return !['db', 'ref', 'get', 'set', 'push', 'remove', 'update', 'storage', 'storageRef', 'uploadBytes', 'getDownloadURL', 'deleteObject'].includes(cleanImp);
      });
      
      if (keepImports.length === 0) return '';
      return `import { ${keepImports.join(', ')} } from '@/firebase';`;
    }
  );
  
  // Remover import de firebase-storage
  newContent = newContent.replace(
    /import\s*\{[^}]*\}\s*from\s*['"]\.\.\/\.\.\/firebase-storage['"];?\n?/g,
    ''
  );
  
  // Adicionar import do useSchoolDatabase se não existir
  if (!newContent.includes('useSchoolDatabase')) {
    // Procurar última linha de import
    const importLines = newContent.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].trim().startsWith('import ') || 
          (i > 0 && importLines[i-1].trim().startsWith('import ') && importLines[i].includes('}'))) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex !== -1) {
      importLines.splice(lastImportIndex + 1, 0, "import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';");
      newContent = importLines.join('\n');
    }
  }
  
  return newContent;
}

/**
 * Adiciona o hook ao componente
 */
function addHookToComponent(content) {
  // Procurar pela declaração do componente
  const componentMatch = content.match(/const\s+(\w+)\s*=\s*\(\)\s*=>\s*\{/);
  if (!componentMatch) {
    // Tentar com function
    const funcMatch = content.match(/function\s+(\w+)\s*\(\)\s*\{/);
    if (!funcMatch) return content;
  }
  
  // Adicionar hook logo após a abertura do componente
  const hookDeclaration = `
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();
`;

  // Encontrar a primeira linha após const Component = () => {
  const lines = content.split('\n');
  let insertIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/const\s+\w+\s*=\s*\(\)\s*=>\s*\{/) || 
        lines[i].match(/function\s+\w+\s*\(\)\s*\{/)) {
      insertIndex = i + 1;
      break;
    }
  }
  
  if (insertIndex !== -1 && !content.includes('useSchoolDatabase()')) {
    lines.splice(insertIndex, 0, hookDeclaration);
    return lines.join('\n');
  }
  
  return content;
}

/**
 * Substitui operações do Firebase
 */
function replaceFirebaseOperations(content) {
  let newContent = content;
  
  // get(ref(db, 'path')) -> getData('path')
  newContent = newContent.replace(
    /get\s*\(\s*ref\s*\(\s*db\s*,\s*['"`]([^'"`]+)['"`]\s*\)\s*\)/g,
    "getData('$1')"
  );
  
  // get(ref(db, `template`)) -> getData(`template`)
  newContent = newContent.replace(
    /get\s*\(\s*ref\s*\(\s*db\s*,\s*`([^`]+)`\s*\)\s*\)/g,
    'getData(`$1`)'
  );
  
  // set(ref(db, 'path'), data) -> setData('path', data)
  newContent = newContent.replace(
    /set\s*\(\s*ref\s*\(\s*db\s*,\s*['"`]([^'"`]+)['"`]\s*\)\s*,\s*([^)]+)\)/g,
    "setData('$1', $2)"
  );
  
  // set(ref(db, `template`), data) -> setData(`template`, data)
  newContent = newContent.replace(
    /set\s*\(\s*ref\s*\(\s*db\s*,\s*`([^`]+)`\s*\)\s*,\s*([^)]+)\)/g,
    'setData(`$1`, $2)'
  );
  
  // push(ref(db, 'path')) -> pushData('path')
  newContent = newContent.replace(
    /push\s*\(\s*ref\s*\(\s*db\s*,\s*['"`]([^'"`]+)['"`]\s*\)\s*\)/g,
    "pushData('$1')"
  );
  
  // push(ref(db, `template`)) -> pushData(`template`)
  newContent = newContent.replace(
    /push\s*\(\s*ref\s*\(\s*db\s*,\s*`([^`]+)`\s*\)\s*\)/g,
    'pushData(`$1`)'
  );
  
  // remove(ref(db, 'path')) -> removeData('path')
  newContent = newContent.replace(
    /remove\s*\(\s*ref\s*\(\s*db\s*,\s*['"`]([^'"`]+)['"`]\s*\)\s*\)/g,
    "removeData('$1')"
  );
  
  // remove(ref(db, `template`)) -> removeData(`template`)
  newContent = newContent.replace(
    /remove\s*\(\s*ref\s*\(\s*db\s*,\s*`([^`]+)`\s*\)\s*\)/g,
    'removeData(`$1`)'
  );
  
  // update(ref(db, 'path'), data) -> updateData('path', data)
  newContent = newContent.replace(
    /update\s*\(\s*ref\s*\(\s*db\s*,\s*['"`]([^'"`]+)['"`]\s*\)\s*,\s*([^)]+)\)/g,
    "updateData('$1', $2)"
  );
  
  // update(ref(db, `template`), data) -> updateData(`template`, data)
  newContent = newContent.replace(
    /update\s*\(\s*ref\s*\(\s*db\s*,\s*`([^`]+)`\s*\)\s*,\s*([^)]+)\)/g,
    'updateData(`$1`, $2)'
  );
  
  // Substituir storage por schoolStorage
  newContent = newContent.replace(/\bstorage\b(?!Storage)/g, 'schoolStorage');
  
  return newContent;
}

/**
 * Adiciona verificação de isReady no useEffect
 */
function addReadyCheck(content) {
  // Adicionar verificação no início dos useEffect que fazem chamadas ao Firebase
  return content.replace(
    /(useEffect\s*\(\s*\(\)\s*=>\s*\{)(\s*)((?:.*getData|.*setData|.*pushData|.*removeData|.*updateData))/s,
    '$1$2if (!isReady) return;$2$3'
  );
}

/**
 * Processa um arquivo
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!shouldProcessFile(content, filePath)) {
      stats.filesSkipped++;
      return;
    }
    
    console.log(`  🔄 Migrando...`);
    
    // Criar backup
    if (!CONFIG.dryRun) {
      createBackup(filePath);
    }
    
    // Aplicar transformações
    let newContent = content;
    newContent = updateImports(newContent);
    newContent = addHookToComponent(newContent);
    newContent = replaceFirebaseOperations(newContent);
    newContent = addReadyCheck(newContent);
    
    // Salvar arquivo
    if (!CONFIG.dryRun) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`  ✅ Migrado com sucesso!`);
    } else {
      console.log(`  ✅ Seria migrado (dry run)`);
    }
    
    stats.filesMigrated++;
    
  } catch (error) {
    console.error(`  ❌ Erro: ${error.message}`);
    stats.errors.push(path.relative(CONFIG.srcDir, filePath));
  }
}

/**
 * Main
 */
function main() {
  console.log('🚀 Iniciando Migração Multi-Tenant - Páginas Principais\n');
  console.log(`📂 Diretório: ${CONFIG.srcDir}`);
  console.log(`💾 Backup em: ${CONFIG.backupDir}`);
  console.log(`🧪 Modo: ${CONFIG.dryRun ? 'DRY RUN (simulação)' : 'APLICAR MUDANÇAS'}\n`);
  
  // Processar cada página
  for (const pagePath of CONFIG.pagesToMigrate) {
    const fullPath = path.join(CONFIG.srcDir, pagePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⏭️  ${pagePath} - arquivo não encontrado`);
      stats.filesSkipped++;
      continue;
    }
    
    console.log(`\n📄 Analisando: ${pagePath}`);
    stats.filesAnalyzed++;
    processFile(fullPath);
  }
  
  // Mostrar estatísticas
  console.log('\n' + '='.repeat(60));
  console.log('📊 ESTATÍSTICAS DA MIGRAÇÃO');
  console.log('='.repeat(60));
  console.log(`📄 Arquivos analisados: ${stats.filesAnalyzed}`);
  console.log(`✅ Arquivos migrados: ${stats.filesMigrated}`);
  console.log(`⏭️  Arquivos pulados: ${stats.filesSkipped}`);
  console.log(`❌ Erros: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ Arquivos com erro:');
    stats.errors.forEach(file => console.log(`  - ${file}`));
  }
  
  console.log('\n✅ Migração concluída!');
  
  if (!CONFIG.dryRun) {
    console.log(`\n💾 Backup dos arquivos originais em: ${CONFIG.backupDir}`);
    console.log('\n📝 Próximos passos:');
    console.log('  1. Revisar mudanças com git diff');
    console.log('  2. Testar a aplicação');
    console.log('  3. Fazer commit se tudo estiver ok');
  } else {
    console.log('\n⚠️  Execute novamente com dryRun: false para aplicar as mudanças');
  }
}

// Executar
main();
