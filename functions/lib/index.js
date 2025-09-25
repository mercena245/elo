"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
exports.deleteUser = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.admin) {
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
//# sourceMappingURL=index.js.map