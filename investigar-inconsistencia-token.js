// 🔍 Investigação: PROP-2025-043 mostrando PROP-685046
// Verificando inconsistência no mapeamento de tokens do portal

const API_URL = 'http://localhost:3001';

async function investigarInconsistenciaToken() {
  console.log('🔍 INVESTIGANDO INCONSISTÊNCIA - PROP-2025-043 → PROP-685046');
  console.log('='.repeat(70));

  try {
    // 1. Verificar se PROP-2025-043 existe no banco
    console.log('📋 1. Buscando PROP-2025-043 no banco...');
    const response = await fetch(`${API_URL}/propostas`);
    const data = await response.json();

    if (data.success && data.propostas) {
      const prop043 = data.propostas.find(p => p.numero === 'PROP-2025-043');

      if (prop043) {
        console.log('✅ PROP-2025-043 encontrada no banco:');
        console.log(`   ID Real: ${prop043.id}`);
        console.log(`   Número: ${prop043.numero}`);
        console.log(`   Status: ${prop043.status}`);
        console.log(`   Criada em: ${prop043.criadaEm}`);
        console.log(`   Portal Access:`, prop043.portalAccess || 'Sem acesso ainda');
        console.log(`   Email Details:`, prop043.emailDetails || 'Sem detalhes');
      } else {
        console.log('❌ PROP-2025-043 NÃO encontrada no banco!');
        console.log('📊 Propostas disponíveis:');
        data.propostas.slice(0, 5).forEach(p => {
          console.log(`   - ${p.numero} (${p.id.substring(0, 8)}...)`);
        });
      }

      // 2. Verificar se existe PROP-685046
      const prop685046 = data.propostas.find(p => p.numero === 'PROP-685046');
      if (prop685046) {
        console.log('\n🔍 PROP-685046 encontrada no banco:');
        console.log(`   ID Real: ${prop685046.id}`);
        console.log(`   Status: ${prop685046.status}`);
        console.log(`   Criada em: ${prop685046.criadaEm}`);
      } else {
        console.log('\n❌ PROP-685046 NÃO encontrada no banco!');
      }

      // 3. Verificar padrão dos números das propostas
      console.log('\n📊 Padrão dos números das propostas:');
      const numerosPropostas = data.propostas.map(p => p.numero).slice(0, 10);
      numerosPropostas.forEach(numero => {
        console.log(`   - ${numero}`);
      });
    }

    // 4. TESTE CRÍTICO: Acessar portal com token PROP-2025-043
    console.log('\n🔐 2. Testando acesso pelo portal com token PROP-2025-043...');

    try {
      const portalResponse = await fetch(`${API_URL}/api/portal/proposta/PROP-2025-043`);
      const portalData = await portalResponse.json();

      console.log('📄 Resposta do portal:');
      console.log(`   Status HTTP: ${portalResponse.status}`);
      console.log(`   Success: ${portalData.success}`);

      if (portalData.success && portalData.proposta) {
        console.log(`   ⚠️ INCONSISTÊNCIA DETECTADA:`);
        console.log(`   Token solicitado: PROP-2025-043`);
        console.log(`   Proposta retornada: ${portalData.proposta.numero}`);
        console.log(`   ID da proposta: ${portalData.proposta.id}`);
        console.log(`   Título: ${portalData.proposta.titulo || 'Sem título'}`);

        if (portalData.proposta.numero !== 'PROP-2025-043') {
          console.log('🚨 PROBLEMA CONFIRMADO: Token não corresponde à proposta!');
        }
      } else {
        console.log(`   ❌ Erro no portal: ${portalData.message}`);
      }
    } catch (portalError) {
      console.log(`   ❌ Erro ao acessar portal: ${portalError.message}`);
    }

    // 5. Verificar como o backend está mapeando tokens
    console.log('\n🔧 3. Investigando mapeamento de tokens no backend...');

    // Testar alguns tokens para ver o padrão
    const tokensParaTestar = ['PROP-2025-043', 'PROP-2025-042', 'PROP-2025-041'];

    for (const token of tokensParaTestar) {
      try {
        const testResponse = await fetch(`${API_URL}/api/portal/proposta/${token}`);
        const testData = await testResponse.json();

        if (testData.success) {
          console.log(`   Token: ${token} → Proposta: ${testData.proposta.numero} (ID: ${testData.proposta.id.substring(0, 8)}...)`);
        } else {
          console.log(`   Token: ${token} → Erro: ${testData.message}`);
        }
      } catch (err) {
        console.log(`   Token: ${token} → Erro de conexão`);
      }
    }

  } catch (error) {
    console.error('❌ Erro na investigação:', error);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎯 PRÓXIMOS PASSOS:');
  console.log('1. Verificar se o problema está no mapeamento de tokens');
  console.log('2. Analisar como o backend está encontrando propostas por número');
  console.log('3. Corrigir a lógica de mapeamento se necessário');
}

// Executar investigação
investigarInconsistenciaToken();
