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

    // Garantir compatibilidade com schemas onde "contatos" já existia
    // - Se existir cliente_id (snake_case), renomeia para "clienteId"
    // - Se não existir nenhum, cria "clienteId"
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'contatos'
        ) THEN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'contatos' AND column_name = 'clienteId'
          ) THEN
            IF EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'contatos' AND column_name = 'cliente_id'
            ) THEN
              EXECUTE 'ALTER TABLE contatos RENAME COLUMN cliente_id TO "clienteId"';
            ELSE
              EXECUTE 'ALTER TABLE contatos ADD COLUMN "clienteId" uuid';
            END IF;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'contatos' AND column_name = 'empresa_id'
          ) THEN
            EXECUTE 'ALTER TABLE contatos ADD COLUMN empresa_id uuid';
          END IF;
        END IF;
      END $$;
    `);

    // Backfill empresa_id a partir de clientes, quando possível
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema='public' AND table_name='clientes'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='clientes' AND column_name='empresa_id'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='contatos' AND column_name='empresa_id'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='contatos' AND column_name='clienteId'
        ) THEN
          EXECUTE '
            UPDATE contatos c
            SET empresa_id = cl.empresa_id
            FROM clientes cl
            WHERE c."clienteId" = cl.id
              AND c.empresa_id IS NULL
          ';
        END IF;
      END $$;
    `);

    // Enforce NOT NULL em empresa_id apenas quando estiver tudo preenchido
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='contatos' AND column_name='empresa_id'
        ) THEN
          IF NOT EXISTS (SELECT 1 FROM contatos WHERE empresa_id IS NULL) THEN
            EXECUTE 'ALTER TABLE contatos ALTER COLUMN empresa_id SET NOT NULL';
          END IF;
        END IF;
      END $$;
    `);

    // Garantir FK para clientes (quando aplicável)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema='public' AND table_name='clientes'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='contatos' AND column_name='clienteId'
        ) THEN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_contatos_cliente') THEN
            EXECUTE 'ALTER TABLE contatos ADD CONSTRAINT fk_contatos_cliente FOREIGN KEY ("clienteId") REFERENCES clientes(id) ON DELETE CASCADE';
          END IF;
        END IF;
      END $$;
    `);

    // Índices para performance
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='contatos' AND column_name='clienteId'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contatos_clienteId ON contatos("clienteId")';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='contatos' AND column_name='empresa_id'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contatos_empresa_id ON contatos(empresa_id)';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='contatos' AND column_name='telefone'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contatos_telefone ON contatos(telefone)';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='contatos' AND column_name='ativo'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contatos_ativo ON contatos(ativo)';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='contatos' AND column_name='principal'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contatos_principal ON contatos(principal)';
        END IF;
      END $$;
    `);

    // Comentários na tabela
    await queryRunner.query(`
      COMMENT ON TABLE contatos IS 'Contatos (funcionários) vinculados a clientes (empresas)'
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='contatos' AND column_name='clienteId'
        ) THEN
          EXECUTE 'COMMENT ON COLUMN contatos."clienteId" IS ''Cliente (empresa) ao qual o contato pertence''';
        END IF;
      END $$;
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
