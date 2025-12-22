/**
 * Script para configurar CORS no Firebase Storage
 * Execute: node configure-cors.js
 */

const { Storage } = require('@google-cloud/storage');

async function configureCORS() {
  console.log('🔧 Configurando CORS no Firebase Storage...');
  
  const storage = new Storage({
    projectId: 'elo-school'
  });

  const bucketName = 'elo-school.firebasestorage.app';
  const bucket = storage.bucket(bucketName);

  const corsConfiguration = [
    {
      origin: ['*'],
      method: ['GET', 'HEAD', 'OPTIONS'],
      maxAgeSeconds: 3600,
      responseHeader: ['Content-Type', 'Content-Length']
    }
  ];

  try {
    await bucket.setCorsConfiguration(corsConfiguration);
    console.log('✅ CORS configurado com sucesso!');
    console.log('Configuração aplicada:', JSON.stringify(corsConfiguration, null, 2));
  } catch (error) {
    console.error('❌ Erro ao configurar CORS:', error.message);
    console.log('\n📝 Execute manualmente no Google Cloud Console:');
    console.log('1. Acesse: https://console.cloud.google.com/storage/browser?project=elo-school');
    console.log('2. Clique no bucket:', bucketName);
    console.log('3. Vá em "Permissions" → "CORS"');
    console.log('4. Cole a configuração do arquivo cors.json');
  }
}

configureCORS();
