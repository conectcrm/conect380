/**
 * Debug específico do método validarToken
 */

const axios = require('axios');

async function debugValidarToken() {
  console.log('🔍 DEBUG: Investigando o método validarToken...\n');

  // Vamos fazer requisições e ver os logs no servidor
  const tokens = [
    'PROP-2025-043',  // Deve existir
    'PROP-2025-042',  // Pode não existir
    'TOKEN-INEXISTENTE',  // Não deve existir
    '123456',         // Não deve existir
    '999999'          // Não deve existir
  ];

  for (const token of tokens) {
    console.log(`\n🧪 Testando token: ${token}`);
    console.log('   (Verifique os logs do servidor para detalhes)');

    try {
      const response = await axios.get(`http://localhost:3001/api/portal/proposta/${token}`);

      if (response.status === 200 && response.data.success) {
        const proposta = response.data.proposta;
        console.log(`   ✅ Sucesso: ${proposta.numero} (ID: ${proposta.id})`);

        if (proposta.numero === token) {
          console.log('   🎯 Token e proposta coincidem');
        } else {
          console.log('   ❌ PROBLEMA: Token não coincide com proposta');
        }
      } else {
        console.log(`   ❌ Resposta inesperada: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`   📛 HTTP ${error.response.status}`);
      } else {
        console.log(`   💥 Erro: ${error.message}`);
      }
    }

    // Pequena pausa para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 ANÁLISE:');
  console.log('Verifique os logs do servidor para ver:');
  console.log('1. Quantas propostas foram encontradas no banco');
  console.log('2. Se o método find() está funcionando corretamente');
  console.log('3. Se tokens inexistentes estão sendo rejeitados');
}

debugValidarToken();
