import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAgendaEventosTable1765000000000 implements MigrationInterface {
  name = 'CreateAgendaEventosTable1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agenda_eventos_status_enum') THEN
          CREATE TYPE "public"."agenda_eventos_status_enum" AS ENUM('confirmado', 'pendente', 'cancelado');
        END IF;
      END
      $$
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agenda_eventos_prioridade_enum') THEN
          CREATE TYPE "public"."agenda_eventos_prioridade_enum" AS ENUM('alta', 'media', 'baixa');
        END IF;
      END
      $$
    `);

    // Tabela
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agenda_eventos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "titulo" character varying(255) NOT NULL,
        "descricao" text,
        "inicio" TIMESTAMP NOT NULL,
        "fim" TIMESTAMP,
        "all_day" boolean NOT NULL DEFAULT false,
        "status" "public"."agenda_eventos_status_enum" NOT NULL DEFAULT 'confirmado',
        "prioridade" "public"."agenda_eventos_prioridade_enum" NOT NULL DEFAULT 'media',
        "local" character varying(255),
        "color" character varying(20),
        "attendees" jsonb,
        "interacao_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_agenda_eventos" PRIMARY KEY ("id")
      )
    `);

    // Índices
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_agenda_eventos_empresa_id" ON "agenda_eventos" ("empresa_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_agenda_eventos_inicio" ON "agenda_eventos" ("inicio")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_agenda_eventos_status" ON "agenda_eventos" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_agenda_eventos_prioridade" ON "agenda_eventos" ("prioridade")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_agenda_eventos_interacao_id" ON "agenda_eventos" ("interacao_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_agenda_eventos_created_at" ON "agenda_eventos" ("created_at")`);

    // FKs
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_agenda_eventos_empresa'
            AND table_name = 'agenda_eventos'
            AND table_schema = 'public'
        ) THEN
          ALTER TABLE "agenda_eventos"
          ADD CONSTRAINT "FK_agenda_eventos_empresa"
          FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_agenda_eventos_interacao'
            AND table_name = 'agenda_eventos'
            AND table_schema = 'public'
        ) THEN
          ALTER TABLE "agenda_eventos"
          ADD CONSTRAINT "FK_agenda_eventos_interacao"
          FOREIGN KEY ("interacao_id") REFERENCES "interacoes"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$
    `);

    // ⚡ MULTI-TENANT: Habilitar RLS
    await queryRunner.query(`
      ALTER TABLE "agenda_eventos" ENABLE ROW LEVEL SECURITY;
    `);

    // ⚡ MULTI-TENANT: Criar política de isolamento
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_agenda_eventos ON agenda_eventos
        FOR ALL USING (empresa_id = get_current_tenant());
    `);

    console.log('✅ Tabela agenda_eventos criada com RLS ativo');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS agenda_eventos_isolation_policy ON "agenda_eventos"`);
    await queryRunner.query(`ALTER TABLE "agenda_eventos" DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`ALTER TABLE "agenda_eventos" DROP CONSTRAINT IF EXISTS "FK_agenda_eventos_interacao"`);
    await queryRunner.query(`ALTER TABLE "agenda_eventos" DROP CONSTRAINT IF EXISTS "FK_agenda_eventos_empresa"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agenda_eventos_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agenda_eventos_interacao_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agenda_eventos_prioridade"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agenda_eventos_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agenda_eventos_inicio"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agenda_eventos_empresa_id"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "agenda_eventos"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "agenda_eventos_prioridade_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "agenda_eventos_status_enum"`);
  }
}
