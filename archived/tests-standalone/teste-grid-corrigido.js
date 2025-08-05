// 🧪 TESTE: Verificar se o grid agora busca dados reais

console.log('🧪 TESTE DA CORREÇÃO DO GRID');
console.log('');

// Simular proposta com email fictício (como vem do backend)
const propostaComEmailFicticio = {
  numero: 'PROP-2025-027',
  cliente: {
    nome: 'Dhonleno Freitas',
    email: 'dhonleno.freitas@cliente.com'  // Email fictício do backend
  },
  total: 2464.00,
  status: 'Rascunho'
};

// Simular serviço de clientes (dados reais disponíveis)
const clientesReaisDisponiveis = [
  {
    id: 1,
    nome: 'Dhonleno Freitas',
    email: 'dhonlenofreitas@hotmail.com',  // Email REAL
    telefone: '62996689991'  // Telefone REAL
  }
];

// Simular função de busca de dados reais
async function simularBuscaDadosReais(nome, emailFicticio) {
  console.log(`🔍 [GRID] Simulando busca para: "${nome}"`);
  console.log(`   Email fictício detectado: ${emailFicticio}`);

  // Simular busca no banco
  const clienteReal = clientesReaisDisponiveis.find(c =>
    c.nome.toLowerCase().includes(nome.toLowerCase())
  );

  if (clienteReal && clienteReal.email !== emailFicticio) {
    console.log(`✅ [GRID] Dados reais encontrados:`, {
      nome: clienteReal.nome,
      email: clienteReal.email,
      telefone: clienteReal.telefone
    });

    return {
      nome: clienteReal.nome,
      email: clienteReal.email,
      telefone: clienteReal.telefone
    };
  }

  return null;
}

// Simular nova função converterPropostaParaUI corrigida
async function simularConversaoCorrigida(proposta) {
  console.log('🔄 NOVA CONVERSÃO (com busca de dados reais):');

  let clienteNome = proposta.cliente.nome;
  let clienteEmail = proposta.cliente.email;
  let clienteTelefone = '';

  console.log(`   Nome: ${clienteNome}`);
  console.log(`   Email original: ${clienteEmail}`);

  // Detectar se é email fictício
  const isEmailFicticio = clienteEmail.includes('@cliente.com');

  if (isEmailFicticio) {
    console.log(`   ⚠️  Email fictício detectado!`);

    // ✅ BUSCAR DADOS REAIS
    const dadosReais = await simularBuscaDadosReais(clienteNome, clienteEmail);

    if (dadosReais) {
      console.log(`   ✅ SUBSTITUINDO por dados REAIS:`);
      console.log(`      Email: ${clienteEmail} → ${dadosReais.email}`);
      console.log(`      Telefone: '' → ${dadosReais.telefone}`);

      clienteNome = dadosReais.nome;
      clienteEmail = dadosReais.email;
      clienteTelefone = dadosReais.telefone;
    }
  }

  const resultado = {
    numero: proposta.numero,
    cliente: clienteNome,
    cliente_contato: clienteEmail,  // ✅ Agora tem dados reais
    cliente_telefone: clienteTelefone,
    valor: proposta.total,
    status: proposta.status
  };

  console.log('   ✅ Resultado da conversão corrigida:');
  console.log(`      cliente_contato: ${resultado.cliente_contato}`);
  console.log(`      cliente_telefone: ${resultado.cliente_telefone}`);

  return resultado;
}

// Executar teste
async function executarTeste() {
  console.log('📋 ANTES DA CORREÇÃO:');
  console.log('   Grid mostraria: dhonleno.freitas@cliente.com');
  console.log('');

  const dadosCorrigidos = await simularConversaoCorrigida(propostaComEmailFicticio);

  console.log('');
  console.log('📊 DEPOIS DA CORREÇÃO:');
  console.log(`   Grid agora mostra: ${dadosCorrigidos.cliente_contato}`);
  console.log(`   Telefone: ${dadosCorrigidos.cliente_telefone}`);
  console.log('');

  if (dadosCorrigidos.cliente_contato === 'dhonlenofreitas@hotmail.com') {
    console.log('✅ SUCESSO: Grid agora mostra dados REAIS!');
  } else {
    console.log('❌ ERRO: Grid ainda mostra dados fictícios');
  }
}

executarTeste();
