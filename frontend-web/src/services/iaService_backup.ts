// Serviço de IA Especializada do ConectCRM
export interface IntencaoUsuario {
  categoria: 'informacao' | 'acao' | 'problema' | 'transferencia';
  confianca: number;
  entidades: string[];
  contexto: string;
}

export interface RespostaIA {
}

// Métodos utilitários movidos para uma classe
export class IAUtils {
  static detectarSaudacao(mensagem: string): boolean {
    const saudacoes = [
      'oi', 'olá', 'ola', 'hey', 'ei', 'e aí', 'eae', 'eai',
      'bom dia', 'boa tarde', 'boa noite', 'bom final de semana',
      'hello', 'hi', 'hola', 'ciao', 'salut',
      'tchau', 'bye', 'até logo', 'até mais', 'até depois',
      'fui', 'falou', 'até', 'xau', 'adeus',
      'obrigado', 'obrigada', 'valeu', 'brigado', 'brigada',
      'muito obrigado', 'muito obrigada', 'thanks', 'thank you',
      'ok', 'okay', 'beleza', 'legal', 'perfeito', 'certo',
      'entendi', 'show', 'massa', 'top', 'demais', 'bacana',
      'ótimo', 'excelente', 'maravilha', 'perfeito', 'blz',
      'gostei', 'curti', 'adorei', 'amei', 'fantástico',
      'incrível', 'sensacional', 'espetacular'
    ];
    const msgLower = IAUtils.limparTexto(mensagem);
    return saudacoes.some(saudacao => msgLower.includes(saudacao));
  }

  static detectarSentimento(mensagem: string): 'positivo' | 'negativo' | 'neutro' {
    const msgLimpa = IAUtils.limparTexto(mensagem);
    const palavrasPositivas = [
      'bom', 'boa', 'ótimo', 'ótima', 'excelente', 'perfeito', 'perfeita',
      'legal', 'bacana', 'show', 'top', 'massa', 'demais', 'incrível',
      'fantástico', 'maravilhoso', 'sensacional', 'adorei', 'amei',
      'gostei', 'curti', 'aprovei', 'parabéns', 'sucesso', 'obrigado'
    ];
    const palavrasNegativas = [
      'ruim', 'péssimo', 'horrível', 'terrível', 'problema', 'erro',
      'bug', 'falha', 'defeito', 'não funciona', 'travou', 'lento',
      'dificuldade', 'complicado', 'difícil', 'chato', 'irritante',
      'frustrado', 'decepcionado', 'insatisfeito', 'reclamação'
    ];
    const positivos = palavrasPositivas.filter(palavra => msgLimpa.includes(palavra)).length;
    const negativos = palavrasNegativas.filter(palavra => msgLimpa.includes(palavra)).length;
    if (positivos > negativos) return 'positivo';
    if (negativos > positivos) return 'negativo';
    return 'neutro';
  }

  static extrairEntidades(mensagem: string): { tipo: string; valor: string }[] {
    const entidades: { tipo: string; valor: string }[] = [];
    const msgLimpa = mensagem.toLowerCase();
    const cpfRegex = /\d{3}\.\?\d{3}\.\?\d{3}-\?\d{2}/g;
    const cnpjRegex = /\d{2}\.\?\d{3}\.\?\d{3}\/\?\d{4}-\?\d{2}/g;
    const cpfs = mensagem.match(cpfRegex);
    const cnpjs = mensagem.match(cnpjRegex);
    if (cpfs) cpfs.forEach(cpf => entidades.push({ tipo: 'cpf', valor: cpf }));
    if (cnpjs) cnpjs.forEach(cnpj => entidades.push({ tipo: 'cnpj', valor: cnpj }));
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = mensagem.match(emailRegex);
    if (emails) emails.forEach(email => entidades.push({ tipo: 'email', valor: email }));
    const telefoneRegex = /\(?(
    \d{ 2 }) \)?\s ? (\d{ 4, 5 }) -? (\d{ 4 })/g;
    const telefones = mensagem.match(telefoneRegex);
    if (telefones) telefones.forEach(tel => entidades.push({ tipo: 'telefone', valor: tel }));
    const valorRegex = /R\$\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g;
    const valores = mensagem.match(valorRegex);
    if (valores) valores.forEach(valor => entidades.push({ tipo: 'valor', valor: valor }));
    return entidades;
  }

  static limparTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, ' ')        // Remove pontuação
      .replace(/\s+/g, ' ')            // Múltiplos espaços -> um espaço
      .trim();
  }
  // Expressões de dúvida/certeza
  'não sei', 'tenho dúvida', 'não tenho certeza', 'acho que sim',
  'provavelmente', 'possivelmente', 'definitivamente', 'absoluto'
      ],
  respostas: {
    saudacao: {
      textos: [
        '👋 Olá! Como posso ajudar você hoje?',
        '😊 Oi! Em que posso ser útil?',
        '🌟 Salve! Pronto para te ajudar!',
        '👍 E aí! Vamos resolver o que você precisa?',
        '✨ Hey! Estou aqui para qualquer dúvida!'
      ],
      sugestoes: ['Como usar o ConectCRM?', 'Preciso de ajuda com clientes', 'Como fazer uma proposta?']
    },
    bomDia: {
      textos: [
        '🌅 Bom dia! Que seu dia seja produtivo! Como posso ajudar?',
        '☀️ Bom dia! Pronto para começar o dia com o pé direito?',
        '🌞 Bom dia! Vamos fazer negócios hoje?'
      ]
    },
    boaTarde: {
      textos: [
        '☀️ Boa tarde! Como está o seu dia? Posso ajudar em algo?',
        '🌤️ Boa tarde! Espero que esteja tendo um dia produtivo!',
        '🌻 Boa tarde! Em que posso ser útil nesta tarde?'
      ]
    },
    boaNoite: {
      textos: [
        '🌙 Boa noite! Ainda trabalhando? Como posso ajudar?',
        '✨ Boa noite! Vamos resolver o que você precisa?',
        '🌃 Boa noite! Estou aqui para te ajudar!'
      ]
    },
    despedida: {
      textos: [
        '👋 Até logo! Foi um prazer ajudar!',
        '😊 Tchau! Volte sempre que precisar!',
        '✨ Até mais! Tenha um ótimo dia!',
        '🎯 Falou! Qualquer dúvida, estarei aqui!',
        '🚀 Até a próxima! Continue arrasando!'
      ]
    },
    agradecimento: {
      textos: [
        '😊 De nada! Foi um prazer ajudar!',
        '✨ Imagina! Estou aqui sempre que precisar!',
        '👍 Não há de quê! Conte comigo!',
        '🌟 Disponha! Qualquer coisa é só falar!'
      ]
    },
    satisfacao: {
      textos: [
        '🎉 Que ótimo saber que está satisfeito!',
        '😃 Fico feliz que tenha gostado!',
        '⭐ Excelente! Meu objetivo é sempre ajudar da melhor forma!',
        '🚀 Perfeito! Continue aproveitando o ConectCRM!'
      ]
    },
    insatisfacao: {
      textos: [
        '😔 Que pena que não foi como esperava... Como posso melhorar?',
        '🤝 Sinto muito! Vou conectar você com um especialista.',
        '💡 Entendo sua frustração. Deixe-me chamar alguém para ajudar melhor.'
      ]
    },
    duvida: {
      textos: [
        '🤔 Entendo... Deixe-me explicar melhor!',
        '💭 Sem problemas! Vamos esclarecer isso juntos.',
        '❓ Dúvidas são normais! Estou aqui para ajudar.',
        '🎯 Vamos por partes para ficar mais claro!'
      ]
    }
  }
});

// === MÓDULO DE CONHECIMENTO EXPANDIDO ===
// Módulo Clientes
this.baseConhecimento.set('clientes', {
  categoria: 'funcionalidades',
  intents: ['criar cliente', 'novo cliente', 'cadastrar cliente', 'cliente', 'cadastro', 'pessoa física', 'pessoa jurídica', 'cnpj', 'cpf', 'dados pessoais', 'informações cliente'],
  respostas: {
    criar: {
      texto: '👥 **Como criar um novo cliente no ConectCRM:**\n\n**1️⃣ Acesso rápido:**\n   • Clique em "Clientes" no menu lateral\n   • Ou use o atalho "+" no topo da tela\n\n**2️⃣ Dados obrigatórios:**\n   📝 Nome/Razão Social\n   🆔 Tipo de pessoa (Física/Jurídica)\n   📄 CPF/CNPJ (validação automática)\n   📞 Telefone principal\n   📧 Email\n\n**3️⃣ Informações adicionais:**\n   🏠 Endereço completo (CEP auto-preenchido)\n   💼 Segmento de atuação\n   🏷️ Tags personalizadas\n   📝 Observações importantes\n\n**✅ Dicas importantes:**\n   • Sistema valida CPF/CNPJ automaticamente\n   • CEP preenche endereço automaticamente\n   • Campos obrigatórios têm asterisco (*)\n   • Dados podem ser editados depois',
      confianca: 0.95,
      sugestoes: ['Como editar um cliente?', 'Como excluir um cliente?', 'Como importar lista de clientes?', 'Como adicionar foto ao cliente?'],
      acoes: [
        { tipo: 'tutorial', label: 'Ver tutorial em vídeo', dados: { modulo: 'clientes', acao: 'criar' } },
        { tipo: 'documentacao', label: 'Documentação completa', dados: { secao: 'clientes' } }
      ]
    },
    editar: {
      texto: '✏️ **Como editar informações de um cliente:**\n\n**Método 1 - Lista de clientes:**\n   1️⃣ Acesse "Clientes"\n   2️⃣ Encontre o cliente na lista\n   3️⃣ Clique no ícone de edição (lápis)\n\n**Método 2 - Perfil do cliente:**\n   1️⃣ Abra o perfil do cliente\n   2️⃣ Clique em "Editar" no topo\n\n**💡 Dicas úteis:**\n   • Use a busca para encontrar rapidamente\n   • Filtros ajudam com muitos clientes\n   • Alterações são salvas automaticamente\n   • Histórico de alterações fica registrado',
      confianca: 0.92,
      sugestoes: ['Como buscar clientes?', 'Como usar filtros?', 'Como ver histórico do cliente?']
    },
    buscar: {
      texto: '🔍 **Como buscar e filtrar clientes:**\n\n**Busca rápida:**\n   • Digite nome, email ou telefone na barra de busca\n   • Resultados aparecem em tempo real\n\n**Filtros avançados:**\n   📅 Por data de cadastro\n   🏷️ Por tags\n   💼 Por segmento\n   � Por cidade/estado\n   ⭐ Por status (ativo/inativo)\n\n**Dicas de busca:**\n   • Use aspas para busca exata: "João Silva"\n   • Busca funciona em todos os campos\n   • Combine filtros para resultados precisos',
      confianca: 0.90
    }
  }
});

// Módulo Propostas - EXPANDIDO
this.baseConhecimento.set('propostas', {
  categoria: 'vendas',
  intents: ['proposta', 'orçamento', 'cotação', 'pdf proposta', 'enviar proposta', 'aprovar proposta', 'rejeitar proposta', 'duplicar proposta', 'template proposta', 'valor proposta', 'prazo proposta', 'condições pagamento'],
  respostas: {
    criar: {
      texto: '💼 **Como criar uma proposta comercial completa:**\n\n**🚀 Início rápido:**\n   1️⃣ "Propostas" → "Nova Proposta"\n   2️⃣ Selecione o cliente (obrigatório)\n   3️⃣ Escolha o tipo de proposta:\n\n**📋 Tipos disponíveis:**\n   🛍️ **Produtos individuais** - Monte do zero\n   📦 **Combos pré-configurados** - Mais rápido\n   🎯 **Templates salvos** - Reutilize propostas\n\n**💰 Configuração de preços:**\n   • Preços unitários automáticos\n   • Descontos por item ou total\n   • Cálculo automático de impostos\n   • Condições de pagamento flexíveis\n\n**📄 Finalização:**\n   • Adicione observações importantes\n   • Defina prazo de validade\n   • Gere PDF profissional\n   • Envie por email direto do sistema\n\n**🎯 Dica especial:** Use templates para ganhar tempo em propostas similares!',
      confianca: 0.94,
      sugestoes: ['Como enviar proposta por email?', 'Como duplicar uma proposta?', 'Como acompanhar status?', 'Como criar template?'],
      acoes: [
        { tipo: 'tutorial', label: 'Tutorial: Criando propostas', dados: { modulo: 'propostas' } }
      ]
    },
    enviar: {
      texto: '📧 **Como enviar propostas por email:**\n\n**Envio direto do sistema:**\n   1️⃣ Abra a proposta criada\n   2️⃣ Clique em "Enviar por Email"\n   3️⃣ Personalize o assunto\n   4️⃣ Escreva mensagem personalizada\n   5️⃣ PDF é anexado automaticamente\n\n**📋 Recursos de envio:**\n   • Confirmação de leitura\n   • Rastreamento de abertura\n   • Histórico de envios\n   • Lembretes automáticos\n\n**💡 Templates de email:**\n   • Use modelos prontos\n   • Personalize por segmento\n   • Variáveis automáticas (nome, empresa)',
      confianca: 0.91
    },
    acompanhar: {
      texto: '📊 **Como acompanhar status das propostas:**\n\n**🎯 Dashboard de propostas:**\n   • Enviadas, visualizadas, aprovadas\n   • Valor total em negociação\n   • Taxa de conversão\n   • Propostas vencendo\n\n**📈 Status disponíveis:**\n   🔄 Rascunho, 📤 Enviada, 👀 Visualizada\n   ✅ Aprovada, ❌ Rejeitada, ⏰ Vencida\n\n**🔔 Notificações automáticas:**\n   • Cliente visualizou proposta\n   • Prazo próximo do vencimento\n   • Resposta do cliente\n   • Follow-up necessário',
      confianca: 0.88
    },
    template: {
      texto: '📋 **Como criar e usar templates:**\n\n**Criar template:**\n   1️⃣ Faça uma proposta modelo\n   2️⃣ Clique "Salvar como Template"\n   3️⃣ Dê um nome descritivo\n   4️⃣ Defina categoria/segmento\n\n**Usar template:**\n   • Selecione na criação de proposta\n   • Adapte conforme necessário\n   • Personalize valores e condições\n\n**💡 Vantagens:**\n   ⚡ Velocidade na criação\n   🎯 Padronização da empresa\n   ✅ Menos erros\n   📈 Maior produtividade',
      confianca: 0.89
    }
  }
});

// Módulo Agenda - EXPANDIDO
this.baseConhecimento.set('agenda', {
  categoria: 'organizacao',
  intents: ['agenda', 'compromisso', 'reunião', 'evento', 'agendamento', 'calendário', 'marcar reunião', 'agendar', 'lembrete', 'notificação', 'sincronizar google', 'outlook', 'participantes', 'sala reunião'],
  respostas: {
    criar: {
      texto: '📅 **Como agendar reuniões e compromissos:**\n\n**🎯 Formas de criar eventos:**\n   **Método 1:** Clique no dia/horário desejado\n   **Método 2:** Botão "+Novo Evento"\n   **Método 3:** Arraste para selecionar período\n\n**📝 Informações do evento:**\n   🏷️ **Título:** Seja claro e objetivo\n   📄 **Descrição:** Pauta, objetivos\n   👥 **Participantes:** Clientes, equipe\n   📍 **Local:** Presencial ou link online\n   ⏰ **Horário:** Data, hora início/fim\n   🔔 **Lembretes:** 15min, 1h, 1 dia antes\n\n**🚀 Recursos avançados:**\n   • Convites por email automáticos\n   • Integração Google Calendar/Outlook\n   • Salas de reunião (se configurado)\n   • Anexos e documentos\n   • Recorrência (diário, semanal, mensal)\n\n**💡 Dicas produtivas:**\n   🎯 Use cores para categorizar\n   📧 Envie convites com antecedência\n   🔄 Configure lembretes importantes\n   📱 Sincronize com celular',
      confianca: 0.91,
      sugestoes: ['Como convidar participantes?', 'Como sincronizar Google?', 'Como criar evento recorrente?', 'Como reservar sala?']
    },
    convidar: {
      texto: '👥 **Como convidar participantes:**\n\n**Adicionar participantes:**\n   1️⃣ No evento, clique "Participantes"\n   2️⃣ Digite email ou selecione da lista\n   3️⃣ Defina papel: Organizador/Participante\n   4️⃣ Envie convites automáticos\n\n**📧 Convite automático inclui:**\n   • Título e descrição do evento\n   • Data, horário e local\n   • Link para resposta (Aceitar/Recusar)\n   • Adição automática no calendário\n\n**� Notificações:**\n   • Confirmação de participação\n   • Lembretes antes do evento\n   • Alterações automáticas',
      confianca: 0.87
    },
    sincronizar: {
      texto: '🔄 **Sincronização com Google Calendar/Outlook:**\n\n**Google Calendar:**\n   1️⃣ "Configurações" → "Integrações"\n   2️⃣ Conectar conta Google\n   3️⃣ Autorizar acesso\n   4️⃣ Escolher calendários para sync\n\n**Microsoft Outlook:**\n   • Mesmo processo com conta Microsoft\n   • Funciona com Office 365\n   • Sincronização bidirecional\n\n**✅ Vantagens:**\n   📱 Acesso pelo celular\n   🔔 Notificações em todos dispositivos\n   🚫 Evita conflitos de horário\n   ⚡ Atualização em tempo real',
      confianca: 0.85
    }
  }
});

// Módulo Dashboard e Relatórios - EXPANDIDO
this.baseConhecimento.set('dashboard', {
  categoria: 'analise',
  intents: ['dashboard', 'relatório', 'gráfico', 'métricas', 'vendas', 'análise', 'estatística', 'performance', 'kpi', 'indicadores', 'meta', 'resultado', 'faturamento', 'receita'],
  respostas: {
    interpretar: {
      texto: '📊 **Como usar o Dashboard do ConectCRM:**\n\n**🎯 Visão geral:**\n   • Receita total do período\n   • Número de clientes ativos\n   • Propostas em andamento\n   • Taxa de conversão\n   • Meta vs Realizado\n\n**📈 Gráficos disponíveis:**\n   📅 **Vendas por período** - Mensal, trimestral, anual\n   👥 **Clientes por segmento** - Onde focar esforços\n   💰 **Faturamento por vendedor** - Performance da equipe\n   🎯 **Funil de vendas** - Etapas do processo\n   📊 **Propostas** - Enviadas vs Aprovadas\n\n**🔍 Filtros inteligentes:**\n   • Por período específico\n   • Por vendedor/responsável\n   • Por produto/serviço\n   • Por região/cidade\n   • Por fonte de leads\n\n**📱 Recursos:**\n   • Exportar para Excel/PDF\n   • Relatórios automáticos por email\n   • Alertas quando meta próxima\n   • Comparativo com período anterior',
      confianca: 0.89,
      sugestoes: ['Como exportar relatórios?', 'Como configurar metas?', 'Como filtrar por período?', 'Ver performance da equipe']
    },
    metas: {
      texto: '🎯 **Como configurar e acompanhar metas:**\n\n**Definir metas:**\n   1️⃣ "Configurações" → "Metas de Vendas"\n   2️⃣ Defina período (mensal/trimestral/anual)\n   3️⃣ Valor alvo por vendedor ou geral\n   4️⃣ Configure alertas de progresso\n\n**📊 Acompanhamento:**\n   • Progresso em tempo real\n   • Percentual de cumprimento\n   • Projeção baseada no ritmo atual\n   • Ranking da equipe\n\n**🔔 Alertas automáticos:**\n   • 50%, 80% e 100% da meta\n   • Meta em risco\n   • Superação de metas',
      confianca: 0.86
    }
  }
});

// Módulo Produtos e Serviços - NOVO
this.baseConhecimento.set('produtos', {
  categoria: 'catalogo',
  intents: ['produto', 'serviço', 'cadastrar produto', 'preço', 'estoque', 'categoria', 'sku', 'código', 'desconto', 'margem', 'custo', 'fornecedor'],
  respostas: {
    criar: {
      texto: '🛍️ **Como cadastrar produtos e serviços:**\n\n**📝 Informações básicas:**\n   • Nome do produto/serviço\n   • SKU/Código (único)\n   • Categoria\n   • Descrição detalhada\n   • Preço de venda\n   • Custo (para margem)\n\n**💰 Configuração de preços:**\n   • Preço à vista/prazo\n   • Descontos por quantidade\n   • Margem de lucro automática\n   • Tabelas de preços por segmento\n\n**📦 Controle de estoque:**\n   • Quantidade disponível\n   • Estoque mínimo (alerta)\n   • Movimentações automáticas\n   • Relatórios de giro\n\n**🏷️ Organização:**\n   • Categorias personalizadas\n   • Tags para filtros\n   • Produtos ativos/inativos\n   • Histórico de alterações',
      confianca: 0.92,
      sugestoes: ['Como organizar por categorias?', 'Como configurar estoque?', 'Como fazer promoções?', 'Relatório de produtos']
    }
  }
});

// Módulo Financeiro - NOVO
this.baseConhecimento.set('financeiro', {
  categoria: 'gestao',
  intents: ['financeiro', 'contas a receber', 'contas a pagar', 'fluxo de caixa', 'cobrança', 'inadimplência', 'pagamento', 'boleto', 'pix', 'cartão'],
  respostas: {
    geral: {
      texto: '💰 **Gestão Financeira no ConectCRM:**\n\n**📊 Módulos disponíveis:**\n   💳 **Contas a Receber** - Vendas e cobranças\n   💸 **Contas a Pagar** - Fornecedores e despesas\n   📈 **Fluxo de Caixa** - Projeções e controle\n   🎯 **Relatórios** - DRE, balancetes, análises\n\n**🔔 Controle de recebimentos:**\n   • Boletos automáticos\n   • Integração PIX\n   • Cartão de crédito\n   • Lembretes de vencimento\n   • Controle de inadimplência\n\n**📋 Contas a pagar:**\n   • Cadastro de fornecedores\n   • Agenda de pagamentos\n   • Aprovação de despesas\n   • Categorização de gastos\n\n**📈 Relatórios financeiros:**\n   • DRE (Demonstrativo Resultado)\n   • Fluxo de caixa projetado\n   • Análise de recebimentos\n   • Indicadores financeiros',
      confianca: 0.87,
      sugestoes: ['Como gerar boletos?', 'Configurar PIX?', 'Relatório financeiro?', 'Controlar inadimplência?']
    }
  }
});

// Módulo Configurações e Usuários - NOVO
this.baseConhecimento.set('configuracoes', {
  categoria: 'administracao',
  intents: ['configuração', 'usuário', 'permissão', 'perfil', 'senha', 'backup', 'importar', 'exportar', 'integração', 'api', 'webhook'],
  respostas: {
    usuarios: {
      texto: '👥 **Gestão de Usuários e Permissões:**\n\n**🔐 Perfis disponíveis:**\n   👑 **Administrador** - Acesso total\n   📊 **Gerente** - Relatórios e equipe\n   💼 **Vendedor** - Clientes e propostas\n   📞 **Atendimento** - Suporte e tickets\n   👀 **Visualização** - Apenas leitura\n\n**➕ Adicionar usuário:**\n   1️⃣ "Configurações" → "Usuários"\n   2️⃣ "+ Novo Usuário"\n   3️⃣ Preencha dados básicos\n   4️⃣ Selecione perfil/permissões\n   5️⃣ Envie convite por email\n\n**🛡️ Segurança:**\n   • Autenticação em 2 fatores\n   • Política de senhas\n   • Log de atividades\n   • Sessões ativas\n\n**🎯 Permissões granulares:**\n   • Por módulo do sistema\n   • Ações específicas (criar/editar/excluir)\n   • Acesso a relatórios\n   • Dados de outros vendedores',
      confianca: 0.88,
      sugestoes: ['Como resetar senha?', 'Configurar 2FA?', 'Ver log de atividades?', 'Desativar usuário?']
    }
  }
});

// Módulo Problemas Técnicos - EXPANDIDO  
this.baseConhecimento.set('suporte_tecnico', {
  categoria: 'ajuda',
  intents: ['erro', 'problema', 'bug', 'não funciona', 'travou', 'lento', 'não carrega', 'não abre', 'perdeu dados', 'backup', 'recuperar', 'browser', 'navegador', 'internet', 'login'],
  respostas: {
    geral: {
      texto: '🔧 **Soluções para problemas técnicos:**\n\n**🚀 Verificações básicas:**\n   1️⃣ **Internet:** Conexão estável?\n   2️⃣ **Navegador:** Chrome, Firefox, Edge atualizados\n   3️⃣ **Cache:** Ctrl+F5 para recarregar\n   4️⃣ **Pop-ups:** Libere para o ConectCRM\n\n**⚡ Problemas comuns:**\n   🐌 **Sistema lento:**\n      • Feche abas desnecessárias\n      • Limpe cache do navegador\n      • Verifique internet\n\n   🚫 **Não consegue fazer login:**\n      • Verifique usuário/senha\n      • Caps Lock desligado?\n      • Solicite reset de senha\n\n   📱 **No celular não funciona:**\n      • Use navegador atualizado\n      • Evite apps de "navegador rápido"\n      • Prefira Chrome ou Safari\n\n**🆘 Se nada resolver:**\n   • Print da tela do erro\n   • Anote hora/ação que causou\n   • Contacte suporte especializado',
      confianca: 0.85,
      sugestoes: ['Limpar cache do navegador', 'Reset de senha', 'Suporte técnico especializado', 'Verificar requisitos sistema']
    }
  }
});
  }

  // Detectar saudações e cumprimentos
  private detectarSaudacao(mensagem: string): boolean {
  const saudacoes = [
    'oi', 'olá', 'ola', 'hey', 'ei', 'bom dia', 'boa tarde', 'boa noite',
    'hello', 'hi', 'tchau', 'obrigado', 'obrigada', 'valeu', 'ok', 'beleza',
    'legal', 'perfeito', 'certo', 'entendi', 'show', 'massa', 'top'
  ];

  const mensagemLower = mensagem.toLowerCase();
  return saudacoes.some(saudacao => mensagemLower.includes(saudacao));
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
  if (mensagemLower.includes('valeu') || mensagemLower.includes('ok') ||
    mensagemLower.includes('beleza') || mensagemLower.includes('legal') ||
    mensagemLower.includes('show') || mensagemLower.includes('top')) {
    return '😄 Que bom que consegui ajudar! Há mais alguma dúvida sobre o ConectCRM?';
  }

  // Saudação padrão
  return '👋 Olá! Sou a IA especializada do ConectCRM. Como posso ajudar você hoje?';
}

resposta: string;
confianca: number;
sugestoes: string[];
acoes: {
  tipo: 'tutorial' | 'documentacao' | 'transferir' | 'executar';
  label: string;
  dados: any;
} [];
}

// Transferência para agente
if (intencao.categoria === 'transferencia') {
  this.metricas.transferenciasParaAgente++;
  return {
    resposta: '👋 Entendi que você gostaria de falar com um agente humano. Vou conectar você agora mesmo! Um especialista estará disponível em instantes.',
    confianca: 0.95,
    categoria: 'transferencia',
    sugestoes: [],
    acoes: [
      {
        tipo: 'transferir',
        label: 'Conectar com agente especializado',
        dados: { motivo: 'solicitacao_usuario', contexto: mensagem }
      }
    ]
  };
}

// Problemas técnicos
if (intencao.categoria === 'problema') {
  if (intencao.confianca > 0.7) {
    return {
      resposta: '🔧 Vejo que você está enfrentando um problema técnico. Vou ajudar a diagnosticar:\n\n• Que tipo de erro você está vendo?\n• Em que tela isso acontece?\n• Há alguma mensagem específica?\n\nEnquanto isso, posso conectar você com nosso suporte técnico especializado.',
      confianca: 0.8,
      categoria: 'parcial',
      sugestoes: ['Limpar cache do navegador', 'Tentar em navegador privado', 'Falar com suporte técnico'],
      acoes: [
        {
          tipo: 'transferir',
          label: 'Suporte técnico especializado',
          dados: { motivo: 'problema_tecnico', contexto: mensagem }
        }
      ]
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
    if (mensagemLower.includes('excluir') || mensagemLower.includes('deletar')) acao = 'excluir';
    if (mensagemLower.includes('dashboard') || mensagemLower.includes('relatório')) acao = 'interpretar';
    if (mensagemLower.includes('permissão') || mensagemLower.includes('usuário')) acao = 'permissoes';

    const resposta = modulo.respostas[acao] || modulo.respostas.criar;

    if (resposta) {
      this.metricas.respostasComSucesso++;
      return {
        resposta: resposta.texto,
        confianca: resposta.confianca || 0.8,
        categoria: 'sucesso',
        sugestoes: resposta.sugestoes || [],
        acoes: resposta.acoes || []
      };
    }
  }
}

// Resposta genérica quando não consegue entender
return {
  resposta: '🤔 Hmm, não tenho certeza sobre essa questão específica. Posso:\n\n1️⃣ Buscar na nossa documentação completa\n2️⃣ Conectar você com um especialista\n3️⃣ Você pode reformular a pergunta\n\nO que prefere?',
  confianca: 0.3,
  sugestoes: [
    'Buscar na documentação',
    'Falar com especialista',
    'Ver tutoriais em vídeo'
  ],
  acoes: [
    {
      tipo: 'transferir',
      label: 'Falar com especialista',
      dados: { motivo: 'ia_nao_conseguiu', contexto: mensagem }
    },
    {
      tipo: 'documentacao',
      label: 'Buscar na documentação',
      dados: { termo: mensagem }
    }
  ]
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
    transferidaParaAgente: false
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
    const sessoesComAvaliacao = Array.from(this.sessoes.values())
      .filter(s => s.satisfacao !== undefined);

    if (sessoesComAvaliacao.length > 0) {
      this.metricas.satisfacaoMedia = sessoesComAvaliacao
        .reduce((acc, s) => acc + (s.satisfacao || 0), 0) / sessoesComAvaliacao.length;
    }
  }
}

// Obter métricas da IA
obterMetricas() {
  return {
    ...this.metricas,
    taxaSucesso: this.metricas.totalPerguntas > 0
      ? (this.metricas.respostasComSucesso / this.metricas.totalPerguntas) * 100
      : 0,
    taxaTransferencia: this.metricas.totalPerguntas > 0
      ? (this.metricas.transferenciasParaAgente / this.metricas.totalPerguntas) * 100
      : 0,
    sessoesAtivas: this.sessoes.size
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
        'Como importar clientes em lote?'
      ]
    },
    {
      categoria: 'Propostas',
      perguntas: [
        'Como criar uma proposta?',
        'Como gerar PDF da proposta?',
        'Como enviar proposta por email?',
        'Como acompanhar status das propostas?'
      ]
    },
    {
      categoria: 'Agenda',
      perguntas: [
        'Como agendar uma reunião?',
        'Como convidar clientes para eventos?',
        'Como configurar lembretes?',
        'Como sincronizar com Google Calendar?'
      ]
    },
    {
      categoria: 'Dashboard',
      perguntas: [
        'Como interpretar os gráficos?',
        'Como filtrar relatórios por período?',
        'Como exportar dados para Excel?',
        'Como configurar metas de vendas?'
      ]
    }
  ];
}
}

export const iaService = new IAService();
