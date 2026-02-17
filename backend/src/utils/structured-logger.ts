/**
 * 📝 Structured Logger Helper
 *
 * Logger customizado que produz JSON estruturado para Loki
 * com correlation IDs (trace_id, span_id) automáticos.
 */

import { Logger as NestLogger } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import * as fs from 'fs';
import * as path from 'path';

interface LogMetadata {
  context?: string;
  userId?: string;
  empresaId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: string;
  [key: string]: unknown;
}

export class StructuredLogger extends NestLogger {
  private logToFile: boolean;
  private logFilePath: string;

  constructor(context?: string, logToFile = true) {
    super(context);
    this.logToFile = logToFile && process.env.NODE_ENV !== 'test';

    // Criar diretório de logs se não existir
    if (this.logToFile) {
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      this.logFilePath = path.join(logsDir, 'application.log');
    }
  }

  /**
   * Obter trace_id e span_id do contexto OpenTelemetry
   */
  private getCorrelationIds(): { trace_id?: string; span_id?: string } {
    const span = trace.getActiveSpan();
    if (!span) {
      return {};
    }

    const spanContext = span.spanContext();
    return {
      trace_id: spanContext.traceId,
      span_id: spanContext.spanId,
    };
  }

  /**
   * Formatar log em JSON estruturado
   */
  private formatLogEntry(level: string, message: unknown, metadata?: LogMetadata): string {
    const correlationIds = this.getCorrelationIds();

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message: typeof message === 'string' ? message : JSON.stringify(message),
      context: metadata?.context || this.context,
      ...correlationIds,
      ...metadata,
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Escrever log em arquivo (se habilitado)
   */
  private writeToFile(logEntry: string): void {
    if (!this.logToFile) return;

    try {
      fs.appendFileSync(this.logFilePath, logEntry + '\n', 'utf8');
    } catch (error) {
      // Falha silenciosa para não quebrar aplicação
      console.error('Failed to write log to file:', error);
    }
  }

  /**
   * Log genérico
   */
  private logWithMetadata(level: string, message: unknown, metadata?: LogMetadata): void {
    const logEntry = this.formatLogEntry(level, message, metadata);

    // Console output
    console.log(logEntry);

    // File output
    this.writeToFile(logEntry);
  }

  // ============================================================================
  // Public API (compatível com NestJS Logger)
  // ============================================================================

  log(message: unknown, context?: string): void;
  log(message: unknown, metadata?: LogMetadata): void;
  log(message: unknown, contextOrMetadata?: string | LogMetadata): void {
    const metadata =
      typeof contextOrMetadata === 'string' ? { context: contextOrMetadata } : contextOrMetadata;
    this.logWithMetadata('info', message, metadata);
  }

  error(message: unknown, stack?: string, context?: string): void;
  error(message: unknown, stack?: string, metadata?: LogMetadata): void;
  error(message: unknown, stackOrContext?: string, contextOrMetadata?: string | LogMetadata): void {
    const stack = typeof stackOrContext === 'string' ? stackOrContext : undefined;
    const metadata =
      typeof contextOrMetadata === 'string'
        ? { context: contextOrMetadata, stack }
        : { ...contextOrMetadata, stack };
    this.logWithMetadata('error', message, metadata);
  }

  warn(message: unknown, context?: string): void;
  warn(message: unknown, metadata?: LogMetadata): void;
  warn(message: unknown, contextOrMetadata?: string | LogMetadata): void {
    const metadata =
      typeof contextOrMetadata === 'string' ? { context: contextOrMetadata } : contextOrMetadata;
    this.logWithMetadata('warn', message, metadata);
  }

  debug(message: unknown, context?: string): void;
  debug(message: unknown, metadata?: LogMetadata): void;
  debug(message: unknown, contextOrMetadata?: string | LogMetadata): void {
    if (process.env.LOG_LEVEL === 'debug') {
      const metadata =
        typeof contextOrMetadata === 'string' ? { context: contextOrMetadata } : contextOrMetadata;
      this.logWithMetadata('debug', message, metadata);
    }
  }

  verbose(message: unknown, context?: string): void;
  verbose(message: unknown, metadata?: LogMetadata): void;
  verbose(message: unknown, contextOrMetadata?: string | LogMetadata): void {
    if (['debug', 'verbose'].includes(process.env.LOG_LEVEL || '')) {
      const metadata =
        typeof contextOrMetadata === 'string' ? { context: contextOrMetadata } : contextOrMetadata;
      this.logWithMetadata('verbose', message, metadata);
    }
  }
}

/**
 * Factory para criar logger estruturado
 */
export function createStructuredLogger(context: string): StructuredLogger {
  return new StructuredLogger(context);
}
