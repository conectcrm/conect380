/**
 * 🔍 Script para visualizar todos os canais no banco de dados
 * 
 * Objetivo: Verificar quantos canais existem e se há duplicados
 * 
 * Autor: GitHub Copilot
 * Data: 12/10/2025
 */

const { Client } = require('pg');

async function visualizarCanais() {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db'
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // 1. Total de canais
    const queryTotal = `SELECT COUNT(*) as total FROM atendimento_canais;`;
    const resultTotal = await client.query(queryTotal);
    console.log(`📊 Total de canais: ${resultTotal.rows[0].total}\n`);

    // 2. Canais por tipo
    const queryPorTipo = `
      SELECT 
        tipo, 
        COUNT(*) as total,
        array_agg(nome) as nomes
      FROM atendimento_canais
      GROUP BY tipo
      ORDER BY total DESC;
    `;
    const resultPorTipo = await client.query(queryPorTipo);

    console.log('📋 Canais por tipo:');
    resultPorTipo.rows.forEach(row => {
      console.log(`   ${row.tipo}: ${row.total} canal(is)`);
      if (row.total > 1) {
        console.log(`      ⚠️  DUPLICADOS! Nomes: ${row.nomes.join(', ')}`);
      }
    });
    console.log('');

    // 3. Todos os canais com detalhes
    const queryTodos = `
      SELECT 
        id, 
        tipo, 
        nome, 
        ativo, 
        empresa_id,
        created_at
      FROM atendimento_canais
      ORDER BY tipo, created_at DESC;
    `;
    const resultTodos = await client.query(queryTodos);

    console.log('📄 Listagem completa de canais:\n');
    resultTodos.rows.forEach((canal, index) => {
      const data = new Date(canal.created_at);
      const ativo = canal.ativo ? '✅' : '❌';
      console.log(`${index + 1}. ${canal.tipo}`);
      console.log(`   ID: ${canal.id}`);
      console.log(`   Nome: ${canal.nome}`);
      console.log(`   Ativo: ${ativo}`);
      console.log(`   Empresa: ${canal.empresa_id}`);
      console.log(`   Criado em: ${data.toLocaleString('pt-BR')}`);
      console.log('');
    });

    // 4. Verificar se há duplicados por tipo + empresa
    const queryDuplicadosPorEmpresa = `
      SELECT 
        tipo, 
        empresa_id,
        COUNT(*) as total
      FROM atendimento_canais
      GROUP BY tipo, empresa_id
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC;
    `;
    const resultDuplicados = await client.query(queryDuplicadosPorEmpresa);

    if (resultDuplicados.rows.length > 0) {
      console.log('\n⚠️  ATENÇÃO: Canais duplicados por tipo + empresa:');
      resultDuplicados.rows.forEach(dup => {
        console.log(`   ${dup.tipo} (empresa: ${dup.empresa_id}): ${dup.total} duplicados`);
      });
    } else {
      console.log('✅ Nenhum canal duplicado por tipo + empresa!');
    }

  } catch (error) {
    console.error('\n❌ Erro:', error);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada.');
  }
}

// Executar
visualizarCanais();
