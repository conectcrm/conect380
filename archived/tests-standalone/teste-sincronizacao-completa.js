/**
 * Teste completo de sincronização Portal → CRM
 * Simula o workflow: Portal aceita proposta → Sincroniza status → Atualiza grid CRM
 */

const BASE_URL = 'http://localhost:3001';

// Helper para requisições HTTP usando fetch nativo
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

async function testarSincronizacaoCompleta() {
  console.log('🔄 Testando sincronização completa Portal → CRM...\n');

  // 1. Verificar se backend está ativo
  console.log('1️⃣ Verificando backend...');
  const backendCheck = await makeRequest(`${BASE_URL}/email/status`);

  if (backendCheck.error) {
    console.error('❌ Backend não disponível:', backendCheck.error);
    return;
  }
  console.log('✅ Backend ativo:', backendCheck.data.service);

  // 2. Simular dados de teste
  const propostaId = 1;
  const token = 'test-token-123';
  const novoStatus = 'aprovada';

  console.log('\n📋 Dados de teste:');
  console.log(`- ID Proposta: ${propostaId}`);
  console.log(`- Token: ${token}`);
  console.log(`- Novo Status: ${novoStatus}`);

  // 3. Testar endpoint do portal
  console.log('\n2️⃣ Testando endpoint do portal...');
  const portalResult = await makeRequest(
    `${BASE_URL}/api/portal/proposta/${token}/status`,
    {
      method: 'PUT',
      body: JSON.stringify({ status: novoStatus })
    }
  );

  if (portalResult.error) {
    console.log('❌ Portal endpoint error:', portalResult.error);
  } else {
    console.log('✅ Portal endpoint:', portalResult.status, portalResult.data);
  }

  // 4. Testar endpoint do CRM
  console.log('\n3️⃣ Testando endpoint do CRM...');
  const crmResult = await makeRequest(
    `${BASE_URL}/propostas/${propostaId}/status`,
    {
      method: 'PUT',
      body: JSON.stringify({ status: novoStatus })
    }
  );

  if (crmResult.error) {
    console.log('❌ CRM endpoint error:', crmResult.error);
  } else {
    console.log('✅ CRM endpoint:', crmResult.status, crmResult.data);
  }

  // 5. Verificar estado atual da proposta
  console.log('\n4️⃣ Verificando estado atual...');
  const checkResult = await makeRequest(`${BASE_URL}/propostas/${propostaId}`);

  if (checkResult.error) {
    console.log('❌ Erro ao verificar estado:', checkResult.error);
  } else {
    console.log('✅ Estado atual:', {
      id: checkResult.data.id,
      status: checkResult.data.status,
      titulo: checkResult.data.titulo
    });
  }

  // 6. Listar todas as propostas para verificar
  console.log('\n5️⃣ Listando todas as propostas...');
  const listResult = await makeRequest(`${BASE_URL}/propostas`);

  if (listResult.error) {
    console.log('❌ Erro ao listar propostas:', listResult.error);
  } else {
    console.log('✅ Total de propostas:', listResult.data.total);

    if (listResult.data.propostas && listResult.data.propostas.length > 0) {
      console.log('\n📋 Propostas encontradas:');
      listResult.data.propostas.forEach((prop, index) => {
        console.log(`${index + 1}. ID: ${prop.id} | Status: ${prop.status} | Título: ${prop.titulo}`);
      });
    } else {
      console.log('📋 Nenhuma proposta encontrada no sistema');
    }
  }

  console.log('\n✨ Teste completo finalizado!');
}

// Executar teste
testarSincronizacaoCompleta().catch(console.error);
