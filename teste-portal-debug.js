const portalUrl = 'http://localhost:3900/portal/proposta/PROP-001';
const apiUrl = 'http://localhost:3001/api/portal/proposta/PROP-001';

console.log('📋 Teste de Links do Portal');
console.log('='.repeat(50));
console.log(`Frontend URL: ${portalUrl}`);
console.log(`API URL: ${apiUrl}`);
console.log('='.repeat(50));

console.log('\n🧪 Para testar no navegador:');
console.log('1. Abra o Console do navegador (F12)');
console.log('2. Cole este código:');
console.log(`
fetch('${apiUrl}')
  .then(response => {
    console.log('Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Dados:', data);
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });
`);

console.log('\n🔍 Problema identificado:');
console.log('- Backend API: ✅ Funcionando');
console.log('- CORS: ✅ Configurado');
console.log('- Frontend: ❓ Pode ter problema na rota ou componente');

console.log('\n🎯 Próximos passos:');
console.log('1. Verificar se o componente está recebendo parâmetros');
console.log('2. Verificar logs do browser console');
console.log('3. Verificar se a rota está matchando corretamente');
