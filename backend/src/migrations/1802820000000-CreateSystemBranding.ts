import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemBranding1802820000000 implements MigrationInterface {
  name = 'CreateSystemBranding1802820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_branding" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "chave" character varying(50) NOT NULL DEFAULT 'global',
        "logo_full_url" text,
        "logo_full_light_url" text,
        "logo_icon_url" text,
        "favicon_url" text,
        "updated_by" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_system_branding_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_system_branding_chave'
        ) THEN
          ALTER TABLE "system_branding"
            ADD CONSTRAINT "UQ_system_branding_chave" UNIQUE ("chave");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_system_branding_updated_by'
        ) THEN
          ALTER TABLE "system_branding"
            ADD CONSTRAINT "FK_system_branding_updated_by"
            FOREIGN KEY ("updated_by")
            REFERENCES "users"("id")
            ON DELETE SET NULL
            ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      INSERT INTO "system_branding" ("chave")
      SELECT 'global'
      WHERE NOT EXISTS (
        SELECT 1 FROM "system_branding" WHERE "chave" = 'global'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "system_branding" CASCADE`);
  }
}
