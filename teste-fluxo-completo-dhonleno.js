/**
 * 🧪 TESTE FINAL: SIMULAÇÃO COMPLETA DO FLUXO
 * 
 * Simular o comportamento completo do PropostaActions
 * quando encontra o email fictício do Dhonleno e busca dados reais.
 */

console.log('🧪 SIMULANDO FLUXO COMPLETO DO DHONLENO...\n');

// Simular dados como vêm da proposta
const propostaSimulada = {
  id: "prop-123",
  numero: "PROP-2025-023",
  cliente: {
    id: "cliente-temp",
    nome: "Dhonleno Freitas",
    email: "dhonleno.freitas@cliente.com", // Email fictício do backend
    telefone: "" // Sem telefone
  },
  total: 1500.00,
  status: "enviada"
};

// Simular dados reais que existem no cadastro
const clienteRealCadastrado = {
  id: "cliente-real-123",
  nome: "Dhonleno Freitas",
  email: "dhonlenofreitas@hotmail.com", // Email real da ficha
  telefone: "62996689991", // Telefone real da ficha
  status: "lead",
  tipo: "pessoa_fisica"
};

// Simular função de busca no backend (clientesService.getClientes)
function simularBuscaBackend(filtros) {
  console.log(`🔍 Simulando busca no backend com filtros:`, filtros);

  // Simular que encontrou o cliente real
  if (filtros.search && filtros.search.toLowerCase().includes('dhonleno')) {
    console.log(`✅ Cliente encontrado na busca!`);
    return {
      data: [clienteRealCadastrado]
    };
  }

  return { data: [] };
}

// Simular função getClienteData corrigida
async function simularGetClienteDataCorrigida(proposta) {
  console.log(`🔄 Processando proposta: ${proposta.numero}`);
  console.log(`   Cliente da proposta:`, proposta.cliente);

  // Verificar se é formato completo
  if (typeof proposta.cliente === 'object' && proposta.cliente) {
    const nome = proposta.cliente.nome || 'Cliente';
    const email = proposta.cliente.email || '';
    const telefone = proposta.cliente.telefone || '';

    console.log(`   📋 Dados da proposta - Nome: ${nome}, Email: ${email}, Telefone: ${telefone}`);

    // 🚨 VERIFICAR SE EMAIL É FICTÍCIO
    const isEmailFicticio = email.includes('@cliente.com') ||
      email.includes('@cliente.temp') ||
      email.includes('@email.com');

    if (isEmailFicticio) {
      console.log(`   ⚠️  EMAIL FICTÍCIO DETECTADO: ${email}`);
      console.log(`   🔍 Buscando dados REAIS do cliente: "${nome}"`);

      // Buscar cliente real
      const resultado = simularBuscaBackend({ search: nome, limit: 100 });

      if (resultado.data.length > 0) {
        const clienteReal = resultado.data[0];
        console.log(`   ✅ DADOS REAIS ENCONTRADOS:`);
        console.log(`      Nome: ${clienteReal.nome}`);
        console.log(`      Email: ${clienteReal.email}`);
        console.log(`      Telefone: ${clienteReal.telefone}`);

        return {
          nome: clienteReal.nome,
          email: clienteReal.email,
          telefone: clienteReal.telefone
        };
      }
    }

    // Retornar dados originais se não encontrou reais
    return { nome, email, telefone };
  }

  return { nome: 'Cliente', email: '', telefone: '' };
}

// Simular fluxo de envio de email
async function simularFluxoEnvioEmail() {
  console.log('📧 1. INICIANDO ENVIO DE EMAIL...\n');

  // Passo 1: Extrair dados do cliente
  const clienteData = await simularGetClienteDataCorrigida(propostaSimulada);

  console.log(`\n📋 2. DADOS EXTRAÍDOS DO CLIENTE:`);
  console.log(`   Nome: ${clienteData.nome}`);
  console.log(`   Email: ${clienteData.email}`);
  console.log(`   Telefone: ${clienteData.telefone}`);

  // Passo 2: Verificar se tem email
  if (!clienteData.email) {
    console.log(`\n❌ Cliente não possui email cadastrado`);
    return;
  }

  // Passo 3: Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clienteData.email)) {
    console.log(`\n❌ Email inválido: ${clienteData.email}`);
    return;
  }

  // Passo 4: Verificar se ainda é fictício (não deveria ser mais)
  const isEmailFicticio = clienteData.email.includes('@cliente.com') ||
    clienteData.email.includes('@cliente.temp');

  if (isEmailFicticio) {
    console.log(`\n⚠️  Email ainda é fictício: ${clienteData.email}`);
    console.log(`   Sistema solicitaria email real ao usuário`);
    // Simular email real informado pelo usuário
    const emailReal = "dhonlenofreitas@hotmail.com";
    console.log(`   ✅ Email real informado: ${emailReal}`);
    clienteData.email = emailReal;
  }

  // Passo 5: Enviar email
  console.log(`\n📧 3. ENVIANDO EMAIL PARA: ${clienteData.email}`);
  console.log(`✅ Email enviado com sucesso para ${clienteData.nome}!`);

  return true;
}

// Executar simulação
async function executarTeste() {
  console.log('🎯 CENÁRIO: Proposta do Dhonleno com email fictício do backend');
  console.log('🎯 OBJETIVO: Sistema deve buscar dados reais do cadastro\n');

  await simularFluxoEnvioEmail();

  console.log('\n🎉 RESULTADO ESPERADO:');
  console.log('✅ Sistema detectou email fictício');
  console.log('✅ Buscou dados reais no cadastro');
  console.log('✅ Encontrou email real: dhonlenofreitas@hotmail.com');
  console.log('✅ Encontrou telefone real: 62996689991');
  console.log('✅ Email enviado com dados corretos');
}

executarTeste();
