import * as bcrypt from 'bcrypt';

async function gerarHash() {
  const senha = 'admin123';
  const hash = await bcrypt.hash(senha, 10);
  console.log(`\n🔐 Senha: ${senha}`);
  console.log(`🔑 Hash: ${hash}`);
  console.log(`\n📝 SQL para atualizar:`);
  console.log(`UPDATE users SET senha = '${hash}' WHERE email = 'admin.quick@teste.com';`);
}

gerarHash();
