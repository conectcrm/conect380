import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRichFieldsToContasPagar1802867000000 implements MigrationInterface {
  name = 'AddRichFieldsToContasPagar1802867000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "numero" character varying(50)
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "valor_original" numeric(15,2)
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "valor_desconto" numeric(15,2) DEFAULT '0'
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "valor_multa" numeric(15,2) DEFAULT '0'
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "valor_juros" numeric(15,2) DEFAULT '0'
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "valor_total" numeric(15,2)
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "valor_pago" numeric(15,2) DEFAULT '0'
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "valor_restante" numeric(15,2)
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "data_emissao" date
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "data_agendamento" date
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "categoria" character varying(50)
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "prioridade" character varying(10)
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "tipo_pagamento" character varying(30)
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "forma_pagamento" character varying(30)
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "conta_bancaria_id" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "comprovante_pagamento" character varying(500)
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "recorrente" boolean DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "frequencia_recorrencia" character varying(50)
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "necessita_aprovacao" boolean DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "aprovado_por" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "data_aprovacao" timestamp
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "criado_por" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "atualizado_por" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "centro_custo_id" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "anexos" jsonb DEFAULT '[]'::jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "contas_pagar"
      ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb
    `);

    await queryRunner.query(`
      UPDATE "contas_pagar"
      SET
        "numero" = COALESCE(
          NULLIF(TRIM("numero"), ''),
          CASE
            WHEN COALESCE(TRIM("numero_documento"), '') <> '' THEN TRIM("numero_documento")
            ELSE 'CP-' || UPPER(SUBSTRING("id"::text, 1, 8))
          END
        ),
        "valor_original" = COALESCE("valor_original", "valor"),
        "valor_desconto" = COALESCE("valor_desconto", 0),
        "valor_multa" = COALESCE("valor_multa", 0),
        "valor_juros" = COALESCE("valor_juros", 0),
        "valor_total" = COALESCE("valor_total", "valor"),
        "valor_pago" = COALESCE(
          "valor_pago",
          CASE WHEN "status" = 'paga' THEN COALESCE("valor_total", "valor", 0) ELSE 0 END
        ),
        "valor_restante" = COALESCE(
          "valor_restante",
          CASE
            WHEN "status" = 'paga' THEN 0
            ELSE GREATEST(COALESCE("valor_total", "valor", 0) - COALESCE("valor_pago", 0), 0)
          END
        ),
        "data_emissao" = COALESCE("data_emissao", ("created_at")::date),
        "categoria" = COALESCE(NULLIF(TRIM("categoria"), ''), 'outros'),
        "prioridade" = COALESCE(NULLIF(TRIM("prioridade"), ''), 'media'),
        "tipo_pagamento" = COALESCE(NULLIF(TRIM("tipo_pagamento"), ''), NULLIF(TRIM("forma_pagamento"), '')),
        "forma_pagamento" = COALESCE(NULLIF(TRIM("forma_pagamento"), ''), NULLIF(TRIM("tipo_pagamento"), '')),
        "recorrente" = COALESCE("recorrente", false),
        "necessita_aprovacao" = COALESCE("necessita_aprovacao", false),
        "anexos" = COALESCE("anexos", '[]'::jsonb),
        "tags" = COALESCE("tags", '[]'::jsonb)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "tags"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "anexos"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "centro_custo_id"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "atualizado_por"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "criado_por"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "data_aprovacao"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "aprovado_por"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "necessita_aprovacao"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "frequencia_recorrencia"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "recorrente"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "comprovante_pagamento"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "conta_bancaria_id"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "forma_pagamento"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "tipo_pagamento"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "prioridade"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "categoria"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "data_agendamento"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "data_emissao"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_restante"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_pago"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_total"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_juros"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_multa"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_desconto"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "valor_original"`);
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN IF EXISTS "numero"`);
  }
}
