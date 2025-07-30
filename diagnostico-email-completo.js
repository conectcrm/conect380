const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: data,
            json: () => Promise.resolve(JSON.parse(data))
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: data,
            json: () => Promise.resolve({})
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function diagnosticarSistemaEmail() {
  console.log('🔍 === DIAGNÓSTICO COMPLETO DO SISTEMA DE EMAIL ===\n');

  try {
    // 1. Verificar status do serviço de email
    console.log('1️⃣ Verificando status do serviço de email...');
    const statusResponse = await makeRequest('http://localhost:3001/email/status');
    const statusData = await statusResponse.json();

    if (statusResponse.ok) {
      console.log('✅ Serviço de email está funcionando');
      console.log('   Configuração:', JSON.stringify(statusData, null, 2));
    } else {
      console.log('❌ Serviço de email com problema');
      console.log('   Status:', statusResponse.status);
      console.log('   Resposta:', statusResponse.data);
    }

    console.log('\n2️⃣ Testando envio básico de email...');

    // 2. Teste de email básico
    const emailData = {
      to: ['dhonlenofreitas@hotmail.com'], // Email real
      subject: 'Teste de Diagnóstico - ConectCRM',
      message: 'Este é um email de teste para verificar se o sistema está funcionando corretamente.'
    };

    console.log('📧 Enviando para:', emailData.to[0]);

    const emailResponse = await makeRequest('http://localhost:3001/email/enviar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    const emailResult = await emailResponse.json();

    if (emailResponse.ok) {
      console.log('✅ SUCESSO: Email enviado!');
      console.log('   Message ID:', emailResult.messageId || 'N/A');
      console.log('   Timestamp:', emailResult.timestamp || new Date().toISOString());

      if (emailResult.messageId) {
        console.log('\n🔍 ANÁLISE DO MESSAGE ID:');
        console.log(`   O Gmail aceitou o email com ID: ${emailResult.messageId}`);
        console.log('   Isso significa que o SMTP está funcionando corretamente.');
        console.log('   Se o email não chegou, pode ser:');
        console.log('   • Email foi para pasta de SPAM/Lixo Eletrônico');
        console.log('   • Bloqueio do provedor de destino');
        console.log('   • Filtros de email do destinatário');
        console.log('   • Demora na entrega (pode levar alguns minutos)');
      }
    } else {
      console.log('❌ ERRO: Falha no envio');
      console.log('   Status:', emailResponse.status);
      console.log('   Erro:', emailResult.message || emailResult.error);
    }

    console.log('\n3️⃣ Verificações recomendadas:');
    console.log('📁 Verificar pasta de SPAM/Lixo Eletrônico');
    console.log('⏰ Aguardar até 5-10 minutos (demora normal do email)');
    console.log('🔧 Verificar filtros de email no destinatário');
    console.log('📧 Tentar com outro email de teste');

  } catch (error) {
    console.log('❌ ERRO CRÍTICO no diagnóstico:', error.message);
  }
}

// Executar diagnóstico
diagnosticarSistemaEmail().catch(console.error);
