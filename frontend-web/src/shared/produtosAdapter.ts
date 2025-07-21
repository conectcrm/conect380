// Adapter para unificar interfaces de produtos entre diferentes páginas
import { Produto } from '../services/produtosService';

// Interface unificada para produtos em propostas
export interface ProdutoPropostaBase {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  subcategoria?: string;
  tipo?: string;
  descricao?: string;
  unidade: string;
  status?: 'ativo' | 'inativo' | 'descontinuado';
  sku?: string;
  fornecedor?: string;
}

// Interface para produtos em propostas
export interface ProdutoProposta {
  produto: ProdutoPropostaBase;
  quantidade: number;
  desconto: number;
  subtotal: number;
}

// Adapter para converter Produto (do serviço) para ProdutoPropostaBase
export const adaptProdutoToPropostaBase = (produto: Produto): ProdutoPropostaBase => {
  return {
    id: produto.id,
    nome: produto.nome,
    preco: produto.preco,
    categoria: produto.categoria,
    subcategoria: undefined, // Pode ser mapeado se disponível
    tipo: produto.tipoItem,
    descricao: produto.descricao,
    unidade: produto.unidadeMedida,
    status: produto.status as 'ativo' | 'inativo' | 'descontinuado',
    sku: produto.sku,
    fornecedor: produto.fornecedor
  };
};

// Adapter para converter dados de proposta para dados de produto
export const adaptPropostaBaseToProduto = (produtoBase: ProdutoPropostaBase): Partial<Produto> => {
  return {
    id: produtoBase.id,
    nome: produtoBase.nome,
    categoria: produtoBase.categoria,
    preco: produtoBase.preco,
    tipoItem: produtoBase.tipo || 'produto',
    unidadeMedida: produtoBase.unidade,
    status: produtoBase.status || 'ativo',
    descricao: produtoBase.descricao,
    sku: produtoBase.sku || '',
    fornecedor: produtoBase.fornecedor || ''
  };
};

// Hook para buscar produtos formatados para propostas
export const useProdutosParaPropostas = () => {
  // Esta função pode ser expandida para integrar com o serviço real
  // Por enquanto, retorna dados mock formatados
  
  const produtosMock: ProdutoPropostaBase[] = [
    // Software - Licenças Web
    {
      id: 'sw1',
      nome: 'Sistema de Gestão - Licença Web Básica',
      preco: 299.00,
      categoria: 'Software',
      subcategoria: 'Sistema de Gestão',
      tipo: 'Licença Web Básica',
      descricao: 'Acesso via web, recursos básicos, até 5 usuários',
      unidade: 'licença/mês',
      status: 'ativo'
    },
    {
      id: 'sw2',
      nome: 'Sistema de Gestão - Licença Web Premium',
      preco: 449.00,
      categoria: 'Software',
      subcategoria: 'Sistema de Gestão',
      tipo: 'Licença Web Premium',
      descricao: 'Acesso via web, recursos avançados, usuários ilimitados',
      unidade: 'licença/mês',
      status: 'ativo'
    },
    // Software - App Mobile
    {
      id: 'sw3',
      nome: 'Sistema de Gestão - App Mobile',
      preco: 389.00,
      categoria: 'Software',
      subcategoria: 'Sistema de Gestão',
      tipo: 'App Mobile',
      descricao: 'Aplicativo móvel nativo iOS/Android',
      unidade: 'licença/mês',
      status: 'ativo'
    },
    // Software - E-commerce
    {
      id: 'sw4',
      nome: 'E-commerce - Loja Básica',
      preco: 199.00,
      categoria: 'Software',
      subcategoria: 'E-commerce',
      tipo: 'Loja Básica',
      descricao: 'Até 100 produtos, design básico',
      unidade: 'licença/mês',
      status: 'ativo'
    },
    {
      id: 'sw5',
      nome: 'E-commerce - Loja Avançada',
      preco: 399.00,
      categoria: 'Software',
      subcategoria: 'E-commerce',
      tipo: 'Loja Avançada',
      descricao: 'Produtos ilimitados, integrações, relatórios',
      unidade: 'licença/mês',
      status: 'ativo'
    },
    // Consultoria
    {
      id: 'cons1',
      nome: 'Consultoria Gestão Empresarial - Júnior',
      preco: 150.00,
      categoria: 'Consultoria',
      subcategoria: 'Gestão Empresarial',
      tipo: 'Consultor Júnior',
      descricao: 'Consultor com 1-3 anos de experiência',
      unidade: 'hora',
      status: 'ativo'
    },
    {
      id: 'cons2',
      nome: 'Consultoria Gestão Empresarial - Sênior',
      preco: 300.00,
      categoria: 'Consultoria',
      subcategoria: 'Gestão Empresarial',
      tipo: 'Consultor Sênior',
      descricao: 'Consultor com 8+ anos de experiência',
      unidade: 'hora',
      status: 'ativo'
    },
    {
      id: 'cons3',
      nome: 'Consultoria Marketing Digital - Estratégia',
      preco: 180.00,
      categoria: 'Consultoria',
      subcategoria: 'Marketing Digital',
      tipo: 'Estratégia',
      descricao: 'Planejamento estratégico de marketing digital',
      unidade: 'hora',
      status: 'ativo'
    },
    {
      id: 'cons4',
      nome: 'Consultoria Marketing Digital - Implementação',
      preco: 120.00,
      categoria: 'Consultoria',
      subcategoria: 'Marketing Digital',
      tipo: 'Implementação',
      descricao: 'Execução de campanhas e estratégias',
      unidade: 'hora',
      status: 'ativo'
    },
    // Treinamentos
    {
      id: 'trei1',
      nome: 'Treinamento Liderança - Básico',
      preco: 800.00,
      categoria: 'Treinamento',
      subcategoria: 'Liderança',
      tipo: 'Curso Básico',
      descricao: 'Fundamentos de liderança e gestão de equipes',
      unidade: 'curso',
      status: 'ativo'
    },
    {
      id: 'trei2',
      nome: 'Treinamento Liderança - Avançado',
      preco: 1200.00,
      categoria: 'Treinamento',
      subcategoria: 'Liderança',
      tipo: 'Curso Avançado',
      descricao: 'Técnicas avançadas de liderança e gestão estratégica',
      unidade: 'curso',
      status: 'ativo'
    },
    {
      id: 'trei3',
      nome: 'Treinamento Vendas - Técnicas de Negociação',
      preco: 600.00,
      categoria: 'Treinamento',
      subcategoria: 'Vendas',
      tipo: 'Técnicas de Negociação',
      descricao: 'Métodos avançados de negociação e fechamento',
      unidade: 'curso',
      status: 'ativo'
    },
    {
      id: 'trei4',
      nome: 'Treinamento Vendas - Prospecção Digital',
      preco: 500.00,
      categoria: 'Treinamento',
      subcategoria: 'Vendas',
      tipo: 'Prospecção Digital',
      descricao: 'Uso de ferramentas digitais para geração de leads',
      unidade: 'curso',
      status: 'ativo'
    }
  ];

  return {
    produtos: produtosMock,
    buscarProdutos: (filtros?: { categoria?: string; subcategoria?: string; termo?: string }) => {
      let filtered = produtosMock;

      if (filtros?.categoria) {
        filtered = filtered.filter(p => p.categoria === filtros.categoria);
      }

      if (filtros?.subcategoria) {
        filtered = filtered.filter(p => p.subcategoria === filtros.subcategoria);
      }

      if (filtros?.termo) {
        const termo = filtros.termo.toLowerCase();
        filtered = filtered.filter(p => 
          p.nome.toLowerCase().includes(termo) ||
          p.categoria.toLowerCase().includes(termo) ||
          (p.subcategoria && p.subcategoria.toLowerCase().includes(termo)) ||
          (p.tipo && p.tipo.toLowerCase().includes(termo))
        );
      }

      return filtered;
    },
    categorias: Array.from(new Set(produtosMock.map(p => p.categoria))).sort(),
    subcategoriasPorCategoria: (categoria: string) => {
      return Array.from(new Set(
        produtosMock
          .filter(p => p.categoria === categoria)
          .map(p => p.subcategoria)
          .filter(Boolean)
      )).sort();
    }
  };
};

// Função para sincronizar produtos entre páginas
export const sincronizarProdutos = () => {
  // Esta função pode implementar sincronização real com backend
  console.log('🔄 Sincronizando produtos entre páginas...');
  
  // Emitir evento customizado para notificar outras páginas sobre atualizações
  const event = new CustomEvent('produtosAtualizados', {
    detail: { timestamp: Date.now() }
  });
  window.dispatchEvent(event);
};
