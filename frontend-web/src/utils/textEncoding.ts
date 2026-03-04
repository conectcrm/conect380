const MOJIBAKE_PATTERN = /(?:\u00c3.|\u00c2.|\u00e2.|\u00f0\u0178|\ufffd)/;

export const normalizeMojibakeText = (value: string): string => {
  if (!value || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8').decode(bytes);

    if (!decoded) {
      return value;
    }

    const noiseCount = (text: string) => (text.match(/[\u00c3\u00c2\u00e2\ufffd]/g) || []).length;

    return noiseCount(decoded) < noiseCount(value) ? decoded : value;
  } catch {
    return value;
  }
};

export const normalizeOptionalMojibakeText = (value?: string | null): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  return normalizeMojibakeText(value);
};

