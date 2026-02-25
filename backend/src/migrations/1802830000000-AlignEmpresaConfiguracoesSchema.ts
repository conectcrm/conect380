import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignEmpresaConfiguracoesSchema1802830000000 implements MigrationInterface {
  name = 'AlignEmpresaConfiguracoesSchema1802830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'empresa_configuracoes';

    const tableExists = await queryRunner.hasTable(tableName);
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          INNER JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'sms_provider_enum'
            AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."sms_provider_enum" AS ENUM ('twilio', 'nexmo', 'sinch');
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          INNER JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'push_provider_enum'
            AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."push_provider_enum" AS ENUM ('fcm', 'apns', 'onesignal');
        END IF;
      END
      $$;
    `);

    const ensureColumn = async (columnName: string, definition: string): Promise<void> => {
      const exists = await queryRunner.hasColumn(tableName, columnName);
      if (!exists) {
        await queryRunner.query(
          `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${definition}`,
        );
      }
    };

    await ensureColumn('force_ssl', 'boolean NOT NULL DEFAULT false');
    await ensureColumn('ip_whitelist', 'text');
    await ensureColumn('convite_expiracao_horas', 'integer NOT NULL DEFAULT 48');

    await ensureColumn('whatsapp_habilitado', 'boolean NOT NULL DEFAULT false');
    await ensureColumn('whatsapp_numero', 'character varying');
    await ensureColumn('whatsapp_api_token', 'character varying');

    await ensureColumn('sms_habilitado', 'boolean NOT NULL DEFAULT false');
    await ensureColumn('sms_provider', '"public"."sms_provider_enum"');
    await ensureColumn('sms_api_key', 'character varying');

    await ensureColumn('push_habilitado', 'boolean NOT NULL DEFAULT false');
    await ensureColumn('push_provider', '"public"."push_provider_enum"');
    await ensureColumn('push_api_key', 'character varying');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'empresa_configuracoes';

    const tableExists = await queryRunner.hasTable(tableName);
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "push_api_key"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "push_provider"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "push_habilitado"`);

    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "sms_api_key"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "sms_provider"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "sms_habilitado"`);

    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "whatsapp_api_token"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "whatsapp_numero"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "whatsapp_habilitado"`);

    await queryRunner.query(
      `ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "convite_expiracao_horas"`,
    );
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "ip_whitelist"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "force_ssl"`);
  }
}

