import React, { useState, useRef, useCallback, DragEvent } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  File,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  Paperclip,
} from 'lucide-react';
import { api } from '../../../services/api';

// ===== INTERFACES =====

export interface ArquivoUpload {
  id: string;
  arquivo: File;
  nome: string;
  tipo: string;
  tamanho: number;
  preview?: string;
  progresso: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  erro?: string;
  url?: string;
}

interface UploadAreaProps {
  ticketId: string;
  onUploadSuccess?: (arquivos: ArquivoUpload[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // em bytes
  allowedTypes?: string[];
}

// ===== CONSTANTES =====

const MAX_FILE_SIZE_DEFAULT = 10 * 1024 * 1024; // 10MB
const MAX_FILES_DEFAULT = 5;

const ALLOWED_TYPES_DEFAULT = [
  // Imagens
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documentos
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Planilhas
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Áudio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  // Outros
  'text/plain',
  'text/csv',
];

const MIME_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'text/plain': 'Texto',
  'text/csv': 'CSV',
  'audio/mpeg': 'Áudio',
  'audio/mp3': 'Áudio',
  'audio/wav': 'Áudio',
};

// ===== COMPONENTE PRINCIPAL =====

export function UploadArea({
  ticketId,
  onUploadSuccess,
  maxFiles = MAX_FILES_DEFAULT,
  maxFileSize = MAX_FILE_SIZE_DEFAULT,
  allowedTypes = ALLOWED_TYPES_DEFAULT,
}: UploadAreaProps) {
  const [arquivos, setArquivos] = useState<ArquivoUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // ===== FUNÇÕES AUXILIARES =====

  const formatarTamanho = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validarArquivo = (arquivo: File): string | null => {
    if (arquivo.size > maxFileSize) {
      return `Arquivo muito grande. Máximo: ${formatarTamanho(maxFileSize)}`;
    }

    if (!allowedTypes.includes(arquivo.type)) {
      return 'Tipo de arquivo não permitido';
    }

    return null;
  };

  const gerarPreview = async (arquivo: File): Promise<string | undefined> => {
    if (!arquivo.type.startsWith('image/')) return undefined;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(arquivo);
    });
  };

  const getIconeArquivo = (tipo: string) => {
    if (tipo.startsWith('image/')) return ImageIcon;
    if (tipo.startsWith('application/pdf')) return FileText;
    if (tipo.startsWith('audio/')) return FileText;
    return File;
  };

  // ===== HANDLERS =====

  const adicionarArquivos = useCallback(
    async (novosArquivos: File[]) => {
      setErro(null);

      // Validar quantidade total
      if (arquivos.length + novosArquivos.length > maxFiles) {
        setErro(`Máximo de ${maxFiles} arquivos permitidos`);
        return;
      }

      const arquivosParaAdicionar: ArquivoUpload[] = [];

      for (const arquivo of novosArquivos) {
        const erroValidacao = validarArquivo(arquivo);

        if (erroValidacao) {
          setErro(erroValidacao);
          continue;
        }

        const preview = await gerarPreview(arquivo);

        arquivosParaAdicionar.push({
          id: `${Date.now()}-${Math.random()}`,
          arquivo,
          nome: arquivo.name,
          tipo: arquivo.type,
          tamanho: arquivo.size,
          preview,
          progresso: 0,
          status: 'pending',
        });
      }

      if (arquivosParaAdicionar.length > 0) {
        setArquivos((prev) => [...prev, ...arquivosParaAdicionar]);
      }
    },
    [arquivos.length, maxFiles],
  );

  const removerArquivo = (id: string) => {
    setArquivos((prev) => prev.filter((a) => a.id !== id));
  };

  const uploadArquivo = async (arquivoUpload: ArquivoUpload) => {
    const formData = new FormData();
    formData.append('anexos', arquivoUpload.arquivo); // Backend espera 'anexos'
    formData.append('ticketId', ticketId);
    formData.append('conteudo', arquivoUpload.nome); // Mensagem com nome do arquivo
    formData.append('remetente', 'atendente');

    try {
      setArquivos((prev) =>
        prev.map((a) =>
          a.id === arquivoUpload.id ? { ...a, status: 'uploading', progresso: 0 } : a,
        ),
      );

      const token = localStorage.getItem('authToken');

      const response = await api.post('/api/atendimento/mensagens', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progresso = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;

          setArquivos((prev) =>
            prev.map((a) => (a.id === arquivoUpload.id ? { ...a, progresso } : a)),
          );
        },
      });

      const dados = response.data?.data || response.data;

      setArquivos((prev) =>
        prev.map((a) =>
          a.id === arquivoUpload.id
            ? { ...a, status: 'success', progresso: 100, url: dados.url }
            : a,
        ),
      );

      return dados;
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload:', error);

      const mensagemErro = error.response?.data?.message || 'Erro ao fazer upload do arquivo';

      setArquivos((prev) =>
        prev.map((a) =>
          a.id === arquivoUpload.id ? { ...a, status: 'error', erro: mensagemErro } : a,
        ),
      );

      throw error;
    }
  };

  const uploadTodos = async () => {
    const arquivosPendentes = arquivos.filter((a) => a.status === 'pending');

    if (arquivosPendentes.length === 0) return;

    const resultados: ArquivoUpload[] = [];

    for (const arquivo of arquivosPendentes) {
      try {
        await uploadArquivo(arquivo);
        resultados.push(arquivo);
      } catch (error) {
        console.error('Erro no upload:', error);
      }
    }

    if (onUploadSuccess && resultados.length > 0) {
      onUploadSuccess(resultados);
    }
  };

  // Drag & Drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      adicionarArquivos(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      adicionarArquivos(files);
    }
    // Resetar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickZona = () => {
    fileInputRef.current?.click();
  };

  // ===== RENDER =====

  const temArquivos = arquivos.length > 0;
  const todosEnviados = arquivos.every((a) => a.status === 'success');
  const algumEnviando = arquivos.some((a) => a.status === 'uploading');

  return (
    <div className="space-y-4">
      {/* Zona de Drop */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClickZona}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? 'border-[#159A9C] bg-[#159A9C]/5 scale-[1.02]'
              : 'border-gray-300 hover:border-[#159A9C] hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />

        <p className="text-lg font-medium text-[#002333] mb-2">
          {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
        </p>

        <p className="text-sm text-gray-500">
          Máximo {maxFiles} arquivos • Até {formatarTamanho(maxFileSize)} cada
        </p>

        <p className="text-xs text-gray-400 mt-2">Imagens, PDF, Word, Excel, Áudio</p>
      </div>

      {/* Mensagem de Erro */}
      {erro && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{erro}</p>
        </div>
      )}

      {/* Lista de Arquivos */}
      {temArquivos && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[#002333]">
              Arquivos ({arquivos.length}/{maxFiles})
            </h3>
            {!todosEnviados && (
              <button
                onClick={uploadTodos}
                disabled={algumEnviando}
                className="px-3 py-1.5 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
              >
                {algumEnviando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Enviar Todos
                  </>
                )}
              </button>
            )}
          </div>

          {arquivos.map((arquivo) => {
            const Icone = getIconeArquivo(arquivo.tipo);
            const tipoLabel = MIME_TYPE_LABELS[arquivo.tipo] || 'Arquivo';

            return (
              <div
                key={arquivo.id}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                {/* Preview ou Ícone */}
                {arquivo.preview ? (
                  <img
                    src={arquivo.preview}
                    alt={arquivo.nome}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center">
                    <Icone className="h-6 w-6 text-gray-500" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#002333] truncate">{arquivo.nome}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>{tipoLabel}</span>
                    <span>•</span>
                    <span>{formatarTamanho(arquivo.tamanho)}</span>
                  </div>

                  {/* Barra de Progresso */}
                  {arquivo.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#159A9C] transition-all duration-300"
                          style={{ width: `${arquivo.progresso}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{arquivo.progresso}%</p>
                    </div>
                  )}

                  {/* Erro */}
                  {arquivo.status === 'error' && arquivo.erro && (
                    <p className="text-xs text-red-600 mt-1">{arquivo.erro}</p>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex items-center gap-2">
                  {arquivo.status === 'pending' && <Clock className="h-5 w-5 text-gray-400" />}
                  {arquivo.status === 'uploading' && (
                    <Loader2 className="h-5 w-5 text-[#159A9C] animate-spin" />
                  )}
                  {arquivo.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {arquivo.status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}

                  {/* Botão Remover */}
                  {arquivo.status !== 'uploading' && (
                    <button
                      onClick={() => removerArquivo(arquivo.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Adicionar Clock ao import do lucide-react
import { Clock } from 'lucide-react';
