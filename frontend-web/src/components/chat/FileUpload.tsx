import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  File,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';

import { API_BASE_URL } from '../../services/api';

const API_URL = API_BASE_URL;

interface FileUploadProps {
  ticketId: string;
  onUploadSuccess?: (arquivos: ArquivoInfo[]) => void;
}

interface ArquivoInfo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  thumbnail?: string;
}

interface ArquivoEmUpload {
  id: string;
  arquivo: File;
  nome: string;
  tipo: string;
  tamanho: number;
  preview?: string;
  progresso: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  erro?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const ALLOWED_TYPES = {
  imagens: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  documentos: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  planilhas: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  outros: ['text/plain', 'text/csv'],
};

const TIPOS_PERMITIDOS = [
  ...ALLOWED_TYPES.imagens,
  ...ALLOWED_TYPES.documentos,
  ...ALLOWED_TYPES.planilhas,
  ...ALLOWED_TYPES.outros,
];

export function FileUpload({ ticketId, onUploadSuccess }: FileUploadProps) {
  const [arquivos, setArquivos] = useState<ArquivoEmUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const formatarTamanho = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validarArquivo = (arquivo: File): string | null => {
    // Validar tamanho
    if (arquivo.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. Máximo: ${formatarTamanho(MAX_FILE_SIZE)}`;
    }

    // Validar tipo
    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
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

  const adicionarArquivos = useCallback(
    async (novosArquivos: File[]) => {
      setErro(null);

      // Validar quantidade total
      if (arquivos.length + novosArquivos.length > MAX_FILES) {
        setErro(`Máximo de ${MAX_FILES} arquivos permitidos`);
        return;
      }

      const arquivosParaAdicionar: ArquivoEmUpload[] = [];

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
    [arquivos.length],
  );

  const removerArquivo = (id: string) => {
    setArquivos((prev) => prev.filter((a) => a.id !== id));
  };

  const uploadArquivo = async (arquivoUpload: ArquivoEmUpload) => {
    const formData = new FormData();
    formData.append('file', arquivoUpload.arquivo);
    formData.append('ticketId', ticketId);
    formData.append('tipo', arquivoUpload.tipo);

    try {
      setArquivos((prev) =>
        prev.map((a) =>
          a.id === arquivoUpload.id ? { ...a, status: 'uploading', progresso: 0 } : a,
        ),
      );

      const token = localStorage.getItem('authToken');

      const response = await axios.post(`${API_URL}/atendimento/mensagens/arquivo`, formData, {
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

      setArquivos((prev) =>
        prev.map((a) =>
          a.id === arquivoUpload.id ? { ...a, status: 'success', progresso: 100 } : a,
        ),
      );

      return response.data;
    } catch (error: any) {
      console.error('[FileUpload] Erro ao fazer upload:', error);

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

    const resultados: ArquivoInfo[] = [];

    for (const arquivo of arquivosPendentes) {
      try {
        const resultado = await uploadArquivo(arquivo);
        if (resultado.success) {
          resultados.push(resultado.data);
        }
      } catch (error) {
        // Erro já tratado em uploadArquivo
      }
    }

    if (resultados.length > 0 && onUploadSuccess) {
      onUploadSuccess(resultados);
    }

    // Limpar arquivos com sucesso após 2 segundos
    setTimeout(() => {
      setArquivos((prev) => prev.filter((a) => a.status !== 'success'));
    }, 2000);
  };

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    adicionarArquivos(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      adicionarArquivos(files);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getIconeArquivo = (tipo: string) => {
    if (tipo.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    if (tipo.includes('pdf')) return <FileText className="h-5 w-5 text-red-600" />;
    if (tipo.includes('word') || tipo.includes('document'))
      return <FileText className="h-5 w-5 text-blue-600" />;
    if (tipo.includes('excel') || tipo.includes('sheet'))
      return <FileText className="h-5 w-5 text-green-600" />;
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const temArquivosPendentes = arquivos.some((a) => a.status === 'pending');
  const temArquivosUploadando = arquivos.some((a) => a.status === 'uploading');

  return (
    <div className="bg-white border rounded-lg p-4">
      {/* Área de Drag & Drop */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging
            ? 'border-[#159A9C] bg-[#159A9C]/10'
            : 'border-gray-300 hover:border-[#159A9C] hover:bg-gray-50'
          }`}
      >
        <Upload
          className={`h-12 w-12 mx-auto mb-3 ${isDragging ? 'text-[#159A9C]' : 'text-gray-400'}`}
        />
        <p className="text-sm font-medium text-gray-700 mb-1">
          {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
        </p>
        <p className="text-xs text-gray-500">
          Máximo {MAX_FILES} arquivos • Até {formatarTamanho(MAX_FILE_SIZE)} cada
        </p>
        <p className="text-xs text-gray-400 mt-1">Imagens, PDFs, Word, Excel</p>
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={TIPOS_PERMITIDOS.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Mensagem de erro */}
      {erro && (
        <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {erro}
        </div>
      )}

      {/* Lista de arquivos */}
      {arquivos.length > 0 && (
        <div className="mt-4 space-y-2">
          {arquivos.map((arquivo) => (
            <div
              key={arquivo.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
            >
              {/* Preview ou ícone */}
              <div className="flex-shrink-0">
                {arquivo.preview ? (
                  <img
                    src={arquivo.preview}
                    alt={arquivo.nome}
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                    {getIconeArquivo(arquivo.tipo)}
                  </div>
                )}
              </div>

              {/* Info do arquivo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{arquivo.nome}</p>
                  {arquivo.status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                  {arquivo.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                  {arquivo.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 text-[#159A9C] animate-spin flex-shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">{formatarTamanho(arquivo.tamanho)}</p>

                  {/* Barra de progresso */}
                  {(arquivo.status === 'uploading' || arquivo.status === 'success') && (
                    <>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${arquivo.status === 'success' ? 'bg-green-600' : 'bg-[#159A9C]'
                            }`}
                          style={{ width: `${arquivo.progresso}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{arquivo.progresso}%</span>
                    </>
                  )}
                </div>

                {/* Mensagem de erro */}
                {arquivo.status === 'error' && arquivo.erro && (
                  <p className="text-xs text-red-600 mt-1">{arquivo.erro}</p>
                )}
              </div>

              {/* Botão remover */}
              {arquivo.status !== 'uploading' && (
                <button
                  onClick={() => removerArquivo(arquivo.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Remover"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botão de upload */}
      {temArquivosPendentes && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={uploadTodos}
            disabled={temArquivosUploadando}
            className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {temArquivosUploadando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Enviar {arquivos.filter((a) => a.status === 'pending').length}{' '}
                {arquivos.filter((a) => a.status === 'pending').length === 1
                  ? 'arquivo'
                  : 'arquivos'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
