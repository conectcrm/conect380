/**
 * Teste manual para verificar se a atualização de status da proposta funciona
 * Execute este arquivo no console do navegador após enviar um email de proposta
 */

// Função para testar a atualização de status
async function testarAtualizacaoStatus() {
  try {
    console.log('🧪 Iniciando teste de atualização de status...');

    // Simular uma proposta ID (substitua por um ID real)
    const propostaId = 'PROP-2025-004';

    // Fazer requisição para o backend para atualizar status
    const response = await fetch(`http://localhost:3001/propostas/${propostaId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'enviada' })
    });

    if (response.ok) {
      const resultado = await response.json();
      console.log('✅ Status atualizado com sucesso:', resultado);
      return resultado;
    } else {
      console.error('❌ Erro ao atualizar status:', response.status, response.statusText);
      const erro = await response.text();
      console.error('Detalhes do erro:', erro);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

// Função para verificar propostas existentes
async function listarPropostas() {
  try {
    console.log('📋 Listando propostas...');
    const response = await fetch('http://localhost:3001/propostas');

    if (response.ok) {
      const propostas = await response.json();
      console.log('📊 Propostas encontradas:', propostas);

      // Mostrar apenas os dados essenciais
      propostas.forEach(p => {
        console.log(`- ${p.numero || p.id}: Status "${p.status}" | Cliente: ${p.cliente?.nome || p.cliente || 'N/A'}`);
      });

      return propostas;
    } else {
      console.error('❌ Erro ao buscar propostas:', response.status);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

// Executar testes
console.log('🚀 Testes disponíveis:');
console.log('1. testarAtualizacaoStatus() - Testa atualização de status');
console.log('2. listarPropostas() - Lista todas as propostas');
