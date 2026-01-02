/**
 * 📁 Upload Service - Sistema de Upload de Arquivos
 *
 * Funcionalidades:
 * - Upload de avatar de usuários
 * - Upload de anexos de clientes
 * - Upload de documentos do sistema
 * - Validação de tipos e tamanhos
 * - Preview de imagens
 * - Progress tracking
 */

export interface UploadOptions {
  maxSize?: number; // em MB
  allowedTypes?: string[];
  category: 'avatar' | 'client-attachment' | 'document' | 'system';
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UploadResult {
  id: string;
  fileName: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  category: string;
  uploadedAt: Date;
}

class UploadService {
  private readonly BASE_URL = '/api/upload';
  private readonly MAX_FILE_SIZE = 10; // MB padrão

  // Configurações por categoria
  private getConfig(category: string): UploadOptions {
    const configs: Record<string, UploadOptions> = {
      avatar: {
        maxSize: 2,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        category: 'avatar',
      },
      'client-attachment': {
        maxSize: 10,
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ],
        category: 'client-attachment',
      },
      document: {
        maxSize: 50,
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ],
        category: 'document',
      },
      system: {
        maxSize: 100,
        allowedTypes: ['*'],
        category: 'system',
      },
    };

    return configs[category] || configs.system;
  }

  // Validar arquivo antes do upload
  validateFile(file: File, options: UploadOptions): { valid: boolean; error?: string } {
    // Validar tamanho
    const maxSizeBytes = (options.maxSize || this.MAX_FILE_SIZE) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `Arquivo muito grande. Máximo permitido: ${options.maxSize || this.MAX_FILE_SIZE}MB`,
      };
    }

    // Validar tipo
    if (options.allowedTypes && !options.allowedTypes.includes('*')) {
      if (!options.allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: 'Tipo de arquivo não permitido',
        };
      }
    }

    return { valid: true };
  }

  // Upload único com progress
  async uploadFile(
    file: File,
    category: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult> {
    const config = this.getConfig(category);

    // Validar arquivo
    const validation = this.validateFile(file, config);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Preparar FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    // Simular upload para desenvolvimento (pode ser substituído por API real)
    return new Promise((resolve, reject) => {
      let progress = 0;
      const fileName = file.name;

      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 100) progress = 100;

        onProgress?.({
          fileName,
          progress,
          status: 'uploading',
        });

        if (progress >= 100) {
          clearInterval(interval);

          // Simular resultado do upload
          const result: UploadResult = {
            id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: `${category}_${Date.now()}_${file.name}`,
            originalName: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file), // Em produção seria a URL do servidor
            category,
            uploadedAt: new Date(),
          };

          // Salvar no localStorage para persistência
          this.saveUploadResult(result);

          onProgress?.({
            fileName,
            progress: 100,
            status: 'success',
          });

          setTimeout(() => resolve(result), 500);
        }
      }, 200);

      // Simular possível erro (5% de chance)
      if (Math.random() < 0.05) {
        setTimeout(() => {
          clearInterval(interval);
          onProgress?.({
            fileName,
            progress: 0,
            status: 'error',
            error: 'Erro simulado de upload',
          });
          reject(new Error('Erro simulado de upload'));
        }, 1000);
      }
    });
  }

  // Upload múltiplo
  async uploadMultiple(
    files: File[],
    category: string,
    onProgress?: (fileName: string, progress: UploadProgress) => void,
  ): Promise<UploadResult[]> {
    const promises = files.map((file) =>
      this.uploadFile(file, category, (progress) => onProgress?.(file.name, progress)),
    );

    return Promise.all(promises);
  }

  // Salvar resultado no localStorage
  private saveUploadResult(result: UploadResult): void {
    const key = `conectcrm_uploads`;
    const stored = localStorage.getItem(key);
    const uploads: UploadResult[] = stored ? JSON.parse(stored) : [];

    uploads.push(result);
    localStorage.setItem(key, JSON.stringify(uploads));
  }

  // Listar arquivos por categoria
  getUploads(category?: string): UploadResult[] {
    const key = `conectcrm_uploads`;
    const stored = localStorage.getItem(key);
    const uploads: UploadResult[] = stored ? JSON.parse(stored) : [];

    if (category) {
      return uploads.filter((upload) => upload.category === category);
    }

    return uploads;
  }

  // Deletar arquivo
  async deleteFile(uploadId: string): Promise<boolean> {
    const key = `conectcrm_uploads`;
    const stored = localStorage.getItem(key);
    const uploads: UploadResult[] = stored ? JSON.parse(stored) : [];

    const filteredUploads = uploads.filter((upload) => upload.id !== uploadId);
    localStorage.setItem(key, JSON.stringify(filteredUploads));

    return true;
  }

  // Gerar URL de preview para imagens
  generatePreviewUrl(file: File): string {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return '';
  }

  // Obter ícone por tipo de arquivo
  getFileIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'image/': '🖼️',
      'application/pdf': '📄',
      'application/msword': '📝',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
      'application/vnd.ms-excel': '📊',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
      'text/plain': '📄',
      'video/': '🎥',
      'audio/': '🎵',
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (type.startsWith(key)) {
        return icon;
      }
    }

    return '📎';
  }

  // Formatar tamanho do arquivo
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const uploadService = new UploadService();
