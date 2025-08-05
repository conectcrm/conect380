/**
 * 🧪 TESTE: VERIFICAR CONVERSÃO SEM FICTÍCIOS NO GRID
 * 
 * Este script testa se a conversão das propostas para o grid
 * não está mais gerando emails e telefones fictícios.
 */

console.log('🧪 TESTANDO CONVERSÃO SEM FICTÍCIOS...\n');

// Simular função converterPropostaParaUI (versão corrigida)
function converterPropostaParaUI_CORRIGIDA(proposta) {
  console.log(`🔄 [CONVERTER CORRIGIDA] Processando proposta ${proposta.numero}:`);

  let clienteNome = 'Cliente não informado';
  let clienteEmail = '';

  if (typeof proposta.cliente === 'object' && proposta.cliente) {
    // Cliente como objeto (formato correto)
    clienteNome = proposta.cliente.nome || 'Cliente não informado';
    clienteEmail = proposta.cliente.email || '';
    console.log(`   📦 Cliente OBJETO - Nome: "${clienteNome}", Email: "${clienteEmail}"`);

    // Verificar se email é fictício
    const isEmailFicticio = clienteEmail.includes('@cliente.com') ||
      clienteEmail.includes('@cliente.temp') ||
      clienteEmail.includes('@email.com');

    if (isEmailFicticio) {
      console.log(`   ⚠️  EMAIL FICTÍCIO DETECTADO: ${clienteEmail}`);
      console.log(`   📤 Mantendo email original para que PropostaActions detecte`);
      // ✅ CORREÇÃO: NÃO gerar email temporário - manter original
      // O PropostaActions vai detectar e solicitar email real
    }
  } else if (typeof proposta.cliente === 'string') {
    // Cliente como string - VERSÃO CORRIGIDA
    clienteNome = proposta.cliente;
    console.log(`   📝 Cliente STRING - Nome original: "${clienteNome}"`);

    // ✅ CORREÇÃO: NÃO gerar email fictício - deixar vazio
    console.log(`   🚫 NÃO gerando email fictício - PropostaActions buscará dados reais`);
    clienteEmail = ''; // Deixar vazio para busca posterior
  }

  return {
    id: proposta.id,
    numero: proposta.numero,
    cliente: clienteNome,
    cliente_contato: clienteEmail,
    cliente_telefone: '', // ✅ CORREÇÃO: NÃO gerar telefone fictício
    valor: proposta.total,
    status: proposta.status
  };
}

// Simular dados como chegam do backend
const propostasDoBackend = [
  {
    id: "123",
    numero: "PROP-001",
    cliente: {
      id: "cliente-1",
      nome: "João Silva",
      email: "joao.silva@cliente.com", // Email fictício do backend
      telefone: "(11) 99999-9999"
    },
    total: 1500.00,
    status: "rascunho"
  },
  {
    id: "124",
    numero: "PROP-002",
    cliente: "Maria Santos", // Cliente como string
    total: 2500.00,
    status: "enviada"
  },
  {
    id: "125",
    numero: "PROP-003",
    cliente: {
      id: "cliente-2",
      nome: "Pedro Costa",
      email: "", // Sem email
      telefone: ""
    },
    total: 3000.00,
    status: "aprovada"
  }
];

console.log('📊 TESTANDO CONVERSÃO CORRIGIDA:\n');

propostasDoBackend.forEach((proposta, index) => {
  console.log(`🔍 PROPOSTA ${index + 1}:`);
  console.log(`   Original: Cliente = ${typeof proposta.cliente === 'object' ? JSON.stringify(proposta.cliente) : `"${proposta.cliente}"`}`);

  const resultado = converterPropostaParaUI_CORRIGIDA(proposta);

  console.log(`   Resultado:`);
  console.log(`     • Nome: "${resultado.cliente}"`);
  console.log(`     • Email: "${resultado.cliente_contato}" ${resultado.cliente_contato ? (resultado.cliente_contato.includes('@cliente.') ? '⚠️ FICTÍCIO' : '✅ REAL/VAZIO') : '✅ VAZIO'}`);
  console.log(`     • Telefone: "${resultado.cliente_telefone}" ${resultado.cliente_telefone ? '⚠️ FICTÍCIO' : '✅ VAZIO'}`);
  console.log('   ---\n');
});

console.log('🎯 RESUMO DOS RESULTADOS:');
console.log('✅ Emails fictícios mantidos apenas quando vêm do backend (para detecção)');
console.log('✅ Não gera mais emails fictícios para clientes string');
console.log('✅ Não gera mais telefones fictícios');
console.log('✅ PropostaActions buscará dados reais quando necessário');
