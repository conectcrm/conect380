interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';
  entityType: string;
  entityId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  changes?: Record<string, any>;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  sessionId?: string;
  metadata?: Record<string, any>;
}

interface AuditConfig {
  action: AuditLog['action'];
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  previousValues?: Record<string, any>;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class AuditoriaService {
  private static instance: AuditoriaService;
  private auditQueue: AuditLog[] = [];
  private isProcessing = false;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 segundos

  static getInstance(): AuditoriaService {
    if (!AuditoriaService.instance) {
      AuditoriaService.instance = new AuditoriaService();
    }
    return AuditoriaService.instance;
  }

  constructor() {
    // Iniciar processamento em lote
    setInterval(() => {
      this.flushAuditQueue();
    }, this.FLUSH_INTERVAL);

    // Processar queue quando a página for fechada
    window.addEventListener('beforeunload', () => {
      this.flushAuditQueue();
    });
  }

  async auditarAcao(config: AuditConfig): Promise<void> {
    try {
      const auditLog: AuditLog = {
        id: this.generateId(),
        action: config.action,
        entityType: config.entityType,
        entityId: config.entityId,
        userId: config.userId,
        changes: config.changes,
        previousValues: config.previousValues,
        newValues: this.extractNewValues(config.changes),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: config.timestamp,
        sessionId: this.getSessionId(),
        metadata: config.metadata,
      };

      // Adicionar à queue
      this.auditQueue.push(auditLog);

      // Se a queue está muito grande, processar imediatamente
      if (this.auditQueue.length >= this.BATCH_SIZE) {
        await this.flushAuditQueue();
      }
    } catch (error) {
      console.error('Erro ao auditar ação:', error);
      // Não bloquear a operação principal por erro de auditoria
    }
  }

  async auditarLogin(userId: string, success: boolean, reason?: string): Promise<void> {
    await this.auditarAcao({
      action: success ? 'LOGIN' : 'LOGIN',
      entityType: 'USER_SESSION',
      entityId: userId,
      userId,
      timestamp: new Date(),
      metadata: {
        success,
        reason,
        loginTime: new Date().toISOString(),
      },
    });
  }

  async auditarLogout(userId: string): Promise<void> {
    await this.auditarAcao({
      action: 'LOGOUT',
      entityType: 'USER_SESSION',
      entityId: userId,
      userId,
      timestamp: new Date(),
      metadata: {
        logoutTime: new Date().toISOString(),
      },
    });
  }

  async auditarExportacao(
    userId: string,
    entityType: string,
    formato: string,
    quantidade: number,
    filtros?: Record<string, any>,
  ): Promise<void> {
    await this.auditarAcao({
      action: 'EXPORT',
      entityType: entityType,
      entityId: 'BULK_EXPORT',
      userId,
      timestamp: new Date(),
      metadata: {
        formato,
        quantidade,
        filtros,
        exportTime: new Date().toISOString(),
      },
    });
  }

  async auditarLeitura(
    userId: string,
    entityType: string,
    entityId: string,
    accessType: 'VIEW' | 'LIST' | 'SEARCH' = 'VIEW',
  ): Promise<void> {
    // Só auditar leituras de dados sensíveis
    const sensitiveEntities = ['USER', 'FINANCIAL', 'CLIENTE', 'CONTRATO'];

    if (sensitiveEntities.includes(entityType.toUpperCase())) {
      await this.auditarAcao({
        action: 'READ',
        entityType,
        entityId,
        userId,
        timestamp: new Date(),
        metadata: {
          accessType,
          accessTime: new Date().toISOString(),
        },
      });
    }
  }

  private async flushAuditQueue(): Promise<void> {
    if (this.auditQueue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const batch = this.auditQueue.splice(0, this.BATCH_SIZE);

      await this.sendAuditBatch(batch);
    } catch (error) {
      console.error('Erro ao processar batch de auditoria:', error);

      // Recolocar itens na queue em caso de erro
      this.auditQueue.unshift(...this.auditQueue);
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendAuditBatch(logs: AuditLog[]): Promise<void> {
    try {
      const response = await fetch('/api/auditoria/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({ logs }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      // Tentar fallback para logs individuais
      for (const log of logs) {
        try {
          await this.sendIndividualAuditLog(log);
        } catch (individualError) {
          console.error('Erro ao enviar log individual:', individualError);
        }
      }
    }
  }

  private async sendIndividualAuditLog(log: AuditLog): Promise<void> {
    await fetch('/api/auditoria', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(log),
    });
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getClientIP(): Promise<string> {
    try {
      // Em produção, isso seria obtido do backend
      const response = await fetch('/api/client-ip');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private getSessionId(): string {
    return sessionStorage.getItem('sessionId') || 'unknown';
  }

  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  private extractNewValues(changes?: Record<string, any>): Record<string, any> | undefined {
    if (!changes) return undefined;

    // Extrair apenas os novos valores (assumindo que changes contém { field: newValue })
    return changes;
  }

  // Método para buscar logs de auditoria
  async buscarLogsAuditoria(filtros: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: AuditLog['action'];
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const queryParams = new URLSearchParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/auditoria?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    return response.json();
  }

  // Método para gerar relatório de auditoria
  async gerarRelatorioAuditoria(filtros: {
    entityType?: string;
    userId?: string;
    startDate: Date;
    endDate: Date;
    formato: 'csv' | 'excel' | 'pdf';
  }): Promise<Blob> {
    const response = await fetch('/api/auditoria/relatorio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(filtros),
    });

    return response.blob();
  }
}

// Instância singleton
const auditoriaService = AuditoriaService.getInstance();

// Funções utilitárias para uso direto
export async function auditarAcao(config: AuditConfig): Promise<void> {
  return auditoriaService.auditarAcao(config);
}

export async function auditarLogin(
  userId: string,
  success: boolean,
  reason?: string,
): Promise<void> {
  return auditoriaService.auditarLogin(userId, success, reason);
}

export async function auditarLogout(userId: string): Promise<void> {
  return auditoriaService.auditarLogout(userId);
}

export async function auditarExportacao(
  userId: string,
  entityType: string,
  formato: string,
  quantidade: number,
  filtros?: Record<string, any>,
): Promise<void> {
  return auditoriaService.auditarExportacao(userId, entityType, formato, quantidade, filtros);
}

export async function auditarLeitura(
  userId: string,
  entityType: string,
  entityId: string,
  accessType: 'VIEW' | 'LIST' | 'SEARCH' = 'VIEW',
): Promise<void> {
  return auditoriaService.auditarLeitura(userId, entityType, entityId, accessType);
}

export default auditoriaService;
