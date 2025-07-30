// Teste para verificar dados do cliente nas propostas

// Simular dados como chegam do backend
const propostasDoBackend = [
  {
    id: "123",
    numero: "PROP-001",
    cliente: {
      id: "cliente-1",
      nome: "João Silva",
      email: "joao@gmail.com",
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
  }
];

// Simular a função converterPropostaParaUI
function converterPropostaParaUI(proposta) {
  console.log(`🔄 [CONVERTER] Processando proposta ${proposta.numero}:`);
  console.log(`   - Cliente original:`, proposta.cliente);
  console.log(`   - Tipo do cliente:`, typeof proposta.cliente);

  let clienteNome = 'Cliente não informado';
  let clienteEmail = '';

  if (typeof proposta.cliente === 'object' && proposta.cliente) {
    // Cliente como objeto (formato correto)
    clienteNome = proposta.cliente.nome || 'Cliente não informado';
    clienteEmail = proposta.cliente.email || '';
    console.log(`   📦 Cliente OBJETO - Nome: "${clienteNome}", Email: "${clienteEmail}"`);
  } else if (typeof proposta.cliente === 'string') {
    // Cliente como string (formato antigo)
    clienteNome = proposta.cliente;
    console.log(`   📝 Cliente STRING - Nome: "${clienteNome}"`);

    // Gerar email baseado no nome
    if (clienteNome && clienteNome !== 'Cliente não informado') {
      const emailGerado = clienteNome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z\s]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '.') // Substitui espaços por pontos
        + '@cliente.temp';
      clienteEmail = emailGerado;
      console.log(`   📧 Email GERADO: ${clienteEmail}`);
    }
  }

  return {
    id: proposta.id,
    numero: proposta.numero,
    cliente: clienteNome,
    cliente_contato: clienteEmail,
    valor: proposta.total,
    status: proposta.status
  };
}

// Simular a função getClienteData do PropostaActions
function getClienteData(propostaUI) {
  console.log('🔍 DEBUG getClienteData - proposta:', propostaUI);

  const nome = propostaUI.cliente || 'Cliente';

  // Verificar se cliente_contato é um email válido
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  let email = '';
  let telefone = '';

  console.log('📝 Proposta UI - cliente_contato:', propostaUI.cliente_contato);

  if (propostaUI.cliente_contato && isValidEmail(propostaUI.cliente_contato)) {
    email = propostaUI.cliente_contato;
    console.log('✅ Email válido detectado:', email);
  } else {
    console.log('❌ cliente_contato não é email válido');
  }

  const resultado = { nome, email, telefone };
  console.log('📝 Resultado final getClienteData:', resultado);
  return resultado;
}

// EXECUTAR TESTE
console.log('🧪 TESTE DE EXTRAÇÃO DE DADOS DO CLIENTE\n');
console.log('='.repeat(60));

propostasDoBackend.forEach(proposta => {
  console.log(`\n📋 TESTANDO PROPOSTA: ${proposta.numero}`);
  console.log('-'.repeat(40));

  // 1. Converter para UI
  const propostaUI = converterPropostaParaUI(proposta);

  // 2. Extrair dados do cliente
  const clienteData = getClienteData(propostaUI);

  console.log(`\n📊 RESULTADO FINAL:`);
  console.log(`   Nome: ${clienteData.nome}`);
  console.log(`   Email: ${clienteData.email}`);
  console.log(`   Status Email: ${clienteData.email ? '✅ Válido' : '❌ Vazio'}`);
  console.log('');
});

console.log('='.repeat(60));
console.log('✅ Teste concluído!');
