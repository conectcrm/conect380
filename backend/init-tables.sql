-- Criar tabela empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  endereco VARCHAR(255),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  subdominio VARCHAR(100) UNIQUE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  plano VARCHAR(50) DEFAULT 'starter',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user',
  empresa_id UUID REFERENCES empresas(id),
  ativo BOOLEAN DEFAULT true,
  deve_trocar_senha BOOLEAN DEFAULT false,
  ultimo_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir empresa de teste
INSERT INTO empresas (nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, subdominio)
VALUES ('Empresa Teste', 'empresa-teste', '00.000.000/0000-00', 'empresa@teste.com', '11999999999', 'Rua Teste 123', 'São Paulo', 'SP', '01234-567', 'teste')
ON CONFLICT (cnpj) DO NOTHING
RETURNING id;

-- Inserir usuário admin (senha: admin123)
INSERT INTO users (nome, email, senha, role, empresa_id, ativo)
SELECT 'Admin', 'admin@teste.com', '$2a$10$dXzCVQ.0mjgUHsiwYkmhBu3O1vxV1iOPyEecMFqn4TLg0p8qVnT7q', 'admin', id, true
FROM empresas WHERE cnpj = '00.000.000/0000-00'
ON CONFLICT (email) DO NOTHING;

SELECT 'Tabelas e dados iniciais criados com sucesso!' as resultado;
