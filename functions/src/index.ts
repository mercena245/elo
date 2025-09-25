import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const deleteUser = functions.https.onCall(async (data, context) => {
  console.log('Contexto recebido:', JSON.stringify(context));
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
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Erro ao excluir usuário: ' + error.message);
  }
});
