const { Client } = require('pg');

async function testeObterProposta() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'conectcrm_db',
    user: 'postgres',
    password: 'postgres123'
  });

  try {
    await client.connect();
    console.log('🔍 Conectado ao PostgreSQL para teste de obter proposta');

    // 1. Buscar uma proposta com status "enviada" diretamente do banco
    const queryProposta = `
      SELECT 
        id, numero, titulo, cliente, produtos, 
        subtotal, desconto_global, impostos, total, valor,
        forma_pagamento, validade_dias, observacoes, incluir_impostos_pdf,
        status, data_vencimento, criada_em, atualizada_em,
        source, vendedor_id, portal_access, email_details
      FROM propostas 
      WHERE status = 'enviada'
      ORDER BY atualizada_em DESC
      LIMIT 1
    `;

    const result = await client.query(queryProposta);

    if (result.rows.length === 0) {
      console.log('❌ Nenhuma proposta com status "enviada" encontrada');
      return;
    }

    const proposta = result.rows[0];
    console.log('\n📋 Proposta encontrada no banco:');
    console.log(`  ID: ${proposta.id}`);
    console.log(`  Número: ${proposta.numero}`);
    console.log(`  Título: ${proposta.titulo}`);
    console.log(`  Status: ${proposta.status}`);
    console.log(`  Cliente: ${JSON.stringify(proposta.cliente, null, 2)}`);
    console.log(`  Total: ${proposta.total}`);
    console.log(`  Atualizada em: ${proposta.atualizada_em}`);

    // 2. Testar endpoint individual via HTTP
    console.log('\n🌐 Testando endpoint GET /propostas/' + proposta.id);

    const fetch = require('node-fetch');

    try {
      const response = await fetch(`http://localhost:3001/propostas/${proposta.id}`);
      const responseText = await response.text();

      console.log(`Status HTTP: ${response.status}`);
      console.log('Response headers:', response.headers.raw());
      console.log('Response body (raw):', responseText);

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log('\n✅ Dados retornados pelo endpoint:');
          console.log(`  ID: ${data.id}`);
          console.log(`  Número: ${data.numero}`);
          console.log(`  Status: ${data.status}`);
          console.log(`  Cliente: ${JSON.stringify(data.cliente, null, 2)}`);
          console.log(`  Total: ${data.total}`);
        } catch (parseError) {
          console.log('❌ Erro ao fazer parse do JSON:', parseError.message);
        }
      } else {
        console.log('❌ Erro na requisição HTTP');
      }
    } catch (fetchError) {
      console.log('❌ Erro na requisição:', fetchError.message);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

testeObterProposta().catch(console.error);
