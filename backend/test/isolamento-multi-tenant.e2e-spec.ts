import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Isolamento Multi-Tenant (E2E)', () => {
  const runId = Date.now().toString();
  const testPassword = 'senha123';
  const testSource = `e2e-isolamento-${runId}`;
  const emailEmpresaA = `e2e.isolamento.a.${runId}@conectcrm.local`;
  const emailEmpresaB = `e2e.isolamento.b.${runId}@conectcrm.local`;
  const userEmpresaAId = randomUUID();
  const userEmpresaBId = randomUUID();

  let app: INestApplication;
  let dataSource: DataSource;

  let tokenEmpresaA: string;
  let tokenEmpresaB: string;
  let empresaAId: string;
  let empresaBId: string;

  let clienteEmpresaAId: string;
  let clienteEmpresaBId: string;
  let propostaEmpresaAId: string;
  let propostaEmpresaBId: string;

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

    tokenEmpresaA = await fazerLogin(emailEmpresaA, testPassword);
    tokenEmpresaB = await fazerLogin(emailEmpresaB, testPassword);
  });

  afterAll(async () => {
    await limparDadosTeste();
    await app.close();
  });

  async function criarEmpresa(label: 'A' | 'B'): Promise<string> {
    const suffix = `${runId}${label === 'A' ? '1' : '2'}`.slice(-12);
    const slug = `e2e-isolamento-${label.toLowerCase()}-${runId}`;
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
        `Empresa ${label} E2E`,
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

  async function criarEmpresasEUsuarios() {
    empresaAId = await criarEmpresa('A');
    empresaBId = await criarEmpresa('B');

    const senhaHash = await bcrypt.hash(testPassword, 10);

    await dataSource.query(
      `
        INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [userEmpresaAId, 'Admin E2E Empresa A', emailEmpresaA, senhaHash, empresaAId, 'admin', true],
    );

    await dataSource.query(
      `
        INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [userEmpresaBId, 'Admin E2E Empresa B', emailEmpresaB, senhaHash, empresaBId, 'admin', true],
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

    return token;
  }

  async function limparDadosTeste() {
    try {
      await dataSource.query(`DELETE FROM propostas WHERE source = $1`, [testSource]);

      if (clienteEmpresaAId || clienteEmpresaBId) {
        await dataSource.query(`DELETE FROM clientes WHERE id = ANY($1::uuid[])`, [
          [clienteEmpresaAId, clienteEmpresaBId].filter(Boolean),
        ]);
      }

      await dataSource.query(
        `
          DELETE FROM users
          WHERE id = ANY($1::uuid[])
             OR email = ANY($2::text[])
        `,
        [
          [userEmpresaAId, userEmpresaBId],
          [emailEmpresaA, emailEmpresaB],
        ],
      );

      if (empresaAId || empresaBId) {
        await dataSource.query(`DELETE FROM empresas WHERE id = ANY($1::uuid[])`, [
          [empresaAId, empresaBId].filter(Boolean),
        ]);
      }
    } catch (error) {
      // No-op: cleanup best effort for E2E environments.
    }
  }

  describe('Clientes', () => {
    it('Empresa A deve criar cliente', async () => {
      const response = await request(app.getHttpServer())
        .post('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .send({
          nome: 'Cliente A E2E',
          email: `cliente-a-${runId}@teste.com`,
          telefone: '11999999999',
          tipo: 'pessoa_fisica',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      clienteEmpresaAId = response.body.data.id;
    });

    it('Empresa B deve criar cliente', async () => {
      const response = await request(app.getHttpServer())
        .post('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresaB}`)
        .send({
          nome: 'Cliente B E2E',
          email: `cliente-b-${runId}@teste.com`,
          telefone: '11988888888',
          tipo: 'pessoa_fisica',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      clienteEmpresaBId = response.body.data.id;
    });

    it('Empresa A nao deve ver cliente da Empresa B na listagem', async () => {
      const response = await request(app.getHttpServer())
        .get('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      const clientes = response.body.data;
      const idsRetornados = clientes.map((cliente: { id: string }) => cliente.id);

      expect(idsRetornados).toContain(clienteEmpresaAId);
      expect(idsRetornados).not.toContain(clienteEmpresaBId);
    });

    it('Empresa A nao deve acessar cliente da Empresa B por id', async () => {
      await request(app.getHttpServer())
        .get(`/clientes/${clienteEmpresaBId}`)
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .expect(404);
    });

    it('nao deve permitir forcar empresa_id no payload do cliente', async () => {
      const emailHack = `hack-${runId}@teste.com`;

      const createResponse = await request(app.getHttpServer())
        .post('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .send({
          nome: 'Cliente Hack E2E',
          email: emailHack,
          tipo: 'pessoa_fisica',
          empresa_id: empresaBId,
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);

      const listEmpresaB = await request(app.getHttpServer())
        .get('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresaB}`)
        .expect(200);

      const encontrado = (listEmpresaB.body.data || []).find(
        (cliente: { email?: string }) => cliente.email === emailHack,
      );

      expect(encontrado).toBeUndefined();
    });
  });

  describe('Propostas', () => {
    it('Empresa A deve criar proposta', async () => {
      const response = await request(app.getHttpServer())
        .post('/propostas')
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .send({
          titulo: 'Proposta A E2E',
          cliente: 'Cliente A E2E',
          valor: 5000,
          total: 5000,
          source: testSource,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.proposta).toHaveProperty('id');
      propostaEmpresaAId = response.body.proposta.id;
    });

    it('Empresa B deve criar proposta', async () => {
      const response = await request(app.getHttpServer())
        .post('/propostas')
        .set('Authorization', `Bearer ${tokenEmpresaB}`)
        .send({
          titulo: 'Proposta B E2E',
          cliente: 'Cliente B E2E',
          valor: 8000,
          total: 8000,
          source: testSource,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.proposta).toHaveProperty('id');
      propostaEmpresaBId = response.body.proposta.id;
    });

    it('Empresa A nao deve acessar proposta da Empresa B por id', async () => {
      await request(app.getHttpServer())
        .get(`/propostas/${propostaEmpresaBId}`)
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .expect(404);
    });

    it('Empresa A nao deve ver proposta da Empresa B na listagem', async () => {
      const response = await request(app.getHttpServer())
        .get('/propostas')
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.propostas)).toBe(true);

      const idsRetornados = response.body.propostas.map((proposta: { id: string }) => proposta.id);
      expect(idsRetornados).toContain(propostaEmpresaAId);
      expect(idsRetornados).not.toContain(propostaEmpresaBId);
    });
  });
});
