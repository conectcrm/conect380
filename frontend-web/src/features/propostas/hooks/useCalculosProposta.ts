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
  const toFiniteNumber = (value: unknown, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const totais = useMemo((): TotaisProposta => {
    // Sempre recalcula com base em preco x quantidade - desconto para evitar subtotal stale.
    const subtotal = produtos.reduce((acc, item) => {
      const quantidade = Math.max(1, toFiniteNumber(item.quantidade, 1));
      const preco = Math.max(0, toFiniteNumber(item.produto?.preco, 0));
      const descontoItem = Math.min(100, Math.max(0, toFiniteNumber(item.desconto, 0)));
      const subtotalItem = preco * quantidade * (1 - descontoItem / 100);
      return acc + subtotalItem;
    }, 0);

    // Calcular desconto global
    const descontoGlobalPercentual = Math.min(100, Math.max(0, toFiniteNumber(descontoGlobal, 0)));
    const desconto = subtotal * (descontoGlobalPercentual / 100);

    // Subtotal com desconto
    const subtotalComDesconto = subtotal - desconto;

    // Calcular impostos sobre o valor com desconto
    const impostoPercentual = Math.min(100, Math.max(0, toFiniteNumber(percentualImpostos, 0)));
    const impostos = subtotalComDesconto * (impostoPercentual / 100);

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
    const preco = Math.max(0, toFiniteNumber(produto.preco, 0));
    const quantidadeNormalizada = Math.max(1, toFiniteNumber(quantidade, 1));
    const descontoNormalizado = Math.min(100, Math.max(0, toFiniteNumber(desconto, 0)));
    const subtotalSemDesconto = preco * quantidadeNormalizada;
    const valorDesconto = subtotalSemDesconto * (descontoNormalizado / 100);
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
