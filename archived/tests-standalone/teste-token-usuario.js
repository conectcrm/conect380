/**
 * 🔍 Teste específico do token do usuário
 * Token: PROP-2025-537375/4GOLAQ
 */

const BASE_URL = 'http://localhost:3001';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { error: error.message, status: 0 };
  }
}

async function testarTokenUsuario() {
  console.log('🔍 TESTE DO TOKEN DO USUÁRIO');
  console.log('📋 Token: PROP-2025-537375/4GOLAQ');
  console.log('🔗 URL completa: http://localhost:3900/portal/PROP-2025-537375/4GOLAQ\n');

  // Extrair token da URL
  const urlCompleta = 'http://localhost:3900/portal/PROP-2025-537375/4GOLAQ';
  const urlParts = urlCompleta.split('/portal/');
  const token = urlParts[1]; // "PROP-2025-537375/4GOLAQ"

  console.log(`📝 Token extraído: "${token}"`);
  console.log(`📏 Tamanho do token: ${token.length} caracteres`);
  console.log(`🔍 Contém barra (/): ${token.includes('/') ? 'SIM' : 'NÃO'}`);

  // 1. Testar endpoint GET do portal com o token real
  console.log('\n1️⃣ Testando GET /api/portal/proposta/:token');

  const encodedToken = encodeURIComponent(token);
  console.log(`📝 Token URL-encoded: "${encodedToken}"`);

  const getResult = await makeRequest(`${BASE_URL}/api/portal/proposta/${encodedToken}`);

  if (getResult.ok) {
    console.log('✅ Portal GET: Token aceito!');
    console.log('📄 Dados da proposta:', getResult.data);
  } else {
    console.log('❌ Portal GET: Token rejeitado');
    console.log('📄 Erro:', getResult.error || getResult.data);

    // Se deu erro, vamos tentar diferentes formatos
    console.log('\n🔧 Tentando formatos alternativos...');

    // Tentar apenas a primeira parte do token
    const tokenSemSlash = token.split('/')[0]; // "PROP-2025-537375"
    console.log(`📝 Testando sem a segunda parte: "${tokenSemSlash}"`);

    const testSemSlash = await makeRequest(`${BASE_URL}/api/portal/proposta/${tokenSemSlash}`);
    if (testSemSlash.ok) {
      console.log('✅ Funcionou sem a segunda parte!');
      console.log('📄 Dados:', testSemSlash.data);
    } else {
      console.log('❌ Ainda não funcionou:', testSemSlash.error || testSemSlash.data);
    }

    // Tentar apenas a segunda parte
    const segundaParte = token.split('/')[1]; // "4GOLAQ"
    if (segundaParte) {
      console.log(`📝 Testando apenas segunda parte: "${segundaParte}"`);

      const testSegundaParte = await makeRequest(`${BASE_URL}/api/portal/proposta/${segundaParte}`);
      if (testSegundaParte.ok) {
        console.log('✅ Funcionou com a segunda parte!');
        console.log('📄 Dados:', testSegundaParte.data);
      } else {
        console.log('❌ Ainda não funcionou:', testSegundaParte.error || testSegundaParte.data);
      }
    }
  }

  // 2. Verificar o mapeamento no portal.service.ts
  console.log('\n2️⃣ Verificando mapeamentos disponíveis...');

  const tokenSemSlash = token.split('/')[0]; // "PROP-2025-537375"
  const segundaParte = token.split('/')[1]; // "4GOLAQ"

  const tokensParaTestar = [
    'PROP-001',
    'PROP-002',
    'TEST-001',
    'test-token-123',
    token,
    tokenSemSlash,
    segundaParte
  ];

  for (const testToken of tokensParaTestar) {
    if (!testToken) continue;

    const encoded = encodeURIComponent(testToken);
    const result = await makeRequest(`${BASE_URL}/api/portal/proposta/${encoded}`);

    const status = result.ok ? '✅' : '❌';
    console.log(`${status} "${testToken}" - ${result.ok ? 'ACEITO' : 'REJEITADO'}`);
  }

  // 3. Verificar se o problema é na validação do token
  console.log('\n3️⃣ Análise da validação...');

  const tokenOriginal = token;
  console.log(`📏 Token original tem ${tokenOriginal.length} caracteres`);
  console.log(`🔍 Mínimo requerido: 6 caracteres`);
  console.log(`✅ Passa na validação de tamanho: ${tokenOriginal.length >= 6 ? 'SIM' : 'NÃO'}`);

  // 4. Sugestão de correção
  console.log('\n4️⃣ DIAGNÓSTICO E SUGESTÃO:');

  if (!getResult.ok) {
    console.log('❌ O token do usuário não está sendo aceito pelo sistema');
    console.log('💡 POSSÍVEIS CAUSAS:');
    console.log('   1. Token não está no mapeamento do portal.service.ts');
    console.log('   2. Caractere "/" está causando problemas na URL');
    console.log('   3. Token precisa ser adicionado à lista de tokens válidos');

    console.log('\n🔧 SOLUÇÕES SUGERIDAS:');
    console.log('   1. Adicionar token ao mapeamento no portal.service.ts');
    console.log('   2. Corrigir codificação URL para caracteres especiais');
    console.log('   3. Implementar validação mais flexível para tokens reais');
  } else {
    console.log('✅ Token funcionando corretamente!');
  }

  console.log('\n✨ Teste finalizado!');
}

// Executar teste
testarTokenUsuario().catch(console.error);
