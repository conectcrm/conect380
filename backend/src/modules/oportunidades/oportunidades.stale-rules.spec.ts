import {
  calculateStaleDays,
  isOportunidadeStale,
  normalizeStaleThresholdDays,
} from './oportunidades.service';

describe('Oportunidades stale rules', () => {
  it('normaliza janela stale com limites seguros', () => {
    expect(normalizeStaleThresholdDays(undefined, 30)).toBe(30);
    expect(normalizeStaleThresholdDays('2', 30)).toBe(7);
    expect(normalizeStaleThresholdDays(999, 30)).toBe(365);
    expect(normalizeStaleThresholdDays('45', 30)).toBe(45);
  });

  it('calcula dias de inatividade com base na data de referencia', () => {
    const reference = new Date('2026-03-06T12:00:00.000Z');
    expect(calculateStaleDays('2026-03-05T12:00:00.000Z', reference)).toBe(1);
    expect(calculateStaleDays('2026-03-06T12:00:00.000Z', reference)).toBe(0);
    expect(calculateStaleDays('data-invalida', reference)).toBe(0);
  });

  it('marca oportunidade como stale apenas quando ultrapassa o limite', () => {
    const reference = new Date('2026-03-06T12:00:00.000Z');
    const lastInteraction = '2026-02-01T12:00:00.000Z';

    expect(isOportunidadeStale(lastInteraction, 30, reference)).toBe(true);
    expect(isOportunidadeStale(lastInteraction, 40, reference)).toBe(false);
    expect(isOportunidadeStale(null, 30, reference)).toBe(false);
  });
});

