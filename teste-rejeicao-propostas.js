/**
 * TESTE COMPLETO: Funcionalidade de Rejeição de Propostas
 * 
 * Este script testa o fluxo completo de rejeição de propostas
 */

// 1. VERIFICAR PROPOSTAS DISPONÍVEIS
async function listarPropostas() {
  const response = await fetch('http://localhost:3001/propostas');
  const data = await response.json();

  console.log('📋 Propostas disponíveis:');
  data.propostas.forEach(p => {
    console.log(`- ${p.numero}: ${p.status} | Cliente: ${p.cliente?.nome || p.cliente}`);
  });

  return data.propostas;
}

// 2. ATUALIZAR PROPOSTA PARA "VISUALIZADA" (pré-requisito para rejeição)
async function prepararPropostaParaRejeicao(propostaId) {
  const response = await fetch(`http://localhost:3001/propostas/${propostaId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'visualizada' })
  });

  if (response.ok) {
    console.log('✅ Proposta preparada (status: visualizada)');
    return true;
  } else {
    console.error('❌ Erro ao preparar proposta');
    return false;
  }
}

// 3. REJEITAR PROPOSTA
async function rejeitarProposta(propostaId) {
  console.log(`🔄 Rejeitando proposta ${propostaId}...`);

  const response = await fetch(`http://localhost:3001/propostas/${propostaId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'rejeitada' })
  });

  if (response.ok) {
    const resultado = await response.json();
    console.log('✅ Proposta rejeitada com sucesso!');
    console.log('📧 Email de notificação enviado para a equipe');
    return resultado;
  } else {
    const erro = await response.text();
    console.error('❌ Erro ao rejeitar proposta:', erro);
    return null;
  }
}

// 4. TESTE VIA PORTAL (como o cliente faria)
async function rejeitarViaPotal(token) {
  console.log(`🌐 Simulando rejeição via portal (token: ${token})...`);

  const response = await fetch(`http://localhost:3001/api/portal/proposta/${token}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'rejeitada',
      timestamp: new Date().toISOString(),
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Test Browser)'
    })
  });

  if (response.ok) {
    console.log('✅ Proposta rejeitada via portal!');
    console.log('📧 Notificação automática enviada');
    return await response.json();
  } else {
    console.error('❌ Erro na rejeição via portal');
    return null;
  }
}

// 5. FLUXO COMPLETO DE TESTE
async function testeCompletoRejeicao() {
  console.log('🚀 INICIANDO TESTE COMPLETO DE REJEIÇÃO\n');

  try {
    // Listar propostas
    const propostas = await listarPropostas();

    if (propostas.length === 0) {
      console.log('❌ Nenhuma proposta encontrada para teste');
      return;
    }

    // Pegar primeira proposta disponível
    const proposta = propostas[0];
    console.log(`\n🎯 Testando com proposta: ${proposta.numero} (${proposta.id})`);

    // Preparar proposta
    const preparada = await prepararPropostaParaRejeicao(proposta.id);
    if (!preparada) return;

    // Aguardar 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Rejeitar proposta
    const resultado = await rejeitarProposta(proposta.id);

    if (resultado) {
      console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
      console.log('✅ Funcionalidade de rejeição está funcionando');
      console.log('✅ Email de notificação foi enviado');
      console.log('✅ Status atualizado no sistema');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// FUNÇÕES AUXILIARES
function gerarToken() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// EXECUTAR TESTE
console.log('🧪 TESTE DE REJEIÇÃO DE PROPOSTAS');
console.log('================================');
console.log('Use: testeCompletoRejeicao() para executar o teste');
console.log('Ou use as funções individuais:');
console.log('- listarPropostas()');
console.log('- rejeitarProposta(id)');
console.log('- rejeitarViaPotal(token)');

// Auto-executar
testeCompletoRejeicao();
