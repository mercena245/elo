// Wrapper para manter compatibilidade com o código existente
// enquanto usa o carregamento dinâmico do BNCC.md

export const FAIXAS_ETARIAS = [
  { id: 'educacao_infantil_creche', label: 'Educação Infantil - Bebês (0 a 1a6m)', ordem: 1 },
  { id: 'educacao_infantil_criancas_bem_pequenas', label: 'Educação Infantil - Crianças bem pequenas (1a7m a 3a11m)', ordem: 2 },
  { id: 'educacao_infantil_pre_escola', label: 'Educação Infantil - Pré-escola (4a a 5a11m)', ordem: 3 },
  { id: 'anos_iniciais_1_2', label: 'Ensino Fundamental - Anos Iniciais (1º e 2º anos)', ordem: 4 },
  { id: 'anos_iniciais_3_4_5', label: 'Ensino Fundamental - Anos Iniciais (3º, 4º e 5º anos)', ordem: 5 },
  { id: 'anos_finais_6_7', label: 'Ensino Fundamental - Anos Finais (6º e 7º anos)', ordem: 6 },
  { id: 'anos_finais_8_9', label: 'Ensino Fundamental - Anos Finais (8º e 9º anos)', ordem: 7 },
  { id: 'ensino_medio', label: 'Ensino Médio', ordem: 8 }
];

// Singleton para armazenar os dados carregados
let competenciasCache = null;
let loadingPromise = null;

/**
 * Carrega os dados do BNCC.md dinamicamente
 */
async function loadBNCCData() {
  // Se já está carregado, retorna o cache
  if (competenciasCache) {
    return competenciasCache;
  }

  // Se já está carregando, aguarda o carregamento
  if (loadingPromise) {
    return loadingPromise;
  }

  // Inicia o carregamento
  loadingPromise = (async () => {
    try {
      // Tenta carregar do cache do localStorage
      const cachedData = localStorage.getItem('bncc_competencias_cache');
      const cacheTimestamp = localStorage.getItem('bncc_cache_timestamp');
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas
      
      // FORÇA RELOAD se o cache não tiver competências nos anos finais OU no ensino médio
      let parsedCache = null;
      let needsReload = false;
      
      if (cachedData) {
        parsedCache = JSON.parse(cachedData);
        // Verifica se anos_finais_6_7 tem disciplinas populadas
        const anosFinais6_7 = parsedCache?.anos_finais_6_7?.disciplinas || {};
        const temAnosFinais = Object.keys(anosFinais6_7).length > 0;
        
        // Verifica se ensino_medio tem disciplinas populadas
        const ensinoMedio = parsedCache?.ensino_medio?.disciplinas || {};
        const temEnsinoMedio = Object.keys(ensinoMedio).length > 0;
        
        needsReload = !temAnosFinais || !temEnsinoMedio;
        
        if (needsReload) {
          console.log('🔄 Cache antigo detectado (faltando Anos Finais ou Ensino Médio). Forçando reload...');
        }
      }

      if (cachedData && cacheTimestamp && !needsReload) {
        const age = Date.now() - parseInt(cacheTimestamp);
        if (age < cacheExpiry) {
          console.log('📦 Usando cache do BNCC');
          competenciasCache = parsedCache;
          return competenciasCache;
        }
      }

      // Carrega do arquivo
      console.log('📥 Carregando BNCC.md do servidor...');
      const response = await fetch('/data/BNCC.md');
      if (!response.ok) {
        throw new Error('Não foi possível carregar o arquivo BNCC.md');
      }

      const markdownText = await response.text();
      console.log(`📄 Arquivo carregado: ${markdownText.length} caracteres`);
      competenciasCache = parseBNCCMarkdown(markdownText);

      // Verifica quantas competências foram carregadas nos Anos Finais
      const anosFinais6_7 = competenciasCache?.anos_finais_6_7?.disciplinas || {};
      const totalAnosFinais = Object.values(anosFinais6_7).reduce((sum, lista) => sum + lista.length, 0);
      console.log(`📊 Anos Finais 6º-7º: ${totalAnosFinais} competências carregadas`);

      // Salva no cache
      localStorage.setItem('bncc_competencias_cache', JSON.stringify(competenciasCache));
      localStorage.setItem('bncc_cache_timestamp', Date.now().toString());
      console.log('💾 Cache salvo no localStorage');

      return competenciasCache;
    } catch (error) {
      console.error('Erro ao carregar BNCC:', error);
      // Retorna estrutura vazia em caso de erro
      return createEmptyStructure();
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Cria estrutura vazia para fallback
 */
function createEmptyStructure() {
  return {
    educacao_infantil_creche: { titulo: 'Educação Infantil - Bebês (0 a 1a6m)', campos_experiencia: {} },
    educacao_infantil_criancas_bem_pequenas: { titulo: 'Educação Infantil - Crianças bem pequenas (1a7m a 3a11m)', campos_experiencia: {} },
    educacao_infantil_pre_escola: { titulo: 'Educação Infantil - Pré-escola (4a a 5a11m)', campos_experiencia: {} },
    anos_iniciais_1_2: { titulo: 'Ensino Fundamental - Anos Iniciais (1º e 2º anos)', disciplinas: {} },
    anos_iniciais_3_4_5: { titulo: 'Ensino Fundamental - Anos Iniciais (3º, 4º e 5º anos)', disciplinas: {} },
    anos_finais_6_7: { titulo: 'Ensino Fundamental - Anos Finais (6º e 7º anos)', disciplinas: {} },
    anos_finais_8_9: { titulo: 'Ensino Fundamental - Anos Finais (8º e 9º anos)', disciplinas: {} },
    ensino_medio: { titulo: 'Ensino Médio', disciplinas: {} }
  };
}

/**
 * Parse do markdown para estrutura de dados
 */
function parseBNCCMarkdown(markdown) {
  console.log('🔄 Iniciando parse do BNCC.md...');
  const competenciasObj = createEmptyStructure();

  const CAMPOS_EXPERIENCIA_MAP = {
    'EO': 'O eu, o outro e o nós',
    'CG': 'Corpo, gestos e movimentos',
    'TS': 'Traços, sons, cores e formas',
    'EF': 'Escuta, fala, pensamento e imaginação',
    'ET': 'Espaços, tempos, quantidades, relações e transformações'
  };

  const DISCIPLINAS_MAP = {
    'LP': 'Língua Portuguesa',
    'AR': 'Arte',
    'EF': 'Educação Física',
    'MA': 'Matemática',
    'CI': 'Ciências',
    'GE': 'Geografia',
    'HI': 'História',
    'ER': 'Ensino Religioso'
  };

  const lines = markdown.split('\n');
  let emCount = 0; // Contador de códigos EM encontrados

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Capturar competências: **CODIGO** - Descrição
    const match = line.match(/^\*\*([A-Z0-9]+)\*\*\s*-\s*(.+)/);
    if (match) {
      const codigo = match[1];
      let descricao = match[2];
      
      // Log para códigos EM
      if (codigo.startsWith('EM13MAT')) {
        emCount++;
        if (emCount <= 3) {
          console.log(`📌 Código EM encontrado: ${codigo}`);
        }
      }

      // Capturar linhas adicionais da descrição
      let j = i + 1;
      while (j < lines.length && lines[j].trim() && !lines[j].trim().startsWith('**') && !lines[j].trim().startsWith('#')) {
        descricao += ' ' + lines[j].trim();
        j++;
      }
      i = j - 1;

      // Adicionar competência
      addCompetencia(competenciasObj, codigo, descricao, CAMPOS_EXPERIENCIA_MAP, DISCIPLINAS_MAP);
    }
  }

  console.log(`📊 Total de códigos EM13MAT encontrados no parse: ${emCount}`);
  
  // Log das competências adicionadas ao Ensino Médio
  const emAdicionadas = competenciasObj.ensino_medio?.disciplinas?.Matemática?.length || 0;
  console.log(`✅ Total de ${emAdicionadas} competências adicionadas ao Ensino Médio`);
  
  console.log('✅ Parse concluído:', competenciasObj);
  return competenciasObj;
}

/**
 * Adiciona competência à estrutura
 */
function addCompetencia(obj, codigo, descricao, camposMap, disciplinasMap) {
  // Educação Infantil (EI01, EI02, EI03)
  if (codigo.startsWith('EI')) {
    const nivel = codigo.substring(0, 4);
    const campo = codigo.substring(4, 6);
    const campoNome = camposMap[campo];

    let targetKey;
    if (nivel === 'EI01') targetKey = 'educacao_infantil_creche';
    else if (nivel === 'EI02') targetKey = 'educacao_infantil_criancas_bem_pequenas';
    else if (nivel === 'EI03') targetKey = 'educacao_infantil_pre_escola';

    if (targetKey && campoNome) {
      if (!obj[targetKey].campos_experiencia[campoNome]) {
        obj[targetKey].campos_experiencia[campoNome] = [];
      }
      obj[targetKey].campos_experiencia[campoNome].push({ codigo, descricao });
    }
  }
  // Ensino Médio (EM13MAT)
  else if (codigo.startsWith('EM13MAT')) {
    const targetKey = 'ensino_medio';
    const disciplinaNome = 'Matemática';

    if (!obj[targetKey].disciplinas[disciplinaNome]) {
      obj[targetKey].disciplinas[disciplinaNome] = [];
      console.log(`✅ Criando array Matemática para Ensino Médio`);
    }
    obj[targetKey].disciplinas[disciplinaNome].push({ codigo, descricao });
    
    // Log das primeiras 3
    if (obj[targetKey].disciplinas[disciplinaNome].length <= 3) {
      console.log(`✅ Competência EM adicionada: ${codigo} em ensino_medio > Matemática`);
    }
  }
  // Ensino Fundamental
  else if (codigo.startsWith('EF')) {
    const anoMatch = codigo.match(/^EF(\d{2})/);
    if (!anoMatch) return;

    const ano = anoMatch[1];
    const disciplinaCode = codigo.substring(4, 6);
    const disciplinaNome = disciplinasMap[disciplinaCode];

    if (!disciplinaNome) {
      console.log(`⚠️ Disciplina não encontrada para código ${codigo}: disciplinaCode=${disciplinaCode}`);
      return;
    }

    let targetKey;
    const anoNum = parseInt(ano);

    if (anoNum >= 1 && anoNum <= 2 || ano === '12' || ano === '15') {
      targetKey = 'anos_iniciais_1_2';
    } else if (anoNum >= 3 && anoNum <= 5 || ano === '35') {
      targetKey = 'anos_iniciais_3_4_5';
    } else if (anoNum >= 6 && anoNum <= 7 || ano === '67') {
      targetKey = 'anos_finais_6_7';
    } else if (anoNum >= 8 && anoNum <= 9 || ano === '89') {
      targetKey = 'anos_finais_8_9';
    }

    if (targetKey) {
      if (!obj[targetKey].disciplinas[disciplinaNome]) {
        obj[targetKey].disciplinas[disciplinaNome] = [];
      }
      obj[targetKey].disciplinas[disciplinaNome].push({ codigo, descricao });
      // Log apenas a primeira competência de cada disciplina/faixa para não poluir o console
      if (obj[targetKey].disciplinas[disciplinaNome].length === 1) {
        console.log(`✅ Primeira competência adicionada: ${codigo} em ${targetKey} > ${disciplinaNome}`);
      }
    } else {
      console.log(`⚠️ Target key não definida para código ${codigo}: ano=${ano}, anoNum=${parseInt(ano)}`);
    }
  }
}

/**
 * Obtém todas as competências em formato plano
 */
export async function getAllCompetencias() {
  const data = await loadBNCCData();
  const competencias = [];

  Object.entries(data).forEach(([faixaKey, faixaData]) => {
    if (faixaData.campos_experiencia) {
      // Educação Infantil
      Object.entries(faixaData.campos_experiencia).forEach(([campo, lista]) => {
        lista.forEach(comp => {
          competencias.push({
            ...comp,
            faixa: faixaData.titulo,
            campo,
            tipo: 'educacao_infantil'
          });
        });
      });
    } else if (faixaData.disciplinas) {
      // Ensino Fundamental
      Object.entries(faixaData.disciplinas).forEach(([disciplina, lista]) => {
        lista.forEach(comp => {
          competencias.push({
            ...comp,
            faixa: faixaData.titulo,
            disciplina,
            tipo: 'ensino_fundamental'
          });
        });
      });
    }
  });

  return competencias;
}

/**
 * Obtém competências de uma faixa etária específica
 */
export async function getCompetenciasByFaixa(faixaId) {
  console.log(`🔍 Buscando competências para faixa: ${faixaId}`);
  const data = await loadBNCCData();
  
  if (!data[faixaId]) {
    console.log(`⚠️ Faixa ${faixaId} não encontrada no data`);
    console.log('Faixas disponíveis:', Object.keys(data));
    return [];
  }

  const competencias = [];
  const faixa = data[faixaId];
  console.log(`📚 Faixa encontrada:`, faixa);

  if (faixa.campos_experiencia) {
    Object.entries(faixa.campos_experiencia).forEach(([campo, lista]) => {
      lista.forEach(comp => {
        competencias.push({
          ...comp,
          faixa: faixa.titulo,
          campo,
          tipo: 'educacao_infantil'
        });
      });
    });
  } else if (faixa.disciplinas) {
    Object.entries(faixa.disciplinas).forEach(([disciplina, lista]) => {
      lista.forEach(comp => {
        competencias.push({
          ...comp,
          faixa: faixa.titulo,
          disciplina,
          tipo: 'ensino_fundamental'
        });
      });
    });
  }

  console.log(`✅ Total de ${competencias.length} competências encontradas para ${faixaId}`);
  return competencias;
}

/**
 * Alias para manter compatibilidade
 */
export const obterCompetenciasFlat = getCompetenciasByFaixa;

/**
 * Limpa o cache (útil para forçar recarregamento)
 */
export function clearCache() {
  competenciasCache = null;
  localStorage.removeItem('bncc_competencias_cache');
  localStorage.removeItem('bncc_cache_timestamp');
}

// Export default nomeado para evitar warning do ESLint
const BNCCModule = { 
  FAIXAS_ETARIAS, 
  getAllCompetencias, 
  getCompetenciasByFaixa,
  obterCompetenciasFlat,
  clearCache 
};

export default BNCCModule;
