import * as XLSX from 'xlsx';

export interface ExportColumn {
  key: string;
  label: string;
  transform?: (value: any) => string | number;
  format?: (value: any) => string | number;
}

// Função para formatar data para exportação
export const formatDateForExport = (date: string | Date): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

// Função para formatar status para exportação
export const formatStatusForExport = (status: boolean): string => {
  return status ? 'Ativo' : 'Inativo';
};

// Função para formatar telefone
export const formatPhoneForExport = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
  return phone;
};

// Função para formatar CNPJ/CPF
export const formatDocumentForExport = (document: string): string => {
  if (!document) return '';
  const cleaned = document.replace(/\D/g, '');
  if (cleaned.length === 14) {
    // CNPJ
    return `${cleaned.substring(0, 2)}.${cleaned.substring(2, 5)}.${cleaned.substring(5, 8)}/${cleaned.substring(8, 12)}-${cleaned.substring(12)}`;
  } else if (cleaned.length === 11) {
    // CPF
    return `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-${cleaned.substring(9)}`;
  }
  return document;
};

// Função para exportar dados para CSV
export const exportToCSV = (
  data: any[],
  columns: ExportColumn[],
  filename: string = 'export',
): void => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  // Criar cabeçalho
  const headers = columns.map((col) => col.label);

  // Processar dados
  const processedData = data.map((item) => {
    return columns.map((col) => {
      const value = getNestedValue(item, col.key);
      const formatter = col.transform ?? col.format;
      return formatter ? formatter(value) : value || '';
    });
  });

  // Combinar cabeçalho com dados
  const csvContent = [headers, ...processedData]
    .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // Adicionar BOM para suporte a UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Função para exportar dados para Excel
export const exportToExcel = (
  data: any[],
  columns: ExportColumn[],
  filename: string = 'export',
  sheetName: string = 'Dados',
): void => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  // Processar dados
  const processedData = data.map((item) => {
    const row: { [key: string]: any } = {};
    columns.forEach((col) => {
      const value = getNestedValue(item, col.key);
      const formatter = col.transform ?? col.format;
      row[col.label] = formatter ? formatter(value) : value || '';
    });
    return row;
  });

  // Criar workbook e worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(processedData);

  // Ajustar largura das colunas
  const colWidths = columns.map((col) => ({
    wch: Math.max(col.label.length, 15),
  }));
  ws['!cols'] = colWidths;

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Download
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Função auxiliar para obter valores aninhados de objetos
const getNestedValue = (obj: any, path: string): any => {
  if (!obj || !path) return '';

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return '';
    }
  }

  return current;
};

// Função para gerar nome de arquivo com timestamp
export const generateFilenameWithTimestamp = (baseName: string): string => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
  return `${baseName}_${timestamp}`;
};

// Função para validar dados antes da exportação
export const validateExportData = (data: any[]): boolean => {
  return Array.isArray(data) && data.length > 0;
};

// Função para preparar dados de fornecedores para exportação
export const prepareFornecedoresForExport = (fornecedores: any[]): ExportColumn[] => {
  return [
    { key: 'id', label: 'ID' },
    { key: 'nome', label: 'Nome' },
    { key: 'razaoSocial', label: 'Razão Social' },
    { key: 'cnpj', label: 'CNPJ', transform: formatDocumentForExport },
    { key: 'cpf', label: 'CPF', transform: formatDocumentForExport },
    { key: 'email', label: 'E-mail' },
    { key: 'telefone', label: 'Telefone', transform: formatPhoneForExport },
    { key: 'endereco', label: 'Endereço' },
    { key: 'numero', label: 'Número' },
    { key: 'bairro', label: 'Bairro' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'estado', label: 'Estado' },
    { key: 'cep', label: 'CEP' },
    { key: 'contato', label: 'Contato' },
    { key: 'ativo', label: 'Status', transform: formatStatusForExport },
    { key: 'criadoEm', label: 'Data de Cadastro', transform: formatDateForExport },
    { key: 'atualizadoEm', label: 'Última Atualização', transform: formatDateForExport },
  ];
};

export default {
  exportToCSV,
  exportToExcel,
  formatDateForExport,
  formatStatusForExport,
  formatPhoneForExport,
  formatDocumentForExport,
  generateFilenameWithTimestamp,
  validateExportData,
  prepareFornecedoresForExport,
};
