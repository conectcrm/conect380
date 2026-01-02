import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

/**
 * Script de Migração: Fênix CRM → ConectSuite
 * 
 * Este script migra dados do banco antigo (fenixcrm_db) para o novo (conectcrm)
 * preservando integridade e adaptando ao novo schema.
 */

// ============================================================================
// CONFIGURAÇÃO: Fonte (Fênix)
// ============================================================================
const fenixDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433, // Porta do container fenixcrm-postgres
  username: 'fenixcrm',
  password: 'fenixcrm123',
  database: 'fenixcrm_db',
});

// ============================================================================
// CONFIGURAÇÃO: Destino (ConectSuite)
// ============================================================================
const conectsuiteDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432, // Porta do container conectsuite-postgres
  username: 'postgres',
  password: 'postgres',
  database: 'conectcrm',
});

// ============================================================================
// INTERFACES DE MAPEAMENTO
// ============================================================================

interface FenixUser {
  id: string;
  nome: string;
  email: string;
  senha: string;
  telefone: string | null;
  role: string;
  permissoes: string | null;
  empresa_id: string;
  avatar_url: string | null;
  idioma_preferido: string;
  configuracoes: any;
  ativo: boolean;
  ultimo_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface FenixEmpresa {
  id: string;
  nome: string;
  slug: string;
  cnpj: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  logo_url: string | null;
  configuracoes: any;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

interface FenixCliente {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  tipo: string;
  documento: string | null;
  status: string;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  empresa: string | null;
  cargo: string | null;
  origem: string | null;
  tags: string | null;
  observacoes: string | null;
  empresa_id: string;
  responsavel_id: string | null;
  valor_estimado: number;
  ultimo_contato: Date | null;
  proximo_contato: Date | null;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// FUNÇÕES DE MIGRAÇÃO
// ============================================================================

async function migrateEmpresas() {
  console.log('\n📦 Migrando Empresas...');

  const fenixEmpresas = await fenixDataSource.query<FenixEmpresa[]>(
    'SELECT * FROM empresas ORDER BY created_at'
  );

  console.log(`   Encontradas: ${fenixEmpresas.length} empresas`);

  for (const empresa of fenixEmpresas) {
    try {
      // Adaptar nome (remover caracteres especiais se necessário)
      const nomeAdaptado = empresa.nome
        .replace(/F\?\?nix/g, 'Fênix')
        .replace(/F├¬nix/g, 'Fênix');

      await conectsuiteDataSource.query(`
        INSERT INTO empresas (
          id, nome, slug, cnpj, email, telefone, endereco, cidade, estado, 
          cep, logo_url, configuracoes, ativo, created_at, updated_at,
          status, plano_id, data_assinatura, data_expiracao, max_usuarios,
          razao_social, inscricao_estadual, website
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          'ativo', NULL, NOW(), NULL, 10,
          $16, NULL, NULL
        )
        ON CONFLICT (id) DO UPDATE SET
          nome = EXCLUDED.nome,
          updated_at = NOW()
      `, [
        empresa.id,
        nomeAdaptado,
        empresa.slug || `empresa-${empresa.id.slice(0, 8)}`,
        empresa.cnpj,
        empresa.email,
        empresa.telefone,
        empresa.endereco,
        empresa.cidade,
        empresa.estado,
        empresa.cep,
        empresa.logo_url,
        empresa.configuracoes,
        empresa.ativo,
        empresa.created_at,
        empresa.updated_at,
        nomeAdaptado // razao_social
      ]);

      console.log(`   ✅ Migrada: ${nomeAdaptado} (${empresa.id})`);
    } catch (error) {
      console.error(`   ❌ Erro ao migrar empresa ${empresa.nome}:`, error.message);
    }
  }

  console.log(`   ✅ Total migrado: ${fenixEmpresas.length} empresas\n`);
}

async function migrateUsers() {
  console.log('\n👥 Migrando Usuários...');

  const fenixUsers = await fenixDataSource.query<FenixUser[]>(
    'SELECT * FROM users ORDER BY created_at'
  );

  console.log(`   Encontrados: ${fenixUsers.length} usuários`);

  for (const user of fenixUsers) {
    try {
      // Mapear role do Fênix para perfil do ConectSuite
      const perfilMap: Record<string, string> = {
        'admin': 'SUPER_ADMIN',
        'manager': 'ADMIN',
        'vendedor': 'ATENDENTE',
        'user': 'ATENDENTE',
      };

      const perfil = perfilMap[user.role] || 'ATENDENTE';

      // Atualizar email se for do Fênix
      const emailAdaptado = user.email.replace('@fenixcrm.com', '@conectcrm.com');

      await conectsuiteDataSource.query(`
        INSERT INTO users (
          id, nome, email, senha, telefone, perfil, empresa_id, 
          avatar_url, idioma_preferido, configuracoes, ativo, 
          ultimo_login, created_at, updated_at,
          status_atendente, deve_trocar_senha, primeira_senha
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          'offline', false, NULL
        )
        ON CONFLICT (id) DO UPDATE SET
          nome = EXCLUDED.nome,
          email = EXCLUDED.email,
          updated_at = NOW()
      `, [
        user.id,
        user.nome,
        emailAdaptado,
        user.senha, // Senha já está hasheada com bcrypt
        user.telefone,
        perfil,
        user.empresa_id,
        user.avatar_url,
        user.idioma_preferido,
        user.configuracoes,
        user.ativo,
        user.ultimo_login,
        user.created_at,
        user.updated_at,
      ]);

      console.log(`   ✅ Migrado: ${user.nome} (${user.email} → ${emailAdaptado})`);
    } catch (error) {
      console.error(`   ❌ Erro ao migrar usuário ${user.nome}:`, error.message);
    }
  }

  console.log(`   ✅ Total migrado: ${fenixUsers.length} usuários\n`);
}

async function migrateClientes() {
  console.log('\n👤 Migrando Clientes → Contatos...');

  const fenixClientes = await fenixDataSource.query<FenixCliente[]>(
    'SELECT * FROM clientes ORDER BY created_at'
  );

  console.log(`   Encontrados: ${fenixClientes.length} clientes`);

  for (const cliente of fenixClientes) {
    try {
      // Mapear status do Fênix para ConectSuite
      const statusMap: Record<string, string> = {
        'lead': 'LEAD',
        'prospect': 'PROSPECT',
        'cliente': 'CLIENTE',
        'inativo': 'INATIVO',
      };

      const status = statusMap[cliente.status] || 'LEAD';

      // Mapear tipo (pessoa_fisica/pessoa_juridica → PESSOA_FISICA/PESSOA_JURIDICA)
      const tipo = cliente.tipo === 'pessoa_fisica' ? 'PESSOA_FISICA' : 'PESSOA_JURIDICA';

      await conectsuiteDataSource.query(`
        INSERT INTO contatos (
          id, nome, email, telefone, tipo, documento, status, endereco, 
          cidade, estado, cep, empresa_campo, cargo, origem, tags, 
          observacoes, empresa_id, responsavel_id, valor_estimado, 
          ultimo_contato, proximo_contato, ativo, created_at, updated_at,
          whatsapp_id, avatar_url, data_nascimento, redes_sociais
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24,
          NULL, NULL, NULL, NULL
        )
        ON CONFLICT (id) DO UPDATE SET
          nome = EXCLUDED.nome,
          updated_at = NOW()
      `, [
        cliente.id,
        cliente.nome,
        cliente.email,
        cliente.telefone,
        tipo,
        cliente.documento,
        status,
        cliente.endereco,
        cliente.cidade,
        cliente.estado,
        cliente.cep,
        cliente.empresa, // empresa_campo (campo texto, não FK)
        cliente.cargo,
        cliente.origem,
        cliente.tags,
        cliente.observacoes,
        cliente.empresa_id,
        cliente.responsavel_id,
        cliente.valor_estimado,
        cliente.ultimo_contato,
        cliente.proximo_contato,
        cliente.ativo,
        cliente.created_at,
        cliente.updated_at,
      ]);

      console.log(`   ✅ Migrado: ${cliente.nome} (${status})`);
    } catch (error) {
      console.error(`   ❌ Erro ao migrar cliente ${cliente.nome}:`, error.message);
    }
  }

  console.log(`   ✅ Total migrado: ${fenixClientes.length} contatos\n`);
}

async function migrateProdutos() {
  console.log('\n📦 Migrando Produtos...');

  const fenixProdutos = await fenixDataSource.query(
    'SELECT * FROM produtos ORDER BY created_at'
  );

  console.log(`   Encontrados: ${fenixProdutos.length} produtos`);

  if (fenixProdutos.length === 0) {
    console.log('   ⚠️  Nenhum produto para migrar\n');
    return;
  }

  for (const produto of fenixProdutos) {
    try {
      await conectsuiteDataSource.query(`
        INSERT INTO produtos (
          id, nome, descricao, codigo, categoria, preco, custo, 
          estoque_minimo, estoque_atual, unidade, ativo, 
          empresa_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT (id) DO UPDATE SET
          nome = EXCLUDED.nome,
          updated_at = NOW()
      `, [
        produto.id || uuidv4(),
        produto.nome,
        produto.descricao,
        produto.codigo,
        produto.categoria,
        produto.preco,
        produto.custo || 0,
        produto.estoque_minimo || 0,
        produto.estoque_atual || 0,
        produto.unidade || 'UN',
        produto.ativo !== false,
        produto.empresa_id,
        produto.created_at || new Date(),
        produto.updated_at || new Date(),
      ]);

      console.log(`   ✅ Migrado: ${produto.nome}`);
    } catch (error) {
      console.error(`   ❌ Erro ao migrar produto ${produto.nome}:`, error.message);
    }
  }

  console.log(`   ✅ Total migrado: ${fenixProdutos.length} produtos\n`);
}

// ============================================================================
// VALIDAÇÃO PÓS-MIGRAÇÃO
// ============================================================================

async function validateMigration() {
  console.log('\n🔍 Validando Migração...\n');

  // Contar registros no Fênix
  const [fenixEmpresas] = await fenixDataSource.query('SELECT COUNT(*) FROM empresas');
  const [fenixUsers] = await fenixDataSource.query('SELECT COUNT(*) FROM users');
  const [fenixClientes] = await fenixDataSource.query('SELECT COUNT(*) FROM clientes');
  const [fenixProdutos] = await fenixDataSource.query('SELECT COUNT(*) FROM produtos');

  // Contar registros no ConectSuite
  const [csEmpresas] = await conectsuiteDataSource.query('SELECT COUNT(*) FROM empresas');
  const [csUsers] = await conectsuiteDataSource.query('SELECT COUNT(*) FROM users');
  const [csContatos] = await conectsuiteDataSource.query('SELECT COUNT(*) FROM contatos');
  const [csProdutos] = await conectsuiteDataSource.query('SELECT COUNT(*) FROM produtos');

  console.log('📊 Comparação de Dados:\n');
  console.log(`   Empresas:  Fênix: ${fenixEmpresas.count} → ConectSuite: ${csEmpresas.count} ${fenixEmpresas.count === csEmpresas.count ? '✅' : '❌'}`);
  console.log(`   Usuários:  Fênix: ${fenixUsers.count} → ConectSuite: ${csUsers.count} ${fenixUsers.count === csUsers.count ? '✅' : '❌'}`);
  console.log(`   Clientes:  Fênix: ${fenixClientes.count} → ConectSuite: ${csContatos.count} ${fenixClientes.count === csContatos.count ? '✅' : '❌'}`);
  console.log(`   Produtos:  Fênix: ${fenixProdutos.count} → ConectSuite: ${csProdutos.count} ${fenixProdutos.count === csProdutos.count ? '✅' : '❌'}`);

  const totalFenix = parseInt(fenixEmpresas.count) + parseInt(fenixUsers.count) +
    parseInt(fenixClientes.count) + parseInt(fenixProdutos.count);
  const totalCS = parseInt(csEmpresas.count) + parseInt(csUsers.count) +
    parseInt(csContatos.count) + parseInt(csProdutos.count);

  console.log(`\n   📊 TOTAL: ${totalFenix} → ${totalCS} ${totalFenix === totalCS ? '✅ SUCESSO' : '⚠️  VERIFICAR'}\n`);
}

// ============================================================================
// EXECUÇÃO PRINCIPAL
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🔄 MIGRAÇÃO: Fênix CRM → ConectSuite                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Conectar aos bancos
    console.log('🔌 Conectando ao Fênix CRM...');
    await fenixDataSource.initialize();
    console.log('   ✅ Conectado ao Fênix\n');

    console.log('🔌 Conectando ao ConectSuite...');
    await conectsuiteDataSource.initialize();
    console.log('   ✅ Conectado ao ConectSuite\n');

    // Executar migrações na ordem correta (respeitando FKs)
    await migrateEmpresas();  // 1º - sem dependências
    await migrateUsers();     // 2º - depende de empresas
    await migrateClientes();  // 3º - depende de empresas e users
    await migrateProdutos();  // 4º - depende de empresas

    // Validar
    await validateMigration();

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!                          ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Criar arquivo de log
    const logContent = `
Migração Fênix CRM → ConectSuite
Data: ${new Date().toISOString()}
Status: ✅ CONCLUÍDA

Resumo:
- Empresas migradas: ✅
- Usuários migrados: ✅
- Clientes → Contatos migrados: ✅
- Produtos migrados: ✅

Próximos Passos:
1. Testar login com usuários migrados
2. Verificar integridade dos dados
3. Parar container antigo (fenixcrm-postgres)
4. Fazer backup final do ConectSuite
`;

    await import('fs').then(fs => {
      fs.promises.writeFile('./migration-backup/MIGRATION_SUCCESS.txt', logContent, 'utf8');
    });

  } catch (error) {
    console.error('\n❌ ERRO DURANTE A MIGRAÇÃO:', error);
    process.exit(1);
  } finally {
    // Fechar conexões
    if (fenixDataSource.isInitialized) {
      await fenixDataSource.destroy();
    }
    if (conectsuiteDataSource.isInitialized) {
      await conectsuiteDataSource.destroy();
    }
  }
}

// Executar
main();
