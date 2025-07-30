// 🔍 DEBUG - Por que WhatsApp está desabilitado?

console.log('🔍 INVESTIGANDO: Por que botão WhatsApp está desabilitado...');

// Simular dados que podem estar vindo do backend/frontend
const testCases = [
  {
    name: 'Caso 1: PropostaCompleta com dados reais',
    proposta: {
      numero: 'PROP-2025-030',
      cliente: {
        id: 'uuid-123',
        nome: 'Dhonleno Freitas',
        email: 'dhonlenofreitas@hotmail.com',
        telefone: '62996689991'
      }
    }
  },
  {
    name: 'Caso 2: PropostaUI (formato grid)',
    proposta: {
      id: 'prop-123',
      numero: 'PROP-2025-030',
      cliente: 'Dhonleno Freitas',
      cliente_contato: '(62) 99668-9991', // Formato com máscara
      valor: 3200
    }
  },
  {
    name: 'Caso 3: PropostaUI com email no contato',
    proposta: {
      id: 'prop-123',
      numero: 'PROP-2025-030',
      cliente: 'Dhonleno Freitas',
      cliente_contato: 'dhonlenofreitas@hotmail.com', // Email em vez de telefone
      valor: 3200
    }
  },
  {
    name: 'Caso 4: Dados vazios',
    proposta: {
      id: 'prop-123',
      numero: 'PROP-2025-030',
      cliente: 'Dhonleno Freitas',
      cliente_contato: '', // Vazio
      valor: 3200
    }
  }
];

// Simular a função getClienteData do PropostaActions
function simulateGetClienteData(proposta) {
  console.log(`\n📋 ${proposta.name}`);
  console.log('   Proposta recebida:', proposta.proposta);

  const prop = proposta.proposta;

  // Detectar se é PropostaCompleta ou PropostaUI
  const isPropostaCompleta = 'cliente' in prop && typeof prop.cliente === 'object';

  if (isPropostaCompleta) {
    console.log('   ✅ Tipo: PropostaCompleta');
    const nome = prop.cliente?.nome || 'Cliente';
    const email = prop.cliente?.email || '';
    const telefone = prop.cliente?.telefone || '';

    console.log('   📞 Telefone extraído:', telefone);
    return { nome, email, telefone };
  } else {
    console.log('   ✅ Tipo: PropostaUI');
    const nome = prop.cliente || 'Cliente';

    // Lógica atual do PropostaActions
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let email = '';
    let telefone = '';

    // Verificar se cliente_contato contém email válido
    if (prop.cliente_contato && emailRegex.test(prop.cliente_contato)) {
      email = prop.cliente_contato;
      console.log('   📧 Email detectado em cliente_contato:', email);
    } else if (prop.cliente_contato && prop.cliente_contato.includes('(')) {
      // Se contém parênteses, provavelmente é telefone
      telefone = prop.cliente_contato;
      console.log('   📞 Telefone detectado em cliente_contato:', telefone);
    } else if (prop.cliente_contato) {
      console.log('   ❓ cliente_contato não identificado:', prop.cliente_contato);
    }

    console.log('   📞 Telefone final:', telefone);
    return { nome, email, telefone };
  }
}

// Testar todos os casos
testCases.forEach(testCase => {
  const clienteData = simulateGetClienteData(testCase);

  // Simular validação do botão WhatsApp
  const isWhatsAppEnabled = !!clienteData.telefone;
  const tooltipMessage = clienteData.telefone ? "Enviar por WhatsApp" : "Cliente sem telefone";

  console.log(`   🔘 Botão WhatsApp habilitado: ${isWhatsAppEnabled}`);
  console.log(`   💬 Tooltip: "${tooltipMessage}"`);

  if (!isWhatsAppEnabled) {
    console.log('   ❌ PROBLEMA: Telefone vazio ou não detectado!');
  } else {
    console.log('   ✅ OK: Telefone detectado corretamente');
  }
});

console.log('\n🎯 POSSÍVEIS CAUSAS DO PROBLEMA:');
console.log('1. cliente_contato contém email em vez de telefone');
console.log('2. cliente_contato está vazio');
console.log('3. Telefone não está sendo detectado na lógica atual');
console.log('4. Estado clienteData não está sendo atualizado no useEffect');
console.log('5. Busca no backend não está retornando telefone');

console.log('\n💡 PRÓXIMOS PASSOS:');
console.log('1. Verificar estrutura real da proposta na interface');
console.log('2. Checar logs do console no navegador');
console.log('3. Verificar se backend retorna telefone junto com email');
console.log('4. Adicionar fallback para buscar telefone no backend se não vier na proposta');
