import { api } from './api';

export interface UploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  category: 'avatar' | 'client-attachment' | 'document' | 'system';
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UploadContext {
  clienteId?: string;
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
  private readonly MAX_FILE_SIZE = 10;

  getConfig(category: string): UploadOptions {
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

  validateFile(file: File, options: UploadOptions): { valid: boolean; error?: string } {
    const maxSizeBytes = (options.maxSize || this.MAX_FILE_SIZE) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `Arquivo muito grande. Maximo permitido: ${options.maxSize || this.MAX_FILE_SIZE}MB`,
      };
    }

    if (options.allowedTypes && !options.allowedTypes.includes('*')) {
      if (!options.allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: 'Tipo de arquivo nao permitido',
        };
      }
    }

    return { valid: true };
  }

  async uploadFile(
    file: File,
    category: string,
    onProgress?: (progress: UploadProgress) => void,
    context?: UploadContext,
  ): Promise<UploadResult> {
    const config = this.getConfig(category);
    const validation = this.validateFile(file, config);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (category === 'avatar') {
      return this.uploadClienteAvatar(file, onProgress, context);
    }

    if (category === 'client-attachment') {
      return this.uploadClienteAnexo(file, onProgress, context);
    }

    return this.simularUpload(file, category, onProgress);
  }

  async uploadMultiple(
    files: File[],
    category: string,
    onProgress?: (fileName: string, progress: UploadProgress) => void,
    context?: UploadContext,
  ): Promise<UploadResult[]> {
    const promises = files.map((file) =>
      this.uploadFile(
        file,
        category,
        (progressData) => onProgress?.(file.name, progressData),
        context,
      ),
    );

    return Promise.all(promises);
  }

  private async uploadClienteAvatar(
    file: File,
    onProgress?: (progress: UploadProgress) => void,
    context?: UploadContext,
  ): Promise<UploadResult> {
    if (!context?.clienteId) {
      throw new Error('Cliente nao informado para upload de avatar.');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post(`/clientes/${context.clienteId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        const total = event.total || file.size;
        const progress = Math.min(100, Math.round((event.loaded / total) * 100));

        onProgress?.({
          fileName: file.name,
          progress,
          status: 'uploading',
        });
      },
    });

    const payload = response.data?.data || response.data || {};
    const avatarUrl = payload.avatar_url || payload.avatarUrl || payload.avatar;

    if (!avatarUrl) {
      throw new Error('Resposta invalida ao atualizar avatar do cliente.');
    }

    const result: UploadResult = {
      id: payload.id || context.clienteId,
      fileName: file.name,
      originalName: file.name,
      size: file.size,
      type: file.type,
      url: this.resolveUploadUrl(avatarUrl),
      category: 'avatar',
      uploadedAt: new Date(),
    };

    this.saveUploadResult(result);
    onProgress?.({
      fileName: file.name,
      progress: 100,
      status: 'success',
    });

    return result;
  }

  private async uploadClienteAnexo(
    file: File,
    onProgress?: (progress: UploadProgress) => void,
    context?: UploadContext,
  ): Promise<UploadResult> {
    if (!context?.clienteId) {
      throw new Error('Cliente nao informado para upload de anexo.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/clientes/${context.clienteId}/anexos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        const total = event.total || file.size;
        const progress = Math.min(100, Math.round((event.loaded / total) * 100));

        onProgress?.({
          fileName: file.name,
          progress,
          status: 'uploading',
        });
      },
    });

    const payload = response.data?.data || response.data || {};

    if (!payload.url) {
      throw new Error('Resposta invalida ao adicionar anexo do cliente.');
    }

    const result: UploadResult = {
      id: payload.id || `anexo_${Date.now()}`,
      fileName: payload.nome || file.name,
      originalName: payload.nome || file.name,
      size: Number(payload.tamanho || file.size),
      type: payload.tipo || file.type,
      url: this.resolveUploadUrl(payload.url),
      category: 'client-attachment',
      uploadedAt: payload.created_at ? new Date(payload.created_at) : new Date(),
    };

    this.saveUploadResult(result);
    onProgress?.({
      fileName: file.name,
      progress: 100,
      status: 'success',
    });

    return result;
  }

  private simularUpload(
    file: File,
    category: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult> {
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

          const result: UploadResult = {
            id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: `${category}_${Date.now()}_${file.name}`,
            originalName: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file),
            category,
            uploadedAt: new Date(),
          };

          this.saveUploadResult(result);

          onProgress?.({
            fileName,
            progress: 100,
            status: 'success',
          });

          setTimeout(() => resolve(result), 300);
        }
      }, 200);

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

  private resolveUploadUrl(url: string): string {
    if (!url) {
      return '';
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return url.startsWith('/') ? url : `/${url}`;
  }

  private saveUploadResult(result: UploadResult): void {
    const key = 'conectcrm_uploads';
    const stored = localStorage.getItem(key);
    const uploads: UploadResult[] = stored ? JSON.parse(stored) : [];

    uploads.push(result);
    localStorage.setItem(key, JSON.stringify(uploads));
  }

  getUploads(category?: string): UploadResult[] {
    const key = 'conectcrm_uploads';
    const stored = localStorage.getItem(key);
    const uploads: UploadResult[] = stored ? JSON.parse(stored) : [];

    if (category) {
      return uploads.filter((upload) => upload.category === category);
    }

    return uploads;
  }

  async deleteFile(uploadId: string): Promise<boolean> {
    const key = 'conectcrm_uploads';
    const stored = localStorage.getItem(key);
    const uploads: UploadResult[] = stored ? JSON.parse(stored) : [];

    const filteredUploads = uploads.filter((upload) => upload.id !== uploadId);
    localStorage.setItem(key, JSON.stringify(filteredUploads));

    return true;
  }

  generatePreviewUrl(file: File): string {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }

    return '';
  }

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

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const uploadService = new UploadService();
