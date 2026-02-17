import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClienteAvatarAndAnexos1802500000000 implements MigrationInterface {
  name = 'AddClienteAvatarAndAnexos1802500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasClientes = await queryRunner.hasTable('clientes');
    if (!hasClientes) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "clientes"
      ADD COLUMN IF NOT EXISTS "avatar_url" text
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cliente_anexos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cliente_id" uuid NOT NULL,
        "empresa_id" uuid NOT NULL,
        "nome" character varying(255) NOT NULL,
        "tipo" character varying(120) NOT NULL,
        "tamanho" bigint NOT NULL,
        "url" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cliente_anexos_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cliente_anexos_cliente" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cliente_anexos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cliente_anexos_cliente_id" ON "cliente_anexos" ("cliente_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cliente_anexos_empresa_id" ON "cliente_anexos" ("empresa_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cliente_anexos_created_at" ON "cliente_anexos" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cliente_anexos_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cliente_anexos_empresa_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cliente_anexos_cliente_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cliente_anexos"`);
    await queryRunner.query(`ALTER TABLE "clientes" DROP COLUMN IF EXISTS "avatar_url"`);
  }
}
