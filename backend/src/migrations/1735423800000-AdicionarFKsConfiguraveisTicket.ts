import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Adicionar FKs Configuráveis ao Ticket
 *
 * Adiciona 3 novas colunas FK para substituir os enums:
 * - nivel_atendimento_id (FK niveis_atendimento) - substitui assignedLevel enum
 * - status_customizado_id (FK status_customizados) - NOVO campo (antes não tinha FK)
 * - tipo_servico_id (FK tipos_servico) - substitui tipo enum
 *
 * ESTRATÉGIA: Migração gradual
 * 1. Adiciona novas colunas (nullable)
 * 2. Mantém enums antigos por enquanto
 * 3. Próxima migration fará migração de dados
 * 4. Depois remove enums
 */
export class AdicionarFKsConfiguraveisTicket1735423800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔧 Adicionando colunas FK configuráveis ao Ticket...');

    // 1. Adicionar coluna nivel_atendimento_id
    await queryRunner.query(`
      ALTER TABLE atendimento_tickets 
      ADD COLUMN nivel_atendimento_id UUID
    `);

    // 2. Adicionar coluna status_customizado_id
    await queryRunner.query(`
      ALTER TABLE atendimento_tickets 
      ADD COLUMN status_customizado_id UUID
    `);

    // 3. Adicionar coluna tipo_servico_id
    await queryRunner.query(`
      ALTER TABLE atendimento_tickets 
      ADD COLUMN tipo_servico_id UUID
    `);

    // 4. Criar índices para performance
    await queryRunner.query(`
      CREATE INDEX idx_tickets_nivel_atendimento 
      ON atendimento_tickets(nivel_atendimento_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tickets_status_customizado 
      ON atendimento_tickets(status_customizado_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tickets_tipo_servico 
      ON atendimento_tickets(tipo_servico_id)
    `);

    // 5. Adicionar Foreign Keys
    await queryRunner.query(`
      ALTER TABLE atendimento_tickets 
      ADD CONSTRAINT fk_ticket_nivel_atendimento 
      FOREIGN KEY (nivel_atendimento_id) 
      REFERENCES niveis_atendimento(id) 
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE atendimento_tickets 
      ADD CONSTRAINT fk_ticket_status_customizado 
      FOREIGN KEY (status_customizado_id) 
      REFERENCES status_customizados(id) 
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE atendimento_tickets 
      ADD CONSTRAINT fk_ticket_tipo_servico 
      FOREIGN KEY (tipo_servico_id) 
      REFERENCES tipos_servico(id) 
      ON DELETE SET NULL
    `);

    console.log('✅ Colunas FK adicionadas com sucesso!');
    console.log(
      '⚠️  NOTA: Enums antigos ainda estão presentes. Execute a próxima migration para migrar dados.',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Revertendo adição de FKs configuráveis...');

    // Remover FKs
    await queryRunner.query(`
      ALTER TABLE atendimento_tickets 
      DROP CONSTRAINT IF EXISTS fk_ticket_tipo_servico
    `);

    await queryRunner.query(`
      ALTER TABLE atendimento_tickets 
      DROP CONSTRAINT IF EXISTS fk_ticket_status_customizado
    `);

    await queryRunner.query(`
      ALTER TABLE atendimento_tickets 
      DROP CONSTRAINT IF EXISTS fk_ticket_nivel_atendimento
    `);

    // Remover índices
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_tickets_tipo_servico
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_tickets_status_customizado
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_tickets_nivel_atendimento
    `);

    // Remover colunas
    await queryRunner.query(`
      ALTER TABLE atendimento_tickets 
      DROP COLUMN IF EXISTS tipo_servico_id
    `);

    await queryRunner.query(`
      ALTER TABLE atendimento_tickets 
      DROP COLUMN IF EXISTS status_customizado_id
    `);

    await queryRunner.query(`
      ALTER TABLE atendimento_tickets 
      DROP COLUMN IF EXISTS nivel_atendimento_id
    `);

    console.log('✅ Rollback concluído!');
  }
}
