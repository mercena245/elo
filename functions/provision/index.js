const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Função HTTP para provisionar uma nova escola multi-tenant.
 * Cria um nó no banco global, gera dados técnicos e retorna para o painel.
 * (A criação automática de novo projeto Firebase e bucket só é possível via API Google Cloud, não pelo SDK Admin. Aqui, simulamos o fluxo e salvamos as configs.)
 */
exports.provisionNewSchool = functions.https.onCall(async (data, context) => {
  // Dados recebidos do painel
  const { nome, cnpj, responsavel, email, plano, endereco, config, userUid, userEmail } = data;

  if (!nome || !cnpj || !responsavel || !email || !userUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Dados obrigatórios faltando.');
  }

  // Gerar IDs técnicos simulados
  const timestamp = Date.now();
  const projectId = `elo-${nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}`;
  const databaseURL = `https://${projectId}-default-rtdb.firebaseio.com/`;
  const storageBucket = `${projectId}.appspot.com`;

  // Estrutura da escola
  const schoolData = {
    nome,
    cnpj,
    responsavel,
    email,
    plano,
    endereco,
    config,
    status: 'ativa',
    criadoEm: new Date().toISOString(),
    projectId,
    databaseURL,
    storageBucket,
    usuarios: {
      [userUid]: {
        email: userEmail,
        role: 'coordenadora',
        ativo: true,
        criadoEm: new Date().toISOString()
      }
    }
  };

  // Salvar no banco global
  const ref = admin.database().ref('escolas');
  const newSchoolRef = ref.push();
  await newSchoolRef.set(schoolData);

  return {
    success: true,
    schoolId: newSchoolRef.key,
    ...schoolData
  };
});
