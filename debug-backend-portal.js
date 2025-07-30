// Debug do backend para verificar onde está o erro 500
// Execute: node debug-backend-portal.js

const fetch = require('node-fetch');

async function testarPortalBackend() {
  console.log('🧪 Testando backend portal diretamente...');

  const baseUrl = 'http://localhost:3001';

  // 1. Primeiro buscar propostas para ver quais existem
  try {
    console.log('\n📋 1. Listando propostas existentes...');
    const response = await fetch(`${baseUrl}/propostas`);
    const data = await response.json();

    if (data.success && data.propostas) {
      console.log(`✅ ${data.propostas.length} propostas encontradas`);

      const proposta = data.propostas.find(p => p.numero === 'PROP-2025-049') || data.propostas[0];

      if (proposta) {
        console.log(`\n📊 Proposta selecionada:`, {
          id: proposta.id,
          numero: proposta.numero,
          status: proposta.status,
          idTipo: typeof proposta.id
        });

        // 2. Testar portal endpoint com token correto
        console.log('\n🎯 2. Testando portal endpoint PUT...');
        try {
          const portalResponse = await fetch(`${baseUrl}/api/portal/proposta/${proposta.numero}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: 'rejeitada',
              timestamp: new Date().toISOString()
            })
          });

          const portalData = await portalResponse.json();
          console.log(`📊 Portal Response (${portalResponse.status}):`, portalData);

        } catch (portalError) {
          console.error('❌ Erro no portal endpoint:', portalError.message);
        }

        // 3. Testar endpoint principal de propostas
        console.log('\n🎯 3. Testando propostas endpoint PUT...');
        try {
          const propostasResponse = await fetch(`${baseUrl}/propostas/${proposta.id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: 'rejeitada'
            })
          });

          const propostasData = await propostasResponse.json();
          console.log(`📊 Propostas Response (${propostasResponse.status}):`, propostasData);

        } catch (propostasError) {
          console.error('❌ Erro no propostas endpoint:', propostasError.message);
        }

        // 4. Testar busca por ID específico
        console.log('\n🎯 4. Testando busca por ID específico...');
        try {
          const getResponse = await fetch(`${baseUrl}/propostas/${proposta.id}`);
          const getData = await getResponse.json();
          console.log(`📊 GET by ID Response (${getResponse.status}):`, getData);

        } catch (getError) {
          console.error('❌ Erro ao buscar por ID:', getError.message);
        }

      } else {
        console.log('❌ Nenhuma proposta encontrada');
      }
    } else {
      console.log('❌ Erro ao listar propostas:', data);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
testarPortalBackend().catch(console.error);
