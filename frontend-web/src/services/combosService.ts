// Serviço para gerenciamento de combos de produtos
import { ProdutoPropostaBase } from '../shared/produtosAdapter';

export interface ProdutoCombo {
  produto: ProdutoPropostaBase;
  quantidade: number;
}

export interface Combo {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  precoOriginal: number;
  precoCombo: number;
  desconto: number;
  produtos: ProdutoCombo[];
  status: 'ativo' | 'inativo' | 'rascunho';
  dataCreacao: Date;
  dataAtualizacao: Date;
  tags?: string[];
  validadeInicio?: Date;
  validadeFim?: Date;
  condicoes?: string;
}

export interface ComboFormData {
  nome: string;
  descricao: string;
  categoria: string;
  produtos: ProdutoCombo[];
  descontoPercentual?: number;
  precoFixo?: number;
  tipoDesconto: 'percentual' | 'fixo';
  status: 'ativo' | 'inativo' | 'rascunho';
  tags?: string[];
  validadeInicio?: Date;
  validadeFim?: Date;
  condicoes?: string;
}

export interface ComboEstatisticas {
  totalCombos: number;
  combosAtivos: number;
  vendasMes: number;
  faturamentoMes: number;
  combosPopulares: Combo[];
}

// Mock de dados para desenvolvimento
const combosMock: Combo[] = [
  {
    id: '1',
    nome: 'Pacote Startup Digital',
    descricao: 'Solução completa para startups - Software Web + Consultoria inicial',
    categoria: 'Pacote Startup',
    precoOriginal: 899.0,
    precoCombo: 750.0,
    desconto: 16.6,
    status: 'ativo',
    dataCreacao: new Date('2024-01-15'),
    dataAtualizacao: new Date('2024-12-10'),
    tags: ['startup', 'digital', 'básico'],
    produtos: [
      {
        produto: {
          id: 'sw1',
          nome: 'Sistema Web Básico',
          preco: 499.0,
          categoria: 'Software',
          subcategoria: 'Sistema Web',
          tipo: 'Licença Básica',
          descricao: 'Sistema web básico com funcionalidades essenciais',
          unidade: 'licença/mês',
        },
        quantidade: 1,
      },
      {
        produto: {
          id: 'cons1',
          nome: 'Consultoria Júnior - 8h',
          preco: 400.0,
          categoria: 'Consultoria',
          subcategoria: 'Gestão Empresarial',
          tipo: 'Consultor Júnior',
          descricao: 'Consultoria inicial para implementação',
          unidade: 'hora',
        },
        quantidade: 8,
      },
    ],
  },
  {
    id: '2',
    nome: 'Pacote Empresarial Completo',
    descricao: 'Solução enterprise com múltiplas licenças, app mobile e treinamento',
    categoria: 'Pacote Enterprise',
    precoOriginal: 1799.0,
    precoCombo: 1499.0,
    desconto: 16.7,
    status: 'ativo',
    dataCreacao: new Date('2024-02-01'),
    dataAtualizacao: new Date('2024-12-10'),
    tags: ['enterprise', 'completo', 'premium'],
    produtos: [
      {
        produto: {
          id: 'sw2',
          nome: 'Sistema Web Premium',
          preco: 699.0,
          categoria: 'Software',
          subcategoria: 'Sistema Web',
          tipo: 'Licença Premium',
          descricao: 'Sistema web premium com recursos avançados',
          unidade: 'licença/mês',
        },
        quantidade: 2,
      },
      {
        produto: {
          id: 'sw3',
          nome: 'App Mobile',
          preco: 389.0,
          categoria: 'Software',
          subcategoria: 'App Mobile',
          tipo: 'Aplicativo',
          descricao: 'Aplicativo móvel nativo',
          unidade: 'licença/mês',
        },
        quantidade: 1,
      },
      {
        produto: {
          id: 'trei1',
          nome: 'Treinamento Liderança',
          preco: 1200.0,
          categoria: 'Treinamento',
          subcategoria: 'Liderança',
          tipo: 'Curso Avançado',
          descricao: 'Programa completo de liderança',
          unidade: 'curso',
        },
        quantidade: 1,
      },
    ],
  },
  {
    id: '3',
    nome: 'Pacote E-commerce Plus',
    descricao: 'E-commerce completo com consultoria especializada em marketing digital',
    categoria: 'Pacote E-commerce',
    precoOriginal: 979.0,
    precoCombo: 850.0,
    desconto: 13.2,
    status: 'ativo',
    dataCreacao: new Date('2024-03-01'),
    dataAtualizacao: new Date('2024-12-10'),
    tags: ['ecommerce', 'marketing', 'vendas'],
    produtos: [
      {
        produto: {
          id: 'sw5',
          nome: 'E-commerce Avançado',
          preco: 399.0,
          categoria: 'Software',
          subcategoria: 'E-commerce',
          tipo: 'Loja Avançada',
          descricao: 'Plataforma e-commerce completa',
          unidade: 'licença/mês',
        },
        quantidade: 1,
      },
      {
        produto: {
          id: 'cons3',
          nome: 'Consultoria Marketing Digital - 10h',
          preco: 580.0,
          categoria: 'Consultoria',
          subcategoria: 'Marketing Digital',
          tipo: 'Estratégia & Implementação',
          descricao: 'Consultoria especializada em marketing digital',
          unidade: 'hora',
        },
        quantidade: 10,
      },
    ],
  },
];

// Simulação de API
export const combosService = {
  // Listar todos os combos
  listarCombos: async (): Promise<Combo[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return combosMock;
  },

  // Buscar combo por ID
  buscarComboPorId: async (id: string): Promise<Combo | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return combosMock.find((combo) => combo.id === id) || null;
  },

  // Criar novo combo
  criarCombo: async (comboData: ComboFormData): Promise<Combo> => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Calcular preços
    const precoOriginal = comboData.produtos.reduce(
      (total, item) => total + item.produto.preco * item.quantidade,
      0,
    );

    let precoCombo: number;
    let desconto: number;

    if (comboData.tipoDesconto === 'percentual' && comboData.descontoPercentual) {
      precoCombo = precoOriginal * (1 - comboData.descontoPercentual / 100);
      desconto = comboData.descontoPercentual;
    } else if (comboData.tipoDesconto === 'fixo' && comboData.precoFixo) {
      precoCombo = comboData.precoFixo;
      desconto = ((precoOriginal - comboData.precoFixo) / precoOriginal) * 100;
    } else {
      precoCombo = precoOriginal;
      desconto = 0;
    }

    const novoCombo: Combo = {
      id: Date.now().toString(),
      nome: comboData.nome,
      descricao: comboData.descricao,
      categoria: comboData.categoria,
      precoOriginal,
      precoCombo,
      desconto,
      produtos: comboData.produtos,
      status: comboData.status,
      dataCreacao: new Date(),
      dataAtualizacao: new Date(),
      tags: comboData.tags,
      validadeInicio: comboData.validadeInicio,
      validadeFim: comboData.validadeFim,
      condicoes: comboData.condicoes,
    };

    combosMock.push(novoCombo);
    return novoCombo;
  },

  // Atualizar combo
  atualizarCombo: async (id: string, comboData: Partial<ComboFormData>): Promise<Combo> => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const index = combosMock.findIndex((combo) => combo.id === id);
    if (index === -1) {
      throw new Error('Combo não encontrado');
    }

    const comboExistente = combosMock[index];

    // Recalcular preços se produtos foram alterados
    let precoOriginal = comboExistente.precoOriginal;
    let precoCombo = comboExistente.precoCombo;
    let desconto = comboExistente.desconto;

    if (comboData.produtos) {
      precoOriginal = comboData.produtos.reduce(
        (total, item) => total + item.produto.preco * item.quantidade,
        0,
      );

      if (comboData.tipoDesconto === 'percentual' && comboData.descontoPercentual) {
        precoCombo = precoOriginal * (1 - comboData.descontoPercentual / 100);
        desconto = comboData.descontoPercentual;
      } else if (comboData.tipoDesconto === 'fixo' && comboData.precoFixo) {
        precoCombo = comboData.precoFixo;
        desconto = ((precoOriginal - comboData.precoFixo) / precoOriginal) * 100;
      }
    }

    const comboAtualizado: Combo = {
      ...comboExistente,
      ...comboData,
      precoOriginal,
      precoCombo,
      desconto,
      dataAtualizacao: new Date(),
    };

    combosMock[index] = comboAtualizado;
    return comboAtualizado;
  },

  // Excluir combo
  excluirCombo: async (id: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const index = combosMock.findIndex((combo) => combo.id === id);
    if (index === -1) {
      throw new Error('Combo não encontrado');
    }

    combosMock.splice(index, 1);
    return true;
  },

  // Buscar combos com filtros
  buscarCombos: async (filtros: {
    termo?: string;
    categoria?: string;
    status?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }): Promise<Combo[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    let resultado = [...combosMock];

    if (filtros.termo) {
      const termo = filtros.termo.toLowerCase();
      resultado = resultado.filter(
        (combo) =>
          combo.nome.toLowerCase().includes(termo) ||
          combo.descricao.toLowerCase().includes(termo) ||
          combo.categoria.toLowerCase().includes(termo) ||
          combo.tags?.some((tag) => tag.toLowerCase().includes(termo)),
      );
    }

    if (filtros.categoria) {
      resultado = resultado.filter((combo) => combo.categoria === filtros.categoria);
    }

    if (filtros.status) {
      resultado = resultado.filter((combo) => combo.status === filtros.status);
    }

    if (filtros.dataInicio) {
      resultado = resultado.filter((combo) => combo.dataCreacao >= filtros.dataInicio!);
    }

    if (filtros.dataFim) {
      resultado = resultado.filter((combo) => combo.dataCreacao <= filtros.dataFim!);
    }

    return resultado;
  },

  // Obter estatísticas
  obterEstatisticas: async (): Promise<ComboEstatisticas> => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const combosAtivos = combosMock.filter((combo) => combo.status === 'ativo');

    return {
      totalCombos: combosMock.length,
      combosAtivos: combosAtivos.length,
      vendasMes: Math.floor(Math.random() * 50) + 10, // Simulado
      faturamentoMes: Math.floor(Math.random() * 50000) + 10000, // Simulado
      combosPopulares: combosAtivos.slice(0, 3),
    };
  },

  // Duplicar combo
  duplicarCombo: async (id: string): Promise<Combo> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const comboOriginal = combosMock.find((combo) => combo.id === id);
    if (!comboOriginal) {
      throw new Error('Combo não encontrado');
    }

    const comboDuplicado: Combo = {
      ...comboOriginal,
      id: Date.now().toString(),
      nome: `${comboOriginal.nome} (Cópia)`,
      status: 'rascunho',
      dataCreacao: new Date(),
      dataAtualizacao: new Date(),
    };

    combosMock.push(comboDuplicado);
    return comboDuplicado;
  },

  // Ativar/Desativar combo
  alterarStatusCombo: async (id: string, novoStatus: 'ativo' | 'inativo'): Promise<Combo> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = combosMock.findIndex((combo) => combo.id === id);
    if (index === -1) {
      throw new Error('Combo não encontrado');
    }

    combosMock[index].status = novoStatus;
    combosMock[index].dataAtualizacao = new Date();

    return combosMock[index];
  },
};
