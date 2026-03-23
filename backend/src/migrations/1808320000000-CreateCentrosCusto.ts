import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCentrosCusto1808320000000 implements MigrationInterface {
  name = 'CreateCentrosCusto1808320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "centros_custo" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "codigo" character varying(30) NOT NULL,
        "nome" character varying(120) NOT NULL,
        "descricao" text NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_por" character varying NULL,
        "atualizado_por" character varying NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_centros_custo_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_centros_custo_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_centros_custo_empresa_codigo"
      ON "centros_custo" ("empresa_id", "codigo")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_centros_custo_empresa"
      ON "centros_custo" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_centros_custo_empresa_ativo"
      ON "centros_custo" ("empresa_id", "ativo")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_centros_custo_empresa_ativo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_centros_custo_empresa"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_centros_custo_empresa_codigo"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "centros_custo"`);
  }
}
