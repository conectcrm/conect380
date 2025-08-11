// Script temporário para configurar token de teste para contratos
console.log('🔐 Configurando token de teste...');

// Token JWT mock para testes (válido por 24h)
const tokenMock = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzMzNTk4MDAwLCJleHAiOjE3MzM2ODQ0MDAsInVzZXJJZCI6MSwiZW1wcmVzYV9pZCI6MSwicm9sZSI6ImFkbWluIiwibm9tZSI6IkFkbWluaXN0cmFkb3IgVGVzdGUifQ.mock_signature_for_testing';

// Configurar no localStorage
localStorage.setItem('auth_token', tokenMock);

// Configurar dados do usuário mock
const userDataMock = {
  id: 1,
  nome: 'Administrador Teste',
  email: 'admin@teste.com',
  empresa_id: 1,
  role: 'admin'
};

localStorage.setItem('user_data', JSON.stringify(userDataMock));

console.log('✅ Token e dados de usuário configurados!');
console.log('📋 Agora você pode testar os contratos');
console.log('🔄 Atualize a página para que as mudanças tenham efeito');

// Verificar se foi salvo
const tokenSalvo = localStorage.getItem('auth_token');
const userSalvo = localStorage.getItem('user_data');

console.log('🔍 Verificação:');
console.log('Token:', tokenSalvo ? '✅ Presente' : '❌ Ausente');
console.log('User Data:', userSalvo ? '✅ Presente' : '❌ Ausente');

// Função para limpar (se necessário)
window.limparTokenTeste = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  console.log('🗑️ Token e dados removidos');
};

console.log('💡 Para limpar os dados de teste, execute: limparTokenTeste()');
