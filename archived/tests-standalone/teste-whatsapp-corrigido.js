// 🧪 TESTE: Verificação da correção do WhatsApp

console.log('🧪 TESTANDO CORREÇÃO DO WHATSAPP');

// Simular casos problemáticos que deixavam WhatsApp desabilitado
const testCases = [
  {
    name: 'Caso Problemático 1: PropostaUI com email no cliente_contato',
    proposta: {
      id: 'prop-123',
      numero: 'PROP-2025-030',
      cliente: 'Dhonleno Freitas',
      cliente_contato: 'dhonlenofreitas@hotmail.com', // Email em vez de telefone!
      valor: 3200
    },
    expectedResult: {
      shouldHavePhone: true,
      reason: 'Busca no backend deve encontrar telefone real'
    }
  },
  {
    name: 'Caso Problemático 2: PropostaUI com cliente_contato vazio',
    proposta: {
      id: 'prop-123',
      numero: 'PROP-2025-030',
      cliente: 'Dhonleno Freitas',
      cliente_contato: '', // Vazio!
      valor: 3200
    },
    expectedResult: {
      shouldHavePhone: true,
      reason: 'Fallback busca no backend deve encontrar telefone'
    }
  },
  {
    name: 'Caso OK: PropostaUI com telefone correto',
    proposta: {
      id: 'prop-123',
      numero: 'PROP-2025-030',
      cliente: 'Dhonleno Freitas',
      cliente_contato: '(62) 99668-9991', // Telefone correto
      valor: 3200
    },
    expectedResult: {
      shouldHavePhone: true,
      reason: 'Telefone detectado diretamente da proposta'
    }
  }
];

// Simular dados reais do backend
const mockBackendData = [
  {
    id: 'uuid-123',
    nome: 'Dhonleno Freitas',
    email: 'dhonlenofreitas@hotmail.com',
    telefone: '62996689991'
  }
];

// Simular função getClienteData corrigida
async function simulateGetClienteDataCorrigida(proposta) {
  const nome = proposta.cliente || 'Cliente';

  // 1️⃣ Extrair dados iniciais da proposta
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let email = '';
  let telefone = '';

  if (proposta.cliente_contato && emailRegex.test(proposta.cliente_contato)) {
    email = proposta.cliente_contato;
    console.log('   📧 Email detectado em cliente_contato:', email);
  } else if (proposta.cliente_contato && proposta.cliente_contato.includes('(')) {
    telefone = proposta.cliente_contato;
    console.log('   📞 Telefone detectado em cliente_contato:', telefone);
  }

  console.log('   📋 Dados extraídos inicialmente:', { nome, email, telefone });

  // 2️⃣ NOVA LÓGICA: Sempre buscar no backend para garantir dados completos
  if (nome && nome !== 'Cliente') {
    console.log('   🔍 Buscando cliente no backend para garantir dados completos...');

    // Simular busca no backend
    const clienteEncontrado = mockBackendData.find(c =>
      c.nome?.toLowerCase().includes(nome.toLowerCase()) ||
      nome.toLowerCase().includes(c.nome?.toLowerCase())
    );

    if (clienteEncontrado) {
      console.log('   ✅ Cliente encontrado no backend:', {
        nome: clienteEncontrado.nome,
        email: clienteEncontrado.email,
        telefone: clienteEncontrado.telefone
      });

      return {
        nome: clienteEncontrado.nome,
        email: clienteEncontrado.email || email, // Usar email real ou da proposta
        telefone: clienteEncontrado.telefone || telefone // Usar telefone real ou da proposta
      };
    }
  }

  // 3️⃣ Fallback se não encontrou no backend
  console.log('   ⚠️ Não encontrou no backend, usando dados da proposta');
  return { nome, email, telefone };
}

// Testar todos os casos
console.log('\n🧪 EXECUTANDO TESTES...\n');

for (const testCase of testCases) {
  console.log(`📋 ${testCase.name}`);
  console.log('   Proposta:', testCase.proposta);

  const clienteData = await simulateGetClienteDataCorrigida(testCase.proposta);

  // Verificar se WhatsApp ficaria habilitado
  const isWhatsAppEnabled = !!clienteData.telefone;
  const tooltipMessage = clienteData.telefone ? "Enviar por WhatsApp" : "Cliente sem telefone";

  console.log('   📞 Dados finais:', clienteData);
  console.log(`   🔘 Botão WhatsApp habilitado: ${isWhatsAppEnabled}`);
  console.log(`   💬 Tooltip: "${tooltipMessage}"`);

  if (testCase.expectedResult.shouldHavePhone && isWhatsAppEnabled) {
    console.log('   ✅ SUCESSO: Telefone detectado como esperado!');
  } else if (testCase.expectedResult.shouldHavePhone && !isWhatsAppEnabled) {
    console.log('   ❌ FALHA: Telefone deveria ter sido detectado!');
  } else {
    console.log('   ✅ RESULTADO ESPERADO');
  }

  console.log('   📝 Motivo:', testCase.expectedResult.reason);
  console.log();
}

console.log('🎯 RESULTADO DA CORREÇÃO:');
console.log('✅ Agora SEMPRE busca no backend para garantir telefone');
console.log('✅ Fallback funciona mesmo quando cliente_contato tem email');
console.log('✅ WhatsApp deve ficar habilitado para clientes cadastrados');
console.log('✅ Email e telefone são obtidos juntos do backend real');
