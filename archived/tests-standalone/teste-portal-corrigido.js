/**
 * Teste do Portal do Cliente - VERSÃO CORRIGIDA
 * Verifica se o endpoint do portal está funcionando corretamente
 */

console.log('🔧 TESTE PORTAL DO CLIENTE - CORREÇÃO APLICADA');
console.log('===============================================');

// Função para testar endpoint do portal
async function testarPortal() {
  const tokensParaTestar = [
    'PROP-001',
    'PROP-002',
    'TEST-001',
    'token-invalido'
  ];

  console.log('\n📋 Testando endpoints do portal...\n');

  for (const token of tokensParaTestar) {
    console.log(`🔍 Testando token: ${token}`);

    try {
      // Teste 1: Obter proposta
      const response = await fetch(`http://localhost:3001/api/portal/proposta/${token}`);
      const data = await response.json();

      if (response.ok) {
        console.log(`✅ ${token}: Sucesso`);
        console.log(`   Título: ${data.proposta?.titulo || 'N/A'}`);
        console.log(`   Cliente: ${data.proposta?.cliente || 'N/A'}`);
        console.log(`   Status: ${data.proposta?.status || 'N/A'}`);
      } else {
        console.log(`❌ ${token}: Erro ${response.status}`);
        console.log(`   Mensagem: ${data.message || 'N/A'}`);
      }

    } catch (error) {
      console.log(`💥 ${token}: Erro de conexão - ${error.message}`);
    }

    console.log(''); // Linha em branco
  }
}

// Função para testar URL do portal no frontend
function testarURLsPortal() {
  console.log('\n🌐 URLs do Portal para testar no navegador:');
  console.log('============================================');
  console.log('✅ http://localhost:3900/portal/proposta/PROP-001');
  console.log('✅ http://localhost:3900/portal/proposta/PROP-002');
  console.log('✅ http://localhost:3900/portal/proposta/TEST-001');
  console.log('❌ http://localhost:3900/portal/proposta/token-invalido');
  console.log('');
}

// Executar testes
async function executarTestes() {
  console.log('🚀 Iniciando testes do portal...\n');

  // Teste 1: Backend
  await testarPortal();

  // Teste 2: URLs para frontend
  testarURLsPortal();

  console.log('🎯 INSTRUÇÕES:');
  console.log('==============');
  console.log('1. Se todos os tokens mostraram "Sucesso", o backend está OK');
  console.log('2. Teste as URLs acima no navegador');
  console.log('3. Se aparecer "Link inválido", há problema no frontend');
  console.log('4. Se aparecer a proposta, está tudo funcionando!');
}

// Executar
executarTestes().catch(console.error);
