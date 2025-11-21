-- Atualizar senhas dos usuários de teste
-- Hash bcrypt para senha: senha123

UPDATE users 
SET senha = '$2a$10$ebhH4wSc6/cwaYAq.AwRkeOTTgeN.IUN0EEtczkeVNFWyEx2xvV6y'
WHERE email IN ('admin@empresa1.com', 'admin@empresa2.com');

-- Verificar atualização
SELECT 
  email, 
  length(senha) as tamanho_hash,
  substring(senha, 1, 10) as inicio_hash
FROM users 
WHERE email IN ('admin@empresa1.com', 'admin@empresa2.com');
