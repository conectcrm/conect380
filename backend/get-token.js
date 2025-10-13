/**
 * Script para obter token JWT do backend
 * Usa credenciais de teste padrão
 */

const API_URL = 'http://localhost:3001';

async function getToken() {
  try {
    console.log('🔑 Obtendo token JWT...\n');

    // Tentar fazer login com credenciais padrão
    const credentials = [
      { email: 'teste@omnichannel.com', senha: 'senha123' },
      { email: 'teste@omnichannel.com', senha: 'teste123' },
      { email: 'admin@teste.com', senha: 'admin123' },
      { email: 'admin@teste.com', senha: 'senha123' },
      { email: 'dhonlenofreitas@hotmail.com', senha: 'senha123' },
      { email: 'gerente@conectcrm.com', senha: 'senha123' },
      { email: 'vendedor@conectcrm.com', senha: 'senha123' },
    ];

    for (const cred of credentials) {
      try {
        console.log(`Tentando: ${cred.email}...`);

        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cred),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`\n✅ Login bem-sucedido com ${cred.email}`);

          const token = data.data?.access_token || data.access_token || data.token || data.accessToken;

          if (token) {
            console.log(`\n�🔑 TOKEN JWT:\n`);
            console.log(token);
            console.log(`\n📋 Para usar nos testes, copie o token acima e cole no arquivo test-contatos-api.js (linha 12)`);
          } else {
            console.log('\n⚠️ Token não encontrado na resposta');
          }
          return token;
        } else {
          const error = await response.json();
          console.log(`❌ Falhou: ${error.message || response.statusText}`);
        }
      } catch (err) {
        console.log(`❌ Erro: ${err.message}`);
      }
    }

    console.log('\n⚠️ Nenhuma credencial funcionou. Possíveis soluções:');
    console.log('1. Verificar se o backend está rodando em http://localhost:3001');
    console.log('2. Criar um usuário no banco de dados');
    console.log('3. Verificar as credenciais no arquivo .env');

  } catch (error) {
    console.error('❌ Erro ao obter token:', error.message);
    console.log('\n⚠️ Certifique-se de que:');
    console.log('1. O backend está rodando (porta 3001)');
    console.log('2. O banco de dados está acessível');
    console.log('3. Existem usuários cadastrados');
  }
}

// Executar
getToken();
