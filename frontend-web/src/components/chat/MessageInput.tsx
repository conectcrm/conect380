import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Smile, Paperclip, X, Zap } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { RespostasRapidas } from './RespostasRapidas';
import { API_BASE_URL } from '../../services/api';

const API_URL = API_BASE_URL;

interface MessageInputProps {
  ticketId: string;
  onTyping: () => void;
  onEnviarMensagem?: (mensagem: string) => Promise<void>;
  enviando?: boolean;
}

export function MessageInput({
  ticketId,
  onTyping,
  onEnviarMensagem,
  enviando: enviandoExterno,
}: MessageInputProps) {
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false);
  const [mostrarFileUpload, setMostrarFileUpload] = useState(false);
  const [mostrarRespostasRapidas, setMostrarRespostasRapidas] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const enviandoAtual = enviandoExterno !== undefined ? enviandoExterno : enviando;

  // Fechar emoji picker ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setMostrarEmojiPicker(false);
      }
    };

    if (mostrarEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarEmojiPicker]);

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
    const newValue = e.target.value;
    setMensagem(newValue);
    handleTyping();

    // Detectar trigger "/" para Respostas Rápidas
    if (
      newValue === '/' ||
      (newValue.length > 1 &&
        newValue[newValue.length - 1] === '/' &&
        newValue[newValue.length - 2] === ' ')
    ) {
      setMostrarRespostasRapidas(true);
    }
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
          },
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

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;

    if (!textarea) return;

    // Inserir emoji na posição do cursor
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = mensagem.substring(0, start);
    const textAfter = mensagem.substring(end);
    const newText = textBefore + emoji + textAfter;

    setMensagem(newText);

    // Mover cursor para depois do emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);

    // Fechar picker
    setMostrarEmojiPicker(false);
  };

  const handleUploadSucesso = (arquivos: any[]) => {
    console.log('[MessageInput] Arquivos enviados com sucesso:', arquivos);
    setMostrarFileUpload(false);
    // Recarregar mensagens (implementar callback se necessário)
  };

  const handleSelecionarTemplate = (conteudo: string) => {
    // Substituir "/" pelo conteúdo do template
    const novaMensagem = mensagem.replace(/\/\s*$/, conteudo);
    setMensagem(novaMensagem);
    setMostrarRespostasRapidas(false);

    // Focar no textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  return (
    <div className="bg-white border-t p-4">
      {erro && (
        <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 relative">
        {/* Botão Respostas Rápidas */}
        <button
          type="button"
          onClick={() => setMostrarRespostasRapidas(true)}
          disabled={enviandoAtual}
          className="p-2 text-gray-500 hover:text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Respostas rápidas (ou digite /)"
        >
          <Zap className="h-5 w-5" />
        </button>

        {/* Botão Anexar Arquivo */}
        <button
          type="button"
          onClick={() => setMostrarFileUpload(true)}
          disabled={enviandoAtual}
          className="p-2 text-gray-500 hover:text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Anexar arquivo"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Botão Emoji */}
        <div className="relative" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={() => setMostrarEmojiPicker(!mostrarEmojiPicker)}
            disabled={enviandoAtual}
            className="p-2 text-gray-500 hover:text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Adicionar emoji"
          >
            <Smile className="h-5 w-5" />
          </button>

          {/* Emoji Picker Popover */}
          {mostrarEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={Theme.LIGHT}
                width={350}
                height={400}
                searchPlaceHolder="Buscar emoji..."
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
        </div>

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
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded">Enter</kbd> para
        enviar •
        <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded ml-1">
          Shift+Enter
        </kbd>{' '}
        quebrar linha •
        <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded ml-1">/</kbd>{' '}
        respostas rápidas
      </p>

      {/* Modal de FileUpload */}
      {mostrarFileUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Enviar Arquivos</h3>
              <button
                onClick={() => setMostrarFileUpload(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-4">
              <FileUpload ticketId={ticketId} onUploadSuccess={handleUploadSucesso} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Respostas Rápidas */}
      {mostrarRespostasRapidas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Respostas Rápidas</h3>
              <button
                onClick={() => setMostrarRespostasRapidas(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="overflow-y-auto flex-1">
              <RespostasRapidas
                onSelecionarTemplate={handleSelecionarTemplate}
                ticketAtual={{ id: ticketId }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
