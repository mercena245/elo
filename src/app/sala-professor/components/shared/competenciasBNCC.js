// Competências BNCC organizadas por faixa etária e área de conhecimento
// Base Nacional Comum Curricular - Completo

export const FAIXAS_ETARIAS = [
  { id: 'educacao_infantil_creche', label: 'Educação Infantil - Creche (0 a 3 anos)', ordem: 1 },
  { id: 'educacao_infantil_pre_escola', label: 'Educação Infantil - Pré-escola (4 a 5 anos)', ordem: 2 },
  { id: 'anos_iniciais_1_2', label: 'Ensino Fundamental - Anos Iniciais (1º e 2º ano)', ordem: 3 },
  { id: 'anos_iniciais_3_4_5', label: 'Ensino Fundamental - Anos Iniciais (3º, 4º e 5º ano)', ordem: 4 },
  { id: 'anos_finais_6_7', label: 'Ensino Fundamental - Anos Finais (6º e 7º ano)', ordem: 5 },
  { id: 'anos_finais_8_9', label: 'Ensino Fundamental - Anos Finais (8º e 9º ano)', ordem: 6 },
  { id: 'ensino_medio', label: 'Ensino Médio', ordem: 7 }
];

export const COMPETENCIAS_BNCC = {
  // ============ EDUCAÇÃO INFANTIL - CRECHE (0 a 3 anos) ============
  educacao_infantil_creche: {
    titulo: 'Educação Infantil - Creche (0 a 3 anos)',
    direitos_aprendizagem: [
      { codigo: 'EI_CONV', descricao: 'Conviver com outras crianças e adultos' },
      { codigo: 'EI_BRIN', descricao: 'Brincar cotidianamente de diversas formas' },
      { codigo: 'EI_PART', descricao: 'Participar ativamente das propostas' },
      { codigo: 'EI_EXPL', descricao: 'Explorar movimentos, gestos, sons, formas, texturas' },
      { codigo: 'EI_EXPR', descricao: 'Expressar emoções, sentimentos, necessidades' },
      { codigo: 'EI_CONH', descricao: 'Conhecer-se e construir sua identidade' }
    ],
    campos_experiencia: {
      'O eu, o outro e o nós': [
        { codigo: 'EI01EO01', descricao: 'Perceber que suas ações têm efeitos nas outras crianças e nos adultos.' },
        { codigo: 'EI01EO02', descricao: 'Perceber as possibilidades e os limites de seu corpo nas brincadeiras e interações.' },
        { codigo: 'EI01EO03', descricao: 'Interagir com crianças da mesma faixa etária e adultos ao explorar espaços, materiais, objetos, brinquedos.' },
        { codigo: 'EI01EO04', descricao: 'Comunicar necessidades, desejos e emoções, utilizando gestos, balbucios, palavras.' },
        { codigo: 'EI01EO05', descricao: 'Reconhecer seu corpo e expressar suas sensações em momentos de alimentação, higiene, brincadeira.' },
        { codigo: 'EI01EO06', descricao: 'Interagir com outras crianças da mesma faixa etária e adultos, adaptando-se ao convívio social.' }
      ],
      'Corpo, gestos e movimentos': [
        { codigo: 'EI01CG01', descricao: 'Movimentar as partes do corpo para exprimir corporalmente emoções, necessidades e desejos.' },
        { codigo: 'EI01CG02', descricao: 'Experimentar as possibilidades corporais nas brincadeiras e interações em ambientes acolhedores.' },
        { codigo: 'EI01CG03', descricao: 'Imitar gestos e movimentos de outras crianças, adultos e animais.' },
        { codigo: 'EI01CG04', descricao: 'Participar do cuidado do seu corpo e da promoção do seu bem-estar.' },
        { codigo: 'EI01CG05', descricao: 'Utilizar os movimentos de preensão, encaixe, lançamento, para ampliar suas possibilidades de manuseio.' }
      ],
      'Traços, sons, cores e formas': [
        { codigo: 'EI01TS01', descricao: 'Explorar sons produzidos com o próprio corpo e com objetos do ambiente.' },
        { codigo: 'EI01TS02', descricao: 'Traçar marcas gráficas, em diferentes suportes, usando instrumentos riscantes e tintas.' },
        { codigo: 'EI01TS03', descricao: 'Explorar diferentes fontes sonoras e materiais para acompanhar brincadeiras cantadas, canções, músicas.' }
      ],
      'Escuta, fala, pensamento e imaginação': [
        { codigo: 'EI01EF01', descricao: 'Reconhecer quando é chamado por seu nome e reconhecer os nomes de pessoas com quem convive.' },
        { codigo: 'EI01EF02', descricao: 'Demonstrar interesse ao ouvir a leitura de poemas e a apresentação de músicas.' },
        { codigo: 'EI01EF03', descricao: 'Demonstrar interesse ao ouvir histórias lidas ou contadas, observando ilustrações e os movimentos de leitura.' },
        { codigo: 'EI01EF04', descricao: 'Reconhecer elementos das ilustrações de histórias, apontando-os, a pedido do adulto-leitor.' },
        { codigo: 'EI01EF05', descricao: 'Imitar as variações de entonação e gestos realizados pelos adultos, ao ler histórias e ao cantar.' },
        { codigo: 'EI01EF06', descricao: 'Comunicar-se com outras pessoas usando movimentos, gestos, balbucios, fala e outras formas de expressão.' },
        { codigo: 'EI01EF07', descricao: 'Conhecer e manipular materiais impressos e audiovisuais em diferentes portadores (livro, revista, gibi, jornal).' },
        { codigo: 'EI01EF08', descricao: 'Participar de situações de escuta de textos em diferentes gêneros textuais (poemas, fábulas, contos).' },
        { codigo: 'EI01EF09', descricao: 'Conhecer e manipular diferentes instrumentos e suportes de escrita.' }
      ],
      'Espaços, tempos, quantidades, relações e transformações': [
        { codigo: 'EI01ET01', descricao: 'Explorar e descobrir as propriedades de objetos e materiais (odor, cor, sabor, temperatura).' },
        { codigo: 'EI01ET02', descricao: 'Explorar relações de causa e efeito na interação com o mundo físico.' },
        { codigo: 'EI01ET03', descricao: 'Explorar o ambiente pela ação e observação, manipulando, experimentando e fazendo descobertas.' },
        { codigo: 'EI01ET04', descricao: 'Manipular, experimentar, arrumar e explorar o espaço por meio de experiências de deslocamentos de si.' },
        { codigo: 'EI01ET05', descricao: 'Manipular materiais diversos e variados para comparar as diferenças e semelhanças entre eles.' },
        { codigo: 'EI01ET06', descricao: 'Vivenciar diferentes ritmos, velocidades e fluxos nas interações e brincadeiras.' }
      ]
    }
  },

  // ============ EDUCAÇÃO INFANTIL - PRÉ-ESCOLA (4 a 5 anos) ============
  educacao_infantil_pre_escola: {
    titulo: 'Educação Infantil - Pré-escola (4 a 5 anos)',
    direitos_aprendizagem: [
      { codigo: 'EI_CONV', descricao: 'Conviver com outras crianças e adultos' },
      { codigo: 'EI_BRIN', descricao: 'Brincar cotidianamente de diversas formas' },
      { codigo: 'EI_PART', descricao: 'Participar ativamente das propostas' },
      { codigo: 'EI_EXPL', descricao: 'Explorar movimentos, gestos, sons, formas, texturas' },
      { codigo: 'EI_EXPR', descricao: 'Expressar emoções, sentimentos, necessidades' },
      { codigo: 'EI_CONH', descricao: 'Conhecer-se e construir sua identidade' }
    ],
    campos_experiencia: {
      'O eu, o outro e o nós': [
        { codigo: 'EI03EO01', descricao: 'Demonstrar empatia pelos outros, percebendo que as pessoas têm diferentes sentimentos, necessidades.' },
        { codigo: 'EI03EO02', descricao: 'Agir de maneira independente, com confiança em suas capacidades, reconhecendo suas conquistas.' },
        { codigo: 'EI03EO03', descricao: 'Ampliar as relações interpessoais, desenvolvendo atitudes de participação e cooperação.' },
        { codigo: 'EI03EO04', descricao: 'Comunicar suas ideias e sentimentos a pessoas e grupos diversos.' },
        { codigo: 'EI03EO05', descricao: 'Demonstrar valorização das características de seu corpo e respeitar as características dos outros.' },
        { codigo: 'EI03EO06', descricao: 'Manifestar interesse e respeito por diferentes culturas e modos de vida.' },
        { codigo: 'EI03EO07', descricao: 'Usar estratégias pautadas no respeito mútuo para lidar com conflitos nas interações com crianças e adultos.' }
      ],
      'Corpo, gestos e movimentos': [
        { codigo: 'EI03CG01', descricao: 'Criar com o corpo formas diversificadas de expressão de sentimentos, sensações e emoções.' },
        { codigo: 'EI03CG02', descricao: 'Demonstrar controle e adequação do uso de seu corpo em brincadeiras e jogos, escuta e reconto de histórias.' },
        { codigo: 'EI03CG03', descricao: 'Criar movimentos, gestos, olhares e mímicas em brincadeiras, jogos e atividades artísticas como dança.' },
        { codigo: 'EI03CG04', descricao: 'Adotar hábitos de autocuidado relacionados a higiene, alimentação, conforto e aparência.' },
        { codigo: 'EI03CG05', descricao: 'Coordenar suas habilidades manuais no atendimento adequado a seus interesses e necessidades.' }
      ],
      'Traços, sons, cores e formas': [
        { codigo: 'EI03TS01', descricao: 'Utilizar sons produzidos por materiais, objetos e instrumentos musicais durante brincadeiras de faz de conta.' },
        { codigo: 'EI03TS02', descricao: 'Expressar-se livremente por meio de desenho, pintura, colagem, dobradura e escultura.' },
        { codigo: 'EI03TS03', descricao: 'Reconhecer as qualidades do som (intensidade, duração, altura e timbre), utilizando-as em suas produções.' }
      ],
      'Escuta, fala, pensamento e imaginação': [
        { codigo: 'EI03EF01', descricao: 'Expressar ideias, desejos e sentimentos sobre suas vivências, por meio da linguagem oral e escrita.' },
        { codigo: 'EI03EF02', descricao: 'Inventar brincadeiras cantadas, poemas e canções, criando rimas, aliterações e ritmos.' },
        { codigo: 'EI03EF03', descricao: 'Escolher e folhear livros, procurando orientar-se por temas e ilustrações e tentando identificar palavras.' },
        { codigo: 'EI03EF04', descricao: 'Recontar histórias ouvidas e planejar coletivamente roteiros de vídeos e de encenações.' },
        { codigo: 'EI03EF05', descricao: 'Recontar histórias ouvidas para produção de reconto escrito, tendo o professor como escriba.' },
        { codigo: 'EI03EF06', descricao: 'Produzir suas próprias histórias orais e escritas (escrita espontânea), em situações com função social.' },
        { codigo: 'EI03EF07', descricao: 'Levantar hipóteses sobre gêneros textuais veiculados em portadores conhecidos, recorrendo a estratégias de observação.' },
        { codigo: 'EI03EF08', descricao: 'Selecionar livros e textos de gêneros conhecidos para a leitura de um adulto e/ou para sua própria leitura.' },
        { codigo: 'EI03EF09', descricao: 'Levantar hipóteses em relação à linguagem escrita, realizando registros de palavras e textos.' }
      ],
      'Espaços, tempos, quantidades, relações e transformações': [
        { codigo: 'EI03ET01', descricao: 'Estabelecer relações de comparação entre objetos, observando suas propriedades.' },
        { codigo: 'EI03ET02', descricao: 'Observar e descrever mudanças em diferentes materiais, resultantes de ações sobre eles.' },
        { codigo: 'EI03ET03', descricao: 'Identificar e selecionar fontes de informações, para responder a questões sobre a natureza, seus fenômenos.' },
        { codigo: 'EI03ET04', descricao: 'Registrar observações, manipulações e medidas, usando múltiplas linguagens (desenho, registro por números).' },
        { codigo: 'EI03ET05', descricao: 'Classificar objetos e figuras de acordo com suas semelhanças e diferenças.' },
        { codigo: 'EI03ET06', descricao: 'Relatar fatos importantes sobre seu nascimento e desenvolvimento, a história dos seus familiares e da sua comunidade.' },
        { codigo: 'EI03ET07', descricao: 'Relacionar números às suas respectivas quantidades e identificar o antes, o depois e o entre em uma sequência.' },
        { codigo: 'EI03ET08', descricao: 'Expressar medidas (peso, altura etc.), construindo gráficos básicos.' }
      ]
    }
  },

  // ============ ENSINO FUNDAMENTAL - ANOS INICIAIS (1º e 2º ano) ============
  anos_iniciais_1_2: {
    titulo: 'Ensino Fundamental - Anos Iniciais (1º e 2º ano)',
    areas: {
      'Língua Portuguesa': [
        { codigo: 'EF12LP01', descricao: 'Ler palavras novas com precisão na decodificação, no caso de palavras de uso frequente.' },
        { codigo: 'EF12LP02', descricao: 'Buscar, selecionar e ler, com a mediação do professor, textos que circulam em meios impressos ou digitais.' },
        { codigo: 'EF01LP01', descricao: 'Reconhecer que textos são lidos e escritos da esquerda para a direita e de cima para baixo da página.' },
        { codigo: 'EF01LP02', descricao: 'Escrever, espontaneamente ou por ditado, palavras e frases de forma alfabética.' },
        { codigo: 'EF01LP03', descricao: 'Observar escritas convencionais, comparando-as às suas produções escritas, percebendo semelhanças.' },
        { codigo: 'EF01LP05', descricao: 'Reconhecer o sistema de escrita alfabética como representação dos sons da fala.' },
        { codigo: 'EF02LP01', descricao: 'Utilizar, ao produzir o texto, grafia correta de palavras conhecidas ou com estruturas silábicas já dominadas.' },
        { codigo: 'EF02LP02', descricao: 'Segmentar palavras em sílabas e remover e substituir sílabas iniciais, mediais ou finais.' },
        { codigo: 'EF02LP03', descricao: 'Ler e escrever palavras com correspondências regulares diretas entre letras e fonemas.' }
      ],
      'Matemática': [
        { codigo: 'EF01MA01', descricao: 'Utilizar números naturais como indicadores de quantidade ou de ordem em diferentes situações cotidianas.' },
        { codigo: 'EF01MA02', descricao: 'Contar de maneira exata ou aproximada, utilizando diferentes estratégias como o pareamento.' },
        { codigo: 'EF01MA03', descricao: 'Estimar e comparar quantidades de objetos de dois conjuntos (em torno de 20 elementos).' },
        { codigo: 'EF01MA04', descricao: 'Contar a quantidade de objetos de coleções até 100 unidades e apresentar o resultado por registros verbais.' },
        { codigo: 'EF01MA05', descricao: 'Comparar números naturais de até duas ordens em situações cotidianas, com e sem suporte da reta numérica.' },
        { codigo: 'EF01MA06', descricao: 'Construir fatos básicos da adição e utilizá-los em procedimentos de cálculo para resolver problemas.' },
        { codigo: 'EF02MA01', descricao: 'Comparar e ordenar números naturais (até a ordem de centenas) pela compreensão de características do sistema.' },
        { codigo: 'EF02MA02', descricao: 'Fazer estimativas por meio de estratégias diversas a respeito da quantidade de objetos de coleções.' },
        { codigo: 'EF02MA03', descricao: 'Comparar quantidades de objetos de dois conjuntos, por estimativa e/ou por correspondência.' },
        { codigo: 'EF02MA04', descricao: 'Compor e decompor números naturais de até três ordens, com suporte de material manipulável.' }
      ],
      'Ciências': [
        { codigo: 'EF01CI01', descricao: 'Comparar características de diferentes materiais presentes em objetos de uso cotidiano.' },
        { codigo: 'EF01CI02', descricao: 'Localizar, nomear e representar graficamente (por meio de desenhos) partes do corpo humano.' },
        { codigo: 'EF01CI03', descricao: 'Discutir as razões pelas quais os hábitos de higiene do corpo são necessários para a manutenção da saúde.' },
        { codigo: 'EF01CI04', descricao: 'Comparar características físicas entre os colegas, reconhecendo a diversidade.' },
        { codigo: 'EF02CI01', descricao: 'Identificar de que materiais (metais, madeira, vidro etc.) são feitos os objetos que fazem parte da vida cotidiana.' },
        { codigo: 'EF02CI02', descricao: 'Propor o uso de diferentes materiais para a construção de objetos de uso cotidiano.' },
        { codigo: 'EF02CI03', descricao: 'Discutir os cuidados necessários à prevenção de acidentes domésticos (objetos cortantes e inflamáveis).' }
      ],
      'História': [
        { codigo: 'EF01HI01', descricao: 'Identificar aspectos do seu crescimento por meio do registro das lembranças particulares ou de lembranças dos membros de sua família.' },
        { codigo: 'EF01HI02', descricao: 'Identificar a relação entre as suas histórias e as histórias de sua família e de sua comunidade.' },
        { codigo: 'EF01HI03', descricao: 'Descrever e distinguir os seus papéis e responsabilidades relacionados à família, à escola e à comunidade.' },
        { codigo: 'EF02HI01', descricao: 'Reconhecer espaços de sociabilidade e identificar os motivos que aproximam e separam as pessoas em diferentes grupos sociais.' },
        { codigo: 'EF02HI02', descricao: 'Identificar e descrever práticas e papéis sociais que as pessoas exercem em diferentes comunidades.' },
        { codigo: 'EF02HI03', descricao: 'Selecionar situações cotidianas que remetam à percepção de mudança, pertencimento e memória.' }
      ],
      'Geografia': [
        { codigo: 'EF01GE01', descricao: 'Descrever características observadas de seus lugares de vivência (moradia, escola etc.).' },
        { codigo: 'EF01GE02', descricao: 'Identificar semelhanças e diferenças entre jogos e brincadeiras de diferentes épocas e lugares.' },
        { codigo: 'EF01GE03', descricao: 'Identificar e relatar semelhanças e diferenças de usos do espaço público (praças, parques) para o lazer.' },
        { codigo: 'EF02GE01', descricao: 'Descrever a história das migrações no bairro ou comunidade em que vive.' },
        { codigo: 'EF02GE02', descricao: 'Comparar costumes e tradições de diferentes populações inseridas no bairro ou comunidade em que vive.' },
        { codigo: 'EF02GE03', descricao: 'Comparar diferentes meios de transporte e de comunicação, indicando o seu papel na conexão entre lugares.' }
      ]
    }
  },

  // ============ ENSINO FUNDAMENTAL - ANOS INICIAIS (3º, 4º e 5º ano) ============
  anos_iniciais_3_4_5: {
    titulo: 'Ensino Fundamental - Anos Iniciais (3º, 4º e 5º ano)',
    areas: {
      'Língua Portuguesa': [
        { codigo: 'EF35LP01', descricao: 'Ler e compreender, silenciosamente e, em seguida, em voz alta, com autonomia e fluência, textos curtos.' },
        { codigo: 'EF35LP02', descricao: 'Selecionar livros da biblioteca e/ou do cantinho de leitura da sala de aula.' },
        { codigo: 'EF35LP03', descricao: 'Identificar a ideia central do texto, demonstrando compreensão global.' },
        { codigo: 'EF03LP01', descricao: 'Ler e escrever palavras com correspondências regulares contextuais entre grafemas e fonemas.' },
        { codigo: 'EF03LP02', descricao: 'Ler e escrever corretamente palavras com sílabas CV, V, CVC, CCV, VC, VV, CVV.' },
        { codigo: 'EF04LP01', descricao: 'Grafar palavras utilizando regras de correspondência fonema-grafema regulares diretas e contextuais.' },
        { codigo: 'EF04LP02', descricao: 'Ler e escrever, corretamente, palavras com sílabas VV e CVV em casos nos quais a combinação VV é reduzida.' },
        { codigo: 'EF05LP01', descricao: 'Grafar palavras utilizando regras de correspondência fonema-grafema regulares, contextuais e morfológicas.' },
        { codigo: 'EF05LP02', descricao: 'Identificar o caráter polissêmico das palavras, comparando o significado de determinados termos.' }
      ],
      'Matemática': [
        { codigo: 'EF03MA01', descricao: 'Ler, escrever e comparar números naturais de até a ordem de unidade de milhar.' },
        { codigo: 'EF03MA02', descricao: 'Identificar características do sistema de numeração decimal, utilizando a composição e a decomposição de número natural.' },
        { codigo: 'EF03MA03', descricao: 'Construir e utilizar fatos básicos da adição e da multiplicação para o cálculo mental ou escrito.' },
        { codigo: 'EF04MA01', descricao: 'Ler, escrever e ordenar números naturais até a ordem de dezenas de milhar.' },
        { codigo: 'EF04MA02', descricao: 'Mostrar, por decomposição e composição, que todo número natural pode ser escrito por meio de adições e multiplicações.' },
        { codigo: 'EF04MA03', descricao: 'Resolver e elaborar problemas com números naturais envolvendo adição e subtração.' },
        { codigo: 'EF05MA01', descricao: 'Ler, escrever e ordenar números naturais até a ordem das centenas de milhar com compreensão das principais características.' },
        { codigo: 'EF05MA02', descricao: 'Ler, escrever e ordenar números racionais na forma decimal com compreensão das principais características.' },
        { codigo: 'EF05MA03', descricao: 'Identificar e representar frações (menores e maiores que a unidade), associando-as ao resultado de uma divisão.' }
      ],
      'Ciências': [
        { codigo: 'EF03CI01', descricao: 'Produzir diferentes sons a partir da vibração de variados objetos e identificar variáveis que influem nesse fenômeno.' },
        { codigo: 'EF03CI02', descricao: 'Experimentar e relatar o que ocorre com a passagem da luz através de objetos transparentes, translúcidos e opacos.' },
        { codigo: 'EF03CI03', descricao: 'Discutir hábitos necessários para a manutenção da saúde auditiva e visual considerando as condições do ambiente.' },
        { codigo: 'EF04CI01', descricao: 'Identificar misturas na vida diária, com base em suas propriedades físicas observáveis.' },
        { codigo: 'EF04CI02', descricao: 'Testar e relatar transformações nos materiais do dia a dia quando expostos a diferentes condições (aquecimento, resfriamento).' },
        { codigo: 'EF05CI01', descricao: 'Explorar fenômenos da vida cotidiana que evidenciem propriedades físicas dos materiais.' },
        { codigo: 'EF05CI02', descricao: 'Aplicar os conhecimentos sobre as mudanças de estado físico da água para explicar o ciclo hidrológico.' }
      ],
      'História': [
        { codigo: 'EF03HI01', descricao: 'Identificar os grupos populacionais que formam a cidade, o município e a região, as relações estabelecidas entre eles.' },
        { codigo: 'EF03HI02', descricao: 'Selecionar, por meio da consulta de fontes de diferentes naturezas, e registrar acontecimentos ocorridos ao longo do tempo.' },
        { codigo: 'EF04HI01', descricao: 'Reconhecer a história como resultado da ação do ser humano no tempo e no espaço.' },
        { codigo: 'EF04HI02', descricao: 'Identificar mudanças e permanências ao longo do tempo, discutindo os sentidos dos grandes marcos da história.' },
        { codigo: 'EF05HI01', descricao: 'Identificar os processos de formação das culturas e dos povos, relacionando-os com o espaço geográfico ocupado.' },
        { codigo: 'EF05HI02', descricao: 'Identificar os mecanismos de organização do poder político com vistas à compreensão da ideia de Estado.' }
      ],
      'Geografia': [
        { codigo: 'EF03GE01', descricao: 'Identificar e comparar aspectos culturais dos grupos sociais de seus lugares de vivência.' },
        { codigo: 'EF03GE02', descricao: 'Identificar, em seus lugares de vivência, marcas de contribuição cultural e econômica de grupos de diferentes origens.' },
        { codigo: 'EF04GE01', descricao: 'Selecionar, em seus lugares de vivência e em suas histórias familiares, elementos de distintas culturas.' },
        { codigo: 'EF04GE02', descricao: 'Descrever processos migratórios e suas contribuições para a formação da sociedade brasileira.' },
        { codigo: 'EF05GE01', descricao: 'Descrever e analisar dinâmicas populacionais na Unidade da Federação em que vive.' },
        { codigo: 'EF05GE02', descricao: 'Identificar diferenças étnico-raciais e étnico-culturais e desigualdades sociais entre grupos em diferentes territórios.' }
      ]
    }
  },

  // ============ ENSINO FUNDAMENTAL - ANOS FINAIS (6º e 7º ano) ============
  anos_finais_6_7: {
    titulo: 'Ensino Fundamental - Anos Finais (6º e 7º ano)',
    areas: {
      'Língua Portuguesa': [
        { codigo: 'EF67LP01', descricao: 'Analisar a estrutura e funcionamento dos hiperlinks em textos noticiosos publicados na Web.' },
        { codigo: 'EF67LP02', descricao: 'Explorar o espaço reservado ao leitor nos jornais, revistas, impressos e on-line.' },
        { codigo: 'EF06LP01', descricao: 'Reconhecer a impossibilidade de uma neutralidade absoluta no relato de fatos.' },
        { codigo: 'EF06LP02', descricao: 'Estabelecer relação entre os diferentes gêneros jornalísticos, compreendendo a centralidade da notícia.' },
        { codigo: 'EF07LP01', descricao: 'Distinguir diferentes propostas editoriais – sensacionalismo, jornalismo investigativo etc.' },
        { codigo: 'EF07LP02', descricao: 'Comparar notícias e reportagens sobre um mesmo fato divulgadas em diferentes mídias.' }
      ],
      'Matemática': [
        { codigo: 'EF06MA01', descricao: 'Comparar, ordenar, ler e escrever números naturais e números racionais cuja representação decimal é finita.' },
        { codigo: 'EF06MA02', descricao: 'Reconhecer o sistema de numeração decimal, como o que prevaleceu no mundo ocidental.' },
        { codigo: 'EF06MA03', descricao: 'Resolver e elaborar problemas que envolvam cálculos (mentais ou escritos, exatos ou aproximados) com números naturais.' },
        { codigo: 'EF07MA01', descricao: 'Resolver e elaborar problemas com números inteiros e racionais, envolvendo as quatro operações fundamentais.' },
        { codigo: 'EF07MA02', descricao: 'Resolver e elaborar problemas que envolvam porcentagens, como os que lidam com acréscimos e decréscimos simples.' },
        { codigo: 'EF07MA03', descricao: 'Comparar e ordenar números inteiros em diferentes contextos, incluindo o histórico.' }
      ],
      'Ciências': [
        { codigo: 'EF06CI01', descricao: 'Classificar como homogênea ou heterogênea a mistura de dois ou mais materiais.' },
        { codigo: 'EF06CI02', descricao: 'Identificar evidências de transformações químicas a partir do resultado de misturas de materiais.' },
        { codigo: 'EF06CI03', descricao: 'Selecionar métodos mais adequados para a separação de diferentes sistemas heterogêneos.' },
        { codigo: 'EF07CI01', descricao: 'Discutir a aplicação, ao longo da história, das máquinas simples e propor soluções e invenções.' },
        { codigo: 'EF07CI02', descricao: 'Diferenciar temperatura, calor e sensação térmica nas diferentes situações de equilíbrio termodinâmico cotidianas.' },
        { codigo: 'EF07CI03', descricao: 'Utilizar o conhecimento das formas de propagação do calor para justificar a utilização de determinados materiais.' }
      ],
      'História': [
        { codigo: 'EF06HI01', descricao: 'Identificar diferentes formas de compreensão da noção de tempo e de periodização dos processos históricos.' },
        { codigo: 'EF06HI02', descricao: 'Identificar a gênese da produção do saber histórico e analisar o significado das fontes que originaram determinadas formas de registro.' },
        { codigo: 'EF06HI03', descricao: 'Identificar as hipóteses científicas sobre o surgimento da espécie humana e sua historicidade.' },
        { codigo: 'EF07HI01', descricao: 'Explicar o significado de "modernidade" e suas lógicas de inclusão e exclusão.' },
        { codigo: 'EF07HI02', descricao: 'Identificar conexões e interações entre as sociedades do Novo Mundo, da Europa, da África e da Ásia no contexto das navegações.' },
        { codigo: 'EF07HI03', descricao: 'Identificar aspectos e processos específicos das sociedades africanas e americanas antes da chegada dos europeus.' }
      ],
      'Geografia': [
        { codigo: 'EF06GE01', descricao: 'Comparar modificações das paisagens nos lugares de vivência e os usos desses lugares em diferentes tempos.' },
        { codigo: 'EF06GE02', descricao: 'Analisar modificações de paisagens por diferentes tipos de sociedade, com destaque para os povos originários.' },
        { codigo: 'EF06GE03', descricao: 'Descrever os movimentos do planeta e sua relação com a circulação geral da atmosfera, o tempo atmosférico e os padrões climáticos.' },
        { codigo: 'EF07GE01', descricao: 'Avaliar, por meio de exemplos extraídos dos meios de comunicação, ideias e estereótipos acerca das paisagens.' },
        { codigo: 'EF07GE02', descricao: 'Analisar a influência dos fluxos econômicos e populacionais na formação socioeconômica e territorial do Brasil.' },
        { codigo: 'EF07GE03', descricao: 'Selecionar argumentos que reconheçam as territorialidades dos povos indígenas originários, das comunidades remanescentes de quilombos.' }
      ],
      'Inglês': [
        { codigo: 'EF06LI01', descricao: 'Interagir em situações de intercâmbio oral, demonstrando iniciativa para utilizar a língua inglesa.' },
        { codigo: 'EF06LI02', descricao: 'Coletar informações do grupo, perguntando e respondendo sobre a família, os amigos, a escola e a comunidade.' },
        { codigo: 'EF07LI01', descricao: 'Interagir em situações de intercâmbio oral para realizar as atividades em sala de aula.' },
        { codigo: 'EF07LI02', descricao: 'Entrevistar os colegas para conhecer suas histórias de vida.' }
      ]
    }
  },

  // ============ ENSINO FUNDAMENTAL - ANOS FINAIS (8º e 9º ano) ============
  anos_finais_8_9: {
    titulo: 'Ensino Fundamental - Anos Finais (8º e 9º ano)',
    areas: {
      'Língua Portuguesa': [
        { codigo: 'EF89LP01', descricao: 'Analisar os interesses que movem o campo jornalístico, os efeitos das novas tecnologias no campo.' },
        { codigo: 'EF89LP02', descricao: 'Analisar diferentes práticas, selecionando procedimentos e estratégias de leitura adequados a diferentes objetivos.' },
        { codigo: 'EF08LP01', descricao: 'Identificar e comparar as várias editorias de jornais impressos e digitais e de sites noticiosos.' },
        { codigo: 'EF08LP02', descricao: 'Justificar diferenças ou semelhanças no tratamento dado a uma mesma informação veiculada em textos diferentes.' },
        { codigo: 'EF09LP01', descricao: 'Analisar o fenômeno da disseminação de notícias falsas nas redes sociais e desenvolver estratégias para reconhecê-las.' },
        { codigo: 'EF09LP02', descricao: 'Analisar e comentar a validade e a confiabilidade de informações veiculadas em diferentes mídias.' }
      ],
      'Matemática': [
        { codigo: 'EF08MA01', descricao: 'Efetuar cálculos com potências de expoentes inteiros e aplicar esse conhecimento na representação de números em notação científica.' },
        { codigo: 'EF08MA02', descricao: 'Resolver e elaborar problemas usando a relação entre potenciação e radiciação, para representar uma raiz como potência de expoente fracionário.' },
        { codigo: 'EF08MA03', descricao: 'Resolver e elaborar problemas de contagem cuja resolução envolve a aplicação do princípio multiplicativo.' },
        { codigo: 'EF09MA01', descricao: 'Reconhecer que, uma vez fixada uma unidade de comprimento, existem segmentos de reta cujo comprimento não é expresso por número racional.' },
        { codigo: 'EF09MA02', descricao: 'Reconhecer um número irracional como um número real cuja representação decimal é infinita e não periódica.' },
        { codigo: 'EF09MA03', descricao: 'Efetuar cálculos com números reais, inclusive potências com expoentes negativos e fracionários.' }
      ],
      'Ciências': [
        { codigo: 'EF08CI01', descricao: 'Identificar e classificar diferentes fontes (renováveis e não renováveis) e tipos de energia utilizados em residências, comunidades ou cidades.' },
        { codigo: 'EF08CI02', descricao: 'Construir circuitos elétricos com pilha/bateria, fios e lâmpada ou outros dispositivos e compará-los a circuitos elétricos residenciais.' },
        { codigo: 'EF08CI03', descricao: 'Classificar equipamentos elétricos residenciais (chuveiro, ferro, lâmpadas, TV, rádio, geladeira etc.) de acordo com o tipo de transformação de energia.' },
        { codigo: 'EF09CI01', descricao: 'Investigar as mudanças de estado físico da matéria e explicar essas transformações com base no modelo de constituição submicroscópica.' },
        { codigo: 'EF09CI02', descricao: 'Comparar quantidades de reagentes e produtos envolvidos em transformações químicas, estabelecendo a proporção entre as suas massas.' },
        { codigo: 'EF09CI03', descricao: 'Identificar modelos que descrevem a estrutura da matéria (constituição do átomo e composição de moléculas simples) e reconhecer sua evolução histórica.' }
      ],
      'História': [
        { codigo: 'EF08HI01', descricao: 'Identificar os principais aspectos conceituais do iluminismo e do liberalismo e discutir a relação entre eles.' },
        { codigo: 'EF08HI02', descricao: 'Identificar as particularidades político-sociais da Inglaterra do século XVII e analisar os desdobramentos posteriores à Revolução Gloriosa.' },
        { codigo: 'EF08HI03', descricao: 'Analisar os impactos da Revolução Industrial na produção e circulação de povos, produtos e culturas.' },
        { codigo: 'EF09HI01', descricao: 'Descrever e contextualizar os principais aspectos sociais, culturais, econômicos e políticos da emergência da República no Brasil.' },
        { codigo: 'EF09HI02', descricao: 'Caracterizar e compreender os ciclos da história republicana, identificando particularidades da história local e regional.' },
        { codigo: 'EF09HI03', descricao: 'Identificar os mecanismos de inserção dos negros na sociedade brasileira pós-abolição e avaliar os seus resultados.' }
      ],
      'Geografia': [
        { codigo: 'EF08GE01', descricao: 'Descrever as rotas de dispersão da população humana pelo planeta e os principais fluxos migratórios em diferentes períodos da história.' },
        { codigo: 'EF08GE02', descricao: 'Relacionar fatos e situações representativas da história das famílias do Município em que se localiza a escola.' },
        { codigo: 'EF08GE03', descricao: 'Analisar aspectos representativos da dinâmica demográfica, considerando características da população (perfil etário, crescimento vegetativo).' },
        { codigo: 'EF09GE01', descricao: 'Analisar criticamente de que forma a hegemonia europeia foi exercida em várias regiões do planeta.' },
        { codigo: 'EF09GE02', descricao: 'Analisar a atuação das corporações internacionais e das organizações econômicas mundiais na vida da população.' },
        { codigo: 'EF09GE03', descricao: 'Identificar diferentes manifestações culturais de minorias étnicas como forma de compreender a multiplicidade cultural na escala mundial.' }
      ],
      'Inglês': [
        { codigo: 'EF08LI01', descricao: 'Fazer uso da língua inglesa para resolver mal-entendidos, emitir opiniões e esclarecer informações por meio de paráfrases ou justificativas.' },
        { codigo: 'EF08LI02', descricao: 'Explorar o uso de recursos linguísticos (frases incompletas, hesitações, entre outros) e paralinguísticos (gestos, expressões faciais) em situações de interação oral.' },
        { codigo: 'EF09LI01', descricao: 'Fazer uso da língua inglesa para expor pontos de vista, argumentos e contra-argumentos, considerando o contexto e os recursos linguísticos.' },
        { codigo: 'EF09LI02', descricao: 'Compilar as ideias-chave de textos por meio de tomada de notas.' }
      ]
    }
  },

  // ============ ENSINO MÉDIO ============
  ensino_medio: {
    titulo: 'Ensino Médio',
    areas: {
      'Linguagens e suas Tecnologias': [
        { codigo: 'EM13LGG101', descricao: 'Compreender e analisar processos de produção e circulação de discursos, nas diferentes linguagens.' },
        { codigo: 'EM13LGG102', descricao: 'Analisar visões de mundo, conflitos de interesse, preconceitos e ideologias presentes nos discursos veiculados nas diferentes mídias.' },
        { codigo: 'EM13LGG103', descricao: 'Analisar o funcionamento das linguagens, para interpretar e produzir criticamente discursos em textos de diversas semioses.' },
        { codigo: 'EM13LGG201', descricao: 'Utilizar as diversas linguagens (artísticas, corporais e verbais) em diferentes contextos.' },
        { codigo: 'EM13LGG202', descricao: 'Analisar interesses, relações de poder e perspectivas de mundo nos discursos das diversas práticas de linguagem.' },
        { codigo: 'EM13LGG301', descricao: 'Participar de processos de produção individual e colaborativa em diferentes linguagens.' },
        { codigo: 'EM13LGG302', descricao: 'Posicionar-se criticamente diante de diversas visões de mundo presentes nos discursos em diferentes linguagens.' }
      ],
      'Matemática e suas Tecnologias': [
        { codigo: 'EM13MAT101', descricao: 'Interpretar criticamente situações econômicas, sociais e fatos relativos às Ciências da Natureza que envolvam a variação de grandezas.' },
        { codigo: 'EM13MAT102', descricao: 'Analisar tabelas, gráficos e amostras de pesquisas estatísticas apresentadas em relatórios divulgados por diferentes meios de comunicação.' },
        { codigo: 'EM13MAT103', descricao: 'Interpretar e compreender textos científicos ou divulgados pelas mídias, que empregam unidades de medida de diferentes grandezas.' },
        { codigo: 'EM13MAT201', descricao: 'Propor ou participar de ações adequadas às demandas da região, preferencialmente para sua comunidade.' },
        { codigo: 'EM13MAT202', descricao: 'Planejar e executar pesquisa amostral sobre questões relevantes, usando dados coletados diretamente ou em diferentes fontes.' },
        { codigo: 'EM13MAT301', descricao: 'Resolver e elaborar problemas do cotidiano, da Matemática e de outras áreas do conhecimento.' },
        { codigo: 'EM13MAT302', descricao: 'Construir modelos empregando as funções polinomiais de 1º ou 2º graus, para resolver problemas em contextos diversos.' }
      ],
      'Ciências da Natureza e suas Tecnologias': [
        { codigo: 'EM13CNT101', descricao: 'Analisar e representar, com ou sem o uso de dispositivos e de aplicativos digitais específicos, as transformações e conservações em sistemas.' },
        { codigo: 'EM13CNT102', descricao: 'Realizar previsões, avaliar intervenções e/ou construir protótipos de sistemas térmicos que visem à sustentabilidade.' },
        { codigo: 'EM13CNT103', descricao: 'Utilizar o conhecimento sobre as radiações e suas origens para avaliar as potencialidades e os riscos de sua aplicação em equipamentos de uso cotidiano.' },
        { codigo: 'EM13CNT201', descricao: 'Analisar e discutir modelos, teorias e leis propostos em diferentes épocas e culturas para comparar distintas explicações sobre o surgimento da vida.' },
        { codigo: 'EM13CNT202', descricao: 'Analisar as diversas formas de manifestação da vida em seus diferentes níveis de organização.' },
        { codigo: 'EM13CNT301', descricao: 'Construir questões, elaborar hipóteses, previsões e estimativas, empregar instrumentos de medição e representar e interpretar modelos explicativos.' },
        { codigo: 'EM13CNT302', descricao: 'Comunicar, para públicos variados, em diversos contextos, resultados de análises, pesquisas e/ou experimentos.' }
      ],
      'Ciências Humanas e Sociais Aplicadas': [
        { codigo: 'EM13CHS101', descricao: 'Identificar, analisar e comparar diferentes fontes e narrativas expressas em diversas linguagens.' },
        { codigo: 'EM13CHS102', descricao: 'Identificar, analisar e discutir as circunstâncias históricas, geográficas, políticas, econômicas, sociais, ambientais e culturais.' },
        { codigo: 'EM13CHS103', descricao: 'Elaborar hipóteses, selecionar evidências e compor argumentos relativos a processos políticos, econômicos, sociais, ambientais, culturais e epistemológicos.' },
        { codigo: 'EM13CHS201', descricao: 'Analisar e caracterizar as dinâmicas das populações, das mercadorias, do capital, da informação e da cultura e da política.' },
        { codigo: 'EM13CHS202', descricao: 'Analisar e avaliar os impactos das tecnologias na estruturação e nas dinâmicas de grupos, povos e sociedades contemporâneos.' },
        { codigo: 'EM13CHS301', descricao: 'Problematizar hábitos e práticas individuais e coletivos de produção, reaproveitamento e descarte de resíduos em metrópoles, áreas urbanas e rurais.' },
        { codigo: 'EM13CHS302', descricao: 'Analisar e avaliar criticamente as relações de diferentes grupos, povos e sociedades com a natureza (produção, distribuição e consumo).' }
      ]
    }
  }
};

// Função auxiliar para obter competências por faixa etária
export const obterCompetenciasPorFaixaEtaria = (faixaEtariaId) => {
  return COMPETENCIAS_BNCC[faixaEtariaId] || null;
};

// Função auxiliar para obter todas as competências de uma faixa como array simples
export const obterCompetenciasFlat = (faixaEtariaId) => {
  const dados = COMPETENCIAS_BNCC[faixaEtariaId];
  if (!dados) return [];

  let competencias = [];

  // Educação Infantil - Creche e Pré-escola
  if (dados.campos_experiencia) {
    Object.keys(dados.campos_experiencia).forEach(campo => {
      competencias = competencias.concat(dados.campos_experiencia[campo]);
    });
  }

  // Ensino Fundamental e Médio
  if (dados.areas) {
    Object.keys(dados.areas).forEach(area => {
      competencias = competencias.concat(dados.areas[area]);
    });
  }

  return competencias;
};
