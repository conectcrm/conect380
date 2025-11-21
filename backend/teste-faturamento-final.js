const http = require('http');

console.log('🧪 Teste final: Verificando se nomes dos clientes aparecem nas faturas');

async function testarFaturamento() {
  try {
    // Faz requisição para o endpoint de faturas usando http nativo
    const requestData = JSON.stringify({});
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/faturamento/faturas/paginadas?page=1&limit=5',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        });
      });
      
      req.on('error', (err) => {
        reject(err);
      });
      
      req.end();
    });

    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode}`);
    }

    const data = JSON.parse(response.data);
    
    console.log('\n🔍 Resposta completa do servidor:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n📊 Resultado do teste:');
    console.log(`Total de faturas: ${data.total}`);
    console.log('='.repeat(50));
    
    if (data.faturas && data.faturas.length > 0) {
      data.faturas.forEach((fatura, index) => {
        console.log(`${index + 1}. Fatura ${fatura.numero}:`);
        
        if (fatura.cliente && fatura.cliente.nome) {
          console.log(`   ✅ Cliente: ${fatura.cliente.nome}`);
          console.log(`   📧 Email: ${fatura.cliente.email || 'N/A'}`);
        } else {
          console.log(`   ❌ Problema: Cliente não encontrado (clienteId: ${fatura.clienteId})`);
        }
        
        console.log(`   💰 Valor: R$ ${fatura.valor}`);
        console.log(`   📅 Data: ${fatura.dataEmissao}`);
        console.log('   ' + '-'.repeat(40));
      });
      
      // Verificar se há faturas sem cliente
      const faturasSemCliente = data.faturas.filter(f => !f.cliente || !f.cliente.nome);
      
      if (faturasSemCliente.length === 0) {
        console.log('\n🎉 SUCESSO: Todas as faturas têm nomes de clientes!');
      } else {
        console.log(`\n⚠️  ATENÇÃO: ${faturasSemCliente.length} fatura(s) ainda sem nome de cliente`);
      }
      
    } else {
      console.log('❌ Nenhuma fatura encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testarFaturamento();
