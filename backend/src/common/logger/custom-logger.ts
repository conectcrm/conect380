import { LoggerService, LogLevel } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 📝 Custom Logger com Rotação de Arquivos
 *
 * Logger que:
 * - Escreve logs em arquivos separados por nível (error, warn, info)
 * - Rotação automática quando arquivo atinge 10 MB
 * - Mantém últimos 10 arquivos de cada tipo
 * - Logs estruturados em JSON (fácil parsing)
 * - Console colorido em desenvolvimento
 *
 * Estrutura de arquivos:
 * logs/
 *   error.log      (erros críticos)
 *   warn.log       (avisos)
 *   info.log       (informações gerais)
 *   error.log.1    (rotacionado)
 *   error.log.2    (rotacionado)
 */
export class CustomLogger implements LoggerService {
  private logsDir: string;
  private maxFileSize = 10 * 1024 * 1024; // 10 MB
  private maxFiles = 10;

  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  /**
   * Garante que diretório de logs existe
   */
  private ensureLogDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Rotaciona arquivo se necessário
   */
  private rotateLogFile(logFile: string) {
    try {
      const stats = fs.statSync(logFile);

      if (stats.size >= this.maxFileSize) {
        // Remover arquivo mais antigo se necessário
        const oldestFile = `${logFile}.${this.maxFiles}`;
        if (fs.existsSync(oldestFile)) {
          fs.unlinkSync(oldestFile);
        }

        // Rotacionar arquivos existentes
        for (let i = this.maxFiles - 1; i >= 1; i--) {
          const currentFile = `${logFile}.${i}`;
          const nextFile = `${logFile}.${i + 1}`;

          if (fs.existsSync(currentFile)) {
            fs.renameSync(currentFile, nextFile);
          }
        }

        // Rotacionar arquivo atual
        fs.renameSync(logFile, `${logFile}.1`);
      }
    } catch (error) {
      // Arquivo não existe ainda, tudo OK
    }
  }

  /**
   * Escreve log em arquivo
   */
  private writeToFile(level: string, message: string, context?: string) {
    const logFile = path.join(this.logsDir, `${level}.log`);

    // Verificar e rotacionar se necessário
    this.rotateLogFile(logFile);

    // Estrutura do log
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      context: context || 'Application',
      message,
      pid: process.pid,
    };

    // Escrever em arquivo (append)
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFile, logLine);
  }

  /**
   * Formata mensagem para console
   */
  private formatConsoleMessage(level: string, message: string, context?: string): string {
    const timestamp = new Date().toLocaleString('pt-BR');
    const contextStr = context ? `[${context}]` : '';

    // Cores ANSI
    const colors = {
      error: '\x1b[31m', // Vermelho
      warn: '\x1b[33m', // Amarelo
      log: '\x1b[32m', // Verde
      debug: '\x1b[36m', // Ciano
      verbose: '\x1b[35m', // Magenta
      reset: '\x1b[0m',
    };

    const color = colors[level] || colors.reset;
    return `${color}[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}${colors.reset}`;
  }

  /**
   * Log genérico
   */
  private logMessage(level: string, message: any, context?: string, trace?: string) {
    const messageStr = typeof message === 'object' ? JSON.stringify(message) : message;

    // Console (desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatConsoleMessage(level, messageStr, context));
      if (trace) {
        console.log(trace);
      }
    }

    // Arquivo (sempre)
    this.writeToFile(level, messageStr, context);
  }

  /**
   * Implementação do LoggerService
   */
  log(message: any, context?: string) {
    this.logMessage('info', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.logMessage('error', message, context, trace);
  }

  warn(message: any, context?: string) {
    this.logMessage('warn', message, context);
  }

  debug(message: any, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.logMessage('debug', message, context);
    }
  }

  verbose(message: any, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.logMessage('verbose', message, context);
    }
  }

  /**
   * Métodos auxiliares
   */
  setLogLevels(levels: LogLevel[]) {
    // Implementação opcional
  }

  /**
   * Limpa logs antigos (manter últimos N dias)
   */
  cleanOldLogs(daysToKeep: number = 30) {
    try {
      const files = fs.readdirSync(this.logsDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      files.forEach((file) => {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime.getTime();

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          this.log(`Removed old log file: ${file}`, 'CustomLogger');
        }
      });
    } catch (error) {
      this.error(`Error cleaning old logs: ${error.message}`, error.stack, 'CustomLogger');
    }
  }
}
