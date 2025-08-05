// Script de teste para verificar se os vendedores estão sendo carregados corretamente
// Execute no console do navegador para testar

console.log('🧪 Testando carregamento de vendedores...');

// 1. Testar serviço de usuários diretamente
async function testarUsuarios() {
  try {
    const { usuariosService } = await import('./src/services/usuariosService');
    const { UserRole } = await import('./src/types/usuarios/index');

    console.log('📋 Buscando usuários com role vendedor...');
    const usuarios = await usuariosService.listarUsuarios({
      role: UserRole.VENDEDOR,
      ativo: true
    });

    console.log(`👥 Encontrados ${usuarios.length} vendedores:`, usuarios);
    return usuarios;
  } catch (error) {
    console.error('❌ Erro ao testar usuários:', error);
    return [];
  }
}

// 2. Testar serviço de propostas
async function testarPropostasService() {
  try {
    const { propostasService } = await import('./src/features/propostas/services/propostasService');

    console.log('📋 Testando propostasService.obterVendedores()...');
    const vendedores = await propostasService.obterVendedores();

    console.log(`👥 Vendedores carregados via propostasService (${vendedores.length}):`, vendedores);

    console.log('📋 Testando propostasService.obterVendedorAtual()...');
    const vendedorAtual = await propostasService.obterVendedorAtual();

    console.log('👤 Vendedor atual:', vendedorAtual);

    return { vendedores, vendedorAtual };
  } catch (error) {
    console.error('❌ Erro ao testar propostasService:', error);
    return { vendedores: [], vendedorAtual: null };
  }
}

// Executar testes
async function executarTestes() {
  console.log('🚀 Iniciando testes de integração...');

  const usuarios = await testarUsuarios();
  const { vendedores, vendedorAtual } = await testarPropostasService();

  console.log('\n📊 RESULTADOS DOS TESTES:');
  console.log('='.repeat(50));
  console.log(`✅ Usuários vendedores encontrados: ${usuarios.length}`);
  console.log(`✅ Vendedores via propostasService: ${vendedores.length}`);
  console.log(`✅ Vendedor atual definido: ${vendedorAtual ? 'SIM' : 'NÃO'}`);

  if (usuarios.length > 0 && vendedores.length > 0) {
    console.log('🎉 INTEGRAÇÃO FUNCIONANDO CORRETAMENTE!');
    console.log('💡 Os vendedores cadastrados no sistema aparecerão no modal de nova proposta.');
  } else if (usuarios.length === 0) {
    console.log('⚠️  NENHUM VENDEDOR CADASTRADO');
    console.log('💡 Cadastre usuários com role "vendedor" no sistema de gestão de usuários.');
  } else {
    console.log('❌ PROBLEMA NA INTEGRAÇÃO');
    console.log('💡 Verifique os logs de erro acima.');
  }
}

// Executar automaticamente
executarTestes();
