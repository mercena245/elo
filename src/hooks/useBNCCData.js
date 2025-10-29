import { useState, useEffect } from 'react';

// Mapeamento de códigos BNCC para campos de experiência e disciplinas
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

/**
 * Hook para carregar e parsear dados do BNCC.md dinamicamente
 * Mantém compatibilidade com a estrutura original do competenciasBNCC.js
 */
export const useBNCCData = () => {
  const [competencias, setCompetencias] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBNCCData = async () => {
      try {
        // Verificar cache localStorage
        const cachedData = localStorage.getItem('bncc_competencias_cache');
        const cacheTimestamp = localStorage.getItem('bncc_cache_timestamp');
        const cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas

        if (cachedData && cacheTimestamp) {
          const age = Date.now() - parseInt(cacheTimestamp);
          if (age < cacheExpiry) {
            setCompetencias(JSON.parse(cachedData));
            setLoading(false);
            return;
          }
        }

        // Carregar arquivo BNCC.md
        const response = await fetch('/data/BNCC.md');
        if (!response.ok) {
          throw new Error('Não foi possível carregar o arquivo BNCC.md');
        }

        const markdownText = await response.text();
        const parsedData = parseBNCCMarkdown(markdownText);

        // Salvar no cache
        localStorage.setItem('bncc_competencias_cache', JSON.stringify(parsedData));
        localStorage.setItem('bncc_cache_timestamp', Date.now().toString());

        setCompetencias(parsedData);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar BNCC:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadBNCCData();
  }, []);

  return { competencias, loading, error };
};

/**
 * Parse do arquivo BNCC.md para a estrutura JavaScript
 */
function parseBNCCMarkdown(markdown) {
  const competenciasObj = {
    educacao_infantil_creche: {
      titulo: 'Educação Infantil - Bebês (0 a 1a6m)',
      campos_experiencia: {}
    },
    educacao_infantil_criancas_bem_pequenas: {
      titulo: 'Educação Infantil - Crianças bem pequenas (1a7m a 3a11m)',
      campos_experiencia: {}
    },
    educacao_infantil_pre_escola: {
      titulo: 'Educação Infantil - Pré-escola (4a a 5a11m)',
      campos_experiencia: {}
    },
    anos_iniciais_1_2: {
      titulo: 'Ensino Fundamental - Anos Iniciais (1º e 2º anos)',
      disciplinas: {}
    },
    anos_iniciais_3_4_5: {
      titulo: 'Ensino Fundamental - Anos Iniciais (3º, 4º e 5º anos)',
      disciplinas: {}
    },
    anos_finais_6_7: {
      titulo: 'Ensino Fundamental - Anos Finais (6º e 7º anos)',
      disciplinas: {}
    },
    anos_finais_8_9: {
      titulo: 'Ensino Fundamental - Anos Finais (8º e 9º anos)',
      disciplinas: {}
    },
    ensino_medio: {
      titulo: 'Ensino Médio',
      disciplinas: {}
    }
  };

  // Regex para capturar competências: **CODIGO** - Descrição
  const lines = markdown.split('\n');
  let currentSection = null;
  let currentSubsection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detectar seções principais
    if (line.startsWith('## ')) {
      const sectionTitle = line.replace('## ', '').trim();
      
      if (sectionTitle.includes('Educação Infantil')) {
        if (sectionTitle.includes('Bebês')) {
          currentSection = 'educacao_infantil_creche';
        } else if (sectionTitle.includes('bem pequenas')) {
          currentSection = 'educacao_infantil_criancas_bem_pequenas';
        } else if (sectionTitle.includes('Pré-escola')) {
          currentSection = 'educacao_infantil_pre_escola';
        }
      } else if (sectionTitle.includes('Língua Portuguesa')) {
        currentSection = 'lingua_portuguesa';
      } else if (sectionTitle.includes('Arte')) {
        currentSection = 'arte';
      } else if (sectionTitle.includes('Educação Física')) {
        currentSection = 'educacao_fisica';
      } else if (sectionTitle.includes('Matemática')) {
        currentSection = 'matematica';
      } else if (sectionTitle.includes('Ciências')) {
        currentSection = 'ciencias';
      } else if (sectionTitle.includes('Geografia')) {
        currentSection = 'geografia';
      } else if (sectionTitle.includes('História')) {
        currentSection = 'historia';
      } else if (sectionTitle.includes('Ensino Religioso')) {
        currentSection = 'ensino_religioso';
      }
      continue;
    }

    // Detectar subseções (campos de experiência ou anos)
    if (line.startsWith('### ')) {
      currentSubsection = line.replace('### ', '').trim();
      continue;
    }

    // Capturar competências: **CODIGO** - Descrição (pode estar em múltiplas linhas)
    const match = line.match(/^\*\*([A-Z0-9]+)\*\*\s*-\s*(.+)/);
    if (match) {
      const codigo = match[1];
      let descricao = match[2];

      // Capturar linhas adicionais da descrição
      let j = i + 1;
      while (j < lines.length && lines[j].trim() && !lines[j].trim().startsWith('**') && !lines[j].trim().startsWith('#')) {
        descricao += ' ' + lines[j].trim();
        j++;
      }
      i = j - 1;

      // Adicionar competência ao objeto correto
      addCompetenciaToStructure(competenciasObj, codigo, descricao, currentSection, currentSubsection);
    }
  }

  return competenciasObj;
}

/**
 * Adiciona competência à estrutura correta baseada no código
 */
function addCompetenciaToStructure(obj, codigo, descricao, section, subsection) {
  // Educação Infantil (EI01, EI02, EI03)
  if (codigo.startsWith('EI')) {
    const nivel = codigo.substring(0, 4); // EI01, EI02, EI03
    const campo = codigo.substring(4, 6); // EO, CG, TS, EF, ET
    const campoNome = CAMPOS_EXPERIENCIA_MAP[campo];

    let targetKey;
    if (nivel === 'EI01') {
      targetKey = 'educacao_infantil_creche';
    } else if (nivel === 'EI02') {
      targetKey = 'educacao_infantil_criancas_bem_pequenas';
    } else if (nivel === 'EI03') {
      targetKey = 'educacao_infantil_pre_escola';
    }

    if (targetKey && campoNome) {
      if (!obj[targetKey].campos_experiencia[campoNome]) {
        obj[targetKey].campos_experiencia[campoNome] = [];
      }
      obj[targetKey].campos_experiencia[campoNome].push({ codigo, descricao });
    }
  }
  // Ensino Fundamental (EF)
  else if (codigo.startsWith('EF')) {
    // Extrair ano e disciplina do código (ex: EF01LP, EF15AR, EF35EF)
    const anoMatch = codigo.match(/^EF(\d{2})/);
    if (!anoMatch) return;

    const ano = anoMatch[1];
    const disciplinaCode = codigo.substring(4, 6);
    const disciplinaNome = DISCIPLINAS_MAP[disciplinaCode];

    if (!disciplinaNome) return;

    // Determinar faixa etária
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
    }
  }
}

/**
 * Função auxiliar para obter todas as competências de uma faixa etária
 */
export const getCompetenciasByFaixa = (competenciasObj, faixaKey) => {
  if (!competenciasObj || !competenciasObj[faixaKey]) return [];

  const faixa = competenciasObj[faixaKey];
  const competencias = [];

  // Educação Infantil - Campos de Experiência
  if (faixa.campos_experiencia) {
    Object.entries(faixa.campos_experiencia).forEach(([campo, comps]) => {
      competencias.push(...comps);
    });
  }

  // Ensino Fundamental - Disciplinas
  if (faixa.disciplinas) {
    Object.entries(faixa.disciplinas).forEach(([disciplina, comps]) => {
      competencias.push(...comps);
    });
  }

  return competencias;
};

/**
 * Função auxiliar para obter todas as competências
 */
export const getAllCompetencias = (competenciasObj) => {
  if (!competenciasObj) return [];

  const todasCompetencias = [];
  Object.keys(competenciasObj).forEach(faixaKey => {
    todasCompetencias.push(...getCompetenciasByFaixa(competenciasObj, faixaKey));
  });

  return todasCompetencias;
};

export default useBNCCData;
