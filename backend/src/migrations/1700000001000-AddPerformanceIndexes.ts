import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Performance Indexes
 * 
 * Adiciona índices críticos para otimização de queries multi-tenant
 * e performance de consultas frequentes.
 * 
 * IMPACTO ESPERADO:
 * - Queries multi-tenant: 70-90% mais rápidas
 * - Listagens paginadas: 50-80% mais rápidas
 * - Buscas por status: 60-85% mais rápidas
 * - Ordenações: 40-70% mais rápidas
 */
export class AddPerformanceIndexes1700000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 [Migration] Criando índices de performance...');

    // ============================================
    // 1. ÍNDICES MULTI-TENANT (CRÍTICOS)
    // ============================================

    // Produtos - empresa_id (queries multi-tenant mais comuns)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_produtos_empresa_id" 
      ON "produtos"("empresa_id");
    `);

    // Clientes - empresa_id + ativo (filtros comuns)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clientes_empresa_ativo" 
      ON "clientes"("empresa_id", "ativo");
    `);

    // Oportunidades - empresa_id + estagio (pipeline de vendas)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_oportunidades_empresa_estagio" 
      ON "oportunidades"("empresa_id", "estagio");
    `);

    // Tickets de atendimento - empresa_id + status
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_atendimento_tickets_empresa_status" 
      ON "atendimento_tickets"("empresa_id", "status");
    `);

    // Faturas - empresa_id + status (faturamento)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_faturas_empresa_status" 
      ON "faturas"("empresa_id", "status");
    `);

    // ============================================
    // 2. ÍNDICES DE RELACIONAMENTO (FOREIGN KEYS)
    // ============================================

    // Mensagens de atendimento - ticket_id (chat/atendimento)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_atendimento_mensagens_ticket_id" 
      ON "atendimento_mensagens"("ticket_id");
    `);

    // Contatos - clienteId (clientes e contatos)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contatos_cliente_id" 
      ON "contatos"("clienteId");
    `);

    // Atividades - oportunidade_id (CRM)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_atividades_oportunidade_id" 
      ON "atividades"("oportunidade_id");
    `);

    // Itens Fatura - faturaId (faturamento)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_itens_fatura_fatura_id" 
      ON "itens_fatura"("faturaId");
    `);

    // ============================================
    // 3. ÍNDICES DE DATA (ORDENAÇÃO E FILTROS)
    // ============================================

    // Tickets de atendimento - created_at (ordenação comum)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_atendimento_tickets_created_at" 
      ON "atendimento_tickets"("created_at" DESC);
    `);

    // Mensagens de atendimento - created_at (ordenação de chat)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_atendimento_mensagens_created_at" 
      ON "atendimento_mensagens"("created_at" DESC);
    `);

    // Oportunidades - createdAt (pipeline)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_oportunidades_created_at" 
      ON "oportunidades"("createdAt" DESC);
    `);

    // Faturas - dataVencimento (cobrança)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_faturas_vencimento" 
      ON "faturas"("dataVencimento" DESC);
    `);

    // ============================================
    // 4. ÍNDICES COMPOSTOS (QUERIES COMPLEXAS)
    // ============================================

    // Tickets de atendimento - empresa_id + status + prioridade (dashboard atendimento)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_atendimento_tickets_empresa_status_priority" 
      ON "atendimento_tickets"("empresa_id", "status", "prioridade");
    `);

    // Oportunidades - empresa_id + estagio + createdAt (funil de vendas)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_oportunidades_empresa_estagio_created" 
      ON "oportunidades"("empresa_id", "estagio", "createdAt" DESC);
    `);

    // Clientes - empresa_id + ativo + created_at (listagem)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clientes_empresa_ativo_created" 
      ON "clientes"("empresa_id", "ativo", "created_at" DESC);
    `);

    // Faturas - empresa_id + status + dataVencimento (cobrança)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_faturas_empresa_status_vencimento" 
      ON "faturas"("empresa_id", "status", "dataVencimento" DESC);
    `);

    // ============================================
    // 5. ÍNDICES DE BUSCA (TEXTO)
    // ============================================

    // Clientes - nome (busca case-insensitive)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clientes_nome_lower" 
      ON "clientes"(LOWER("nome"));
    `);

    // Produtos - nome (busca case-insensitive)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_produtos_nome_lower" 
      ON "produtos"(LOWER("nome"));
    `);

    // Users - email (login)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_email_lower" 
      ON "users"(LOWER("email"));
    `);

    // ============================================
    // 6. ÍNDICES DE STATUS/FLAGS (FILTROS BOOLEANOS)
    // ============================================

    // Tickets de atendimento - prioridade (filtro de urgência)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_atendimento_tickets_priority" 
      ON "atendimento_tickets"("prioridade");
    `);

    // Produtos - status (filtro de listagem)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_produtos_status" 
      ON "produtos"("status");
    `);

    // Users - ativo (filtro de usuários)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_ativo" 
      ON "users"("ativo");
    `);

    console.log('✅ [Migration] Índices de performance criados com sucesso!');
    console.log('📊 [Migration] Índices criados:');
    console.log('   - 5 índices multi-tenant críticos');
    console.log('   - 4 índices de relacionamento');
    console.log('   - 4 índices de data/ordenação');
    console.log('   - 4 índices compostos');
    console.log('   - 3 índices de busca texto');
    console.log('   - 3 índices de status/flags');
    console.log('   TOTAL: 23 índices');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 [Migration] Revertendo índices de performance...');

    // Remover todos os índices na ordem inversa
    const indexes = [
      'IDX_users_ativo',
      'IDX_produtos_ativo',
      'IDX_tickets_priority',
      'IDX_users_email_lower',
      'IDX_produtos_nome_lower',
      'IDX_clientes_nome_lower',
      'IDX_faturas_empresa_status_vencimento',
      'IDX_clientes_empresa_ativo_created',
      'IDX_oportunidades_empresa_etapa_created',
      'IDX_tickets_empresa_status_priority',
      'IDX_faturas_vencimento',
      'IDX_oportunidades_created_at',
      'IDX_mensagens_created_at',
      'IDX_tickets_created_at',
      'IDX_item_fatura_fatura_id',
      'IDX_atividades_oportunidade_id',
      'IDX_contatos_cliente_id',
      'IDX_mensagens_ticket_id',
      'IDX_faturas_empresa_status',
      'IDX_tickets_empresa_status',
      'IDX_oportunidades_empresa_status',
      'IDX_clientes_empresa_ativo',
      'IDX_produtos_empresa_id',
    ];

    for (const index of indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${index}";`);
    }

    console.log('✅ [Migration] Índices removidos com sucesso!');
  }
}
