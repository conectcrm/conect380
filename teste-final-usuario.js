/**
 * 🎯 TESTE FINAL: Problema Exato do Usuário
 * "A proposta foi aprovada, mas no sistema no grid de propostas, o status ainda está como rascunho"
 */

const BASE_URL = 'http://localhost:3001';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { error: error.message, status: 0 };
  }
}

async function testeProblemaUsuario() {
  console.log('🎯 TESTE FINAL - Simulando problema exato do usuário');
  console.log('📋 Cenário: Cliente aprova proposta via portal → Status deve aparecer no grid CRM\n');

  // 1. Estado inicial - proposta em rascunho
  console.log('1️⃣ ESTADO INICIAL: Proposta em rascunho no CRM');
  const inicializar = await makeRequest(`${BASE_URL}/propostas/1/status`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'rascunho',
      observacoes: 'Proposta criada no CRM'
    })
  });

  // Verificar grid inicial
  const gridInicial = await makeRequest(`${BASE_URL}/propostas`);
  if (gridInicial.ok) {
    const proposta1 = gridInicial.data.propostas.find(p => p.id === '1');
    console.log(`📊 Grid CRM: Proposta 1 = ${proposta1?.status || 'não encontrada'}`);
  }

  // 2. Cliente acessa portal via token e aprova
  console.log('\n2️⃣ CLIENTE NO PORTAL: Aprovando via token "TEST-001"');

  const tokenPortal = 'TEST-001'; // Token mapeado para proposta ID 1

  const aprovarPortal = await makeRequest(`${BASE_URL}/api/portal/proposta/${tokenPortal}/status`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'aprovada',
      timestamp: new Date().toISOString(),
      ip: '192.168.1.100',
      userAgent: 'Portal Cliente'
    })
  });

  if (aprovarPortal.ok) {
    console.log('✅ PORTAL: Aprovação registrada com sucesso!');
    console.log(`📄 Proposta retornada pelo portal: ID ${aprovarPortal.data.proposta.id} - Status: ${aprovarPortal.data.proposta.status}`);
  } else {
    console.log('❌ PORTAL: Falha na aprovação:', aprovarPortal.error || aprovarPortal.data);
    return;
  }

  // 3. MOMENTO CRÍTICO: Verificar se o grid CRM foi atualizado
  console.log('\n3️⃣ VERIFICAÇÃO CRÍTICA: Status no grid CRM após aprovação');

  await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar sincronização

  const gridAposAprovacao = await makeRequest(`${BASE_URL}/propostas`);

  if (gridAposAprovacao.ok) {
    const proposta1Atualizada = gridAposAprovacao.data.propostas.find(p => p.id === '1');

    console.log(`📊 Grid CRM após aprovação:`);
    console.log(`   Proposta 1: ${proposta1Atualizada?.status || 'não encontrada'}`);

    if (proposta1Atualizada?.status === 'aprovada') {
      console.log('🎉 SUCESSO! O problema foi RESOLVIDO!');
      console.log('✅ Status sincronizado corretamente Portal → CRM Grid');
    } else {
      console.log('❌ PROBLEMA AINDA EXISTE!');
      console.log(`💔 Esperado: "aprovada", Atual: "${proposta1Atualizada?.status}"`);
    }
  }

  // 4. Verificação dupla: consultar proposta individual
  console.log('\n4️⃣ VERIFICAÇÃO DUPLA: Consultando proposta individual');

  const propostaIndividual = await makeRequest(`${BASE_URL}/propostas/1`);

  if (propostaIndividual.ok) {
    console.log(`📄 Proposta ID 1 (individual): ${propostaIndividual.data.proposta?.status}`);
  }

  // 5. Resumo final
  console.log('\n5️⃣ RESUMO FINAL:');
  const gridFinal = await makeRequest(`${BASE_URL}/propostas`);

  if (gridFinal.ok) {
    console.log('📊 Estado final do grid CRM:');
    gridFinal.data.propostas.forEach((prop, index) => {
      const isTarget = prop.id === '1';
      const icon = isTarget ? '🎯' : '  ';
      console.log(`${icon} ${index + 1}. ID: ${prop.id} | Status: ${prop.status} | Título: ${prop.titulo || 'N/A'}`);
    });

    const proposta1Final = gridFinal.data.propostas.find(p => p.id === '1');

    if (proposta1Final?.status === 'aprovada') {
      console.log('\n🎉 PROBLEMA RESOLVIDO COMPLETAMENTE!');
      console.log('✅ Portal → CRM sincronização funcionando perfeitamente');
    } else {
      console.log('\n❌ Problema ainda persiste - investigação adicional necessária');
    }
  }

  console.log('\n✨ Teste finalizado!');
}

// Executar teste
testeProblemaUsuario().catch(console.error);
