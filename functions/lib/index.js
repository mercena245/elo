"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provisionNewSchool = exports.deleteUser = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
// Inicializar conexão com o banco de gerenciamento
const managementApp = admin.initializeApp({
    databaseURL: 'https://gerenciamento-elo-school.firebaseio.com/'
}, 'management');
const managementDB = admin.database(managementApp);
exports.deleteUser = functions.https.onCall(async (data, context) => {
    console.log('Contexto recebido:', JSON.stringify(context));
    if (!context?.auth || !context.auth.token?.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem excluir usuários.');
    }
    const uid = data.uid;
    if (!uid) {
        throw new functions.https.HttpsError('invalid-argument', 'UID do usuário é obrigatório.');
    }
    try {
        await admin.auth().deleteUser(uid);
        // Remove do Realtime Database (ajuste o caminho conforme sua estrutura)
        await admin.database().ref(`usuarios/${uid}`).remove();
        return { success: true };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Erro ao excluir usuário: ' + error.message);
    }
});
/**
 * Função para provisionar uma nova escola multi-tenant.
 * Salva os dados da escola no banco de gerenciamento.
 * Os dados técnicos (projectId, databaseURL, storageBucket) devem ser configurados manualmente.
 */
exports.provisionNewSchool = functions.https.onCall(async (data, context) => {
    // Dados recebidos do painel
    const { nome, cnpj, responsavel, email, telefone, plano, endereco, configuracoes, mensalidade, dataVencimento, userUid, userEmail } = data;
    // Log detalhado de cada campo obrigatório (sem JSON.stringify para evitar referências circulares)
    console.log('📥 Dados recebidos na Cloud Function');
    console.log('Validação de campos obrigatórios:');
    console.log('nome:', nome, '- válido?', !!nome);
    console.log('cnpj:', cnpj, '- válido?', !!cnpj);
    console.log('responsavel:', responsavel, '- válido?', !!responsavel);
    console.log('email:', email, '- válido?', !!email);
    console.log('userUid:', userUid, '- válido?', !!userUid);
    if (!nome || !cnpj || !responsavel || !email || !userUid) {
        const camposFaltando = [];
        if (!nome)
            camposFaltando.push('nome');
        if (!cnpj)
            camposFaltando.push('cnpj');
        if (!responsavel)
            camposFaltando.push('responsavel');
        if (!email)
            camposFaltando.push('email');
        if (!userUid)
            camposFaltando.push('userUid');
        const mensagemErro = `Dados obrigatórios faltando: ${camposFaltando.join(', ')}`;
        console.error('❌ Erro de validação:', mensagemErro);
        throw new functions.https.HttpsError('invalid-argument', mensagemErro);
    }
    // Estrutura da escola (dados técnicos serão preenchidos manualmente depois)
    const schoolData = {
        nome,
        cnpj,
        responsavel,
        email,
        telefone: telefone || '',
        plano: plano || 'basico',
        mensalidade: mensalidade || 1200,
        dataVencimento: dataVencimento || 15,
        endereco: endereco || {},
        configuracoes: configuracoes || {
            modulosAtivos: ['financeiro', 'notas', 'alunos'],
            limiteAlunos: 200,
            limiteProfessores: 15
        },
        status: 'pendente', // Status inicial como pendente até configuração manual
        dataContrato: new Date().toISOString().split('T')[0],
        criadoEm: new Date().toISOString(),
        // Campos técnicos vazios - serão preenchidos manualmente
        projectId: '',
        databaseURL: '',
        storageBucket: '',
        usuarios: {
            [userUid]: {
                email: userEmail,
                role: 'coordenadora',
                ativo: true,
                criadoEm: new Date().toISOString()
            }
        }
    };
    // Salvar no banco de gerenciamento
    const ref = managementDB.ref('escolas');
    const newSchoolRef = ref.push();
    await newSchoolRef.set(schoolData);
    return {
        success: true,
        schoolId: newSchoolRef.key,
        ...schoolData
    };
});
//# sourceMappingURL=index.js.map