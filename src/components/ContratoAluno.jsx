import React, { useEffect, useState } from 'react';

const ContratoAluno = ({ aluno, database, getData, onClose }) => {
  const [configEscola, setConfigEscola] = useState({
    nomeEscola: 'ESCOLA DO REINO LTDA',
    cnpj: '57.610.785/0001-31',
    endereco: 'RUA LIMA BARRETO, N° 489, QD. 40 LT. 12, JARDIM VILA BOA, CEP 74360-350 GOIÂNIA-GO',
    diretor: 'JULIANA ELZA BORBA PEREIRA'
  }); // Valores padrão
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarConfigEscola = async () => {
      console.log('📄 [Contrato] Iniciando carregamento...', { database, getData, aluno });
      
      if (!getData) {
        console.log('⏳ [Contrato] Aguardando getData...');
        setTimeout(() => {
          if (!getData) {
            console.log('⚠️ [Contrato] getData não disponível, usando valores padrão');
            setCarregando(false);
          }
        }, 2000);
        return;
      }

      try {
        console.log('📡 [Contrato] Buscando configurações da escola...');
        const config = await getData('configuracoes/escola');
        
        if (config) {
          console.log('✅ [Contrato] Configurações carregadas do banco:', config);
          console.log('📋 [Contrato] Dados que serão exibidos:', {
            nomeEscola: config.nomeEscola,
            cnpj: config.cnpj,
            diretor: config.diretor,
            endereco: config.endereco
          });
          // Substituir completamente pelos dados do banco
          setConfigEscola(config);
        } else {
          console.log('⚠️ [Contrato] Nenhuma configuração encontrada no caminho: configuracoes/escola');
          console.log('⚠️ [Contrato] Usando valores padrão');
          // Manter valores padrão
        }
      } catch (error) {
        console.error('❌ [Contrato] Erro ao carregar configurações:', error);
        // Manter valores padrão em caso de erro
      } finally {
        setCarregando(false);
        console.log('✔️ [Contrato] Carregamento finalizado');
      }
    };

    carregarConfigEscola();
  }, [getData, aluno]);

  // Log quando configEscola mudar
  useEffect(() => {
    console.log('🔄 [Contrato] Estado configEscola atualizado:', configEscola);
  }, [configEscola]);

  const handlePrint = () => {
    window.print();
  };

  const parseData = (data) => {
    if (!data) return null;
    
    try {
      // Se já for um objeto Date
      if (data instanceof Date) return data;
      
      // Se for string no formato DD/MM/YYYY (brasileiro)
      if (typeof data === 'string' && data.includes('/')) {
        const [dia, mes, ano] = data.split('/');
        // Mês em JS é 0-indexed
        return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      }
      
      // Se for string no formato ISO (YYYY-MM-DD) ou timestamp
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
      // Verificar se a data é válida
      if (!date || isNaN(date.getTime())) return '';
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
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
      console.error('Erro ao formatar data por extenso:', error);
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
      console.error('Erro ao calcular idade:', error);
      return 0;
    }
  };

  const formatarCEP = (cep) => {
    if (!cep) return '';
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const formatarCPF = (cpf) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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

  const obterMensalidadeComDesconto = () => {
    const valor = parseFloat(aluno.financeiro?.mensalidadeValor || 0);
    const desconto = parseFloat(aluno.financeiro?.descontoPercentual || 0);
    return valor * (1 - desconto / 100);
  };

  const obterCidadeEscola = () => {
    const endereco = configEscola?.endereco || '';
    // Tentar extrair cidade do endereço (ex: "Goiânia - GO")
    if (endereco.includes('Goiânia') || endereco.toLowerCase().includes('goiania')) {
      return 'Goiânia/GO';
    }
    // Tentar extrair de padrões comuns
    const match = endereco.match(/([A-ZÀ-Ú][a-zà-ú\s]+)\s*-\s*([A-Z]{2})/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
    return 'comarca local';
  };

  const obterNomeTurma = () => {
    // Se tiver turmaId, buscar nome da turma
    if (aluno.turmaId && aluno.turma) {
      return aluno.turma;
    }
    if (aluno.turma) {
      return aluno.turma;
    }
    return 'Série/Turma';
  };

  const obterTurnoTurma = () => {
    // Retorna o turno formatado ou fallback
    if (aluno.turno) {
      return aluno.turno.toUpperCase();
    }
    // Se não tiver turno direto, pode ter na turma
    if (aluno.turmaInfo?.turno) {
      return aluno.turmaInfo.turno.toUpperCase();
    }
    return 'NÃO DEFINIDO';
  };

  // Mostrar loading enquanto carrega
  if (carregando) {
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
          borderTop: '5px solid #4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '20px', color: '#64748b' }}>Carregando configurações da escola...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Verificar se tem dados mínimos
  if (!aluno) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>❌ Erro: Dados do aluno não encontrados</p>
      </div>
    );
  }

  // Log dos dados que serão renderizados
  console.log('🎨 [Contrato] Renderizando com dados:', {
    configEscola: {
      nomeEscola: configEscola.nomeEscola,
      cnpj: configEscola.cnpj,
      diretor: configEscola.diretor,
      endereco: configEscola.endereco
    },
    aluno: {
      nome: aluno.nome,
      dataNascimento: aluno.dataNascimento,
      turma: aluno.turma,
      turno: aluno.turno
    }
  });

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #contrato-print, #contrato-print * {
              visibility: visible;
            }
            #contrato-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-before: always;
            }
          }

          .contrato-container {
            font-family: 'Times New Roman', Times, serif;
            max-width: 21cm;
            margin: 0 auto;
            padding: 2cm;
            background: white;
            color: #000;
            line-height: 1.6;
          }

          .contrato-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }

          .contrato-title {
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
          }

          .contrato-subtitle {
            font-size: 14px;
            margin-bottom: 5px;
          }

          .clausula {
            margin-top: 25px;
            margin-bottom: 20px;
          }

          .clausula-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
            font-size: 13px;
          }

          .paragrafo {
            text-align: justify;
            margin-bottom: 15px;
            text-indent: 2cm;
            font-size: 12px;
          }

          .paragrafo-title {
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 10px;
          }

          .tabela-valores {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
          }

          .tabela-valores th,
          .tabela-valores td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
          }

          .tabela-valores th {
            background-color: #f0f0f0;
            font-weight: bold;
          }

          .assinaturas {
            margin-top: 60px;
            page-break-inside: avoid;
          }

          .assinatura-linha {
            border-top: 1px solid #000;
            margin-top: 60px;
            padding-top: 5px;
            text-align: center;
            font-size: 12px;
          }

          .info-destaque {
            font-weight: bold;
            display: inline;
          }

          .lista-item {
            margin-left: 40px;
            text-indent: 0;
          }

          .btn-container {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 8px;
          }

          .btn-imprimir {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin: 0 10px;
          }

          .btn-imprimir:hover {
            background: #4338ca;
          }

          .btn-fechar {
            background: #64748b;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin: 0 10px;
          }

          .btn-fechar:hover {
            background: #475569;
          }
        `}
      </style>

      <div className="btn-container no-print">
        <button onClick={handlePrint} className="btn-imprimir">
          🖨️ Imprimir Contrato
        </button>
        <button onClick={onClose} className="btn-fechar">
          ✖️ Fechar
        </button>
      </div>

      <div id="contrato-print" className="contrato-container">
        <div className="contrato-header">
          <div className="contrato-title">
            Contrato de Prestação de Serviços Educacionais
          </div>
          <div className="contrato-subtitle">
            {configEscola.nomeEscola || 'ESCOLA DO REINO LTDA'}
          </div>
          <div className="contrato-subtitle">
            Ano Letivo {obterAnoLetivo()}
          </div>
        </div>

        {/* IDENTIFICAÇÃO DAS PARTES */}
        <div className="clausula">
          <p className="paragrafo">
            <span className="info-destaque">ALUNO(A) BENEFICIÁRIO(A):</span> {aluno.nome?.toUpperCase() || ''}, 
            CPF N.: {formatarCPF(aluno.cpf)}, nascido em: {formatarData(aluno.dataNascimento)}, 
            com {calcularIdade(aluno.dataNascimento)} anos de idade. 
            Apto(a) a cursar o(a) {obterNomeTurma()} do turno {obterTurnoTurma()} no ano letivo de {obterAnoLetivo()}.
          </p>

          <p className="paragrafo">
            <span className="info-destaque">CONTRATANTE 1 (MÃE):</span> {aluno.mae?.nome?.toUpperCase() || ''}, 
            CPF N.: {formatarCPF(aluno.mae?.cpf)}, 
            Identidade N.: {aluno.mae?.rg || ''}, 
            residente e domiciliado(a) à {aluno.mae?.endereco?.rua || ''}, 
            {aluno.mae?.endereco?.bairro ? `, ${aluno.mae.endereco.bairro}` : ''}, 
            CEP {formatarCEP(aluno.mae?.endereco?.cep)}, 
            {aluno.mae?.endereco?.cidade || ''} - {aluno.mae?.endereco?.uf || ''}, 
            Fone(s): {aluno.mae?.telefone || ''}. 
            {aluno.mae?.responsavelFinanceiro ? 'Sendo este o responsável pelos pagamentos, referidos neste contrato.' : ''}
          </p>

          <p className="paragrafo">
            <span className="info-destaque">CONTRATANTE 2 (PAI):</span> {aluno.pai?.nome?.toUpperCase() || ''}, 
            CPF N.: {formatarCPF(aluno.pai?.cpf)}, 
            Identidade N.: {aluno.pai?.rg || ''}, 
            residente e domiciliado(a) à {aluno.pai?.endereco?.rua || ''}, 
            {aluno.pai?.endereco?.bairro ? `, ${aluno.pai.endereco.bairro}` : ''}, 
            CEP {formatarCEP(aluno.pai?.endereco?.cep)}, 
            {aluno.pai?.endereco?.cidade || ''} - {aluno.pai?.endereco?.uf || ''}, 
            Fone(s): {aluno.pai?.telefone || ''}.
            {aluno.pai?.responsavelFinanceiro ? ' Sendo este o responsável pelos pagamentos, referidos neste contrato.' : ''}
          </p>

          <p className="paragrafo">
            <span className="info-destaque">CONTRATADA:</span> {configEscola.nomeEscola?.toUpperCase() || 'ESCOLA DO REINO LTDA'}, 
            pessoa jurídica de direito privado, devidamente inscrita no CNPJ Nº.: {configEscola.cnpj || '57.610.785/0001-31'}, 
            neste ato representada por seu(ua) Diretor(a) e Representante Legal, {configEscola.diretor?.toUpperCase() || ''}, 
            conforme Contrato Social, situada à {configEscola.endereco || 'RUA LIMA BARRETO, N° 489, QD. 40 LT. 12, JARDIM VILA BOA, CEP 74360-350 GOIÂNIA-GO'}.
          </p>
        </div>

        {/* CLÁUSULA PRIMEIRA - OBJETO */}
        <div className="clausula">
          <div className="clausula-title">Cláusula Primeira - Do Objeto do Contrato</div>
          
          <p className="paragrafo">
            O objeto do presente contrato é a prestação de serviços educacionais, exclusivamente para o período letivo de {obterAnoLetivo()}, 
            correspondente ao(à) {obterNomeTurma()} do turno {obterTurnoTurma()}, 
            o(a) aluno(a) {aluno.nome?.toUpperCase() || ''} 
            filho(a) de {aluno.mae?.nome?.toUpperCase() || ''} e {aluno.pai?.nome?.toUpperCase() || ''}, 
            e beneficiário do presente acordo de vontades, como previsto na legislação de ensino, normas complementares e no Regimento Interno da Contratada. 
            Os valores avençados neste instrumento são do conhecimento prévio do CONTRATANTE, nos termos da Lei nº 9.870/99 
            (Lei que regulamenta as anuidades escolares) e demais legislações pertinentes à matéria, sendo assim, 
            a parte CONTRATANTE tem ciência de o serviço contratado trata-se de ANUIDADE ESCOLAR.
          </p>

          <div className="paragrafo-title">Parágrafo Primeiro</div>
          <p className="paragrafo">
            Ao firmar o presente contrato os CONTRATANTES declaram que tem conhecimento prévio do Regimento Escolar e das instruções específicas, 
            que lhe foram apresentados e que passam a fazer parte integrante do presente contrato, submetendo-se às suas disposições, 
            bem como das demais obrigações decorrentes da legislação aplicável à área de ensino. Independentemente do acima declarado, 
            o Regimento Escolar e demais instruções estarão a disposição dos CONTRATANTES para consulta, no endereço da CONTRATADA.
          </p>

          <div className="paragrafo-title">Parágrafo Segundo</div>
          <p className="paragrafo">
            O presente instrumento define as condições para prestação dos serviços educacionais correspondentes à série ou período escolar 
            em que foi requerida a matrícula, visando implementar o Projeto Político Pedagógico do CONTRATADO, ministrados coletivamente 
            e em igualdade de condições para todos os alunos da série ou classe regular, nos dias, horários e ano letivo normais, 
            em conformidade com: currículo e calendário próprio; determinações da Lei 9.394/96, BNCC e legislação de ensino aplicável.
          </p>
        </div>

        {/* CLÁUSULA TERCEIRA - PREÇO */}
        <div className="clausula page-break">
          <div className="clausula-title">Cláusula Terceira - Do Preço</div>
          
          <p className="paragrafo">
            A contraprestação pecuniária aos serviços educacionais que serão prestados pela CONTRATADA, 
            estipulados na cláusula anterior, constitui-se conforme tabela abaixo:
          </p>

          <table className="tabela-valores">
            <thead>
              <tr>
                <th>Parcela</th>
                <th>Vencimento</th>
                <th>Valor Original</th>
                <th>Desconto</th>
                <th>Valor c/ Desconto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01 (Matrícula)</td>
                <td>{aluno.dataMatricula ? formatarData(aluno.dataMatricula) : 'N/A'}</td>
                <td>R$ {parseFloat(aluno.financeiro?.valorMatricula || 0).toFixed(2)}</td>
                <td>-</td>
                <td>R$ {parseFloat(aluno.financeiro?.valorMatricula || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Materiais</td>
                <td>{aluno.dataMatricula ? formatarData(aluno.dataMatricula) : 'N/A'}</td>
                <td>R$ {parseFloat(aluno.financeiro?.valorMateriais || 0).toFixed(2)}</td>
                <td>-</td>
                <td>R$ {parseFloat(aluno.financeiro?.valorMateriais || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Mensalidade</td>
                <td>Dia {aluno.financeiro?.diaVencimento || '10'}</td>
                <td>R$ {parseFloat(aluno.financeiro?.mensalidadeValor || 0).toFixed(2)}</td>
                <td>{aluno.financeiro?.descontoPercentual || 0}%</td>
                <td>R$ {obterMensalidadeComDesconto().toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <p className="paragrafo">
            <span className="info-destaque">Competência das Mensalidades:</span> 
            {aluno.financeiro?.dataInicioCompetencia && aluno.financeiro?.dataFimCompetencia
              ? ` ${formatarData(aluno.financeiro.dataInicioCompetencia)} a ${formatarData(aluno.financeiro.dataFimCompetencia)}`
              : ' Não definida'}
          </p>

          <div className="paragrafo-title">§1º - Sobre Pagamentos em Atraso</div>
          <p className="paragrafo">
            Sobre as mensalidades não pagas até o dia {parseInt(aluno.financeiro?.diaVencimento || 10) + 13} de cada mês, 
            a instituição de ensino será ressarcida pela empresa de cobrança ou escritório contratado para realizar a cobrança, 
            devendo o CONTRATANTE DEVEDOR após essa data, pagar diretamente para a empresa de cobrança, 
            incidindo o acréscimo de 20% sobre o valor da mensalidade vencida, valor esse, referente aos honorários da empresa de cobrança.
          </p>

          <div className="paragrafo-title">§2º - Multa e Juros</div>
          <p className="paragrafo">
            Havendo atraso no pagamento da parcela, o CONTRATANTE arcará com os seguintes acréscimos: 
            2% (dois por cento) do principal como multa, além da multa, juros de 1% (um por cento) ao mês, 
            computados desde o dia do vencimento.
          </p>
        </div>

        {/* CLÁUSULA SOBRE RESCISÃO */}
        <div className="clausula">
          <div className="clausula-title">Cláusula - Da Rescisão</div>
          
          <p className="paragrafo">
            Em caso de desligamento, cancelamento, transferência e desistência, deverá obrigatoriamente ser apresentado 
            requerimento formal à CONTRATADA, e estando quitadas todas as parcelas até o dia do desligamento.
          </p>

          <p className="paragrafo">
            Para a efetivação da rescisão, os CONTRATANTES deverão estar quites com suas obrigações financeiras. 
            A rescisão do presente contrato obrigará os CONTRATANTES ao pagamento das parcelas vencidas e não quitadas e respectivos encargos.
          </p>
        </div>

        {/* FORO */}
        <div className="clausula">
          <div className="clausula-title">Cláusula - Do Foro</div>
          
          <p className="paragrafo">
            As partes elegem o foro da comarca de {obterCidadeEscola()} 
            para dirimir quaisquer querelas oriundas do presente contrato.
          </p>

          <p className="paragrafo">
            E, por estarem de pleno acordo, as partes firmam o presente em duas vias de igual teor, 
            ficando uma com cada, para que produza seus efeitos jurídicos e legais.
          </p>
        </div>

        {/* ASSINATURAS */}
        <div className="assinaturas">
          <p style={{ textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase' }}>
            {configEscola.endereco?.includes('Goiânia') ? 'Goiânia' : ''}, {formatarDataExtenso(new Date())}.
          </p>

          <div className="assinatura-linha">
            Contratada: {configEscola.nomeEscola?.toUpperCase() || ''}
            <br />
            CNPJ N.: {configEscola.cnpj || ''}
          </div>

          <div className="assinatura-linha">
            Contratante 1: {aluno.mae?.nome?.toUpperCase() || ''}
            <br />
            CPF N.: {formatarCPF(aluno.mae?.cpf)}
            <br />
            {aluno.mae?.responsavelFinanceiro ? 'Devedor principal e solidário' : ''}
          </div>

          <div className="assinatura-linha">
            Contratante 2: {aluno.pai?.nome?.toUpperCase() || ''}
            <br />
            CPF N.: {formatarCPF(aluno.pai?.cpf)}
            <br />
            {aluno.pai?.responsavelFinanceiro ? 'Devedor principal e solidário' : ''}
          </div>
        </div>
      </div>
    </>
  );
};

export default ContratoAluno;
