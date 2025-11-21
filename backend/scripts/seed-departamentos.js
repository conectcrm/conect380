const { Client } = require('pg');

/**
 * Script para popular dados de exemplo de departamentos
 * Uso: node scripts/seed-departamentos.js
 */

const client = new Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5434', 10),
  user: process.env.DATABASE_USERNAME || 'conectcrm',
  password: process.env.DATABASE_PASSWORD || 'conectcrm123',
  database: process.env.DATABASE_NAME || 'conectcrm_db',
});

const EMPRESA_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // ID da empresa de desenvolvimento

async function seed() {
  try {
    await client.connect();
    console.log('🔌 Conectado ao banco de dados');

    // 1. Verificar se existem núcleos
    const nucleosResult = await client.query(
      'SELECT id, nome FROM nucleos_atendimento WHERE empresa_id = $1 LIMIT 3',
      [EMPRESA_ID]
    );

    if (nucleosResult.rows.length === 0) {
      console.log('⚠️  Nenhum núcleo encontrado. Criando núcleos de exemplo...');

      // Criar núcleos de exemplo
      const nucleos = [
        {
          nome: 'Suporte Técnico',
          descricao: 'Atendimento de suporte técnico',
          codigo: 'SUP',
          cor: '#10B981',
          icone: 'headset',
          ativo: true
        },
        {
          nome: 'Vendas',
          descricao: 'Equipe de vendas e prospecção',
          codigo: 'VND',
          cor: '#3B82F6',
          icone: 'shopping-bag',
          ativo: true
        },
        {
          nome: 'Financeiro',
          descricao: 'Atendimento financeiro e cobranças',
          codigo: 'FIN',
          cor: '#F59E0B',
          icone: 'dollar-sign',
          ativo: true
        }
      ];

      for (const nucleo of nucleos) {
        await client.query(
          `INSERT INTO nucleos_atendimento 
           (empresa_id, nome, descricao, codigo, cor, icone, ativo, capacidade_maxima_tickets, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 50, NOW(), NOW())`,
          [EMPRESA_ID, nucleo.nome, nucleo.descricao, nucleo.codigo, nucleo.cor, nucleo.icone, nucleo.ativo]
        );
      }

      console.log('✅ Núcleos criados com sucesso');

      // Buscar novamente
      const novosNucleos = await client.query(
        'SELECT id, nome FROM nucleos_atendimento WHERE empresa_id = $1 LIMIT 3',
        [EMPRESA_ID]
      );
      nucleosResult.rows = novosNucleos.rows;
    }

    console.log(`📊 Encontrados ${nucleosResult.rows.length} núcleos`);

    // 2. Verificar se já existem departamentos
    const countResult = await client.query(
      'SELECT COUNT(*) FROM departamentos WHERE empresa_id = $1',
      [EMPRESA_ID]
    );

    const count = parseInt(countResult.rows[0].count, 10);
    if (count > 0) {
      console.log(`⚠️  Já existem ${count} departamentos. Deseja continuar? (isso criará mais departamentos)`);
      // Para desenvolvimento, vamos continuar
    }

    // 3. Buscar usuários para serem supervisores
    const usuariosResult = await client.query(
      'SELECT id, nome FROM users WHERE empresa_id = $1 AND ativo = true LIMIT 5',
      [EMPRESA_ID]
    );

    const supervisorIds = usuariosResult.rows.map(u => u.id);
    console.log(`👥 Encontrados ${supervisorIds.length} usuários para supervisores`);

    // 4. Criar departamentos de exemplo
    const departamentos = [
      {
        nucleoId: nucleosResult.rows[0]?.id,
        nome: 'Suporte Nível 1',
        descricao: 'Atendimento inicial e triagem de chamados',
        codigo: 'SUP-N1',
        cor: '#10B981',
        icone: 'headphones',
        ordem: 1,
        tipoDistribuicao: 'round_robin',
        capacidadeMaxima: 20,
        slaRespostaMinutos: 5,
        slaResolucaoHoras: 24,
        mensagemBoasVindas: 'Olá! Bem-vindo ao suporte técnico nível 1.',
        ativo: true
      },
      {
        nucleoId: nucleosResult.rows[0]?.id,
        nome: 'Suporte Nível 2',
        descricao: 'Atendimento especializado para problemas complexos',
        codigo: 'SUP-N2',
        cor: '#059669',
        icone: 'tool',
        ordem: 2,
        tipoDistribuicao: 'skill_based',
        capacidadeMaxima: 15,
        slaRespostaMinutos: 15,
        slaResolucaoHoras: 48,
        mensagemBoasVindas: 'Bem-vindo ao suporte especializado.',
        ativo: true
      },
      {
        nucleoId: nucleosResult.rows[1]?.id,
        nome: 'Vendas Internas',
        descricao: 'Equipe de vendas inbound',
        codigo: 'VND-INT',
        cor: '#3B82F6',
        icone: 'shopping-cart',
        ordem: 1,
        tipoDistribuicao: 'load_balancing',
        capacidadeMaxima: 25,
        slaRespostaMinutos: 3,
        slaResolucaoHoras: 4,
        mensagemBoasVindas: 'Olá! Como podemos ajudar com sua compra?',
        ativo: true
      },
      {
        nucleoId: nucleosResult.rows[1]?.id,
        nome: 'Vendas Externas',
        descricao: 'Equipe de vendas outbound',
        codigo: 'VND-EXT',
        cor: '#2563EB',
        icone: 'phone-call',
        ordem: 2,
        tipoDistribuicao: 'manual',
        capacidadeMaxima: 30,
        slaRespostaMinutos: 10,
        slaResolucaoHoras: 8,
        mensagemBoasVindas: 'Olá! Obrigado pelo interesse em nossos produtos.',
        ativo: true
      },
      {
        nucleoId: nucleosResult.rows[2]?.id,
        nome: 'Cobranças',
        descricao: 'Departamento de cobranças e negociações',
        codigo: 'FIN-COB',
        cor: '#F59E0B',
        icone: 'dollar-sign',
        ordem: 1,
        tipoDistribuicao: 'round_robin',
        capacidadeMaxima: 15,
        slaRespostaMinutos: 30,
        slaResolucaoHoras: 72,
        mensagemBoasVindas: 'Olá! Estamos aqui para ajudar com questões financeiras.',
        ativo: true
      }
    ];

    let criadosCount = 0;
    for (let i = 0; i < departamentos.length; i++) {
      const dept = departamentos[i];

      if (!dept.nucleoId) {
        console.log(`⚠️  Pulando departamento "${dept.nome}" - núcleo não encontrado`);
        continue;
      }

      const supervisorId = supervisorIds[i % supervisorIds.length] || null;

      // Simular alguns atendentes (pode usar IDs reais se quiser)
      const atendentesIds = supervisorIds.slice(0, Math.min(3, supervisorIds.length));

      await client.query(
        `INSERT INTO departamentos 
         (empresa_id, nucleo_id, nome, descricao, codigo, cor, icone, ativo, ordem,
          atendentes_ids, supervisor_id, tipo_distribuicao, capacidade_maxima_tickets,
          sla_resposta_minutos, sla_resolucao_horas, mensagem_boas_vindas,
          created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())`,
        [
          EMPRESA_ID,
          dept.nucleoId,
          dept.nome,
          dept.descricao,
          dept.codigo,
          dept.cor,
          dept.icone,
          dept.ativo,
          dept.ordem,
          atendentesIds,
          supervisorId,
          dept.tipoDistribuicao,
          dept.capacidadeMaxima,
          dept.slaRespostaMinutos,
          dept.slaResolucaoHoras,
          dept.mensagemBoasVindas
        ]
      );

      criadosCount++;
      console.log(`✅ Departamento "${dept.nome}" criado`);
    }

    console.log(`\n🎉 Seed concluído! ${criadosCount} departamentos criados.`);

    // 5. Mostrar resumo
    const resumo = await client.query(
      `SELECT d.nome, n.nome as nucleo, d.codigo, d.ativo 
       FROM departamentos d
       JOIN nucleos_atendimento n ON d.nucleo_id = n.id
       WHERE d.empresa_id = $1
       ORDER BY d.ordem`,
      [EMPRESA_ID]
    );

    console.log('\n📋 Departamentos cadastrados:');
    resumo.rows.forEach(row => {
      const status = row.ativo ? '🟢' : '🔴';
      console.log(`${status} [${row.codigo}] ${row.nome} (${row.nucleo})`);
    });

  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

seed();
