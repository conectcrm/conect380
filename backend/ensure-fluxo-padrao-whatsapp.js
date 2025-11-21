const { Pool } = require('pg');

const FLUXO_ID = '11111111-2222-3333-4444-555555555555';
const EMPRESA_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const PRIORIDADE_PADRAO = 999;

const NUCLEOS_PADRAO = [
  {
    id: '22222222-3333-4444-5555-666666666661',
    nome: 'Suporte Técnico',
    codigo: 'NUC_SUPORTE_WHATS',
    descricao: 'Atendimento técnico nível 1 para incidentes, integrações e uso do produto.',
    cor: '#2563EB',
    icone: 'lifebuoy',
    prioridade: 100,
    slaResposta: 10,
    slaResolucao: 8,
    mensagemBoasVindas: '✅ Você foi direcionado para o time de suporte técnico. Aguarde só um instante enquanto localizamos o melhor atendente.',
  },
  {
    id: '22222222-3333-4444-5555-666666666662',
    nome: 'Financeiro',
    codigo: 'NUC_FINANCEIRO_WHATS',
    descricao: 'Cobranças, boletos, notas fiscais e ajustes contratuais.',
    cor: '#0EA5E9',
    icone: 'banknotes',
    prioridade: 120,
    slaResposta: 15,
    slaResolucao: 12,
    mensagemBoasVindas: '✅ Canal financeiro acionado! Vamos localizar os seus dados e já retornamos com as informações.',
  },
  {
    id: '22222222-3333-4444-5555-666666666663',
    nome: 'Comercial',
    codigo: 'NUC_COMERCIAL_WHATS',
    descricao: 'Consultas sobre planos, propostas e novas oportunidades.',
    cor: '#F97316',
    icone: 'chart-bar',
    prioridade: 110,
    slaResposta: 20,
    slaResolucao: 24,
    mensagemBoasVindas: '✅ Time comercial notificado! Em instantes um especialista entra em contato com você.',
  },
  {
    id: '22222222-3333-4444-5555-666666666664',
    nome: 'Atendimento Geral',
    codigo: 'NUC_GERAL_WHATS',
    descricao: 'Fila geral para direcionamento rápido quando o cliente quer falar com um humano.',
    cor: '#16A34A',
    icone: 'users',
    prioridade: 90,
    slaResposta: 8,
    slaResolucao: 6,
    mensagemBoasVindas: '✅ Um atendente humano vai assumir seu atendimento em instantes. Obrigado pela paciência!',
  },
];

const HORARIO_COMERCIAL = {
  seg: { inicio: '08:00', fim: '18:00' },
  ter: { inicio: '08:00', fim: '18:00' },
  qua: { inicio: '08:00', fim: '18:00' },
  qui: { inicio: '08:00', fim: '18:00' },
  sex: { inicio: '08:00', fim: '18:00' },
};

const montarEstruturaFluxo = (nucleos) => ({
  versao: '1.1.0',
  etapaInicial: 'boas-vindas',
  variaveis: {
    areaTitulo: { tipo: 'texto' },
    destinoNucleoId: { tipo: 'texto' },
    nomeCliente: { tipo: 'texto' },
    contatoPreferencial: { tipo: 'texto' },
    resumoSolicitacao: { tipo: 'texto' },
    numeroTicket: { tipo: 'texto' },
    __mensagemFinal: { tipo: 'texto' },
  },
  etapas: {
    'boas-vindas': {
      id: 'boas-vindas',
      tipo: 'mensagem_menu',
      mensagem: [
        '👋 Olá! Eu sou a assistente virtual da ConectCRM.',
        'Escolha uma das opções abaixo para continuar:',
        '',
        '1️⃣ Suporte técnico (instabilidade, integrações, dúvidas na plataforma)',
        '2️⃣ Financeiro (boletos, notas fiscais, renegociação)',
        '3️⃣ Comercial (planos, propostas ou novas soluções)',
        '4️⃣ Acompanhar status de um atendimento existente',
        '0️⃣ Falar direto com um atendente humano',
        '',
        '❌ Digite SAIR para cancelar',
      ].join('\n'),
      opcoes: [
        {
          valor: '1',
          texto: 'Suporte técnico',
          descricao: 'Problemas técnicos, integrações, performance ou dúvidas de uso.',
          acao: 'proximo_passo',
          proximaEtapa: 'coleta-nome', // Padrão para novos clientes
          proximaEtapaCondicional: [
            {
              se: '__clienteCadastrado === true',
              entao: 'confirmar-dados-cliente', // ✨ Confirma dados antes de prosseguir
            },
            {
              se: '__clienteCadastrado === false',
              entao: 'coleta-nome', // Coleta dados se novo
            },
          ],
          salvarContexto: {
            areaTitulo: 'suporte técnico',
            destinoNucleoId: nucleos.suporte,
            __mensagemFinal: null,
          },
        },
        {
          valor: '2',
          texto: 'Financeiro',
          descricao: '2ª via de boleto, notas fiscais, faturas ou dúvidas contratuais.',
          acao: 'proximo_passo',
          proximaEtapa: 'coleta-nome', // Padrão para novos clientes
          proximaEtapaCondicional: [
            {
              se: '__clienteCadastrado === true',
              entao: 'confirmar-dados-cliente', // ✨ Confirma dados antes
            },
            {
              se: '__clienteCadastrado === false',
              entao: 'coleta-nome',
            },
          ],
          salvarContexto: {
            areaTitulo: 'financeiro',
            destinoNucleoId: nucleos.financeiro,
            __mensagemFinal: null,
          },
        },
        {
          valor: '3',
          texto: 'Comercial',
          descricao: 'Planos, propostas, upgrades ou novas integrações.',
          acao: 'proximo_passo',
          proximaEtapa: 'coleta-nome', // Padrão para novos clientes
          proximaEtapaCondicional: [
            {
              se: '__clienteCadastrado === true',
              entao: 'confirmar-dados-cliente', // ✨ Confirma dados antes
            },
            {
              se: '__clienteCadastrado === false',
              entao: 'coleta-nome',
            },
          ],
          salvarContexto: {
            areaTitulo: 'comercial',
            destinoNucleoId: nucleos.comercial,
            __mensagemFinal: null,
          },
        },
        {
          valor: '4',
          texto: 'Acompanhar status de atendimento',
          descricao: 'Consultar atualizações de um protocolo ou ticket já aberto.',
          acao: 'proximo_passo',
          proximaEtapa: 'coleta-protocolo',
          salvarContexto: {
            destinoNucleoId: null,
            areaTitulo: null,
          },
        },
        {
          valor: '0',
          texto: 'Falar com atendente humano',
          descricao: 'Encaminhar direto para a fila geral de atendimento.',
          acao: 'proximo_passo',
          proximaEtapa: 'coleta-nome', // Padrão para novos clientes
          proximaEtapaCondicional: [
            {
              se: '__clienteCadastrado === true',
              entao: 'confirmar-dados-cliente', // ✨ Confirma dados antes
            },
            {
              se: '__clienteCadastrado === false',
              entao: 'coleta-nome',
            },
          ],
          salvarContexto: {
            areaTitulo: 'atendimento humano',
            destinoNucleoId: nucleos.geral,
            __mensagemFinal: null,
          },
        },
        {
          valor: 'sair',
          texto: 'Cancelar atendimento',
          descricao: 'Encerrar a solicitação de atendimento.',
          acao: 'finalizar',
          salvarContexto: {
            __mensagemFinal: '👋 Atendimento cancelado. Caso precise de ajuda novamente, é só mandar uma mensagem! Até logo.',
          },
        },
      ],
    },
    'coleta-nome': {
      id: 'coleta-nome',
      tipo: 'coleta_dados',
      mensagem: 'Antes de prosseguirmos, poderia me informar seu nome completo?\n\n💡 Digite SAIR para cancelar',
      variavel: 'nomeCliente',
      proximaEtapa: 'coleta-contato',
    },
    'coleta-contato': {
      id: 'coleta-contato',
      tipo: 'coleta_dados',
      mensagem: 'Anotei, {nomeCliente}! Qual o melhor telefone ou e-mail para retornarmos, caso seja necessário?\n\n💡 Digite SAIR para cancelar',
      variavel: 'contatoPreferencial',
      proximaEtapa: 'coleta-resumo',
    },
    'confirmar-dados-cliente': {
      id: 'confirmar-dados-cliente',
      tipo: 'mensagem_menu',
      mensagem: [
        '✅ Encontrei seu cadastro em nosso sistema:',
        '',
        '👤 Nome: {nome}',
        '📧 Email: {email}',
        '🏢 Empresa: {empresa}',
        '',
        'Esses dados estão corretos?',
      ].join('\n'),
      opcoes: [
        {
          valor: '1',
          texto: 'Sim, pode continuar',
          descricao: 'Confirmar dados e prosseguir',
          acao: 'proximo_passo',
          // ✅ Verificar se tem departamentos para escolher ANTES de ir para resumo
          proximaEtapaCondicional: [
            {
              se: '__temDepartamentos === true',
              entao: 'escolha-departamento',
            },
            {
              se: '__temDepartamentos === false',
              entao: 'coleta-resumo',
            },
          ],
        },
        {
          valor: '2',
          texto: 'Atualizar meus dados',
          descricao: 'Informar novos dados',
          acao: 'proximo_passo',
          proximaEtapa: 'coleta-nome',
          salvarContexto: {
            __clienteCadastrado: false, // Marca para coletar novamente
          },
        },
        {
          valor: 'sair',
          texto: 'Cancelar atendimento',
          acao: 'finalizar',
          salvarContexto: {
            __mensagemFinal: '👋 Atendimento cancelado. Até logo!',
          },
        },
      ],
    },
    'coleta-resumo': {
      id: 'coleta-resumo',
      tipo: 'coleta_dados',
      mensagem: 'Perfeito! Conte rapidamente em poucas palavras qual é o motivo do seu contato.\n\n💡 Digite SAIR para cancelar',
      variavel: 'resumoSolicitacao',
      proximaEtapa: 'confirmar-transferencia',
    },
    'confirmar-transferencia': {
      id: 'confirmar-transferencia',
      tipo: 'mensagem_menu',
      mensagem: 'Obrigado, {nomeCliente}! Vou te direcionar para nossa equipe de {areaTitulo}. Está tudo certo?',
      opcoes: [
        {
          valor: '1',
          texto: 'Sim, pode encaminhar agora',
          acao: 'transferir_nucleo',
          nucleoContextKey: 'destinoNucleoId',
        },
        {
          valor: '2',
          texto: 'Não, quero escolher outra opção',
          acao: 'proximo_passo',
          proximaEtapa: 'reiniciar',
          salvarContexto: {
            destinoNucleoId: null,
            areaTitulo: null,
          },
        },
        {
          valor: 'sair',
          texto: 'Cancelar atendimento',
          acao: 'finalizar',
          salvarContexto: {
            __mensagemFinal: '👋 Atendimento cancelado. Caso precise de ajuda novamente, é só mandar uma mensagem! Até logo.',
          },
        },
      ],
    },
    reiniciar: {
      id: 'reiniciar',
      tipo: 'mensagem_menu',
      mensagem: 'Sem problemas! Vamos recomeçar. Escolha novamente a opção que melhor representa o seu atendimento.',
      opcoes: [
        {
          valor: '1',
          texto: 'Voltar ao menu inicial',
          acao: 'proximo_passo',
          proximaEtapa: 'boas-vindas',
        },
      ],
    },
    'coleta-protocolo': {
      id: 'coleta-protocolo',
      tipo: 'coleta_dados',
      mensagem: 'Informe, por favor, o número do protocolo ou ticket (se tiver). Se não tiver, pode descrever o atendimento que deseja acompanhar.',
      variavel: 'numeroTicket',
      proximaEtapa: 'retorno-status',
    },
    'retorno-status': {
      id: 'retorno-status',
      tipo: 'mensagem_menu',
      mensagem: 'Obrigado! Já registrei o atendimento {numeroTicket}. Deseja que nossa equipe retorne com a atualização ou prefere falar com alguém agora?',
      opcoes: [
        {
          valor: '1',
          texto: 'Aguardo o retorno da equipe',
          acao: 'finalizar',
          salvarContexto: {
            __mensagemFinal: '✅ Pedido registrado! Nossa equipe vai atualizar o status e entrar em contato assim que possível. Obrigado!',
          },
        },
        {
          valor: '2',
          texto: 'Quero falar com um atendente agora',
          acao: 'proximo_passo',
          proximaEtapa: 'coleta-nome',
          salvarContexto: {
            areaTitulo: 'atendimento humano',
            destinoNucleoId: nucleos.geral,
            __mensagemFinal: null,
          },
        },
      ],
    },
  },
});

async function ensureFluxoPadrao() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5434,
    user: process.env.DB_USER || 'conectcrm',
    password: process.env.DB_PASS || 'conectcrm123',
    database: process.env.DB_NAME || 'conectcrm_db',
  });

  try {
    console.log('⚙️  Garantindo núcleos padrão para roteamento da triagem...');

    const nucleosGarantidos = {};

    for (const nucleo of NUCLEOS_PADRAO) {
      const result = await pool.query(
        `
          INSERT INTO nucleos_atendimento (
            id,
            empresa_id,
            nome,
            descricao,
            codigo,
            cor,
            icone,
            ativo,
            prioridade,
            horario_funcionamento,
            timezone,
            sla_resposta_minutos,
            sla_resolucao_horas,
            atendentes_ids,
            capacidade_maxima_tickets,
            mensagem_boas_vindas,
            mensagem_transferencia,
            mensagem_aguarde,
            tipo_distribuicao
          ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            TRUE,
            $8,
            $9::jsonb,
            $10,
            $11,
            $12,
            $13::uuid[],
            $14,
            $15,
            $16,
            $17,
            $18
          )
          ON CONFLICT (id) DO UPDATE SET
            nome = EXCLUDED.nome,
            descricao = EXCLUDED.descricao,
            codigo = EXCLUDED.codigo,
            cor = EXCLUDED.cor,
            icone = EXCLUDED.icone,
            prioridade = EXCLUDED.prioridade,
            horario_funcionamento = EXCLUDED.horario_funcionamento,
            timezone = EXCLUDED.timezone,
            sla_resposta_minutos = EXCLUDED.sla_resposta_minutos,
            sla_resolucao_horas = EXCLUDED.sla_resolucao_horas,
            capacidade_maxima_tickets = EXCLUDED.capacidade_maxima_tickets,
            mensagem_boas_vindas = EXCLUDED.mensagem_boas_vindas,
            mensagem_transferencia = EXCLUDED.mensagem_transferencia,
            mensagem_aguarde = EXCLUDED.mensagem_aguarde,
            tipo_distribuicao = EXCLUDED.tipo_distribuicao,
            updated_at = NOW()
          RETURNING id, nome;
        `,
        [
          nucleo.id,
          EMPRESA_ID,
          nucleo.nome,
          nucleo.descricao,
          nucleo.codigo,
          nucleo.cor,
          nucleo.icone,
          nucleo.prioridade,
          JSON.stringify(HORARIO_COMERCIAL),
          'America/Sao_Paulo',
          nucleo.slaResposta,
          nucleo.slaResolucao,
          [],
          120,
          nucleo.mensagemBoasVindas,
          'Estamos direcionando você para o melhor atendente disponível. Aguarde um instante, por favor.',
          'Em instantes um especialista assume a conversa!',
          'round_robin',
        ],
      );

      const registro = result.rows[0];
      nucleosGarantidos[nucleo.codigo] = registro.id;
      console.log(`   • Núcleo garantido: ${registro.nome} (${registro.id})`);
    }

    const estruturaFluxo = montarEstruturaFluxo({
      suporte: nucleosGarantidos.NUC_SUPORTE_WHATS,
      financeiro: nucleosGarantidos.NUC_FINANCEIRO_WHATS,
      comercial: nucleosGarantidos.NUC_COMERCIAL_WHATS,
      geral: nucleosGarantidos.NUC_GERAL_WHATS,
    });

    console.log('⚙️  Garantindo fluxo padrão publicado para o canal WhatsApp...');

    const query = `
      INSERT INTO fluxos_triagem (
        id,
        empresa_id,
        nome,
        descricao,
        codigo,
        tipo,
        ativo,
        versao,
        publicado,
        canais,
        palavras_gatilho,
        prioridade,
        estrutura,
        permite_voltar,
        permite_sair,
        salvar_historico,
        tentar_entender_texto_livre,
        published_at
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13::jsonb,
        $14,
        $15,
        $16,
        $17,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        descricao = EXCLUDED.descricao,
        codigo = EXCLUDED.codigo,
        tipo = EXCLUDED.tipo,
        ativo = EXCLUDED.ativo,
        versao = EXCLUDED.versao,
        publicado = EXCLUDED.publicado,
        canais = EXCLUDED.canais,
        palavras_gatilho = EXCLUDED.palavras_gatilho,
        prioridade = EXCLUDED.prioridade,
        estrutura = EXCLUDED.estrutura,
        permite_voltar = EXCLUDED.permite_voltar,
        permite_sair = EXCLUDED.permite_sair,
        salvar_historico = EXCLUDED.salvar_historico,
        tentar_entender_texto_livre = EXCLUDED.tentar_entender_texto_livre,
        updated_at = NOW(),
        published_at = CASE
          WHEN fluxos_triagem.publicado = FALSE AND EXCLUDED.publicado = TRUE THEN NOW()
          ELSE fluxos_triagem.published_at
        END
      RETURNING id, nome, publicado, prioridade;
    `;

    const result = await pool.query(query, [
      FLUXO_ID,
      EMPRESA_ID,
      'Fluxo Padrao WhatsApp',
      'Fluxo padrão para triagem automatizada no WhatsApp',
      'FLUXO_PADRAO_WHATSAPP',
      'menu_simples',
      true,
      1,
      true,
      ['whatsapp'],
      [],
      PRIORIDADE_PADRAO,
      JSON.stringify(estruturaFluxo),
      true,
      true,
      true,
      false,
    ]);

    const fluxo = result.rows[0];
    console.log('✅ Fluxo padrão garantido com sucesso:');
    console.log(`   • ID: ${fluxo.id}`);
    console.log(`   • Nome: ${fluxo.nome}`);
    console.log(`   • Publicado: ${fluxo.publicado ? 'sim' : 'não'}`);
    console.log(`   • Prioridade: ${fluxo.prioridade}`);

    console.log('🔍 Verificando outros fluxos publicados para o canal WhatsApp...');
    const { rows: fluxosConcorrentes } = await pool.query(
      `
        SELECT id, nome, prioridade
        FROM fluxos_triagem
        WHERE empresa_id = $1
          AND id <> $2
          AND publicado = TRUE
          AND $3 = ANY(canais)
      `,
      [EMPRESA_ID, FLUXO_ID, 'whatsapp'],
    );

    if (fluxosConcorrentes.length > 0) {
      const idsParaAjuste = fluxosConcorrentes.map((item) => item.id);
      await pool.query(
        `
          UPDATE fluxos_triagem
          SET prioridade = LEAST(prioridade, $3 - 1)
          WHERE id = ANY($1)
            AND empresa_id = $2
        `,
        [idsParaAjuste, EMPRESA_ID, PRIORIDADE_PADRAO],
      );

      console.log(
        `ℹ️  ${fluxosConcorrentes.length} fluxo(s) concorrente(s) ajustado(s) para prioridade inferior ao padrão WhatsApp.`,
      );
    } else {
      console.log('ℹ️  Nenhum outro fluxo publicado para WhatsApp localizado.');
    }
  } catch (error) {
    console.error('❌ Erro ao garantir fluxo padrão:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

ensureFluxoPadrao();
