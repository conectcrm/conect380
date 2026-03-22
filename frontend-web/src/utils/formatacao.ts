/**
 * Utilitários para formatação de valores monetários e outros dados
 */

/**
 * Formata um valor monetário completo com símbolo R$
 * @param valor - Valor a ser formatado
 * @returns String formatada como "R$ 1.234,56"
 */
export const formatarValorCompletoBRL = (valor: any): string => {
  try {
    const numeroValor = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
    return numeroValor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    console.warn('Erro ao formatar valor completo BRL:', valor, error);
    return 'R$ 0,00';
  }
};

/**
 * Formata um valor monetário garantindo que seja sempre um número válido
 * @param valor - Valor a ser formatado (pode ser number, string ou qualquer tipo)
 * @param decimais - Número de casas decimais (padrão: 2)
 * @returns String formatada como "0,00"
 */
export const formatarValorMonetario = (valor: any, decimais: number = 2): string => {
  try {
    // Se o valor já é um número válido, usa diretamente
    if (typeof valor === 'number' && !isNaN(valor)) {
      return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: decimais,
        maximumFractionDigits: decimais,
      });
    }

    // Se é string, tenta converter
    if (typeof valor === 'string') {
      // Remove caracteres não numéricos exceto ponto e vírgula
      const valorLimpo = valor.replace(/[^\d.,-]/g, '');
      const numeroValor = parseFloat(valorLimpo.replace(',', '.')) || 0;
      return numeroValor.toLocaleString('pt-BR', {
        minimumFractionDigits: decimais,
        maximumFractionDigits: decimais,
      });
    }

    // Para outros tipos, tenta converter para number
    const numeroValor = parseFloat(valor) || 0;
    return numeroValor.toLocaleString('pt-BR', {
      minimumFractionDigits: decimais,
      maximumFractionDigits: decimais,
    });
  } catch (error) {
    console.warn('Erro ao formatar valor monetário:', valor, error);
    return '0,00';
  }
};

/**
 * Converte um valor string para number de forma segura
 * @param valor - Valor a ser convertido
 * @returns Número válido ou 0
 */
export const converterParaNumero = (valor: any): number => {
  try {
    if (typeof valor === 'number' && !isNaN(valor)) {
      return valor;
    }

    if (typeof valor === 'string') {
      const valorLimpo = valor.replace(/[^\d.,-]/g, '').replace(',', '.');
      const numero = parseFloat(valorLimpo);
      return isNaN(numero) ? 0 : numero;
    }

    const numero = parseFloat(valor);
    return isNaN(numero) ? 0 : numero;
  } catch (error) {
    console.warn('Erro ao converter para número:', valor, error);
    return 0;
  }
};

/**
 * Formata um valor monetário usando a moeda BRL
 * @param valor - Valor a ser formatado
 * @param opcoes - Opções extras para Intl.NumberFormat
 * @returns String formatada como "R$ 1.234,56"
 */
export const formatarMoeda = (valor: any, opcoes: Intl.NumberFormatOptions = {}): string => {
  try {
    const numero = converterParaNumero(valor);
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...opcoes,
    });
  } catch (error) {
    console.warn('Erro ao formatar moeda:', valor, error);
    return 'R$ 0,00';
  }
};

/**
 * Valida se um valor é um número monetário válido
 * @param valor - Valor a ser validado
 * @returns true se for válido, false caso contrário
 */
export const validarValorMonetario = (valor: any): boolean => {
  try {
    const numero = converterParaNumero(valor);
    return numero >= 0 && isFinite(numero);
  } catch (error) {
    return false;
  }
};

/**
 * Formata uma data para o formato brasileiro
 * @param data - Data a ser formatada (Date, string ou timestamp)
 * @param incluirHora - Se deve incluir hora (padrão: false)
 * @returns String formatada como "dd/mm/aaaa" ou "dd/mm/aaaa hh:mm"
 */
export const formatarData = (
  data: Date | string | number,
  incluirHora: boolean = false,
): string => {
  try {
    let dataObj: Date;

    if (data instanceof Date) {
      dataObj = data;
    } else if (typeof data === 'string') {
      dataObj = new Date(data);
    } else if (typeof data === 'number') {
      dataObj = new Date(data);
    } else {
      return '';
    }

    if (isNaN(dataObj.getTime())) {
      return '';
    }

    const opcoes: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };

    if (incluirHora) {
      opcoes.hour = '2-digit';
      opcoes.minute = '2-digit';
    }

    return dataObj.toLocaleDateString('pt-BR', opcoes);
  } catch (error) {
    console.warn('Erro ao formatar data:', data, error);
    return '';
  }
};

/**
 * Calcula a diferença em dias entre duas datas
 * @param dataVencimento - Data de vencimento
 * @param dataReferencia - Data de referência (padrão: hoje)
 * @returns Número de dias (positivo = futuro, negativo = passado)
 */
export const calcularDiasVencimento = (
  dataVencimento: Date | string,
  dataReferencia?: Date,
): number => {
  try {
    const vencimento = new Date(dataVencimento);
    const referencia = dataReferencia || new Date();

    // Remove a parte de hora para comparar apenas as datas
    vencimento.setHours(0, 0, 0, 0);
    referencia.setHours(0, 0, 0, 0);

    const diffTime = vencimento.getTime() - referencia.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.warn('Erro ao calcular dias de vencimento:', error);
    return 0;
  }
};

/**
 * Formata o status de uma fatura com cor e ícone apropriados
 * @param status - Status da fatura
 * @param diasVencimento - Dias para vencimento (opcional)
 * @returns Objeto com cor, texto e ícone
 */
export const formatarStatusFatura = (status: string, diasVencimento?: number) => {
  const statusMap: Record<string, { cor: string; texto: string; icone: string }> = {
    PENDENTE: {
      cor:
        diasVencimento !== undefined && diasVencimento < 0
          ? 'text-red-600'
          : diasVencimento !== undefined && diasVencimento <= 7
            ? 'text-yellow-600'
            : 'text-yellow-600',
      texto: 'Pendente',
      icone: '⏳',
    },
    ENVIADA: { cor: 'text-blue-600', texto: 'Enviada', icone: '📤' },
    PAGA: { cor: 'text-green-600', texto: 'Paga', icone: '✅' },
    VENCIDA: { cor: 'text-red-600', texto: 'Vencida', icone: '⚠️' },
    CANCELADA: { cor: 'text-gray-600', texto: 'Cancelada', icone: '❌' },
    PARCIALMENTE_PAGA: { cor: 'text-orange-600', texto: 'Parcial', icone: '🔄' },
  };

  return statusMap[status] || { cor: 'text-gray-600', texto: status, icone: '📄' };
};

/**
 * Formata um número de fatura
 * @param numero - Número da fatura
 * @returns String formatada
 */
export const formatarNumeroFatura = (numero: string): string => {
  if (!numero) return '';

  // Se já tem prefixo, retorna como está
  if (numero.startsWith('#') || numero.startsWith('FT')) {
    return numero;
  }

  // Se é só número, adiciona prefixo FT
  if (/^\d+$/.test(numero)) {
    return `FT${numero.padStart(8, '0')}`;
  }

  return numero;
};

/**
 * Trunca um texto mantendo palavras inteiras
 * @param texto - Texto a ser truncado
 * @param limite - Limite de caracteres
 * @returns Texto truncado
 */
export const truncarTexto = (texto: string, limite: number = 50): string => {
  if (!texto || texto.length <= limite) {
    return texto || '';
  }

  const truncado = texto.substring(0, limite);
  const ultimoEspaco = truncado.lastIndexOf(' ');

  if (ultimoEspaco > 0) {
    return truncado.substring(0, ultimoEspaco) + '...';
  }

  return truncado + '...';
};

/**
 * Formata um valor com destaque visual
 * @param valor - Valor a ser formatado
 * @param tipo - Tipo de destaque ('positivo', 'negativo', 'neutro')
 * @returns Objeto com valor formatado e classe CSS
 */
export const formatarValorComDestaque = (
  valor: number,
  tipo: 'positivo' | 'negativo' | 'neutro' = 'neutro',
) => {
  const valorFormatado = formatarValorCompletoBRL(valor);

  const classesMap = {
    positivo: 'text-green-600 font-semibold',
    negativo: 'text-red-600 font-semibold',
    neutro: 'text-gray-900 font-medium',
  };

  return {
    valor: valorFormatado,
    classe: classesMap[tipo],
  };
};

/**
 * Converte bytes para formato legível
 * @param bytes - Número de bytes
 * @returns String formatada (ex: "1.5 MB")
 */
export const formatarTamanhoArquivo = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Gera uma cor baseada em uma string (para avatars, etc.)
 * @param texto - Texto base para gerar a cor
 * @returns Cor em formato hex
 */
export const gerarCorPorTexto = (texto: string): string => {
  if (!texto) return '#6B7280';

  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  }

  const cores = [
    '#EF4444',
    '#F97316',
    '#F59E0B',
    '#EAB308',
    '#84CC16',
    '#22C55E',
    '#10B981',
    '#14B8A6',
    '#06B6D4',
    '#0EA5E9',
    '#3B82F6',
    '#6366F1',
    '#8B5CF6',
    '#A855F7',
    '#D946EF',
    '#EC4899',
  ];

  return cores[Math.abs(hash) % cores.length];
};

/**
 * Extrai o nome do cliente de forma segura
 * @param cliente - Objeto cliente (pode ser object, string ou null/undefined)
 * @param clienteId - ID do cliente como fallback
 * @returns Nome do cliente ou fallback
 */
export const obterNomeCliente = (cliente: any, clienteId?: number | string): string => {
  // Se cliente é um objeto com propriedade nome
  if (cliente && typeof cliente === 'object' && cliente.nome) {
    return cliente.nome;
  }

  // Se cliente é uma string (nome direto)
  if (typeof cliente === 'string' && cliente.trim()) {
    return cliente.trim();
  }

  // Fallback para ID do cliente
  if (clienteId) {
    return `Cliente ID: ${clienteId}`;
  }

  return 'Cliente não informado';
};

/**
 * Extrai o email do cliente de forma segura
 * @param cliente - Objeto cliente
 * @returns Email do cliente ou null
 */
export const obterEmailCliente = (cliente: any): string | null => {
  if (cliente && typeof cliente === 'object' && cliente.email) {
    return cliente.email;
  }
  return null;
};
