import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para criar tabela de contatos vinculados a clientes
 * 
 * Permite que um Cliente (empresa) tenha múltiplos Contatos (funcionários)
 * vinculados, facilitando o atendimento e identificação de quem está falando
 * durante o atendimento.
 */
export class CreateContatosTable1744690800000 implements MigrationInterface {
  name = 'CreateContatosTable1744690800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela de contatos
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contatos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Dados do contato
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        telefone VARCHAR(50) NOT NULL,
        cargo VARCHAR(100),
        
        -- Flags
        ativo BOOLEAN DEFAULT TRUE,
        principal BOOLEAN DEFAULT FALSE,
        
        -- Relacionamento com cliente
        "clienteId" UUID NOT NULL,
        
        -- Observações
        observacoes TEXT,
        
        -- Timestamps
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        
        -- Foreign Key
        CONSTRAINT fk_contatos_cliente 
          FOREIGN KEY ("clienteId") 
          REFERENCES clientes(id) 
          ON DELETE CASCADE
      )
    `);

    // Índices para performance
    await queryRunner.query(`
      CREATE INDEX idx_contatos_clienteId ON contatos("clienteId")
    `);

    await queryRunner.query(`
      CREATE INDEX idx_contatos_telefone ON contatos(telefone)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_contatos_ativo ON contatos(ativo)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_contatos_principal ON contatos(principal)
    `);

    // Comentários na tabela
    await queryRunner.query(`
      COMMENT ON TABLE contatos IS 'Contatos (funcionários) vinculados a clientes (empresas)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN contatos."clienteId" IS 'Cliente (empresa) ao qual o contato pertence'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN contatos.principal IS 'Se true, é o contato principal da empresa'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN contatos.cargo IS 'Cargo do contato na empresa (ex: Gerente, Comprador, Financeiro)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_contatos_principal`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_contatos_ativo`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_contatos_telefone`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_contatos_clienteId`);

    // Remover tabela
    await queryRunner.query(`DROP TABLE IF EXISTS contatos`);
  }
}
