// Verificar diferença entre APIs de proposta individual vs listagem

console.log('🔍 VERIFICANDO DISCREPÂNCIA ENTRE APIs...');

async function verificarDiscrepanciaAPIs() {
  try {
    const propostaId = '123b36ae-0e7c-4e53-bc54-582b07d9d6aa';

    console.log('\n📋 1. Buscar proposta individual...');
    const responseIndividual = await fetch(`http://localhost:3001/propostas/${propostaId}`);
    const dataIndividual = await responseIndividual.json();

    console.log('\n📋 2. Buscar listagem de propostas...');
    const responseListagem = await fetch('http://localhost:3001/propostas');
    const dataListagem = await responseListagem.json();

    // Encontrar a mesma proposta na listagem
    const propostaNaListagem = dataListagem.propostas?.find(p => p.id === propostaId);

    console.log('\n🔍 COMPARAÇÃO:');
    console.log('--- PROPOSTA INDIVIDUAL ---');
    console.log('Cliente:', dataIndividual.proposta?.cliente);
    console.log('Tipo:', typeof dataIndividual.proposta?.cliente);

    console.log('\n--- PROPOSTA NA LISTAGEM ---');
    console.log('Cliente:', propostaNaListagem?.cliente);
    console.log('Tipo:', typeof propostaNaListagem?.cliente);

    if (typeof propostaNaListagem?.cliente === 'object' && propostaNaListagem.cliente?.email) {
      console.log('📧 Email na listagem:', propostaNaListagem.cliente.email);

      if (propostaNaListagem.cliente.email === 'dhonlenofreitas@hotmail.com') {
        console.log('✅ EMAIL REAL ENCONTRADO NA LISTAGEM!');
      } else if (propostaNaListagem.cliente.email.includes('@cliente.')) {
        console.log('⚠️ Email fictício na listagem:', propostaNaListagem.cliente.email);
      }
    }

    console.log('\n🎯 DIAGNÓSTICO:');
    if (typeof propostaNaListagem?.cliente === 'object' && typeof dataIndividual.proposta?.cliente === 'string') {
      console.log('❌ PROBLEMA: API individual perde dados do objeto cliente');
      console.log('💡 SOLUÇÃO: Usar dados da listagem ou corrigir API individual');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

verificarDiscrepanciaAPIs();
