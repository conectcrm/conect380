# 🎯 Chat Omnichannel Completo - Ferramentas Essenciais para Agentes

## 📊 CONTEXTO: Propósito do ConectCRM

**ConectCRM** é um **CRM completo** com foco em:
- 🎯 Gestão de relacionamento com clientes (CRM)
- 💼 Propostas comerciais e vendas
- 📊 Funil de vendas e oportunidades
- 💰 Faturamento e cobrança recorrente
- 📱 **Atendimento Omnichannel** (WhatsApp, Telegram, Chat)
- 🤖 IA integrada para automação

### **Missão do Chat Omnichannel:**
> Permitir que **agentes de atendimento** tenham **TODAS as ferramentas necessárias** para atender clientes **SEM sair da tela de chat**, com **contexto completo** e **ações em tempo real**.

---

## 🎯 Análise: O que o Agente PRECISA Durante um Atendimento?

### **Cenário Real de Atendimento:**

```
Cliente: "Oi, quero saber sobre minha proposta #2025-0015"

Agente PRECISA:
1. ✅ Ver histórico completo do cliente
2. ✅ Buscar proposta #2025-0015 rapidamente
3. ✅ Ver status da proposta (enviada? visualizada? paga?)
4. ✅ Ver faturas relacionadas
5. ✅ Criar nova proposta/pedido se necessário
6. ✅ Enviar proposta por WhatsApp
7. ✅ Registrar nota interna para próximo atendente
8. ✅ Transferir para vendas se necessário
9. ✅ Marcar cliente como VIP
10. ✅ Agendar follow-up

TUDO ISSO SEM SAIR DO CHAT! ⚡
```

---

## 🚀 Funcionalidades ESSENCIAIS Faltando

### **PRIORIDADE CRÍTICA** (Sem isso, agente precisa sair do chat)

#### **1. PAINEL LATERAL DE CONTEXTO DO CLIENTE** ⭐⭐⭐⭐⭐
```typescript
interface PainelContextoCliente {
  // Dados básicos (JÁ TEM no cabeçalho)
  nome: string;
  telefone: string;
  
  // FALTA - Dados CRM integrados
  informacoes: {
    email: string;
    empresa: string;
    cargo: string;
    segmento: 'VIP' | 'Regular' | 'Novo';
    primeiroContato: Date;
    ultimoContato: Date;
    valorTotalGasto: number; // R$ 25.450,00
    ticketsAbertos: number; // 2 tickets
    ticketsResolvidos: number; // 18 tickets
    avaliacaoMedia: number; // 4.8 ⭐
  };
  
  // CRÍTICO - Histórico unificado
  historico: {
    propostas: Proposta[]; // Últimas 5 propostas
    faturas: Fatura[]; // Faturas pendentes/pagas
    tickets: Ticket[]; // Tickets anteriores
    compras: Pedido[]; // Histórico de compras
    interacoes: Interacao[]; // Timeline completa
  };
  
  // ESSENCIAL - Ações rápidas
  acoes: {
    criarProposta: () => void;
    criarFatura: () => void;
    criarOportunidade: () => void;
    agendarFollowUp: () => void;
    marcarComoVIP: () => void;
    verPerfilCompleto: () => void; // Abre CRM em nova aba
  };
  
  // IMPORTANTE - Tags e categorização
  tags: string[]; // ['VIP', 'Suporte Técnico', 'Cliente Ativo']
  categoria: string;
  
  // ÚTIL - Notas internas
  notasInternas: NotaInterna[];
}
```

**Por que CRÍTICO?**
```
❌ SEM: Agente precisa abrir CRM > Buscar cliente > Voltar chat
✅ COM: Todas informações visíveis ao lado do chat
Economia: ~2 minutos por atendimento
Impacto: 50% mais produtivo
```

---

#### **2. BUSCA RÁPIDA DE PROPOSTAS/FATURAS NO CHAT** ⭐⭐⭐⭐⭐
```typescript
interface BuscaRapidaCRM {
  // Comando no chat
  comandos: {
    '/proposta 2025-0015': AbrirProposta;
    '/fatura 2025-0032': AbrirFatura;
    '/cliente João Silva': BuscarCliente;
    '/pedido #1234': AbrirPedido;
  };
  
  // Modal de busca rápida
  atalho: 'Ctrl+K'; // Como Slack/Discord
  
  // Resultados em tempo real
  interface ResultadoBusca {
    tipo: 'PROPOSTA' | 'FATURA' | 'CLIENTE' | 'PEDIDO';
    titulo: string;
    subtitulo: string;
    valor?: number;
    status: string;
    acoes: {
      visualizar: () => void;
      enviarNoChat: () => void;
      copiarLink: () => void;
    };
  }
}
```

**Cenário Real:**
```
Cliente: "Cadê minha proposta de ontem?"

❌ SEM BUSCA RÁPIDA:
1. Abrir aba do CRM
2. Ir em Propostas
3. Filtrar por cliente
4. Filtrar por data
5. Abrir proposta
6. Copiar número
7. Voltar ao chat
8. Responder cliente
Tempo: ~3 minutos

✅ COM BUSCA RÁPIDA:
1. Ctrl+K
2. Digitar "João Silva proposta"
3. Clicar "Enviar no chat"
Tempo: ~10 segundos

Economia: ~2min 50s por busca
```

---

#### **3. AÇÕES RÁPIDAS INTEGRADAS COM CRM** ⭐⭐⭐⭐⭐
```typescript
interface AcoesRapidasCRM {
  // Durante o atendimento
  acoes: {
    // Criar documentos
    criarProposta: {
      titulo: 'Nova Proposta';
      atalho: 'Ctrl+Shift+P';
      modal: ModalCriarProposta; // Modal inline no chat
      aoSalvar: (proposta: Proposta) => {
        // 1. Salva no CRM
        // 2. Envia mensagem automática no chat
        // "✅ Proposta #2025-0100 criada! Link: [ver proposta]"
      };
    };
    
    criarFatura: {
      titulo: 'Nova Fatura';
      atalho: 'Ctrl+Shift+F';
      modal: ModalCriarFatura;
      aoSalvar: (fatura: Fatura) => {
        // Envia link de pagamento no chat
      };
    };
    
    criarOportunidade: {
      titulo: 'Nova Oportunidade';
      modal: ModalCriarOportunidade;
      autoPreenchido: {
        cliente: clienteAtual;
        origem: 'WHATSAPP';
        atendente: atendenteLogado;
      };
    };
    
    // Agendar follow-up
    agendarFollowUp: {
      titulo: 'Agendar Follow-up';
      tipos: ['CALLBACK' | 'EMAIL' | 'WHATSAPP'];
      notificacao: boolean; // Notificar agente
      autoReabrir: boolean; // Reabrir ticket automaticamente
    };
    
    // Transferir com contexto
    transferir: {
      para: 'VENDAS' | 'FINANCEIRO' | 'TECNICO' | 'ATENDENTE';
      motivo: string;
      notasInternas: string;
      anexarHistorico: boolean; // Últimas 20 mensagens
    };
  };
}
```

**Exemplo de Fluxo:**
```
Cliente: "Quero fazer um pedido de 50 licenças"

Agente:
1. Ctrl+Shift+P (criar proposta)
2. Preenche formulário inline
3. Clica "Enviar proposta no chat"
4. Sistema envia automaticamente:
   "✅ Proposta criada! Link: http://portal/PROP-2025-0100"
5. Cliente recebe e aprova
6. Sistema notifica agente em tempo real
7. Agente já vê aprovação no painel

Tempo total: 30 segundos
```

---

#### **4. NOTAS INTERNAS E COLABORAÇÃO** ⭐⭐⭐⭐
```typescript
interface NotasInternas {
  // Notas visíveis apenas para equipe
  interface Nota {
    id: string;
    ticketId: string;
    autor: User;
    conteudo: string;
    tipo: 'OBSERVACAO' | 'ALERTA' | 'PENDENCIA';
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
    visibilidade: 'APENAS_EU' | 'EQUIPE' | 'SUPERVISORES';
    
    // Menções
    mencoes: string[]; // @joao @maria
    notificarMencionados: boolean;
    
    // Anexos
    anexos: Arquivo[];
    
    // Follow-up
    followUp?: {
      data: Date;
      responsavel: string;
      notificar: boolean;
    };
    
    criadoEm: Date;
  };
  
  // Exibição no chat
  renderizacao: {
    icone: '📝'; // Diferente de mensagem normal
    corDeFundo: '#FFF3CD'; // Amarelo claro
    bordaEsquerda: '4px solid #FFC107';
    ocultarDeCliente: true; // Cliente NUNCA vê
  };
  
  // Atalho rápido
  atalho: 'Ctrl+Shift+N'; // Nova nota
  placeholder: 'Nota interna (apenas equipe verá)...';
}
```

**Por que ESSENCIAL?**
```
Cenário: Cliente quer desconto especial

Agente 1 (João):
📝 NOTA INTERNA: "Cliente é VIP, aprovado desconto de 15%. 
    Próximo atendente: já pode oferecer sem pedir autorização."
    @maria @supervisor

[2 horas depois]

Agente 2 (Maria):
- Abre ticket
- Vê nota interna imediatamente
- Oferece desconto sem delay
- Cliente feliz!

❌ SEM NOTAS: Maria teria que pedir autorização novamente
✅ COM NOTAS: Contexto preservado, atendimento ágil
```

---

#### **5. RESPOSTAS RÁPIDAS COM VARIÁVEIS** ⭐⭐⭐⭐
```typescript
interface RespostasRapidas {
  // Templates customizáveis
  templates: {
    // Atalhos com /
    '/oi': 'Olá {{cliente.nome}}! Como posso ajudar você hoje? 😊';
    '/aguarde': 'Um momento {{cliente.nome}}, estou verificando isso para você...';
    '/obrigado': 'Obrigado pelo contato, {{cliente.nome}}! Qualquer dúvida, estou à disposição. 🙌';
    '/proposta': 'Sua proposta {{proposta.numero}} está {{proposta.status}}. Valor: {{proposta.valor}}';
    '/fatura': 'Sua fatura {{fatura.numero}} vence em {{fatura.vencimento}}. Link de pagamento: {{fatura.linkPagamento}}';
    
    // Atalhos personalizados
    '/status-pedido': 'Seu pedido #{{pedido.numero}} está {{pedido.status}}. Previsão de entrega: {{pedido.previsaoEntrega}}';
    '/suporte-tecnico': 'Vou transferir você para nosso suporte técnico especializado. Aguarde um momento...';
  };
  
  // Variáveis disponíveis
  variaveis: {
    // Cliente
    '{{cliente.nome}}': string;
    '{{cliente.email}}': string;
    '{{cliente.empresa}}': string;
    
    // Ticket
    '{{ticket.numero}}': string;
    '{{ticket.status}}': string;
    
    // Proposta/Fatura/Pedido
    '{{proposta.numero}}': string;
    '{{proposta.valor}}': string;
    '{{proposta.status}}': string;
    '{{fatura.linkPagamento}}': string;
    
    // Atendente
    '{{atendente.nome}}': string;
    '{{atendente.email}}': string;
    
    // Data/Hora
    '{{hoje}}': Date;
    '{{agora}}': Time;
  };
  
  // Interface
  ui: {
    atalho: 'Ctrl+/'; // Abre lista de respostas
    busca: 'Filtrar por palavra-chave';
    preview: 'Mostra variáveis substituídas';
    editar: 'Editar template inline';
  };
  
  // CRUD de templates
  acoes: {
    criar: () => void;
    editar: (id: string) => void;
    excluir: (id: string) => void;
    duplicar: (id: string) => void;
    organizar: () => void; // Pastas/categorias
  };
}
```

**Impacto:**
```
❌ SEM: Digitar mensagem completa (30-60 segundos)
✅ COM: /oi + Enter (2 segundos)

Economia: ~40 segundos por mensagem padrão
Se 50 mensagens/dia: ~33 minutos economizados!
```

---

#### **6. HISTÓRICO UNIFICADO DE INTERAÇÕES** ⭐⭐⭐⭐
```typescript
interface HistoricoUnificado {
  // Timeline completa do cliente
  timeline: {
    tipo: 'WHATSAPP' | 'EMAIL' | 'TELEFONE' | 'CHAT' | 'PRESENCIAL' | 'PROPOSTA' | 'FATURA' | 'PEDIDO';
    data: Date;
    resumo: string;
    detalhes: string;
    atendente?: string;
    canal: string;
    status: string;
    
    // Ações
    acoes: {
      verDetalhes: () => void;
      continuarConversa: () => void; // Se foi WhatsApp, abre ticket antigo
      copiarContexto: () => void; // Copia resumo para nota interna
    };
  }[];
  
  // Filtros
  filtros: {
    periodo: '7_DIAS' | '30_DIAS' | '3_MESES' | 'TUDO';
    tipo: 'TODAS' | 'ATENDIMENTOS' | 'VENDAS' | 'FINANCEIRO';
    atendente: string;
    status: string;
  };
  
  // Estatísticas rápidas
  estatisticas: {
    totalInteracoes: number;
    ultimaInteracao: Date;
    canalPreferido: string; // WhatsApp (80%)
    tempoMedioResposta: string; // 5 minutos
    satisfacaoMedia: number; // 4.8 ⭐
  };
}
```

**Exemplo Visual:**
```
┌─────────────────────────────────────────────┐
│ 📊 TIMELINE - João Silva                   │
├─────────────────────────────────────────────┤
│ 🟢 HOJE 17:23                               │
│ 📱 WhatsApp - Ticket #2 (EM ATENDIMENTO)   │
│ "Dúvida sobre proposta #2025-0015"         │
│                                             │
│ 🔵 ONTEM 14:30                              │
│ 💼 Proposta #2025-0015 ENVIADA             │
│ Valor: R$ 5.200,00 | Atendente: Maria      │
│ [Ver proposta] [Enviar lembrete]           │
│                                             │
│ 🟡 3 DIAS ATRÁS 10:15                       │
│ 📱 WhatsApp - Ticket #1 (RESOLVIDO)        │
│ "Informações sobre planos"                  │
│ Atendente: João | Duração: 8 min           │
│ [Ver conversa]                              │
│                                             │
│ 🟢 1 SEMANA ATRÁS                           │
│ 💰 Fatura #2025-0028 PAGA                  │
│ R$ 1.200,00 | Cartão ****1234              │
│                                             │
│ 🔵 15 DIAS ATRÁS                            │
│ 📧 Email - Contato inicial                  │
│ "Interesse em contratar sistema"           │
│ [Ver email thread]                          │
└─────────────────────────────────────────────┘
```

---

#### **7. STATUS DE MENSAGENS REAL-TIME** ⭐⭐⭐⭐
```typescript
interface StatusMensagemRealTime {
  // Status visuais (como WhatsApp)
  status: {
    ENVIANDO: {
      icone: '🕐'; // Relógio
      texto: 'Enviando...';
      cor: '#999';
    };
    
    ENVIADO: {
      icone: '✓'; // Check simples
      texto: 'Enviado';
      cor: '#999';
    };
    
    ENTREGUE: {
      icone: '✓✓'; // Check duplo
      texto: 'Entregue';
      cor: '#999';
    };
    
    LIDO: {
      icone: '✓✓'; // Check duplo azul
      texto: 'Lido';
      cor: '#4A90E2'; // Azul WhatsApp
    };
    
    ERRO: {
      icone: '❌'; // X vermelho
      texto: 'Erro ao enviar';
      cor: '#E74C3C';
      acoes: {
        reenviar: () => void;
        verErro: () => void;
      };
    };
  };
  
  // Horário de leitura
  horarioLeitura?: {
    data: Date;
    exibicao: 'Lido às 17:25';
    tooltip: 'Lido em 12/10/2025 às 17:25:43';
  };
  
  // Webhook de status (WhatsApp API)
  webhookIntegration: {
    onStatusUpdate: (messageId: string, status: Status) => {
      // Atualiza UI em tempo real
      atualizarStatusMensagem(messageId, status);
    };
  };
}
```

**Por que IMPORTANTE?**
```
Agente sabe EXATAMENTE quando cliente:
✓ Recebeu mensagem
✓✓ Mensagem foi entregue
✓✓ Cliente leu (pode cobrar resposta)

Evita:
❌ "Cliente viu minha mensagem?"
❌ "Preciso reenviar?"
❌ Ansiedade do agente
```

---

#### **8. INDICADOR "DIGITANDO..." EM TEMPO REAL** ⭐⭐⭐
```typescript
interface IndicadorDigitando {
  // WebSocket event
  evento: {
    tipo: 'ticket:digitando';
    payload: {
      ticketId: string;
      usuario: {
        tipo: 'CLIENTE' | 'ATENDENTE';
        nome: string;
      };
      digitando: boolean;
    };
  };
  
  // UI visual
  exibicao: {
    posicao: 'Abaixo última mensagem';
    texto: '{{usuario}} está digitando...';
    animacao: '...' com dots animados;
    icone: '✏️' piscando;
    timeout: 3000; // Remove após 3s sem digitar
  };
  
  // Debounce
  configuracao: {
    debounceTime: 500; // ms
    stopAfter: 3000; // Para de emitir após 3s
  };
}
```

**Benefício:**
```
✅ Agente sabe que cliente está respondendo
✅ Evita enviar outra mensagem enquanto cliente digita
✅ Reduz interrupções
✅ Experiência profissional
```

---

#### **9. ANEXOS E COMPARTILHAMENTO DE ARQUIVOS** ⭐⭐⭐⭐
```typescript
interface CompartilhamentoArquivos {
  // Enviar do CRM para chat
  enviarDoCRM: {
    tipos: ['PROPOSTA' | 'FATURA' | 'CONTRATO' | 'RELATORIO' | 'CATALOGO'];
    
    // Proposta
    proposta: {
      formatoEnvio: 'PDF' | 'LINK_PORTAL';
      mensagemAutomatica: 'Aqui está sua proposta {{proposta.numero}}. Link: {{link}}';
      rastreamento: boolean; // Saber quando cliente visualizou
    };
    
    // Fatura
    fatura: {
      incluirBoleto: boolean;
      incluirPixQRCode: boolean;
      incluirLinkPagamento: boolean;
      mensagemPadrao: 'Fatura {{numero}} no valor de {{valor}}. Vencimento: {{vencimento}}';
    };
    
    // Catálogo de produtos
    catalogo: {
      filtrarPor: 'categoria' | 'tag' | 'preco';
      formatoGrid: boolean; // Galeria de imagens
      incluirPrecos: boolean;
    };
  };
  
  // Upload direto no chat
  uploadDireto: {
    tiposPermitidos: ['PDF', 'DOCX', 'XLSX', 'PNG', 'JPG', 'MP4'];
    tamanhoMaximo: '50MB';
    
    // Compressão automática
    compressao: {
      imagens: {
        qualidade: 80;
        maxWidth: 1920;
        maxHeight: 1080;
      };
      videos: {
        maxDuration: 60; // segundos
        resolution: '720p';
      };
    };
    
    // Armazenamento
    storage: {
      local: 'AWS S3' | 'Azure Blob' | 'Google Cloud';
      backup: boolean;
      retencao: '90_DIAS' | '1_ANO' | 'PERMANENTE';
    };
  };
  
  // Visualização inline
  preview: {
    imagens: 'Lightbox com zoom';
    pdfs: 'Viewer inline';
    videos: 'Player inline';
    documentos: 'Download direto';
  };
}
```

---

#### **10. FILTROS E BUSCA AVANÇADA DE TICKETS** ⭐⭐⭐
```typescript
interface FiltrosAvancadosTickets {
  // Sidebar de filtros
  filtros: {
    // Status
    status: {
      valores: ['ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE', 'RESOLVIDO', 'FECHADO'];
      multiselecao: true;
      contador: number; // Ex: "Aberto (5)"
    };
    
    // Prioridade
    prioridade: {
      valores: ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
      cores: {
        BAIXA: '#28A745',
        MEDIA: '#FFC107',
        ALTA: '#FF5722',
        URGENTE: '#F44336',
      };
    };
    
    // Atribuição
    atribuido: {
      opcoes: ['MEUS_TICKETS', 'EQUIPE', 'NAO_ATRIBUIDOS', 'TODOS'];
      filtroRapido: true; // Toggle no header
    };
    
    // Canal
    canal: {
      valores: ['WHATSAPP', 'EMAIL', 'CHAT', 'TELEFONE', 'PRESENCIAL'];
      icones: true;
    };
    
    // Tags
    tags: {
      valores: string[]; // Dinâmico do banco
      multiselecao: true;
      autoComplete: true;
    };
    
    // Período
    periodo: {
      presets: ['HOJE', 'ONTEM', '7_DIAS', '30_DIAS', 'ESTE_MES'];
      customizado: {
        dataInicio: Date;
        dataFim: Date;
      };
    };
    
    // Cliente
    cliente: {
      busca: 'Nome ou email';
      autoComplete: true;
      historico: true; // Últimas buscas
    };
    
    // SLA
    sla: {
      valores: ['DENTRO_DO_SLA', 'PROXIMO_DO_SLA', 'SLA_VENCIDO'];
      alertas: boolean;
    };
  };
  
  // Busca global
  buscaGlobal: {
    campos: ['CONTEUDO_MENSAGENS', 'NOME_CLIENTE', 'TELEFONE', 'NUMERO_TICKET'];
    operador: 'AND' | 'OR';
    caseSensitive: false;
    highlight: true; // Destacar termo buscado
  };
  
  // Salvamento de filtros
  filtrosSalvos: {
    criar: () => void;
    nome: string;
    compartilhar: boolean; // Com equipe
    exemplos: [
      'Meus tickets urgentes',
      'Aguardando resposta há 24h',
      'Clientes VIP abertos',
      'SLA próximo do vencimento',
    ];
  };
  
  // Ordenação
  ordenacao: {
    campos: ['DATA_CRIACAO', 'ULTIMA_MENSAGEM', 'PRIORIDADE', 'SLA', 'CLIENTE'];
    direcao: 'ASC' | 'DESC';
    padrao: 'ULTIMA_MENSAGEM DESC'; // Mais recentes primeiro
  };
}
```

---

### **PRIORIDADE ALTA** (Melhora produtividade)

#### **11. ATALHOS DE TECLADO COMPLETOS** ⭐⭐⭐
```typescript
interface AtalhosOtimizados {
  // Navegação
  navegacao: {
    'Ctrl+K': 'Busca global de tickets/propostas/clientes';
    'Ctrl+F': 'Buscar na conversa atual';
    '1-9': 'Selecionar ticket 1-9';
    'Esc': 'Fechar ticket atual';
    'Ctrl+[': 'Ticket anterior';
    'Ctrl+]': 'Próximo ticket';
  };
  
  // Ações
  acoes: {
    'Ctrl+Enter': 'Enviar mensagem';
    'Ctrl+Shift+P': 'Nova proposta';
    'Ctrl+Shift+F': 'Nova fatura';
    'Ctrl+Shift+O': 'Nova oportunidade';
    'Ctrl+Shift+N': 'Nova nota interna';
    'Ctrl+Shift+T': 'Transferir ticket';
    'Ctrl+Shift+R': 'Resolver ticket';
    'Ctrl+/': 'Respostas rápidas';
  };
  
  // Formatação
  formatacao: {
    'Ctrl+B': 'Negrito';
    'Ctrl+I': 'Itálico';
    'Ctrl+U': 'Sublinhado';
    'Ctrl+Shift+C': 'Código';
    'Ctrl+Shift+L': 'Link';
  };
  
  // Visualização
  visualizacao: {
    'Ctrl+1': 'Mostrar/ocultar sidebar tickets';
    'Ctrl+2': 'Mostrar/ocultar painel contexto';
    'Ctrl+3': 'Mostrar/ocultar histórico';
    'Ctrl+0': 'Modo foco (só chat)';
  };
  
  // Ajuda
  ajuda: {
    'Ctrl+?': 'Mostrar todos atalhos';
    'F1': 'Base de conhecimento';
  };
}
```

---

#### **12. TAGS E CATEGORIZAÇÃO** ⭐⭐⭐
```typescript
interface SistemaTagsCategorias {
  // Tags customizáveis
  tags: {
    // Criar rapidamente
    criar: {
      atalho: 'Ctrl+Shift+T';
      autoComplete: true;
      cores: true; // Escolher cor da tag
      icone?: string; // Opcional
    };
    
    // Tags sugeridas
    sugestoes: {
      baseadoEm: 'HISTORICO' | 'CONTEUDO_MENSAGEM' | 'IA';
      exemplos: [
        'Dúvida técnica', // Detecta palavras-chave
        'Solicitação comercial',
        'Reclamação',
        'Elogio',
        'Cancelamento',
        'Upgrade',
      ];
    };
    
    // Ações automatizadas por tag
    automacoes: {
      'Tag: Urgente': {
        acao: 'AUMENTAR_PRIORIDADE';
        notificar: ['SUPERVISOR'];
      };
      'Tag: Reclamação': {
        acao: 'CRIAR_TICKET_QUALIDADE';
        notificar: ['GERENTE_CS'];
      };
      'Tag: Upgrade': {
        acao: 'TRANSFERIR_PARA_VENDAS';
      };
    };
  };
  
  // Categorias hierárquicas
  categorias: {
    estrutura: {
      'Suporte Técnico': [
        'Bug', 'Erro', 'Lentidão', 'Integração',
      ],
      'Comercial': [
        'Orçamento', 'Negociação', 'Upgrade', 'Downgrade',
      ],
      'Financeiro': [
        'Pagamento', 'Boleto', 'Nota Fiscal', 'Reembolso',
      ],
      'Relacionamento': [
        'Feedback', 'Sugestão', 'Elogio', 'Reclamação',
      ],
    };
    
    // Seleção rápida
    ui: {
      tipo: 'Dropdown aninhado';
      busca: true;
      criarNova: true; // Inline
    };
  };
  
  // Filtros por tag
  filtros: {
    multiselecao: true;
    operador: 'AND' | 'OR';
    excluir: boolean; // Excluir tickets com tag X
  };
  
  // Relatórios
  relatorios: {
    tagsМais usadas: Tag[];
    tempoPorTag: { tag: string; tempoMedio: number }[];
    taxaResolucaoPorTag: { tag: string; taxa: number }[];
  };
}
```

---

#### **13. SLA E ALERTAS VISUAIS** ⭐⭐⭐
```typescript
interface SLAeAlertas {
  // Configuração de SLA
  sla: {
    // Por prioridade
    configuracao: {
      URGENTE: {
        tempoResposta: 15; // minutos
        tempoResolucao: 2; // horas
      };
      ALTA: {
        tempoResposta: 30;
        tempoResolucao: 4;
      };
      MEDIA: {
        tempoResposta: 60;
        tempoResolucao: 8;
      };
      BAIXA: {
        tempoResposta: 120;
        tempoResolucao: 24;
      };
    };
    
    // Por tipo de cliente
    porSegmento: {
      VIP: {
        multiplicador: 0.5; // 50% do tempo normal
      };
      REGULAR: {
        multiplicador: 1.0;
      };
      NOVO: {
        multiplicador: 1.2;
      };
    };
  };
  
  // Indicadores visuais
  indicadores: {
    // Badge no ticket
    badge: {
      DENTRO_DO_SLA: {
        cor: '#28A745'; // Verde
        texto: '✓ No prazo';
      };
      PROXIMO_SLA: {
        cor: '#FFC107'; // Amarelo
        texto: '⚠️ Vence em 30min';
        pulsar: true; // Animação piscando
      };
      SLA_VENCIDO: {
        cor: '#F44336'; // Vermelho
        texto: '🚨 SLA vencido há 2h';
        destaque: true;
        som: true; // Som de alerta
      };
    };
    
    // Barra de progresso
    progressBar: {
      posicao: 'Header do ticket';
      cores: {
        '0-50%': '#28A745',
        '50-80%': '#FFC107',
        '80-100%': '#FF5722',
        '100%+': '#F44336',
      };
      tooltip: 'SLA vence em 1h 23min';
    };
  };
  
  // Alertas automáticos
  alertas: {
    // Notificações
    notificar: {
      atendente: boolean;
      supervisor: boolean;
      gerente: boolean;
    };
    
    // Momentos de alerta
    quando: [
      '50% do SLA',
      '80% do SLA',
      '90% do SLA',
      'SLA vencido',
      '1h após SLA vencido',
    ];
    
    // Canais de notificação
    canais: ['IN_APP', 'EMAIL', 'PUSH', 'SLACK', 'WHATSAPP'];
  };
  
  // Dashboard SLA
  dashboard: {
    metricas: {
      dentroDoSLA: number; // 85%
      foraDoSLA: number; // 15%
      slaVencidosHoje: number; // 3
      proximosDoSLA: number; // 8
      tempoMedioResposta: string; // 12 min
      tempoMedioResolucao: string; // 3h 45min
    };
    
    // Por atendente
    porAtendente: {
      nome: string;
      dentroDoSLA: number;
      foraDoSLA: number;
      tempoMedioResposta: string;
    }[];
  };
}
```

---

### **PRIORIDADE MÉDIA** (Diferencial competitivo)

#### **14. IA PARA SUGESTÕES DE RESPOSTA** ⭐⭐⭐
```typescript
interface IAsugestoes {
  // Análise de contexto
  analise: {
    mensagemCliente: string;
    historicoConversa: Mensagem[];
    dadosCliente: Cliente;
    ticketsAnteriores: Ticket[];
  };
  
  // Sugestões geradas
  sugestoes: {
    // Resposta sugerida
    respostaSugerida: {
      conteudo: string;
      confianca: number; // 0-1 (0.85 = 85%)
      baseadoEm: 'HISTORICO' | 'BASE_CONHECIMENTO' | 'IA';
      
      // Aprovação do agente
      acoes: {
        aceitar: () => void; // Insere no input
        editar: () => void; // Abre para edição
        rejeitar: () => void; // IA aprende
      };
    };
    
    // Múltiplas opções
    opcoes: [
      {
        tipo: 'FORMAL';
        conteudo: 'Resposta formal';
        confianca: 0.85;
      },
      {
        tipo: 'INFORMAL';
        conteudo: 'Resposta casual';
        confianca: 0.82;
      },
      {
        tipo: 'TECNICA';
        conteudo: 'Resposta técnica';
        confianca: 0.79;
      },
    ];
  };
  
  // Detecção de intenção
  intencao: {
    tipo: 'DUVIDA' | 'RECLAMACAO' | 'ELOGIO' | 'SOLICITACAO' | 'CANCELAMENTO';
    confianca: number;
    acoesRecomendadas: [
      'Criar ticket de suporte',
      'Transferir para vendas',
      'Escalar para supervisor',
    ];
  };
  
  // Análise de sentimento
  sentimento: {
    polaridade: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO';
    intensidade: number; // 0-1
    emocoes: ['FRUSTRADO', 'ANSIOSO', 'SATISFEITO'];
    
    // Alertas
    alertas: {
      clienteInsatisfeito: boolean;
      riscoDeChurn: boolean;
      urgenciaAlta: boolean;
    };
  };
  
  // Artigos da base de conhecimento
  artigosRelacionados: {
    titulo: string;
    resumo: string;
    relevancia: number;
    acoes: {
      enviarAoCliente: () => void;
      copiarConteudo: () => void;
      abrirArtigo: () => void;
    };
  }[];
  
  // Configurações
  config: {
    habilitado: boolean;
    provider: 'OPENAI' | 'ANTHROPIC' | 'LOCAL';
    modelo: 'gpt-4' | 'claude-3.5-sonnet';
    temperatura: number; // 0-1 (criatividade)
    
    // Controle de custos
    limiteDiario: number; // USD
    custoAtual: number;
    alertarEm: number; // %
  };
}
```

---

#### **15. ÁUDIO E CHAMADAS DE VOZ** ⭐⭐
```typescript
interface AudioEChamadas {
  // Mensagens de áudio
  audio: {
    // Gravação inline
    gravar: {
      atalho: 'Segurar Espaço para gravar';
      maxDuracao: 120; // segundos
      formatocodec: 'OPUS' | 'MP3';
      
      // UI
      visualizacao: {
        ondas: true; // Waveform animado
        contador: true; // Tempo decorrido
        cancelar: 'Deslizar para cancelar';
      };
    };
    
    // Reprodução
    player: {
      velocidade: [0.5, 1.0, 1.5, 2.0];
      waveform: true; // Visualizador
      marcadores: boolean; // Marcar pontos importantes
    };
    
    // Transcrição automática (Speech-to-Text)
    transcricao: {
      automatica: boolean;
      lingua: 'pt-BR';
      exibicao: 'Texto abaixo do áudio';
      editar: boolean; // Corrigir transcrição
      
      // Busca em áudios
      buscar: 'Buscar por palavra em todos áudios';
    };
  };
  
  // Chamadas de voz (VoIP)
  chamadas: {
    // Iniciar chamada
    iniciar: {
      tipo: 'AUDIO' | 'VIDEO';
      notificarCliente: boolean;
      gravarChamada: boolean;
      
      // UI durante chamada
      controles: {
        mudo: boolean;
        pausar: boolean;
        transferir: () => void;
        adicionar: () => void; // Conferência
        desligar: () => void;
      };
    };
    
    // Histórico de chamadas
    historico: {
      data: Date;
      duracao: string;
      tipo: 'RECEBIDA' | 'REALIZADA' | 'PERDIDA';
      gravacao?: string; // URL
      transcricao?: string;
      notas?: string;
    }[];
    
    // Integração com Twilio
    provider: 'TWILIO' | 'VONAGE' | 'ASTERISK';
    
    // Métricas
    metricas: {
      totalChamadas: number;
      duracaoMedia: string;
      taxaAtendimento: number; // %
      avaliacaoMedia: number;
    };
  };
}
```

---

#### **16. TRADUÇÃO AUTOMÁTICA** ⭐⭐
```typescript
interface TraducaoAutomatica {
  // Detectar idioma
  deteccao: {
    automatica: boolean;
    idiomas: ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE'];
    
    // Notificação
    alerta: 'Cliente escrevendo em inglês. Traduzir?';
  };
  
  // Traduzir mensagens
  traducao: {
    // Mensagem recebida (cliente)
    recebida: {
      traduzir: 'Automático' | 'Manual' | 'Nunca';
      exibicao: {
        original: 'Expandir para ver original';
        traduzida: 'Texto principal';
        idioma: 'Badge: 🇺🇸 Inglês';
      };
    };
    
    // Mensagem enviada (agente)
    enviada: {
      traduzirAntes: boolean; // Traduz antes de enviar
      revisarTraducao: boolean; // Mostra prévia
      idiomaDestino: string; // Idioma do cliente
    };
    
    // Provider
    provider: 'GOOGLE_TRANSLATE' | 'DEEPL' | 'AZURE';
    
    // Cache
    cache: boolean; // Não traduzir mesma frase 2x
  };
  
  // Respostas rápidas multilíngue
  respostasRapidas: {
    '/hello': {
      'pt-BR': 'Olá! Como posso ajudar?',
      'en-US': 'Hello! How can I help you?',
      'es-ES': '¡Hola! ¿Cómo puedo ayudarte?',
    };
  };
}
```

---

### **PRIORIDADE BAIXA** (Nice to have)

#### **17. EMOJI E GIF PICKER** ⭐⭐
```typescript
interface EmojiGIF {
  // Emoji picker
  emoji: {
    atalho: ':'; // : abre picker
    categorias: ['Recentes', 'Smileys', 'Pessoas', 'Natureza', 'Comida', 'Atividades'];
    busca: true;
    skintone: true; // Seleção de tom de pele
  };
  
  // GIF picker
  gif: {
    provider: 'GIPHY' | 'TENOR';
    busca: true;
    trending: true; // GIFs em alta
    limiteTamanho: '2MB';
  };
}
```

---

#### **18. MARKDOWN E FORMATAÇÃO** ⭐⭐
```typescript
interface FormatacaoTexto {
  markdown: {
    suportado: [
      '**negrito**',
      '_itálico_',
      '~~tachado~~',
      '`código inline`',
      '```bloco de código```',
      '> citação',
      '- lista',
    ];
    
    preview: boolean; // Ver formatação antes de enviar
    atalhos: {
      'Ctrl+B': 'Negrito',
      'Ctrl+I': 'Itálico',
      'Ctrl+Shift+C': 'Código',
    };
  };
}
```

---

## 📊 RESUMO: Matriz de Prioridades

| Funcionalidade | Impacto | Esforço | Prioridade | ROI |
|----------------|---------|---------|------------|-----|
| **1. Painel Contexto Cliente** | ⭐⭐⭐⭐⭐ | 🔧🔧🔧 | 🔴 CRÍTICA | 🚀🚀🚀🚀🚀 |
| **2. Busca Rápida CRM** | ⭐⭐⭐⭐⭐ | 🔧🔧 | 🔴 CRÍTICA | 🚀🚀🚀🚀🚀 |
| **3. Ações Rápidas CRM** | ⭐⭐⭐⭐⭐ | 🔧🔧🔧🔧 | 🔴 CRÍTICA | 🚀🚀🚀🚀⭐ |
| **4. Notas Internas** | ⭐⭐⭐⭐⭐ | 🔧🔧 | 🔴 CRÍTICA | 🚀🚀🚀🚀⭐ |
| **5. Respostas Rápidas** | ⭐⭐⭐⭐⭐ | 🔧🔧 | 🔴 CRÍTICA | 🚀🚀🚀🚀🚀 |
| **6. Histórico Unificado** | ⭐⭐⭐⭐ | 🔧🔧🔧 | 🟠 ALTA | 🚀🚀🚀🚀 |
| **7. Status Mensagens** | ⭐⭐⭐⭐ | 🔧🔧 | 🟠 ALTA | 🚀🚀🚀⭐ |
| **8. Indicador Digitando** | ⭐⭐⭐ | 🔧 | 🟠 ALTA | 🚀🚀🚀 |
| **9. Compartilhar Arquivos** | ⭐⭐⭐⭐ | 🔧🔧🔧 | 🟠 ALTA | 🚀🚀🚀⭐ |
| **10. Filtros Avançados** | ⭐⭐⭐⭐ | 🔧🔧🔧 | 🟠 ALTA | 🚀🚀🚀 |
| **11. Atalhos Teclado** | ⭐⭐⭐ | 🔧🔧 | 🟡 MÉDIA | 🚀🚀⭐ |
| **12. Tags/Categorias** | ⭐⭐⭐ | 🔧🔧 | 🟡 MÉDIA | 🚀🚀⭐ |
| **13. SLA e Alertas** | ⭐⭐⭐⭐ | 🔧🔧🔧 | 🟡 MÉDIA | 🚀🚀🚀 |
| **14. IA Sugestões** | ⭐⭐⭐ | 🔧🔧🔧🔧 | 🟡 MÉDIA | 🚀🚀 |
| **15. Áudio/Chamadas** | ⭐⭐ | 🔧🔧🔧🔧 | 🟢 BAIXA | 🚀⭐ |
| **16. Tradução** | ⭐⭐ | 🔧🔧🔧 | 🟢 BAIXA | 🚀⭐ |
| **17. Emoji/GIF** | ⭐⭐ | 🔧 | 🟢 BAIXA | 🚀⭐ |
| **18. Markdown** | ⭐⭐ | 🔧🔧 | 🟢 BAIXA | 🚀⭐ |

---

## 🎯 ROADMAP RECOMENDADO: 90 Dias

### **SPRINT 1 (Semanas 1-2): Fundação Crítica**
```
🔴 OBJETIVO: Agente não precisa mais sair do chat

✅ Painel Lateral de Contexto Cliente (6 dias)
   ├─ Dados básicos do cliente
   ├─ Histórico de propostas
   ├─ Faturas pendentes/pagas
   ├─ Tickets anteriores
   └─ Ações rápidas (criar proposta/fatura)

✅ Busca Rápida Ctrl+K (3 dias)
   ├─ Buscar propostas
   ├─ Buscar faturas
   ├─ Buscar clientes
   └─ Enviar resultado no chat

✅ Notas Internas (2 dias)
   ├─ CRUD de notas
   ├─ Visibilidade (só equipe)
   ├─ Menções @usuario
   └─ Exibição no chat

RESULTADO: Agente 60% mais produtivo ⚡
```

### **SPRINT 2 (Semanas 3-4): Produtividade++**
```
🟠 OBJETIVO: Agente 3x mais rápido

✅ Respostas Rápidas (4 dias)
   ├─ CRUD de templates
   ├─ Variáveis {{cliente.nome}}
   ├─ Atalhos /comando
   └─ Busca Ctrl+/

✅ Ações Rápidas CRM (5 dias)
   ├─ Criar proposta (modal inline)
   ├─ Criar fatura (modal inline)
   ├─ Enviar no chat automaticamente
   └─ Transferir ticket com contexto

✅ Status Mensagens ✓✓ (3 dias)
   ├─ Webhook WhatsApp
   ├─ Atualização real-time
   └─ Indicador "lido"

RESULTADO: Tempo médio atendimento -50% 🚀
```

### **SPRINT 3 (Semanas 5-6): Experiência Completa**
```
🟠 OBJETIVO: UX profissional

✅ Histórico Unificado (5 dias)
   ├─ Timeline de interações
   ├─ Filtros por tipo/período
   ├─ Estatísticas rápidas
   └─ Ver detalhes inline

✅ Indicador "Digitando..." (2 dias)
   ├─ WebSocket event
   ├─ Debounce 500ms
   └─ Animação visual

✅ Filtros Avançados (4 dias)
   ├─ Status, prioridade, canal
   ├─ Tags, período, SLA
   ├─ Salvamento de filtros
   └─ Contadores em tempo real

RESULTADO: Interface classe mundial 🏆
```

### **SPRINT 4 (Semanas 7-8): Gestão Avançada**
```
🟡 OBJETIVO: Controle total

✅ Tags e Categorização (3 dias)
   ├─ CRUD de tags
   ├─ Cores personalizadas
   ├─ Automações por tag
   └─ Filtros multi-tag

✅ SLA e Alertas (4 dias)
   ├─ Configuração por prioridade
   ├─ Barra de progresso visual
   ├─ Alertas automáticos
   └─ Dashboard SLA

✅ Atalhos de Teclado (2 dias)
   ├─ 20+ atalhos
   ├─ Modal de ajuda (Ctrl+/)
   └─ Customização

RESULTADO: Gestão profissional de SLA 📊
```

### **SPRINT 5 (Semanas 9-10): Compartilhamento**
```
🟡 OBJETIVO: Enviar arquivos do CRM

✅ Compartilhamento de Arquivos (5 dias)
   ├─ Enviar proposta PDF
   ├─ Enviar fatura com pagamento
   ├─ Enviar catálogo produtos
   ├─ Upload direto
   └─ Preview inline

✅ Histórico de Anexos (2 dias)
   ├─ Galeria de imagens
   ├─ Lista de documentos
   └─ Busca por nome

RESULTADO: Fluxo de vendas completo 💼
```

### **SPRINT 6 (Semanas 11-12): Inteligência**
```
🟢 OBJETIVO: IA assistente

✅ IA Sugestões de Resposta (7 dias)
   ├─ Integração OpenAI/Claude
   ├─ Análise de contexto
   ├─ 3 opções de resposta
   ├─ Detecção de intenção
   ├─ Análise de sentimento
   └─ Artigos relacionados

✅ Feature Flag + Controle Custo (2 dias)
   ├─ Desabilitar IA facilmente
   ├─ Limite diário USD
   ├─ Monitoramento custo
   └─ Fallback templates

RESULTADO: Atendimento assistido por IA 🤖
```

---

## 💰 Análise de Impacto

### **Antes vs Depois**

```
┌────────────────────────────────────────────────────┐
│ MÉTRICA           │ ANTES  │ DEPOIS │ MELHORIA    │
├────────────────────────────────────────────────────┤
│ Tempo médio       │ 8 min  │ 4 min  │ -50% ⚡     │
│ Tickets/dia       │ 30     │ 60     │ +100% 🚀    │
│ Sair do chat      │ 5x     │ 0x     │ -100% ✅    │
│ Satisfação        │ 4.2⭐  │ 4.8⭐  │ +14% 🏆     │
│ SLA cumprido      │ 75%    │ 95%    │ +27% 📊     │
│ Notas perdidas    │ 30%    │ 0%     │ -100% 📝    │
│ Retrabalho        │ 20%    │ 5%     │ -75% 🎯     │
└────────────────────────────────────────────────────┘
```

### **ROI Estimado**

```
Agente com salário de R$ 3.000/mês:
• Produtividade +100% = Dobra a capacidade
• Equivale a contratar +1 agente
• Economia: R$ 3.000/mês por agente
• ROI: 300% em 6 meses

Time de 10 agentes:
• Economia: R$ 30.000/mês
• Investimento desenvolvimento: R$ 50.000 (uma vez)
• Break-even: 1.7 meses
• ROI anual: 720%
```

---

## 🎯 CONCLUSÃO

### **O que o agente PRECISA:**

1. ✅ **Ver tudo do cliente** sem sair do chat
2. ✅ **Buscar qualquer coisa** em segundos (Ctrl+K)
3. ✅ **Criar propostas/faturas** sem sair do chat
4. ✅ **Deixar notas** para próximos atendentes
5. ✅ **Respostas rápidas** para economizar tempo
6. ✅ **Status real-time** das mensagens
7. ✅ **Histórico completo** de interações
8. ✅ **Filtros poderosos** para encontrar tickets
9. ✅ **Enviar arquivos** do CRM para chat
10. ✅ **IA para ajudar** nas respostas

### **Prioridade Absoluta (Implementar JÁ):**

```
🔴 SPRINT 1 (2 semanas):
1. Painel Contexto Cliente
2. Busca Rápida Ctrl+K
3. Notas Internas

Impacto: Agente não sai mais do chat = +60% produtividade

🔴 SPRINT 2 (2 semanas):
4. Respostas Rápidas
5. Ações Rápidas CRM
6. Status Mensagens

Impacto: Tempo médio -50% = dobra capacidade atendimento
```

**Total: 4 semanas para transformar completamente o atendimento! 🚀**

---

**Quer que eu implemente o SPRINT 1 agora?** Posso começar pelo **Painel de Contexto do Cliente** que é a funcionalidade mais crítica! 😊
