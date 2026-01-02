import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class EnsureTriagemLogsForeignKeys1765000002000 implements MigrationInterface {
  name = 'EnsureTriagemLogsForeignKeys1765000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const triagemLogsExists = await queryRunner.hasTable('triagem_logs');
    if (!triagemLogsExists) {
      console.log('ℹ️ [Migration] Tabela triagem_logs não encontrada. Nada a fazer.');
      return;
    }

    const table = await queryRunner.getTable('triagem_logs');

    const sessoesExists = await queryRunner.hasTable('sessoes_triagem');
    const hasSessaoFk = table?.foreignKeys.some((fk) => fk.name === 'fk_triagem_logs_sessao');
    if (sessoesExists && !hasSessaoFk) {
      await queryRunner.createForeignKey(
        'triagem_logs',
        new TableForeignKey({
          columnNames: ['sessao_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'sessoes_triagem',
          onDelete: 'SET NULL',
          name: 'fk_triagem_logs_sessao',
        }),
      );
      console.log('✅ [Migration] FK fk_triagem_logs_sessao criada.');
    }

    const fluxosExists = await queryRunner.hasTable('fluxos_triagem');
    const hasFluxoFk = table?.foreignKeys.some((fk) => fk.name === 'fk_triagem_logs_fluxo');
    if (fluxosExists && !hasFluxoFk) {
      await queryRunner.createForeignKey(
        'triagem_logs',
        new TableForeignKey({
          columnNames: ['fluxo_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'fluxos_triagem',
          onDelete: 'SET NULL',
          name: 'fk_triagem_logs_fluxo',
        }),
      );
      console.log('✅ [Migration] FK fk_triagem_logs_fluxo criada.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const triagemLogsExists = await queryRunner.hasTable('triagem_logs');
    if (!triagemLogsExists) {
      return;
    }

    const table = await queryRunner.getTable('triagem_logs');

    const sessaoFk = table?.foreignKeys.find((fk) => fk.name === 'fk_triagem_logs_sessao');
    if (sessaoFk) {
      await queryRunner.dropForeignKey('triagem_logs', sessaoFk);
    }

    const fluxoFk = table?.foreignKeys.find((fk) => fk.name === 'fk_triagem_logs_fluxo');
    if (fluxoFk) {
      await queryRunner.dropForeignKey('triagem_logs', fluxoFk);
    }
  }
}
