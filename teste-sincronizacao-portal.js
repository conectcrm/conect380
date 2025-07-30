/**
 * 🧪 TESTE DE SINCRONIZAÇÃO: Portal → CRM Grid
 * 
 * Este script testa se as atualizações feitas no portal do cliente
 * são refletidas automaticamente no grid de propostas do CRM.
 */

console.log('🔧 INICIANDO TESTE DE SINCRONIZAÇÃO PORTAL → CRM GRID');
console.log('=' * 60);

// Função para testar sincronização
async function testarSincronizacaoPortal() {
  console.log('📋 1. Testando endpoints do backend...');

  // 1. Testar endpoint do portal
  try {
    const portalResponse = await fetch('http://localhost:3001/api/portal/proposta/PROP-2025-537375/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'aprovada',
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        userAgent: 'Teste'
      })
    });

    if (portalResponse.ok) {
      console.log('✅ Portal endpoint: OK');
    } else {
      console.error('❌ Portal endpoint falhou:', portalResponse.status);
    }
  } catch (error) {
    console.error('❌ Erro no portal endpoint:', error);
  }

  // 2. Testar endpoint do CRM principal
  try {
    const crmResponse = await fetch('http://localhost:3001/propostas/PROP-2025-537375/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'aprovada',
        observacoes: 'Proposta aceita via teste de sincronização',
        dataAceite: new Date().toISOString(),
        fonte: 'teste'
      })
    });

    if (crmResponse.ok) {
      const result = await crmResponse.json();
      console.log('✅ CRM endpoint: OK');
      console.log('📋 Resposta:', result);
    } else {
      console.error('❌ CRM endpoint falhou:', crmResponse.status);
    }
  } catch (error) {
    console.error('❌ Erro no CRM endpoint:', error);
  }

  // 3. Simular evento do portal para o frontend
  console.log('📡 2. Simulando evento de sincronização...');
  window.dispatchEvent(new CustomEvent('propostaAtualizada', {
    detail: {
      propostaId: 'PROP-2025-537375',
      novoStatus: 'aprovada',
      fonte: 'teste-sincronizacao'
    }
  }));

  console.log('✅ Evento disparado! Verificar se o grid atualizou automaticamente.');
  console.log('');
  console.log('🔍 INSTRUÇÕES:');
  console.log('1. Abra a página /propostas no navegador');
  console.log('2. Execute este script no console (F12)');
  console.log('3. Observe se a proposta PROP-2025-537375 mudou para status "aprovada"');
  console.log('4. Verifique os logs no console para confirmar que o evento foi recebido');
  console.log('');
  console.log('📊 Sinais de sucesso:');
  console.log('✅ Log: "🔄 Evento de atualização recebido do portal:"');
  console.log('✅ Log: "♻️ Recarregando propostas após atualização do portal..."');
  console.log('✅ Status da proposta mudou visualmente no grid');
}

// Função para verificar se a página de propostas está ativa
function verificarPaginaPropostas() {
  const isPropostasPage = window.location.pathname.includes('/propostas');

  if (!isPropostasPage) {
    console.warn('⚠️ Este teste deve ser executado na página /propostas');
    console.log('🔗 Navegue para: http://localhost:3900/propostas');
    return false;
  }

  console.log('✅ Página de propostas detectada');
  return true;
}

// Executar teste
if (verificarPaginaPropostas()) {
  testarSincronizacaoPortal();
} else {
  console.log('❌ Teste cancelado - navegue para a página de propostas primeiro');
}

// Função adicional para testar manualmente
window.testarSincronizacao = testarSincronizacaoPortal;
