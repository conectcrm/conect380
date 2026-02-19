import { randomUUID } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

describe('Analytics Real Data (E2E)', () => {
  const runId = Date.now().toString();
  const testPassword = 'senha123';
  const testSource = `e2e-analytics-${runId}`;

  const adminEmpresaAId = randomUUID();
  const vendedorEmpresaAId = randomUUID();
  const adminEmpresaBId = randomUUID();
  const vendedorEmpresaBId = randomUUID();

  const emailAdminEmpresaA = `e2e.analytics.admin.a.${runId}@conectcrm.local`;
  const emailVendedorEmpresaA = `e2e.analytics.vendedor.a.${runId}@conectcrm.local`;
  const emailAdminEmpresaB = `e2e.analytics.admin.b.${runId}@conectcrm.local`;
  const emailVendedorEmpresaB = `e2e.analytics.vendedor.b.${runId}@conectcrm.local`;

  let app: INestApplication;
  let dataSource: DataSource;

  let empresaAId: string;
  let empresaBId: string;

  let tokenAdminEmpresaA: string;
  let tokenVendedorEmpresaA: string;
  let tokenAdminEmpresaB: string;

  const propostaIds: string[] = [];

  jest.setTimeout(120000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = app.get(DataSource);

    await criarEmpresasEUsuarios();
    tokenAdminEmpresaA = await fazerLogin(emailAdminEmpresaA, testPassword);
    tokenVendedorEmpresaA = await fazerLogin(emailVendedorEmpresaA, testPassword);
    tokenAdminEmpresaB = await fazerLogin(emailAdminEmpresaB, testPassword);

    await semearDadosAnalytics();
  });

  afterAll(async () => {
    await limparDadosTeste();
    await app.close();
  });

  async function criarEmpresa(label: 'A' | 'B'): Promise<string> {
    const suffix = `${runId}${label === 'A' ? '1' : '2'}`.slice(-12);
    const slug = `e2e-analytics-${label.toLowerCase()}-${runId}`;
    const cnpj = `${suffix}${label === 'A' ? '01' : '02'}`.padStart(14, '0').slice(-14);
    const email = `${slug}@conectcrm.local`;
    const subdominio = slug.slice(0, 90);

    const created = await dataSource.query(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        `Empresa Analytics ${label}`,
        slug,
        cnpj,
        email,
        '11999999999',
        'Rua E2E',
        'Sao Paulo',
        'SP',
        '01000-000',
        subdominio,
      ],
    );

    return created[0].id as string;
  }

  async function inserirUsuario(
    id: string,
    nome: string,
    email: string,
    empresaId: string,
    role: 'admin' | 'vendedor',
    senhaHash: string,
  ) {
    await dataSource.query(
      `
        INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [id, nome, email, senhaHash, empresaId, role, true],
    );
  }

  async function criarEmpresasEUsuarios() {
    empresaAId = await criarEmpresa('A');
    empresaBId = await criarEmpresa('B');

    const senhaHash = await bcrypt.hash(testPassword, 10);

    await inserirUsuario(
      adminEmpresaAId,
      'Admin Analytics A',
      emailAdminEmpresaA,
      empresaAId,
      'admin',
      senhaHash,
    );
    await inserirUsuario(
      vendedorEmpresaAId,
      'Vendedor Analytics A',
      emailVendedorEmpresaA,
      empresaAId,
      'vendedor',
      senhaHash,
    );
    await inserirUsuario(
      adminEmpresaBId,
      'Admin Analytics B',
      emailAdminEmpresaB,
      empresaBId,
      'admin',
      senhaHash,
    );
    await inserirUsuario(
      vendedorEmpresaBId,
      'Vendedor Analytics B',
      emailVendedorEmpresaB,
      empresaBId,
      'vendedor',
      senhaHash,
    );
  }

  async function fazerLogin(email: string, senha: string): Promise<string> {
    const response = await request(app.getHttpServer()).post('/auth/login').send({ email, senha });

    if (![200, 201].includes(response.status)) {
      throw new Error(`Falha no login para ${email}: status ${response.status}`);
    }

    const token = response.body?.data?.access_token ?? response.body?.access_token;
    if (!token) {
      throw new Error(`Token nao retornado no login para ${email}`);
    }

    return token as string;
  }

  async function criarPropostaViaApi(
    token: string,
    vendedor: { id: string; nome: string },
    titulo: string,
    cliente: string,
    valor: number,
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/propostas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo,
        cliente,
        valor,
        total: valor,
        source: testSource,
        vendedor,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.proposta).toHaveProperty('id');
    return response.body.proposta.id as string;
  }

  async function atualizarStatusProposta(
    token: string,
    propostaId: string,
    status: 'rascunho' | 'enviada' | 'aprovada',
  ) {
    const response = await request(app.getHttpServer())
      .put(`/propostas/${propostaId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status,
        source: testSource,
        observacoes: `ajuste status ${testSource}`,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
  }

  async function semearDadosAnalytics() {
    const propostaA1 = await criarPropostaViaApi(
      tokenAdminEmpresaA,
      { id: vendedorEmpresaAId, nome: 'Vendedor Analytics A' },
      `Proposta A1 ${runId}`,
      `Cliente A1 ${runId}`,
      12000,
    );
    await atualizarStatusProposta(tokenAdminEmpresaA, propostaA1, 'enviada');

    const propostaA2 = await criarPropostaViaApi(
      tokenAdminEmpresaA,
      { id: vendedorEmpresaAId, nome: 'Vendedor Analytics A' },
      `Proposta A2 ${runId}`,
      `Cliente A2 ${runId}`,
      15000,
    );
    await atualizarStatusProposta(tokenAdminEmpresaA, propostaA2, 'aprovada');

    const propostaA3 = await criarPropostaViaApi(
      tokenAdminEmpresaA,
      { id: adminEmpresaAId, nome: 'Admin Analytics A' },
      `Proposta A3 ${runId}`,
      `Cliente A3 ${runId}`,
      9000,
    );
    await atualizarStatusProposta(tokenAdminEmpresaA, propostaA3, 'rascunho');

    const propostaB1 = await criarPropostaViaApi(
      tokenAdminEmpresaB,
      { id: vendedorEmpresaBId, nome: 'Vendedor Analytics B' },
      `Proposta B1 ${runId}`,
      `Cliente B1 ${runId}`,
      30000,
    );
    await atualizarStatusProposta(tokenAdminEmpresaB, propostaB1, 'aprovada');

    propostaIds.push(propostaA1, propostaA2, propostaA3, propostaB1);
  }

  async function limparDadosTeste() {
    try {
      if (propostaIds.length > 0) {
        await dataSource.query(`DELETE FROM propostas WHERE id = ANY($1::uuid[])`, [propostaIds]);
      }

      await dataSource.query(
        `
          DELETE FROM users
          WHERE id = ANY($1::uuid[])
             OR email = ANY($2::text[])
        `,
        [
          [adminEmpresaAId, vendedorEmpresaAId, adminEmpresaBId, vendedorEmpresaBId],
          [emailAdminEmpresaA, emailVendedorEmpresaA, emailAdminEmpresaB, emailVendedorEmpresaB],
        ],
      );

      if (empresaAId || empresaBId) {
        await dataSource.query(`DELETE FROM empresas WHERE id = ANY($1::uuid[])`, [
          [empresaAId, empresaBId].filter(Boolean),
        ]);
      }
    } catch {
      // Cleanup best effort para ambientes e2e compartilhados.
    }
  }

  it('deve retornar dashboard da empresa A para perfil admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/analytics/dashboard')
      .query({ periodo: '30d' })
      .set('Authorization', `Bearer ${tokenAdminEmpresaA}`)
      .expect(200);

    expect(response.body).toHaveProperty('vendas');
    expect(response.body).toHaveProperty('funil');
    expect(response.body.funil.propostas_criadas).toBe(3);
  });

  it('deve retornar dashboard filtrado por vendedor para perfil vendedor', async () => {
    const response = await request(app.getHttpServer())
      .get('/analytics/dashboard')
      .query({ periodo: '30d', vendedor: vendedorEmpresaAId })
      .set('Authorization', `Bearer ${tokenVendedorEmpresaA}`)
      .expect(200);

    expect(response.body.funil.propostas_criadas).toBe(2);
    expect(Array.isArray(response.body.vendedores)).toBe(true);
    expect(response.body.vendedores).toHaveLength(1);
    expect(response.body.vendedores[0].id).toBe(vendedorEmpresaAId);
  });

  it('deve manter isolamento multi-tenant no dashboard', async () => {
    const empresaB = await request(app.getHttpServer())
      .get('/analytics/dashboard')
      .query({ periodo: '30d' })
      .set('Authorization', `Bearer ${tokenAdminEmpresaB}`)
      .expect(200);

    expect(empresaB.body.funil.propostas_criadas).toBe(1);

    const tentativaBypass = await request(app.getHttpServer())
      .get('/analytics/dashboard')
      .query({ periodo: '30d', vendedor: vendedorEmpresaAId })
      .set('Authorization', `Bearer ${tokenAdminEmpresaB}`)
      .expect(200);

    expect(tentativaBypass.body.funil.propostas_criadas).toBe(0);
  });

  it('deve responder endpoints secundarios do modulo analytics', async () => {
    const checks: Array<{ path: string; key: string; query?: Record<string, string> }> = [
      { path: '/analytics/funil-conversao', key: 'etapas', query: { periodo: '30d' } },
      { path: '/analytics/performance-vendedores', key: 'vendedores', query: { periodo: '30d' } },
      { path: '/analytics/evolucao-temporal', key: 'dados', query: { periodo: '30d' } },
      { path: '/analytics/tempo-medio-etapas', key: 'etapas', query: { periodo: '30d' } },
      { path: '/analytics/distribuicao-valores', key: 'faixas', query: { periodo: '30d' } },
      { path: '/analytics/previsao-fechamento', key: 'previsao_mensal', query: { periodo: '30d' } },
      { path: '/analytics/alertas-gestao', key: 'oportunidades', query: { periodo: '30d' } },
      { path: '/analytics/kpis-tempo-real', key: 'ultima_atualizacao' },
      { path: '/analytics/metas-progresso', key: 'metas', query: { periodo: '30d' } },
    ];

    for (const check of checks) {
      const req = request(app.getHttpServer())
        .get(check.path)
        .set('Authorization', `Bearer ${tokenAdminEmpresaA}`);

      if (check.query) req.query(check.query);

      const response = await req.expect(200);
      expect(response.body).toHaveProperty(check.key);
    }
  });

  it('deve exportar relatorio em formato xlsx', async () => {
    const response = await request(app.getHttpServer())
      .get('/analytics/export')
      .query({ periodo: '30d' })
      .set('Authorization', `Bearer ${tokenAdminEmpresaA}`)
      .expect(200);

    expect(response.header['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(response.header['content-disposition']).toContain('attachment; filename=');
    expect(response.body).toBeDefined();
  });
});
