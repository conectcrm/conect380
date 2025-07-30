// Debug específico da função getClienteData do PropostaActions
// Este arquivo simula exatamente como a função funciona para encontrar o problema

// Dados de exemplo baseados na resposta real da API
const exemploPropostaTipoBanco = {
  id: "498eba24-2197-46ce-93e9-9495dbfd16a3",
  numero: "PROP-2025-013",
  cliente: {
    id: "cliente-temp",
    nome: "Dhonleno Freitas",
    email: "dhonleno@conectcrm.com",
    telefone: "(62) 99668-9991"
  }
};

// Dados após conversão da PropostasPage (converterPropostaParaUI)
const exemploPropostaConvertida = {
  id: "498eba24-2197-46ce-93e9-9495dbfd16a3",
  numero: "PROP-2025-013",
  cliente: "Dhonleno Freitas",  // Note que aqui virou string
  cliente_contato: "dhonleno@conectcrm.com", // Email extraído aqui
  titulo: "Proposta para Dhonleno Freitas",
  valor: 15000,
  status: "rascunho"
};

// Função isPropostaCompleta do PropostaActions
function isPropostaCompleta(prop) {
  return 'cliente' in prop && typeof prop.cliente === 'object';
}

// Função getClienteData do PropostaActions
function getClienteDataFromCompleta(proposta) {
  if (isPropostaCompleta(proposta)) {
    return {
      nome: proposta.cliente?.nome || 'Cliente',
      email: proposta.cliente?.email || '',
      telefone: proposta.cliente?.telefone || ''
    };
  } else {
    // Formato UI - extrair dados do cliente_contato e cliente
    const nome = proposta.cliente || 'Cliente';

    // Verificar se cliente_contato é um email válido
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    let email = '';
    let telefone = '';

    if (proposta.cliente_contato && isValidEmail(proposta.cliente_contato)) {
      email = proposta.cliente_contato;
    } else if (proposta.cliente_contato && proposta.cliente_contato.includes('(')) {
      // Se contém parênteses, provavelmente é telefone
      telefone = proposta.cliente_contato;
    }

    return { nome, email, telefone };
  }
}

console.log('🔍 TESTANDO EXTRAÇÃO DE EMAIL:');

console.log('\n📦 1. Proposta ORIGINAL do banco:');
console.log('Dados:', exemploPropostaTipoBanco);
console.log('isPropostaCompleta:', isPropostaCompleta(exemploPropostaTipoBanco));
const dadosOriginais = getClienteDataFromCompleta(exemploPropostaTipoBanco);
console.log('Dados extraídos:', dadosOriginais);
console.log('Email disponível:', !!dadosOriginais.email ? '✅' : '❌');

console.log('\n📝 2. Proposta CONVERTIDA (UI):');
console.log('Dados:', exemploPropostaConvertida);
console.log('isPropostaCompleta:', isPropostaCompleta(exemploPropostaConvertida));
const dadosConvertidos = getClienteDataFromCompleta(exemploPropostaConvertida);
console.log('Dados extraídos:', dadosConvertidos);
console.log('Email disponível:', !!dadosConvertidos.email ? '✅' : '❌');

console.log('\n🔎 3. ANÁLISE DO PROBLEMA:');
if (!dadosConvertidos.email && dadosOriginais.email) {
  console.log('❌ PROBLEMA IDENTIFICADO: A conversão está perdendo o email!');
  console.log('Email original:', dadosOriginais.email);
  console.log('cliente_contato após conversão:', exemploPropostaConvertida.cliente_contato);
  console.log('Validação regex:', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(exemploPropostaConvertida.cliente_contato));
} else {
  console.log('✅ Email está sendo preservado corretamente');
}
