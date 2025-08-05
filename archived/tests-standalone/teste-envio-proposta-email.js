/**
 * Teste específico para envio de proposta por email
 */

const API_URL = 'http://localhost:3001';

async function testarEnvioPropostaEmail() {
  console.log('🧪 === TESTE: Envio de Proposta por Email ===\n');

  try {
    // Dados da proposta de teste
    const dadosProposta = {
      numero: 'PROP-2025-TEST',
      titulo: 'Teste de Envio de Email',
      cliente: 'Cliente Teste',
      valor: 1500.00,
      validadeDias: 15,
      observacoes: 'Proposta de teste para verificar envio de email'
    };

    const emailCliente = 'teste@exemplo.com';
    const linkPortal = 'http://localhost:3900/portal/ABCD123';

    console.log('📧 Dados do teste:');
    console.log('   Proposta:', dadosProposta.numero);
    console.log('   Cliente Email:', emailCliente);
    console.log('   Link Portal:', linkPortal);
    console.log('');

    // Testar envio de proposta
    console.log('📤 Enviando proposta por email...');

    const response = await fetch(`${API_URL}/email/enviar-proposta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        proposta: dadosProposta,
        emailCliente: emailCliente,
        linkPortal: linkPortal
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ SUCESSO: Proposta enviada por email!');
      console.log('   ID:', result.timestamp);
      console.log('   Para:', result.emailCliente);
      console.log('   Timestamp:', result.timestamp);

      return true;
    } else {
      console.log('❌ ERRO: Falha no envio');
      console.log('   Status:', response.status);
      console.log('   Erro:', result.message || result.error);

      return false;
    }

  } catch (error) {
    console.log('❌ ERRO CRÍTICO:', error.message);
    return false;
  }
}

async function testarEmailGenerico() {
  console.log('\n🧪 === TESTE: Email Genérico ===\n');

  try {
    const emailData = {
      para: ['teste@exemplo.com'],
      assunto: 'Teste - Sistema de Email ConectCRM',
      corpo: '<h2>🎉 Email de Teste</h2><p>Este email confirma que o sistema está funcionando!</p>'
    };

    console.log('📤 Enviando email genérico...');

    const response = await fetch(`${API_URL}/email/enviar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ SUCESSO: Email genérico enviado!');
      console.log('   ID:', result.id);
      console.log('   Status:', result.status);

      return true;
    } else {
      console.log('❌ ERRO: Falha no envio');
      console.log('   Status:', response.status);
      console.log('   Erro:', result.message || result.error);

      return false;
    }

  } catch (error) {
    console.log('❌ ERRO CRÍTICO:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando testes de email...\n');

  // Teste 1: Email genérico
  const teste1 = await testarEmailGenerico();

  // Teste 2: Envio de proposta
  const teste2 = await testarEnvioPropostaEmail();

  console.log('\n📊 === RESUMO DOS TESTES ===');
  console.log(`Email Genérico: ${teste1 ? '✅ FUNCIONANDO' : '❌ PROBLEMA'}`);
  console.log(`Envio Proposta: ${teste2 ? '✅ FUNCIONANDO' : '❌ PROBLEMA'}`);

  if (teste1 && teste2) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('   O sistema de email está funcionando corretamente.');
  } else {
    console.log('\n⚠️ PROBLEMAS ENCONTRADOS!');
    console.log('   Verifique os logs do backend para mais detalhes.');
  }
}

// Executar testes
main().catch(console.error);
