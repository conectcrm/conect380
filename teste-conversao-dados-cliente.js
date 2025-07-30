// Teste para verificar onde os dados do cliente estão sendo modificados

console.log('🔍 VERIFICANDO PROCESSO DE CONVERSÃO DOS DADOS DO CLIENTE');

async function verificarConversaoDados() {
  try {
    console.log('\n📋 1. Buscando propostas do backend...');
    const response = await fetch('http://localhost:3001/propostas');
    const data = await response.json();

    if (data.propostas && data.propostas.length > 0) {
      // Pegar uma proposta específica que sabemos ter email real
      const propostaComEmailReal = data.propostas.find(p =>
        typeof p.cliente === 'object' &&
        p.cliente?.email &&
        p.cliente.email === 'dhonleno.freitas@cliente.com'
      );

      if (propostaComEmailReal) {
        console.log('\n--- PROPOSTA COM EMAIL REAL ENCONTRADA ---');
        console.log('🆔 ID:', propostaComEmailReal.id);
        console.log('📋 Número:', propostaComEmailReal.numero);
        console.log('👤 Cliente original:', propostaComEmailReal.cliente);
        console.log('📧 Email original:', propostaComEmailReal.cliente.email);

        // Simular função safeRender
        function safeRender(value) {
          if (value === null || value === undefined) return '';
          return String(value);
        }

        // Simular converterPropostaParaUI exatamente como no código
        console.log('\n🔄 SIMULANDO converterPropostaParaUI...');

        let clienteNome = 'Cliente não informado';
        let clienteEmail = '';

        if (typeof propostaComEmailReal.cliente === 'object' && propostaComEmailReal.cliente) {
          // Cliente como objeto (formato correto) - USAR SEMPRE O EMAIL REAL
          clienteNome = safeRender(propostaComEmailReal.cliente.nome) || 'Cliente não informado';
          clienteEmail = safeRender(propostaComEmailReal.cliente.email) || '';

          console.log(`✅ Cliente OBJETO detectado:`);
          console.log(`   Nome: "${clienteNome}"`);
          console.log(`   Email: "${clienteEmail}"`);
        }

        const resultado = {
          id: propostaComEmailReal.id,
          numero: propostaComEmailReal.numero,
          cliente: clienteNome,
          cliente_contato: clienteEmail, // AQUI deve estar o email real
          valor: Number(propostaComEmailReal.total) || 0,
          status: propostaComEmailReal.status
        };

        console.log('\n📦 RESULTADO DA CONVERSÃO:');
        console.log('👤 cliente:', resultado.cliente);
        console.log('📧 cliente_contato:', resultado.cliente_contato);
        console.log('🔍 Email preservado?', resultado.cliente_contato === propostaComEmailReal.cliente.email ? '✅ SIM' : '❌ NÃO');

        // Verificar o que PropostaActions vai ver
        console.log('\n🎯 O QUE PropostaActions VAI RECEBER:');
        console.log('- proposta.cliente_contato:', resultado.cliente_contato);
        console.log('- É email válido?', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resultado.cliente_contato) ? '✅' : '❌');
        console.log('- É email fictício?', resultado.cliente_contato.includes('@cliente.temp') ? '⚠️ SIM' : '✅ NÃO');

      } else {
        console.log('⚠️ Nenhuma proposta com email real "dhonleno.freitas@cliente.com" encontrada');

        // Mostrar todas as propostas disponíveis
        console.log('\n📋 PROPOSTAS DISPONÍVEIS:');
        data.propostas.forEach((p, i) => {
          console.log(`${i + 1}. ${p.numero} - Cliente:`, typeof p.cliente === 'object' ? p.cliente.email : p.cliente);
        });
      }

    } else {
      console.log('❌ Nenhuma proposta encontrada');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar verificação
verificarConversaoDados();
