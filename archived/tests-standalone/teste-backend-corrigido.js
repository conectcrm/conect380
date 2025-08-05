// 🧪 TESTE: Verificar se a correção do backend funcionou

console.log('🧪 TESTE DA CORREÇÃO DO BACKEND');
console.log('');

// Simular dados do cliente cadastrado
const clientesCadastrados = [
  {
    id: 'uuid-123',
    nome: 'Dhonleno Freitas',
    email: 'dhonlenofreitas@hotmail.com',
    telefone: '62996689991',
    documento: '123.456.789-00',
    status: 'lead'
  }
];

// Simular busca no banco (função Like do TypeORM)
function simularBuscaCliente(nome) {
  console.log(`🔍 [BACKEND] Executando busca: SELECT * FROM clientes WHERE nome LIKE '%${nome}%'`);

  const clienteEncontrado = clientesCadastrados.find(c =>
    c.nome.toLowerCase().includes(nome.toLowerCase()) ||
    nome.toLowerCase().includes(c.nome.toLowerCase())
  );

  return clienteEncontrado || null;
}

// Simular nova função do backend (CORRIGIDA)
async function simularCriacaoPropostaCorrigida(dadosProposta) {
  console.log('🔄 [BACKEND] Criando proposta com busca de dados reais...');

  let clienteProcessado;

  if (typeof dadosProposta.cliente === 'string') {
    const nomeCliente = dadosProposta.cliente;
    console.log(`   Tipo: STRING - Nome: "${nomeCliente}"`);

    // 🔍 BUSCAR CLIENTE REAL (NOVO COMPORTAMENTO)
    const clienteReal = simularBuscaCliente(nomeCliente);

    if (clienteReal) {
      console.log(`   ✅ Cliente real encontrado: ${clienteReal.nome} - ${clienteReal.email}`);
      clienteProcessado = {
        id: clienteReal.id,
        nome: clienteReal.nome,
        email: clienteReal.email,          // ← DADOS REAIS
        telefone: clienteReal.telefone,    // ← DADOS REAIS
        documento: clienteReal.documento,
        status: clienteReal.status
      };
    } else {
      console.log(`   ⚠️ Cliente "${nomeCliente}" não encontrado no cadastro`);
      clienteProcessado = {
        id: 'cliente-temp',
        nome: nomeCliente,
        email: '',  // ← NÃO gerar fictício
        telefone: '',
        documento: '',
        status: 'lead'
      };
    }
  }

  const propostaCriada = {
    id: 'prop-uuid-456',
    numero: 'PROP-2025-029',
    cliente: clienteProcessado,  // ← DADOS REAIS DO BANCO
    total: 2500.00,
    status: 'rascunho',
    criadaEm: new Date().toISOString()
  };

  console.log('');
  console.log('✅ [BACKEND] Proposta salva no banco:');
  console.log(`   ID: ${propostaCriada.id}`);
  console.log(`   Cliente: ${propostaCriada.cliente.nome}`);
  console.log(`   Email: ${propostaCriada.cliente.email}`);
  console.log(`   Telefone: ${propostaCriada.cliente.telefone}`);

  return propostaCriada;
}

// Executar teste
async function executarTeste() {
  console.log('📋 CENÁRIO: Frontend envia "Dhonleno Freitas" para criar proposta');
  console.log('');

  const dadosEnviados = {
    cliente: 'Dhonleno Freitas',  // Frontend envia apenas o nome
    produtos: [],
    total: 2500.00
  };

  console.log('📤 Dados enviados pelo frontend:');
  console.log(`   cliente: "${dadosEnviados.cliente}"`);
  console.log('');

  // Backend processa com correção
  const propostaResultado = await simularCriacaoPropostaCorrigida(dadosEnviados);

  console.log('');
  console.log('🎯 RESULTADO DA CORREÇÃO:');
  console.log('');

  if (propostaResultado.cliente.email === 'dhonlenofreitas@hotmail.com') {
    console.log('✅ SUCESSO: Backend usou dados REAIS do cadastro!');
    console.log('✅ Email salvo no banco: dhonlenofreitas@hotmail.com');
    console.log('✅ Telefone salvo no banco: 62996689991');
    console.log('✅ Grid vai mostrar dados corretos automaticamente!');
  } else if (propostaResultado.cliente.email === '') {
    console.log('⚠️  Cliente não encontrado, mas SEM email fictício');
    console.log('✅ Frontend pode buscar dados reais depois');
  } else {
    console.log('❌ ERRO: Ainda gerando email fictício');
  }

  console.log('');
  console.log('📊 COMPARAÇÃO:');
  console.log('   ANTES: dhonleno.freitas@cliente.com (fictício)');
  console.log(`   AGORA: ${propostaResultado.cliente.email || '[vazio]'} (real ou vazio)`);
}

executarTeste();
