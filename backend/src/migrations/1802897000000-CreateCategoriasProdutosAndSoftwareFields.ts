import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriasProdutosAndSoftwareFields1802897000000
  implements MigrationInterface
{
  name = 'CreateCategoriasProdutosAndSoftwareFields1802897000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "tipoLicenciamento" character varying(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "periodicidadeLicenca" character varying(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "renovacaoAutomatica" boolean DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD COLUMN IF NOT EXISTS "quantidadeLicencas" integer
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categorias_produtos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "nome" character varying(120) NOT NULL,
        "descricao" text,
        "icone" character varying(32) NOT NULL DEFAULT '📁',
        "cor" character varying(40) NOT NULL DEFAULT 'blue',
        "ordem" integer NOT NULL DEFAULT 0,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categorias_produtos_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_categorias_produtos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_categorias_produtos_empresa_id"
      ON "categorias_produtos" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_categorias_produtos_ativo"
      ON "categorias_produtos" ("ativo")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_categorias_produtos_empresa_nome_lower"
      ON "categorias_produtos" ("empresa_id", lower("nome"))
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subcategorias_produtos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "categoria_id" uuid NOT NULL,
        "nome" character varying(120) NOT NULL,
        "descricao" text,
        "preco_base" numeric(10,2) NOT NULL DEFAULT 0,
        "unidade" character varying(60) NOT NULL DEFAULT 'unidade',
        "campos_personalizados" json,
        "ordem" integer NOT NULL DEFAULT 0,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subcategorias_produtos_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subcategorias_produtos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subcategorias_produtos_categoria" FOREIGN KEY ("categoria_id") REFERENCES "categorias_produtos"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subcategorias_produtos_empresa_id"
      ON "subcategorias_produtos" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subcategorias_produtos_categoria_id"
      ON "subcategorias_produtos" ("categoria_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_subcategorias_produtos_categoria_nome_lower"
      ON "subcategorias_produtos" ("categoria_id", lower("nome"))
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "configuracoes_produtos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "subcategoria_id" uuid NOT NULL,
        "nome" character varying(120) NOT NULL,
        "descricao" text,
        "multiplicador" numeric(10,2) NOT NULL DEFAULT 1,
        "ordem" integer NOT NULL DEFAULT 0,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_configuracoes_produtos_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_configuracoes_produtos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_configuracoes_produtos_subcategoria" FOREIGN KEY ("subcategoria_id") REFERENCES "subcategorias_produtos"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_configuracoes_produtos_empresa_id"
      ON "configuracoes_produtos" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_configuracoes_produtos_subcategoria_id"
      ON "configuracoes_produtos" ("subcategoria_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_configuracoes_produtos_subcategoria_nome_lower"
      ON "configuracoes_produtos" ("subcategoria_id", lower("nome"))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_configuracoes_produtos_subcategoria_nome_lower"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_configuracoes_produtos_subcategoria_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_configuracoes_produtos_empresa_id"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "configuracoes_produtos"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_subcategorias_produtos_categoria_nome_lower"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_subcategorias_produtos_categoria_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_subcategorias_produtos_empresa_id"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "subcategorias_produtos"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_categorias_produtos_empresa_nome_lower"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_categorias_produtos_ativo"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_categorias_produtos_empresa_id"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "categorias_produtos"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "quantidadeLicencas"
    `);
    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "renovacaoAutomatica"
    `);
    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "periodicidadeLicenca"
    `);
    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP COLUMN IF EXISTS "tipoLicenciamento"
    `);
  }
}

