const bcrypt = require('bcryptjs');

// Script para debug da validação de usuário
async function debugValidateUser() {
  console.log('🔍 Debugando validação de usuário...\n');

  const email = 'admin@conectcrm.com';
  const password = 'password';

  // 1. Simular findByEmail
  console.log('1. Verificando se usuário existe...');
  console.log(`   Email: ${email}`);

  // 2. Hash da senha para comparação
  console.log('\n2. Verificando hash da senha...');
  const storedHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  console.log(`   Senha fornecida: ${password}`);
  console.log(`   Hash armazenado: ${storedHash}`);

  // 3. Testar bcrypt.compare
  console.log('\n3. Testando bcrypt.compare...');
  try {
    const isValid = await bcrypt.compare(password, storedHash);
    console.log(`   Resultado: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);

    if (isValid) {
      console.log('\n✅ Senha está correta!');
      console.log('❓ Possíveis causas do erro 401:');
      console.log('   - User.ativo pode estar false');
      console.log('   - Request body não está sendo parseado corretamente');
      console.log('   - Campo email/senha com nome diferente no request');
    } else {
      console.log('\n❌ Senha incorreta!');
    }
  } catch (error) {
    console.log(`   Erro: ${error.message}`);
  }

  // 4. Testar diferentes variações da senha
  console.log('\n4. Testando variações da senha...');
  const variations = ['password', 'Password', 'PASSWORD', '123456', 'admin'];

  for (const variation of variations) {
    try {
      const isValid = await bcrypt.compare(variation, storedHash);
      console.log(`   "${variation}": ${isValid ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   "${variation}": Error - ${error.message}`);
    }
  }
}

debugValidateUser().catch(console.error);
