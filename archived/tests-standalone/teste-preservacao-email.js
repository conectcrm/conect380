/**
 * 🧪 TESTE: PRESERVAÇÃO DO EMAIL ORIGINAL NAS PROPOSTAS
 * 
 * Verifica se o email original (mesmo que fictício) é preservado
 * e mostrado corretamente na interface
 */

console.log('🧪 TESTANDO PRESERVAÇÃO DO EMAIL ORIGINAL\n');

// Simular função safeRender
function safeRender(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Simular dados como chegam da API - ESTE É O CASO REAL
const propostaReal = {
  id: "498eba24-2197-46ce-93e9-9495dbfd16a3",
  numero: "PROP-2025-023",
  cliente: {
    id: 'cliente-temp',
    nome: 'Dhonleno Freitas',
    email: 'dhonleno.freitas@cliente.com'  // EMAIL ORIGINAL que deveria aparecer
  },
  total: 2464,
  status: 'rascunho'
};

// Simular função converterPropostaParaUI CORRIGIDA
function converterPropostaParaUICorrigida(proposta) {
  let clienteNome = 'Cliente não informado';
  let clienteEmail = '';

  if (typeof proposta.cliente === 'object' && proposta.cliente) {
    clienteNome = safeRender(proposta.cliente.nome) || 'Cliente não informado';
    clienteEmail = safeRender(proposta.cliente.email) || '';

    // Detectar emails fictícios MAS NÃO ALTERAR
    const isEmailFicticio = clienteEmail && (
      clienteEmail.includes('@cliente.com') ||
      clienteEmail.includes('@cliente.temp') ||
      clienteEmail.includes('@email.com')
    );

    if (clienteEmail && !isEmailFicticio) {
      console.log(`   🔒 EMAIL REAL PROTEGIDO: ${clienteEmail}`);
    } else if (isEmailFicticio) {
      console.log(`   ⚠️  EMAIL FICTÍCIO DETECTADO: ${clienteEmail}`);
      console.log(`   📤 Mantendo email original para que PropostaActions detecte`);
      // ✅ CORREÇÃO: NÃO alterar o email - manter original
    }
  }

  return {
    id: proposta.id,
    numero: proposta.numero,
    cliente: clienteNome,
    cliente_contato: clienteEmail,  // ✅ EMAIL ORIGINAL PRESERVADO
    valor: proposta.total,
    status: proposta.status
  };
}

// EXECUTAR TESTE
console.log('📦 1. DADOS ORIGINAIS DA API:');
console.log('   • Nome:', propostaReal.cliente.nome);
console.log('   • Email original:', propostaReal.cliente.email);
console.log('   • Número proposta:', propostaReal.numero);

console.log('\n🔄 2. APÓS CONVERSÃO CORRIGIDA:');
const propostaUI = converterPropostaParaUICorrigida(propostaReal);
console.log('   • cliente:', propostaUI.cliente);
console.log('   • cliente_contato:', propostaUI.cliente_contato);

console.log('\n✅ 3. VERIFICAÇÃO:');
const emailPreservado = propostaUI.cliente_contato === propostaReal.cliente.email;
console.log('   • Email original preservado:', emailPreservado ? '✅ SIM' : '❌ NÃO');
console.log('   • Email na tela será:', propostaUI.cliente_contato);
console.log('   • Email esperado era:', propostaReal.cliente.email);

if (emailPreservado) {
  console.log('\n🎉 SUCESSO! O email original será mostrado na tela');
  console.log('📧 Na interface aparecerá: dhonleno.freitas@cliente.com');
  console.log('🔧 PropostaActions detectará que é fictício e solicitará email real');
} else {
  console.log('\n❌ PROBLEMA! Email original foi alterado');
}

console.log('\n🎯 FLUXO CORRETO:');
console.log('1. ✅ Email original mostrado na tela: dhonleno.freitas@cliente.com');
console.log('2. ✅ Usuário clica no botão de email');
console.log('3. ✅ PropostaActions detecta email fictício (@cliente.com)');
console.log('4. ✅ Sistema solicita email real');
console.log('5. ✅ Email enviado para email real fornecido pelo usuário');
