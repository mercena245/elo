// Funções auxiliares para disciplinas na tela de colaboradores

import { ref, get, db } from '../../firebase';

export async function fetchDisciplinas() {
  const snap = await get(ref(db, 'disciplinas'));
  if (snap.exists()) {
    const data = snap.val();
    return Object.entries(data).map(([id, val]) => ({ id, ...val }));
  }
  return [];
}
