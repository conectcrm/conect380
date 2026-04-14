import { expect, test } from './fixtures';
import {
  installLeadsMocks,
  LEADS_SAVED_VIEWS_STORAGE_KEY,
  LEAD_UNASSIGNED_OPTION_VALUE,
} from './leads-ui.helpers';

const getLeadIdFromTestId = (value: string | null): string | null => {
  if (!value) return null;
  const prefix = 'lead-card-responsavel-';
  if (!value.startsWith(prefix)) return null;
  return value.slice(prefix.length).trim() || null;
};

test.describe('Leads - alteracao de responsavel', () => {
  test('deve alterar o responsavel de um lead com dados do modulo', async ({
    authenticatedPage,
  }) => {
    await installLeadsMocks(authenticatedPage);

    await authenticatedPage.addInitScript((storageKey: string) => {
      window.localStorage.removeItem(storageKey);
    }, LEADS_SAVED_VIEWS_STORAGE_KEY);

    await authenticatedPage.goto('/leads');
    await authenticatedPage.waitForLoadState('domcontentloaded');

    await expect(authenticatedPage.getByRole('heading', { name: /Leads/i })).toBeVisible();
    await authenticatedPage.getByRole('button', { name: 'Detalhado' }).click();

    const responsavelSelects = authenticatedPage.locator('[data-testid^="lead-card-responsavel-"]');
    await expect(responsavelSelects.first()).toBeVisible({ timeout: 15000 });

    const responsavelSelect = responsavelSelects.first();
    const dataTestId = await responsavelSelect.getAttribute('data-testid');
    const leadId = getLeadIdFromTestId(dataTestId);
    expect(leadId).toBeTruthy();

    const valorAtual = await responsavelSelect.inputValue();
    const opcoes = await responsavelSelect.evaluate((el: HTMLSelectElement) =>
      Array.from(el.options).map((option) => ({
        value: option.value,
        label: option.label,
      })),
    );

    let proximoValor =
      opcoes.find(
        (option) =>
          Boolean(option.value) &&
          option.value !== valorAtual &&
          option.value !== LEAD_UNASSIGNED_OPTION_VALUE,
      )?.value || '';

    if (!proximoValor && valorAtual !== LEAD_UNASSIGNED_OPTION_VALUE) {
      const hasUnassigned = opcoes.some((option) => option.value === LEAD_UNASSIGNED_OPTION_VALUE);
      if (hasUnassigned) {
        proximoValor = LEAD_UNASSIGNED_OPTION_VALUE;
      }
    }

    if (!proximoValor && valorAtual === LEAD_UNASSIGNED_OPTION_VALUE) {
      proximoValor =
        opcoes.find((option) => Boolean(option.value) && option.value !== LEAD_UNASSIGNED_OPTION_VALUE)
          ?.value || '';
    }

    if (!proximoValor || proximoValor === valorAtual) {
      test.skip(true, 'Nao foi encontrada opcao alternativa de responsavel para o lead.');
    }

    const expectedToast =
      proximoValor === LEAD_UNASSIGNED_OPTION_VALUE
        ? /Respons.vel removido com sucesso!/i
        : /Respons.vel atualizado com sucesso!/i;

    const patchResponsePromise = authenticatedPage
      .waitForResponse(
        (response) =>
          response.request().method() === 'PATCH' &&
          Boolean(leadId) &&
          response.url().includes(`/leads/${leadId}`) &&
          response.status() >= 200 &&
          response.status() < 300,
        { timeout: 15000 },
      )
      .catch(() => null);

    await responsavelSelect.selectOption(proximoValor);

    await expect(authenticatedPage.getByText(expectedToast)).toBeVisible({ timeout: 10000 });

    const patchResponse = await patchResponsePromise;
    expect(patchResponse).not.toBeNull();

    const refreshedSelect = authenticatedPage.getByTestId(`lead-card-responsavel-${leadId}`);
    await expect(refreshedSelect).toHaveValue(proximoValor, { timeout: 10000 });
  });
});
