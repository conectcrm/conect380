import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplificarStatusTicketsManual1765306700000 implements MigrationInterface {
  name = 'SimplificarStatusTicketsManual1765306700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTickets = await queryRunner.hasTable('atendimento_tickets');
    if (!hasTickets) return;

    // 1. Mapear status antigos para novos
    await queryRunner.query(`
      UPDATE atendimento_tickets
      SET status = CASE
        WHEN status = 'ABERTO' THEN 'FILA'
        WHEN status = 'EM_ATENDIMENTO' THEN 'EM_ATENDIMENTO'
        WHEN status = 'AGUARDANDO' THEN 'ENVIO_ATIVO'
        WHEN status = 'RESOLVIDO' THEN 'ENCERRADO'
        WHEN status = 'FECHADO' THEN 'ENCERRADO'
        ELSE status
      END
    `);

    // 2. Criar novo tipo enum com 4 valores (coluna é VARCHAR atualmente)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'atendimento_tickets_status_enum') THEN
          CREATE TYPE atendimento_tickets_status_enum AS ENUM ('FILA', 'EM_ATENDIMENTO', 'ENVIO_ATIVO', 'ENCERRADO');
        END IF;
      END
      $$
    `);

    // 3. Alterar coluna VARCHAR para ENUM
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'atendimento_tickets'
            AND column_name = 'status'
            AND udt_name <> 'atendimento_tickets_status_enum'
        ) AND (
          SELECT COUNT(*)
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'atendimento_tickets_status_enum'
            AND e.enumlabel IN ('FILA', 'EM_ATENDIMENTO', 'ENVIO_ATIVO', 'ENCERRADO')
        ) = 4 THEN
          ALTER TABLE atendimento_tickets
          ALTER COLUMN status DROP DEFAULT;

          ALTER TABLE atendimento_tickets
          ALTER COLUMN status TYPE atendimento_tickets_status_enum
          USING status::text::atendimento_tickets_status_enum;
        END IF;
      END
      $$
    `);

    // 4. Definir valor padrão
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'atendimento_tickets'
            AND column_name = 'status'
            AND udt_name = 'atendimento_tickets_status_enum'
        ) AND EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'atendimento_tickets_status_enum'
            AND e.enumlabel = 'FILA'
        ) THEN
          ALTER TABLE atendimento_tickets
          ALTER COLUMN status SET DEFAULT 'FILA';
        END IF;
      END
      $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTickets = await queryRunner.hasTable('atendimento_tickets');
    if (!hasTickets) {
      await queryRunner.query(`DROP TYPE IF EXISTS atendimento_tickets_status_enum`);
      return;
    }

    // Reverter para 5 status originais (voltar VARCHAR)

    // 1. Alterar coluna de ENUM para VARCHAR
    await queryRunner.query(`
      ALTER TABLE atendimento_tickets
      ALTER COLUMN status TYPE VARCHAR(50) USING status::text
    `);

    // 2. Remover enum
    await queryRunner.query(`DROP TYPE IF EXISTS atendimento_tickets_status_enum`);

    // 3. Converter valores de volta
    await queryRunner.query(`
      UPDATE atendimento_tickets
      SET status = CASE
        WHEN status = 'FILA' THEN 'ABERTO'
        WHEN status = 'EM_ATENDIMENTO' THEN 'EM_ATENDIMENTO'
        WHEN status = 'ENVIO_ATIVO' THEN 'AGUARDANDO'
        WHEN status = 'ENCERRADO' THEN 'FECHADO'
        ELSE 'ABERTO'
      END
    `);
  }
}
