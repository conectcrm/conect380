import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { createE2EApp, withE2EBootstrapLock } from '../_support/e2e-app.helper';

describe('Registro cliente (E2E)', () => {
  const runId = Date.now().toString();
  const emailEmpresa = `e2e.registro.empresa.${runId}@conectcrm.local`;
  const emailAdmin = `e2e.registro.admin.${runId}@conectcrm.local`;
  const senhaAdmin = 'SenhaE2E123';
  const cnpj = gerarCnpjValido(runId);

  let app: INestApplication;
  let dataSource: DataSource;
  let empresaId: string | null = null;

  jest.setTimeout(120000);

  beforeAll(async () => {
    process.env.SELF_SIGNUP_AUTO_VERIFY_EMAIL = 'false';
    process.env.FRONTEND_URL ??= 'http://localhost:3000';
    const { AppModule } = await import('../../src/app.module');

    const moduleFixture: TestingModule = await withE2EBootstrapLock(() =>
      Test.createTestingModule({
        imports: [AppModule],
      }).compile(),
    );

    app = await createE2EApp(moduleFixture);
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await limparDadosTeste();
    if (app) {
      await Promise.race([
        app.close(),
        new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 20_000);
        }),
      ]);
    }
  });

  it('executa fluxo registro -> verificacao de email -> login', async () => {
    const registroResponse = await request(app.getHttpServer())
      .post('/empresas/registro')
      .send({
        empresa: {
          nome: `Empresa E2E ${runId}`,
          cnpj,
          email: emailEmpresa,
          telefone: '(11) 98888-1234',
          endereco: 'Av. Paulista, 1000',
          cidade: 'Sao Paulo',
          estado: 'SP',
          cep: '01310-100',
        },
        usuario: {
          nome: 'Admin Registro E2E',
          email: emailAdmin,
          senha: senhaAdmin,
          telefone: '(11) 97777-4321',
        },
        plano: 'business',
        aceitarTermos: true,
      })
      .expect(201);

    expect(registroResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          email: emailEmpresa,
          email_verificado: false,
        }),
      }),
    );
    expect(registroResponse.body?.data?.token_verificacao).toBeUndefined();
    expect(registroResponse.body?.data?.cnpj).toBeUndefined();

    const empresaRow = await dataSource.query(
      `
        SELECT id, token_verificacao, email_verificado
        FROM empresas
        WHERE email = $1
        LIMIT 1
      `,
      [emailEmpresa],
    );

    expect(empresaRow).toHaveLength(1);
    empresaId = empresaRow[0].id;
    expect(empresaRow[0].email_verificado).toBe(false);
    expect(typeof empresaRow[0].token_verificacao).toBe('string');
    expect(empresaRow[0].token_verificacao.length).toBeGreaterThan(30);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: emailAdmin, senha: senhaAdmin })
      .expect(401)
      .expect((response) => {
        expect(String(response.body?.message || '')).toContain(
          'Conta inativa ou pendente de ativacao por e-mail',
        );
      });

    const tokenVerificacao = String(empresaRow[0].token_verificacao);
    const verificarResponse = await request(app.getHttpServer())
      .post('/empresas/verificar-email')
      .send({ token: tokenVerificacao })
      .expect(201);

    expect(verificarResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: empresaId,
          email_verificado: true,
        }),
      }),
    );
    expect(verificarResponse.body?.data?.token_verificacao).toBeUndefined();

    const usuarioRow = await dataSource.query(
      `
        SELECT id, ativo
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [emailAdmin],
    );

    expect(usuarioRow).toHaveLength(1);
    expect(usuarioRow[0].ativo).toBe(true);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: emailAdmin, senha: senhaAdmin })
      .expect(201);

    expect(loginResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          access_token: expect.any(String),
        }),
      }),
    );
  });

  it('mantem resposta generica no reenvio de ativacao', async () => {
    const emailInexistente = `nao.existe.${randomUUID()}@conectcrm.local`;

    const responseEmailInexistente = await request(app.getHttpServer())
      .post('/empresas/reenviar-ativacao')
      .send({ email: emailInexistente })
      .expect(201);

    expect(responseEmailInexistente.body).toEqual(
      expect.objectContaining({
        success: true,
        message:
          'Se o email estiver cadastrado e pendente de ativacao, um novo link sera enviado.',
      }),
    );

    const responseEmailExistente = await request(app.getHttpServer())
      .post('/empresas/reenviar-ativacao')
      .send({ email: emailEmpresa })
      .expect(201);

    expect(responseEmailExistente.body).toEqual(
      expect.objectContaining({
        success: true,
        message:
          'Se o email estiver cadastrado e pendente de ativacao, um novo link sera enviado.',
      }),
    );
  });

  async function limparDadosTeste() {
    if (!dataSource?.isInitialized || !empresaId) {
      return;
    }

    await runCleanup(`DELETE FROM feature_flags_tenant WHERE empresa_id = $1`, [empresaId]);
    await runCleanup(`DELETE FROM empresa_modulos WHERE empresa_id = $1`, [empresaId]);
    await runCleanup(`DELETE FROM assinaturas_empresas WHERE empresa_id = $1`, [empresaId]);
    await runCleanup(`DELETE FROM assinaturas WHERE empresa_id = $1`, [empresaId]);
    await runCleanup(`DELETE FROM users WHERE empresa_id = $1`, [empresaId]);
    await runCleanup(`DELETE FROM empresas WHERE id = $1`, [empresaId]);
  }

  async function runCleanup(sql: string, params: unknown[]) {
    try {
      await dataSource.query(sql, params);
    } catch {
      // best effort para limpeza e2e
    }
  }
});

function gerarCnpjValido(seed: string): string {
  const raiz = seed.replace(/\D/g, '').padStart(8, '0').slice(-8);
  const base = `${raiz}0001`;

  const digito1 = calcularDigitoCnpj(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const digito2 = calcularDigitoCnpj(`${base}${digito1}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  const cnpjNumerico = `${base}${digito1}${digito2}`;
  return cnpjNumerico.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function calcularDigitoCnpj(valor: string, pesos: number[]): number {
  const soma = valor
    .split('')
    .reduce((acc, char, index) => acc + Number(char) * pesos[index], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}
