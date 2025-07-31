// Teste simples para verificar a API de metas
// Execute com: node teste-metas-api.js

const http = require('http');

function testAPI(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testando API de Metas...\n');

  try {
    // 1. Listar todas as metas
    console.log('1. Listando todas as metas:');
    const listResult = await testAPI('GET', '/metas');
    console.log(`Status: ${listResult.status}`);
    console.log('Dados:', JSON.stringify(listResult.data, null, 2));
    console.log('\n');

    // 2. Obter meta atual
    console.log('2. Obtendo meta atual:');
    const currentResult = await testAPI('GET', '/metas/atual');
    console.log(`Status: ${currentResult.status}`);
    console.log('Dados:', JSON.stringify(currentResult.data, null, 2));
    console.log('\n');

    // 3. Criar nova meta
    console.log('3. Criando nova meta:');
    const novaMeta = {
      tipo: 'mensal',
      periodo: '2025-02',
      vendedorId: null,
      regiao: 'Rio de Janeiro',
      valor: 500000,
      descricao: 'Meta para RJ em fevereiro'
    };
    const createResult = await testAPI('POST', '/metas', novaMeta);
    console.log(`Status: ${createResult.status}`);
    console.log('Dados:', JSON.stringify(createResult.data, null, 2));
    console.log('\n');

    // 4. Atualizar meta (se criação foi bem-sucedida)
    if (createResult.status === 201 && createResult.data?.id) {
      console.log('4. Atualizando meta criada:');
      const updateData = {
        valor: 550000,
        descricao: 'Meta atualizada para RJ em fevereiro - valor aumentado'
      };
      const updateResult = await testAPI('PATCH', `/metas/${createResult.data.id}`, updateData);
      console.log(`Status: ${updateResult.status}`);
      console.log('Dados:', JSON.stringify(updateResult.data, null, 2));
      console.log('\n');

      // 5. Excluir meta criada
      console.log('5. Excluindo meta criada:');
      const deleteResult = await testAPI('DELETE', `/metas/${createResult.data.id}`);
      console.log(`Status: ${deleteResult.status}`);
      console.log('Dados:', deleteResult.data || 'Meta excluída com sucesso');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.log('\n💡 Certifique-se de que o backend está rodando na porta 3000');
  }
}

runTests();
