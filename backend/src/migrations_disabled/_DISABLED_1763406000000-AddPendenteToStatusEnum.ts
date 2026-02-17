import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendenteToStatusEnum1763406000000 implements MigrationInterface {
  name = 'AddPendenteToStatusEnum1763406000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar 'pendente' ao enum cotacoes_status_enum (se ainda não existir)
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_enum 
                    WHERE enumlabel = 'pendente' 
                    AND enumtypid = (
                        SELECT oid FROM pg_type WHERE typname = 'cotacoes_status_enum'
                    )
                ) THEN
                    ALTER TYPE "cotacoes_status_enum" ADD VALUE 'pendente';
                END IF;
            END$$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Nota: Não é possível remover valores de enum no PostgreSQL
    // A reversão requer recriar o enum completamente
    console.log('⚠️  Reversão não implementada: PostgreSQL não permite remover valores de enum');
  }
}
