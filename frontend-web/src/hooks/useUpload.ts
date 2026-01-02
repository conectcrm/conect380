/**
 * 🪝 Upload Hook - Hook para facilitar o uso do sistema de upload
 */

import { useState, useCallback } from 'react';
import { uploadService, UploadResult, UploadProgress } from '../services/uploadService';
import toast from 'react-hot-toast';

interface UseUploadOptions {
  category: 'avatar' | 'client-attachment' | 'document' | 'system';
  onSuccess?: (results: UploadResult[]) => void;
  onError?: (error: string) => void;
  showToasts?: boolean;
  multiple?: boolean;
}

interface UseUploadReturn {
  // Estados
  isUploading: boolean;
  uploads: UploadResult[];
  progress: Record<string, UploadProgress>;

  // Funções
  uploadFiles: (files: File[]) => Promise<UploadResult[]>;
  uploadSingle: (file: File) => Promise<UploadResult>;
  deleteUpload: (uploadId: string) => Promise<void>;
  clearUploads: () => void;

  // Utilitários
  getUploadsByCategory: (category?: string) => UploadResult[];
  validateFile: (file: File) => { valid: boolean; error?: string };
}

export const useUpload = (options: UseUploadOptions): UseUploadReturn => {
  const { category, onSuccess, onError, showToasts = true, multiple = false } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadResult[]>([]);
  const [progress, setProgress] = useState<Record<string, UploadProgress>>({});

  // Upload de múltiplos arquivos
  const uploadFiles = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      if (files.length === 0) return [];

      if (!multiple && files.length > 1) {
        const error = 'Apenas um arquivo é permitido';
        onError?.(error);
        if (showToasts) toast.error(error);
        return [];
      }

      setIsUploading(true);
      const results: UploadResult[] = [];

      try {
        for (const file of files) {
          const fileName = file.name;

          // Validar arquivo
          const validation = uploadService.validateFile(file, uploadService['getConfig'](category));
          if (!validation.valid) {
            const error = validation.error || 'Arquivo inválido';
            onError?.(error);
            if (showToasts) toast.error(`${fileName}: ${error}`);
            continue;
          }

          try {
            const result = await uploadService.uploadFile(file, category, (progressData) => {
              setProgress((prev) => ({
                ...prev,
                [fileName]: progressData,
              }));
            });

            results.push(result);

            // Remover do progress quando concluído
            setProgress((prev) => {
              const newProgress = { ...prev };
              delete newProgress[fileName];
              return newProgress;
            });

            if (showToasts) {
              toast.success(`${fileName} enviado com sucesso!`);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
            onError?.(errorMessage);
            if (showToasts) {
              toast.error(`${fileName}: ${errorMessage}`);
            }
          }
        }

        // Atualizar lista de uploads
        setUploads((prev) => [...prev, ...results]);

        // Callback de sucesso
        if (results.length > 0) {
          onSuccess?.(results);
        }

        return results;
      } finally {
        setIsUploading(false);
      }
    },
    [category, multiple, onSuccess, onError, showToasts],
  );

  // Upload de um único arquivo
  const uploadSingle = useCallback(
    async (file: File): Promise<UploadResult> => {
      const results = await uploadFiles([file]);
      if (results.length === 0) {
        throw new Error('Falha no upload do arquivo');
      }
      return results[0];
    },
    [uploadFiles],
  );

  // Deletar upload
  const deleteUpload = useCallback(
    async (uploadId: string): Promise<void> => {
      try {
        await uploadService.deleteFile(uploadId);
        setUploads((prev) => prev.filter((upload) => upload.id !== uploadId));

        if (showToasts) {
          toast.success('Arquivo removido com sucesso');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao remover arquivo';
        onError?.(errorMessage);
        if (showToasts) {
          toast.error(errorMessage);
        }
      }
    },
    [onError, showToasts],
  );

  // Limpar uploads
  const clearUploads = useCallback(() => {
    setUploads([]);
    setProgress({});
  }, []);

  // Obter uploads por categoria
  const getUploadsByCategory = useCallback(
    (categoryFilter?: string) => {
      return uploadService.getUploads(categoryFilter || category);
    },
    [category],
  );

  // Validar arquivo
  const validateFile = useCallback(
    (file: File) => {
      return uploadService.validateFile(file, uploadService['getConfig'](category));
    },
    [category],
  );

  return {
    // Estados
    isUploading,
    uploads,
    progress,

    // Funções
    uploadFiles,
    uploadSingle,
    deleteUpload,
    clearUploads,

    // Utilitários
    getUploadsByCategory,
    validateFile,
  };
};

// Hook específico para upload de avatar
export const useAvatarUpload = (onAvatarChange?: (avatar: UploadResult) => void) => {
  return useUpload({
    category: 'avatar',
    multiple: false,
    showToasts: true,
    onSuccess: (results) => {
      if (results.length > 0) {
        onAvatarChange?.(results[0]);
      }
    },
  });
};

// Hook específico para anexos de cliente
export const useClientAttachments = (clientId: string) => {
  const uploadHook = useUpload({
    category: 'client-attachment',
    multiple: true,
    showToasts: true,
  });

  // Função para associar uploads ao cliente
  const uploadForClient = useCallback(
    async (files: File[]) => {
      const results = await uploadHook.uploadFiles(files);

      // Aqui você pode adicionar lógica para associar os uploads ao cliente
      // Por exemplo, salvar no localStorage com o clientId
      if (results.length > 0) {
        const clientUploads = localStorage.getItem(`conectcrm_client_uploads_${clientId}`);
        const existing = clientUploads ? JSON.parse(clientUploads) : [];
        const updated = [...existing, ...results.map((r) => r.id)];
        localStorage.setItem(`conectcrm_client_uploads_${clientId}`, JSON.stringify(updated));
      }

      return results;
    },
    [uploadHook.uploadFiles, clientId],
  );

  return {
    ...uploadHook,
    uploadForClient,
  };
};

// Hook específico para documentos do sistema
export const useDocumentUpload = () => {
  return useUpload({
    category: 'document',
    multiple: true,
    showToasts: true,
  });
};
