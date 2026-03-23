import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGuardianPolicySnapshots1808107000000 implements MigrationInterface {
  name = 'CreateGuardianPolicySnapshots1808107000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('guardian_policy_snapshots'))) {
      await queryRunner.query(`
        CREATE TABLE "guardian_policy_snapshots" (
          "id" BIGSERIAL PRIMARY KEY,
          "environment" character varying(32) NOT NULL,
          "policy_source" character varying(24) NOT NULL,
          "release_version" character varying(80) NULL,
          "admin_mfa_required" boolean NOT NULL DEFAULT false,
          "legacy_transition_mode" character varying(64) NOT NULL,
          "policy_fingerprint" character varying(64) NOT NULL,
          "capabilities" jsonb NOT NULL,
          "enabled_capabilities" text[] NOT NULL DEFAULT '{}',
          "created_at" timestamp without time zone NOT NULL DEFAULT now()
        )
      `);
    }

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_guardian_policy_snapshots_created_at"
      ON "guardian_policy_snapshots" ("created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_guardian_policy_snapshots_policy_fingerprint"
      ON "guardian_policy_snapshots" ("policy_fingerprint")
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION guardian_policy_snapshots_prevent_mutation()
      RETURNS trigger
      AS $$
      BEGIN
        RAISE EXCEPTION 'guardian_policy_snapshots is immutable and does not allow update/delete';
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_guardian_policy_snapshots_immutable
      ON "guardian_policy_snapshots"
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_guardian_policy_snapshots_immutable
      BEFORE UPDATE OR DELETE ON "guardian_policy_snapshots"
      FOR EACH ROW
      EXECUTE FUNCTION guardian_policy_snapshots_prevent_mutation()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_guardian_policy_snapshots_immutable
      ON "guardian_policy_snapshots"
    `);
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS guardian_policy_snapshots_prevent_mutation()
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_guardian_policy_snapshots_policy_fingerprint"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_guardian_policy_snapshots_created_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "guardian_policy_snapshots"`);
  }
}
