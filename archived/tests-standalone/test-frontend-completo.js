// Teste para simular exatamente o que o frontend está fazendo
console.log('🧪 TESTANDO FLUXO COMPLETO FRONTEND + BACKEND\n');

// Simular imports do frontend
const API_URL = 'http://localhost:3001';

async function testarFluxoCompleto() {
  try {
    console.log('📡 1. Fazendo requisição (simulando propostasService.findAll())...');

    const response = await fetch(`${API_URL}/propostas`);
    const data = await response.json();

    console.log('📦 2. Dados recebidos do backend:');
    console.log(`   - success: ${data.success}`);
    console.log(`   - total: ${data.total}`);
    console.log(`   - propostas: ${data.propostas?.length || 0} itens`);

    if (data.propostas && data.propostas.length > 0) {
      const propostas = data.propostas;
      console.log('\n🔄 3. Simulando converterPropostaParaUI para primeira proposta...');

      const proposta = propostas[0];
      console.log('   - Proposta original:', {
        numero: proposta.numero,
        cliente: proposta.cliente?.nome,
        vendedor: proposta.vendedor,
        valor: proposta.valor
      });

      // Simular a função converterPropostaParaUI
      const propostaFormatada = {
        id: proposta.id,
        numero: proposta.numero,
        cliente: proposta.cliente,
        total: proposta.valor || proposta.total,
        status: proposta.status,
        observacoes: proposta.observacoes,
        criadaEm: proposta.createdAt || proposta.criadaEm,
        dataValidade: proposta.dataVencimento || proposta.dataValidade,
        vendedor: proposta.vendedor,
        produtos: proposta.produtos || []
      };

      console.log('\n📋 4. Dados formatados para converterPropostaParaUI:');
      console.log('   - vendedor na proposta formatada:', propostaFormatada.vendedor);

      // Simular a lógica do converterPropostaParaUI para o vendedor
      const vendedorFinal = typeof propostaFormatada.vendedor === 'object' && propostaFormatada.vendedor?.nome
        ? propostaFormatada.vendedor.nome
        : typeof propostaFormatada.vendedor === 'string'
          ? propostaFormatada.vendedor
          : 'Sistema';

      console.log('\n✅ 5. RESULTADO FINAL:');
      console.log(`   - Vendedor exibido: "${vendedorFinal}"`);

      if (vendedorFinal === 'Sistema') {
        console.log('   ❌ PROBLEMA: Vendedor ainda está aparecendo como "Sistema"');
        console.log('   🔍 Debug:', {
          'typeof vendedor': typeof propostaFormatada.vendedor,
          'vendedor é object': typeof propostaFormatada.vendedor === 'object',
          'vendedor.nome existe': propostaFormatada.vendedor?.nome,
          'vendedor completo': propostaFormatada.vendedor
        });
      } else {
        console.log('   ✅ SUCESSO: Vendedor foi mapeado corretamente!');
      }

      // Testar todas as propostas
      console.log('\n📊 6. Testando todas as propostas:');
      propostas.forEach((prop, index) => {
        const vendedor = typeof prop.vendedor === 'object' && prop.vendedor?.nome
          ? prop.vendedor.nome
          : typeof prop.vendedor === 'string'
            ? prop.vendedor
            : 'Sistema';
        console.log(`   ${index + 1}. ${prop.numero}: ${vendedor}`);
      });

    } else {
      console.log('⚠️ Nenhuma proposta encontrada');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testarFluxoCompleto();
