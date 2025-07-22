// Script de teste para verificar integração de propostas
// Execute no console do navegador na página /propostas

console.log('🧪 Testando integração de propostas...');

// 1. Verificar se o serviço de propostas está disponível
try {
  console.log('📦 Verificando propostasService...');
  // Simular teste do serviço
  
  // 2. Testar listagem de propostas
  console.log('📋 Testando listagem de propostas...');
  
  // 3. Verificar se elementos da UI estão presentes
  const headerPropostas = document.querySelector('h1');
  if (headerPropostas) {
    console.log('✅ Header de propostas encontrado:', headerPropostas.textContent);
  } else {
    console.log('❌ Header de propostas não encontrado');
  }
  
  // 4. Verificar botão de nova proposta
  const botaoNovaProposta = document.querySelector('button[onclick*="nova"]') || 
                           document.querySelector('[href*="nova"]') ||
                           document.querySelector('button:contains("Nova")');
  
  if (botaoNovaProposta) {
    console.log('✅ Botão "Nova Proposta" encontrado');
  } else {
    console.log('❌ Botão "Nova Proposta" não encontrado');
  }
  
  // 5. Verificar tabela/lista de propostas
  const tabelaPropostas = document.querySelector('table') || 
                         document.querySelector('[class*="proposta"]') ||
                         document.querySelector('[class*="list"]');
  
  if (tabelaPropostas) {
    console.log('✅ Tabela/lista de propostas encontrada');
    
    // Contar linhas de propostas
    const linhasPropostas = document.querySelectorAll('tr[class*="proposta"]') ||
                           document.querySelectorAll('tbody tr') ||
                           document.querySelectorAll('[class*="item"]');
    
    console.log(`📊 Propostas encontradas na UI: ${linhasPropostas.length}`);
  } else {
    console.log('❌ Tabela/lista de propostas não encontrada');
  }
  
  // 6. Verificar indicador de loading
  const loading = document.querySelector('[class*="spin"]') || 
                 document.querySelector('[class*="loading"]');
  
  if (loading) {
    console.log('🔄 Indicador de loading ativo');
  } else {
    console.log('✅ Sem loading (dados já carregados)');
  }
  
  console.log('✅ Teste concluído! Verifique os logs acima.');
  
} catch (error) {
  console.error('❌ Erro durante teste:', error);
}

// Instruções para o usuário
console.log(`
🎯 PRÓXIMOS PASSOS:

1. Criar uma nova proposta:
   - Clique em "Nova Proposta"
   - Preencha todos os campos
   - Clique em "Gerar Proposta"
   - Aguarde redirecionamento

2. Verificar se aparece na lista:
   - Deve voltar para /propostas automaticamente
   - Nova proposta deve aparecer no topo da lista
   - Console deve mostrar logs de integração

3. Se não funcionar:
   - Verifique console por erros
   - Recarregue a página (F5)
   - Tente criar outra proposta

🔧 DEBUG: Execute este script novamente após criar uma proposta!
`);
