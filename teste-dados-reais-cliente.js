/**
 * 🧪 TESTE: BUSCA DE DADOS REAIS DO CLIENTE
 * 
 * Este script testa a nova funcionalidade de buscar dados reais do cliente
 * em vez de gerar emails fictícios.
 */

console.log('🧪 INICIANDO TESTE DE BUSCA DE DADOS REAIS...\n');

// Configuração da API
const API_URL = 'http://localhost:3001';

// Simulação do novo comportamento do PropostaActions
async function testarBuscaDadosReais() {
  try {
    console.log('📊 1. Buscando propostas para teste...');

    const response = await fetch(`${API_URL}/propostas`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    if (!data.propostas || data.propostas.length === 0) {
      console.log('❌ Nenhuma proposta encontrada para teste');
      return;
    }

    console.log(`✅ ${data.propostas.length} propostas encontradas\n`);

    // Pegar primeira proposta para teste
    const proposta = data.propostas[0];
    console.log(`🔍 2. Testando busca de dados para proposta: ${proposta.numero}`);
    console.log(`   Cliente na proposta: "${proposta.cliente}"`);
    console.log(`   Tipo do cliente: ${typeof proposta.cliente}\n`);

    // Simular nova lógica do getClienteData
    await simularNovaLogicaBusca(proposta);

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

async function simularNovaLogicaBusca(proposta) {
  console.log('🔄 3. NOVA LÓGICA DE BUSCA IMPLEMENTADA:');

  // Verificar se é formato completo (objeto)
  if (typeof proposta.cliente === 'object' && proposta.cliente) {
    console.log('   ✅ Formato completo (objeto) - usar dados diretamente');
    console.log(`   Nome: ${proposta.cliente.nome}`);
    console.log(`   Email: ${proposta.cliente.email || 'NÃO INFORMADO'}`);
    console.log(`   Telefone: ${proposta.cliente.telefone || 'NÃO INFORMADO'}`);
    return;
  }

  // Formato UI (string) - buscar dados reais
  const nomeCliente = proposta.cliente || 'Cliente';
  console.log(`   📝 Formato UI (string) - Nome: "${nomeCliente}"`);

  // Verificar se cliente_contato é email válido
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let email = '';
  let telefone = '';

  if (proposta.cliente_contato && emailRegex.test(proposta.cliente_contato)) {
    email = proposta.cliente_contato;
    console.log(`   ✅ Email encontrado em cliente_contato: ${email}`);
  } else {
    console.log(`   ⚠️ cliente_contato não é email válido: "${proposta.cliente_contato}"`);
  }

  // Buscar cliente real no backend
  if (!email && nomeCliente && nomeCliente !== 'Cliente') {
    console.log(`   🔍 Buscando cliente real por nome: "${nomeCliente}"`);

    try {
      const searchResponse = await fetch(`${API_URL}/clientes?search=${encodeURIComponent(nomeCliente)}`);
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();

        if (searchData.data && searchData.data.length > 0) {
          // Buscar correspondência exata
          const clienteExato = searchData.data.find(c =>
            c.nome.toLowerCase().trim() === nomeCliente.toLowerCase().trim()
          );

          const clienteReal = clienteExato || searchData.data[0];

          console.log(`   ✅ CLIENTE REAL ENCONTRADO:`);
          console.log(`      ID: ${clienteReal.id}`);
          console.log(`      Nome: ${clienteReal.nome}`);
          console.log(`      Email: ${clienteReal.email || 'NÃO INFORMADO'}`);
          console.log(`      Telefone: ${clienteReal.telefone || 'NÃO INFORMADO'}`);

          return {
            nome: clienteReal.nome,
            email: clienteReal.email || '',
            telefone: clienteReal.telefone || ''
          };
        } else {
          console.log(`   ❌ Nenhum cliente encontrado com nome: "${nomeCliente}"`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Erro ao buscar cliente: ${error.message}`);
    }
  }

  // Resultado final - APENAS DADOS DISPONÍVEIS (sem fictícios)
  console.log(`   🎯 RESULTADO FINAL (SEM FICTÍCIOS):`);
  console.log(`      Nome: ${nomeCliente}`);
  console.log(`      Email: ${email || 'NÃO INFORMADO'}`);
  console.log(`      Telefone: ${telefone || 'NÃO INFORMADO'}`);

  if (!email) {
    console.log(`   ⚠️ AVISO: Cliente sem email - usuário precisará informar manualmente`);
  }

  return { nome: nomeCliente, email, telefone };
}

// Executar teste
testarBuscaDadosReais();
