// Script de teste para validar a estrutura da grade horária
// Execute no console do browser na tela de grade horária

const testarEstrutura = async () => {
  console.log('=== TESTE DE ESTRUTURA GRADE HORÁRIA ===');
  
  // Simular dados de teste
  const periodoLetivoTeste = {
    id: 'periodo_2025_1',
    ano: '2025',
    periodo: '1',
    ativo: true
  };
  
  const turmaTeste = 'turma_1a_2025';
  
  const horarioTeste = {
    turmaId: turmaTeste,
    disciplinaId: 'matematica',
    professorId: 'prof_123',
    diaSemana: 1, // Segunda-feira
    periodoAula: 'periodo_1',
    periodoLetivoId: periodoLetivoTeste.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const horarioId = `horario_teste_${Date.now()}`;
  const caminho = `GradeHoraria/${periodoLetivoTeste.id}/${turmaTeste}/${horarioId}`;
  
  console.log('Caminho de salvamento:', caminho);
  console.log('Dados do horário:', horarioTeste);
  
  try {
    // Importar Firebase (assumindo que já está disponível)
    if (typeof window !== 'undefined' && window.firebase) {
      const { ref, set, get } = window.firebase.database;
      const db = window.firebase.database();
      
      // Salvar dados de teste
      await set(ref(db, caminho), horarioTeste);
      console.log('✅ Dados salvos com sucesso!');
      
      // Verificar se foram salvos
      const snapshot = await get(ref(db, caminho));
      if (snapshot.exists()) {
        console.log('✅ Dados recuperados:', snapshot.val());
      } else {
        console.log('❌ Dados não encontrados após salvamento');
      }
      
      // Testar busca por período letivo
      const snapshotPeriodo = await get(ref(db, `GradeHoraria/${periodoLetivoTeste.id}`));
      if (snapshotPeriodo.exists()) {
        console.log('✅ Dados do período letivo encontrados:', snapshotPeriodo.val());
      } else {
        console.log('❌ Dados do período letivo não encontrados');
      }
      
    } else {
      console.log('❌ Firebase não está disponível');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// Executar teste
testarEstrutura();

console.log('Para executar este teste:');
console.log('1. Abra a tela de grade horária');
console.log('2. Abra o console do browser (F12)');
console.log('3. Cole e execute este código');