import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGuardianCriticalAudits1808106000000 implements MigrationInterface {
  name = 'CreateGuardianCriticalAudits1808106000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('guardian_critical_audits'))) {
      await queryRunner.query(`
        CREATE TABLE "guardian_critical_audits" (
          "id" BIGSERIAL PRIMARY KEY,
          "actor_user_id" uuid NOT NULL,
          "actor_role" character varying(40) NULL,
          "actor_email" character varying(255) NULL,
          "empresa_id" uuid NULL,
          "target_type" character varying(80) NULL,
          "target_id" character varying(120) NULL,
          "request_ip" character varying(45) NULL,
          "user_agent" text NULL,
          "http_method" character varying(10) NOT NULL,
          "route" character varying(255) NOT NULL,
          "status_code" integer NOT NULL,
          "outcome" character varying(16) NOT NULL,
          "before_payload" jsonb NULL,
          "after_payload" jsonb NULL,
          "error_message" text NULL,
          "request_id" character varying(120) NULL,
          "created_at" timestamp without time zone NOT NULL DEFAULT now()
        )
      `);
    }

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_guardian_critical_audits_created_at"
      ON "guardian_critical_audits" ("created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_guardian_critical_audits_actor_user_id"
      ON "guardian_critical_audits" ("actor_user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_guardian_critical_audits_target_id"
      ON "guardian_critical_audits" ("target_id")
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION guardian_critical_audits_prevent_mutation()
      RETURNS trigger
      AS $$
      BEGIN
        RAISE EXCEPTION 'guardian_critical_audits is immutable and does not allow update/delete';
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_guardian_critical_audits_immutable
      ON "guardian_critical_audits"
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_guardian_critical_audits_immutable
      BEFORE UPDATE OR DELETE ON "guardian_critical_audits"
      FOR EACH ROW
      EXECUTE FUNCTION guardian_critical_audits_prevent_mutation()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_guardian_critical_audits_immutable
      ON "guardian_critical_audits"
    `);
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS guardian_critical_audits_prevent_mutation()
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_guardian_critical_audits_target_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_guardian_critical_audits_actor_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_guardian_critical_audits_created_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "guardian_critical_audits"`);
  }
}

