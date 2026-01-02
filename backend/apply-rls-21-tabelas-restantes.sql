-- =========================================================
-- FASE 2B: APLICAR RLS NAS 21 TABELAS RESTANTES
-- Data: 01/01/2026
-- CRÍTICO: Sistema ainda tem 21 tabelas desprotegidas!
-- =========================================================

-- 1. user_activities (empresa_id)
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_user_activities ON user_activities;
CREATE POLICY tenant_isolation_user_activities ON user_activities
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_user_activities_empresa_id ON user_activities(empresa_id);

-- 2. canais (empresaId)
ALTER TABLE canais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_canais ON canais;
CREATE POLICY tenant_isolation_canais ON canais
  FOR ALL USING ("empresaId" = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_canais_empresa_id ON canais("empresaId");

-- 3. niveis_atendimento (empresa_id)
ALTER TABLE niveis_atendimento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_niveis_atendimento ON niveis_atendimento;
CREATE POLICY tenant_isolation_niveis_atendimento ON niveis_atendimento
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_niveis_atendimento_empresa_id ON niveis_atendimento(empresa_id);

-- 4. atendimento_tags (empresa_id)
ALTER TABLE atendimento_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendimento_tags ON atendimento_tags;
CREATE POLICY tenant_isolation_atendimento_tags ON atendimento_tags
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_atendimento_tags_empresa_id ON atendimento_tags(empresa_id);

-- 5. atendimento_redmine_integrations (empresa_id)
ALTER TABLE atendimento_redmine_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendimento_redmine_integrations ON atendimento_redmine_integrations;
CREATE POLICY tenant_isolation_atendimento_redmine_integrations ON atendimento_redmine_integrations
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_atendimento_redmine_integrations_empresa_id ON atendimento_redmine_integrations(empresa_id);

-- 6. contas_pagar (empresa_id)
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_contas_pagar ON contas_pagar;
CREATE POLICY tenant_isolation_contas_pagar ON contas_pagar
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_contas_pagar_empresa_id ON contas_pagar(empresa_id);

-- 7. templates_mensagem_triagem (empresa_id)
ALTER TABLE templates_mensagem_triagem ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_templates_mensagem_triagem ON templates_mensagem_triagem;
CREATE POLICY tenant_isolation_templates_mensagem_triagem ON templates_mensagem_triagem
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_templates_mensagem_triagem_empresa_id ON templates_mensagem_triagem(empresa_id);

-- 8. status_customizados (empresa_id)
ALTER TABLE status_customizados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_status_customizados ON status_customizados;
CREATE POLICY tenant_isolation_status_customizados ON status_customizados
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_status_customizados_empresa_id ON status_customizados(empresa_id);

-- 9. sla_event_logs (empresaId)
ALTER TABLE sla_event_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_sla_event_logs ON sla_event_logs;
CREATE POLICY tenant_isolation_sla_event_logs ON sla_event_logs
  FOR ALL USING ("empresaId" = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_sla_event_logs_empresa_id ON sla_event_logs("empresaId");

-- 10. equipes (empresa_id)
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_equipes ON equipes;
CREATE POLICY tenant_isolation_equipes ON equipes
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_equipes_empresa_id ON equipes(empresa_id);

-- 11. atendimento_ai_insights (empresa_id)
ALTER TABLE atendimento_ai_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendimento_ai_insights ON atendimento_ai_insights;
CREATE POLICY tenant_isolation_atendimento_ai_insights ON atendimento_ai_insights
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_atendimento_ai_insights_empresa_id ON atendimento_ai_insights(empresa_id);

-- 12. tipos_servico (empresa_id)
ALTER TABLE tipos_servico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_tipos_servico ON tipos_servico;
CREATE POLICY tenant_isolation_tipos_servico ON tipos_servico
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_tipos_servico_empresa_id ON tipos_servico(empresa_id);

-- 13. atendimento_ai_metricas (empresa_id)
ALTER TABLE atendimento_ai_metricas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendimento_ai_metricas ON atendimento_ai_metricas;
CREATE POLICY tenant_isolation_atendimento_ai_metricas ON atendimento_ai_metricas
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_atendimento_ai_metricas_empresa_id ON atendimento_ai_metricas(empresa_id);

-- 14. atendimento_base_conhecimento (empresa_id)
ALTER TABLE atendimento_base_conhecimento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendimento_base_conhecimento ON atendimento_base_conhecimento;
CREATE POLICY tenant_isolation_atendimento_base_conhecimento ON atendimento_base_conhecimento
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_atendimento_base_conhecimento_empresa_id ON atendimento_base_conhecimento(empresa_id);

-- 15. evento (empresaId)
ALTER TABLE evento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_evento ON evento;
CREATE POLICY tenant_isolation_evento ON evento
  FOR ALL USING ("empresaId" = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_evento_empresa_id ON evento("empresaId");

-- 16. users (empresa_id)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_users_empresa_id ON users(empresa_id);

-- 17. atendimento_demandas (empresa_id)
ALTER TABLE atendimento_demandas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendimento_demandas ON atendimento_demandas;
CREATE POLICY tenant_isolation_atendimento_demandas ON atendimento_demandas
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_atendimento_demandas_empresa_id ON atendimento_demandas(empresa_id);

-- 18. metas (empresa_id)
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_metas ON metas;
CREATE POLICY tenant_isolation_metas ON metas
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_metas_empresa_id ON metas(empresa_id);

-- 19. atendimento_filas (empresa_id)
ALTER TABLE atendimento_filas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendimento_filas ON atendimento_filas;
CREATE POLICY tenant_isolation_atendimento_filas ON atendimento_filas
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_atendimento_filas_empresa_id ON atendimento_filas(empresa_id);

-- 20. atendimento_atendentes (empresa_id)
ALTER TABLE atendimento_atendentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendimento_atendentes ON atendimento_atendentes;
CREATE POLICY tenant_isolation_atendimento_atendentes ON atendimento_atendentes
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_atendimento_atendentes_empresa_id ON atendimento_atendentes(empresa_id);

-- 21. assinaturas_empresas (empresa_id)
ALTER TABLE assinaturas_empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_assinaturas_empresas ON assinaturas_empresas;
CREATE POLICY tenant_isolation_assinaturas_empresas ON assinaturas_empresas
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_assinaturas_empresas_empresa_id ON assinaturas_empresas(empresa_id);

-- ═══════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL COMPLETA
-- ═══════════════════════════════════════════════════════════

-- Contar total de tabelas protegidas
SELECT COUNT(*) as total_protegidas
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true
  AND EXISTS (
    SELECT 1 
    FROM information_schema.columns c 
    WHERE c.table_name = pg_tables.tablename 
      AND (c.column_name = 'empresa_id' OR c.column_name = 'empresaId')
  );

-- ⚠️ CRÍTICO: DEVE RETORNAR 0 LINHAS!
SELECT 
  t.tablename,
  'VULNERAVEL!' as status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = false
  AND EXISTS (
    SELECT 1 
    FROM information_schema.columns c 
    WHERE c.table_name = t.tablename 
      AND (c.column_name = 'empresa_id' OR c.column_name = 'empresaId')
  );
