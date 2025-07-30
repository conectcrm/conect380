async function testeObterProposta() {
  const fetch = require('node-fetch');

  try {
    console.log('🔍 Testando endpoint individual de proposta');

    // 1. Primeiro listar todas as propostas para pegar um ID
    console.log('\n📋 Listando propostas para obter IDs...');

    const listResponse = await fetch('http://localhost:3001/propostas');

    if (!listResponse.ok) {
      console.log('❌ Erro ao listar propostas:', listResponse.status);
      return;
    }

    const propostas = await listResponse.json();
    console.log(`📊 ${propostas.length} propostas encontradas`);

    if (propostas.length === 0) {
      console.log('❌ Nenhuma proposta encontrada');
      return;
    }

    // Procurar uma proposta com status "enviada"
    const propostaEnviada = propostas.find(p => p.status === 'enviada');

    if (!propostaEnviada) {
      console.log('❌ Nenhuma proposta com status "enviada" encontrada');
      console.log('📋 Usando a primeira proposta disponível...');
      var propostaTeste = propostas[0];
    } else {
      var propostaTeste = propostaEnviada;
      console.log('✅ Proposta com status "enviada" encontrada');
    }

    console.log(`\n🎯 Testando proposta: ${propostaTeste.id}`);
    console.log(`  Número: ${propostaTeste.numero}`);
    console.log(`  Status: ${propostaTeste.status}`);
    console.log(`  Cliente: ${propostaTeste.cliente?.nome || 'N/A'}`);

    // 2. Testar endpoint individual
    console.log('\n🌐 Testando endpoint GET /propostas/' + propostaTeste.id);

    const individualResponse = await fetch(`http://localhost:3001/propostas/${propostaTeste.id}`);
    const responseText = await individualResponse.text();

    console.log(`Status HTTP: ${individualResponse.status}`);
    console.log('Content-Type:', individualResponse.headers.get('content-type'));
    console.log('Response body (raw):');
    console.log(responseText);

    if (individualResponse.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ Dados retornados pelo endpoint individual:');
        console.log(`  ID: ${data.id}`);
        console.log(`  Número: ${data.numero}`);
        console.log(`  Status: ${data.status}`);
        console.log(`  Cliente: ${JSON.stringify(data.cliente, null, 2)}`);
        console.log(`  Total: ${data.total}`);
      } catch (parseError) {
        console.log('❌ Erro ao fazer parse do JSON:', parseError.message);
      }
    } else {
      console.log('❌ Erro na requisição HTTP');
    }

    // 3. Comparar com dados da listagem
    console.log('\n🔄 Comparação de dados:');
    console.log('Lista vs Individual:');
    console.log(`  Status - Lista: ${propostaTeste.status} | Individual: verificar acima`);
    console.log(`  Cliente - Lista: ${propostaTeste.cliente?.nome || 'N/A'} | Individual: verificar acima`);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testeObterProposta().catch(console.error);
