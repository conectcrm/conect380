import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  Brain, 
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  UserCheck
} from 'lucide-react';

interface MensagemIA {
  id: string;
  tipo: 'usuario' | 'ia' | 'sistema' | 'transferencia';
  conteudo: string;
  timestamp: Date;
  confianca?: number;
  sugestoes?: string[];
  acoes?: {
    tipo: 'transferir' | 'buscar' | 'executar';
    label: string;
    dados?: any;
  }[];
  categoriaIA?: 'resposta_direta' | 'busca_conhecimento' | 'transferencia_sugerida' | 'erro';
}

interface ConhecimentoIA {
  id: string;
  categoria: string;
  pergunta: string;
  resposta: string;
  tags: string[];
  confianca: number;
  atualizadoEm: Date;
}

interface ChatBotIAProps {
  onTransferirParaAgente?: (contexto: string, historico: MensagemIA[]) => void;
  sessaoAtiva?: boolean;
}

export const ChatBotIA: React.FC<ChatBotIAProps> = ({
  onTransferirParaAgente,
  sessaoAtiva = true
}) => {
  const [mensagens, setMensagens] = useState<MensagemIA[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [iaStatus, setIaStatus] = useState<'online' | 'processando' | 'offline'>('online');
  const [showSugestoes, setShowSugestoes] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Base de conhecimento da IA sobre o ConectCRM
  const conhecimentoBase: ConhecimentoIA[] = [
    {
      id: '1',
      categoria: 'funcionalidades',
      pergunta: 'Como criar um novo cliente no ConectCRM?',
      resposta: 'Para criar um novo cliente: 1) Acesse o módulo "Clientes" no menu lateral, 2) Clique no botão "+Novo Cliente", 3) Preencha os dados obrigatórios (nome, tipo de pessoa), 4) Adicione informações de contato, 5) Clique em "Salvar". O sistema validará automaticamente CPF/CNPJ e CEP.',
      tags: ['cliente', 'cadastro', 'novo', 'criar'],
      confianca: 0.95,
      atualizadoEm: new Date()
    },
    {
      id: '2',
      categoria: 'propostas',
      pergunta: 'Como criar uma proposta comercial?',
      resposta: 'Para criar uma proposta: 1) Vá em "Propostas" > "Nova Proposta", 2) Selecione o cliente, 3) Escolha entre produtos/serviços ou combos, 4) Configure preços e condições, 5) Adicione observações se necessário, 6) Gere o PDF da proposta. O sistema calcula automaticamente impostos e totais.',
      tags: ['proposta', 'comercial', 'pdf', 'preços'],
      confianca: 0.92,
      atualizadoEm: new Date()
    },
    {
      id: '3',
      categoria: 'agenda',
      pergunta: 'Como agendar reuniões e compromissos?',
      resposta: 'Para agendar: 1) Acesse a "Agenda", 2) Clique no dia/horário desejado ou "+Novo Evento", 3) Preencha título, descrição e participantes, 4) Configure lembretes, 5) Salve o evento. Você pode arrastar eventos para reagendar e convidar clientes por email.',
      tags: ['agenda', 'reunião', 'evento', 'compromisso'],
      confianca: 0.90,
      atualizadoEm: new Date()
    },
    {
      id: '4',
      categoria: 'produtos',
      pergunta: 'Como cadastrar produtos e serviços?',
      resposta: 'Para cadastrar produtos: 1) Vá em "Produtos" > "Novo Produto", 2) Preencha nome, descrição e categoria, 3) Configure preços e impostos, 4) Defina tipo (produto/serviço/licença), 5) Configure campos específicos de software se aplicável. Use categorias para organizar melhor.',
      tags: ['produto', 'serviço', 'cadastro', 'preço'],
      confianca: 0.88,
      atualizadoEm: new Date()
    },
    {
      id: '5',
      categoria: 'dashboard',
      pergunta: 'Como interpretar o dashboard e métricas?',
      resposta: 'O dashboard mostra: 1) Visão geral de vendas e clientes, 2) Gráficos de performance mensal, 3) Funil de vendas, 4) Próximos compromissos, 5) Notificações importantes. Clique nos cards para ver detalhes e use os filtros de período para análises específicas.',
      tags: ['dashboard', 'métricas', 'gráficos', 'análise'],
      confianca: 0.85,
      atualizadoEm: new Date()
    },
    {
      id: '6',
      categoria: 'configurações',
      pergunta: 'Como configurar permissões de usuário?',
      resposta: 'Para configurar permissões: 1) Acesse "Configurações" > "Usuários", 2) Selecione o usuário, 3) Defina o perfil (Admin, Vendedor, Consultor), 4) Configure permissões específicas por módulo, 5) Salve as alterações. Administradores têm acesso total.',
      tags: ['permissões', 'usuário', 'configurações', 'admin'],
      confianca: 0.87,
      atualizadoEm: new Date()
    }
  ];

  // Perguntas sugeridas para iniciar a conversa
  const perguntasSugeridas = [
    "Como criar um novo cliente?",
    "Como fazer uma proposta?",
    "Como usar o dashboard?",
    "Preciso de ajuda com a agenda",
    "Problemas com login",
    "Falar com um agente"
  ];

  // Função para encontrar resposta na base de conhecimento
  const buscarResposta = useCallback((pergunta: string): ConhecimentoIA | null => {
    const perguntaLower = pergunta.toLowerCase();
    
    // Busca por correspondência exata nas tags
    let melhorMatch = conhecimentoBase.find(item => 
      item.tags.some(tag => perguntaLower.includes(tag.toLowerCase()))
    );

    // Se não encontrar, busca por palavras-chave na pergunta
    if (!melhorMatch) {
      melhorMatch = conhecimentoBase.find(item => 
        perguntaLower.includes(item.categoria.toLowerCase()) ||
        item.pergunta.toLowerCase().includes(perguntaLower)
      );
    }

    return melhorMatch || null;
  }, []);

  // Função para processar pergunta do usuário
  const processarPergunta = useCallback(async (pergunta: string) => {
    setIsTyping(true);
    setIaStatus('processando');

    // Simular tempo de processamento da IA
    await new Promise(resolve => setTimeout(resolve, 1500));

    const resposta = buscarResposta(pergunta);
    
    if (resposta && resposta.confianca > 0.7) {
      // IA conseguiu responder com confiança
      const mensagemIA: MensagemIA = {
        id: Date.now().toString(),
        tipo: 'ia',
        conteudo: resposta.resposta,
        timestamp: new Date(),
        confianca: resposta.confianca,
        categoriaIA: 'resposta_direta',
        sugestoes: [
          "Isso resolveu sua dúvida?",
          "Precisa de mais detalhes?",
          "Quer ver um tutorial?"
        ],
        acoes: [
          {
            tipo: 'buscar',
            label: 'Ver tutorial relacionado',
            dados: { categoria: resposta.categoria }
          }
        ]
      };
      
      setMensagens(prev => [...prev, mensagemIA]);
    } else if (pergunta.toLowerCase().includes('agente') || pergunta.toLowerCase().includes('humano')) {
      // Usuário pede especificamente para falar com agente
      const mensagemTransferencia: MensagemIA = {
        id: Date.now().toString(),
        tipo: 'transferencia',
        conteudo: 'Entendi que você gostaria de falar com um agente humano. Vou transferir você agora. Um agente estará disponível em alguns instantes.',
        timestamp: new Date(),
        categoriaIA: 'transferencia_sugerida',
        acoes: [
          {
            tipo: 'transferir',
            label: 'Conectar com agente',
            dados: { motivo: 'solicitacao_usuario', contexto: pergunta }
          }
        ]
      };
      
      setMensagens(prev => [...prev, mensagemTransferencia]);
    } else {
      // IA não conseguiu responder - sugerir transferência
      const mensagemIA: MensagemIA = {
        id: Date.now().toString(),
        tipo: 'ia',
        conteudo: 'Hmm, não tenho certeza sobre essa questão específica. Posso tentar buscar mais informações ou conectar você com um agente humano que pode ajudar melhor. O que prefere?',
        timestamp: new Date(),
        confianca: 0.3,
        categoriaIA: 'transferencia_sugerida',
        sugestoes: [
          "Buscar na documentação",
          "Falar com agente humano",
          "Refazer a pergunta"
        ],
        acoes: [
          {
            tipo: 'transferir',
            label: 'Conectar com agente',
            dados: { motivo: 'ia_nao_conseguiu', contexto: pergunta }
          },
          {
            tipo: 'buscar',
            label: 'Buscar na documentação',
            dados: { termo: pergunta }
          }
        ]
      };
      
      setMensagens(prev => [...prev, mensagemIA]);
    }

    setIsTyping(false);
    setIaStatus('online');
  }, [buscarResposta]);

  // Enviar mensagem
  const enviarMensagem = useCallback(async () => {
    if (!novaMensagem.trim()) return;

    const mensagemUsuario: MensagemIA = {
      id: Date.now().toString(),
      tipo: 'usuario',
      conteudo: novaMensagem,
      timestamp: new Date()
    };

    setMensagens(prev => [...prev, mensagemUsuario]);
    const pergunta = novaMensagem;
    setNovaMensagem('');
    setShowSugestoes(false);

    await processarPergunta(pergunta);
  }, [novaMensagem, processarPergunta]);

  // Usar sugestão
  const usarSugestao = useCallback((sugestao: string) => {
    setNovaMensagem(sugestao);
    inputRef.current?.focus();
  }, []);

  // Executar ação da IA
  const executarAcao = useCallback((acao: MensagemIA['acoes'][0]) => {
    if (acao.tipo === 'transferir' && onTransferirParaAgente) {
      onTransferirParaAgente(acao.dados?.contexto || 'Transferência solicitada', mensagens);
    } else if (acao.tipo === 'buscar') {
      // Implementar busca na documentação
      console.log('Buscar:', acao.dados);
    }
  }, [mensagens, onTransferirParaAgente]);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Mensagem inicial
  useEffect(() => {
    if (mensagens.length === 0) {
      const mensagemInicial: MensagemIA = {
        id: 'inicial',
        tipo: 'ia',
        conteudo: '👋 Olá! Sou a IA do ConectCRM, especializada em ajudar com dúvidas sobre o sistema. Posso explicar funcionalidades, guiar você através de processos ou conectar com um agente humano se necessário. Como posso ajudar?',
        timestamp: new Date(),
        confianca: 1.0,
        categoriaIA: 'resposta_direta'
      };
      setMensagens([mensagemInicial]);
    }
  }, [mensagens.length]);

  const getStatusIcon = () => {
    switch (iaStatus) {
      case 'online':
        return <Brain className="w-4 h-4 text-green-500" />;
      case 'processando':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'offline':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (iaStatus) {
      case 'online':
        return 'IA Online';
      case 'processando':
        return 'Processando...';
      case 'offline':
        return 'IA Offline';
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#159A9C] to-[#1DB5B8] text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">ConectCRM IA</h3>
              <div className="flex items-center space-x-2 text-sm opacity-90">
                {getStatusIcon()}
                <span>{getStatusText()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs">Especializada</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {mensagens.map((mensagem) => (
          <div
            key={mensagem.id}
            className={`flex ${mensagem.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${mensagem.tipo === 'usuario' ? 'order-2' : 'order-1'}`}>
              {/* Avatar */}
              <div className={`flex items-end space-x-2 ${mensagem.tipo === 'usuario' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  mensagem.tipo === 'usuario' 
                    ? 'bg-[#159A9C] text-white' 
                    : mensagem.tipo === 'transferencia'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
                }`}>
                  {mensagem.tipo === 'usuario' ? (
                    <User className="w-4 h-4" />
                  ) : mensagem.tipo === 'transferencia' ? (
                    <UserCheck className="w-4 h-4" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                </div>

                <div className={`rounded-2xl px-4 py-3 max-w-full ${
                  mensagem.tipo === 'usuario'
                    ? 'bg-[#159A9C] text-white'
                    : mensagem.tipo === 'transferencia'
                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {mensagem.conteudo}
                  </p>

                  {/* Indicador de confiança da IA */}
                  {mensagem.tipo === 'ia' && mensagem.confianca && (
                    <div className="mt-2 flex items-center space-x-2 text-xs opacity-70">
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${
                          mensagem.confianca > 0.8 ? 'bg-green-500' :
                          mensagem.confianca > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span>Confiança: {Math.round(mensagem.confianca * 100)}%</span>
                      </div>
                      <Clock className="w-3 h-3" />
                      <span>{mensagem.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}

                  {/* Sugestões */}
                  {mensagem.sugestoes && mensagem.sugestoes.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {mensagem.sugestoes.map((sugestao, index) => (
                        <button
                          key={index}
                          onClick={() => usarSugestao(sugestao)}
                          className="block w-full text-left text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          {sugestao}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Ações */}
                  {mensagem.acoes && mensagem.acoes.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {mensagem.acoes.map((acao, index) => (
                        <button
                          key={index}
                          onClick={() => executarAcao(acao)}
                          className={`flex items-center space-x-2 w-full text-xs px-3 py-2 rounded-lg transition-colors ${
                            acao.tipo === 'transferir'
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'bg-[#159A9C] text-white hover:bg-[#138A8C]'
                          }`}
                        >
                          <span>{acao.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sugestões rápidas */}
      {showSugestoes && mensagens.length <= 1 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Sugestões rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {perguntasSugeridas.map((sugestao, index) => (
              <button
                key={index}
                onClick={() => usarSugestao(sugestao)}
                className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full hover:bg-gray-50 transition-colors"
              >
                {sugestao}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
            placeholder="Digite sua pergunta..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            disabled={iaStatus === 'offline'}
          />
          <button
            onClick={enviarMensagem}
            disabled={!novaMensagem.trim() || iaStatus === 'offline'}
            className="bg-[#159A9C] text-white p-2 rounded-lg hover:bg-[#138A8C] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
