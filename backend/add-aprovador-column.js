require('dotenv').config();
const { Client } = require('pg');

async function addAprovadorColumn() {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db',
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Adicionar coluna aprovador_id
    await client.query(`
      ALTER TABLE cotacoes 
      ADD COLUMN IF NOT EXISTS aprovador_id uuid;
    `);
    console.log('✅ Coluna aprovador_id adicionada');

    // Adicionar foreign key
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'FK_cotacoes_aprovador'
        ) THEN
          ALTER TABLE cotacoes 
          ADD CONSTRAINT FK_cotacoes_aprovador 
          FOREIGN KEY (aprovador_id) REFERENCES users(id);
        END IF;
      END $$;
    `);
    console.log('✅ Foreign key FK_cotacoes_aprovador adicionada');

    console.log('\n🎉 Migration concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addAprovadorColumn();
