// 🚀 Teste da Nova Configuração de Campos de Software
console.log('🚀 TESTE DA CONFIGURAÇÃO DE CAMPOS DE SOFTWARE');
console.log('===============================================');

// Importar a configuração (simulação)
const camposSoftware = {
  quantidadeLicencas: {
    tipo: "number",
    label: "Quantidade de Licenças",
    obrigatorio: true
  },
  tipoLicenciamento: {
    tipo: "select",
    label: "Tipo de Licenciamento",
    opcoes: ["Usuário", "Dispositivo", "Mensal", "Anual", "Vitalício"],
    obrigatorio: true
  },
  periodicidadeLicenca: {
    tipo: "select",
    label: "Periodicidade da Licença",
    opcoes: ["Mensal", "Anual", "Única"]
  },
  renovacaoAutomatica: {
    tipo: "checkbox",
    label: "Renovação Automática"
  }
};

// Função para verificar se precisa dos campos de software
function precisaCamposSoftware(produto) {
  return produto.tipo === "software" || 
         ['licenca', 'modulo', 'aplicativo'].includes(produto.tipoItem);
}

// Função para obter campos obrigatórios
function getCamposObrigatorios() {
  return Object.entries(camposSoftware)
    .filter(([_, config]) => config.obrigatorio)
    .map(([nome, _]) => nome);
}

// Produtos de teste
const produtosTeste = [
  {
    nome: 'Microsoft Office 365',
    tipo: 'software', // 🎯 NOVA DETECÇÃO!
    categoria: 'Produtividade'
  },
  {
    nome: 'Sistema ERP',
    tipoItem: 'aplicativo', // Detecção antiga ainda funciona
    categoria: 'Gestão'
  },
  {
    nome: 'Notebook Dell',
    tipo: 'produto',
    categoria: 'Hardware'
  },
  {
    nome: 'multbovinos Web',
    tipo: 'software', // Se alterarmos para software
    tipoItem: 'produto', // Mesmo com tipoItem produto
    categoria: 'Software'
  }
];

console.log('\n📋 CONFIGURAÇÃO DOS CAMPOS DE SOFTWARE:');
console.log('========================================');

Object.entries(camposSoftware).forEach(([nome, config]) => {
  console.log(`${nome}:`);
  console.log(`  📝 Tipo: ${config.tipo}`);
  console.log(`  🏷️  Label: "${config.label}"`);
  console.log(`  ⚡ Obrigatório: ${config.obrigatorio ? 'SIM' : 'NÃO'}`);
  if (config.opcoes) {
    console.log(`  📋 Opções: [${config.opcoes.join(', ')}]`);
  }
  console.log('');
});

console.log('\n🧪 TESTE DOS PRODUTOS:');
console.log('=======================');

produtosTeste.forEach((produto, index) => {
  const precisa = precisaCamposSoftware(produto);
  const camposObrigatorios = precisa ? getCamposObrigatorios() : [];
  
  console.log(`\n${index + 1}. ${produto.nome}`);
  console.log(`   Tipo: ${produto.tipo || 'não definido'}`);
  console.log(`   TipoItem: ${produto.tipoItem || 'não definido'}`);
  console.log(`   Categoria: ${produto.categoria}`);
  console.log(`   Precisa campos de software: ${precisa ? '✅ SIM' : '❌ NÃO'}`);
  
  if (precisa) {
    console.log(`   📋 Campos obrigatórios: [${camposObrigatorios.join(', ')}]`);
    console.log(`   🎯 Interface: Mostrará "Quantidade de Licenças"`);
    console.log(`   🔧 Campos adicionais: ${Object.keys(camposSoftware).join(', ')}`);
  } else {
    console.log(`   📋 Interface padrão: Mostrará "Quantidade"`);
  }
});

console.log('\n🎯 REGRAS DE DETECÇÃO:');
console.log('======================');
console.log('✅ produto.tipo === "software" → Campos de software');
console.log('✅ tipoItem em ["licenca", "modulo", "aplicativo"] → Campos de software');
console.log('❌ Outros casos → Interface padrão');

console.log('\n🚀 IMPLEMENTAÇÃO REALIZADA:');
console.log('============================');
console.log('✅ Arquivo de configuração: camposSoftware.ts');
console.log('✅ Hook atualizado: useProdutoSoftware.ts');
console.log('✅ Modal atualizado: ModalCadastroProdutoLandscape.tsx');
console.log('✅ Labels dinâmicos: "Quantidade de Licenças"');
console.log('✅ Validações condicionais implementadas');
console.log('✅ Opções exatas conforme especificação');

console.log('\n💡 COMO TESTAR:');
console.log('================');
console.log('1. Refresh da página (F5)');
console.log('2. Cadastrar produto com tipo = "software"');
console.log('3. Ver campos específicos aparecerem');
console.log('4. Criar proposta e ver "Quantidade de Licenças"');
