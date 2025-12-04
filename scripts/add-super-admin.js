/**
 * Script para adicionar um novo Super Admin
 * 
 * Como usar:
 * 1. Primeiro, o usuário deve criar uma conta normal no sistema
 * 2. Pegue o UID dele no Firebase Authentication Console
 * 3. Execute: node scripts/add-super-admin.js <UID>
 * 
 * Ou edite manualmente o arquivo src/config/constants.js
 */

const fs = require('fs');
const path = require('path');

// Pegar UID dos argumentos
const newUID = process.argv[2];

if (!newUID) {
  console.error('❌ Erro: UID não fornecido');
  console.log('\n📖 Como usar:');
  console.log('   node scripts/add-super-admin.js <UID_DO_FIREBASE>');
  console.log('\n📝 Passos:');
  console.log('   1. Usuário cria conta no sistema');
  console.log('   2. Vá ao Firebase Console > Authentication');
  console.log('   3. Copie o UID do usuário');
  console.log('   4. Execute este script com o UID');
  process.exit(1);
}

// Caminho do arquivo de constantes
const constantsPath = path.join(__dirname, '..', 'src', 'config', 'constants.js');

try {
  // Ler arquivo atual
  let content = fs.readFileSync(constantsPath, 'utf8');
  
  // Verificar se UID já existe
  if (content.includes(newUID)) {
    console.log('⚠️  Este UID já está na lista de Super Admins!');
    process.exit(0);
  }
  
  // Encontrar o array SUPER_ADMIN_UIDS e adicionar novo UID
  const regex = /(export const SUPER_ADMIN_UIDS = \[[\s\S]*?)(];)/;
  const match = content.match(regex);
  
  if (!match) {
    console.error('❌ Erro: Não foi possível encontrar SUPER_ADMIN_UIDS no arquivo');
    process.exit(1);
  }
  
  // Data atual para comentário
  const today = new Date().toLocaleDateString('pt-BR');
  
  // Adicionar novo UID antes do ];
  const newEntry = `  '${newUID}', // Novo Super Admin (adicionado ${today})\n`;
  const updatedContent = content.replace(regex, `$1${newEntry}$2`);
  
  // Salvar arquivo
  fs.writeFileSync(constantsPath, updatedContent, 'utf8');
  
  console.log('✅ Super Admin adicionado com sucesso!');
  console.log(`\n📋 UID: ${newUID}`);
  console.log(`📅 Data: ${today}`);
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   1. Faça commit das mudanças no Git');
  console.log('   2. Faça deploy da aplicação');
  console.log('   3. O usuário terá acesso de Super Admin após o deploy');
  console.log('\n💡 Comandos:');
  console.log('   git add src/config/constants.js');
  console.log('   git commit -m "feat: Adicionar novo Super Admin"');
  console.log('   npm run build');
  console.log('   firebase deploy --only hosting');
  
} catch (error) {
  console.error('❌ Erro ao processar arquivo:', error.message);
  process.exit(1);
}
