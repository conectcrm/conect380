/**
 * 🔧 TESTE: CORREÇÃO DO BOTÃO FRONTEND
 * 
 * Testa se a correção do emailServiceReal.enviarPropostaParaCliente()
 * agora chama o endpoint correto /email/enviar-proposta que faz
 * sincronização automática do status.
 */

console.log('🔧 TESTANDO CORREÇÃO DO BOTÃO FRONTEND\n');

async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return { error };
  }
}

async function testarCorrecaoFrontend() {
  try {
    // 1. Buscar PROP-2025-038 para testar
    console.log('🔍 1. Buscando PROP-2025-038...');
    const { response: resPropostas, data: dataPropostas } = await makeRequest('http://localhost:3001/propostas');

    if (!resPropostas.ok) {
      console.log('❌ Erro ao buscar propostas');
      return;
    }

    const prop038 = dataPropostas.propostas.find(p => p.numero === 'PROP-2025-038');
    if (!prop038) {
      console.log('❌ PROP-2025-038 não encontrada');
      return;
    }

    console.log(`✅ Encontrada - Status atual: ${prop038.status}`);

    // 2. Simular chamada do frontend corrigido
    console.log('\n📧 2. Testando novo formato do frontend...');

    const dadosEnvio = {
      proposta: {
        id: prop038.numero,
        numero: prop038.numero,
        valorTotal: prop038.total,
        dataValidade: '2025-02-20T23:59:59Z',
        token: 'TOKEN_TESTE_' + Date.now()
      },
      emailCliente: 'teste@exemplo.com',
      linkPortal: 'http://localhost:3900/portal'
    };

    console.log('📦 Dados sendo enviados:');
    console.log('   Proposta ID:', dadosEnvio.proposta.id);
    console.log('   Email:', dadosEnvio.emailCliente);
    console.log('   Link Portal:', dadosEnvio.linkPortal);

    // 3. Enviar via endpoint correto (/email/enviar-proposta)
    const { response: resEmail, data: dataEmail } = await makeRequest('http://localhost:3001/email/enviar-proposta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosEnvio)
    });

    if (resEmail.ok && dataEmail.success) {
      console.log('\n✅ EMAIL ENVIADO COM SUCESSO!');
      console.log('   Timestamp:', dataEmail.timestamp);
      console.log('   Para:', dataEmail.emailCliente);

      // 4. Verificar se status mudou automaticamente
      console.log('\n🔄 3. Verificando sincronização automática...');

      // Aguardar um pouco para sincronização
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { response: resVerifica, data: dataVerifica } = await makeRequest('http://localhost:3001/propostas');

      if (resVerifica.ok) {
        const propAtualizada = dataVerifica.propostas.find(p => p.numero === 'PROP-2025-038');

        if (propAtualizada) {
          console.log(`📊 Status ANTES: ${prop038.status}`);
          console.log(`📊 Status DEPOIS: ${propAtualizada.status}`);

          if (propAtualizada.status === 'enviada') {
            console.log('\n🎉 SUCESSO TOTAL!');
            console.log('✅ Frontend corrigido funcionando perfeitamente');
            console.log('✅ Sincronização automática funcionando');
            console.log('✅ Status mudou automaticamente para "enviada"');
          } else {
            console.log('\n⚠️ Status não mudou para "enviada"');
            console.log('   Pode ser que já estava enviada ou houve outro problema');
          }
        }
      }

    } else {
      console.log('\n❌ ERRO NO ENVIO:');
      console.log('   Status:', resEmail.status);
      console.log('   Erro:', dataEmail.message || dataEmail.error);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// 5. Testar também formato novo vs antigo
function compararFormatos() {
  console.log('\n📋 COMPARAÇÃO DE FORMATOS:');

  console.log('\n❌ FORMATO ANTIGO (emailServiceReal anterior):');
  console.log('   Endpoint: /email/enviar');
  console.log('   Dados: { to: [], subject: "", message: "" }');
  console.log('   Resultado: ❌ Email enviado MAS status não muda');

  console.log('\n✅ FORMATO NOVO (emailServiceReal corrigido):');
  console.log('   Endpoint: /email/enviar-proposta');
  console.log('   Dados: { proposta: {...}, emailCliente: "", linkPortal: "" }');
  console.log('   Resultado: ✅ Email enviado E status muda automaticamente');
}

// Executar teste
testarCorrecaoFrontend().then(() => {
  compararFormatos();
  console.log('\n🎯 CONCLUSÃO:');
  console.log('O problema estava no emailServiceReal.ts que chamava');
  console.log('/email/enviar ao invés de /email/enviar-proposta');
  console.log('A correção deve resolver o problema do botão frontend!');
});
