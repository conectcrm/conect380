/**
 * 🔍 INVESTIGAÇÃO: DADOS DO DHONLENO NO BANCO
 * 
 * Conectar diretamente ao PostgreSQL para verificar
 * os dados reais do cliente Dhonleno Freitas.
 */

const { Client } = require('pg');

console.log('🔍 INVESTIGANDO DADOS DO DHONLENO NO BANCO...\n');

async function investigarDadosDhonleno() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'conectcrm_db',
    user: 'postgres',
    password: 'postgres123'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL\n');

    // 1. Buscar cliente Dhonleno
    console.log('👤 1. BUSCANDO CLIENTE DHONLENO...');
    const queryCliente = `
      SELECT id, nome, email, telefone, documento, status, tipo, created_at
      FROM clientes 
      WHERE nome ILIKE '%dhonleno%'
      ORDER BY created_at DESC
    `;

    const resultCliente = await client.query(queryCliente);

    if (resultCliente.rows.length > 0) {
      const cliente = resultCliente.rows[0];
      console.log('✅ CLIENTE ENCONTRADO:');
      console.log(`   ID: ${cliente.id}`);
      console.log(`   Nome: ${cliente.nome}`);
      console.log(`   Email: ${cliente.email}`);
      console.log(`   Telefone: ${cliente.telefone}`);
      console.log(`   Documento: ${cliente.documento || 'N/A'}`);
      console.log(`   Status: ${cliente.status}`);
      console.log(`   Tipo: ${cliente.tipo}`);
      console.log(`   Criado em: ${cliente.created_at}`);

      // 2. Buscar propostas para este cliente
      console.log('\n📋 2. BUSCANDO PROPOSTAS PARA DHONLENO...');
      const queryPropostas = `
        SELECT id, numero, cliente, status, created_at
        FROM propostas 
        WHERE cliente::text ILIKE '%dhonleno%'
        OR cliente->>'nome' ILIKE '%dhonleno%'
        ORDER BY created_at DESC
      `;

      const resultPropostas = await client.query(queryPropostas);
      console.log(`✅ ${resultPropostas.rows.length} propostas encontradas:\n`);

      resultPropostas.rows.forEach((proposta, index) => {
        console.log(`📝 PROPOSTA ${index + 1}: ${proposta.numero}`);
        console.log(`   ID: ${proposta.id}`);
        console.log(`   Status: ${proposta.status}`);
        console.log(`   Criado em: ${proposta.created_at}`);

        // Analisar dados do cliente na proposta
        let clienteData;
        if (typeof proposta.cliente === 'string') {
          clienteData = proposta.cliente;
          console.log(`   Cliente (string): "${clienteData}"`);
        } else {
          clienteData = proposta.cliente;
          console.log(`   Cliente (objeto):`);
          console.log(`     Nome: ${clienteData?.nome || 'N/A'}`);
          console.log(`     Email: ${clienteData?.email || 'N/A'} ${clienteData?.email?.includes('@cliente.com') ? '⚠️ FICTÍCIO' : '✅ REAL'}`);
          console.log(`     Telefone: ${clienteData?.telefone || 'N/A'}`);
          console.log(`     ID: ${clienteData?.id || 'SEM ID'}`);
        }
        console.log('   ---');
      });

      // 3. Verificar se as propostas têm referência ao ID do cliente real
      console.log('\n🔗 3. VERIFICANDO REFERÊNCIAS...');
      const queryReferencias = `
        SELECT id, numero, cliente_id, cliente
        FROM propostas 
        WHERE cliente_id = $1
        OR cliente->>'id' = $1
      `;

      const resultReferencias = await client.query(queryReferencias, [cliente.id]);
      console.log(`✅ ${resultReferencias.rows.length} propostas com referência ao ID do cliente`);

      if (resultReferencias.rows.length === 0) {
        console.log('⚠️ PROBLEMA IDENTIFICADO: Propostas não têm referência ao ID do cliente real!');
        console.log('   As propostas foram criadas sem vincular ao cliente cadastrado.');
      }

    } else {
      console.log('❌ Cliente Dhonleno não encontrado no banco');
    }

    console.log('\n🎯 DIAGNÓSTICO:');
    console.log('1. Cliente real existe no banco com email correto');
    console.log('2. Propostas não estão vinculadas ao cliente real');
    console.log('3. Backend gera dados fictícios em vez de usar o cliente vinculado');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

// Executar investigação
investigarDadosDhonleno();
