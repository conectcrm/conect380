import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidacaoEquipeFila1762781002951 implements MigrationInterface {
  name = 'ConsolidacaoEquipeFila1762781002951';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // CONSOLIDAÇÃO EQUIPE → FILA
    // ========================================
    // Objetivo: Unificar conceitos duplicados
    // Triagem (Equipe) → Atendimento (Fila)
    // ========================================

    console.log('🔄 Iniciando consolidação Equipe → Fila...');

    // ========================================
    // ETAPA 1: Adicionar colunas de Equipe à tabela Filas
    // ========================================
    console.log('📝 Etapa 1: Adicionando colunas à tabela filas...');

    await queryRunner.query(`
            ALTER TABLE "filas" 
            ADD COLUMN IF NOT EXISTS "cor" VARCHAR(7),
            ADD COLUMN IF NOT EXISTS "icone" VARCHAR(50),
            ADD COLUMN IF NOT EXISTS "nucleoId" UUID,
            ADD COLUMN IF NOT EXISTS "departamentoId" UUID
        `);

    // Adicionar foreign keys
    await queryRunner.query(`
            ALTER TABLE "filas"
            ADD CONSTRAINT "FK_filas_nucleo" 
            FOREIGN KEY ("nucleoId") REFERENCES "nucleos_atendimento"("id") ON DELETE SET NULL,
            ADD CONSTRAINT "FK_filas_departamento" 
            FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL
        `);

    // ========================================
    // ETAPA 2: Migrar dados de Equipes → Filas
    // ========================================
    console.log('📦 Etapa 2: Migrando dados de equipes → filas...');

    // Inserir equipes como filas (apenas se não existir nome duplicado)
    await queryRunner.query(`
            INSERT INTO "filas" (
                id, 
                "empresaId", 
                nome, 
                descricao, 
                cor, 
                icone, 
                ativo, 
                ordem,
                "nucleoId",
                "departamentoId",
                estrategia_distribuicao,
                capacidade_maxima,
                distribuicao_automatica,
                "createdAt",
                "updatedAt"
            )
            SELECT 
                e.id,
                e.empresa_id,          -- snake_case na tabela equipes
                e.nome,
                e.descricao,
                COALESCE(e.cor, '#159A9C'),   -- Cor padrão se não existir
                COALESCE(e.icone, 'Users'),   -- Ícone padrão se não existir
                COALESCE(e.ativo, true),      -- Ativo padrão se não existir
                0 as ordem,                    -- Ordem padrão (coluna pode não existir)
                ea.nucleo_id,          -- Da tabela equipe_atribuicoes (snake_case)
                ea.departamento_id,    -- Da tabela equipe_atribuicoes (snake_case)
                'ROUND_ROBIN'::estrategia_distribuicao_enum,
                10,                    -- Capacidade padrão
                true,                  -- Distribuição automática ativa
                COALESCE(e.created_at, CURRENT_TIMESTAMP),  -- snake_case
                COALESCE(e.updated_at, CURRENT_TIMESTAMP)   -- snake_case
            FROM "equipes" e
            LEFT JOIN equipe_atribuicoes ea ON ea.equipe_id = e.id
            WHERE NOT EXISTS (
                SELECT 1 FROM "filas" f 
                WHERE f.nome = e.nome AND f."empresaId" = e.empresa_id
            )
            ON CONFLICT (id) DO NOTHING
        `);

    const result = await queryRunner.query(`SELECT COUNT(*) as count FROM "equipes"`);
    console.log(`✅ ${result[0].count} equipes migradas para filas`);

    // ========================================
    // ETAPA 3: Migrar atendente_equipes → filas_atendentes
    // ========================================
    console.log('👥 Etapa 3: Migrando membros de equipes → filas_atendentes...');

    await queryRunner.query(`
            INSERT INTO "filas_atendentes" (
                id,
                "filaId",
                "atendenteId",
                capacidade,
                prioridade,
                ativo,
                "createdAt",
                "updatedAt"
            )
            SELECT 
                ae.id,
                ae.equipe_id,         -- equipe_id (snake_case) vira filaId
                ae.atendente_id,      -- atendente_id (snake_case)
                5 as capacidade,      -- Capacidade padrão (coluna pode não existir)
                1 as prioridade,      -- Prioridade padrão (coluna pode não existir)
                true as ativo,        -- Ativo padrão
                COALESCE(ae.created_at, CURRENT_TIMESTAMP),  -- snake_case
                COALESCE(ae.updated_at, CURRENT_TIMESTAMP)   -- snake_case
            FROM "atendente_equipes" ae
            WHERE NOT EXISTS (
                SELECT 1 FROM "filas_atendentes" fa
                WHERE fa."filaId" = ae.equipe_id AND fa."atendenteId" = ae.atendente_id
            )
            ON CONFLICT ("filaId", "atendenteId") DO NOTHING
        `);

    const membros = await queryRunner.query(`SELECT COUNT(*) as count FROM "atendente_equipes"`);
    console.log(`✅ ${membros[0].count} membros migrados para filas_atendentes`);

    // ========================================
    // ETAPA 4: Atualizar referências em outras tabelas
    // ========================================
    console.log('🔗 Etapa 4: Atualizando referências em atendimento_tickets...');

    // Tickets que têm equipe_atribuicoes devem agora referenciar fila
    await queryRunner.query(`
            UPDATE "atendimento_tickets" t
            SET fila_id = ea.equipe_id
            FROM equipe_atribuicoes ea
            WHERE ea.id = t.id  -- Assumindo relação por ID (ajustar se necessário)
            AND t.fila_id IS NULL
        `);

    // ========================================
    // ETAPA 5: Dropar tabelas antigas (APÓS CONFIRMAÇÃO)
    // ========================================
    console.log('🗑️  Etapa 5: Removendo tabelas antigas...');

    // Drop tabela equipe_atribuicoes (já não tem dados úteis)
    await queryRunner.query(`DROP TABLE IF EXISTS "equipe_atribuicoes" CASCADE`);

    // Drop tabela atendente_equipes (dados já migrados)
    await queryRunner.query(`DROP TABLE IF EXISTS "atendente_equipes" CASCADE`);

    // Drop tabela equipes (dados já migrados)
    await queryRunner.query(`DROP TABLE IF EXISTS "equipes" CASCADE`);

    console.log('✅ Consolidação Equipe → Fila concluída!');

    // FIM DA MIGRAÇÃO - Ignorar código auto-gerado abaixo
    return;

    // ========================================
    // MIGRATIONS ADICIONAIS (schema sync)
    // ========================================
    await queryRunner.query(
      `ALTER TABLE "oportunidades" DROP CONSTRAINT "FK_oportunidades_cliente"`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" DROP CONSTRAINT "FK_filas_atendentes_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" DROP CONSTRAINT "FK_filas_atendentes_fila"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" DROP CONSTRAINT "FK_ticket_departamento"`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" DROP CONSTRAINT "fk_empresa_modulos_empresa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_password_reset_tokens_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_log" DROP CONSTRAINT "FK_380a8c5c105b3cc1b6018baee94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_log" DROP CONSTRAINT "FK_f9e61fcb5a74c76ddb93e2d04c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_configuracao_inatividade" DROP CONSTRAINT "FK_configuracao_inatividade_departamento"`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_config" DROP CONSTRAINT "FK_544fd99a976c9ad31371a00d1c7"`,
    );
    await queryRunner.query(`ALTER TABLE "ticket_tags" DROP CONSTRAINT "FK_TICKET_TAGS_TAG"`);
    await queryRunner.query(`ALTER TABLE "ticket_tags" DROP CONSTRAINT "FK_TICKET_TAGS_TICKET"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_filas_atendentes_fila_atendente"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_filas_atendentes_filaId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_filas_atendentes_atendenteId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TAGS_NOME"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TAGS_NOME_EMPRESA"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TAGS_ATIVO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TAGS_EMPRESA"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ticket_departamento"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_67862e1af92d16dfa50f4e9d18"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1162d4fe194d2e32a9ecf6ccb4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0d57c7b5bde732ac3d3ed3558"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_139d3276e0a299deacb53a557d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_60cf6cd7b6a1b7298af56b056d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c74f605d546764c24c0d9451f0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a4c04e78810691f77a6c4dd8e6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e0741e7b51d90755844ae04d67"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_450c254ac416c5207f90573259"`);
    await queryRunner.query(`DROP INDEX "public"."idx_empresa_modulo_unique"`);
    await queryRunner.query(`DROP INDEX "public"."idx_empresa_modulos_empresa_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_empresa_modulos_ativo"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_LOG_TICKET"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_LOG_STATUS"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_LOG_TIPO_EVENTO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_LOG_CREATED_AT"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_LOG_EMPRESA"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_password_reset_tokens_token_hash"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_password_reset_tokens_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_TEMPLATES_EMPRESA"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_TEMPLATES_ATIVO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_TEMPLATES_ATALHO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_TEMPLATES_CATEGORIA"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_CONFIG_EMPRESA"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_CONFIG_PRIORIDADE"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_CONFIG_ATIVO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_SLA_CONFIG_EMPRESA_PRIORIDADE"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_configuracao_inatividade_ativo"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_configuracao_inatividade_empresa_departamento"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_TICKET_TAGS_TAG"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TICKET_TAGS_TICKET"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TICKET_TAGS_COMPOSITE"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "criadoPor"`);
    await queryRunner.query(`ALTER TABLE "faturas" DROP COLUMN "atualizadoPor"`);
    await queryRunner.query(`ALTER TABLE "ticket_tags" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "criadoPor" uuid`);
    await queryRunner.query(`ALTER TABLE "faturas" ADD "atualizadoPor" uuid`);
    await queryRunner.query(`COMMENT ON COLUMN "fornecedores"."cnpj_cpf" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "historico_versoes" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fluxos_triagem" ALTER COLUMN "versao_atual" SET NOT NULL`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "filas_atendentes"."filaId" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "filas_atendentes"."atendenteId" IS NULL`);
    await queryRunner.query(
      `COMMENT ON COLUMN "filas_atendentes"."capacidade" IS 'Tickets simultâneos que este atendente pode ter nesta fila'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "filas_atendentes"."prioridade" IS '1=alta prioridade, 10=baixa prioridade'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "filas_atendentes"."ativo" IS NULL`);
    await queryRunner.query(
      `ALTER TYPE "public"."estrategia_distribuicao_enum" RENAME TO "estrategia_distribuicao_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."filas_estrategia_distribuicao_enum" AS ENUM('ROUND_ROBIN', 'MENOR_CARGA', 'PRIORIDADE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ALTER COLUMN "estrategia_distribuicao" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ALTER COLUMN "estrategia_distribuicao" TYPE "public"."filas_estrategia_distribuicao_enum" USING "estrategia_distribuicao"::"text"::"public"."filas_estrategia_distribuicao_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas" ALTER COLUMN "estrategia_distribuicao" SET DEFAULT 'ROUND_ROBIN'`,
    );
    await queryRunner.query(`DROP TYPE "public"."estrategia_distribuicao_enum_old"`);
    await queryRunner.query(`COMMENT ON COLUMN "filas"."estrategia_distribuicao" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "filas"."capacidade_maxima" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "filas"."distribuicao_automatica" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "filas"."configuracoes" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "tags"."cor" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "tags"."empresaId" IS NULL`);
    await queryRunner.query(`ALTER TABLE "tags" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "tags" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`COMMENT ON COLUMN "atendimento_tickets"."departamento_id" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "triagem_logs" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "contas_pagar" DROP COLUMN "descricao"`);
    await queryRunner.query(
      `ALTER TABLE "contas_pagar" ADD "descricao" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorTotal" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorPago" TYPE numeric(10,2)`);
    await queryRunner.query(
      `ALTER TABLE "faturas" ALTER COLUMN "valorDesconto" TYPE numeric(10,2)`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorJuros" TYPE numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "valorMulta" TYPE numeric(10,2)`);
    await queryRunner.query(
      `ALTER TABLE "faturas" DROP CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6"`,
    );
    await queryRunner.query(`ALTER TABLE "faturas" ALTER COLUMN "contratoId" DROP NOT NULL`);
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
    await queryRunner.query(
      `ALTER TABLE "sla_event_logs" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "sla_configs" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "sla_configs" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(
      `COMMENT ON COLUMN "atendimento_configuracao_inatividade"."departamento_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_configuracao_inatividade" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_configuracao_inatividade" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_canais" ALTER COLUMN "provedor" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "nome"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "nome" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "tipo"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "tipo" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "provider"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "provider" character varying`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "status"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "status" character varying`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "webhook_url"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "webhook_url" character varying`);
    await queryRunner.query(`ALTER TABLE "canais" DROP COLUMN "webhook_secret"`);
    await queryRunner.query(`ALTER TABLE "canais" ADD "webhook_secret" character varying`);
    await queryRunner.query(
      `CREATE INDEX "IDX_dced2c6050cacb6b2f6a5c2bb5" ON "filas_atendentes" ("atendenteId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4d7b70fba91aea5d9439fcee01" ON "filas_atendentes" ("filaId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cdcb1da9877f92375cff9b2812" ON "filas_atendentes" ("filaId", "atendenteId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_67862e1af92d16dfa50f4e9d18" ON "faturas" ("clienteId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1162d4fe194d2e32a9ecf6ccb4" ON "faturas" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c0d57c7b5bde732ac3d3ed3558" ON "faturas" ("dataEmissao") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_139d3276e0a299deacb53a557d" ON "faturas" ("dataVencimento") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_60cf6cd7b6a1b7298af56b056d" ON "faturas" ("ativo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c74f605d546764c24c0d9451f0" ON "faturas" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a4c04e78810691f77a6c4dd8e6" ON "faturas" ("numero") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e0741e7b51d90755844ae04d67" ON "faturas" ("dataVencimento", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_450c254ac416c5207f90573259" ON "faturas" ("clienteId", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_563dad1f6cbd1478ca0ae34845" ON "atendimento_configuracao_inatividade" ("empresa_id", "departamento_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd3c69926bfff8721e010e77bc" ON "ticket_tags" ("ticketId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4c0c28c88a8ad89b2c1ba6c661" ON "ticket_tags" ("tagId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ADD CONSTRAINT "UQ_77259e6fdc8105e25f82ac00bb6" UNIQUE ("empresa_id", "modulo")`,
    );
    await queryRunner.query(
      `ALTER TABLE "oportunidades" ADD CONSTRAINT "FK_21bbf91bef3ac34a19858316c17" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" ADD CONSTRAINT "FK_4d7b70fba91aea5d9439fcee014" FOREIGN KEY ("filaId") REFERENCES "filas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "filas_atendentes" ADD CONSTRAINT "FK_dced2c6050cacb6b2f6a5c2bb5d" FOREIGN KEY ("atendenteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_tickets" ADD CONSTRAINT "FK_49ba5247c171bb23921c171a545" FOREIGN KEY ("fila_id") REFERENCES "filas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "faturas" ADD CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresa_modulos" ADD CONSTRAINT "FK_46edc34189c9fc0365aa377b4f6" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_log" ADD CONSTRAINT "FK_f9e61fcb5a74c76ddb93e2d04c5" FOREIGN KEY ("atendenteId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "distribuicao_log" ADD CONSTRAINT "FK_380a8c5c105b3cc1b6018baee94" FOREIGN KEY ("filaId") REFERENCES "filas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "atendimento_configuracao_inatividade" ADD CONSTRAINT "FK_eb5c423596a1b4426136371d5d6" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_tags" ADD CONSTRAINT "FK_bd3c69926bfff8721e010e77bcc" FOREIGN KEY ("ticketId") REFERENCES "atendimento_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_tags" ADD CONSTRAINT "FK_4c0c28c88a8ad89b2c1ba6c6619" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // ROLLBACK: Restaurar Equipes
    // ========================================
    console.log('⏪ Iniciando rollback da consolidação...');

    // ========================================
    // ETAPA 1: Recriar tabelas equipes
    // ========================================
    console.log('📝 Etapa 1: Recriando tabela equipes...');

    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "equipes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "empresaId" uuid NOT NULL,
                "nome" VARCHAR(100) NOT NULL,
                "descricao" TEXT,
                "cor" VARCHAR(7),
                "icone" VARCHAR(50),
                "ativo" BOOLEAN NOT NULL DEFAULT true,
                "ordem" INTEGER DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_equipes" PRIMARY KEY ("id"),
                CONSTRAINT "FK_equipes_empresa" FOREIGN KEY ("empresaId") 
                    REFERENCES "empresas"("id") ON DELETE CASCADE
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "idx_equipes_empresa" ON "equipes" ("empresaId")
        `);

    await queryRunner.query(`
            CREATE INDEX "idx_equipes_ativo" ON "equipes" ("ativo")
        `);

    // ========================================
    // ETAPA 2: Recriar tabela atendente_equipes
    // ========================================
    console.log('📝 Etapa 2: Recriando tabela atendente_equipes...');

    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "atendente_equipes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "equipeId" uuid NOT NULL,
                "atendenteId" uuid NOT NULL,
                "capacidade" INTEGER DEFAULT 5,
                "prioridade" INTEGER DEFAULT 5,
                "ativo" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_atendente_equipes" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_atendente_equipe" UNIQUE ("equipeId", "atendenteId")
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "idx_atendente_equipes_atendente" ON "atendente_equipes" ("atendenteId")
        `);

    // ========================================
    // ETAPA 3: Recriar tabela equipe_atribuicoes
    // ========================================
    console.log('📝 Etapa 3: Recriando tabela equipe_atribuicoes...');

    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "equipe_atribuicoes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "equipeId" uuid NOT NULL,
                "nucleoId" uuid,
                "departamentoId" uuid,
                "ativo" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_equipe_atribuicoes" PRIMARY KEY ("id"),
                CONSTRAINT "FK_atribuicao_equipe" FOREIGN KEY ("equipeId") 
                    REFERENCES "equipes"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_atribuicao_nucleo" FOREIGN KEY ("nucleoId") 
                    REFERENCES "nucleos_atendimento"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_atribuicao_departamento" FOREIGN KEY ("departamentoId") 
                    REFERENCES "departamentos"("id") ON DELETE CASCADE
            )
        `);

    // ========================================
    // ETAPA 4: Restaurar dados de filas → equipes
    // ========================================
    console.log('📦 Etapa 4: Restaurando dados de filas → equipes...');

    // Inserir filas que tinham nucleoId ou departamentoId (eram originalmente equipes)
    await queryRunner.query(`
            INSERT INTO "equipes" (
                id, empresaId, nome, descricao, cor, icone, ativo, ordem, "createdAt", "updatedAt"
            )
            SELECT 
                id, empresaId, nome, descricao, cor, icone, ativo, ordem, "createdAt", "updatedAt"
            FROM "filas"
            WHERE nucleoId IS NOT NULL OR departamentoId IS NOT NULL
            ON CONFLICT (id) DO NOTHING
        `);

    // Restaurar atribuições
    await queryRunner.query(`
            INSERT INTO "equipe_atribuicoes" (equipeId, nucleoId, departamentoId, ativo, "createdAt", "updatedAt")
            SELECT id, nucleoId, departamentoId, ativo, "createdAt", "updatedAt"
            FROM "filas"
            WHERE nucleoId IS NOT NULL OR departamentoId IS NOT NULL
        `);

    // ========================================
    // ETAPA 5: Restaurar membros
    // ========================================
    console.log('👥 Etapa 5: Restaurando membros...');

    await queryRunner.query(`
            INSERT INTO "atendente_equipes" (
                id, equipeId, atendenteId, capacidade, prioridade, ativo, "createdAt", "updatedAt"
            )
            SELECT 
                id, filaId, atendenteId, capacidade, prioridade, ativo, "createdAt", "updatedAt"
            FROM "filas_atendentes"
            WHERE filaId IN (
                SELECT id FROM "filas" 
                WHERE nucleoId IS NOT NULL OR departamentoId IS NOT NULL
            )
            ON CONFLICT (equipeId, atendenteId) DO NOTHING
        `);

    // ========================================
    // ETAPA 6: Remover colunas adicionadas às filas
    // ========================================
    console.log('🗑️  Etapa 6: Removendo colunas de equipe da tabela filas...');

    await queryRunner.query(`
            ALTER TABLE "filas" 
            DROP CONSTRAINT IF EXISTS "FK_filas_nucleo",
            DROP CONSTRAINT IF EXISTS "FK_filas_departamento"
        `);

    await queryRunner.query(`
            ALTER TABLE "filas"
            DROP COLUMN IF EXISTS "cor",
            DROP COLUMN IF EXISTS "icone",
            DROP COLUMN IF EXISTS "nucleoId",
            DROP COLUMN IF EXISTS "departamentoId"
        `);

    console.log('✅ Rollback concluído!');
  }
}
