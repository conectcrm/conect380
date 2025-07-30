/**
 * 🔍 DIAGNÓSTICO: DIFERENÇA ENTRE MODAL E LISTA DE PROPOSTAS
 * 
 * Este script simula a diferença entre:
 * 1. Envio direto do modal (usa dados reais do cliente)
 * 2. Envio da lista (usa dados convertidos com email fictício)
 */

console.log('🔍 TESTANDO DIFERENÇA: MODAL vs LISTA DE PROPOSTAS\n');

// Simular dados como vêm do banco (PropostaCompleta)
const propostaCompleta = {
  id: 'prop-123',
  numero: 'PROP-2025-019',
  cliente: {
    id: 'cliente-temp',
    nome: 'Dhonleno Freitas',
    email: 'dhonleno.freitas@cliente.com'  // Email fictício do banco
  },
  total: 2464,
  status: 'rascunho'
};

console.log('📦 DADOS ORIGINAIS (como no banco):');
console.log('   • Cliente:', propostaCompleta.cliente);
console.log('   • Email original:', propostaCompleta.cliente.email);

console.log('\n🔄 SIMULANDO CONVERSÃO (converterPropostaParaUI):');

// Simular função converterPropostaParaUI
function simularConversao(proposta) {
  let clienteNome = 'Cliente não informado';
  let clienteEmail = '';

  if (typeof proposta.cliente === 'object' && proposta.cliente) {
    clienteNome = proposta.cliente.nome || 'Cliente não informado';
    clienteEmail = proposta.cliente.email || '';

    console.log(`   📦 Cliente OBJETO - Nome: "${clienteNome}", Email: "${clienteEmail}"`);

    // 🛡️ PROBLEMA: Esta verificação está INCORRETA!
    // Deveria ser !clienteEmail.includes('@cliente.com') 
    if (clienteEmail && !clienteEmail.includes('@cliente.temp')) {
      console.log(`   🔒 EMAIL CONSIDERADO REAL: ${clienteEmail}`);
      console.log('   ⚠️  MAS É FICTÍCIO! (@cliente.com não foi detectado)');
    } else {
      console.log(`   ⚠️  EMAIL CONSIDERADO FICTÍCIO: ${clienteEmail}`);
    }
  }

  return {
    id: proposta.id,
    numero: proposta.numero,
    cliente: clienteNome,
    cliente_contato: clienteEmail,  // ← PROBLEMA: Email fictício passa direto!
    valor: proposta.total
  };
}

const propostaUI = simularConversao(propostaCompleta);

console.log('\n📋 DADOS CONVERTIDOS PARA UI:');
console.log('   • cliente_contato:', propostaUI.cliente_contato);

console.log('\n🎯 DIAGNÓSTICO:');
console.log('   1. MODAL: Usa dados originais → dhonleno.freitas@cliente.com');
console.log('   2. LISTA: Usa dados convertidos → dhonleno.freitas@cliente.com');
console.log('   3. PROBLEMA: Sistema não detecta @cliente.com como fictício na conversão!');

console.log('\n❌ PROBLEMA IDENTIFICADO:');
console.log('   A verificação !clienteEmail.includes("@cliente.temp") está INCOMPLETA');
console.log('   Não detecta emails @cliente.com como fictícios');

console.log('\n✅ SOLUÇÃO:');
console.log('   Adicionar detecção de @cliente.com na função converterPropostaParaUI');

// Simular correção
function simularCorrecao(proposta) {
  let clienteNome = proposta.cliente.nome;
  let clienteEmail = proposta.cliente.email;

  // ✅ CORREÇÃO: Detectar TODOS os emails fictícios
  const isEmailFicticio = clienteEmail && (
    clienteEmail.includes('@cliente.com') ||
    clienteEmail.includes('@cliente.temp') ||
    clienteEmail.includes('@email.com')
  );

  if (isEmailFicticio) {
    console.log('\n🔧 COM CORREÇÃO:');
    console.log(`   ⚠️  Email fictício detectado: ${clienteEmail}`);
    console.log('   💡 Sistema deveria gerar email temporário ou marcar para correção');

    // Opção 1: Gerar email temporário
    const emailTemp = clienteNome
      .toLowerCase()
      .replace(/\s+/g, '.')
      + '@cliente.temp';

    console.log(`   🔄 Email temporário gerado: ${emailTemp}`);

    return {
      cliente_contato: emailTemp  // ← Seria detectado pelo PropostaActions
    };
  }

  return { cliente_contato: clienteEmail };
}

const propostaCorrigida = simularCorrecao(propostaCompleta);
console.log('\n✅ RESULTADO COM CORREÇÃO:', propostaCorrigida.cliente_contato);
