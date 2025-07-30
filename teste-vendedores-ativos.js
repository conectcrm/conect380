// Teste rápido para verificar se o filtro de usuários ativos está funcionando
// Este arquivo pode ser executado no console do navegador para testar

async function testarFiltroVendedoresAtivos() {
  try {
    console.log('🧪 Testando filtro de vendedores ativos...');

    // Importar o propostasService
    const { propostasService } = await import('./frontend-web/src/features/propostas/services/propostasService');

    // Obter vendedores (deve retornar apenas ativos)
    const vendedores = await propostasService.obterVendedores();

    console.log(`📊 Total de vendedores retornados: ${vendedores.length}`);
    console.log('👥 Vendedores:', vendedores);

    // Verificar se todos são ativos
    const todosAtivos = vendedores.every(v => v.ativo === true);
    console.log(`✅ Todos os vendedores são ativos: ${todosAtivos}`);

    if (!todosAtivos) {
      const inativos = vendedores.filter(v => !v.ativo);
      console.warn('⚠️ Vendedores inativos encontrados:', inativos);
    }

    return {
      total: vendedores.length,
      todosAtivos,
      vendedores
    };

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return null;
  }
}

// Para executar o teste no console:
// testarFiltroVendedoresAtivos();
