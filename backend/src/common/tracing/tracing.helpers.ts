/**
 * 🔍 OpenTelemetry Tracing Helpers
 *
 * Utilitários para facilitar a adição de spans customizados
 * nos services do sistema.
 */

import { trace, context, Span, SpanStatusCode, Attributes } from '@opentelemetry/api';

/**
 * Nome do tracer do módulo de atendimento
 */
const TRACER_NAME = 'conectcrm-atendimento';

/**
 * Pega o tracer ativo
 */
export function getTracer() {
  return trace.getTracer(TRACER_NAME, '2.0.0');
}

/**
 * Decorator para adicionar tracing automático em métodos
 *
 * @example
 * ```typescript
 * @Trace('criar-ticket')
 * async criar(dados: CriarTicketDto) {
 *   // ... código
 * }
 * ```
 */
export function Trace(spanName: string, attributes?: Attributes) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tracer = getTracer();

      return await tracer.startActiveSpan(spanName, { attributes }, async (span: Span) => {
        try {
          const result = await originalMethod.apply(this, args);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          span.recordException(error);
          throw error;
        } finally {
          span.end();
        }
      });
    };

    return descriptor;
  };
}

/**
 * Cria um span manual
 *
 * @example
 * ```typescript
 * const span = createSpan('buscar-contato');
 * span.setAttribute('telefone', telefone);
 * try {
 *   const contato = await this.repo.find(...);
 *   span.setStatus({ code: SpanStatusCode.OK });
 *   return contato;
 * } catch (error) {
 *   span.setStatus({ code: SpanStatusCode.ERROR });
 *   span.recordException(error);
 *   throw error;
 * } finally {
 *   span.end();
 * }
 * ```
 */
export function createSpan(name: string, attributes?: Attributes): Span {
  const tracer = getTracer();
  return tracer.startSpan(name, { attributes });
}

/**
 * Executa função dentro de um span
 *
 * @example
 * ```typescript
 * await withSpan('processar-webhook', async (span) => {
 *   span.setAttribute('webhook.tipo', tipo);
 *   // ... código
 * });
 * ```
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Attributes,
): Promise<T> {
  const tracer = getTracer();

  return await tracer.startActiveSpan(name, { attributes }, async (span: Span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Adiciona atributos ao span ativo OU a um span específico
 */
export function addAttributes(spanOrAttributes: Span | Attributes, attributes?: Attributes): void {
  // Se primeiro parâmetro é Span, usar ele
  if (attributes && typeof (spanOrAttributes as Span).setAttribute === 'function') {
    const span = spanOrAttributes as Span;
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  } else {
    // Se não, usar span ativo
    const span = trace.getActiveSpan();
    if (span) {
      Object.entries(spanOrAttributes as Attributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
    }
  }
}

/**
 * Adiciona evento ao span ativo OU a um span específico
 */
export function addEvent(
  nameOrSpan: string | Span,
  nameOrAttributes?: string | Attributes,
  attributes?: Attributes,
): void {
  if (typeof nameOrSpan === 'object' && typeof (nameOrSpan as Span).addEvent === 'function') {
    // Span específico fornecido
    const span = nameOrSpan as Span;
    span.addEvent(nameOrAttributes as string, attributes);
  } else {
    // Usar span ativo
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent(nameOrSpan as string, nameOrAttributes as Attributes);
    }
  }
}

/**
 * Registra exceção no span ativo OU em um span específico
 */
export function recordException(spanOrError: Span | Error, error?: Error): void {
  if (error && typeof (spanOrError as Span).recordException === 'function') {
    // Span específico fornecido
    const span = spanOrError as Span;
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  } else {
    // Usar span ativo
    const span = trace.getActiveSpan();
    if (span) {
      const err = spanOrError as Error;
      span.recordException(err);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err.message,
      });
    }
  }
}
