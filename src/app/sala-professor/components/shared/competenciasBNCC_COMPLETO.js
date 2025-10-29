// Competências BNCC COMPLETAS - Base Nacional Comum Curricular
// Total: 642 competências e habilidades
// Última atualização: 29/10/2025

export const FAIXAS_ETARIAS = [
  { id: 'educacao_infantil_bebes', label: 'Educação Infantil - Bebês (0 a 1a6m)', ordem: 1 },
  { id: 'educacao_infantil_bem_pequenas', label: 'Educação Infantil - Crianças bem pequenas (1a7m a 3a11m)', ordem: 2 },
  { id: 'educacao_infantil_pequenas', label: 'Educação Infantil - Crianças pequenas (4a a 5a11m)', ordem: 3 },
  { id: 'fundamental_1_ano', label: 'Ensino Fundamental - 1º ano', ordem: 4 },
  { id: 'fundamental_2_ano', label: 'Ensino Fundamental - 2º ano', ordem: 5 },
  { id: 'fundamental_3_ano', label: 'Ensino Fundamental - 3º ano', ordem: 6 },
  { id: 'fundamental_4_ano', label: 'Ensino Fundamental - 4º ano', ordem: 7 },
  { id: 'fundamental_5_ano', label: 'Ensino Fundamental - 5º ano', ordem: 8 }
];

// Função auxiliar para obter todas as competências de forma plana para o Autocomplete
export function getAllCompetencias() {
  const competencias = [];
  
  Object.entries(COMPETENCIAS_BNCC).forEach(([faixaKey, faixaData]) => {
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

// Função para filtrar competências por faixa etária
export function getCompetenciasByFaixa(faixaId) {
  const faixa = COMPETENCIAS_BNCC[faixaId];
  if (!faixa) return [];
  
  return getAllCompetencias().filter(comp => 
    comp.faixa === faixa.titulo
  );
}

export const COMPETENCIAS_BNCC = {
  // =====================================================
  // EDUCAÇÃO INFANTIL - BEBÊS (0 a 1 ano e 6 meses)
  // =====================================================
  educacao_infantil_bebes: {
    titulo: 'Educação Infantil - Bebês (0 a 1a6m)',
    campos_experiencia: {
      'O eu, o outro e o nós': [
        { codigo: 'EI01EO01', descricao: 'Perceber que suas ações têm efeitos nas outras crianças e nos adultos.' },
        { codigo: 'EI01EO02', descricao: 'Perceber as possibilidades e os limites de seu corpo nas brincadeiras e interações das quais participa.' },
        { codigo: 'EI01EO03', descricao: 'Interagir com crianças da mesma faixa etária e adultos ao explorar espaços, materiais, objetos, brinquedos.' },
        { codigo: 'EI01EO04', descricao: 'Comunicar necessidades, desejos e emoções, utilizando gestos, balbucios, palavras.' },
        { codigo: 'EI01EO05', descricao: 'Reconhecer seu corpo e expressar suas sensações em momentos de alimentação, higiene, brincadeira e descanso.' },
        { codigo: 'EI01EO06', descricao: 'Interagir com outras crianças da mesma faixa etária e adultos, adaptando-se ao convívio social.' }
      ],
      'Corpo, gestos e movimentos': [
        { codigo: 'EI01CG01', descricao: 'Movimentar as partes do corpo para exprimir corporalmente emoções, necessidades e desejos.' },
        { codigo: 'EI01CG02', descricao: 'Experimentar as possibilidades corporais nas brincadeiras e interações em ambientes acolhedores e desafiantes.' },
        { codigo: 'EI01CG03', descricao: 'Imitar gestos e movimentos de outras crianças, adultos e animais.' },
        { codigo: 'EI01CG04', descricao: 'Participar do cuidado do seu corpo e da promoção do seu bem-estar.' },
        { codigo: 'EI01CG05', descricao: 'Utilizar os movimentos de preensão, encaixe e lançamento, ampliando suas possibilidades de manuseio de diferentes materiais e objetos.' }
      ],
      'Traços, sons, cores e formas': [
        { codigo: 'EI01TS01', descricao: 'Explorar sons produzidos com o próprio corpo e com objetos do ambiente.' },
        { codigo: 'EI01TS02', descricao: 'Traçar marcas gráficas, em diferentes suportes, usando instrumentos riscantes e tintas.' },
        { codigo: 'EI01TS03', descricao: 'Explorar diferentes fontes sonoras e materiais para acompanhar brincadeiras cantadas, canções, músicas e melodias.' }
      ],
      'Escuta, fala, pensamento e imaginação': [
        { codigo: 'EI01EF01', descricao: 'Reconhecer quando é chamado por seu nome e reconhecer os nomes de pessoas com quem convive.' },
        { codigo: 'EI01EF02', descricao: 'Demonstrar interesse ao ouvir a leitura de poemas e a apresentação de músicas.' },
        { codigo: 'EI01EF03', descricao: 'Demonstrar interesse ao ouvir histórias lidas ou contadas, observando ilustrações e os movimentos de leitura do adulto-leitor (modo de segurar o portador e de virar as páginas).' },
        { codigo: 'EI01EF04', descricao: 'Reconhecer elementos das ilustrações de histórias, apontando-os, a pedido do adulto-leitor.' },
        { codigo: 'EI01EF05', descricao: 'Imitar as variações de entonação e gestos realizados pelos adultos, ao ler histórias e ao cantar.' },
        { codigo: 'EI01EF06', descricao: 'Comunicar-se com outras pessoas usando movimentos, gestos, balbucios, fala e outras formas de expressão.' },
        { codigo: 'EI01EF07', descricao: 'Conhecer e manipular materiais impressos e audiovisuais em diferentes portadores (livro, revista, gibi, jornal, cartaz, CD, tablet etc.).' },
        { codigo: 'EI01EF08', descricao: 'Participar de situações de escuta de textos em diferentes gêneros textuais (poemas, fábulas, contos, receitas, quadrinhos, anúncios etc.).' },
        { codigo: 'EI01EF09', descricao: 'Conhecer e manipular diferentes instrumentos e suportes de escrita.' }
      ],
      'Espaços, tempos, quantidades, relações e transformações': [
        { codigo: 'EI01ET01', descricao: 'Explorar e descobrir as propriedades de objetos e materiais (odor, cor, sabor, temperatura).' },
        { codigo: 'EI01ET02', descricao: 'Explorar relações de causa e efeito (transbordar, tingir, misturar, mover e remover etc.) na interação com o mundo físico.' },
        { codigo: 'EI01ET03', descricao: 'Explorar o ambiente pela ação e observação, manipulando, experimentando e fazendo descobertas.' },
        { codigo: 'EI01ET04', descricao: 'Manipular, experimentar, arrumar e explorar o espaço por meio de experiências de deslocamentos de si e dos objetos.' },
        { codigo: 'EI01ET05', descricao: 'Manipular materiais diversos e variados para comparar as diferenças e semelhanças entre eles.' },
        { codigo: 'EI01ET06', descricao: 'Vivenciar diferentes ritmos, velocidades e fluxos nas interações e brincadeiras (em danças, balanços, escorregadores etc.).' }
      ]
    }
  },

  // Continuará na próxima parte...
};
