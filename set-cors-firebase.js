/**
 * Configurar CORS via Firebase Admin SDK
 * Execute: node set-cors-firebase.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./elo-school-firebase-adminsdk.json'); // Você precisa baixar este arquivo

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'elo-school.firebasestorage.app'
});

async function setCORS() {
  try {
    const bucket = admin.storage().bucket();
    
    // Configuração CORS
    const corsConfiguration = [
      {
        origin: ['*'],
        method: ['GET', 'HEAD', 'OPTIONS'],
        maxAgeSeconds: 3600,
        responseHeader: ['Content-Type']
      }
    ];

    await bucket.setCorsConfiguration(corsConfiguration);
    console.log('✅ CORS configurado com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

setCORS();
