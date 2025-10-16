/**
 * Script para Atualizar Logs Antigos com Nome do Usuário
 * 
 * Executa uma vez para preencher o campo userName nos logs que só têm UID
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update } from 'firebase/database';

// Configuração do Firebase (ajustar conforme necessário)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: 'https://escola-teste.firebaseio.com/', // ← AJUSTAR URL DA ESCOLA
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig, 'update-logs-script');
const database = getDatabase(app, firebaseConfig.databaseURL);

async function updateOldLogs() {
  console.log('🔄 Iniciando atualização de logs antigos...');
  
  try {
    // 1. Buscar todos os logs
    console.log('📋 Buscando logs...');
    const logsRef = ref(database, 'audit_logs');
    const logsSnapshot = await get(logsRef);
    
    if (!logsSnapshot.exists()) {
      console.log('⚠️ Nenhum log encontrado');
      return;
    }
    
    const logs = logsSnapshot.val();
    const logIds = Object.keys(logs);
    console.log(`📊 Total de logs: ${logIds.length}`);
    
    // 2. Buscar todos os usuários
    console.log('👥 Buscando usuários...');
    const usuariosRef = ref(database, 'usuarios');
    const usuariosSnapshot = await get(usuariosRef);
    
    if (!usuariosSnapshot.exists()) {
      console.log('⚠️ Nenhum usuário encontrado');
      return;
    }
    
    const usuarios = usuariosSnapshot.val();
    console.log(`👥 Total de usuários: ${Object.keys(usuarios).length}`);
    
    // 3. Processar logs sem userName
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    console.log('🔄 Processando logs...');
    
    for (const logId of logIds) {
      const log = logs[logId];
      
      // Se já tem userName, pular
      if (log.userName) {
        skipped++;
        continue;
      }
      
      // Se não tem userId, pular
      if (!log.userId) {
        console.log(`⚠️ Log ${logId} sem userId`);
        skipped++;
        continue;
      }
      
      // Buscar usuário correspondente
      const usuario = usuarios[log.userId];
      
      if (!usuario) {
        console.log(`⚠️ Usuário ${log.userId} não encontrado para log ${logId}`);
        errors++;
        continue;
      }
      
      // Extrair nome do usuário
      const userName = usuario.nome || usuario.name || usuario.displayName || null;
      
      if (!userName) {
        console.log(`⚠️ Usuário ${log.userId} não tem nome definido`);
        errors++;
        continue;
      }
      
      // Atualizar log
      try {
        const logUpdateRef = ref(database, `audit_logs/${logId}`);
        await update(logUpdateRef, {
          userName: userName,
          userEmail: log.userEmail || usuario.email || null,
          userRole: log.userRole || usuario.role || null
        });
        
        updated++;
        
        if (updated % 10 === 0) {
          console.log(`✅ Atualizados: ${updated} logs`);
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar log ${logId}:`, error);
        errors++;
      }
    }
    
    console.log('\n📊 Resumo da Atualização:');
    console.log(`✅ Atualizados: ${updated} logs`);
    console.log(`⏭️ Pulados: ${skipped} logs (já tinham userName)`);
    console.log(`❌ Erros: ${errors} logs`);
    console.log(`📋 Total processado: ${logIds.length} logs`);
    
  } catch (error) {
    console.error('❌ Erro ao processar logs:', error);
  }
}

// Executar script
updateOldLogs()
  .then(() => {
    console.log('✅ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
