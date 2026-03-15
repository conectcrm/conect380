import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { AddAlcadaAprovacaoFinanceiraToEmpresaConfiguracoes1802882000000 } from '../../src/migrations/1802882000000-AddAlcadaAprovacaoFinanceiraToEmpresaConfiguracoes';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';

describe('Configuracao Empresa (E2E)', () => {
  const runId = Date.now().toString();
  const testPassword = 'senha123';

  const empresaId = randomUUID();
  const adminId = randomUUID();
  const gerenteId = randomUUID();

  const emailAdmin = `e2e.config.empresa.admin.${runId}@conectcrm.local`;
  const emailGerente = `e2e.config.empresa.gerente.${runId}@conectcrm.local`;
  const backupDir = path.resolve(process.cwd(), 'backups', 'empresa-configuracoes', empresaId);

  let app: INestApplication;
  let dataSource: DataSource;
  let tokenAdmin: string;
  let tokenGerente: string;
  let consoleLogSpy: jest.SpyInstance | null = null;

  jest.setTimeout(120000);

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

    await ensureAlcadaAprovacaoFinanceira();
    await criarEmpresa();
    await criarUsuarios();

    tokenAdmin = await fazerLogin(emailAdmin, testPassword);
    tokenGerente = await fazerLogin(emailGerente, testPassword);
  });

  afterAll(async () => {
    await limparDadosTeste();
    await app.close();
    consoleLogSpy?.mockRestore();
  });

  it('permite leitura da configuracao para gerente e cria padrao automaticamente', async () => {
    const response = await request(app.getHttpServer())
      .get('/empresas/config')
      .set('Authorization', `Bearer ${tokenGerente}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        empresaId,
        corPrimaria: expect.any(String),
        corSecundaria: expect.any(String),
      }),
    );
  });

  it('permite atualizar configuracoes e dados basicos da empresa para admin', async () => {
    const responseConfig = await request(app.getHttpServer())
      .put('/empresas/config')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        descricao: `Configuracao E2E ${runId}`,
        corPrimaria: '#123456',
        corSecundaria: '#654321',
        conviteExpiracaoHoras: 72,
        webhooksAtivos: 3,
        backupRetencaoDias: 45,
        alcadaAprovacaoFinanceira: 1500.5,
      })
      .expect(200);

    expect(responseConfig.body).toEqual(
      expect.objectContaining({
        empresaId,
        descricao: `Configuracao E2E ${runId}`,
        corPrimaria: '#123456',
        corSecundaria: '#654321',
        conviteExpiracaoHoras: 72,
        webhooksAtivos: 3,
        backupRetencaoDias: 45,
      }),
    );

    const rowConfig = await dataSource.query(
      `
        SELECT
          descricao,
          cor_primaria,
          cor_secundaria,
          convite_expiracao_horas,
          webhooks_ativos,
          backup_retencao_dias,
          alcada_aprovacao_financeira
        FROM empresa_configuracoes
        WHERE empresa_id = $1
      `,
      [empresaId],
    );

    expect(rowConfig).toHaveLength(1);
    expect(rowConfig[0].descricao).toBe(`Configuracao E2E ${runId}`);
    expect(rowConfig[0].cor_primaria).toBe('#123456');
    expect(rowConfig[0].cor_secundaria).toBe('#654321');
    expect(Number(rowConfig[0].convite_expiracao_horas)).toBe(72);
    expect(Number(rowConfig[0].webhooks_ativos)).toBe(3);
    expect(Number(rowConfig[0].backup_retencao_dias)).toBe(45);
    expect(Number(rowConfig[0].alcada_aprovacao_financeira)).toBeCloseTo(1500.5, 2);

    const responseEmpresa = await request(app.getHttpServer())
      .put(`/empresas/${empresaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        telefone: '11912345678',
      })
      .expect(200);

    expect(responseEmpresa.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: empresaId,
          telefone: '11912345678',
        }),
      }),
    );
  });

  it('nega escrita para gerente nos endpoints de configuracao e empresa', async () => {
    await request(app.getHttpServer())
      .put('/empresas/config')
      .set('Authorization', `Bearer ${tokenGerente}`)
      .send({
        corPrimaria: '#000000',
      })
      .expect(403);

    await request(app.getHttpServer())
      .post('/empresas/config/backup/execute')
      .set('Authorization', `Bearer ${tokenGerente}`)
      .send({})
      .expect(403);

    await request(app.getHttpServer())
      .put(`/empresas/${empresaId}`)
      .set('Authorization', `Bearer ${tokenGerente}`)
      .send({
        telefone: '11900000000',
      })
      .expect(403);
  });

  it('retorna erro de validacao no teste SMTP quando faltam campos obrigatorios', async () => {
    const response = await request(app.getHttpServer())
      .post('/empresas/config/smtp/test')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({})
      .expect(400);

    const mensagem =
      typeof response.body?.message === 'string'
        ? response.body.message
        : Array.isArray(response.body?.message)
          ? response.body.message.join(' ')
          : '';

    expect(mensagem.toLowerCase()).toContain('preencha');
  });

  it('executa backup e lista historico', async () => {
    const executeResponse = await request(app.getHttpServer())
      .post('/empresas/config/backup/execute')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect([200, 201]).toContain(executeResponse.status);
    expect(executeResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        backup: expect.objectContaining({
          fileName: expect.any(String),
          sizeBytes: expect.any(Number),
        }),
      }),
    );

    const fileName = executeResponse.body?.backup?.fileName as string;
    expect(fileName).toBeTruthy();

    const fileStat = await fs.stat(path.join(backupDir, fileName));
    expect(fileStat.isFile()).toBe(true);
    expect(fileStat.size).toBeGreaterThan(0);

    const historyResponse = await request(app.getHttpServer())
      .get('/empresas/config/backup/history?limit=5')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(Array.isArray(historyResponse.body)).toBe(true);
    expect(historyResponse.body.length).toBeGreaterThan(0);
    expect(historyResponse.body[0]).toEqual(
      expect.objectContaining({
        fileName: expect.any(String),
        generatedAt: expect.any(String),
        sizeBytes: expect.any(Number),
      }),
    );

    const fileNames = historyResponse.body.map((item: { fileName: string }) => item.fileName);
    expect(fileNames).toContain(fileName);
  });

  async function ensureAlcadaAprovacaoFinanceira() {
    const migration = new AddAlcadaAprovacaoFinanceiraToEmpresaConfiguracoes1802882000000();
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await migration.up(queryRunner);
    } finally {
      await queryRunner.release();
    }
  }

  async function criarEmpresa() {
    const suffix = runId.slice(-12).padStart(12, '0');
    const slug = `e2e-config-empresa-${runId}`.slice(0, 60);
    const cnpj = `${suffix}11`.padStart(14, '0').slice(-14);

    await dataSource.query(
      `
        INSERT INTO empresas (id, nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        empresaId,
        `Empresa E2E Config ${runId}`,
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

  async function criarUsuarios() {
    const senhaHash = await bcrypt.hash(testPassword, 10);

    await inserirUsuario({
      id: adminId,
      nome: 'Admin E2E Config Empresa',
      email: emailAdmin,
      role: 'admin',
      senhaHash,
    });

    await inserirUsuario({
      id: gerenteId,
      nome: 'Gerente E2E Config Empresa',
      email: emailGerente,
      role: 'gerente',
      senhaHash,
    });
  }

  async function inserirUsuario(params: {
    id: string;
    nome: string;
    email: string;
    role: 'admin' | 'gerente';
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
      await dataSource.query(`DELETE FROM empresa_configuracoes WHERE empresa_id = $1`, [empresaId]);
      await dataSource.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [[adminId, gerenteId]]);
      await dataSource.query(`DELETE FROM empresas WHERE id = $1`, [empresaId]);
    } catch {
      // best effort
    }

    await fs.rm(backupDir, { recursive: true, force: true }).catch(() => undefined);
  }
});

