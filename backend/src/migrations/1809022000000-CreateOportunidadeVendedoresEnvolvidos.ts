import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOportunidadeVendedoresEnvolvidos1809022000000 implements MigrationInterface {
  name = 'CreateOportunidadeVendedoresEnvolvidos1809022000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "oportunidade_vendedores_envolvidos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "oportunidade_id" character varying(64) NOT NULL,
        "vendedor_id" uuid NOT NULL,
        "papel" character varying(40) NOT NULL DEFAULT 'apoio',
        "criado_por" uuid NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_oportunidade_vendedores_envolvidos" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ove_empresa_oportunidade_vendedor" UNIQUE ("empresa_id", "oportunidade_id", "vendedor_id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_ove_empresa'
        ) THEN
          ALTER TABLE "oportunidade_vendedores_envolvidos"
          ADD CONSTRAINT "FK_ove_empresa"
          FOREIGN KEY ("empresa_id")
          REFERENCES "empresas"("id")
          ON DELETE CASCADE
          ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_ove_vendedor_user'
        ) THEN
          ALTER TABLE "oportunidade_vendedores_envolvidos"
          ADD CONSTRAINT "FK_ove_vendedor_user"
          FOREIGN KEY ("vendedor_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE
          ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_ove_criado_por_user'
        ) THEN
          ALTER TABLE "oportunidade_vendedores_envolvidos"
          ADD CONSTRAINT "FK_ove_criado_por_user"
          FOREIGN KEY ("criado_por")
          REFERENCES "users"("id")
          ON DELETE SET NULL
          ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ove_empresa_oportunidade"
      ON "oportunidade_vendedores_envolvidos" ("empresa_id", "oportunidade_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ove_empresa_vendedor"
      ON "oportunidade_vendedores_envolvidos" ("empresa_id", "vendedor_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "oportunidade_vendedores_envolvidos" ENABLE ROW LEVEL SECURITY
    `);
    await queryRunner.query(`
      DROP POLICY IF EXISTS "tenant_isolation_oportunidade_vendedores_envolvidos"
      ON "oportunidade_vendedores_envolvidos"
    `);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_oportunidade_vendedores_envolvidos"
      ON "oportunidade_vendedores_envolvidos"
      FOR ALL
      USING (empresa_id = get_current_tenant())
      WITH CHECK (empresa_id = get_current_tenant())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY IF EXISTS "tenant_isolation_oportunidade_vendedores_envolvidos"
      ON "oportunidade_vendedores_envolvidos"
    `);
    await queryRunner.query(`
      ALTER TABLE "oportunidade_vendedores_envolvidos" DISABLE ROW LEVEL SECURITY
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_ove_empresa_vendedor"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_ove_empresa_oportunidade"
    `);
    await queryRunner.query(`
      ALTER TABLE "oportunidade_vendedores_envolvidos"
      DROP CONSTRAINT IF EXISTS "FK_ove_criado_por_user"
    `);
    await queryRunner.query(`
      ALTER TABLE "oportunidade_vendedores_envolvidos"
      DROP CONSTRAINT IF EXISTS "FK_ove_vendedor_user"
    `);
    await queryRunner.query(`
      ALTER TABLE "oportunidade_vendedores_envolvidos"
      DROP CONSTRAINT IF EXISTS "FK_ove_empresa"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "oportunidade_vendedores_envolvidos"
    `);
  }
}
