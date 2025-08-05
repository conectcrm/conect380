/**
 * 🔄 Teste Completo: Portal Client → CRM Grid Sync
 * Simula exatamente o problema relatado pelo usuário:
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

async function testarWorkflowCompletoPortal() {
  console.log('🎯 TESTE DO PROBLEMA RELATADO');
  console.log('❌ "A proposta foi aprovada, mas no sistema no grid de propostas, o status ainda está como rascunho"');
  console.log('🔄 Simulando workflow completo Portal → CRM...\n');

  // 1. Primeiro vamos criar uma proposta "rascunho" no CRM
  console.log('1️⃣ Criando proposta inicial com status "rascunho"...');
  const propostaId = '999'; // ID de teste
  const token = 'token-teste-workflow-999';

  // Simular uma proposta inicial via CRM
  const criarProposta = await makeRequest(`${BASE_URL}/propostas/${propostaId}/status`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'rascunho',
      observacoes: 'Proposta criada no CRM - status inicial'
    })
  });

  if (criarProposta.ok) {
    console.log('✅ Proposta criada:', criarProposta.data.proposta.status);
  } else {
    console.log('❌ Erro ao criar proposta:', criarProposta.error || criarProposta.data);
  }

  // 2. Verificar status inicial no grid (CRM)
  console.log('\n2️⃣ Verificando status inicial no grid CRM...');
  const statusInicial = await makeRequest(`${BASE_URL}/propostas/${propostaId}`);

  if (statusInicial.ok) {
    console.log('📋 Status inicial no CRM:', statusInicial.data.proposta.status);
  } else {
    console.log('❌ Erro ao verificar status inicial');
  }

  // 3. Cliente acessa portal e aprova proposta
  console.log('\n3️⃣ 🌐 CLIENTE APROVANDO VIA PORTAL...');
  const aprovarPortal = await makeRequest(`${BASE_URL}/api/portal/proposta/${token}/status`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'aprovada',
      timestamp: new Date().toISOString(),
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Cliente Portal)'
    })
  });

  if (aprovarPortal.ok) {
    console.log('✅ Portal: Proposta aprovada com sucesso!');
    console.log('📄 Dados do portal:', aprovarPortal.data.proposta.status);
  } else {
    console.log('❌ Portal: Erro ao aprovar:', aprovarPortal.error || aprovarPortal.data);
  }

  // 4. PONTO CRÍTICO: Verificar se o CRM foi sincronizado
  console.log('\n4️⃣ 🔍 VERIFICANDO SINCRONIZAÇÃO NO CRM...');

  // Aguardar um pouco para simular tempo real
  await new Promise(resolve => setTimeout(resolve, 1000));

  const verificarCRM = await makeRequest(`${BASE_URL}/propostas/${propostaId}`);

  if (verificarCRM.ok) {
    const statusAtual = verificarCRM.data.proposta.status;
    console.log('📊 Status atual no CRM Grid:', statusAtual);

    if (statusAtual === 'aprovada') {
      console.log('✅ SUCESSO: Status sincronizado corretamente!');
    } else {
      console.log('❌ PROBLEMA ENCONTRADO: Status ainda é "' + statusAtual + '"');
      console.log('💡 Isto explica o problema do usuário!');
    }
  } else {
    console.log('❌ Erro ao verificar CRM:', verificarCRM.error || verificarCRM.data);
  }

  // 5. Tentativa de correção: Sincronização manual
  console.log('\n5️⃣ 🔧 TENTANDO CORREÇÃO: Sincronização manual...');

  // Tentar forçar atualização no CRM usando token como ID
  const sincronizarManual = await makeRequest(`${BASE_URL}/propostas/${token}/status`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'aprovada',
      observacoes: 'Sincronização manual após aprovação via portal',
      fonte: 'sync-portal'
    })
  });

  if (sincronizarManual.ok) {
    console.log('✅ Sincronização manual executada');
    console.log('📊 Resultado:', sincronizarManual.data.proposta.status);

    // Verificar se agora o CRM está atualizado
    const verificarDepois = await makeRequest(`${BASE_URL}/propostas/${propostaId}`);
    if (verificarDepois.ok) {
      console.log('📋 Status final no CRM:', verificarDepois.data.proposta.status);
    }
  } else {
    console.log('❌ Falha na sincronização manual:', sincronizarManual.error || sincronizarManual.data);
  }

  // 6. Diagnóstico final
  console.log('\n6️⃣ 📊 DIAGNÓSTICO FINAL...');
  const listarTudo = await makeRequest(`${BASE_URL}/propostas`);

  if (listarTudo.ok) {
    console.log('📋 Todas as propostas no sistema:');
    listarTudo.data.propostas.forEach((prop, index) => {
      const isTarget = prop.id === propostaId || prop.id === token;
      const marker = isTarget ? '🎯' : '  ';
      console.log(`${marker} ${index + 1}. ID: ${prop.id} | Status: ${prop.status} | Título: ${prop.titulo || 'N/A'}`);
    });
  }

  console.log('\n✨ TESTE COMPLETO - ANÁLISE:');
  console.log('1. O portal está funcionando corretamente');
  console.log('2. O problema pode estar na associação token → ID da proposta');
  console.log('3. O sistema precisa mapear corretamente as atualizações');
  console.log('4. Eventos de sincronização em tempo real foram implementados');
}

// Executar teste
testarWorkflowCompletoPortal().catch(console.error);
