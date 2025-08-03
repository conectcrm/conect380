const { Client } = require('pg');

async function seedPlanosEModulos() {
  console.log('🌱 Iniciando seed de planos e módulos...\n');

  const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'conectcrm',
    password: 'conectcrm123',
    database: 'conectcrm_db'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Inserir módulos do sistema
    console.log('1. Inserindo módulos do sistema...');

    const modulos = [
      {
        nome: 'Dashboard',
        codigo: 'dashboard',
        descricao: 'Visão geral e estatísticas do negócio',
        icone: 'BarChart3',
        cor: '#3B82F6',
        essencial: true,
        ordem: 1
      },
      {
        nome: 'Clientes',
        codigo: 'clientes',
        descricao: 'Gestão de clientes e contatos',
        icone: 'Users',
        cor: '#10B981',
        essencial: true,
        ordem: 2
      },
      {
        nome: 'Propostas',
        codigo: 'propostas',
        descricao: 'Criação e gestão de propostas comerciais',
        icone: 'FileText',
        cor: '#F59E0B',
        essencial: true,
        ordem: 3
      },
      {
        nome: 'Oportunidades',
        codigo: 'oportunidades',
        descricao: 'Pipeline de vendas e oportunidades',
        icone: 'Target',
        cor: '#EF4444',
        essencial: false,
        ordem: 4
      },
      {
        nome: 'Produtos',
        codigo: 'produtos',
        descricao: 'Catálogo de produtos e serviços',
        icone: 'Package',
        cor: '#8B5CF6',
        essencial: false,
        ordem: 5
      },
      {
        nome: 'Relatórios',
        codigo: 'relatorios',
        descricao: 'Relatórios avançados e analytics',
        icone: 'BarChart',
        cor: '#06B6D4',
        essencial: false,
        ordem: 6
      },
      {
        nome: 'Integrações',
        codigo: 'integracoes',
        descricao: 'Integrações com ferramentas externas',
        icone: 'Zap',
        cor: '#EC4899',
        essencial: false,
        ordem: 7
      },
      {
        nome: 'API Access',
        codigo: 'api',
        descricao: 'Acesso à API para integrações customizadas',
        icone: 'Code',
        cor: '#6366F1',
        essencial: false,
        ordem: 8
      }
    ];

    // Limpar e inserir módulos
    await client.query('DELETE FROM modulos_sistema');

    for (const modulo of modulos) {
      const query = `
        INSERT INTO modulos_sistema (nome, codigo, descricao, icone, cor, ativo, essencial, ordem)
        VALUES ($1, $2, $3, $4, $5, true, $6, $7)
        RETURNING id, nome, codigo
      `;

      const result = await client.query(query, [
        modulo.nome,
        modulo.codigo,
        modulo.descricao,
        modulo.icone,
        modulo.cor,
        modulo.essencial,
        modulo.ordem
      ]);

      console.log(`   ✅ ${modulo.nome} (${result.rows[0].id})`);
    }

    // 2. Inserir planos
    console.log('\n2. Inserindo planos...');

    const planos = [
      {
        nome: 'Starter',
        codigo: 'starter',
        descricao: 'Ideal para pequenas empresas que estão começando',
        preco: 49.90,
        limiteUsuarios: 3,
        limiteClientes: 100,
        limiteStorage: 1024, // 1GB em MB
        limiteApiCalls: 1000,
        permiteWhitelabel: false,
        permiteApi: false,
        permiteIntegracao: false,
        suportePrioridade: 'basico',
        cor: '#10B981',
        modulosEssenciais: ['dashboard', 'clientes', 'propostas']
      },
      {
        nome: 'Professional',
        codigo: 'professional',
        descricao: 'Para empresas em crescimento que precisam de mais recursos',
        preco: 99.90,
        limiteUsuarios: 10,
        limiteClientes: 500,
        limiteStorage: 5120, // 5GB em MB
        limiteApiCalls: 5000,
        permiteWhitelabel: false,
        permiteApi: true,
        permiteIntegracao: true,
        suportePrioridade: 'prioritario',
        cor: '#3B82F6',
        modulosInclusos: ['dashboard', 'clientes', 'propostas', 'oportunidades', 'produtos']
      },
      {
        nome: 'Enterprise',
        codigo: 'enterprise',
        descricao: 'Solução completa para grandes empresas',
        preco: 199.90,
        limiteUsuarios: -1, // ilimitado
        limiteClientes: -1, // ilimitado
        limiteStorage: 20480, // 20GB em MB
        limiteApiCalls: 50000,
        permiteWhitelabel: true,
        permiteApi: true,
        permiteIntegracao: true,
        suportePrioridade: 'vip',
        cor: '#8B5CF6',
        modulosInclusos: ['dashboard', 'clientes', 'propostas', 'oportunidades', 'produtos', 'relatorios', 'integracoes', 'api']
      }
    ];

    // Limpar e inserir planos (apenas se não existirem)
    console.log('\n   Verificando planos existentes...');

    for (const plano of planos) {
      // Verificar se o plano já existe
      const planoExistente = await client.query(
        'SELECT id FROM planos WHERE codigo = $1',
        [plano.codigo]
      );

      let planoId;

      if (planoExistente.rows.length === 0) {
        // Inserir novo plano
        const query = `
          INSERT INTO planos (
            nome, codigo, descricao, preco, "limiteUsuarios", "limiteClientes", 
            "limiteStorage", "limiteApiCalls", "whiteLabel", ativo
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
          RETURNING id, nome, codigo
        `;

        const result = await client.query(query, [
          plano.nome,
          plano.codigo,
          plano.descricao,
          plano.preco,
          plano.limiteUsuarios,
          plano.limiteClientes,
          plano.limiteStorage,
          plano.limiteApiCalls,
          plano.permiteWhitelabel
        ]);

        planoId = result.rows[0].id;
        console.log(`   ✅ ${plano.nome} criado (${planoId})`);
      } else {
        planoId = planoExistente.rows[0].id;
        console.log(`   ℹ️ ${plano.nome} já existe (${planoId})`);

        // Atualizar dados do plano existente
        await client.query(`
          UPDATE planos SET 
            nome = $1, descricao = $2, preco = $3, "limiteUsuarios" = $4, 
            "limiteClientes" = $5, "limiteStorage" = $6, "limiteApiCalls" = $7,
            "whiteLabel" = $8
          WHERE id = $9
        `, [
          plano.nome, plano.descricao, plano.preco, plano.limiteUsuarios,
          plano.limiteClientes, plano.limiteStorage, plano.limiteApiCalls,
          plano.permiteWhitelabel, planoId
        ]);
        console.log(`   📝 ${plano.nome} atualizado`);
      }

      // Limpar associações antigas do plano
      await client.query('DELETE FROM planos_modulos WHERE plano_id = $1', [planoId]);

      // Associar módulos ao plano
      const modulosParaAssociar = plano.modulosInclusos || plano.modulosEssenciais || [];

      for (const codigoModulo of modulosParaAssociar) {
        const moduloResult = await client.query(
          'SELECT id FROM modulos_sistema WHERE codigo = $1',
          [codigoModulo]
        );

        if (moduloResult.rows.length > 0) {
          const moduloId = moduloResult.rows[0].id;
          await client.query(
            'INSERT INTO planos_modulos (plano_id, modulo_id) VALUES ($1, $2)',
            [planoId, moduloId]
          );
          console.log(`     📦 Módulo ${codigoModulo} associado`);
        }
      }
    }

    // 3. Criar assinatura para a empresa demo
    console.log('\n3. Criando assinatura para empresa demo...');

    // Buscar empresa demo
    const empresaResult = await client.query(
      "SELECT id FROM empresas WHERE email = 'contato@conectcrm.com'"
    );

    if (empresaResult.rows.length > 0) {
      const empresaId = empresaResult.rows[0].id;

      // Buscar plano Professional
      const planoResult = await client.query(
        "SELECT id FROM planos WHERE codigo = 'professional'"
      );

      if (planoResult.rows.length > 0) {
        const planoId = planoResult.rows[0].id;

        // Verificar se já existe assinatura
        const assinaturaExistente = await client.query(
          'SELECT id FROM assinaturas_empresas WHERE empresa_id = $1',
          [empresaId]
        );

        if (assinaturaExistente.rows.length === 0) {
          const dataInicio = new Date();
          const dataFim = new Date();
          dataFim.setMonth(dataFim.getMonth() + 1);

          await client.query(`
            INSERT INTO assinaturas_empresas (
              empresa_id, plano_id, status, "dataInicio", "dataFim", 
              "proximoVencimento", "valorMensal", "renovacaoAutomatica"
            )
            VALUES ($1, $2, 'ativa', $3, $4, $5, 99.90, true)
          `, [empresaId, planoId, dataInicio, dataFim, dataFim]);

          console.log('   ✅ Assinatura Professional criada para empresa demo');
        } else {
          console.log('   ℹ️ Assinatura já existe para empresa demo');
        }
      }
    }

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   • ${modulos.length} módulos inseridos`);
    console.log(`   • ${planos.length} planos inseridos`);
    console.log('   • Assinatura demo configurada');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

seedPlanosEModulos().catch(console.error);
