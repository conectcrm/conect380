// Script para criar assinatura de teste
const { Pool } = require('pg');

async function createTestSubscription() {
  const pool = new Pool({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db',
  });

  try {
    console.log('🔍 Verificando empresas existentes...');

    // Buscar empresas
    const empresas = await pool.query('SELECT id, nome, email FROM empresas LIMIT 5');
    console.log('🏢 Empresas encontradas:');
    empresas.rows.forEach(empresa => {
      console.log(`  📋 ${empresa.nome} (${empresa.id}) - ${empresa.email}`);
    });

    if (empresas.rows.length === 0) {
      console.log('❌ Nenhuma empresa encontrada!');
      return;
    }

    // Buscar planos
    const planos = await pool.query('SELECT id, nome, codigo FROM planos');
    console.log('\n💰 Planos disponíveis:');
    planos.rows.forEach(plano => {
      console.log(`  📋 ${plano.nome} (${plano.id}) - ${plano.codigo}`);
    });

    // Criar assinatura para a primeira empresa
    const empresa = empresas.rows[0];
    const planoStarter = planos.rows.find(p => p.codigo === 'starter');

    if (!planoStarter) {
      console.log('❌ Plano Starter não encontrado!');
      return;
    }

    console.log(`\n🚀 Criando assinatura para empresa: ${empresa.nome}`);

    // Verificar se já existe assinatura
    const assinaturaExistente = await pool.query(
      'SELECT id FROM assinaturas_empresa WHERE empresa_id = $1',
      [empresa.id]
    );

    if (assinaturaExistente.rows.length > 0) {
      console.log('⚠️ Empresa já possui assinatura ativa');
      return;
    }

    // Criar assinatura
    const novaAssinatura = await pool.query(`
      INSERT INTO assinaturas_empresa (
        empresa_id, 
        plano_id, 
        status, 
        data_inicio, 
        valor_pago,
        contador_usuarios,
        contador_clientes,
        contador_storage,
        contador_api_calls
      ) VALUES ($1, $2, 'ativa', NOW(), $3, 0, 0, 0, 0)
      RETURNING id
    `, [empresa.id, planoStarter.id, 99.90]);

    console.log(`✅ Assinatura criada com ID: ${novaAssinatura.rows[0].id}`);

    // Verificar assinatura criada
    const assinatura = await pool.query(`
      SELECT 
        ae.id,
        ae.status,
        ae.data_inicio,
        ae.valor_pago,
        p.nome as plano_nome,
        p.codigo as plano_codigo,
        e.nome as empresa_nome
      FROM assinaturas_empresa ae
      JOIN planos p ON ae.plano_id = p.id
      JOIN empresas e ON ae.empresa_id = e.id
      WHERE ae.empresa_id = $1
    `, [empresa.id]);

    console.log('\n📊 Assinatura criada:');
    const ass = assinatura.rows[0];
    console.log(`  🏢 Empresa: ${ass.empresa_nome}`);
    console.log(`  💰 Plano: ${ass.plano_nome} (${ass.plano_codigo})`);
    console.log(`  📅 Status: ${ass.status}`);
    console.log(`  💵 Valor: R$ ${ass.valor_pago}`);
    console.log(`  📅 Início: ${ass.data_inicio}`);

    console.log('\n✅ Assinatura de teste criada com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar
createTestSubscription();
