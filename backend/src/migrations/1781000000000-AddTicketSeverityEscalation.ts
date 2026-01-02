import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTicketSeverityEscalation1781000000000 implements MigrationInterface {
  name = 'AddTicketSeverityEscalation1781000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "severity" character varying(20) NOT NULL DEFAULT 'MEDIA'`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "assigned_level" character varying(10) NOT NULL DEFAULT 'N1'`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "escalation_reason" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "escalation_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "sla_target_minutes" integer`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" ADD "sla_expires_at" TIMESTAMP`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_atendimento_tickets_severity" ON "atendimento_tickets" ("severity")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_atendimento_tickets_assigned_level" ON "atendimento_tickets" ("assigned_level")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_atendimento_tickets_sla_expires_at" ON "atendimento_tickets" ("sla_expires_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_atendimento_tickets_sla_expires_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_atendimento_tickets_assigned_level"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_atendimento_tickets_severity"`);

    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN "sla_expires_at"`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN "sla_target_minutes"`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN "escalation_at"`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN "escalation_reason"`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN "assigned_level"`);
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN "severity"`);
  }
}
