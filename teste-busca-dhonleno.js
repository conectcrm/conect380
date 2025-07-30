/**
 * 🧪 TESTE: BUSCA ESPECÍFICA DO DHONLENO
 * 
 * Testar diferentes métodos de busca para encontrar
 * o cliente Dhonleno Freitas com dados corretos.
 */

console.log('🧪 TESTANDO BUSCA ESPECÍFICA DO DHONLENO...\n');

// Simular busca como o PropostaActions faria
async function testarBuscaDhonleno() {
  const nome = "Dhonleno Freitas"; // Nome que aparece na proposta

  console.log(`🔍 Buscando cliente: "${nome}"\n`);

  // Simular diferentes métodos de busca
  const metodosBusca = [
    {
      nome: "Busca por nome completo",
      url: `http://localhost:3001/clientes/search?q=${encodeURIComponent(nome)}`
    },
    {
      nome: "Busca por primeiro nome",
      url: `http://localhost:3001/clientes/search?q=${encodeURIComponent("Dhonleno")}`
    },
    {
      nome: "Busca geral com filtro",
      url: `http://localhost:3001/clientes?search=${encodeURIComponent(nome)}&limit=100`
    },
    {
      nome: "Listar todos e filtrar",
      url: `http://localhost:3001/clientes?limit=1000`
    }
  ];

  for (const metodo of metodosBusca) {
    console.log(`📡 ${metodo.nome}...`);

    try {
      const response = await fetch(metodo.url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        let clientes = [];

        // Extrair clientes dependendo da estrutura da resposta
        if (Array.isArray(data)) {
          clientes = data;
        } else if (data.data && Array.isArray(data.data)) {
          clientes = data.data;
        } else if (data.clientes && Array.isArray(data.clientes)) {
          clientes = data.clientes;
        }

        // Para o método "listar todos", filtrar localmente
        if (metodo.nome === "Listar todos e filtrar") {
          clientes = clientes.filter(c =>
            c.nome?.toLowerCase().includes('dhonleno') ||
            c.email?.toLowerCase().includes('dhonleno')
          );
        }

        console.log(`   ✅ ${clientes.length} cliente(s) encontrado(s)`);

        if (clientes.length > 0) {
          clientes.forEach((cliente, index) => {
            console.log(`   👤 Cliente ${index + 1}:`);
            console.log(`      ID: ${cliente.id}`);
            console.log(`      Nome: ${cliente.nome}`);
            console.log(`      Email: ${cliente.email}`);
            console.log(`      Telefone: ${cliente.telefone || 'N/A'}`);
            console.log(`      Status: ${cliente.status}`);

            // Verificar se corresponde ao Dhonleno
            if (cliente.nome?.toLowerCase().includes('dhonleno')) {
              console.log(`      🎯 MATCH! Este é o Dhonleno correto`);
            }
          });

          // Se encontrou o Dhonleno, parar aqui
          const dhonleno = clientes.find(c =>
            c.nome?.toLowerCase().includes('dhonleno')
          );

          if (dhonleno) {
            console.log(`\n✅ SUCESSO! Método "${metodo.nome}" encontrou o Dhonleno:`);
            console.log(`   Nome: ${dhonleno.nome}`);
            console.log(`   Email: ${dhonleno.email}`);
            console.log(`   Telefone: ${dhonleno.telefone}`);
            break;
          }
        }
      } else {
        console.log(`   ❌ Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }

    console.log('   ---');
  }

  console.log('\n🎯 PRÓXIMO PASSO:');
  console.log('Se encontrou o Dhonleno, o PropostaActions deve usar esses dados');
  console.log('em vez dos dados fictícios que vêm da proposta.');
}

// Executar teste
testarBuscaDhonleno();
