import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Smile,
  X,
  Play,
  Pause,
  Download,
  Users,
  FileText,
  Zap,
} from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Ticket, Mensagem, StatusAtendimentoType } from '../types';
import {
  getIconeCanal,
  formatarTempoAtendimento,
  formatarHorarioMensagem,
  copiarParaClipboard,
  resolverNomeExibicao,
} from '../utils';
import { ThemePalette } from '../../../../contexts/ThemeContext';
import { FilaIndicator } from '../../../../components/chat/FilaIndicator';
import messageTemplateService, {
  MessageTemplate,
} from '../../../../services/messageTemplateService';
import { FileUpload } from '../../../../components/chat/FileUpload';
import { UploadArea } from '../../components/UploadArea'; // 🆕 Upload moderno com drag & drop
import { RespostasRapidas } from '../../../../components/chat/RespostasRapidas';
import { TemplateSelector } from './TemplateSelector'; // ✅ SPRINT 2 - Templates Rápidos
import { templateMensagemService } from '../../../../services/templateMensagemService'; // ✅ SPRINT 2
import { useAuth } from '../../../../hooks/useAuth';
import TransferenciaModal from './TransferenciaModal'; // ✅ SPRINT 2 - Transferência de Tickets

const DURACAO_AUDIO_DESCONHECIDA = '--:--';

const normalizarDuracao = (valor?: number | null): number | undefined => {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || Number.isNaN(valor) || valor <= 0) {
    return undefined;
  }

  return valor;
};

const formatarDuracaoAudio = (valor?: number | null) => {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || Number.isNaN(valor) || valor < 0) {
    return DURACAO_AUDIO_DESCONHECIDA;
  }

  const totalSegundos = Math.max(0, Math.floor(valor));
  const minutos = Math.floor(totalSegundos / 60)
    .toString()
    .padStart(2, '0');
  const resto = (totalSegundos % 60).toString().padStart(2, '0');
  return `${minutos}:${resto}`;
};

const AudioWaves: React.FC<{ ehCliente: boolean }> = ({ ehCliente }) => {
  const barras = [0.3, 0.6, 1, 0.8, 0.5, 0.7, 0.4];

  return (
    <div className="flex items-center gap-[3px] h-5">
      {barras.map((altura, i) => (
        <div
          // O array é estático, o índice é seguro para key
          key={i}
          className={`w-[3px] rounded-full transition-all ${ehCliente ? 'bg-blue-500' : 'bg-white'
            }`}
          style={{
            height: `${altura * 100}%`,
            animation: `audio-wave 0.6s ease-in-out ${i * 0.08}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
          @keyframes audio-wave {
            0% { 
              transform: scaleY(0.2); 
              opacity: 0.6;
            }
            100% { 
              transform: scaleY(1); 
              opacity: 1;
            }
          }
        `}</style>
    </div>
  );
};

interface AudioPlayerProps {
  url: string;
  downloadUrl?: string;
  duracao?: number;
  nome?: string;
  ehCliente: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  url,
  downloadUrl,
  duracao,
  nome,
  ehCliente,
}) => {
  const [reproduzindo, setReproduzindo] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [velocidade, setVelocidade] = useState(1);
  const [duracaoTotal, setDuracaoTotal] = useState<number | undefined>(() =>
    normalizarDuracao(duracao),
  );

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const atualizarProgresso = () => {
      const duracaoValida = normalizarDuracao(audio.duration);

      if (duracaoValida) {
        const porcentagem = (audio.currentTime / duracaoValida) * 100;
        setProgresso(porcentagem);
        setDuracaoTotal((prev) => prev ?? duracaoValida);
      } else {
        setProgresso(0);
      }

      setTempoAtual(audio.currentTime || 0);
    };

    const aoFinalizar = () => {
      setReproduzindo(false);
      setProgresso(0);
      setTempoAtual(0);
    };

    const aoCarregar = () => {
      const duracaoValida = normalizarDuracao(audio.duration);
      if (duracaoValida) {
        setDuracaoTotal(duracaoValida);
      }
    };

    const aoErro = (e: Event) => {
      console.error('❌ [AudioPlayer] Erro ao carregar áudio:', {
        url: audio.src,
        errorCode: audio.error?.code,
        errorMessage: audio.error?.message,
      });
    };

    audio.addEventListener('timeupdate', atualizarProgresso);
    audio.addEventListener('ended', aoFinalizar);
    audio.addEventListener('loadedmetadata', aoCarregar);
    audio.addEventListener('error', aoErro);

    return () => {
      audio.removeEventListener('timeupdate', atualizarProgresso);
      audio.removeEventListener('ended', aoFinalizar);
      audio.removeEventListener('loadedmetadata', aoCarregar);
      audio.removeEventListener('error', aoErro);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = velocidade;
    }
  }, [velocidade]);

  useEffect(() => {
    const duracaoNormalizada = normalizarDuracao(duracao);
    if (duracaoNormalizada) {
      setDuracaoTotal(duracaoNormalizada);
    }
  }, [duracao]);

  const toggleReproducao = () => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('❌ [AudioPlayer] Elemento de áudio não encontrado');
      return;
    }

    if (reproduzindo) {
      audio.pause();
      setReproduzindo(false);
    } else {
      audio.play().catch((err) => {
        console.error('❌ [AudioPlayer] Erro ao reproduzir:', {
          error: err.name,
          message: err.message,
          url: audio.src,
        });
      });
      setReproduzindo(true);
    }
  };

  const alternarVelocidade = () => {
    const velocidades = [1, 1.5, 2];
    const indiceAtual = velocidades.indexOf(velocidade);
    const proximoIndice = (indiceAtual + 1) % velocidades.length;
    setVelocidade(velocidades[proximoIndice]);
  };

  const aoClicarBarra = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const duracaoValida = normalizarDuracao(audio?.duration);
    if (!audio || !duracaoValida) return;

    const barra = e.currentTarget;
    const rect = barra.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const porcentagem = x / rect.width;
    const novoTempo = porcentagem * duracaoValida;

    audio.currentTime = novoTempo;
    setTempoAtual(novoTempo);
    setProgresso(porcentagem * 100);
  };

  const duracaoSegura = duracaoTotal ?? normalizarDuracao(audioRef.current?.duration);
  const tempoRestante =
    duracaoSegura !== undefined ? Math.max(duracaoSegura - tempoAtual, 0) : undefined;
  const tempoParaExibir = tempoRestante ?? duracaoSegura;

  const progressoNormalizado = duracaoSegura ? progresso : 0;

  return (
    <div
      className={`flex items-center gap-3 w-full max-w-sm p-2 rounded-lg transition-all ${ehCliente ? 'bg-gray-50/50' : 'bg-black/5'
        }`}
    >
      {/* Ícone de Microfone ou Ondas de Áudio */}
      <div
        className={`flex-shrink-0 transition-all ${ehCliente ? 'text-gray-600' : 'text-white/90'
          } ${reproduzindo ? 'scale-110' : 'scale-100'}`}
      >
        {reproduzindo ? <AudioWaves ehCliente={ehCliente} /> : <Mic className="w-5 h-5" />}
      </div>

      {/* Botão Play/Pause - MAIOR E MAIS DESTACADO */}
      <button
        onClick={toggleReproducao}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${ehCliente
          ? 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg hover:scale-105'
          : 'bg-white hover:bg-white/95 text-green-600 hover:shadow-xl hover:scale-105'
          } active:scale-95`}
        title={reproduzindo ? 'Pausar mensagem de voz' : 'Reproduzir mensagem de voz'}
        aria-label={reproduzindo ? 'Pausar' : 'Reproduzir'}
      >
        {reproduzindo ? (
          <Pause className="w-4.5 h-4.5" fill="currentColor" />
        ) : (
          <Play className="w-4.5 h-4.5 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Barra de Progresso e Controles */}
      <div className="flex-1 min-w-0">
        {/* Barra de Progresso */}
        <div
          className={`relative h-2 rounded-full cursor-pointer group ${ehCliente ? 'bg-gray-200' : 'bg-white/30'
            }`}
          onClick={aoClicarBarra}
        >
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all ${ehCliente ? 'bg-blue-500' : 'bg-white'
              }`}
            style={{ width: `${Math.min(Math.max(progressoNormalizado, 0), 100)}%` }}
          />
          {/* Indicador de posição */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all ${ehCliente ? 'bg-blue-600' : 'bg-white'
              }`}
            style={{ left: `${progresso}%`, marginLeft: '-7px' }}
          />
        </div>

        {/* Tempo e Velocidade */}
        <div className="flex items-center justify-between mt-1.5">
          <span
            className={`text-xs font-medium tabular-nums ${ehCliente ? 'text-gray-700' : 'text-white/90'
              }`}
          >
            {formatarDuracaoAudio(tempoParaExibir)}
          </span>

          <button
            onClick={alternarVelocidade}
            className={`text-xs font-semibold px-2 py-0.5 rounded-md transition-all ${ehCliente
              ? 'text-blue-600 hover:bg-blue-50 active:bg-blue-100'
              : 'text-white/90 hover:bg-white/20 active:bg-white/30'
              }`}
            title="Alterar velocidade de reprodução"
            aria-label={`Velocidade: ${velocidade}x`}
          >
            {velocidade}x
          </button>
        </div>
      </div>

      {/* Botão de Download */}
      <a
        href={downloadUrl || url}
        download={nome || 'audio.ogg'}
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${ehCliente
          ? 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md hover:scale-105'
          : 'bg-white/25 hover:bg-white/35 text-white hover:shadow-md hover:scale-105'
          } active:scale-95`}
        title="Baixar mensagem de voz"
        aria-label="Baixar áudio"
        onClick={(e) => e.stopPropagation()}
      >
        <Download className="w-4 h-4" />
      </a>

      <audio ref={audioRef} src={downloadUrl || url} preload="metadata" />
    </div>
  );
};

interface ChatAreaProps {
  ticket: Ticket;
  mensagens: Mensagem[];
  onEnviarMensagem: (conteudo: string, anexos?: File[]) => Promise<void> | void;
  onEnviarAudio: (audio: Blob, duracao: number) => Promise<void> | void;
  onTransferir: () => void;
  onEncerrar: () => void;
  onLigar: () => void;
  onMudarStatus?: (novoStatus: StatusAtendimentoType) => Promise<void>; // 🆕 NOVO
  onSelecionarFila?: () => void; // 🆕 Sistema de Filas
  onRemoverFila?: () => void; // 🆕 Sistema de Filas
  onEmitirDigitando?: () => void; // 🆕 NOVO - Indicador de digitação
  usuarioDigitandoNome?: string | null; // 🆕 NOVO - Nome do usuário digitando
  uploadProgress?: number; // 🔄 NOVO - Progresso de upload (0-100)
  theme: ThemePalette;
  estaDigitando?: boolean;
  loading?: boolean;
  enviandoMensagem?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  ticket,
  mensagens,
  onEnviarMensagem,
  onEnviarAudio,
  onTransferir,
  onEncerrar,
  onLigar,
  onMudarStatus, // 🆕 NOVO
  onSelecionarFila, // 🆕 Sistema de Filas
  onRemoverFila, // 🆕 Sistema de Filas
  onEmitirDigitando, // 🆕 NOVO - Indicador de digitação
  usuarioDigitandoNome, // 🆕 NOVO - Nome do usuário digitando
  uploadProgress = 0, // 🔄 NOVO - Progresso de upload
  theme,
  estaDigitando = false,
  loading = false,
  enviandoMensagem = false,
}) => {
  const { user } = useAuth();
  const [mensagemAtual, setMensagemAtual] = useState('');
  const [tempoAtendimento, setTempoAtendimento] = useState(ticket.tempoAtendimento);
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [arquivosAnexados, setArquivosAnexados] = useState<File[]>([]);
  const [erroUpload, setErroUpload] = useState<string | null>(null);
  const [gravadorAberto, setGravadorAberto] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [duracaoAudio, setDuracaoAudio] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [erroAudio, setErroAudio] = useState<string | null>(null);

  // Estados de Templates
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [mostrarTemplates, setMostrarTemplates] = useState(false);
  const [autocompleteTemplates, setAutocompleteTemplates] = useState<MessageTemplate[]>([]);
  const [mostrarAutocomplete, setMostrarAutocomplete] = useState(false);

  // ✅ SPRINT 2: Estados para Templates Rápidos
  const [templatesRapidos, setTemplatesRapidos] = useState<any[]>([]);
  const [mostrarTemplatesRapidos, setMostrarTemplatesRapidos] = useState(false);

  // ✅ NOVOS: Estados para Emoji, FileUpload e Respostas Rápidas
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false);
  const [mostrarFileUploadModal, setMostrarFileUploadModal] = useState(false);
  const [mostrarRespostasRapidasModal, setMostrarRespostasRapidasModal] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // ✅ SPRINT 2: Estado para Modal de Transferência
  const [mostrarTransferenciaModal, setMostrarTransferenciaModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null); // 🆕 Ref do container para verificar scroll
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioMimeTypeRef = useRef<string>('audio/webm');
  const descartarGravacaoRef = useRef(false);
  const digitacaoTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 🆕 NOVO - Debounce digitação

  // ✅ REGRA: Só pode responder se NÃO estiver na fila ou encerrado
  // Tickets na fila precisam ser assumidos primeiro!
  const statusAtual = (ticket.status || '').toLowerCase();
  const podeResponder = statusAtual !== 'fila' && statusAtual !== 'encerrado';

  // 🎯 Função de scroll inteligente
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // 🎯 Auto-scroll inteligente para última mensagem
  useEffect(() => {
    if (mensagens.length === 0) return;

    // Verificar se é a primeira carga deste ticket (scroll instantâneo)
    const isPrimeiraRenderizacao = mensagens.length > 0 && !messagesContainerRef.current?.scrollTop;

    if (isPrimeiraRenderizacao) {
      // Primeira carga: scroll instantâneo
      scrollToBottom('auto');
      return;
    }

    // Para novas mensagens: verificar se usuário está próximo do final
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const distanciaDoFinal = scrollHeight - scrollTop - clientHeight;
      const isNearBottom = distanciaDoFinal < 150; // 150px de tolerância

      // Só rolar se usuário já estava próximo do final (não interromper leitura)
      if (isNearBottom) {
        scrollToBottom('smooth');
      }
    } else {
      // Fallback: se ref não disponível, rolar sempre
      scrollToBottom('smooth');
    }
  }, [mensagens, scrollToBottom]);

  // 🎯 Scroll para baixo ao trocar de ticket
  useEffect(() => {
    scrollToBottom('auto');
  }, [ticket.id, scrollToBottom]);

  // Contador de tempo em tempo real
  useEffect(() => {
    setTempoAtendimento(ticket.tempoAtendimento);
  }, [ticket.id, ticket.tempoAtendimento]);

  useEffect(() => {
    if (!podeResponder) {
      return;
    }

    const interval = setInterval(() => {
      setTempoAtendimento((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [podeResponder]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [mensagemAtual]);

  useEffect(() => {
    if (!podeResponder) {
      setMensagemAtual('');
      setArquivosAnexados([]);
      limparAudio(false);
    }
  }, [podeResponder]);

  useEffect(() => {
    return () => {
      pararTimerAudio();
      limparAudio(true);
    };
  }, []);

  // ✅ SPRINT 2: Carregar templates rápidos ao montar o componente
  useEffect(() => {
    const empresaId = user?.empresa?.id || '11111111-1111-1111-1111-111111111111';
    templateMensagemService
      .listar(empresaId)
      .then((data) => {
        setTemplatesRapidos(data);
      })
      .catch((err) => console.error('Erro ao carregar templates rápidos:', err));
  }, [user]);

  // Detectar comando /atalho e mostrar autocomplete
  useEffect(() => {
    const texto = mensagemAtual.trim();

    if (texto.startsWith('/') && texto.length > 1) {
      const comando = texto.substring(1).toLowerCase();
      const sugestoes = templates.filter(
        (t) => t.atalho && t.atalho.toLowerCase().startsWith(comando),
      );
      setAutocompleteTemplates(sugestoes);
      setMostrarAutocomplete(sugestoes.length > 0);
    } else {
      setMostrarAutocomplete(false);
    }
  }, [mensagemAtual, templates]);

  const formatarTamanhoArquivo = (tamanho: number) => {
    if (tamanho >= 1024 * 1024) {
      return `${(tamanho / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (tamanho >= 1024) {
      return `${(tamanho / 1024).toFixed(1)} KB`;
    }
    return `${tamanho} B`;
  };

  const renderConteudoMensagem = (mensagem: Mensagem, ehCliente: boolean) => {
    // ✨ Filtrar texto "[Áudio]" de mensagens antigas
    let texto = (mensagem.conteudo || '').trim();
    if (texto === '[Áudio]') {
      texto = ''; // Remover texto redundante para mensagens de áudio
    }

    const audio = mensagem.audio;

    const anexos = (mensagem.anexos || []).filter((anexo) => {
      if (!anexo) return false;
      if (audio?.url && (anexo.tipo || '').startsWith('audio')) {
        return false;
      }
      return Boolean(anexo.url || anexo.downloadUrl || anexo.originalUrl);
    });

    const audioClasses = `w-full ${texto ? 'mt-2' : ''}`.trim();
    const anexosClasses = `space-y-2 ${texto || audio?.url ? 'mt-3' : ''}`.trim();

    return (
      <>
        {texto && (
          <p
            className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${ehCliente ? 'text-gray-800' : 'text-gray-900'}`}
          >
            {texto}
          </p>
        )}

        {audio?.url && (
          <div className={audioClasses}>
            {/* Label discreto "Mensagem de voz" apenas se não houver texto */}
            {!texto && (
              <div
                className={`flex items-center gap-1.5 mb-2 ${ehCliente ? 'text-gray-500' : 'text-white/70'
                  }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Mensagem de voz</span>
              </div>
            )}
            <AudioPlayer
              url={audio.url}
              downloadUrl={audio.downloadUrl} // ⚡ Passar downloadUrl (backend proxy)
              duracao={audio.duracao}
              nome={audio.nome}
              ehCliente={ehCliente}
            />
          </div>
        )}

        {anexos.length > 0 && (
          <div className={anexosClasses}>
            {anexos.map((anexo, indice) => {
              const link = anexo.downloadUrl || anexo.url || anexo.originalUrl;
              if (!link) {
                return null;
              }

              return (
                <a
                  key={`${link}-${indice}`}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                >
                  <span className="truncate pr-4 text-left text-sm font-medium text-gray-800">
                    {anexo.nome || 'Arquivo'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {typeof anexo.tamanho === 'number' && anexo.tamanho > 0
                      ? formatarTamanhoArquivo(anexo.tamanho)
                      : (anexo.tipo || '').split('/')[1] || 'download'}
                  </span>
                </a>
              );
            })}
          </div>
        )}

        {!texto && !audio?.url && anexos.length === 0 && (
          <p className={`text-sm ${ehCliente ? 'text-gray-800' : 'text-gray-900'}`}>
            {mensagem.conteudo}
          </p>
        )}
      </>
    );
  };

  const pararTimerAudio = () => {
    if (audioTimerRef.current) {
      window.clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
    }
  };

  const limparAudio = (manterPainel: boolean, resetarDescartar: boolean = true) => {
    recorderRef.current = null;
    audioChunksRef.current = [];
    pararTimerAudio();
    setGravando(false);
    setDuracaoAudio(0);
    setErroAudio(null);
    if (resetarDescartar) {
      descartarGravacaoRef.current = false;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (!manterPainel) {
      setGravadorAberto(false);
    }
  };

  const handleEnviar = useCallback(async () => {
    if (!podeResponder || enviandoMensagem) {
      return;
    }

    const conteudo = mensagemAtual.trim();
    const possuiAnexos = arquivosAnexados.length > 0;

    if (!conteudo && !possuiAnexos) {
      return;
    }

    try {
      await onEnviarMensagem(conteudo, arquivosAnexados);
      setMensagemAtual('');
      setArquivosAnexados([]);
      setErroUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }, [arquivosAnexados, enviandoMensagem, mensagemAtual, onEnviarMensagem, podeResponder]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!podeResponder) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (mensagemAtual.trim() || arquivosAnexados.length > 0) {
        void handleEnviar();
      }
    }
  };

  const handleCopiarTicket = async () => {
    const sucesso = await copiarParaClipboard(ticket.numero);
    if (sucesso) {
      // Adicionar feedback visual aqui se desejar
      console.log('Ticket copiado!');
    }
  };

  // Funções de Templates
  const handleSelecionarTemplate = async (template: MessageTemplate) => {
    try {
      const empresaId = user?.empresa?.id || 'empresa-default';

      // Preparar dados para substituição de variáveis
      const dados = {
        nome: ticket.nomeCliente || ticket.contato?.nome || 'Cliente',
        email: ticket.contato?.email || '',
        telefone: ticket.telefone || ticket.contato?.telefone || '',
        ticket: ticket.numero || '',
        atendente: ticket.atendente || 'Atendente',
        empresa: 'ConectCRM',
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        protocolo: ticket.numero || '',
        assunto: ticket.assunto || '',
        prioridade: ticket.prioridade || 'Normal',
        status: ticket.status || '',
        fila: ticket.fila || '',
        departamento: ticket.departamento || '',
      };

      // Processar template (substituir variáveis)
      const conteudoProcessado = messageTemplateService.substituirVariaveisLocal(
        template.conteudo,
        dados,
      );

      setMensagemAtual(conteudoProcessado);
      setMostrarTemplates(false);
      setMostrarAutocomplete(false);

      // Focar no textarea
      textareaRef.current?.focus();
    } catch (err) {
      console.error('Erro ao processar template:', err);
    }
  };

  const handleSelecionarTemplateAutocomplete = (template: MessageTemplate) => {
    handleSelecionarTemplate(template);
  };

  const handleClickAnexar = () => {
    if (!podeResponder || enviandoMensagem) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleArquivosSelecionados = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = Array.from(event.target.files || []);
    if (arquivos.length === 0) {
      return;
    }

    setErroUpload(null);

    const maxArquivos = 5;
    const restante = maxArquivos - arquivosAnexados.length;
    if (arquivos.length > restante) {
      setErroUpload(`Máximo de ${maxArquivos} arquivos por mensagem`);
    }

    const limiteTamanho = 15 * 1024 * 1024; // 15MB por arquivo
    const validos: File[] = [];

    arquivos.slice(0, restante).forEach((arquivo) => {
      if (arquivo.size > limiteTamanho) {
        setErroUpload('Arquivos de até 15MB são permitidos');
        return;
      }
      validos.push(arquivo);
    });

    if (validos.length > 0) {
      setArquivosAnexados((prev) => [...prev, ...validos]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoverArquivo = (indice: number) => {
    setArquivosAnexados((prev) => prev.filter((_, idx) => idx !== indice));
  };

  // ✅ NOVOS: Handlers para Emoji Picker
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const textBefore = mensagemAtual.substring(0, start);
    const textAfter = mensagemAtual.substring(end);
    const newText = textBefore + emoji + textAfter;

    setMensagemAtual(newText);
    setMostrarEmojiPicker(false);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  // ✅ NOVOS: Handler para FileUpload
  const handleUploadSucesso = (arquivos: any[]) => {
    console.log('[ChatArea] Arquivos enviados com sucesso:', arquivos);
    setMostrarFileUploadModal(false);
    // Recarregar mensagens se necessário
  };

  // ✅ NOVOS: Handler para Respostas Rápidas
  const handleSelecionarTemplateModal = (conteudo: string) => {
    setMensagemAtual(conteudo);
    setMostrarRespostasRapidasModal(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  // ✅ NOVOS: Click-outside para fechar emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setMostrarEmojiPicker(false);
      }
    };

    if (mostrarEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mostrarEmojiPicker]);

  // 🆕 NOVO: Handler para mudança de mensagem com emissão de digitação (debounce 1s)
  const handleMensagemChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const novoValor = e.target.value;
    setMensagemAtual(novoValor);

    // ✅ SPRINT 2: Detectar "/" para mostrar templates rápidos
    if (novoValor.startsWith('/') && templatesRapidos.length > 0) {
      setMostrarTemplatesRapidos(true);
    } else if (mostrarTemplatesRapidos) {
      setMostrarTemplatesRapidos(false);
    }

    // Emitir evento de digitação com debounce (só envia 1x a cada 1 segundo)
    if (onEmitirDigitando && podeResponder && novoValor.trim()) {
      // Limpar timeout anterior
      if (digitacaoTimeoutRef.current) {
        clearTimeout(digitacaoTimeoutRef.current);
      }

      // Emitir imediatamente (será debounced no backend se necessário)
      onEmitirDigitando();

      // Agendar próxima emissão (evitar spam)
      digitacaoTimeoutRef.current = setTimeout(() => {
        digitacaoTimeoutRef.current = null;
      }, 1000);
    }
  };

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (digitacaoTimeoutRef.current) {
        clearTimeout(digitacaoTimeoutRef.current);
      }
    };
  }, []);

  const handleToggleGravador = () => {
    if (!podeResponder || enviandoMensagem) {
      return;
    }
    setErroAudio(null);
    setGravadorAberto((prev) => {
      if (prev) {
        if (gravando) {
          descartarGravacaoRef.current = true;
          recorderRef.current?.stop();
          limparAudio(false, false);
        } else {
          limparAudio(false);
        }
      }
      return !prev;
    });
  };

  const iniciarGravacao = async () => {
    if (gravando || enviandoMensagem) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErroAudio('Seu navegador não suporta gravação de áudio');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      let recorder: MediaRecorder;

      const mimePreferencias = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm'];

      const mimeSuportado = mimePreferencias.find((tipo) => {
        return typeof MediaRecorder !== 'undefined' &&
          typeof MediaRecorder.isTypeSupported === 'function'
          ? MediaRecorder.isTypeSupported(tipo)
          : false;
      });

      if (mimeSuportado) {
        recorder = new MediaRecorder(stream, { mimeType: mimeSuportado });
      } else {
        recorder = new MediaRecorder(stream);
      }

      audioMimeTypeRef.current = recorder.mimeType || mimeSuportado || 'audio/webm';
      recorderRef.current = recorder;
      audioChunksRef.current = [];
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      descartarGravacaoRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (descartarGravacaoRef.current) {
          descartarGravacaoRef.current = false;
          audioChunksRef.current = [];
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          return;
        }
        const blob = new Blob(audioChunksRef.current, {
          type: audioMimeTypeRef.current || 'audio/webm',
        });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        audioChunksRef.current = [];
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start();
      setGravando(true);
      setDuracaoAudio(0);
      setErroAudio(null);
      pararTimerAudio();
      audioTimerRef.current = window.setInterval(() => {
        setDuracaoAudio((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      setErroAudio('Não foi possível acessar o microfone');
    }
  };

  const pararGravacao = () => {
    if (!gravando) {
      return;
    }
    pararTimerAudio();
    recorderRef.current?.stop();
    setGravando(false);
  };

  const handleCancelarGravacao = () => {
    if (gravando) {
      descartarGravacaoRef.current = true;
      recorderRef.current?.stop();
    }
    limparAudio(false, false);
  };

  const handleRegravar = () => {
    limparAudio(true);
    void iniciarGravacao();
  };

  const handleEnviarAudio = async () => {
    if (!audioBlob || enviandoMensagem) {
      return;
    }

    try {
      await onEnviarAudio(audioBlob, duracaoAudio || 1);
      limparAudio(false);
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
      setErroAudio('Erro ao enviar áudio. Tente novamente.');
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
                src={
                  ticket.contato?.foto ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(resolverNomeExibicao(ticket.contato))}&background=random`
                }
                alt={resolverNomeExibicao(ticket.contato)}
                className="w-12 h-12 rounded-full object-cover"
              />
              {ticket.contato?.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">
                  {resolverNomeExibicao(ticket.contato)}
                </h2>
                <div
                  className={`p-1.5 rounded-full ${ticket.canal === 'whatsapp'
                    ? 'bg-green-100'
                    : ticket.canal === 'telegram'
                      ? 'bg-blue-100'
                      : ticket.canal === 'email'
                        ? 'bg-red-100'
                        : 'bg-gray-100'
                    }`}
                >
                  <IconeCanal
                    className={`w-3 h-3 ${ticket.canal === 'whatsapp'
                      ? 'text-green-600'
                      : ticket.canal === 'telegram'
                        ? 'text-blue-600'
                        : ticket.canal === 'email'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                  />
                </div>
                {/* Sprint 2: Badge de tipo do ticket */}
                {ticket.tipo && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    ticket.tipo === 'comercial' ? 'bg-green-100 text-green-700' :
                    ticket.tipo === 'tecnica' ? 'bg-blue-100 text-blue-700' :
                    ticket.tipo === 'suporte' ? 'bg-purple-100 text-purple-700' :
                    ticket.tipo === 'financeira' ? 'bg-yellow-100 text-yellow-700' :
                    ticket.tipo === 'reclamacao' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {ticket.tipo.charAt(0).toUpperCase() + ticket.tipo.slice(1)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">
                  {ticket.contato?.online ? 'Online' : 'Offline'}
                </p>
                {/* Sprint 2: Título do ticket (se preenchido) */}
                {ticket.titulo && (
                  <>
                    <span className="text-gray-300">•</span>
                    <p className="text-sm text-gray-600 font-medium max-w-md truncate" title={ticket.titulo}>
                      {ticket.titulo}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3">
            {/* Tempo de Atendimento */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[#DEEFE7] rounded-lg">
              <Clock className="w-4 h-4 text-[#159A9C]" />
              <span className="text-sm font-mono font-medium text-[#002333]">
                {formatarTempoAtendimento(tempoAtendimento)}
              </span>
            </div>

            {/* Número do Ticket */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              <span className="text-sm font-medium text-gray-700">#{ticket.numero}</span>
              <button
                onClick={handleCopiarTicket}
                className="hover:bg-gray-200 p-1 rounded transition-colors"
                title="Copiar número do ticket"
              >
                <Copy className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>

            {/* Divisor */}
            <div className="h-8 w-px bg-gray-200"></div>

            {/* 🆕 Botão Selecionar Fila */}
            {onSelecionarFila && !ticket.filaId && (
              <button
                onClick={onSelecionarFila}
                className="p-2 hover:bg-[#159A9C]/10 rounded-lg transition-colors"
                title="Selecionar Fila"
              >
                <Users className="w-5 h-5 text-[#159A9C]" />
              </button>
            )}

            {/* 🆕 Indicador de Fila (quando ticket tem fila) */}
            {ticket.filaId && onRemoverFila && (
              <FilaIndicator filaId={ticket.filaId} onRemove={onRemoverFila} />
            )}

            {/* Botão Ligar - Apenas ícone */}
            <button
              onClick={onLigar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Ligar para o cliente"
            >
              <Phone className="w-5 h-5 text-gray-600" />
            </button>

            {/* Botão Transferir - Apenas ícone */}
            <button
              onClick={() => podeResponder && setMostrarTransferenciaModal(true)}
              disabled={!podeResponder}
              className={`p-2 rounded-lg transition-colors ${podeResponder
                ? 'hover:bg-blue-50 text-blue-600'
                : 'text-gray-400 cursor-not-allowed'
                }`}
              title="Transferir atendimento"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Botão Encerrar - Apenas ícone */}
            <button
              onClick={podeResponder ? onEncerrar : undefined}
              disabled={!podeResponder}
              className={`p-2 rounded-lg transition-colors ${podeResponder ? 'hover:bg-red-50 text-red-600' : 'text-gray-400 cursor-not-allowed'
                }`}
              title={podeResponder ? 'Encerrar atendimento' : 'Atendimento resolvido'}
            >
              <UserX className="w-5 h-5" />
            </button>

            {/* Menu de Opções */}
            <div className="relative">
              <button
                onClick={() => setMostrarOpcoes(!mostrarOpcoes)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Mais opções"
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
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50"
      >
        {loading && mensagens.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-6">Carregando mensagens...</div>
        ) : (
          mensagens.map((mensagem, index) => {
            const ehCliente = mensagem.remetente.tipo === 'cliente';
            const mostrarFoto =
              index === 0 || mensagens[index - 1].remetente.id !== mensagem.remetente.id;

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
                        src={
                          mensagem.remetente.foto ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(mensagem.remetente.nome)}&background=random`
                        }
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
                    className={`rounded-2xl px-4 py-2.5 shadow-sm transition-shadow hover:shadow-md ${ehCliente ? 'bg-white border border-gray-200' : ''
                      }`}
                    style={
                      !ehCliente
                        ? {
                          backgroundColor: theme.colors.primaryLight,
                          border: `1px solid ${theme.colors.borderLight}`,
                        }
                        : {}
                    }
                  >
                    {renderConteudoMensagem(mensagem, ehCliente)}

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
                      src={
                        mensagem.remetente.foto ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(mensagem.remetente.nome)}&background=random`
                      }
                      alt={mensagem.remetente.nome}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />

        {/* 🆕 Indicador de digitação melhorado */}
        {usuarioDigitandoNome && (
          <div className="flex items-start gap-3 px-4 py-2 animate-fadeIn">
            <div className="flex-shrink-0">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioDigitandoNome)}&background=random`}
                alt={usuarioDigitandoNome}
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">{usuarioDigitandoNome}</span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input de Mensagem */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        {/* ⚠️ Aviso quando ticket está na fila */}
        {statusAtual === 'fila' && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Ticket aguardando atendimento
              </p>
              <p className="text-xs text-blue-700">
                Para responder, você precisa assumir este atendimento primeiro.
              </p>
            </div>
            {onMudarStatus && (
              <button
                onClick={() => onMudarStatus('em_atendimento')}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assumir Agora
              </button>
            )}
          </div>
        )}

        {/* ⚠️ Aviso quando ticket está encerrado */}
        {statusAtual === 'encerrado' && (
          <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCheck className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Atendimento encerrado
              </p>
              <p className="text-xs text-gray-700">
                Este ticket foi finalizado. Para continuar, reabra o atendimento.
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleArquivosSelecionados}
          disabled={!podeResponder || enviandoMensagem}
        />

        {arquivosAnexados.length > 0 && (
          <div className="mb-4 bg-gray-100 rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {arquivosAnexados.length} arquivo{arquivosAnexados.length > 1 ? 's' : ''}{' '}
                selecionado{arquivosAnexados.length > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => {
                  setArquivosAnexados([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Limpar todos
              </button>
            </div>

            <ul className="space-y-2">
              {arquivosAnexados.map((arquivo, indice) => (
                <li
                  key={`${arquivo.name}-${indice}`}
                  className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-gray-200"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800 break-all">
                      {arquivo.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatarTamanhoArquivo(arquivo.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoverArquivo(indice)}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                    aria-label={`Remover ${arquivo.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>

            <p className="text-xs text-gray-500">
              Tamanho máximo de 15MB por arquivo • Tipos suportados: imagens, vídeos, áudios e
              documentos
            </p>
          </div>
        )}

        {gravadorAberto && (
          <div className="mb-4 bg-gray-100 rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Gravação de áudio</span>
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={handleCancelarGravacao}
              >
                Fechar
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${gravando ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
              >
                {gravando
                  ? 'Gravando...'
                  : audioBlob
                    ? 'Pronto para enviar'
                    : 'Aguardando gravação'}
              </span>
              <span className="text-sm font-mono text-gray-700">
                {formatarDuracaoAudio(duracaoAudio)}
              </span>
            </div>

            {erroAudio && <div className="mb-3 text-xs text-red-600">{erroAudio}</div>}

            {audioBlob && audioUrl && (
              <audio controls src={audioUrl} className="w-full mb-3">
                Seu navegador não suporta a reprodução de áudio.
              </audio>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={gravando ? pararGravacao : iniciarGravacao}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${gravando ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                disabled={enviandoMensagem}
              >
                {gravando ? 'Parar gravação' : audioBlob ? 'Regravar' : 'Iniciar gravação'}
              </button>

              {audioBlob && !gravando && (
                <>
                  <button
                    type="button"
                    onClick={handleRegravar}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                    disabled={enviandoMensagem}
                  >
                    Regravar
                  </button>
                  <button
                    type="button"
                    onClick={handleEnviarAudio}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600"
                    disabled={enviandoMensagem}
                  >
                    Enviar áudio
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleCancelarGravacao}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-600 hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {erroUpload && <div className="mb-3 text-xs text-red-600">{erroUpload}</div>}

        {/* 🔄 Progress Bar de Upload */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mx-6 mb-3">
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-[#159A9C]" />
                  <span className="text-sm font-medium text-gray-700">
                    Enviando arquivo...
                  </span>
                </div>
                <span className="text-sm font-mono font-medium text-[#159A9C]">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#DEEFE7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#159A9C] transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* ✅ Botão Respostas Rápidas (Modal Completo) */}
          <button
            type="button"
            onClick={() => setMostrarRespostasRapidasModal(true)}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${podeResponder ? 'hover:bg-[#159A9C]/10 text-[#159A9C]' : 'opacity-50 cursor-not-allowed'}`}
            disabled={!podeResponder || enviandoMensagem}
            title="Respostas Rápidas (ou digite /)"
          >
            <Zap className="w-5 h-5" />
          </button>

          {/* Autocomplete ao digitar / - mantido oculto */}
          <div className="relative hidden">
            {/* Dropdown de Templates - removido, usar modal de Respostas Rápidas */}
            {mostrarTemplates && templates.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                <div className="p-3 border-b bg-gray-50">
                  <p className="text-sm font-semibold text-[#002333]">Selecione um template</p>
                </div>
                <div className="p-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelecionarTemplate(template)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#002333]">{template.nome}</p>
                          {template.atalho && (
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                              /{template.atalho}
                            </code>
                          )}
                          <p className="text-xs text-[#B4BEC9] mt-1 line-clamp-2">
                            {template.conteudo}
                          </p>
                        </div>
                        {template.categoria && (
                          <span className="text-xs bg-[#9333EA]/10 text-[#9333EA] px-2 py-1 rounded ml-2 flex-shrink-0">
                            {template.categoria}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Autocomplete ao digitar / */}
            {mostrarAutocomplete && autocompleteTemplates.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                <div className="p-2 border-b bg-gray-50">
                  <p className="text-xs text-[#B4BEC9]">Sugestões de atalhos</p>
                </div>
                <div className="p-1">
                  {autocompleteTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelecionarTemplateAutocomplete(template)}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          /{template.atalho}
                        </code>
                        <span className="text-sm text-[#002333]">{template.nome}</span>
                      </div>
                      <p className="text-xs text-[#B4BEC9] mt-1 line-clamp-1 pl-16">
                        {template.conteudo}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ✅ MODIFICADO: Botão Anexar - Abre modal FileUpload */}
          <button
            type="button"
            onClick={() => setMostrarFileUploadModal(true)}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${podeResponder ? 'hover:bg-[#159A9C]/10 text-[#159A9C]' : 'opacity-50 cursor-not-allowed'}`}
            disabled={!podeResponder || enviandoMensagem}
            title="Anexar arquivo"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Campo de Texto */}
          <div className="flex-1 relative">
            {/* ✅ SPRINT 2: Template Selector */}
            {mostrarTemplatesRapidos && templatesRapidos.length > 0 && (
              <TemplateSelector
                templates={templatesRapidos}
                onSelect={(conteudo) => {
                  setMensagemAtual(conteudo);
                  setMostrarTemplatesRapidos(false);
                  textareaRef.current?.focus();
                }}
                onClose={() => setMostrarTemplatesRapidos(false)}
                searchTerm={mensagemAtual}
              />
            )}

            <textarea
              ref={textareaRef}
              value={mensagemAtual}
              onChange={handleMensagemChange}
              onKeyPress={handleKeyPress}
              placeholder={
                podeResponder
                  ? 'Digite sua mensagem... (use / para templates rápidos)'
                  : 'Ticket resolvido. Abra um novo atendimento para responder.'
              }
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
              className={`w-full px-4 py-2.5 pr-10 border rounded-lg resize-none max-h-32 transition-all ${podeResponder ? '' : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}
              disabled={!podeResponder || enviandoMensagem}
            />

            {/* ✅ MODIFICADO: Botão Emoji com Picker */}
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              ref={emojiPickerRef}
            >
              <button
                type="button"
                onClick={() => setMostrarEmojiPicker(!mostrarEmojiPicker)}
                className={`p-1.5 rounded-lg transition-colors ${podeResponder ? 'hover:bg-[#159A9C]/10' : 'opacity-50 cursor-not-allowed'}`}
                disabled={!podeResponder}
                title="Adicionar emoji"
              >
                <Smile className="w-5 h-5 text-gray-400" />
              </button>

              {/* Emoji Picker Popover */}
              {mostrarEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 z-50">
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
          </div>

          {/* Botão Microfone ou Enviar */}
          {(mensagemAtual.trim() || arquivosAnexados.length > 0) && podeResponder ? (
            <button
              type="button"
              onClick={() => void handleEnviar()}
              style={{
                backgroundColor: theme.colors.primary,
                color: '#FFFFFF',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = theme.colors.primaryHover)
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary)}
              className={`p-3 rounded-lg transition-colors flex-shrink-0 shadow-md hover:shadow-lg ${enviandoMensagem ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={enviandoMensagem}
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleGravador}
              className={`p-3 rounded-lg transition-colors flex-shrink-0 ${podeResponder ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-100 opacity-50 cursor-not-allowed'}`}
              disabled={!podeResponder || enviandoMensagem}
            >
              <Mic className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
        {!podeResponder && (
          <p className="mt-3 text-xs text-gray-500 text-center">
            Este ticket foi resolvido. Abra um novo atendimento para continuar o suporte ao cliente.
          </p>
        )}
      </div>

      {/* ✅ NOVO: Modal de FileUpload (com opção moderna UploadArea) */}
      {mostrarFileUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Enviar Arquivos</h3>
              <button
                onClick={() => setMostrarFileUploadModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo - UploadArea moderno com drag & drop */}
            <div className="p-6">
              <UploadArea ticketId={ticket.id} onUploadSuccess={handleUploadSucesso} />
            </div>

            {/* Divisor */}
            <div className="px-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="text-xs text-gray-400 font-medium">
                  OU USE O MÉTODO TRADICIONAL
                </span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
            </div>

            {/* Fallback - FileUpload tradicional */}
            <div className="p-6 pt-3">
              <FileUpload ticketId={ticket.id} onUploadSuccess={handleUploadSucesso} />
            </div>
          </div>
        </div>
      )}

      {/* ✅ NOVO: Modal de Respostas Rápidas */}
      {mostrarRespostasRapidasModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Respostas Rápidas</h3>
              <button
                onClick={() => setMostrarRespostasRapidasModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="overflow-y-auto flex-1">
              <RespostasRapidas
                onSelecionarTemplate={handleSelecionarTemplateModal}
                ticketAtual={{ id: ticket.id }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ✅ SPRINT 2: Modal de Transferência de Tickets */}
      {mostrarTransferenciaModal && (
        <TransferenciaModal
          ticket={ticket}
          onClose={() => setMostrarTransferenciaModal(false)}
          onSuccess={(ticketAtualizado) => {
            setMostrarTransferenciaModal(false);
            // Callback opcional para atualizar a lista de tickets após transferência
            if (onTransferir) {
              onTransferir();
            }
          }}
        />
      )}
    </div>
  );
};
