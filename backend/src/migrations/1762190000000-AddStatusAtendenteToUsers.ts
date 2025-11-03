import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusAtendenteToUsers1762190000000 implements MigrationInterface {
    name = 'AddStatusAtendenteToUsers1762190000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Criar enum para status de atendente
        await queryRunner.query(`
            CREATE TYPE "public"."users_status_atendente_enum" AS ENUM('DISPONIVEL', 'OCUPADO', 'AUSENTE', 'OFFLINE')
        `);

        // 2. Adicionar colunas na tabela users
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD "status_atendente" "public"."users_status_atendente_enum"
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD "capacidade_maxima" integer DEFAULT 5
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD "tickets_ativos" integer DEFAULT 0
        `);

        console.log('🔄 Migrando dados de atendentes para users...');

        // 3. Migrar atendentes que já têm usuarioId
        await queryRunner.query(`
            UPDATE users
            SET 
                status_atendente = CASE 
                    WHEN atendentes.status = 'DISPONIVEL' THEN 'DISPONIVEL'::users_status_atendente_enum
                    WHEN atendentes.status = 'OCUPADO' THEN 'OCUPADO'::users_status_atendente_enum
                    WHEN atendentes.status = 'AUSENTE' THEN 'AUSENTE'::users_status_atendente_enum
                    ELSE 'OFFLINE'::users_status_atendente_enum
                END,
                capacidade_maxima = atendentes."capacidadeMaxima",
                tickets_ativos = atendentes."ticketsAtivos",
                permissoes = CASE 
                    WHEN users.permissoes IS NULL THEN 'ATENDIMENTO'
                    WHEN users.permissoes NOT LIKE '%ATENDIMENTO%' THEN users.permissoes || ',ATENDIMENTO'
                    ELSE users.permissoes
                END
            FROM atendentes
            WHERE users.id = atendentes."usuarioId"
                AND atendentes."deletedAt" IS NULL
        `);

        console.log('✅ Atendentes linkados migrados');

        // 4. Migrar atendentes órfãos (criar novos users)
        await queryRunner.query(`
            INSERT INTO users (
                id,
                nome,
                email,
                senha,
                role,
                empresa_id,
                permissoes,
                status_atendente,
                capacidade_maxima,
                tickets_ativos,
                ativo,
                idioma_preferido,
                created_at,
                updated_at
            )
            SELECT 
                gen_random_uuid(),
                atendentes.nome,
                atendentes.email,
                '$2b$10$dummy.hash.for.migrated.atendentes',
                'user',
                atendentes."empresaId",
                'ATENDIMENTO',
                CASE 
                    WHEN atendentes.status = 'DISPONIVEL' THEN 'DISPONIVEL'::users_status_atendente_enum
                    WHEN atendentes.status = 'OCUPADO' THEN 'OCUPADO'::users_status_atendente_enum
                    WHEN atendentes.status = 'AUSENTE' THEN 'AUSENTE'::users_status_atendente_enum
                    ELSE 'OFFLINE'::users_status_atendente_enum
                END,
                atendentes."capacidadeMaxima",
                atendentes."ticketsAtivos",
                true,
                'pt-BR',
                atendentes."createdAt",
                atendentes."updatedAt"
            FROM atendentes
            WHERE atendentes."usuarioId" IS NULL
                AND atendentes."deletedAt" IS NULL
                AND NOT EXISTS (
                    SELECT 1 FROM users WHERE users.email = atendentes.email
                )
        `);

        console.log('✅ Atendentes órfãos migrados como novos users');

        // 5. Contagem final
        const result = await queryRunner.query(`
            SELECT COUNT(*) as total 
            FROM users 
            WHERE permissoes LIKE '%ATENDIMENTO%'
        `);

        console.log(`ℹ️  Total: ${result[0].total} usuários com permissão ATENDIMENTO`);
        console.log('⚠️  IMPORTANTE: Tabela "atendentes" mantida como backup');
        console.log('   Para remover após validação: DROP TABLE atendentes;');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverter mudanças
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "tickets_ativos"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "capacidade_maxima"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status_atendente"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_atendente_enum"`);
        
        console.log('⚠️  ATENÇÃO: Dados de atendentes migrados não foram revertidos!');
        console.log('   Usuários criados/modificados permanecem na tabela users.');
    }
}
