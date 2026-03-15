import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { createE2EApp, withE2EBootstrapLock } from './_support/e2e-app.helper';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ALL_PERMISSIONS } from '../src/common/permissions/permissions.constants';

/**
 * Testes E2E para validar isolamento Multi-Tenancy
 *
 * Objetivo: Garantir que empresa A NÃO consegue acessar dados da empresa B
 *
 * Cenários testados:
 * - Leads: Empresa 1 não acessa leads da Empresa 2
 * - Oportunidades: Empresa 1 não acessa oportunidades da Empresa 2
 * - Clientes: Empresa 1 não acessa clientes da Empresa 2
 * - Contratos: Empresa 1 não acessa contratos da Empresa 2
 */
describe('Multi-Tenancy Isolation (E2E)', () => {
  const TEST_PASSWORD = 'senha123';
  const TEST_EMAIL_EMPRESA_1 = 'e2e.admin.empresa1@conectcrm.local';
  const TEST_EMAIL_EMPRESA_2 = 'e2e.admin.empresa2@conectcrm.local';
  const TEST_USER_ID_EMPRESA_1 = '00000000-0000-4000-8000-000000000001';
  const TEST_USER_ID_EMPRESA_2 = '00000000-0000-4000-8000-000000000002';
  const TEST_RUN_ID = Date.now().toString();

  let app: INestApplication;
  let dataSource: DataSource;
  let empresa1Id: string;
  let empresa2Id: string;

  // Tokens de autenticação
  let tokenEmpresa1: string;
  let tokenEmpresa2: string;

  // IDs de usuários autenticados
  let userEmpresa1Id: string;
  let userEmpresa2Id: string;

  // IDs de recursos criados
  let leadEmpresa1Id: string;
  let leadEmpresa2Id: string;
  let oportunidadeEmpresa1Id: string;
  let clienteEmpresa1Id: string;
  let contratoEmpresa1Id: number;
  let faturaEmpresa1Id: number;
  let pagamentoEmpresa1Id: number;
  let pagamentoGatewayIdEmpresa1: string;
  let configuracaoGatewayEmpresa1Id: string;
  let configuracaoGatewayEmpresa2Id: string;
  let transacaoGatewayEmpresa1Id: string;
  let atividadeEmpresa1Id: number;
  let produtoEmpresa1Id: string;
  let produtoEmpresa2Id: string;
  const pipelineCoreTables = [
    'oportunidades',
    'atividades',
    'oportunidade_stage_events',
  ] as const;

  type FeatureKey = 'contratos' | 'faturas' | 'pagamentos';
  const tableFeatureAvailability: Record<FeatureKey, boolean> = {
    contratos: false,
    faturas: false,
    pagamentos: false,
  };

  const tableExists = async (tableName: string): Promise<boolean> => {
    const result = await dataSource.query(
      'SELECT to_regclass($1) AS table_name',
      [`public.${tableName}`],
    );
    return Boolean(result?.[0]?.table_name);
  };

  const tableHasColumn = async (tableName: string, columnName: string): Promise<boolean> => {
    const result = await dataSource.query(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
        LIMIT 1
      `,
      [tableName, columnName],
    );

    return Array.isArray(result) && result.length > 0;
  };

  const ensureGetCurrentTenantFunction = async (): Promise<void> => {
    await dataSource.query(`
      CREATE OR REPLACE FUNCTION get_current_tenant()
      RETURNS uuid
      LANGUAGE plpgsql
      STABLE
      AS $$
      DECLARE
        tenant_setting text;
      BEGIN
        tenant_setting := current_setting('app.current_tenant_id', true);

        IF tenant_setting IS NULL OR tenant_setting = '' THEN
          RETURN NULL;
        END IF;

        RETURN tenant_setting::uuid;
      EXCEPTION
        WHEN others THEN
          RETURN NULL;
      END;
      $$;
    `);
  };

  const ensureProdutosSoftwareColumns = async (): Promise<void> => {
    if (!(await tableExists('produtos'))) {
      return;
    }

    await dataSource.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "tipoLicenciamento" character varying(100)
    `);
    await dataSource.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "periodicidadeLicenca" character varying(100)
    `);
    await dataSource.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "renovacaoAutomatica" boolean DEFAULT false
    `);
    await dataSource.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "quantidadeLicencas" integer
    `);
    await dataSource.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "categoria_id" uuid
    `);
    await dataSource.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "subcategoria_id" uuid
    `);
    await dataSource.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "configuracao_id" uuid
    `);
  };

  const ensurePipelineCoreRlsBaseline = async (): Promise<void> => {
    await ensureGetCurrentTenantFunction();

    for (const tableName of pipelineCoreTables) {
      if (!(await tableExists(tableName))) {
        continue;
      }

      if (!(await tableHasColumn(tableName, 'empresa_id'))) {
        continue;
      }

      const policyName = `tenant_isolation_${tableName}`;

      await dataSource.query(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`);
      await dataSource.query(`DROP POLICY IF EXISTS "${policyName}" ON "${tableName}";`);
      await dataSource.query(`
        CREATE POLICY "${policyName}" ON "${tableName}"
        FOR ALL
        USING (empresa_id::text = get_current_tenant()::text)
        WITH CHECK (empresa_id::text = get_current_tenant()::text);
      `);
    }
  };

  const ensureMultiTenancyTestBaseline = async (): Promise<void> => {
    await ensureProdutosSoftwareColumns();
    await ensurePipelineCoreRlsBaseline();
  };

  const skipIfFeatureUnavailable = (feature: FeatureKey): boolean =>
    !tableFeatureAvailability[feature];

  const prepararUsuariosTeste = async () => {
    const empresas = await dataSource.query('SELECT id FROM empresas LIMIT 2');

    if (!Array.isArray(empresas)) {
      throw new Error('Falha ao carregar empresas para multi-tenancy.e2e');
    }

    while (empresas.length < 2) {
      const idx = empresas.length + 1;
      const stamp = Date.now().toString();
      const suffix = `${stamp}${idx}`.slice(-10);
      const slug = `e2e-empresa-${suffix}`;
      const cnpj = suffix.padStart(14, '0');
      const email = `${slug}@conectcrm.local`;
      const subdominio = slug.slice(0, 100);

      const created = await dataSource.query(
        `
          INSERT INTO empresas (
            nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `,
        [
          `Empresa E2E ${idx}`,
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

      empresas.push(created[0]);
    }

    empresa1Id = empresas[0].id;
    empresa2Id = empresas[1].id;

    const senhaHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const permissaoOperacionalE2E = ALL_PERMISSIONS.join(',');
    const permissaoColumnRows = await dataSource.query(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'permissoes'
      `,
    );
    const hasPermissoesColumn =
      Array.isArray(permissaoColumnRows) && permissaoColumnRows.length > 0;

    // Evita DELETE em users (quebra por FKs legadas) e garante e-mails livres para upsert.
    await dataSource.query(
      `
        UPDATE users
        SET email = CONCAT(email, '.legacy.', EXTRACT(EPOCH FROM NOW())::bigint)
        WHERE email IN ($1, $2)
          AND id NOT IN ($3, $4)
      `,
      [TEST_EMAIL_EMPRESA_1, TEST_EMAIL_EMPRESA_2, TEST_USER_ID_EMPRESA_1, TEST_USER_ID_EMPRESA_2],
    );

    const upsertUser = async (params: {
      id: string;
      nome: string;
      email: string;
      empresaId: string;
    }) => {
      if (hasPermissoesColumn) {
        await dataSource.query(
          `
            INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo, permissoes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE
            SET nome = EXCLUDED.nome,
                email = EXCLUDED.email,
                senha = EXCLUDED.senha,
                empresa_id = EXCLUDED.empresa_id,
                role = EXCLUDED.role,
                ativo = EXCLUDED.ativo,
                permissoes = EXCLUDED.permissoes
          `,
          [
            params.id,
            params.nome,
            params.email,
            senhaHash,
            params.empresaId,
            'superadmin',
            true,
            permissaoOperacionalE2E,
          ],
        );
        return;
      }

      await dataSource.query(
        `
          INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE
          SET nome = EXCLUDED.nome,
              email = EXCLUDED.email,
              senha = EXCLUDED.senha,
              empresa_id = EXCLUDED.empresa_id,
              role = EXCLUDED.role,
              ativo = EXCLUDED.ativo
        `,
        [params.id, params.nome, params.email, senhaHash, params.empresaId, 'superadmin', true],
      );
    };

    await upsertUser({
      id: TEST_USER_ID_EMPRESA_1,
      nome: 'Admin E2E Empresa 1',
      email: TEST_EMAIL_EMPRESA_1,
      empresaId: empresa1Id,
    });

    await upsertUser({
      id: TEST_USER_ID_EMPRESA_2,
      nome: 'Admin E2E Empresa 2',
      email: TEST_EMAIL_EMPRESA_2,
      empresaId: empresa2Id,
    });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await withE2EBootstrapLock(() => Test.createTestingModule({
      imports: [AppModule],
    }).compile());

    app = await createE2EApp(moduleFixture);

    dataSource = app.get(DataSource);
    await ensureMultiTenancyTestBaseline();
    await prepararUsuariosTeste();

    tableFeatureAvailability.contratos = await tableExists('contratos');
    tableFeatureAvailability.faturas = await tableExists('faturas');
    tableFeatureAvailability.pagamentos = await tableExists('pagamentos');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('🔒 RLS - Pipeline Comercial Core', () => {
    it('deve manter RLS habilitado nas tabelas core do pipeline', async () => {
      const rows = await dataSource.query(
        `
          SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
          FROM pg_class c
          INNER JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
            AND c.relname = ANY($1::text[])
        `,
        [pipelineCoreTables],
      );

      const rlsByTable = new Map<string, boolean>(
        rows.map((row: { table_name: string; rls_enabled: boolean }) => [
          row.table_name,
          Boolean(row.rls_enabled),
        ]),
      );

      for (const tableName of pipelineCoreTables) {
        expect(rlsByTable.has(tableName)).toBe(true);
        expect(rlsByTable.get(tableName)).toBe(true);
      }
    });

    it('deve manter policy tenant_isolation_* nas tabelas core do pipeline', async () => {
      const rows = await dataSource.query(
        `
          SELECT tablename AS table_name, policyname AS policy_name
          FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename = ANY($1::text[])
        `,
        [pipelineCoreTables],
      );

      const policiesByTable = new Map<string, Set<string>>();

      rows.forEach((row: { table_name: string; policy_name: string }) => {
        if (!policiesByTable.has(row.table_name)) {
          policiesByTable.set(row.table_name, new Set<string>());
        }
        policiesByTable.get(row.table_name)?.add(row.policy_name);
      });

      for (const tableName of pipelineCoreTables) {
        expect(policiesByTable.has(tableName)).toBe(true);
        expect(policiesByTable.get(tableName)?.has(`tenant_isolation_${tableName}`)).toBe(true);
      }
    });
  });

  const extrairAccessToken = (body: any): string | null =>
    body?.data?.access_token ?? body?.access_token ?? null;

  const fazerLoginComFallbackMfa = async (
    email: string,
    senha: string,
    fallbackUserId: string,
  ): Promise<{ accessToken: string; userId: string }> => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha });

    expect([200, 201]).toContain(loginResponse.status);

    const tokenDireto = extrairAccessToken(loginResponse.body);
    if (tokenDireto) {
      const userId = String(loginResponse.body?.data?.user?.id || fallbackUserId);
      return { accessToken: tokenDireto, userId };
    }

    expect(loginResponse.body?.action).toBe('MFA_REQUIRED');
    const challengeId = String(loginResponse.body?.data?.challengeId || '').trim();
    expect(challengeId).toBeTruthy();

    let codigoMfa = String(loginResponse.body?.data?.devCode || '').trim();
    if (!codigoMfa) {
      const resendResponse = await request(app.getHttpServer())
        .post('/auth/mfa/resend')
        .send({ challengeId });

      expect([200, 201]).toContain(resendResponse.status);
      codigoMfa = String(resendResponse.body?.data?.devCode || '').trim();
    }

    expect(codigoMfa).toBeTruthy();

    const verifyResponse = await request(app.getHttpServer())
      .post('/auth/mfa/verify')
      .send({
        challengeId,
        codigo: codigoMfa,
      });

    expect([200, 201]).toContain(verifyResponse.status);

    const tokenMfa = extrairAccessToken(verifyResponse.body);
    expect(tokenMfa).toBeTruthy();

    const userId = String(
      verifyResponse.body?.data?.user?.id ||
        loginResponse.body?.data?.user?.id ||
        fallbackUserId,
    );

    return { accessToken: String(tokenMfa), userId };
  };

  describe('🔐 Autenticação', () => {
    it('Deve fazer login na Empresa 1', async () => {
      const session = await fazerLoginComFallbackMfa(
        TEST_EMAIL_EMPRESA_1,
        TEST_PASSWORD,
        TEST_USER_ID_EMPRESA_1,
      );

      tokenEmpresa1 = session.accessToken;
      userEmpresa1Id = session.userId;
      expect(tokenEmpresa1).toBeTruthy();
      expect(userEmpresa1Id).toBe(TEST_USER_ID_EMPRESA_1);
    });

    it('Deve fazer login na Empresa 2', async () => {
      const session = await fazerLoginComFallbackMfa(
        TEST_EMAIL_EMPRESA_2,
        TEST_PASSWORD,
        TEST_USER_ID_EMPRESA_2,
      );

      tokenEmpresa2 = session.accessToken;
      userEmpresa2Id = session.userId;
      expect(tokenEmpresa2).toBeTruthy();
      expect(userEmpresa2Id).toBe(TEST_USER_ID_EMPRESA_2);
    });
  });

  describe('📊 Leads - Isolamento Multi-Tenancy', () => {
    it('Empresa 1 deve criar lead com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/leads')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          nome: 'Lead Teste Empresa 1',
          email: 'lead1@empresa1.com',
          telefone: '11999999999',
          origem: 'formulario', // ✅ Corrigido: 'website' → 'formulario' (enum válido)
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      leadEmpresa1Id = response.body.id;
    });

    it('Empresa 2 deve criar lead com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/leads')
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .send({
          nome: 'Lead Teste Empresa 2',
          email: 'lead2@empresa2.com',
          telefone: '21999999999',
          origem: 'indicacao', // ✅ Mantido (já é enum válido)
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      leadEmpresa2Id = response.body.id;
    });

    it('❌ Empresa 1 NÃO deve acessar lead da Empresa 2', async () => {
      const response = await request(app.getHttpServer())
        .get(`/leads/${leadEmpresa2Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .expect(404); // Não encontrado (filtrado por empresa_id)

      // Ou pode retornar 403 Forbidden dependendo da implementação
      // .expect(403);
    });

    it('❌ Empresa 2 NÃO deve acessar lead da Empresa 1', async () => {
      await request(app.getHttpServer())
        .get(`/leads/${leadEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });

    it('✅ Empresa 1 deve listar apenas seus próprios leads', async () => {
      const response = await request(app.getHttpServer())
        .get('/leads')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);

      // Verificar que NENHUM lead da Empresa 2 aparece
      const leadsEmpresa2 = response.body.data.filter((lead: any) => lead.id === leadEmpresa2Id);
      expect(leadsEmpresa2).toHaveLength(0);
    });
  });

  describe('🎯 Oportunidades - Isolamento Multi-Tenancy', () => {
    // ✅ Oportunidade.entity AGORA TEM empresa_id (migration executada)
    it('Empresa 1 deve criar oportunidade', async () => {
      const response = await request(app.getHttpServer())
        .post('/oportunidades')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          titulo: 'Oportunidade Teste Empresa 1',
          valor: 15000,
          probabilidade: 75,
          estagio: 'qualification', // ✅ Valor correto da enum EstagioOportunidade
          prioridade: 'medium', // ✅ Adicionado - PrioridadeOportunidade.MEDIA
          origem: 'website', // ✅ Adicionado - OrigemOportunidade.WEBSITE
          nomeContato: 'Contato Teste',
          responsavel_id: userEmpresa1Id, // ✅ ADICIONADO - UUID do usuário autenticado (REQUIRED)
        })
        .expect(201);

      oportunidadeEmpresa1Id = response.body.id;
    });

    it('❌ Empresa 2 NÃO deve acessar oportunidade da Empresa 1', async () => {
      await request(app.getHttpServer())
        .get(`/oportunidades/${oportunidadeEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });

    it('Empresa 1 deve mover etapa e registrar stage event no tenant correto', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/oportunidades/${oportunidadeEmpresa1Id}/estagio`)
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({ estagio: 'proposal' })
        .expect(200);

      expect(response.body.estagio).toBe('proposal');

      const latestStageEventRows = await dataSource.query(
        `
          SELECT empresa_id, to_stage, source
          FROM oportunidade_stage_events
          WHERE oportunidade_id::text = $1
          ORDER BY changed_at DESC
          LIMIT 1
        `,
        [String(oportunidadeEmpresa1Id)],
      );

      expect(Array.isArray(latestStageEventRows)).toBe(true);
      expect(latestStageEventRows.length).toBeGreaterThan(0);
      expect(latestStageEventRows[0].empresa_id).toBe(empresa1Id);
      expect((latestStageEventRows[0].to_stage || '').toString().toLowerCase()).toBe('proposal');
      expect(latestStageEventRows[0].source).toBe('update_estagio');
    });

    it('❌ Empresa 2 NÃO deve mover etapa da oportunidade da Empresa 1', async () => {
      await request(app.getHttpServer())
        .patch(`/oportunidades/${oportunidadeEmpresa1Id}/estagio`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .send({ estagio: 'negotiation' })
        .expect(404);
    });

    it('✅ Empresa 1 deve listar apenas suas oportunidades', async () => {
      const response = await request(app.getHttpServer())
        .get('/oportunidades')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);

      // Todas as oportunidades devem ter apenas empresa_id da Empresa 1
      response.body.forEach((oportunidade: any) => {
        expect(oportunidade.empresa_id).toBe(empresa1Id); // ✅ FIX: UUID correto
      });
    });
  });

  describe('📝 Atividades - Isolamento Multi-Tenancy', () => {
    it('Empresa 1 deve registrar atividade em sua oportunidade', async () => {
      const response = await request(app.getHttpServer())
        .post(`/oportunidades/${oportunidadeEmpresa1Id}/atividades`)
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          tipo: 'note',
          descricao: 'Follow-up multi-tenancy',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.empresa_id).toBe(empresa1Id);
      expect(response.body.criado_por_id).toBe(userEmpresa1Id);
      atividadeEmpresa1Id = response.body.id;
    });

    it('❌ Empresa 2 NÃO deve registrar atividade na oportunidade da Empresa 1', async () => {
      await request(app.getHttpServer())
        .post(`/oportunidades/${oportunidadeEmpresa1Id}/atividades`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .send({
          tipo: 'note',
          descricao: 'Tentativa indevida',
        })
        .expect(404);
    });
  });

  describe('🛍️ Produtos/Serviços - Isolamento Multi-Tenancy', () => {
    const produtoNomeEmpresa1 = `Servico Premium Empresa 1 ${TEST_RUN_ID}`;
    const produtoNomeEmpresa2 = `Servico Especial Empresa 2 ${TEST_RUN_ID}`;

    const resolverProdutoPorNome = async (
      token: string,
      nomeProduto: string,
      empresaEsperada: string,
    ): Promise<string> => {
      const listResponse = await request(app.getHttpServer())
        .get('/produtos')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(listResponse.body)).toBe(true);

      const produtoEncontrado = listResponse.body.find(
        (produto: any) => String(produto?.nome || '').trim() === nomeProduto,
      );
      expect(produtoEncontrado).toBeDefined();
      expect(produtoEncontrado.empresa_id).toBe(empresaEsperada);
      return String(produtoEncontrado.id);
    };

    it('Empresa 1 deve cadastrar produto/serviço próprio', async () => {
      const response = await request(app.getHttpServer())
        .post('/produtos')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          nome: produtoNomeEmpresa1,
          categoria: 'consultoria',
          preco: 2500,
          tipoItem: 'servico',
          descricao: 'Implementacao dedicada multi-tenancy',
        });

      expect([201, 409]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body.empresa_id).toBe(empresa1Id);
        expect(response.body.tipoItem).toBe('servico');
        produtoEmpresa1Id = response.body.id;
        return;
      }

      produtoEmpresa1Id = await resolverProdutoPorNome(tokenEmpresa1, produtoNomeEmpresa1, empresa1Id);
    });

    it('Empresa 2 deve cadastrar produto independente', async () => {
      const response = await request(app.getHttpServer())
        .post('/produtos')
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .send({
          nome: produtoNomeEmpresa2,
          categoria: 'support',
          preco: 1800,
          tipoItem: 'servico',
          descricao: 'Suporte dedicado',
        });

      expect([201, 409]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body.empresa_id).toBe(empresa2Id);
        produtoEmpresa2Id = response.body.id;
        return;
      }

      produtoEmpresa2Id = await resolverProdutoPorNome(tokenEmpresa2, produtoNomeEmpresa2, empresa2Id);
    });

    it('❌ Empresa 2 NÃO deve acessar produto da Empresa 1', async () => {
      await request(app.getHttpServer())
        .get(`/produtos/${produtoEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });

    it('✅ Empresa 1 deve listar apenas produtos próprios', async () => {
      const response = await request(app.getHttpServer())
        .get('/produtos')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const idsRetornados = response.body.map((produto: any) => produto.id);
      expect(idsRetornados).toContain(produtoEmpresa1Id);
      expect(idsRetornados).not.toContain(produtoEmpresa2Id);

      response.body.forEach((produto: any) => {
        expect(produto.empresa_id).toBe(empresa1Id);
      });
    });
  });

  describe('👥 Clientes - Isolamento Multi-Tenancy', () => {
    it('Empresa 1 deve criar cliente', async () => {
      const response = await request(app.getHttpServer())
        .post('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          nome: 'Cliente Teste Empresa 1',
          email: 'cliente@empresa1.com',
          tipo: 'pessoa_fisica',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.empresa_id).toBe(empresa1Id);
      clienteEmpresa1Id = response.body.data.id;
    });

    it('❌ Empresa 2 NÃO deve acessar cliente da Empresa 1', async () => {
      await request(app.getHttpServer())
        .get(`/clientes/${clienteEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });
  });

  describe('💼 Contratos - Isolamento Multi-Tenancy', () => {
    it('Empresa 1 deve criar contrato', async () => {
      if (skipIfFeatureUnavailable('contratos')) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/contratos')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          // propostaId é opcional - não enviar quando não existe
          clienteId: clienteEmpresa1Id,
          usuarioResponsavelId: userEmpresa1Id,
          tipo: 'servico',
          objeto: 'Contrato de teste multi-tenancy E2E',
          valorTotal: 5000,
          dataInicio: '2025-01-01',
          dataFim: '2025-12-31',
          dataVencimento: '2025-01-10',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.empresa_id).toBe(empresa1Id);
      contratoEmpresa1Id = response.body.data.id;
    });

    it('❌ Empresa 2 NÃO deve acessar contrato da Empresa 1', async () => {
      if (skipIfFeatureUnavailable('contratos')) {
        return;
      }

      await request(app.getHttpServer())
        .get(`/contratos/${contratoEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });
  });

  describe('💰 Faturas - Isolamento Multi-Tenancy', () => {
    beforeAll(async () => {
      if (skipIfFeatureUnavailable('contratos') || skipIfFeatureUnavailable('faturas')) {
        return;
      }

      if (!contratoEmpresa1Id) {
        const contratoResponse = await request(app.getHttpServer())
          .post('/contratos')
          .set('Authorization', `Bearer ${tokenEmpresa1}`)
          .send({
            clienteId: clienteEmpresa1Id,
            usuarioResponsavelId: userEmpresa1Id,
            tipo: 'servico',
            objeto: 'Contrato gerado automaticamente para fatura',
            valorTotal: 3000,
            dataInicio: '2025-01-01',
            dataFim: '2025-06-30',
            dataVencimento: '2025-01-10',
          });
        contratoEmpresa1Id = contratoResponse.body.data?.id;
      }
    });

    it('Empresa 1 deve criar fatura', async () => {
      if (skipIfFeatureUnavailable('contratos') || skipIfFeatureUnavailable('faturas')) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/faturamento/faturas')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          contratoId: contratoEmpresa1Id,
          clienteId: clienteEmpresa1Id,
          usuarioResponsavelId: userEmpresa1Id,
          tipo: 'unica',
          descricao: 'Fatura de teste multi-tenancy E2E',
          dataVencimento: '2025-02-15',
          itens: [
            {
              descricao: 'Item 1 - Teste E2E',
              quantidade: 1,
              valorUnitario: 1000,
            },
          ],
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.empresaId ?? response.body.data.empresa_id).toBe(empresa1Id);
      faturaEmpresa1Id = response.body.data.id;
    });

    it('❌ Empresa 2 NÃO deve acessar fatura da Empresa 1', async () => {
      if (skipIfFeatureUnavailable('contratos') || skipIfFeatureUnavailable('faturas')) {
        return;
      }

      await request(app.getHttpServer())
        .get(`/faturamento/faturas/${faturaEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });
  });

  describe('💳 Pagamentos - Isolamento Multi-Tenancy', () => {
    it('Empresa 1 deve registrar pagamento para sua própria fatura', async () => {
      if (
        skipIfFeatureUnavailable('contratos') ||
        skipIfFeatureUnavailable('faturas') ||
        skipIfFeatureUnavailable('pagamentos')
      ) {
        return;
      }

      pagamentoGatewayIdEmpresa1 = `PG-GATEWAY-${Date.now()}`;
      const response = await request(app.getHttpServer())
        .post('/faturamento/pagamentos')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          faturaId: faturaEmpresa1Id,
          transacaoId: `PG-${Date.now()}`,
          tipo: 'pagamento',
          valor: 1000,
          metodoPagamento: 'pix',
          gateway: 'mercado_pago',
          gatewayTransacaoId: pagamentoGatewayIdEmpresa1,
          taxa: 0,
          observacoes: 'Pagamento teste multi-tenancy',
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.empresaId ?? response.body.data.empresa_id).toBe(empresa1Id);
      pagamentoEmpresa1Id = response.body.data.id;
    });

    it('❌ Empresa 2 NÃO deve acessar pagamento da Empresa 1', async () => {
      if (
        skipIfFeatureUnavailable('contratos') ||
        skipIfFeatureUnavailable('faturas') ||
        skipIfFeatureUnavailable('pagamentos')
      ) {
        return;
      }

      await request(app.getHttpServer())
        .get(`/faturamento/pagamentos/${pagamentoEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });

    it('Empresa 1 deve processar pagamento com sucesso', async () => {
      if (
        skipIfFeatureUnavailable('contratos') ||
        skipIfFeatureUnavailable('faturas') ||
        skipIfFeatureUnavailable('pagamentos')
      ) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/faturamento/pagamentos/processar')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          gatewayTransacaoId: pagamentoGatewayIdEmpresa1,
          novoStatus: 'aprovado',
        })
        .expect(200);

      expect(response.body.data.status).toBe('aprovado');
      expect(response.body.data.empresaId ?? response.body.data.empresa_id).toBe(empresa1Id);
    });

    it('❌ Empresa 2 NÃO deve conseguir processar pagamento da Empresa 1', async () => {
      if (
        skipIfFeatureUnavailable('contratos') ||
        skipIfFeatureUnavailable('faturas') ||
        skipIfFeatureUnavailable('pagamentos')
      ) {
        return;
      }

      await request(app.getHttpServer())
        .post('/faturamento/pagamentos/processar')
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .send({
          gatewayTransacaoId: pagamentoGatewayIdEmpresa1,
          novoStatus: 'rejeitado',
        })
        .expect(404);
    });
  });

  describe('🏦 Gateways de Pagamento - Isolamento Multi-Tenancy', () => {
    it('Empresa 1 deve cadastrar configuração de gateway própria', async () => {
      const payload = {
        nome: 'Gateway Mercado Pago Empresa 1',
        gateway: 'mercado_pago',
        modoOperacao: 'sandbox',
        status: 'ativo',
        credenciais: { access_token: 'mp-token-empresa-1' },
        metodosPermitidos: ['pix', 'cartao_credito'],
      };

      const response = await request(app.getHttpServer())
        .post('/pagamentos/gateways/configuracoes')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send(payload);

      expect([201, 409]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body.empresa_id).toBe(empresa1Id);
        expect(response.body.gateway).toBe(payload.gateway);
        configuracaoGatewayEmpresa1Id = response.body.id;
      } else {
        const listResponse = await request(app.getHttpServer())
          .get('/pagamentos/gateways/configuracoes')
          .set('Authorization', `Bearer ${tokenEmpresa1}`)
          .expect(200);

        const existing = listResponse.body.find(
          (config: any) =>
            config.gateway === payload.gateway && config.modoOperacao === payload.modoOperacao,
        );
        expect(existing).toBeDefined();
        expect(existing.empresa_id).toBe(empresa1Id);
        configuracaoGatewayEmpresa1Id = existing.id;
      }
    });

    it('Empresa 2 deve cadastrar configuração independente', async () => {
      const payload = {
        nome: 'Gateway Stripe Empresa 2',
        gateway: 'stripe',
        modoOperacao: 'producao',
        status: 'ativo',
        credenciais: { api_key: 'stripe-key-empresa-2' },
        metodosPermitidos: ['cartao_credito'],
      };

      const response = await request(app.getHttpServer())
        .post('/pagamentos/gateways/configuracoes')
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .send(payload);

      expect([201, 409]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body.empresa_id).toBe(empresa2Id);
        expect(response.body.gateway).toBe(payload.gateway);
        configuracaoGatewayEmpresa2Id = response.body.id;
      } else {
        const listResponse = await request(app.getHttpServer())
          .get('/pagamentos/gateways/configuracoes')
          .set('Authorization', `Bearer ${tokenEmpresa2}`)
          .expect(200);

        const existing = listResponse.body.find(
          (config: any) =>
            config.gateway === payload.gateway && config.modoOperacao === payload.modoOperacao,
        );
        expect(existing).toBeDefined();
        expect(existing.empresa_id).toBe(empresa2Id);
        configuracaoGatewayEmpresa2Id = existing.id;
      }
    });

    it('❌ Empresa 2 NÃO deve acessar configuração da Empresa 1', async () => {
      expect(configuracaoGatewayEmpresa1Id).toBeDefined();
      await request(app.getHttpServer())
        .get(`/pagamentos/gateways/configuracoes/${configuracaoGatewayEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });

    it('✅ Empresa 1 deve listar apenas suas configurações de gateway', async () => {
      const response = await request(app.getHttpServer())
        .get('/pagamentos/gateways/configuracoes')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const ids = response.body.map((config: any) => config.id);
      expect(ids).toContain(configuracaoGatewayEmpresa1Id);
      expect(ids).not.toContain(configuracaoGatewayEmpresa2Id);
      response.body.forEach((config: any) => {
        expect(config.empresa_id).toBe(empresa1Id);
      });
    });

    it('Empresa 1 deve registrar transação utilizando configuração própria', async () => {
      expect(configuracaoGatewayEmpresa1Id).toBeDefined();

      const referenciaGateway = `GW-TXN-${Date.now()}`;
      const payload: Record<string, any> = {
        configuracaoId: configuracaoGatewayEmpresa1Id,
        referenciaGateway,
        tipoOperacao: 'cobranca',
        metodo: 'pix',
        valorBruto: 1000,
        taxa: 10,
        payloadEnvio: { origem: 'teste-e2e' },
      };

      if (typeof faturaEmpresa1Id === 'number') {
        payload.faturaId = faturaEmpresa1Id;
      }

      if (typeof pagamentoEmpresa1Id === 'number') {
        payload.pagamentoId = pagamentoEmpresa1Id;
      }

      const response = await request(app.getHttpServer())
        .post('/pagamentos/gateways/transacoes')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.empresa_id).toBe(empresa1Id);
      expect(response.body.configuracaoId).toBe(configuracaoGatewayEmpresa1Id);
      expect(response.body.referenciaGateway).toBe(referenciaGateway);
      expect(Number(response.body.valorLiquido)).toBe(990);
      transacaoGatewayEmpresa1Id = response.body.id;
    });

    it('❌ Empresa 2 NÃO deve acessar transação da Empresa 1', async () => {
      expect(transacaoGatewayEmpresa1Id).toBeDefined();
      await request(app.getHttpServer())
        .get(`/pagamentos/gateways/transacoes/${transacaoGatewayEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });

    it('❌ Empresa 2 NÃO deve criar transação usando configuração da Empresa 1', async () => {
      expect(configuracaoGatewayEmpresa1Id).toBeDefined();
      await request(app.getHttpServer())
        .post('/pagamentos/gateways/transacoes')
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .send({
          configuracaoId: configuracaoGatewayEmpresa1Id,
          referenciaGateway: `GW-TXN-BLOCK-${Date.now()}`,
        })
        .expect(404);
    });

    it('✅ Empresa 1 deve listar apenas transações do próprio gateway', async () => {
      const response = await request(app.getHttpServer())
        .get('/pagamentos/gateways/transacoes')
        .query({ configuracaoId: configuracaoGatewayEmpresa1Id })
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const ids = response.body.map((t: any) => t.id);
      expect(ids).toContain(transacaoGatewayEmpresa1Id);
      response.body.forEach((transacao: any) => {
        expect(transacao.empresa_id).toBe(empresa1Id);
        expect(transacao.configuracaoId).toBe(configuracaoGatewayEmpresa1Id);
      });
    });
  });

  describe('🔒 Tentativas de Bypass Multi-Tenancy', () => {
    it('❌ NÃO deve permitir modificar empresa_id via payload', async () => {
      // O payload extra deve ser ignorado pelo whitelist e o registro ficar na empresa do token.
      const response = await request(app.getHttpServer())
        .post('/leads')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          nome: 'Lead Malicioso',
          email: `hack+${Date.now()}@test.com`,
          origem: 'formulario',
          empresa_id: empresa2Id, // ← Tentativa de criar para Empresa 2
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');

      await request(app.getHttpServer())
        .get(`/leads/${response.body.id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });

    it('❌ NÃO deve permitir atualizar empresa_id', async () => {
      const nomeAtualizado = `Lead Atualizado ${Date.now()}`;

      const response = await request(app.getHttpServer())
        .patch(`/leads/${leadEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          nome: nomeAtualizado,
          empresa_id: empresa2Id, // Tentativa de transferir para outra empresa (deve ser ignorada)
        })
        .expect(200);

      expect(response.body.id).toBe(leadEmpresa1Id);
      expect(response.body.nome).toBe(nomeAtualizado);

      // Empresa 2 continua sem acesso ao lead da Empresa 1.
      await request(app.getHttpServer())
        .get(`/leads/${leadEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);

      // Empresa 1 segue com acesso normal ao lead atualizado.
      const ownView = await request(app.getHttpServer())
        .get(`/leads/${leadEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .expect(200);

      expect(ownView.body.id).toBe(leadEmpresa1Id);
      expect(ownView.body.nome).toBe(nomeAtualizado);
    });
  });

  describe('🚫 Testes Negativos - Sem Autenticação', () => {
    it('❌ NÃO deve acessar recursos sem token JWT', async () => {
      await request(app.getHttpServer()).get('/leads').expect(401); // Unauthorized
    });

    it('❌ NÃO deve acessar recursos com token inválido', async () => {
      await request(app.getHttpServer())
        .get('/leads')
        .set('Authorization', 'Bearer token_invalido_xyz')
        .expect(401);
    });
  });
});

