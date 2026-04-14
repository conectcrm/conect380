import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncComprasModuleIntoCanonicalPlans1808700000000 implements MigrationInterface {
  name = 'SyncComprasModuleIntoCanonicalPlans1808700000000';
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      INSERT INTO "modulos_sistema" (
        "id",
        "nome",
        "codigo",
        "descricao",
        "icone",
        "cor",
        "ativo",
        "essencial",
        "ordem",
        "criadoEm",
        "atualizadoEm"
      )
      SELECT
        uuid_generate_v4(),
        'Compras',
        'COMPRAS',
        'Cotacoes, orcamentos e aprovacoes de compras.',
        'Calculator',
        '#C77900',
        true,
        false,
        5,
        now(),
        now()
      WHERE NOT EXISTS (
        SELECT 1
        FROM "modulos_sistema"
        WHERE UPPER("codigo") = 'COMPRAS'
      )
    `);

    await queryRunner.query(`
      UPDATE "modulos_sistema"
      SET
        "nome" = 'Compras',
        "descricao" = 'Cotacoes, orcamentos e aprovacoes de compras.',
        "icone" = COALESCE("icone", 'Calculator'),
        "cor" = COALESCE("cor", '#C77900'),
        "ativo" = true,
        "ordem" = CASE
          WHEN "ordem" IS NULL OR "ordem" = 0 THEN 5
          ELSE "ordem"
        END,
        "atualizadoEm" = now()
      WHERE UPPER("codigo") = 'COMPRAS'
    `);

    await queryRunner.query(`
      INSERT INTO "planos_modulos" ("id", "criadoEm", "plano_id", "modulo_id")
      SELECT
        uuid_generate_v4(),
        now(),
        p."id",
        m."id"
      FROM "planos" p
      INNER JOIN "modulos_sistema" m
        ON UPPER(m."codigo") = 'COMPRAS'
      WHERE LOWER(p."codigo") IN ('business', 'enterprise', 'professional')
        AND NOT EXISTS (
          SELECT 1
          FROM "planos_modulos" pm
          WHERE pm."plano_id" = p."id"
            AND pm."modulo_id" = m."id"
        )
    `);
  }

  public async down(): Promise<void> {
    // no-op intencional para preservar vinculos de producao.
  }
}
