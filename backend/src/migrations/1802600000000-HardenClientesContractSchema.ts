import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenClientesContractSchema1802600000000 implements MigrationInterface {
  name = 'HardenClientesContractSchema1802600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasClientes = await queryRunner.hasTable('clientes');
    if (hasClientes) {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_clientes_empresa_documento"
        ON "clientes" ("empresa_id", "documento")
        WHERE "documento" IS NOT NULL
      `);
    }

    const hasClienteAnexos = await queryRunner.hasTable('cliente_anexos');
    if (!hasClienteAnexos) {
      return;
    }

    await queryRunner.query(`ALTER TABLE "cliente_anexos" ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_proc
          WHERE proname = 'get_current_tenant'
        ) THEN
          EXECUTE 'DROP POLICY IF EXISTS tenant_isolation_cliente_anexos ON "cliente_anexos"';
          EXECUTE '
            CREATE POLICY tenant_isolation_cliente_anexos ON "cliente_anexos"
            USING ("empresa_id" = get_current_tenant())
          ';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('cliente_anexos')) {
      await queryRunner.query(
        `DROP POLICY IF EXISTS tenant_isolation_cliente_anexos ON "cliente_anexos"`,
      );
      await queryRunner.query(`ALTER TABLE "cliente_anexos" DISABLE ROW LEVEL SECURITY`);
    }

    if (await queryRunner.hasTable('clientes')) {
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clientes_empresa_documento"`);
    }
  }
}
