const bcrypt = require('bcryptjs');

async function testLogin() {
  console.log('=== TESTE DE LOGIN ===\n');
  
  // Simular os dados que estão no banco
  const userFromDB = {
    email: 'admin@conectcrm.com',
    senha: '$2a$10$YGemSeUSyvVkY8Z5KHIEAeDSR63zA0hZpQM4nHcESNNrQalMQLz1K',
    ativo: true
  };
  
  const inputPassword = 'password123';
  
  console.log('Email do banco:', userFromDB.email);
  console.log('Hash do banco:', userFromDB.senha);
  console.log('Senha digitada:', inputPassword);
  console.log('Usuário ativo:', userFromDB.ativo);
  
  // Testar bcrypt.compare
  const isValid = await bcrypt.compare(inputPassword, userFromDB.senha);
  console.log('\nResultado bcrypt.compare:', isValid);
  
  // Simular a lógica do AuthService
  if (userFromDB && isValid) {
    if (!userFromDB.ativo) {
      console.log('ERRO: Usuário inativo');
      return null;
    }
    console.log('SUCCESS: Login seria bem-sucedido');
    return { email: userFromDB.email };
  } else {
    console.log('ERRO: Credenciais inválidas');
    return null;
  }
}

testLogin().catch(console.error);
