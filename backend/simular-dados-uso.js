const { Client } = require('pg');

async function simularDadosUso() {
  console.log('📊 Simulando dados de uso para empresa demo...\n');

  const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // Buscar a empresa demo
    const empresaResult = await client.query(
      "SELECT id FROM empresas WHERE email = 'contato@conectcrm.com'"
    );

    if (empresaResult.rows.length === 0) {
      console.log('❌ Empresa demo não encontrada!');
      return;
    }

    const empresaId = empresaResult.rows[0].id;
    console.log(`📋 Empresa ID: ${empresaId}`);

    // Atualizar dados de uso na assinatura
    const dadosUso = {
      usuariosAtivos: 5,
      clientesCadastrados: 147,
      storageUtilizado: 2048, // 2GB em MB
      apiCallsHoje: 1250
    };

    await client.query(`
      UPDATE assinaturas_empresas 
      SET 
        "usuariosAtivos" = $1,
        "clientesCadastrados" = $2,
        "storageUtilizado" = $3,
        "apiCallsHoje" = $4,
        "ultimaContabilizacaoApi" = NOW()
      WHERE empresa_id = $5
    `, [
      dadosUso.usuariosAtivos,
      dadosUso.clientesCadastrados,
      dadosUso.storageUtilizado,
      dadosUso.apiCallsHoje,
      empresaId
    ]);

    console.log('📊 Dados de uso atualizados:');
    console.log(`   👥 Usuários ativos: ${dadosUso.usuariosAtivos}`);
    console.log(`   👤 Clientes cadastrados: ${dadosUso.clientesCadastrados}`);
    console.log(`   💾 Storage utilizado: ${dadosUso.storageUtilizado} MB (${(dadosUso.storageUtilizado / 1024).toFixed(1)} GB)`);
    console.log(`   🔗 API calls hoje: ${dadosUso.apiCallsHoje}`);

    // Buscar dados da assinatura para verificar limites
    const assinaturaResult = await client.query(`
      SELECT a.*, p.nome as plano_nome, p."limiteUsuarios", p."limiteClientes", 
             p."limiteStorage", p."limiteApiCalls"
      FROM assinaturas_empresas a
      JOIN planos p ON a.plano_id = p.id
      WHERE a.empresa_id = $1
    `, [empresaId]);

    if (assinaturaResult.rows.length > 0) {
      const assinatura = assinaturaResult.rows[0];

      console.log('\n📈 Análise de uso vs. limites:');
      console.log(`   Plano: ${assinatura.plano_nome}`);

      // Usuários
      const percUsuarios = (dadosUso.usuariosAtivos / assinatura.limiteUsuarios) * 100;
      console.log(`   👥 Usuários: ${dadosUso.usuariosAtivos}/${assinatura.limiteUsuarios} (${percUsuarios.toFixed(1)}%)`);

      // Clientes
      const percClientes = (dadosUso.clientesCadastrados / assinatura.limiteClientes) * 100;
      console.log(`   👤 Clientes: ${dadosUso.clientesCadastrados}/${assinatura.limiteClientes} (${percClientes.toFixed(1)}%)`);

      // Storage
      const percStorage = (dadosUso.storageUtilizado / assinatura.limiteStorage) * 100;
      console.log(`   💾 Storage: ${(dadosUso.storageUtilizado / 1024).toFixed(1)}/${(assinatura.limiteStorage / 1024).toFixed(1)} GB (${percStorage.toFixed(1)}%)`);

      // API Calls
      const percApi = (dadosUso.apiCallsHoje / assinatura.limiteApiCalls) * 100;
      console.log(`   🔗 API calls: ${dadosUso.apiCallsHoje}/${assinatura.limiteApiCalls} (${percApi.toFixed(1)}%)`);
    }

    console.log('\n✅ Simulação concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

simularDadosUso().catch(console.error);
