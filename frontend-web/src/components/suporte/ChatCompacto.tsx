import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Brain, 
  Sparkles,
  ArrowRight,
  X,
  Minimize2
} from 'lucide-react';
import { iaService } from '../../services/iaService';

interface MensagemChat {
  id: string;
  tipo: 'usuario' | 'ia';
  conteudo: string;
  timestamp: Date;
  confianca?: number;
  sugestoes?: string[];
}

interface ChatCompactoProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onTransferirParaAgente?: (contexto: string, historico: MensagemChat[]) => void;
  autoFocus?: boolean;
}

export const ChatCompacto: React.FC<ChatCompactoProps> = ({
  onClose,
  onMinimize,
  onTransferirParaAgente,
  autoFocus = true
}) => {
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessaoId] = useState(() => iaService.criarSessao('usuario_atual'));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus no input quando componente monta
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [autoFocus]);

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Mensagem inicial de boas-vindas
  useEffect(() => {
    if (mensagens.length === 0) {
      console.log('🔄 Inicializando chat compacto...');
      console.log('🤖 Testando IA Service:', iaService);
      
      // Teste simples do iaService
      try {
        const testeResposta = iaService.gerarResposta('olá', sessaoId);
        console.log('✅ IA Service funcionando! Resposta teste:', testeResposta);
      } catch (error) {
        console.error('❌ Erro no IA Service:', error);
      }
      
      const agora = new Date();
      const hora = agora.getHours();
      
      let saudacao = '👋 Olá!';
      if (hora < 12) {
        saudacao = '🌅 Bom dia!';
      } else if (hora < 18) {
        saudacao = '☀️ Boa tarde!';
      } else {
        saudacao = '🌙 Boa noite!';
      }

      const mensagemInicial: MensagemChat = {
        id: 'inicial',
        tipo: 'ia',
        conteudo: `${saudacao} Sou a IA do ConectCRM. Como posso ajudar você hoje?`,
        timestamp: new Date(),
        confianca: 1.0,
        sugestoes: [
          'Como criar um cliente?',
          'Como fazer uma proposta?',
          'Falar com especialista'
        ]
      };
      setMensagens([mensagemInicial]);
    }
  }, [mensagens.length, sessaoId]);

  const processarMensagem = useCallback(async (texto: string) => {
    setIsTyping(true);
    console.log('🔄 Processando mensagem:', texto);

    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    try {
      console.log('📤 Enviando para IA Service...');
      const resposta = iaService.gerarResposta(texto, sessaoId);
      console.log('📨 Resposta da IA:', resposta);
      
      iaService.atualizarContexto(sessaoId, texto);

      const novaMensagemIA: MensagemChat = {
        id: Date.now().toString(),
        tipo: 'ia',
        conteudo: resposta.resposta,
        timestamp: new Date(),
        confianca: resposta.confianca,
        sugestoes: resposta.sugestoes
      };

      setMensagens(prev => [...prev, novaMensagemIA]);

      // Se é transferência para agente
      if (resposta.categoria === 'transferencia' && onTransferirParaAgente) {
        setTimeout(() => {
          onTransferirParaAgente(texto, [...mensagens, novaMensagemIA]);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      
      const mensagemErro: MensagemChat = {
        id: Date.now().toString(),
        tipo: 'ia',
        conteudo: '😅 Ops! Tive um pequeno problema. Pode tentar novamente ou falar com um especialista?',
        timestamp: new Date(),
        confianca: 0.1,
        sugestoes: ['Tentar novamente', 'Falar com especialista']
      };
      
      setMensagens(prev => [...prev, mensagemErro]);
    } finally {
      setIsTyping(false);
    }
  }, [sessaoId, mensagens, onTransferirParaAgente]);

  const enviarMensagem = useCallback(async () => {
    if (!novaMensagem.trim()) return;

    const mensagemUsuario: MensagemChat = {
      id: Date.now().toString(),
      tipo: 'usuario',
      conteudo: novaMensagem,
      timestamp: new Date()
    };

    setMensagens(prev => [...prev, mensagemUsuario]);
    const textoMensagem = novaMensagem;
    setNovaMensagem('');

    await processarMensagem(textoMensagem);
  }, [novaMensagem, processarMensagem]);

  const usarSugestao = useCallback(async (sugestao: string) => {
    console.log('🎯 Usando sugestão:', sugestao);
    
    // Se é "Falar com especialista", transferir diretamente
    if (sugestao.toLowerCase().includes('especialista') || sugestao.toLowerCase().includes('agente')) {
      if (onTransferirParaAgente) {
        onTransferirParaAgente('Solicitou falar com especialista', mensagens);
        return;
      }
    }
    
    // Adicionar como mensagem do usuário e processar
    const mensagemUsuario: MensagemChat = {
      id: Date.now().toString(),
      tipo: 'usuario',
      conteudo: sugestao,
      timestamp: new Date()
    };

    setMensagens(prev => [...prev, mensagemUsuario]);
    await processarMensagem(sugestao);
  }, [mensagens, onTransferirParaAgente, processarMensagem]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  return (
    <div className="w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#159A9C] to-[#1DB5B8] text-white p-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-medium text-sm">IA ConectCRM</h3>
            <div className="flex items-center space-x-1 text-xs opacity-90">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title="Minimizar"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {mensagens.map((mensagem) => (
          <div
            key={mensagem.id}
            className={`flex ${mensagem.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${mensagem.tipo === 'usuario' ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-end space-x-2 ${mensagem.tipo === 'usuario' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  mensagem.tipo === 'usuario' 
                    ? 'bg-[#159A9C] text-white' 
                    : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
                }`}>
                  {mensagem.tipo === 'usuario' ? (
                    <User className="w-3 h-3" />
                  ) : (
                    <Brain className="w-3 h-3" />
                  )}
                </div>

                {/* Mensagem */}
                <div className={`rounded-xl px-3 py-2 max-w-full text-sm ${
                  mensagem.tipo === 'usuario'
                    ? 'bg-[#159A9C] text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {mensagem.conteudo}
                  </p>

                  {/* Sugestões */}
                  {mensagem.sugestoes && mensagem.sugestoes.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {mensagem.sugestoes.map((sugestao, index) => (
                        <button
                          key={index}
                          onClick={() => usarSugestao(sugestao)}
                          className="block w-full text-left text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          {sugestao}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Indicador de digitação */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="w-3 h-3 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl px-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            disabled={isTyping}
          />
          <button
            onClick={enviarMensagem}
            disabled={!novaMensagem.trim() || isTyping}
            className="bg-[#159A9C] text-white p-2 rounded-lg hover:bg-[#138A8C] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
