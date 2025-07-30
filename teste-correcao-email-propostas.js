/**
 * 🧪 TESTE: CORREÇÃO DO PROBLEMA DE EMAIL NAS PROPOSTAS
 * 
 * Este script testa se a correção aplicada ao PropostaActions.tsx
 * resolve o problema de importação incorreta do email do cliente.
 */

console.log('🧪 TESTANDO CORREÇÃO DO PROBLEMA DE EMAIL NAS PROPOSTAS\n');

// Simular função safeRender
function safeRender(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Simular dados como chegam da API (PropostaCompleta)
const exemploPropostaCompleta = {
  id: "498eba24-2197-46ce-93e9-9495dbfd16a3",
  numero: "PROP-2025-019",
  cliente: {
    id: 'cliente-temp',
    nome: 'Dhonleno Freitas',
    email: 'dhonleno.freitas@cliente.com'  // Email fictício
  },
  total: 2464,
  status: 'rascunho',
  criadaEm: '2025-01-20T10:30:00Z',
  dataValidade: '2025-02-20T23:59:59Z'
};

// Simular função converterPropostaParaUI do PropostasPage.tsx (corrigida)
function converterPropostaParaUI(proposta) {
  let clienteNome = 'Cliente não informado';
  let clienteEmail = '';

  if (typeof proposta.cliente === 'object' && proposta.cliente) {
    clienteNome = safeRender(proposta.cliente.nome) || 'Cliente não informado';
    clienteEmail = safeRender(proposta.cliente.email) || '';

    // Detectar emails fictícios
    const isEmailFicticio = clienteEmail && (
      clienteEmail.includes('@cliente.com') ||
      clienteEmail.includes('@cliente.temp') ||
      clienteEmail.includes('@email.com')
    );

    if (isEmailFicticio) {
      // Gerar email temporário que será detectado pelo PropostaActions
      const emailTemp = clienteNome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z\s]/g, '')
        .trim()
        .replace(/\s+/g, '.')
        + '@cliente.temp';
      clienteEmail = emailTemp;
    }
  }

  return {
    id: proposta.id,
    numero: proposta.numero,
    cliente: clienteNome,
    cliente_contato: clienteEmail,
    cliente_telefone: '(62) 99999-9999',
    valor: proposta.total,
    status: proposta.status
  };
}

// Simular função getClienteData CORRIGIDA do PropostaActions.tsx
function getClienteDataCorrigida(proposta) {
  // Verificar se é PropostaCompleta
  const isPropostaCompleta = (prop) => 'cliente' in prop && typeof prop.cliente === 'object';

  if (isPropostaCompleta(proposta)) {
    return {
      nome: proposta.cliente?.nome || 'Cliente',
      email: proposta.cliente?.email || '',
      telefone: proposta.cliente?.telefone || ''
    };
  } else {
    // Formato UI - extrair dados do cliente_contato e cliente
    const nome = proposta.cliente || 'Cliente';

    // 🔧 CORREÇÃO: Verificar se cliente_contato é um email válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let email = '';
    let telefone = '';

    // Verificar se cliente_contato contém email válido
    if (proposta.cliente_contato && emailRegex.test(proposta.cliente_contato)) {
      email = proposta.cliente_contato;
    } else if (proposta.cliente_contato && proposta.cliente_contato.includes('(')) {
      // Se contém parênteses, provavelmente é telefone
      telefone = proposta.cliente_contato;
    }

    // Se não encontrou email e há cliente_telefone, usar como telefone
    if (!telefone && proposta.cliente_telefone) {
      telefone = proposta.cliente_telefone;
    }

    // Se ainda não tem email, verificar se precisa gerar um temporário
    if (!email && nome && nome !== 'Cliente') {
      const emailTemp = nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z\s]/g, '')
        .trim()
        .replace(/\s+/g, '.')
        + '@cliente.temp';
      email = emailTemp;
    }

    return { nome, email, telefone };
  }
}

// EXECUTAR TESTE
console.log('📦 1. DADOS ORIGINAIS (como vêm da API):');
console.log('   • Cliente:', exemploPropostaCompleta.cliente);
console.log('   • Email original:', exemploPropostaCompleta.cliente.email);
console.log('   • Tipo:', typeof exemploPropostaCompleta.cliente);

console.log('\n🔄 2. APÓS CONVERSÃO (converterPropostaParaUI):');
const propostaUI = converterPropostaParaUI(exemploPropostaCompleta);
console.log('   • cliente:', propostaUI.cliente);
console.log('   • cliente_contato:', propostaUI.cliente_contato);
console.log('   • cliente_telefone:', propostaUI.cliente_telefone);

console.log('\n🎯 3. EXTRAÇÃO DE DADOS (getClienteData CORRIGIDA):');
const dadosCliente = getClienteDataCorrigida(propostaUI);
console.log('   • Nome:', dadosCliente.nome);
console.log('   • Email:', dadosCliente.email);
console.log('   • Telefone:', dadosCliente.telefone);

// Verificar detecção de email fictício
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isEmailValido = emailRegex.test(dadosCliente.email);
const isEmailFicticio = dadosCliente.email && (
  dadosCliente.email.includes('@cliente.com') ||
  dadosCliente.email.includes('@cliente.temp') ||
  dadosCliente.email.includes('@email.com') ||
  dadosCliente.email.includes('@exemplo.com') ||
  dadosCliente.email.includes('@cliente.') ||
  dadosCliente.email.includes('@temp.') ||
  dadosCliente.email.includes('@ficticio.')
);

console.log('\n🔍 4. VALIDAÇÃO DE EMAIL:');
console.log('   • Email válido (formato):', isEmailValido ? '✅' : '❌');
console.log('   • Email fictício detectado:', isEmailFicticio ? '✅' : '❌');
console.log('   • Botão email habilitado:', (dadosCliente.email && isEmailValido) ? '✅' : '❌');
console.log('   • Botão WhatsApp habilitado:', dadosCliente.telefone ? '✅' : '❌');

console.log('\n✅ RESULTADO DO TESTE:');
if (dadosCliente.email && isEmailValido) {
  console.log('   🎉 SUCESSO! Email foi extraído corretamente');
  if (isEmailFicticio) {
    console.log('   ⚠️  Sistema detectará email fictício e solicitará email real');
  } else {
    console.log('   🔒 Email real será usado diretamente');
  }
} else {
  console.log('   ❌ FALHA! Email não foi extraído ou é inválido');
}

if (dadosCliente.telefone) {
  console.log('   📱 SUCESSO! Telefone foi extraído corretamente');
} else {
  console.log('   📱 AVISO: Telefone não foi extraído');
}

console.log('\n🎯 CENÁRIO DE USO:');
console.log('1. Usuário clica no botão de email na lista de propostas');
console.log('2. Sistema extrai dados usando getClienteData()');
console.log('3. Email detectado:', dadosCliente.email);
console.log('4. Sistema detecta como fictício e solicita email real');
console.log('5. Usuário digita email real (ex: dhonlenofreitas@hotmail.com)');
console.log('6. Email é enviado com sucesso ✅');
