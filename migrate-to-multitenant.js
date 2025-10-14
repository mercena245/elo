/**
 * Script de Migração Automática para Multi-Tenant
 * 
 * Este script migra automaticamente os arquivos do projeto para usar
 * o hook useSchoolDatabase ao invés do banco Firebase direto.
 * 
 * Uso: node migrate-to-multitenant.js
 */

const fs = require('fs');
const path = require('path');

// Configurações
const CONFIG = {
  srcDir: path.join(__dirname, 'src', 'app'),
  componentsDir: path.join(__dirname, 'src', 'app', 'components'),
  backupDir: path.join(__dirname, 'backup-pre-migration'),
  dryRun: false, // true = apenas simula, false = aplica mudanças
  verbose: true
};

// Arquivos a ignorar
const IGNORE_FILES = [
  'layout.jsx',
  'page.jsx', // página raiz
  'dashboard/page.jsx', // já migrado
  'super-admin',
  'pending-approval'
];

// Estatísticas
const stats = {
  filesAnalyzed: 0,
  filesModified: 0,
  filesSkipped: 0,
  errors: []
};

/**
 * Verifica se o arquivo deve ser processado
 */
function shouldProcessFile(filePath) {
  const relativePath = path.relative(CONFIG.srcDir, filePath);
  
  // Ignorar arquivos específicos
  if (IGNORE_FILES.some(ignore => relativePath.includes(ignore))) {
    return false;
  }
  
  // Processar apenas .js e .jsx
  if (!['.js', '.jsx'].includes(path.extname(filePath))) {
    return false;
  }
  
  return true;
}

/**
 * Lê o conteúdo do arquivo
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ Erro ao ler ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Escreve conteúdo no arquivo
 */
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Erro ao escrever ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Cria backup do arquivo
 */
function backupFile(filePath) {
  const relativePath = path.relative(CONFIG.srcDir, filePath);
  const backupPath = path.join(CONFIG.backupDir, relativePath);
  const backupDir = path.dirname(backupPath);
  
  // Criar diretório de backup
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Copiar arquivo
  fs.copyFileSync(filePath, backupPath);
}

/**
 * Verifica se o arquivo já usa useSchoolDatabase
 */
function isAlreadyMigrated(content) {
  return content.includes('useSchoolDatabase') || 
         content.includes('from \'../../hooks/useSchoolDatabase\'');
}

/**
 * Verifica se o arquivo usa Firebase direto
 */
function usesDirectFirebase(content) {
  const patterns = [
    /from\s+['"].*firebase['"]/,
    /import\s+{[^}]*db[^}]*}\s+from/,
    /ref\(db,/,
    /get\(ref\(db/,
    /set\(ref\(db/
  ];
  
  return patterns.some(pattern => pattern.test(content));
}

/**
 * Atualiza imports do arquivo
 */
function updateImports(content) {
  let modified = content;
  
  // Remover db dos imports do firebase
  modified = modified.replace(
    /import\s+{([^}]*?)\bdb\b([^}]*?)}\s+from\s+['"](.+?firebase)['"]/g,
    (match, before, after, path) => {
      // Remove db e vírgulas extras
      let imports = (before + after)
        .split(',')
        .map(i => i.trim())
        .filter(i => i && i !== 'db' && i !== 'ref' && i !== 'get' && i !== 'set' && i !== 'push' && i !== 'remove' && i !== 'update')
        .join(', ');
      
      // Se sobrou algo, manter o import
      if (imports) {
        return `import { ${imports} } from '${path}'`;
      }
      // Se não sobrou nada, remover linha
      return '';
    }
  );
  
  // Remover storage dos imports
  modified = modified.replace(
    /import\s+{([^}]*?)\bstorage\b([^}]*?)}\s+from\s+['"](.+?firebase)['"]/g,
    (match, before, after, path) => {
      let imports = (before + after)
        .split(',')
        .map(i => i.trim())
        .filter(i => i && i !== 'storage')
        .join(', ');
      
      if (imports) {
        return `import { ${imports} } from '${path}'`;
      }
      return '';
    }
  );
  
  // Remover linhas vazias extras
  modified = modified.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Adicionar import do useSchoolDatabase se não existir
  if (!modified.includes('useSchoolDatabase')) {
    // Encontrar a última linha de import
    const importLines = modified.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex !== -1) {
      importLines.splice(
        lastImportIndex + 1,
        0,
        "import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';"
      );
      modified = importLines.join('\n');
    }
  }
  
  return modified;
}

/**
 * Adiciona hook no componente
 */
function addHookToComponent(content) {
  let modified = content;
  
  // Padrões de início de componente
  const patterns = [
    /const\s+\w+\s*=\s*\(\)\s*=>\s*{/,
    /function\s+\w+\s*\(\)\s*{/,
    /export\s+default\s+function\s+\w+\s*\(\)\s*{/
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const hookCode = `\n  // Hook para acessar banco da escola\n  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();\n`;
      
      // Inserir após a abertura do componente
      const insertPosition = match.index + match[0].length;
      modified = 
        content.slice(0, insertPosition) +
        hookCode +
        content.slice(insertPosition);
      
      break;
    }
  }
  
  return modified;
}

/**
 * Substitui operações Firebase
 */
function replaceFirebaseOperations(content) {
  let modified = content;
  
  // get(ref(db, 'path')) -> getData('path')
  modified = modified.replace(
    /await\s+get\(ref\(db,\s*['"]([^'"]+)['"]\)\)/g,
    "await getData('$1')"
  );
  
  modified = modified.replace(
    /get\(ref\(db,\s*['"]([^'"]+)['"]\)\)/g,
    "getData('$1')"
  );
  
  // set(ref(db, 'path'), data) -> setData('path', data)
  modified = modified.replace(
    /await\s+set\(ref\(db,\s*['"`]([^'"`]+)['"`]\),\s*([^)]+)\)/g,
    "await setData('$1', $2)"
  );
  
  modified = modified.replace(
    /set\(ref\(db,\s*['"`]([^'"`]+)['"`]\),\s*([^)]+)\)/g,
    "setData('$1', $2)"
  );
  
  // push(ref(db, 'path'), data) -> pushData('path', data)
  modified = modified.replace(
    /await\s+push\(ref\(db,\s*['"`]([^'"`]+)['"`]\),\s*([^)]+)\)/g,
    "await pushData('$1', $2)"
  );
  
  modified = modified.replace(
    /push\(ref\(db,\s*['"`]([^'"`]+)['"`]\),\s*([^)]+)\)/g,
    "pushData('$1', $2)"
  );
  
  // remove(ref(db, 'path')) -> removeData('path')
  modified = modified.replace(
    /await\s+remove\(ref\(db,\s*['"`]([^'"`]+)['"`]\)\)/g,
    "await removeData('$1')"
  );
  
  modified = modified.replace(
    /remove\(ref\(db,\s*['"`]([^'"`]+)['"`]\)\)/g,
    "removeData('$1')"
  );
  
  // update(ref(db, 'path'), data) -> updateData('path', data)
  modified = modified.replace(
    /await\s+update\(ref\(db,\s*['"`]([^'"`]+)['"`]\),\s*([^)]+)\)/g,
    "await updateData('$1', $2)"
  );
  
  modified = modified.replace(
    /update\(ref\(db,\s*['"`]([^'"`]+)['"`]\),\s*([^)]+)\)/g,
    "updateData('$1', $2)"
  );
  
  // Substituir referências a storage
  modified = modified.replace(
    /\bstorage\b(?!\s*[=:])/g,
    'schoolStorage'
  );
  
  return modified;
}

/**
 * Adiciona verificação de isReady em useEffect
 */
function addReadyCheck(content) {
  let modified = content;
  
  // Adicionar verificação no início de useEffect que busca dados
  const useEffectPattern = /useEffect\(\(\)\s*=>\s*{\s*(?:const\s+)?(\w+)\s*=\s*async\s*\(\)/g;
  
  modified = modified.replace(
    useEffectPattern,
    `useEffect(() => {\n    if (!isReady) return;\n    \n    const $1 = async ()`
  );
  
  // Adicionar isReady nas dependências
  modified = modified.replace(
    /}\s*,\s*\[\s*\]\s*\)/g,
    '}, [isReady])'
  );
  
  return modified;
}

/**
 * Processa um arquivo
 */
function processFile(filePath) {
  stats.filesAnalyzed++;
  
  const relativePath = path.relative(CONFIG.srcDir, filePath);
  
  if (CONFIG.verbose) {
    console.log(`\n📄 Analisando: ${relativePath}`);
  }
  
  // Ler conteúdo
  const content = readFile(filePath);
  if (!content) {
    stats.filesSkipped++;
    return;
  }
  
  // Verificar se já migrado
  if (isAlreadyMigrated(content)) {
    if (CONFIG.verbose) {
      console.log('  ✅ Já migrado - pulando');
    }
    stats.filesSkipped++;
    return;
  }
  
  // Verificar se usa Firebase
  if (!usesDirectFirebase(content)) {
    if (CONFIG.verbose) {
      console.log('  ⏭️  Não usa Firebase direto - pulando');
    }
    stats.filesSkipped++;
    return;
  }
  
  console.log('  🔄 Migrando...');
  
  // Fazer backup
  if (!CONFIG.dryRun) {
    backupFile(filePath);
  }
  
  // Aplicar transformações
  let modified = content;
  
  try {
    modified = updateImports(modified);
    modified = addHookToComponent(modified);
    modified = replaceFirebaseOperations(modified);
    modified = addReadyCheck(modified);
    
    // Escrever arquivo modificado
    if (!CONFIG.dryRun) {
      if (writeFile(filePath, modified)) {
        console.log('  ✅ Migrado com sucesso!');
        stats.filesModified++;
      } else {
        console.log('  ❌ Erro ao escrever arquivo');
        stats.errors.push(relativePath);
      }
    } else {
      console.log('  ✅ Seria migrado (dry run)');
      stats.filesModified++;
    }
  } catch (error) {
    console.error(`  ❌ Erro ao processar: ${error.message}`);
    stats.errors.push(relativePath);
  }
}

/**
 * Processa todos os arquivos em um diretório
 */
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Ignorar node_modules e outras pastas
      if (!['node_modules', '.next', '.git', 'backup-pre-migration'].includes(entry.name)) {
        processDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      if (shouldProcessFile(fullPath)) {
        processFile(fullPath);
      }
    }
  }
}

/**
 * Main
 */
function main() {
  console.log('🚀 Iniciando Migração Multi-Tenant\n');
  console.log(`📂 Diretório: ${CONFIG.srcDir}`);
  console.log(`💾 Backup em: ${CONFIG.backupDir}`);
  console.log(`🧪 Modo: ${CONFIG.dryRun ? 'DRY RUN (simulação)' : 'APLICAR MUDANÇAS'}\n`);
  
  // Criar diretório de backup
  if (!CONFIG.dryRun && !fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
  
  // Processar arquivos
  processDirectory(CONFIG.srcDir);
  
  // Mostrar estatísticas
  console.log('\n' + '='.repeat(60));
  console.log('📊 ESTATÍSTICAS DA MIGRAÇÃO');
  console.log('='.repeat(60));
  console.log(`📄 Arquivos analisados: ${stats.filesAnalyzed}`);
  console.log(`✅ Arquivos migrados: ${stats.filesModified}`);
  console.log(`⏭️  Arquivos pulados: ${stats.filesSkipped}`);
  console.log(`❌ Erros: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ Arquivos com erro:');
    stats.errors.forEach(file => console.log(`  - ${file}`));
  }
  
  console.log('\n✅ Migração concluída!');
  
  if (CONFIG.dryRun) {
    console.log('\n⚠️  Execute novamente com dryRun: false para aplicar as mudanças');
  } else {
    console.log('\n💾 Backup dos arquivos originais em:', CONFIG.backupDir);
    console.log('📝 Próximos passos:');
    console.log('  1. Revisar mudanças com git diff');
    console.log('  2. Testar a aplicação');
    console.log('  3. Fazer commit se tudo estiver ok');
  }
}

// Executar
main();
