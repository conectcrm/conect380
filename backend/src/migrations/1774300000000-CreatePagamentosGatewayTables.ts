import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePagamentosGatewayTables1774300000000 implements MigrationInterface {
  name = 'CreatePagamentosGatewayTables1774300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."config_gateway_gateway_enum" AS ENUM('mercado_pago', 'stripe', 'pagseguro')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."config_gateway_modo_enum" AS ENUM('sandbox', 'producao')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."config_gateway_status_enum" AS ENUM('ativo', 'inativo', 'erro')`,
    );

    await queryRunner.query(`
      CREATE TABLE "configuracoes_gateway_pagamento" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "nome" character varying(120) NOT NULL,
        "gateway" "public"."config_gateway_gateway_enum" NOT NULL,
        "modo_operacao" "public"."config_gateway_modo_enum" NOT NULL DEFAULT 'sandbox',
        "status" "public"."config_gateway_status_enum" NOT NULL DEFAULT 'inativo',
        "credenciais" jsonb DEFAULT '{}'::jsonb,
        "webhook_url" character varying(255),
        "webhook_secret" character varying(255),
        "metodos_permitidos" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "config_adicional" jsonb,
        "ultimo_erro" text,
        "ultimo_evento_em" TIMESTAMP,
        "criado_por" uuid,
        "atualizado_por" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_configuracoes_gateway_pagamento" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_configuracoes_gateway_empresa" ON "configuracoes_gateway_pagamento" ("empresa_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_config_gateway_empresa_tipo_modo" ON "configuracoes_gateway_pagamento" ("empresa_id", "gateway", "modo_operacao")`,
    );

    await queryRunner.query(`
      ALTER TABLE "configuracoes_gateway_pagamento"
      ADD CONSTRAINT "FK_config_gateway_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."transacao_gateway_status_enum" AS ENUM('pendente', 'processando', 'aprovado', 'recusado', 'cancelado', 'erro')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transacao_gateway_operacao_enum" AS ENUM('cobranca', 'estorno', 'webhook', 'validacao')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transacao_gateway_metodo_enum" AS ENUM('pix', 'cartao_credito', 'cartao_debito', 'boleto', 'link_pagamento', 'transferencia')`,
    );

    await queryRunner.query(`
      CREATE TABLE "transacoes_gateway_pagamento" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "configuracao_id" uuid NOT NULL,
        "fatura_id" integer,
        "pagamento_id" integer,
        "referencia_gateway" character varying(140) NOT NULL,
        "status" "public"."transacao_gateway_status_enum" NOT NULL DEFAULT 'pendente',
        "tipo_operacao" "public"."transacao_gateway_operacao_enum" NOT NULL DEFAULT 'cobranca',
        "metodo" "public"."transacao_gateway_metodo_enum" NOT NULL DEFAULT 'pix',
        "origem" character varying(60) NOT NULL DEFAULT 'api',
        "valor_bruto" numeric(12,2) NOT NULL DEFAULT 0,
        "valor_liquido" numeric(12,2) NOT NULL DEFAULT 0,
        "taxa" numeric(12,2) NOT NULL DEFAULT 0,
        "payload_envio" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "payload_resposta" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "mensagem_erro" text,
        "processado_em" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transacoes_gateway_pagamento" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_transacoes_gateway_empresa" ON "transacoes_gateway_pagamento" ("empresa_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_transacoes_gateway_referencia" ON "transacoes_gateway_pagamento" ("empresa_id", "referencia_gateway")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transacoes_gateway_config" ON "transacoes_gateway_pagamento" ("configuracao_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transacoes_gateway_fatura" ON "transacoes_gateway_pagamento" ("fatura_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transacoes_gateway_pagamento" ON "transacoes_gateway_pagamento" ("pagamento_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "transacoes_gateway_pagamento"
      ADD CONSTRAINT "FK_transacoes_gateway_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "transacoes_gateway_pagamento"
      ADD CONSTRAINT "FK_transacoes_gateway_config" FOREIGN KEY ("configuracao_id") REFERENCES "configuracoes_gateway_pagamento"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "transacoes_gateway_pagamento"
      ADD CONSTRAINT "FK_transacoes_gateway_fatura" FOREIGN KEY ("fatura_id") REFERENCES "faturas"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "transacoes_gateway_pagamento"
      ADD CONSTRAINT "FK_transacoes_gateway_pagamento" FOREIGN KEY ("pagamento_id") REFERENCES "pagamentos"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" DROP CONSTRAINT "FK_transacoes_gateway_pagamento"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" DROP CONSTRAINT "FK_transacoes_gateway_fatura"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" DROP CONSTRAINT "FK_transacoes_gateway_config"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" DROP CONSTRAINT "FK_transacoes_gateway_empresa"`,
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_transacoes_gateway_pagamento"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transacoes_gateway_fatura"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transacoes_gateway_config"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_transacoes_gateway_referencia"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transacoes_gateway_empresa"`);
    await queryRunner.query(`DROP TABLE "transacoes_gateway_pagamento"`);

    await queryRunner.query(`DROP TYPE "public"."transacao_gateway_metodo_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transacao_gateway_operacao_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transacao_gateway_status_enum"`);

    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" DROP CONSTRAINT "FK_config_gateway_empresa"`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_config_gateway_empresa_tipo_modo"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_configuracoes_gateway_empresa"`);
    await queryRunner.query(`DROP TABLE "configuracoes_gateway_pagamento"`);

    await queryRunner.query(`DROP TYPE "public"."config_gateway_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."config_gateway_modo_enum"`);
    await queryRunner.query(`DROP TYPE "public"."config_gateway_gateway_enum"`);
  }
}
