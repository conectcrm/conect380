/**
 * 🔍 TESTE: BUSCAR DADOS REAIS DO DHONLENO FREITAS
 * 
 * Este script testa se conseguimos buscar os dados corretos
 * do cliente Dhonleno Freitas que estão no cadastro.
 */

console.log('🔍 BUSCANDO DADOS REAIS DO DHONLENO FREITAS...\n');

// Configuração da API
const API_URL = 'http://localhost:3001';

async function buscarDadosReaisDhonleno() {
  try {
    console.log('📡 1. Buscando todos os clientes...');

    const response = await fetch(`${API_URL}/clientes`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const clientes = await response.json();
    console.log(`✅ ${clientes.data ? clientes.data.length : clientes.length} clientes encontrados\n`);

    // Buscar Dhonleno especificamente
    const clientesData = clientes.data || clientes;
    const dhonleno = clientesData.find(cliente =>
      cliente.nome.toLowerCase().includes('dhonleno')
    );

    if (dhonleno) {
      console.log('👤 2. CLIENTE DHONLENO ENCONTRADO:');
      console.log(`   ID: ${dhonleno.id}`);
      console.log(`   Nome: ${dhonleno.nome}`);
      console.log(`   Email: ${dhonleno.email}`);
      console.log(`   Telefone: ${dhonleno.telefone}`);
      console.log(`   Documento: ${dhonleno.documento || 'N/A'}`);
      console.log(`   Status: ${dhonleno.status}`);
      console.log(`   Tipo: ${dhonleno.tipo}`);
    } else {
      console.log('❌ Cliente Dhonleno não encontrado');
      return;
    }

    console.log('\n🔍 3. Testando busca por nome...');

    // Testar busca por nome (como faz o PropostaActions)
    const searchResponse = await fetch(`${API_URL}/clientes?search=${encodeURIComponent('Dhonleno Freitas')}`);
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`   Resultados da busca: ${searchData.data ? searchData.data.length : 0}`);

      if (searchData.data && searchData.data.length > 0) {
        const clienteEncontrado = searchData.data[0];
        console.log(`   ✅ CLIENTE ENCONTRADO NA BUSCA:`);
        console.log(`      Nome: ${clienteEncontrado.nome}`);
        console.log(`      Email: ${clienteEncontrado.email}`);
        console.log(`      Telefone: ${clienteEncontrado.telefone}`);
      }
    }

    console.log('\n📊 4. Verificando propostas...');

    // Verificar propostas do Dhonleno
    const propostasResponse = await fetch(`${API_URL}/propostas`);
    if (propostasResponse.ok) {
      const propostasData = await propostasResponse.json();

      if (propostasData.propostas) {
        const propostasDhonleno = propostasData.propostas.filter(p =>
          (typeof p.cliente === 'object' && p.cliente.nome && p.cliente.nome.toLowerCase().includes('dhonleno')) ||
          (typeof p.cliente === 'string' && p.cliente.toLowerCase().includes('dhonleno'))
        );

        console.log(`   ${propostasDhonleno.length} propostas encontradas para Dhonleno:`);

        propostasDhonleno.forEach((proposta, index) => {
          console.log(`\n   📝 PROPOSTA ${index + 1}: ${proposta.numero}`);

          if (typeof proposta.cliente === 'object') {
            console.log(`      Cliente (objeto):`);
            console.log(`        Nome: ${proposta.cliente.nome}`);
            console.log(`        Email: ${proposta.cliente.email} ${proposta.cliente.email?.includes('@cliente.com') ? '⚠️ FICTÍCIO' : '✅ REAL'}`);
            console.log(`        Telefone: ${proposta.cliente.telefone || 'NÃO INFORMADO'}`);
            console.log(`        ID: ${proposta.cliente.id || 'SEM ID'}`);
          } else {
            console.log(`      Cliente (string): "${proposta.cliente}"`);
          }
        });
      }
    }

    console.log('\n🎯 5. ANÁLISE DO PROBLEMA:');
    console.log(`✅ Cliente real existe: ${dhonleno.nome}`);
    console.log(`✅ Email real: ${dhonleno.email}`);
    console.log(`✅ Telefone real: ${dhonleno.telefone}`);
    console.log('❌ Propostas não estão usando dados reais do cadastro');
    console.log('❌ Propostas têm emails fictícios gerados pelo backend');

  } catch (error) {
    console.error('❌ Erro na busca:', error.message);
  }
}

// Executar busca
buscarDadosReaisDhonleno();
