// Debug específico para o problema de email nas propostas

console.log('🔍 DEBUGANDO PROBLEMA DE EMAIL NAS PROPOSTAS');

async function debugEmailPropostas() {
  try {
    console.log('\n📋 1. Buscando dados do backend...');
    const response = await fetch('http://localhost:3001/propostas');
    const data = await response.json();

    if (data.propostas && data.propostas.length > 0) {
      console.log(`\n📊 Total de propostas: ${data.propostas.length}`);

      // Verificar especificamente as propostas que deveriam ter email real
      const propostasComEmailReal = data.propostas.filter(p =>
        typeof p.cliente === 'object' && p.cliente?.email &&
        !p.cliente.email.includes('@cliente.temp')
      );

      console.log(`\n✅ Propostas com EMAIL REAL: ${propostasComEmailReal.length}`);

      propostasComEmailReal.forEach((proposta, index) => {
        console.log(`\n--- Proposta ${index + 1} ---`);
        console.log('ID:', proposta.id);
        console.log('Número:', proposta.numero);
        console.log('Cliente Nome:', proposta.cliente.nome);
        console.log('Cliente Email:', proposta.cliente.email);
        console.log('📧 Email válido:', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(proposta.cliente.email) ? '✅' : '❌');
      });

      // Verificar propostas que são só string
      const propostasString = data.propostas.filter(p => typeof p.cliente === 'string');
      console.log(`\n📝 Propostas com cliente STRING: ${propostasString.length}`);

      // Simular conversão PropostasPage.tsx
      console.log('\n🔄 SIMULANDO CONVERSÃO PropostasPage.tsx:');

      const propostaTest = propostasComEmailReal[0];
      if (propostaTest) {
        console.log('\n--- TESTE DE CONVERSÃO ---');
        console.log('Proposta original:', propostaTest.numero);
        console.log('Cliente original:', propostaTest.cliente);

        // Simular função converterPropostaParaUI
        let clienteNome = 'Cliente não informado';
        let clienteEmail = '';

        if (typeof propostaTest.cliente === 'object' && propostaTest.cliente) {
          clienteNome = propostaTest.cliente.nome || 'Cliente não informado';
          clienteEmail = propostaTest.cliente.email || '';
          console.log('✅ CONVERSÃO CORRETA:');
          console.log('  Nome:', clienteNome);
          console.log('  Email:', clienteEmail);
        }

        const propostaUI = {
          id: propostaTest.id,
          numero: propostaTest.numero,
          cliente: clienteNome,
          cliente_contato: clienteEmail, // AQUI é onde o email deveria estar
          valor: propostaTest.total || 0,
          status: propostaTest.status
        };

        console.log('\n📦 Proposta UI resultante:', propostaUI);
        console.log('🎯 cliente_contato (email):', propostaUI.cliente_contato);

        // Verificar se PropostaActions detectaria corretamente
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (propostaUI.cliente_contato && emailRegex.test(propostaUI.cliente_contato)) {
          console.log('✅ PropostaActions detectaria email como VÁLIDO');
        } else {
          console.log('❌ PropostaActions NÃO detectaria email');
        }
      }

    } else {
      console.log('⚠️ Nenhuma proposta encontrada');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar debug
debugEmailPropostas();
