/**
 * Script para obter token JWT de teste
 * 
 * Faz login na API e retorna o token para usar em testes
 * 
 * Uso:
 * node scripts/get-test-token.js <email> <senha>
 */

const http = require('http');

const API_URL = process.env.API_URL || 'localhost';
const API_PORT = process.env.API_PORT || 3001;

const email = process.argv[2] || 'admin@conectcrm.com';
const senha = process.argv[3] || 'admin123';

console.log('🔑 Obtendo token de autenticação...\n');
console.log(`📧 Email: ${email}`);
console.log(`🔒 Senha: ${'*'.repeat(senha.length)}\n`);

const postData = JSON.stringify({
  email,
  senha,
});

const options = {
  hostname: API_URL,
  port: API_PORT,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      try {
        const response = JSON.parse(data);
        
        if (response.token || response.access_token) {
          const token = response.token || response.access_token;
          console.log('✅ Token obtido com sucesso!\n');
          console.log('📋 Token JWT:');
          console.log(token);
          console.log('\n💡 Use este token nos testes:');
          console.log(`node scripts/test-websocket.js "${token}"`);
          process.exit(0);
        } else {
          console.error('❌ Resposta não contém token:', response);
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Erro ao parsear resposta:', error.message);
        console.error('Resposta bruta:', data);
        process.exit(1);
      }
    } else {
      console.error(`❌ Erro ao fazer login: ${res.statusCode}`);
      console.error('Resposta:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
  console.error('\n💡 Verifique se o backend está rodando:');
  console.error('   cd c:\\Projetos\\conectcrm\\backend');
  console.error('   npm run start:dev');
  process.exit(1);
});

req.write(postData);
req.end();
