const toNonEmptyString = (...values: unknown[]): string => {
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (normalized) {
      return normalized;
    }
  }

  return '';
};

const toPositiveNumber = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }

  return fallback;
};

export const MENSAGEM_PROPOSTA_SEM_ITENS =
  'Adicione pelo menos 1 item/produto na proposta antes de enviar, aprovar ou gerar o PDF final.';

export const extrairItensComerciaisDaProposta = (fonte: any): any[] => {
  if (!fonte) {
    return [];
  }

  const listasDiretas = [
    fonte.produtos,
    fonte.itens,
    fonte.items,
    fonte.produtosSelecionados,
    fonte.snapshot?.produtos,
  ];

  for (const lista of listasDiretas) {
    if (Array.isArray(lista) && lista.length > 0) {
      return lista;
    }
  }

  const versoes = Array.isArray(fonte.versoes)
    ? fonte.versoes
    : Array.isArray(fonte.emailDetails?.versoes)
      ? fonte.emailDetails.versoes
      : [];

  if (versoes.length === 0) {
    return [];
  }

  const versoesOrdenadas = [...versoes].sort(
    (a: any, b: any) => Number(a?.versao || 0) - Number(b?.versao || 0),
  );
  const ultimaVersao = versoesOrdenadas[versoesOrdenadas.length - 1];
  const itensVersao = ultimaVersao?.snapshot?.produtos;

  return Array.isArray(itensVersao) ? itensVersao : [];
};

export const propostaPossuiItensComerciais = (fonte: any): boolean => {
  return extrairItensComerciaisDaProposta(fonte).some((item: any) => {
    const produto = item?.produto && typeof item.produto === 'object' ? item.produto : item;
    const nome = toNonEmptyString(
      produto?.nome,
      produto?.titulo,
      item?.nome,
      item?.produtoNome,
      item?.descricao,
    );
    const produtoId = toNonEmptyString(item?.produtoId, item?.id, produto?.id);
    const quantidade = toPositiveNumber(item?.quantidade ?? produto?.quantidade, 1);

    return Boolean((produtoId || nome) && quantidade > 0);
  });
};
