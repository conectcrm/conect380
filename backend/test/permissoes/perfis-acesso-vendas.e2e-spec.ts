import { INestApplication } from '@nestjs/common';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

describe('Permissoes por Perfil - Vendas (E2E)', () => {
  const TEST_PASSWORD = 'senha123';
  const EMPRESA_SLUG = `e2e-permissoes-vendas-${Date.now()}`;
  const UNKNOWN_UUID = '00000000-0000-4000-8000-000000009999';
  type Perfil = 'admin' | 'gerente' | 'vendedor' | 'suporte' | 'financeiro';
  type HttpMethod = 'post' | 'put' | 'patch' | 'delete';
  const perfis: Perfil[] = ['admin', 'gerente', 'vendedor', 'suporte', 'financeiro'];

  let app: INestApplication;
  let dataSource: DataSource;
  let empresaId: string;
  let propostaBaseId = '';
  let writeSequence = 0;

  const users: Record<Perfil, { id: string; email: string; role: Perfil }> = {
    admin: {
      id: randomUUID(),
      email: `e2e.vendas.admin.${Date.now()}@conectcrm.local`,
      role: 'admin',
    },
    gerente: {
      id: randomUUID(),
      email: `e2e.vendas.gerente.${Date.now()}@conectcrm.local`,
      role: 'gerente',
    },
    vendedor: {
      id: randomUUID(),
      email: `e2e.vendas.vendedor.${Date.now()}@conectcrm.local`,
      role: 'vendedor',
    },
    suporte: {
      id: randomUUID(),
      email: `e2e.vendas.suporte.${Date.now()}@conectcrm.local`,
      role: 'suporte',
    },
    financeiro: {
      id: randomUUID(),
      email: `e2e.vendas.financeiro.${Date.now()}@conectcrm.local`,
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

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: TEST_PASSWORD })
      .expect(201);

    return response.body.data.access_token as string;
  };

  const assertReadAccess = async (
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
    const allowedStatuses = options?.allowedStatuses ?? [200, 201, 204, 400, 404, 409, 422, 501];

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
    const moduleFixture: TestingModule = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        imports: [AppModule],
      }).compile(),
    );

    app = await createE2EApp(moduleFixture);
    dataSource = app.get(DataSource);

    const empresa = await dataSource.query(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        'Empresa E2E Permissoes Vendas',
        EMPRESA_SLUG,
        `${Date.now()}`.slice(-14).padStart(14, '0'),
        `${EMPRESA_SLUG}@conectcrm.local`,
        '11999999999',
        'Rua E2E Permissoes Vendas',
        'Sao Paulo',
        'SP',
        '01000-000',
        EMPRESA_SLUG.slice(0, 100),
      ],
    );
    empresaId = empresa[0].id;

    const senhaHash = await bcrypt.hash(TEST_PASSWORD, 10);
    for (const perfil of perfis) {
      const user = users[perfil];
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
        [user.id, `Usuario ${user.role}`, user.email, senhaHash, empresaId, user.role],
      );
    }

    tokens.admin = await login(users.admin.email);
    tokens.gerente = await login(users.gerente.email);
    tokens.vendedor = await login(users.vendedor.email);
    tokens.suporte = await login(users.suporte.email);
    tokens.financeiro = await login(users.financeiro.email);

    const propostaBaseResponse = await request(app.getHttpServer())
      .post('/propostas')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        titulo: `Proposta Base Vendas E2E ${Date.now()}`,
        cliente: 'Cliente Base Vendas E2E',
        valor: 1000,
      })
      .expect(201);

    propostaBaseId = propostaBaseResponse.body?.proposta?.id;
    if (!propostaBaseId) {
      throw new Error('Nao foi possivel criar proposta base para testes de permissao de vendas');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('matriz read - vendas', () => {
    const cenarios = [
      {
        nome: 'crm leads',
        route: '/leads',
        allowedPerfis: ['admin', 'gerente', 'vendedor', 'suporte'],
      },
      {
        nome: 'crm oportunidades',
        route: '/oportunidades',
        allowedPerfis: ['admin', 'gerente', 'vendedor'],
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
        nome: 'financeiro faturamento',
        route: '/faturamento/faturas',
        allowedPerfis: ['admin', 'financeiro'],
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
        await assertReadAccess(cenario.route, [...cenario.allowedPerfis]);
      });
    }
  });

  describe('matriz write - vendas', () => {
    it('comercial.propostas.create', async () => {
      await assertWriteAccess('post', '/propostas', ['admin', 'gerente', 'vendedor'], {
        allowedStatuses: [200, 201],
        payloadFactory: (perfil: Perfil) => {
          writeSequence += 1;
          return {
            titulo: `Proposta Vendas ${perfil} ${writeSequence}`,
            cliente: `Cliente Vendas ${writeSequence}`,
            valor: 1500,
          };
        },
      });
    });

    it('comercial.propostas.update-status', async () => {
      await assertWriteAccess(
        'put',
        `/propostas/${propostaBaseId}/status`,
        ['admin', 'gerente', 'vendedor'],
        {
          allowedStatuses: [200],
          payload: { status: 'enviada' },
        },
      );
    });

    it('comercial.propostas.delete', async () => {
      await assertWriteAccess('delete', `/propostas/${UNKNOWN_UUID}`, ['admin', 'gerente'], {
        allowedStatuses: [200, 404],
      });
    });

    it('financeiro.faturamento.create', async () => {
      await assertWriteAccess('post', '/faturamento/faturas', ['admin', 'financeiro'], {
        payload: {},
      });
    });

    it('financeiro.faturamento.update', async () => {
      await assertWriteAccess('put', '/faturamento/faturas/999999', ['admin', 'financeiro'], {
        payload: {},
      });
    });

    it('financeiro.faturamento.delete', async () => {
      await assertWriteAccess('delete', '/faturamento/faturas/999999', ['admin', 'financeiro']);
    });

    it('financeiro.pagamentos.configuracoes.create', async () => {
      await assertWriteAccess(
        'post',
        '/pagamentos/gateways/configuracoes',
        ['admin', 'financeiro'],
        {
          payload: {},
        },
      );
    });

    it('financeiro.pagamentos.configuracoes.patch', async () => {
      await assertWriteAccess(
        'patch',
        `/pagamentos/gateways/configuracoes/${UNKNOWN_UUID}`,
        ['admin', 'financeiro'],
        {
          payload: {},
        },
      );
    });

    it('financeiro.pagamentos.configuracoes.delete', async () => {
      await assertWriteAccess(
        'delete',
        `/pagamentos/gateways/configuracoes/${UNKNOWN_UUID}`,
        ['admin', 'financeiro'],
      );
    });

    it('financeiro.pagamentos.transacoes.patch', async () => {
      await assertWriteAccess(
        'patch',
        `/pagamentos/gateways/transacoes/${UNKNOWN_UUID}`,
        ['admin', 'financeiro'],
        {
          payload: {},
        },
      );
    });

    it('financeiro.fornecedores.create', async () => {
      await assertWriteAccess('post', '/fornecedores', ['admin', 'financeiro'], {
        payload: {},
      });
    });

    it('financeiro.fornecedores.update', async () => {
      await assertWriteAccess('put', `/fornecedores/${UNKNOWN_UUID}`, ['admin', 'financeiro'], {
        payload: {},
      });
    });

    it('financeiro.fornecedores.delete', async () => {
      await assertWriteAccess('delete', `/fornecedores/${UNKNOWN_UUID}`, ['admin', 'financeiro']);
    });
  });
});
