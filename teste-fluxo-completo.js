/**
 * Teste completo do fluxo frontend-backend
 * Simula exatamente o que acontece quando o usuário clica em "enviar email"
 */

const http = require('http');

// Dados reais de uma proposta para testar
const propostaId = 'bde80b1d-02a2-4532-a868-bc8e7b59a715'; // PROP-2025-009
const emailCliente = 'dhonlenofreitas@hotmail.com';

console.log('🧪 Teste Completo: Simulando fluxo frontend -> backend');
console.log('📋 Proposta ID:', propostaId);
console.log('📧 Email:', emailCliente);

// Passo 1: Enviar email via /email/enviar-proposta
const dadosEmailProposta = {
  proposta: {
    id: propostaId,
    numero: "PROP-2025-009",
    titulo: "Proposta de Teste - Sistema CRM"
  },
  emailCliente: emailCliente,
  linkPortal: `https://portal.conectcrm.com/proposta/${propostaId}`
};

console.log('\n🚀 PASSO 1: Enviando email...');

const postData = JSON.stringify(dadosEmailProposta);

const emailOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/email/enviar-proposta',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const emailReq = http.request(emailOptions, (res) => {
  console.log(`📡 Status envio: ${res.statusCode}`);

  let emailData = '';
  res.on('data', (chunk) => {
    emailData += chunk;
  });

  res.on('end', () => {
    console.log('📧 Resposta envio email:');
    try {
      const emailResponse = JSON.parse(emailData);
      console.log(JSON.stringify(emailResponse, null, 2));

      if (emailResponse.success) {
        console.log('✅ Email enviado com sucesso!');

        // Passo 2: Verificar se o status foi atualizado
        setTimeout(() => {
          console.log('\n🔍 PASSO 2: Verificando status da proposta...');

          const statusOptions = {
            hostname: 'localhost',
            port: 3001,
            path: `/propostas/${propostaId}`,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          };

          const statusReq = http.request(statusOptions, (statusRes) => {
            console.log(`📡 Status consulta: ${statusRes.statusCode}`);

            let statusData = '';
            statusRes.on('data', (chunk) => {
              statusData += chunk;
            });

            statusRes.on('end', () => {
              console.log('📊 Status atual da proposta:');
              try {
                const propostaAtual = JSON.parse(statusData);
                console.log(`  - ID: ${propostaAtual.id}`);
                console.log(`  - Número: ${propostaAtual.numero}`);
                console.log(`  - Status: ${propostaAtual.status}`);
                console.log(`  - Atualizada em: ${propostaAtual.atualizadaEm}`);
                console.log(`  - Cliente: ${propostaAtual.cliente}`);

                if (propostaAtual.status === 'enviada') {
                  console.log('\n🎉 SUCESSO TOTAL: Status foi atualizado para "enviada"!');
                  console.log('✅ Backend funcionando 100% corretamente');
                  console.log('🎯 Se o frontend não mostra a atualização, é problema de cache/recarregamento');
                } else {
                  console.log('\n❌ PROBLEMA: Status não foi atualizado');
                  console.log(`Status atual: ${propostaAtual.status} (esperado: enviada)`);
                }
              } catch (e) {
                console.log('📄 Resposta status (texto):', statusData);
              }
            });
          });

          statusReq.on('error', (e) => {
            console.error('❌ Erro ao consultar status:', e.message);
          });

          statusReq.end();
        }, 2000); // Aguardar 2 segundos para sincronização

      } else {
        console.log('❌ FALHA no envio de email');
      }
    } catch (e) {
      console.log('📄 Resposta email (texto):', emailData);
    }
  });
});

emailReq.on('error', (e) => {
  console.error('❌ Erro no envio de email:', e.message);
});

emailReq.write(postData);
emailReq.end();
