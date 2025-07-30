/**
 * 🔍 VERIFICAR ESTRUTURA DO BANCO - CLIENTES NAS PROPOSTAS
 * 
 * Como a API de clientes está protegida, vamos analisar os dados
 * dos clientes que estão nas propostas para entender a estrutura.
 */

console.log('🔍 ANALISANDO ESTRUTURA DOS CLIENTES NAS PROPOSTAS...\n');

// Configuração da API
const API_URL = 'http://localhost:3001';

async function analisarClientesNasPropostas() {
  try {
    console.log('📡 1. Buscando propostas para analisar estrutura dos clientes...');

    const response = await fetch(`${API_URL}/propostas`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Dados das propostas recebidos');

    if (!data.propostas || !Array.isArray(data.propostas)) {
      console.error('❌ Formato inesperado');
      return;
    }

    console.log(`📊 Analisando ${data.propostas.length} propostas...\n`);

    // Extrair todos os clientes únicos
    const clientesUnicos = new Map();

    data.propostas.forEach((proposta, index) => {
      console.log(`📝 PROPOSTA ${index + 1}: ${proposta.numero}`);

      if (typeof proposta.cliente === 'object' && proposta.cliente) {
        const cliente = proposta.cliente;
        const clienteId = cliente.id || `temp-${cliente.nome}`;

        console.log(`   👤 Cliente (OBJETO):`);
        console.log(`      • ID: ${cliente.id}`);
        console.log(`      • Nome: "${cliente.nome}"`);
        console.log(`      • Email: "${cliente.email}"`);
        console.log(`      • Telefone: ${cliente.telefone || 'N/A'}`);
        console.log(`      • Documento: ${cliente.documento || 'N/A'}`);
        console.log(`      • Status: ${cliente.status || 'N/A'}`);

        // Armazenar cliente único
        if (!clientesUnicos.has(clienteId)) {
          clientesUnicos.set(clienteId, {
            ...cliente,
            propostas: [proposta.numero]
          });
        } else {
          clientesUnicos.get(clienteId).propostas.push(proposta.numero);
        }

      } else if (typeof proposta.cliente === 'string') {
        console.log(`   👤 Cliente (STRING): "${proposta.cliente}"`);
        console.log(`      ⚠️  Dados incompletos - apenas nome`);
      } else {
        console.log(`   ❌ Cliente inválido ou ausente`);
      }

      console.log('   ---');
    });

    // Resumo dos clientes únicos
    console.log('\n👥 2. CLIENTES ÚNICOS ENCONTRADOS:');
    console.log(`   Total: ${clientesUnicos.size} clientes\n`);

    let contador = 1;
    clientesUnicos.forEach((cliente, id) => {
      console.log(`👤 CLIENTE ${contador}:`);
      console.log(`   • ID: ${id}`);
      console.log(`   • Nome: "${cliente.nome}"`);
      console.log(`   • Email: "${cliente.email}"`);
      console.log(`   • Telefone: ${cliente.telefone || 'N/A'}`);
      console.log(`   • Propostas: ${cliente.propostas.join(', ')}`);

      // Verificar tipo de email
      if (cliente.email) {
        if (cliente.email.includes('@cliente.com') ||
          cliente.email.includes('@cliente.temp') ||
          cliente.email.includes('@email.com')) {
          console.log(`   ⚠️  EMAIL FICTÍCIO`);
        } else {
          console.log(`   ✅ EMAIL REAL`);
        }
      }

      // Verificar se é cliente temporário
      if (id.includes('temp') || id === 'cliente-temp') {
        console.log(`   🔄 CLIENTE TEMPORÁRIO (não salvo na tabela clientes)`);
      } else {
        console.log(`   💾 CLIENTE PERSISTIDO (salvo na tabela clientes)`);
      }

      console.log('   ---');
      contador++;
    });

    // Análise específica do Dhonleno
    console.log('\n🎯 3. ANÁLISE ESPECÍFICA - DHONLENO FREITAS:');

    const dhonleno = Array.from(clientesUnicos.values()).find(c =>
      c.nome?.toLowerCase().includes('dhonleno')
    );

    if (dhonleno) {
      console.log('   ✅ ENCONTRADO:');
      console.log(`   • Nome: ${dhonleno.nome}`);
      console.log(`   • Email atual: ${dhonleno.email}`);
      console.log(`   • ID: ${dhonleno.id || 'N/A'}`);
      console.log(`   • Propostas: ${dhonleno.propostas.join(', ')}`);

      if (dhonleno.id === 'cliente-temp') {
        console.log('\n   🔍 DIAGNÓSTICO:');
        console.log('   • ❌ Cliente está usando ID temporário');
        console.log('   • ❌ Não foi salvo na tabela "clientes"');
        console.log('   • ❌ Dados ficam apenas nas propostas');
        console.log('   • ⚠️  Email fictício sendo usado');

        console.log('\n   💡 SOLUÇÃO RECOMENDADA:');
        console.log('   1. Criar registro real na tabela "clientes"');
        console.log('   2. Usar email real: dhonlenofreitas@hotmail.com');
        console.log('   3. Atualizar propostas para referenciar cliente real');
      } else {
        console.log('\n   ✅ Cliente tem ID real no banco');
      }
    } else {
      console.log('   ❌ Dhonleno não encontrado');
    }

    // Estatísticas finais
    console.log('\n📊 4. ESTATÍSTICAS FINAIS:');

    const clientesTemp = Array.from(clientesUnicos.keys()).filter(id =>
      id.includes('temp') || id === 'cliente-temp'
    ).length;

    const clientesReais = clientesUnicos.size - clientesTemp;

    const emailsFicticios = Array.from(clientesUnicos.values()).filter(c => {
      const email = c.email || '';
      return email.includes('@cliente.com') ||
        email.includes('@cliente.temp') ||
        email.includes('@email.com');
    }).length;

    console.log(`   • Total de clientes: ${clientesUnicos.size}`);
    console.log(`   • Clientes temporários: ${clientesTemp}`);
    console.log(`   • Clientes persistidos: ${clientesReais}`);
    console.log(`   • Emails fictícios: ${emailsFicticios}`);
    console.log(`   • Emails reais: ${clientesUnicos.size - emailsFicticios}`);

  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  }
}

// Executar análise
analisarClientesNasPropostas();
