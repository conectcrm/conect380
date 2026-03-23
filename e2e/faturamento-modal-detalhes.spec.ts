import { test, expect } from './fixtures';

const parseNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseCurrencyPtBr = (raw: string | null | undefined): number => {
  if (!raw) return 0;
  const normalized = raw
    .replace(/\s+/g, '')
    .replace('R$', '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');
  return parseNumber(normalized);
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_REGEX.test(value.trim());

test.describe('Faturamento - Modal detalhes', () => {
  test('abre modal e valida fallback de forma de pagamento e valor bruto', async ({
    authenticatedPage,
  }) => {
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();

    const obterPrimeiroContextoValido = async () => {
      const response = await authenticatedPage.request.get('http://localhost:3001/propostas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok()) {
        return null;
      }

      const payload = await response.json().catch(() => null);
      const propostas = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.propostas)
          ? payload.propostas
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      for (const proposta of propostas) {
        const clienteId = proposta?.cliente?.id || proposta?.clienteId || proposta?.cliente_id;
        const usuarioResponsavelId =
          proposta?.vendedor?.id ||
          proposta?.vendedorId ||
          proposta?.vendedor_id ||
          proposta?.usuarioResponsavelId;

        if (isUuid(clienteId) && isUuid(usuarioResponsavelId)) {
          return { clienteId, usuarioResponsavelId };
        }
      }

      return null;
    };

    const criarFaturaTeste = async () => {
      const contexto = await obterPrimeiroContextoValido();
      if (!contexto) {
        return false;
      }

      const dataVencimento = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const createResponse = await authenticatedPage.request.post(
        'http://localhost:3001/faturamento/faturas',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: {
            clienteId: contexto.clienteId,
            usuarioResponsavelId: contexto.usuarioResponsavelId,
            tipo: 'unica',
            descricao: 'Fatura de teste E2E - modal detalhes',
            formaPagamentoPreferida: 'pix',
            dataVencimento,
            observacoes: 'Gerada automaticamente para validar modal de detalhes.',
            valorDesconto: 0,
            itens: [
              {
                descricao: 'Servico de validacao E2E',
                quantidade: 1,
                valorUnitario: 199.9,
                unidade: 'un',
                codigoProduto: 'E2E-MODAL',
                percentualDesconto: 0,
                valorDesconto: 0,
              },
            ],
          },
        },
      );

      return createResponse.ok();
    };

    await authenticatedPage.goto('/financeiro/faturamento');
    await Promise.race([
      authenticatedPage.waitForResponse(
        (response) =>
          response.url().includes('/faturamento/faturas/paginadas') &&
          response.request().method() === 'GET' &&
          response.status() === 200,
        { timeout: 15000 },
      ),
      authenticatedPage.waitForTimeout(8000),
    ]);
    await authenticatedPage.waitForTimeout(1200);

    let qtdAcoesDetalhes = await authenticatedPage.locator('button[title="Ver Detalhes"]').count();
    if (qtdAcoesDetalhes === 0) {
      const criouFatura = await criarFaturaTeste();
      if (criouFatura) {
        await authenticatedPage.reload();
        qtdAcoesDetalhes = await authenticatedPage.locator('button[title="Ver Detalhes"]').count();
      }
    }

    test.skip(qtdAcoesDetalhes === 0, 'Nenhuma fatura encontrada/criada para validar o modal.');
    const botaoVerDetalhes = authenticatedPage.locator('button[title="Ver Detalhes"]').first();

    const respostaDetalhesPromise = authenticatedPage
      .waitForResponse(
        (response) =>
          /\/faturamento\/faturas\/\d+$/.test(response.url()) &&
          response.request().method() === 'GET' &&
          response.status() === 200,
        { timeout: 15000 },
      )
      .catch(() => null);

    await botaoVerDetalhes.click();

    const modal = authenticatedPage.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(modal.getByText(/Fatura\s*#/i)).toBeVisible();
    await expect(modal.getByText(/Resumo Financeiro/i)).toBeVisible();
    await expect(modal.getByText(/Itens da Fatura/i)).toBeVisible();

    const respostaDetalhes = await respostaDetalhesPromise;
    const payload = respostaDetalhes ? await respostaDetalhes.json().catch(() => null) : null;
    const apiFatura = payload?.data || payload || null;

    const formaPagamentoLabel = modal.getByText('Forma de Pagamento:').first();
    await expect(formaPagamentoLabel).toBeVisible();
    const formaPagamentoContainer = formaPagamentoLabel.locator('xpath=..');
    const formaPagamentoValor =
      (await formaPagamentoContainer.locator('p').first().textContent())?.trim() || '';
    expect(formaPagamentoValor.length).toBeGreaterThan(0);

    const apiFormaPagamento = apiFatura?.formaPagamento || apiFatura?.formaPagamentoPreferida;
    if (apiFormaPagamento) {
      const formaLower = formaPagamentoValor.toLowerCase();
      expect(formaLower.includes('nao definida') || formaLower.includes('não definida')).toBeFalsy();
    }

    const linhaValorBruto = modal
      .locator('div.flex.justify-between')
      .filter({ hasText: 'Valor Bruto:' })
      .first();
    await expect(linhaValorBruto).toBeVisible();
    const textoValorBruto = (await linhaValorBruto.locator('span').nth(1).textContent()) || '';
    const valorBrutoModal = parseCurrencyPtBr(textoValorBruto);

    if (apiFatura) {
      const apiValorTotal = parseNumber(apiFatura.valorTotal);
      const apiValorDesconto = parseNumber(apiFatura.valorDesconto);
      const apiValorBrutoOriginal = parseNumber(apiFatura.valorBruto);
      const apiValorBrutoPorItens = Array.isArray(apiFatura.itens)
        ? apiFatura.itens.reduce((acc: number, item: any) => {
            const totalItem =
              parseNumber(item?.valorTotal) ||
              Math.max(
                parseNumber(item?.quantidade) * parseNumber(item?.valorUnitario) -
                  parseNumber(item?.valorDesconto),
                0,
              );
            return acc + totalItem;
          }, 0)
        : 0;
      const apiValorBrutoEsperado =
        apiValorBrutoOriginal > 0
          ? apiValorBrutoOriginal
          : apiValorBrutoPorItens > 0
            ? apiValorBrutoPorItens
            : Math.max(apiValorTotal + apiValorDesconto, 0);

      expect(Math.abs(valorBrutoModal - apiValorBrutoEsperado)).toBeLessThan(0.05);
    } else {
      const linhaTotal = modal.locator('div.flex.justify-between.text-lg').first();
      const textoTotal = (await linhaTotal.locator('span').nth(1).textContent()) || '';
      const valorTotalModal = parseCurrencyPtBr(textoTotal);
      expect(valorBrutoModal).toBeGreaterThan(0);
      expect(valorTotalModal).toBeGreaterThan(0);
    }

    await authenticatedPage.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 10000 });
  });
});
