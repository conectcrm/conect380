import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminBreakGlassAccesses1802894000000 implements MigrationInterface {
  name = 'CreateAdminBreakGlassAccesses1802894000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('admin_break_glass_accesses');
    if (tableExists) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "admin_break_glass_accesses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "target_user_id" uuid NOT NULL,
        "requested_by_user_id" uuid NOT NULL,
        "approved_by_user_id" uuid,
        "revoked_by_user_id" uuid,
        "status" character varying(32) NOT NULL DEFAULT 'REQUESTED',
        "scope_permissions" text[] NOT NULL DEFAULT ARRAY[]::text[],
        "duration_minutes" integer NOT NULL,
        "request_reason" text NOT NULL,
        "approval_reason" text,
        "revocation_reason" text,
        "requested_at" TIMESTAMP NOT NULL DEFAULT now(),
        "approved_at" TIMESTAMP,
        "starts_at" TIMESTAMP,
        "expires_at" TIMESTAMP,
        "revoked_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_break_glass_accesses" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_admin_break_glass_empresa_status"
      ON "admin_break_glass_accesses" ("empresa_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_admin_break_glass_target_status"
      ON "admin_break_glass_accesses" ("target_user_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_admin_break_glass_expires_status"
      ON "admin_break_glass_accesses" ("expires_at", "status")
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_break_glass_accesses"
      ADD CONSTRAINT "FK_admin_break_glass_empresa"
      FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_break_glass_accesses"
      ADD CONSTRAINT "FK_admin_break_glass_target_user"
      FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_break_glass_accesses"
      ADD CONSTRAINT "FK_admin_break_glass_requested_by_user"
      FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_break_glass_accesses"
      ADD CONSTRAINT "FK_admin_break_glass_approved_by_user"
      FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_break_glass_accesses"
      ADD CONSTRAINT "FK_admin_break_glass_revoked_by_user"
      FOREIGN KEY ("revoked_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('admin_break_glass_accesses');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "admin_break_glass_accesses"
      DROP CONSTRAINT IF EXISTS "FK_admin_break_glass_revoked_by_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_break_glass_accesses"
      DROP CONSTRAINT IF EXISTS "FK_admin_break_glass_approved_by_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_break_glass_accesses"
      DROP CONSTRAINT IF EXISTS "FK_admin_break_glass_requested_by_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_break_glass_accesses"
      DROP CONSTRAINT IF EXISTS "FK_admin_break_glass_target_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_break_glass_accesses"
      DROP CONSTRAINT IF EXISTS "FK_admin_break_glass_empresa"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_admin_break_glass_expires_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_admin_break_glass_target_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_admin_break_glass_empresa_status"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "admin_break_glass_accesses"
    `);
  }
}
