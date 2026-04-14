const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const startOfLocalDay = (value: Date = new Date()): Date =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

export const parseDateToLocalDay = (value: string | Date): Date => {
  if (value instanceof Date) {
    return startOfLocalDay(value);
  }

  const raw = String(value || '').trim();
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    return new Date(year, month, day);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(Number.NaN);
  }
  return startOfLocalDay(parsed);
};

export const diffInLocalDays = (dateA: string | Date, dateB: string | Date): number => {
  const dayA = parseDateToLocalDay(dateA);
  const dayB = parseDateToLocalDay(dateB);

  if (Number.isNaN(dayA.getTime()) || Number.isNaN(dayB.getTime())) {
    return 0;
  }

  return Math.ceil((dayA.getTime() - dayB.getTime()) / DAY_IN_MS);
};

export const daysUntilDate = (value: string | Date): number => diffInLocalDays(value, new Date());

export const isBeforeTodayLocal = (value: string | Date): boolean =>
  parseDateToLocalDay(value).getTime() < startOfLocalDay().getTime();
