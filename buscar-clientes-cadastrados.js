/**
 * 🔍 DIAGNÓSTICO: VERIFICAR CLIENTES CADASTRADOS NO SISTEMA
 * 
 * Este script consulta diretamente a API de clientes para verificar
 * todos os clientes cadastrados e seus emails reais.
 */

console.log('🔍 INICIANDO BUSCA POR CLIENTES CADASTRADOS...\n');

// Configuração da API
const API_URL = 'http://localhost:3001';

async function buscarClientesCadastrados() {
  try {
    console.log('📡 1. Consultando endpoint de clientes...');

    const response = await fetch(`${API_URL}/clientes`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const clientes = await response.json();
    console.log('✅ Resposta da API de clientes recebida');

    if (!Array.isArray(clientes)) {
      console.error('❌ Formato inesperado da resposta');
      console.log('Resposta recebida:', clientes);
      return;
    }

    console.log(`📊 Total de clientes cadastrados: ${clientes.length}\n`);

    if (clientes.length === 0) {
      console.log('❌ Nenhum cliente encontrado no banco de dados');
      return;
    }

    // Analisar cada cliente
    console.log('👥 2. LISTAGEM COMPLETA DOS CLIENTES:\n');

    clientes.forEach((cliente, index) => {
      console.log(`👤 CLIENTE ${index + 1}:`);
      console.log(`   • ID: ${cliente.id}`);
      console.log(`   • Nome: "${cliente.nome}"`);
      console.log(`   • Email: "${cliente.email}"`);
      console.log(`   • Telefone: ${cliente.telefone || 'N/A'}`);
      console.log(`   • Tipo: ${cliente.tipo || 'N/A'}`);
      console.log(`   • Status: ${cliente.status || 'N/A'}`);
      console.log(`   • Documento: ${cliente.documento || 'N/A'}`);
      console.log(`   • Cidade: ${cliente.cidade || 'N/A'}`);
      console.log(`   • Estado: ${cliente.estado || 'N/A'}`);
      console.log(`   • Criado em: ${cliente.createdAt || cliente.criadoEm || 'N/A'}`);

      // Verificar se é email fictício
      const email = cliente.email;
      if (email) {
        const isEmailFicticio = email.includes('@cliente.com') ||
          email.includes('@cliente.temp') ||
          email.includes('@email.com');

        if (isEmailFicticio) {
          console.log(`   ⚠️  EMAIL FICTÍCIO DETECTADO!`);
        } else {
          console.log(`   ✅ Email real`);
        }
      }

      console.log('   ---');
    });

    // Estatísticas
    console.log('\n📊 3. ESTATÍSTICAS DOS CLIENTES:');

    const clientesComEmail = clientes.filter(c => c.email);
    const emailsFicticios = clientesComEmail.filter(c => {
      const email = c.email;
      return email.includes('@cliente.com') ||
        email.includes('@cliente.temp') ||
        email.includes('@email.com');
    });

    const emailsReais = clientesComEmail.filter(c => {
      const email = c.email;
      return !email.includes('@cliente.com') &&
        !email.includes('@cliente.temp') &&
        !email.includes('@email.com');
    });

    console.log(`   • Total de clientes: ${clientes.length}`);
    console.log(`   • Clientes com email: ${clientesComEmail.length}`);
    console.log(`   • Emails fictícios: ${emailsFicticios.length}`);
    console.log(`   • Emails reais: ${emailsReais.length}`);

    // Buscar especificamente o Dhonleno
    console.log('\n🎯 4. BUSCANDO DHONLENO FREITAS:');

    const dhonleno = clientes.find(c =>
      c.nome?.toLowerCase().includes('dhonleno')
    );

    if (dhonleno) {
      console.log('   ✅ ENCONTRADO:');
      console.log(`   • ID: ${dhonleno.id}`);
      console.log(`   • Nome: ${dhonleno.nome}`);
      console.log(`   • Email: ${dhonleno.email}`);
      console.log(`   • Status: ${dhonleno.status}`);

      if (dhonleno.email === 'dhonlenofreitas@hotmail.com') {
        console.log('   🎉 EMAIL REAL CADASTRADO CORRETAMENTE!');
      } else if (dhonleno.email.includes('@cliente.com')) {
        console.log('   ⚠️  Email ainda é fictício no banco');
        console.log('   💡 Sugestão: Atualizar para "dhonlenofreitas@hotmail.com"');
      }
    } else {
      console.log('   ❌ Cliente Dhonleno não encontrado na tabela clientes');
      console.log('   💡 Isso pode explicar por que as propostas usam dados fictícios');
    }

    // Verificar relação com propostas
    console.log('\n🔗 5. VERIFICANDO RELAÇÃO COM PROPOSTAS:');

    try {
      const propostasResponse = await fetch(`${API_URL}/propostas`);
      const propostasData = await propostasResponse.json();

      if (propostasData.propostas) {
        console.log('   📋 Comparando clientes das propostas com banco de clientes...');

        propostasData.propostas.forEach(prop => {
          if (prop.cliente && typeof prop.cliente === 'object') {
            const clienteId = prop.cliente.id;
            const clienteNome = prop.cliente.nome;
            const clienteEmail = prop.cliente.email;

            const clienteNoBanco = clientes.find(c => c.id === clienteId);

            console.log(`   📝 Proposta ${prop.numero}:`);
            console.log(`      • Cliente na proposta: ${clienteNome} (${clienteEmail})`);
            console.log(`      • ID: ${clienteId}`);

            if (clienteNoBanco) {
              console.log(`      ✅ Cliente encontrado no banco`);
              if (clienteNoBanco.email !== clienteEmail) {
                console.log(`      ⚠️  Email divergente!`);
                console.log(`         - Banco: ${clienteNoBanco.email}`);
                console.log(`         - Proposta: ${clienteEmail}`);
              }
            } else {
              console.log(`      ❌ Cliente NÃO encontrado no banco`);
              console.log(`      💡 Proposta usando dados temporários`);
            }
          }
        });
      }
    } catch (error) {
      console.log('   ⚠️  Erro ao comparar com propostas:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error.message);

    if (error.message.includes('fetch')) {
      console.log('\n💡 VERIFICAÇÕES:');
      console.log('   1. O backend está rodando na porta 3001?');
      console.log('   2. Execute: cd backend && npm start');
      console.log('   3. Endpoint /clientes está funcionando?');
    }
  }
}

// Executar busca
buscarClientesCadastrados();
