// Retorna um array de professores vinculados a uma disciplina específica
;

export async function getProfessoresPorDisciplina(disciplinaId) {
  const snap = await getData('usuarios');
  if (!snap.exists()) return [];
  const usuarios = snap.val();
  return Object.values(usuarios)
    .filter(u => Array.isArray(u.disciplinas) && u.disciplinas.includes(disciplinaId))
    .map(u => u.nome || u.email || u.id);
}
