import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserActivitiesTable1658746201234 implements MigrationInterface {
    name = 'CreateUserActivitiesTable1658746201234'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar se a tabela já existe
        const tableExists = await queryRunner.hasTable('user_activities');
        if (!tableExists) {
            await queryRunner.query(`
                CREATE TABLE "user_activities" (
                    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                    "usuario_id" UUID NOT NULL,
                    "empresa_id" UUID NOT NULL,
                    "tipo" VARCHAR(50) NOT NULL,
                    "descricao" VARCHAR(255) NOT NULL,
                    "detalhes" TEXT,
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_user_activities" PRIMARY KEY ("id"),
                    CONSTRAINT "FK_usuario_activities" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE
                )
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "user_activities"`);
    }
}
