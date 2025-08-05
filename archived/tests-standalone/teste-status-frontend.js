// 🔍 Teste Status Frontend - PROP-2025-042
// Verificando se o frontend está recebendo os dados corretos da API

const API_URL = 'http://localhost:3001';

// Simular a busca que o frontend faz
async function testarStatusFrontend() {
  console.log('🔍 Testando Status no Frontend - PROP-2025-042');
  console.log('='.repeat(60));

  try {
    // 1. Buscar todas as propostas (como faz o frontend)
    console.log('📋 1. Buscando todas as propostas...');
    const responseTodasPropostas = await fetch(`${API_URL}/propostas`);
    const todasPropostas = await responseTodasPropostas.json();

    if (todasPropostas.success && todasPropostas.propostas) {
      const prop042 = todasPropostas.propostas.find(p => p.numero === 'PROP-2025-042');

      if (prop042) {
        console.log('✅ PROP-2025-042 encontrada na lista geral:');
        console.log(`   Status: "${prop042.status}"`);
        console.log(`   Atualizada em: ${prop042.atualizadaEm}`);
        console.log(`   Portal Access:`, prop042.portalAccess);
      } else {
        console.log('❌ PROP-2025-042 não encontrada na lista');
      }
    }

    // 2. Buscar proposta específica por ID
    console.log('\n📄 2. Buscando proposta específica...');

    // Primeiro, vamos descobrir o ID correto
    const prop042 = todasPropostas.propostas?.find(p => p.numero === 'PROP-2025-042');

    if (prop042 && prop042.id) {
      const responseEspecifica = await fetch(`${API_URL}/propostas/${prop042.id}`);
      const propostaEspecifica = await responseEspecifica.json();

      if (propostaEspecifica.success && propostaEspecifica.proposta) {
        console.log('✅ PROP-2025-042 busca específica:');
        console.log(`   Status: "${propostaEspecifica.proposta.status}"`);
        console.log(`   Atualizada em: ${propostaEspecifica.proposta.atualizadaEm}`);
        console.log(`   Portal Access:`, propostaEspecifica.proposta.portalAccess);
      }
    }

    // 3. Verificar filtro por status
    console.log('\n🔍 3. Testando filtro por status "visualizada"...');
    const responseFiltrada = await fetch(`${API_URL}/propostas?status=visualizada`);
    const propostasFiltradas = await responseFiltrada.json();

    if (propostasFiltradas.success && propostasFiltradas.propostas) {
      const prop042Filtrada = propostasFiltradas.propostas.find(p => p.numero === 'PROP-2025-042');

      if (prop042Filtrada) {
        console.log('✅ PROP-2025-042 aparece no filtro "visualizada":');
        console.log(`   Status: "${prop042Filtrada.status}"`);
      } else {
        console.log('❌ PROP-2025-042 NÃO aparece no filtro "visualizada"');
        console.log(`📊 Propostas com status "visualizada": ${propostasFiltradas.propostas.length}`);
        propostasFiltradas.propostas.forEach(p => {
          console.log(`   - ${p.numero}: ${p.status}`);
        });
      }
    }

    // 4. Teste de refresh - simular F5 ou reload
    console.log('\n🔄 4. Simulando refresh da página...');
    const responseRefresh = await fetch(`${API_URL}/propostas`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const propostasRefresh = await responseRefresh.json();

    if (propostasRefresh.success) {
      const prop042Refresh = propostasRefresh.propostas.find(p => p.numero === 'PROP-2025-042');
      console.log('🔄 Status após refresh:');
      console.log(`   Status: "${prop042Refresh?.status}"`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Teste Frontend concluído!');

  } catch (error) {
    console.error('❌ Erro no teste frontend:', error);
  }
}

// Executar teste
testarStatusFrontend();
