import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { CreateContasBancarias1802881000000 } from '../../src/migrations/1802881000000-CreateContasBancarias';
import { CreateExtratosBancariosImportacoes1802883000000 } from '../../src/migrations/1802883000000-CreateExtratosBancariosImportacoes';
import { AddConciliacaoMetadataToExtratosItens1802884000000 } from '../../src/migrations/1802884000000-AddConciliacaoMetadataToExtratosItens';

describe('ConciliacaoBancaria (E2E)', () => {
  const runId = Date.now().toString();
  const testPassword = 'senha123';

  const empresaId = randomUUID();
  const superadminId = randomUUID();
  const contaBancariaId = randomUUID();

  const emailSuperadmin = `e2e.conciliacao.superadmin.${runId}@conectcrm.local`;

  let app: INestApplication;
  let dataSource: DataSource;
  let tokenSuperadmin: string;
  let consoleLogSpy: jest.SpyInstance | null = null;

  jest.setTimeout(120000);

  const ensureContasBancarias = async () => {
    const migration = new CreateContasBancarias1802881000000();
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await migration.up(queryRunner);
    } finally {
      await queryRunner.release();
    }
  };

  const ensureExtratosBancarios = async () => {
    const createMigration = new CreateExtratosBancariosImportacoes1802883000000();
    const metadataMigration = new AddConciliacaoMetadataToExtratosItens1802884000000();
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await createMigration.up(queryRunner);
      await metadataMigration.up(queryRunner);
    } finally {
      await queryRunner.release();
    }
  };

  beforeAll(async () => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      const firstArg = typeof args[0] === 'string' ? args[0] : '';
      const normalized = firstArg.toLowerCase();
      if (
        firstArg.startsWith('query:') ||
        normalized.includes('database config:') ||
        normalized.includes('email integrado configurado')
      ) {
        return;
      }
      // eslint-disable-next-line no-console
      console.info(...args);
    });

    const moduleFixture: TestingModule = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        imports: [AppModule],
      }).compile(),
    );

    app = await createE2EApp(moduleFixture);
    dataSource = app.get(DataSource);

    await ensureContasBancarias();
    await ensureExtratosBancarios();

    await criarEmpresa();
    await criarUsuarioSuperadmin();
    await criarContaBancaria();

    tokenSuperadmin = await fazerLogin(emailSuperadmin, testPassword);
  });

  afterAll(async () => {
    await limparDadosTeste();
    await app.close();
    consoleLogSpy?.mockRestore();
  });

  it('deve listar importacoes sem erro de metadata e retornar vazio inicialmente', async () => {
    const response = await request(app.getHttpServer())
      .get(`/conciliacao-bancaria/importacoes?contaBancariaId=${contaBancariaId}&limite=50`)
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .expect(200);

    const payload = extrairPayload(response.body);
    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toHaveLength(0);
  });

  it('deve importar csv e listar importacoes/itens da conciliacao', async () => {
    const csv = ['data,descricao,valor,documento', '2026-02-01,Pagamento fornecedor,-150.00,NF-100'].join(
      '\n',
    );

    const importResponse = await request(app.getHttpServer())
      .post('/conciliacao-bancaria/importacoes')
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .field('contaBancariaId', contaBancariaId)
      .attach('arquivo', Buffer.from(csv, 'utf8'), {
        filename: `extrato-e2e-${runId}.csv`,
        contentType: 'text/csv',
      })
      .expect(201);

    const importPayload = extrairPayload(importResponse.body);
    expect(importPayload?.importacao?.id).toBeTruthy();
    expect(importPayload?.importacao?.tipoArquivo).toBe('csv');
    expect(importPayload?.resumo?.totalLancamentos).toBe(1);

    const importacaoId = String(importPayload.importacao.id);

    const listResponse = await request(app.getHttpServer())
      .get(`/conciliacao-bancaria/importacoes?contaBancariaId=${contaBancariaId}&limite=50`)
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .expect(200);

    const importacoes = extrairPayload(listResponse.body);
    expect(Array.isArray(importacoes)).toBe(true);
    expect(importacoes.length).toBeGreaterThanOrEqual(1);
    expect(importacoes[0]).toEqual(
      expect.objectContaining({
        id: importacaoId,
        contaBancariaId,
      }),
    );

    const itensResponse = await request(app.getHttpServer())
      .get(`/conciliacao-bancaria/importacoes/${importacaoId}/itens?limite=50`)
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .expect(200);

    const itens = extrairPayload(itensResponse.body);
    expect(Array.isArray(itens)).toBe(true);
    expect(itens).toHaveLength(1);
    expect(itens[0]).toEqual(
      expect.objectContaining({
        importacaoId,
        conciliado: false,
        descricao: 'Pagamento fornecedor',
      }),
    );
  });

  async function criarEmpresa() {
    const suffix = runId.slice(-12).padStart(12, '0');
    const slug = `e2e-conciliacao-${runId}`.slice(0, 60);
    const cnpj = `${suffix}88`.padStart(14, '0').slice(-14);

    await dataSource.query(
      `
        INSERT INTO empresas (id, nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        empresaId,
        `Empresa E2E Conciliacao ${runId}`,
        slug,
        cnpj,
        `${slug}@conectcrm.local`,
        '11999999999',
        'Rua Teste',
        'Sao Paulo',
        'SP',
        '01000-000',
        slug,
      ],
    );
  }

  async function criarUsuarioSuperadmin() {
    const senhaHash = await bcrypt.hash(testPassword, 10);
    await inserirUsuario({
      id: superadminId,
      nome: 'Superadmin E2E Conciliacao',
      email: emailSuperadmin,
      role: 'superadmin',
      senhaHash,
    });
  }

  async function inserirUsuario(params: {
    id: string;
    nome: string;
    email: string;
    role: 'superadmin' | 'vendedor' | 'financeiro';
    senhaHash: string;
    permissoes?: string;
  }) {
    const permissaoColumnRows = await dataSource.query(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'permissoes'
        LIMIT 1
      `,
    );

    const hasPermissoesColumn = Array.isArray(permissaoColumnRows) && permissaoColumnRows.length > 0;

    if (hasPermissoesColumn) {
      await dataSource.query(
        `
          INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo, permissoes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          params.id,
          params.nome,
          params.email,
          params.senhaHash,
          empresaId,
          params.role,
          true,
          params.permissoes || null,
        ],
      );
      return;
    }

    await dataSource.query(
      `
        INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [params.id, params.nome, params.email, params.senhaHash, empresaId, params.role, true],
    );
  }

  async function criarContaBancaria() {
    await dataSource.query(
      `
        INSERT INTO contas_bancarias (
          id, empresa_id, nome, banco, agencia, conta, tipo_conta, saldo, chave_pix, ativo
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        contaBancariaId,
        empresaId,
        `Conta Conciliacao E2E ${runId}`,
        'Banco Teste',
        '0001',
        '12345-6',
        'corrente',
        1000,
        `pix-conciliacao-${runId}@conectcrm.local`,
        true,
      ],
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

  async function limparDadosTeste() {
    try {
      await dataSource.query(`DELETE FROM extratos_bancarios_itens WHERE empresa_id = $1`, [empresaId]);
      await dataSource.query(`DELETE FROM extratos_bancarios_importacoes WHERE empresa_id = $1`, [empresaId]);
      await dataSource.query(`DELETE FROM contas_bancarias WHERE id = $1`, [contaBancariaId]);
      await dataSource.query(`DELETE FROM users WHERE id = $1`, [superadminId]);
      await dataSource.query(`DELETE FROM empresas WHERE id = $1`, [empresaId]);
    } catch {
      // best effort
    }
  }

  function extrairPayload(body: any): any {
    return body?.data ?? body;
  }
});
