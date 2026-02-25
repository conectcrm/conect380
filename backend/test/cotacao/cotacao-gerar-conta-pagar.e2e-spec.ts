import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

type GerarContaPagarApiResult = {
  success?: boolean;
  alreadyExisted?: boolean;
  contaPagar: {
    id: string;
    numero: string;
    categoria: string;
    prioridade: string;
    valorTotal: number;
    valorRestante: number;
    status: string;
  };
  cotacao?: {
    id: string;
  };
};

describe('Cotacao gerar-conta-pagar (E2E)', () => {
  const runId = Date.now().toString();
  const testPassword = 'senha123';

  const empresaId = randomUUID();
  const superadminId = randomUUID();
  const vendedorId = randomUUID();
  const financeiroOverrideId = randomUUID();
  const fornecedorId = randomUUID();
  const cotacaoId = randomUUID();

  const emailSuperadmin = `e2e.cotacao.superadmin.${runId}@conectcrm.local`;
  const emailVendedor = `e2e.cotacao.vendedor.${runId}@conectcrm.local`;
  const emailFinanceiroOverride = `e2e.cotacao.financeiro.${runId}@conectcrm.local`;

  const cotacaoNumero = `COT${runId.slice(-8)}A`;
  const pedidoId = `PED-E2E-${runId.slice(-6)}`;

  let app: INestApplication;
  let dataSource: DataSource;
  let consoleLogSpy: jest.SpyInstance | null = null;

  let tokenSuperadmin: string;
  let tokenVendedor: string;
  let tokenFinanceiroOverride: string;

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
      // Preserva logs n?o-SQL relevantes do teste/aplica??o.
      // eslint-disable-next-line no-console
      console.info(...args);
    });

    const moduleFixture: TestingModule = await withE2EBootstrapLock(() => Test.createTestingModule({
      imports: [AppModule],
    }).compile());

    app = await createE2EApp(moduleFixture);

    dataSource = app.get(DataSource);

    await criarEmpresa();
    await criarUsuarios();
    await criarFornecedor();
    await criarCotacaoPedidoGerado();

    tokenSuperadmin = await fazerLogin(emailSuperadmin, testPassword);
    tokenVendedor = await fazerLogin(emailVendedor, testPassword);
    tokenFinanceiroOverride = await fazerLogin(emailFinanceiroOverride, testPassword);
  });

  afterAll(async () => {
    await limparDadosTeste();
    await app.close();
    consoleLogSpy?.mockRestore();
  });

  it('deve gerar conta a pagar e manter idempotencia pelo vinculo na cotacao', async () => {
    const primeiraResposta = await request(app.getHttpServer())
      .post(`/cotacao/${cotacaoId}/gerar-conta-pagar`)
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .send({
        categoria: 'fornecedores',
        prioridade: 'alta',
        observacoes: `geracao e2e ${runId}`,
      })
      .expect(201);

    const primeiroPayload = extrairResultado(primeiraResposta.body);
    expect(primeiroPayload.contaPagar?.id).toBeTruthy();
    expect(primeiroPayload.contaPagar?.numero).toMatch(/^CP-\d{6}-\d{4}$/);
    expect(primeiroPayload.contaPagar?.categoria).toBe('fornecedores');
    expect(primeiroPayload.contaPagar?.prioridade).toBe('alta');
    expect(Number(primeiroPayload.contaPagar?.valorTotal)).toBeCloseTo(1234.56, 2);
    expect(Number(primeiroPayload.contaPagar?.valorRestante)).toBeCloseTo(1234.56, 2);
    expect(primeiroPayload.contaPagar?.status).toBe('em_aberto');

    const segundaResposta = await request(app.getHttpServer())
      .post(`/cotacao/${cotacaoId}/gerar-conta-pagar`)
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .send({
        categoria: 'fornecedores',
        prioridade: 'alta',
      })
      .expect(201);

    const segundoPayload = extrairResultado(segundaResposta.body);
    expect(segundoPayload.alreadyExisted).toBe(true);
    expect(segundoPayload.contaPagar.id).toBe(primeiroPayload.contaPagar.id);

    const contas = await dataSource.query(
      `
        SELECT id, numero, categoria, prioridade, status, valor_total, valor_restante
        FROM contas_pagar
        WHERE id = $1 AND empresa_id = $2
      `,
      [primeiroPayload.contaPagar.id, empresaId],
    );

    expect(contas).toHaveLength(1);
    expect(contas[0].categoria).toBe('fornecedores');
    expect(contas[0].prioridade).toBe('alta');
    expect(Number(contas[0].valor_total)).toBeCloseTo(1234.56, 2);
    expect(Number(contas[0].valor_restante)).toBeCloseTo(1234.56, 2);

    const cotacoes = await dataSource.query(
      `SELECT status, metadados FROM cotacoes WHERE id = $1 AND empresa_id = $2`,
      [cotacaoId, empresaId],
    );

    expect(cotacoes).toHaveLength(1);
    expect(cotacoes[0].status).toBe('pedido_gerado');

    const metadados = parseJson(cotacoes[0].metadados);
    expect(metadados.compra?.pedidoId).toBe(pedidoId);
    expect(metadados.compra?.contaPagarId).toBe(primeiroPayload.contaPagar.id);
    expect(metadados.compra?.contaPagarNumero).toBe(primeiroPayload.contaPagar.numero);
    expect(metadados.compra?.contaPagarStatus).toBe('em_aberto');
    expect(metadados.compra?.dataGeracaoContaPagar).toBeTruthy();
  });

  it('deve negar para vendedor sem permissao financeira', async () => {
    await request(app.getHttpServer())
      .post(`/cotacao/${cotacaoId}/gerar-conta-pagar`)
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({})
      .expect(403);
  });

  it('deve negar para usuario financeiro com permissoes explicitas sem pagamento-manage', async () => {
    await request(app.getHttpServer())
      .post(`/cotacao/${cotacaoId}/gerar-conta-pagar`)
      .set('Authorization', `Bearer ${tokenFinanceiroOverride}`)
      .send({})
      .expect(403);
  });

  it('deve retornar 400 quando a cotacao nao estiver com pedido gerado', async () => {
    const cotacaoAprovadaId = randomUUID();
    await criarCotacao({
      id: cotacaoAprovadaId,
      numero: `COT${runId.slice(-7)}B`,
      status: 'aprovada',
      metadados: {
        compra: {
          status: 'aprovada',
        },
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/cotacao/${cotacaoAprovadaId}/gerar-conta-pagar`)
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .send({})
      .expect(400);

    const message = response.body?.message || response.body?.error;
    expect(String(message || '')).toContain('pedido');
  });

  it('deve recriar a conta a pagar quando o vinculo salvo aponta para conta inexistente', async () => {
    const cotacaoComVinculoQuebradoId = randomUUID();
    const contaInexistenteId = randomUUID();

    await criarCotacao({
      id: cotacaoComVinculoQuebradoId,
      numero: `COT${runId.slice(-7)}C`,
      status: 'pedido_gerado',
      metadados: {
        compra: {
          status: 'pedido_gerado',
          pedidoId: `PED-E2E-BROKEN-${runId.slice(-4)}`,
          contaPagarId: contaInexistenteId,
          contaPagarNumero: 'CP-LEGADO-0001',
        },
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/cotacao/${cotacaoComVinculoQuebradoId}/gerar-conta-pagar`)
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .send({
        categoria: 'fornecedores',
        prioridade: 'media',
      })
      .expect(201);

    const payload = extrairResultado(response.body);
    expect(payload.alreadyExisted).not.toBe(true);
    expect(payload.contaPagar.id).toBeTruthy();
    expect(payload.contaPagar.id).not.toBe(contaInexistenteId);

    const cotacaoAtualizada = await dataSource.query(
      `SELECT metadados FROM cotacoes WHERE id = $1 AND empresa_id = $2`,
      [cotacaoComVinculoQuebradoId, empresaId],
    );
    expect(cotacaoAtualizada).toHaveLength(1);

    const metadados = parseJson(cotacaoAtualizada[0].metadados);
    expect(metadados.compra?.contaPagarId).toBe(payload.contaPagar.id);
    expect(metadados.compra?.contaPagarNumero).toBe(payload.contaPagar.numero);
  });

  it('deve executar o fluxo completo: converter pedido -> gerar conta -> marcar adquirido', async () => {
    const cotacaoFluxoId = randomUUID();
    const numeroPedidoManual = `PED-MANUAL-${runId.slice(-5)}`;
    const referenciaPagamento = `PIX-FLOW-${runId.slice(-5)}`;

    await criarCotacao({
      id: cotacaoFluxoId,
      numero: `COT${runId.slice(-7)}D`,
      status: 'aprovada',
      metadados: {
        compra: {
          status: 'aprovada',
        },
      },
    });

    const converterResponse = await request(app.getHttpServer())
      .post(`/cotacao/${cotacaoFluxoId}/converter-pedido`)
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .send({
        observacoes: `conversao fluxo e2e ${runId}`,
      })
      .expect(201);

    const pedidoPayload = (converterResponse.body?.data ?? converterResponse.body) as {
      id?: string;
      status?: string;
      cotacaoId?: string;
    };
    expect(pedidoPayload.id).toBeTruthy();
    expect(pedidoPayload.status).toBe('CRIADO');
    expect(pedidoPayload.cotacaoId).toBe(cotacaoFluxoId);

    const gerarResponse = await request(app.getHttpServer())
      .post(`/cotacao/${cotacaoFluxoId}/gerar-conta-pagar`)
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .send({
        categoria: 'fornecedores',
        prioridade: 'alta',
        observacoes: `conta fluxo e2e ${runId}`,
      })
      .expect(201);

    const contaPayload = extrairResultado(gerarResponse.body);
    expect(contaPayload.contaPagar?.id).toBeTruthy();

    const marcarResponse = await request(app.getHttpServer())
      .post(`/cotacao/${cotacaoFluxoId}/marcar-adquirido`)
      .set('Authorization', `Bearer ${tokenSuperadmin}`)
      .send({
        numeroPedido: numeroPedidoManual,
        referenciaPagamento,
        observacoes: `pagamento externo fluxo e2e ${runId}`,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const cotacaoPayload = (marcarResponse.body?.data ?? marcarResponse.body) as {
      id?: string;
      status?: string;
      metadados?: Record<string, any>;
    };
    expect(cotacaoPayload.id).toBe(cotacaoFluxoId);
    expect(cotacaoPayload.status).toBe('adquirido');

    const cotacoes = await dataSource.query(
      `SELECT status, metadados FROM cotacoes WHERE id = $1 AND empresa_id = $2`,
      [cotacaoFluxoId, empresaId],
    );
    expect(cotacoes).toHaveLength(1);
    expect(cotacoes[0].status).toBe('adquirido');

    const metadados = parseJson(cotacoes[0].metadados);
    expect(metadados.compra?.status).toBe('adquirido');
    expect(metadados.compra?.contaPagarId).toBe(contaPayload.contaPagar.id);
    expect(metadados.compra?.numeroPedido).toBe(numeroPedidoManual);
    expect(metadados.compra?.referenciaPagamento).toBe(referenciaPagamento);
    expect(metadados.compra?.dataAquisicao).toBeTruthy();

    const contas = await dataSource.query(
      `
        SELECT id, numero, status, valor_total, valor_restante
        FROM contas_pagar
        WHERE id = $1 AND empresa_id = $2
      `,
      [contaPayload.contaPagar.id, empresaId],
    );
    expect(contas).toHaveLength(1);
    expect(contas[0].id).toBe(contaPayload.contaPagar.id);
  });

  async function criarEmpresa() {
    const suffix = runId.slice(-12).padStart(12, '0');
    const slug = `e2e-cotacao-conta-${runId}`.slice(0, 60);
    const cnpj = `${suffix}99`.padStart(14, '0').slice(-14);
    const email = `${slug}@conectcrm.local`;

    await dataSource.query(
      `
        INSERT INTO empresas (id, nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        empresaId,
        `Empresa E2E Cotacao ${runId}`,
        slug,
        cnpj,
        email,
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
      nome: 'Superadmin E2E Cotacao',
      email: emailSuperadmin,
      role: 'superadmin',
      senhaHash,
    });

    await inserirUsuario({
      id: vendedorId,
      nome: 'Vendedor E2E Cotacao',
      email: emailVendedor,
      role: 'vendedor',
      senhaHash,
    });

    await inserirUsuario({
      id: financeiroOverrideId,
      nome: 'Financeiro Override E2E',
      email: emailFinanceiroOverride,
      role: 'financeiro',
      senhaHash,
      permissoes: 'dashboard.read,comercial.propostas.read',
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
    const cnpjCpf = `${runId.slice(-11)}01`.padStart(14, '0').slice(-14);
    await dataSource.query(
      `
        INSERT INTO fornecedores (id, nome, cnpj_cpf, empresa_id, email, telefone, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        fornecedorId,
        `Fornecedor E2E ${runId}`,
        cnpjCpf,
        empresaId,
        `fornecedor.${runId}@conectcrm.local`,
        '11911111111',
        true,
      ],
    );
  }

  async function criarCotacaoPedidoGerado() {
    await criarCotacao({
      id: cotacaoId,
      numero: cotacaoNumero,
      status: 'pedido_gerado',
      metadados: {
        compra: {
          status: 'pedido_gerado',
          pedidoId,
          pagamentoExterno: true,
        },
      },
    });
  }

  async function criarCotacao(params: {
    id: string;
    numero: string;
    status: string;
    metadados?: Record<string, any>;
  }) {
    await dataSource.query(
      `
        INSERT INTO cotacoes (
          id,
          numero,
          empresa_id,
          titulo,
          status,
          prioridade,
          origem,
          "valorTotal",
          fornecedor_id,
          responsavel_id,
          aprovador_id,
          criado_por,
          atualizado_por,
          "prazoResposta",
          metadados,
          data_conversao
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          NOW()
        )
      `,
      [
        params.id,
        params.numero,
        empresaId,
        `Cotacao E2E Conta Pagar ${runId}`,
        params.status,
        'alta',
        'manual',
        1234.56,
        fornecedorId,
        superadminId,
        null,
        superadminId,
        superadminId,
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        JSON.stringify(params.metadados || {}),
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
      await dataSource.query(`DELETE FROM cotacoes WHERE empresa_id = $1`, [empresaId]);
      await dataSource.query(`DELETE FROM fornecedores WHERE id = $1`, [fornecedorId]);
      await dataSource.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [
        [superadminId, vendedorId, financeiroOverrideId],
      ]);
      await dataSource.query(`DELETE FROM empresas WHERE id = $1`, [empresaId]);
    } catch {
      // Cleanup best-effort para nao mascarar falhas do teste principal
    }
  }

  function extrairResultado(body: any): GerarContaPagarApiResult {
    if (body?.data && typeof body.data === 'object' && (body.data.contaPagar || body.data.cotacao)) {
      return body.data as GerarContaPagarApiResult;
    }
    return body as GerarContaPagarApiResult;
  }

  function parseJson(value: unknown): Record<string, any> {
    if (!value) return {};
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    if (typeof value === 'object') {
      return value as Record<string, any>;
    }
    return {};
  }
});



