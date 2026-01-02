-- ========================================
-- FASE 2: Gestão de Módulos e Histórico de Planos
-- ========================================

-- Criar tabela modulos_empresas
CREATE TABLE IF NOT EXISTS modulos_empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  modulo VARCHAR(50) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  limites JSONB,
  uso_atual JSONB,
  configuracoes JSONB,
  data_ativacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_desativacao TIMESTAMP,
  ultima_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN modulos_empresas.modulo IS 'Nome do módulo: crm, atendimento, comercial, etc.';
COMMENT ON COLUMN modulos_empresas.ativo IS 'Se o módulo está ativo para esta empresa';
COMMENT ON COLUMN modulos_empresas.limites IS 'Limites de uso: usuarios, leads, storage_mb, api_calls_dia, etc.';
COMMENT ON COLUMN modulos_empresas.uso_atual IS 'Uso atual dos recursos';
COMMENT ON COLUMN modulos_empresas.configuracoes IS 'Configurações específicas do módulo';

-- Criar índices para modulos_empresas
CREATE INDEX IF NOT EXISTS idx_modulos_empresas_empresa_id ON modulos_empresas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_modulos_empresas_modulo ON modulos_empresas(modulo);
CREATE INDEX IF NOT EXISTS idx_modulos_empresas_ativo ON modulos_empresas(ativo);

-- Criar tabela historico_planos
CREATE TABLE IF NOT EXISTS historico_planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plano_anterior VARCHAR(50) NOT NULL,
  plano_novo VARCHAR(50) NOT NULL,
  valor_anterior NUMERIC(10,2) NOT NULL,
  valor_novo NUMERIC(10,2) NOT NULL,
  motivo TEXT,
  alterado_por UUID,
  data_alteracao TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN historico_planos.motivo IS 'Motivo da mudança de plano';
COMMENT ON COLUMN historico_planos.alterado_por IS 'ID do admin que fez a alteração';

-- Criar índices para historico_planos
CREATE INDEX IF NOT EXISTS idx_historico_planos_empresa_id ON historico_planos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_historico_planos_data_alteracao ON historico_planos(data_alteracao DESC);

-- Inserir registro na tabela migrations
INSERT INTO migrations (timestamp, name)
VALUES (1763912822411, 'CreateModulosEmpresasAndHistoricoPlanos1763912822411')
ON CONFLICT DO NOTHING;

SELECT 'Tabelas modulos_empresas e historico_planos criadas com sucesso!' AS resultado;
