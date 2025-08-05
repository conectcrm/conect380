// 🔍 DEBUG: Verificar por que o grid mostra email fictício

console.log('🔍 ANÁLISE DO PROBLEMA NO GRID');
console.log('');

// Simular dados que vêm do backend (como mostrado na imagem)
const propostaDoBackend = {
  numero: 'PROP-2025-027',
  cliente: {
    nome: 'Dhonleno Freitas',
    email: 'dhonleno.freitas@cliente.com'  // ← PROBLEMA: Backend retorna email fictício
  },
  total: 2464.00,
  status: 'Rascunho'
};

console.log('📋 Dados que vêm do BACKEND:');
console.log(JSON.stringify(propostaDoBackend, null, 2));
console.log('');

// Simular função converterPropostaParaUI (que roda no PropostasPage.tsx)
function simularConversao(proposta) {
  console.log('🔄 CONVERSÃO para UI (PropostasPage.tsx):');

  const clienteNome = proposta.cliente.nome;
  const clienteEmail = proposta.cliente.email;

  console.log(`   - Nome: ${clienteNome}`);
  console.log(`   - Email do backend: ${clienteEmail}`);

  // ❌ PROBLEMA: A conversão mantém o email fictício do backend
  const resultado = {
    numero: proposta.numero,
    cliente: clienteNome,
    cliente_contato: clienteEmail,  // ← Aqui vai o email fictício para o GRID
    valor: proposta.total,
    status: proposta.status
  };

  console.log('   ✅ Resultado da conversão:');
  console.log(`      cliente_contato: ${resultado.cliente_contato}`);
  console.log('');

  return resultado;
}

const dadosParaGrid = simularConversao(propostaDoBackend);

console.log('📊 DADOS QUE APARECEM NO GRID:');
console.log(`   Cliente: ${dadosParaGrid.cliente}`);
console.log(`   Email mostrado: ${dadosParaGrid.cliente_contato}`);
console.log('');

console.log('❌ PROBLEMA IDENTIFICADO:');
console.log('   1. Backend retorna email fictício: dhonleno.freitas@cliente.com');
console.log('   2. PropostasPage.tsx converte e mantém o email fictício');
console.log('   3. Grid mostra o email fictício na coluna CLIENTE');
console.log('   4. PropostaActions só busca dados reais quando clica no botão');
console.log('');

console.log('✅ SOLUÇÃO NECESSÁRIA:');
console.log('   Modificar converterPropostaParaUI para buscar dados reais ANTES');
console.log('   de mostrar no grid, não só quando clicar no botão de email');
console.log('');

console.log('📞 DADOS REAIS DISPONÍVEIS:');
console.log('   Nome: Dhonleno Freitas');
console.log('   Email REAL: dhonlenofreitas@hotmail.com');
console.log('   Telefone REAL: 62996689991');
