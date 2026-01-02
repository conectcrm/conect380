const { DataSource } = require('typeorm');
const { config } = require('dotenv');

config();

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'conectcrm'
});

async function checkColumns() {
  try {
    await ds.initialize();
    console.log('✅ Conectado ao banco de dados');

    const result = await ds.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'oportunidades' 
      AND column_name IN (
        'motivo_perda', 
        'motivo_perda_detalhes',
        'concorrente_nome',
        'data_revisao',
        'data_ultima_mudanca_estagio',
        'dias_no_estagio_atual',
        'precisa_atencao'
      )
      ORDER BY column_name
    `);

    console.log('\n📊 Colunas relacionadas a Motivo de Perda e SLA:\n');

    if (result.length === 0) {
      console.log('❌ Nenhuma das novas colunas foi encontrada no banco!');
      console.log('   Isso significa que synchronize: true não está funcionando ou entity não foi detectada.');
    } else {
      console.log('✅ Colunas encontradas:');
      result.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });

      if (result.length < 7) {
        console.log(`\n⚠️  Esperado: 7 colunas | Encontradas: ${result.length}`);
        console.log('   Faltam:', 7 - result.length, 'colunas');
      } else {
        console.log('\n✅ Todas as 7 colunas foram criadas com sucesso!');
      }
    }

    await ds.destroy();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkColumns();
