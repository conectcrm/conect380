import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureAdministracaoEssentialForAllPlans1809010000000 implements MigrationInterface {
  name = 'EnsureAdministracaoEssentialForAllPlans1809010000000';
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "modulos_sistema"
      SET
        "essencial" = true,
        "ativo" = true,
        "atualizadoEm" = now()
      WHERE UPPER("codigo") = 'ADMINISTRACAO'
    `);

    await queryRunner.query(`
      INSERT INTO "planos_modulos" ("plano_id", "modulo_id")
      SELECT plano.id, modulo.id
      FROM "planos" plano
      INNER JOIN "modulos_sistema" modulo
        ON modulo."ativo" = true
       AND modulo."essencial" = true
      LEFT JOIN "planos_modulos" vinculo
        ON vinculo."plano_id" = plano.id
       AND vinculo."modulo_id" = modulo.id
      WHERE vinculo.id IS NULL
    `);
  }

  public async down(): Promise<void> {
    // no-op intencional: evita remover modulo essencial de planos ja publicados.
  }
}
