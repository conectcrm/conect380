import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Refatoração para Tickets Configuráveis
 *
 * Cria 3 novas tabelas:
 * - niveis_atendimento (substitui enum NivelAtendimentoTicket)
 * - status_customizados (substitui enum StatusTicket)
 * - tipos_servico (substitui enum TipoTicket)
 *
 * Migra dados existentes dos enums para as tabelas
 * Prepara para próxima migration que alterará Ticket.entity.ts
 */
export class RefatorarTicketsConfiguraveis1735421400000 implements MigrationInterface {
  name = 'RefatorarTicketsConfiguraveis1735421400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ===== 1. CRIAR TABELA NIVEIS_ATENDIMENTO =====
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS niveis_atendimento (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        codigo VARCHAR(10) NOT NULL,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        ordem INTEGER NOT NULL,
        ativo BOOLEAN DEFAULT true,
        cor VARCHAR(7),
        empresa_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_nivel_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        CONSTRAINT uq_nivel_codigo_empresa UNIQUE (empresa_id, codigo)
      )
    `);

    // ⚡ MULTI-TENANT: RLS + policy + índice
    await queryRunner.query(`ALTER TABLE niveis_atendimento ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_niveis_atendimento ON niveis_atendimento;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_niveis_atendimento ON niveis_atendimento
      FOR ALL USING (empresa_id = get_current_tenant())
      WITH CHECK (empresa_id = get_current_tenant());
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_niveis_atendimento_empresa_id ON niveis_atendimento(empresa_id)`,
    );

    await queryRunner.query(
      `CREATE INDEX idx_niveis_empresa_ordem ON niveis_atendimento(empresa_id, ordem)`,
    );

    // ===== 2. CRIAR TABELA STATUS_CUSTOMIZADOS =====
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS status_customizados (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        nivel_id UUID NOT NULL,
        cor VARCHAR(7) NOT NULL,
        ordem INTEGER NOT NULL,
        finalizador BOOLEAN DEFAULT false,
        ativo BOOLEAN DEFAULT true,
        empresa_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_status_nivel FOREIGN KEY (nivel_id) REFERENCES niveis_atendimento(id) ON DELETE CASCADE,
        CONSTRAINT fk_status_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      )
    `);

    // ⚡ MULTI-TENANT: RLS + policy + índice
    await queryRunner.query(`ALTER TABLE status_customizados ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_status_customizados ON status_customizados;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_status_customizados ON status_customizados
      FOR ALL USING (empresa_id = get_current_tenant())
      WITH CHECK (empresa_id = get_current_tenant());
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_status_customizados_empresa_id ON status_customizados(empresa_id)`,
    );

    await queryRunner.query(
      `CREATE INDEX idx_status_empresa_nivel_ordem ON status_customizados(empresa_id, nivel_id, ordem)`,
    );

    // ===== 3. CRIAR TABELA TIPOS_SERVICO =====
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tipos_servico (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        cor VARCHAR(7),
        icone VARCHAR(50),
        ordem INTEGER DEFAULT 0,
        ativo BOOLEAN DEFAULT true,
        empresa_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_tipo_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      )
    `);

    // ⚡ MULTI-TENANT: RLS + policy + índice
    await queryRunner.query(`ALTER TABLE tipos_servico ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_tipos_servico ON tipos_servico;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_tipos_servico ON tipos_servico
      FOR ALL USING (empresa_id = get_current_tenant())
      WITH CHECK (empresa_id = get_current_tenant());
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tipos_servico_empresa_id ON tipos_servico(empresa_id)`,
    );

    await queryRunner.query(
      `CREATE INDEX idx_tipos_empresa_ordem ON tipos_servico(empresa_id, ordem)`,
    );

    // ===== 4. MIGRAR DADOS DOS ENUMS PARA TABELAS =====

    // 4.1. Inserir níveis padrão para cada empresa
    await queryRunner.query(`
      INSERT INTO niveis_atendimento (codigo, nome, descricao, ordem, cor, empresa_id)
      SELECT
        'N1',
        'N1 - Suporte Básico',
        'Atendimento de primeiro nível - questões simples e FAQ',
        1,
        '#10B981',
        e.id
      FROM empresas e
      WHERE NOT EXISTS (
        SELECT 1 FROM niveis_atendimento na
        WHERE na.empresa_id = e.id AND na.codigo = 'N1'
      )
    `);

    await queryRunner.query(`
      INSERT INTO niveis_atendimento (codigo, nome, descricao, ordem, cor, empresa_id)
      SELECT
        'N2',
        'N2 - Suporte Avançado',
        'Atendimento de segundo nível - problemas técnicos complexos',
        2,
        '#F59E0B',
        e.id
      FROM empresas e
      WHERE NOT EXISTS (
        SELECT 1 FROM niveis_atendimento na
        WHERE na.empresa_id = e.id AND na.codigo = 'N2'
      )
    `);

    await queryRunner.query(`
      INSERT INTO niveis_atendimento (codigo, nome, descricao, ordem, cor, empresa_id)
      SELECT
        'N3',
        'N3 - Especialista/Desenvolvimento',
        'Atendimento de terceiro nível - desenvolvimento e customizações',
        3,
        '#EF4444',
        e.id
      FROM empresas e
      WHERE NOT EXISTS (
        SELECT 1 FROM niveis_atendimento na
        WHERE na.empresa_id = e.id AND na.codigo = 'N3'
      )
    `);

    // 4.2. Inserir status customizados por nível para cada empresa
    // Status para N1
    await queryRunner.query(`
      INSERT INTO status_customizados (nome, descricao, nivel_id, cor, ordem, finalizador, empresa_id)
      SELECT
        'Fila',
        'Aguardando atribuição de atendente',
        na.id,
        '#94A3B8',
        1,
        false,
        e.id
      FROM empresas e
      JOIN niveis_atendimento na ON na.empresa_id = e.id AND na.codigo = 'N1'
      WHERE NOT EXISTS (
        SELECT 1 FROM status_customizados sc
        WHERE sc.empresa_id = e.id AND sc.nivel_id = na.id AND sc.nome = 'Fila'
      )
    `);

    await queryRunner.query(`
      INSERT INTO status_customizados (nome, descricao, nivel_id, cor, ordem, finalizador, empresa_id)
      SELECT
        'Em Atendimento',
        'Ticket sendo tratado por um atendente',
        na.id,
        '#3B82F6',
        2,
        false,
        e.id
      FROM empresas e
      JOIN niveis_atendimento na ON na.empresa_id = e.id AND na.codigo = 'N1'
    `);

    await queryRunner.query(`
      INSERT INTO status_customizados (nome, descricao, nivel_id, cor, ordem, finalizador, empresa_id)
      SELECT
        'Aguardando Cliente',
        'Aguardando resposta ou ação do cliente',
        na.id,
        '#F59E0B',
        3,
        false,
        e.id
      FROM empresas e
      JOIN niveis_atendimento na ON na.empresa_id = e.id AND na.codigo = 'N1'
    `);

    await queryRunner.query(`
      INSERT INTO status_customizados (nome, descricao, nivel_id, cor, ordem, finalizador, empresa_id)
      SELECT
        'Concluído',
        'Ticket resolvido e finalizado',
        na.id,
        '#10B981',
        4,
        true,
        e.id
      FROM empresas e
      JOIN niveis_atendimento na ON na.empresa_id = e.id AND na.codigo = 'N1'
    `);

    // Status para N2 (similares mas podem ser customizados depois)
    await queryRunner.query(`
      INSERT INTO status_customizados (nome, descricao, nivel_id, cor, ordem, finalizador, empresa_id)
      SELECT
        s.nome,
        s.descricao,
        na2.id,
        s.cor,
        s.ordem,
        s.finalizador,
        e.id
      FROM empresas e
      JOIN niveis_atendimento na1 ON na1.empresa_id = e.id AND na1.codigo = 'N1'
      JOIN niveis_atendimento na2 ON na2.empresa_id = e.id AND na2.codigo = 'N2'
      JOIN status_customizados s ON s.empresa_id = e.id AND s.nivel_id = na1.id
      WHERE NOT EXISTS (
        SELECT 1 FROM status_customizados sc
        WHERE sc.empresa_id = e.id AND sc.nivel_id = na2.id AND sc.nome = s.nome
      )
    `);

    // Status para N3 (similares mas podem ser customizados depois)
    await queryRunner.query(`
      INSERT INTO status_customizados (nome, descricao, nivel_id, cor, ordem, finalizador, empresa_id)
      SELECT
        s.nome,
        s.descricao,
        na3.id,
        s.cor,
        s.ordem,
        s.finalizador,
        e.id
      FROM empresas e
      JOIN niveis_atendimento na1 ON na1.empresa_id = e.id AND na1.codigo = 'N1'
      JOIN niveis_atendimento na3 ON na3.empresa_id = e.id AND na3.codigo = 'N3'
      JOIN status_customizados s ON s.empresa_id = e.id AND s.nivel_id = na1.id
      WHERE NOT EXISTS (
        SELECT 1 FROM status_customizados sc
        WHERE sc.empresa_id = e.id AND sc.nivel_id = na3.id AND sc.nome = s.nome
      )
    `);

    // 4.3. Inserir tipos de serviço padrão para cada empresa
    const tiposServico = [
      {
        nome: 'Suporte',
        descricao: 'Suporte técnico geral',
        cor: '#8B5CF6',
        icone: 'HelpCircle',
        ordem: 1,
      },
      {
        nome: 'Técnica',
        descricao: 'Questões técnicas e troubleshooting',
        cor: '#3B82F6',
        icone: 'Wrench',
        ordem: 2,
      },
      {
        nome: 'Comercial',
        descricao: 'Questões comerciais e vendas',
        cor: '#10B981',
        icone: 'DollarSign',
        ordem: 3,
      },
      {
        nome: 'Financeira',
        descricao: 'Questões financeiras e pagamentos',
        cor: '#F59E0B',
        icone: 'CreditCard',
        ordem: 4,
      },
      {
        nome: 'Reclamação',
        descricao: 'Reclamações e insatisfações',
        cor: '#EF4444',
        icone: 'AlertTriangle',
        ordem: 5,
      },
      {
        nome: 'Solicitação de Melhoria',
        descricao: 'Sugestões de melhorias',
        cor: '#06B6D4',
        icone: 'Sparkles',
        ordem: 6,
      },
      {
        nome: 'Bug/Outros',
        descricao: 'Bugs reportados e outros assuntos',
        cor: '#EC4899',
        icone: 'Bug',
        ordem: 7,
      },
    ];

    for (const tipo of tiposServico) {
      await queryRunner.query(`
        INSERT INTO tipos_servico (nome, descricao, cor, icone, ordem, empresa_id)
        SELECT
          '${tipo.nome}',
          '${tipo.descricao}',
          '${tipo.cor}',
          '${tipo.icone}',
          ${tipo.ordem},
          e.id
        FROM empresas e
        WHERE NOT EXISTS (
          SELECT 1 FROM tipos_servico ts
          WHERE ts.empresa_id = e.id AND ts.nome = '${tipo.nome}'
        )
      `);
    }

    console.log('✅ Migration UP concluída: Tabelas criadas e dados migrados com sucesso!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: remover tabelas na ordem inversa (respeitar FKs)
    await queryRunner.query(`DROP TABLE IF EXISTS status_customizados CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS tipos_servico CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS niveis_atendimento CASCADE`);

    console.log('✅ Migration DOWN concluída: Tabelas removidas com sucesso!');
  }
}
