import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserAccessChangeRequests1802893000000 implements MigrationInterface {
  name = 'CreateUserAccessChangeRequests1802893000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('user_access_change_requests');
    if (tableExists) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "user_access_change_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "action" character varying(32) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'REQUESTED',
        "requested_by_user_id" uuid,
        "target_user_id" uuid,
        "request_payload" jsonb NOT NULL,
        "request_reason" text,
        "decided_by_user_id" uuid,
        "decision_reason" text,
        "decided_at" TIMESTAMP,
        "applied_user_id" uuid,
        "applied_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_access_change_requests" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_access_change_requests_empresa_status"
      ON "user_access_change_requests" ("empresa_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_access_change_requests_requested_by"
      ON "user_access_change_requests" ("requested_by_user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_access_change_requests_target_user"
      ON "user_access_change_requests" ("target_user_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "user_access_change_requests"
      ADD CONSTRAINT "FK_user_access_change_requests_empresa"
      FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_access_change_requests"
      ADD CONSTRAINT "FK_user_access_change_requests_requested_by"
      FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "user_access_change_requests"
      ADD CONSTRAINT "FK_user_access_change_requests_target_user"
      FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "user_access_change_requests"
      ADD CONSTRAINT "FK_user_access_change_requests_decided_by"
      FOREIGN KEY ("decided_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "user_access_change_requests"
      ADD CONSTRAINT "FK_user_access_change_requests_applied_user"
      FOREIGN KEY ("applied_user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('user_access_change_requests');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "user_access_change_requests"
      DROP CONSTRAINT IF EXISTS "FK_user_access_change_requests_applied_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_access_change_requests"
      DROP CONSTRAINT IF EXISTS "FK_user_access_change_requests_decided_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_access_change_requests"
      DROP CONSTRAINT IF EXISTS "FK_user_access_change_requests_target_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_access_change_requests"
      DROP CONSTRAINT IF EXISTS "FK_user_access_change_requests_requested_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_access_change_requests"
      DROP CONSTRAINT IF EXISTS "FK_user_access_change_requests_empresa"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_access_change_requests_target_user"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_access_change_requests_requested_by"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_access_change_requests_empresa_status"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "user_access_change_requests"
    `);
  }
}
