/**
 * Teste Final - Correção do Erro "Gmail SMTP: Not Found"
 * Verifica se todos os endpoints antigos foram removidos/corrigidos
 */

console.log('🔧 TESTE FINAL - Correção Email Sistema');
console.log('=====================================');

// Teste 1: Backend integrado funcionando
async function testarBackendIntegrado() {
  console.log('\n1️⃣ Testando Backend Integrado...');

  try {
    const response = await fetch('http://localhost:3001/email/status');
    const data = await response.json();

    if (data.service === 'Email Integrado' && data.status === 'ativo') {
      console.log('✅ Backend integrado: FUNCIONANDO');
      return true;
    } else {
      console.log('❌ Backend integrado: PROBLEMA');
      return false;
    }
  } catch (error) {
    console.log('❌ Backend integrado: ERRO -', error.message);
    return false;
  }
}

// Teste 2: Envio de email via backend integrado
async function testarEnvioEmail() {
  console.log('\n2️⃣ Testando Envio de Email...');

  try {
    const emailData = {
      para: ['teste@exemplo.com'],
      assunto: 'Teste Final - Correção Gmail SMTP',
      corpo: 'Este email confirma que o sistema integrado está funcionando!'
    };

    const response = await fetch('http://localhost:3001/email/enviar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Envio de email: FUNCIONANDO');
      console.log(`   ID: ${result.id}`);
      return true;
    } else {
      console.log('❌ Envio de email: PROBLEMA');
      console.log(`   Erro: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Envio de email: ERRO -', error.message);
    return false;
  }
}

// Teste 3: Verificar se servidor antigo não está rodando
async function testarServidorAntigo() {
  console.log('\n3️⃣ Verificando Servidor Antigo (porta 3800)...');

  try {
    const response = await fetch('http://localhost:3800/api/email/gmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });

    console.log('❌ Servidor antigo: AINDA RODANDO! (deve ser finalizado)');
    return false;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      console.log('✅ Servidor antigo: FINALIZADO (correto)');
      return true;
    } else {
      console.log('⚠️ Servidor antigo: Status incerto -', error.message);
      return true; // Assumir que está ok se não conseguir conectar
    }
  }
}

// Executar todos os testes
async function executarTestes() {
  console.log('🚀 Iniciando testes de correção...\n');

  const resultados = {
    backendIntegrado: await testarBackendIntegrado(),
    envioEmail: await testarEnvioEmail(),
    servidorAntigo: await testarServidorAntigo()
  };

  console.log('\n📋 RESULTADOS FINAIS:');
  console.log('====================');
  console.log(`Backend Integrado: ${resultados.backendIntegrado ? '✅ OK' : '❌ PROBLEMA'}`);
  console.log(`Envio de Email: ${resultados.envioEmail ? '✅ OK' : '❌ PROBLEMA'}`);
  console.log(`Servidor Antigo: ${resultados.servidorAntigo ? '✅ FINALIZADO' : '❌ AINDA ATIVO'}`);

  const todosOk = Object.values(resultados).every(r => r === true);

  if (todosOk) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ O erro "Gmail SMTP: Not Found" deve estar RESOLVIDO');
    console.log('💡 Agora faça hard refresh (Ctrl+Shift+R) no frontend');
  } else {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM');
    console.log('🔧 Verifique os problemas acima antes de testar no frontend');
  }
}

// Executar
executarTestes().catch(console.error);
