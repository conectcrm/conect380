import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeadsTable1762962000000 implements MigrationInterface {
  name = 'CreateLeadsTable1762962000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para status do lead
    await queryRunner.query(`
      CREATE TYPE "leads_status_enum" AS ENUM('novo', 'contatado', 'qualificado', 'convertido', 'perdido')
    `);

    // Criar enum para origem do lead
    await queryRunner.query(`
      CREATE TYPE "leads_origem_enum" AS ENUM('site', 'formulario', 'telefone', 'email', 'chat', 'indicacao', 'outros')
    `);

    // Criar tabela leads
    await queryRunner.query(`
      CREATE TABLE "leads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nome" character varying(255) NOT NULL,
        "email" character varying(255),
        "telefone" character varying(50),
        "empresa_nome" character varying(255),
        "status" "leads_status_enum" NOT NULL DEFAULT 'novo',
        "score" integer NOT NULL DEFAULT '0',
        "origem" "leads_origem_enum",
        "observacoes" text,
        "campos_customizados" jsonb,
        "responsavel_id" uuid,
        "empresa_id" uuid NOT NULL,
        "oportunidade_id" integer,
        "convertido_em" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leads" PRIMARY KEY ("id")
      )
    `);

    // Criar índices
    await queryRunner.query(`
      CREATE INDEX "IDX_leads_empresa_id" ON "leads" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leads_status" ON "leads" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leads_responsavel_id" ON "leads" ("responsavel_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leads_created_at" ON "leads" ("created_at")
    `);

    // Criar foreign keys
    await queryRunner.query(`
      ALTER TABLE "leads" 
      ADD CONSTRAINT "FK_leads_empresa" 
      FOREIGN KEY ("empresa_id") 
      REFERENCES "empresas"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "leads" 
      ADD CONSTRAINT "FK_leads_responsavel" 
      FOREIGN KEY ("responsavel_id") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "leads" 
      ADD CONSTRAINT "FK_leads_oportunidade" 
      FOREIGN KEY ("oportunidade_id") 
      REFERENCES "oportunidades"("id") 
      ON DELETE SET NULL 
      ON UPDATE NO ACTION
    `);

    // Habilitar RLS (Row Level Security) para isolamento multi-tenant
    await queryRunner.query(`
      ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY
    `);

    // Criar política RLS
    await queryRunner.query(`
      CREATE POLICY leads_isolation_policy ON leads
      USING (empresa_id = current_setting('app.current_tenant')::uuid)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover política RLS
    await queryRunner.query(`DROP POLICY IF EXISTS leads_isolation_policy ON leads`);

    // Desabilitar RLS
    await queryRunner.query(`ALTER TABLE "leads" DISABLE ROW LEVEL SECURITY`);

    // Remover foreign keys
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "FK_leads_oportunidade"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "FK_leads_responsavel"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "FK_leads_empresa"`);

    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_responsavel_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_empresa_id"`);

    // Remover tabela
    await queryRunner.query(`DROP TABLE IF EXISTS "leads"`);

    // Remover enums
    await queryRunner.query(`DROP TYPE IF EXISTS "leads_origem_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "leads_status_enum"`);
  }
}
