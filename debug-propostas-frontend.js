// Script para analisar dados das propostas e debugging do problema de email
fetch('http://localhost:3001/propostas')
  .then(response => response.json())
  .then(data => {
    console.log('🔍 DADOS DAS PROPOSTAS:');
    console.log('Total de propostas:', data.propostas?.length || 0);

    if (data.propostas && data.propostas.length > 0) {
      console.log('\n📋 ANÁLISE DETALHADA DOS CLIENTES:');

      data.propostas.forEach((proposta, index) => {
        console.log(`\n--- Proposta ${index + 1} ---`);
        console.log('ID:', proposta.id);
        console.log('Número:', proposta.numero);
        console.log('Cliente tipo:', typeof proposta.cliente);
        console.log('Cliente valor:', proposta.cliente);

        // Verificar estrutura do cliente
        if (typeof proposta.cliente === 'object' && proposta.cliente) {
          console.log('✅ Cliente é OBJETO:');
          console.log('  - Nome:', proposta.cliente.nome);
          console.log('  - Email:', proposta.cliente.email);
          console.log('  - Email disponível:', !!proposta.cliente.email ? '✅' : '❌');

          // Simular conversão da PropostasPage
          const clienteContato = proposta.cliente.email || '';
          console.log('  - cliente_contato (simulação):', clienteContato);

          // Simular lógica do PropostaActions getClienteData
          const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          if (clienteContato && isValidEmail(clienteContato)) {
            console.log('  - ✅ Email seria detectado como VÁLIDO');
          } else {
            console.log('  - ❌ Email NÃO seria detectado');
          }
        } else if (typeof proposta.cliente === 'string') {
          console.log('❌ Cliente é STRING - sem email disponível');
        } else {
          console.log('⚠️ Cliente é null/undefined');
        }
      });

      // Estatísticas
      const clientesString = data.propostas.filter(p => typeof p.cliente === 'string').length;
      const clientesObject = data.propostas.filter(p => typeof p.cliente === 'object' && p.cliente).length;
      const clientesComEmail = data.propostas.filter(p =>
        typeof p.cliente === 'object' && p.cliente?.email
      ).length;

      console.log('\n📊 ESTATÍSTICAS:');
      console.log(`📄 Total de propostas: ${data.propostas.length}`);
      console.log(`📝 Clientes como string: ${clientesString}`);
      console.log(`📦 Clientes como objeto: ${clientesObject}`);
      console.log(`📧 Clientes com email: ${clientesComEmail}`);
      console.log(`❌ Propostas SEM email: ${data.propostas.length - clientesComEmail}`);

    } else {
      console.log('❌ Nenhuma proposta encontrada');
    }
  })
  .catch(error => {
    console.error('❌ Erro ao buscar propostas:', error);
  });
