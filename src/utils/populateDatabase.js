// Utilitário para executar o seeder de dados
import { DataSeeder } from '../services/dataSeeder.js';

const populateDatabase = async () => {
  console.log('🚀 Iniciando população do banco de gerenciamento...');
  console.log('📍 Banco: https://gerenciamento-elo-school.firebaseio.com/');
  console.log('');
  
  try {
    const result = await DataSeeder.seedDatabase();
    
    if (result.success) {
      console.log('');
      console.log('✅ Banco de dados populado com sucesso!');
      console.log('');
      console.log('📊 Dados inseridos:');
      console.log('   • 4 Escolas (São João, Esperança, Instituto Brasil, Nova Geração)');
      console.log('   • 6 Usuários (1 Super Admin + 5 Coordenadores/Secretários)');
      console.log('   • 3 Contratos ativos');
      console.log('   • 8 Pagamentos (confirmados e pendentes)');
      console.log('   • Configurações de cobrança');
      console.log('');
      console.log('🎯 Agora você pode:');
      console.log('   • Acessar o super-admin com dados reais');
      console.log('   • Testar todas as funcionalidades');
      console.log('   • Ver estatísticas reais no dashboard');
      console.log('');
    } else {
      console.log('❌ Erro ao popular banco:', result.error);
    }
  } catch (error) {
    console.error('💥 Erro crítico:', error);
  }
};

// Executar se chamado diretamente
if (typeof window === 'undefined') {
  populateDatabase();
}

export { populateDatabase };