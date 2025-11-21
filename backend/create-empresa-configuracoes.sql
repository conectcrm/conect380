-- Criar enums
CREATE TYPE empresa_configuracoes_senha_complexidade_enum AS ENUM('baixa', 'media', 'alta');
CREATE TYPE empresa_configuracoes_backup_frequencia_enum AS ENUM('diario', 'semanal', 'mensal');

-- Criar tabela empresa_configuracoes
CREATE TABLE empresa_configuracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  -- Geral
  descricao VARCHAR,
  site VARCHAR,
  logo_url VARCHAR,
  cor_primaria VARCHAR NOT NULL DEFAULT '#159A9C',
  cor_secundaria VARCHAR NOT NULL DEFAULT '#002333',
  
  -- Segurança
  autenticacao_2fa BOOLEAN NOT NULL DEFAULT false,
  sessao_expiracao_minutos INTEGER NOT NULL DEFAULT 30,
  senha_complexidade empresa_configuracoes_senha_complexidade_enum NOT NULL DEFAULT 'media',
  auditoria BOOLEAN NOT NULL DEFAULT true,
  
  -- Usuários
  limite_usuarios INTEGER NOT NULL DEFAULT 10,
  aprovacao_novo_usuario BOOLEAN NOT NULL DEFAULT false,
  
  -- Notificações
  emails_habilitados BOOLEAN NOT NULL DEFAULT true,
  servidor_smtp VARCHAR,
  porta_smtp INTEGER NOT NULL DEFAULT 587,
  smtp_usuario VARCHAR,
  smtp_senha VARCHAR,
  
  -- Integrações
  api_habilitada BOOLEAN NOT NULL DEFAULT false,
  webhooks_ativos INTEGER NOT NULL DEFAULT 0,
  
  -- Backup
  backup_automatico BOOLEAN NOT NULL DEFAULT true,
  backup_frequencia empresa_configuracoes_backup_frequencia_enum NOT NULL DEFAULT 'diario',
  backup_retencao_dias INTEGER NOT NULL DEFAULT 30,
  
  -- Auditoria
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice
CREATE INDEX idx_empresa_configuracoes_empresa_id ON empresa_configuracoes(empresa_id);

-- Inserir registro  de auditoria na tabela migrations
INSERT INTO migrations(timestamp, name) VALUES (1762201500000, 'CreateEmpresaConfiguracoes1762201500000');
