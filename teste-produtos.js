// Script de teste para verificar os produtos
console.log('Testando carregamento de produtos...');

// Simular chamada para backend (se estiver rodando)
fetch('http://localhost:3001/produtos')
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(`Backend não disponível: ${response.status}`);
    }
  })
  .then(produtos => {
    console.log('✅ Produtos do backend encontrados:');
    console.log(produtos);
    console.log(`Total de produtos: ${produtos.length}`);
  })
  .catch(error => {
    console.log('❌ Backend não disponível:', error.message);
    console.log('Verificando localStorage...');
    
    // Verificar localStorage
    const produtosSalvos = localStorage.getItem('fenixcrm_produtos');
    if (produtosSalvos) {
      const produtos = JSON.parse(produtosSalvos);
      console.log('✅ Produtos no localStorage encontrados:');
      console.log(produtos);
      console.log(`Total de produtos: ${produtos.length}`);
    } else {
      console.log('❌ Nenhum produto encontrado no localStorage');
      console.log('📋 Produtos disponíveis: apenas mock data');
    }
  });
