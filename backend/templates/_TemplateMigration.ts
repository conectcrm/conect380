import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 📋 TEMPLATE DE MIGRATION MULTI-TENANT
 * 
 * ⚠️ CHECKLIST OBRIGATÓRIO:
 * [x] Criar tabela com empresa_id UUID NOT NULL REFERENCES empresas(id)
 * [x] Habilitar RLS (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
 * [x] Criar política tenant_isolation_* (CREATE POLICY ...)
 * [x] Criar índice em empresa_id (CREATE INDEX ...)
 * [x] Adicionar timestamps (created_at, updated_at, deleted_at)
 * [x] Adicionar log de sucesso (console.log)
 * 
 * ⚠️ ANTES DE USAR:
 * 1. [ ] Renomear classe (ex: CreateTemplate123 → CreateProdutos1234567890)
 * 2. [ ] Ajustar nome da tabela
 * 3. [ ] Adicionar colunas específicas
 * 4. [ ] Adicionar foreign keys (se necessário)
 * 5. [ ] Testar migration: npm run migration:run
 * 6. [ ] Verificar RLS ativo: SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'sua_tabela';
 */

export class CreateTemplate1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1️⃣ CRIAR TABELA
    // ============================================
    await queryRunner.query(`
      CREATE TABLE nome_da_tabela (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- ⚡ OBRIGATÓRIO: Multi-tenant
        empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        
        -- ⚠️ ADICIONAR COLUNAS ESPECÍFICAS AQUI
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        ativo BOOLEAN DEFAULT true,
        
        -- ✅ TIMESTAMPS (OBRIGATÓRIO)
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);

    // ============================================
    // 2️⃣ ⚡ OBRIGATÓRIO: HABILITAR RLS
    // ============================================
    await queryRunner.query(`
      ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
    `);

    // ============================================
    // 3️⃣ ⚡ OBRIGATÓRIO: CRIAR POLÍTICA
    // ============================================
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_nome_da_tabela ON nome_da_tabela
        FOR ALL 
        USING (empresa_id = get_current_tenant());
    `);

    // ============================================
    // 4️⃣ ⚡ OBRIGATÓRIO: CRIAR ÍNDICE
    // ============================================
    await queryRunner.query(`
      CREATE INDEX idx_nome_da_tabela_empresa_id 
        ON nome_da_tabela(empresa_id);
    `);

    // ============================================
    // 5️⃣ OPCIONAL: Índices Adicionais
    // ============================================
    // Índice para buscas por nome
    // await queryRunner.query(`
    //   CREATE INDEX idx_nome_da_tabela_nome 
    //     ON nome_da_tabela(nome);
    // `);

    // Índice para filtros por ativo
    // await queryRunner.query(`
    //   CREATE INDEX idx_nome_da_tabela_ativo 
    //     ON nome_da_tabela(ativo) 
    //     WHERE ativo = true;
    // `);

    // Índice composto (empresa_id + outro campo)
    // await queryRunner.query(`
    //   CREATE INDEX idx_nome_da_tabela_empresa_status 
    //     ON nome_da_tabela(empresa_id, status);
    // `);

    // ============================================
    // 6️⃣ OPCIONAL: Foreign Keys Adicionais
    // ============================================
    // Relacionamento com cliente
    // await queryRunner.query(`
    //   ALTER TABLE nome_da_tabela 
    //     ADD CONSTRAINT fk_nome_da_tabela_cliente 
    //     FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;
    // `);

    // ============================================
    // 7️⃣ OPCIONAL: Comentários na Tabela
    // ============================================
    await queryRunner.query(`
      COMMENT ON TABLE nome_da_tabela IS 'Descrição da tabela e seu propósito';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN nome_da_tabela.empresa_id IS 'ID da empresa (multi-tenant)';
    `);

    // ============================================
    // 8️⃣ LOG DE SUCESSO (OBRIGATÓRIO)
    // ============================================
    console.log('✅ Tabela nome_da_tabela criada com RLS ativo e política configurada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // ROLLBACK: Reverter em ordem inversa
    // ============================================
    
    // 1. Remover política
    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_nome_da_tabela ON nome_da_tabela;
    `);

    // 2. Remover tabela (índices são removidos automaticamente)
    await queryRunner.query(`
      DROP TABLE IF EXISTS nome_da_tabela CASCADE;
    `);

    console.log('✅ Tabela nome_da_tabela removida');
  }
}

/**
 * 📝 EXEMPLO DE USO:
 * 
 * 1. Copiar este arquivo:
 *    cp backend/templates/_TemplateMigration.ts backend/src/migrations/1234567890-CreateProdutos.ts
 * 
 * 2. Renomear classe:
 *    CreateTemplate1234567890 → CreateProdutos1234567890
 *    (Timestamp gerado automaticamente se usar CLI)
 * 
 * 3. Ajustar tabela:
 *    nome_da_tabela → produtos
 * 
 * 4. Adicionar colunas:
 *    codigo VARCHAR(50) UNIQUE NOT NULL,
 *    preco DECIMAL(10,2) DEFAULT 0,
 *    categoria_id UUID REFERENCES categorias(id)
 * 
 * 5. Executar:
 *    npm run migration:run
 * 
 * 6. Verificar RLS:
 *    psql -U conectcrm -d conectcrm_db -c "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'produtos';"
 *    → rowsecurity deve ser 't' (true)
 * 
 * 7. Verificar política:
 *    psql -U conectcrm -d conectcrm_db -c "SELECT * FROM pg_policies WHERE tablename = 'produtos';"
 *    → Deve mostrar policy tenant_isolation_produtos
 * 
 * 8. Testar isolamento:
 *    -- Login como empresa A
 *    SELECT set_current_tenant('uuid-empresa-a');
 *    SELECT * FROM produtos; -- Retorna apenas produtos da empresa A
 *    
 *    -- Login como empresa B
 *    SELECT set_current_tenant('uuid-empresa-b');
 *    SELECT * FROM produtos; -- Retorna apenas produtos da empresa B
 */

/**
 * 🔧 COMANDOS ÚTEIS:
 * 
 * # Gerar migration (detecta mudanças em entities)
 * npm run migration:generate -- src/migrations/NomeDaMigration
 * 
 * # Criar migration vazia (para scripts SQL manuais)
 * npm run migration:create -- src/migrations/NomeDaMigration
 * 
 * # Executar migrations pendentes
 * npm run migration:run
 * 
 * # Reverter última migration
 * npm run migration:revert
 * 
 * # Ver status de migrations
 * npm run migration:show
 * 
 * # Verificar RLS de todas as tabelas
 * psql -U conectcrm -d conectcrm_db -c "
 *   SELECT tablename, rowsecurity 
 *   FROM pg_tables 
 *   WHERE schemaname = 'public' 
 *   ORDER BY tablename;
 * "
 */

/**
 * ⚠️ CASOS ESPECIAIS:
 * 
 * 1. TABELA SEM EMPRESA_ID (globals como 'empresas', 'planos'):
 *    - NÃO adicionar empresa_id
 *    - NÃO habilitar RLS
 *    - Comentar no código: "// Tabela global, não precisa RLS"
 * 
 * 2. TABELA FILHA SEM EMPRESA_ID DIRETO:
 *    - Ex: itens_cotacao (empresa_id vem de cotacoes)
 *    - Política usa JOIN:
 *      CREATE POLICY tenant_isolation_itens_cotacao ON itens_cotacao
 *        FOR ALL USING (
 *          EXISTS (
 *            SELECT 1 FROM cotacoes 
 *            WHERE cotacoes.id = itens_cotacao.cotacao_id 
 *            AND cotacoes.empresa_id = get_current_tenant()
 *          )
 *        );
 * 
 * 3. MIGRATION DE DADOS (não estrutura):
 *    - Adicionar empresaId nos WHERE:
 *      UPDATE produtos SET ativo = true WHERE empresa_id = 'uuid...';
 */
