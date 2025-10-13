/**
 * 🧹 Script para limpar canais duplicados
 * 
 * Problema: Frontend estava criando múltiplos canais do mesmo tipo
 * Solução: Manter apenas o canal mais recente de cada tipo por empresa
 * 
 * Autor: GitHub Copilot
 * Data: 12/10/2025
 */

const { Client } = require('pg');

async function limparCanaisDuplicados() {
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

    // 1. Buscar todos os canais agrupados por tipo e empresa
    console.log('🔍 Buscando canais duplicados...');
    const queryBuscar = `
      SELECT 
        tipo, 
        empresa_id,
        COUNT(*) as total,
        array_agg(id ORDER BY created_at DESC) as ids,
        array_agg(created_at ORDER BY created_at DESC) as datas
      FROM atendimento_canais
      GROUP BY tipo, empresa_id
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC;
    `;

    const resultBuscar = await client.query(queryBuscar);

    if (resultBuscar.rows.length === 0) {
      console.log('✅ Nenhum canal duplicado encontrado!');
      return;
    }

    console.log(`\n⚠️  Encontrados ${resultBuscar.rows.length} grupos de canais duplicados:\n`);

    let totalParaDeletar = 0;
    const idsParaDeletar = [];

    resultBuscar.rows.forEach((grupo, index) => {
      const { tipo, empresa_id, total, ids, datas } = grupo;
      const duplicados = total - 1; // Manter apenas 1
      totalParaDeletar += duplicados;

      console.log(`${index + 1}. Tipo: ${tipo}`);
      console.log(`   Empresa ID: ${empresa_id}`);
      console.log(`   Total: ${total} canais`);
      console.log(`   IDs:`);

      ids.forEach((id, i) => {
        const data = new Date(datas[i]);
        const isMaisRecente = i === 0;
        const status = isMaisRecente ? '✅ MANTER (mais recente)' : '❌ DELETAR';
        console.log(`     - ${id} | ${data.toLocaleString('pt-BR')} | ${status}`);

        if (!isMaisRecente) {
          idsParaDeletar.push(id);
        }
      });
      console.log('');
    });

    console.log(`\n📊 Resumo:`);
    console.log(`   - Total de grupos duplicados: ${resultBuscar.rows.length}`);
    console.log(`   - Total de canais a deletar: ${totalParaDeletar}`);
    console.log(`   - Total de canais a manter: ${resultBuscar.rows.length}`);

    // Confirmar antes de deletar
    console.log(`\n⚠️  ATENÇÃO: ${totalParaDeletar} canais serão DELETADOS!`);
    console.log(`Os canais mais ANTIGOS serão removidos, mantendo apenas o mais RECENTE de cada tipo.\n`);

    // 2. Deletar canais duplicados (mantendo o mais recente)
    if (idsParaDeletar.length > 0) {
      console.log('🗑️  Deletando canais duplicados...');

      const queryDeletar = `
        DELETE FROM atendimento_canais 
        WHERE id = ANY($1::uuid[])
        RETURNING id, tipo, created_at;
      `;

      const resultDeletar = await client.query(queryDeletar, [idsParaDeletar]);

      console.log(`\n✅ ${resultDeletar.rows.length} canais deletados com sucesso!\n`);

      resultDeletar.rows.forEach((canal, index) => {
        const data = new Date(canal.created_at);
        console.log(`   ${index + 1}. ${canal.tipo} | ${canal.id} | ${data.toLocaleString('pt-BR')}`);
      });
    }

    // 3. Verificar resultado final
    console.log('\n🔍 Verificando resultado final...');
    const queryVerificar = `
      SELECT 
        tipo, 
        COUNT(*) as total
      FROM atendimento_canais
      GROUP BY tipo
      ORDER BY tipo;
    `;

    const resultVerificar = await client.query(queryVerificar);

    console.log('\n📊 Canais restantes por tipo:');
    resultVerificar.rows.forEach(row => {
      console.log(`   - ${row.tipo}: ${row.total} canal(is)`);
    });

    console.log('\n✅ Limpeza concluída com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro ao limpar canais duplicados:', error);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada.');
  }
}

// Executar
limparCanaisDuplicados();
