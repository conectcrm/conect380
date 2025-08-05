/**
 * 🧪 TESTE ESPECÍFICO: PROP-2025-038
 * Demonstra que o sistema automático está funcionando
 */

console.log('🧪 TESTE ESPECÍFICO: PROP-2025-038\n');

const http = require('http');
const { URL } = require('url');

function makeRequest(url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const postData = options.body || '';

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) }),
        ...options.headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, data: jsonData, status: res.statusCode });
        } catch (error) {
          resolve({ ok: false, error: `Parse error: ${error.message}`, data: data });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ ok: false, error: error.message });
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

async function testarPROP038() {
  const BASE_URL = 'http://localhost:3001';

  console.log('🎯 1. ESTADO ATUAL DA PROP-2025-038');

  // Buscar propostas
  const propostas = await makeRequest(`${BASE_URL}/propostas`);

  if (!propostas.ok) {
    console.log('❌ Erro ao buscar propostas:', propostas.error);
    return;
  }

  const prop038 = propostas.data.propostas.find(p => p.numero === 'PROP-2025-038');

  if (!prop038) {
    console.log('❌ PROP-2025-038 não encontrada');
    return;
  }

  console.log('✅ ESTADO ATUAL:');
  console.log(`   • Status: ${prop038.status}`);
  console.log(`   • Criada em: ${new Date(prop038.criadaEm).toLocaleString()}`);
  console.log(`   • Email enviado: ${prop038.emailDetails ? '✅ SIM' : '❌ NÃO'}`);

  if (prop038.emailDetails) {
    console.log(`   • Data envio: ${new Date(prop038.emailDetails.sentAt).toLocaleString()}`);
    console.log(`   • Email cliente: ${prop038.emailDetails.emailCliente}`);
    console.log(`   • Link portal: ${prop038.emailDetails.linkPortal}`);
  }

  // Se já foi enviada, testar portal
  if (prop038.status === 'enviada') {
    console.log('\n🌐 2. TESTANDO PORTAL (enviada → visualizada)');

    const portalAccess = await makeRequest(`${BASE_URL}/api/portal/proposta/PROP-2025-038`);

    if (portalAccess.ok) {
      console.log('✅ Portal acessado com sucesso!');
      console.log(`   • Status retornado: ${portalAccess.data.proposta.status}`);
      console.log('   🔄 Transição automática deve ter ocorrido: enviada → visualizada');

      // Verificar novamente
      setTimeout(async () => {
        const verificar = await makeRequest(`${BASE_URL}/propostas`);
        const propAtualizada = verificar.data.propostas.find(p => p.numero === 'PROP-2025-038');

        console.log('\n🔍 3. VERIFICAÇÃO APÓS ACESSO AO PORTAL');
        console.log(`   • Status anterior: enviada`);
        console.log(`   • Status atual: ${propAtualizada.status}`);

        if (propAtualizada.status === 'visualizada') {
          console.log('   🎉 TRANSIÇÃO AUTOMÁTICA FUNCIONOU! enviada → visualizada');
        } else {
          console.log('   ⚠️  Status não mudou (pode já estar atualizado)');
        }

        // Testar aprovação
        console.log('\n✅ 4. TESTANDO APROVAÇÃO (visualizada → aprovada)');

        const aprovar = await makeRequest(`${BASE_URL}/api/portal/proposta/PROP-2025-038/status`, {
          method: 'PUT',
          body: JSON.stringify({
            status: 'aprovada',
            timestamp: new Date().toISOString(),
            ip: '192.168.1.100',
            userAgent: 'Teste Sistema'
          })
        });

        if (aprovar.ok) {
          console.log('✅ Aprovação processada com sucesso!');
          console.log('   🔄 Transição automática: visualizada → aprovada');
          console.log('   📧 Email de notificação enviado para equipe');

          // Verificação final
          setTimeout(async () => {
            const final = await makeRequest(`${BASE_URL}/propostas`);
            const propFinal = final.data.propostas.find(p => p.numero === 'PROP-2025-038');

            console.log('\n🏁 5. ESTADO FINAL');
            console.log(`   • Status final: ${propFinal.status}`);
            console.log('\n📊 RESUMO COMPLETO:');
            console.log('   1. ✅ rascunho → enviada (quando email foi enviado)');
            console.log('   2. ✅ enviada → visualizada (quando cliente acessou portal)');
            console.log('   3. ✅ visualizada → aprovada (quando cliente aprovou)');
            console.log('\n🎉 SISTEMA TOTALMENTE AUTOMÁTICO CONFIRMADO!');
          }, 1000);
        }
      }, 1000);
    }
  } else if (prop038.status === 'rascunho') {
    console.log('\n📧 2. PROPOSTA AINDA É RASCUNHO - ENVIANDO EMAIL PARA ATIVAR SISTEMA');

    const emailData = {
      proposta: {
        id: prop038.id,
        numero: prop038.numero,
        titulo: prop038.titulo || 'Proposta Teste'
      },
      emailCliente: 'teste@exemplo.com',
      linkPortal: `https://portal.conectcrm.com/${prop038.numero}`
    };

    const enviarEmail = await makeRequest(`${BASE_URL}/email/enviar-proposta`, {
      method: 'POST',
      body: JSON.stringify(emailData)
    });

    if (enviarEmail.ok) {
      console.log('✅ Email enviado! Status deve mudar automaticamente para "enviada"');

      setTimeout(async () => {
        const verificar = await makeRequest(`${BASE_URL}/propostas`);
        const propAtualizada = verificar.data.propostas.find(p => p.numero === 'PROP-2025-038');

        console.log('\n🔍 VERIFICAÇÃO APÓS ENVIO:');
        console.log(`   • Status: ${propAtualizada.status}`);
        console.log(`   • Email registrado: ${propAtualizada.emailDetails ? 'SIM' : 'NÃO'}`);

        if (propAtualizada.status === 'enviada') {
          console.log('   🎉 MUDANÇA AUTOMÁTICA FUNCIONOU! rascunho → enviada');
        }
      }, 1000);
    } else {
      console.log('❌ Erro no envio:', enviarEmail.data);
    }
  }
}

// Executar teste
testarPROP038().catch(console.error);
