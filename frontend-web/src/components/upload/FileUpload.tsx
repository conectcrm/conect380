/**
 * 📁 Upload Component - Componente de Upload Avançado
 *
 * Funcionalidades:
 * - Drag & Drop
 * - Progress tracking
 * - Preview de imagens
 * - Upload múltiplo
 * - Validação visual
 * - Estados de loading
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2, Plus } from 'lucide-react';
import {
  uploadService,
  UploadContext,
  UploadProgress,
  UploadResult,
} from '../../services/uploadService';

interface FileUploadProps {
  category: 'avatar' | 'client-attachment' | 'document' | 'system';
  onUploadSuccess?: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
  multiple?: boolean;
  showPreview?: boolean;
  compact?: boolean;
  disabled?: boolean;
  acceptedFileTypes?: string;
  className?: string;
  maxFiles?: number;
  context?: UploadContext;
  children?: React.ReactNode;
}

interface FileWithProgress {
  file: File;
  progress: UploadProgress;
  previewUrl?: string;
  result?: UploadResult;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  category,
  onUploadSuccess,
  onUploadError,
  multiple = false,
  showPreview = true,
  compact = false,
  disabled = false,
  acceptedFileTypes,
  className = '',
  maxFiles = 10,
  context,
  children,
}) => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = uploadService.getConfig(category);

  // Gerar accept attribute
  const getAcceptTypes = (): string => {
    if (acceptedFileTypes) return acceptedFileTypes;
    if (config.allowedTypes?.includes('*')) return '*';
    return config.allowedTypes?.join(',') || '*';
  };

  // Processar arquivos selecionados
  const processFiles = useCallback(
    async (selectedFiles: FileList | File[]) => {
      const fileArray = Array.from(selectedFiles);

      // Validar número máximo de arquivos
      const totalFiles = files.length + fileArray.length;
      if (totalFiles > maxFiles) {
        onUploadError?.(`Máximo de ${maxFiles} arquivos permitidos`);
        return;
      }

      // Preparar arquivos com progress inicial
      const newFiles: FileWithProgress[] = fileArray.map((file) => ({
        file,
        progress: {
          fileName: file.name,
          progress: 0,
          status: 'uploading' as const,
        },
        previewUrl: showPreview ? uploadService.generatePreviewUrl(file) : undefined,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
      setIsUploading(true);
      const successfulUploads: UploadResult[] = [];

      try {
        // Upload sequencial para melhor controle
        for (let i = 0; i < newFiles.length; i++) {
          const fileWithProgress = newFiles[i];

          try {
            const result = await uploadService.uploadFile(
              fileWithProgress.file,
              category,
              (progress) => {
                setFiles((prev) =>
                  prev.map((f) => (f.file === fileWithProgress.file ? { ...f, progress } : f)),
                );
              },
              context,
            );
            successfulUploads.push(result);

            // Atualizar com resultado
            setFiles((prev) =>
              prev.map((f) =>
                f.file === fileWithProgress.file
                  ? { ...f, result, progress: { ...f.progress, status: 'success' } }
                  : f,
              ),
            );
          } catch (error) {
            setFiles((prev) =>
              prev.map((f) =>
                f.file === fileWithProgress.file
                  ? {
                      ...f,
                      progress: {
                        ...f.progress,
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Erro no upload',
                      },
                    }
                  : f,
              ),
            );
          }
        }

        if (successfulUploads.length > 0) {
          onUploadSuccess?.(successfulUploads);
        }
      } catch (error) {
        onUploadError?.(error instanceof Error ? error.message : 'Erro no upload');
      } finally {
        setIsUploading(false);
      }
    },
    [files, category, maxFiles, showPreview, onUploadSuccess, onUploadError, context],
  );

  // Handlers para drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  // Handler para input file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  // Remover arquivo
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Abrir seletor de arquivo
  const openFileSelector = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // Obter status geral
  const getOverallStatus = () => {
    if (files.length === 0) return 'empty';
    if (isUploading) return 'uploading';
    if (files.some((f) => f.progress.status === 'error')) return 'error';
    if (files.every((f) => f.progress.status === 'success')) return 'success';
    return 'partial';
  };

  const overallStatus = getOverallStatus();

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={openFileSelector}
          disabled={disabled}
          className={`
            p-2 rounded-lg border-2 border-dashed transition-all duration-200
            ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
            ${overallStatus === 'success' ? 'border-green-400 bg-green-50' : ''}
            ${overallStatus === 'error' ? 'border-red-400 bg-red-50' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {children ? (
            children
          ) : isUploading ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : (
            <Plus className="w-5 h-5 text-gray-500" />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={getAcceptTypes()}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de Upload */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
          ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
          ${overallStatus === 'success' ? 'border-green-400 bg-green-50' : ''}
          ${overallStatus === 'error' ? 'border-red-400 bg-red-50' : ''}
        `}
        onClick={openFileSelector}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDragging ? 'Solte os arquivos aqui' : 'Upload de arquivos'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Arraste e solte {multiple ? 'arquivos' : 'um arquivo'} ou clique para selecionar
          </p>

          {/* Informações sobre limites */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>Tamanho máximo: {config.maxSize}MB</p>
            {multiple && <p>Máximo de {maxFiles} arquivos</p>}
            {config.allowedTypes && !config.allowedTypes.includes('*') && (
              <p>Tipos: {config.allowedTypes.join(', ').replace(/\w+\//g, '')}</p>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={getAcceptTypes()}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {/* Lista de arquivos */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Arquivos ({files.length})</h4>

          <div className="space-y-2">
            {files.map((fileWithProgress, index) => (
              <FileItem
                key={`${fileWithProgress.file.name}-${index}`}
                fileWithProgress={fileWithProgress}
                showPreview={showPreview}
                onRemove={() => removeFile(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para cada arquivo individual
interface FileItemProps {
  fileWithProgress: FileWithProgress;
  showPreview: boolean;
  onRemove: () => void;
}

const FileItem: React.FC<FileItemProps> = ({ fileWithProgress, showPreview, onRemove }) => {
  const { file, progress, previewUrl } = fileWithProgress;
  const fileIcon = uploadService.getFileIcon(file.type);
  const formattedSize = uploadService.formatFileSize(file.size);

  return (
    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
      {/* Preview ou ícone */}
      <div className="flex-shrink-0">
        {showPreview && previewUrl && file.type.startsWith('image/') ? (
          <img src={previewUrl} alt={file.name} className="w-10 h-10 object-cover rounded" />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
            <span className="text-lg">{fileIcon}</span>
          </div>
        )}
      </div>

      {/* Informações do arquivo */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{formattedSize}</p>

        {/* Barra de progresso */}
        {progress.status === 'uploading' && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Enviando...</span>
              <span>{Math.round(progress.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Mensagem de erro */}
        {progress.status === 'error' && progress.error && (
          <p className="text-xs text-red-500 mt-1">{progress.error}</p>
        )}
      </div>

      {/* Status e ações */}
      <div className="flex items-center gap-2">
        {progress.status === 'uploading' && (
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
        )}

        {progress.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}

        {progress.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}

        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
