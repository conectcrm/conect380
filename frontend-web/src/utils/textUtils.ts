// Utilitários para formatação e sanitização de texto
export const sanitizeText = (text: string | undefined): string => {
  if (!text) return '';

  // Substitui caracteres com problemas de encoding
  return text
    .replace(/F\?\?nix/g, 'Fênix')
    .replace(/[^\w\s\-àáâãäèéêëìíîïòóôõöùúûüçÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇ]/g, '')
    .trim();
};

// Formatação específica para nome da empresa
export const formatCompanyName = (companyName: string | undefined): string => {
  const sanitized = sanitizeText(companyName);

  // Se for a empresa demo, usar um nome limpo
  if (sanitized.includes('Empresa Demo') || sanitized.includes('??nix')) {
    return 'Fênix CRM Demo';
  }

  return sanitized;
};

// Formatação para nomes de usuário
export const formatUserName = (userName: string | undefined): string => {
  return sanitizeText(userName);
};
