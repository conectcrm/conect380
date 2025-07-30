// 🔍 DEBUG: Verificar se os dados estão sendo alterados

console.log('🔍 INVESTIGAÇÃO: Por que o problema persiste?');
console.log('');

// Simular cenário atual
console.log('📋 CENÁRIO: Gerar nova proposta');
console.log('');

// 1. Dados originais do cliente cadastrado
const clienteRealCadastrado = {
  id: 1,
  nome: 'Dhonleno Freitas',
  email: 'dhonlenofreitas@hotmail.com',
  telefone: '62996689991'
};

console.log('✅ DADOS REAIS CADASTRADOS:');
console.log(JSON.stringify(clienteRealCadastrado, null, 2));
console.log('');

// 2. Como o backend cria a proposta (hipótese)
function simularCriacaoPropostaBackend(clienteReal) {
  console.log('🔄 Backend criando proposta...');

  // ❌ PROBLEMA: Backend gera email fictício ao invés de usar o real
  const emailFicticio = clienteReal.nome.toLowerCase()
    .replace(' ', '.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') + '@cliente.com';

  const propostaCriada = {
    numero: 'PROP-2025-028',
    cliente: {
      nome: clienteReal.nome,
      email: emailFicticio  // ← PROBLEMA: Backend não usa email real
    },
    total: 1500.00,
    status: 'rascunho'
  };

  console.log('❌ PROPOSTA CRIADA PELO BACKEND:');
  console.log(`   Email real disponível: ${clienteReal.email}`);
  console.log(`   Email gerado pelo backend: ${emailFicticio}`);
  console.log('   ↑ Backend ignora email real e gera fictício!');
  console.log('');

  return propostaCriada;
}

// 3. Frontend recebe e tenta corrigir
function simularCorrecaoFrontend(propostaDoBackend) {
  console.log('🔧 Frontend tentando corrigir...');

  const emailFicticio = propostaDoBackend.cliente.email;
  const isEmailFicticio = emailFicticio.includes('@cliente.com');

  if (isEmailFicticio) {
    console.log('✅ Frontend detecta email fictício');
    console.log('🔍 Frontend busca dados reais...');
    console.log('✅ Frontend encontra email real: dhonlenofreitas@hotmail.com');
    console.log('✅ Frontend substitui no grid');
    console.log('');
    console.log('MAS...');
    console.log('❌ Backend AINDA TEM o email fictício salvo no banco!');
    console.log('❌ Próxima consulta retorna email fictício de novo!');
  }

  return {
    ...propostaDoBackend,
    cliente: {
      ...propostaDoBackend.cliente,
      email: 'dhonlenofreitas@hotmail.com'  // Frontend corrige localmente
    }
  };
}

// Executar simulação
const propostaBackend = simularCriacaoPropostaBackend(clienteRealCadastrado);
const propostaCorrigida = simularCorrecaoFrontend(propostaBackend);

console.log('');
console.log('🎯 DIAGNÓSTICO DO PROBLEMA:');
console.log('');
console.log('1. ✅ Cliente tem dados reais cadastrados');
console.log('2. ❌ Backend cria proposta com email fictício');
console.log('3. ✅ Frontend detecta e corrige localmente');
console.log('4. ❌ Banco ainda tem email fictício salvo');
console.log('5. ❌ Nova consulta retorna email fictício');
console.log('');
console.log('🔧 SOLUÇÃO NECESSÁRIA:');
console.log('   Corrigir a CRIAÇÃO da proposta no backend');
console.log('   para usar dados reais do cliente cadastrado');
console.log('   ao invés de gerar emails fictícios!');
