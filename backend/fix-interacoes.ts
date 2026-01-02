import * as dotenv from 'dotenv';

dotenv.config();

async function fixInteracoes() {
  const { AppDataSource } = require('./ormconfig.js');
  const dataSource = AppDataSource;

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco');

    const query = `
      UPDATE interacoes 
      SET tipo = CASE
        WHEN canal = 'whatsapp' THEN 'mensagem'
        WHEN canal = 'email' THEN 'email'
        WHEN canal = 'telefone' THEN 'ligacao'
        ELSE 'outro'
      END
      WHERE tipo IS NULL
    `;

    const result = await dataSource.query(query);
    console.log(`✅ Correção aplicada! ${result[1] || 0} registros atualizados`);

    // Verificar
    const check = await dataSource.query(
      'SELECT COUNT(*) as total FROM interacoes WHERE tipo IS NULL'
    );
    console.log(`📊 Registros NULL restantes: ${check[0].total}`);

    await dataSource.destroy();
    console.log('✅ Concluído!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    try {
      await dataSource.destroy();
    } catch { }
    process.exit(1);
  }
}

fixInteracoes();
