// Retorna um array de professores vinculados a uma disciplina específica
import { ref, get, db } from '../../../firebase';

export async function getProfessoresPorDisciplina(disciplinaId) {
  const snap = await get(ref(db, 'usuarios'));
  if (!snap.exists()) return [];
  const usuarios = snap.val();
  return Object.values(usuarios)
    .filter(u => Array.isArray(u.disciplinas) && u.disciplinas.includes(disciplinaId))
    .map(u => u.nome || u.email || u.id);
}
