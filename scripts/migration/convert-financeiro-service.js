/**
 * Script para converter financeiroService.js para versão multi-tenant
 * Cria uma factory function que recebe database como parâmetro
 */

const fs = require('fs');
const path = require('path');

const serviceFile = path.join(__dirname, 'src', 'services', 'financeiroService.js');
const outputFile = path.join(__dirname, 'src', 'services', 'financeiroServiceMultiTenant.js');

console.log('🔄 Convertendo financeiroService para multi-tenant...\n');

// Ler arquivo original
let content = fs.readFileSync(serviceFile, 'utf8');

// 1. Remover import de db
content = content.replace(
  /import\s*\{[^}]*\}\s*from\s*['"]\.\.\/firebase['"];?/g,
  "import { ref, get, set, push, update, remove } from 'firebase/database';"
);

// 2. Transformar o objeto em uma factory function
content = content.replace(
  /const financeiroService = \{/,
  `/**
 * Serviço Financeiro - Multi-Tenant
 * Factory function que cria uma instância do serviço para um banco específico
 * @param {Database} database - Instância do Firebase Database da escola
 * @param {Storage} storage - Instância do Firebase Storage da escola (opcional)
 */
export const createFinanceiroService = (database, storage = null) => {
  if (!database) {
    console.error('Database não fornecido para financeiroService');
    return null;
  }

  return {`
);

// 3. Substituir todas as ocorrências de ref(db, por ref(database,
content = content.replace(/ref\(db,/g, 'ref(database,');

// 4. Adicionar fechamento da function no final
const lastBraceIndex = content.lastIndexOf('};');
if (lastBraceIndex !== -1) {
  content = content.substring(0, lastBraceIndex + 2) + '\n};\n\nexport default createFinanceiroService;';
}

// 5. Remover export antigo
content = content.replace(/export \{ financeiroService \};?/g, '');
content = content.replace(/export default financeiroService;?/g, '');

// Salvar arquivo
fs.writeFileSync(outputFile, content, 'utf8');

console.log('✅ Arquivo convertido com sucesso!');
console.log(`📄 Salvo em: ${outputFile}\n`);
console.log('📝 Próximos passos:');
console.log('  1. Revisar o arquivo gerado');
console.log('  2. Testar as alterações');
console.log('  3. Atualizar imports nos componentes');
