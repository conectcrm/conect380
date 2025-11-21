const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db',
  });

  await client.connect();
  try {
    const result = await client.query(
      `INSERT INTO equipes (empresa_id, nome, descricao, cor, icone, ativo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, empresa_id, nome` ,
      ['f47ac10b-58cc-4372-a567-0e02b2c3d479', `Equipe Teste SQL ${Date.now()}`, 'Equipe teste via script', '#123456', 'users', true],
    );
    console.log('Inserido:', result.rows[0]);
  } catch (error) {
    console.error('Erro ao inserir equipe via SQL:', error.message);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Erro inesperado:', err);
});
