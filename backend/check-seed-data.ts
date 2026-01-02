import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkSeedData() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'conectcrm',
    synchronize: false,
  });

  console.log('\n🔍 Verificando dados seed...\n');

  const niveis = await connection.query(
    'SELECT codigo, nome FROM niveis_atendimento ORDER BY codigo'
  );
  console.log('✅ NÍVEIS DE ATENDIMENTO:');
  niveis.forEach((n: any) => console.log(`   - ${n.codigo}: ${n.nome}`));

  const status = await connection.query(
    'SELECT nome FROM status_customizados GROUP BY nome ORDER BY nome LIMIT 10'
  );
  console.log('\n✅ STATUS CUSTOMIZADOS:');
  status.forEach((s: any) => console.log(`   - ${s.nome}`));

  const tipos = await connection.query(
    'SELECT nome FROM tipos_servico ORDER BY nome'
  );
  console.log('\n✅ TIPOS DE SERVIÇO:');
  tipos.forEach((t: any) => console.log(`   - ${t.nome}`));

  await connection.close();
  console.log('\n✅ Verificação concluída!\n');
}

checkSeedData().catch((error) => {
  console.error('❌ Erro:', error.message);
  process.exit(1);
});
