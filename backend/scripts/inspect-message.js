require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

async function main() {
  const [messageId] = process.argv.slice(2);

  if (!messageId) {
    console.error('Usage: node scripts/inspect-message.js <mensagem-id>');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await client.connect();

    const query = `
      SELECT m.id,
             m.ticket_id AS "ticketId",
             m.anexos AS midia,
             t.canal_id AS "canalId",
             c.config AS configuracao
        FROM atendimento_mensagens m
        LEFT JOIN atendimento_tickets t ON t.id = m.ticket_id
        LEFT JOIN atendimento_canais c ON c.id = t.canal_id
       WHERE m.id = $1
    `;

    const result = await client.query(query, [messageId]);

    if (result.rowCount === 0) {
      console.log('Mensagem não encontrada.');
      return;
    }

    const row = result.rows[0];

    console.log(JSON.stringify(row, null, 2));
  } catch (error) {
    console.error('Erro durante consulta:', error);
  } finally {
    await client.end().catch(() => undefined);
  }
}

main();
