// Serviço de IA Especializada do ConectCRM
export interface IntencaoUsuario {
  categoria: 'informacao' | 'acao' | 'problema' | 'transferencia';
  confianca: number;
  entidades: string[];
  contexto: string;
}

export interface RespostaIA {
  resposta: string;
  confianca: number;
  categoria: 'sucesso' | 'parcial' | 'transferencia';
  sugestoes: string[];
  acoes: {
    tipo: 'tutorial' | 'documentacao' | 'transferir' | 'executar';
    label: string;
    dados: any;
  }[];
}

export interface SessaoIA {
  id: string;
  usuarioId: string;
  iniciadaEm: Date;
  ultimaInteracao: Date;
  contexto: string[];
  transferidaParaAgente: boolean;
  satisfacao?: number;
}

class IAService {
  private baseConhecimento: Map<string, any> = new Map();
  private sessoes: Map<string, SessaoIA> = new Map();
  private metricas = {
    totalPerguntas: 0,
    respostasComSucesso: 0,
    transferenciasParaAgente: 0,
    satisfacaoMedia: 0,
  };

  constructor() {
    this.inicializarBaseConhecimento();
  }

  private inicializarBaseConhecimento() {
    // Módulo Clientes
    this.baseConhecimento.set('clientes', {
      categoria: 'funcionalidades',
      intents: ['criar cliente', 'novo cliente', 'cadastrar cliente', 'cliente'],
      respostas: {
        criar: {
          texto:
            'Para criar um novo cliente no ConectCRM:\n\n1️⃣ Acesse o módulo "Clientes" no menu lateral\n2️⃣ Clique no botão "+Novo Cliente"\n3️⃣ Preencha os dados obrigatórios:\n   • Nome/Razão Social\n   • Tipo de pessoa (Física/Jurídica)\n   • CPF/CNPJ\n4️⃣ Adicione informações de contato\n5️⃣ Clique em "Salvar"\n\n✅ O sistema validará automaticamente CPF/CNPJ e CEP!',
          confianca: 0.95,
          sugestoes: [
            'Como editar um cliente?',
            'Como excluir um cliente?',
            'Como exportar lista de clientes?',
          ],
          acoes: [
            {
              tipo: 'tutorial',
              label: 'Ver tutorial em vídeo',
              dados: { modulo: 'clientes', acao: 'criar' },
            },
            { tipo: 'documentacao', label: 'Documentação completa', dados: { secao: 'clientes' } },
          ],
        },
        editar: {
          texto:
            'Para editar um cliente existente:\n\n1️⃣ Vá para "Clientes"\n2️⃣ Encontre o cliente na lista\n3️⃣ Clique no ícone de edição (lápis)\n4️⃣ Faça as alterações necessárias\n5️⃣ Salve as mudanças\n\n💡 Dica: Use a busca para encontrar rapidamente!',
          confianca: 0.92,
        },
      },
    });

    // Módulo Propostas
    this.baseConhecimento.set('propostas', {
      categoria: 'vendas',
      intents: ['proposta', 'orçamento', 'cotação', 'pdf proposta'],
      respostas: {
        criar: {
          texto:
            'Para criar uma proposta comercial:\n\n1️⃣ Acesse "Propostas" > "Nova Proposta"\n2️⃣ Selecione o cliente\n3️⃣ Escolha o tipo:\n   • Produtos/Serviços individuais\n   • Combos pré-configurados\n4️⃣ Configure preços e condições\n5️⃣ Adicione observações (opcional)\n6️⃣ Gere o PDF da proposta\n\n🧮 O sistema calcula automaticamente impostos e totais!',
          confianca: 0.94,
          sugestoes: [
            'Como enviar proposta por email?',
            'Como duplicar uma proposta?',
            'Como acompanhar status?',
          ],
          acoes: [
            {
              tipo: 'tutorial',
              label: 'Tutorial: Criando propostas',
              dados: { modulo: 'propostas' },
            },
          ],
        },
      },
    });

    // Módulo Agenda
    this.baseConhecimento.set('agenda', {
      categoria: 'organizacao',
      intents: ['agenda', 'compromisso', 'reunião', 'evento', 'agendamento'],
      respostas: {
        criar: {
          texto:
            'Para agendar reuniões e compromissos:\n\n1️⃣ Acesse a "Agenda"\n2️⃣ Clique no dia/horário desejado OU "+Novo Evento"\n3️⃣ Preencha:\n   • Título do evento\n   • Descrição\n   • Participantes\n   • Data e horário\n4️⃣ Configure lembretes\n5️⃣ Salve o evento\n\n🔄 Você pode arrastar eventos para reagendar!\n📧 Convide clientes por email automaticamente!',
          confianca: 0.91,
        },
      },
    });

    // Módulo Dashboard
    this.baseConhecimento.set('dashboard', {
      categoria: 'analise',
      intents: ['dashboard', 'relatório', 'gráfico', 'métricas', 'vendas'],
      respostas: {
        interpretar: {
          texto:
            'O Dashboard do ConectCRM mostra:\n\n📊 **Visão Geral:**\n• Total de vendas do período\n• Número de clientes ativos\n• Propostas em andamento\n\n📈 **Gráficos:**\n• Performance mensal\n• Funil de vendas\n• Distribuição por categoria\n\n🎯 **Próximas Ações:**\n• Compromissos hoje\n• Propostas vencendo\n• Lembretes importantes\n\n💡 Clique nos cards para ver detalhes!',
          confianca: 0.88,
        },
      },
    });

    // Problemas Técnicos
    this.baseConhecimento.set('problemas', {
      categoria: 'suporte',
      intents: ['erro', 'problema', 'bug', 'não funciona', 'lento'],
      respostas: {
        login: {
          texto:
            'Problemas com login? Vamos resolver:\n\n🔍 **Verificações básicas:**\n• Email correto?\n• Senha correta? (sensível a maiúsculas)\n• Internet estável?\n\n🔧 **Soluções:**\n• Limpe cache do navegador\n• Tente navegador privado\n• Redefina a senha se necessário\n\n❌ Ainda não funciona? Vou conectar você com um agente!',
          confianca: 0.85,
          acoes: [
            {
              tipo: 'transferir',
              label: 'Falar com suporte técnico',
              dados: { motivo: 'problema_login' },
            },
          ],
        },
      },
    });

    // Configurações e Administração
    this.baseConhecimento.set('admin', {
      categoria: 'configuracao',
      intents: ['configuração', 'permissão', 'usuário', 'admin', 'empresa'],
      respostas: {
        permissoes: {
          texto:
            'Para configurar permissões de usuário:\n\n1️⃣ Acesse "Configurações" > "Usuários"\n2️⃣ Selecione o usuário\n3️⃣ Defina o perfil:\n   • **Admin**: Acesso total\n   • **Vendedor**: Vendas + clientes\n   • **Consultor**: Apenas leitura\n4️⃣ Configure permissões específicas\n5️⃣ Salve as alterações\n\n⚠️ Apenas administradores podem alterar permissões!',
          confianca: 0.87,
        },
      },
    });
  }

  // Detectar saudações e cumprimentos
  private detectarSaudacao(mensagem: string): boolean {
    const saudacoes = [
      'oi',
      'olá',
      'ola',
      'hey',
      'ei',
      'bom dia',
      'boa tarde',
      'boa noite',
      'hello',
      'hi',
      'tchau',
      'obrigado',
      'obrigada',
      'valeu',
      'ok',
      'beleza',
      'legal',
      'perfeito',
      'certo',
      'entendi',
      'show',
      'massa',
      'top',
    ];

    const mensagemLower = mensagem.toLowerCase();
    return saudacoes.some((saudacao) => mensagemLower.includes(saudacao));
  }

  // Gerar resposta para saudações
  private gerarRespostaSaudacao(mensagem: string): string {
    const mensagemLower = mensagem.toLowerCase();

    if (mensagemLower.includes('bom dia')) {
      return '🌅 Bom dia! Como posso ajudar você hoje no ConectCRM?';
    }
    if (mensagemLower.includes('boa tarde')) {
      return '☀️ Boa tarde! Em que posso ser útil?';
    }
    if (mensagemLower.includes('boa noite')) {
      return '🌙 Boa noite! Como posso ajudar?';
    }
    if (mensagemLower.includes('tchau') || mensagemLower.includes('até')) {
      return '👋 Até logo! Foi um prazer ajudar. Volte sempre que precisar!';
    }
    if (mensagemLower.includes('obrigad')) {
      return '😊 De nada! Fico feliz em ter ajudado. Precisa de mais alguma coisa?';
    }
    if (
      mensagemLower.includes('valeu') ||
      mensagemLower.includes('ok') ||
      mensagemLower.includes('beleza') ||
      mensagemLower.includes('legal') ||
      mensagemLower.includes('show') ||
      mensagemLower.includes('top')
    ) {
      return '😄 Que bom que consegui ajudar! Há mais alguma dúvida sobre o ConectCRM?';
    }

    // Saudação padrão
    return '👋 Olá! Sou a IA especializada do ConectCRM. Como posso ajudar você hoje?';
  }

  // Analisar intenção do usuário
  analisarIntencao(mensagem: string): IntencaoUsuario {
    const mensagemLower = mensagem.toLowerCase();
    let melhorMatch = {
      categoria: 'informacao' as const,
      confianca: 0,
      entidades: [] as string[],
      contexto: '',
    };

    // Verificar saudações primeiro
    if (this.detectarSaudacao(mensagem)) {
      return {
        categoria: 'informacao',
        confianca: 0.9,
        entidades: ['saudacao'],
        contexto: 'Saudação ou cumprimento',
      };
    }

    // Verificar se quer falar com agente
    if (
      mensagemLower.includes('agente') ||
      mensagemLower.includes('humano') ||
      mensagemLower.includes('atendente') ||
      mensagemLower.includes('pessoa')
    ) {
      return {
        categoria: 'transferencia',
        confianca: 0.95,
        entidades: ['agente'],
        contexto: 'Solicitação direta de transferência',
      };
    }

    // Verificar problemas técnicos
    if (
      mensagemLower.includes('erro') ||
      mensagemLower.includes('problema') ||
      mensagemLower.includes('bug') ||
      mensagemLower.includes('não funciona')
    ) {
      return {
        categoria: 'problema',
        confianca: 0.9,
        entidades: ['problema_tecnico'],
        contexto: 'Relatório de problema',
      };
    }

    // Buscar na base de conhecimento
    for (const [chave, modulo] of this.baseConhecimento.entries()) {
      for (const intent of modulo.intents) {
        if (mensagemLower.includes(intent)) {
          melhorMatch = {
            categoria: 'informacao',
            confianca: 0.8,
            entidades: [chave],
            contexto: `Pergunta sobre ${chave}`,
          };
          break;
        }
      }
    }

    return melhorMatch;
  }

  // Gerar resposta baseada na intenção
  gerarResposta(mensagem: string, sessaoId: string): RespostaIA {
    const intencao = this.analisarIntencao(mensagem);

    this.metricas.totalPerguntas++;

    // Saudações e cumprimentos
    if (intencao.entidades.includes('saudacao')) {
      this.metricas.respostasComSucesso++;
      return {
        resposta: this.gerarRespostaSaudacao(mensagem),
        confianca: 0.95,
        categoria: 'sucesso',
        sugestoes: [
          'Como criar um cliente?',
          'Como fazer uma proposta?',
          'Como usar a agenda?',
          'Falar com especialista',
        ],
        acoes: [],
      };
    }

    // Transferência para agente
    if (intencao.categoria === 'transferencia') {
      this.metricas.transferenciasParaAgente++;
      return {
        resposta:
          '👋 Entendi que você gostaria de falar com um agente humano. Vou conectar você agora mesmo! Um especialista estará disponível em instantes.',
        confianca: 0.95,
        categoria: 'transferencia',
        sugestoes: [],
        acoes: [
          {
            tipo: 'transferir',
            label: 'Conectar com agente especializado',
            dados: { motivo: 'solicitacao_usuario', contexto: mensagem },
          },
        ],
      };
    }

    // Problemas técnicos
    if (intencao.categoria === 'problema') {
      if (intencao.confianca > 0.7) {
        return {
          resposta:
            '🔧 Vejo que você está enfrentando um problema técnico. Vou ajudar a diagnosticar:\n\n• Que tipo de erro você está vendo?\n• Em que tela isso acontece?\n• Há alguma mensagem específica?\n\nEnquanto isso, posso conectar você com nosso suporte técnico especializado.',
          confianca: 0.8,
          categoria: 'parcial',
          sugestoes: [
            'Limpar cache do navegador',
            'Tentar em navegador privado',
            'Falar com suporte técnico',
          ],
          acoes: [
            {
              tipo: 'transferir',
              label: 'Suporte técnico especializado',
              dados: { motivo: 'problema_tecnico', contexto: mensagem },
            },
          ],
        };
      }
    }

    // Buscar resposta na base de conhecimento
    for (const entidade of intencao.entidades) {
      const modulo = this.baseConhecimento.get(entidade);
      if (modulo) {
        // Determinar ação específica
        const mensagemLower = mensagem.toLowerCase();
        let acao = 'criar'; // padrão

        if (mensagemLower.includes('editar') || mensagemLower.includes('alterar')) acao = 'editar';
        if (mensagemLower.includes('excluir') || mensagemLower.includes('deletar'))
          acao = 'excluir';
        if (mensagemLower.includes('dashboard') || mensagemLower.includes('relatório'))
          acao = 'interpretar';
        if (mensagemLower.includes('permissão') || mensagemLower.includes('usuário'))
          acao = 'permissoes';

        const resposta = modulo.respostas[acao] || modulo.respostas.criar;

        if (resposta) {
          this.metricas.respostasComSucesso++;
          return {
            resposta: resposta.texto,
            confianca: resposta.confianca || 0.8,
            categoria: 'sucesso',
            sugestoes: resposta.sugestoes || [],
            acoes: resposta.acoes || [],
          };
        }
      }
    }

    // Resposta genérica quando não consegue entender
    return {
      resposta:
        '🤔 Hmm, não tenho certeza sobre essa questão específica. Posso:\n\n1️⃣ Buscar na nossa documentação completa\n2️⃣ Conectar você com um especialista\n3️⃣ Você pode reformular a pergunta\n\nO que prefere?',
      confianca: 0.3,
      categoria: 'transferencia',
      sugestoes: ['Buscar na documentação', 'Falar com especialista', 'Ver tutoriais em vídeo'],
      acoes: [
        {
          tipo: 'transferir',
          label: 'Falar com especialista',
          dados: { motivo: 'ia_nao_conseguiu', contexto: mensagem },
        },
        {
          tipo: 'documentacao',
          label: 'Buscar na documentação',
          dados: { termo: mensagem },
        },
      ],
    };
  }

  // Criar nova sessão
  criarSessao(usuarioId: string): string {
    const sessaoId = `sessao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.sessoes.set(sessaoId, {
      id: sessaoId,
      usuarioId,
      iniciadaEm: new Date(),
      ultimaInteracao: new Date(),
      contexto: [],
      transferidaParaAgente: false,
    });

    return sessaoId;
  }

  // Atualizar contexto da sessão
  atualizarContexto(sessaoId: string, mensagem: string) {
    const sessao = this.sessoes.get(sessaoId);
    if (sessao) {
      sessao.contexto.push(mensagem);
      sessao.ultimaInteracao = new Date();

      // Manter apenas últimas 10 mensagens para contexto
      if (sessao.contexto.length > 10) {
        sessao.contexto = sessao.contexto.slice(-10);
      }
    }
  }

  // Marcar como transferida para agente
  transferirParaAgente(sessaoId: string, motivo: string) {
    const sessao = this.sessoes.get(sessaoId);
    if (sessao) {
      sessao.transferidaParaAgente = true;
      this.metricas.transferenciasParaAgente++;
    }
  }

  // Avaliar satisfação
  avaliarSatisfacao(sessaoId: string, nota: number) {
    const sessao = this.sessoes.get(sessaoId);
    if (sessao) {
      sessao.satisfacao = nota;

      // Atualizar média
      const sessoesComAvaliacao = Array.from(this.sessoes.values()).filter(
        (s) => s.satisfacao !== undefined,
      );

      if (sessoesComAvaliacao.length > 0) {
        this.metricas.satisfacaoMedia =
          sessoesComAvaliacao.reduce((acc, s) => acc + (s.satisfacao || 0), 0) /
          sessoesComAvaliacao.length;
      }
    }
  }

  // Obter métricas da IA
  obterMetricas() {
    return {
      ...this.metricas,
      taxaSucesso:
        this.metricas.totalPerguntas > 0
          ? (this.metricas.respostasComSucesso / this.metricas.totalPerguntas) * 100
          : 0,
      taxaTransferencia:
        this.metricas.totalPerguntas > 0
          ? (this.metricas.transferenciasParaAgente / this.metricas.totalPerguntas) * 100
          : 0,
      sessoesAtivas: this.sessoes.size,
    };
  }

  // Buscar perguntas frequentes
  obterPerguntasFrequentes() {
    return [
      {
        categoria: 'Clientes',
        perguntas: [
          'Como criar um novo cliente?',
          'Como editar dados de um cliente?',
          'Como exportar lista de clientes?',
          'Como importar clientes em lote?',
        ],
      },
      {
        categoria: 'Propostas',
        perguntas: [
          'Como criar uma proposta?',
          'Como gerar PDF da proposta?',
          'Como enviar proposta por email?',
          'Como acompanhar status das propostas?',
        ],
      },
      {
        categoria: 'Agenda',
        perguntas: [
          'Como agendar uma reunião?',
          'Como convidar clientes para eventos?',
          'Como configurar lembretes?',
          'Como sincronizar com Google Calendar?',
        ],
      },
      {
        categoria: 'Dashboard',
        perguntas: [
          'Como interpretar os gráficos?',
          'Como filtrar relatórios por período?',
          'Como exportar dados para Excel?',
          'Como configurar metas de vendas?',
        ],
      },
    ];
  }
}

export const iaService = new IAService();
