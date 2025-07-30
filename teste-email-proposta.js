/**
 * Teste direto do envio de email de proposta
 * Para verificar se a correção funcionou
 */

const http = require('http');

// Dados de teste para envio de proposta
const dadosEmailProposta = {
  proposta: {
    id: "test-123",
    numero: "PROP-2025-001",
    titulo: "Proposta de Teste - Sistema CRM"
  },
  emailCliente: "dhonlenofreitas@hotmail.com",
  linkPortal: "https://portal.conectcrm.com/proposta/test-123"
};

console.log('🧪 Teste: Enviando email de proposta...');
console.log('📋 Dados:', JSON.stringify(dadosEmailProposta, null, 2));

const postData = JSON.stringify(dadosEmailProposta);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/email/enviar-proposta',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📧 Resposta do servidor:');
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('✅ SUCESSO: Email de proposta enviado!');
      } else {
        console.log('❌ FALHA: Erro ao enviar email de proposta');
      }
    } catch (e) {
      console.log('📄 Resposta (texto):', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e.message);
});

req.write(postData);
req.end();
