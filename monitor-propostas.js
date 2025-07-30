/**
 * Script de monitoramento para verificar mudanças de status das propostas
 */

let intervalId;
let ultimoStatus = {};

async function monitorarPropostas() {
  try {
    const response = await fetch('http://localhost:3001/propostas');
    const data = await response.json();

    if (data.success && data.propostas) {
      data.propostas.forEach(proposta => {
        const statusAnterior = ultimoStatus[proposta.id];
        const statusAtual = proposta.status;

        if (statusAnterior && statusAnterior !== statusAtual) {
          console.log(`🔄 MUDANÇA DETECTADA: ${proposta.numero} (${proposta.id})`);
          console.log(`   Status: ${statusAnterior} → ${statusAtual}`);
          console.log(`   Cliente: ${proposta.cliente}`);
          console.log(`   Timestamp: ${new Date().toLocaleTimeString()}`);
          console.log('---');
        }

        ultimoStatus[proposta.id] = statusAtual;
      });
    }
  } catch (error) {
    console.error('Erro ao monitorar propostas:', error);
  }
}

function iniciarMonitoramento() {
  console.log('🔍 Iniciando monitoramento de propostas...');
  console.log('Use: pararMonitoramento() para parar');

  // Carregar status inicial
  monitorarPropostas();

  // Monitorar a cada 2 segundos
  intervalId = setInterval(monitorarPropostas, 2000);
}

function pararMonitoramento() {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('⏹️ Monitoramento parado');
  }
}

// Iniciar automaticamente
iniciarMonitoramento();
