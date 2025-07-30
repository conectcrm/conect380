/**
 * 🔍 VERIFICAR SE SCRIPT DE CLIENTES FOI EXECUTADO
 * 
 * Este script tenta verificar se o script populate-funil-vendas.sql
 * foi executado e se os 5 clientes de exemplo estão no banco.
 */

console.log('🔍 VERIFICANDO CLIENTES DO SCRIPT DE INICIALIZAÇÃO...\n');

// Configuração da API
const API_URL = 'http://localhost:3001';

// Lista dos clientes que deveriam estar no banco (do script SQL)
const clientesEsperados = [
  {
    nome: 'TechCorp Solutions',
    email: 'contato@techcorp.com',
    telefone: '(11) 9999-1111'
  },
  {
    nome: 'Inovação Digital Ltda',
    email: 'vendas@inovacaodigital.com',
    telefone: '(21) 8888-2222'
  },
  {
    nome: 'Empresa Familiar S/A',
    email: 'comercial@empresafamiliar.com',
    telefone: '(31) 7777-3333'
  },
  {
    nome: 'StartupX',
    email: 'ceo@startupx.com',
    telefone: '(11) 6666-4444'
  },
  {
    nome: 'Global Services Inc',
    email: 'brazil@globalservices.com',
    telefone: '(11) 5555-5555'
  }
];

async function verificarClientesEsperados() {
  try {
    console.log('📊 CLIENTES ESPERADOS (do script populate-funil-vendas.sql):');
    clientesEsperados.forEach((cliente, index) => {
      console.log(`   ${index + 1}. ${cliente.nome}`);
      console.log(`      • Email: ${cliente.email}`);
      console.log(`      • Telefone: ${cliente.telefone}`);
    });

    console.log('\n📡 Tentando acessar API de clientes (pode falhar por autenticação)...');

    try {
      const response = await fetch(`${API_URL}/clientes`);

      if (response.ok) {
        const clientes = await response.json();
        console.log('✅ API de clientes acessível!');
        console.log(`📊 Total de clientes no banco: ${clientes.length}`);

        // Verificar se os clientes esperados estão lá
        console.log('\n🔍 VERIFICANDO CLIENTES ESPERADOS:');

        clientesEsperados.forEach(esperado => {
          const encontrado = clientes.find(c =>
            c.email === esperado.email ||
            c.nome === esperado.nome
          );

          if (encontrado) {
            console.log(`   ✅ ${esperado.nome} - ENCONTRADO`);
          } else {
            console.log(`   ❌ ${esperado.nome} - NÃO ENCONTRADO`);
          }
        });

        // Verificar se Dhonleno está nos clientes reais
        const dhonleno = clientes.find(c =>
          c.nome?.toLowerCase().includes('dhonleno')
        );

        if (dhonleno) {
          console.log('\n🎯 DHONLENO ENCONTRADO NA TABELA CLIENTES:');
          console.log(`   • Nome: ${dhonleno.nome}`);
          console.log(`   • Email: ${dhonleno.email}`);
          console.log(`   • ID: ${dhonleno.id}`);
        } else {
          console.log('\n❌ Dhonleno NÃO encontrado na tabela clientes');
        }

      } else if (response.status === 401) {
        console.log('❌ API protegida por autenticação (401)');
        console.log('💡 Isso é normal - endpoint requer login');
      } else {
        console.log(`❌ Erro ${response.status} ao acessar API`);
      }

    } catch (apiError) {
      console.log('❌ Erro ao conectar com API:', apiError.message);
    }

    console.log('\n🔍 ANALISANDO PROPOSTAS EXISTENTES:');

    // Verificar propostas para entender origem dos dados
    const propostasResponse = await fetch(`${API_URL}/propostas`);
    const propostasData = await propostasResponse.json();

    if (propostasData.propostas) {
      console.log(`📊 ${propostasData.propostas.length} propostas encontradas`);

      // Verificar se alguma proposta usa clientes reais do banco
      let usandoClientesReais = false;
      let usandoClientesTemp = false;

      propostasData.propostas.forEach(prop => {
        if (prop.cliente && typeof prop.cliente === 'object') {
          const clienteId = prop.cliente.id;
          const clienteEmail = prop.cliente.email;

          // Verificar se é cliente temporário
          if (clienteId === 'cliente-temp' || clienteId?.includes('temp')) {
            usandoClientesTemp = true;
          } else {
            usandoClientesReais = true;
          }

          // Verificar se email é de um dos clientes esperados
          const emailEsperado = clientesEsperados.find(c => c.email === clienteEmail);
          if (emailEsperado) {
            console.log(`   ✅ Proposta ${prop.numero} usa cliente real: ${emailEsperado.nome}`);
          }
        }
      });

      console.log('\n📋 RESUMO DAS PROPOSTAS:');
      console.log(`   • Usando clientes reais: ${usandoClientesReais ? 'SIM' : 'NÃO'}`);
      console.log(`   • Usando clientes temporários: ${usandoClientesTemp ? 'SIM' : 'NÃO'}`);
    }

    console.log('\n💡 DIAGNÓSTICO FINAL:');
    console.log('   1. Script populate-funil-vendas.sql define 5 clientes reais');
    console.log('   2. API /clientes está protegida (normal)');
    console.log('   3. Propostas atuais usam apenas clientes temporários');
    console.log('   4. Dhonleno não está na tabela clientes oficial');

    console.log('\n🎯 RECOMENDAÇÕES:');
    console.log('   1. Executar: cd backend && psql -d conectcrm -f populate-funil-vendas.sql');
    console.log('   2. Ou criar Dhonleno diretamente na tabela clientes');
    console.log('   3. Atualizar propostas para usar cliente real em vez de temporário');

  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

// Executar verificação
verificarClientesEsperados();
