import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExtendedFieldsToAgendaEventos1809006000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agenda_eventos_tipo_enum') THEN
          CREATE TYPE "public"."agenda_eventos_tipo_enum" AS ENUM('reuniao', 'ligacao', 'tarefa', 'evento', 'follow-up');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agenda_eventos_location_type_enum') THEN
          CREATE TYPE "public"."agenda_eventos_location_type_enum" AS ENUM('presencial', 'virtual');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agenda_eventos_reminder_type_enum') THEN
          CREATE TYPE "public"."agenda_eventos_reminder_type_enum" AS ENUM('notification', 'email', 'both');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "agenda_eventos"
      ADD COLUMN IF NOT EXISTS "tipo" "public"."agenda_eventos_tipo_enum" NOT NULL DEFAULT 'evento',
      ADD COLUMN IF NOT EXISTS "location_type" "public"."agenda_eventos_location_type_enum" NOT NULL DEFAULT 'presencial',
      ADD COLUMN IF NOT EXISTS "reminder_time" integer,
      ADD COLUMN IF NOT EXISTS "reminder_type" "public"."agenda_eventos_reminder_type_enum",
      ADD COLUMN IF NOT EXISTS "email_offline" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "attachments" jsonb,
      ADD COLUMN IF NOT EXISTS "is_recurring" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "recurring_pattern" jsonb,
      ADD COLUMN IF NOT EXISTS "notes" text,
      ADD COLUMN IF NOT EXISTS "responsavel_id" uuid,
      ADD COLUMN IF NOT EXISTS "responsavel_nome" varchar(255)
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "agenda_eventos"
      ALTER COLUMN "inicio" TYPE TIMESTAMP WITH TIME ZONE
      USING "inicio" AT TIME ZONE 'UTC'
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "agenda_eventos"
      ALTER COLUMN "fim" TYPE TIMESTAMP WITH TIME ZONE
      USING CASE WHEN "fim" IS NULL THEN NULL ELSE "fim" AT TIME ZONE 'UTC' END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "agenda_eventos"
      ALTER COLUMN "inicio" TYPE TIMESTAMP
      USING "inicio" AT TIME ZONE 'UTC'
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "agenda_eventos"
      ALTER COLUMN "fim" TYPE TIMESTAMP
      USING CASE WHEN "fim" IS NULL THEN NULL ELSE "fim" AT TIME ZONE 'UTC' END
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "agenda_eventos"
      DROP COLUMN IF EXISTS "responsavel_nome",
      DROP COLUMN IF EXISTS "responsavel_id",
      DROP COLUMN IF EXISTS "notes",
      DROP COLUMN IF EXISTS "recurring_pattern",
      DROP COLUMN IF EXISTS "is_recurring",
      DROP COLUMN IF EXISTS "attachments",
      DROP COLUMN IF EXISTS "email_offline",
      DROP COLUMN IF EXISTS "reminder_type",
      DROP COLUMN IF EXISTS "reminder_time",
      DROP COLUMN IF EXISTS "location_type",
      DROP COLUMN IF EXISTS "tipo"
    `);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."agenda_eventos_reminder_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."agenda_eventos_location_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."agenda_eventos_tipo_enum"`);
  }
}

