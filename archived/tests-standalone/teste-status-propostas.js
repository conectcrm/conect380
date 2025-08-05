/**
 * Teste direto do endpoint que o frontend usa para buscar propostas
 * Para verificar se o status está sendo atualizado no banco
 */

const http = require('http');

console.log('🧪 Teste: Verificando propostas após envio de email...');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/propostas',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📧 Propostas do banco:');
    try {
      const response = JSON.parse(data);
      console.log('📊 Total de propostas:', response.length);

      // Mostrar propostas com status "enviada"
      const propostasEnviadas = response.filter(p => p.status === 'enviada');
      console.log('✅ Propostas com status "enviada":', propostasEnviadas.length);

      if (propostasEnviadas.length > 0) {
        console.log('📧 Últimas propostas enviadas:');
        propostasEnviadas.slice(-3).forEach(proposta => {
          console.log(`  - ${proposta.numero}: ${proposta.status} (${proposta.atualizadaEm})`);
        });
      }

      // Mostrar todas as propostas com status
      console.log('📋 Status de todas as propostas:');
      response.forEach(proposta => {
        console.log(`  - ${proposta.numero}: ${proposta.status} (cliente: ${proposta.cliente})`);
      });

    } catch (e) {
      console.log('📄 Resposta (texto):', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e.message);
});

req.end();
