import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDlqReprocessAudit1765081000000 implements MigrationInterface {
  name = 'CreateDlqReprocessAudit1765081000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dlq_reprocess_audit" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action_id" character varying NOT NULL,
        "actor" character varying,
        "fila" character varying NOT NULL,
        "filters" jsonb,
        "total_filtrados" integer NOT NULL DEFAULT 0,
        "total_selecionados" integer NOT NULL DEFAULT 0,
        "reprocessados" integer NOT NULL DEFAULT 0,
        "ignorados_sem_job_name" integer NOT NULL DEFAULT 0,
        "ignorados_sem_payload" integer NOT NULL DEFAULT 0,
        "ignorados_job_name_invalido" integer NOT NULL DEFAULT 0,
        "ignorados_max_attempt" integer NOT NULL DEFAULT 0,
        "status" character varying NOT NULL DEFAULT 'success',
        "sample_jobs" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dlq_reprocess_audit" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_dlq_reprocess_action" UNIQUE ("action_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dlq_reprocess_fila_created_at"
      ON "dlq_reprocess_audit" ("fila", "created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_dlq_reprocess_fila_created_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dlq_reprocess_audit"`);
  }
}
