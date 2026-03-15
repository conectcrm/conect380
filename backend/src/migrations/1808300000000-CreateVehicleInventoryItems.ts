import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehicleInventoryItems1808300000000 implements MigrationInterface {
  name = 'CreateVehicleInventoryItems1808300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vehicle_inventory_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "code" character varying(60),
        "marca" character varying(100) NOT NULL,
        "modelo" character varying(120) NOT NULL,
        "versao" character varying(120),
        "ano_fabricacao" integer NOT NULL,
        "ano_modelo" integer NOT NULL,
        "quilometragem" integer,
        "combustivel" character varying(40),
        "cambio" character varying(40),
        "cor" character varying(40),
        "placa" character varying(20),
        "chassi" character varying(40),
        "renavam" character varying(40),
        "valor_compra" numeric(12,2),
        "valor_venda" numeric(12,2) NOT NULL DEFAULT 0,
        "status" character varying(30) NOT NULL DEFAULT 'disponivel',
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_vehicle_inventory_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vehicle_inventory_items_empresa" FOREIGN KEY ("empresa_id")
          REFERENCES "empresas"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_vehicle_inventory_items_status"
          CHECK ("status" IN ('disponivel', 'reservado', 'vendido', 'indisponivel')),
        CONSTRAINT "CHK_vehicle_inventory_items_ano_fabricacao"
          CHECK ("ano_fabricacao" BETWEEN 1900 AND 2100),
        CONSTRAINT "CHK_vehicle_inventory_items_ano_modelo"
          CHECK ("ano_modelo" BETWEEN 1900 AND 2100),
        CONSTRAINT "CHK_vehicle_inventory_items_quilometragem"
          CHECK ("quilometragem" IS NULL OR "quilometragem" >= 0),
        CONSTRAINT "CHK_vehicle_inventory_items_valor_compra"
          CHECK ("valor_compra" IS NULL OR "valor_compra" >= 0),
        CONSTRAINT "CHK_vehicle_inventory_items_valor_venda"
          CHECK ("valor_venda" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vehicle_inventory_empresa"
      ON "vehicle_inventory_items" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vehicle_inventory_status"
      ON "vehicle_inventory_items" ("empresa_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vehicle_inventory_brand_model"
      ON "vehicle_inventory_items" ("empresa_id", "marca", "modelo", "ano_modelo")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vehicle_inventory_deleted"
      ON "vehicle_inventory_items" ("empresa_id", "deleted_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vehicle_inventory_code"
      ON "vehicle_inventory_items" ("empresa_id", "code")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_vehicle_inventory_empresa_placa"
      ON "vehicle_inventory_items" ("empresa_id", "placa")
      WHERE "placa" IS NOT NULL AND "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_vehicle_inventory_empresa_chassi"
      ON "vehicle_inventory_items" ("empresa_id", "chassi")
      WHERE "chassi" IS NOT NULL AND "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_vehicle_inventory_empresa_renavam"
      ON "vehicle_inventory_items" ("empresa_id", "renavam")
      WHERE "renavam" IS NOT NULL AND "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicle_inventory_items" ENABLE ROW LEVEL SECURITY
    `);
    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_vehicle_inventory_items ON "vehicle_inventory_items"
    `);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_vehicle_inventory_items ON "vehicle_inventory_items"
      FOR ALL
      USING ("empresa_id" = get_current_tenant())
      WITH CHECK ("empresa_id" = get_current_tenant())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_vehicle_inventory_items ON "vehicle_inventory_items"
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_inventory_items" DISABLE ROW LEVEL SECURITY
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_vehicle_inventory_empresa_renavam"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_vehicle_inventory_empresa_chassi"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_vehicle_inventory_empresa_placa"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_vehicle_inventory_code"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_vehicle_inventory_deleted"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_vehicle_inventory_brand_model"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_vehicle_inventory_status"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_vehicle_inventory_empresa"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "vehicle_inventory_items"
    `);
  }
}
