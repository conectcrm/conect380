/**
 * 🚀 Configuração de Campos para Produtos de Software
 * Define todos os campos específicos que aparecem quando produto.tipo === "software"
 */

export interface CampoSoftware {
  tipo: "number" | "select" | "checkbox" | "text";
  label: string;
  obrigatorio?: boolean;
  opcoes?: string[];
  descricao?: string;
}

export interface CamposSoftwareConfig {
  [key: string]: CampoSoftware;
}

// 🚀 Campos adicionais para produtos do tipo "software":
// Esses campos devem aparecer apenas quando produto.tipo === "software"
export const camposSoftware: CamposSoftwareConfig = {
  quantidadeLicencas: {
    tipo: "number",
    label: "Quantidade de Licenças",
    obrigatorio: true,
    descricao: "Número de licenças incluídas neste produto"
  },
  tipoLicenciamento: {
    tipo: "select",
    label: "Tipo de Licenciamento",
    opcoes: ["Usuário", "Dispositivo", "Mensal", "Anual", "Vitalício"],
    obrigatorio: true,
    descricao: "Modelo de licenciamento do software"
  },
  periodicidadeLicenca: {
    tipo: "select",
    label: "Periodicidade da Licença",
    opcoes: ["Mensal", "Anual", "Única"],
    descricao: "Frequência de renovação da licença"
  },
  renovacaoAutomatica: {
    tipo: "checkbox",
    label: "Renovação Automática",
    descricao: "Licença será renovada automaticamente no vencimento"
  }
};

// Função para obter configuração de um campo específico
export const getCampoSoftware = (nomeCampo: string): CampoSoftware | undefined => {
  return camposSoftware[nomeCampo];
};

// Função para verificar se um campo é obrigatório
export const isCampoObrigatorio = (nomeCampo: string): boolean => {
  const campo = getCampoSoftware(nomeCampo);
  return campo?.obrigatorio || false;
};

// Função para obter todas as opções de um campo select
export const getOpcoesCampo = (nomeCampo: string): string[] => {
  const campo = getCampoSoftware(nomeCampo);
  return campo?.opcoes || [];
};

// Função para validar se um produto precisa dos campos de software
export const precisaCamposSoftware = (produto: any): boolean => {
  return produto.tipo === "software" || 
         ['licenca', 'modulo', 'aplicativo'].includes(produto.tipoItem);
};

// Função para obter todos os campos obrigatórios para software
export const getCamposObrigatoriosSoftware = (): string[] => {
  return Object.entries(camposSoftware)
    .filter(([_, config]) => config.obrigatorio)
    .map(([nome, _]) => nome);
};

// Função para validar dados de software
export const validarDadosSoftware = (dados: any): { valido: boolean; erros: string[] } => {
  const erros: string[] = [];
  
  if (!precisaCamposSoftware(dados)) {
    return { valido: true, erros: [] };
  }
  
  // Validar campos obrigatórios
  const camposObrigatorios = getCamposObrigatoriosSoftware();
  
  camposObrigatorios.forEach(campo => {
    if (!dados[campo] || dados[campo] === '' || dados[campo] === 0) {
      const config = getCampoSoftware(campo);
      erros.push(`${config?.label} é obrigatório para produtos de software`);
    }
  });
  
  // Validações específicas
  if (dados.quantidadeLicencas && dados.quantidadeLicencas <= 0) {
    erros.push('Quantidade de licenças deve ser maior que zero');
  }
  
  if (dados.tipoLicenciamento === 'Vitalício' && dados.periodicidadeLicenca !== 'Única') {
    erros.push('Licenças vitalícias devem ter periodicidade "Única"');
  }
  
  return {
    valido: erros.length === 0,
    erros
  };
};

export default camposSoftware;
