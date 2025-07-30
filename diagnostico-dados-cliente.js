/**
 * 🔍 DIAGNÓSTICO: VERIFICAR DADOS DO CLIENTE NO BANCO vs API
 * 
 * Este script verifica como os dados do cliente estão sendo armazenados
 * e retornados pela API, especificamente o email real vs fictício.
 */

console.log('🔍 INICIANDO DIAGNÓSTICO DOS DADOS DO CLIENTE...\n');

// Configuração da API
const API_URL = 'http://localhost:3001';

async function testarDadosCliente() {
  try {
    console.log('📡 1. Testando endpoint de propostas...');

    const response = await fetch(`${API_URL}/propostas`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Resposta da API recebida');

    if (!data.propostas || !Array.isArray(data.propostas)) {
      console.error('❌ Formato inesperado da resposta');
      return;
    }

    console.log(`📊 Total de propostas: ${data.propostas.length}\n`);

    // Analisar dados do cliente em cada proposta
    console.log('🔍 2. Analisando dados dos clientes...\n');

    data.propostas.forEach((proposta, index) => {
      console.log(`📝 PROPOSTA ${index + 1}: ${proposta.numero}`);
      console.log(`   • Cliente tipo: ${typeof proposta.cliente}`);

      if (typeof proposta.cliente === 'object' && proposta.cliente) {
        console.log(`   • Nome: "${proposta.cliente.nome}"`);
        console.log(`   • Email: "${proposta.cliente.email}"`);
        console.log(`   • ID: ${proposta.cliente.id || 'N/A'}`);
        console.log(`   • Telefone: ${proposta.cliente.telefone || 'N/A'}`);

        // Verificar se é email fictício
        const email = proposta.cliente.email;
        const isEmailFicticio = email && (
          email.includes('@cliente.com') ||
          email.includes('@cliente.temp') ||
          email.includes('@email.com')
        );

        if (isEmailFicticio) {
          console.log(`   ⚠️  EMAIL FICTÍCIO DETECTADO: ${email}`);
        } else {
          console.log(`   ✅ Email real: ${email}`);
        }
      } else if (typeof proposta.cliente === 'string') {
        console.log(`   • Nome (string): "${proposta.cliente}"`);
        console.log(`   ⚠️  Cliente em formato STRING - sem dados completos`);
      } else {
        console.log(`   ❌ Dados do cliente inválidos`);
      }

      console.log(`   • Status: ${proposta.status}`);
      console.log(`   • Valor: R$ ${proposta.valor || 0}`);
      console.log('   ---');
    });

    // Estatísticas
    console.log('\n📊 3. ESTATÍSTICAS DOS EMAILS:');

    const clientesComEmail = data.propostas.filter(p =>
      typeof p.cliente === 'object' && p.cliente?.email
    );

    const emailsFicticios = clientesComEmail.filter(p => {
      const email = p.cliente.email;
      return email.includes('@cliente.com') ||
        email.includes('@cliente.temp') ||
        email.includes('@email.com');
    });

    const emailsReais = clientesComEmail.filter(p => {
      const email = p.cliente.email;
      return !email.includes('@cliente.com') &&
        !email.includes('@cliente.temp') &&
        !email.includes('@email.com');
    });

    console.log(`   • Total de propostas: ${data.propostas.length}`);
    console.log(`   • Clientes com email: ${clientesComEmail.length}`);
    console.log(`   • Emails fictícios: ${emailsFicticios.length}`);
    console.log(`   • Emails reais: ${emailsReais.length}`);

    if (emailsFicticios.length > 0) {
      console.log('\n⚠️  EMAILS FICTÍCIOS ENCONTRADOS:');
      emailsFicticios.forEach(p => {
        console.log(`   • ${p.numero}: ${p.cliente.nome} → ${p.cliente.email}`);
      });
    }

    if (emailsReais.length > 0) {
      console.log('\n✅ EMAILS REAIS ENCONTRADOS:');
      emailsReais.forEach(p => {
        console.log(`   • ${p.numero}: ${p.cliente.nome} → ${p.cliente.email}`);
      });
    }

    // Buscar especificamente o cliente Dhonleno
    console.log('\n🎯 4. BUSCANDO CLIENTE ESPECÍFICO: Dhonleno Freitas');

    const dhonlenoPropostas = data.propostas.filter(p =>
      (typeof p.cliente === 'object' && p.cliente?.nome?.toLowerCase().includes('dhonleno')) ||
      (typeof p.cliente === 'string' && p.cliente.toLowerCase().includes('dhonleno'))
    );

    if (dhonlenoPropostas.length > 0) {
      console.log(`   ✅ Encontradas ${dhonlenoPropostas.length} propostas para Dhonleno:`);
      dhonlenoPropostas.forEach(p => {
        const cliente = typeof p.cliente === 'object' ? p.cliente : { nome: p.cliente, email: 'N/A' };
        console.log(`   • ${p.numero}: ${cliente.nome} → ${cliente.email || 'Sem email'}`);
      });
    } else {
      console.log('   ❌ Nenhuma proposta encontrada para Dhonleno');
    }

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);

    if (error.message.includes('fetch')) {
      console.log('\n💡 VERIFICAÇÕES:');
      console.log('   1. O backend está rodando na porta 3001?');
      console.log('   2. Execute: cd backend && npm start');
      console.log('   3. Verifique se há dados no banco');
    }
  }
}

// Executar diagnóstico
testarDadosCliente();
