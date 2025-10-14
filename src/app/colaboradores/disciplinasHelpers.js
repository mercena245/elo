// Funções auxiliares para disciplinas na tela de colaboradores

/**
 * Busca disciplinas do banco da escola
 * @param {Function} getData - Função getData do hook useSchoolDatabase
 * @returns {Promise<Array>} Lista de disciplinas
 */
export async function fetchDisciplinas(getData) {
  try {
    const data = await getData('disciplinas');
    if (data) {
      return Object.entries(data).map(([id, val]) => ({ id, ...val }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    return [];
  }
}
