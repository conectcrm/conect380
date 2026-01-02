const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  user: 'conectcrm',
  password: 'conectcrm2025',
  database: 'conectcrm_db'
});

(async () => {
  try {
    await client.connect();

    console.log('\n🔍 DIAGNÓSTICO COMPLETO DE SESSÕES\n');
    console.log('━'.repeat(60));

    // 1. Verificar TODAS as sessões ativas
    const sessoes = await client.query(`
      SELECT id, contato_telefone, contato_nome, etapa_atual, status, 
             iniciado_em, updated_at
      FROM sessoes_triagem 
      WHERE status = 'em_andamento'
      ORDER BY updated_at DESC
    `);

    console.log(`\n📊 Sessões ativas encontradas: ${sessoes.rows.length}\n`);

    if (sessoes.rows.length > 0) {
      sessoes.rows.forEach((s, i) => {
        console.log(`${i + 1}. ID: ${s.id}`);
        console.log(`   📱 Telefone: ${s.contato_telefone}`);
        console.log(`   👤 Nome: ${s.contato_nome || 'N/A'}`);
        console.log(`   📍 Etapa: ${s.etapa_atual}`);
        console.log(`   ⏰ Iniciado: ${s.iniciado_em}`);
        console.log(`   🔄 Atualizado: ${s.updated_at}\n`);
      });

      console.log('━'.repeat(60));
      console.log('\n🧹 LIMPANDO TODAS AS SESSÕES ATIVAS...\n');

      const resultado = await client.query(`
        DELETE FROM sessoes_triagem WHERE status = 'em_andamento'
      `);

      console.log(`✅ ${resultado.rowCount} sessão(ões) deletada(s)!\n`);
    } else {
      console.log('✅ Nenhuma sessão ativa no banco!\n');
    }

    // 2. Verificar fluxo ativo
    const fluxo = await client.query(`
      SELECT id, nome, canal, ativo
      FROM fluxos_triagem 
      WHERE ativo = true AND canal = 'whatsapp'
      LIMIT 1
    `);

    console.log('━'.repeat(60));

    if (fluxo.rows.length > 0) {
      console.log(`\n📋 Fluxo ativo: ${fluxo.rows[0].nome}\n`);

      // 3. Verificar etapa boas-vindas
      const boasVindas = await client.query(`
        SELECT jsonb_pretty(estrutura->'etapas'->'boas-vindas') as etapa
        FROM fluxos_triagem 
        WHERE id = $1
      `, [fluxo.rows[0].id]);

      if (boasVindas.rows.length > 0 && boasVindas.rows[0].etapa) {
        console.log('📨 Etapa boas-vindas:');
        console.log(boasVindas.rows[0].etapa);
      } else {
        console.log('❌ Etapa boas-vindas NÃO ENCONTRADA!');
      }

      // 4. Verificar total de etapas
      const totalEtapas = await client.query(`
        SELECT jsonb_object_keys(estrutura->'etapas') as nome_etapa
        FROM fluxos_triagem 
        WHERE id = $1
      `, [fluxo.rows[0].id]);

      console.log(`\n📊 Total de etapas no fluxo: ${totalEtapas.rows.length}`);
      console.log('\nEtapas:', totalEtapas.rows.map(r => r.nome_etapa).join(', '));
    } else {
      console.log('\n❌ NENHUM FLUXO ATIVO ENCONTRADO PARA WHATSAPP!\n');
    }

    console.log('\n━'.repeat(60));
    console.log('\n✅ Diagnóstico concluído!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
})();
