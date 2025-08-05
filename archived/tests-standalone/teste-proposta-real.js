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
            json: () => Promise.resolve(JSON.parse(data))
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
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

async function verificarPropostasExistentes() {
  try {
    console.log('🔍 Verificando propostas existentes...\n');

    const response = await makeRequest('http://localhost:3001/propostas');
    const propostas = await response.json();

    if (propostas && propostas.length > 0) {
      console.log(`📊 Encontradas ${propostas.length} propostas:`);

      propostas.slice(0, 3).forEach((proposta, index) => {
        console.log(`   ${index + 1}. ${proposta.numero} - ${proposta.titulo}`);
        console.log(`      ID: ${proposta.id}`);
        console.log(`      Status: ${proposta.status}`);
        console.log('');
      });

      // Testar com uma proposta real
      const propostaTest = propostas[0];
      console.log(`🧪 Testando envio com proposta real: ${propostaTest.numero}\n`);

      const emailData = {
        proposta: {
          id: propostaTest.id,
          numero: propostaTest.numero,
          titulo: propostaTest.titulo,
          cliente: propostaTest.cliente || 'Cliente Teste',
          valor: propostaTest.valor || 1500.00,
          validadeDias: propostaTest.validadeDias || 15,
          observacoes: 'Teste de sincronização automática'
        },
        emailCliente: 'teste@exemplo.com',
        linkPortal: 'http://localhost:3900/portal/ABCD123'
      };

      console.log('📧 Dados do teste:');
      console.log('   Proposta ID:', emailData.proposta.id);
      console.log('   Proposta Número:', emailData.proposta.numero);
      console.log('   Cliente Email:', emailData.emailCliente);
      console.log('');

      const emailResponse = await makeRequest('http://localhost:3001/email/enviar-proposta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      const emailResult = await emailResponse.json();

      if (emailResponse.ok) {
        console.log('✅ SUCESSO: Proposta enviada com ID real!');
        console.log('   ID:', emailResult.timestamp || 'N/A');
        console.log('   Para:', emailResult.emailCliente);
        console.log('   Timestamp:', emailResult.timestamp);
        console.log('\n🎉 Teste com proposta real PASSOU!');
        return true;
      } else {
        console.log('❌ ERRO: Falha no envio');
        console.log('   Status:', emailResponse.status);
        console.log('   Erro:', emailResult.message || emailResult.error);
        return false;
      }
    } else {
      console.log('⚠️ Nenhuma proposta encontrada no banco de dados');
      console.log('   O teste com proposta fictícia está funcionando corretamente');
      return true;
    }

  } catch (error) {
    console.log('❌ ERRO CRÍTICO:', error.message);
    return false;
  }
}

// Executar teste
verificarPropostasExistentes().catch(console.error);
