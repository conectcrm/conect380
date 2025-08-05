// Teste da correção para o problema do email
const safeRender = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    if (value.hasOwnProperty('nome')) {
      return String(value.nome);
    }
    if (value.hasOwnProperty('name')) {
      return String(value.name);
    }
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  return String(value);
};

// Nova função converterPropostaParaUI corrigida
const converterPropostaParaUI = (proposta) => {
  console.log(`🔄 Convertendo proposta ${proposta.numero}: status="${proposta.status}"`);

  // Extrair dados do cliente de forma mais robusta
  let clienteNome = 'Cliente não informado';
  let clienteEmail = '';

  if (typeof proposta.cliente === 'object' && proposta.cliente) {
    // Cliente como objeto (formato correto)
    clienteNome = safeRender(proposta.cliente.nome) || 'Cliente não informado';
    clienteEmail = safeRender(proposta.cliente.email) || '';
  } else if (typeof proposta.cliente === 'string') {
    // Cliente como string (formato antigo) - tentar gerar email
    clienteNome = safeRender(proposta.cliente);
    // Para clientes em formato string, gerar um email baseado no nome
    if (clienteNome && clienteNome !== 'Cliente não informado') {
      // Transformar nome em email: "João Silva" -> "joao.silva@cliente.temp"
      const emailGerado = clienteNome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z\s]/g, '') // Remove caracteres especiais
        .trim()
        .replace(/\s+/g, '.') // Substitui espaços por pontos
        + '@cliente.temp';
      clienteEmail = emailGerado;

      console.log(`📧 Email gerado para cliente string "${clienteNome}": ${clienteEmail}`);
    }
  }

  return {
    id: safeRender(proposta.id) || '',
    numero: safeRender(proposta.numero) || '',
    cliente: clienteNome,
    cliente_contato: clienteEmail,
    titulo: `Proposta para ${clienteNome}`,
    valor: Number(proposta.total) || 0,
    status: safeRender(proposta.status) || 'rascunho'
  };
};

// Simular lógica do PropostaActions
function getClienteData(proposta) {
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

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    let email = '';
    let telefone = '';

    if (proposta.cliente_contato && isValidEmail(proposta.cliente_contato)) {
      email = proposta.cliente_contato;
    } else if (proposta.cliente_contato && proposta.cliente_contato.includes('(')) {
      telefone = proposta.cliente_contato;
    }

    return { nome, email, telefone };
  }
}

console.log('🧪 TESTANDO CORREÇÃO:');

// Teste 1: Cliente como objeto (funcionava antes)
console.log('\n✅ 1. Cliente como OBJETO:');
const propostaComObjeto = {
  id: "1",
  numero: "PROP-001",
  cliente: {
    nome: "João Silva",
    email: "joao@empresa.com"
  },
  total: 1000,
  status: "rascunho"
};

const convertidaObjeto = converterPropostaParaUI(propostaComObjeto);
console.log('Proposta convertida:', convertidaObjeto);
const dadosObjeto = getClienteData(convertidaObjeto);
console.log('Dados do cliente:', dadosObjeto);
console.log('Email disponível:', !!dadosObjeto.email ? '✅' : '❌');

// Teste 2: Cliente como string (problemático antes, corrigido agora)
console.log('\n🔧 2. Cliente como STRING (CORRIGIDO):');
const propostaComString = {
  id: "2",
  numero: "PROP-002",
  cliente: "Maria Santos",
  total: 2000,
  status: "enviada"
};

const convertidaString = converterPropostaParaUI(propostaComString);
console.log('Proposta convertida:', convertidaString);
const dadosString = getClienteData(convertidaString);
console.log('Dados do cliente:', dadosString);
console.log('Email disponível:', !!dadosString.email ? '✅' : '❌');

// Teste 3: Cliente com acentos
console.log('\n🔧 3. Cliente com ACENTOS:');
const propostaComAcentos = {
  id: "3",
  numero: "PROP-003",
  cliente: "José María Gutiérrez",
  total: 3000,
  status: "rascunho"
};

const convertidaAcentos = converterPropostaParaUI(propostaComAcentos);
console.log('Proposta convertida:', convertidaAcentos);
const dadosAcentos = getClienteData(convertidaAcentos);
console.log('Dados do cliente:', dadosAcentos);
console.log('Email disponível:', !!dadosAcentos.email ? '✅' : '❌');
