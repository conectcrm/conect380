import { useState, useMemo } from 'react';

interface ProdutoSelecionado {
  id: string;
  nome: string;
  descricao?: string;
  precoUnitario: number;
  quantidade: number;
  desconto: number;
  subtotal: number;
}

interface TotaisProposta {
  subtotal: number;
  descontoGlobal: number;
  subtotalComDesconto: number;
  valorImpostos: number;
  total: number;
}

export const useCalculosProposta = (
  produtos: ProdutoSelecionado[] = [],
  descontoGlobal: number = 0,
  impostos: number = 0,
) => {
  const totais = useMemo((): TotaisProposta => {
    // Calcular subtotal de todos os produtos
    const subtotal = produtos.reduce((acc, produto) => {
      const subtotalProduto = produto.precoUnitario * produto.quantidade;
      const descontoProduto = subtotalProduto * (produto.desconto / 100);
      return acc + (subtotalProduto - descontoProduto);
    }, 0);

    // Calcular desconto global
    const valorDescontoGlobal = subtotal * (descontoGlobal / 100);
    const subtotalComDesconto = subtotal - valorDescontoGlobal;

    // Calcular impostos
    const valorImpostos = subtotalComDesconto * (impostos / 100);

    // Total final
    const total = subtotalComDesconto + valorImpostos;

    return {
      subtotal,
      descontoGlobal: valorDescontoGlobal,
      subtotalComDesconto,
      valorImpostos,
      total,
    };
  }, [produtos, descontoGlobal, impostos]);

  const calcularSubtotalProduto = (
    precoUnitario: number,
    quantidade: number,
    desconto: number = 0,
  ) => {
    const subtotalBruto = precoUnitario * quantidade;
    const valorDesconto = subtotalBruto * (desconto / 100);
    return subtotalBruto - valorDesconto;
  };

  const validarProduto = (produto: Partial<ProdutoSelecionado>) => {
    const erros: string[] = [];

    if (!produto.nome?.trim()) erros.push('Nome é obrigatório');
    if (!produto.precoUnitario || produto.precoUnitario <= 0)
      erros.push('Preço deve ser maior que zero');
    if (!produto.quantidade || produto.quantidade <= 0)
      erros.push('Quantidade deve ser maior que zero');
    if (produto.desconto && (produto.desconto < 0 || produto.desconto > 100)) {
      erros.push('Desconto deve estar entre 0 e 100%');
    }

    return {
      valido: erros.length === 0,
      erros,
    };
  };

  return {
    totais,
    calcularSubtotalProduto,
    validarProduto,
  };
};
