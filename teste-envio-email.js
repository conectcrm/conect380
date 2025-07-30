console.log('📧 Testando envio de email para proposta com cliente como objeto...');

// Usar uma proposta que já foi enviada antes e tem emailDetails
const propostaId = 'bde80b1d-02a2-4532-a868-bc8e7b59a715';

const emailData = {
  propostaId: propostaId,
  destinatario: 'dhonlenofreitas@hotmail.com', // Email real do cliente
  assunto: 'Sua Proposta Comercial - Teste Correção',
  mensagemPersonalizada: 'Olá! Segue em anexo sua proposta comercial atualizada para análise.'
};

fetch('http://localhost:3001/email/enviar-proposta', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(emailData)
})
  .then(response => response.json())
  .then(result => {
    console.log('✅ Resposta do envio de email:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });
