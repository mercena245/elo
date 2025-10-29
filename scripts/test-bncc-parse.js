/**
 * Script para testar o parse do BNCC.md
 * Verifica se todas as 642 competências são carregadas corretamente
 */

const fs = require('fs');
const path = require('path');

// Mapeamentos
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

function addCompetencia(obj, codigo, descricao) {
  // Educação Infantil (EI01, EI02, EI03)
  if (codigo.startsWith('EI')) {
    const nivel = codigo.substring(0, 4);
    const campo = codigo.substring(4, 6);
    const campoNome = CAMPOS_EXPERIENCIA_MAP[campo];

    let targetKey;
    if (nivel === 'EI01') targetKey = 'educacao_infantil_creche';
    else if (nivel === 'EI02') targetKey = 'educacao_infantil_criancas_bem_pequenas';
    else if (nivel === 'EI03') targetKey = 'educacao_infantil_pre_escola';

    if (targetKey && campoNome) {
      if (!obj[targetKey].campos_experiencia[campoNome]) {
        obj[targetKey].campos_experiencia[campoNome] = [];
      }
      obj[targetKey].campos_experiencia[campoNome].push({ codigo, descricao });
      return true;
    }
  }
  // Ensino Fundamental
  else if (codigo.startsWith('EF')) {
    const anoMatch = codigo.match(/^EF(\d{2})/);
    if (!anoMatch) return false;

    const ano = anoMatch[1];
    const disciplinaCode = codigo.substring(4, 6);
    const disciplinaNome = DISCIPLINAS_MAP[disciplinaCode];

    if (!disciplinaNome) return false;

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
      return true;
    }
  }
  
  return false;
}

function parseBNCCMarkdown(markdown) {
  const competenciasObj = createEmptyStructure();
  const lines = markdown.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Capturar competências: **CODIGO** - Descrição
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

      // Adicionar competência
      addCompetencia(competenciasObj, codigo, descricao);
    }
  }

  return competenciasObj;
}

function contarCompetencias(obj) {
  let total = 0;
  const detalhes = {};

  Object.entries(obj).forEach(([faixaKey, faixaData]) => {
    let faixaTotal = 0;

    if (faixaData.campos_experiencia) {
      Object.entries(faixaData.campos_experiencia).forEach(([campo, lista]) => {
        faixaTotal += lista.length;
      });
      detalhes[faixaKey] = { tipo: 'Educação Infantil', total: faixaTotal, campos: Object.keys(faixaData.campos_experiencia).length };
    } else if (faixaData.disciplinas) {
      Object.entries(faixaData.disciplinas).forEach(([disciplina, lista]) => {
        faixaTotal += lista.length;
      });
      detalhes[faixaKey] = { tipo: 'Ensino Fundamental', total: faixaTotal, disciplinas: Object.keys(faixaData.disciplinas).length };
    }

    total += faixaTotal;
  });

  return { total, detalhes };
}

// Executar teste
console.log('🧪 Testando parse do BNCC.md...\n');

const bnccPath = path.join(__dirname, '..', 'public', 'data', 'BNCC.md');
const markdown = fs.readFileSync(bnccPath, 'utf-8');

console.log(`📄 Arquivo carregado: ${bnccPath}`);
console.log(`📏 Tamanho: ${markdown.length} caracteres\n`);

const resultado = parseBNCCMarkdown(markdown);
const { total, detalhes } = contarCompetencias(resultado);

console.log('📊 RESULTADO DO PARSE:\n');
console.log(`✅ Total de competências encontradas: ${total}\n`);

console.log('📋 Detalhamento por faixa etária:\n');
Object.entries(detalhes).forEach(([faixa, info]) => {
  console.log(`  ${faixa}:`);
  console.log(`    Tipo: ${info.tipo}`);
  console.log(`    Total: ${info.total} competências`);
  if (info.campos) {
    console.log(`    Campos de Experiência: ${info.campos}`);
  }
  if (info.disciplinas) {
    console.log(`    Disciplinas: ${info.disciplinas}`);
  }
  console.log('');
});

// Validação
const esperado = 642;
if (total === esperado) {
  console.log(`✅ SUCESSO! Parse capturou todas as ${esperado} competências esperadas!`);
} else {
  console.log(`⚠️  ATENÇÃO! Esperado: ${esperado}, Encontrado: ${total}`);
  console.log(`   Diferença: ${esperado - total} competências`);
}

// Exemplos de competências parseadas
console.log('\n📖 Exemplos de competências parseadas:\n');
const exemplo1 = resultado.educacao_infantil_creche.campos_experiencia['O eu, o outro e o nós']?.[0];
if (exemplo1) {
  console.log(`EI01 - ${exemplo1.codigo}: ${exemplo1.descricao.substring(0, 100)}...`);
}

const exemplo2 = resultado.anos_iniciais_1_2.disciplinas['Língua Portuguesa']?.[0];
if (exemplo2) {
  console.log(`EF (1º-2º) - ${exemplo2.codigo}: ${exemplo2.descricao.substring(0, 100)}...`);
}

console.log('\n🎉 Teste concluído!');
