import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { AddRichFieldsToContasPagar1802867000000 } from '../../src/migrations/1802867000000-AddRichFieldsToContasPagar';

type ContaPagarApi = {
  id: string;
  numero: string;
  descricao: string;
  numeroDocumento?: string;
  fornecedorId: string;
  status: string;
  valorTotal: number;
  valorPago: number;
  valorRestante: number;
  anexos: Array<Record<string, unknown>>;
  tags: string[];
  parcelasGeradas?: number;
  grupoRecorrenciaId?: string;
  comprovantePagamento?: string;
};

describe('ContasPagar (E2E)', () => {
  const runId = Date.now().toString();
  const testPassword = 'senha123';

  const empresaId = randomUUID();
  const superadminId = randomUUID();
  const vendedorId = randomUUID();
  const fornecedorId = randomUUID();

  const emailSuperadmin = `e2e.contapagar.superadmin.${runId}@conectcrm.local`;
  const emailVendedor = `e2e.contapagar.vendedor.${runId}@conectcrm.local`;

  let app: INestApplication;
  let dataSource: DataSource;
  let tokenSuperadmin: string;
  let tokenVendedor: string;
  let consoleLogSpy: jest.SpyInstance | null = null;

  jest.setTimeout(120000);

  const ensureContasPagarRichFields = async () => {
    const migration = new AddRichFieldsToContasPagar1802867000000();
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await migration.up(queryRunner);
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
      // Preserva logs n?o-SQL relevantes do teste/aplica??o.
      // eslint-disable-next-line no-console
      console.info(...args);
    });

    const moduleFixture: TestingModule = await withE2EBootstrapLock(() => Test.createTestingModule({
      imports: [AppModule],
    }).compile());

    app = await createE2EApp(moduleFixture);

    dataSource = app.get(DataSource);
    await ensureContasPagarRichFields();

    await criarEmpresa();
    await criarUsuarios();
    await criarFornecedor();

    tokenSuperadmin = await fazerLogin(emailSuperadmin, testPassword);
    tokenVendedor = await fazerLogin(emailVendedor, testPassword);
  });

  afterAll(async () => {
    await limparDadosTeste();
    await app.close();
    consoleLogSpy?.mockRestore();
  });

  it('deve criar conta recorrente em serie e persistir anexos/tags', async () => {
    const descricao = `Conta recorrente e2e ${runId}`;

    const response = await request(app.getHttpServer())
      .post('/contas-pagar')
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .send({
        fornecedorId,
        descricao,
        numeroDocumento: `NF-E2E-${runId.slice(-6)}`,
        dataEmissao: '2026-02-01',
        dataVencimento: '2026-03-10',
        valorOriginal: 1200,
        valorDesconto: 100,
        categoria: 'fornecedores',
        prioridade: 'alta',
        tipoPagamento: 'pix',
        recorrente: true,
        frequenciaRecorrencia: 'mensal',
        numeroParcelas: 3,
        tags: ['infra', 'assinatura'],
        anexos: [
          { nome: 'proposta.pdf', tipo: 'application/pdf', tamanho: 1024 },
          { nome: 'print.png', tipo: 'image/png', tamanho: 2048 },
        ],
      })
      .expect(201);

    const payload = extrairContaPagar(response.body);
    expect(payload.id).toBeTruthy();
    expect(payload.status).toBe('em_aberto');
    expect(Number(payload.valorTotal)).toBeCloseTo(1100, 2);
    expect(Number(payload.valorRestante)).toBeCloseTo(1100, 2);
    expect(payload.parcelasGeradas).toBe(3);
    expect(payload.grupoRecorrenciaId).toBeTruthy();
    expect(payload.numeroDocumento).toBe(`NF-E2E-${runId.slice(-6)}-01/03`);
    expect(payload.anexos).toHaveLength(2);
    expect(payload.tags).toEqual(
      expect.arrayContaining([
        'infra',
        'assinatura',
        'parcela:1/3',
        expect.stringMatching(/^recorrencia_grupo:/),
      ]),
    );

    const rows = await dataSource.query(
      `
        SELECT id, numero, numero_documento, data_vencimento, to_char(data_vencimento::date, 'YYYY-MM-DD') AS data_vencimento_fmt, tags, anexos, valor_total, valor_restante
        FROM contas_pagar
        WHERE empresa_id = $1 AND descricao = $2
        ORDER BY data_vencimento ASC
      `,
      [empresaId, descricao],
    );

    expect(rows).toHaveLength(3);
    expect(rows.map((r: any) => r.numero_documento)).toEqual([
      `NF-E2E-${runId.slice(-6)}-01/03`,
      `NF-E2E-${runId.slice(-6)}-02/03`,
      `NF-E2E-${runId.slice(-6)}-03/03`,
    ]);
    expect(rows[0].data_vencimento_fmt).toBe('2026-03-10');
    expect(rows[1].data_vencimento_fmt).toBe('2026-04-10');
    expect(rows[2].data_vencimento_fmt).toBe('2026-05-10');
    expect(Number(rows[0].valor_total)).toBeCloseTo(1100, 2);
    expect(Number(rows[0].valor_restante)).toBeCloseTo(1100, 2);

    const tagsPrimeira = parseJsonOrValue(rows[0].tags);
    const anexosPrimeira = parseJsonOrValue(rows[0].anexos);
    expect(tagsPrimeira).toEqual(
      expect.arrayContaining([
        'infra',
        'assinatura',
        'parcela:1/3',
        expect.stringMatching(/^recorrencia_grupo:/),
      ]),
    );
    expect(anexosPrimeira).toEqual([
      { nome: 'proposta.pdf', tipo: 'application/pdf', tamanho: 1024 },
      { nome: 'print.png', tipo: 'image/png', tamanho: 2048 },
    ]);
  });

  it('deve registrar pagamento com comprovante e refletir no retorno e no banco', async () => {
    const descricao = `Conta pagamento e2e ${runId}`;
    const createResponse = await request(app.getHttpServer())
      .post('/contas-pagar')
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .send({
        fornecedorId,
        descricao,
        dataVencimento: '2026-03-20',
        valorOriginal: 350,
        categoria: 'fornecedores',
        prioridade: 'media',
      })
      .expect(201);

    const contaCriada = extrairContaPagar(createResponse.body);

    const pagarResponse = await request(app.getHttpServer())
      .post(`/contas-pagar/${contaCriada.id}/registrar-pagamento`)
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .send({
        valorPago: 350,
        tipoPagamento: 'pix',
        contaBancariaId: 'conta-e2e',
        comprovantePagamento: `comp-${runId}.pdf`,
        observacoes: `pagamento e2e ${runId}`,
      })
      .expect(201);

    const contaPaga = extrairContaPagar(pagarResponse.body);
    expect(contaPaga.id).toBe(contaCriada.id);
    expect(contaPaga.status).toBe('pago');
    expect(Number(contaPaga.valorPago)).toBeCloseTo(350, 2);
    expect(Number(contaPaga.valorRestante)).toBeCloseTo(0, 2);
    expect(contaPaga.comprovantePagamento).toBe(`comp-${runId}.pdf`);

    const db = await dataSource.query(
      `
        SELECT status, valor_pago, valor_restante, comprovante_pagamento, observacoes
        FROM contas_pagar
        WHERE id = $1 AND empresa_id = $2
      `,
      [contaCriada.id, empresaId],
    );
    expect(db).toHaveLength(1);
    expect(db[0].status).toBe('paga');
    expect(Number(db[0].valor_pago)).toBeCloseTo(350, 2);
    expect(Number(db[0].valor_restante)).toBeCloseTo(0, 2);
    expect(db[0].comprovante_pagamento).toBe(`comp-${runId}.pdf`);
    expect(String(db[0].observacoes || '')).toContain(`pagamento e2e ${runId}`);
  });

  it('deve negar criacao para vendedor sem permissao de gestao financeira', async () => {
    await request(app.getHttpServer())
      .post('/contas-pagar')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({
        fornecedorId,
        descricao: `Conta negada ${runId}`,
        dataVencimento: '2026-03-25',
        valorOriginal: 10,
      })
      .expect(403);
  });

  async function criarEmpresa() {
    const suffix = runId.slice(-12).padStart(12, '0');
    const slug = `e2e-contas-pagar-${runId}`.slice(0, 60);
    const cnpj = `${suffix}77`.padStart(14, '0').slice(-14);

    await dataSource.query(
      `
        INSERT INTO empresas (id, nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        empresaId,
        `Empresa E2E ContasPagar ${runId}`,
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
      id: superadminId,
      nome: 'Superadmin E2E Contas Pagar',
      email: emailSuperadmin,
      role: 'superadmin',
      senhaHash,
    });

    await inserirUsuario({
      id: vendedorId,
      nome: 'Vendedor E2E Contas Pagar',
      email: emailVendedor,
      role: 'vendedor',
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

  async function criarFornecedor() {
    const cnpjCpf = `${runId.slice(-11)}33`.padStart(14, '0').slice(-14);
    await dataSource.query(
      `
        INSERT INTO fornecedores (id, nome, cnpj_cpf, empresa_id, email, telefone, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        fornecedorId,
        `Fornecedor E2E ContasPagar ${runId}`,
        cnpjCpf,
        empresaId,
        `fornecedor.contapagar.${runId}@conectcrm.local`,
        '11911111111',
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
      await dataSource.query(`DELETE FROM contas_pagar WHERE empresa_id = $1`, [empresaId]);
      await dataSource.query(`DELETE FROM fornecedores WHERE id = $1`, [fornecedorId]);
      await dataSource.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [[superadminId, vendedorId]]);
      await dataSource.query(`DELETE FROM empresas WHERE id = $1`, [empresaId]);
    } catch {
      // best effort
    }
  }

  function extrairContaPagar(body: any): ContaPagarApi {
    return (body?.data ?? body) as ContaPagarApi;
  }

  function parseJsonOrValue(value: unknown): any {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
});



