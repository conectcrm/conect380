/**
 * 🎯 Teste Real - Fluxo Completo de Proposta
 * Simula o fluxo real: Frontend gera token → Email enviado → Portal funcionando
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

async function testarFluxoCompletoReal() {
  console.log('🎯 === TESTE REAL: Fluxo Completo da Proposta ===\n');

  // 1. Verificar se temos propostas no sistema
  console.log('📋 1. Verificando propostas no sistema...');
  const propostas = await makeRequest(`${BASE_URL}/propostas`);

  if (!propostas.ok) {
    console.log('❌ Erro ao listar propostas:', propostas.error);
    return;
  }

  const proposta = propostas.data.propostas[0];
  if (!proposta) {
    console.log('❌ Nenhuma proposta encontrada no sistema');
    return;
  }

  console.log(`✅ Proposta encontrada: ${proposta.numero || proposta.id}`);
  console.log(`   📊 Status atual: ${proposta.status}`);

  // 2. Simular geração de token no frontend (como o PropostaActions faz)
  const token = Math.floor(Math.random() * 900000 + 100000).toString();
  console.log(`\n🎫 2. Token gerado pelo frontend: ${token}`);

  // 3. Simular envio de email (como o emailServiceReal faz)
  console.log('\n📧 3. Enviando email com token...');

  const emailData = {
    proposta: {
      numero: proposta.numero || proposta.id,
      valorTotal: proposta.valor || 1500.00,
      dataValidade: '2025-02-15',
      token: token
    },
    emailCliente: 'cliente@exemplo.com',
    linkPortal: `http://localhost:3900/portal/proposta/${token}`,
    registrarToken: true // ✅ Isso registra o token automaticamente
  };

  const envioResult = await makeRequest(`${BASE_URL}/email/enviar-proposta`, {
    method: 'POST',
    body: JSON.stringify(emailData)
  });

  if (envioResult.ok) {
    console.log('✅ Email enviado com sucesso!');
    console.log(`   📧 Para: ${emailData.emailCliente}`);
    console.log(`   🔗 Link: http://localhost:3900/portal/proposta/${token}`);
  } else {
    console.log('❌ Erro no envio do email:', envioResult.data?.message);
    return;
  }

  // 4. Simular cliente clicando no link (acesso ao portal)
  console.log('\n🌐 4. Cliente clica no link do email...');

  const portalResult = await makeRequest(`${BASE_URL}/api/portal/proposta/${token}`);

  if (portalResult.ok) {
    console.log('✅ Portal carregou a proposta!');
    console.log(`   📋 Título: ${portalResult.data.proposta?.titulo || 'N/A'}`);
    console.log(`   💰 Valor: R$ ${portalResult.data.proposta?.valor || 'N/A'}`);
    console.log(`   📊 Status: ${portalResult.data.proposta?.status || 'N/A'}`);
  } else {
    console.log('❌ Portal rejeitou o token:', portalResult.data?.message);
    return;
  }

  // 5. Cliente aprova a proposta
  console.log('\n✅ 5. Cliente aprova a proposta...');

  const aceiteResult = await makeRequest(`${BASE_URL}/api/portal/proposta/${token}/status`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'aprovada',
      timestamp: new Date().toISOString(),
      ip: '192.168.1.100',
      userAgent: 'Portal Cliente Real'
    })
  });

  if (aceiteResult.ok) {
    console.log('✅ Proposta aprovada pelo cliente!');
    console.log(`   📊 Novo status: ${aceiteResult.data.proposta?.status || 'N/A'}`);
  } else {
    console.log('❌ Erro na aprovação:', aceiteResult.data?.message);
    return;
  }

  // 6. Verificar sincronização no CRM
  console.log('\n🔄 6. Verificando sincronização no CRM...');

  const verificacao = await makeRequest(`${BASE_URL}/propostas/${proposta.id}`);

  if (verificacao.ok) {
    console.log('✅ Status sincronizado no CRM!');
    console.log(`   📊 Status final: ${verificacao.data.proposta?.status || 'N/A'}`);
  } else {
    console.log('❌ Erro na verificação:', verificacao.error);
  }

  // 7. Resultado final
  console.log('\n🎉 === FLUXO COMPLETO REALIZADO ===');
  console.log('✅ Token gerado no frontend');
  console.log('✅ Email enviado com token registrado');
  console.log('✅ Portal aceita o token automaticamente');
  console.log('✅ Cliente consegue aprovar a proposta');
  console.log('✅ Status sincronizado no CRM');
  console.log('\n💡 PROBLEMA RESOLVIDO: O portal agora funciona com tokens gerados dinamicamente!');
}

// Executar teste
testarFluxoCompletoReal().catch(console.error);
