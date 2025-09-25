import admin from "firebase-admin";
import fs from "fs";

// Caminho para o arquivo de credenciais baixado do Firebase
const serviceAccount = JSON.parse(fs.readFileSync("./elo-school-firebase-adminsdk-fbsvc-1434a18c9e.json", "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Substitua pelo UID do usuário que deseja tornar admin
const uid = "qD6UucWtcgPC9GHA41OB8rSaghZ2"; // Substitua pelo UID desejado

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log("Claim de admin definida com sucesso!");
  })
  .catch((error) => {
    console.error("Erro ao definir claim:", error);
  });
