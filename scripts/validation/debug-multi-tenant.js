/**
 * Script de Debug Multi-Tenant
 * 
 * Execute este script no console do navegador após fazer login
 * para diagnosticar problemas de conexão multi-tenant
 */

const debugMultiTenant = async () => {
  console.log('🔍 ====== DEBUG MULTI-TENANT ======');
  console.log('');
  
  // 1. Verificar AuthContext
  console.log('1️⃣ VERIFICANDO AUTH CONTEXT:');
  const savedAccessType = localStorage.getItem('accessType');
  const savedSchool = localStorage.getItem('selectedSchool');
  
  console.log('   - AccessType:', savedAccessType);
  if (savedSchool) {
    try {
      const school = JSON.parse(savedSchool);
      console.log('   - Escola no localStorage:');
      console.log('     * ID:', school.id);
      console.log('     * Nome:', school.nome);
      console.log('     * Database URL:', school.databaseURL);
      console.log('     * Storage Bucket:', school.storageBucket);
      console.log('     * Project ID:', school.projectId);
    } catch (e) {
      console.error('   ❌ Erro ao parsear escola do localStorage:', e);
    }
  } else {
    console.log('   ⚠️ Nenhuma escola no localStorage');
  }
  console.log('');
  
  // 2. Verificar Firebase Apps
  console.log('2️⃣ VERIFICANDO FIREBASE APPS:');
  const { getApps } = await import('firebase/app');
  const apps = getApps();
  console.log('   - Total de Apps:', apps.length);
  apps.forEach((app, index) => {
    console.log(`   - App ${index + 1}:`);
    console.log('     * Nome:', app.name);
    console.log('     * Options:', app.options);
  });
  console.log('');
  
  // 3. Verificar managementDB
  console.log('3️⃣ VERIFICANDO MANAGEMENT DATABASE:');
  try {
    const { managementDB, ref, get } = await import('./src/firebase');
    console.log('   - Management DB conectado:', !!managementDB);
    
    // Listar todas as escolas
    const escolasRef = ref(managementDB, 'escolas');
    const escolasSnap = await get(escolasRef);
    
    if (escolasSnap.exists()) {
      const escolas = escolasSnap.val();
      console.log('   - Total de escolas:', Object.keys(escolas).length);
      Object.entries(escolas).forEach(([id, escola]) => {
        console.log(`   - Escola: ${id}`);
        console.log(`     * Nome: ${escola.nome}`);
        console.log(`     * Database: ${escola.databaseURL}`);
        console.log(`     * Project: ${escola.projectId}`);
      });
    } else {
      console.log('   ⚠️ Nenhuma escola encontrada em /escolas');
    }
  } catch (error) {
    console.error('   ❌ Erro ao acessar managementDB:', error);
  }
  console.log('');
  
  // 4. Verificar userSchools
  console.log('4️⃣ VERIFICANDO USER SCHOOLS:');
  try {
    const { auth, managementDB, ref, get } = await import('./src/firebase');
    const user = auth.currentUser;
    
    if (user) {
      console.log('   - Usuário logado:', user.uid);
      console.log('   - Email:', user.email);
      
      const userSchoolRef = ref(managementDB, `userSchools/${user.uid}`);
      const userSchoolSnap = await get(userSchoolRef);
      
      if (userSchoolSnap.exists()) {
        const escolaId = userSchoolSnap.val();
        console.log('   - Escola vinculada:', escolaId);
        
        // Buscar dados da escola
        const escolaRef = ref(managementDB, `escolas/${escolaId}`);
        const escolaSnap = await get(escolaRef);
        
        if (escolaSnap.exists()) {
          const escola = escolaSnap.val();
          console.log('   - Dados da escola:');
          console.log('     * Nome:', escola.nome);
          console.log('     * Database URL:', escola.databaseURL);
          console.log('     * Project ID:', escola.projectId);
        } else {
          console.log('   ⚠️ Escola não encontrada em /escolas');
        }
      } else {
        console.log('   ⚠️ Usuário não tem escola vinculada em /userSchools');
      }
    } else {
      console.log('   ⚠️ Nenhum usuário logado');
    }
  } catch (error) {
    console.error('   ❌ Erro ao verificar userSchools:', error);
  }
  console.log('');
  
  // 5. Testar leitura de dados
  console.log('5️⃣ TESTANDO LEITURA DE DADOS:');
  try {
    const { useSchoolDatabase } = await import('./src/hooks/useSchoolDatabase');
    console.log('   - Hook importado com sucesso');
    console.log('   ⚠️ Hook precisa ser usado dentro de um componente React');
    console.log('   ⚠️ Execute window.testSchoolDatabase() após o componente montar');
  } catch (error) {
    console.error('   ❌ Erro ao importar hook:', error);
  }
  console.log('');
  
  console.log('🔍 ====== FIM DO DEBUG ======');
  console.log('');
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('1. Verifique se há erros acima');
  console.log('2. Confirme que a escola está corretamente vinculada ao usuário');
  console.log('3. Verifique se o databaseURL está correto');
  console.log('4. Abra o Network tab e veja se há requisições ao Firebase');
  console.log('5. Procure por erros PERMISSION_DENIED');
};

// Exportar para uso global
window.debugMultiTenant = debugMultiTenant;

console.log('✅ Script de debug carregado!');
console.log('📝 Execute: debugMultiTenant()');
