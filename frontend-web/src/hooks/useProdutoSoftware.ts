/**
 * Hook para gerenciar produtos de software com campos dinâmicos
 * Adapta automaticamente a interface baseado no tipo de produto
 */
import { useEffect, useState } from 'react';

export interface CamposDinamicos {
  // Campos de estoque (ocultos para software)
  mostrarEstoque: boolean;
  mostrarQuantidade: boolean;
  
  // Campos específicos de software
  mostrarLicenciamento: boolean;
  mostrarRenovacao: boolean;
  
  // Labels dinâmicos
  labelQuantidade: string;
  labelUnidade: string;
  
  // Validações
  quantidadeObrigatoria: boolean;
  licenciamentoObrigatorio: boolean;
  
  // Mensagens e tooltips
  tooltipInfo: string;
  alertaEspecial: string;
}

export interface TipoLicenciamento {
  value: string;
  label: string;
  descricao: string;
}

export interface PeriodicidadeLicenca {
  value: string;
  label: string;
  descricao: string;
}

// Constantes para licenciamento
export const TIPOS_LICENCIAMENTO: TipoLicenciamento[] = [
  { 
    value: 'usuario', 
    label: 'Usuário', 
    descricao: 'Licença individual por usuário ativo' 
  },
  { 
    value: 'dispositivo', 
    label: 'Dispositivo', 
    descricao: 'Licença vinculada a um dispositivo específico' 
  },
  { 
    value: 'mensal', 
    label: 'Mensal', 
    descricao: 'Licenciamento com cobrança mensal' 
  },
  { 
    value: 'anual', 
    label: 'Anual', 
    descricao: 'Licenciamento com cobrança anual' 
  },
  { 
    value: 'vitalicio', 
    label: 'Vitalício', 
    descricao: 'Licença sem vencimento' 
  }
];

export const PERIODICIDADES_LICENCA: PeriodicidadeLicenca[] = [
  { 
    value: 'mensal', 
    label: 'Mensal', 
    descricao: 'Renovação todo mês' 
  },
  { 
    value: 'anual', 
    label: 'Anual', 
    descricao: 'Renovação anual' 
  },
  { 
    value: 'unica', 
    label: 'Única', 
    descricao: 'Licença sem renovação necessária' 
  }
];

export const useProdutoSoftware = (tipoItem: string, tipo?: string) => {
  const [campos, setCampos] = useState<CamposDinamicos>({
    mostrarEstoque: true,
    mostrarQuantidade: true,
    mostrarLicenciamento: false,
    mostrarRenovacao: false,
    labelQuantidade: 'Quantidade',
    labelUnidade: 'Unidade',
    quantidadeObrigatoria: true,
    licenciamentoObrigatorio: false,
    tooltipInfo: '',
    alertaEspecial: ''
  });

  // Detectar se é produto de software - usando ambas as formas para compatibilidade
  const isSoftware = tipo === 'software' || ['licenca', 'modulo', 'aplicativo'].includes(tipoItem);

  useEffect(() => {
    if (isSoftware) {
      // 🚀 Configuração para produtos de software
      setCampos({
        // 1. Ocultar campos relacionados ao estoque físico
        mostrarEstoque: false,
        mostrarQuantidade: true, // Mantém, mas muda o label
        
        // 2. Exibir campos específicos de software
        mostrarLicenciamento: true,
        mostrarRenovacao: true,
        
        // 3. Labels adaptados
        labelQuantidade: 'Quantidade de Licenças',
        labelUnidade: 'Licenças',
        
        // 4. Validações específicas
        quantidadeObrigatoria: true,
        licenciamentoObrigatorio: true,
        
        // 5. Informações explicativas
        tooltipInfo: 'Para produtos de software, a proposta será baseada no número de licenças e não em unidades físicas.',
        alertaEspecial: '💡 Produto de Software: Configure o tipo de licenciamento e periodicidade para vendas mais precisas.'
      });
    } else {
      // Configuração padrão para produtos físicos
      setCampos({
        mostrarEstoque: true,
        mostrarQuantidade: true,
        mostrarLicenciamento: false,
        mostrarRenovacao: false,
        labelQuantidade: 'Quantidade',
        labelUnidade: 'Unidade',
        quantidadeObrigatoria: true,
        licenciamentoObrigatorio: false,
        tooltipInfo: '',
        alertaEspecial: ''
      });
    }
  }, [tipoItem, isSoftware]);

  return {
    campos,
    isSoftware,
    TIPOS_LICENCIAMENTO,
    PERIODICIDADES_LICENCA
  };
};

// Utilitários para validação
export const validarProdutoSoftware = (dados: any, isSoftware: boolean) => {
  const erros: string[] = [];

  if (isSoftware) {
    // Validações específicas para software
    if (!dados.tipoLicenciamento) {
      erros.push('Tipo de licenciamento é obrigatório para produtos de software');
    }
    
    if (!dados.periodicidadeLicenca) {
      erros.push('Periodicidade da licença é obrigatória para produtos de software');
    }
    
    if (dados.quantidadeLicencas && dados.quantidadeLicencas <= 0) {
      erros.push('Quantidade de licenças deve ser maior que zero');
    }
    
    // Validar combinações específicas
    if (dados.tipoLicenciamento === 'site' && dados.quantidadeLicencas > 1) {
      erros.push('Site License não permite múltiplas quantidades');
    }
  }

  return {
    valido: erros.length === 0,
    erros
  };
};

// Utilitário para calcular preço de software
export const calcularPrecoSoftware = (
  precoBase: number,
  quantidade: number,
  tipoLicenciamento: string,
  periodicidade: string
) => {
  let multiplicador = 1;
  
  // Ajuste por tipo de licenciamento
  switch (tipoLicenciamento) {
    case 'vitalicio':
      multiplicador = quantidade * 3; // 3x o preço para vitalício
      break;
    case 'anual':
      multiplicador = quantidade * 0.8; // Desconto para anual
      break;
    case 'mensal':
      multiplicador = quantidade * 1.2; // Premium para mensal
      break;
    case 'usuario':
      multiplicador = quantidade;
      break;
    case 'dispositivo':
      multiplicador = quantidade * 1.1; // Pequeno premium para dispositivo
      break;
    default:
      multiplicador = quantidade;
  }
  
  // Ajuste por periodicidade
  let fatorPeriodicidade = 1;
  switch (periodicidade) {
    case 'mensal': 
      fatorPeriodicidade = 1; 
      break;
    case 'anual': 
      fatorPeriodicidade = 10; // 10 meses pelo preço de 12
      break;
    case 'unica': 
      fatorPeriodicidade = 24; // Equivale a 2 anos
      break;
    default: 
      fatorPeriodicidade = 1;
  }
  
  return precoBase * multiplicador * fatorPeriodicidade;
};
