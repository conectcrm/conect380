import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { CreateCatalogFlexTables1808200000000 } from '../../src/migrations/1808200000000-CreateCatalogFlexTables';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';

type CatalogItemResponse = {
  id: string;
  nome: string;
  salePrice: number;
};

type CatalogItemComponentResponse = {
  childItemId: string;
  componentRole: string;
  quantity: number;
  affectsPrice: boolean;
  isDefault: boolean;
  childItem?: {
    nome?: string;
  } | null;
};

describe('Catalogo Flexivel (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const runId = Date.now().toString();
  const testPassword = 'Catalogo@123';
  const testPasswordHashPromise = bcrypt.hash(testPassword, 10);

  const empresaAEmail = `e2e.catalog.a.${runId}@conectcrm.local`;
  const empresaBEmail = `e2e.catalog.b.${runId}@conectcrm.local`;
  const empresaAUserId = randomUUID();
  const empresaBUserId = randomUUID();

  let empresaAId = '';
  let empresaBId = '';
  let tokenEmpresaA = '';
  let tokenEmpresaB = '';

  const createdCatalogItemIds: string[] = [];
  const createdPropostaIds: string[] = [];

  jest.setTimeout(120000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        imports: [AppModule],
      }).compile(),
    );

    app = await createE2EApp(moduleFixture);
    dataSource = app.get(DataSource);
    await garantirInfraCatalogoFlex();

    empresaAId = await criarEmpresa('A');
    empresaBId = await criarEmpresa('B');

    const senhaHash = await testPasswordHashPromise;
    await criarUsuario(empresaAUserId, 'Gerente Catalogo A', empresaAEmail, empresaAId, senhaHash);
    await criarUsuario(empresaBUserId, 'Gerente Catalogo B', empresaBEmail, empresaBId, senhaHash);

    tokenEmpresaA = await fazerLogin(empresaAEmail, testPassword);
    tokenEmpresaB = await fazerLogin(empresaBEmail, testPassword);
  });

  afterAll(async () => {
    await limparDadosTeste();
    await app?.close();
  });

  it('lista templates globais esperados do catalogo', async () => {
    const response = await request(app.getHttpServer())
      .get('/catalog/templates')
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .expect(200);

    const templates = normalizarLista<any>(response.body);
    const codes = templates.map((template) => String(template?.code || '').trim());

    expect(templates.length).toBeGreaterThanOrEqual(5);
    expect(codes).toEqual(
      expect.arrayContaining([
        'software_plan',
        'software_module',
        'service_package',
        'autoparts_item',
        'retail_accessory_or_service',
      ]),
    );
  });

  it('permite templates compartilhados para tipos compativeis de software e servico', async () => {
    const templatesLicencaResponse = await request(app.getHttpServer())
      .get('/catalog/templates?businessType=licenca')
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .expect(200);

    const templatesLicenca = normalizarLista<any>(templatesLicencaResponse.body);
    expect(
      templatesLicenca.some((template) => String(template?.code || '').trim() === 'software_module'),
    ).toBe(true);

    const templatesServicoResponse = await request(app.getHttpServer())
      .get('/catalog/templates?businessType=servico&itemKind=service')
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .expect(200);

    const templatesServico = normalizarLista<any>(templatesServicoResponse.body);
    expect(
      templatesServico.some(
        (template) => String(template?.code || '').trim() === 'retail_accessory_or_service',
      ),
    ).toBe(true);

    const licenca = await criarCatalogItem(tokenEmpresaA, {
      code: `E2E-LIC-SHARED-${runId}`,
      nome: `Licenca Shared E2E ${runId}`,
      descricao: 'Valida template software_module para businessType licenca',
      itemKind: 'simple',
      businessType: 'licenca',
      templateCode: 'software_module',
      status: 'ativo',
      billingModel: 'recorrente',
      recurrence: 'mensal',
      unitCode: 'licenca',
      salePrice: 99.9,
      costAmount: 0,
      trackStock: false,
    });

    const aplicativo = await criarCatalogItem(tokenEmpresaA, {
      code: `E2E-APP-SHARED-${runId}`,
      nome: `Aplicativo Shared E2E ${runId}`,
      descricao: 'Valida template software_module para businessType aplicativo',
      itemKind: 'simple',
      businessType: 'aplicativo',
      templateCode: 'software_module',
      status: 'ativo',
      billingModel: 'recorrente',
      recurrence: 'mensal',
      unitCode: 'licenca',
      salePrice: 129.9,
      costAmount: 0,
      trackStock: false,
    });

    const servico = await criarCatalogItem(tokenEmpresaA, {
      code: `E2E-SERV-SHARED-${runId}`,
      nome: `Servico Shared E2E ${runId}`,
      descricao: 'Valida template retail_accessory_or_service com itemKind service',
      itemKind: 'service',
      businessType: 'servico',
      templateCode: 'retail_accessory_or_service',
      status: 'ativo',
      billingModel: 'unico',
      unitCode: 'hora',
      salePrice: 220,
      costAmount: 0,
      trackStock: false,
    });

    const garantia = await criarCatalogItem(tokenEmpresaA, {
      code: `E2E-GAR-SHARED-${runId}`,
      nome: `Garantia Shared E2E ${runId}`,
      descricao: 'Valida template retail_accessory_or_service para businessType garantia',
      itemKind: 'simple',
      businessType: 'garantia',
      templateCode: 'retail_accessory_or_service',
      status: 'ativo',
      billingModel: 'unico',
      unitCode: 'unidade',
      salePrice: 59.9,
      costAmount: 0,
      trackStock: false,
    });

    expect(licenca.id).toBeTruthy();
    expect(aplicativo.id).toBeTruthy();
    expect(servico.id).toBeTruthy();
    expect(garantia.id).toBeTruthy();
  });

  it('cria plano com modulos, vincula composicao e aplica isolamento multi-tenant', async () => {
    const moduloVendas = await criarCatalogItem(tokenEmpresaA, {
      code: `E2E-MOD-VENDAS-${runId}`,
      nome: `Modulo Vendas E2E ${runId}`,
      descricao: 'Modulo para fluxo comercial',
      itemKind: 'simple',
      businessType: 'modulo',
      templateCode: 'software_module',
      status: 'ativo',
      billingModel: 'recorrente',
      recurrence: 'mensal',
      unitCode: 'licenca',
      salePrice: 149.9,
      costAmount: 0,
      trackStock: false,
      metadata: {
        tipo_licenciamento: 'empresa',
      },
    });

    const moduloFinanceiro = await criarCatalogItem(tokenEmpresaA, {
      code: `E2E-MOD-FIN-${runId}`,
      nome: `Modulo Financeiro E2E ${runId}`,
      descricao: 'Modulo para fluxo financeiro',
      itemKind: 'simple',
      businessType: 'modulo',
      templateCode: 'software_module',
      status: 'ativo',
      billingModel: 'recorrente',
      recurrence: 'mensal',
      unitCode: 'licenca',
      salePrice: 189.9,
      costAmount: 0,
      trackStock: false,
      metadata: {
        tipo_licenciamento: 'empresa',
      },
    });

    const plano = await criarCatalogItem(tokenEmpresaA, {
      code: `E2E-PLAN-ENT-${runId}`,
      nome: `Plano Enterprise E2E ${runId}`,
      descricao: 'Plano com composicao oficial de modulos',
      itemKind: 'subscription',
      businessType: 'plano',
      templateCode: 'software_plan',
      status: 'ativo',
      billingModel: 'recorrente',
      recurrence: 'mensal',
      unitCode: 'assinatura',
      salePrice: 499.9,
      costAmount: 0,
      trackStock: false,
      metadata: {
        usuarios_inclusos: 50,
        suporte_incluso: 'prioritario',
      },
    });

    const replaceResponse = await request(app.getHttpServer())
      .put(`/catalog/items/${plano.id}/components`)
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .send({
        components: [
          {
            childItemId: moduloVendas.id,
            componentRole: 'included',
            quantity: 1,
            sortOrder: 10,
            affectsPrice: true,
            isDefault: true,
          },
          {
            childItemId: moduloFinanceiro.id,
            componentRole: 'addon',
            quantity: 1,
            sortOrder: 20,
            affectsPrice: true,
            isDefault: false,
          },
        ],
      })
      .expect(200);

    const replacedComponents = normalizarLista<CatalogItemComponentResponse>(replaceResponse.body);
    expect(replacedComponents).toHaveLength(2);

    const getComponentsResponse = await request(app.getHttpServer())
      .get(`/catalog/items/${plano.id}/components`)
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .expect(200);

    const components = normalizarLista<CatalogItemComponentResponse>(getComponentsResponse.body);
    expect(components).toHaveLength(2);
    expect(components.map((component) => component.componentRole)).toEqual(
      expect.arrayContaining(['included', 'addon']),
    );

    await request(app.getHttpServer())
      .patch(`/catalog/items/${plano.id}/status`)
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .send({ status: 'inativo' })
      .expect(200);

    const planoAtualizadoResponse = await request(app.getHttpServer())
      .get(`/catalog/items/${plano.id}`)
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .expect(200);

    expect(planoAtualizadoResponse.body?.status).toBe('inativo');

    await request(app.getHttpServer())
      .get(`/catalog/items/${plano.id}`)
      .set('Authorization', `Bearer ${tokenEmpresaB}`)
      .expect(404);
  });

  it('persiste snapshot da composicao do plano ao criar proposta', async () => {
    const moduloImplantacao = await criarCatalogItem(tokenEmpresaA, {
      code: `E2E-MOD-IMP-${runId}`,
      nome: `Implantacao E2E ${runId}`,
      descricao: 'Modulo/servico para validacao de snapshot',
      itemKind: 'simple',
      businessType: 'modulo',
      templateCode: 'software_module',
      status: 'ativo',
      billingModel: 'recorrente',
      recurrence: 'mensal',
      unitCode: 'licenca',
      salePrice: 299.9,
      costAmount: 0,
      trackStock: false,
    });

    const planoSnapshot = await criarCatalogItem(tokenEmpresaA, {
      code: `E2E-PLAN-SNAP-${runId}`,
      nome: `Plano Snapshot E2E ${runId}`,
      descricao: 'Plano para validacao de snapshot na proposta',
      itemKind: 'subscription',
      businessType: 'plano',
      templateCode: 'software_plan',
      status: 'ativo',
      billingModel: 'recorrente',
      recurrence: 'mensal',
      unitCode: 'assinatura',
      salePrice: 899.9,
      costAmount: 0,
      trackStock: false,
      metadata: {
        usuarios_inclusos: 100,
      },
    });

    const replaceResponse = await request(app.getHttpServer())
      .put(`/catalog/items/${planoSnapshot.id}/components`)
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .send({
        components: [
          {
            childItemId: moduloImplantacao.id,
            componentRole: 'included',
            quantity: 1,
            sortOrder: 5,
            affectsPrice: true,
            isDefault: true,
          },
        ],
      })
      .expect(200);

    const components = normalizarLista<CatalogItemComponentResponse>(replaceResponse.body);
    expect(components).toHaveLength(1);

    const propostaPayload = {
      titulo: `Proposta Catalogo Snapshot ${runId}`,
      cliente: `Cliente Snapshot ${runId}`,
      subtotal: Number(planoSnapshot.salePrice),
      total: Number(planoSnapshot.salePrice),
      valor: Number(planoSnapshot.salePrice),
      produtos: [
        {
          id: planoSnapshot.id,
          produtoId: planoSnapshot.id,
          nome: planoSnapshot.nome,
          precoUnitario: Number(planoSnapshot.salePrice),
          quantidade: 1,
          desconto: 0,
          subtotal: Number(planoSnapshot.salePrice),
          componentesPlano: components.map((component) => ({
            childItemId: component.childItemId,
            componentRole: component.componentRole,
            quantity: component.quantity,
            affectsPrice: component.affectsPrice,
            isDefault: component.isDefault,
            nome: component.childItem?.nome || null,
          })),
        },
      ],
    };

    const propostaResponse = await request(app.getHttpServer())
      .post('/propostas')
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .send(propostaPayload)
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    expect(propostaResponse.body?.success).toBe(true);
    const propostaId = String(propostaResponse.body?.proposta?.id || '').trim();
    expect(propostaId).toBeTruthy();
    createdPropostaIds.push(propostaId);

    const [snapshotRow] = await dataSource.query(
      `
        SELECT produtos
        FROM propostas
        WHERE id::text = $1
          AND empresa_id = $2
      `,
      [propostaId, empresaAId],
    );

    expect(snapshotRow).toBeTruthy();
    expect(Array.isArray(snapshotRow.produtos)).toBe(true);
    expect(snapshotRow.produtos).toHaveLength(1);
    expect(Array.isArray(snapshotRow.produtos[0]?.componentesPlano)).toBe(true);
    expect(snapshotRow.produtos[0].componentesPlano).toHaveLength(1);
    expect(snapshotRow.produtos[0].componentesPlano[0]?.childItemId).toBe(moduloImplantacao.id);
  });

  it('enriquece nomes de componentes no historico da proposta para snapshots legados', async () => {
    const moduloAnalytics = await criarCatalogItem(tokenEmpresaA, {
      code: `E2E-MOD-ANL-${runId}`,
      nome: `Modulo Analytics E2E ${runId}`,
      descricao: 'Modulo para validar enriquecimento de snapshot',
      itemKind: 'simple',
      businessType: 'modulo',
      templateCode: 'software_module',
      status: 'ativo',
      billingModel: 'recorrente',
      recurrence: 'mensal',
      unitCode: 'licenca',
      salePrice: 129.9,
      costAmount: 0,
      trackStock: false,
    });

    const planoHistorico = await criarCatalogItem(tokenEmpresaA, {
      code: `E2E-PLAN-HIST-${runId}`,
      nome: `Plano Historico E2E ${runId}`,
      descricao: 'Plano para validar historico enriquecido',
      itemKind: 'subscription',
      businessType: 'plano',
      templateCode: 'software_plan',
      status: 'ativo',
      billingModel: 'recorrente',
      recurrence: 'mensal',
      unitCode: 'assinatura',
      salePrice: 629.9,
      costAmount: 0,
      trackStock: false,
    });

    const propostaPayload = {
      titulo: `Proposta Historico Componentes ${runId}`,
      cliente: `Cliente Historico ${runId}`,
      subtotal: Number(planoHistorico.salePrice),
      total: Number(planoHistorico.salePrice),
      valor: Number(planoHistorico.salePrice),
      produtos: [
        {
          id: planoHistorico.id,
          produtoId: planoHistorico.id,
          nome: planoHistorico.nome,
          precoUnitario: Number(planoHistorico.salePrice),
          quantidade: 1,
          desconto: 0,
          subtotal: Number(planoHistorico.salePrice),
          componentesPlano: [
            {
              childItemId: moduloAnalytics.id,
              componentRole: 'included',
              quantity: 1,
              affectsPrice: true,
              isDefault: true,
              nome: null,
            },
          ],
        },
      ],
    };

    const propostaResponse = await request(app.getHttpServer())
      .post('/propostas')
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .send(propostaPayload)
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    expect(propostaResponse.body?.success).toBe(true);
    const propostaId = String(propostaResponse.body?.proposta?.id || '').trim();
    expect(propostaId).toBeTruthy();
    createdPropostaIds.push(propostaId);

    const historicoResponse = await request(app.getHttpServer())
      .get(`/propostas/${propostaId}/historico`)
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .expect(200);

    const versoes = Array.isArray(historicoResponse.body?.versoes)
      ? historicoResponse.body.versoes
      : [];
    expect(versoes.length).toBeGreaterThan(0);
    const ultimaVersao = versoes[versoes.length - 1] || {};
    const snapshotProdutos = Array.isArray(ultimaVersao?.snapshot?.produtos)
      ? ultimaVersao.snapshot.produtos
      : [];
    expect(snapshotProdutos.length).toBeGreaterThan(0);
    const snapshotComponentes = Array.isArray(snapshotProdutos[0]?.componentesPlano)
      ? snapshotProdutos[0].componentesPlano
      : [];
    expect(snapshotComponentes.length).toBeGreaterThan(0);
    expect(snapshotComponentes[0]?.childItemId).toBe(moduloAnalytics.id);
    expect(String(snapshotComponentes[0]?.nome || '').trim()).toBe(moduloAnalytics.nome);
  });

  it('gera preview de PDF com composicao de plano baseada no snapshot enriquecido', async () => {
    const moduloPdf = await criarCatalogItem(tokenEmpresaA, {
      code: `E2E-MOD-PDF-${runId}`,
      nome: `Modulo PDF E2E ${runId}`,
      descricao: 'Modulo para validar composicao no preview HTML',
      itemKind: 'simple',
      businessType: 'modulo',
      templateCode: 'software_module',
      status: 'ativo',
      billingModel: 'recorrente',
      recurrence: 'mensal',
      unitCode: 'licenca',
      salePrice: 79.9,
      costAmount: 0,
      trackStock: false,
    });

    const planoPdf = await criarCatalogItem(tokenEmpresaA, {
      code: `E2E-PLAN-PDF-${runId}`,
      nome: `Plano PDF E2E ${runId}`,
      descricao: 'Plano para validar composicao no preview',
      itemKind: 'subscription',
      businessType: 'plano',
      templateCode: 'software_plan',
      status: 'ativo',
      billingModel: 'recorrente',
      recurrence: 'mensal',
      unitCode: 'assinatura',
      salePrice: 479.9,
      costAmount: 0,
      trackStock: false,
    });

    const propostaPayload = {
      titulo: `Proposta PDF Composicao ${runId}`,
      cliente: `Cliente PDF ${runId}`,
      subtotal: Number(planoPdf.salePrice),
      total: Number(planoPdf.salePrice),
      valor: Number(planoPdf.salePrice),
      produtos: [
        {
          id: planoPdf.id,
          produtoId: planoPdf.id,
          nome: planoPdf.nome,
          precoUnitario: Number(planoPdf.salePrice),
          quantidade: 1,
          desconto: 0,
          subtotal: Number(planoPdf.salePrice),
          // intencionalmente sem tipoItem para validar fallback por composicao
          componentesPlano: [
            {
              childItemId: moduloPdf.id,
              componentRole: 'included',
              quantity: 1,
              affectsPrice: true,
              isDefault: true,
              nome: null,
            },
          ],
        },
      ],
    };

    const propostaResponse = await request(app.getHttpServer())
      .post('/propostas')
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .send(propostaPayload)
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    expect(propostaResponse.body?.success).toBe(true);
    const propostaId = String(propostaResponse.body?.proposta?.id || '').trim();
    expect(propostaId).toBeTruthy();
    createdPropostaIds.push(propostaId);

    const historicoResponse = await request(app.getHttpServer())
      .get(`/propostas/${propostaId}/historico`)
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .expect(200);

    const versoes = Array.isArray(historicoResponse.body?.versoes)
      ? historicoResponse.body.versoes
      : [];
    expect(versoes.length).toBeGreaterThan(0);
    const ultimaVersao = versoes[versoes.length - 1] || {};
    const snapshotProdutos = Array.isArray(ultimaVersao?.snapshot?.produtos)
      ? ultimaVersao.snapshot.produtos
      : [];
    expect(snapshotProdutos.length).toBeGreaterThan(0);

    const itemSnapshot = snapshotProdutos[0] || {};
    const previewPayload = {
      numeroProposta: `E2E-PDF-${runId}`,
      titulo: `Preview PDF Composicao ${runId}`,
      status: 'rascunho',
      cliente: {
        nome: `Cliente PDF ${runId}`,
        email: `cliente.pdf.${runId}@conectcrm.local`,
      },
      vendedor: {
        nome: 'Gerente Catalogo A',
        email: empresaAEmail,
      },
      itens: [
        {
          nome: String(itemSnapshot?.nome || planoPdf.nome),
          descricao: String(itemSnapshot?.descricao || ''),
          quantidade: Number(itemSnapshot?.quantidade || 1),
          valorUnitario: Number(itemSnapshot?.precoUnitario ?? planoPdf.salePrice ?? 0),
          desconto: Number(itemSnapshot?.desconto || 0),
          valorTotal: Number(itemSnapshot?.subtotal ?? planoPdf.salePrice ?? 0),
          componentesPlano: Array.isArray(itemSnapshot?.componentesPlano)
            ? itemSnapshot.componentesPlano
            : [],
        },
      ],
      subtotal: Number(itemSnapshot?.subtotal ?? planoPdf.salePrice ?? 0),
      valorTotal: Number(itemSnapshot?.subtotal ?? planoPdf.salePrice ?? 0),
    };

    const previewResponse = await request(app.getHttpServer())
      .post('/propostas/pdf/preview/comercial')
      .set('Authorization', `Bearer ${tokenEmpresaA}`)
      .send(previewPayload)
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const html = String(previewResponse.text || '');
    expect(html).toContain('Composicao do plano:');
    expect(html).toContain(moduloPdf.nome);
  });

  async function criarEmpresa(label: 'A' | 'B'): Promise<string> {
    const suffix = `${runId}${label === 'A' ? '1' : '2'}`.slice(-12);
    const slug = `e2e-catalog-${label.toLowerCase()}-${runId}`;
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
        `Empresa Catalogo ${label}`,
        slug,
        cnpj,
        email,
        '11999999999',
        'Rua Catalogo E2E',
        'Sao Paulo',
        'SP',
        '01000-000',
        subdominio,
      ],
    );

    return String(result[0]?.id || '').trim();
  }

  async function garantirInfraCatalogoFlex(): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      const hasTemplatesTable = await queryRunner.hasTable('catalog_templates');
      if (hasTemplatesTable) return;

      const migration = new CreateCatalogFlexTables1808200000000();
      await migration.up(queryRunner);
    } finally {
      await queryRunner.release();
    }
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

    let codigoMfa = String(response.body?.data?.devCode || '').trim();
    if (!codigoMfa) {
      const resendResponse = await request(app.getHttpServer())
        .post('/auth/mfa/resend')
        .send({ challengeId });
      if (![200, 201].includes(resendResponse.status)) {
        throw new Error(
          `MFA requerido para ${email}, mas nao foi possivel reenviar codigo (status ${resendResponse.status})`,
        );
      }
      codigoMfa = String(resendResponse.body?.data?.devCode || '').trim();
    }

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

  function normalizarLista<T = any>(value: any): T[] {
    if (Array.isArray(value)) return value as T[];
    if (Array.isArray(value?.data)) return value.data as T[];
    if (Array.isArray(value?.value)) return value.value as T[];
    return [];
  }

  async function criarCatalogItem(
    token: string,
    payload: Record<string, unknown>,
  ): Promise<CatalogItemResponse> {
    const response = await request(app.getHttpServer())
      .post('/catalog/items')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    const item = response.body as CatalogItemResponse;
    expect(item?.id).toBeTruthy();
    createdCatalogItemIds.push(item.id);
    return item;
  }

  async function limparDadosTeste(): Promise<void> {
    const fallbackEmpresaA = empresaAId || '00000000-0000-0000-0000-000000000000';
    const fallbackEmpresaB = empresaBId || '00000000-0000-0000-0000-000000000000';

    await dataSource
      ?.query(`DELETE FROM propostas_portal_tokens WHERE empresa_id IN ($1, $2)`, [
        fallbackEmpresaA,
        fallbackEmpresaB,
      ])
      .catch(() => undefined);

    if (createdPropostaIds.length > 0) {
      await dataSource
        ?.query(`DELETE FROM propostas WHERE id::text = ANY($1::text[])`, [createdPropostaIds])
        .catch(() => undefined);
    }

    await dataSource
      ?.query(`DELETE FROM propostas WHERE empresa_id IN ($1, $2)`, [fallbackEmpresaA, fallbackEmpresaB])
      .catch(() => undefined);

    if (createdCatalogItemIds.length > 0) {
      await dataSource
        ?.query(`DELETE FROM catalog_item_components WHERE parent_item_id::text = ANY($1::text[])`, [
          createdCatalogItemIds,
        ])
        .catch(() => undefined);
      await dataSource
        ?.query(`DELETE FROM catalog_item_components WHERE child_item_id::text = ANY($1::text[])`, [
          createdCatalogItemIds,
        ])
        .catch(() => undefined);
      await dataSource
        ?.query(`DELETE FROM catalog_items WHERE id::text = ANY($1::text[])`, [createdCatalogItemIds])
        .catch(() => undefined);
    }

    await dataSource
      ?.query(`DELETE FROM catalog_item_components WHERE empresa_id IN ($1, $2)`, [
        fallbackEmpresaA,
        fallbackEmpresaB,
      ])
      .catch(() => undefined);
    await dataSource
      ?.query(`DELETE FROM catalog_items WHERE empresa_id IN ($1, $2)`, [fallbackEmpresaA, fallbackEmpresaB])
      .catch(() => undefined);

    await dataSource
      ?.query(`DELETE FROM users WHERE email IN ($1, $2)`, [empresaAEmail, empresaBEmail])
      .catch(() => undefined);
    await dataSource
      ?.query(`DELETE FROM empresas WHERE id IN ($1, $2)`, [fallbackEmpresaA, fallbackEmpresaB])
      .catch(() => undefined);
  }
});
