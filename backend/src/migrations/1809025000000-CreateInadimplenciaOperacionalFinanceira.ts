import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInadimplenciaOperacionalFinanceira1809025000000
  implements MigrationInterface
{
  name = 'CreateInadimplenciaOperacionalFinanceira1809025000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const empresaConfigExists = await queryRunner.hasTable('empresa_configuracoes');
    if (empresaConfigExists) {
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        ADD COLUMN IF NOT EXISTS "inadimplencia_automacao_ativa" boolean NOT NULL DEFAULT false
      `);
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        ADD COLUMN IF NOT EXISTS "inadimplencia_dias_aviso" integer NOT NULL DEFAULT 3
      `);
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        ADD COLUMN IF NOT EXISTS "inadimplencia_dias_acao" integer NOT NULL DEFAULT 15
      `);
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        ADD COLUMN IF NOT EXISTS "inadimplencia_acao" character varying NOT NULL DEFAULT 'bloquear_operacao'
      `);
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        ADD COLUMN IF NOT EXISTS "inadimplencia_modo_execucao" character varying NOT NULL DEFAULT 'automatico'
      `);
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        ADD COLUMN IF NOT EXISTS "inadimplencia_escopo" character varying NOT NULL DEFAULT 'cliente'
      `);
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        ADD COLUMN IF NOT EXISTS "inadimplencia_desbloqueio_automatico_na_baixa" boolean NOT NULL DEFAULT true
      `);
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clientes_operacao_financeira_status" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "empresa_id" uuid NOT NULL,
        "cliente_id" uuid NOT NULL,
        "status_operacional" character varying NOT NULL DEFAULT 'ativo',
        "origem_status" character varying NOT NULL DEFAULT 'sistema',
        "motivo" text,
        "bloqueio_manual" boolean NOT NULL DEFAULT false,
        "saldo_vencido" numeric(15,2) NOT NULL DEFAULT 0,
        "dias_maior_atraso" integer NOT NULL DEFAULT 0,
        "quantidade_titulos_vencidos" integer NOT NULL DEFAULT 0,
        "ultima_avaliacao_em" TIMESTAMP,
        "bloqueado_em" TIMESTAMP,
        "desbloqueado_em" TIMESTAMP,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clientes_operacao_financeira_status_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_clientes_operacao_financeira_status_empresa_cliente" UNIQUE ("empresa_id", "cliente_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clientes_operacao_financeira_status_empresa_status"
      ON "clientes_operacao_financeira_status" ("empresa_id", "status_operacional")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clientes_operacao_financeira_status_empresa_cliente"
      ON "clientes_operacao_financeira_status" ("empresa_id", "cliente_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clientes_operacao_financeira_eventos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "empresa_id" uuid NOT NULL,
        "cliente_id" uuid NOT NULL,
        "status_id" uuid,
        "tipo_evento" character varying NOT NULL,
        "estado_anterior" character varying,
        "estado_novo" character varying,
        "motivo" text,
        "saldo_vencido" numeric(15,2) NOT NULL DEFAULT 0,
        "dias_maior_atraso" integer NOT NULL DEFAULT 0,
        "ator_id" character varying,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clientes_operacao_financeira_eventos_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clientes_operacao_financeira_eventos_empresa_cliente"
      ON "clientes_operacao_financeira_eventos" ("empresa_id", "cliente_id", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_clientes_operacao_financeira_eventos_empresa_cliente"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "clientes_operacao_financeira_eventos"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_clientes_operacao_financeira_status_empresa_cliente"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_clientes_operacao_financeira_status_empresa_status"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "clientes_operacao_financeira_status"
    `);

    const empresaConfigExists = await queryRunner.hasTable('empresa_configuracoes');
    if (empresaConfigExists) {
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        DROP COLUMN IF EXISTS "inadimplencia_desbloqueio_automatico_na_baixa"
      `);
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        DROP COLUMN IF EXISTS "inadimplencia_escopo"
      `);
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        DROP COLUMN IF EXISTS "inadimplencia_modo_execucao"
      `);
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        DROP COLUMN IF EXISTS "inadimplencia_acao"
      `);
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        DROP COLUMN IF EXISTS "inadimplencia_dias_acao"
      `);
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        DROP COLUMN IF EXISTS "inadimplencia_dias_aviso"
      `);
      await queryRunner.query(`
        ALTER TABLE "empresa_configuracoes"
        DROP COLUMN IF EXISTS "inadimplencia_automacao_ativa"
      `);
    }
  }
}
