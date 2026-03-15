import { expect, test, type Page } from '@playwright/test';

const BASE_URL = process.env.GUARDIAN_FRONTEND_URL || 'http://127.0.0.1:3020';

const VIEWPORTS = [
  { name: 'mobile', width: 320, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1366, height: 900 },
];

const KEY_ROUTES = [
  '/',
  '/governance/users',
  '/governance/companies',
  '/governance/billing',
  '/governance/audit',
  '/governance/system',
];

const OVERFLOW_STRICT_ROUTES = new Set<string>(['/', '/governance/users', '/governance/audit']);

const mockJson = async (page: Page, pattern: string, payload: unknown) => {
  await page.route(pattern, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
};

const installGuardianApiMocks = async (page: Page) => {
  await mockJson(page, '**/users/profile', {
    success: true,
    data: {
      id: 'guardian-user-1',
      nome: 'Guardian Superadmin',
      email: 'guardian@conect360.local',
      role: 'superadmin',
    },
  });

  await mockJson(page, '**/guardian/bff/overview**', {
    success: true,
    data: {
      users: { total: 10, ativos: 9, inativos: 1 },
      pending_access_requests: 1,
      admin_security_alerts: 0,
      pending_break_glass_requests: 0,
      active_break_glass_accesses: 0,
    },
  });

  await mockJson(page, '**/guardian/bff/users**', {
    success: true,
    data: {
      items: [
        {
          id: 'user-1',
          nome: 'Operador Guardian',
          email: 'operador@conect360.local',
          role: 'admin',
          ativo: true,
        },
      ],
      total: 1,
      pagina: 1,
      limite: 20,
    },
  });

  await mockJson(page, '**/guardian/bff/access-change-requests**', {
    success: true,
    data: [],
  });

  await mockJson(page, '**/guardian/bff/companies**', {
    success: true,
    data: [
      {
        id: '6cd7d2c4-75f2-4c89-a58b-0afdef4d2c26',
        nome: 'Empresa Demo Guardian',
        plano: 'professional',
        status: 'active',
        ativo: true,
      },
    ],
    meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
  });

  await mockJson(page, '**/guardian/bff/billing/subscriptions**', {
    success: true,
    data: [
      {
        empresa: {
          id: '6cd7d2c4-75f2-4c89-a58b-0afdef4d2c26',
          nome: 'Empresa Demo Guardian',
          status: 'active',
          plano: 'professional',
          ativo: true,
        },
        assinatura: {
          id: 'assinatura-1',
          status: 'active',
          status_canonico: 'active',
          valor_mensal: 297,
          proximo_vencimento: '2026-04-15T00:00:00.000Z',
          renovacao_automatica: true,
          plano: {
            id: 'plano-1',
            nome: 'Professional',
          },
        },
      },
    ],
    meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
  });

  await mockJson(page, '**/guardian/bff/audit/critical**', {
    success: true,
    data: [
      {
        id: 10,
        createdAt: '2026-03-07T00:00:00.000Z',
        actorUserId: 'guardian-user-1',
        actorRole: 'superadmin',
        actorEmail: 'guardian@conect360.local',
        targetType: 'empresa',
        targetId: '6cd7d2c4-75f2-4c89-a58b-0afdef4d2c26',
        httpMethod: 'PATCH',
        route: '/guardian/empresas/6cd7d2c4-75f2-4c89-a58b-0afdef4d2c26/suspender',
        statusCode: 200,
        outcome: 'success',
        requestId: 'req-1',
        errorMessage: null,
      },
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  });

  await mockJson(page, '**/guardian/bff/break-glass/requests**', {
    success: true,
    data: [],
  });

  await mockJson(page, '**/guardian/bff/break-glass/active**', {
    success: true,
    data: [],
  });

  await page.route(
    '**/guardian/**',
    async (route) => {
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(route.request().method())) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {}, message: 'ok' }),
        });
        return;
      }

      await route.fallback();
    },
  );
};

const getProblematicOverflowDetails = async (
  page: Page,
): Promise<{ hasOverflow: boolean; offender: string | null }> => {
  return page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const allElements = Array.from(document.querySelectorAll<HTMLElement>('body *'));

    const overflowingElements = allElements.filter((element) => {
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return false;
      }

      if (rect.right <= viewportWidth + 1) {
        return false;
      }

      // Tabelas podem ter overflow horizontal dentro do container dedicado.
      if (element.closest('.table-wrap')) {
        return false;
      }

      return true;
    });

    if (overflowingElements.length === 0) {
      return { hasOverflow: false, offender: null };
    }

    const problematicElement =
      overflowingElements.find(
        (element) => !overflowingElements.some((other) => other !== element && element.contains(other)),
      ) || overflowingElements[0];

    const className = problematicElement.className
      ? `.${String(problematicElement.className).trim().replace(/\\s+/g, '.')}`
      : '';
    const idName = problematicElement.id ? `#${problematicElement.id}` : '';
    return {
      hasOverflow: true,
      offender: `${problematicElement.tagName.toLowerCase()}${idName}${className}`,
    };
  });
};

const slugRoute = (route: string): string =>
  route === '/' ? 'dashboard' : route.replace(/^\//, '').replace(/\//g, '-');

test.describe('Guardian responsive and visual checks', () => {
  test('key pages keep usable layout across breakpoints', async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('guardian_auth_token', 'guardian-mock-token');
      window.localStorage.setItem(
        'guardian_user_data',
        JSON.stringify({
          id: 'guardian-user-1',
          nome: 'Guardian Superadmin',
          email: 'guardian@conect360.local',
          role: 'superadmin',
        }),
      );
    });

    await installGuardianApiMocks(page);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of KEY_ROUTES) {
        await test.step(`${viewport.name} ${route}`, async () => {
          await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(600);

          const overflow = await getProblematicOverflowDetails(page);
          if (OVERFLOW_STRICT_ROUTES.has(route)) {
            expect
              .soft(overflow.hasOverflow, `${viewport.name} ${route} has problematic horizontal overflow`)
              .toBeFalsy();
          } else if (overflow.hasOverflow) {
            test.info().annotations.push({
              type: 'warning',
              description: `${viewport.name} ${route}: overflow tolerado para tabela densa (${overflow.offender || 'unknown'})`,
            });
          }

          await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
          await expect(page.locator('.card').first()).toBeVisible({ timeout: 10000 });

          const screenshotName = `guardian-${viewport.name}-${slugRoute(route)}.png`;
          await page.screenshot({ path: testInfo.outputPath(screenshotName), fullPage: true });
        });
      }
    }
  });
});
