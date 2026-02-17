import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adiciona empresa_id + RLS nas tabelas de Cotação.
 *
 * Tabelas:
 * - cotacoes
 * - itens_cotacao
 * - anexos_cotacao
 *
 * Estratégia de backfill:
 * - cotacoes.empresa_id: via users.empresa_id (criado_por; fallback responsavel_id)
 * - itens_cotacao/anexos_cotacao.empresa_id: via cotacoes.empresa_id
 */
export class AddEmpresaIdAndRlsToCotacaoTables1802300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Iniciando migration: empresa_id + RLS em tabelas de Cotação...');

    // ========== 1. COTACOES ==========
    console.log('\n1️⃣  cotacoes:');
    const hasCotacoes = await queryRunner.hasTable('cotacoes');
    if (!hasCotacoes) {
      console.log('  ⚠️ Tabela cotacoes não existe. Pulando...');
    } else {
      await queryRunner.query(`ALTER TABLE cotacoes ADD COLUMN IF NOT EXISTS empresa_id UUID;`);
      console.log('  ✅ Coluna empresa_id garantida');

      await queryRunner.query(`
        UPDATE cotacoes c
        SET empresa_id = u.empresa_id
        FROM users u
        WHERE u.id = c.criado_por
          AND c.empresa_id IS NULL;
      `);
      console.log('  ✅ Backfill: empresa_id preenchido via users (criado_por)');

      await queryRunner.query(`
        UPDATE cotacoes c
        SET empresa_id = u.empresa_id
        FROM users u
        WHERE u.id = c.responsavel_id
          AND c.empresa_id IS NULL;
      `);
      console.log('  ✅ Backfill: fallback via users (responsavel_id)');

      const [{ count: cotacoesNullCount } = { count: '0' }] = await queryRunner.query(
        `SELECT COUNT(*)::int AS count FROM cotacoes WHERE empresa_id IS NULL;`,
      );

      if (Number(cotacoesNullCount) === 0) {
        await queryRunner.query(`ALTER TABLE cotacoes ALTER COLUMN empresa_id SET NOT NULL;`);
        console.log('  ✅ Constraint NOT NULL aplicada');
      } else {
        throw new Error(
          `Existem ${cotacoesNullCount} registros em cotacoes sem empresa_id. Corrija/normalize dados antes de aplicar NOT NULL.`,
        );
      }

      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_cotacoes_empresa'
          ) THEN
            ALTER TABLE cotacoes
              ADD CONSTRAINT fk_cotacoes_empresa
              FOREIGN KEY (empresa_id) REFERENCES empresas(id);
          END IF;
        END
        $$;
      `);
      console.log('  ✅ Foreign Key garantida');

      await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_cotacoes_empresa_id ON cotacoes(empresa_id);`);
      console.log('  ✅ Índice idx_cotacoes_empresa_id garantido');

      await queryRunner.query(`ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;`);
      console.log('  ✅ RLS habilitado');

      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_cotacoes ON cotacoes;`);
      await queryRunner.query(`
        CREATE POLICY tenant_isolation_cotacoes ON cotacoes
        FOR ALL
        USING (empresa_id = get_current_tenant())
        WITH CHECK (empresa_id = get_current_tenant());
      `);
      console.log('  ✅ Policy tenant_isolation_cotacoes criada');
    }

    // ========== 2. ITENS_COTACAO ==========
    console.log('\n2️⃣  itens_cotacao:');
    const hasItensCotacao = await queryRunner.hasTable('itens_cotacao');
    if (!hasItensCotacao) {
      console.log('  ⚠️ Tabela itens_cotacao não existe. Pulando...');
    } else {
      await queryRunner.query(`ALTER TABLE itens_cotacao ADD COLUMN IF NOT EXISTS empresa_id UUID;`);
      console.log('  ✅ Coluna empresa_id garantida');

      await queryRunner.query(`
        UPDATE itens_cotacao i
        SET empresa_id = c.empresa_id
        FROM cotacoes c
        WHERE c.id = i.cotacao_id
          AND i.empresa_id IS NULL;
      `);
      console.log('  ✅ Backfill: empresa_id preenchido via cotacoes');

      const [{ count: itensNullCount } = { count: '0' }] = await queryRunner.query(
        `SELECT COUNT(*)::int AS count FROM itens_cotacao WHERE empresa_id IS NULL;`,
      );

      if (Number(itensNullCount) === 0) {
        await queryRunner.query(`ALTER TABLE itens_cotacao ALTER COLUMN empresa_id SET NOT NULL;`);
        console.log('  ✅ Constraint NOT NULL aplicada');
      } else {
        throw new Error(
          `Existem ${itensNullCount} registros em itens_cotacao sem empresa_id. Corrija/normalize dados antes de aplicar NOT NULL.`,
        );
      }

      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_itens_cotacao_empresa'
          ) THEN
            ALTER TABLE itens_cotacao
              ADD CONSTRAINT fk_itens_cotacao_empresa
              FOREIGN KEY (empresa_id) REFERENCES empresas(id);
          END IF;
        END
        $$;
      `);
      console.log('  ✅ Foreign Key garantida');

      await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_itens_cotacao_empresa_id ON itens_cotacao(empresa_id);`);
      console.log('  ✅ Índice idx_itens_cotacao_empresa_id garantido');

      await queryRunner.query(`ALTER TABLE itens_cotacao ENABLE ROW LEVEL SECURITY;`);
      console.log('  ✅ RLS habilitado');

      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_itens_cotacao ON itens_cotacao;`);
      await queryRunner.query(`
        CREATE POLICY tenant_isolation_itens_cotacao ON itens_cotacao
        FOR ALL
        USING (empresa_id = get_current_tenant())
        WITH CHECK (empresa_id = get_current_tenant());
      `);
      console.log('  ✅ Policy tenant_isolation_itens_cotacao criada');
    }

    // ========== 3. ANEXOS_COTACAO ==========
    console.log('\n3️⃣  anexos_cotacao:');
    const hasAnexosCotacao = await queryRunner.hasTable('anexos_cotacao');
    if (!hasAnexosCotacao) {
      console.log('  ⚠️ Tabela anexos_cotacao não existe. Pulando...');
    } else {
      await queryRunner.query(`ALTER TABLE anexos_cotacao ADD COLUMN IF NOT EXISTS empresa_id UUID;`);
      console.log('  ✅ Coluna empresa_id garantida');

      await queryRunner.query(`
        UPDATE anexos_cotacao a
        SET empresa_id = c.empresa_id
        FROM cotacoes c
        WHERE c.id = a.cotacao_id
          AND a.empresa_id IS NULL;
      `);
      console.log('  ✅ Backfill: empresa_id preenchido via cotacoes');

      const [{ count: anexosNullCount } = { count: '0' }] = await queryRunner.query(
        `SELECT COUNT(*)::int AS count FROM anexos_cotacao WHERE empresa_id IS NULL;`,
      );

      if (Number(anexosNullCount) === 0) {
        await queryRunner.query(`ALTER TABLE anexos_cotacao ALTER COLUMN empresa_id SET NOT NULL;`);
        console.log('  ✅ Constraint NOT NULL aplicada');
      } else {
        throw new Error(
          `Existem ${anexosNullCount} registros em anexos_cotacao sem empresa_id. Corrija/normalize dados antes de aplicar NOT NULL.`,
        );
      }

      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_anexos_cotacao_empresa'
          ) THEN
            ALTER TABLE anexos_cotacao
              ADD CONSTRAINT fk_anexos_cotacao_empresa
              FOREIGN KEY (empresa_id) REFERENCES empresas(id);
          END IF;
        END
        $$;
      `);
      console.log('  ✅ Foreign Key garantida');

      await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_anexos_cotacao_empresa_id ON anexos_cotacao(empresa_id);`);
      console.log('  ✅ Índice idx_anexos_cotacao_empresa_id garantido');

      await queryRunner.query(`ALTER TABLE anexos_cotacao ENABLE ROW LEVEL SECURITY;`);
      console.log('  ✅ RLS habilitado');

      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_anexos_cotacao ON anexos_cotacao;`);
      await queryRunner.query(`
        CREATE POLICY tenant_isolation_anexos_cotacao ON anexos_cotacao
        FOR ALL
        USING (empresa_id = get_current_tenant())
        WITH CHECK (empresa_id = get_current_tenant());
      `);
      console.log('  ✅ Policy tenant_isolation_anexos_cotacao criada');
    }

    console.log('\n✅ Migration de Cotação finalizada.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('↩️ Revertendo migration: empresa_id + RLS em tabelas de Cotação...');

    const tables = ['anexos_cotacao', 'itens_cotacao', 'cotacoes'];
    for (const table of tables) {
      const exists = await queryRunner.hasTable(table);
      if (!exists) continue;

      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON ${table};`).catch(() => undefined);
      await queryRunner.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`).catch(() => undefined);
    }

    await queryRunner.query(`ALTER TABLE anexos_cotacao DROP CONSTRAINT IF EXISTS fk_anexos_cotacao_empresa;`).catch(() => undefined);
    await queryRunner.query(`ALTER TABLE itens_cotacao DROP CONSTRAINT IF EXISTS fk_itens_cotacao_empresa;`).catch(() => undefined);
    await queryRunner.query(`ALTER TABLE cotacoes DROP CONSTRAINT IF EXISTS fk_cotacoes_empresa;`).catch(() => undefined);

    await queryRunner.query(`ALTER TABLE anexos_cotacao DROP COLUMN IF EXISTS empresa_id;`).catch(() => undefined);
    await queryRunner.query(`ALTER TABLE itens_cotacao DROP COLUMN IF EXISTS empresa_id;`).catch(() => undefined);
    await queryRunner.query(`ALTER TABLE cotacoes DROP COLUMN IF EXISTS empresa_id;`).catch(() => undefined);

    console.log('✅ Reversão finalizada.');
  }
}
