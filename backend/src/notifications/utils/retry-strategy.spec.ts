import { notificationRetryStrategy } from './retry-strategy';
import { RetryDecision } from './retry-strategy';

describe('notificationRetryStrategy', () => {
  const originalRandom = Math.random;

  afterEach(() => {
    Math.random = originalRandom;
  });

  it('deve retornar attempts=1 e sem backoff para 4xx != 429', () => {
    const result: RetryDecision = notificationRetryStrategy({ statusCode: 400 });
    expect(result.attempts).toBe(1);
    expect(result.backoff).toEqual({ type: 'fixed', delay: 0 });
  });

  it('deve respeitar Retry-After em 429 (cap 2min) aplicando jitter', () => {
    Math.random = () => 0.5; // jitter determinístico
    const retryAfterMs = 3000; // abaixo do cap
    const result: RetryDecision = notificationRetryStrategy({ statusCode: 429, retryAfterMs });
    expect(result.attempts).toBe(5);
    // jitter de 20% em 3000 com random 0.5 gera delay ~3000ms
    expect(result.backoff.type).toBe('fixed');
    expect(result.backoff.delay).toBe(3000);
  });

  it('deve aplicar backoff exponencial com jitter para 5xx/timeouts', () => {
    Math.random = () => 0.5; // jitter determinístico
    const result: RetryDecision = notificationRetryStrategy({ statusCode: 503 });
    expect(result.attempts).toBe(5);
    expect(result.backoff.type).toBe('exponential');
    // base 5000 com jitter 20% e random 0.5 => ~5000ms
    expect(result.backoff.delay).toBe(5000);
  });
});
