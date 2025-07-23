const bcrypt = require('bcryptjs');

async function debugLogin() {
  console.log('=== DEBUG LOGIN COMPLETO ===\n');
  
  // Dados exatos do banco
  const hashFromDB = '$2a$10$YGemSeUSyvVkY8Z5KHIEAeDSR63zA0hZpQM4nHcESNNrQalMQLz1K';
  const password = 'password123';
  
  console.log('1. Testando hash do banco:');
  console.log('   Hash:', hashFromDB);
  console.log('   Senha:', password);
  
  const result1 = await bcrypt.compare(password, hashFromDB);
  console.log('   Resultado:', result1);
  
  console.log('\n2. Gerando novo hash para comparar:');
  const newHash = await bcrypt.hash(password, 10);
  console.log('   Novo hash:', newHash);
  
  const result2 = await bcrypt.compare(password, newHash);
  console.log('   Resultado novo hash:', result2);
  
  console.log('\n3. Testando outras senhas possíveis:');
  const testPasswords = ['password123', 'Password123', 'admin123', 'admin', '123456'];
  
  for (const testPass of testPasswords) {
    const testResult = await bcrypt.compare(testPass, hashFromDB);
    console.log(`   ${testPass}: ${testResult}`);
  }
  
  console.log('\n4. Verificando hash character por character:');
  console.log('   Length:', hashFromDB.length);
  console.log('   Starts with $2a$10$:', hashFromDB.startsWith('$2a$10$'));
}

debugLogin().catch(console.error);
