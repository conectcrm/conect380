#!/bin/bash
# Script para inicializar banco de dados PostgreSQL no container

echo "🔄 Executando SQL de inicialização no PostgreSQL..."

docker exec -i conectcrm-postgres-prod psql -U conectcrm -d conectcrm_prod << 'EOF'
-- Criar tabela users (base para outras tabelas)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nome VARCHAR(255),
  "primeiroAcesso" BOOLEAN DEFAULT true,
  "primeiraSenha" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela empresas (referenciada por clientes)
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela clientes (referenciada por muitas outras)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  "empresaId" UUID REFERENCES empresas(id),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela produtos (referenciada por propostas)
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2),
  ativo BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela oportunidades
CREATE TABLE IF NOT EXISTS oportunidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(255) NOT NULL,
  valor DECIMAL(10,2),
  "clienteId" UUID REFERENCES clientes(id),
  "responsavelId" UUID REFERENCES users(id),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela propostas
CREATE TABLE IF NOT EXISTS propostas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero VARCHAR(100) UNIQUE,
  "clienteId" UUID REFERENCES clientes(id),
  "responsavelId" UUID REFERENCES users(id),
  status VARCHAR(50),
  "valorTotal" DECIMAL(10,2),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir usuário admin padrão
INSERT INTO users (id, username, email, password, nome, "primeiroAcesso", "primeiraSenha")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'admin@conectsuite.com.br',
  '\$2b\$10\$rH3qIz8YqXZ5Yn8U.vQjP.tT8OzXK9xJqN3R4Q6H7h/A8L1M2N3O4',
  'Administrador',
  true,
  'Admin@2024'
)
ON CONFLICT (username) DO NOTHING;

SELECT 'Tabelas base e usuário admin criados com sucesso!' as resultado;
EOF

echo ""
echo "✅ Script SQL executado!"
echo ""
echo "🔍 Verificando tabelas criadas:"
docker exec conectcrm-postgres-prod psql -U conectcrm -d conectcrm_prod -c "\dt"

echo ""
echo "👤 Verificando usuário admin:"
docker exec conectcrm-postgres-prod psql -U conectcrm -d conectcrm_prod -c "SELECT username, email, nome FROM users WHERE username='admin';"
