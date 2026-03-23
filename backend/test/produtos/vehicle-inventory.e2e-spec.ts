import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { CreateVehicleInventoryItems1808300000000 } from '../../src/migrations/1808300000000-CreateVehicleInventoryItems';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';

describe('Vehicle Inventory (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const runId = Date.now().toString();
  const testPassword = 'Vehicle@123';
  const testPasswordHashPromise = bcrypt.hash(testPassword, 10);

  const empresaAEmail = `e2e.vehicle.a.${runId}@conectcrm.local`;
  const empresaBEmail = `e2e.vehicle.b.${runId}@conectcrm.local`;
  const empresaAUserId = randomUUID();
  const empresaBUserId = randomUUID();

  let empresaAId = '';
  let empresaBId = '';
  let tokenEmpresaA = '';
  let tokenEmpresaB = '';
  let createdVehicleId = '';

  jest.setTimeout(120000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        imports: [AppModule],
      }).compile(),
    );

    app = await createE2EApp(moduleFixture);
    dataSource = app.get(DataSource);

    await garantirInfraVehicleInventory();

    empresaAId = await criarEmpresa('A');
    empresaBId = await criarEmpresa('B');

    const senhaHash = await testPasswordHashPromise;
    await criarUsuario(empresaAUserId, 'Gerente Veiculos A', empresaAEmail, empresaAId, senhaHash);
    await criarUsuario(empresaBUserId, 'Gerente Veiculos B', empresaBEmail, empresaBId, senhaHash);

    tokenEmpresaA = await fazerLogin(empresaAEmail, testPassword);
    tokenEmpresaB = await fazerLogin(empresaBEmail, testPassword);
  });

  afterAll(async () => {
    await limparDadosTeste();
    await app?.close();
  });

  it('cria, atualiza status, remove e restaura item com isolamento multi-tenant', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/vehicle-inventory/items')
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .send({
        marca: 'Toyota',
        modelo: `Corolla E2E ${runId}`,
        anoFabricacao: 2024,
        anoModelo: 2025,
        placa: `E2E${runId.slice(-4)}A`,
        valorVenda: 135000,
        status: 'disponivel',
      })
      .expect(201);

    expect(createResponse.body?.id).toBeTruthy();
    expect(createResponse.body?.status).toBe('disponivel');
    createdVehicleId = createResponse.body.id;

    await request(app.getHttpServer())
      .patch(`/vehicle-inventory/items/${createdVehicleId}/status`)
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .send({ status: 'reservado' })
      .expect(200);

    const empresaAList = await request(app.getHttpServer())
      .get('/vehicle-inventory/items')
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .expect(200);

    const empresaAItems = Array.isArray(empresaAList.body?.data) ? empresaAList.body.data : [];
    const vehicleFromA = empresaAItems.find((item: any) => item.id === createdVehicleId);
    expect(vehicleFromA).toBeTruthy();
    expect(vehicleFromA?.status).toBe('reservado');

    await request(app.getHttpServer())
      .get(`/vehicle-inventory/items/${createdVehicleId}`)
      .set('Authorization', `Bearer ${tokenEmpresaB}`)
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/vehicle-inventory/items/${createdVehicleId}`)
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .expect(200);

    const includeDeletedList = await request(app.getHttpServer())
      .get('/vehicle-inventory/items?includeDeleted=true')
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .expect(200);

    const deletedVehicle = (includeDeletedList.body?.data || []).find(
      (item: any) => item.id === createdVehicleId,
    );
    expect(deletedVehicle).toBeTruthy();
    expect(deletedVehicle?.deletedAt).toBeTruthy();

    const restoreResponse = await request(app.getHttpServer())
      .patch(`/vehicle-inventory/items/${createdVehicleId}/restore`)
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .send({ status: 'disponivel' })
      .expect(200);

    expect(restoreResponse.body?.deletedAt).toBeNull();
    expect(restoreResponse.body?.status).toBe('disponivel');
  });

  async function criarEmpresa(label: 'A' | 'B'): Promise<string> {
    const suffix = `${runId}${label === 'A' ? '1' : '2'}`.slice(-12);
    const slug = `e2e-vehicle-${label.toLowerCase()}-${runId}`;
    const cnpj = `${suffix}${label === 'A' ? '01' : '02'}`.padStart(14, '0').slice(-14);
    const email = `${slug}@conectcrm.local`;
    const subdominio = slug.slice(0, 90);

    const result = await dataSource.query(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        `Empresa Vehicle ${label}`,
        slug,
        cnpj,
        email,
        '11999999999',
        'Rua Vehicle E2E',
        'Sao Paulo',
        'SP',
        '01000-000',
        subdominio,
      ],
    );

    return String(result[0]?.id || '').trim();
  }

  async function criarUsuario(
    id: string,
    nome: string,
    email: string,
    empresaId: string,
    senhaHash: string,
  ): Promise<void> {
    await dataSource.query(
      `
        INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [id, nome, email, senhaHash, empresaId, 'gerente', true],
    );
  }

  async function garantirInfraVehicleInventory(): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      const hasVehicleTable = await queryRunner.hasTable('vehicle_inventory_items');
      if (hasVehicleTable) return;

      const migration = new CreateVehicleInventoryItems1808300000000();
      await migration.up(queryRunner);
    } finally {
      await queryRunner.release();
    }
  }

  function extractAccessToken(body: Record<string, any> | undefined): string | null {
    if (!body || typeof body !== 'object') return null;
    return body?.data?.access_token || body?.access_token || null;
  }

  async function fazerLogin(email: string, senha: string): Promise<string> {
    const response = await request(app.getHttpServer()).post('/auth/login').send({ email, senha });

    if (![200, 201].includes(response.status)) {
      throw new Error(`Falha no login para ${email}: status ${response.status}`);
    }

    const tokenDireto = extractAccessToken(response.body);
    if (tokenDireto) {
      return tokenDireto;
    }

    if (response.body?.action !== 'MFA_REQUIRED') {
      throw new Error(`Token nao retornado no login para ${email}`);
    }

    const challengeId = String(response.body?.data?.challengeId || '').trim();
    if (!challengeId) {
      throw new Error(`Challenge MFA nao retornado no login para ${email}`);
    }

    const codigoMfa = String(response.body?.data?.devCode || '').trim();
    if (!codigoMfa) {
      throw new Error(`MFA requerido para ${email}, mas devCode nao foi retornado`);
    }

    const verifyResponse = await request(app.getHttpServer()).post('/auth/mfa/verify').send({
      challengeId,
      codigo: codigoMfa,
    });

    if (![200, 201].includes(verifyResponse.status)) {
      throw new Error(`Falha ao validar MFA para ${email}: status ${verifyResponse.status}`);
    }

    const tokenMfa = extractAccessToken(verifyResponse.body);
    if (!tokenMfa) {
      throw new Error(`Token nao retornado apos validacao MFA para ${email}`);
    }

    return tokenMfa;
  }

  async function limparDadosTeste(): Promise<void> {
    const fallbackEmpresaA = empresaAId || '00000000-0000-0000-0000-000000000000';
    const fallbackEmpresaB = empresaBId || '00000000-0000-0000-0000-000000000000';

    if (createdVehicleId) {
      await dataSource
        ?.query(`DELETE FROM vehicle_inventory_items WHERE id::text = $1`, [createdVehicleId])
        .catch(() => undefined);
    }

    await dataSource
      ?.query(`DELETE FROM vehicle_inventory_items WHERE empresa_id IN ($1, $2)`, [
        fallbackEmpresaA,
        fallbackEmpresaB,
      ])
      .catch(() => undefined);

    await dataSource
      ?.query(`DELETE FROM users WHERE email IN ($1, $2)`, [empresaAEmail, empresaBEmail])
      .catch(() => undefined);

    await dataSource
      ?.query(`DELETE FROM empresas WHERE id IN ($1, $2)`, [fallbackEmpresaA, fallbackEmpresaB])
      .catch(() => undefined);
  }
});
