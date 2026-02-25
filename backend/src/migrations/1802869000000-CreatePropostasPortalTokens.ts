import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePropostasPortalTokens1802869000000 implements MigrationInterface {
  name = 'CreatePropostasPortalTokens1802869000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('propostas_portal_tokens');
    if (!exists) {
      await queryRunner.query(`
        CREATE TABLE "propostas_portal_tokens" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "empresa_id" character varying NOT NULL,
          "proposta_id" uuid NOT NULL,
          "token_hash" character varying(128) NOT NULL,
          "token_hint" character varying(32),
          "is_active" boolean NOT NULL DEFAULT true,
          "expira_em" TIMESTAMPTZ,
          "revogado_em" TIMESTAMPTZ,
          "ultimo_acesso_em" TIMESTAMPTZ,
          "criado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_propostas_portal_tokens_id" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_propostas_portal_tokens_token_hash" UNIQUE ("token_hash")
        )
      `);
    }

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_propostas_portal_tokens_empresa_id"
      ON "propostas_portal_tokens" ("empresa_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_propostas_portal_tokens_proposta_id"
      ON "propostas_portal_tokens" ("proposta_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_propostas_portal_tokens_active"
      ON "propostas_portal_tokens" ("is_active")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_propostas_portal_tokens_expira_em"
      ON "propostas_portal_tokens" ("expira_em")
    `);

    // FK opcional/idempotente (nem todos os ambientes podem ter schema consistente durante rollout).
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.propostas_portal_tokens') IS NOT NULL
           AND to_regclass('public.propostas') IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM pg_constraint
             WHERE conname = 'FK_propostas_portal_tokens_proposta'
           )
        THEN
          ALTER TABLE "propostas_portal_tokens"
          ADD CONSTRAINT "FK_propostas_portal_tokens_proposta"
          FOREIGN KEY ("proposta_id")
          REFERENCES "propostas"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    // Trigger simples para manter atualizado_em, caso o TypeORM/SQL use UPDATE direto.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at_propostas_portal_tokens()
      RETURNS trigger AS $$
      BEGIN
        NEW.atualizado_em = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_trigger
          WHERE tgname = 'trg_set_updated_at_propostas_portal_tokens'
        )
        THEN
          CREATE TRIGGER trg_set_updated_at_propostas_portal_tokens
          BEFORE UPDATE ON "propostas_portal_tokens"
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at_propostas_portal_tokens();
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "propostas_portal_tokens" ENABLE ROW LEVEL SECURITY
    `);
    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_propostas_portal_tokens ON "propostas_portal_tokens"
    `);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_propostas_portal_tokens ON "propostas_portal_tokens"
      FOR ALL
      USING ((NULLIF(empresa_id, ''))::uuid = get_current_tenant())
      WITH CHECK ((NULLIF(empresa_id, ''))::uuid = get_current_tenant())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('propostas_portal_tokens');
    if (!exists) {
      return;
    }

    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_propostas_portal_tokens ON "propostas_portal_tokens"
    `);
    await queryRunner.query(`
      ALTER TABLE "propostas_portal_tokens" DISABLE ROW LEVEL SECURITY
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_set_updated_at_propostas_portal_tokens ON "propostas_portal_tokens"
    `);
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS set_updated_at_propostas_portal_tokens()
    `);
    await queryRunner.query(`
      ALTER TABLE "propostas_portal_tokens" DROP CONSTRAINT IF EXISTS "FK_propostas_portal_tokens_proposta"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_propostas_portal_tokens_expira_em"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_propostas_portal_tokens_active"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_propostas_portal_tokens_proposta_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_propostas_portal_tokens_empresa_id"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "propostas_portal_tokens"
    `);
  }
}
