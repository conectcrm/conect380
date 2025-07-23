require('dotenv').config();

console.log('DATABASE_HOST:', process.env.DATABASE_HOST);
console.log('DATABASE_PORT:', process.env.DATABASE_PORT);
console.log('DATABASE_USERNAME:', process.env.DATABASE_USERNAME);
console.log('DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD);
console.log('DATABASE_NAME:', process.env.DATABASE_NAME);

const { Client } = require('pg');

const client = new Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5434,
  user: process.env.DATABASE_USERNAME || 'conectcrm',
  password: process.env.DATABASE_PASSWORD || 'conectcrm123',
  database: process.env.DATABASE_NAME || 'conectcrm_db',
});

client.connect()
  .then(() => {
    console.log('✅ Conexão PostgreSQL OK!');
    return client.query('SELECT version()');
  })
  .then(result => {
    console.log('📋 Versão PostgreSQL:', result.rows[0].version);
    client.end();
  })
  .catch(err => {
    console.error('❌ Erro na conexão:', err.message);
    client.end();
  });
