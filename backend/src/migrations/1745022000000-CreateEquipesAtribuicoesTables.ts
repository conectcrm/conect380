import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEquipesAtribuicoesTables1745022000000 implements MigrationInterface {
  name = 'CreateEquipesAtribuicoesTables1745022000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================================================
    // 1. TABELA DE EQUIPES
    // ========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id UUID NOT NULL,
        
        -- Identificação
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        
        -- Configurações visuais
        cor VARCHAR(7) DEFAULT '#3B82F6',
        icone VARCHAR(50) DEFAULT 'users',
        
        -- Status
        ativo BOOLEAN DEFAULT true,
        
        -- Metadados
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_equipes_empresa 
          FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_equipes_empresa ON equipes(empresa_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_equipes_ativo ON equipes(ativo)
    `);

    // ========================================================================
    // 2. TABELA DE RELACIONAMENTO: ATENDENTE ↔ EQUIPE (many-to-many)
    // ========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendente_equipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        atendente_id UUID NOT NULL,
        equipe_id UUID NOT NULL,
        
        -- Função na equipe
        funcao VARCHAR(50) DEFAULT 'membro',
        
        -- Metadados
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_atendente_equipes_atendente 
          FOREIGN KEY (atendente_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_atendente_equipes_equipe 
          FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE,
        
        -- Evitar duplicatas
        CONSTRAINT uk_atendente_equipe UNIQUE (atendente_id, equipe_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendente_equipes_atendente ON atendente_equipes(atendente_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendente_equipes_equipe ON atendente_equipes(equipe_id)
    `);

    // ========================================================================
    // 3. TABELA DE ATRIBUIÇÕES DIRETAS: ATENDENTE ↔ NÚCLEO/DEPARTAMENTO
    // ========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atendente_atribuicoes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        atendente_id UUID NOT NULL,
        
        -- Pode ser atribuído a um núcleo inteiro OU departamento específico
        nucleo_id UUID,
        departamento_id UUID,
        
        -- Controle de prioridade (0 = maior prioridade)
        prioridade INTEGER DEFAULT 0,
        
        -- Status
        ativo BOOLEAN DEFAULT true,
        
        -- Metadados
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_atendente_atribuicoes_atendente 
          FOREIGN KEY (atendente_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_atendente_atribuicoes_nucleo 
          FOREIGN KEY (nucleo_id) REFERENCES nucleos_atendimento(id) ON DELETE CASCADE,
        CONSTRAINT fk_atendente_atribuicoes_departamento 
          FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE CASCADE,
        
        -- Garantir que pelo menos um (núcleo ou departamento) esteja definido
        CONSTRAINT check_atribuicao CHECK (nucleo_id IS NOT NULL OR departamento_id IS NOT NULL)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendente_atribuicoes_atendente ON atendente_atribuicoes(atendente_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendente_atribuicoes_nucleo ON atendente_atribuicoes(nucleo_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendente_atribuicoes_departamento ON atendente_atribuicoes(departamento_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_atendente_atribuicoes_ativo ON atendente_atribuicoes(ativo)
    `);

    // ========================================================================
    // 4. TABELA DE ATRIBUIÇÕES DE EQUIPE: EQUIPE ↔ NÚCLEO/DEPARTAMENTO
    // ========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipe_atribuicoes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        equipe_id UUID NOT NULL,
        
        -- Pode ser atribuído a um núcleo inteiro OU departamento específico
        nucleo_id UUID,
        departamento_id UUID,
        
        -- Controle de prioridade (0 = maior prioridade)
        prioridade INTEGER DEFAULT 0,
        
        -- Status
        ativo BOOLEAN DEFAULT true,
        
        -- Metadados
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_equipe_atribuicoes_equipe 
          FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE,
        CONSTRAINT fk_equipe_atribuicoes_nucleo 
          FOREIGN KEY (nucleo_id) REFERENCES nucleos_atendimento(id) ON DELETE CASCADE,
        CONSTRAINT fk_equipe_atribuicoes_departamento 
          FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE CASCADE,
        
        -- Garantir que pelo menos um (núcleo ou departamento) esteja definido
        CONSTRAINT check_equipe_atribuicao CHECK (nucleo_id IS NOT NULL OR departamento_id IS NOT NULL)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_equipe_atribuicoes_equipe ON equipe_atribuicoes(equipe_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_equipe_atribuicoes_nucleo ON equipe_atribuicoes(nucleo_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_equipe_atribuicoes_departamento ON equipe_atribuicoes(departamento_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_equipe_atribuicoes_ativo ON equipe_atribuicoes(ativo)
    `);

    // ========================================================================
    // 5. COMENTÁRIOS EXPLICATIVOS
    // ========================================================================
    await queryRunner.query(`
      COMMENT ON TABLE equipes IS 'Equipes de atendimento da empresa';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE atendente_equipes IS 'RelacionamentoMany-to-Many entre atendentes e equipes';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE atendente_atribuicoes IS 'Atribuições diretas de atendentes a núcleos ou departamentos específicos';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE equipe_atribuicoes IS 'Atribuições de equipes a núcleos ou departamentos específicos';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN atendente_equipes.funcao IS 'Função do atendente na equipe: lider, membro, supervisor, etc.';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN atendente_atribuicoes.prioridade IS 'Prioridade da atribuição (0 = maior prioridade)';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN equipe_atribuicoes.prioridade IS 'Prioridade da atribuição (0 = maior prioridade)';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover tabelas na ordem inversa (respeitar foreign keys)
    await queryRunner.query(`DROP TABLE IF EXISTS equipe_atribuicoes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendente_atribuicoes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS atendente_equipes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS equipes CASCADE`);
  }
}
