// Script para testar se os clientes aparecem no dropdown
// Execute este script no console do navegador na página de nova proposta

console.log('🔍 Testando se os clientes aparecem na nova proposta...');

// Aguardar a página carregar
setTimeout(() => {
  // Encontrar o campo de busca de cliente
  const campoCliente = document.querySelector('input[placeholder="Buscar cliente..."]');
  
  if (campoCliente) {
    console.log('✅ Campo de busca de cliente encontrado');
    
    // Simular clique para abrir o dropdown
    campoCliente.focus();
    campoCliente.click();
    
    setTimeout(() => {
      // Verificar se o dropdown apareceu
      const dropdown = document.querySelector('.absolute.z-10.w-full.mt-1.bg-white');
      
      if (dropdown) {
        console.log('✅ Dropdown aberto');
        
        // Verificar conteúdo do dropdown
        const mensagem = dropdown.textContent;
        
        if (mensagem.includes('Carregando clientes')) {
          console.log('⏳ Clientes sendo carregados...');
        } else if (mensagem.includes('Nenhum cliente')) {
          console.log('⚠️ Nenhum cliente encontrado - Backend pode não estar rodando');
        } else {
          console.log('✅ Clientes encontrados no dropdown!');
          console.log('📋 Conteúdo:', mensagem);
        }
      } else {
        console.log('❌ Dropdown não encontrado');
      }
    }, 500);
    
  } else {
    console.log('❌ Campo de busca de cliente não encontrado');
  }
}, 1000);
