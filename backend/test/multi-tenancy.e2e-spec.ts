import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

/**
 * Testes E2E para validar isolamento Multi-Tenancy
 *
 * Objetivo: Garantir que empresa A NÃƒO consegue acessar dados da empresa B
 *
 * CenÃ¡rios testados:
 * - Leads: Empresa 1 nÃ£o acessa leads da Empresa 2
 * - Oportunidades: Empresa 1 nÃ£o acessa oportunidades da Empresa 2
 * - Clientes: Empresa 1 nÃ£o acessa clientes da Empresa 2
 * - Contratos: Empresa 1 nÃ£o acessa contratos da Empresa 2
 */
describe('Multi-Tenancy Isolation (E2E)', () => {
  const TEST_PASSWORD = 'senha123';
  const TEST_EMAIL_EMPRESA_1 = 'e2e.admin.empresa1@conectcrm.local';
  const TEST_EMAIL_EMPRESA_2 = 'e2e.admin.empresa2@conectcrm.local';
  const TEST_USER_ID_EMPRESA_1 = '00000000-0000-4000-8000-000000000001';
  const TEST_USER_ID_EMPRESA_2 = '00000000-0000-4000-8000-000000000002';

  let app: INestApplication;
  let dataSource: DataSource;
  let empresa1Id: string;
  let empresa2Id: string;

  // Tokens de autenticaÃ§Ã£o
  let tokenEmpresa1: string;
  let tokenEmpresa2: string;

  // IDs de usuÃ¡rios autenticados
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
      [
        TEST_USER_ID_EMPRESA_1,
        'Admin E2E Empresa 1',
        TEST_EMAIL_EMPRESA_1,
        senhaHash,
        empresa1Id,
        'admin',
        true,
      ],
    );

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
      [
        TEST_USER_ID_EMPRESA_2,
        'Admin E2E Empresa 2',
        TEST_EMAIL_EMPRESA_2,
        senhaHash,
        empresa2Id,
        'admin',
        true,
      ],
    );
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = app.get(DataSource);
    await prepararUsuariosTeste();

    tableFeatureAvailability.contratos = await tableExists('contratos');
    tableFeatureAvailability.faturas = await tableExists('faturas');
    tableFeatureAvailability.pagamentos = await tableExists('pagamentos');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('ðŸ” AutenticaÃ§Ã£o', () => {
    it('Deve fazer login na Empresa 1', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: TEST_EMAIL_EMPRESA_1,
          senha: TEST_PASSWORD, // â† Campo correto: 'senha' (nÃ£o 'password')
        })
        .expect(201); // âœ… Corrigido: login retorna 201 Created

      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('user');
      tokenEmpresa1 = response.body.data.access_token; // âœ… Corrigido: token estÃ¡ em 'data'
      userEmpresa1Id = response.body.data.user.id; // âœ… Capturar ID do usuÃ¡rio
    });

    it('Deve fazer login na Empresa 2', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: TEST_EMAIL_EMPRESA_2,
          senha: TEST_PASSWORD, // â† Campo correto: 'senha' (nÃ£o 'password')
        })
        .expect(201); // âœ… Corrigido: login retorna 201 Created

      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('user');
      tokenEmpresa2 = response.body.data.access_token; // âœ… Corrigido: token estÃ¡ em 'data'
      userEmpresa2Id = response.body.data.user.id; // âœ… Capturar ID do usuÃ¡rio
    });
  });

  describe('ðŸ“Š Leads - Isolamento Multi-Tenancy', () => {
    it('Empresa 1 deve criar lead com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/leads')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          nome: 'Lead Teste Empresa 1',
          email: 'lead1@empresa1.com',
          telefone: '11999999999',
          origem: 'formulario', // âœ… Corrigido: 'website' â†’ 'formulario' (enum vÃ¡lido)
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
          origem: 'indicacao', // âœ… Mantido (jÃ¡ Ã© enum vÃ¡lido)
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      leadEmpresa2Id = response.body.id;
    });

    it('âŒ Empresa 1 NÃƒO deve acessar lead da Empresa 2', async () => {
      const response = await request(app.getHttpServer())
        .get(`/leads/${leadEmpresa2Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .expect(404); // NÃ£o encontrado (filtrado por empresa_id)

      // Ou pode retornar 403 Forbidden dependendo da implementaÃ§Ã£o
      // .expect(403);
    });

    it('âŒ Empresa 2 NÃƒO deve acessar lead da Empresa 1', async () => {
      await request(app.getHttpServer())
        .get(`/leads/${leadEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });

    it('âœ… Empresa 1 deve listar apenas seus prÃ³prios leads', async () => {
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

  describe('ðŸŽ¯ Oportunidades - Isolamento Multi-Tenancy', () => {
    // âœ… Oportunidade.entity AGORA TEM empresa_id (migration executada)
    it('Empresa 1 deve criar oportunidade', async () => {
      const response = await request(app.getHttpServer())
        .post('/oportunidades')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          titulo: 'Oportunidade Teste Empresa 1',
          valor: 15000,
          probabilidade: 75,
          estagio: 'qualification', // âœ… Valor correto da enum EstagioOportunidade
          prioridade: 'medium', // âœ… Adicionado - PrioridadeOportunidade.MEDIA
          origem: 'website', // âœ… Adicionado - OrigemOportunidade.WEBSITE
          nomeContato: 'Contato Teste',
          responsavel_id: userEmpresa1Id, // âœ… ADICIONADO - UUID do usuÃ¡rio autenticado (REQUIRED)
        })
        .expect(201);

      oportunidadeEmpresa1Id = response.body.id;
    });

    it('âŒ Empresa 2 NÃƒO deve acessar oportunidade da Empresa 1', async () => {
      await request(app.getHttpServer())
        .get(`/oportunidades/${oportunidadeEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });

    it('âœ… Empresa 1 deve listar apenas suas oportunidades', async () => {
      const response = await request(app.getHttpServer())
        .get('/oportunidades')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);

      // Todas as oportunidades devem ter apenas empresa_id da Empresa 1
      response.body.forEach((oportunidade: any) => {
        expect(oportunidade.empresa_id).toBe(empresa1Id); // âœ… FIX: UUID correto
      });
    });
  });

  describe('ðŸ“ Atividades - Isolamento Multi-Tenancy', () => {
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

    it('âŒ Empresa 2 NÃƒO deve registrar atividade na oportunidade da Empresa 1', async () => {
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

  describe('ðŸ›ï¸ Produtos/ServiÃ§os - Isolamento Multi-Tenancy', () => {
    it('Empresa 1 deve cadastrar produto/serviÃ§o prÃ³prio', async () => {
      const response = await request(app.getHttpServer())
        .post('/produtos')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          nome: 'ServiÃ§o Premium Empresa 1',
          categoria: 'consultoria',
          preco: 2500,
          tipoItem: 'servico',
          descricao: 'ImplementaÃ§Ã£o dedicada multi-tenancy',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.empresa_id).toBe(empresa1Id);
      expect(response.body.tipoItem).toBe('servico');
      produtoEmpresa1Id = response.body.id;
    });

    it('Empresa 2 deve cadastrar produto independente', async () => {
      const response = await request(app.getHttpServer())
        .post('/produtos')
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .send({
          nome: 'ServiÃ§o Especial Empresa 2',
          categoria: 'support',
          preco: 1800,
          tipoItem: 'servico',
          descricao: 'Suporte dedicado',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.empresa_id).toBe(empresa2Id);
      produtoEmpresa2Id = response.body.id;
    });

    it('âŒ Empresa 2 NÃƒO deve acessar produto da Empresa 1', async () => {
      await request(app.getHttpServer())
        .get(`/produtos/${produtoEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });

    it('âœ… Empresa 1 deve listar apenas produtos prÃ³prios', async () => {
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

  describe('ðŸ‘¥ Clientes - Isolamento Multi-Tenancy', () => {
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

    it('âŒ Empresa 2 NÃƒO deve acessar cliente da Empresa 1', async () => {
      await request(app.getHttpServer())
        .get(`/clientes/${clienteEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });
  });

  describe('ðŸ’¼ Contratos - Isolamento Multi-Tenancy', () => {
    it('Empresa 1 deve criar contrato', async () => {
      if (skipIfFeatureUnavailable('contratos')) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/contratos')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          // propostaId Ã© opcional - nÃ£o enviar quando nÃ£o existe
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

    it('âŒ Empresa 2 NÃƒO deve acessar contrato da Empresa 1', async () => {
      if (skipIfFeatureUnavailable('contratos')) {
        return;
      }

      await request(app.getHttpServer())
        .get(`/contratos/${contratoEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });
  });

  describe('ðŸ’° Faturas - Isolamento Multi-Tenancy', () => {
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

    it('âŒ Empresa 2 NÃƒO deve acessar fatura da Empresa 1', async () => {
      if (skipIfFeatureUnavailable('contratos') || skipIfFeatureUnavailable('faturas')) {
        return;
      }

      await request(app.getHttpServer())
        .get(`/faturamento/faturas/${faturaEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });
  });

  describe('ðŸ’³ Pagamentos - Isolamento Multi-Tenancy', () => {
    it('Empresa 1 deve registrar pagamento para sua prÃ³pria fatura', async () => {
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

    it('âŒ Empresa 2 NÃƒO deve acessar pagamento da Empresa 1', async () => {
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

    it('âŒ Empresa 2 NÃƒO deve conseguir processar pagamento da Empresa 1', async () => {
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

  describe('ðŸ¦ Gateways de Pagamento - Isolamento Multi-Tenancy', () => {
    it('Empresa 1 deve cadastrar configuraÃ§Ã£o de gateway prÃ³pria', async () => {
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

    it('Empresa 2 deve cadastrar configuraÃ§Ã£o independente', async () => {
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

    it('âŒ Empresa 2 NÃƒO deve acessar configuraÃ§Ã£o da Empresa 1', async () => {
      expect(configuracaoGatewayEmpresa1Id).toBeDefined();
      await request(app.getHttpServer())
        .get(`/pagamentos/gateways/configuracoes/${configuracaoGatewayEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });

    it('âœ… Empresa 1 deve listar apenas suas configuraÃ§Ãµes de gateway', async () => {
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

    it('Empresa 1 deve registrar transaÃ§Ã£o utilizando configuraÃ§Ã£o prÃ³pria', async () => {
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

    it('âŒ Empresa 2 NÃƒO deve acessar transaÃ§Ã£o da Empresa 1', async () => {
      expect(transacaoGatewayEmpresa1Id).toBeDefined();
      await request(app.getHttpServer())
        .get(`/pagamentos/gateways/transacoes/${transacaoGatewayEmpresa1Id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });

    it('âŒ Empresa 2 NÃƒO deve criar transaÃ§Ã£o usando configuraÃ§Ã£o da Empresa 1', async () => {
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

    it('âœ… Empresa 1 deve listar apenas transaÃ§Ãµes do prÃ³prio gateway', async () => {
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

  describe('ðŸ”’ Tentativas de Bypass Multi-Tenancy', () => {
    it('âŒ NÃƒO deve permitir modificar empresa_id via payload', async () => {
      // O payload extra deve ser ignorado pelo whitelist e o registro ficar na empresa do token.
      const response = await request(app.getHttpServer())
        .post('/leads')
        .set('Authorization', `Bearer ${tokenEmpresa1}`)
        .send({
          nome: 'Lead Malicioso',
          email: `hack+${Date.now()}@test.com`,
          origem: 'formulario',
          empresa_id: empresa2Id, // â† Tentativa de criar para Empresa 2
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');

      await request(app.getHttpServer())
        .get(`/leads/${response.body.id}`)
        .set('Authorization', `Bearer ${tokenEmpresa2}`)
        .expect(404);
    });

    it('âŒ NÃƒO deve permitir atualizar empresa_id', async () => {
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

  describe('ðŸš« Testes Negativos - Sem AutenticaÃ§Ã£o', () => {
    it('âŒ NÃƒO deve acessar recursos sem token JWT', async () => {
      await request(app.getHttpServer()).get('/leads').expect(401); // Unauthorized
    });

    it('âŒ NÃƒO deve acessar recursos com token invÃ¡lido', async () => {
      await request(app.getHttpServer())
        .get('/leads')
        .set('Authorization', 'Bearer token_invalido_xyz')
        .expect(401);
    });
  });
});

