/**
 * TESTE URGENTE DE EMAIL REAL
 * Execute este script no console para testar rapidamente
 */

console.log('🚨 === TESTE DE EMAIL REAL ===');

// Função para testar email diretamente
async function testarEmailReal() {
  try {
    console.log('📧 Testando envio de email real...');

    const emailReal = prompt('Digite seu email real para teste:', 'seu.email@gmail.com');

    if (!emailReal) {
      console.log('❌ Teste cancelado');
      return;
    }

    const response = await fetch('http://localhost:3001/email/enviar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: [emailReal],
        subject: '✅ TESTE ConectCRM - Funcionando!',
        message: `
          <h2>🎉 Teste de Email ConectCRM</h2>
          <p>Se você recebeu este email, significa que:</p>
          <ul>
            <li>✅ O backend está funcionando</li>
            <li>✅ As configurações de email estão corretas</li>
            <li>✅ O Gmail SMTP está operacional</li>
          </ul>
          <p><strong>Enviado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p><em>ConectCRM - Sistema funcionando perfeitamente!</em></p>
        `
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Email enviado com sucesso!', result);
      alert('✅ Email enviado! Verifique sua caixa de entrada (e spam).');
    } else {
      console.error('❌ Erro no envio:', result);
      alert('❌ Erro no envio: ' + (result.message || 'Erro desconhecido'));
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    alert('❌ Erro na requisição: ' + error.message);
  }
}

// Executar teste automaticamente
testarEmailReal();

console.log('📝 Para testar novamente, execute: testarEmailReal()');
