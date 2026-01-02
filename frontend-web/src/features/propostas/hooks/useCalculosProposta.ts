import { useMemo } from 'react';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  descricao?: string;
  unidade: string;
}

interface ProdutoProposta {
  produto: Produto;
  quantidade: number;
  desconto: number;
  subtotal: number;
}

interface TotaisProposta {
  subtotal: number;
  desconto: number;
  impostos: number;
  total: number;
}

export const useCalculosProposta = (
  produtos: ProdutoProposta[] = [],
  descontoGlobal: number = 0,
  percentualImpostos: number = 0,
) => {
  const totais = useMemo((): TotaisProposta => {
    // Calcular subtotal de todos os produtos
    const subtotal = produtos.reduce((acc, produto) => {
      return acc + (produto.subtotal || 0);
    }, 0);

    // Calcular desconto global
    const desconto = subtotal * (descontoGlobal / 100);

    // Subtotal com desconto
    const subtotalComDesconto = subtotal - desconto;

    // Calcular impostos sobre o valor com desconto
    const impostos = subtotalComDesconto * (percentualImpostos / 100);

    // Total final
    const total = subtotalComDesconto + impostos;

    return {
      subtotal,
      desconto,
      impostos,
      total,
    };
  }, [produtos, descontoGlobal, percentualImpostos]);

  const calcularSubtotalProduto = (
    produto: Produto,
    quantidade: number,
    desconto: number = 0,
  ): number => {
    const subtotalSemDesconto = produto.preco * quantidade;
    const valorDesconto = subtotalSemDesconto * (desconto / 100);
    return subtotalSemDesconto - valorDesconto;
  };

  const validarProdutos = (): boolean => {
    return produtos.length > 0 && produtos.every((p) => p.quantidade > 0);
  };

  return {
    totais,
    calcularSubtotalProduto,
    validarProdutos,
    possuiProdutos: produtos.length > 0,
  };
};
