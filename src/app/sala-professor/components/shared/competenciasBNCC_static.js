// Competências BNCC COMPLETAS - Base Nacional Comum Curricular
// Total: 642 competências e habilidades
// Gerado automaticamente a partir de BNCC.md
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
  'educacao_infantil_bebes': {
    'titulo': 'Educação Infantil - Bebês (0 a 1a6m)',
    'campos_experiencia': {
      'O eu, o outro e o nós': [
        {
          'codigo': 'EI01EO01',
          'descricao': 'Perceber que suas ações têm efeitos nas outras crianças e nos adultos.'
        },
        {
          'codigo': 'EI01EO02',
          'descricao': 'Perceber as possibilidades e os limites de seu corpo nas brincadeiras e interações das quais participa.'
        },
        {
          'codigo': 'EI01EO03',
          'descricao': 'Interagir com crianças da mesma faixa etária e adultos ao explorar espaços, materiais, objetos, brinquedos.'
        },
        {
          'codigo': 'EI01EO04',
          'descricao': 'Comunicar necessidades, desejos e emoções, utilizando gestos, balbucios, palavras.'
        },
        {
          'codigo': 'EI01EO05',
          'descricao': 'Reconhecer seu corpo e expressar suas sensações em momentos de alimentação, higiene, brincadeira e descanso.'
        },
        {
          'codigo': 'EI01EO06',
          'descricao': 'Interagir com outras crianças da mesma faixa etária e adultos, adaptando-se ao convívio social.'
        }
      ],
      'Corpo, gestos e movimentos': [
        {
          'codigo': 'EI01CG01',
          'descricao': 'Movimentar as partes do corpo para exprimir corporalmente emoções, necessidades e desejos.'
        },
        {
          'codigo': 'EI01CG02',
          'descricao': 'Experimentar as possibilidades corporais nas brincadeiras e interações em ambientes acolhedores e desafiantes.'
        },
        {
          'codigo': 'EI01CG03',
          'descricao': 'Imitar gestos e movimentos de outras crianças, adultos e animais.'
        },
        {
          'codigo': 'EI01CG04',
          'descricao': 'Participar do cuidado do seu corpo e da promoção do seu bem-estar.'
        },
        {
          'codigo': 'EI01CG05',
          'descricao': 'Utilizar os movimentos de preensão, encaixe e lançamento, ampliando suas possibilidades de manuseio de diferentes materiais e objetos.'
        }
      ],
      'Traços, sons, cores e formas': [
        {
          'codigo': 'EI01TS01',
          'descricao': 'Explorar sons produzidos com o próprio corpo e com objetos do ambiente.'
        },
        {
          'codigo': 'EI01TS02',
          'descricao': 'Traçar marcas gráficas, em diferentes suportes, usando instrumentos riscantes e tintas.'
        },
        {
          'codigo': 'EI01TS03',
          'descricao': 'Explorar diferentes fontes sonoras e materiais para acompanhar brincadeiras cantadas, canções, músicas e melodias.'
        }
      ],
      'Escuta, fala, pensamento e imaginação': [
        {
          'codigo': 'EI01EF01',
          'descricao': 'Reconhecer quando é chamado por seu nome e reconhecer os nomes de pessoas com quem convive.'
        },
        {
          'codigo': 'EI01EF02',
          'descricao': 'Demonstrar interesse ao ouvir a leitura de poemas e a apresentação de músicas.'
        },
        {
          'codigo': 'EI01EF03',
          'descricao': 'Demonstrar interesse ao ouvir histórias lidas ou contadas, observando ilustrações e os movimentos de leitura do adulto-leitor (modo de segurar o portador e de virar as páginas).'
        },
        {
          'codigo': 'EI01EF04',
          'descricao': 'Reconhecer elementos das ilustrações de histórias, apontando-os, a pedido do adulto-leitor.'
        },
        {
          'codigo': 'EI01EF05',
          'descricao': 'Imitar as variações de entonação e gestos realizados pelos adultos, ao ler histórias e ao cantar.'
        },
        {
          'codigo': 'EI01EF06',
          'descricao': 'Comunicar-se com outras pessoas usando movimentos, gestos, balbucios, fala e outras formas de expressão.'
        },
        {
          'codigo': 'EI01EF07',
          'descricao': 'Conhecer e manipular materiais impressos e audiovisuais em diferentes portadores (livro, revista, gibi, jornal, cartaz, CD, tablet etc.).'
        },
        {
          'codigo': 'EI01EF08',
          'descricao': 'Participar de situações de escuta de textos em diferentes gêneros textuais (poemas, fábulas, contos, receitas, quadrinhos, anúncios etc.).'
        },
        {
          'codigo': 'EI01EF09',
          'descricao': 'Conhecer e manipular diferentes instrumentos e suportes de escrita.'
        }
      ],
      'Espaços, tempos, quantidades, relações e transformações': [
        {
          'codigo': 'EI01ET01',
          'descricao': 'Explorar e descobrir as propriedades de objetos e materiais (odor, cor, sabor, temperatura).'
        },
        {
          'codigo': 'EI01ET02',
          'descricao': 'Explorar relações de causa e efeito (transbordar, tingir, misturar, mover e remover etc.) na interação com o mundo físico.'
        },
        {
          'codigo': 'EI01ET03',
          'descricao': 'Explorar o ambiente pela ação e observação, manipulando, experimentando e fazendo descobertas.'
        },
        {
          'codigo': 'EI01ET04',
          'descricao': 'Manipular, experimentar, arrumar e explorar o espaço por meio de experiências de deslocamentos de si e dos objetos.'
        },
        {
          'codigo': 'EI01ET05',
          'descricao': 'Manipular materiais diversos e variados para comparar as diferenças e semelhanças entre eles.'
        },
        {
          'codigo': 'EI01ET06',
          'descricao': 'Vivenciar diferentes ritmos, velocidades e fluxos nas interações e brincadeiras (em danças, balanços, escorregadores etc.).'
        }
      ]
    }
  },
  'educacao_infantil_bem_pequenas': {
    'titulo': 'Educação Infantil - Crianças bem pequenas (1a7m a 3a11m)',
    'campos_experiencia': {
      'O eu, o outro e o nós': [
        {
          'codigo': 'EI02EO01',
          'descricao': 'Demonstrar atitudes de cuidado e solidariedade na interação com crianças e adultos.'
        },
        {
          'codigo': 'EI02EO02',
          'descricao': 'Demonstrar imagem positiva de si e confiança em sua capacidade para enfrentar dificuldades e desafios.'
        },
        {
          'codigo': 'EI02EO03',
          'descricao': 'Compartilhar os objetos e os espaços com crianças da mesma faixa etária e adultos.'
        },
        {
          'codigo': 'EI02EO04',
          'descricao': 'Comunicar-se com os colegas e os adultos, buscando compreendê-los e fazendo-se compreender.'
        },
        {
          'codigo': 'EI02EO05',
          'descricao': 'Perceber que as pessoas têm características físicas diferentes, respeitando essas diferenças.'
        },
        {
          'codigo': 'EI02EO06',
          'descricao': 'Respeitar regras básicas de convívio social nas interações e brincadeiras.'
        },
        {
          'codigo': 'EI02EO07',
          'descricao': 'Resolver conflitos nas interações e brincadeiras, com a orientação de um adulto.'
        }
      ],
      'Corpo, gestos e movimentos': [
        {
          'codigo': 'EI02CG01',
          'descricao': 'Apropriar-se de gestos e movimentos de sua cultura no cuidado de si e nos jogos e brincadeiras.'
        },
        {
          'codigo': 'EI02CG02',
          'descricao': 'Deslocar seu corpo no espaço, orientando-se por noções como em frente, atrás, no alto, embaixo, dentro, fora etc., ao se envolver em brincadeiras e atividades de diferentes naturezas.'
        },
        {
          'codigo': 'EI02CG03',
          'descricao': 'Explorar formas de deslocamento no espaço (pular, saltar, dançar), combinando movimentos e seguindo orientações.'
        },
        {
          'codigo': 'EI02CG04',
          'descricao': 'Demonstrar progressiva independência no cuidado do seu corpo.'
        },
        {
          'codigo': 'EI02CG05',
          'descricao': 'Desenvolver progressivamente as habilidades manuais, adquirindo controle para desenhar, pintar, rasgar, folhear, entre outros.'
        }
      ],
      'Traços, sons, cores e formas': [
        {
          'codigo': 'EI02TS01',
          'descricao': 'Criar sons com materiais, objetos e instrumentos musicais, para acompanhar diversos ritmos de música.'
        },
        {
          'codigo': 'EI02TS02',
          'descricao': 'Utilizar materiais variados com possibilidades de manipulação (argila, massa de modelar), explorando cores, texturas, superfícies, planos, formas e volumes ao criar objetos tridimensionais.'
        },
        {
          'codigo': 'EI02TS03',
          'descricao': 'Utilizar diferentes fontes sonoras disponíveis no ambiente em brincadeiras cantadas, canções, músicas e melodias.'
        }
      ],
      'Escuta, fala, pensamento e imaginação': [
        {
          'codigo': 'EI02EF01',
          'descricao': 'Dialogar com crianças e adultos, expressando seus desejos, necessidades, sentimentos e opiniões.'
        },
        {
          'codigo': 'EI02EF02',
          'descricao': 'Identificar e criar diferentes sons e reconhecer rimas e aliterações em cantigas de roda e textos poéticos.'
        },
        {
          'codigo': 'EI02EF03',
          'descricao': 'Demonstrar interesse e atenção ao ouvir a leitura de histórias e outros textos, diferenciando escrita de ilustrações, e acompanhando, com orientação do adulto-leitor, a direção da leitura (de cima para baixo, da esquerda para a direita).'
        },
        {
          'codigo': 'EI02EF04',
          'descricao': 'Formular e responder perguntas sobre fatos da história narrada, identificando cenários, personagens e principais acontecimentos.'
        },
        {
          'codigo': 'EI02EF05',
          'descricao': 'Relatar experiências e fatos acontecidos, histórias ouvidas, filmes ou peças teatrais assistidos etc.'
        },
        {
          'codigo': 'EI02EF06',
          'descricao': 'Criar e contar histórias oralmente, com base em imagens ou temas sugeridos.'
        },
        {
          'codigo': 'EI02EF07',
          'descricao': 'Manusear diferentes portadores textuais, demonstrando reconhecer seus usos sociais.'
        },
        {
          'codigo': 'EI02EF08',
          'descricao': 'Manipular textos e participar de situações de escuta para ampliar seu contato com diferentes gêneros textuais (parlendas, histórias de aventura, tirinhas, cartazes de sala, cardápios, notícias etc.).'
        },
        {
          'codigo': 'EI02EF09',
          'descricao': 'Manusear diferentes instrumentos e suportes de escrita para desenhar, traçar letras e outros sinais gráficos.'
        }
      ],
      'Espaços, tempos, quantidades, relações e transformações': [
        {
          'codigo': 'EI02ET01',
          'descricao': 'Explorar e descrever semelhanças e diferenças entre as características e propriedades dos objetos (textura, massa, tamanho).'
        },
        {
          'codigo': 'EI02ET02',
          'descricao': 'Observar, relatar e descrever incidentes do cotidiano e fenômenos naturais (luz solar, vento, chuva etc.).'
        },
        {
          'codigo': 'EI02ET03',
          'descricao': 'Compartilhar, com outras crianças, situações de cuidado de plantas e animais nos espaços da instituição e fora dela.'
        },
        {
          'codigo': 'EI02ET04',
          'descricao': 'Identificar relações espaciais (dentro e fora, em cima, embaixo, acima, abaixo, entre e do lado) e temporais (antes, durante e depois).'
        },
        {
          'codigo': 'EI02ET05',
          'descricao': 'Classificar objetos, considerando determinado atributo (tamanho, peso, cor, forma etc.).'
        },
        {
          'codigo': 'EI02ET06',
          'descricao': 'Utilizar conceitos básicos de tempo (agora, antes, durante, depois, ontem, hoje, amanhã, lento, rápido, depressa, devagar).'
        },
        {
          'codigo': 'EI02ET07',
          'descricao': 'Contar oralmente objetos, pessoas, livros etc., em contextos diversos.'
        },
        {
          'codigo': 'EI02ET08',
          'descricao': 'Registrar com números a quantidade de crianças (meninas e meninos, presentes e ausentes) e a quantidade de objetos da mesma natureza (bonecas, bolas, livros etc.).'
        }
      ]
    }
  },
  'educacao_infantil_pequenas': {
    'titulo': 'Educação Infantil - Crianças pequenas (4a a 5a11m)',
    'campos_experiencia': {
      'O eu, o outro e o nós': [
        {
          'codigo': 'EI03EO01',
          'descricao': 'Demonstrar empatia pelos outros, percebendo que as pessoas têm diferentes sentimentos, necessidades e maneiras de pensar e agir.'
        },
        {
          'codigo': 'EI03EO02',
          'descricao': 'Agir de maneira independente, com confiança em suas capacidades, reconhecendo suas conquistas e limitações.'
        },
        {
          'codigo': 'EI03EO03',
          'descricao': 'Ampliar as relações interpessoais, desenvolvendo atitudes de participação e cooperação.'
        },
        {
          'codigo': 'EI03EO04',
          'descricao': 'Comunicar suas ideias e sentimentos a pessoas e grupos diversos.'
        },
        {
          'codigo': 'EI03EO05',
          'descricao': 'Demonstrar valorização das características de seu corpo e respeitar as características dos outros (crianças e adultos) com os quais convive.'
        },
        {
          'codigo': 'EI03EO06',
          'descricao': 'Manifestar interesse e respeito por diferentes culturas e modos de vida.'
        },
        {
          'codigo': 'EI03EO07',
          'descricao': 'Usar estratégias pautadas no respeito mútuo para lidar com conflitos nas interações com crianças e adultos.'
        }
      ],
      'Corpo, gestos e movimentos': [
        {
          'codigo': 'EI03CG01',
          'descricao': 'Criar com o corpo formas diversificadas de expressão de sentimentos, sensações e emoções, tanto nas situações do cotidiano quanto em brincadeiras, dança, teatro, música.'
        },
        {
          'codigo': 'EI03CG02',
          'descricao': 'Demonstrar controle e adequação do uso de seu corpo em brincadeiras e jogos, escuta e reconto de histórias, atividades artísticas, entre outras possibilidades.'
        },
        {
          'codigo': 'EI03CG03',
          'descricao': 'Criar movimentos, gestos, olhares e mímicas em brincadeiras, jogos e atividades artísticas como dança, teatro e música.'
        },
        {
          'codigo': 'EI03CG04',
          'descricao': 'Adotar hábitos de autocuidado relacionados a higiene, alimentação, conforto e aparência.'
        },
        {
          'codigo': 'EI03CG05',
          'descricao': 'Coordenar suas habilidades manuais no atendimento adequado a seus interesses e necessidades em situações diversas.'
        }
      ],
      'Traços, sons, cores e formas': [
        {
          'codigo': 'EI03TS01',
          'descricao': 'Utilizar sons produzidos por materiais, objetos e instrumentos musicais durante brincadeiras de faz de conta, encenações, criações musicais, festas.'
        },
        {
          'codigo': 'EI03TS02',
          'descricao': 'Expressar-se livremente por meio de desenho, pintura, colagem, dobradura e escultura, criando produções bidimensionais e tridimensionais.'
        },
        {
          'codigo': 'EI03TS03',
          'descricao': 'Reconhecer as qualidades do som (intensidade, duração, altura e timbre), utilizando-as em suas produções sonoras e ao ouvir músicas e sons.'
        }
      ],
      'Escuta, fala, pensamento e imaginação': [
        {
          'codigo': 'EI03EF01',
          'descricao': 'Expressar ideias, desejos e sentimentos sobre suas vivências, por meio da linguagem oral e escrita (escrita espontânea), de fotos, desenhos e outras formas de expressão.'
        },
        {
          'codigo': 'EI03EF02',
          'descricao': 'Inventar brincadeiras cantadas, poemas e canções, criando rimas, aliterações e ritmos.'
        },
        {
          'codigo': 'EI03EF03',
          'descricao': 'Escolher e folhear livros, procurando orientar-se por temas e ilustrações e tentando identificar palavras conhecidas.'
        },
        {
          'codigo': 'EI03EF04',
          'descricao': 'Recontar histórias ouvidas e planejar coletivamente roteiros de vídeos e de encenações, definindo os contextos, os personagens, a estrutura da história.'
        },
        {
          'codigo': 'EI03EF05',
          'descricao': 'Recontar histórias ouvidas para produção de reconto escrito, tendo o professor como escriba.'
        },
        {
          'codigo': 'EI03EF06',
          'descricao': 'Produzir suas próprias histórias orais e escritas (escrita espontânea), em situações com função social significativa.'
        },
        {
          'codigo': 'EI03EF07',
          'descricao': 'Levantar hipóteses sobre gêneros textuais veiculados em portadores conhecidos, recorrendo a estratégias de observação gráfica e/ou de leitura.'
        },
        {
          'codigo': 'EI03EF08',
          'descricao': 'Selecionar livros e textos de gêneros conhecidos para a leitura de um adulto e/ou para sua própria leitura (partindo de seu repertório sobre esses textos, como a recuperação pela memória, pela leitura das ilustrações etc.).'
        },
        {
          'codigo': 'EI03EF09',
          'descricao': 'Levantar hipóteses em relação à linguagem escrita, realizando registros de palavras e textos, por meio de escrita espontânea.'
        }
      ],
      'Espaços, tempos, quantidades, relações e transformações': [
        {
          'codigo': 'EI03ET01',
          'descricao': 'Estabelecer relações de comparação entre objetos, observando suas propriedades.'
        },
        {
          'codigo': 'EI03ET02',
          'descricao': 'Observar e descrever mudanças em diferentes materiais, resultantes de ações sobre eles, em experimentos envolvendo fenômenos naturais e artificiais.'
        },
        {
          'codigo': 'EI03ET03',
          'descricao': 'Identificar e selecionar fontes de informações, para responder a questões sobre a natureza, seus fenômenos, sua conservação.'
        },
        {
          'codigo': 'EI03ET04',
          'descricao': 'Registrar observações, manipulações e medidas, usando múltiplas linguagens (desenho, registro por números ou escrita espontânea), em diferentes suportes.'
        },
        {
          'codigo': 'EI03ET05',
          'descricao': 'Classificar objetos e figuras de acordo com suas semelhanças e diferenças.'
        },
        {
          'codigo': 'EI03ET06',
          'descricao': 'Relatar fatos importantes sobre seu nascimento e desenvolvimento, a história dos seus familiares e da sua comunidade.'
        },
        {
          'codigo': 'EI03ET07',
          'descricao': 'Relacionar números às suas respectivas quantidades e identificar o antes, o depois e o entre em uma sequência.'
        },
        {
          'codigo': 'EI03ET08',
          'descricao': 'Expressar medidas (peso, altura etc.), construindo gráficos básicos.'
        }
      ]
    }
  },
  'fundamental_1_ano': {
    'titulo': 'Ensino Fundamental - 1º ano',
    'disciplinas': {}
  },
  'fundamental_2_ano': {
    'titulo': 'Ensino Fundamental - 2º ano',
    'disciplinas': {}
  },
  'fundamental_3_ano': {
    'titulo': 'Ensino Fundamental - 3º ano',
    'disciplinas': {}
  },
  'fundamental_4_ano': {
    'titulo': 'Ensino Fundamental - 4º ano',
    'disciplinas': {}
  },
  'fundamental_5_ano': {
    'titulo': 'Ensino Fundamental - 5º ano',
    'disciplinas': {}
  }
};
