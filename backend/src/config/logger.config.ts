import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { trace, context as otelContext } from '@opentelemetry/api';
import { getCorrelationId } from '../common/middleware/correlation-id.middleware';

const { combine, timestamp, errors, json, printf } = winston.format;

/**
 * 🔗 Formato customizado que adiciona correlationId e trace_id/span_id
 * Permite correlacionar logs com traces do OpenTelemetry
 */
const correlationFormat = winston.format((info) => {
  // 1. Pegar correlationId do AsyncLocalStorage (gerado pelo middleware)
  const correlationId = getCorrelationId();
  if (correlationId) {
    info.correlationId = correlationId;
  }

  // 2. Pegar span ativo do OpenTelemetry
  const activeSpan = trace.getActiveSpan();

  if (activeSpan) {
    const spanContext = activeSpan.spanContext();
    info.trace_id = spanContext.traceId;
    info.span_id = spanContext.spanId;
  }

  return info;
})();

// Formato customizado para desenvolvimento (legível)
const devFormat = printf(
  ({
    timestamp,
    level,
    message,
    context,
    correlationId,
    trace_id,
    span_id,
    trace,
    ...metadata
  }) => {
    let msg = `${timestamp} [${level}] [${context || 'Application'}]`;

    // Adicionar correlationId se existir
    if (correlationId && typeof correlationId === 'string') {
      msg += ` [CID:${correlationId.substring(0, 8)}]`;
    }

    // Adicionar trace_id se existir (primeiros 8 chars)
    if (trace_id && typeof trace_id === 'string') {
      msg += ` [TID:${trace_id.substring(0, 8)}]`;
    }

    msg += ` ${message}`;

    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    if (trace) {
      msg += `\n${trace}`;
    }

    return msg;
  },
);

// Formato JSON para produção (estruturado)
const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  correlationFormat, // 🔗 Adicionar correlationId e trace_id/span_id
  json(),
);

// Transport para logs de erro (rotação diária)
const errorRotateTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '5m', // Rotaciona quando chegar a 5MB
  maxFiles: '7d', // Mantém logs por 7 dias
  format: prodFormat,
});

// Transport para todos os logs (rotação diária)
const combinedRotateTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '5m',
  maxFiles: '7d',
  format: prodFormat,
});

// Transport para logs de segurança (rotação diária, retenção maior)
const securityRotateTransport = new DailyRotateFile({
  filename: 'logs/security-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'warn',
  maxSize: '5m',
  maxFiles: '30d', // Mantém logs de segurança por 30 dias
  format: prodFormat,
});

// Transport para console (desenvolvimento)
const consoleTransport = new winston.transports.Console({
  format: combine(
    winston.format.colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    correlationFormat, // 🔗 Adicionar correlationId mesmo no console
    devFormat,
  ),
});

// Configuração do Winston
export const winstonConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json()),
  defaultMeta: {
    service: 'conectcrm-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console sempre habilitado (útil em dev e prod)
    consoleTransport,

    // Logs estruturados em arquivos (prod)
    errorRotateTransport,
    combinedRotateTransport,
    securityRotateTransport,
  ],
  // Evitar que erros no logger derrubem a aplicação
  exceptionHandlers: [
    new DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '5m',
      maxFiles: '30d',
      format: prodFormat,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '5m',
      maxFiles: '30d',
      format: prodFormat,
    }),
  ],
};

// Helper para logs de segurança
export class SecurityLogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger(winstonConfig);
  }

  // Log de tentativa de login falha
  loginFailed(username: string, ip: string, reason: string) {
    this.logger.warn('Login falhou', {
      event: 'login_failed',
      username,
      ip,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  // Log de tentativa de acesso não autorizado
  unauthorizedAccess(userId: string, resource: string, action: string, ip: string) {
    this.logger.warn('Acesso não autorizado', {
      event: 'unauthorized_access',
      userId,
      resource,
      action,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  // Log de alteração de permissões/roles
  permissionChange(adminId: string, targetUserId: string, change: string) {
    this.logger.warn('Alteração de permissão', {
      event: 'permission_change',
      adminId,
      targetUserId,
      change,
      timestamp: new Date().toISOString(),
    });
  }

  // Log de tentativa de SQL injection ou XSS
  suspiciousInput(userId: string, endpoint: string, input: string, ip: string) {
    this.logger.error('Input suspeito detectado', {
      event: 'suspicious_input',
      userId,
      endpoint,
      input: input.substring(0, 200), // Limitar tamanho
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  // Log de rate limit excedido
  rateLimitExceeded(ip: string, endpoint: string, attempts: number) {
    this.logger.warn('Rate limit excedido', {
      event: 'rate_limit_exceeded',
      ip,
      endpoint,
      attempts,
      timestamp: new Date().toISOString(),
    });
  }

  // Log de criação de usuário admin
  adminCreated(creatorId: string, newAdminId: string) {
    this.logger.warn('Admin criado', {
      event: 'admin_created',
      creatorId,
      newAdminId,
      timestamp: new Date().toISOString(),
    });
  }

  // Log de export de dados sensíveis
  dataExport(userId: string, dataType: string, recordCount: number) {
    this.logger.warn('Export de dados', {
      event: 'data_export',
      userId,
      dataType,
      recordCount,
      timestamp: new Date().toISOString(),
    });
  }

  mfaChallengeIssued(userId: string, username: string, ip: string, challengeId: string) {
    this.logger.warn('Desafio MFA emitido', {
      event: 'mfa_challenge_issued',
      userId,
      username,
      ip,
      challengeId,
      timestamp: new Date().toISOString(),
    });
  }

  mfaChallengeFailed(userId: string, ip: string, reason: string, challengeId?: string) {
    this.logger.warn('Validacao MFA falhou', {
      event: 'mfa_challenge_failed',
      userId,
      ip,
      reason,
      challengeId,
      timestamp: new Date().toISOString(),
    });
  }

  mfaChallengeVerified(userId: string, ip: string, challengeId: string) {
    this.logger.warn('Validacao MFA concluida', {
      event: 'mfa_challenge_verified',
      userId,
      ip,
      challengeId,
      timestamp: new Date().toISOString(),
    });
  }

  adminSessionRefresh(userId: string, role: string, ip: string) {
    this.logger.warn('Refresh de sessao administrativa', {
      event: 'admin_session_refresh',
      userId,
      role,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  adminSessionLogout(userId: string, role: string, ip: string, reason?: string) {
    this.logger.warn('Logout de sessao administrativa', {
      event: 'admin_session_logout',
      userId,
      role,
      ip,
      reason: reason || null,
      timestamp: new Date().toISOString(),
    });
  }

  loginLockoutTriggered(
    identity: string,
    ip: string,
    lockedUntil: Date,
    lockoutLevel: number,
    role?: string,
  ) {
    this.logger.warn('Bloqueio progressivo de login acionado', {
      event: 'login_lockout_triggered',
      identity,
      ip,
      lockedUntil: lockedUntil.toISOString(),
      lockoutLevel,
      role: role || null,
      timestamp: new Date().toISOString(),
    });
  }

  loginLockoutUnlocked(identity: string, actorId: string, reason?: string) {
    this.logger.warn('Bloqueio de login removido manualmente', {
      event: 'login_lockout_unlocked',
      identity,
      actorId,
      reason: reason || null,
      timestamp: new Date().toISOString(),
    });
  }
}

export const securityLogger = new SecurityLogger();
