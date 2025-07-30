// Script para testar a API de propostas e ver se os vendedores aparecem
console.log('🧪 TESTANDO API DE PROPOSTAS E VENDEDORES\n');

async function testarAPI() {
  try {
    console.log('📡 Fazendo requisição para http://localhost:3001/propostas...');

    const response = await fetch('http://localhost:3001/propostas');
    const data = await response.json();

    console.log('\n✅ Resposta recebida:');
    console.log(`📊 Total de propostas: ${data.total}`);
    console.log(`📝 Propostas encontradas: ${data.propostas?.length || 0}`);

    if (data.propostas && data.propostas.length > 0) {
      console.log('\n🔍 Analisando primeira proposta:');
      const proposta = data.propostas[0];

      console.log(`   🏷️  Número: ${proposta.numero}`);
      console.log(`   👤 Cliente: ${proposta.cliente?.nome}`);
      console.log(`   🏢 Vendedor: ${proposta.vendedor?.nome} (${proposta.vendedor?.tipo})`);
      console.log(`   💰 Valor: R$ ${proposta.valor}`);
      console.log(`   📊 Status: ${proposta.status}`);

      console.log('\n📋 Estrutura do vendedor:');
      console.log('   vendedor:', proposta.vendedor);

      // Simular a conversão como o frontend faz
      console.log('\n🔄 SIMULANDO CONVERSÃO FRONTEND:');

      const vendedorFormatado = typeof proposta.vendedor === 'object' && proposta.vendedor?.nome
        ? proposta.vendedor.nome
        : typeof proposta.vendedor === 'string'
          ? proposta.vendedor
          : 'Sistema';

      console.log(`   ✅ Vendedor após conversão: "${vendedorFormatado}"`);

      // Verificar se deu certo
      if (vendedorFormatado === 'Sistema') {
        console.log('   ❌ PROBLEMA: Vendedor virou "Sistema"!');
      } else {
        console.log('   ✅ SUCESSO: Vendedor foi mapeado corretamente!');
      }

    } else {
      console.log('⚠️ Nenhuma proposta encontrada');
    }

  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

testarAPI();
