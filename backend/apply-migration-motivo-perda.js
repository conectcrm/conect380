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

async function applyMigration() {
  try {
    await ds.initialize();
    console.log('✅ Conectado ao banco de dados\n');

    console.log('📝 Aplicando migration: AddMotivosPerdaSLAOportunidades...\n');

    // 1. Criar enum type
    console.log('1/8 Criando enum motivo_perda...');
    await ds.query(`
      DO $$ BEGIN
        CREATE TYPE oportunidades_motivo_perda_enum AS ENUM (
          'preco',
          'concorrente',
          'timing',
          'orcamento',
          'produto',
          'projeto_cancelado',
          'sem_resposta',
          'outro'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('   ✅ Enum criado\n');

    // 2. Adicionar coluna motivo_perda
    console.log('2/8 Adicionando coluna motivo_perda...');
    await ds.query(`
      ALTER TABLE oportunidades 
      ADD COLUMN IF NOT EXISTS motivo_perda oportunidades_motivo_perda_enum
    `);
    console.log('   ✅ Coluna motivo_perda adicionada\n');

    // 3. Adicionar coluna motivo_perda_detalhes
    console.log('3/8 Adicionando coluna motivo_perda_detalhes...');
    await ds.query(`
      ALTER TABLE oportunidades 
      ADD COLUMN IF NOT EXISTS motivo_perda_detalhes text
    `);
    console.log('   ✅ Coluna motivo_perda_detalhes adicionada\n');

    // 4. Adicionar coluna concorrente_nome
    console.log('4/8 Adicionando coluna concorrente_nome...');
    await ds.query(`
      ALTER TABLE oportunidades 
      ADD COLUMN IF NOT EXISTS concorrente_nome character varying(100)
    `);
    console.log('   ✅ Coluna concorrente_nome adicionada\n');

    // 5. Adicionar coluna data_revisao
    console.log('5/8 Adicionando coluna data_revisao...');
    await ds.query(`
      ALTER TABLE oportunidades 
      ADD COLUMN IF NOT EXISTS data_revisao TIMESTAMP
    `);
    console.log('   ✅ Coluna data_revisao adicionada\n');

    // 6. Adicionar coluna data_ultima_mudanca_estagio
    console.log('6/8 Adicionando coluna data_ultima_mudanca_estagio...');
    await ds.query(`
      ALTER TABLE oportunidades 
      ADD COLUMN IF NOT EXISTS data_ultima_mudanca_estagio TIMESTAMP DEFAULT now()
    `);

    // Atualizar registros existentes
    await ds.query(`
      UPDATE oportunidades 
      SET data_ultima_mudanca_estagio = "updatedAt"
      WHERE data_ultima_mudanca_estagio IS NULL
    `);
    console.log('   ✅ Coluna data_ultima_mudanca_estagio adicionada e populada\n');

    // 7. Adicionar coluna dias_no_estagio_atual
    console.log('7/8 Adicionando coluna dias_no_estagio_atual...');
    await ds.query(`
      ALTER TABLE oportunidades 
      ADD COLUMN IF NOT EXISTS dias_no_estagio_atual integer DEFAULT 0
    `);

    // Calcular dias para registros existentes
    await ds.query(`
      UPDATE oportunidades 
      SET dias_no_estagio_atual = EXTRACT(DAY FROM (now() - "updatedAt"))::integer
      WHERE dias_no_estagio_atual = 0
    `);
    console.log('   ✅ Coluna dias_no_estagio_atual adicionada e calculada\n');

    // 8. Adicionar coluna precisa_atencao
    console.log('8/8 Adicionando coluna precisa_atencao...');
    await ds.query(`
      ALTER TABLE oportunidades 
      ADD COLUMN IF NOT EXISTS precisa_atencao boolean DEFAULT false
    `);

    // Marcar oportunidades que estão há mais de 7 dias no mesmo estágio
    await ds.query(`
      UPDATE oportunidades 
      SET precisa_atencao = true
      WHERE dias_no_estagio_atual > 7 AND estagio NOT IN ('won', 'lost')
    `);
    console.log('   ✅ Coluna precisa_atencao adicionada e calculada\n');

    // 9. Criar índices para performance
    console.log('➕ Criando índices...');
    await ds.query(`
      CREATE INDEX IF NOT EXISTS idx_oportunidades_motivo_perda 
      ON oportunidades (motivo_perda) 
      WHERE motivo_perda IS NOT NULL
    `);

    await ds.query(`
      CREATE INDEX IF NOT EXISTS idx_oportunidades_precisa_atencao 
      ON oportunidades (precisa_atencao) 
      WHERE precisa_atencao = true
    `);

    await ds.query(`
      CREATE INDEX IF NOT EXISTS idx_oportunidades_dias_estagio 
      ON oportunidades (dias_no_estagio_atual, estagio)
    `);
    console.log('   ✅ Índices criados\n');

    console.log('🎉 Migration aplicada com sucesso!\n');

    // Verificar resultado
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

    console.log('📊 Verificação final - Colunas criadas:');
    result.forEach(col => {
      console.log(`   ✅ ${col.column_name} (${col.data_type})`);
    });

    await ds.destroy();
    console.log('\n✅ Conexão fechada. Migração concluída!');

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

applyMigration();
