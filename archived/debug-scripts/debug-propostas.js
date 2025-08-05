// Script para debugar dados das propostas e verificar emails
const fetch = require('node-fetch');

async function debugPropostas() {
  try {
    console.log('🔍 Buscando propostas no backend...');

    const response = await fetch('http://localhost:3000/propostas');
    const data = await response.json();

    console.log('\n📊 Total de propostas:', data.propostas?.length || 0);

    if (data.propostas && data.propostas.length > 0) {
      console.log('\n🔍 Analisando dados das propostas:');

      data.propostas.forEach((proposta, index) => {
        console.log(`\n--- Proposta ${index + 1} ---`);
        console.log('ID:', proposta.id);
        console.log('Número:', proposta.numero);
        console.log('Cliente tipo:', typeof proposta.cliente);
        console.log('Cliente valor:', proposta.cliente);

        // Verificar se cliente é string ou objeto
        if (typeof proposta.cliente === 'string') {
          console.log('❌ Cliente é STRING - sem email disponível');
        } else if (typeof proposta.cliente === 'object' && proposta.cliente) {
          console.log('✅ Cliente é OBJECT');
          console.log('  - Nome:', proposta.cliente.nome);
          console.log('  - Email:', proposta.cliente.email);
          console.log('  - Email disponível:', !!proposta.cliente.email ? '✅' : '❌');
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

      console.log('\n📈 ESTATÍSTICAS:');
      console.log(`📄 Total de propostas: ${data.propostas.length}`);
      console.log(`📝 Clientes como string: ${clientesString}`);
      console.log(`📦 Clientes como objeto: ${clientesObject}`);
      console.log(`📧 Clientes com email: ${clientesComEmail}`);
      console.log(`❌ Propostas SEM email: ${data.propostas.length - clientesComEmail}`);

    } else {
      console.log('❌ Nenhuma proposta encontrada');
    }

  } catch (error) {
    console.error('❌ Erro ao buscar propostas:', error.message);
  }
}

debugPropostas();
