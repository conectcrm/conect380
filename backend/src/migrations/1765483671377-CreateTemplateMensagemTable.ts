import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplateMensagemTable1765483671377 implements MigrationInterface {
  name = 'CreateTemplateMensagemTable1765483671377';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasPropostas = await queryRunner.hasTable('propostas');
    const hasInteracoes = await queryRunner.hasTable('interacoes');
    const hasFaturas = await queryRunner.hasTable('faturas');
    const hasAgendaEventos = await queryRunner.hasTable('agenda_eventos');
    const hasTickets = await queryRunner.hasTable('atendimento_tickets');
    const hasOportunidades = await queryRunner.hasTable('oportunidades');
    const hasConfigGateway = await queryRunner.hasTable('configuracoes_gateway_pagamento');
    const hasTransacoesGateway = await queryRunner.hasTable('transacoes_gateway_pagamento');
    const hasDlq = await queryRunner.hasTable('dlq_reprocess_audit');

    await queryRunner.query(
      `ALTER TABLE IF EXISTS "propostas" DROP CONSTRAINT IF EXISTS "FK_propostas_oportunidade"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "interacoes" DROP CONSTRAINT IF EXISTS "FK_interacoes_responsavel"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "interacoes" DROP CONSTRAINT IF EXISTS "FK_interacoes_contato"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "interacoes" DROP CONSTRAINT IF EXISTS "FK_interacoes_lead"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "interacoes" DROP CONSTRAINT IF EXISTS "FK_interacoes_empresa"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" DROP CONSTRAINT IF EXISTS "FK_644bf709a39af5c760b98e56a06"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "agenda_eventos" DROP CONSTRAINT IF EXISTS "FK_agenda_eventos_interacao"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "agenda_eventos" DROP CONSTRAINT IF EXISTS "FK_agenda_eventos_empresa"`,
    );

    // Garantir idempotência para as FKs que serão (re)criadas ao final
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "propostas" DROP CONSTRAINT IF EXISTS "FK_a884ea95470c3dcc1aca2f4a1d8"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" DROP CONSTRAINT IF EXISTS "FK_9b8490bce74e62adb498b5ccbb6"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" DROP CONSTRAINT IF EXISTS "FK_644bf709a39af5c760b98e56a06"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "interacoes" DROP CONSTRAINT IF EXISTS "FK_8c0598142d693273de9dd9efec7"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "interacoes" DROP CONSTRAINT IF EXISTS "FK_92f1c5f6ce19d19e7426eaa6ff9"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "interacoes" DROP CONSTRAINT IF EXISTS "FK_edfa8151295c0ca5d30935bcfad"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "interacoes" DROP CONSTRAINT IF EXISTS "FK_3c25b1558da997f7e23639060c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "agenda_eventos" DROP CONSTRAINT IF EXISTS "FK_67d145612622c2d336286d96ab2"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "agenda_eventos" DROP CONSTRAINT IF EXISTS "FK_e4b733b749c8b7563b61f6e9e48"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_atendimento_tickets_severity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_atendimento_tickets_assigned_level"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_atendimento_tickets_sla_expires_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_oportunidades_precisa_atencao"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_oportunidades_dias_estagio"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_oportunidades_motivo_perda"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_oportunidades_precisa_atencao"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_oportunidades_dias_estagio"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_propostas_oportunidade_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_67862e1af92d16dfa50f4e9d18"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_1162d4fe194d2e32a9ecf6ccb4"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c0d57c7b5bde732ac3d3ed3558"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_139d3276e0a299deacb53a557d"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_60cf6cd7b6a1b7298af56b056d"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c74f605d546764c24c0d9451f0"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_a4c04e78810691f77a6c4dd8e6"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e0741e7b51d90755844ae04d67"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_450c254ac416c5207f90573259"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_interacoes_empresa_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_interacoes_tipo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_interacoes_lead_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_interacoes_contato_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_interacoes_responsavel_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_interacoes_data_referencia"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_interacoes_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_interacoes_agenda_event_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_dlq_reprocess_fila_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_agenda_eventos_empresa_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_agenda_eventos_inicio"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_agenda_eventos_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_agenda_eventos_prioridade"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_agenda_eventos_interacao_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_agenda_eventos_created_at"`);

    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" DROP COLUMN IF EXISTS "atualizadoPor"`,
    );
    await queryRunner.query(`ALTER TABLE IF EXISTS "faturas" DROP COLUMN IF EXISTS "criadoPor"`);
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" DROP COLUMN IF EXISTS "empresa_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" ADD COLUMN IF NOT EXISTS "empresa_id" uuid NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE IF EXISTS "faturas" ADD COLUMN IF NOT EXISTS "criadoPor" uuid`);
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" ADD COLUMN IF NOT EXISTS "atualizadoPor" uuid`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_de0189e9fc08cd5284c0a461b7"`);
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "atendimento_tickets" DROP COLUMN IF EXISTS "status"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."atendimento_tickets_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "atendimento_tickets" ADD COLUMN IF NOT EXISTS "status" character varying(20) NOT NULL DEFAULT 'FILA'`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "atendimento_tickets" ALTER COLUMN "severity" DROP NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "oportunidades"."motivo_perda_detalhes" IS 'Detalhes do motivo de perda'`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "oportunidades" DROP COLUMN IF EXISTS "concorrente_nome"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "oportunidades" ADD COLUMN IF NOT EXISTS "concorrente_nome" character varying(255)`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "oportunidades"."concorrente_nome" IS 'Nome do concorrente (se aplicável)'`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "oportunidades" DROP COLUMN IF EXISTS "data_revisao"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "oportunidades" ADD COLUMN IF NOT EXISTS "data_revisao" date`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "oportunidades"."data_revisao" IS 'Data para reavaliar oportunidade perdida'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "oportunidades"."data_ultima_mudanca_estagio" IS 'Data da última mudança de estágio'`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "oportunidades" ALTER COLUMN "data_ultima_mudanca_estagio" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "oportunidades" ALTER COLUMN "dias_no_estagio_atual" SET NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "oportunidades"."dias_no_estagio_atual" IS 'Dias no estágio atual'`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "oportunidades" ALTER COLUMN "precisa_atencao" SET NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "oportunidades"."precisa_atencao" IS 'Oportunidade precisa de atenção (SLA vencido)'`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "configuracoes_gateway_pagamento" ALTER COLUMN "credenciais" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "configuracoes_gateway_pagamento" ALTER COLUMN "metodos_permitidos" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "transacoes_gateway_pagamento" ALTER COLUMN "payload_envio" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "transacoes_gateway_pagamento" ALTER COLUMN "payload_resposta" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(`ALTER TABLE IF EXISTS "interacoes" DROP COLUMN IF EXISTS "tipo"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."interacoes_tipo_enum"`);
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "interacoes" ADD COLUMN IF NOT EXISTS "tipo" character varying(50)`,
    ); // NULLABLE primeiro
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.interacoes') IS NOT NULL THEN
          UPDATE "interacoes" SET "tipo" = 'outro' WHERE "tipo" IS NULL;
        END IF;
      END
      $$
    `); // Preencher valores
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "interacoes" ALTER COLUMN "tipo" SET NOT NULL`,
    ); // Agora NOT NULL
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" DROP CONSTRAINT IF EXISTS "FK_9b8490bce74e62adb498b5ccbb6"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" ALTER COLUMN "contratoId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" ALTER COLUMN "valorTotal" TYPE numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" ALTER COLUMN "valorPago" TYPE numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" ALTER COLUMN "valorDesconto" TYPE numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" ALTER COLUMN "valorJuros" TYPE numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "faturas" ALTER COLUMN "valorMulta" TYPE numeric(12,2)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_5bf61006ffaf91d65209e19a53" ON "atendimento_tickets" ("assigned_level") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_4924436e18456fea06a3bb311f" ON "atendimento_tickets" ("severity") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_de0189e9fc08cd5284c0a461b7" ON "atendimento_tickets" ("status") `,
    );
    if (hasFaturas) {
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

    if (hasDlq) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_bc7490a4f33a653dcc2928d2cc" ON "dlq_reprocess_audit" ("fila", "created_at") `,
      );
    }
    if (hasPropostas && hasOportunidades) {
      await queryRunner.query(
        `ALTER TABLE "propostas" ADD CONSTRAINT "FK_a884ea95470c3dcc1aca2f4a1d8" FOREIGN KEY ("oportunidade_id") REFERENCES "oportunidades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }

    if (hasFaturas) {
      await queryRunner.query(
        `ALTER TABLE "faturas" ADD CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "faturas" ADD CONSTRAINT "FK_644bf709a39af5c760b98e56a06" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }

    if (hasInteracoes) {
      await queryRunner.query(
        `ALTER TABLE "interacoes" ADD CONSTRAINT "FK_8c0598142d693273de9dd9efec7" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "interacoes" ADD CONSTRAINT "FK_92f1c5f6ce19d19e7426eaa6ff9" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "interacoes" ADD CONSTRAINT "FK_edfa8151295c0ca5d30935bcfad" FOREIGN KEY ("contato_id") REFERENCES "contatos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "interacoes" ADD CONSTRAINT "FK_3c25b1558da997f7e23639060c9" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }

    if (hasAgendaEventos) {
      await queryRunner.query(
        `ALTER TABLE "agenda_eventos" ADD CONSTRAINT "FK_67d145612622c2d336286d96ab2" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "agenda_eventos" ADD CONSTRAINT "FK_e4b733b749c8b7563b61f6e9e48" FOREIGN KEY ("interacao_id") REFERENCES "interacoes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agenda_eventos" DROP CONSTRAINT "FK_e4b733b749c8b7563b61f6e9e48"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agenda_eventos" DROP CONSTRAINT "FK_67d145612622c2d336286d96ab2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interacoes" DROP CONSTRAINT "FK_3c25b1558da997f7e23639060c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interacoes" DROP CONSTRAINT "FK_edfa8151295c0ca5d30935bcfad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interacoes" DROP CONSTRAINT "FK_92f1c5f6ce19d19e7426eaa6ff9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interacoes" DROP CONSTRAINT "FK_8c0598142d693273de9dd9efec7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT "FK_644bf709a39af5c760b98e56a06"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "propostas" DROP CONSTRAINT "FK_a884ea95470c3dcc1aca2f4a1d8"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_bc7490a4f33a653dcc2928d2cc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_450c254ac416c5207f90573259"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e0741e7b51d90755844ae04d67"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a4c04e78810691f77a6c4dd8e6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c74f605d546764c24c0d9451f0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_60cf6cd7b6a1b7298af56b056d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_139d3276e0a299deacb53a557d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0d57c7b5bde732ac3d3ed3558"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1162d4fe194d2e32a9ecf6ccb4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_67862e1af92d16dfa50f4e9d18"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_de0189e9fc08cd5284c0a461b7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4924436e18456fea06a3bb311f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5bf61006ffaf91d65209e19a53"`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" TYPE numeric(10,2)`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" TYPE numeric(10,2)`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorTotal" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "contratoId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "interacoes" DROP COLUMN "tipo"`);
    await queryRunner.query(
      `CREATE TYPE "public"."interacoes_tipo_enum" AS ENUM('chamada', 'email', 'reuniao', 'nota', 'outro')`,
    );
    await queryRunner.query(
      `ALTER TABLE "interacoes" ADD "tipo" "public"."interacoes_tipo_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_resposta" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacoes_gateway_pagamento" ALTER COLUMN "payload_envio" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "metodos_permitidos" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracoes_gateway_pagamento" ALTER COLUMN "credenciais" SET DEFAULT '{}'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "oportunidades"."precisa_atencao" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ALTER COLUMN "precisa_atencao" DROP NOT NULL`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "oportunidades"."dias_no_estagio_atual" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ALTER COLUMN "dias_no_estagio_atual" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ALTER COLUMN "data_ultima_mudanca_estagio" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "oportunidades"."data_ultima_mudanca_estagio" IS NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "oportunidades"."data_revisao" IS 'Data para reavaliar oportunidade perdida'`,
    );
    await queryRunner.query(`ALTER TABLE "oportunidades" DROP COLUMN "data_revisao"`);
    await queryRunner.query(`ALTER TABLE "oportunidades" ADD "data_revisao" TIMESTAMP`);
    await queryRunner.query(
      `COMMENT ON COLUMN "oportunidades"."concorrente_nome" IS 'Nome do concorrente (se aplicável)'`,
    );
    await queryRunner.query(`ALTER TABLE "oportunidades" DROP COLUMN "concorrente_nome"`);
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ADD "concorrente_nome" character varying(100)`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "oportunidades"."motivo_perda_detalhes" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ALTER COLUMN "severity" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "atendimento_tickets" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."atendimento_tickets_status_enum" AS ENUM('FILA', 'EM_ATENDIMENTO', 'ENVIO_ATIVO', 'ENCERRADO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD "status" "public"."atendimento_tickets_status_enum" NOT NULL DEFAULT 'FILA'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de0189e9fc08cd5284c0a461b7" ON "atendimento_tickets" ("status") `,
    );
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "atualizadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "criadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "empresa_id"`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "empresa_id" uuid NOT NULL`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "criadoPor" uuid`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "atualizadoPor" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_agenda_eventos_created_at" ON "agenda_eventos" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agenda_eventos_interacao_id" ON "agenda_eventos" ("interacao_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agenda_eventos_prioridade" ON "agenda_eventos" ("prioridade") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agenda_eventos_status" ON "agenda_eventos" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agenda_eventos_inicio" ON "agenda_eventos" ("inicio") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agenda_eventos_empresa_id" ON "agenda_eventos" ("empresa_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dlq_reprocess_fila_created_at" ON "dlq_reprocess_audit" ("fila", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_interacoes_agenda_event_id" ON "interacoes" ("agenda_event_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_interacoes_created_at" ON "interacoes" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_interacoes_data_referencia" ON "interacoes" ("data_referencia") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_interacoes_responsavel_id" ON "interacoes" ("responsavel_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_interacoes_contato_id" ON "interacoes" ("contato_id") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_interacoes_lead_id" ON "interacoes" ("lead_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_interacoes_tipo" ON "interacoes" ("tipo") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_interacoes_empresa_id" ON "interacoes" ("empresa_id") `,
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
      `CREATE INDEX "idx_propostas_oportunidade_id" ON "propostas" ("oportunidade_id") WHERE (oportunidade_id IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oportunidades_dias_estagio" ON "oportunidades" ("estagio", "dias_no_estagio_atual") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oportunidades_precisa_atencao" ON "oportunidades" ("precisa_atencao") WHERE (precisa_atencao = true)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_oportunidades_motivo_perda" ON "oportunidades" ("motivo_perda") WHERE (motivo_perda IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_oportunidades_dias_estagio" ON "oportunidades" ("estagio", "dias_no_estagio_atual") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_oportunidades_precisa_atencao" ON "oportunidades" ("precisa_atencao") WHERE (precisa_atencao = true)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_atendimento_tickets_sla_expires_at" ON "atendimento_tickets" ("sla_expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_atendimento_tickets_assigned_level" ON "atendimento_tickets" ("assigned_level") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_atendimento_tickets_severity" ON "atendimento_tickets" ("severity") `,
    );
    await queryRunner.query(
      `ALTER TABLE "agenda_eventos" ADD CONSTRAINT "FK_agenda_eventos_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "agenda_eventos" ADD CONSTRAINT "FK_agenda_eventos_interacao" FOREIGN KEY ("interacao_id") REFERENCES "interacoes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "FK_644bf709a39af5c760b98e56a06" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interacoes" ADD CONSTRAINT "FK_interacoes_empresa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interacoes" ADD CONSTRAINT "FK_interacoes_lead" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interacoes" ADD CONSTRAINT "FK_interacoes_contato" FOREIGN KEY ("contato_id") REFERENCES "contatos"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interacoes" ADD CONSTRAINT "FK_interacoes_responsavel" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "propostas" ADD CONSTRAINT "FK_propostas_oportunidade" FOREIGN KEY ("oportunidade_id") REFERENCES "oportunidades"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }
}
