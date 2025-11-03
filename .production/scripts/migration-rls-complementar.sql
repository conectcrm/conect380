-- ============================================
-- RLS Complementar - Tabelas Restantes
-- ============================================
-- Adiciona Row-Level Security nas tabelas que ainda não têm
-- Data: 2025-11-02
-- Sprint 1 - Multi-Tenancy
-- ============================================

-- Tabela: users
-- Política: Cada empresa só vê seus próprios usuários
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (empresa_id = get_current_tenant());

COMMENT ON POLICY tenant_isolation_users ON users IS 
  'RLS: Isola usuários por empresa (tenant isolation)';

-- Tabela: atendimento_demandas
-- Política: Cada empresa só vê suas próprias demandas
ALTER TABLE atendimento_demandas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_atendimento_demandas ON atendimento_demandas;
CREATE POLICY tenant_isolation_atendimento_demandas ON atendimento_demandas
  FOR ALL
  USING (empresa_id = get_current_tenant());

COMMENT ON POLICY tenant_isolation_atendimento_demandas ON atendimento_demandas IS 
  'RLS: Isola demandas de atendimento por empresa';

-- ============================================
-- Verificação
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  'RLS ATIVO' as status
FROM pg_policies
WHERE tablename IN ('users', 'atendimento_demandas')
ORDER BY tablename;

-- Total de políticas RLS
SELECT COUNT(*) as total_policies_rls FROM pg_policies WHERE schemaname = 'public';
