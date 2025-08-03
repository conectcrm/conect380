const { Pool } = require('pg');

async function verificarBanco() {
  const pool = new Pool({
    user: 'conectcrm_user',
    host: 'localhost',
    database: 'conectcrm_db',
    password: 'conectcrm_password',
    port: 5432,
  });

  try {
    console.log('🔌 Conectando ao banco PostgreSQL...');
    
    // Verificar se a tabela eventos existe
    const tableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'evento'
    `);
    
    if (tableResult.rows.length > 0) {
      console.log('✅ Tabela "evento" encontrada!');
      
      // Verificar estrutura
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'evento'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Estrutura da tabela:');
      columnsResult.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(opcional)' : '(obrigatório)'}`);
      });
      
      // Contar registros
      const countResult = await pool.query('SELECT COUNT(*) as total FROM evento');
      console.log(`\n📊 Eventos no banco: ${countResult.rows[0].total}`);
      
      // Listar eventos se houver
      if (parseInt(countResult.rows[0].total) > 0) {
        const eventsResult = await pool.query('SELECT * FROM evento ORDER BY "criadoEm" DESC LIMIT 5');
        console.log('\n📅 Últimos eventos:');
        eventsResult.rows.forEach((evento, index) => {
          console.log(`  ${index + 1}. ${evento.titulo} - ${evento.dataInicio}`);
        });
      }
      
    } else {
      console.log('❌ Tabela "evento" não foi encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarBanco();
