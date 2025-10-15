// Script para popular o banco de gerenciamento com dados fictícios
import { SchoolManagementService } from './schoolManagementService.js';
import { userManagementService } from './userManagementService.js';
import { FinancialManagementService } from './financialManagementService.js';

export class DataSeeder {
  
  static async seedDatabase() {
    console.log('🌱 Iniciando população do banco de dados...');
    
    try {
      // 1. Popular escolas
      await this.seedSchools();
      
      // 2. Popular usuários
      await this.seedUsers();
      
      // 3. Popular dados financeiros
      await this.seedFinancialData();
      
      // 4. Configurar configurações de cobrança
      await this.seedBillingSettings();
      
      console.log('✅ Banco de dados populado com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao popular banco:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async seedSchools() {
    console.log('📚 Populando escolas...');
    
    const schools = [
      {
        nome: 'Escola Municipal São João',
        razaoSocial: 'Escola Municipal São João LTDA',
        cnpj: '12.345.678/0001-90',
        email: 'contato@escolasaojoao.edu.br',
        telefone: '(11) 3456-7890',
        endereco: {
          rua: 'Rua das Flores, 123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567'
        },
        responsavel: {
          nome: 'Maria Silva',
          email: 'maria.silva@escolasaojoao.edu.br',
          telefone: '(11) 99999-1234'
        },
        plano: 'basico',
        status: 'ativo',
        logo: '🏫',
        firebaseConfig: {
          projectId: 'escola-sao-joao-123',
          databaseURL: 'https://escola-sao-joao-123-default-rtdb.firebaseio.com/',
          storageBucket: 'escola-sao-joao-123.firebasestorage.app'
        },
        configuracoes: {
          maxAlunos: 500,
          maxProfessores: 25,
          modulosAtivos: ['alunos', 'professores', 'notas', 'frequencia']
        }
      },
      {
        nome: 'Colégio Esperança',
        razaoSocial: 'Colégio Esperança S/A',
        cnpj: '98.765.432/0001-10',
        email: 'admin@colegioesperanca.com.br',
        telefone: '(21) 2345-6789',
        endereco: {
          rua: 'Av. Principal, 456',
          bairro: 'Copacabana',
          cidade: 'Rio de Janeiro',
          estado: 'RJ',
          cep: '22070-001'
        },
        responsavel: {
          nome: 'João Santos',
          email: 'joao.santos@colegioesperanca.com.br',
          telefone: '(21) 98888-5678'
        },
        plano: 'premium',
        status: 'ativo',
        logo: '🎓',
        firebaseConfig: {
          projectId: 'colegio-esperanca-456',
          databaseURL: 'https://colegio-esperanca-456-default-rtdb.firebaseio.com/',
          storageBucket: 'colegio-esperanca-456.firebasestorage.app'
        },
        configuracoes: {
          maxAlunos: 1000,
          maxProfessores: 50,
          modulosAtivos: ['alunos', 'professores', 'notas', 'frequencia', 'financeiro', 'biblioteca']
        }
      },
      {
        nome: 'Instituto Educacional Brasil',
        razaoSocial: 'Instituto Educacional Brasil LTDA',
        cnpj: '11.222.333/0001-44',
        email: 'contato@institutobrasil.edu.br',
        telefone: '(31) 3333-4444',
        endereco: {
          rua: 'Rua da Educação, 789',
          bairro: 'Savassi',
          cidade: 'Belo Horizonte',
          estado: 'MG',
          cep: '30112-000'
        },
        responsavel: {
          nome: 'Ana Costa',
          email: 'ana.costa@institutobrasil.edu.br',
          telefone: '(31) 97777-9999'
        },
        plano: 'empresarial',
        status: 'ativo',
        logo: '📚',
        firebaseConfig: {
          projectId: 'instituto-brasil-789',
          databaseURL: 'https://instituto-brasil-789-default-rtdb.firebaseio.com/',
          storageBucket: 'instituto-brasil-789.firebasestorage.app'
        },
        configuracoes: {
          maxAlunos: 2000,
          maxProfessores: 100,
          modulosAtivos: ['alunos', 'professores', 'notas', 'frequencia', 'financeiro', 'biblioteca', 'relatorios', 'agenda']
        }
      },
      {
        nome: 'Escola Nova Geração',
        razaoSocial: 'Escola Nova Geração EIRELI',
        cnpj: '55.666.777/0001-88',
        email: 'admin@novageracao.edu.br',
        telefone: '(85) 3333-2222',
        endereco: {
          rua: 'Av. Futuro, 321',
          bairro: 'Aldeota',
          cidade: 'Fortaleza',
          estado: 'CE',
          cep: '60160-230'
        },
        responsavel: {
          nome: 'Carlos Oliveira',
          email: 'carlos.oliveira@novageracao.edu.br',
          telefone: '(85) 96666-3333'
        },
        plano: 'premium',
        status: 'pendente',
        logo: '🌟',
        firebaseConfig: {
          projectId: 'nova-geracao-321',
          databaseURL: 'https://nova-geracao-321-default-rtdb.firebaseio.com/',
          storageBucket: 'nova-geracao-321.firebasestorage.app'
        },
        configuracoes: {
          maxAlunos: 800,
          maxProfessores: 40,
          modulosAtivos: ['alunos', 'professores', 'notas']
        }
      }
    ];
    
    for (const school of schools) {
      const result = await SchoolManagementService.createSchool(school);
      if (result.success) {
        console.log(`✅ Escola criada: ${school.nome}`);
      } else {
        console.log(`❌ Erro ao criar escola ${school.nome}:`, result.error);
      }
    }
  }
  
  static async seedUsers() {
    console.log('👥 Populando usuários...');
    
    // Primeiro buscar as escolas para vincular usuários
    const schoolsResult = await SchoolManagementService.getAllSchools();
    if (!schoolsResult.success) {
      console.log('❌ Erro ao buscar escolas para vincular usuários');
      return;
    }
    
    const schools = schoolsResult.data;
    
    const users = [
      {
        nome: 'Super Admin ELO',
        email: 'admin@eloschool.com',
        firebaseUid: 'qD6UucWtcgPC9GHA41OB8rSaghZ2',
        role: 'super-admin',
        status: 'ativo',
        telefone: '(11) 99999-0000',
        schools: schools.map(school => ({
          id: school.id,
          nome: school.nome,
          role: 'admin'
        })),
        permissions: ['all'],
        lastLogin: new Date().toISOString()
      },
      {
        nome: 'Maria Silva',
        email: 'maria.silva@escolasaojoao.edu.br',
        firebaseUid: 'user123',
        role: 'coordenador',
        status: 'ativo',
        telefone: '(11) 99999-1234',
        schools: [{
          id: schools[0]?.id,
          nome: schools[0]?.nome,
          role: 'coordenador'
        }],
        permissions: ['dashboard', 'alunos', 'professores', 'relatorios'],
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        nome: 'João Santos',
        email: 'joao.santos@colegioesperanca.com.br',
        firebaseUid: 'user456',
        role: 'coordenador',
        status: 'ativo',
        telefone: '(21) 98888-5678',
        schools: [{
          id: schools[1]?.id,
          nome: schools[1]?.nome,
          role: 'coordenador'
        }],
        permissions: ['dashboard', 'alunos', 'professores', 'financeiro', 'relatorios'],
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        nome: 'Ana Costa',
        email: 'ana.costa@institutobrasil.edu.br',
        firebaseUid: 'user789',
        role: 'coordenador',
        status: 'ativo',
        telefone: '(31) 97777-9999',
        schools: [{
          id: schools[2]?.id,
          nome: schools[2]?.nome,
          role: 'coordenador'
        }],
        permissions: ['dashboard', 'alunos', 'professores', 'financeiro', 'biblioteca', 'agenda', 'relatorios'],
        lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      },
      {
        nome: 'Carlos Oliveira',
        email: 'carlos.oliveira@novageracao.edu.br',
        firebaseUid: 'user321',
        role: 'coordenador',
        status: 'pendente',
        telefone: '(85) 96666-3333',
        schools: [{
          id: schools[3]?.id,
          nome: schools[3]?.nome,
          role: 'coordenador'
        }],
        permissions: ['dashboard', 'alunos'],
        lastLogin: null
      },
      {
        nome: 'Paula Secretária',
        email: 'secretaria@escolasaojoao.edu.br',
        firebaseUid: 'sec123',
        role: 'secretaria',
        status: 'ativo',
        telefone: '(11) 98765-4321',
        schools: [{
          id: schools[0]?.id,
          nome: schools[0]?.nome,
          role: 'secretaria'
        }],
        permissions: ['dashboard', 'alunos', 'matriculas'],
        lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    for (const user of users) {
      const result = await userManagementService.createUser(user);
      if (result.success) {
        console.log(`✅ Usuário criado: ${user.nome}`);
      } else {
        console.log(`❌ Erro ao criar usuário ${user.nome}:`, result.error);
      }
    }
  }
  
  static async seedFinancialData() {
    console.log('💰 Populando dados financeiros...');
    
    // Buscar escolas para criar contratos
    const schoolsResult = await SchoolManagementService.getAllSchools();
    if (!schoolsResult.success) return;
    
    const schools = schoolsResult.data;
    
    // Criar contratos
    const contracts = [
      {
        schoolId: schools[0]?.id,
        schoolName: schools[0]?.nome,
        plano: 'basico',
        valor: 299.90,
        dataInicio: '2024-01-01',
        dataTermino: '2024-12-31',
        status: 'ativo',
        formaPagamento: 'mensal',
        observacoes: 'Contrato anual plano básico'
      },
      {
        schoolId: schools[1]?.id,
        schoolName: schools[1]?.nome,
        plano: 'premium',
        valor: 599.90,
        dataInicio: '2024-02-01',
        dataTermino: '2025-01-31',
        status: 'ativo',
        formaPagamento: 'mensal',
        observacoes: 'Contrato anual plano premium'
      },
      {
        schoolId: schools[2]?.id,
        schoolName: schools[2]?.nome,
        plano: 'empresarial',
        valor: 999.90,
        dataInicio: '2024-01-15',
        dataTermino: '2024-12-15',
        status: 'ativo',
        formaPagamento: 'mensal',
        observacoes: 'Contrato anual plano empresarial'
      }
    ];
    
    for (const contract of contracts) {
      const result = await FinancialManagementService.createContract(contract);
      if (result.success) {
        console.log(`✅ Contrato criado para: ${contract.schoolName}`);
      }
    }
    
    // Criar pagamentos
    const payments = [
      // Escola 1 - Pagamentos regulares
      {
        schoolId: schools[0]?.id,
        schoolName: schools[0]?.nome,
        valor: 299.90,
        dataPagamento: '2024-01-10',
        dataVencimento: '2024-01-10',
        status: 'confirmado',
        formaPagamento: 'pix',
        referencia: 'Janeiro/2024'
      },
      {
        schoolId: schools[0]?.id,
        schoolName: schools[0]?.nome,
        valor: 299.90,
        dataPagamento: '2024-02-10',
        dataVencimento: '2024-02-10',
        status: 'confirmado',
        formaPagamento: 'cartao',
        referencia: 'Fevereiro/2024'
      },
      {
        schoolId: schools[0]?.id,
        schoolName: schools[0]?.nome,
        valor: 299.90,
        dataPagamento: null,
        dataVencimento: '2024-03-10',
        status: 'pendente',
        formaPagamento: 'boleto',
        referencia: 'Março/2024'
      },
      
      // Escola 2 - Pagamentos premium
      {
        schoolId: schools[1]?.id,
        schoolName: schools[1]?.nome,
        valor: 599.90,
        dataPagamento: '2024-02-05',
        dataVencimento: '2024-02-05',
        status: 'confirmado',
        formaPagamento: 'pix',
        referencia: 'Fevereiro/2024'
      },
      {
        schoolId: schools[1]?.id,
        schoolName: schools[1]?.nome,
        valor: 599.90,
        dataPagamento: '2024-03-05',
        dataVencimento: '2024-03-05',
        status: 'confirmado',
        formaPagamento: 'pix',
        referencia: 'Março/2024'
      },
      
      // Escola 3 - Pagamentos empresariais
      {
        schoolId: schools[2]?.id,
        schoolName: schools[2]?.nome,
        valor: 999.90,
        dataPagamento: '2024-01-20',
        dataVencimento: '2024-01-20',
        status: 'confirmado',
        formaPagamento: 'transferencia',
        referencia: 'Janeiro/2024'
      },
      {
        schoolId: schools[2]?.id,
        schoolName: schools[2]?.nome,
        valor: 999.90,
        dataPagamento: '2024-02-20',
        dataVencimento: '2024-02-20',
        status: 'confirmado',
        formaPagamento: 'transferencia',
        referencia: 'Fevereiro/2024'
      },
      {
        schoolId: schools[2]?.id,
        schoolName: schools[2]?.nome,
        valor: 999.90,
        dataPagamento: null,
        dataVencimento: '2024-03-20',
        status: 'atrasado',
        formaPagamento: 'transferencia',
        referencia: 'Março/2024'
      }
    ];
    
    for (const payment of payments) {
      const result = await FinancialManagementService.createPayment(payment);
      if (result.success) {
        console.log(`✅ Pagamento criado para: ${payment.schoolName} - ${payment.referencia}`);
      }
    }
  }
  
  static async seedBillingSettings() {
    console.log('⚙️ Configurando configurações de cobrança...');
    
    const settings = {
      vencimento: 10,
      juros: 2.0,
      multa: 10.0,
      desconto: 5.0,
      diasDesconto: 5,
      emailLembrete: true,
      diasLembrete: 3,
      emailCobranca: true,
      diasCobranca: 7,
      formasPagamento: ['pix', 'cartao', 'boleto', 'transferencia'],
      pixChave: 'admin@eloschool.com',
      contaBancaria: {
        banco: '001',
        agencia: '1234',
        conta: '56789-0'
      }
    };
    
    const result = await FinancialManagementService.saveBillingSettings(settings);
    if (result.success) {
      console.log('✅ Configurações de cobrança salvas');
    }
  }
}