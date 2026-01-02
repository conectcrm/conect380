import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMotivosPerdaSLAOportunidades1764680400000 implements MigrationInterface {
  name = 'AddMotivosPerdaSLAOportunidades1764680400000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna motivo_perda (enum)
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'oportunidades_motivo_perda_enum') THEN
                    CREATE TYPE "oportunidades_motivo_perda_enum" AS ENUM (
                        'preco',
                        'concorrente',
                        'timing',
                        'orcamento',
                        'produto',
                        'projeto_cancelado',
                        'sem_resposta',
                        'outro'
                    );
                END IF;
            END
            $$;
        `);

    await queryRunner.query(`
            ALTER TABLE "oportunidades" 
            ADD COLUMN IF NOT EXISTS "motivo_perda" "oportunidades_motivo_perda_enum"
        `);

    // Adicionar coluna motivo_perda_detalhes
    await queryRunner.query(`
            ALTER TABLE "oportunidades" 
            ADD COLUMN IF NOT EXISTS "motivo_perda_detalhes" text
        `);

    // Adicionar coluna concorrente_nome
    await queryRunner.query(`
            ALTER TABLE "oportunidades" 
            ADD COLUMN IF NOT EXISTS "concorrente_nome" character varying(100)
        `);

    // Adicionar coluna data_revisao
    await queryRunner.query(`
            ALTER TABLE "oportunidades" 
            ADD COLUMN IF NOT EXISTS "data_revisao" TIMESTAMP
        `);

    // Adicionar coluna data_ultima_mudanca_estagio
    await queryRunner.query(`
            ALTER TABLE "oportunidades" 
            ADD COLUMN IF NOT EXISTS "data_ultima_mudanca_estagio" TIMESTAMP DEFAULT now()
        `);

    // Adicionar coluna dias_no_estagio_atual
    await queryRunner.query(`
            ALTER TABLE "oportunidades" 
            ADD COLUMN IF NOT EXISTS "dias_no_estagio_atual" integer NOT NULL DEFAULT 0
        `);

    // Adicionar coluna precisa_atencao
    await queryRunner.query(`
            ALTER TABLE "oportunidades" 
            ADD COLUMN IF NOT EXISTS "precisa_atencao" boolean NOT NULL DEFAULT false
        `);

    // Criar índices para performance
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_oportunidades_motivo_perda" 
            ON "oportunidades" ("motivo_perda") 
            WHERE "motivo_perda" IS NOT NULL
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_oportunidades_precisa_atencao" 
            ON "oportunidades" ("precisa_atencao") 
            WHERE "precisa_atencao" = true
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_oportunidades_dias_estagio" 
            ON "oportunidades" ("dias_no_estagio_atual", "estagio")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX "public"."IDX_oportunidades_dias_estagio"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_oportunidades_precisa_atencao"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_oportunidades_motivo_perda"`);

    // Remover colunas
    await queryRunner.query(`ALTER TABLE "oportunidades" DROP COLUMN "precisa_atencao"`);
    await queryRunner.query(`ALTER TABLE "oportunidades" DROP COLUMN "dias_no_estagio_atual"`);
    await queryRunner.query(`ALTER TABLE "oportunidades" DROP COLUMN "data_ultima_mudanca_estagio"`);
    await queryRunner.query(`ALTER TABLE "oportunidades" DROP COLUMN "data_revisao"`);
    await queryRunner.query(`ALTER TABLE "oportunidades" DROP COLUMN "concorrente_nome"`);
    await queryRunner.query(`ALTER TABLE "oportunidades" DROP COLUMN "motivo_perda_detalhes"`);
    await queryRunner.query(`ALTER TABLE "oportunidades" DROP COLUMN "motivo_perda"`);

    // Remover enum type
    await queryRunner.query(`DROP TYPE "oportunidades_motivo_perda_enum"`);
  }
}
