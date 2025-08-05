/**
 * 🔧 Teste Específico de Mapeamento Token → Proposta
 * Diagnosticar o problema de sincronização Portal → CRM
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

async function diagnosticarMapeamento() {
  console.log('🔍 DIAGNÓSTICO ESPECÍFICO: Mapeamento Token → Proposta\n');

  // 1. Listar propostas existentes primeiro
  console.log('1️⃣ Listando propostas existentes...');
  const listar = await makeRequest(`${BASE_URL}/propostas`);

  if (listar.ok) {
    console.log('📋 Propostas no sistema:');
    listar.data.propostas.forEach((prop, index) => {
      console.log(`   ${index + 1}. ID: ${prop.id} | Status: ${prop.status} | Título: ${prop.titulo || 'N/A'}`);
    });

    if (listar.data.propostas.length === 0) {
      console.log('⚠️ Nenhuma proposta encontrada! Criando uma para teste...');

      // Criar uma proposta de teste
      const criar = await makeRequest(`${BASE_URL}/propostas/1/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'rascunho',
          observacoes: 'Proposta criada para teste de mapeamento'
        })
      });

      if (criar.ok) {
        console.log('✅ Proposta teste criada:', criar.data.proposta.id);
      }
    }
  }

  // 2. Testar diferentes tokens com mapeamento
  const tokensParaTestar = [
    'token-teste-workflow-999',  // Token usado no teste anterior
    'test-token-123',            // Token usado no primeiro teste
    'PROP-001',                  // Token do mapeamento
    'TEST-001'                   // Outro token do mapeamento
  ];

  for (const token of tokensParaTestar) {
    console.log(`\n2️⃣ Testando token: ${token}`);

    // Tentar atualizar via portal
    const portalUpdate = await makeRequest(`${BASE_URL}/api/portal/proposta/${token}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'aprovada',
        timestamp: new Date().toISOString()
      })
    });

    if (portalUpdate.ok) {
      console.log(`✅ Portal aceito para token ${token}`);
      console.log(`📄 Proposta ID retornada: ${portalUpdate.data.proposta?.id}`);
      console.log(`📊 Status aplicado: ${portalUpdate.data.proposta?.status}`);

      // Agora verificar se essa proposta aparece na lista
      const verificarLista = await makeRequest(`${BASE_URL}/propostas`);
      if (verificarLista.ok) {
        console.log(`📋 Propostas após update via ${token}:`);
        verificarLista.data.propostas.forEach((prop, index) => {
          const isTarget = prop.id === portalUpdate.data.proposta?.id;
          const marker = isTarget ? '🎯' : '  ';
          console.log(`${marker} ${index + 1}. ID: ${prop.id} | Status: ${prop.status}`);
        });
      }
    } else {
      console.log(`❌ Portal rejeitou token ${token}:`, portalUpdate.error || portalUpdate.data);
    }
  }

  // 3. Verificar a proposta ID 1 especificamente
  console.log(`\n3️⃣ Verificando proposta ID 1 especificamente...`);
  const verificarID1 = await makeRequest(`${BASE_URL}/propostas/1`);

  if (verificarID1.ok) {
    console.log('📊 Proposta ID 1:', {
      id: verificarID1.data.proposta?.id,
      status: verificarID1.data.proposta?.status,
      updatedAt: verificarID1.data.proposta?.updatedAt
    });
  } else {
    console.log('❌ Proposta ID 1 não encontrada:', verificarID1.error || verificarID1.data);
  }

  // 4. Testar update direto no ID 1
  console.log(`\n4️⃣ Testando update direto na proposta ID 1...`);
  const updateDireto = await makeRequest(`${BASE_URL}/propostas/1/status`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'aprovada-teste-direto',
      observacoes: 'Teste direto no ID 1'
    })
  });

  if (updateDireto.ok) {
    console.log('✅ Update direto funcionou:', updateDireto.data.proposta?.status);

    // Verificar se aparece na lista
    const verificarFinal = await makeRequest(`${BASE_URL}/propostas`);
    if (verificarFinal.ok) {
      console.log('📋 Lista final de propostas:');
      verificarFinal.data.propostas.forEach((prop, index) => {
        const isID1 = prop.id === '1';
        const marker = isID1 ? '🎯' : '  ';
        console.log(`${marker} ${index + 1}. ID: ${prop.id} | Status: ${prop.status}`);
      });
    }
  } else {
    console.log('❌ Update direto falhou:', updateDireto.error || updateDireto.data);
  }

  console.log('\n✨ DIAGNÓSTICO COMPLETO!');
}

// Executar diagnóstico
diagnosticarMapeamento().catch(console.error);
