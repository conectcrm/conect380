import type { Page, Route } from '@playwright/test';

export type PipelineUiRequestContext = {
  route: Route;
  request: ReturnType<Route['request']>;
  url: URL;
  pathname: string;
  searchParams: URLSearchParams;
  method: string;
};

export type PipelineUiMockOptions = {
  oportunidades: unknown[];
  metricas: unknown;
  customHandler?: (ctx: PipelineUiRequestContext) => Promise<boolean> | boolean;
};

export function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function bootstrapPipelineUiAuthenticatedSession(page: Page) {
  await page.addInitScript(() => {
    const fakeUser = {
      id: 'user-e2e-1',
      nome: 'Usuario E2E',
      email: 'usuario.e2e@conectcrm.test',
      role: 'admin',
      empresa: {
        id: 'empresa-e2e-1',
        nome: 'Empresa E2E',
      },
    };

    window.localStorage.setItem('authToken', 'token-e2e-fake');
    window.localStorage.setItem('empresaAtiva', 'empresa-e2e-1');
    window.localStorage.setItem('user_data', JSON.stringify(fakeUser));
  });
}

export async function mockPipelineUiApis(page: Page, options: PipelineUiMockOptions) {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    const method = request.method();

    const ctx: PipelineUiRequestContext = {
      route,
      request,
      url,
      pathname,
      searchParams,
      method,
    };

    if (options.customHandler && (await options.customHandler(ctx))) {
      return;
    }

    if (method === 'GET' && pathname.endsWith('/oportunidades')) {
      return json(route, 200, options.oportunidades);
    }

    if (method === 'GET' && pathname.endsWith('/oportunidades/metricas')) {
      return json(route, 200, options.metricas);
    }

    if (method === 'GET' && pathname.endsWith('/users')) {
      return json(route, 200, {
        usuarios: [
          {
            id: 'user-e2e-1',
            nome: 'Usuario E2E',
            email: 'usuario.e2e@conectcrm.test',
            ativo: true,
          },
        ],
        total: 1,
        pagina: Number(searchParams.get('pagina') || 1),
        limite: Number(searchParams.get('limite') || 10),
      });
    }

    if (method === 'GET' && pathname.endsWith('/users/profile')) {
      return json(route, 200, {
        success: true,
        data: {
          id: 'user-e2e-1',
          nome: 'Usuario E2E',
          email: 'usuario.e2e@conectcrm.test',
          role: 'admin',
          empresa: {
            id: 'empresa-e2e-1',
            nome: 'Empresa E2E',
          },
        },
      });
    }

    if (method === 'GET' && pathname.endsWith('/minhas-empresas')) {
      return json(route, 200, {
        empresas: [
          {
            id: 'empresa-e2e-1',
            nome: 'Empresa E2E',
            descricao: 'Empresa de testes E2E',
            cnpj: '00.000.000/0001-00',
            email: 'contato@empresa-e2e.test',
            telefone: '(11) 99999-0000',
            endereco: 'Rua Teste, 100',
            plano: {
              id: 'plano-business',
              nome: 'Business',
              preco: 199,
              features: ['crm', 'vendas'],
              limitesUsuarios: 20,
              limitesClientes: 1000,
              limitesArmazenamento: '50GB',
            },
            status: 'ativa',
            isActive: true,
            dataVencimento: new Date(Date.now() + 86400000 * 30).toISOString(),
            dataCriacao: new Date().toISOString(),
            ultimoAcesso: new Date().toISOString(),
            configuracoes: {},
            estatisticas: {
              usuariosAtivos: 1,
              totalUsuarios: 1,
              clientesCadastrados: 0,
              propostasEsteAno: 0,
              propostasEsteMes: 0,
              faturaAcumulada: 0,
              crescimentoMensal: 0,
              armazenamentoUsado: '1GB',
              armazenamentoTotal: '50GB',
              ultimasAtividades: [],
            },
            permissoes: {
              podeEditarConfiguracoes: true,
              podeGerenciarUsuarios: true,
              podeVerRelatorios: true,
              podeExportarDados: true,
              podeAlterarPlano: true,
            },
          },
        ],
      });
    }

    if (method === 'GET' && pathname.endsWith('/empresas/modulos/ativos')) {
      return json(route, 200, {
        data: ['CRM', 'VENDAS', 'FINANCEIRO', 'ATENDIMENTO', 'ADMINISTRACAO'],
      });
    }

    if (method === 'GET' && pathname.includes('/empresas/modulos/verificar/')) {
      return json(route, 200, { data: { ativo: true } });
    }

    // Fallback genérico para chamadas colaterais do shell/layout durante estes recortes de UI.
    if (url.hostname === 'localhost' && url.port === '3001') {
      if (method === 'GET') {
        return json(route, 200, {});
      }
      return json(route, 200, { success: true, data: {} });
    }

    return route.continue();
  });
}

