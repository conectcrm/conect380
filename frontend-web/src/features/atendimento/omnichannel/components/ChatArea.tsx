import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  MoreVertical,
  Copy,
  Clock,
  UserX,
  RefreshCw,
  Check,
  CheckCheck,
  Paperclip,
  Mic,
  Send,
  Smile
} from 'lucide-react';
import { Ticket, Mensagem } from '../types';
import { getIconeCanal, formatarTempoAtendimento, formatarHorarioMensagem, copiarParaClipboard } from '../utils';
import { ThemePalette } from '../../../../contexts/ThemeContext';

interface ChatAreaProps {
  ticket: Ticket;
  mensagens: Mensagem[];
  onEnviarMensagem: (conteudo: string) => void;
  onTransferir: () => void;
  onEncerrar: () => void;
  onLigar: () => void;
  theme: ThemePalette;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  ticket,
  mensagens,
  onEnviarMensagem,
  onTransferir,
  onEncerrar,
  onLigar,
  theme
}) => {
  const [mensagemAtual, setMensagemAtual] = useState('');
  const [tempoAtendimento, setTempoAtendimento] = useState(ticket.tempoAtendimento);
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Contador de tempo em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setTempoAtendimento(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [mensagemAtual]);

  const handleEnviar = () => {
    if (mensagemAtual.trim()) {
      onEnviarMensagem(mensagemAtual);
      setMensagemAtual('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleCopiarTicket = async () => {
    const sucesso = await copiarParaClipboard(ticket.numero);
    if (sucesso) {
      // Adicionar feedback visual aqui se desejar
      console.log('Ticket copiado!');
    }
  };

  const IconeCanal = getIconeCanal(ticket.canal);

  const renderIconeStatus = (status: Mensagem['status']) => {
    switch (status) {
      case 'enviando':
        return <Clock className="w-3 h-3 text-gray-400 animate-spin" />;
      case 'enviado':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'entregue':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'lido':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header do Chat */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Info do Contato */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={ticket.contato.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.contato.nome)}&background=random`}
                alt={ticket.contato.nome}
                className="w-12 h-12 rounded-full object-cover"
              />
              {ticket.contato.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">{ticket.contato.nome}</h2>
                <div className={`p-1.5 rounded-full ${
                  ticket.canal === 'whatsapp' ? 'bg-green-100' :
                  ticket.canal === 'telegram' ? 'bg-blue-100' :
                  ticket.canal === 'email' ? 'bg-red-100' :
                  'bg-gray-100'
                }`}>
                  <IconeCanal className={`w-3 h-3 ${
                    ticket.canal === 'whatsapp' ? 'text-green-600' :
                    ticket.canal === 'telegram' ? 'text-blue-600' :
                    ticket.canal === 'email' ? 'text-red-600' :
                    'text-gray-600'
                  }`} />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {ticket.contato.online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3">
            {/* Botão Ligar */}
            <button
              onClick={onLigar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Ligar para o cliente"
            >
              <Phone className="w-5 h-5 text-gray-600" />
            </button>

            {/* Número do Ticket + Copiar */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{ticket.numero}</span>
              <button
                onClick={handleCopiarTicket}
                className="hover:bg-gray-200 p-1 rounded transition-colors"
                title="Copiar número do ticket"
              >
                <Copy className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>

            {/* Tempo de Atendimento */}
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: theme.colors.primaryLight }}
            >
              <Clock className="w-4 h-4" style={{ color: theme.colors.primary }} />
              <span className="text-sm font-mono font-medium" style={{ color: theme.colors.primary }}>
                {formatarTempoAtendimento(tempoAtendimento)}
              </span>
            </div>

            {/* Transferir */}
            <button
              onClick={onTransferir}
              style={{
                borderColor: theme.colors.secondary,
                color: theme.colors.text,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.secondaryLight;
                e.currentTarget.style.borderColor = theme.colors.neutral;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = theme.colors.secondary;
              }}
              className="px-4 py-2 border-2 rounded-lg transition-colors font-medium text-sm"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Transferir
              </div>
            </button>

            {/* Encerrar */}
            <button
              onClick={onEncerrar}
              style={{
                borderColor: theme.colors.error,
                color: theme.colors.error,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.error;
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.colors.error;
              }}
              className="px-4 py-2 border-2 rounded-lg transition-colors font-medium text-sm"
            >
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4" />
                Encerrar
              </div>
            </button>

            {/* Menu de Opções */}
            <div className="relative">
              <button
                onClick={() => setMostrarOpcoes(!mostrarOpcoes)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              
              {mostrarOpcoes && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700">
                    Ver histórico completo
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700">
                    Adicionar nota
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700">
                    Exportar conversa
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
        {mensagens.map((mensagem, index) => {
          const ehCliente = mensagem.remetente.tipo === 'cliente';
          const mostrarFoto = index === 0 || 
            mensagens[index - 1].remetente.id !== mensagem.remetente.id;

          return (
            <div
              key={mensagem.id}
              className={`flex gap-3 ${ehCliente ? 'justify-start' : 'justify-end'}`}
            >
              {/* Foto (somente para mensagens do cliente) */}
              {ehCliente && (
                <div className="flex-shrink-0">
                  {mostrarFoto ? (
                    <img
                      src={mensagem.remetente.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(mensagem.remetente.nome)}&background=random`}
                      alt={mensagem.remetente.nome}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8" /> // Espaço vazio para alinhamento
                  )}
                </div>
              )}

              {/* Balão da Mensagem */}
              <div className={`max-w-md ${ehCliente ? '' : 'flex flex-col items-end'}`}>
                {mostrarFoto && (
                  <span className="text-xs text-gray-500 mb-1 px-1">
                    {mensagem.remetente.nome}
                  </span>
                )}
                
                <div 
                  className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                    ehCliente
                      ? 'bg-white border border-gray-200'
                      : ''
                  }`}
                  style={!ehCliente ? {
                    backgroundColor: theme.colors.primaryLight,
                    border: `1px solid ${theme.colors.borderLight}`
                  } : {}}
                >
                  <p className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${
                    ehCliente ? 'text-gray-800' : 'text-gray-900'
                  }`}>
                    {mensagem.conteudo}
                  </p>
                  
                  {/* Timestamp e Status */}
                  <div className="flex items-center gap-1 mt-1.5 justify-end text-gray-500">
                    <span className="text-xs font-medium">
                      {formatarHorarioMensagem(mensagem.timestamp)}
                    </span>
                    {!ehCliente && (
                      <span style={{ color: theme.colors.primary }}>
                        {renderIconeStatus(mensagem.status)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Foto do atendente (direita) */}
              {!ehCliente && mostrarFoto && (
                <div className="flex-shrink-0">
                  <img
                    src={mensagem.remetente.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(mensagem.remetente.nome)}&background=random`}
                    alt={mensagem.remetente.nome}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-end gap-3">
          {/* Botão Anexar */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>

          {/* Campo de Texto */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={mensagemAtual}
              onChange={(e) => setMensagemAtual(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              rows={1}
              style={{ borderColor: theme.colors.border }}
              onFocus={(e) => {
                e.currentTarget.style.outline = `2px solid ${theme.colors.primary}`;
                e.currentTarget.style.borderColor = 'transparent';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.borderColor = theme.colors.border;
              }}
              className="w-full px-4 py-2.5 pr-10 border rounded-lg resize-none max-h-32 transition-all"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
              <Smile className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Botão Microfone ou Enviar */}
          {mensagemAtual.trim() ? (
            <button
              onClick={handleEnviar}
              style={{
                backgroundColor: theme.colors.primary,
                color: '#FFFFFF'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
              className="p-3 rounded-lg transition-colors flex-shrink-0 shadow-md hover:shadow-lg"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0">
              <Mic className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
