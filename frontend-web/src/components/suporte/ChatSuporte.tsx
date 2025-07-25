import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, User, Bot, Clock, CheckCheck, Phone, Mail } from 'lucide-react';

interface Mensagem {
  id: string;
  tipo: 'usuario' | 'agente' | 'sistema';
  autor: string;
  conteudo: string;
  timestamp: Date;
  status?: 'enviando' | 'enviada' | 'lida';
  anexos?: Array<{
    nome: string;
    tipo: string;
    tamanho: string;
    url: string;
  }>;
}

interface ChatSuporteProps {
  searchTerm: string;
}

export const ChatSuporte: React.FC<ChatSuporteProps> = ({ searchTerm }) => {
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: '1',
      tipo: 'sistema',
      autor: 'Sistema',
      conteudo: 'Bem-vindo ao suporte do ConectCRM! Como podemos ajudá-lo hoje?',
      timestamp: new Date(Date.now() - 300000),
      status: 'lida'
    },
    {
      id: '2',
      tipo: 'agente',
      autor: 'Ana Silva',
      conteudo: 'Olá! Eu sou a Ana, sua consultora de suporte. Estou aqui para ajudá-lo com qualquer dúvida sobre o ConectCRM. Em que posso ser útil?',
      timestamp: new Date(Date.now() - 240000),
      status: 'lida'
    }
  ]);

  const [novaMensagem, setNovaMensagem] = useState('');
  const [digitando, setDigitando] = useState(false);
  const [statusConexao, setStatusConexao] = useState<'online' | 'ocupado' | 'offline'>('online');
  const [agenteOnline, setAgenteOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  const enviarMensagem = () => {
    if (!novaMensagem.trim()) return;

    const novaMensagemObj: Mensagem = {
      id: Date.now().toString(),
      tipo: 'usuario',
      autor: 'Você',
      conteudo: novaMensagem,
      timestamp: new Date(),
      status: 'enviando'
    };

    setMensagens(prev => [...prev, novaMensagemObj]);
    setNovaMensagem('');

    // Simular resposta do agente
    setDigitando(true);
    setTimeout(() => {
      const respostaAgente: Mensagem = {
        id: (Date.now() + 1).toString(),
        tipo: 'agente',
        autor: 'Ana Silva',
        conteudo: 'Entendi sua questão. Vou verificar isso para você e te retorno em instantes.',
        timestamp: new Date(),
        status: 'enviada'
      };
      
      setMensagens(prev => prev.map(m => 
        m.id === novaMensagemObj.id ? { ...m, status: 'lida' } : m
      ).concat(respostaAgente));
      
      setDigitando(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  const formatarTempo = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'enviando':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'enviada':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'lida':
        return <CheckCheck className="w-3 h-3 text-[#159A9C]" />;
      default:
        return null;
    }
  };

  const respostasRapidas = [
    'Como posso importar meus contatos?',
    'Como configurar a integração com email?',
    'Qual a diferença entre os planos?',
    'Como gerar relatórios personalizados?'
  ];

  return (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-[#159A9C] rounded-full flex items-center justify-center text-white font-semibold">
                AS
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                statusConexao === 'online' ? 'bg-green-500' :
                statusConexao === 'ocupado' ? 'bg-yellow-500' : 'bg-gray-400'
              }`}></div>
            </div>
            <div>
              <h3 className="font-medium text-[#002333]">Ana Silva</h3>
              <p className="text-sm text-gray-600">
                {statusConexao === 'online' ? 'Online - Disponível' :
                 statusConexao === 'ocupado' ? 'Ocupado - Responde em breve' : 'Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-[#159A9C] transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-[#159A9C] transition-colors">
              <Mail className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[#002333]">
            Chat de Suporte
          </h2>
          <p className="text-sm text-gray-600">
            Tempo médio de resposta: 2 minutos
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mensagens.map((mensagem) => (
            <div
              key={mensagem.id}
              className={`flex ${mensagem.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${mensagem.tipo === 'usuario' ? 'order-2' : 'order-1'}`}>
                {mensagem.tipo !== 'usuario' && (
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex items-center space-x-1">
                      {mensagem.tipo === 'agente' ? (
                        <User className="w-4 h-4 text-[#159A9C]" />
                      ) : (
                        <Bot className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-xs font-medium text-gray-700">
                        {mensagem.autor}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatarTempo(mensagem.timestamp)}
                    </span>
                  </div>
                )}
                
                <div
                  className={`rounded-lg p-3 ${
                    mensagem.tipo === 'usuario'
                      ? 'bg-[#159A9C] text-white'
                      : mensagem.tipo === 'agente'
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-blue-50 text-blue-900 border border-blue-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{mensagem.conteudo}</p>
                  
                  {mensagem.anexos && mensagem.anexos.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {mensagem.anexos.map((anexo, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded">
                          <Paperclip className="w-4 h-4" />
                          <span className="text-xs">{anexo.nome}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {mensagem.tipo === 'usuario' && (
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatarTempo(mensagem.timestamp)}
                    </span>
                    {getStatusIcon(mensagem.status)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {digitando && (
            <div className="flex justify-start">
              <div className="max-w-[70%]">
                <div className="flex items-center space-x-2 mb-1">
                  <User className="w-4 h-4 text-[#159A9C]" />
                  <span className="text-xs font-medium text-gray-700">Ana Silva</span>
                  <span className="text-xs text-gray-500">digitando...</span>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Respostas Rápidas */}
        {mensagens.length <= 2 && (
          <div className="px-4 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-600 mb-2">Respostas rápidas:</p>
            <div className="flex flex-wrap gap-2">
              {respostasRapidas.map((resposta, index) => (
                <button
                  key={index}
                  onClick={() => setNovaMensagem(resposta)}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {resposta}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                rows={1}
                style={{ maxHeight: '100px' }}
              />
            </div>
            
            <div className="flex items-center space-x-1">
              <button className="p-2 text-gray-400 hover:text-[#159A9C] transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              
              <button className="p-2 text-gray-400 hover:text-[#159A9C] transition-colors">
                <Smile className="w-5 h-5" />
              </button>
              
              <button
                onClick={enviarMensagem}
                disabled={!novaMensagem.trim()}
                className="p-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0d7a7d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-[#002333] mb-3">
            Horário de Atendimento
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Segunda a Sexta:</span>
              <span>8h às 18h</span>
            </div>
            <div className="flex justify-between">
              <span>Sábado:</span>
              <span>9h às 13h</span>
            </div>
            <div className="flex justify-between">
              <span>Domingo:</span>
              <span>Fechado</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-[#002333] mb-3">
            Canais Alternativos
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-[#159A9C]" />
              <div>
                <p className="text-sm font-medium">WhatsApp</p>
                <p className="text-xs text-gray-600">(11) 99999-9999</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-[#159A9C]" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-gray-600">suporte@conectcrm.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
