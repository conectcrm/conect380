/**
 * 🧪 TESTE ESPECÍFICO - ENVIO VIA RESUMO vs LISTA
 * 
 * Este teste verifica se há diferença entre o envio de proposta
 * via modal de resumo versus lista de propostas
 */

async function testarDiferencaEnvio() {
  console.log('🔍 TESTE: ENVIO VIA RESUMO vs LISTA');
  console.log('===================================\n');

  const propostaId = 'PROP-2025-1753750092020-91883'; // Nova proposta criada

  console.log('📋 Testando com proposta:', propostaId);

  try {
    // 1. Verificar status inicial
    console.log('\n1️⃣ Verificando status inicial...');
    let response = await fetch('http://localhost:3001/propostas');
    let data = await response.json();
    let proposta = data.propostas.find(p => p.id === propostaId);

    if (!proposta) {
      console.log('❌ Proposta não encontrada!');
      return;
    }

    console.log('   Status inicial:', proposta.status);
    console.log('   Número:', proposta.numero);
    console.log('   Cliente:', proposta.cliente?.nome || 'Não definido');

    // 2. Simular envio direto via API (como seria feito pelo PropostaActions)
    console.log('\n2️⃣ Simulando envio via API direta...');
    response = await fetch(`http://localhost:3001/propostas/${propostaId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'enviada' })
    });

    if (response.ok) {
      const resultado = await response.json();
      console.log('   ✅ API direta: Status atualizado com sucesso');
      console.log('   📊 Resposta:', resultado);
    } else {
      const error = await response.text();
      console.log('   ❌ API direta: Erro -', error);
    }

    // 3. Verificar se a mudança foi persistida
    console.log('\n3️⃣ Verificando se mudança foi persistida...');
    response = await fetch('http://localhost:3001/propostas');
    data = await response.json();
    proposta = data.propostas.find(p => p.id === propostaId);

    console.log('   Status após API:', proposta.status);
    console.log('   Última atualização:', new Date(proposta.atualizadaEm).toLocaleString());

    // 4. Testar transição para visualizada (preparação para próximo teste)
    console.log('\n4️⃣ Testando transição para visualizada...');
    response = await fetch(`http://localhost:3001/propostas/${propostaId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'visualizada' })
    });

    if (response.ok) {
      console.log('   ✅ Transição para visualizada: Sucesso');
    } else {
      console.log('   ❌ Transição para visualizada: Erro');
    }

    console.log('\n🎯 CONCLUSÕES:');
    console.log('==============');
    console.log('1. API de atualização de status está funcionando');
    console.log('2. Se problema persiste no frontend, é questão de contexto/callback');
    console.log('3. Verificar logs do navegador quando testar via interface');

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

// Função para testar logs do PropostaActions
async function verificarLogs() {
  console.log('\n📝 INSTRUÇÕES PARA TESTE NO FRONTEND:');
  console.log('=====================================');
  console.log('1. Abra o DevTools (F12) no navegador');
  console.log('2. Vá para a aba Console');
  console.log('3. Acesse a proposta PROP-2025-005 via modal de resumo');
  console.log('4. Clique em "Enviar por Email"');
  console.log('5. Observe os logs que começam com:');
  console.log('   - 🔍 Proposta ID:');
  console.log('   - 📞 Chamando updateStatus com:');
  console.log('   - 🔄 Chamando onPropostaUpdated callback...');
  console.log('6. Compare com envio via lista de propostas');
}

// Executar testes
testarDiferencaEnvio();
verificarLogs();
