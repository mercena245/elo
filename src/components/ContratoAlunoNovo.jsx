import React, { useEffect, useState } from 'react';

const ContratoAlunoNovo = ({ aluno, database, getData, onClose }) => {
  const [configEscola, setConfigEscola] = useState({
    nomeEscola: '',
    nome: '',
    cnpj: '',
    endereco: '',
    diretor: '',
    telefone: '',
    email: ''
  });
  const [carregando, setCarregando] = useState(true);
  const [contratoHtml, setContratoHtml] = useState('');

  // Carregar configurações da escola
  useEffect(() => {
    const carregarConfigEscola = async () => {
      console.log('📄 [Contrato] Iniciando carregamento...');
      
      if (!getData) {
        console.log('⚠️ [Contrato] getData não disponível');
        setCarregando(false);
        return;
      }

      try {
        console.log('📡 [Contrato] Buscando configurações da escola...');
        const config = await getData('configuracoes/escola');
        
        if (config) {
          console.log('✅ [Contrato] Configurações carregadas:', config);
          setConfigEscola(config);
        } else {
          console.log('⚠️ [Contrato] Configurações não encontradas');
        }
      } catch (error) {
        console.error('❌ [Contrato] Erro ao carregar configurações:', error);
      } finally {
        setCarregando(false);
      }
    };

    carregarConfigEscola();
  }, [getData]);

  // Gerar contrato quando dados estiverem disponíveis
  useEffect(() => {
    if (!carregando && aluno && (configEscola.nomeEscola || configEscola.nome)) {
      console.log('🎨 [Contrato] Gerando contrato com dados:', { aluno, configEscola });
      const html = gerarContratoHtml();
      setContratoHtml(html);
      console.log('✅ [Contrato] HTML gerado com sucesso');
    }
  }, [carregando, aluno, configEscola]);

  // ==================== FUNÇÕES DE FORMATAÇÃO ====================

  const parseData = (data) => {
    if (!data) return null;
    
    try {
      if (data instanceof Date) return data;
      
      if (typeof data === 'string' && data.includes('/')) {
        const [dia, mes, ano] = data.split('/');
        return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      }
      
      return new Date(data);
    } catch (error) {
      console.error('Erro ao parsear data:', error);
      return null;
    }
  };

  const formatarData = (data) => {
    if (!data) return '';
    try {
      const date = parseData(data);
      if (!date || isNaN(date.getTime())) return '';
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return '';
    }
  };

  const formatarDataExtenso = (data) => {
    if (!data) return '';
    try {
      const date = parseData(data);
      if (!date || isNaN(date.getTime())) return '';
      const dia = date.getDate();
      const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                     'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      const mes = meses[date.getMonth()];
      const ano = date.getFullYear();
      return `${dia} de ${mes} de ${ano}`;
    } catch (error) {
      return '';
    }
  };

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return 0;
    try {
      const hoje = new Date();
      const nascimento = parseData(dataNascimento);
      if (!nascimento || isNaN(nascimento.getTime())) return 0;
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const mes = hoje.getMonth() - nascimento.getMonth();
      if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }
      return idade;
    } catch (error) {
      return 0;
    }
  };

  const formatarCPF = (cpf) => {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatarCEP = (cep) => {
    if (!cep) return '';
    const numeros = cep.replace(/\D/g, '');
    return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const formatarTelefone = (telefone) => {
    if (!telefone) return '';
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  };

  const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00';
    const num = parseFloat(valor);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const valorPorExtenso = (valor) => {
    // Implementação simplificada - você pode usar uma biblioteca completa
    const num = parseFloat(valor);
    return `${num.toFixed(2).replace('.', ',')} reais`;
  };

  const obterNomeTurma = () => {
    return aluno.turma || 'Série/Turma não definida';
  };

  const obterTurnoTurma = () => {
    if (aluno.turno) return aluno.turno.toUpperCase();
    if (aluno.turmaInfo?.turno) return aluno.turmaInfo.turno.toUpperCase();
    return 'NÃO DEFINIDO';
  };

  const obterNivelEnsino = () => {
    // Você pode mapear baseado na turma
    if (aluno.turma?.toLowerCase().includes('maternal') || 
        aluno.turma?.toLowerCase().includes('berçário')) {
      return 'EDUCAÇÃO INFANTIL';
    }
    if (aluno.turma?.toLowerCase().includes('fundamental')) {
      return 'ENSINO FUNDAMENTAL';
    }
    if (aluno.turma?.toLowerCase().includes('médio')) {
      return 'ENSINO MÉDIO';
    }
    return 'EDUCAÇÃO BÁSICA';
  };

  const obterAnoLetivo = () => {
    if (aluno.financeiro?.dataInicioCompetencia) {
      const data = parseData(aluno.financeiro.dataInicioCompetencia);
      if (data && !isNaN(data.getTime())) {
        return data.getFullYear();
      }
    }
    return new Date().getFullYear();
  };

  const obterCidadeEscola = () => {
    const endereco = configEscola?.endereco || '';
    if (endereco.includes('Goiânia') || endereco.toLowerCase().includes('goiania')) {
      return 'Goiânia/GO';
    }
    const match = endereco.match(/([A-ZÀ-Ú][a-zà-ú\s]+)\s*-\s*([A-Z]{2})/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
    return 'comarca local';
  };

  const extrairCidade = (endereco) => {
    if (!endereco) return '';
    const match = endereco.match(/([A-ZÀ-Ú][a-zà-ú\s]+)\s*-\s*([A-Z]{2})/);
    return match ? match[1] : '';
  };

  const extrairUF = (endereco) => {
    if (!endereco) return '';
    const match = endereco.match(/([A-Z]{2})\s*$/);
    return match ? match[1] : '';
  };

  const obterResponsavelFinanceiro = () => {
    if (aluno.mae?.responsavelFinanceiro) {
      return {
        tipo: 'MÃE',
        nome: aluno.mae.nome,
        texto: 'Responsável Financeiro pelos pagamentos referidos neste contrato.'
      };
    }
    if (aluno.pai?.responsavelFinanceiro) {
      return {
        tipo: 'PAI',
        nome: aluno.pai.nome,
        texto: 'Responsável Financeiro pelos pagamentos referidos neste contrato.'
      };
    }
    return {
      tipo: '',
      nome: '',
      texto: ''
    };
  };

  // ==================== GERAÇÃO DO CONTRATO HTML ====================

  const gerarContratoHtml = () => {
    console.log('🎨 [gerarContratoHtml] Iniciando geração do contrato...');
    console.log('📋 [gerarContratoHtml] Aluno:', aluno?.nome);
    console.log('🏫 [gerarContratoHtml] Escola:', configEscola?.nomeEscola);
    
    const respFinanceiro = obterResponsavelFinanceiro();
    const dataHoje = new Date();
    
    // Objeto com todas as variáveis para substituição
    const variaveis = {
      // Aluno
      NOME_ALUNO: aluno.nome?.toUpperCase() || 'NÃO INFORMADO',
      CPF_ALUNO: formatarCPF(aluno.cpf),
      DATA_NASCIMENTO: formatarData(aluno.dataNascimento),
      IDADE: calcularIdade(aluno.dataNascimento),
      TURMA: obterNomeTurma(),
      TURNO: obterTurnoTurma(),
      NIVEL_ENSINO: obterNivelEnsino(),
      ANO_LETIVO: obterAnoLetivo(),
      
      // Mãe
      NOME_MAE: aluno.mae?.nome?.toUpperCase() || 'NÃO INFORMADO',
      CPF_MAE: formatarCPF(aluno.mae?.cpf),
      RG_MAE: aluno.mae?.rg || '',
      ENDERECO_COMPLETO_MAE: `${aluno.mae?.endereco?.rua || ''}, ${aluno.mae?.endereco?.bairro || ''}, ${aluno.mae?.endereco?.cidade || ''} - ${aluno.mae?.endereco?.uf || ''}`,
      CEP_MAE: formatarCEP(aluno.mae?.endereco?.cep),
      TELEFONE_MAE: formatarTelefone(aluno.mae?.telefone),
      RESPONSAVEL_FINANCEIRO_MAE: respFinanceiro.tipo === 'MÃE' ? '<strong>' + respFinanceiro.texto + '</strong>' : '',
      
      // Pai
      NOME_PAI: aluno.pai?.nome?.toUpperCase() || 'NÃO INFORMADO',
      CPF_PAI: formatarCPF(aluno.pai?.cpf),
      RG_PAI: aluno.pai?.rg || '',
      ENDERECO_COMPLETO_PAI: `${aluno.pai?.endereco?.rua || ''}, ${aluno.pai?.endereco?.bairro || ''}, ${aluno.pai?.endereco?.cidade || ''} - ${aluno.pai?.endereco?.uf || ''}`,
      CEP_PAI: formatarCEP(aluno.pai?.endereco?.cep),
      TELEFONE_PAI: formatarTelefone(aluno.pai?.telefone),
      RESPONSAVEL_FINANCEIRO_PAI: respFinanceiro.tipo === 'PAI' ? '<strong>' + respFinanceiro.texto + '</strong>' : '',
      
      // Escola
      NOME_ESCOLA: (configEscola.nomeEscola || configEscola.nome || 'ESCOLA')?.toUpperCase(),
      CNPJ_ESCOLA: configEscola.cnpj || '',
      ENDERECO_ESCOLA: configEscola.endereco || '',
      NOME_DIRETOR: configEscola.diretor?.toUpperCase() || '',
      EMAIL_CONTATO: configEscola.email || '',
      
      // Financeiro
      VALOR_PARCELA: formatarValor(aluno.financeiro?.mensalidadeValor),
      VALOR_DESCONTO: formatarValor(aluno.financeiro?.descontoPercentual ? 
        aluno.financeiro.mensalidadeValor * (aluno.financeiro.descontoPercentual / 100) : 0),
      VALOR_FINAL: formatarValor(aluno.financeiro?.mensalidadeValor ? 
        aluno.financeiro.mensalidadeValor * (1 - (aluno.financeiro.descontoPercentual || 0) / 100) : 0),
      DIA_VENCIMENTO: aluno.financeiro?.diaVencimento || '10',
      DATA_INICIO_COMPETENCIA: formatarData(aluno.financeiro?.dataInicioCompetencia),
      DATA_FIM_COMPETENCIA: formatarData(aluno.financeiro?.dataFimCompetencia),
      
      // Datas
      DATA_ASSINATURA_EXTENSO: formatarDataExtenso(aluno.dataMatricula || dataHoje),
      CIDADE_ESCOLA: extrairCidade(configEscola.endereco) || 'Goiânia'
    };

    // Template do contrato - Apenas conteúdo (sem HTML/HEAD/BODY)
    let html = `
<style>
  @page {
    size: A4 portrait;
    margin: 1.5cm;
  }
  .contrato-wrapper {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #000;
    background: white;
    padding: 15mm;
    max-width: 210mm;
    margin: 0 auto;
  }
  .contrato-wrapper h1 {
    text-align: center;
    font-size: 13pt;
    font-weight: bold;
    margin: 10px 0 8px;
    text-transform: uppercase;
    page-break-after: avoid;
  }
  .contrato-wrapper h2 {
    text-align: center;
    font-size: 11pt;
    font-weight: bold;
    margin: 5px 0 10px;
    page-break-after: avoid;
  }
  .contrato-wrapper h3 {
    font-size: 10pt;
    font-weight: bold;
    margin: 10px 0 6px;
    text-transform: uppercase;
    page-break-after: avoid;
  }
  .contrato-wrapper .clausula {
    margin: 12px 0;
    page-break-inside: auto;
  }
  .contrato-wrapper .clausula-title {
    font-weight: bold;
    text-transform: uppercase;
    margin: 10px 0 6px;
    font-size: 10pt;
    page-break-after: avoid;
  }
  .contrato-wrapper .paragrafo {
    text-align: justify;
    margin: 6px 0;
    line-height: 1.5;
  }
  .contrato-wrapper .info-qualificacao {
    margin: 6px 0;
    line-height: 1.5;
    text-align: justify;
  }
  .contrato-wrapper .info-qualificacao p {
    margin: 5px 0;
  }
  .contrato-wrapper .info-destaque {
    font-weight: bold;
  }
  .contrato-wrapper table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    page-break-inside: avoid;
  }
  .contrato-wrapper th, 
  .contrato-wrapper td {
    border: 1px solid #000;
    padding: 5px;
    text-align: center;
    font-size: 9pt;
  }
  .contrato-wrapper th {
    background-color: #f0f0f0;
    font-weight: bold;
  }
  .contrato-wrapper .assinatura {
    margin-top: 25px;
    page-break-inside: avoid;
  }
  .contrato-wrapper .linha-assinatura {
    margin: 20px auto 3px;
    border-top: 1px solid #000;
    width: 55%;
  }
  .contrato-wrapper .bloco-assinatura {
    text-align: center;
    margin: 15px 0;
    page-break-inside: avoid;
  }
  .contrato-wrapper hr {
    border: none;
    border-top: 1.5px solid #000;
    margin: 12px 0;
  }
  .contrato-wrapper ul {
    margin: 6px 0 6px 30px;
  }
  .contrato-wrapper li {
    margin: 3px 0;
    text-align: justify;
  }
  .contrato-wrapper strong {
    font-weight: bold;
  }
  @media print {
    @page {
      size: A4 portrait;
      margin: 1.5cm;
    }
    .contrato-wrapper {
      padding: 0 !important;
      margin: 0 !important;
      max-width: none !important;
    }
    .no-print {
      display: none !important;
    }
    .page-break {
      page-break-before: always;
    }
    h1, h2, h3, .clausula-title {
      page-break-after: avoid !important;
      }
    .clausula {
      page-break-inside: auto !important;
    }
    table, .bloco-assinatura {
      page-break-inside: avoid !important;
    }
  }
</style>

<div class="contrato-wrapper">

<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</h1>
<h2>ANO LETIVO ${variaveis.ANO_LETIVO}</h2>

<hr>

<h3>QUALIFICAÇÃO DAS PARTES</h3>

<div class="info-qualificacao">
  <p><span class="info-destaque">ALUNO(A) BENEFICIÁRIO(A):</span> ${variaveis.NOME_ALUNO}, CPF N.º ${variaveis.CPF_ALUNO}, nascido(a) em ${variaveis.DATA_NASCIMENTO}, com ${variaveis.IDADE} anos de idade, apto(a) a cursar o(a) ${variaveis.TURMA} da ${variaveis.NIVEL_ENSINO}, turno ${variaveis.TURNO}, no ano letivo de ${variaveis.ANO_LETIVO}.</p>

  <p><span class="info-destaque">CONTRATANTE 1 (MÃE):</span> ${variaveis.NOME_MAE}, CPF N.º ${variaveis.CPF_MAE}, Identidade N.º ${variaveis.RG_MAE}, residente e domiciliada à ${variaveis.ENDERECO_COMPLETO_MAE}, CEP ${variaveis.CEP_MAE}. Telefone: ${variaveis.TELEFONE_MAE}. ${variaveis.RESPONSAVEL_FINANCEIRO_MAE}</p>

  <p><span class="info-destaque">CONTRATANTE 2 (PAI):</span> ${variaveis.NOME_PAI}, CPF N.º ${variaveis.CPF_PAI}, Identidade N.º ${variaveis.RG_PAI}, residente e domiciliado à ${variaveis.ENDERECO_COMPLETO_PAI}, CEP ${variaveis.CEP_PAI}. Telefone: ${variaveis.TELEFONE_PAI}. ${variaveis.RESPONSAVEL_FINANCEIRO_PAI}</p>

  <p><span class="info-destaque">CONTRATADA:</span> ${variaveis.NOME_ESCOLA}, pessoa jurídica de direito privado, devidamente inscrita no CNPJ N.º ${variaveis.CNPJ_ESCOLA}, neste ato representada por seu(sua) Diretor(a) e Representante Legal, ${variaveis.NOME_DIRETOR}, conforme Contrato Social, situada à ${variaveis.ENDERECO_ESCOLA}.</p>
</div>

<hr>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA PRIMEIRA - DO OBJETO DO CONTRATO</div>
  
  <p class="paragrafo">O presente contrato tem por objeto a prestação de serviços educacionais pela CONTRATADA ao aluno(a) acima qualificado, referente ao ano letivo de ${variaveis.ANO_LETIVO}, correspondente ao(à) ${variaveis.TURMA} do turno ${variaveis.TURNO}.</p>

  <p class="paragrafo"><strong>§ 1º</strong> - Os serviços educacionais serão prestados em conformidade com:</p>
  <ul>
    <li>Lei n.º 9.394/96 (LDB - Lei de Diretrizes e Bases da Educação Nacional);</li>
    <li>Base Nacional Comum Curricular (BNCC);</li>
    <li>Regimento Escolar da CONTRATADA, devidamente aprovado;</li>
    <li>Projeto Político Pedagógico (PPP) da instituição;</li>
    <li>Lei n.º 9.870/99 (anuidades escolares);</li>
    <li>Lei n.º 13.709/2018 (LGPD - Lei Geral de Proteção de Dados);</li>
    <li>Lei n.º 8.069/90 (ECA - Estatuto da Criança e do Adolescente).</li>
  </ul>

  <p class="paragrafo"><strong>§ 2º</strong> - Os serviços educacionais compreendem exclusivamente as atividades curriculares obrigatórias, ministradas coletivamente para toda a turma/série, no horário regular de aulas.</p>

  <p class="paragrafo"><strong>§ 3º</strong> - As aulas poderão ser ministradas presencialmente, de forma remota ou híbrida, conforme determinação de autoridades sanitárias e educacionais, sem alteração do valor pactuado.</p>

  <p class="paragrafo"><strong>§ 4º</strong> - Os CONTRATANTES declaram ter conhecimento prévio do Regimento Escolar, normas internas e calendário, que integram este contrato.</p>
</div>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA SEGUNDA - DAS CONDIÇÕES DE MATRÍCULA</div>
  
  <p class="paragrafo">A matrícula somente será válida mediante:</p>
  <ul>
    <li>Assinatura deste contrato por ambos os CONTRATANTES;</li>
    <li>Pagamento da 1ª parcela, que constitui sinal e arras (arts. 417 a 420 do Código Civil);</li>
    <li>Quitação de débitos anteriores, se houver;</li>
    <li>Apresentação da documentação completa exigida;</li>
    <li>Realização de anamnese, quando solicitado.</li>
  </ul>

  <p class="paragrafo"><strong>§ 1º</strong> - Em caso de desistência ANTES do início do ano letivo, a CONTRATADA reterá 20% do valor pago a título de custos administrativos.</p>

  <p class="paragrafo"><strong>§ 2º</strong> - NÃO haverá devolução de valores após o início do ano letivo.</p>
</div>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA TERCEIRA - DOS SERVIÇOS NÃO INCLUÍDOS</div>
  
  <p class="paragrafo">A anuidade escolar NÃO abrange:</p>
  <ul>
    <li>Uniforme escolar (obrigatório);</li>
    <li>Material escolar individual;</li>
    <li>Material de higiene pessoal;</li>
    <li>Transporte escolar;</li>
    <li>Livros didáticos e apostilas;</li>
    <li>Atividades extracurriculares opcionais;</li>
    <li>Eventos especiais (formaturas, excursões);</li>
    <li>Segunda via de documentos;</li>
    <li>Serviços de recuperação, reforço, segunda chamada;</li>
    <li>Atendimento terapêutico especializado.</li>
  </ul>
</div>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA QUARTA - DO VALOR E FORMA DE PAGAMENTO</div>
  
  <p class="paragrafo">A anuidade escolar para o ano letivo de ${variaveis.ANO_LETIVO} será paga em 12 (doze) parcelas mensais:</p>

  <table>
    <thead>
      <tr>
        <th>Parcelas</th>
        <th>Vencimento</th>
        <th>Valor Nominal</th>
        <th>Desconto Pontual.</th>
        <th>Valor Final</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>01 a 12</td>
        <td>Dia ${variaveis.DIA_VENCIMENTO}</td>
        <td>${variaveis.VALOR_PARCELA}</td>
        <td>${variaveis.VALOR_DESCONTO}</td>
        <td>${variaveis.VALOR_FINAL}</td>
      </tr>
    </tbody>
  </table>

  <p class="paragrafo"><strong>Competência das Mensalidades:</strong> ${variaveis.DATA_INICIO_COMPETENCIA} a ${variaveis.DATA_FIM_COMPETENCIA}</p>

  <p class="paragrafo"><strong>§ 1º</strong> - Vencimento: todo dia ${variaveis.DIA_VENCIMENTO} de cada mês.</p>

  <p class="paragrafo"><strong>§ 2º</strong> - Desconto de pontualidade: válido até o dia 07 de cada mês.</p>

  <p class="paragrafo"><strong>§ 3º</strong> - Após o dia 10: incidirão multa de 2% e juros de 1% ao mês.</p>

  <p class="paragrafo"><strong>§ 4º</strong> - Pagamento exclusivamente via boleto bancário, PIX ou transferência fornecidos pela CONTRATADA.</p>

  <p class="paragrafo"><strong>§ 5º</strong> - O não recebimento do boleto NÃO exime do pagamento. Solicitar 2ª via na secretaria.</p>

  <p class="paragrafo"><strong>§ 6º</strong> - Descontos são mera liberalidade, não gerando direito adquirido.</p>

  <p class="paragrafo"><strong>§ 7º</strong> - A ausência do aluno não exime do pagamento (férias, viagens, doença).</p>
</div>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA QUINTA - DA INADIMPLÊNCIA</div>
  
  <p class="paragrafo"><strong>Atraso de 1 a 30 dias:</strong></p>
  <ul>
    <li>Perda do desconto de pontualidade;</li>
    <li>Incidência de multa e juros.</li>
  </ul>

  <p class="paragrafo"><strong>Atraso superior a 30 dias:</strong></p>
  <ul>
    <li>Suspensão de atividades extracurriculares;</li>
    <li>Encaminhamento para empresa de cobrança (acréscimo de 20%).</li>
  </ul>

  <p class="paragrafo"><strong>Atraso superior a 90 dias:</strong></p>
  <ul>
    <li>Inscrição em SPC/SERASA;</li>
    <li>Protesto do título;</li>
    <li>Execução judicial (honorários de 20% sobre o débito);</li>
    <li>Impedimento de renovação da matrícula (Lei n.º 9.870/99).</li>
  </ul>

  <p class="paragrafo"><strong>§ Único</strong> - Para transferência ou emissão de documentos finais, é obrigatória a quitação de todos os débitos.</p>
</div>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA SEXTA - DO REAJUSTE ANUAL</div>
  
  <p class="paragrafo">O valor da anuidade poderá ser reajustado anualmente, observando:</p>
  <ul>
    <li>Índice oficial de correção (IGPM-FGV, IPCA ou substituto);</li>
    <li>Lei n.º 9.870/99;</li>
    <li>Comunicação prévia de 45 dias.</li>
  </ul>
</div>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA SÉTIMA - DA RESCISÃO</div>
  
  <p class="paragrafo"><strong>Por iniciativa dos CONTRATANTES:</strong></p>
  <ul>
    <li>Comunicação por escrito com 30 dias de antecedência;</li>
    <li>Quitação de todas as parcelas vencidas;</li>
    <li>Multa de 1 mensalidade se não comunicado com antecedência.</li>
  </ul>

  <p class="paragrafo"><strong>Por iniciativa da CONTRATADA:</strong></p>
  <ul>
    <li>Inadimplência superior a 90 dias;</li>
    <li>Descumprimento do Regimento Escolar;</li>
    <li>Atos de indisciplina grave ou reiterada;</li>
    <li>Incompatibilidade com o regime pedagógico;</li>
    <li>Agressões físicas ou verbais;</li>
    <li>Danos ao patrimônio.</li>
  </ul>

  <p class="paragrafo"><strong>§ Único</strong> - A mera infrequência NÃO caracteriza rescisão. É necessário formalizar o pedido.</p>
</div>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA OITAVA - DAS OBRIGAÇÕES DA CONTRATADA</div>
  
  <ul>
    <li>Prestar serviços educacionais conforme legislação vigente;</li>
    <li>Manter corpo docente habilitado;</li>
    <li>Fornecer infraestrutura adequada;</li>
    <li>Comunicar alterações administrativas;</li>
    <li>Notificar o Conselho Tutelar (faltas > 30%, suspeita de maus-tratos);</li>
    <li>Estabelecer protocolos de segurança e saúde;</li>
    <li>Zelar pela integridade dos alunos durante o horário escolar;</li>
    <li>Respeitar a LGPD no tratamento de dados;</li>
    <li>Disponibilizar o Regimento Escolar.</li>
  </ul>
</div>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA NONA - DAS OBRIGAÇÕES DOS CONTRATANTES</div>
  
  <ul>
    <li>Efetuar pontualmente o pagamento das parcelas;</li>
    <li>Garantir frequência regular do aluno;</li>
    <li>Providenciar uniforme e material escolar;</li>
    <li>Acompanhar o desenvolvimento pedagógico;</li>
    <li>Respeitar o Regimento Escolar e normas internas;</li>
    <li>Comunicar mudanças de endereço/telefone;</li>
    <li>Informar condições especiais de saúde;</li>
    <li>Apresentar laudos médicos quando solicitado;</li>
    <li>Ressarcir danos causados pelo aluno;</li>
    <li>Assinar documentos expedidos pela escola;</li>
    <li>Informar sobre doenças infectocontagiosas.</li>
  </ul>

  <p class="paragrafo"><strong>§ Único</strong> - Os CONTRATANTES respondem solidariamente por todas as obrigações.</p>
</div>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA DÉCIMA - DA GUARDA E AUTORIZAÇÃO DE SAÍDA</div>
  
  <p class="paragrafo">Os CONTRATANTES declaram possuir guarda compartilhada do aluno, salvo decisão judicial em contrário.</p>

  <p class="paragrafo">Qualquer alteração no regime de guarda deverá ser comunicada IMEDIATAMENTE à CONTRATADA.</p>

  <p class="paragrafo">Para autorizar terceiros a retirar o aluno, comunicar por escrito via e-mail: ${variaveis.EMAIL_CONTATO}</p>
</div>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA DÉCIMA PRIMEIRA - DA RESPONSABILIDADE POR OBJETOS</div>
  
  <p class="paragrafo">A CONTRATADA NÃO se responsabiliza por:</p>
  <ul>
    <li>Objetos de valor, celulares, eletrônicos, dinheiro;</li>
    <li>Quedas acidentais durante atividades escolares;</li>
    <li>Desentendimentos entre alunos;</li>
    <li>Veículos estacionados nas dependências ou proximidades.</li>
  </ul>
</div>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA DÉCIMA SEGUNDA - DA LGPD E UTILIZAÇÃO DE IMAGEM</div>
  
  <p class="paragrafo">Os CONTRATANTES AUTORIZAM a utilização da imagem, voz e nome do aluno para:</p>
  <ul>
    <li>Divulgação de atividades pedagógicas;</li>
    <li>Redes sociais institucionais;</li>
    <li>Materiais de divulgação;</li>
    <li>Aulas gravadas para uso pedagógico;</li>
    <li>Registro de memória institucional.</li>
  </ul>

  <p class="paragrafo">Os CONTRATANTES CONSENTEM o tratamento de dados pessoais do aluno, incluindo dados sensíveis (saúde, biometria), em conformidade com a Lei n.º 13.709/2018 (LGPD).</p>

  <p class="paragrafo">A CONTRATADA compromete-se a manter segurança da informação e NÃO transferir dados a terceiros, salvo obrigação legal.</p>
</div>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA DÉCIMA TERCEIRA - DAS NECESSIDADES EDUCACIONAIS ESPECIAIS</div>
  
  <p class="paragrafo">A CONTRATADA poderá solicitar laudos médicos que atestem deficiências, transtornos, altas habilidades ou alergias alimentares.</p>

  <p class="paragrafo">É obrigatória a apresentação de avaliações de especialistas (neurologista, fonoaudiólogo, terapeuta ocupacional, psicólogo).</p>

  <p class="paragrafo">Os serviços são estritamente EDUCACIONAIS, não incluindo atendimento terapêutico ou acompanhante individual.</p>
</div>

<div class="clausula">
  <div class="clausula-title">CLÁUSULA DÉCIMA QUARTA - DO FORO</div>
  
  <p class="paragrafo">As partes elegem o foro da Comarca de ${variaveis.CIDADE_ESCOLA} para dirimir quaisquer questões oriundas deste contrato, com renúncia a qualquer outro.</p>
</div>

<hr>

<h3 style="text-align: center; margin-top: 20px;">DECLARAÇÕES FINAIS</h3>

<p class="paragrafo">Os CONTRATANTES declaram que leram, compreenderam e concordam com todas as cláusulas deste contrato, tendo tido acesso prévio ao Regimento Escolar, conhecimento do valor da anuidade e das condições de pagamento.</p>

<hr>

<div class="assinatura">
  <p style="text-align: center;"><strong>${variaveis.CIDADE_ESCOLA}, ${variaveis.DATA_ASSINATURA_EXTENSO}.</strong></p>
  
  <div class="bloco-assinatura">
    <div class="linha-assinatura"></div>
    <p><strong>PELA CONTRATADA</strong></p>
    <p><strong>${variaveis.NOME_ESCOLA}</strong></p>
    <p>CNPJ N.º ${variaveis.CNPJ_ESCOLA}</p>
    <p>Representante Legal: ${variaveis.NOME_DIRETOR}</p>
  </div>
  
  <div class="bloco-assinatura">
    <div class="linha-assinatura"></div>
    <p><strong>CONTRATANTE 1</strong></p>
    <p><strong>${variaveis.NOME_MAE}</strong></p>
    <p>CPF N.º ${variaveis.CPF_MAE}</p>
    <p>Responsável Solidário</p>
  </div>
  
  <div class="bloco-assinatura">
    <div class="linha-assinatura"></div>
    <p><strong>CONTRATANTE 2</strong></p>
    <p><strong>${variaveis.NOME_PAI}</strong></p>
    <p>CPF N.º ${variaveis.CPF_PAI}</p>
    <p>Responsável Solidário</p>
  </div>

  <div style="margin-top: 30px; display: flex; justify-content: space-between;">
    <div style="width: 45%;">
      <div class="linha-assinatura"></div>
      <p style="text-align: center; font-size: 9pt;">Testemunha 1</p>
      <p style="text-align: center; font-size: 8pt;">Nome:<br>CPF:</p>
    </div>
    <div style="width: 45%;">
      <div class="linha-assinatura"></div>
      <p style="text-align: center; font-size: 9pt;">Testemunha 2</p>
      <p style="text-align: center; font-size: 8pt;">Nome:<br>CPF:</p>
    </div>
  </div>
</div>

<div style="margin-top: 30px; font-size: 8pt; text-align: center; color: #666; page-break-inside: avoid;">
  <hr style="margin: 20px 0;">
  <p><em>Contrato elaborado em conformidade com:</em></p>
  <p>Lei n.º 9.394/1996 (LDB) • Lei n.º 9.870/1999 (Anuidades) • Lei n.º 8.069/1990 (ECA)</p>
  <p>Lei n.º 13.709/2018 (LGPD) • Código Civil (Lei n.º 10.406/2002) • CDC (Lei n.º 8.078/1990)</p>
</div>

</div>
<!-- Fim do contrato-wrapper -->
    `;

    return html;
  };

  const handlePrint = () => {
    window.print();
  };

  // ==================== RENDERIZAÇÃO ====================

  // Mostra loading apenas se estiver carregando E não tiver HTML
  if (carregando && !contratoHtml) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px',
        minHeight: '300px'
      }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '20px', color: '#666' }}>Carregando dados do contrato...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!aluno) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>❌ Erro: Dados do aluno não encontrados</p>
      </div>
    );
  }

  // Se não tem HTML gerado ainda mas tem aluno, mostra mensagem
  if (!contratoHtml) {
    console.log('⚠️ [Contrato] HTML não gerado ainda. Estado:', { carregando, aluno: !!aluno, configEscola });
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#f59e0b' }}>⏳ Aguardando dados do contrato...</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          {!(configEscola.nomeEscola || configEscola.nome) && 'Carregando configurações da escola...'}
        </p>
      </div>
    );
  }

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
      {/* Botão de Imprimir - Visível apenas na tela */}
      <div style={{ 
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'white',
        padding: '10px 20px',
        borderBottom: '2px solid #e5e7eb',
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end'
      }} className="no-print">
        <button
          onClick={handleImprimir}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          🖨️ Imprimir Contrato
        </button>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
          >
            ✕ Fechar
          </button>
        )}
      </div>
      
      {/* Conteúdo do Contrato */}
      <div 
        dangerouslySetInnerHTML={{ __html: contratoHtml }}
        style={{ width: '100%' }}
        className="contrato-content"
      />
      
      {/* Estilos para impressão */}
      <style>{`
        @media print {
          /* Oculta botões na impressão */
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ContratoAlunoNovo;
