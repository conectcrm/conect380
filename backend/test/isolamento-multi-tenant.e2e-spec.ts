import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Testes E2E de Isolamento Multi-Tenant
 * 
 * OBJETIVO: Garantir que Empresa A NUNCA vê dados da Empresa B
 * 
 * CENÁRIOS TESTADOS:
 * - Isolamento de clientes
 * - Isolamento de propostas
 * - Isolamento de produtos
 * - Isolamento de usuários
 * - Tentativa de manipulação de IDs
 * - Tentativa de burlar filtros
 */
describe('Isolamento Multi-Tenant (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // Tokens de autenticação
  let tokenEmpresaA: string;
  let tokenEmpresaB: string;

  // IDs de empresas
  let empresaAId: string;
  let empresaBId: string;

  // Dados de teste
  let clienteEmpresaA: any;
  let clienteEmpresaB: any;
  let propostaEmpresaA: any;
  let propostaEmpresaB: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Setup: Criar 2 empresas de teste
    console.log('🧪 Criando empresas de teste...');
    await criarEmpresasEUsuarios();

    // Fazer login em ambas as empresas
    tokenEmpresaA = await fazerLogin('admin-a@teste.com', 'senha123');
    tokenEmpresaB = await fazerLogin('admin-b@teste.com', 'senha123');

    console.log('✅ Setup concluído');
  });

  afterAll(async () => {
    // Cleanup: Remover dados de teste
    await limparDadosTeste();
    await app.close();
  });

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  async function criarEmpresasEUsuarios() {
    // Limpar dados antigos primeiro
    await dataSource.query('SET session_replication_role = replica;');
    await dataSource.query(`DELETE FROM empresas WHERE cnpj IN ('11111111000199', '22222222000199')`);
    await dataSource.query('SET session_replication_role = DEFAULT;');

    // Criar Empresa A
    const resultEmpresaA = await dataSource.query(`
      INSERT INTO empresas (id, nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio, plano)
      VALUES (gen_random_uuid(), 'Empresa A Teste', 'empresa-a-teste-e2e', '11111111000199', 'empresaa-e2e@teste.com', 
              '11999999999', 'Rua A', 'São Paulo', 'SP', '01000-000', 'empresa-a-teste-e2e', 'professional')
      RETURNING id;
    `);
    empresaAId = resultEmpresaA[0].id;

    // Criar Empresa B
    const resultEmpresaB = await dataSource.query(`
      INSERT INTO empresas (id, nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio, plano)
      VALUES (gen_random_uuid(), 'Empresa B Teste', 'empresa-b-teste-e2e', '22222222000199', 'empresab-e2e@teste.com', 
              '11988888888', 'Rua B', 'São Paulo', 'SP', '02000-000', 'empresa-b-teste-e2e', 'professional')
      RETURNING id;
    `);
    empresaBId = resultEmpresaB[0].id;

    // Criar usuário admin da Empresa A
    await dataSource.query(`
      INSERT INTO users (id, nome, email, senha, empresa_id, perfil, ativo)
      VALUES (gen_random_uuid(), 'Admin A', 'admin-a@teste.com', 
              '$2b$10$dummy_hash', '${empresaAId}', 'admin', true);
    `);

    // Criar usuário admin da Empresa B
    await dataSource.query(`
      INSERT INTO users (id, nome, email, senha, empresa_id, perfil, ativo)
      VALUES (gen_random_uuid(), 'Admin B', 'admin-b@teste.com', 
              '$2b$10$dummy_hash', '${empresaBId}', 'admin', true);
    `);
  }

  async function fazerLogin(email: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Login falhou para ${email}: ${response.body.message}`);
    }

    return response.body.access_token || response.body.token;
  }

  async function limparDadosTeste() {
    try {
      // Desabilitar RLS temporariamente para cleanup
      await dataSource.query('SET session_replication_role = replica;');

      await dataSource.query(`DELETE FROM clientes WHERE empresa_id IN ('${empresaAId}', '${empresaBId}')`);
      await dataSource.query(`DELETE FROM propostas WHERE empresa_id IN ('${empresaAId}', '${empresaBId}')`);
      await dataSource.query(`DELETE FROM users WHERE empresa_id IN ('${empresaAId}', '${empresaBId}')`);
      await dataSource.query(`DELETE FROM empresas WHERE id IN ('${empresaAId}', '${empresaBId}')`);

      // Reabilitar RLS
      await dataSource.query('SET session_replication_role = DEFAULT;');
    } catch (error) {
      console.error('Erro ao limpar dados de teste:', error);
    }
  }

  // ========================================
  // TESTES: ISOLAMENTO DE CLIENTES
  // ========================================

  describe('Isolamento de Clientes', () => {
    it('✅ Empresa A deve conseguir criar cliente', async () => {
      const response = await request(app.getHttpServer())
        .post('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .send({
          nome: 'Cliente A',
          email: 'clientea@teste.com',
          telefone: '11999999999',
        })
        .expect(201);

      clienteEmpresaA = response.body;
      expect(clienteEmpresaA).toHaveProperty('id');
      expect(clienteEmpresaA.nome).toBe('Cliente A');
    });

    it('✅ Empresa B deve conseguir criar cliente', async () => {
      const response = await request(app.getHttpServer())
        .post('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresaB}`)
        .send({
          nome: 'Cliente B',
          email: 'clienteb@teste.com',
          telefone: '11988888888',
        })
        .expect(201);

      clienteEmpresaB = response.body;
      expect(clienteEmpresaB).toHaveProperty('id');
      expect(clienteEmpresaB.nome).toBe('Cliente B');
    });

    it('🔒 Empresa A NÃO deve ver cliente da Empresa B na listagem', async () => {
      const response = await request(app.getHttpServer())
        .get('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .expect(200);

      const clientes = response.body;
      expect(Array.isArray(clientes)).toBe(true);

      // Validar que cliente B NÃO está na lista
      const temClienteB = clientes.some(c => c.id === clienteEmpresaB.id);
      expect(temClienteB).toBe(false);

      // Validar que cliente A ESTÁ na lista
      const temClienteA = clientes.some(c => c.id === clienteEmpresaA.id);
      expect(temClienteA).toBe(true);
    });

    it('🔒 Empresa A NÃO deve conseguir acessar cliente da Empresa B por ID', async () => {
      await request(app.getHttpServer())
        .get(`/clientes/${clienteEmpresaB.id}`)
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .expect(404); // Ou 403 Forbidden
    });

    it('🔒 Empresa A NÃO deve conseguir atualizar cliente da Empresa B', async () => {
      await request(app.getHttpServer())
        .put(`/clientes/${clienteEmpresaB.id}`)
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .send({ nome: 'Tentativa de Hack' })
        .expect(404); // Ou 403
    });

    it('🔒 Empresa A NÃO deve conseguir deletar cliente da Empresa B', async () => {
      await request(app.getHttpServer())
        .delete(`/clientes/${clienteEmpresaB.id}`)
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .expect(404); // Ou 403
    });
  });

  // ========================================
  // TESTES: ISOLAMENTO DE PROPOSTAS
  // ========================================

  describe('Isolamento de Propostas', () => {
    it('✅ Empresa A deve conseguir criar proposta', async () => {
      const response = await request(app.getHttpServer())
        .post('/propostas')
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .send({
          cliente_id: clienteEmpresaA.id,
          titulo: 'Proposta A',
          valor: 5000,
          status: 'em_analise',
        })
        .expect(201);

      propostaEmpresaA = response.body;
      expect(propostaEmpresaA).toHaveProperty('id');
    });

    it('✅ Empresa B deve conseguir criar proposta', async () => {
      const response = await request(app.getHttpServer())
        .post('/propostas')
        .set('Authorization', `Bearer ${tokenEmpresaB}`)
        .send({
          cliente_id: clienteEmpresaB.id,
          titulo: 'Proposta B',
          valor: 8000,
          status: 'em_analise',
        })
        .expect(201);

      propostaEmpresaB = response.body;
      expect(propostaEmpresaB).toHaveProperty('id');
    });

    it('🔒 Empresa A NÃO deve ver proposta da Empresa B', async () => {
      const response = await request(app.getHttpServer())
        .get('/propostas')
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .expect(200);

      const propostas = response.body;
      const temPropostaB = propostas.some(p => p.id === propostaEmpresaB.id);
      expect(temPropostaB).toBe(false);
    });

    it('🔒 Empresa A NÃO deve conseguir acessar proposta da Empresa B por ID', async () => {
      await request(app.getHttpServer())
        .get(`/propostas/${propostaEmpresaB.id}`)
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .expect(404);
    });
  });

  // ========================================
  // TESTES: TENTATIVAS DE BURLAR SEGURANÇA
  // ========================================

  describe('Tentativas de Manipulação', () => {
    it('🔒 NÃO deve permitir criar cliente para outra empresa via body', async () => {
      // Tentar criar cliente forçando empresaId diferente
      await request(app.getHttpServer())
        .post('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .send({
          nome: 'Cliente Hack',
          email: 'hack@teste.com',
          empresa_id: empresaBId, // ⚠️ Tentativa de injeção
        })
        .expect(201);

      // Verificar que o cliente foi criado para Empresa A (não B)
      const response = await request(app.getHttpServer())
        .get('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresaB}`)
        .expect(200);

      const clienteHack = response.body.find(c => c.email === 'hack@teste.com');
      expect(clienteHack).toBeUndefined(); // Empresa B não deve ver
    });

    it('🔒 Query com filtro malicioso não deve retornar dados de outras empresas', async () => {
      // Tentar buscar com filtro que inclui ID de cliente de outra empresa
      const response = await request(app.getHttpServer())
        .get(`/clientes?id=${clienteEmpresaB.id}`)
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .expect(200);

      expect(response.body).toEqual([]); // Lista vazia
    });
  });

  // ========================================
  // TESTES: VALIDAÇÃO DE RLS NO BANCO
  // ========================================

  describe('Validação de Row Level Security (Banco)', () => {
    it('🔒 Query direto no banco deve respeitar RLS', async () => {
      // Definir tenant context
      await dataSource.query(`SELECT set_current_tenant('${empresaAId}')`);

      // Buscar clientes (deve retornar apenas da Empresa A)
      const clientes = await dataSource.query('SELECT * FROM clientes');

      const temClienteB = clientes.some(c => c.id === clienteEmpresaB.id);
      expect(temClienteB).toBe(false);

      const temClienteA = clientes.some(c => c.id === clienteEmpresaA.id);
      expect(temClienteA).toBe(true);
    });

    it('🔒 Trocar tenant context deve alterar resultados', async () => {
      // Definir Empresa A
      await dataSource.query(`SELECT set_current_tenant('${empresaAId}')`);
      const clientesA = await dataSource.query('SELECT * FROM clientes');

      // Definir Empresa B
      await dataSource.query(`SELECT set_current_tenant('${empresaBId}')`);
      const clientesB = await dataSource.query('SELECT * FROM clientes');

      // Validar que são listas diferentes
      expect(clientesA.length).not.toBe(clientesB.length);

      const idsA = clientesA.map(c => c.id);
      const idsB = clientesB.map(c => c.id);

      // Nenhum ID deve aparecer nas duas listas
      const intersecao = idsA.filter(id => idsB.includes(id));
      expect(intersecao.length).toBe(0);
    });
  });

  // ========================================
  // TESTES: AUDITORIA
  // ========================================

  describe('Sistema de Auditoria', () => {
    it('✅ Deve registrar logs de auditoria por empresa', async () => {
      // Criar cliente
      await request(app.getHttpServer())
        .post('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .send({
          nome: 'Cliente Auditoria',
          email: 'auditoria@teste.com',
        });

      // Verificar se log foi criado
      await dataSource.query(`SELECT set_current_tenant('${empresaAId}')`);
      const logs = await dataSource.query(`
        SELECT * FROM audit_logs 
        WHERE entidade = 'cliente' 
        AND empresa_id = '${empresaAId}'
        ORDER BY created_at DESC 
        LIMIT 10
      `);

      expect(logs.length).toBeGreaterThan(0);
    });

    it('🔒 Empresa A NÃO deve ver logs de auditoria da Empresa B', async () => {
      await dataSource.query(`SELECT set_current_tenant('${empresaAId}')`);
      const logsA = await dataSource.query(`
        SELECT * FROM audit_logs WHERE empresa_id = '${empresaBId}'
      `);

      expect(logsA.length).toBe(0); // RLS bloqueia
    });
  });
});
