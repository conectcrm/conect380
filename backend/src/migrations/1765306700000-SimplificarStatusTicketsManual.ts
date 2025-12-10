import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplificarStatusTicketsManual1765306700000 implements MigrationInterface {
  name = 'SimplificarStatusTicketsManual1765306700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
      CREATE TYPE atendimento_tickets_status_enum AS ENUM ('FILA', 'EM_ATENDIMENTO', 'ENVIO_ATIVO', 'ENCERRADO')
    `);

    // 3. Alterar coluna VARCHAR para ENUM
    await queryRunner.query(`
      ALTER TABLE atendimento_tickets
      ALTER COLUMN status TYPE atendimento_tickets_status_enum
      USING status::atendimento_tickets_status_enum
    `);

    // 4. Definir valor padrão
    await queryRunner.query(`
      ALTER TABLE atendimento_tickets
      ALTER COLUMN status SET DEFAULT 'FILA'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
