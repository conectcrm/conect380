import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para adicionar empresa_id em tabelas faltantes e habilitar RLS
 * 
 * Tabelas afetadas:
 * 1. ticket_historico - Histórico de alterações de tickets
 * 2. ticket_relacionamentos - Relacionamentos entre tickets
 * 3. atendente_skills - Habilidades de atendentes
 * 4. ticket_tags - Junction table Ticket <-> Tag (Many-to-Many)
 * 
 * PROBLEMA ENCONTRADO:
 * - Entities têm @Column empresa_id + @ManyToOne(() => Empresa)
 * - Mas as tabelas no database NÃO TÊM a coluna empresa_id
 * - Isso causa inconsistência e impede RLS
 * 
 * SOLUÇÃO:
 * 1. Adicionar coluna empresa_id (UUID, NOT NULL)
 * 2. Backfill: Preencher empresa_id a partir de entities relacionadas
 * 3. Habilitar RLS (ALTER TABLE ENABLE ROW LEVEL SECURITY)
 * 4. Criar policies (tenant_isolation_*)
 */
export class AddEmpresaIdAndRlsToTicketTables1767226000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Iniciando migration: Adicionar empresa_id + RLS em 4 tabelas...');

    // ========== 1. TICKET_HISTORICO ==========
    console.log('\n1️⃣  ticket_historico:');
    
    // Adicionar coluna empresa_id
    await queryRunner.query(`
      ALTER TABLE ticket_historico 
      ADD COLUMN empresa_id UUID;
    `);
    console.log('  ✅ Coluna empresa_id adicionada');

    // Backfill: pegar empresa_id do ticket relacionado
    await queryRunner.query(`
      UPDATE ticket_historico th
      SET empresa_id = t.empresa_id
      FROM atendimento_tickets t
      WHERE th.ticket_id = t.id;
    `);
    console.log('  ✅ Backfill: empresa_id preenchido a partir de tickets');

    // Tornar NOT NULL
    await queryRunner.query(`
      ALTER TABLE ticket_historico 
      ALTER COLUMN empresa_id SET NOT NULL;
    `);
    console.log('  ✅ Constraint NOT NULL aplicada');

    // Adicionar FK para empresas
    await queryRunner.query(`
      ALTER TABLE ticket_historico
      ADD CONSTRAINT fk_ticket_historico_empresa
      FOREIGN KEY (empresa_id) REFERENCES empresas(id);
    `);
    console.log('  ✅ Foreign Key criada');

    // Habilitar RLS
    await queryRunner.query(`
      ALTER TABLE ticket_historico ENABLE ROW LEVEL SECURITY;
    `);
    console.log('  ✅ RLS habilitado');

    // Criar policy
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_ticket_historico ON ticket_historico
      FOR ALL USING (empresa_id = get_current_tenant());
    `);
    console.log('  ✅ Policy tenant_isolation_ticket_historico criada');

    // ========== 2. TICKET_RELACIONAMENTOS ==========
    console.log('\n2️⃣  ticket_relacionamentos:');
    
    await queryRunner.query(`
      ALTER TABLE ticket_relacionamentos 
      ADD COLUMN empresa_id UUID;
    `);
    console.log('  ✅ Coluna empresa_id adicionada');

    // Backfill: pegar empresa_id do ticket_origem
    await queryRunner.query(`
      UPDATE ticket_relacionamentos tr
      SET empresa_id = t.empresa_id
      FROM atendimento_tickets t
      WHERE tr.ticket_origem_id = t.id;
    `);
    console.log('  ✅ Backfill: empresa_id preenchido a partir de ticket_origem');

    await queryRunner.query(`
      ALTER TABLE ticket_relacionamentos 
      ALTER COLUMN empresa_id SET NOT NULL;
    `);
    console.log('  ✅ Constraint NOT NULL aplicada');

    await queryRunner.query(`
      ALTER TABLE ticket_relacionamentos
      ADD CONSTRAINT fk_ticket_relacionamentos_empresa
      FOREIGN KEY (empresa_id) REFERENCES empresas(id);
    `);
    console.log('  ✅ Foreign Key criada');

    await queryRunner.query(`
      ALTER TABLE ticket_relacionamentos ENABLE ROW LEVEL SECURITY;
    `);
    console.log('  ✅ RLS habilitado');

    await queryRunner.query(`
      CREATE POLICY tenant_isolation_ticket_relacionamentos ON ticket_relacionamentos
      FOR ALL USING (empresa_id = get_current_tenant());
    `);
    console.log('  ✅ Policy tenant_isolation_ticket_relacionamentos criada');

    // ========== 3. ATENDENTE_SKILLS ==========
    console.log('\n3️⃣  atendente_skills:');
    
    await queryRunner.query(`
      ALTER TABLE atendente_skills 
      ADD COLUMN empresa_id UUID;
    `);
    console.log('  ✅ Coluna empresa_id adicionada');

    // Backfill: pegar empresa_id do atendente (usuário)
    await queryRunner.query(`
      UPDATE atendente_skills ask
      SET empresa_id = u.empresa_id
      FROM users u
      WHERE ask."atendenteId" = u.id;
    `);
    console.log('  ✅ Backfill: empresa_id preenchido a partir de users');

    await queryRunner.query(`
      ALTER TABLE atendente_skills 
      ALTER COLUMN empresa_id SET NOT NULL;
    `);
    console.log('  ✅ Constraint NOT NULL aplicada');

    await queryRunner.query(`
      ALTER TABLE atendente_skills
      ADD CONSTRAINT fk_atendente_skills_empresa
      FOREIGN KEY (empresa_id) REFERENCES empresas(id);
    `);
    console.log('  ✅ Foreign Key criada');

    await queryRunner.query(`
      ALTER TABLE atendente_skills ENABLE ROW LEVEL SECURITY;
    `);
    console.log('  ✅ RLS habilitado');

    await queryRunner.query(`
      CREATE POLICY tenant_isolation_atendente_skills ON atendente_skills
      FOR ALL USING (empresa_id = get_current_tenant());
    `);
    console.log('  ✅ Policy tenant_isolation_atendente_skills criada');

    // ========== 4. TICKET_TAGS (Junction Table) ==========
    console.log('\n4️⃣  ticket_tags (junction table):');
    
    await queryRunner.query(`
      ALTER TABLE ticket_tags 
      ADD COLUMN empresa_id UUID;
    `);
    console.log('  ✅ Coluna empresa_id adicionada');

    // Backfill: pegar empresa_id do ticket
    await queryRunner.query(`
      UPDATE ticket_tags tt
      SET empresa_id = t.empresa_id
      FROM atendimento_tickets t
      WHERE tt."ticketId" = t.id;
    `);
    console.log('  ✅ Backfill: empresa_id preenchido a partir de tickets');

    await queryRunner.query(`
      ALTER TABLE ticket_tags 
      ALTER COLUMN empresa_id SET NOT NULL;
    `);
    console.log('  ✅ Constraint NOT NULL aplicada');

    await queryRunner.query(`
      ALTER TABLE ticket_tags
      ADD CONSTRAINT fk_ticket_tags_empresa
      FOREIGN KEY (empresa_id) REFERENCES empresas(id);
    `);
    console.log('  ✅ Foreign Key criada');

    await queryRunner.query(`
      ALTER TABLE ticket_tags ENABLE ROW LEVEL SECURITY;
    `);
    console.log('  ✅ RLS habilitado');

    await queryRunner.query(`
      CREATE POLICY tenant_isolation_ticket_tags ON ticket_tags
      FOR ALL USING (empresa_id = get_current_tenant());
    `);
    console.log('  ✅ Policy tenant_isolation_ticket_tags criada');

    console.log('\n🎉 Migration concluída! 4 tabelas agora têm empresa_id + RLS ativo!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⏪ Revertendo migration...');

    // Reverter ticket_tags
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_ticket_tags ON ticket_tags;`);
    await queryRunner.query(`ALTER TABLE ticket_tags DISABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE ticket_tags DROP CONSTRAINT IF EXISTS fk_ticket_tags_empresa;`);
    await queryRunner.query(`ALTER TABLE ticket_tags DROP COLUMN IF EXISTS empresa_id;`);

    // Reverter atendente_skills
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_atendente_skills ON atendente_skills;`);
    await queryRunner.query(`ALTER TABLE atendente_skills DISABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE atendente_skills DROP CONSTRAINT IF EXISTS fk_atendente_skills_empresa;`);
    await queryRunner.query(`ALTER TABLE atendente_skills DROP COLUMN IF EXISTS empresa_id;`);

    // Reverter ticket_relacionamentos
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_ticket_relacionamentos ON ticket_relacionamentos;`);
    await queryRunner.query(`ALTER TABLE ticket_relacionamentos DISABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE ticket_relacionamentos DROP CONSTRAINT IF EXISTS fk_ticket_relacionamentos_empresa;`);
    await queryRunner.query(`ALTER TABLE ticket_relacionamentos DROP COLUMN IF EXISTS empresa_id;`);

    // Reverter ticket_historico
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_ticket_historico ON ticket_historico;`);
    await queryRunner.query(`ALTER TABLE ticket_historico DISABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE ticket_historico DROP CONSTRAINT IF EXISTS fk_ticket_historico_empresa;`);
    await queryRunner.query(`ALTER TABLE ticket_historico DROP COLUMN IF EXISTS empresa_id;`);

    console.log('✅ Migration revertida');
  }
}
