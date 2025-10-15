/**
 * Script de migração específico para /alunos/page.jsx
 * 
 * Este arquivo é muito grande (3480 linhas) e requer substituições em múltiplos pontos.
 * Vamos fazer a migração em partes para garantir precisão.
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'alunos', 'page.jsx');

console.log('🔄 Iniciando migração de /alunos/page.jsx...');

// Ler arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Backup
const backupPath = filePath + '.backup-' + Date.now();
fs.writeFileSync(backupPath, content);
console.log(`✅ Backup criado: ${backupPath}`);

// Contador de substituições
let changes = 0;

// 1. Remover imports do firebase que não são mais necessários
const oldImports = `import { auth, onAuthStateChanged } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";`;

const newImports = `import { auth, onAuthStateChanged } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";`;

// Imports já estão corretos, não precisa mudar

// 2. Adicionar getData no início do componente principal (após os hooks)
// Procurar padrão: const { getData, setData...
// Já está correto no arquivo

// 3. Substituir todas as ocorrências de get(ref(db, 'alunos'))
content = content.replace(/await get\(ref\(db, 'alunos'\)\)/g, () => {
  changes++;
  return `await getData('alunos')`;
});

// 4. Substituir get(ref(db, 'turmas'))
content = content.replace(/await get\(ref\(db, 'turmas'\)\)/g, () => {
  changes++;
  return `await getData('turmas')`;
});

// 5. Substituir set(ref(db, `alunos/${ID}`), DATA)
content = content.replace(/await set\(ref\(db, `alunos\/\$\{([^}]+)\}`\), ([^)]+)\)/g, (match, id, data) => {
  changes++;
  return `await setData(\`alunos/\${${id}}\`, ${data})`;
});

// 6. Substituir ref(db, `usuarios/${userId}`)
content = content.replace(/const userRef = ref\(db, `usuarios\/\$\{userId\}`\);[\s\n]+const snap = await get\(userRef\);/g, () => {
  changes++;
  return `const userData = await getData(\`usuarios/\${userId}\`);`;
});

// 7. Substituir snap.exists()
content = content.replace(/if \(snap\.exists\(\)\)/g, () => {
  changes++;
  return `if (userData)`;
});

// 8. Substituir snap.val()
content = content.replace(/snap\.val\(\)/g, () => {
  changes++;
  return `userData`;
});

// 9. Substituir alunosSnap.exists() e alunosSnap.val()
content = content.replace(/if \(alunosSnap\.exists\(\)\) \{[\s\n]+const alunosData = alunosSnap\.val\(\);/g, () => {
  changes++;
  return `const alunosData = alunosSnap;\n      if (alunosData) {`;
});

// 10. Substituir turmasSnap.exists() e turmasSnap.val()
content = content.replace(/if \(turmasSnap\.exists\(\)\) \{[\s\n]+const turmasData = turmasSnap\.val\(\);/g, () => {
  changes++;
  return `const turmasData = turmasSnap;\n      if (turmasData) {`;
});

// 11. Adicionar verificação isReady no useEffect principal
const useEffectPattern = /useEffect\(\(\) => \{[\s\n]+fetchAlunos\(\);/g;
content = content.replace(useEffectPattern, () => {
  changes++;
  return `useEffect(() => {
    if (!isReady) return;
    console.log('👨‍🎓 [Alunos] Conectando ao banco da escola:', currentSchool?.nome);
    fetchAlunos();`;
});

// 12. Adicionar dependências ao useEffect
content = content.replace(/\}, \[\]\);[\s]*\/\/ fetchAlunos/g, () => {
  changes++;
  return `}, [isReady, getData, currentSchool]); // fetchAlunos`;
});

// 13. Substituir referências ao storage
content = content.replace(/const fotoRef = storageRef\(storage,/g, () => {
  changes++;
  return `const fotoRef = storageRef(schoolStorage,`;
});

// 14. Corrigir fetchAlunos para não usar .exists() e .val()
const fetchAlunosPattern = /const fetchAlunos = async \(\) => \{[\s\S]*?const alunosSnap = await getData\('alunos'\);[\s\S]*?if \(alunosSnap\.exists\(\)\)/;
if (fetchAlunosPattern.test(content)) {
  content = content.replace(fetchAlunosPattern, () => {
    changes++;
    return `const fetchAlunos = async () => {
      setLoading(true);
      try {
        const alunosData = await getData('alunos');
        const turmasData = await getData('turmas');
        
        if (alunosData`;
  });
}

// Salvar arquivo modificado
fs.writeFileSync(filePath, content);

console.log(`\n✅ Migração concluída!`);
console.log(`📊 Total de substituições: ${changes}`);
console.log(`📁 Arquivo: ${filePath}`);
console.log(`💾 Backup: ${backupPath}`);
console.log(`\n⚠️  IMPORTANTE: Revise manualmente o arquivo e teste todas as funcionalidades!`);
