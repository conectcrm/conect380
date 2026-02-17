/**
 * 🔍 OpenTelemetry Tracing Configuration
 *
 * Configuração de tracing distribuído para observabilidade do sistema.
 * Permite rastrear requisições através de múltiplos serviços e identificar gargalos.
 *
 * Features:
 * - Auto-instrumentação de HTTP, Express, TypeORM, Redis
 * - Export para Jaeger (visualização de traces)
 * - Spans customizados para lógica de negócio
 * - Context propagation entre serviços
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { SpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base';

// Detectar ambiente
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const enableTracingLogs = process.env.ENABLE_TRACING_LOGS === 'true';

/**
 * NoopSpanExporter - Exporter silencioso para desenvolvimento
 * Coleta traces mas não polui o console
 */
class NoopSpanExporter implements SpanExporter {
  export(spans: ReadableSpan[], resultCallback: (result: { code: number }) => void): void {
    resultCallback({ code: 0 }); // Success, mas sem logs
  }
  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

// Configurar exporter baseado no ambiente
const traceExporter = isProduction
  ? new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces',
      headers: {},
    })
  : enableTracingLogs
    ? new ConsoleSpanExporter() // Dev com logs habilitados explicitamente
    : new NoopSpanExporter(); // Dev: silencioso (padrão)

// Criar SDK com configurações
export const sdk = new NodeSDK({
  serviceName: 'conectcrm-backend',

  traceExporter,

  // Auto-instrumentação de bibliotecas comuns
  instrumentations: [
    getNodeAutoInstrumentations({
      // Habilitar instrumentações principais
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-nestjs-core': {
        enabled: true,
      },
      // Desabilitar instrumentações verbose ou não usadas
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-dns': {
        enabled: false,
      },
    }),
  ],
});

/**
 * Inicializar OpenTelemetry SDK
 * DEVE ser chamado ANTES de qualquer outro import/código
 */
export async function initializeTracing(): Promise<void> {
  try {
    await sdk.start();
    console.log('🔍 OpenTelemetry Tracing inicializado');

    if (isDevelopment) {
      if (enableTracingLogs) {
        console.log('📊 Modo: Console (logs verbosos habilitados)');
      } else {
        console.log('📊 Modo: Silent (use ENABLE_TRACING_LOGS=true para ver traces)');
      }
    } else {
      console.log('📊 Modo: Jaeger (produção)');
      console.log(
        `🔗 Jaeger OTLP: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318'}`,
      );
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar OpenTelemetry:', error);
    throw error;
  }
}

/**
 * Graceful shutdown
 */
export async function shutdownTracing(): Promise<void> {
  try {
    await sdk.shutdown();
    console.log('✅ OpenTelemetry shutdown successfully');
  } catch (error) {
    console.error('❌ Error shutting down OpenTelemetry:', error);
  }
}

// Cleanup em sinais de término
process.on('SIGTERM', async () => {
  await shutdownTracing();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdownTracing();
  process.exit(0);
});
