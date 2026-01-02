import React, { useEffect, useRef } from 'react';

interface Mensagem {
  id: string;
  ticketId: string;
  ticketNumero?: string;
  remetenteId?: string;
  atendenteId?: string;
  tipo: 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'VIDEO' | 'ARQUIVO' | 'LOCALIZACAO';
  conteudo: string;
  direcao?: 'enviada' | 'recebida';
  remetente?: 'CLIENTE' | 'ATENDENTE' | 'SISTEMA';
  criadoEm: Date | string;
}

interface MessageListProps {
  mensagens: Mensagem[];
  ticketId: string;
}

export function MessageList({ mensagens, ticketId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const formatarHora = (data: Date | string) => {
    const dataMsg = typeof data === 'string' ? new Date(data) : data;
    return dataMsg.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatarData = (data: Date) => {
    const hoje = new Date();
    const dataMsg = new Date(data);

    if (
      dataMsg.getDate() === hoje.getDate() &&
      dataMsg.getMonth() === hoje.getMonth() &&
      dataMsg.getFullYear() === hoje.getFullYear()
    ) {
      return 'Hoje';
    }

    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    if (
      dataMsg.getDate() === ontem.getDate() &&
      dataMsg.getMonth() === ontem.getMonth() &&
      dataMsg.getFullYear() === ontem.getFullYear()
    ) {
      return 'Ontem';
    }

    return dataMsg.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Agrupar mensagens por data
  const mensagensAgrupadas = mensagens.reduce(
    (grupos, mensagem) => {
      const data = new Date(mensagem.criadoEm);
      const dataStr = formatarData(data);

      if (!grupos[dataStr]) {
        grupos[dataStr] = [];
      }

      grupos[dataStr].push(mensagem);
      return grupos;
    },
    {} as Record<string, Mensagem[]>,
  );

  const renderMensagemConteudo = (mensagem: Mensagem) => {
    switch (mensagem.tipo) {
      case 'IMAGEM':
        return (
          <div className="max-w-xs">
            <img src={mensagem.conteudo} alt="Imagem" className="rounded-lg shadow-sm" />
          </div>
        );
      case 'AUDIO':
        return (
          <audio controls className="max-w-xs">
            <source src={mensagem.conteudo} type="audio/mpeg" />
            Seu navegador não suporta áudio.
          </audio>
        );
      case 'VIDEO':
        return (
          <video controls className="max-w-xs rounded-lg shadow-sm">
            <source src={mensagem.conteudo} type="video/mp4" />
            Seu navegador não suporta vídeo.
          </video>
        );
      case 'ARQUIVO':
        return (
          <a
            href={mensagem.conteudo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="underline">Baixar arquivo</span>
          </a>
        );
      default:
        return <p className="whitespace-pre-wrap break-words">{mensagem.conteudo}</p>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
      {Object.keys(mensagensAgrupadas).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-sm">Nenhuma mensagem ainda</p>
          <p className="text-xs mt-1">Envie a primeira mensagem para iniciar a conversa</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {Object.entries(mensagensAgrupadas).map(([data, mensagensData]) => (
            <div key={data} className="mb-6">
              {/* Separador de data */}
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white px-3 py-1 rounded-full shadow-sm text-xs text-gray-600">
                  {data}
                </div>
              </div>

              {/* Mensagens do dia */}
              <div className="space-y-3">
                {mensagensData.map((mensagem) => {
                  // ✨ CORRIGIDO: Usar campo 'remetente' ao invés de 'atendenteId'
                  // CLIENTE = mensagem recebida (esquerda, fundo branco)
                  // ATENDENTE/SISTEMA = mensagem enviada (direita, fundo azul)
                  const isRecebida = mensagem.remetente === 'CLIENTE';

                  return (
                    <div
                      key={mensagem.id}
                      className={`flex ${isRecebida ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2 rounded-lg shadow-sm ${
                          isRecebida ? 'bg-white text-gray-900' : 'bg-blue-600 text-white'
                        }`}
                      >
                        {/* Conteúdo da mensagem */}
                        {renderMensagemConteudo(mensagem)}

                        {/* Hora */}
                        <div
                          className={`text-xs mt-1 ${
                            isRecebida ? 'text-gray-400' : 'text-blue-100'
                          }`}
                        >
                          {formatarHora(mensagem.criadoEm)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Ref para auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
