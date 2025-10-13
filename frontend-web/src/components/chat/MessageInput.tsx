import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface MessageInputProps {
  ticketId: string;
  onTyping: () => void;
  onEnviarMensagem?: (mensagem: string) => Promise<void>;
  enviando?: boolean;
}

export function MessageInput({ ticketId, onTyping, onEnviarMensagem, enviando: enviandoExterno }: MessageInputProps) {
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const enviandoAtual = enviandoExterno !== undefined ? enviandoExterno : enviando;

  // Auto-resize do textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [mensagem]);

  // Emitir evento "digitando" com debounce
  const handleTyping = () => {
    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emitir evento
    onTyping();

    // Criar novo timeout (parar de digitar após 500ms)
    typingTimeoutRef.current = setTimeout(() => {
      // Opcional: emitir evento "parou de digitar"
    }, 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMensagem(e.target.value);
    handleTyping();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mensagem.trim() || enviandoAtual) return;

    setErro(null);

    try {
      // Se tiver função personalizada, usar ela
      if (onEnviarMensagem) {
        await onEnviarMensagem(mensagem.trim());
      } else {
        // Senão, usar a API padrão
        setEnviando(true);
        const token = localStorage.getItem('authToken');

        await axios.post(
          `${API_URL}/mensagens`,
          {
            ticketId,
            tipo: 'TEXTO',
            conteudo: mensagem.trim(),
            direcao: 'enviada',
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // Limpar input
      setMensagem('');

      // Resetar altura do textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error: any) {
      console.error('[MessageInput] Erro ao enviar mensagem:', error);
      setErro(error.response?.data?.message || 'Erro ao enviar mensagem');
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enviar com Enter (sem Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white border-t p-4">
      {erro && (
        <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={mensagem}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          rows={1}
          disabled={enviandoAtual}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto"
        />

        <button
          type="submit"
          disabled={!mensagem.trim() || enviandoAtual}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {enviandoAtual ? (
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </form>

      <p className="text-xs text-gray-400 mt-2">
        Pressione <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">Enter</kbd> para enviar, <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">Shift + Enter</kbd> para quebrar linha
      </p>
    </div>
  );
}
