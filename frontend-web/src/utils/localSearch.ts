export const normalizeSearchValue = (value: string | number | null | undefined): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const matchesLocalSearchTerm = (
  normalizedSearchTerm: string,
  fields: Array<string | number | null | undefined>,
): boolean => {
  if (!normalizedSearchTerm) {
    return true;
  }

  return fields.some((field) => normalizeSearchValue(field).includes(normalizedSearchTerm));
};
