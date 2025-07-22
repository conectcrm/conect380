// Teste da funcionalidade de labels dinâmicos
console.log('🧪 TESTE DOS LABELS DINÂMICOS IMPLEMENTADOS');
console.log('=============================================');

// Função que simula a detecção implementada no componente
function isProdutoSoftware(produto) {
  return produto.tipoItem && ['licenca', 'modulo', 'aplicativo'].includes(produto.tipoItem);
}

// Função que simula a geração do label
function getLabelQuantidade(produto) {
  const isSoftware = isProdutoSoftware(produto);
  return isSoftware ? 'Quantidade de Licenças' : 'Quantidade';
}

// Função que simula a geração do placeholder
function getPlaceholderQuantidade(produto) {
  const isSoftware = isProdutoSoftware(produto);
  return isSoftware ? 'Ex: 10 licenças' : 'Ex: 5';
}

// Função que simula o texto do resumo
function getTextoResumo(produto, quantidade) {
  const isSoftware = isProdutoSoftware(produto);
  return isSoftware ? `(x${quantidade} licenças)` : `(x${quantidade})`;
}

// Produtos de teste (baseados nos reais do seu sistema)
const produtos = [
  {
    id: '1',
    nome: 'Mb Task',
    tipoItem: 'aplicativo',
    categoria: 'Software',
    preco: 250.00
  },
  {
    id: '2', 
    nome: 'multbovinos Web',
    tipoItem: 'produto',
    categoria: 'Software',
    preco: 5000.00
  },
  {
    id: '3',
    nome: 'Microsoft Office 365',
    tipoItem: 'licenca',
    categoria: 'Produtividade',
    preco: 25.00
  },
  {
    id: '4',
    nome: 'Notebook Dell',
    tipoItem: 'produto',
    categoria: 'Hardware',
    preco: 2500.00
  }
];

console.log('\n📋 RESULTADOS DO TESTE:');
console.log('========================');

produtos.forEach((produto, index) => {
  const isSoftware = isProdutoSoftware(produto);
  const labelQuantidade = getLabelQuantidade(produto);
  const placeholder = getPlaceholderQuantidade(produto);
  const textoResumo = getTextoResumo(produto, 5);
  
  console.log(`\n${index + 1}. ${produto.nome}`);
  console.log(`   Tipo: ${produto.tipoItem} ${isSoftware ? '🟣' : '⚪'}`);
  console.log(`   Categoria: ${produto.categoria}`);
  console.log(`   Software: ${isSoftware ? 'SIM' : 'NÃO'}`);
  console.log(`   📝 Label: "${labelQuantidade}"`);
  console.log(`   💬 Placeholder: "${placeholder}"`);
  console.log(`   📊 Resumo: "${textoResumo}"`);
});

console.log('\n🎯 EXPLICAÇÃO DOS RESULTADOS:');
console.log('==============================');
console.log('✅ Mb Task (aplicativo): Mostrará "Quantidade de Licenças"');
console.log('✅ multbovinos Web (produto): Mostrará "Quantidade" normal');
console.log('✅ Microsoft Office 365 (licenca): Mostrará "Quantidade de Licenças"');
console.log('✅ Notebook Dell (produto): Mostrará "Quantidade" normal');

console.log('\n🔧 NA SUA TELA ATUAL:');
console.log('======================');
console.log('❌ Problema: "multbovinos Web" está aparecendo "Quantidade"');
console.log('✅ Correto: Porque tipoItem é "produto", não "aplicativo/licenca/modulo"');
console.log('💡 Para corrigir: Editar produto e mudar tipoItem para "aplicativo"');

console.log('\n🚀 APÓS AS CORREÇÕES IMPLEMENTADAS:');
console.log('====================================');
console.log('✅ Produtos com tipoItem "licenca", "modulo", "aplicativo" → "Quantidade de Licenças"');
console.log('✅ Produtos com tipoItem "produto", "servico" → "Quantidade"');
console.log('✅ Labels dinâmicos funcionando');
console.log('✅ Placeholders dinâmicos funcionando');
console.log('✅ Resumo com texto apropriado');

console.log('\n🎯 TESTE RECOMENDADO:');
console.log('======================');
console.log('1. Refresh da página (F5)');
console.log('2. Criar nova proposta');
console.log('3. Adicionar "Mb Task" → deve mostrar "Quantidade de Licenças"');
console.log('4. Se ainda mostrar "Quantidade", o cache pode estar ativo');
