import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Corrige schema de `cotacoes` para suportar o fluxo de aprovação.
 *
 * Problema observado em alguns DBs dev:
 * - GET /cotacao => QueryFailedError: column cotacao.aprovador_id does not exist
 *
 * Esta migration é idempotente:
 * - Se existir "aprovadorId" (camelCase), renomeia para "aprovador_id".
 * - Se não existir nenhum, cria "aprovador_id".
 * - Garante FK para users(id) e índice.
 */
export class AddAprovadorIdToCotacoes1802865000000 implements MigrationInterface {
  name = 'AddAprovadorIdToCotacoes1802865000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Detectar colunas existentes
    const aprovadorSnake = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'cotacoes'
        AND column_name = 'aprovador_id'
      LIMIT 1;
    `);

    if (aprovadorSnake.length > 0) {
      // Já existe, nada a fazer aqui.
    } else {
      const aprovadorCamel = await queryRunner.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'cotacoes'
          AND column_name IN ('aprovadorId', 'aprovadorid')
        LIMIT 1;
      `);

      if (aprovadorCamel.length > 0) {
        const camelName = aprovadorCamel[0].column_name;
        // Renomear preservando dados
        await queryRunner.query(`ALTER TABLE "cotacoes" RENAME COLUMN "${camelName}" TO "aprovador_id";`);
      } else {
        // Criar nova coluna
        await queryRunner.query(`ALTER TABLE "cotacoes" ADD COLUMN "aprovador_id" uuid NULL;`);
      }
    }

    // 2) Garantir FK para users(id) se não existir
    const fkExists = await queryRunner.query(`
      SELECT 1
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = 'cotacoes'
        AND tc.constraint_name = 'FK_cotacoes_aprovador_id_users'
      LIMIT 1;
    `);

    if (fkExists.length === 0) {
      // Evitar erro caso a coluna ainda não exista por algum motivo
      const aprovadorNow = await queryRunner.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'cotacoes'
          AND column_name = 'aprovador_id'
        LIMIT 1;
      `);

      if (aprovadorNow.length > 0) {
        await queryRunner.query(`
          ALTER TABLE "cotacoes"
          ADD CONSTRAINT "FK_cotacoes_aprovador_id_users"
          FOREIGN KEY ("aprovador_id") REFERENCES "users"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        `);
      }
    }

    // 3) Índice para performance
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_cotacoes_aprovador_id" ON "cotacoes"("aprovador_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cotacoes" DROP CONSTRAINT IF EXISTS "FK_cotacoes_aprovador_id_users";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_cotacoes_aprovador_id";`);
    await queryRunner.query(`ALTER TABLE "cotacoes" DROP COLUMN IF EXISTS "aprovador_id";`);
  }
}
