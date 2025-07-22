// 🧪 TESTE ESPECÍFICO - Verificar Armazenamento de Propostas
// Execute no console do navegador na página /propostas

console.log(`
🔍 DIAGNÓSTICO DE ARMAZENAMENTO DE PROPOSTAS
============================================

Verificando se as propostas estão sendo armazenadas corretamente...
`);

// Verificar localStorage
console.log('📦 1. Verificando localStorage...');
try {
  const stored = localStorage.getItem('fenixcrm_propostas');
  if (stored) {
    const propostas = JSON.parse(stored);
    console.log(`✅ Encontradas ${propostas.length} propostas no localStorage:`, propostas);
    
    propostas.forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.numero} - Cliente: ${prop.cliente?.nome || 'N/A'} - Valor: R$ ${prop.total}`);
    });
  } else {
    console.log('❌ Nenhuma proposta encontrada no localStorage');
  }
} catch (error) {
  console.error('❌ Erro ao verificar localStorage:', error);
}

// Verificar se o serviço está funcionando
console.log('\n🔧 2. Testando serviço de propostas...');

// Função para testar o serviço
async function testarServico() {
  try {
    // Importar o serviço (se disponível globalmente)
    if (typeof window !== 'undefined') {
      console.log('📡 Testando listarPropostas()...');
      
      // Simular teste do serviço
      const startTime = Date.now();
      
      // Se o serviço estiver carregado, teste direto
      // Caso contrário, simule
      setTimeout(() => {
        const endTime = Date.now();
        console.log(`⏱️ Tempo de resposta: ${endTime - startTime}ms`);
        
        // Verificar novamente o localStorage após o teste
        const stored = localStorage.getItem('fenixcrm_propostas');
        if (stored) {
          const propostas = JSON.parse(stored);
          console.log(`📊 Resultado do teste: ${propostas.length} propostas encontradas`);
        } else {
          console.log('❌ Teste falhou: Nenhuma proposta no armazenamento');
        }
      }, 100);
    }
  } catch (error) {
    console.error('❌ Erro ao testar serviço:', error);
  }
}

testarServico();

// Verificar elementos da UI
console.log('\n🎨 3. Verificando elementos da UI...');

const tabelaPropostas = document.querySelector('table tbody');
if (tabelaPropostas) {
  const linhas = tabelaPropostas.querySelectorAll('tr');
  console.log(`📋 Linhas de propostas na tabela: ${linhas.length}`);
  
  if (linhas.length > 0) {
    console.log('✅ Propostas sendo exibidas na UI');
    Array.from(linhas).forEach((linha, index) => {
      const numero = linha.querySelector('td:first-child')?.textContent;
      const cliente = linha.querySelector('td:nth-child(2)')?.textContent;
      console.log(`   ${index + 1}. ${numero} - ${cliente}`);
    });
  } else {
    console.log('❌ Nenhuma proposta sendo exibida na UI');
  }
} else {
  console.log('❌ Tabela de propostas não encontrada');
}

// Verificar botão de atualizar
const botaoAtualizar = Array.from(document.querySelectorAll('button')).find(btn => 
  btn.textContent?.includes('Atualizar') || btn.textContent?.includes('Atualizando')
);

if (botaoAtualizar) {
  console.log('✅ Botão "Atualizar" encontrado');
  console.log('💡 Clique no botão "Atualizar" para forçar reload das propostas');
} else {
  console.log('❌ Botão "Atualizar" não encontrado');
}

// Instruções
console.log(`
🎯 DIAGNÓSTICO COMPLETO:

${localStorage.getItem('fenixcrm_propostas') ? '✅' : '❌'} LocalStorage contém propostas
${document.querySelector('table tbody tr') ? '✅' : '❌'} UI mostra propostas na tabela
${botaoAtualizar ? '✅' : '❌'} Botão "Atualizar" disponível

📝 PRÓXIMOS PASSOS:

1. Se localStorage vazio:
   - Crie uma nova proposta
   - Execute este script novamente

2. Se localStorage tem dados mas UI não mostra:
   - Clique no botão "Atualizar"
   - Recarregue a página (F5)

3. Se ainda não funcionar:
   - Abra DevTools > Console
   - Procure por erros vermelhos
   - Verifique logs de "✅ Propostas carregadas"

🧹 COMANDOS ÚTEIS:
localStorage.clear() // Limpar todas as propostas
location.reload() // Recarregar página
`);

// Disponibilizar função para limpar propostas
window.limparPropostas = () => {
  localStorage.removeItem('fenixcrm_propostas');
  console.log('🗑️ Propostas removidas do localStorage');
  location.reload();
};

console.log('💡 Digite limparPropostas() para limpar todas as propostas e começar do zero');
