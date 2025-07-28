// Utility function to safely render any value in React JSX
// Prevents "Objects are not valid as a React child" errors

export const safeRender = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    // If it's an object, try to extract meaningful string representation
    if (value.hasOwnProperty('nome')) {
      return String(value.nome);
    }
    if (value.hasOwnProperty('name')) {
      return String(value.name);
    }
    if (value.hasOwnProperty('title')) {
      return String(value.title);
    }
    if (value.hasOwnProperty('toString') && typeof value.toString === 'function') {
      return value.toString();
    }
    // Last resort: stringify the object (should be avoided in production)
    console.warn('🚨 Object being rendered directly:', value);
    return JSON.stringify(value);
  }

  return String(value);
};

export const safeRenderContact = (contato: any): { nome: string; email: string; telefone: string } => {
  if (!contato || typeof contato !== 'object') {
    console.error('❌ Invalid contact object:', contato);
    return { nome: '', email: '', telefone: '' };
  }

  return {
    nome: typeof contato.nome === 'string' ? contato.nome : String(contato.nome || ''),
    email: typeof contato.email === 'string' ? contato.email : String(contato.email || ''),
    telefone: typeof contato.telefone === 'string' ? contato.telefone : String(contato.telefone || ''),
  };
};

export const validateAndSanitizeContact = (contato: any): any => {
  if (!contato || typeof contato !== 'object') {
    console.error('❌ Invalid contact data:', contato);
    return null;
  }

  const sanitized = { ...contato };

  // Ensure all string properties are actually strings
  const stringFields = ['id', 'nome', 'email', 'telefone', 'documento', 'status', 'empresa', 'cargo'];

  stringFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'object') {
      console.warn(`🚨 Object found in ${field}:`, sanitized[field]);
      sanitized[field] = String(sanitized[field].toString ? sanitized[field].toString() : JSON.stringify(sanitized[field]));
    } else if (sanitized[field] !== null && sanitized[field] !== undefined) {
      sanitized[field] = String(sanitized[field]);
    } else {
      sanitized[field] = '';
    }
  });

  return sanitized;
};
