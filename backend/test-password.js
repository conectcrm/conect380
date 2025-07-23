const bcrypt = require('bcryptjs');

async function generatePasswords() {
  const passwords = {
    admin: 'password123',
    gerente: 'password456', 
    vendedor: 'password789'
  };
  
  console.log('Gerando hashes das senhas...\n');
  
  for (const [user, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${user}: ${password} -> ${hash}`);
  }
}

generatePasswords().catch(console.error);
