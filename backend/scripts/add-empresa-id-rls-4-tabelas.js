// Script para adicionar empresa_id + RLS em 4 tabelas
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USERNAME || 'conectcrm',
  password: process.env.DATABASE_PASSWORD || 'conectcrm123',
  database: process.env.DATABASE_NAME || 'conectcrm',
});

const tabelas = [
  {
    nome: 'ticket_historico',
    backfillQuery: `
      UPDATE ticket_historico th
      SET empresa_id = t.empresa_id
      FROM atendimento_tickets t
      WHERE th.ticket_id = t.id
    `,
    origem: 'atendimento_tickets (via ticket_id)',
  },
  {
    nome: 'ticket_relacionamentos',
    backfillQuery: `
      UPDATE ticket_relacionamentos tr
      SET empresa_id = t.empresa_id
      FROM atendimento_tickets t
      WHERE tr.ticket_origem_id = t.id
    `,
    origem: 'atendimento_tickets (via ticket_origem_id)',
  },
  {
    nome: 'atendente_skills',
    backfillQuery: `
      UPDATE atendente_skills ask
      SET empresa_id = u.empresa_id
      FROM users u
      WHERE ask."atendenteId" = u.id
    `,
    origem: 'users (via atendenteId)',
  },
  {
    nome: 'ticket_tags',
    backfillQuery: `
      UPDATE ticket_tags tt
      SET empresa_id = t.empresa_id
      FROM atendimento_tickets t
      WHERE tt."ticketId" = t.id
    `,
    origem: 'atendimento_tickets (via ticketId)',
  },
];

async function adicionarEmpresaIdERls() {
  const client = await pool.connect();

  try {
    console.log('🚀 Iniciando: Adicionar empresa_id + RLS em 4 tabelas...\n');

    for (const tabela of tabelas) {
      console.log(`📋 Processando: ${tabela.nome}`);
      console.log(`   Origem: ${tabela.origem}`);

      // 1. Verificar se coluna já existe
      const checkColumn = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'empresa_id'
      `, [tabela.nome]);

      if (checkColumn.rows.length > 0) {
        console.log(`   ⚠️  Coluna empresa_id já existe, pulando adição...`);
      } else {
        // Adicionar coluna
        await client.query(`ALTER TABLE ${tabela.nome} ADD COLUMN empresa_id UUID`);
        console.log(`   ✅ Coluna empresa_id adicionada`);
      }

      // 2. Backfill (preencher dados)
      const updateResult = await client.query(tabela.backfillQuery);
      console.log(`   ✅ Backfill: ${updateResult.rowCount} registros atualizados`);

      // 3. Tornar NOT NULL
      try {
        await client.query(`ALTER TABLE ${tabela.nome} ALTER COLUMN empresa_id SET NOT NULL`);
        console.log(`   ✅ Constraint NOT NULL aplicada`);
      } catch (err) {
        if (err.message.includes('contains null values')) {
          console.log(`   ⚠️  Não foi possível aplicar NOT NULL (registros com NULL)`);
        } else {
          throw err;
        }
      }

      // 4. Adicionar FK (se não existir)
      try {
        const fkName = `fk_${tabela.nome}_empresa`;
        await client.query(`
          ALTER TABLE ${tabela.nome}
          ADD CONSTRAINT ${fkName}
          FOREIGN KEY (empresa_id) REFERENCES empresas(id)
        `);
        console.log(`   ✅ Foreign Key ${fkName} criada`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`   ⚠️  Foreign Key já existe`);
        } else {
          throw err;
        }
      }

      // 5. Habilitar RLS
      await client.query(`ALTER TABLE ${tabela.nome} ENABLE ROW LEVEL SECURITY`);
      console.log(`   ✅ RLS habilitado`);

      // 6. Criar policy (se não existir)
      try {
        const policyName = `tenant_isolation_${tabela.nome}`;
        await client.query(`
          CREATE POLICY ${policyName} ON ${tabela.nome}
          FOR ALL USING (empresa_id = get_current_tenant())
        `);
        console.log(`   ✅ Policy ${policyName} criada`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`   ⚠️  Policy já existe`);
        } else {
          console.log(`   ❌ Erro ao criar policy: ${err.message}`);
        }
      }

      console.log('');
    }

    // Verificação final
    console.log('🔍 Verificando status RLS...\n');
    const verificacao = await client.query(`
      SELECT 
        tablename,
        CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as rls_status
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('ticket_historico', 'ticket_relacionamentos', 'atendente_skills', 'ticket_tags')
      ORDER BY tablename
    `);

    console.table(verificacao.rows);

    const comRls = verificacao.rows.filter(r => r.rls_status === '✅').length;
    console.log(`\n🎉 Concluído! ${comRls}/4 tabelas com RLS ativo!`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

adicionarEmpresaIdERls();
