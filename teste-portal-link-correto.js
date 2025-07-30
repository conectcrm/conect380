/**
 * 🧪 Teste da Correção do Portal Link
 * Verifica se o token gerado no frontend é aceito no backend
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

async function testarCorrecaoPortalLink() {
  console.log('🧪 === TESTE: Correção do Portal Link ===\n');

  // 1. Simular geração de token no frontend (token numérico de 6 dígitos)
  const token = Math.floor(Math.random() * 900000 + 100000).toString();
  console.log(`🎫 Token gerado (simulando frontend): ${token}`);

  // 2. Simular envio de email que registra o token
  console.log('\n📧 1. Simulando envio de email com registro de token...');

  const emailData = {
    proposta: {
      numero: 'PROP-2025-TEST',
      valorTotal: 1500.00,
      dataValidade: '2025-02-15',
      token: token
    },
    emailCliente: 'teste@exemplo.com',
    linkPortal: `http://localhost:3900/portal/proposta/${token}`,
    registrarToken: true
  };

  const envioResult = await makeRequest(`${BASE_URL}/email/enviar-proposta`, {
    method: 'POST',
    body: JSON.stringify(emailData)
  });

  if (envioResult.ok) {
    console.log('✅ Email enviado e token registrado com sucesso!');
  } else {
    console.log('❌ Erro no envio:', envioResult.data?.message || envioResult.error);
  }

  // 3. Testar se o token agora é aceito no portal
  console.log('\n🌐 2. Testando acesso ao portal com o token registrado...');

  const portalResult = await makeRequest(`${BASE_URL}/api/portal/proposta/${token}`);

  if (portalResult.ok) {
    console.log('✅ Portal aceita o token! Proposta carregada:');
    console.log(`   📋 Título: ${portalResult.data.proposta?.titulo || 'N/A'}`);
    console.log(`   🏢 Cliente: ${portalResult.data.proposta?.cliente || 'N/A'}`);
    console.log(`   📊 Status: ${portalResult.data.proposta?.status || 'N/A'}`);
  } else {
    console.log('❌ Portal rejeitou o token:', portalResult.data?.message || portalResult.error);
  }

  // 4. Testar aceite da proposta
  console.log('\n✅ 3. Testando aceite da proposta...');

  const aceiteResult = await makeRequest(`${BASE_URL}/api/portal/proposta/${token}/status`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'aprovada',
      timestamp: new Date().toISOString(),
      ip: '192.168.1.100',
      userAgent: 'Portal Cliente Teste'
    })
  });

  if (aceiteResult.ok) {
    console.log('✅ Proposta aceita com sucesso!');
    console.log(`   📊 Status atualizado: ${aceiteResult.data.proposta?.status || 'N/A'}`);
  } else {
    console.log('❌ Erro no aceite:', aceiteResult.data?.message || aceiteResult.error);
  }

  // 5. Resumo do teste
  console.log('\n📈 === RESUMO DO TESTE ===');
  console.log(`🎫 Token testado: ${token}`);
  console.log(`📧 Envio de email: ${envioResult.ok ? '✅ Sucesso' : '❌ Falhou'}`);
  console.log(`🌐 Acesso ao portal: ${portalResult.ok ? '✅ Sucesso' : '❌ Falhou'}`);
  console.log(`✅ Aceite da proposta: ${aceiteResult.ok ? '✅ Sucesso' : '❌ Falhou'}`);

  const todosOk = envioResult.ok && portalResult.ok && aceiteResult.ok;
  console.log(`\n🎯 RESULTADO FINAL: ${todosOk ? '✅ TODOS OS TESTES PASSARAM!' : '❌ ALGUNS TESTES FALHARAM'}`);

  if (todosOk) {
    console.log('\n🎉 A correção do portal link funcionou perfeitamente!');
    console.log('💡 Agora os tokens gerados no frontend são automaticamente aceitos no portal.');
  }
}

// Executar teste
testarCorrecaoPortalLink().catch(console.error);
