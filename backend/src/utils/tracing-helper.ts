/**
 * 🔍 Tracing Helper Utilities
 * 
 * Funções auxiliares para criar spans customizados em operações críticas.
 * Facilita o debug de lógica de negócio complexa.
 */

import { trace, SpanStatusCode, Span, Tracer, context } from '@opentelemetry/api';

/**
 * Obter tracer do serviço
 */
export const getTracer = (): Tracer => {
  return trace.getTracer('conectcrm-backend');
};

/**
 * Criar um span customizado para operação
 * 
 * @example
 * await withSpan('Processar Ticket', async () => {
 *   // sua lógica aqui
 * }, { ticketId: '123', priority: 'high' });
 */
export async function withSpan<T>(
  operationName: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  const tracer = getTracer();

  return tracer.startActiveSpan(operationName, async (span) => {
    try {
      // Adicionar atributos customizados
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      // Executar operação
      const result = await fn(span);

      // Marcar como sucesso
      span.setStatus({ code: SpanStatusCode.OK });

      return result;
    } catch (error) {
      // Registrar erro no span
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });

      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Adicionar evento ao span ativo
 * Útil para marcar pontos importantes na execução
 * 
 * @example
 * addEvent('Ticket criado', { ticketId: '123' });
 */
export function addEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Adicionar atributo ao span ativo
 * 
 * @example
 * addAttribute('user.id', userId);
 */
export function addAttribute(key: string, value: string | number | boolean): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}

/**
 * Decorator para métodos de classe (experimental)
 * 
 * @example
 * @TraceMethod('ProcessarMensagem')
 * async processarMensagem(data: any) { ... }
 */
export function TraceMethod(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const spanName = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return withSpan(
        spanName,
        async (span) => {
          // Adicionar contexto do método
          span.setAttribute('method', propertyKey);
          span.setAttribute('class', target.constructor.name);

          return originalMethod.apply(this, args);
        },
      );
    };

    return descriptor;
  };
}
