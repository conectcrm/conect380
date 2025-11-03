-- =====================================================
-- MIGRATION RLS - EXECUÇÃO DIRETA NO POSTGRESQL
-- =====================================================

\echo '🔒 Iniciando habilitação de Row Level Security...'

-- 1. Criar funções
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

\echo '✅ Função set_current_tenant criada'

CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS uuid AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true)::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

\echo '✅ Função get_current_tenant criada'

-- 2. Habilitar RLS e criar políticas

-- clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_clientes ON clientes;
CREATE POLICY tenant_isolation_clientes ON clientes FOR ALL USING (empresa_id = get_current_tenant());
\echo '✅ RLS em clientes'

-- atendentes (usa "empresaId" com aspas)
ALTER TABLE atendentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendentes ON atendentes;
CREATE POLICY tenant_isolation_atendentes ON atendentes FOR ALL USING ("empresaId" = get_current_tenant());
\echo '✅ RLS em atendentes'

-- equipes
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_equipes ON equipes;
CREATE POLICY tenant_isolation_equipes ON equipes FOR ALL USING (empresa_id = get_current_tenant());
\echo '✅ RLS em equipes'

-- departamentos
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_departamentos ON departamentos;
CREATE POLICY tenant_isolation_departamentos ON departamentos FOR ALL USING (empresa_id = get_current_tenant());
\echo '✅ RLS em departamentos'

-- fluxos_triagem
ALTER TABLE fluxos_triagem ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_fluxos_triagem ON fluxos_triagem;
CREATE POLICY tenant_isolation_fluxos_triagem ON fluxos_triagem FOR ALL USING (empresa_id = get_current_tenant());
\echo '✅ RLS em fluxos_triagem'

-- sessoes_triagem
ALTER TABLE sessoes_triagem ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_sessoes_triagem ON sessoes_triagem;
CREATE POLICY tenant_isolation_sessoes_triagem ON sessoes_triagem FOR ALL USING (empresa_id = get_current_tenant());
\echo '✅ RLS em sessoes_triagem'

-- demandas
ALTER TABLE demandas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_demandas ON demandas;
CREATE POLICY tenant_isolation_demandas ON demandas FOR ALL USING (empresa_id = get_current_tenant());
\echo '✅ RLS em demandas'

-- fornecedores
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_fornecedores ON fornecedores;
CREATE POLICY tenant_isolation_fornecedores ON fornecedores FOR ALL USING (empresa_id = get_current_tenant());
\echo '✅ RLS em fornecedores'

-- contas_pagar
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_contas_pagar ON contas_pagar;
CREATE POLICY tenant_isolation_contas_pagar ON contas_pagar FOR ALL USING (empresa_id::uuid = get_current_tenant());
\echo '✅ RLS em contas_pagar'

-- canais_simples
ALTER TABLE canais_simples ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_canais_simples ON canais_simples;
CREATE POLICY tenant_isolation_canais_simples ON canais_simples FOR ALL USING ("empresaId" = get_current_tenant());
\echo '✅ RLS em canais_simples'

-- nucleos_atendimento
ALTER TABLE nucleos_atendimento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_nucleos_atendimento ON nucleos_atendimento;
CREATE POLICY tenant_isolation_nucleos_atendimento ON nucleos_atendimento FOR ALL USING (empresa_id = get_current_tenant());
\echo '✅ RLS em nucleos_atendimento'

-- triagem_logs
ALTER TABLE triagem_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_triagem_logs ON triagem_logs;
CREATE POLICY tenant_isolation_triagem_logs ON triagem_logs FOR ALL USING (empresa_id = get_current_tenant());
\echo '✅ RLS em triagem_logs'

-- user_activities
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_user_activities ON user_activities;
CREATE POLICY tenant_isolation_user_activities ON user_activities FOR ALL USING (empresa_id::uuid = get_current_tenant());
\echo '✅ RLS em user_activities'

-- atendimento_tickets
ALTER TABLE atendimento_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendimento_tickets ON atendimento_tickets;
CREATE POLICY tenant_isolation_atendimento_tickets ON atendimento_tickets FOR ALL USING (empresa_id = get_current_tenant());
\echo '✅ RLS em atendimento_tickets'

-- empresas (sem filtro, mas com RLS habilitado)
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_empresas ON empresas;
CREATE POLICY tenant_isolation_empresas ON empresas FOR ALL USING (id = get_current_tenant());
\echo '✅ RLS em empresas'

-- 3. Criar tabela audit_logs SE não existir
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  tabela VARCHAR(255) NOT NULL,
  acao VARCHAR(50) NOT NULL,
  usuario_id UUID,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  detalhes JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_empresa ON audit_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_audit_logs ON audit_logs;
CREATE POLICY tenant_isolation_audit_logs ON audit_logs FOR ALL USING (empresa_id = get_current_tenant());
\echo '✅ RLS em audit_logs'

\echo '🎉 Row Level Security habilitado com sucesso!'
\echo '📊 Total: 15 tabelas protegidas'
