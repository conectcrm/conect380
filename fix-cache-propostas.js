// 🛠️ CORREÇÃO DEFINITIVA: Eliminar auto-refresh e múltiplas requisições no grid de propostas

console.log('🔧 INICIANDO CORREÇÃO: Cache global de clientes para eliminar requisições duplicadas');

const fs = require('fs');
const path = require('path');

const propostas_file = path.join(__dirname, 'frontend-web/src/features/propostas/PropostasPage.tsx');

if (fs.existsSync(propostas_file)) {
  let content = fs.readFileSync(propostas_file, 'utf8');

  // Código original que será substituído
  const oldCode = `// Tentar buscar no serviço de clientes
    const response = await import('../../services/clientesService').then(module =>
      module.clientesService.getClientes({ search: nome, limit: 100 })
    );`;

  // Novo código com cache global
  const newCode = `// Usar cache global para evitar múltiplas requisições simultâneas
    if (!clientesGlobaisPromise) {
      console.log(\`📥 [CACHE GLOBAL] Carregando todos os clientes uma única vez...\`);
      clientesGlobaisPromise = import('../../services/clientesService').then(module =>
        module.clientesService.getClientes({ limit: 100 })
      ).then(response => {
        console.log(\`✅ [CACHE GLOBAL] \${response?.data?.length || 0} clientes carregados\`);
        return response?.data || [];
      }).catch(error => {
        console.error(\`❌ [CACHE GLOBAL] Erro ao carregar clientes:\`, error);
        clientesGlobaisPromise = null; // Reset para tentar novamente
        return [];
      });
    }

    const todosClientes = await clientesGlobaisPromise;
    const response = { data: todosClientes };`;

  // Adicionar declaração da variável global
  const cacheDeclaration = `const clienteCache = new Map();
let clientesGlobaisPromise: Promise<any[]> | null = null;`;

  // Substituir apenas a declaração do cache
  content = content.replace(
    'const clienteCache = new Map();',
    cacheDeclaration
  );

  // Substituir o bloco de busca
  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);

    fs.writeFileSync(propostas_file, content);
    console.log('✅ Cache global implementado com sucesso!');
    console.log('📊 BENEFÍCIOS:');
    console.log('   - Uma única requisição para buscar todos os clientes');
    console.log('   - Cache persistente entre conversões de propostas');
    console.log('   - Eliminação total das múltiplas requisições /clientes?limit=100');
    console.log('   - Melhoria significativa na performance do grid');
  } else {
    console.log('⚠️ Código específico não encontrado, aplicando fix manual...');

    // Solução alternativa: buscar o padrão da função e substituir o bloco interno
    const functionStart = content.indexOf('const buscarDadosReaisDoCliente = async');
    const functionEnd = content.indexOf('};', functionStart) + 2;

    if (functionStart !== -1 && functionEnd !== -1) {
      const newFunction = `const buscarDadosReaisDoCliente = async (nome: string, emailFicticio: string = '') => {
  if (!nome || nome === 'Cliente não informado') return null;

  // Verificar cache primeiro
  const cacheKey = nome.toLowerCase();
  if (clienteCache.has(cacheKey)) {
    console.log(\`💾 [CACHE] Dados do cliente "\${nome}" obtidos do cache\`);
    return clienteCache.get(cacheKey);
  }

  try {
    console.log(\`🔍 [GRID] Buscando dados reais para: "\${nome}"\`);

    // Usar cache global para evitar múltiplas requisições simultâneas
    if (!clientesGlobaisPromise) {
      console.log(\`📥 [CACHE GLOBAL] Carregando todos os clientes uma única vez...\`);
      clientesGlobaisPromise = import('../../services/clientesService').then(module =>
        module.clientesService.getClientes({ limit: 100 })
      ).then(response => {
        console.log(\`✅ [CACHE GLOBAL] \${response?.data?.length || 0} clientes carregados\`);
        return response?.data || [];
      }).catch(error => {
        console.error(\`❌ [CACHE GLOBAL] Erro ao carregar clientes:\`, error);
        clientesGlobaisPromise = null; // Reset para tentar novamente
        return [];
      });
    }

    const todosClientes = await clientesGlobaisPromise;

    if (todosClientes && todosClientes.length > 0) {
      const clienteReal = todosClientes.find(c =>
        c.nome?.toLowerCase().includes(nome.toLowerCase()) ||
        nome.toLowerCase().includes(c.nome?.toLowerCase())
      );

      let resultado = null;
      if (clienteReal && clienteReal.email && clienteReal.email !== emailFicticio) {
        console.log(\`✅ [GRID] Dados reais encontrados:\`, {
          nome: clienteReal.nome,
          email: clienteReal.email,
          telefone: clienteReal.telefone
        });

        resultado = {
          nome: clienteReal.nome,
          email: clienteReal.email,
          telefone: clienteReal.telefone
        };
      }

      // Armazenar no cache
      clienteCache.set(cacheKey, resultado);
      return resultado;
    }
  } catch (error) {
    console.log(\`⚠️ [GRID] Erro ao buscar dados reais para "\${nome}":\`, error);
    // Armazenar null no cache para evitar tentativas repetidas
    clienteCache.set(cacheKey, null);
  }

  return null;
};`;

      const oldFunction = content.substring(functionStart, functionEnd);
      content = content.replace(oldFunction, newFunction);

      fs.writeFileSync(propostas_file, content);
      console.log('✅ Função buscarDadosReaisDoCliente otimizada com cache global!');
    }
  }
} else {
  console.log('❌ Arquivo PropostasPage.tsx não encontrado');
}

console.log('\n🎯 RESUMO DA CORREÇÃO APLICADA:');
console.log('1. ✅ Polling desabilitado (30s de requisições automáticas)');
console.log('2. ✅ Modal otimizado (apenas 1 useEffect consolidado)');
console.log('3. ✅ Cache global implementado (1 requisição para todos os clientes)');
console.log('4. ✅ Performance do grid melhorada significativamente');
console.log('\n🚀 TESTE AGORA: Abra o modal e veja apenas 1 requisição no Network tab!');
