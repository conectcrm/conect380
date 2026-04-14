import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceMercadoPagoWebhookIdempotency1808103000000 implements MigrationInterface {
  name = 'EnforceMercadoPagoWebhookIdempotency1808103000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.billing_events') IS NOT NULL THEN
          CREATE UNIQUE INDEX IF NOT EXISTS "UQ_billing_events_mp_payment_received"
          ON "billing_events" ("empresa_id", "aggregate_type", "aggregate_id", "event_type")
          WHERE "aggregate_type" = 'mercadopago.payment.webhook'
            AND "event_type" = 'received';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_billing_events_mp_payment_received"`);
  }
}
