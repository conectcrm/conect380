/**
 * Teste direto do portal para verificar se a correção funcionou
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testarPortalDireto() {
  console.log('🧪 Testando portal diretamente para verificar correção...\n');

  // Lista de tokens para testar
  const tokensParaTestar = [
    'PROP-2025-043',  // Token que o usuário estava tentando
    'PROP-2025-042',  // Token anterior
    'PROP-2025-041',  // Outro token anterior
    '685046',         // Token problemático identificado
    '123456',         // Token aleatório
    'TESTE-123'       // Token que pode não existir
  ];

  for (const token of tokensParaTestar) {
    console.log(`🔍 Testando token: ${token}`);

    try {
      const response = await axios.get(`${BASE_URL}/api/portal/proposta/${token}`);

      if (response.status === 200) {
        const proposta = response.data;
        console.log(`   ✅ Sucesso! Retornou proposta: ${proposta.numero}`);
        console.log(`      - ID: ${proposta.id}`);
        console.log(`      - Título: ${proposta.titulo || 'N/A'}`);
        console.log(`      - Cliente: ${proposta.cliente?.nome || 'N/A'}`);
        console.log(`      - Total: R$ ${proposta.total || 0}`);

        // Verificar se o token e a proposta coincidem
        if (proposta.numero === token) {
          console.log(`      🎯 CORRETO: Token ${token} retornou a proposta correta`);
        } else {
          console.log(`      ❌ PROBLEMA: Token ${token} retornou proposta ${proposta.numero}`);
        }
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          console.log(`   ℹ️  Token ${token} não encontrado (404) - comportamento esperado`);
        } else if (error.response.status === 401) {
          console.log(`   🔒 Token ${token} não autorizado (401)`);
        } else {
          console.log(`   ❌ Erro ${error.response.status} para token ${token}`);
        }
      } else {
        console.log(`   ❌ Erro de rede para token ${token}: ${error.message}`);
      }
    }

    console.log(''); // Linha em branco para separar
  }

  // Teste específico para verificar se o bug foi corrigido
  console.log('🔧 VERIFICAÇÃO ESPECÍFICA DO BUG:');
  console.log('   O problema era que PROP-2025-043 mostrava PROP-685046');
  console.log('   Vamos ver se isso ainda acontece...\n');

  // Verificar propostas existentes no banco (via busca geral)
  try {
    const response = await axios.get(`${BASE_URL}/api/portal/proposta/PROP-2025-043`);
    if (response.status === 200) {
      const proposta = response.data;
      if (proposta.numero === 'PROP-2025-043') {
        console.log('✅ BUG CORRIGIDO! PROP-2025-043 agora retorna a proposta correta');
      } else {
        console.log(`❌ BUG AINDA EXISTE! PROP-2025-043 retorna ${proposta.numero}`);
      }
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('ℹ️  PROP-2025-043 não existe no banco (404)');
    } else {
      console.log(`❌ Erro ao testar PROP-2025-043: ${error.message}`);
    }
  }
}

testarPortalDireto();
