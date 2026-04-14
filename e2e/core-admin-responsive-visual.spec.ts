import { expect, test, type Page } from '@playwright/test';

const BASE_URL = process.env.CORE_ADMIN_FRONTEND_URL || 'http://127.0.0.1:3000';

const VIEWPORTS = [
  { name: 'mobile', width: 320, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1366, height: 900 },
];

const KEY_ROUTES = ['/core-admin'];

const mockJson = async (page: Page, pattern: string, payload: unknown) => {
  await page.route(pattern, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
};

const installCoreAdminApiMocks = async (page: Page) => {
  await page.route('**/*', async (route) => {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(route.request().url());
    } catch {
      await route.fallback();
      return;
    }

    if (parsedUrl.hostname !== 'localhost' || parsedUrl.port !== '3001') {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    });
  });

  await mockJson(page, '**/users/profile', {
    success: true,
    data: {
      id: 'core-admin-user-1',
      nome: 'Core Admin Superadmin',
      email: 'core-admin@conect360.local',
      role: 'superadmin',
      roles: ['superadmin'],
      empresa: {
        id: 'empresa-core-admin-1',
        nome: 'Core Admin Owner',
      },
    },
  });

  await mockJson(page, '**/empresas/modulos/ativos', {
    data: ['CRM', 'VENDAS', 'FINANCEIRO', 'BILLING', 'ADMINISTRACAO'],
  });

  await mockJson(page, '**/minhas-empresas', {
    empresas: [
      {
        id: 'empresa-core-admin-1',
        nome: 'Core Admin Owner',
        status: 'ativa',
        isActive: true,
      },
    ],
  });

  await mockJson(page, '**/core-admin/bff/overview**', {
    success: true,
    data: {
      users: { total: 10, ativos: 9, inativos: 1 },
      pending_access_requests: 1,
      admin_security_alerts: 0,
      pending_break_glass_requests: 0,
      active_break_glass_accesses: 0,
    },
  });

  await mockJson(page, '**/core-admin/bff/companies**', {
    success: true,
    data: [
      {
        id: 'empresa-demo-1',
        nome: 'Empresa Demo Core Admin',
        plano: 'professional',
        status: 'active',
        ativo: true,
      },
    ],
  });

  await mockJson(page, '**/core-admin/planos**', [
    {
      id: 'plan-starter',
      nome: 'Starter',
      codigo: 'starter',
      preco: 99,
      ativo: true,
    },
    {
      id: 'plan-pro',
      nome: 'Professional',
      codigo: 'professional',
      preco: 249,
      ativo: true,
    },
  ]);

  await page.route('**/core-admin/**', async (route) => {
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(route.request().method())) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {}, message: 'ok' }),
      });
      return;
    }

    await route.fallback();
  });

  await mockJson(page, '**/notifications**', {
    success: true,
    data: [
      {
        id: 'not-1',
        title: 'Notificacao de teste',
        read: false,
      },
    ],
  });
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
      ? `.${String(problematicElement.className).trim().replace(/\s+/g, '.')}`
      : '';
    const idName = problematicElement.id ? `#${problematicElement.id}` : '';
    return {
      hasOverflow: true,
      offender: `${problematicElement.tagName.toLowerCase()}${idName}${className}`,
    };
  });
};

const slugRoute = (route: string): string =>
  route === '/core-admin' ? 'core-admin' : route.replace(/^\//, '').replace(/\//g, '-');

test.describe('Core Admin responsive and visual checks', () => {
  test('key pages keep usable layout across breakpoints', async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('authToken', 'core-admin-mock-token');
      window.localStorage.setItem('refreshToken', 'core-admin-mock-refresh-token');
      window.localStorage.setItem('empresaAtiva', 'empresa-core-admin-1');
      window.localStorage.setItem(
        'user_data',
        JSON.stringify({
          id: 'core-admin-user-1',
          nome: 'Core Admin Superadmin',
          email: 'core-admin@conect360.local',
          role: 'superadmin',
          roles: ['superadmin'],
          empresa: {
            id: 'empresa-core-admin-1',
            nome: 'Core Admin Owner',
          },
        }),
      );
    });

    await installCoreAdminApiMocks(page);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of KEY_ROUTES) {
        await test.step(`${viewport.name} ${route}`, async () => {
          await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(600);
          const finalUrl = page.url();
          if (!finalUrl.includes('/core-admin')) {
            test.info().annotations.push({
              type: 'warning',
              description: `${viewport.name} ${route}: URL final permaneceu em ${finalUrl}.`,
            });
          }

          const overflow = await getProblematicOverflowDetails(page);
          if (overflow.hasOverflow) {
            test.info().annotations.push({
              type: 'warning',
              description: `${viewport.name} ${route}: overflow detectado (${overflow.offender || 'unknown'})`,
            });
          }

          await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
          await expect(page.getByRole('heading', { name: 'Core Admin' })).toBeVisible({
            timeout: 10000,
          });

          const screenshotName = `core-admin-${viewport.name}-${slugRoute(route)}.png`;
          await page.screenshot({ path: testInfo.outputPath(screenshotName), fullPage: true });
        });
      }
    }
  });
});
