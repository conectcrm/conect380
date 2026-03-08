import { createServer, type Server } from 'node:http';
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const GUARDIAN_PORT = 3020;

let guardianStubServer: Server | null = null;
let startedGuardianStub = false;

const jsonResponse = (status: number, payload: unknown) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(payload),
});

const mockGuardianAdminUser = {
  id: 'user-e2e-guardian-admin-1',
  nome: 'Guardian Admin E2E',
  email: 'guardian-admin@conect360.com.br',
  role: 'superadmin',
  roles: ['superadmin'],
  permissoes: [
    'dashboard.read',
    'planos.manage',
    'financeiro.faturamento.read',
    'crm.clientes.read',
    'admin.empresas.manage',
  ],
  permissions: [
    'dashboard.read',
    'planos.manage',
    'financeiro.faturamento.read',
    'crm.clientes.read',
    'admin.empresas.manage',
  ],
  empresa: {
    id: 'empresa-e2e-billing-1',
    nome: 'Empresa Billing E2E',
  },
};

const ensureGuardianStub = async (): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const candidate = createServer((req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`<!doctype html><html><body>Guardian Stub ${req.url ?? '/'}</body></html>`);
    });

    const onError = (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        resolve();
        return;
      }

      reject(error);
    };

    candidate.once('error', onError);
    candidate.listen(GUARDIAN_PORT, () => {
      candidate.off('error', onError);
      guardianStubServer = candidate;
      startedGuardianStub = true;
      resolve();
    });
  });
};

const closeGuardianStub = async (): Promise<void> => {
  if (!startedGuardianStub || !guardianStubServer) {
    return;
  }

  await new Promise<void>((resolve) => {
    guardianStubServer?.close(() => resolve());
  });
  guardianStubServer = null;
  startedGuardianStub = false;
};

const elevateSessionToGuardianAdmin = async (page: Page): Promise<void> => {
  await page.route('**/users/profile', async (route) => {
    await route.fulfill(
      jsonResponse(200, {
        success: true,
        data: mockGuardianAdminUser,
      }),
    );
  });

  await page.evaluate((user) => {
    window.localStorage.setItem('user_data', JSON.stringify(user));
  }, mockGuardianAdminUser);

  await page.goto('/dashboard');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
};

test.describe('Billing legacy admin routes lockdown', () => {
  test.beforeAll(async () => {
    await ensureGuardianStub();
  });

  test.afterAll(async () => {
    await closeGuardianStub();
  });

  test('bloqueia aliases admin no cliente e mantém apenas relay explicito para guardian', async ({ authenticatedPage }) => {
    await elevateSessionToGuardianAdmin(authenticatedPage);

    const blockedClientAliases = [
      '/admin/empresas',
      '/admin/empresas/emp-legacy-01',
      '/admin/usuarios',
      '/admin/sistema',
      '/admin/branding',
      '/nuclei/administracao',
    ];

    for (const source of blockedClientAliases) {
      await authenticatedPage.goto(source, { waitUntil: 'domcontentloaded' }).catch(() => undefined);
      await authenticatedPage.waitForTimeout(400);
      const currentUrl = authenticatedPage.url();
      expect(currentUrl).not.toContain('/governance/');
      expect(currentUrl).not.toContain(':3020/');
      await expect(authenticatedPage.locator('body')).not.toContainText('Guardian Stub');
    }

    await authenticatedPage.goto('/sistema/backup', { waitUntil: 'domcontentloaded' }).catch(() => undefined);
    await expect.poll(
      () => authenticatedPage.url(),
      {
        timeout: 10000,
        message: 'Relay explicito para guardian (/sistema/backup) nao funcionou.',
      },
    ).toContain('/governance/system');
  });
});
