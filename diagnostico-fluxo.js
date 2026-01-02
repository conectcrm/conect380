// Script de diagnóstico - Executar com: node diagnostico-fluxo.js

const { Client } = require('pg');

async function diagnosticar() {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    database: 'conectcrm_db',
    user: 'conectcrm',
    password: 'conectcrm123',
  });

  try {
    await client.connect();
    console.log('\n✅ Conectado ao banco de dados\n');

    // 1. Fluxo ativo
    console.log('🔍 1. Verificando fluxo ativo...');
    const fluxoAtivo = await client.query(`
      SELECT id, nome, ativo, created_at, updated_at
      FROM fluxos_triagem
      WHERE ativo = true
      ORDER BY updated_at DESC
      LIMIT 1
    `);

    if (fluxoAtivo.rows.length === 0) {
      console.log('❌ ERRO: Nenhum fluxo ativo encontrado!');
      return;
    }

    const fluxo = fluxoAtivo.rows[0];
    console.log(`✅ Fluxo ativo: ${fluxo.nome} (ID: ${fluxo.id})`);
    console.log(`   Criado em: ${fluxo.created_at}`);
    console.log(`   Atualizado em: ${fluxo.updated_at}\n`);

    // 2. Etapas do fluxo
    console.log('🔍 2. Listando etapas do fluxo...');
    const etapas = await client.query(`
      SELECT jsonb_object_keys(estrutura->'etapas') as etapa_id
      FROM fluxos_triagem
      WHERE id = $1
    `, [fluxo.id]);

    const listaEtapas = etapas.rows.map(r => r.etapa_id);
    console.log(`   Total de etapas: ${listaEtapas.length}`);
    console.log(`   Etapas: ${listaEtapas.join(', ')}\n`);

    // 3. Verificar etapa de confirmação
    console.log('🔍 3. Verificando etapa de confirmação...');
    const temConfirmarCliente = listaEtapas.includes('confirmar-dados-cliente');
    const temConfirmacaoDados = listaEtapas.includes('confirmacao-dados');

    if (temConfirmarCliente) {
      console.log('   ✅ Etapa "confirmar-dados-cliente" EXISTE');

      // Ver detalhes
      const detalhes = await client.query(`
        SELECT 
          estrutura->'etapas'->'confirmar-dados-cliente'->>'mensagem' as mensagem,
          estrutura->'etapas'->'confirmar-dados-cliente'->>'proximaEtapa' as proxima_etapa,
          estrutura->'etapas'->'confirmar-dados-cliente'->>'tipo' as tipo
        FROM fluxos_triagem
        WHERE id = $1
      `, [fluxo.id]);

      const det = detalhes.rows[0];
      console.log(`      Tipo: ${det.tipo}`);
      console.log(`      Mensagem: ${det.mensagem?.substring(0, 50)}...`);
      console.log(`      Próxima etapa: ${det.proxima_etapa || 'NÃO CONFIGURADA'}\n`);
    } else if (temConfirmacaoDados) {
      console.log('   ✅ Etapa "confirmacao-dados" EXISTE\n');
    } else {
      console.log('   ❌ PROBLEMA: Etapa de confirmação NÃO encontrada!');
      console.log('   ⚠️  Você precisa adicionar a etapa no fluxo.\n');
    }

    // 4. Sessões ativas
    console.log('🔍 4. Verificando sessões ativas...');
    const sessoes = await client.query(`
      SELECT id, contato_telefone, etapa_atual, status, iniciada_em
      FROM sessao_triagem
      WHERE status = 'em_andamento'
      ORDER BY iniciada_em DESC
      LIMIT 5
    `);

    if (sessoes.rows.length === 0) {
      console.log('   ℹ️  Nenhuma sessão ativa no momento\n');
    } else {
      console.log(`   ⚠️  ${sessoes.rows.length} sessão(ões) ativa(s):`);
      sessoes.rows.forEach(s => {
        console.log(`      • ${s.contato_telefone} - Etapa: ${s.etapa_atual} (iniciada: ${s.iniciada_em})`);
      });
      console.log('   💡 Considere limpar sessões antigas para testar com fluxo atualizado\n');
    }

    // 5. Resumo e recomendações
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 RESUMO DO DIAGNÓSTICO');
    console.log('═══════════════════════════════════════════════════');

    if (temConfirmarCliente || temConfirmacaoDados) {
      console.log('✅ Fluxo está configurado corretamente');
      console.log('');
      console.log('🔧 PRÓXIMOS PASSOS:');
      console.log('   1. Reiniciar backend (se ainda não reiniciou)');
      console.log('   2. Limpar sessões antigas (SQL abaixo):');
      console.log('      UPDATE sessao_triagem SET status = \'finalizada\', finalizada_em = NOW()');
      console.log('      WHERE status = \'em_andamento\';');
      console.log('   3. Enviar nova mensagem no WhatsApp');
      console.log('   4. Verificar logs do backend');
    } else {
      console.log('❌ Fluxo NÃO está configurado corretamente');
      console.log('');
      console.log('🔧 SOLUÇÃO:');
      console.log('   Execute o SQL: corrigir-fluxo-confirmacao.sql');
      console.log('   OU adicione a etapa no editor visual');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

diagnosticar();
