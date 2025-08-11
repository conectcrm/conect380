const { Client } = require('pg');

async function corrigirFaturaRestante() {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco');

    // Verificar a fatura com problema
    console.log('\n🔍 Investigando fatura ID 24...');
    const fatura = await client.query('SELECT id, numero, "clienteId" FROM faturas WHERE id = 24');
    console.log('Fatura encontrada:', fatura.rows[0]);

    // Verificar se existe mapping para clienteId 876
    const mapping = await client.query('SELECT * FROM cliente_id_mapping WHERE numeric_id = 876');
    console.log('Mapeamento existente:', mapping.rows);

    // Atualizar para usar clienteId 1 (que tem mapeamento)
    console.log('\n🔄 Atualizando fatura ID 24 para usar clienteId 1...');
    const result = await client.query(
      'UPDATE faturas SET "clienteId" = 1 WHERE id = 24 RETURNING id, numero, "clienteId"'
    );
    
    console.log('✅ Fatura atualizada:', result.rows[0]);
    
    // Verificar se agora consegue buscar o cliente
    console.log('\n🧪 Testando JOIN após atualização...');
    const teste = await client.query(`
      SELECT 
        f.id, 
        f.numero, 
        f."clienteId",
        c.nome,
        c.email
      FROM faturas f
      LEFT JOIN cliente_id_mapping cim ON f."clienteId" = cim.numeric_id
      LEFT JOIN clientes c ON cim.cliente_uuid = c.id
      WHERE f.id = 24
    `);
    
    console.log('Resultado do JOIN:', teste.rows[0]);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

corrigirFaturaRestante();
