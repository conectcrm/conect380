const { default: fetch } = require('node-fetch');

// Script para demonstrar como alterar planos
async function demonstrarEdicaoPlanos() {
  console.log('🛠️ Demonstração: Como alterar planos\n');

  // 1. Fazer login primeiro
  console.log('1. 🔐 Fazendo login...');
  const loginResponse = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@conectcrm.com',
      senha: 'password'
    })
  });

  const loginData = await loginResponse.json();
  if (!loginData.success) {
    console.log('❌ Falha no login');
    return;
  }

  const token = loginData.data.access_token;
  console.log('   ✅ Login realizado com sucesso\n');

  // 2. Listar planos atuais
  console.log('2. 📋 Planos atuais:');
  const planosResponse = await fetch('http://localhost:3001/planos', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  const planos = await planosResponse.json();
  planos.forEach(plano => {
    const preco = parseFloat(plano.preco) || 0;
    console.log(`   📦 ${plano.nome} (${plano.codigo})`);
    console.log(`      💰 Preço: R$ ${preco.toFixed(2)}`);
    console.log(`      👥 Usuários: ${plano.limiteUsuarios}`);
    console.log(`      👤 Clientes: ${plano.limiteClientes}`);
    console.log(`      💾 Storage: ${(plano.limiteStorage / 1024).toFixed(1)} GB`);
    console.log(`      🔗 API Calls: ${plano.limiteApiCalls}\n`);
  });

  // 3. Demonstrar alteração de um plano
  console.log('3. 🔧 Demonstrando alteração do plano Professional...');

  const planoParaAlterar = planos.find(p => p.codigo === 'professional');
  if (!planoParaAlterar) {
    console.log('❌ Plano Professional não encontrado');
    return;
  }

  console.log(`   📝 Plano atual: ${planoParaAlterar.nome} - R$ ${parseFloat(planoParaAlterar.preco).toFixed(2)}`);

  // Dados de exemplo para alteração
  const novosDados = {
    nome: 'Professional Plus',
    descricao: 'Plano profissional com recursos extras e suporte prioritário',
    preco: 149.90, // Aumentando de 99.90 para 149.90
    limiteUsuarios: 15, // Aumentando de 10 para 15
    limiteClientes: 750, // Aumentando de 500 para 750
    limiteStorage: 7168, // Aumentando de 5GB para 7GB (7168 MB)
    limiteApiCalls: 10000, // Aumentando de 5000 para 10000
    whiteLabel: true, // Adicionando white label
    suportePrioritario: true
  };

  console.log('\n   📤 Aplicando alterações...');
  console.log(`      📛 Nome: ${planoParaAlterar.nome} → ${novosDados.nome}`);
  console.log(`      💰 Preço: R$ ${parseFloat(planoParaAlterar.preco).toFixed(2)} → R$ ${novosDados.preco.toFixed(2)}`);
  console.log(`      👥 Usuários: ${planoParaAlterar.limiteUsuarios} → ${novosDados.limiteUsuarios}`);
  console.log(`      👤 Clientes: ${planoParaAlterar.limiteClientes} → ${novosDados.limiteClientes}`);
  console.log(`      💾 Storage: ${(planoParaAlterar.limiteStorage / 1024).toFixed(1)}GB → ${(novosDados.limiteStorage / 1024).toFixed(1)}GB`);
  console.log(`      🔗 API Calls: ${planoParaAlterar.limiteApiCalls} → ${novosDados.limiteApiCalls}`);
  console.log(`      🏷️ White Label: ${planoParaAlterar.whiteLabel ? 'Sim' : 'Não'} → ${novosDados.whiteLabel ? 'Sim' : 'Não'}`);

  const updateResponse = await fetch(`http://localhost:3001/planos/${planoParaAlterar.id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(novosDados)
  });

  if (updateResponse.ok) {
    const planoAtualizado = await updateResponse.json();
    console.log('\n   ✅ Plano atualizado com sucesso!');
    console.log(`      📦 ${planoAtualizado.nome}`);
    console.log(`      💰 Novo preço: R$ ${parseFloat(planoAtualizado.preco).toFixed(2)}`);
  } else {
    const error = await updateResponse.text();
    console.log(`\n   ❌ Erro ao atualizar plano: ${error}`);
  }

  // 4. Demonstrar criação de um novo plano
  console.log('\n4. ➕ Demonstrando criação de um novo plano...');

  const novoPlano = {
    nome: 'Startup',
    codigo: 'startup',
    descricao: 'Plano especial para startups com recursos limitados mas essenciais',
    preco: 29.90,
    limiteUsuarios: 2,
    limiteClientes: 50,
    limiteStorage: 512, // 0.5GB
    limiteApiCalls: 500,
    whiteLabel: false,
    suportePrioritario: false,
    ativo: true,
    ordem: 0
  };

  console.log('   📋 Dados do novo plano:');
  console.log(`      📛 Nome: ${novoPlano.nome}`);
  console.log(`      🔖 Código: ${novoPlano.codigo}`);
  console.log(`      💰 Preço: R$ ${novoPlano.preco.toFixed(2)}`);
  console.log(`      👥 Usuários: ${novoPlano.limiteUsuarios}`);
  console.log(`      👤 Clientes: ${novoPlano.limiteClientes}`);
  console.log(`      💾 Storage: ${(novoPlano.limiteStorage / 1024).toFixed(1)} GB`);

  const createResponse = await fetch('http://localhost:3001/planos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(novoPlano)
  });

  if (createResponse.ok) {
    const planoCriado = await createResponse.json();
    console.log('\n   ✅ Novo plano criado com sucesso!');
    console.log(`      🆔 ID: ${planoCriado.id}`);
    console.log(`      📦 Nome: ${planoCriado.nome}`);
  } else {
    const error = await createResponse.text();
    console.log(`\n   ❌ Erro ao criar plano: ${error}`);
  }

  // 5. Listar planos atualizados
  console.log('\n5. 📋 Planos após alterações:');
  const planosAtualizadosResponse = await fetch('http://localhost:3001/planos', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  const planosAtualizados = await planosAtualizadosResponse.json();
  planosAtualizados.forEach(plano => {
    const preco = parseFloat(plano.preco) || 0;
    console.log(`   📦 ${plano.nome} - R$ ${preco.toFixed(2)}`);
  });

  console.log('\n🎯 Resumo das operações disponíveis:');
  console.log('   ✅ Alterar preços dos planos');
  console.log('   ✅ Modificar limites (usuários, clientes, storage, API calls)');
  console.log('   ✅ Ativar/desativar recursos (white label, suporte prioritário)');
  console.log('   ✅ Criar novos planos');
  console.log('   ✅ Desativar/ativar planos existentes');
  console.log('   ✅ Alterar ordem de exibição');
  console.log('   ✅ Modificar descrições e nomes');

  console.log('\n📚 Endpoints disponíveis:');
  console.log('   📋 GET    /planos - Listar todos os planos');
  console.log('   👁️  GET    /planos/:id - Buscar plano por ID');
  console.log('   🔍 GET    /planos/codigo/:codigo - Buscar por código');
  console.log('   ➕ POST   /planos - Criar novo plano');
  console.log('   📝 PUT    /planos/:id - Atualizar plano');
  console.log('   ❌ DELETE /planos/:id - Remover plano');
  console.log('   🔴 PUT    /planos/:id/desativar - Desativar plano');
  console.log('   🟢 PUT    /planos/:id/ativar - Ativar plano');
}

demonstrarEdicaoPlanos().catch(console.error);
