const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    database: 'conectcrm_db',
    user: 'conectcrm',
    password: 'conectcrm123'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    const empresaId = '603818c7-c165-4e34-bfb2-eb4161c93e91';

    // Criar canal de teste
    const result = await client.query(`
      INSERT INTO canais (
        nome, tipo, "empresaId", ativo, configuracao, "createdAt", "updatedAt"
      ) VALUES (
        'Canal WhatsApp Teste',
        'WHATSAPP',
        $1,
        false,
        '{"numero": "+5511999999999", "token": "test_token"}'::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING
      RETURNING id, nome, tipo
    `, [empresaId]);

    if (result.rows.length > 0) {
      console.log('\n✅ Canal criado com sucesso!');
      console.log('   ID:', result.rows[0].id);
      console.log('   Nome:', result.rows[0].nome);
      console.log('   Tipo:', result.rows[0].tipo);
    } else {
      console.log('\n⚠️ Canal já existe');
    }

    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
})();
