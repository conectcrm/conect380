/**
 * Debug: Verificar se o vendedor está sendo carregado nas propostas
 */

async function debugVendedor() {
  try {
    console.log('🔍 Testando carregamento do vendedor nas propostas...');

    // 1. Buscar propostas
    const response = await fetch('http://localhost:3001/propostas');
    const data = await response.json();

    if (data.success && data.propostas.length > 0) {
      const proposta = data.propostas[0];
      console.log('\n📋 Primeira proposta encontrada:');
      console.log('ID:', proposta.id);
      console.log('Número:', proposta.numero);
      console.log('Vendedor tipo:', typeof proposta.vendedor);
      console.log('Vendedor valor:', proposta.vendedor);

      // 2. Buscar essa proposta específica via GET /propostas/:id
      console.log('\n🔍 Buscando proposta específica...');
      const propostaResponse = await fetch(`http://localhost:3001/propostas/${proposta.id}`);
      const propostaData = await propostaResponse.json();

      if (propostaData.success) {
        console.log('Vendedor na proposta específica:', propostaData.proposta.vendedor);
        console.log('Tipo do vendedor:', typeof propostaData.proposta.vendedor);
      }

      // 3. Se vendedor é string (ID), buscar dados do vendedor
      if (typeof proposta.vendedor === 'string') {
        console.log('\n👤 Buscando dados do vendedor via users...');
        try {
          const userResponse = await fetch(`http://localhost:3001/users/${proposta.vendedor}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('✅ Dados do vendedor encontrados:');
            console.log('  Nome:', userData.nome);
            console.log('  Email:', userData.email);
            console.log('  Role:', userData.role);
          } else {
            console.log('❌ Erro ao buscar dados do vendedor');
          }
        } catch (error) {
          console.log('❌ Erro na requisição do vendedor:', error.message);
        }
      }
    } else {
      console.log('❌ Nenhuma proposta encontrada');
    }

  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

// Executar teste
if (typeof fetch === 'undefined') {
  const fetch = require('node-fetch');
  global.fetch = fetch;
}

debugVendedor();
