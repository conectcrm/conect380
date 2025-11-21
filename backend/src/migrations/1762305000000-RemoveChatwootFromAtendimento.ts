import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveChatwootFromAtendimento1762305000000 implements MigrationInterface {
  name = 'RemoveChatwootFromAtendimento1762305000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" DROP COLUMN IF EXISTS "chatwoot_inbox_id"`,
    );

    await queryRunner.query(
      `UPDATE "atendimento_canais" SET "provedor" = 'whatsapp_business_api' WHERE "provedor" = 'chatwoot'`,
    );

    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ALTER COLUMN "provedor" SET DEFAULT 'whatsapp_business_api'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ALTER COLUMN "provedor" SET DEFAULT 'chatwoot'`,
    );

    await queryRunner.query(
      `UPDATE "atendimento_canais" SET "provedor" = 'chatwoot' WHERE "provedor" = 'whatsapp_business_api'`,
    );

    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ADD COLUMN IF NOT EXISTS "chatwoot_inbox_id" INTEGER`,
    );
  }
}
