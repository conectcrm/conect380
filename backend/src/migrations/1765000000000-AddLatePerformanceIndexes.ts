import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Complementa a migração AddPerformanceIndexes criando os índices
 * que dependem das tabelas de atendimento e financeiro, as quais
 * só passam a existir em migrações posteriores.
 */
export class AddLatePerformanceIndexes1765000000000 implements MigrationInterface {
  name = 'AddLatePerformanceIndexes1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 [Migration] Criando índices de atendimento/financeiro...');

    const atendimentoTicketsExists = await queryRunner.hasTable('atendimento_tickets');
    if (atendimentoTicketsExists) {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_atendimento_tickets_empresa_status"
        ON "atendimento_tickets"("empresa_id", "status");
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_atendimento_tickets_created_at"
        ON "atendimento_tickets"("created_at" DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_atendimento_tickets_empresa_status_priority"
        ON "atendimento_tickets"("empresa_id", "status", "prioridade");
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_atendimento_tickets_priority"
        ON "atendimento_tickets"("prioridade");
      `);
    } else {
      console.log('ℹ️ [Migration] Tabela atendimento_tickets ainda não existe. Índices serão pulados.');
    }

    const atendimentoMensagensExists = await queryRunner.hasTable('atendimento_mensagens');
    if (atendimentoMensagensExists) {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_atendimento_mensagens_ticket_id"
        ON "atendimento_mensagens"("ticket_id");
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_atendimento_mensagens_created_at"
        ON "atendimento_mensagens"("created_at" DESC);
      `);
    } else {
      console.log('ℹ️ [Migration] Tabela atendimento_mensagens ainda não existe. Índices serão pulados.');
    }

    const faturasExists = await queryRunner.hasTable('faturas');
    if (faturasExists) {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_faturas_empresa_status"
        ON "faturas"("empresa_id", "status");
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_faturas_vencimento"
        ON "faturas"("dataVencimento" DESC);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_faturas_empresa_status_vencimento"
        ON "faturas"("empresa_id", "status", "dataVencimento" DESC);
      `);
    } else {
      console.log('ℹ️ [Migration] Tabela faturas ainda não existe. Índices serão pulados.');
    }

    const itensFaturaExists = await queryRunner.hasTable('itens_fatura');
    if (itensFaturaExists) {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_itens_fatura_fatura_id"
        ON "itens_fatura"("faturaId");
      `);
    } else {
      console.log('ℹ️ [Migration] Tabela itens_fatura ainda não existe. Índice será pulado.');
    }

    console.log('✅ [Migration] Índices adicionais de atendimento/financeiro processados.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 [Migration] Removendo índices de atendimento/financeiro...');

    const indexes = [
      'IDX_itens_fatura_fatura_id',
      'IDX_faturas_empresa_status_vencimento',
      'IDX_faturas_vencimento',
      'IDX_faturas_empresa_status',
      'IDX_atendimento_mensagens_created_at',
      'IDX_atendimento_mensagens_ticket_id',
      'IDX_atendimento_tickets_priority',
      'IDX_atendimento_tickets_empresa_status_priority',
      'IDX_atendimento_tickets_created_at',
      'IDX_atendimento_tickets_empresa_status',
    ];

    for (const index of indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${index}";`);
    }

    console.log('✅ [Migration] Índices de atendimento/financeiro removidos.');
  }
}
