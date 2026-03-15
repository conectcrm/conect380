import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cria a tabela multi-tenant `fornecedores` caso não exista.
 *
 * Motivo:
 * - Alguns ambientes/dev DB estão sem a tabela, gerando erro:
 *   relation "fornecedores" does not exist
 *
 * Regras:
 * - Multi-tenant: empresa_id obrigatório
 * - RLS: policy tenant_isolation_fornecedores
 */
export class CreateFornecedoresTable1802860000000 implements MigrationInterface {
  name = 'CreateFornecedoresTable1802860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extensão UUID
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Garantir funções de tenant (caso ainda não existam)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_current_tenant()
      RETURNS uuid AS $$
      BEGIN
        RETURN current_setting('app.current_tenant_id', true)::uuid;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);

    const fornecedoresExists = await queryRunner.hasTable('fornecedores');

    if (!fornecedoresExists) {
      await queryRunner.query(`
        CREATE TABLE "fornecedores" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "nome" character varying(255) NOT NULL,
          "cnpj_cpf" character varying(20) NOT NULL,
          "email" character varying(255),
          "telefone" character varying(20),
          "endereco" character varying(500),
          "cidade" character varying(100),
          "estado" character varying(2),
          "cep" character varying(10),
          "contato" character varying(255),
          "cargo" character varying(100),
          "observacoes" text,
          "ativo" boolean NOT NULL DEFAULT true,
          "empresa_id" uuid NOT NULL,
          "criado_em" timestamp without time zone NOT NULL DEFAULT now(),
          "atualizado_em" timestamp without time zone NOT NULL DEFAULT now(),
          CONSTRAINT "UQ_36915b17f08ccc3ce20a2f1d37a" UNIQUE ("cnpj_cpf"),
          CONSTRAINT "FK_0fb8f907c40978d0f3b198adabc" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id")
        );
      `);
    }

    // RLS + Policy (idempotente)
    await queryRunner.query(`ALTER TABLE "fornecedores" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_fornecedores ON "fornecedores";`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_fornecedores ON "fornecedores"
      FOR ALL
      USING (empresa_id = get_current_tenant())
      WITH CHECK (empresa_id = get_current_tenant());
    `);

    // Índices para performance
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_fornecedores_empresa_id" ON "fornecedores"("empresa_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_fornecedores_empresa_ativo" ON "fornecedores"("empresa_id", "ativo");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_fornecedores ON "fornecedores";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fornecedores";`);
  }
}
