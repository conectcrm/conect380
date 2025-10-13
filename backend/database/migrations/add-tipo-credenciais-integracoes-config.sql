-- Migration: Adicionar campos tipo, ativo, credenciais e webhook_secret na tabela atendimento_integracoes_config
-- Descrição: Migra a estrutura antiga (colunas individuais) para estrutura flexível (JSONB)
-- Data: 2025-10-11

-- 1. Adicionar novas colunas
ALTER TABLE atendimento_integracoes_config 
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS credenciais JSONB,
  ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255),
  ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW();

-- 2. Migrar dados existentes para JSONB (se houver)
UPDATE atendimento_integracoes_config
SET 
  credenciais = jsonb_build_object(
    'openai_api_key', openai_api_key,
    'openai_model', COALESCE(openai_model, 'gpt-4o-mini'),
    'anthropic_api_key', anthropic_api_key,
    'anthropic_model', COALESCE(anthropic_model, 'claude-3-5-sonnet-20241022'),
    'ia_provider', COALESCE(ia_provider, 'openai'),
    'ia_respostas_automaticas', COALESCE(ia_respostas_automaticas, false)
  ),
  tipo = CASE 
    WHEN openai_api_key IS NOT NULL THEN 'openai'
    WHEN anthropic_api_key IS NOT NULL THEN 'anthropic'
    ELSE 'openai'
  END,
  ativo = COALESCE(ia_respostas_automaticas, false)
WHERE credenciais IS NULL;

-- 3. Renomear colunas de timestamp se necessário
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'atendimento_integracoes_config' AND column_name = 'criado_em') THEN
    ALTER TABLE atendimento_integracoes_config RENAME COLUMN created_at TO criado_em;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'atendimento_integracoes_config' AND column_name = 'atualizado_em') THEN
    ALTER TABLE atendimento_integracoes_config RENAME COLUMN updated_at TO atualizado_em;
  END IF;
END $$;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_integracoes_config_empresa_tipo 
  ON atendimento_integracoes_config(empresa_id, tipo);

CREATE INDEX IF NOT EXISTS idx_integracoes_config_ativo 
  ON atendimento_integracoes_config(ativo);

-- 5. Comentários
COMMENT ON COLUMN atendimento_integracoes_config.tipo IS 'Tipo de integração: openai, anthropic, whatsapp, etc';
COMMENT ON COLUMN atendimento_integracoes_config.credenciais IS 'Credenciais e configurações em formato JSONB flexível';
COMMENT ON COLUMN atendimento_integracoes_config.ativo IS 'Se a integração está ativa ou não';
COMMENT ON COLUMN atendimento_integracoes_config.webhook_secret IS 'Secret para validação de webhooks';

-- Verificação
SELECT 
  COUNT(*) as total_registros,
  COUNT(DISTINCT tipo) as tipos_diferentes,
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos
FROM atendimento_integracoes_config;
