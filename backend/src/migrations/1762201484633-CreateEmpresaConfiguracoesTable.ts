import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmpresaConfiguracoesTable1762201484633 implements MigrationInterface {
  name = 'CreateEmpresaConfiguracoesTable1762201484633';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tabelaConfiguracoesExiste = await queryRunner.hasTable('empresa_configuracoes');

    if (tabelaConfiguracoesExiste) {
      console.log(
        '⚠️  Tabela "empresa_configuracoes" já existe. Migration 1762201484633 será ignorada.',
      );
      return;
    }

    const empresaModulosExists = await queryRunner.hasTable('empresa_modulos');
    const faturasExists = await queryRunner.hasTable('faturas');
    const fornecedoresExists = await queryRunner.hasTable('fornecedores');
    const fluxosTriagemExists = await queryRunner.hasTable('fluxos_triagem');
    const triagemLogsExists = await queryRunner.hasTable('triagem_logs');
    const contasPagarExists = await queryRunner.hasTable('contas_pagar');
    const canaisExists = await queryRunner.hasTable('canais');
    const contratosExists = await queryRunner.hasTable('contratos');

    if (empresaModulosExists) {
      await queryRunner.query(
        `ALTER TABLE "empresa_modulos" DROP CONSTRAINT IF EXISTS "fk_empresa_modulos_empresa"`,
      );
    }

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_67862e1af92d16dfa50f4e9d18"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_1162d4fe194d2e32a9ecf6ccb4"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c0d57c7b5bde732ac3d3ed3558"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_139d3276e0a299deacb53a557d"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_60cf6cd7b6a1b7298af56b056d"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c74f605d546764c24c0d9451f0"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_a4c04e78810691f77a6c4dd8e6"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e0741e7b51d90755844ae04d67"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_450c254ac416c5207f90573259"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_empresa_modulo_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_empresa_modulos_empresa_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_empresa_modulos_ativo"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'empresa_configuracoes_senha_complexidade_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."empresa_configuracoes_senha_complexidade_enum" AS ENUM('baixa', 'media', 'alta');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'empresa_configuracoes_backup_frequencia_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."empresa_configuracoes_backup_frequencia_enum" AS ENUM('diario', 'semanal', 'mensal');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      `CREATE TABLE "empresa_configuracoes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "empresa_id" uuid NOT NULL, "descricao" character varying, "site" character varying, "logo_url" character varying, "cor_primaria" character varying NOT NULL DEFAULT '#159A9C', "cor_secundaria" character varying NOT NULL DEFAULT '#002333', "autenticacao_2fa" boolean NOT NULL DEFAULT false, "sessao_expiracao_minutos" integer NOT NULL DEFAULT '30', "senha_complexidade" "public"."empresa_configuracoes_senha_complexidade_enum" NOT NULL DEFAULT 'media', "auditoria" boolean NOT NULL DEFAULT true, "limite_usuarios" integer NOT NULL DEFAULT '10', "aprovacao_novo_usuario" boolean NOT NULL DEFAULT false, "emails_habilitados" boolean NOT NULL DEFAULT true, "servidor_smtp" character varying, "porta_smtp" integer NOT NULL DEFAULT '587', "smtp_usuario" character varying, "smtp_senha" character varying, "api_habilitada" boolean NOT NULL DEFAULT false, "webhooks_ativos" integer NOT NULL DEFAULT '0', "backup_automatico" boolean NOT NULL DEFAULT true, "backup_frequencia" "public"."empresa_configuracoes_backup_frequencia_enum" NOT NULL DEFAULT 'diario', "backup_retencao_dias" integer NOT NULL DEFAULT '30', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2844f1ff024c808097a812fde9d" PRIMARY KEY ("id"))`,
    );
    if (faturasExists) {
      await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "criadoPor"`);
      await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN IF EXISTS "atualizadoPor"`);
      await queryRunner.query(`ALTER TABLE "faturas" ADD COLUMN IF NOT EXISTS "criadoPor" uuid`);
      await queryRunner.query(`ALTER TABLE "faturas" ADD COLUMN IF NOT EXISTS "atualizadoPor" uuid`);
    }

    if (fornecedoresExists) {
      const fornecedoresCnpjCpfExists = await queryRunner.query(`
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'fornecedores' AND column_name = 'cnpj_cpf'
        LIMIT 1
      `);
      if (fornecedoresCnpjCpfExists.length > 0) {
        await queryRunner.query(`COMMENT ON COLUMN "fornecedores"."cnpj_cpf" IS NULL`);
      }
    }

    if (fluxosTriagemExists) {
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "historico_versoes" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "fluxos_triagem" ALTER COLUMN "versao_atual" SET NOT NULL`,
      );
    }

    if (triagemLogsExists) {
      await queryRunner.query(
        `ALTER TABLE "triagem_logs" ALTER COLUMN "created_at" SET DEFAULT now()`,
      );
    }

    if (contasPagarExists) {
      await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "descricao"`);
      await queryRunner.query(
        `ALTER TABLE "contas_pagar" ADD COLUMN IF NOT EXISTS "descricao" character varying NOT NULL`,
      );
    }

    if (faturasExists) {
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorTotal" TYPE numeric(10,2)`);
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" TYPE numeric(10,2)`);
      await queryRunner.query(
        `ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" TYPE numeric(10,2)`,
      );
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" TYPE numeric(10,2)`);
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" TYPE numeric(10,2)`);
    }

    if (empresaModulosExists) {
      await queryRunner.query(
        `ALTER TABLE "empresa_modulos" ALTER COLUMN "data_ativacao" SET DEFAULT now()`,
      );
      await queryRunner.query(`COMMENT ON COLUMN "empresa_modulos"."data_expiracao" IS NULL`);
      await queryRunner.query(
        `ALTER TABLE "empresa_modulos" ALTER COLUMN "created_at" SET DEFAULT now()`,
      );
      await queryRunner.query(
        `ALTER TABLE "empresa_modulos" ALTER COLUMN "updated_at" SET DEFAULT now()`,
      );
    }

    if (faturasExists) {
      await queryRunner.query(
        `ALTER TABLE "faturas" DROP CONSTRAINT IF EXISTS "FK_9b8490bce74e62adb498b5ccbb6"`,
      );
      await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "contratoId" DROP NOT NULL`);
    }

    if (canaisExists) {
      await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN IF EXISTS "nome"`);
      await queryRunner.query(
        `ALTER TABLE "canais" ADD COLUMN IF NOT EXISTS "nome" character varying NOT NULL`,
      );
      await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN IF EXISTS "tipo"`);
      await queryRunner.query(
        `ALTER TABLE "canais" ADD COLUMN IF NOT EXISTS "tipo" character varying NOT NULL`,
      );
      await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN IF EXISTS "provider"`);
      await queryRunner.query(
        `ALTER TABLE "canais" ADD COLUMN IF NOT EXISTS "provider" character varying`,
      );
      await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN IF EXISTS "status"`);
      await queryRunner.query(
        `ALTER TABLE "canais" ADD COLUMN IF NOT EXISTS "status" character varying`,
      );
      await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN IF EXISTS "webhook_url"`);
      await queryRunner.query(
        `ALTER TABLE "canais" ADD COLUMN IF NOT EXISTS "webhook_url" character varying`,
      );
      await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN IF EXISTS "webhook_secret"`);
      await queryRunner.query(
        `ALTER TABLE "canais" ADD COLUMN IF NOT EXISTS "webhook_secret" character varying`,
      );
    }
    if (faturasExists) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_67862e1af92d16dfa50f4e9d18" ON "faturas" ("clienteId") `,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_1162d4fe194d2e32a9ecf6ccb4" ON "faturas" ("status") `,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_c0d57c7b5bde732ac3d3ed3558" ON "faturas" ("dataEmissao") `,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_139d3276e0a299deacb53a557d" ON "faturas" ("dataVencimento") `,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_60cf6cd7b6a1b7298af56b056d" ON "faturas" ("ativo") `,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_c74f605d546764c24c0d9451f0" ON "faturas" ("createdAt") `,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_a4c04e78810691f77a6c4dd8e6" ON "faturas" ("numero") `,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_e0741e7b51d90755844ae04d67" ON "faturas" ("dataVencimento", "status") `,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_450c254ac416c5207f90573259" ON "faturas" ("clienteId", "status") `,
      );
    }

    if (empresaModulosExists) {
      await queryRunner.query(
        `ALTER TABLE "empresa_modulos" ADD CONSTRAINT "UQ_77259e6fdc8105e25f82ac00bb6" UNIQUE ("empresa_id", "modulo")`,
      );
      await queryRunner.query(
        `ALTER TABLE "empresa_modulos" ADD CONSTRAINT "FK_46edc34189c9fc0365aa377b4f6" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
    }

    if (faturasExists && contratosExists) {
      await queryRunner.query(
        `ALTER TABLE "faturas" ADD CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "empresa_configuracoes" ADD CONSTRAINT "FK_b290d258ed0ac7a1f7bb848f00e" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tabelaConfiguracoesExiste = await queryRunner.hasTable('empresa_configuracoes');

    if (!tabelaConfiguracoesExiste) {
      console.log(
        'ℹ️  Tabela "empresa_configuracoes" não existe. Reversão 1762201484633 ignorada.',
      );
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "empresa_configuracoes" DROP CONSTRAINT "FK_b290d258ed0ac7a1f7bb848f00e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" DROP CONSTRAINT "FK_46edc34189c9fc0365aa377b4f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" DROP CONSTRAINT "UQ_77259e6fdc8105e25f82ac00bb6"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_450c254ac416c5207f90573259"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e0741e7b51d90755844ae04d67"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a4c04e78810691f77a6c4dd8e6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c74f605d546764c24c0d9451f0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_60cf6cd7b6a1b7298af56b056d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_139d3276e0a299deacb53a557d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0d57c7b5bde732ac3d3ed3558"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1162d4fe194d2e32a9ecf6ccb4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_67862e1af92d16dfa50f4e9d18"`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "webhook_secret"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "webhook_secret" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "webhook_url"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "webhook_url" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "status"`);
    await queryRunner.query(
      `ALTER TABLE "canais" ADD "status" character varying(30) DEFAULT 'CONFIGURANDO'`,
    );
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "provider"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "provider" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "tipo"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "tipo" character varying(30) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "nome"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "nome" character varying(100) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "contratoId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "empresa_modulos"."data_expiracao" IS 'Null = sem expiração'`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ALTER COLUMN "data_ativacao" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" TYPE numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" TYPE numeric(12,2)`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" TYPE numeric(12,2)`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" TYPE numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorTotal" TYPE numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "descricao"`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "descricao" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "triagem_logs" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "versao_atual" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "historico_versoes" DROP NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "fornecedores"."cnpj_cpf" IS 'CNPJ ou CPF do fornecedor (formatado)'`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "atualizadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "criadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "atualizadoPor" uuid`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "criadoPor" uuid`);
    await queryRunner.query(`DROP TABLE "empresa_configuracoes"`);
    await queryRunner.query(`DROP TYPE "public"."empresa_configuracoes_backup_frequencia_enum"`);
    await queryRunner.query(`DROP TYPE "public"."empresa_configuracoes_senha_complexidade_enum"`);
    await queryRunner.query(
      `CREATE INDEX "idx_empresa_modulos_ativo" ON "empresa_modulos" ("empresa_id", "ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_empresa_modulos_empresa_id" ON "empresa_modulos" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_empresa_modulo_unique" ON "empresa_modulos" ("empresa_id", "modulo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_450c254ac416c5207f90573259" ON "faturas" ("clienteId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e0741e7b51d90755844ae04d67" ON "faturas" ("dataVencimento", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a4c04e78810691f77a6c4dd8e6" ON "faturas" ("numero") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c74f605d546764c24c0d9451f0" ON "faturas" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_60cf6cd7b6a1b7298af56b056d" ON "faturas" ("ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_139d3276e0a299deacb53a557d" ON "faturas" ("dataVencimento") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c0d57c7b5bde732ac3d3ed3558" ON "faturas" ("dataEmissao") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1162d4fe194d2e32a9ecf6ccb4" ON "faturas" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_67862e1af92d16dfa50f4e9d18" ON "faturas" ("clienteId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ADD CONSTRAINT "fk_empresa_modulos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
