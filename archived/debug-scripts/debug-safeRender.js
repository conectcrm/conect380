// Debug da função safeRender aplicada ao email
const safeRender = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    // If it's an object, try to extract meaningful string representation
    if (value.hasOwnProperty('nome')) {
      return String(value.nome);
    }
    if (value.hasOwnProperty('name')) {
      return String(value.name);
    }
    if (value.hasOwnProperty('title')) {
      return String(value.title);
    }
    if (value.hasOwnProperty('toString') && typeof value.toString === 'function') {
      return String(value.toString());
    }
    // Se é um objeto sem propriedades conhecidas, retornar string vazia
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return String(value);
};

// Teste com exemplo real
const exemploCliente = {
  id: "cliente-temp",
  nome: "Dhonleno Freitas",
  email: "dhonleno@conectcrm.com",
  telefone: "(62) 99668-9991"
};

console.log('🔍 TESTANDO safeRender:');
console.log('Cliente completo:', exemploCliente);
console.log('safeRender(cliente.email):', safeRender(exemploCliente.email));
console.log('safeRender(cliente.nome):', safeRender(exemploCliente.nome));

// Teste conversão completa
const propostaCompleta = {
  id: "498eba24-2197-46ce-93e9-9495dbfd16a3",
  numero: "PROP-2025-013",
  cliente: exemploCliente,
  total: 15000,
  status: "rascunho"
};

console.log('\n📝 Conversão usando safeRender:');
const conversao = {
  id: safeRender(propostaCompleta.id) || '',
  numero: safeRender(propostaCompleta.numero) || '',
  cliente: safeRender(propostaCompleta.cliente?.nome) || 'Cliente não informado',
  cliente_contato: safeRender(propostaCompleta.cliente?.email) || '',
  titulo: `Proposta para ${safeRender(propostaCompleta.cliente?.nome) || 'Cliente'}`,
  valor: Number(propostaCompleta.total) || 0,
  status: safeRender(propostaCompleta.status) || 'rascunho'
};

console.log('Proposta convertida:', conversao);
console.log('cliente_contato final:', conversao.cliente_contato);
console.log('É email válido?', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(conversao.cliente_contato));

// Problema específico: se o cliente vier como string
console.log('\n❌ TESTE COM CLIENTE COMO STRING:');
const propostaComClienteString = {
  id: "498eba24-2197-46ce-93e9-9495dbfd16a3",
  numero: "PROP-2025-013",
  cliente: "Dhonleno Freitas", // Aqui como string!
  total: 15000,
  status: "rascunho"
};

const conversaoComErro = {
  cliente: safeRender(propostaComClienteString.cliente?.nome) || 'Cliente não informado',
  cliente_contato: safeRender(propostaComClienteString.cliente?.email) || '',
};

console.log('Cliente como string:', propostaComClienteString.cliente);
console.log('cliente?.nome (undefined):', propostaComClienteString.cliente?.nome);
console.log('cliente?.email (undefined):', propostaComClienteString.cliente?.email);
console.log('safeRender(undefined):', safeRender(undefined));
console.log('Resultado conversão:', conversaoComErro);
console.log('❌ cliente_contato fica vazio!', conversaoComErro.cliente_contato === '');
