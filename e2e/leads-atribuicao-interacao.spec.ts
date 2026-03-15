import { expect, test } from './fixtures';
import {
  installLeadsMocks,
  LEADS_SAVED_VIEWS_STORAGE_KEY,
  LEAD_UNASSIGNED_OPTION_VALUE,
} from './leads-ui.helpers';

test.describe('Leads - atribuicao e interacao', () => {
  test('deve atribuir/remover responsavel e registrar interacao com observacao', async ({
    authenticatedPage,
  }) => {
    const mocks = await installLeadsMocks(authenticatedPage);

    await authenticatedPage.addInitScript((storageKey: string) => {
      window.localStorage.removeItem(storageKey);
    }, LEADS_SAVED_VIEWS_STORAGE_KEY);

    await authenticatedPage.goto('/leads');
    await authenticatedPage.waitForLoadState('domcontentloaded');

    await expect(authenticatedPage.getByRole('heading', { name: /Leads/i })).toBeVisible();
    await expect(authenticatedPage.getByText('Lead Teste Atribuicao')).toBeVisible();

    await authenticatedPage.getByRole('button', { name: 'Detalhado' }).click();

    const leadId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const responsavelSelect = authenticatedPage.getByTestId(`lead-card-responsavel-${leadId}`);
    await expect(responsavelSelect).toBeVisible();
    await expect(responsavelSelect).toHaveValue(LEAD_UNASSIGNED_OPTION_VALUE);

    await responsavelSelect.selectOption('22222222-2222-4222-8222-222222222222');
    await expect(authenticatedPage.getByText(/Respons.vel atualizado com sucesso!/i)).toBeVisible();
    await expect(responsavelSelect).toHaveValue('22222222-2222-4222-8222-222222222222');

    await responsavelSelect.selectOption(LEAD_UNASSIGNED_OPTION_VALUE);
    await expect(authenticatedPage.getByText(/Respons.vel removido com sucesso!/i)).toBeVisible();
    await expect(responsavelSelect).toHaveValue(LEAD_UNASSIGNED_OPTION_VALUE);

    const botaoRegistrarInteracao = authenticatedPage.getByTestId(
      `lead-card-registrar-interacao-${leadId}`,
    );
    await expect(botaoRegistrarInteracao).toBeVisible();
    await botaoRegistrarInteracao.click();

    const observacaoInteracao = 'Ligacao realizada. Lead pediu retorno na proxima semana.';
    await expect(authenticatedPage.getByTestId('lead-interacao-observacao')).toBeVisible();
    await authenticatedPage.getByTestId('lead-interacao-observacao').fill(observacaoInteracao);
    await authenticatedPage.getByTestId('lead-interacao-confirmar').click();

    await expect(authenticatedPage.getByText(/Contato registrado com sucesso!/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/^Contatado$/)).toBeVisible();
    await expect(authenticatedPage.getByText(/Ligacao realizada\./i)).toBeVisible();

    const patchHistory = mocks.getPatchHistory();
    const patchAtribuicao = patchHistory.find(
      (item) =>
        item.id === leadId && item.payload.responsavel_id === '22222222-2222-4222-8222-222222222222',
    );
    const patchRemocao = patchHistory.find(
      (item) => item.id === leadId && item.payload.responsavel_id === null,
    );
    const patchInteracao = patchHistory.find(
      (item) =>
        item.id === leadId &&
        item.payload.status === 'contatado' &&
        item.payload.observacoes === observacaoInteracao,
    );

    expect(patchAtribuicao).toBeTruthy();
    expect(patchRemocao).toBeTruthy();
    expect(patchInteracao).toBeTruthy();
  });
});
