import { INestApplication } from '@nestjs/common';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

describe('Permissoes por Perfil (E2E)', () => {
  const TEST_PASSWORD = 'senha123';
  const EMPRESA_SLUG = `e2e-permissoes-${Date.now()}`;
  const UNKNOWN_UUID = '00000000-0000-4000-8000-000000009999';
  const MANAGED_USER_ID = randomUUID();
  type Perfil = 'admin' | 'gerente' | 'vendedor' | 'suporte' | 'financeiro';
  type HttpMethod = 'post' | 'put' | 'patch' | 'delete';
  const perfis: Perfil[] = ['admin', 'gerente', 'vendedor', 'suporte', 'financeiro'];

  let app: INestApplication;
  let dataSource: DataSource;
  let empresaId: string;
  let propostaBaseId = '';

  const users: Record<Perfil, { id: string; email: string; role: Perfil }> = {
    admin: {
      id: randomUUID(),
      email: `e2e.admin.${Date.now()}@conectcrm.local`,
      role: 'admin',
    },
    gerente: {
      id: randomUUID(),
      email: `e2e.gerente.${Date.now()}@conectcrm.local`,
      role: 'gerente',
    },
    vendedor: {
      id: randomUUID(),
      email: `e2e.vendedor.${Date.now()}@conectcrm.local`,
      role: 'vendedor',
    },
    suporte: {
      id: randomUUID(),
      email: `e2e.suporte.${Date.now()}@conectcrm.local`,
      role: 'suporte',
    },
    financeiro: {
      id: randomUUID(),
      email: `e2e.financeiro.${Date.now()}@conectcrm.local`,
      role: 'financeiro',
    },
  };

  const tokens: Record<Perfil, string> = {
    admin: '',
    gerente: '',
    vendedor: '',
    suporte: '',
    financeiro: '',
  };
  let writeSequence = 0;

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: TEST_PASSWORD })
      .expect(201);

    return response.body.data.access_token as string;
  };

  const getAs = (token: string, route: string) =>
    request(app.getHttpServer()).get(route).set('Authorization', `Bearer ${token}`);

  const requestAs = (
    token: string,
    method: HttpMethod,
    route: string,
    payload?: Record<string, unknown>,
  ) => {
    const req = request(app.getHttpServer())[method](route).set('Authorization', `Bearer ${token}`);
    return payload === undefined ? req : req.send(payload);
  };

  const assertRouteAccess = async (
    route: string,
    allowedPerfis: Perfil[],
    allowedStatuses: number[] = [200],
  ) => {
    const allowedSet = new Set(allowedPerfis);

    for (const perfil of perfis) {
      const response = await getAs(tokens[perfil], route);

      if (allowedSet.has(perfil)) {
        expect(allowedStatuses).toContain(response.status);
      } else {
        expect(response.status).toBe(403);
      }
    }
  };

  const assertWriteAccess = async (
    method: HttpMethod,
    route: string,
    allowedPerfis: Perfil[],
    options?: {
      allowedStatuses?: number[];
      payload?: Record<string, unknown>;
      payloadFactory?: (perfil: Perfil) => Record<string, unknown> | undefined;
    },
  ) => {
    const allowedSet = new Set(allowedPerfis);
    const allowedStatuses = options?.allowedStatuses ?? [200, 201, 204, 400, 404, 409, 429, 500];

    for (const perfil of perfis) {
      const payload = options?.payloadFactory
        ? options.payloadFactory(perfil)
        : options?.payload;
      const response = await requestAs(tokens[perfil], method, route, payload);

      if (allowedSet.has(perfil)) {
        expect(allowedStatuses).toContain(response.status);
      } else {
        expect(response.status).toBe(403);
      }
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await withE2EBootstrapLock(() => Test.createTestingModule({
      imports: [AppModule],
    }).compile());

    app = await createE2EApp(moduleFixture);

    dataSource = app.get(DataSource);

    const empresa = await dataSource.query(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        'Empresa E2E Permissoes',
        EMPRESA_SLUG,
        `${Date.now()}`.slice(-14).padStart(14, '0'),
        `${EMPRESA_SLUG}@conectcrm.local`,
        '11999999999',
        'Rua E2E Permissoes',
        'Sao Paulo',
        'SP',
        '01000-000',
        EMPRESA_SLUG.slice(0, 100),
      ],
    );
    empresaId = empresa[0].id;

    const senhaHash = await bcrypt.hash(TEST_PASSWORD, 10);

    const insertUser = async (id: string, email: string, role: string) => {
      await dataSource.query(
        `
          INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo)
          VALUES ($1, $2, $3, $4, $5, $6, true)
          ON CONFLICT (id) DO UPDATE SET
            nome = EXCLUDED.nome,
            email = EXCLUDED.email,
            senha = EXCLUDED.senha,
            empresa_id = EXCLUDED.empresa_id,
            role = EXCLUDED.role,
            ativo = true
        `,
        [id, `Usuario ${role}`, email, senhaHash, empresaId, role],
      );
    };

    await insertUser(users.admin.id, users.admin.email, users.admin.role);
    await insertUser(users.gerente.id, users.gerente.email, users.gerente.role);
    await insertUser(users.vendedor.id, users.vendedor.email, users.vendedor.role);
    await insertUser(users.suporte.id, users.suporte.email, users.suporte.role);
    await insertUser(users.financeiro.id, users.financeiro.email, users.financeiro.role);
    await insertUser(MANAGED_USER_ID, `e2e.managed.${Date.now()}@conectcrm.local`, 'vendedor');

    tokens.admin = await login(users.admin.email);
    tokens.gerente = await login(users.gerente.email);
    tokens.vendedor = await login(users.vendedor.email);
    tokens.suporte = await login(users.suporte.email);
    tokens.financeiro = await login(users.financeiro.email);

    const propostaBaseResponse = await request(app.getHttpServer())
      .post('/propostas')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        titulo: `Proposta Base E2E ${Date.now()}`,
        cliente: 'Cliente Base E2E',
        valor: 1000,
        observacoes: 'Base para cenarios de update/delete',
      })
      .expect(201);

    propostaBaseId = propostaBaseResponse.body?.proposta?.id;
    if (!propostaBaseId) {
      throw new Error('Nao foi possivel criar proposta base para testes de permissao');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('matriz de acesso por recurso (read)', () => {
    const cenarios = [
      {
        nome: 'users',
        route: '/users',
        allowedPerfis: ['admin', 'gerente'],
      },
      {
        nome: 'atendimento tickets',
        route: '/atendimento/tickets',
        allowedPerfis: ['admin', 'gerente', 'suporte'],
      },
      {
        nome: 'financeiro faturamento',
        route: '/faturamento/faturas',
        allowedPerfis: ['admin', 'financeiro'],
      },
      {
        nome: 'crm leads',
        route: '/leads',
        allowedPerfis: ['admin', 'gerente', 'vendedor', 'suporte'],
      },
      {
        nome: 'dashboard',
        route: '/dashboard/kpis',
        allowedPerfis: ['admin', 'gerente', 'vendedor', 'suporte', 'financeiro'],
      },
      {
        nome: 'comercial propostas',
        route: '/propostas',
        allowedPerfis: ['admin', 'gerente', 'vendedor', 'financeiro'],
      },
      {
        nome: 'comercial contratos',
        route: '/contratos',
        allowedPerfis: ['admin', 'gerente', 'vendedor', 'financeiro'],
      },
      {
        nome: 'crm produtos',
        route: '/produtos',
        allowedPerfis: ['admin', 'gerente', 'vendedor'],
      },
      {
        nome: 'crm oportunidades',
        route: '/oportunidades',
        allowedPerfis: ['admin', 'gerente', 'vendedor'],
      },
      {
        nome: 'crm agenda',
        route: '/eventos',
        allowedPerfis: ['admin', 'gerente', 'vendedor'],
      },
      {
        nome: 'crm clientes',
        route: '/clientes',
        allowedPerfis: ['admin', 'gerente', 'vendedor', 'suporte', 'financeiro'],
      },
      {
        nome: 'config automacoes triagem',
        route: '/triagem/sessao/5511999999999',
        allowedPerfis: ['admin', 'gerente'],
      },
      {
        nome: 'config automacoes ia',
        route: '/ia/stats',
        allowedPerfis: ['admin', 'gerente'],
      },
      {
        nome: 'financeiro pagamentos configuracoes',
        route: '/pagamentos/gateways/configuracoes',
        allowedPerfis: ['admin', 'financeiro'],
      },
      {
        nome: 'financeiro pagamentos transacoes',
        route: '/pagamentos/gateways/transacoes',
        allowedPerfis: ['admin', 'financeiro'],
      },
      {
        nome: 'financeiro fornecedores',
        route: '/fornecedores',
        allowedPerfis: ['admin', 'financeiro'],
      },
    ] as const;

    for (const cenario of cenarios) {
      it(`${cenario.nome}: permite ${cenario.allowedPerfis.join(', ')} e bloqueia os demais`, async () => {
        await assertRouteAccess(cenario.route, [...cenario.allowedPerfis]);
      });
    }
  });

  describe('matriz de acesso por recurso (write)', () => {
    type WriteScenario = {
      nome: string;
      method: HttpMethod;
      route?: string;
      routeFactory?: () => string;
      allowedPerfis: Perfil[];
      allowedStatuses?: number[];
      payload?: Record<string, unknown>;
      payloadFactory?: (perfil: Perfil) => Record<string, unknown> | undefined;
    };

    const cenarios: WriteScenario[] = [
      {
        nome: 'users.create',
        method: 'post',
        route: '/users',
        allowedPerfis: ['admin', 'gerente'],
        allowedStatuses: [201],
        payloadFactory: (perfil: Perfil) => {
          writeSequence += 1;
          return {
            nome: `E2E Write ${perfil} ${writeSequence}`,
            email: `e2e.write.${perfil}.${Date.now()}.${writeSequence}@conectcrm.local`,
            senha: TEST_PASSWORD,
            role: 'vendedor',
          };
        },
      },
      {
        nome: 'users.status.update',
        method: 'patch',
        route: `/users/${MANAGED_USER_ID}/status`,
        allowedPerfis: ['admin', 'gerente'],
        payload: { ativo: true },
      },
      {
        nome: 'users.update',
        method: 'put',
        route: `/users/${MANAGED_USER_ID}`,
        allowedPerfis: ['admin', 'gerente'],
        payload: { nome: 'Usuario vendedor atualizado E2E' },
      },
      {
        nome: 'users.reset-password',
        method: 'put',
        route: `/users/${MANAGED_USER_ID}/reset-senha`,
        allowedPerfis: ['admin', 'gerente'],
      },
      {
        nome: 'users.bulk.desativar',
        method: 'put',
        route: '/users/bulk/desativar',
        allowedPerfis: ['admin', 'gerente'],
        payload: { ids: [MANAGED_USER_ID] },
      },
      {
        nome: 'atendimento.tickets.create',
        method: 'post',
        route: '/atendimento/tickets',
        allowedPerfis: ['admin', 'gerente', 'suporte'],
        payload: {},
      },
      {
        nome: 'atendimento.tickets.update',
        method: 'put',
        route: `/atendimento/tickets/${UNKNOWN_UUID}`,
        allowedPerfis: ['admin', 'gerente', 'suporte'],
        payload: {},
      },
      {
        nome: 'atendimento.tickets.assign',
        method: 'post',
        route: `/atendimento/tickets/${UNKNOWN_UUID}/atribuir`,
        allowedPerfis: ['admin', 'gerente', 'suporte'],
        payload: { atendenteId: users.suporte.id },
      },
      {
        nome: 'atendimento.tickets.close',
        method: 'delete',
        route: `/atendimento/tickets/${UNKNOWN_UUID}`,
        allowedPerfis: ['admin', 'gerente', 'suporte'],
      },
      {
        nome: 'comercial.propostas.create',
        method: 'post',
        route: '/propostas',
        allowedPerfis: ['admin', 'gerente', 'vendedor'],
        allowedStatuses: [200, 201],
        payloadFactory: (perfil: Perfil) => {
          writeSequence += 1;
          return {
            titulo: `Proposta E2E ${perfil} ${writeSequence}`,
            cliente: `Cliente E2E ${writeSequence}`,
            valor: 1500,
            observacoes: 'E2E permissions write test',
          };
        },
      },
      {
        nome: 'comercial.propostas.update',
        method: 'put',
        routeFactory: () => `/propostas/${propostaBaseId}/status`,
        allowedPerfis: ['admin', 'gerente', 'vendedor'],
        allowedStatuses: [200],
        payload: { status: 'enviada' },
      },
      {
        nome: 'comercial.propostas.delete',
        method: 'delete',
        routeFactory: () => `/propostas/${propostaBaseId}`,
        allowedPerfis: ['admin', 'gerente'],
        allowedStatuses: [200],
      },
      {
        nome: 'crm.clientes.update',
        method: 'put',
        route: `/clientes/${UNKNOWN_UUID}`,
        allowedPerfis: ['admin', 'gerente', 'vendedor', 'suporte'],
        allowedStatuses: [200],
        payload: { nome: 'Cliente update e2e' },
      },
      {
        nome: 'crm.clientes.delete',
        method: 'delete',
        route: `/clientes/${UNKNOWN_UUID}`,
        allowedPerfis: ['admin', 'gerente'],
      },
      {
        nome: 'config.automacoes.triagem.iniciar',
        method: 'post',
        route: '/triagem/iniciar',
        allowedPerfis: ['admin', 'gerente'],
        payload: {},
      },
      {
        nome: 'config.automacoes.triagem.cancelar',
        method: 'delete',
        route: `/triagem/sessao/${UNKNOWN_UUID}`,
        allowedPerfis: ['admin', 'gerente'],
      },
      {
        nome: 'financeiro.faturamento.create',
        method: 'post',
        route: '/faturamento/faturas',
        allowedPerfis: ['admin', 'financeiro'],
        payload: {},
      },
      {
        nome: 'financeiro.faturamento.update',
        method: 'put',
        route: '/faturamento/faturas/999999',
        allowedPerfis: ['admin', 'financeiro'],
        payload: {},
      },
      {
        nome: 'financeiro.faturamento.delete',
        method: 'delete',
        route: '/faturamento/faturas/999999',
        allowedPerfis: ['admin', 'financeiro'],
      },
      {
        nome: 'financeiro.pagamentos.configuracoes.create',
        method: 'post',
        route: '/pagamentos/gateways/configuracoes',
        allowedPerfis: ['admin', 'financeiro'],
        payload: {},
      },
      {
        nome: 'financeiro.pagamentos.configuracoes.patch',
        method: 'patch',
        route: `/pagamentos/gateways/configuracoes/${UNKNOWN_UUID}`,
        allowedPerfis: ['admin', 'financeiro'],
        payload: {},
      },
      {
        nome: 'financeiro.pagamentos.configuracoes.delete',
        method: 'delete',
        route: `/pagamentos/gateways/configuracoes/${UNKNOWN_UUID}`,
        allowedPerfis: ['admin', 'financeiro'],
      },
      {
        nome: 'financeiro.pagamentos.transacoes.patch',
        method: 'patch',
        route: `/pagamentos/gateways/transacoes/${UNKNOWN_UUID}`,
        allowedPerfis: ['admin', 'financeiro'],
        payload: {},
      },
      {
        nome: 'financeiro.fornecedor.create',
        method: 'post',
        route: '/fornecedores',
        allowedPerfis: ['admin', 'financeiro'],
        payload: {},
      },
      {
        nome: 'financeiro.fornecedor.update',
        method: 'put',
        route: `/fornecedores/${UNKNOWN_UUID}`,
        allowedPerfis: ['admin', 'financeiro'],
        payload: {},
      },
      {
        nome: 'financeiro.fornecedor.delete',
        method: 'delete',
        route: `/fornecedores/${UNKNOWN_UUID}`,
        allowedPerfis: ['admin', 'financeiro'],
      },
    ];

    for (const cenario of cenarios) {
      it(`${cenario.nome}: permite ${cenario.allowedPerfis.join(', ')} e bloqueia os demais`, async () => {
        const route = cenario.routeFactory ? cenario.routeFactory() : cenario.route;
        if (!route) {
          throw new Error(`Cenario ${cenario.nome} sem rota definida`);
        }

        await assertWriteAccess(cenario.method, route, [...cenario.allowedPerfis], {
          allowedStatuses: cenario.allowedStatuses ? [...cenario.allowedStatuses] : undefined,
          payload: cenario.payload,
          payloadFactory: cenario.payloadFactory,
        });
      });
    }
  });
});



