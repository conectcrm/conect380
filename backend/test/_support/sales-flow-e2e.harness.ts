import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { CreatePropostasPortalTokens1802869000000 } from '../../src/migrations/1802869000000-CreatePropostasPortalTokens';
import { EmailIntegradoService } from '../../src/modules/propostas/email-integrado.service';
import { createE2EApp, withE2EBootstrapLock } from './e2e-app.helper';

export class SalesFlowE2EHarness {
  readonly runId = Date.now().toString();
  readonly testPassword = 'senha123';

  readonly adminEmpresaAId = randomUUID();
  readonly adminEmpresaBId = randomUUID();

  readonly emailAdminEmpresaA = `e2e.portal.admin.a.${this.runId}@conectcrm.local`;
  readonly emailAdminEmpresaB = `e2e.portal.admin.b.${this.runId}@conectcrm.local`;

  app!: INestApplication;
  dataSource!: DataSource;

  empresaAId!: string;
  empresaBId!: string;
  clienteEmpresaAId!: string;
  clienteEmpresaBId!: string;

  tokenAdminEmpresaA!: string;
  tokenAdminEmpresaB!: string;

  propostaEmpresaAId!: string;
  tokenPortalEmpresaA!: string;
  contratoEmpresaAId: number | null = null;
  configuracaoGatewayEmpresaAId: string | null = null;
  faturaEmpresaAId: number | null = null;
  pagamentoEmpresaAId: number | null = null;

  async setup(): Promise<void> {
    const moduleFixture: TestingModule = await withE2EBootstrapLock(() => Test.createTestingModule({
      imports: [AppModule],
    }).compile());

    this.app = await createE2EApp(moduleFixture);

    const emailIntegradoService = this.app.get(EmailIntegradoService);
    jest.spyOn(emailIntegradoService, 'notificarPropostaAceita').mockResolvedValue(true);
    jest.spyOn(emailIntegradoService, 'notificarPropostaRejeitada').mockResolvedValue(true);
    jest.spyOn(emailIntegradoService, 'enviarEmailGenerico').mockResolvedValue({
      success: true,
      messageId: `e2e-${this.runId}`,
    } as any);

    this.dataSource = this.app.get(DataSource);
    await this.ensurePortalTokensInfra();

    await this.criarEmpresasEUsuarios();

    this.tokenAdminEmpresaA = await this.fazerLogin(this.emailAdminEmpresaA, this.testPassword);
    this.tokenAdminEmpresaB = await this.fazerLogin(this.emailAdminEmpresaB, this.testPassword);

    this.propostaEmpresaAId = await this.criarPropostaViaApi(
      this.tokenAdminEmpresaA,
      `Portal E2E ${this.runId} A`,
    );
  }

  async teardown(): Promise<void> {
    if (!this.app) return;
    await this.limparDadosTeste();
    await this.app.close();
  }

  get httpServer() {
    return this.app.getHttpServer();
  }

  async criarEmpresa(label: 'A' | 'B'): Promise<string> {
    const suffix = `${this.runId}${label === 'A' ? '1' : '2'}`.slice(-12);
    const slug = `e2e-portal-${label.toLowerCase()}-${this.runId}`;
    const cnpj = `${suffix}${label === 'A' ? '01' : '02'}`.padStart(14, '0').slice(-14);
    const email = `${slug}@conectcrm.local`;
    const subdominio = slug.slice(0, 90);

    const created = await this.dataSource.query(
      `
        INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        `Empresa Portal ${label}`,
        slug,
        cnpj,
        email,
        '11999999999',
        'Rua E2E Portal',
        'Sao Paulo',
        'SP',
        '01000-000',
        subdominio,
      ],
    );

    return created[0].id as string;
  }

  async inserirUsuario(
    id: string,
    nome: string,
    email: string,
    empresaId: string,
    senhaHash: string,
  ) {
    await this.dataSource.query(
      `
        INSERT INTO users (id, nome, email, senha, empresa_id, role, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [id, nome, email, senhaHash, empresaId, 'admin', true],
    );
  }

  async criarEmpresasEUsuarios() {
    this.empresaAId = await this.criarEmpresa('A');
    this.empresaBId = await this.criarEmpresa('B');

    const senhaHash = await bcrypt.hash(this.testPassword, 10);

    await this.inserirUsuario(
      this.adminEmpresaAId,
      'Admin Portal A',
      this.emailAdminEmpresaA,
      this.empresaAId,
      senhaHash,
    );
    await this.inserirUsuario(
      this.adminEmpresaBId,
      'Admin Portal B',
      this.emailAdminEmpresaB,
      this.empresaBId,
      senhaHash,
    );

    this.clienteEmpresaAId = await this.criarClienteTeste(this.empresaAId, 'A');
    this.clienteEmpresaBId = await this.criarClienteTeste(this.empresaBId, 'B');
  }

  async criarClienteTeste(empresaId: string, label: 'A' | 'B'): Promise<string> {
    const created = await this.dataSource.query(
      `
        INSERT INTO clientes (nome, email, telefone, tipo, empresa_id, ativo)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        `Cliente E2E ${label} ${this.runId}`,
        `cliente.e2e.${label.toLowerCase()}.${this.runId}@conectcrm.local`,
        '11988887777',
        'pessoa_juridica',
        empresaId,
        true,
      ],
    );

    return created[0].id as string;
  }

  async ensurePortalTokensInfra() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      const hasTable = await queryRunner.hasTable('propostas_portal_tokens');
      if (hasTable) return;

      const migration = new CreatePropostasPortalTokens1802869000000();
      await migration.up(queryRunner);
    } finally {
      await queryRunner.release();
    }
  }

  async fazerLogin(email: string, senha: string): Promise<string> {
    const response = await request(this.httpServer).post('/auth/login').send({ email, senha });

    if (![200, 201].includes(response.status)) {
      throw new Error(`Falha no login para ${email}: status ${response.status}`);
    }

    const token = response.body?.data?.access_token ?? response.body?.access_token;
    if (!token) {
      throw new Error(`Token nao retornado no login para ${email}`);
    }

    return token as string;
  }

  async criarPropostaViaApi(token: string, titulo: string): Promise<string> {
    const payload = {
      titulo,
      cliente: `Cliente Portal ${this.runId}`,
      valor: 2500,
      total: 2500,
      source: `e2e-portal-${this.runId}`,
      produtos: [],
    };

    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      const response = await request(this.httpServer)
        .post('/propostas')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      if ([200, 201].includes(response.status) && response.body?.success && response.body?.proposta?.id) {
        return response.body.proposta.id as string;
      }

      const erroSerializacao = String(response.body?.error || response.body?.message || '').toLowerCase();
      const isTentativaConcorrencia =
        response.status >= 500 &&
        (erroSerializacao.includes('duplicate key') || erroSerializacao.includes('erro ao criar proposta'));

      if (!isTentativaConcorrencia || tentativa === 3) {
        expect([200, 201]).toContain(response.status);
        expect(response.body?.success).toBe(true);
        expect(response.body?.proposta?.id).toBeTruthy();
      }

      await new Promise((resolve) => setTimeout(resolve, 50 * tentativa));
    }

    throw new Error('Falha ao criar proposta no setup e2e');
  }

  async limparDadosTeste() {
    const sourceTag = `e2e-portal-${this.runId}`;
    const empresaA = this.empresaAId ?? '00000000-0000-0000-0000-000000000000';
    const empresaB = this.empresaBId ?? '00000000-0000-0000-0000-000000000000';

    try {
      await this.dataSource.query(
        `
          DELETE FROM propostas_portal_tokens
          WHERE empresa_id IN ($1, $2)
        `,
        [empresaA, empresaB],
      );
    } catch (error) {
      // Tabela pode nao existir no ambiente.
    }

    await this.dataSource
      .query(
        `DELETE FROM assinaturas_contrato WHERE "contratoId" IN (SELECT id FROM contratos WHERE empresa_id IN ($1, $2))`,
        [empresaA, empresaB],
      )
      .catch(() => undefined);
    await this.dataSource
      .query(`DELETE FROM transacoes_gateway_pagamento WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB])
      .catch(() => undefined);
    await this.dataSource
      .query(`DELETE FROM configuracoes_gateway_pagamento WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB])
      .catch(() => undefined);
    await this.dataSource
      .query(`DELETE FROM pagamentos WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB])
      .catch(() => undefined);
    await this.dataSource
      .query(
        `DELETE FROM itens_fatura WHERE "faturaId" IN (SELECT id FROM faturas WHERE empresa_id IN ($1, $2))`,
        [empresaA, empresaB],
      )
      .catch(() => undefined);
    await this.dataSource
      .query(`DELETE FROM faturas WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB])
      .catch(() => undefined);
    await this.dataSource
      .query(`DELETE FROM contratos WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB])
      .catch(() => undefined);
    await this.dataSource
      .query(`DELETE FROM clientes WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB])
      .catch(() => undefined);

    await this.dataSource
      .query(`DELETE FROM oportunidade_stage_events WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB])
      .catch(() => undefined);
    await this.dataSource
      .query(`DELETE FROM atividades WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB])
      .catch(() => undefined);
    await this.dataSource
      .query(`DELETE FROM leads WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB])
      .catch(() => undefined);
    await this.dataSource
      .query(`DELETE FROM oportunidades WHERE empresa_id IN ($1, $2)`, [empresaA, empresaB])
      .catch(() => undefined);
    await this.dataSource
      .query(`DELETE FROM propostas WHERE empresa_id IN ($1, $2) OR source = $3`, [
        empresaA,
        empresaB,
        sourceTag,
      ])
      .catch(() => undefined);
    await this.dataSource
      .query(`DELETE FROM users WHERE email IN ($1, $2)`, [this.emailAdminEmpresaA, this.emailAdminEmpresaB])
      .catch(() => undefined);
    await this.dataSource
      .query(`DELETE FROM empresas WHERE id IN ($1, $2)`, [empresaA, empresaB])
      .catch(() => undefined);
  }

  async criarLeadViaApi(token: string, nome: string, responsavelId?: string) {
    const response = await request(this.httpServer)
      .post('/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome,
        email: `lead.${this.runId}@conectcrm.local`,
        telefone: '11999998888',
        empresa_nome: `Empresa Lead ${this.runId}`,
        responsavel_id: responsavelId,
        origem: 'manual',
        observacoes: `Lead criado no e2e ${this.runId}`,
      });

    expect([200, 201]).toContain(response.status);
    expect(response.body?.id).toBeTruthy();
    return response.body;
  }

  async converterLeadParaOportunidade(token: string, leadId: string) {
    const response = await request(this.httpServer)
      .post(`/leads/${leadId}/converter`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        valor: 3200,
        descricao: `Conversao e2e ${this.runId}`,
      });

    expect([200, 201]).toContain(response.status);
    expect(response.body?.id).toBeTruthy();
    return response.body;
  }

  async moverEstagioOportunidade(
    token: string,
    oportunidadeId: string | number,
    estagio: 'qualification' | 'proposal',
  ) {
    const response = await request(this.httpServer)
      .patch(`/oportunidades/${oportunidadeId}/estagio`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estagio });

    expect(response.status).toBe(200);
    expect(response.body?.estagio).toBe(estagio);
    return response.body;
  }

  async garantirPropostaAprovada(token: string, propostaId: string): Promise<void> {
    const obterAtual = async (): Promise<string> => {
      const response = await request(this.httpServer)
        .get(`/propostas/${propostaId}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body?.success).toBe(true);
      return String(response.body?.proposta?.status || '').toLowerCase();
    };

    const atualizarStatus = async (status: 'enviada' | 'aprovada') => {
      const response = await request(this.httpServer)
        .put(`/propostas/${propostaId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status,
          source: `e2e-portal-${this.runId}`,
          observacoes: `Ajuste de status para contrato (${status})`,
        });

      expect(response.status).toBe(200);
      expect(response.body?.success).toBe(true);
    };

    const statusAtual = await obterAtual();
    if (statusAtual === 'aprovada') return;
    if (statusAtual === 'rascunho') {
      await atualizarStatus('enviada');
    }

    const statusIntermediario = await obterAtual();
    if (statusIntermediario !== 'aprovada') {
      await atualizarStatus('aprovada');
    }
  }

  async criarContratoViaApi(token: string, propostaId: string) {
    await this.garantirPropostaAprovada(token, propostaId);

    const response = await request(this.httpServer)
      .post('/contratos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        propostaId,
        clienteId: this.clienteEmpresaAId,
        usuarioResponsavelId: this.adminEmpresaAId,
        tipo: 'servico',
        objeto: `Contrato E2E Portal ${this.runId}`,
        valorTotal: 3200,
        dataInicio: '2026-02-01',
        dataFim: '2027-02-01',
        dataVencimento: '2026-03-01',
      });

    expect([200, 201]).toContain(response.status);
    if (response.body?.success === false) {
      throw new Error(
        `Falha ao criar contrato via API: ${String(response.body?.message || response.body?.error || 'resposta invalida')}`,
      );
    }

    const contrato = response.body?.data ?? response.body;
    expect(contrato?.id).toBeTruthy();

    return contrato;
  }
}

