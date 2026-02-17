import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInteracoesTable1764000000000 implements MigrationInterface {
  name = 'CreateInteracoesTable1764000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para tipos de interação
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interacoes_tipo_enum') THEN
          CREATE TYPE "public"."interacoes_tipo_enum" AS ENUM('chamada', 'email', 'reuniao', 'nota', 'outro');
        END IF;
      END
      $$
    `);

    // Criar tabela interacoes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interacoes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "tipo" "public"."interacoes_tipo_enum" NOT NULL,
        "titulo" character varying(255),
        "descricao" text,
        "data_referencia" TIMESTAMP,
        "proxima_acao_em" TIMESTAMP,
        "proxima_acao_descricao" character varying(255),
        "lead_id" uuid,
        "contato_id" uuid,
        "responsavel_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interacoes" PRIMARY KEY ("id")
      )
    `);

    // Índices
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interacoes_empresa_id" ON "interacoes" ("empresa_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interacoes_tipo" ON "interacoes" ("tipo")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interacoes_lead_id" ON "interacoes" ("lead_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interacoes_contato_id" ON "interacoes" ("contato_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interacoes_responsavel_id" ON "interacoes" ("responsavel_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interacoes_data_referencia" ON "interacoes" ("data_referencia")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interacoes_created_at" ON "interacoes" ("created_at")`,
    );

    // Foreign keys
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_interacoes_empresa'
            AND table_name = 'interacoes'
            AND table_schema = 'public'
        ) THEN
          ALTER TABLE "interacoes"
          ADD CONSTRAINT "FK_interacoes_empresa"
          FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_interacoes_lead'
            AND table_name = 'interacoes'
            AND table_schema = 'public'
        ) THEN
          ALTER TABLE "interacoes"
          ADD CONSTRAINT "FK_interacoes_lead"
          FOREIGN KEY ("lead_id") REFERENCES "leads"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_interacoes_contato'
            AND table_name = 'interacoes'
            AND table_schema = 'public'
        ) THEN
          ALTER TABLE "interacoes"
          ADD CONSTRAINT "FK_interacoes_contato"
          FOREIGN KEY ("contato_id") REFERENCES "contatos"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_interacoes_responsavel'
            AND table_name = 'interacoes'
            AND table_schema = 'public'
        ) THEN
          ALTER TABLE "interacoes"
          ADD CONSTRAINT "FK_interacoes_responsavel"
          FOREIGN KEY ("responsavel_id") REFERENCES "users"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$
    `);

    // ⚡ MULTI-TENANT: Habilitar RLS
    await queryRunner.query(`
      ALTER TABLE "interacoes" ENABLE ROW LEVEL SECURITY;
    `);

    // ⚡ MULTI-TENANT: Criar política de isolamento
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_interacoes ON interacoes
        FOR ALL USING (empresa_id = get_current_tenant())
        WITH CHECK (empresa_id = get_current_tenant());
    `);

    console.log('✅ Tabela interacoes criada com RLS ativo');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover política RLS
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_interacoes ON "interacoes"`);
    await queryRunner.query(`ALTER TABLE "interacoes" DISABLE ROW LEVEL SECURITY`);

    // Remover FKs
    await queryRunner.query(
      `ALTER TABLE "interacoes" DROP CONSTRAINT IF EXISTS "FK_interacoes_responsavel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interacoes" DROP CONSTRAINT IF EXISTS "FK_interacoes_contato"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interacoes" DROP CONSTRAINT IF EXISTS "FK_interacoes_lead"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interacoes" DROP CONSTRAINT IF EXISTS "FK_interacoes_empresa"`,
    );

    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_interacoes_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_interacoes_data_referencia"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_interacoes_responsavel_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_interacoes_contato_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_interacoes_lead_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_interacoes_tipo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_interacoes_empresa_id"`);

    // Remover tabela
    await queryRunner.query(`DROP TABLE IF EXISTS "interacoes"`);

    // Remover enum
    await queryRunner.query(`DROP TYPE IF EXISTS "interacoes_tipo_enum"`);
  }
}
