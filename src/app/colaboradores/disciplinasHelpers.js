// Funções auxiliares para disciplinas na tela de colaboradores

;

export async function fetchDisciplinas() {
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  const snap = await getData('disciplinas');
  if (snap.exists()) {
    const data = snap.val();
    return Object.entries(data).map(([id, val]) => ({ id, ...val }));
  }
  return [];
}
